import { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import { useAppContext } from '../../context/AppContext';
import { BLANK_CODE } from '../../utils/constants';
import OutputConsole from './OutputConsole';
import styles from './Playground.module.css';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const MODE_CONFIG = {
  javascript: { title: 'JS Playground', icon: '⌨', language: 'javascript' },
  sql:        { title: 'SQL Editor', icon: '🐘', language: 'sql' },
  mongodb:    { title: 'MongoDB Shell', icon: '🍃', language: 'javascript' },
};

export default function Playground() {
  const { playground } = useAppContext();
  const { isOpen, toggleOpen, code, setCode, output, run, clearOutput, isRunning, editorMode } = playground;

  const panelRef  = useRef(null);
  const dragRef   = useRef({ dragging: false, startX: 0, startW: 0 });
  const editorRef = useRef(null); // holds the Monaco editor instance
  const [showConfirm, setShowConfirm] = useState(false);

  const config = MODE_CONFIG[editorMode] || MODE_CONFIG.javascript;

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
    const blank = editorMode === 'sql'
      ? '-- Write your SQL here\n\n'
      : editorMode === 'mongodb'
      ? '// Write your MongoDB queries here\n\n'
      : BLANK_CODE;
    if (editorRef.current) {
      editorRef.current.setValue(blank);
    }
    setCode(blank);
    clearOutput();
    setShowConfirm(false);
  }, [setCode, clearOutput, editorMode]);

  if (!isOpen) {
    return (
      <button className={styles.collapsedTab} onClick={toggleOpen} title="Open Playground">
        <span className={styles.tabText}>{config.icon} {config.title}</span>
      </button>
    );
  }

  return (
    <aside className={styles.playground} ref={panelRef}>
      {/* Drag handle */}
      <div className={styles.dragHandle} onMouseDown={onMouseDown} title="Drag to resize" />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>{config.icon} {config.title}</span>
        <div className={styles.headerActions}>
          {editorMode === 'sql' && (
            <span className={styles.modeBadge}>SQLite</span>
          )}
          {editorMode === 'mongodb' && (
            <span className={styles.modeBadgeMongo}>Mongo</span>
          )}
          <span className={styles.hint}>Ctrl+Enter to run</span>
          <button className={styles.closeBtn} onClick={toggleOpen} title="Close">×</button>
        </div>
      </div>

      {/* Schema hint for database modes */}
      {editorMode === 'sql' && (
        <div className={styles.schemaHint}>
          Tables: <strong>employees</strong>, <strong>departments</strong>, <strong>orders</strong>, <strong>customers</strong>, <strong>products</strong>
        </div>
      )}
      {editorMode === 'mongodb' && (
        <div className={styles.schemaHintMongo}>
          Collections: <strong>db.users</strong>, <strong>db.orders</strong>, <strong>db.products</strong>
        </div>
      )}

      {/* Editor */}
      <div className={styles.editorWrap}>
        <Suspense fallback={<div className={styles.editorLoading}>Loading editor…</div>}>
          <MonacoEditor
            height="100%"
            language={config.language}
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
      <OutputConsole output={output} isRunning={isRunning} editorMode={editorMode} />
    </aside>
  );
}
