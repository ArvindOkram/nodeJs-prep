import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, DEFAULT_CODE, BLANK_CODE } from '../utils/constants';
import { runCode } from '../utils/codeRunner';

/**
 * Encapsulates all playground state and logic.
 */
export function usePlayground() {
  const [isOpen, setIsOpen] = useLocalStorage(
    STORAGE_KEYS.PLAYGROUND_OPEN,
    true
  );
  const [code, setCode] = useLocalStorage(
    STORAGE_KEYS.PLAYGROUND_CODE,
    DEFAULT_CODE
  );
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), [setIsOpen]);

  const loadCode = useCallback(
    (newCode) => {
      setCode(newCode);
      setIsOpen(true);
    },
    [setCode, setIsOpen]
  );

  const run = useCallback(() => {
    setIsRunning(true);
    // Small timeout so UI can update before blocking eval
    setTimeout(() => {
      const result = runCode(code);
      const timestamp = new Date().toLocaleTimeString();
      setOutput([
        {
          type: 'meta',
          text: `▶ Run at ${timestamp} — completed in ${result.duration}ms`,
        },
        ...result.logs,
        ...(result.error
          ? [{ type: 'error', text: `✖ ${result.error}` }]
          : []),
      ]);
      setIsRunning(false);
    }, 10);
  }, [code]);

  const clearOutput = useCallback(() => setOutput([]), []);

  const clearEditor = useCallback(() => {
    setCode('');
    setOutput([]);
  }, [setCode]);

  const resetCode = useCallback(() => {
    setCode(DEFAULT_CODE);
    setOutput([]);
  }, [setCode]);

  return {
    isOpen,
    toggleOpen,
    code,
    setCode,
    loadCode,
    output,
    run,
    clearOutput,
    clearEditor,
    resetCode,
    isRunning,
  };
}
