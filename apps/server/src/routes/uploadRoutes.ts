import { getBookKindFromFilename } from '@dushu/shared';
import { FileStore } from '@tus/file-store';
import { Server } from '@tus/server';
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from '../config';
import { BookProcessorService } from '../services/bookProcessor';
import { addBook, checkBookExist, setBookRendition } from './bookRoutes';

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const bookProcessor = new BookProcessorService(UPLOAD_DIR);

const tusServer = new Server({
  path: '/api/upload',
  datastore: new FileStore({ directory: UPLOAD_DIR }),
  respectForwardedHeaders: true,
  onUploadCreate: async (_req, upload) => {
    const filename = upload.metadata?.filename ?? '';
    if (!filename) {
      throw { status_code: 400, body: 'Missing filename in metadata' };
    }
    const title = path.basename(filename, path.extname(filename));
    console.log(`📁 Upload started: ${upload.id} (${filename}, ${upload.size} bytes)`);
    if (checkBookExist(title)) {
      throw { status_code: 400, body: `Book with title "${title}" already exists` };
    }
    return {};
  },
  onUploadFinish: async (_req, upload) => {
    const id = upload.id;
    const filename = upload.metadata?.filename ?? '';
    const title = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename).toLowerCase();
    const kind = getBookKindFromFilename(filename);
    const tusPath = path.join(UPLOAD_DIR, id);
    const bookFilePath = path.join(UPLOAD_DIR, `${id}${ext}`);
    const now = new Date().toISOString();

    // Rename tus file to have proper extension (needed by parser)
    fs.renameSync(tusPath, bookFilePath);

    // Clean up tus metadata file (no longer needed after upload)
    const tusMetaPath = `${tusPath}.json`;
    if (fs.existsSync(tusMetaPath)) fs.unlinkSync(tusMetaPath);

    // Extract cover
    let coverUrl;
    try {
      coverUrl = await bookProcessor.extractCover(id, bookFilePath, kind);
      if (coverUrl) console.log(`✅ Cover extracted for ${filename}: ${coverUrl}`);
    } catch (error) {
      console.warn(`⚠️ Cover extraction failed for ${filename}, skipping:`, error);
    }

    addBook({
      id,
      title,
      kind,
      language: 'zh',
      coverUrl,
      bookmarks: [],
      highlights: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    });

    switch (kind) {
      case 'epub':
        // Build rendition metadata (spine/toc for navigation)
        bookProcessor.buildEpubRendition(bookFilePath).then((rendition) => {
          if (rendition) {
            setBookRendition(id, rendition);
            console.log(`✅ Rendition built for ${filename}: ${rendition.spine.length} spine items`);
          }
        });
        break;
      case 'txt': {
        const rendition = bookProcessor.buildTxtRendition(bookFilePath);
        if (rendition) {
          setBookRendition(id, rendition);
          console.log(`✅ Rendition built for ${filename}: ${rendition.segments.length} segments`);
        }
        break;
      }
      default:
        break;
    }

    console.log(`✅ Upload complete: ${upload.id} ${title} (${kind}, ${upload.size} bytes)`);
    return {};
  },
});

export const uploadRouter = Router();

// tus handles all methods on this path
uploadRouter.all('/{*splat}', (req, res) => {
  tusServer.handle(req, res);
});
