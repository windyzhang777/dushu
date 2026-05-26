import { cn } from '@/lib/utils';
import type { TOCEntry } from '@dushu/shared';

interface ReaderTocPanelProps {
  chapters: TOCEntry[];
  currentChapter: number;
  onSelect: (index: number) => void;
}

export const ReaderTocPanel = ({ chapters, currentChapter, onSelect }: ReaderTocPanelProps) => {
  return (
    <div className="border-red-50 h-full w-[clamp(12rem,10vw,20rem)] bg-background border-r z-10 no-scrollbar overflow-y-auto overflow-x-hidden shadow-lg animate-in slide-in-from-left duration-200">
      <div className="flex flex-col gap-0.5">
        {chapters.map((chapter) => {
          const chapterIndex = chapter.locator.kind === 'epub' ? chapter.locator.spineIndex : 0;

          return (
            <button
              onClick={() => onSelect(chapterIndex)}
              className={cn(
                'text-left px-3 py-2 text-sm transition-colors',
                'hover:bg-muted',
                chapterIndex === currentChapter && 'bg-muted font-medium',
              )}
            >
              {chapter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
