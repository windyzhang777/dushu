import { DEFAULT_READER_SETTINGS, type ReaderSettings } from '@dushu/shared';
import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'dushu-reader-settings';

function getSnapshot(): ReaderSettings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_READER_SETTINGS;
  try {
    return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

let cached = getSnapshot();

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = getSnapshot();
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function getSnapshotCached() {
  return cached;
}

export default function useReaderSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshotCached);

  const updateSettings = useCallback((patch: Partial<ReaderSettings>) => {
    cached = { ...cached, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    // Force re-render for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }, []);

  const resetSettings = useCallback(() => {
    cached = DEFAULT_READER_SETTINGS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_READER_SETTINGS));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }, []);

  return { settings, updateSettings, resetSettings };
}
