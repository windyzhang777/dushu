import type { PdfLocator, PdfRenditionDescriptor } from '@dushu/shared';

export const getVisiblePage = (rendition: PdfRenditionDescriptor, locator: PdfLocator) => {
  return rendition.pages.find((page) => page.page === locator.page);
};

export const summarizePdfRendition = (rendition: PdfRenditionDescriptor): string => {
  return `${rendition.pages.length} pages from ${rendition.fileUrl}`;
};
