import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored(prev => {
        const toStore = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(toStore));
        } catch {
          // ignore write errors (private mode, quota exceeded, etc.)
        }
        return toStore;
      });
    },
    [key]
  );

  return [stored, setValue] as const;
}
