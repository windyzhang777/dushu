import type { BookKind } from '@dushu/shared';
import EPub from 'epub2';
import fs from 'fs';
import path from 'path';

export class BookProcessorService {
  constructor(private uploadsDir: string) {}

  extractCover = async (bookId: string, filePath: string, kind: BookKind): Promise<string | undefined> => {
    try {
      switch (kind) {
        case 'epub':
          return await this.extractEpubCover(bookId, filePath);
        case 'pdf':
          // TODO: return await this.extractPdfCover(bookId, filePath);
          return undefined;
        case 'mobi':
          // TODO: return await this.extractMobiCover(bookId, filePath);
          return undefined;
        default:
          return undefined;
      }
    } catch (error) {
      console.warn(`⚠️ Cover extraction failed for ${filePath}, skipping:`, error);
    }
  };

  private extractEpubCover = async (bookId: string, filePath: string): Promise<string | undefined> => {
    const epub = await EPub.createAsync(filePath);
    if (!epub) throw new Error('EPUB object is null or undefined');

    let coverId = epub.metadata.cover;

    // Fallback: Search manifest for common IDs or EPUB 3 properties
    if (!coverId) {
      const manifest = epub.manifest;
      coverId = Object.keys(manifest).find((id) => {
        const item = manifest[id];
        // Check for EPUB 3 property or common naming conventions
        return item.properties === 'cover-image' || id.toLowerCase().includes('cover') || item.href?.toLowerCase().includes('cover');
      });
    }

    // Last Resort: Use the first image in the entire manifest
    if (!coverId) {
      coverId = Object.keys(epub.manifest).find((id) => epub.manifest[id]['media-type']?.startsWith('image/'));
    }

    if (coverId) {
      const [buffer, mimeType] = await epub.getImageAsync(coverId);
      const ext = mimeType.split('/')[1] || 'jpg';
      const coverFilename = `${bookId}_cover.${ext}`;
      fs.writeFileSync(path.join(this.uploadsDir, coverFilename), buffer);
      return `/api/uploads/${coverFilename}`;
    }
  };

  deleteBookFiles = async (bookId: string | undefined) => {
    if (!bookId) return;

    const dir = fs.readdirSync(this.uploadsDir);
    for (const file of dir) {
      if (file === `${bookId}.json` || file.startsWith(bookId)) {
        const fullPath = path.join(this.uploadsDir, file);
        fs.unlinkSync(fullPath);
      }
    }
  };
}
