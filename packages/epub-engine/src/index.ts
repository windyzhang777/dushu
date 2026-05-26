import type { EpubRenditionDescriptor, EpubLocator, EpubSpineItem } from '@dushu/shared';

export const getSpineItemByLocator = (rendition: EpubRenditionDescriptor, locator: EpubLocator): EpubSpineItem | undefined => {
  return rendition.spine[locator.spineIndex];
};

export const summarizeEpubRendition = (rendition: EpubRenditionDescriptor): string => {
  return `${rendition.spine.length} spine items, ${rendition.manifest.length} manifest assets`;
};
