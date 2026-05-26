import { useCallback, useRef, useState } from 'react';
import { Upload } from 'tus-js-client';

export type UploadStatus = 'uploading' | 'done' | 'error' | 'aborted';

export interface UploadingBook {
  id: string;
  fileName: string;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

export default function useUpload(onComplete?: () => void) {
  const [uploads, setUploads] = useState<UploadingBook[]>([]);
  const tusRefs = useRef<Map<string, Upload>>(new Map());

  const startUpload = useCallback(
    (file: File) => {
      const id = `${Date.now()}-${file.name}`;
      const entry: UploadingBook = {
        id,
        fileName: file.name,
        status: 'uploading',
        progress: 0,
      };
      setUploads((prev) => [entry, ...prev]);

      const tubUpload = new Upload(file, {
        endpoint: '/api/upload',
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 5 * 1024 * 1024, // 5MB
        metadata: {
          filename: file.name,
          filetype: file.type || 'application/octet-stream',
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u)));
        },
        onError: (err) => {
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u)));
        },
        onSuccess: () => {
          setUploads((prev) => prev.filter((u) => u.id !== id));
          onComplete?.();
        },
      });

      tusRefs.current.set(id, tubUpload);
      tubUpload.start();
    },
    [onComplete],
  );

  const abortUpload = useCallback((id: string) => {
    const tus = tusRefs.current.get(id);
    if (tus) {
      tus.abort();
      tusRefs.current.delete(id);
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { uploads, startUpload, abortUpload };
}
