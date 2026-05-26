import {
  demoBook,
  demoEpub,
  demoPdf,
  type Bookmark,
  type BookRecord,
  type BookSummary,
  type Highlight,
  type Note,
  type ReadingProgress,
  type RenditionDescriptor,
  type UpdateBookPayload,
} from '@dushu/shared';
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR } from '../config';
import { BookProcessorService } from '../services/bookProcessor';

export const bookRouter = Router();

const bookProcessor = new BookProcessorService(UPLOAD_DIR);

const books = new Map<string, BookRecord>([[demoBook.id, demoBook]]);

const renditionByBookId: Record<string, RenditionDescriptor> = { [demoBook.id]: demoBook.kind === 'epub' ? demoEpub : demoPdf };

export const addBook = (book: BookRecord) => {
  books.set(book.id, book);
};

export const setBookRendition = (bookId: string, rendition: RenditionDescriptor) => {
  renditionByBookId[bookId] = rendition;
};

export const checkBookExist = (title: string): boolean => [...books.values()].some((b) => b.title.toLowerCase() === title.toLowerCase());

const toBookSummary = (book: BookRecord): BookSummary => ({
  id: book.id,
  title: book.title,
  author: book.author,
  kind: book.kind,
  language: book.language,
  coverUrl: book.coverUrl,
  progress: book.progress,
  bookmarksCount: book.bookmarks.length,
  highlightsCount: book.highlights.length,
  notesCount: book.notes.length,
  lastOpenedAt: book.lastOpenedAt,
});

const randomId = (prefix: string) => `${prefix}-${uuidv4()}`;

const withBook = (bookId: string, onFound: (book: BookRecord) => void, onNotFound: () => void) => {
  const book = books.get(bookId);
  if (!book) {
    onNotFound();
    return;
  }
  onFound(book);
};

bookRouter.get('/health', (_req, res) => res.json({ ok: true, services: 'dushu-server', scope: 'book' }));

bookRouter.get('/demo/seed', (_req, res) => res.json({ book: demoBook, epub: demoEpub, pdf: demoPdf }));

bookRouter.get('/', (_req, res) => {
  const summaries = [...books.values()].map(toBookSummary);
  res.json({ books: summaries, total: summaries.length });
});

bookRouter.get('/:id', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ book: toBookSummary(book) }),
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.patch('/:id', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const { title, author, cover } = req.body as UpdateBookPayload;
      if (title) book.title = title;
      if (author !== undefined) book.author = author || undefined;
      if (cover !== undefined) {
        // Remove old cover file
        const dir = fs.readdirSync(UPLOAD_DIR);
        for (const file of dir) {
          if (file.startsWith(`${book.id}_cover.`)) {
            fs.unlinkSync(path.join(UPLOAD_DIR, file));
          }
        }

        if (cover === '') {
          // Remove cover
          book.coverUrl = undefined;
        } else {
          const match = cover.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!match) {
            res.status(400).json({ error: 'Invalid cover format' });
            return;
          }
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const coverFilename = `${book.id}_cover.${ext}`;
          fs.writeFileSync(path.join(UPLOAD_DIR, coverFilename), buffer);
          book.coverUrl = `/api/uploads/${coverFilename}`;
        }
      }
      book.updatedAt = new Date().toISOString();
      books.set(book.id, book);
      res.json({ book: toBookSummary(book) });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.delete('/:id', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      books.delete(book.id);
      delete renditionByBookId[book.id];
      bookProcessor.deleteBookFiles(book.id);
      res.status(204).send();
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.get('/:id/rendition', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const rendition = renditionByBookId[book.id];
      if (!rendition) {
        res.status(404).json({ error: `Rendition for book ${book.id} not found` });
        return;
      }
      res.json({ bookId: book.id, kind: book.kind, rendition });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.get('/:id/chapters/:index', async (req, res) => {
  console.log(`bookRouter.get('/:id/chapters/:index' :`, req.params);
  const book = books.get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: `Book ${req.params.id} not found` });
  }

  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0) {
    return res.status(400).json({ error: `Invalid chapter index ${req.params.index}` });
  }

  const filePath = path.join(UPLOAD_DIR, `${book.id}.${book.kind}`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Book file not found' });
  }

  try {
    const html = await bookProcessor.getChapterHtml(filePath, index);
    if (!html) {
      return res.status(404).json({ error: `Chapter ${index} not found` });
    }
    return res.json({ bookId: book.id, chapterIndex: index, html });
  } catch {
    if (!res.headersSent) {
      return res.status(500).json({ error: `Failed to read chapter ${req.params.index} for book ${req.params.id}:` });
    }
  }
});

bookRouter.get('/:id/resources/{*resourcePath}', async (req, res) => {
  const resourcePath = req.params.resourcePath;
  console.log(`📁 Resource request: [${req.params.id}] ${resourcePath}`);

  const book = books.get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: `Book ${req.params.id} not found` });
  }

  if (!resourcePath) {
    return res.status(400).json({ error: 'Resource path required' });
  }

  const filePath = path.join(UPLOAD_DIR, `${book.id}.${book.kind}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Book file not found' });
  }

  try {
    const result = await bookProcessor.getEpubResource(filePath, '' + resourcePath);
    if (!result) {
      return res.status(404).json({ error: `Resource ${resourcePath} not found` });
    }
    const [buffer, mimeType] = result;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error(`❌ Failed to read resource ${resourcePath} for book ${req.params.id}:`, error);
    if (!res.headersSent) {
      return res.status(500).json({ error: `Failed to read resource ${req.params.resourcePath} for book ${req.params.id}:` });
    }
  }
});

bookRouter.get('/:id/progress', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ progress: book.progress ?? null }),
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.put('/:id/progress', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const progress = req.body as ReadingProgress;
      if (!progress?.locator) {
        res.status(400).json({ error: 'Invalid progress data' });
        return;
      }
      book.progress = { ...progress, updatedAt: progress.updatedAt ?? new Date().toISOString() };
      book.lastOpenedAt = new Date().toISOString();
      books.set(book.id, book);
      res.json({ progress: book.progress });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.get('/:id/bookmarks', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ bookmarks: book.bookmarks }),
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.post('/:id/bookmarks', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const payload = req.body as Partial<Bookmark>;
      if (!payload.label || !payload.locator) {
        res.status(400).json({ error: 'Bookmark requires label and locator' });
        return;
      }
      const bookmark: Bookmark = {
        id: randomId('bookmark'),
        label: payload.label,
        locator: payload.locator,
        createdAt: new Date().toISOString(),
      };
      book.bookmarks.push(bookmark);
      books.set(book.id, book);
      res.status(201).json({ bookmark });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.delete('/:id/bookmarks/:bookmarkId', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const before = book.bookmarks.length;
      book.bookmarks = book.bookmarks.filter((b) => b.id !== req.params.bookmarkId);
      books.set(book.id, book);
      if (book.bookmarks.length === before) {
        res.status(404).json({ error: `Bookmark ${req.params.bookmarkId} not found` });
        return;
      }
      res.status(204).send();
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.get('/:id/highlights', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ highlights: book.highlights }),
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.post('/:id/highlights', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const payload = req.body as Partial<Highlight>;
      if (!payload.locator || typeof payload.startOffset !== 'number' || typeof payload.endOffset !== 'number') {
        res.status(400).json({ error: 'Highlight requires locator, startOffset and endOffset' });
        return;
      }
      const highlight: Highlight = {
        id: randomId('highlight'),
        locator: payload.locator,
        startOffset: payload.startOffset,
        endOffset: payload.endOffset,
        quote: payload.quote,
        color: payload.color ?? 'yellow',
        note: payload.note,
        createdAt: new Date().toISOString(),
      };
      book.highlights.push(highlight);
      books.set(book.id, book);
      res.status(201).json({ highlight });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.delete('/:id/highlights/:highlightId', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const before = book.highlights.length;
      book.highlights = book.highlights.filter((h) => h.id !== req.params.highlightId);
      books.set(book.id, book);
      if (book.highlights.length === before) {
        res.status(404).json({ error: `Highlight ${req.params.highlightId} not found` });
        return;
      }
      res.status(204).send();
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.get('/:id/notes', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ notes: book.notes }),
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.post('/:id/notes', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const payload = req.body as Partial<Note>;
      if (!payload.locator || !payload.content) {
        res.status(400).json({ error: 'Note requires locator and content' });
        return;
      }
      const now = new Date().toISOString();
      const note: Note = {
        id: randomId('note'),
        locator: payload.locator,
        content: payload.content,
        createdAt: now,
        updatedAt: now,
      };
      book.notes.push(note);
      books.set(book.id, book);
      res.status(201).json({ note });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.patch('/:id/notes/:noteId', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const payload = req.body as Partial<Pick<Note, 'content'>>;
      if (!payload.content) {
        res.status(400).json({ error: 'Note update requires content' });
        return;
      }
      const note = book.notes.find((n) => n.id === req.params.noteId);
      if (!note) {
        res.status(404).json({ error: `Note ${req.params.noteId} not found` });
        return;
      }
      note.content = payload.content;
      note.updatedAt = new Date().toISOString();
      books.set(book.id, book);
      res.json({ note });
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});

bookRouter.delete('/:id/notes/:noteId', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const before = book.notes.length;
      book.notes = book.notes.filter((n) => n.id !== req.params.noteId);
      books.set(book.id, book);
      if (book.notes.length === before) {
        res.status(404).json({ error: `Note ${req.params.noteId} not found` });
        return;
      }
      res.status(204).send();
    },
    () => res.status(404).json({ error: `Book ${req.params.id} not found` }),
  );
});
