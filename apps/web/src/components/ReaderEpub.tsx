import { buildSrcDoc } from '@/common/buildSrcdoc';
import { useThemeContext } from '@/common/theme-provider';
import { useChapter } from '@/services/queries';
import type { EpubRenditionDescriptor, ReaderSettings } from '@dushu/shared';
import { useMemo, useRef } from 'react';

interface ReaderEpubProps {
  bookId: string;
  rendition: EpubRenditionDescriptor;
  currentChapter: number;
  settings: ReaderSettings;
}

export const ReaderEpub = ({ bookId, rendition, currentChapter, settings }: ReaderEpubProps) => {
  const { spine, toc } = rendition;
  const { isDark } = useThemeContext();
  const { data: chapterData, isLoading } = useChapter(bookId, currentChapter);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build full HTML document for the iframe
  const srcDoc = useMemo(() => {
    const chapterHtml = chapterData?.html;
    if (!chapterHtml || !bookId) return '';
    return buildSrcDoc(chapterHtml, bookId, settings, isDark);
  }, [chapterData?.html, bookId, settings, isDark]);

  if (isLoading) {
    return (
      <div aria-label="loading" className="h-full flex justify-center items-center gap-2">
        <img src="/book_flip_light.gif" alt="Loading book..." className="size-48 object-contain" />
      </div>
    );
  }

  return (
    <>
      <iframe ref={iframeRef} srcDoc={srcDoc} title="Book content" className="absolute inset-0 w-full h-full border-0" sandbox="allow-same-origin" />
    </>
  );
};
