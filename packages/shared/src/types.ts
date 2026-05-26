import type { Theme } from './theme';

// ------- Book Kinds and Locators -------------------------------------------------
export type BookKind = 'linear-text' | 'epub' | 'pdf' | 'mobi';

export interface BaseLocator {
  kind: BookKind;
}

export interface TextLocator extends BaseLocator {
  kind: 'linear-text';
  segmentIndex: number;
  offset?: number;
}

export interface EpubLocator extends BaseLocator {
  kind: 'epub';
  spineIndex: number;
  href: string;
  progression: number;
  cfi?: string;
}

export interface PdfLocator extends BaseLocator {
  kind: 'pdf';
  page: number;
  x?: number;
  y?: number;
  zoom?: number;
}

export interface MobiLocator extends BaseLocator {
  kind: 'mobi';
  position: number;
  chapterIndex: number;
  progression?: number;
}

export type Locator = TextLocator | EpubLocator | PdfLocator | MobiLocator;

// ------- Annotations ---------------------------------------------------------------
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple';

export interface Bookmark {
  id: string;
  label: string;
  locator: Locator;
  createdAt: string;
}

export interface Highlight {
  id: string;
  locator: Locator;
  startOffset: number;
  endOffset: number;
  quote?: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  locator: Locator;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ------- Reading Progress and TTS (Text-to-Speech) --------------------------------------------------
export interface ReadingProgress {
  locator: Locator;
  overallProgression: number; // Value between 0 and 1
  updatedAt: string;
}

export type TTSPlaybackState = 'idle' | 'playing' | 'paused' | 'loading';

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  isDefault: boolean;
}

export interface TTSWordBoundary {
  word: string;
  startOffset: number;
  endOffset: number;
  segmentIndex: number;
}

export interface TTSSentenceBoundary {
  sentence: string;
  startOffset: number;
  endOffset: number;
  segmentIndex: number;
}

export interface TTSState {
  playbackState: TTSPlaybackState;
  currentWord: TTSWordBoundary | null;
  currentSentence: TTSSentenceBoundary | null;
  rate: number; // e.g., 1.0 for normal speed
  pitch: number; // e.g., 1.0 for normal pitch
  voice: TTSVoice | null;
  locator: Locator | null; // current segment/chapter being read
}

export const DEFAULT_TTS_STATE: TTSState = {
  playbackState: 'idle',
  currentWord: null,
  currentSentence: null,
  rate: 1.0,
  pitch: 1.0,
  voice: null,
  locator: null,
};

// ------- Book Records ---------------------------------------------------------------
export interface BookRecord {
  id: string;
  title: string;
  author?: string;
  kind: BookKind;
  language: string;
  coverUrl?: string;
  fileSize?: number;
  progress?: ReadingProgress;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  completedAt?: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  author?: string;
  kind: BookKind;
  language: string;
  coverUrl?: string;
  progress?: ReadingProgress;
  bookmarksCount: number;
  highlightsCount: number;
  notesCount: number;
  lastOpenedAt?: string;
  completedAt?: string;
}

// ------- Book Content Model ---------------------------------------------------------------
export interface ContentSegment {
  id: string;
  index: number; // index within the chapter/spine item
  text: string;
  html?: string; // HTML content for rendering (preserves formatting)
}

export interface Chapter {
  id: string;
  title: string;
  index: number; // index within the spine
  segments: ContentSegment[];
}

export interface TOCEntry {
  id: string;
  label: string;
  locator: Locator;
  children?: TOCEntry[]; // for nested TOC entries
}

// ------- Rendition Descriptors ---------------------------------------------------------------
export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
}

export interface EpubSpineItem {
  idref: string;
  href: string;
  linear: boolean;
  title?: string;
}

// export interface EpubTocItem {
//   label: string;
//   href: string;
//   locator: EpubLocator;
// }

export interface EpubRenditionDescriptor {
  kind: 'epub';
  manifest: EpubManifestItem[];
  spine: EpubSpineItem[];
  toc: TOCEntry[];
}

export interface PdfPageDescriptor {
  page: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface PdfRenditionDescriptor {
  kind: 'pdf';
  fileUrl: string;
  pages: PdfPageDescriptor[];
}

export interface LinearTextSegment {
  id: string;
  text: string;
}

export interface LinearTextDescriptor {
  kind: 'linear-text';
  segments: LinearTextSegment[];
}

export interface MobiRenditionDescriptor {
  kind: 'mobi';
  chapters: Chapter[];
  toc: TOCEntry[];
}

export type RenditionDescriptor = EpubRenditionDescriptor | PdfRenditionDescriptor | LinearTextDescriptor | MobiRenditionDescriptor;

// ------- Library and Reader Settings ---------------------------------------------------------------
export interface Library {
  books: BookRecord[];
  lastSyncedAt?: string;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  marginHorizontal: number;
  marginVertical: number;
  theme: Theme;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.5,
  marginHorizontal: 20,
  marginVertical: 20,
  theme: 'light',
};
