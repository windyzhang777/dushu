import { useThemeContext } from '@/common/theme-provider';
import { BookItem } from '@/components/BookItem';
import { BookItemUploading } from '@/components/BookItemUploading';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';
import { useDeleteDocument, useDocuments, useUploadBook } from '@/services/queries';
import { BookOpen, CirclePlus, Library, Loader, Moon, Sun } from 'lucide-react';

export const BookLibrary = () => {
  // theme hook
  const { theme, setTheme } = useThemeContext();
  // data hook
  const { data, isLoading } = useDocuments();
  const documents = data?.documents || [];
  const deleteDocument = useDeleteDocument();
  // upload hook
  const { uploads, startUpload, abortUpload } = useUploadBook();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  if (isLoading) {
    return (
      <div aria-label="loading" className="h-full flex justify-center items-center gap-2">
        <Loader /> Loading books...
      </div>
    );
  }

  return (
    <main className={cn('h-full w-full pt-8 pb-30 px-8 md:px-20 xl:px-[20%]', 'flex flex-col gap-2', 'text-sm text-center')}>
      {/* Theme Settings */}
      <header className="text-center mb-4 flex justify-between items-center">
        <div className="grow" />
        <ButtonGroup>
          <Button size="icon" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
            <Sun strokeWidth={1.5} className="w-5! h-5!" />
          </Button>
          <Button size="icon" variant={theme === 'sepia' ? 'default' : 'outline'} onClick={() => setTheme('sepia')}>
            <Library strokeWidth={1.5} className="w-5! h-5!" />
          </Button>
          <Button size="icon" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
            <Moon strokeWidth={1.5} className="w-5! h-5!" />
          </Button>
        </ButtonGroup>
      </header>

      {/* File Upload & Scrape Controls */}
      <section className="flex justify-between items-center mb-4">
        {/* Header */}
        <h3 className="font-semibold pl-2.5">Books</h3>

        <div className="grow" />

        {/* Upload & Scrape */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center">
          {/* Upload button */}
          <label
            htmlFor="file-upload"
            title="Upload a book from local (txt, pdf, epub, mobi)"
            className={cn(
              'py-1.5 px-2.5',
              'grow flex justify-center items-center gap-1',
              'bg-transparent hover:bg-muted rounded-sm whitespace-nowrap cursor-pointer transition-colors',
            )}
          >
            <CirclePlus size={16} />
            <span className="hidden sm:inline font-medium">Upload</span>
            <input
              id="file-upload"
              aria-label="file-upload"
              type="file"
              accept=".txt,.epub,.mobi,.pdf"
              tabIndex={0}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </section>

      {/* No Books */}
      {documents.length === 0 && uploads.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 col-span-full">
          <BookOpen className="mx-auto mb-4 opacity-50" />
          <p>No books yet. Upload your first book to get started!</p>
        </div>
      )}

      {/* Book List */}
      <div className="py-2 flex flex-wrap gap-2 justify-center md:justify-start">
        {uploads.map((upload) => (
          <BookItemUploading key={upload.id} upload={upload} onAbort={() => abortUpload(upload.id)} />
        ))}
        {documents.map((doc) => (
          <BookItem key={doc.id} doc={doc} onDelete={() => deleteDocument.mutate(doc.id)} />
        ))}
      </div>
    </main>
  );
};
