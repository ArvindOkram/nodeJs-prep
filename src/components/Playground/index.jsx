import { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BLANK_CODE } from '../../utils/constants';
import OutputConsole from './OutputConsole';
import styles from './Playground.module.css';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export default function Playground() {
  const { playground } = useAppContext();
  const { isOpen, toggleOpen, code, setCode, output, run, clearOutput, isRunning } = playground;

  const panelRef  = useRef(null);
  const dragRef   = useRef({ dragging: false, startX: 0, startW: 0 });
  const editorRef = useRef(null); // holds the Monaco editor instance
  const [showConfirm, setShowConfirm] = useState(false);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [run]);

  // Drag-to-resize on left border
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const panel = panelRef.current;
    dragRef.current = { dragging: true, startX: e.clientX, startW: panel.offsetWidth };

    const onMove = (ev) => {
      const delta = dragRef.current.startX - ev.clientX;
      const newW  = Math.min(620, Math.max(280, dragRef.current.startW + delta));
      panel.style.width = `${newW}px`;
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // Directly clear Monaco editor via instance + sync React state
  const handleConfirmClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.setValue(BLANK_CODE);
    }
    setCode(BLANK_CODE);
    clearOutput();
    setShowConfirm(false);
  }, [setCode, clearOutput]);

  if (!isOpen) {
    return (
      <button className={styles.collapsedTab} onClick={toggleOpen} title="Open Playground">
        <span className={styles.tabText}>⌨ Playground</span>
      </button>
    );
  }

  return (
    <aside className={styles.playground} ref={panelRef}>
      {/* Drag handle */}
      <div className={styles.dragHandle} onMouseDown={onMouseDown} title="Drag to resize" />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>⌨ JS Playground</span>
        <div className={styles.headerActions}>
          <span className={styles.hint}>Ctrl+Enter to run</span>
          <button className={styles.closeBtn} onClick={toggleOpen} title="Close">×</button>
        </div>
      </div>

      {/* Editor */}
      <div className={styles.editorWrap}>
        <Suspense fallback={<div className={styles.editorLoading}>Loading editor…</div>}>
          <MonacoEditor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={code}
            onMount={(editor) => { editorRef.current = editor; }}
            onChange={(val) => setCode(val ?? '')}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </Suspense>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.runBtn} onClick={run} disabled={isRunning}>
          {isRunning ? '⏳ Running…' : '▶ Run'}
        </button>
        <button
          className={styles.clearBtn}
          onClick={() => setShowConfirm(true)}
          title="Clear editor and output"
        >
          🗑 Clear
        </button>
        <button className={styles.clearOutputBtn} onClick={clearOutput} title="Clear console output only">
          ✕ Output
        </button>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmMsg}>Clear all code and output?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmYes} onClick={handleConfirmClear}>
                Yes, clear
              </button>
              <button className={styles.confirmNo} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      <OutputConsole output={output} isRunning={isRunning} />
    </aside>
  );
}
