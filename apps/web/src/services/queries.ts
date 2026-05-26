import { api } from '@/services/api';
import type { Bookmark, DocumentSummary, Highlight, Note, ReadingProgress } from '@dushu/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useUpload from './useUpload';

export const queryKeys = {
  documents: ['documents'] as const,
  document: (id: string) => ['document', id] as const,
  rendition: (id: string) => ['rendition', id] as const,
  progress: (id: string) => ['progress', id] as const,
  bookmarks: (id: string) => ['bookmarks', id] as const,
  highlights: (id: string) => ['highlights', id] as const,
  notes: (id: string) => ['notes', id] as const,
};

// ------- Upload ----------------------------------------------------------------
export function useUploadBook() {
  const queryClient = useQueryClient();
  return useUpload(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents });
  });
}

// ------- Documents ----------------------------------------------------------------
export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: () => api.document.getAll(),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => api.document.getById(id),
    enabled: !!id,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents }),
  });
}

export function useRendition(id: string) {
  return useQuery({
    queryKey: queryKeys.rendition(id),
    queryFn: () => api.document.getRendition(id),
    enabled: !!id,
  });
}

export function useProgress(id: string) {
  return useQuery({
    queryKey: queryKeys.progress(id),
    queryFn: () => api.document.getProgress(id),
    enabled: !!id,
  });
}

export function useUpdateProgress(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress: ReadingProgress) => api.document.updateProgress(id, progress),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.progress(id), data);
      queryClient.setQueryData<{ documents: DocumentSummary[]; total: number }>(
        queryKeys.documents,
        (old) =>
          old && {
            ...old,
            documents: old.documents.map((doc) => (doc.id === id ? { ...doc, progress: data.progress } : doc)),
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
