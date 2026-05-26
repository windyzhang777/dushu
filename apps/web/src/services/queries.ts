import { api } from '@/services/api';
import type { Bookmark, BookSummary, Highlight, Note, ReadingProgress, UpdateBookPayload } from '@dushu/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useUpload from './useUpload';

export const queryKeys = {
  books: ['books'] as const,
  book: (id: string) => ['book', id] as const,
  rendition: (id: string) => ['rendition', id] as const,
  chapter: (id: string, index: number) => ['chapter', id, index] as const,
  progress: (id: string) => ['progress', id] as const,
  bookmarks: (id: string) => ['bookmarks', id] as const,
  highlights: (id: string) => ['highlights', id] as const,
  notes: (id: string) => ['notes', id] as const,
};

// ------- Upload ----------------------------------------------------------------
export function useUploadBook() {
  const queryClient = useQueryClient();
  return useUpload(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.books });
  });
}

// ------- Books ----------------------------------------------------------------
export function useBooks() {
  return useQuery({
    queryKey: queryKeys.books,
    queryFn: () => api.book.getAll(),
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: queryKeys.book(id),
    queryFn: () => api.book.getById(id),
    enabled: !!id,
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookPayload }) => api.book.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.book(data.book.id), data);
      queryClient.setQueryData<{ books: BookSummary[]; total: number }>(
        queryKeys.books,
        (old) =>
          old && {
            ...old,
            books: old.books.map((book) => (book.id === data.book.id ? data.book : book)),
          },
      );
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.book.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.books }),
  });
}

export function useRendition(id: string) {
  return useQuery({
    queryKey: queryKeys.rendition(id),
    queryFn: () => api.book.getRendition(id),
    enabled: !!id,
  });
}

export function useChapter(id: string, index: number) {
  return useQuery({
    queryKey: queryKeys.chapter(id, index),
    queryFn: () => api.book.getChapter(id, index),
    enabled: !!id && index >= 0,
  });
}

export function useProgress(id: string) {
  return useQuery({
    queryKey: queryKeys.progress(id),
    queryFn: () => api.book.getProgress(id),
    enabled: !!id,
  });
}

export function useUpdateProgress(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress: ReadingProgress) => api.book.updateProgress(id, progress),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.progress(id), data);
      queryClient.setQueryData<{ books: BookSummary[]; total: number }>(
        queryKeys.books,
        (old) =>
          old && {
            ...old,
            books: old.books.map((book) => (book.id === id ? { ...book, progress: data.progress } : book)),
          },
      );
    },
  });
}

// ------- Bookmarks ---------------------------------------------------------------
export function useBookmarks(id: string) {
  return useQuery({
    queryKey: queryKeys.bookmarks(id),
    queryFn: () => api.bookmarks.getAll(id),
    enabled: !!id,
  });
}
export function useCreateBookmark(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmark: Pick<Bookmark, 'label' | 'locator'>) => api.bookmarks.create(id, bookmark),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(id) }),
  });
}

export function useDeleteBookmark(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId: string) => api.bookmarks.delete(id, bookmarkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks(id) }),
  });
}

// ------- Highlights ----------------------------------------------------------------
export function useHighlights(id: string) {
  return useQuery({
    queryKey: queryKeys.highlights(id),
    queryFn: () => api.highlights.getAll(id),
    enabled: !!id,
  });
}

export function useCreateHighlight(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => api.highlights.create(id, highlight),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.highlights(id) }),
  });
}

export function useDeleteHighlight(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (highlightId: string) => api.highlights.delete(id, highlightId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.highlights(id) }),
  });
}

// ------- Notes ----------------------------------------------------------------
export function useNotes(id: string) {
  return useQuery({
    queryKey: queryKeys.notes(id),
    queryFn: () => api.notes.getAll(id),
    enabled: !!id,
  });
}

export function useCreateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: Pick<Note, 'locator' | 'content'>) => api.notes.create(id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes(id) }),
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) => api.notes.update(id, noteId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes(id) }),
  });
}

export function useDeleteNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => api.notes.delete(id, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes(id) }),
  });
}
