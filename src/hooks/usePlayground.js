import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, DEFAULT_CODE, BLANK_CODE } from '../utils/constants';
import { runCode } from '../utils/codeRunner';
import { runSQL } from '../utils/sqlRunner';
import { runMongo } from '../utils/mongoRunner';

/**
 * Encapsulates all playground state and logic.
 * Supports three editor modes: 'javascript', 'sql', 'mongodb'
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
  const [editorMode, setEditorMode] = useState('javascript'); // 'javascript' | 'sql' | 'mongodb'

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), [setIsOpen]);

  const loadCode = useCallback(
    (newCode, mode = 'javascript') => {
      setCode(newCode);
      setEditorMode(mode);
      setIsOpen(true);
    },
    [setCode, setIsOpen]
  );

  const run = useCallback(() => {
    setIsRunning(true);

    if (editorMode === 'sql') {
      // SQL is async (sql.js loads WASM)
      runSQL(code).then((result) => {
        const timestamp = new Date().toLocaleTimeString();
        const logs = [];
        logs.push({
          type: 'meta',
          text: `▶ Run at ${timestamp} — completed in ${result.duration}ms`,
        });
        if (result.results.length > 0) {
          for (const res of result.results) {
            logs.push({
              type: 'table',
              columns: res.columns,
              values: res.values,
            });
          }
        } else if (!result.error) {
          logs.push({ type: 'info', text: 'Query executed successfully. No rows returned.' });
        }
        if (result.error) {
          logs.push({ type: 'error', text: `✖ ${result.error}` });
        }
        setOutput(logs);
        setIsRunning(false);
      });
    } else if (editorMode === 'mongodb') {
      setTimeout(() => {
        const result = runMongo(code);
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
    } else {
      // JavaScript mode (default)
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
    }
  }, [code, editorMode]);

  const clearOutput = useCallback(() => setOutput([]), []);

  const clearEditor = useCallback(() => {
    setCode('');
    setOutput([]);
  }, [setCode]);

  const resetCode = useCallback(() => {
    setCode(DEFAULT_CODE);
    setEditorMode('javascript');
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
    editorMode,
    setEditorMode,
  };
}
