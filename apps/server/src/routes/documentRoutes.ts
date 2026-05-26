import {
  demoBook,
  demoEpub,
  demoPdf,
  type Bookmark,
  type BookRecord,
  type DocumentSummary,
  type Highlight,
  type Note,
  type ReadingProgress,
} from '@dushu/shared';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR } from '..';
import { BookProcessorService } from '../services/bookProcessor';

export const documentRouter = Router();

const bookProcessor = new BookProcessorService(UPLOAD_DIR);

const books = new Map<string, BookRecord>([[demoBook.id, demoBook]]);

const renditionByBookId: Record<string, unknown> = { [demoBook.id]: demoBook.kind === 'epub' ? demoEpub : demoPdf };

export const addBook = (book: BookRecord) => {
  books.set(book.id, book);
};

export const checkBookExist = (title: string): boolean => [...books.values()].some((b) => b.title.toLowerCase() === title.toLowerCase());

const toDocumentSummary = (book: BookRecord): DocumentSummary => ({
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

documentRouter.get('/health', (_req, res) => res.json({ ok: true, services: 'dushu-server', scope: 'document' }));

documentRouter.get('/demo/seed', (_req, res) => res.json({ book: demoBook, epub: demoEpub, pdf: demoPdf }));

documentRouter.get('/', (_req, res) => {
  const documents = [...books.values()].map(toDocumentSummary);
  res.json({ documents, total: documents.length });
});

documentRouter.get('/:id', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ document: book }),
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.delete('/:id', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      books.delete(book.id);
      delete renditionByBookId[book.id];
      bookProcessor.deleteBookFiles(book.id);
      res.status(204).send();
    },
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.get('/:id/rendition', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const rendition = renditionByBookId[book.id];
      if (!rendition) {
        res.status(404).json({ error: `Rendition for book ${book.id} not found` });
        return;
      }
      res.json({ documentId: book.id, kind: book.kind, rendition });
    },
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.get('/:id/progress', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ progress: book.progress ?? null }),
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.put('/:id/progress', (req, res) => {
  withBook(
    req.params.id,
    (book) => {
      const progress = req.body as ReadingProgress;
      if (!progress?.locator || typeof progress.overallProgression !== 'number') {
        res.status(400).json({ error: 'Invalid progress data' });
        return;
      }
      book.progress = { ...progress, updatedAt: progress.updatedAt ?? new Date().toISOString() };
      book.lastOpenedAt = new Date().toISOString();
      books.set(book.id, book);
      res.json({ progress: book.progress });
    },
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.get('/:id/bookmarks', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ bookmarks: book.bookmarks }),
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.post('/:id/bookmarks', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.delete('/:id/bookmarks/:bookmarkId', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.get('/:id/highlights', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ highlights: book.highlights }),
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.post('/:id/highlights', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.delete('/:id/highlights/:highlightId', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.get('/:id/notes', (req, res) => {
  withBook(
    req.params.id,
    (book) => res.json({ notes: book.notes }),
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.post('/:id/notes', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.patch('/:id/notes/:noteId', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});

documentRouter.delete('/:id/notes/:noteId', (req, res) => {
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
    () => res.status(404).json({ error: `Document ${req.params.id} not found` }),
  );
});
