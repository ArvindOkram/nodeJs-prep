import { useState, useCallback } from 'react';

/**
 * A useState wrapper that persists value to localStorage.
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if nothing stored
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (e) {
        console.warn(`useLocalStorage: failed to set "${key}"`, e);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
