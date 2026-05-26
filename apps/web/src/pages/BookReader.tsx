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

export const BookReader = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // data hook
  const { data: bookData, isLoading: loadingBook } = useBook(id!);
  const { data: renditionData, isLoading: loadingRendition } = useRendition(id!);
  const { data: progressData } = useProgress(id!);
  const updateProgress = useUpdateProgress(id!);
  const { settings, updateSettings, resetSettings } = useReaderSettings();

  const [currentChapter, setCurrentChapter] = useState(-1);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const book = bookData?.book;
  const rendition = renditionData?.rendition;
  const isEpub = rendition?.kind === 'epub';
  const chapters = isEpub ? rendition.spine : [];
  const totalChapters = chapters.length;
  const lineProgress = progressData?.progress?.lineProgress ?? 0;
  const chapterTitle = chapters[currentChapter]?.title;
  const isLoading = loadingBook || loadingRendition;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters; // keep latest chapters in ref for progress saving

  const navigateChapter = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalChapters) return;
      setCurrentChapter(index);
      setTocOpen(false);
    },
    [totalChapters],
  );

  const prevChapter = useCallback(() => navigateChapter(currentChapter - 1), [currentChapter]);
  const nextChapter = useCallback(() => navigateChapter(currentChapter + 1), [currentChapter]);

  const navigateBack = (replace: boolean = false) => {
    // flushUpdate();
    navigate('/', { replace });
  };

  // Set initial chapter index from saved progress
  useEffect(() => {
    if (currentChapter >= 0) return; // already set
    if (!totalChapters) return;
    const locator = progressData?.progress?.locator;
    if (locator?.kind === 'epub' && locator.spineIndex < totalChapters) {
      setCurrentChapter(locator.spineIndex);
    } else {
      setCurrentChapter(0);
    }
  }, [totalChapters, progressData, currentChapter]);

  // Save progress when chapter changes
  useEffect(() => {
    if (!id || !totalChapters || currentChapter < 0) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const progress: ReadingProgress = {
        locator: {
          kind: 'epub',
          spineIndex: currentChapter,
          href: chaptersRef.current[currentChapter]?.href ?? '',
          progression: 0,
          sentenceIndex: 0,
        },
        lineProgress: 0, // TODO: update from speech progress
        updatedAt: new Date().toISOString(),
      };
      updateProgress.mutate(progress);
    }, 1000);
    return () => clearTimeout(timeoutRef.current);
  }, [id, totalChapters, currentChapter]);

  // Hijack keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && tocOpen) {
        e.preventDefault();
        setTocOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextChapter();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevChapter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tocOpen, nextChapter, prevChapter]);

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
        chapterTitle={chapterTitle}
        chapterIndex={currentChapter}
        totalChapters={totalChapters}
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
          // TODO: jump to sentence
          const progress: ReadingProgress = {
            locator: isEpub
              ? { kind: 'epub', spineIndex: currentChapter, href: chapters[currentChapter]?.href ?? '', progression: 0, sentenceIndex: 0 }
              : { kind: 'txt', segmentIndex: 0 },
            lineProgress: values[0] / 100,
            updatedAt: new Date().toISOString(),
          };
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
                    id: `ch-${index}}`,
                    label: chapter.title || `Chapter ${index + 1}`,
                    locator: { kind: 'epub', spineIndex: index, href: chapter.href, progression: 0, sentenceIndex: 0 },
                  }))
            }
            currentChapter={currentChapter}
            onSelect={navigateChapter}
          />
        )}

        <div className="w-full h-full">
          {/* Chapter iframe */}
          {rendition.kind === 'epub' && <ReaderEpub bookId={id} rendition={rendition} currentChapter={currentChapter} settings={settings} />}

          {rendition.kind === 'txt' && <ReaderTxt bookId={id} rendition={rendition} settings={settings} />}
        </div>

        {/* Settings Panel */}
        {settingsOpen && <ReaderSettingsPanel settings={settings} onUpdate={updateSettings} onReset={resetSettings} />}
      </div>
    </div>
  );
};
