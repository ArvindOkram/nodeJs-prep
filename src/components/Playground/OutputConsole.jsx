import { useEffect, useRef } from 'react';
import styles from './Playground.module.css';

const TYPE_STYLE = {
  log:   styles.logLine,
  error: styles.errorLine,
  warn:  styles.warnLine,
  info:  styles.infoLine,
  meta:  styles.metaLine,
};

function SqlTable({ columns, values }) {
  return (
    <div className={styles.sqlTableWrap}>
      <div className={styles.sqlTableContainer}>
        <table className={styles.sqlTable}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.noRows}>No rows returned</td>
              </tr>
            ) : (
              values.map((row, ri) => (
                <tr key={ri}>
                  {row.map((val, ci) => (
                    <td key={ci}>{val === null ? <span className={styles.nullVal}>NULL</span> : String(val)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.rowCount}>{values.length} row{values.length !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function OutputConsole({ output, isRunning, editorMode }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const placeholder = editorMode === 'sql'
    ? 'Write SQL and press Ctrl+Enter to execute'
    : editorMode === 'mongodb'
    ? 'Write MongoDB queries and press Ctrl+Enter'
    : 'Press Ctrl+Enter to execute your code';

  const consoleLabel = editorMode === 'sql' ? 'Results' : 'Output';
  const consoleIcon = editorMode === 'sql' ? '\u25A4' : '\u25B8';

  return (
    <div className={styles.console}>
      <div className={styles.consoleHeader}>
        <span className={styles.consoleHeaderLabel}>
          <span className={styles.consoleIcon}>{consoleIcon}</span>
          {consoleLabel}
        </span>
        {isRunning && (
          <span className={styles.running}>
            <span className={styles.runningDot} />
            running...
          </span>
        )}
      </div>
      <div className={styles.consoleBody}>
        {output.length === 0 ? (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>{editorMode === 'sql' ? '\u25A4' : '\u25B6'}</span>
            <span className={styles.placeholderText}>{placeholder}</span>
          </div>
        ) : (
          output.map((line, i) => {
            if (line.type === 'table') {
              return <SqlTable key={i} columns={line.columns} values={line.values} />;
            }
            return (
              <div key={i} className={TYPE_STYLE[line.type] ?? styles.logLine}>
                {line.type !== 'meta' && (
                  <span className={styles.prompt}>&rsaquo;</span>
                )}
                <pre className={styles.lineText}>{line.text}</pre>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
