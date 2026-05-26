import type { BookRecord, EpubLocator, EpubRenditionDescriptor, LinearTextDescriptor, PdfLocator, PdfRenditionDescriptor, TOCEntry } from './types';

export const epubLocator: EpubLocator = {
  kind: 'epub',
  spineIndex: 2,
  href: 'text/chapter-03.xhtml',
  progression: 0.42,
  cfi: 'epubcfi(/6/8!/4/2/16)',
};

export const pdfLocator: PdfLocator = {
  kind: 'pdf',
  page: 12,
  x: 96,
  y: 128,
  zoom: 1.15,
};

export const tocEntry: TOCEntry = {
  id: 'toc-entry-1',
  label: 'The Renderer',
  locator: epubLocator,
};

export const demoBook: BookRecord = {
  id: 'epub-1',
  title: 'The Architecture of Reading',
  author: 'Dushu Prototype',
  kind: 'epub',
  language: 'en',
  progress: { locator: epubLocator, overallProgression: 0.42, updatedAt: '2026-05-15T00:00:00.000Z' },
  bookmarks: [
    {
      id: 'bookmark-1',
      label: 'Chapter 3 opening spread',
      locator: epubLocator,
      createdAt: '2026-05-15T00:00:00.000Z',
    },
  ],
  highlights: [
    {
      id: 'highlight-1',
      locator: epubLocator,
      startOffset: 0,
      endOffset: 42,
      quote: 'Rendering should respect the source document.',
      color: 'yellow',
      note: 'Core product principle.',
      createdAt: '2026-05-15T00:00:00.000Z',
    },
  ],
  notes: [
    {
      id: 'note-1',
      locator: epubLocator,
      content: 'This is a note about the renderer.',
      createdAt: '2026-05-15T00:00:00.000Z',
      updatedAt: '2026-05-15T00:00:00.000Z',
    },
  ],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-15T00:00:00.000Z',
  lastOpenedAt: '2026-05-15T00:00:00.000Z',
};

export const demoEpub: EpubRenditionDescriptor = {
  kind: 'epub',
  manifest: [
    { id: 'css-main', href: 'styles/book.css', mediaType: 'text/css' },
    { id: 'chapter-03', href: 'text/chapter-03.xhtml', mediaType: 'application/xhtml+xml' },
  ],
  spine: [
    { idref: 'chapter-01', href: 'text/chapter-01.xhtml', linear: true, title: 'Opening' },
    { idref: 'chapter-02', href: 'text/chapter-02.xhtml', linear: true, title: 'The Reader' },
    { idref: 'chapter-03', href: 'text/chapter-03.xhtml', linear: true, title: 'The Renderer' },
  ],
  toc: [tocEntry],
};

export const demoPdf: PdfRenditionDescriptor = {
  kind: 'pdf',
  fileUrl: '/documents/demo.pdf',
  pages: [
    { page: 11, width: 1024, height: 1536 },
    { page: 12, width: 1024, height: 1536 },
    { page: 13, width: 1024, height: 1536 },
  ],
};

export const demoLinearText: LinearTextDescriptor = {
  kind: 'linear-text',
  segments: [{ id: 'string', text: 'string' }],
};
