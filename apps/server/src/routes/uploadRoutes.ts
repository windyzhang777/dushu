import { getBookKindFromFilename } from '@dushu/shared';
import { FileStore } from '@tus/file-store';
import { Server } from '@tus/server';
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR } from '..';
import { BookProcessorService } from '../services/bookProcessor';
import { addBook, checkBookExist } from './documentRoutes';

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
    const kind = getBookKindFromFilename(filename);
    const uploadedFilePath = path.join(UPLOAD_DIR, id);
    const now = new Date().toISOString();

    // Clean up tus metadata file (no longer needed after upload)
    const tusMetaPath = `${uploadedFilePath}.json`;
    if (fs.existsSync(tusMetaPath)) fs.unlinkSync(tusMetaPath);

    // Extract cover for epub files
    let coverUrl;
    try {
      coverUrl = await bookProcessor.extractCover(id, uploadedFilePath, kind);
      if (coverUrl) console.log(`✅ Cover extracted for ${filename}: ${coverUrl}`);
    } catch (error) {
      console.warn(`⚠️ Cover extraction failed for ${filename}, skipping:`, error);
    }

    addBook({
      id: uuidv4(),
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

    console.log(`✅ Upload complete: ${upload.id} ${title} (${kind}, ${upload.size} bytes)`);
    return {};
  },
});

export const uploadRouter = Router();

// tus handles all methods on this path
uploadRouter.all('/{*splat}', (req, res) => {
  tusServer.handle(req, res);
});
