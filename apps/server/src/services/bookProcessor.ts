import type { BookKind, EpubRenditionDescriptor, EpubSpineItem, TOCEntry, TxtRenditionDescriptor } from '@dushu/shared';
import { EPub } from 'epub2';
import type { TocElement } from 'epub2/lib/epub/const';
import fs from 'fs';
import path from 'path';

// epub2 toc items include extra fileds beyond the declared TocElement type
interface EpubTocItem extends TocElement {
  label?: string;
  children?: EpubTocItem[];
}

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
      console.warn(`⚠️ Cover extraction failed for ${filePath}:`, error);
    }
  };

  private extractEpubCover = async (bookId: string, filePath: string): Promise<string | undefined> => {
    const epub = await EPub.createAsync(filePath);
    if (!epub) {
      console.warn(`⚠️ Failed to parse EPUB for extractEpubCover: ${filePath}`);
      return;
    }

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

  /* Get raw chapter HTML from epub by spine index */
  getChapterHtml = async (filePath: string, spineIndex: number): Promise<string | undefined> => {
    const epub = await EPub.createAsync(filePath);
    if (!epub) {
      console.warn(`⚠️ Failed to parse EPUB for getChapterHtml: ${filePath}`);
      return;
    }

    const spineItem = epub.flow[spineIndex];
    if (!spineItem) return;

    return await epub.getChapterRawAsync(spineItem.id);
  };

  /* Get a resource buffer (image, CSS, font) from epub */
  getEpubResource = async (filePath: string, resourceHref: string): Promise<[Buffer, string] | undefined> => {
    const epub = await EPub.createAsync(filePath);
    if (!epub) {
      console.warn(`⚠️ Failed to parse EPUB for getEpubResource: ${filePath}`);
      return;
    }

    // Find manifest item matching the href
    const manifestItem = (Object.values(epub.manifest) as TocElement[]).find((item) => {
      const itemHref = item.href;
      if (!itemHref) return false;
      return itemHref === resourceHref || itemHref.endsWith(resourceHref) || resourceHref.endsWith(itemHref);
    });
    if (!manifestItem?.id) return;

    const id = manifestItem.id;
    const mimeType = manifestItem['media-type'] || 'application/octet-stream';

    try {
      if (mimeType.startsWith('image/')) {
        const [buffer, mime] = await epub.getImageAsync(id);
        return [buffer, mime];
      }
    } catch (error) {
      console.warn(`⚠️ Failed to extract resource ${resourceHref} for ${filePath}:`, error);
      console.log('Fall through to getFileAsync');
    }

    const [buffer, mime] = await epub.getFileAsync(id);
    return [buffer, mime];
  };

  /* Build epub rendition descriptor (spine + toc metadata) */
  buildEpubRendition = async (filePath: string): Promise<EpubRenditionDescriptor | undefined> => {
    try {
      const epub = await EPub.createAsync(filePath);
      if (!epub) {
        console.warn(`⚠️ Failed to parse EPUB for buildEpubRendition: ${filePath}`);
        return;
      }

      const spine: EpubSpineItem[] = (epub.flow as TocElement[]).map((item, index) => ({
        idref: item.id || `spine-${index}`,
        href: item.href || '',
        linear: true,
        title: item.title,
      }));

      const toc: TOCEntry[] = this.buildTocEntries(epub.toc);

      // Count sentences per chapter by extracting text from each spine item
      const sentencesPerChapter = await Promise.all(
        (epub.flow as TocElement[]).map(async (item) => {
          try {
            const html = await epub.getChapterRawAsync(item.id);
            return html ? this.countSentences(html) : 0;
          } catch (error) {
            console.error(`❌ Failed to extract text for chapter ${item.id}:`, error);
            return 0;
          }
        }),
      );

      return {
        kind: 'epub',
        manifest: (Object.values(epub.manifest) as TocElement[]).map((item) => ({
          id: item.id || '',
          href: item.href || '',
          mediaType: item['media-type'] || 'application/octet-stream',
        })),
        spine,
        toc,
        sentencesPerChapter,
      };
    } catch (error) {
      console.error(`❌ Failed to build EPUB rendition for ${filePath}:`, error);
    }
  };

  /* Build txt rendition descriptor (split file into segments) */
  buildTxtRendition = (filePath: string): TxtRenditionDescriptor | undefined => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const paragraphs = content.split(/\n/).filter((p) => p.trim().length > 0);
      const segments = paragraphs.map((para, index) => ({ id: `seg-${index}`, text: para.trim() }));
      return { kind: 'txt', segments };
    } catch (error) {
      console.error(`❌ Failed to build TXT rendition for ${filePath}:`, error);
    }
  };

  private buildTocEntries = (tocItems: EpubTocItem[]): TOCEntry[] => {
    return tocItems.map((item, index) => ({
      id: item.id || `toc-${index}`,
      label: item.title || item.label || `Section ${index + 1}`,
      locator: { kind: 'epub', spineIndex: item.order ?? index, href: item.href || '', progression: 0, sentenceIndex: 0 },
      children: item.children ? this.buildTocEntries(item.children) : undefined,
    }));
  };

  /* Strip HTML tags and return plain text */
  private extractText = (html: string): string => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    return bodyContent
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6)>/gi, '\n\n') // Block element -> paragraph breaks
      .replace(/<br\s*\/?>/gi, ' ') // Line breaks -> single space
      .replace(/<[^>]*>/g, ' ') // Strip all remaining tags
      .replace(/&nbsp;/g, ' ') // HTML entities
      .replace(/&[a-z]+;/gi, ' ') // Named entities
      .replace(/&#\d+;/g, ' ') // Numeric entities
      .replace(/[ \t]+/g, ' ') // Collapse horizontal tabs/spaces
      .replace(/\n[ \t]+/g, ' ') // Strip leading whitespace on lines
      .replace(/[ \t]+\n/g, ' ') // Strip trailing whitespace on lines
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines (paragraph separator)
      .trim();
  };

  /* Count sentences in an HTML chapter */
  private countSentences = (html: string): number => {
    const text = this.extractText(html);
    if (!text) return 0;

    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });

      let count = 0;
      for (const { segment } of segmenter.segment(text)) {
        if (segment.trim()) count++;
      }
      return count;
    } catch (error) {
      // Fallback: split on punctuation
      console.warn('⚠️ Intl.Segmenter failed, fall back to regex for sentence counting:', error);
      return text.split(/[。！？!?…]+|\n\n/).filter((s) => s.trim().length > 0).length;
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
