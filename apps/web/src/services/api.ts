import type { BookKind, Bookmark, DocumentSummary, Highlight, Note, ReadingProgress } from '@dushu/shared';

const BASE = 'api/document';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error || response.statusText || 'Request failed');
  }
  if (response.status === 204) return undefined as T; // for empty responses
  return response.json();
}

export const api = {
  document: {
    getAll: async () => handleResponse<{ documents: DocumentSummary[]; total: number }>(await fetch(`${BASE}/`)),
    getById: async (id: string) => handleResponse<{ document: DocumentSummary }>(await fetch(`${BASE}/${id}`)),
    delete: async (id: string) =>
      handleResponse<void>(
        await fetch(`${BASE}/${id}`, {
          method: 'DELETE',
        }),
      ),
    getRendition: async (id: string) =>
      handleResponse<{ documentId: string; kind: BookKind; rendition: unknown }>(await fetch(`${BASE}/${id}/rendition`)),
    getProgress: async (id: string) => handleResponse<{ progress: ReadingProgress | null }>(await fetch(`${BASE}/${id}/progress`)),
    updateProgress: async (id: string, progress: ReadingProgress) =>
      handleResponse<{ progress: ReadingProgress }>(
        await fetch(`${BASE}/${id}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress),
        }),
      ),
  },
  bookmarks: {
    getAll: async (id: string) => handleResponse<{ bookmarks: Bookmark[] }>(await fetch(`${BASE}/${id}/bookmarks`)),
    create: async (id: string, bookmark: Pick<Bookmark, 'label' | 'locator'>) =>
      handleResponse<{ bookmark: Bookmark }>(
        await fetch(`${BASE}/${id}/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookmark),
        }),
      ),
    delete: async (id: string, bookmarkId: string) =>
      handleResponse<void>(
        await fetch(`${BASE}/${id}/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
        }),
      ),
  },
  highlights: {
    getAll: async (id: string) => handleResponse<{ highlights: Highlight[] }>(await fetch(`${BASE}/${id}/highlights`)),
    create: async (id: string, highlight: Omit<Highlight, 'id' | 'createdAt'>) =>
      handleResponse<{ highlight: Highlight }>(
        await fetch(`${BASE}/${id}/highlights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(highlight),
        }),
      ),
    delete: async (id: string, highlightId: string) =>
      handleResponse<void>(
        await fetch(`${BASE}/${id}/highlights/${highlightId}`, {
          method: 'DELETE',
        }),
      ),
  },
  notes: {
    getAll: async (id: string) => handleResponse<{ notes: Note[] }>(await fetch(`${BASE}/${id}/notes`)),
    create: async (id: string, note: Pick<Note, 'locator' | 'content'>) =>
      handleResponse<{ note: Note }>(
        await fetch(`${BASE}/${id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        }),
      ),
    update: async (id: string, noteId: string, content: string) =>
      handleResponse<{ note: Note }>(
        await fetch(`${BASE}/${id}/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }),
      ),
    delete: async (id: string, noteId: string) =>
      handleResponse<void>(
        await fetch(`${BASE}/${id}/notes/${noteId}`, {
          method: 'DELETE',
        }),
      ),
  },
};
