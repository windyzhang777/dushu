import { BindingLine, BookItemPlaceholder } from '@/components/BookItemPlaceholder';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { titleWithAuthor, type BookSummary, type UpdateBookPayload } from '@dushu/shared';
import { BadgeCheck, CircleChevronRight, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EditBookDialog } from './EditBookDialog';

interface BookItemProps {
  doc: BookSummary;
  onClick?: () => void;
  onUpdate: (data: UpdateBookPayload) => void;
  onDelete: () => void;
}

export const BookItem = ({ doc, onClick, onUpdate, onDelete }: BookItemProps) => {
  const progress = doc.progress ? Math.round(doc.progress.lineProgress * 100) : 0;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-label={doc.title}
            onClick={onClick}
            onKeyDown={(e) => {
              // e.stopPropagation();
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }}
            title={titleWithAuthor(doc.title, doc.author)}
            className={cn(
              'relative aspect-4/7 w-40 rounded-md overflow-hidden pt-8 pb-10 px-2',
              'hover:bg-muted-foreground/10 transition-all cursor-pointer group',
            )}
          >
            {/* Cover */}
            <div className="relative w-full h-full overflow-hidden">
              {doc.coverUrl ? (
                <>
                  <img
                    src={doc.coverUrl}
                    alt={`${doc.title} cover`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-100"
                    onError={(e) => (e.currentTarget.src = '')}
                  />
                  <BindingLine />
                </>
              ) : (
                <BookItemPlaceholder title={doc.title} author={doc?.author} />
              )}
            </div>

            <BookItemInfo title={doc.title} progress={progress} completedAt={doc.completedAt} />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setEditOpen(true)}>
            <SquarePen className="size-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <EditBookDialog open={editOpen} onOpenChange={setEditOpen} doc={doc} onSubmit={onUpdate} />
    </>
  );
};

const BookItemInfo = ({ title, progress, completedAt }: { title: string; progress: number; completedAt?: string }) => {
  const base = 'absolute bottom-3.5 left-2 w-[90%] text-[10px] flex items-center gap-1 text-left pointer-events-none';

  if (completedAt) {
    return (
      <span className={cn(base, 'text-muted-foreground')}>
        <BadgeCheck strokeWidth={1} className="w-3.5 h-3.5 fill-primary stroke-background" />
        <span className="w-full truncate justify-start">{title}</span>
      </span>
    );
  }

  if (progress === 0) {
    return (
      <span className={cn(base)}>
        <CircleChevronRight strokeWidth={1} className="w-4 h-4 fill-green-600 stroke-background" />
        <span className="w-full truncate justify-start">{title}</span>
      </span>
    );
  }

  return (
    <span className={cn(base)}>
      <span
        className="flex items-center justify-center rounded-md border text-muted-foreground shrink-0 h-4 px-1 text-[8px] font-medium"
        style={{
          background: `linear-gradient(to right, var(--muted) ${progress}%, transparent ${progress}%)`,
        }}
      >
        {progress}%
      </span>
      <span className="w-full truncate justify-start">{title}</span>
    </span>
  );
};
