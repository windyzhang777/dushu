import type { RenditionDescriptor } from '@dushu/shared';

interface ReaderUnit {
  index?: number;
  title?: string;
  href?: string;
}

export function getReaderUnits(rendition?: RenditionDescriptor): ReaderUnit[] {
  if (!rendition) return [] as ReaderUnit[];

  switch (rendition.kind) {
    case 'epub': {
      const units: ReaderUnit[] = [];
      for (const [index, item] of rendition.spine.entries()) {
        units.push({
          index,
          title: item.title,
          href: item.href,
        });
      }
      return units;
    }
    case 'pdf': {
      const units: ReaderUnit[] = [];
      for (const [index, item] of rendition.pages.entries()) {
        units.push({
          index,
          title: `Page ${item.page}`,
        });
      }
      return units;
    }
    case 'txt':
      return rendition.segments.map((_, index) => ({ index }));
    case 'mobi': {
      const units: ReaderUnit[] = [];
      for (const [index, item] of rendition.chapters.entries()) {
        units.push({
          index,
          title: item.title,
        });
      }
      return units;
    }
    default:
      return [];
  }
}
