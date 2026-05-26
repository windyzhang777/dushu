import { Button } from '@/components/ui/button';
import { Fullscreen, LibraryBig, ListEnd, ListStart } from 'lucide-react';

interface BookHeaderProps {
  title: string;
  chapterTitle?: string;
  chapterIndex: number;
  totalChapters: number;
  onBack: () => void;
  onToggleToc: () => void;
  onToggleSettings: () => void;
}

export const BookHeader = ({ title, chapterTitle, chapterIndex, totalChapters, onBack, onToggleToc, onToggleSettings }: BookHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm shrink-0">
      {/* Left Panel Group */}
      <div title="Bookmars & Chapters" className="flex items-center gap-2">
        {/* Back to Books */}
        <Button size="icon" variant="ghost" title="Back to Books" onClick={onBack}>
          <LibraryBig />
        </Button>

        {/* Prev Chapter */}
        <Button size="icon" variant="ghost" disabled={chapterIndex <= 0} title="Previous Chapter">
          <ListStart />
        </Button>

        {/* Next Chapter */}
        <Button size="icon" variant="ghost" disabled={chapterIndex >= totalChapters - 1} title="Next Chapter">
          <ListEnd />
        </Button>
      </div>

      {/* Book Title */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/12 md:-translate-y-1/2 max-w-[50%] text-center">
        <h1 title={title} className="text-sm truncate font-semibold">
          {title}
          {chapterTitle && <p className="text-xs text-muted-foreground truncate">{chapterTitle}</p>}
        </h1>
      </div>

      {/* Right Panel Group */}
      <div>
        {/* Toggle Side Panels */}
        <Button
          size="icon"
          variant="ghost"
          title="Toggle Side Panels"
          onClick={() => {
            onToggleToc();
            onToggleSettings();
          }}
        >
          <Fullscreen />
        </Button>
      </div>
    </header>
  );
};
