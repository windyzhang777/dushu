import { BookItemPlaceholder } from '@/components/BookItemPlaceholder';
import { cn } from '@/lib/utils';
import type { UploadingBook } from '@/services/useUpload';
import { CircleMinus } from 'lucide-react';

interface BookItemUploadingProps {
  upload: UploadingBook;
  onAbort: () => void;
}

export const BookItemUploading = ({ upload, onAbort }: BookItemUploadingProps) => {
  const title = upload.fileName.replace(/\.[^/.]+$/, ''); // Remove file extension for display

  return (
    <div
      role="status"
      aria-label={`Uploading ${upload.fileName}`}
      className="relative aspect-4/7 w-40 rounded-md overflow-hidden pt-8 pb-10 px-2 transition-all cursor-pointer group"
    >
      {/* Cover */}
      <div className="relative w-full h-full overflow-hidden">
        <BookItemPlaceholder title={title} />

        {/* Abort Overlay */}
        {(upload.status === 'uploading' || upload.status === 'error') && (
          <div
            tabIndex={0}
            onClick={onAbort}
            onKeyDown={(e) => {
              // e.stopPropagation();
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAbort();
              }
            }}
            title={`${upload.status === 'error' ? 'Remove' : 'Cancel upload'}`}
            className={cn(
              'absolute inset-0 bg-background/10 cursor-pointer',
              'flex flex-col items-center justify-center',
              'group-hover:bg-background/30 transition-bg-background',
            )}
          >
            <CircleMinus className="text-background/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {upload.status === 'uploading' && (
        <span className="absolute bottom-3.5 left-2 w-full text-[10px] text-muted-foreground flex items-center gap-1 text-left pointer-events-none">
          <span className="w-full truncate justify-start animate-pulse">{upload.progress}% uploaded</span>
        </span>
      )}

      {/* Error Indicator */}
      {upload.status === 'error' && (
        <span title={upload.error || 'Upload failed'} className="absolute bottom-0.5 left-2 text-[10px] text-destructive line-clamp-3 text-center">
          {upload.error || 'Upload failed'}
        </span>
      )}
    </div>
  );
};
