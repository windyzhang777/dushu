import type { BookKind, ContentSegment, TTSSentenceBoundary, TTSWordBoundary } from './types.js';

export const splitIntoSentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

export const splitIntoWords = (text: string): string[] => text.split(/\s+/).filter((w) => w.trim().length > 0);

export const buildWordBoundaries = (segment: ContentSegment): TTSWordBoundary[] => {
  const boundaries: TTSWordBoundary[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(segment.text)) !== null) {
    boundaries.push({
      word: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      segmentIndex: segment.index,
    });
  }

  return boundaries;
};

export const buildSentenceBoundaries = (segment: ContentSegment): TTSSentenceBoundary[] => {
  const boundaries: TTSSentenceBoundary[] = [];
  const regex = /[^.!?]*[.!?]+\s*|[^.!?]+$/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(segment.text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length === 0) continue;

    boundaries.push({
      sentence,
      startOffset: match.index,
      endOffset: match.index + match[0].trimEnd().length,
      segmentIndex: segment.index,
    });
  }

  return boundaries;
};

export const generateId = (): string => crypto.randomUUID();

export const formatProgress = (progress: number): string => `${Math.round(progress * 100)}%`;

export const titleWithAuthor = (title: string, author?: string) => (author ? `${title} (${author})` : title);

export const FILE_EXTENSION_MAP: Record<string, BookKind> = {
  '.epub': 'epub',
  '.pdf': 'pdf',
  '.mobi': 'mobi',
  '.txt': 'linear-text',
  '.azw': 'mobi',
  '.azw3': 'mobi',
};

export const getBookKindFromFilename = (filename: string): BookKind => {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return FILE_EXTENSION_MAP[ext] ?? 'linear-text';
};
