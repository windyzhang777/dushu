import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { BookSummary, UpdateBookPayload } from '@dushu/shared';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: BookSummary;
  onSubmit: (data: UpdateBookPayload) => void;
}

interface EditForm {
  title: string;
  author: string;
  coverPreview?: string;
  cover?: string; // base64 data URL or '' to remove
}

export const EditBookDialog = ({ open, onOpenChange, doc, onSubmit }: EditBookDialogProps) => {
  const [form, setForm] = useState<EditForm>({
    title: doc.title,
    author: doc.author || '',
    coverPreview: doc.coverUrl,
  });
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        title: doc.title,
        author: doc.author || '',
        coverPreview: doc.coverUrl,
      });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Book Info</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input autoFocus placeholder="Author" value={form.author} onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))} />
          <div className="flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  setForm((prev) => ({ ...prev, cover: result, coverPreview: result }));
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <div
              className="cursor-pointer overflow-hidden rounded-lg border border-muted-foreground/25 hover:border-primary/50 transition-colors"
              onClick={() => coverInputRef.current?.click()}
            >
              {form.coverPreview ? (
                <img src={form.coverPreview} alt="Cover preview" className="w-auto h-16 object-cover" />
              ) : (
                <div className="w-12 h-16 bg-muted flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="size-5" />
                </div>
              )}
            </div>
            {form.coverPreview && (
              <Button
                variant="ghost"
                title="Remove Cover"
                onClick={() => setForm((prev) => ({ ...prev, coverPreview: undefined, cover: '' }))}
                className="text-muted-foreground/50 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              disabled={!form.title.trim()}
              onClick={() => {
                const data: UpdateBookPayload = {};
                if (form.title.trim() !== doc.title) data.title = form.title.trim();
                if (form.author.trim() !== (doc.author || '')) data.author = form.author.trim();
                if (form.cover !== undefined) data.cover = form.cover;
                if (Object.keys(data).length > 0) onSubmit(data);
              }}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
