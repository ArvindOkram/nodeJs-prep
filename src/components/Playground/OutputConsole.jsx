import { useEffect, useRef } from 'react';
import styles from './Playground.module.css';

const TYPE_STYLE = {
  log:   styles.logLine,
  error: styles.errorLine,
  warn:  styles.warnLine,
  info:  styles.infoLine,
  meta:  styles.metaLine,
};

export default function OutputConsole({ output, isRunning }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className={styles.console}>
      <div className={styles.consoleHeader}>
        <span>Output</span>
        {isRunning && <span className={styles.running}>● running…</span>}
      </div>
      <div className={styles.consoleBody}>
        {output.length === 0 ? (
          <span className={styles.placeholder}>
            Click ▶ Run or press Ctrl+Enter to execute
          </span>
        ) : (
          output.map((line, i) => (
            <div key={i} className={TYPE_STYLE[line.type] ?? styles.logLine}>
              {line.type !== 'meta' && (
                <span className={styles.prompt}>›</span>
              )}
              <pre className={styles.lineText}>{line.text}</pre>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
