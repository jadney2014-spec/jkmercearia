import { fixUtf8MojibakeDeep } from './textEncoding';

const hasWindow = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const storageAvailable = () => {
  if (!hasWindow) return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const storageEnabled = storageAvailable();

const safeStorage = {
  getRaw: (key: string): string | null => {
    if (!storageEnabled) return null;
    return window.localStorage.getItem(key);
  },
  setRaw: (key: string, value: string) => {
    if (!storageEnabled) return;
    window.localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (!storageEnabled) return;
    window.localStorage.removeItem(key);
  },
  clear: () => {
    if (!storageEnabled) return;
    window.localStorage.clear();
  }
};

const storage = {
  isAvailable: () => storageEnabled,
  getString: (key: string, defaultValue: string | null = null) => {
    const raw = safeStorage.getRaw(key);
    return raw ?? defaultValue;
  },
  setString: (key: string, value: string | null | undefined) => {
    if (value === null || value === undefined) {
      safeStorage.remove(key);
      return;
    }
    safeStorage.setRaw(key, value);
  },
  getJSON: <T>(key: string, defaultValue: T | null = null): T | null => {
    const raw = safeStorage.getRaw(key);
    if (!raw) return defaultValue;

    try {
      const parsed = JSON.parse(raw) as T;
      const fixed = fixUtf8MojibakeDeep(parsed);
      try {
        if (JSON.stringify(fixed) !== JSON.stringify(parsed)) {
          safeStorage.setRaw(key, JSON.stringify(fixed));
        }
      } catch {
        // ignore
      }
      return fixed;
    } catch {
      safeStorage.remove(key);
      return defaultValue;
    }
  },
  setJSON: <T>(key: string, value: T | null | undefined) => {
    if (value === undefined) return;
    if (value === null) {
      safeStorage.remove(key);
      return;
    }
    safeStorage.setRaw(key, JSON.stringify(value));
  },
  remove: (key: string) => safeStorage.remove(key),
  clear: () => safeStorage.clear()
};

export default storage;




