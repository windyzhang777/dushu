import { buildChapterFragment, buildSrcDoc } from '@/common/buildSrcdoc';
import { useThemeContext } from '@/common/theme-provider';
import { api } from '@/services/api';
import { useChapter } from '@/services/queries';
import type { EpubRenditionDescriptor, ReaderSettings } from '@dushu/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ReaderEpubProps {
  bookId: string;
  rendition: EpubRenditionDescriptor;
  currentUnitIndex: number;
  settings: ReaderSettings;
  onScrollProgress?: (progress: number) => void;
}

export const ReaderEpub = ({ bookId, rendition, currentUnitIndex, settings, onScrollProgress }: ReaderEpubProps) => {
  const { spine } = rendition;
  const { isDark } = useThemeContext();
  const { data: chapterData, isLoading } = useChapter(bookId, currentUnitIndex);
  const [appendedUnits, setAppendedUnits] = useState<number[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appendInFlightRef = useRef<number | null>(null);
  const appendedUnitsRef = useRef<number[]>([]);
  useEffect(() => {
    appendedUnitsRef.current = appendedUnits;
  }, [appendedUnits]);

  // Build full HTML document for the iframe
  const srcDoc = useMemo(() => {
    const chapterHtml = chapterData?.html;
    if (!chapterHtml || !bookId) return '';
    return buildSrcDoc(chapterHtml, bookId, settings, isDark, currentUnitIndex);
  }, [chapterData?.html, bookId, settings, isDark, currentUnitIndex]);

  const fetchChapterHtml = useCallback(
    async (unitIndex: number): Promise<string | null> => {
      if (!bookId || unitIndex < 0 || unitIndex >= spine.length) return null;

      try {
        const chapter = await api.book.getChapter(bookId, unitIndex);
        if (!chapter?.html) return null;
        return buildChapterFragment(chapter.html, bookId);
      } catch (error) {
        console.error('Error fetching chapter:', error);
        return null;
      }
    },
    [bookId, spine.length],
  );

  useEffect(() => {
    setAppendedUnits([]);
    appendInFlightRef.current = null;
  }, [currentUnitIndex, settings, isDark]);

  useEffect(() => {
    if (settings.pageView !== 'scroll') return;

    // parent.postMessage({ type: 'reader-scroll-progress', progress }, '*');
    // parent.postMessage({ type: 'reader-near-bottom' }, '*');
    // parent.postMessage({ type: 'reader-unit-appended', unitIndex: data.unitIndex }, '*');
    const handleMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'reader-scroll-progress' && typeof data.progress === 'number') {
        // Convert iframe scroll fraction to overall book progress
        const loadedCount = 1 + appendedUnitsRef.current.length;
        const overallProgress = (currentUnitIndex + loadedCount * data.progress) / spine.length;
        onScrollProgress?.(Math.max(0, Math.min(1, overallProgress)));
        return;
      }

      if (data.type === 'reader-unit-appended' && typeof data.unitIndex === 'number') {
        appendInFlightRef.current = null;
        setAppendedUnits((prev) => (prev.includes(data.unitIndex) ? prev : [...prev, data.unitIndex]));
        return;
      }

      if (data.type !== 'reader-near-bottom') return;

      const loaded = appendedUnitsRef.current;
      const maxLoaded = loaded.length > 0 ? Math.max(currentUnitIndex, ...loaded) : currentUnitIndex;
      const nextIndex = maxLoaded + 1;
      if (nextIndex >= spine.length) return;
      if (appendInFlightRef.current === nextIndex) return;
      if (loaded.includes(nextIndex)) return;

      appendInFlightRef.current = nextIndex;
      const nextHtml = await fetchChapterHtml(nextIndex);
      if (!nextHtml) {
        appendInFlightRef.current = null;
        return;
      }

      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow) {
        appendInFlightRef.current = null;
        return;
      }

      iframeWindow.postMessage({ type: 'reader-append-unit', unitIndex: nextIndex, html: nextHtml }, '*');
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [settings.pageView, onScrollProgress, currentUnitIndex, spine.length, fetchChapterHtml]);

  if (isLoading) {
    return (
      <div aria-label="loading" className="h-full flex justify-center items-center gap-2">
        <img src="/book_flip_light.gif" alt="Loading book..." className="size-48 object-contain" />
      </div>
    );
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title="Book content"
        className="absolute inset-0 w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts"
      />
    </>
  );
};
