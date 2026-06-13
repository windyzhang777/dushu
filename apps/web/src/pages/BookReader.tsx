import useReaderSettings from '@/common/useReaderSettings';
import { BookHeader } from '@/components/BookHeader';
import { ReaderEpub } from '@/components/ReaderEpub';
import { ReaderSettingsPanel } from '@/components/ReaderSettingsPanel';
import { ReaderTocPanel } from '@/components/ReaderTocPanel';
import { ReaderTxt } from '@/components/ReaderTxt';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useBook, useProgress, useRendition, useUpdateProgress } from '@/services/queries';
import { titleWithAuthor, type ReadingProgress } from '@dushu/shared';
import { BookOpen } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReaderUnits } from './utils';

export const BookReader = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // data hook
  const { data: bookData, isLoading: loadingBook } = useBook(id!);
  const { data: renditionData, isLoading: loadingRendition } = useRendition(id!);
  const { data: progressData } = useProgress(id!);
  const updateProgress = useUpdateProgress(id!);
  const { settings, updateSettings, resetSettings } = useReaderSettings();

  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const book = bookData?.book;
  const rendition = renditionData?.rendition;
  const units = getReaderUnits(rendition);
  const totalUnits = units.length;
  const lineProgress = progressData?.progress?.lineProgress ?? 0;
  const currentUnitTitle = units[currentBatchIndex]?.title;
  const isLoading = loadingBook || loadingRendition;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scrollProgtessTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unitsRef = useRef(units);
  unitsRef.current = units; // keep latest units in ref for progress saving

  const navigateBack = (replace: boolean = false) => {
    // flushUpdate();
    navigate('/', { replace });
  };

  const buildProgressPayload = useCallback(
    (progress: number): ReadingProgress | undefined => {
      if (!rendition || !id) return;

      const safeProgress = Math.max(0, Math.min(1, progress));
      if (currentBatchIndex < 0 || currentBatchIndex >= totalUnits) return;

      switch (rendition.kind) {
        case 'epub':
          return {
            locator: {
              kind: 'epub',
              spineIndex: currentBatchIndex,
              href: units[currentBatchIndex]?.href ?? '',
              progression: safeProgress,
              sentenceIndex: 0,
            },
            lineProgress: safeProgress,
            updatedAt: new Date().toISOString(),
          };
        case 'pdf':
          return {
            locator: {
              kind: 'pdf',
              page: Math.max(1, currentBatchIndex + 1),
            },
            lineProgress: safeProgress,
            updatedAt: new Date().toISOString(),
          };
        case 'txt':
          return {
            locator: {
              kind: 'txt',
              segmentIndex: Math.max(0, currentBatchIndex),
            },
            lineProgress: safeProgress,
            updatedAt: new Date().toISOString(),
          };
        case 'mobi':
          return {
            locator: {
              kind: 'mobi',
              chapterIndex: Math.max(0, currentBatchIndex),
              position: Math.max(0, currentBatchIndex),
              progression: safeProgress,
            },
            lineProgress: safeProgress,
            updatedAt: new Date().toISOString(),
          };
        default:
          return;
      }
    },
    [rendition, id, currentBatchIndex, totalUnits, units],
  );

  const navigateUnit = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalUnits) return;

      setCurrentBatchIndex(index);
      setTocOpen(false);
    },
    [totalUnits],
  );

  const prevUnit = useCallback(() => navigateUnit(currentBatchIndex - 1), [navigateUnit, currentBatchIndex]);
  const nextUnit = useCallback(() => navigateUnit(currentBatchIndex + 1), [navigateUnit, currentBatchIndex]);

  const handleScrollProgress = useCallback(
    (progress: number) => {
      console.log(`progress :`, progress);
      if (!id) return;

      clearTimeout(scrollProgtessTimeoutRef.current);
      scrollProgtessTimeoutRef.current = setTimeout(() => {
        const payload = buildProgressPayload(progress);
        if (!payload) return;
        updateProgress.mutate(payload);
      }, 1000);
    },
    [id, buildProgressPayload, updateProgress],
  );

  // Set initial unit index from saved progress
  useEffect(() => {
    if (!totalUnits || currentBatchIndex >= 0) return; // no units oralready set

    const locator = progressData?.progress?.locator;
    if (!locator) {
      setCurrentBatchIndex(0);
      return;
    }

    if (locator?.kind === 'epub' && locator.kind === 'epub' && locator.spineIndex < totalUnits) {
      setCurrentBatchIndex(locator.spineIndex);
      return;
    }

    if (locator?.kind === 'pdf' && locator.kind === 'pdf' && locator.page > 0 && locator.page <= totalUnits) {
      setCurrentBatchIndex(locator.page - 1);
      return;
    }

    if (locator?.kind === 'txt' && locator.kind === 'txt' && locator.segmentIndex < totalUnits) {
      setCurrentBatchIndex(locator.segmentIndex);
      return;
    }

    if (locator?.kind === 'mobi' && locator.kind === 'mobi' && locator.chapterIndex < totalUnits) {
      setCurrentBatchIndex(locator.chapterIndex);
      return;
    }

    setCurrentBatchIndex(0);
  }, [totalUnits, progressData, currentBatchIndex, rendition]);

  // Save progress when current unit changes
  useEffect(() => {
    if (!id || !totalUnits || currentBatchIndex < 0) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const progress = buildProgressPayload(lineProgress);
      if (!progress) return;
      updateProgress.mutate(progress);
    }, 1000);
    return () => clearTimeout(timeoutRef.current);
  }, [id, totalUnits, currentBatchIndex, lineProgress, buildProgressPayload, updateProgress]);

  useEffect(() => {
    return () => clearTimeout(scrollProgtessTimeoutRef.current);
  }, []);

  // Hijack keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && tocOpen) {
        e.preventDefault();
        setTocOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextUnit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevUnit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tocOpen, nextUnit, prevUnit]);

  if (isLoading) {
    return (
      <div aria-label="loading" className="h-full flex justify-center items-center gap-2">
        <img src="/book_flip_light.gif" alt="Loading book..." className="size-48 object-contain" />
      </div>
    );
  }

  if (!id || !book) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <p className="text-muted-foreground">Book not found</p>
        <Button variant="outline" onClick={() => navigateBack(true)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!rendition) {
    return (
      <div className="h-full flex justify-center items-center gap-2">
        <BookOpen className="opacity-50" />
        <p className="text-muted-foreground">Rendition not available</p>
        <Button variant="outline" onClick={() => navigateBack(true)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <BookHeader
        title={titleWithAuthor(book.title, book.author)}
        unitTitle={currentUnitTitle}
        unitIndex={currentBatchIndex}
        totalUnits={totalUnits}
        onBack={() => navigateBack(false)}
        onToggleToc={() => setTocOpen((v) => !v)}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
      />

      {/* Progress Slider */}
      <Slider
        value={[lineProgress * 100]}
        max={100}
        step={1}
        onValueChange={(values) => {
          const fraction = values[0] / 100;
          // Navigate to the unit corresponding to the position
          const targetUnit = Math.min(Math.floor(fraction * totalUnits), totalUnits - 1);
          if (targetUnit >= 0 && targetUnit !== currentBatchIndex) {
            navigateUnit(targetUnit);
          }
          const progress = buildProgressPayload(fraction);
          if (!progress) return;
          updateProgress.mutate(progress);
        }}
        className="z-20"
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TOC Panel */}
        {tocOpen && rendition.kind === 'epub' && (
          <ReaderTocPanel
            chapters={
              rendition.toc.length > 0
                ? rendition.toc
                : rendition.spine.map((chapter, index) => ({
                    id: `ch-${index}`,
                    label: chapter.title || `Chapter ${index + 1}`,
                    locator: { kind: 'epub', spineIndex: index, href: chapter.href, progression: 0, sentenceIndex: 0 },
                  }))
            }
            currentUnitIndex={currentBatchIndex}
            onSelect={navigateUnit}
          />
        )}

        <div className="w-full h-full">
          {/* Chapter iframe */}
          {rendition.kind === 'epub' && (
            <ReaderEpub
              bookId={id}
              rendition={rendition}
              currentUnitIndex={currentBatchIndex}
              settings={settings}
              onScrollProgress={handleScrollProgress}
            />
          )}

          {rendition.kind === 'txt' && <ReaderTxt bookId={id} rendition={rendition} settings={settings} />}
        </div>

        {/* Settings Panel */}
        {settingsOpen && <ReaderSettingsPanel settings={settings} onUpdate={updateSettings} onReset={resetSettings} />}
      </div>
    </div>
  );
};
