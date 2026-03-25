/**
 * Safely runs user-provided JS code in the browser.
 * Captures console.log / console.error / console.warn output.
 * Returns { logs, error, duration }.
 */
export function runCode(code) {
  const logs = [];
  const startTime = performance.now();

  const _log   = console.log;
  const _error = console.error;
  const _warn  = console.warn;
  const _info  = console.info;

  const capture = (type) => (...args) => {
    logs.push({
      type,
      text: args
        .map((a) =>
          typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(' '),
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  console.log   = capture('log');
  console.error = capture('error');
  console.warn  = capture('warn');
  console.info  = capture('info');

  let error = null;

  try {
    // eslint-disable-next-line no-eval
    // Indirect eval runs in global scope, avoids direct-eval warnings
    (0, eval)(code);
  } catch (e) {
    error = e.message;
  } finally {
    console.log   = _log;
    console.error = _error;
    console.warn  = _warn;
    console.info  = _info;
  }

  const duration = (performance.now() - startTime).toFixed(2);
  return { logs, error, duration };
}
