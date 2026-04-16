export const nodejsExtras = [
  {
    id: 'repl',
    title: 'REPL',
    category: 'Fundamentals',
    starterCode: `// REPL = Read-Eval-Print-Loop
// In your terminal, just run: node
// Then type any JavaScript expression

// Simulate REPL behavior:
const readline = require ? require('readline') : null;

// REPL-like evaluation examples
const expressions = [
  '2 + 2',
  '"Hello".toUpperCase()',
  '[1,2,3].map(x => x * 2)',
  'Math.PI.toFixed(4)',
  'new Date().getFullYear()',
];

console.log('=== REPL Simulation ===');
expressions.forEach(expr => {
  try {
    const result = eval(expr);
    console.log('>', expr, '\\n→', result);
  } catch(e) {
    console.log('>', expr, '\\n→ Error:', e.message);
  }
});

// REPL special commands (type in actual Node REPL):
// .help    - Show help
// .break   - Exit multi-line mode
// .clear   - Reset context
// .exit    - Exit REPL
// .load    - Load JS from file
// .save    - Save REPL session to file

// _ refers to last evaluated value in REPL:
// > 5 + 3
// 8
// > _ * 2
// 16`,
    content: `
<h1>REPL (Read-Eval-Print-Loop)</h1>
<p>The Node.js REPL is an interactive shell for executing JavaScript code. It reads input, evaluates it, prints the result, and loops. Perfect for quick testing and debugging.</p>

<h2>Starting REPL</h2>
<pre><code># Start interactive REPL
$ node

# REPL prompt
> 2 + 2
4
> 'hello'.toUpperCase()
'HELLO'
> const arr = [1,2,3]
undefined
> arr.map(x => x * 2)
[ 2, 4, 6 ]
> .exit</code></pre>

<h2>REPL Commands</h2>
<table>
  <tr><th>Command</th><th>Description</th></tr>
  <tr><td>.help</td><td>Show all REPL commands</td></tr>
  <tr><td>.break</td><td>Exit multi-line statement (abort)</td></tr>
  <tr><td>.clear</td><td>Reset context (clear all variables)</td></tr>
  <tr><td>.exit</td><td>Exit REPL (also Ctrl+C twice or Ctrl+D)</td></tr>
  <tr><td>.load &lt;file&gt;</td><td>Load JavaScript file into REPL session</td></tr>
  <tr><td>.save &lt;file&gt;</td><td>Save REPL session history to file</td></tr>
  <tr><td>_</td><td>Special variable — last evaluated value</td></tr>
</table>

<h2>Multi-line Input</h2>
<pre><code>> function add(a, b) {
...   return a + b;
... }
undefined
> add(5, 3)
8

# Press Ctrl+C to cancel multi-line input</code></pre>

<h2>REPL with Custom Context</h2>
<pre><code>// Create a custom REPL in your app:
const repl = require('repl');

const r = repl.start({
  prompt: 'myapp > ',
  useColors: true,
});

// Add variables to REPL context
r.context.db = myDatabase;
r.context.config = appConfig;
r.context.helpers = utilityFunctions;

// Now in REPL: db.query('SELECT...')</code></pre>

<h2>Useful REPL Tips</h2>
<pre><code>// Tab completion works!
> arr.  [press Tab]
// Shows all array methods

// require() works in REPL
> const fs = require('fs')
> fs.readdirSync('.')

// Inspect objects fully
> const util = require('util')
> util.inspect(complexObj, { depth: null, colors: true })

// Run Node.js with a one-liner (-e flag)
$ node -e "console.log(process.version)"

// Execute file
$ node script.js

# Watch mode (re-run on file change)
$ node --watch script.js</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between node -e and the REPL?</div>
  <div class="qa-a">node -e "code" executes a string of code and exits — no interactive session. The REPL (just running node) starts an interactive session where you type and see results immediately. The REPL also has special commands (.help, .load, .save) and the _ variable. Use -e for scripting and automation, REPL for exploration and debugging.</div>
</div>`,
  },
  {
    id: 'npm',
    title: 'NPM & package.json',
    category: 'Modules',
    starterCode: `// package.json key fields simulation
const packageJson = {
  name: "my-node-app",
  version: "1.0.0",
  description: "Sample Node.js application",
  main: "index.js",
  type: "module",  // Enable ESM
  scripts: {
    start: "node index.js",
    dev: "nodemon index.js",
    test: "jest",
    build: "tsc",
    lint: "eslint ."
  },
  dependencies: {
    express: "^4.18.0",    // ^ = compatible: >=4.18.0 <5.0.0
    dotenv: "~16.0.0",     // ~ = patch: >=16.0.0 <16.1.0
    mongoose: "7.0.0",     // exact version
  },
  devDependencies: {
    nodemon: "^3.0.0",
    jest: "^29.0.0",
    eslint: "^8.0.0",
  },
  engines: {
    node: ">=18.0.0"
  }
};

console.log("=== Semantic Versioning ===");
const versions = [
  { spec: "^4.18.0", meaning: ">=4.18.0 <5.0.0 (compatible, minor+patch updates)" },
  { spec: "~4.18.0", meaning: ">=4.18.0 <4.19.0 (patch updates only)" },
  { spec: "4.18.0",  meaning: "exactly 4.18.0 (no updates)" },
  { spec: ">=4.0.0", meaning: "4.0.0 or higher" },
  { spec: "*",       meaning: "any version (avoid!)" },
];

versions.forEach(v => console.log(\`\${v.spec.padEnd(12)} → \${v.meaning}\`));

console.log("\\n=== npm Commands ===");
const commands = [
  ["npm install",          "Install all dependencies from package.json"],
  ["npm install express",  "Add express to dependencies"],
  ["npm install -D jest",  "Add jest to devDependencies"],
  ["npm update",           "Update packages to latest allowed by semver"],
  ["npm outdated",         "Show packages with newer versions available"],
  ["npm audit",            "Check for security vulnerabilities"],
  ["npm audit fix",        "Auto-fix vulnerabilities"],
  ["npm ls",               "List installed packages as tree"],
  ["npm run dev",          "Run 'dev' script from package.json"],
];
commands.forEach(([cmd, desc]) => console.log(\`\${cmd.padEnd(25)} - \${desc}\`));`,
    content: `
<h1>NPM &amp; package.json</h1>

<h2>What is package.json?</h2>
<p>The metadata file for every Node.js project. It tracks dependencies, scripts, project info, and configuration. Created with <code>npm init</code> or <code>npm init -y</code>.</p>

<h2>Key Fields</h2>
<pre><code>{
  "name": "my-app",             // lowercase, URL-safe
  "version": "1.2.3",           // major.minor.patch (semver)
  "description": "...",
  "main": "index.js",           // entry point for require()
  "type": "module",             // "module" for ESM, omit for CJS
  "scripts": {
    "start":  "node index.js",
    "dev":    "nodemon --watch src src/index.js",
    "test":   "jest --coverage",
    "build":  "tsc",
    "lint":   "eslint src --fix"
  },
  "dependencies": {             // needed in production
    "express": "^4.18.0"
  },
  "devDependencies": {          // only needed for development
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  },
  "engines": {
    "node": ">=18.0.0"          // minimum Node.js version
  },
  "private": true               // prevents accidental npm publish
}</code></pre>

<h2>Semantic Versioning (SemVer)</h2>
<pre><code>// Format: MAJOR.MINOR.PATCH
// 1.4.2
// │ │ └── PATCH: bug fixes, backward compatible
// │ └──── MINOR: new features, backward compatible
// └────── MAJOR: breaking changes

// Version specifiers in package.json:
"^4.18.0"  // Compatible: >=4.18.0 <5.0.0 (most common)
"~4.18.0"  // Approximate: >=4.18.0 <4.19.0 (patch only)
"4.18.0"   // Exact version (no updates)
">=4.0.0"  // Range
"*"        // Any (avoid in production!)
"latest"   // Latest published version</code></pre>

<h2>package-lock.json</h2>
<p>Auto-generated file that locks the exact version of every installed package (including deep/transitive dependencies). Always commit it to version control — ensures every developer and CI environment gets identical installs.</p>
<pre><code># Install exact versions from lock file (CI/production)
npm ci

# Install and update lock file (development)
npm install</code></pre>

<h2>Common NPM Commands</h2>
<table>
  <tr><th>Command</th><th>Description</th></tr>
  <tr><td>npm init -y</td><td>Create package.json with defaults</td></tr>
  <tr><td>npm install</td><td>Install all deps from package.json</td></tr>
  <tr><td>npm install express</td><td>Add to dependencies</td></tr>
  <tr><td>npm install -D nodemon</td><td>Add to devDependencies</td></tr>
  <tr><td>npm uninstall express</td><td>Remove package</td></tr>
  <tr><td>npm update</td><td>Update packages (respects semver)</td></tr>
  <tr><td>npm outdated</td><td>Show available updates</td></tr>
  <tr><td>npm audit</td><td>Check security vulnerabilities</td></tr>
  <tr><td>npm audit fix</td><td>Auto-fix vulnerabilities</td></tr>
  <tr><td>npm ci</td><td>Clean install (for CI/CD)</td></tr>
  <tr><td>npm run &lt;script&gt;</td><td>Run a custom script</td></tr>
  <tr><td>npm list</td><td>List installed packages</td></tr>
  <tr><td>npx &lt;package&gt;</td><td>Run package without installing</td></tr>
</table>

<h2>Dependencies vs devDependencies</h2>
<table>
  <tr><th></th><th>dependencies</th><th>devDependencies</th></tr>
  <tr><td>Purpose</td><td>Runtime — needed in production</td><td>Development only — build, test, lint</td></tr>
  <tr><td>Examples</td><td>express, mongoose, axios</td><td>jest, eslint, nodemon, typescript</td></tr>
  <tr><td>Install</td><td>npm install express</td><td>npm install -D jest</td></tr>
  <tr><td>In production</td><td>npm install --omit=dev to skip devDeps</td><td>Omitted with --production flag</td></tr>
</table>

<h2>NPM Scripts</h2>
<pre><code>// package.json scripts run in node_modules/.bin context
{
  "scripts": {
    "start":     "node dist/index.js",
    "dev":       "ts-node src/index.ts",  // ts-node from node_modules
    "build":     "tsc && npm run copy-assets",
    "test":      "jest --watch",
    "test:ci":   "jest --ci --coverage",
    "lint":      "eslint src/**/*.ts",
    "lint:fix":  "eslint src/**/*.ts --fix",
    "prestart":  "npm run build",    // runs BEFORE 'start' automatically
    "posttest":  "npm run lint"      // runs AFTER 'test' automatically
  }
}

// Run: npm run dev
// Chain: npm run build && npm start
// Pass args: npm run test -- --testNamePattern="auth"</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between npm install and npm ci?</div>
  <div class="qa-a">npm install reads package.json and updates package-lock.json if needed — good for development. npm ci (clean install) requires a package-lock.json, deletes node_modules first, then installs EXACTLY what's in the lock file without any updates — designed for CI/CD pipelines and production deployments. npm ci is faster and ensures reproducible builds. Never use npm install in CI if you want deterministic results — always use npm ci.</div>
</div>`,
  },
  {
    id: 'path-module',
    title: 'Path Module',
    category: 'Core',
    starterCode: `// Node.js Path Module
// Provides utilities for working with file and directory paths

const path = require ? require('path') : {
  // Browser simulation
  join: (...parts) => parts.join('/').replace(/\/+/g, '/'),
  resolve: (...parts) => '/' + parts.join('/').replace(/\/+/g, '/'),
  basename: (p, ext) => {
    const base = p.split('/').pop();
    return ext ? base.replace(ext, '') : base;
  },
  dirname: (p) => p.split('/').slice(0, -1).join('/') || '.',
  extname: (p) => { const m = p.match(/\.[^.]+$/); return m ? m[0] : ''; },
  sep: '/',
};

// Simulate __filename and __dirname
const __filename = '/Users/dev/project/src/utils/helper.js';
const __dirname  = '/Users/dev/project/src/utils';

console.log('=== Path Information ===');
console.log('__filename:', __filename);
console.log('__dirname: ', __dirname);

console.log('\\n=== path methods ===');
console.log('basename:', path.basename(__filename));           // helper.js
console.log('basename(no ext):', path.basename(__filename, '.js')); // helper
console.log('dirname:', path.dirname(__filename));             // .../utils
console.log('extname:', path.extname(__filename));             // .js

console.log('\\n=== path.join (concatenate) ===');
console.log(path.join('/users', 'alice', 'docs', '..', 'photos'));
// /users/alice/photos — normalizes the ..

console.log('\\n=== path.resolve (absolute path) ===');
console.log(path.resolve('src', 'components', 'App.jsx'));
// Builds absolute path from current working directory

console.log('\\n=== Cross-platform ===');
console.log('Separator:', path.sep);  // / on Unix, \\ on Windows
// Always use path.join instead of string concatenation!`,
    content: `
<h1>Path Module</h1>
<p>Built-in module providing utilities for working with file and directory paths in a cross-platform way (handles Windows backslashes vs Unix forward slashes automatically).</p>

<h2>Import</h2>
<pre><code>const path = require('path');          // CommonJS
import path from 'path';               // ESM
import { join, resolve } from 'path';  // named imports</code></pre>

<h2>Core Methods</h2>
<table>
  <tr><th>Method</th><th>Description</th><th>Example</th></tr>
  <tr><td>path.join(...parts)</td><td>Join segments, normalize result</td><td>join('a', 'b', '../c') → 'a/c'</td></tr>
  <tr><td>path.resolve(...parts)</td><td>Absolute path from cwd</td><td>resolve('src', 'index.js') → '/proj/src/index.js'</td></tr>
  <tr><td>path.basename(p, ext?)</td><td>Last portion of path</td><td>basename('/foo/bar.js') → 'bar.js'</td></tr>
  <tr><td>path.dirname(p)</td><td>Directory name</td><td>dirname('/foo/bar.js') → '/foo'</td></tr>
  <tr><td>path.extname(p)</td><td>File extension</td><td>extname('file.txt') → '.txt'</td></tr>
  <tr><td>path.parse(p)</td><td>Parse path into object</td><td>{ root, dir, base, name, ext }</td></tr>
  <tr><td>path.format(obj)</td><td>Build path from object</td><td>Inverse of parse()</td></tr>
  <tr><td>path.normalize(p)</td><td>Normalize slashes and ..</td><td>normalize('a//b/../c') → 'a/c'</td></tr>
  <tr><td>path.isAbsolute(p)</td><td>Check if path is absolute</td><td>isAbsolute('/foo') → true</td></tr>
  <tr><td>path.relative(from, to)</td><td>Relative path between two paths</td><td>relative('/a/b', '/a/c') → '../c'</td></tr>
</table>

<h2>join vs resolve</h2>
<pre><code>const path = require('path');

// path.join — concatenates and normalizes (relative to nothing)
path.join('/foo', 'bar', '..', 'baz');  // '/foo/baz'
path.join('foo', 'bar');                // 'foo/bar' (relative!)

// path.resolve — builds absolute path, processes from right
// If a segment starts with /, resets to that absolute path
path.resolve('/foo', 'bar');            // '/foo/bar'
path.resolve('/foo', '/bar', 'baz');    // '/bar/baz' (reset at /bar)
path.resolve('foo', 'bar');             // '/current/dir/foo/bar'

// Best practice: always use path.join for combining paths
const filePath = path.join(__dirname, '..', 'public', 'index.html');</code></pre>

<h2>path.parse() &amp; path.format()</h2>
<pre><code>path.parse('/home/user/file.txt');
// {
//   root: '/',
//   dir: '/home/user',
//   base: 'file.txt',
//   name: 'file',
//   ext: '.txt'
// }

path.format({
  dir: '/home/user',
  name: 'file',
  ext: '.txt'
});
// '/home/user/file.txt'</code></pre>

<h2>Common Patterns</h2>
<pre><code>const path = require('path');

// Get directory of current file
const dir = __dirname;                              // CJS
const dir = path.dirname(new URL(import.meta.url).pathname);  // ESM

// Navigate relative to current file
const configPath = path.join(__dirname, '../config/app.json');
const publicDir  = path.resolve(__dirname, '../../public');

// Check extension
const ext = path.extname('photo.jpg');  // '.jpg'
const isImage = ['.jpg', '.png', '.gif'].includes(ext);

// Change extension
const { dir, name } = path.parse('input.txt');
const outputPath = path.format({ dir, name, ext: '.json' });  // 'input.json'

// Cross-platform path conversion
const urlPath = filePath.split(path.sep).join('/');  // Windows to URL</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Why use path.join instead of string concatenation?</div>
  <div class="qa-a">path.join handles: (1) Cross-platform separators — uses backslash on Windows, forward slash on Unix, (2) Normalizes multiple slashes (a//b → a/b), (3) Resolves . and .. segments, (4) Handles edge cases like empty strings. String concatenation 'dir' + '/' + 'file' will break on Windows (should be \\) and doesn't handle double slashes or parent directory references. Always use path.join or path.resolve for file paths.</div>
</div>`,
  },
  {
    id: 'event-emitter',
    title: 'EventEmitter',
    category: 'Core',
    starterCode: `// Node.js EventEmitter
const EventEmitter = require ? require('events') : class EventEmitter {
  constructor() { this._events = {}; }
  on(e, fn) { (this._events[e] ??= []).push(fn); return this; }
  once(e, fn) {
    const w = (...a) => { fn(...a); this.off(e, w); };
    return this.on(e, w);
  }
  off(e, fn) {
    this._events[e] = (this._events[e]||[]).filter(f=>f!==fn);
    return this;
  }
  emit(e, ...a) { (this._events[e]||[]).forEach(f=>f(...a)); return this; }
  listenerCount(e) { return (this._events[e]||[]).length; }
};

// 1. Basic EventEmitter usage
const emitter = new EventEmitter();

emitter.on('data', (chunk) => console.log('Received:', chunk));
emitter.on('data', (chunk) => console.log('Also received:', chunk.length, 'chars'));
emitter.once('connect', () => console.log('Connected! (fires only once)'));

emitter.emit('connect', '192.168.1.1');
emitter.emit('connect', '10.0.0.1');  // silent — once already fired
emitter.emit('data', 'Hello World');

// 2. Custom EventEmitter class
class Logger extends EventEmitter {
  log(level, message) {
    const entry = { level, message, timestamp: new Date().toISOString() };
    this.emit('log', entry);
    this.emit(level, entry); // specific level event
    return this;
  }
}

const logger = new Logger();
logger.on('log', ({ level, message }) =>
  console.log(\`[\${level.toUpperCase()}] \${message}\`));
logger.on('error', ({ message }) =>
  console.log('🚨 Alert! Error detected:', message));

logger
  .log('info', 'Server started')
  .log('error', 'Database connection failed')
  .log('info', 'Retrying...');`,
    content: `
<h1>EventEmitter</h1>
<p>EventEmitter is Node.js's built-in event system. It provides a publish-subscribe pattern enabling loosely coupled, event-driven architecture. Many Node.js core modules (streams, HTTP server, process) extend EventEmitter.</p>

<h2>Core API</h2>
<pre><code>const EventEmitter = require('events');
const emitter = new EventEmitter();

// Register listener
emitter.on('event', callback);         // persistent
emitter.once('event', callback);       // fires once, auto-removes
emitter.addListener('event', cb);      // alias for .on()

// Remove listener
emitter.off('event', callback);        // remove specific listener
emitter.removeListener('event', cb);   // alias for .off()
emitter.removeAllListeners('event');   // remove all for event
emitter.removeAllListeners();          // remove all listeners

// Emit event
emitter.emit('event', arg1, arg2);

// Introspection
emitter.listenerCount('event');        // number of listeners
emitter.listeners('event');            // array of listener fns
emitter.eventNames();                  // all registered events

// Limit (default 10, warning if exceeded)
emitter.setMaxListeners(20);</code></pre>

<h2>Custom EventEmitter Class</h2>
<pre><code>class Store extends EventEmitter {
  constructor() {
    super();
    this._state = {};
  }

  setState(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    this.emit('change', { key, value, oldValue });
    this.emit(\`change:\${key}\`, value, oldValue);  // namespaced event
  }

  getState(key) { return this._state[key]; }
}

const store = new Store();

// Listen to all changes
store.on('change', ({ key, value }) => {
  console.log(\`State changed: \${key} = \${JSON.stringify(value)}\`);
});

// Listen to specific key changes
store.on('change:user', (newVal, oldVal) => {
  console.log('User changed from', oldVal, 'to', newVal);
});

store.setState('user', 'Alice');
store.setState('count', 42);</code></pre>

<h2>Error Events</h2>
<pre><code>// IMPORTANT: 'error' event is special in Node.js
// If emitted with no listener, it throws and crashes the process!

const emitter = new EventEmitter();

// Always handle 'error' events
emitter.on('error', (err) => {
  console.error('Handled error:', err.message);
});

emitter.emit('error', new Error('Something went wrong'));
// Without the listener above: uncaught exception → crash!</code></pre>

<h2>Event Patterns</h2>
<pre><code>// Pattern 1: Stream-like data processing
class DataProcessor extends EventEmitter {
  process(data) {
    this.emit('start', data.length);

    data.forEach((item, i) => {
      const result = transform(item);
      this.emit('data', result);
      this.emit('progress', (i + 1) / data.length);
    });

    this.emit('end');
  }
}

const processor = new DataProcessor();
processor.on('progress', (pct) => console.log(\`\${(pct*100).toFixed(0)}%\`));
processor.on('end', () => console.log('Done!'));
processor.process(largeDataset);

// Pattern 2: Promise wrapping
function waitForEvent(emitter, event) {
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    emitter.once('error', reject);
  });
}

// Pattern 3: Events module helper
const { once } = require('events');
await once(emitter, 'ready');  // await a single event</code></pre>

<h2>EventEmitter in Node.js Core</h2>
<table>
  <tr><th>Module</th><th>Inherits EventEmitter</th><th>Key Events</th></tr>
  <tr><td>fs.ReadStream</td><td>Yes (via Stream)</td><td>data, end, error, close</td></tr>
  <tr><td>http.Server</td><td>Yes</td><td>request, listening, close, error</td></tr>
  <tr><td>net.Socket</td><td>Yes</td><td>data, connect, close, error</td></tr>
  <tr><td>process</td><td>Yes</td><td>exit, uncaughtException, SIGTERM</td></tr>
  <tr><td>child_process</td><td>Yes</td><td>message, close, error</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between .on() and .once()?</div>
  <div class="qa-a">.on() registers a persistent listener that fires every time the event is emitted. .once() registers a one-time listener that automatically removes itself after firing once. Use .once() for: initialization events (server 'listening'), one-time callbacks, preventing duplicate handlers. Internally, .once() wraps the callback in a wrapper that calls removeListener before invoking the original callback.</div>
</div>`,
  },
  {
    id: 'http-module',
    title: 'HTTP Module',
    category: 'Web',
    starterCode: `// Node.js HTTP Module
// createServer without Express

const http = require ? require('http') : null;

// Simulate HTTP request/response handling
function simulateServer(method, url, body = null) {
  const routes = {
    'GET /': () => ({ status: 200, body: { message: 'Welcome to Node.js API' } }),
    'GET /users': () => ({ status: 200, body: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]}),
    'POST /users': (data) => ({
      status: 201,
      body: { id: Date.now(), ...data, createdAt: new Date().toISOString() }
    }),
  };

  const key = \`\${method} \${url}\`;
  const handler = routes[key];

  if (!handler) {
    return { status: 404, body: { error: 'Route not found' } };
  }

  return handler(body);
}

// Test the simulated server
const tests = [
  { method: 'GET', url: '/' },
  { method: 'GET', url: '/users' },
  { method: 'POST', url: '/users', body: { name: 'Carol', email: 'carol@example.com' } },
  { method: 'DELETE', url: '/unknown' },
];

tests.forEach(({ method, url, body }) => {
  const { status, body: responseBody } = simulateServer(method, url, body);
  console.log(\`\${method} \${url} → \${status}\`);
  console.log('Response:', JSON.stringify(responseBody, null, 2));
  console.log('---');
});`,
    content: `
<h1>HTTP Module</h1>
<p>Node.js's built-in <code>http</code> module allows creating web servers and making HTTP requests without any third-party libraries. Express.js and other frameworks are built on top of it.</p>

<h2>Creating an HTTP Server</h2>
<pre><code>const http = require('http');

const server = http.createServer((req, res) => {
  // req = IncomingMessage (Readable stream)
  // res = ServerResponse (Writable stream)

  const { method, url, headers } = req;

  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Powered-By', 'Node.js');

  // Routing
  if (method === 'GET' && url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Hello World' }));
  } else if (method === 'GET' && url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});</code></pre>

<h2>Reading Request Body (POST data)</h2>
<pre><code>const http = require('http');

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/data') {
    // Body comes in chunks (stream)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: body }));
    return;
  }
  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(3000);</code></pre>

<h2>HTTP Status Codes</h2>
<table>
  <tr><th>Code</th><th>Meaning</th><th>Usage</th></tr>
  <tr><td>200 OK</td><td>Success</td><td>GET, PUT success</td></tr>
  <tr><td>201 Created</td><td>Resource created</td><td>POST success</td></tr>
  <tr><td>204 No Content</td><td>Success, no body</td><td>DELETE success</td></tr>
  <tr><td>301/302</td><td>Redirect</td><td>Moved/Found</td></tr>
  <tr><td>400 Bad Request</td><td>Invalid request</td><td>Validation error</td></tr>
  <tr><td>401 Unauthorized</td><td>Auth required</td><td>No/invalid token</td></tr>
  <tr><td>403 Forbidden</td><td>Auth ok, no permission</td><td>Insufficient role</td></tr>
  <tr><td>404 Not Found</td><td>Resource missing</td><td>Unknown route/id</td></tr>
  <tr><td>409 Conflict</td><td>State conflict</td><td>Duplicate email</td></tr>
  <tr><td>422 Unprocessable</td><td>Validation error</td><td>Invalid data format</td></tr>
  <tr><td>429 Too Many Requests</td><td>Rate limited</td><td>Rate limiting</td></tr>
  <tr><td>500 Internal Error</td><td>Server error</td><td>Uncaught exceptions</td></tr>
  <tr><td>503 Service Unavailable</td><td>Server down</td><td>Maintenance mode</td></tr>
</table>

<h2>Making HTTP Requests (http.request)</h2>
<pre><code>const https = require('https');

// Using https module directly
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

// Better: use fetch (available from Node.js 18+)
const data = await fetch('https://api.example.com/users');
const users = await data.json();</code></pre>

<h2>HTTP vs HTTPS vs HTTP/2</h2>
<pre><code>// HTTP/2 with Node.js (much faster — multiplexing, header compression)
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, (req, res) => {
  res.end('Hello HTTP/2!');
});

server.listen(443);</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between res.write() and res.end()?</div>
  <div class="qa-a">res.write(data) writes a chunk to the response stream but keeps the connection open — you can call it multiple times for streaming responses. res.end(data?) sends the final chunk (optional) and signals the end of the response — closing the connection. For simple responses, res.end(data) is sufficient. For streaming (large files, server-sent events), use multiple res.write() calls followed by res.end().</div>
</div>`,
  },
  {
    id: 'express-guide',
    title: 'Express.js Guide',
    category: 'Web',
    starterCode: `// Express.js - The de facto Node.js web framework

// Simulating Express middleware and routing
function createApp() {
  const middlewares = [];
  const routes = { GET: {}, POST: {}, PUT: {}, DELETE: {} };

  const app = {
    use: (fn) => middlewares.push(fn),
    get: (path, fn) => routes.GET[path] = fn,
    post: (path, fn) => routes.POST[path] = fn,

    handle: function(method, path, body = null) {
      const req = { method, path, body, params: {}, query: {} };
      const res = {
        _status: 200, _body: null,
        status(code) { this._status = code; return this; },
        json(data) { this._body = data; return this; },
        send(data) { this._body = data; return this; },
      };

      let idx = 0;
      const next = () => {
        if (idx < middlewares.length) {
          middlewares[idx++](req, res, next);
        } else {
          const handler = routes[method]?.[path];
          if (handler) handler(req, res, next);
          else res.status(404).json({ error: 'Not Found' });
        }
      };
      next();
      return { status: res._status, body: res._body };
    }
  };
  return app;
}

const app = createApp();

// Logger middleware
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.path}\`);
  next();
});

// Auth middleware
app.use((req, res, next) => {
  req.user = { id: 1, role: 'admin' }; // simulate auth
  next();
});

// Routes
app.get('/', (req, res) => res.json({ msg: 'Home', user: req.user }));
app.get('/users', (req, res) => res.json([{ id: 1, name: 'Alice' }]));
app.post('/users', (req, res) => res.status(201).json({ created: req.body }));

// Test
console.log(app.handle('GET', '/'));
console.log(app.handle('GET', '/users'));
console.log(app.handle('POST', '/users', { name: 'Bob' }));
console.log(app.handle('GET', '/unknown'));`,
    content: `
<h1>Express.js Guide</h1>
<p>Express is a minimal, unopinionated web framework for Node.js. It wraps Node's http module with routing, middleware, and convenience methods.</p>

<h2>Basic Setup</h2>
<pre><code>const express = require('express');
const app = express();

// Built-in middleware
app.use(express.json());                // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.static('public'));      // serve static files

app.listen(3000, () => console.log('Server on port 3000'));</code></pre>

<h2>Routing</h2>
<pre><code>// Method + path
app.get('/users', (req, res) => { ... });
app.post('/users', (req, res) => { ... });
app.put('/users/:id', (req, res) => { ... });
app.delete('/users/:id', (req, res) => { ... });
app.patch('/users/:id', (req, res) => { ... });

// Route parameters
app.get('/users/:id', (req, res) => {
  const { id } = req.params;   // /users/42 → id = '42'
  res.json({ id: parseInt(id) });
});

// Query strings
app.get('/search', (req, res) => {
  const { q, limit = 10, page = 1 } = req.query;
  // /search?q=node&limit=5 → q='node', limit='5'
  res.json({ query: q, limit: +limit, page: +page });
});

// Router — organize routes in separate files
const userRouter = express.Router();
userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);
app.use('/users', userRouter);  // prefix all routes with /users</code></pre>

<h2>Middleware</h2>
<p>Middleware functions have access to req, res, and next(). They execute in the order they're registered.</p>
<pre><code>// Application-level middleware (all routes)
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // MUST call next() or the request hangs!
});

// Route-specific middleware
app.get('/admin', authMiddleware, roleCheck('admin'), handler);

// Built-in: express.json(), express.static()
// Popular: cors, helmet, morgan, express-rate-limit

// Error-handling middleware (4 params — MUST have all 4)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});</code></pre>

<h2>Request &amp; Response Objects</h2>
<pre><code>// Common req properties
req.params     // route parameters (:id)
req.query      // query string (?key=val)
req.body       // request body (need express.json() middleware)
req.headers    // request headers
req.method     // HTTP method
req.url        // full URL
req.ip         // client IP
req.cookies    // cookies (need cookie-parser)

// Common res methods
res.json(obj)              // send JSON + Content-Type header
res.send(data)             // send string/buffer/object
res.status(code)           // set status code (chainable)
res.setHeader(key, val)    // set response header
res.redirect(url)          // 302 redirect
res.redirect(301, url)     // permanent redirect
res.sendFile(path)         // send a file
res.download(path)         // trigger file download</code></pre>

<h2>Error Handling Pattern</h2>
<pre><code>// Wrapper to catch async errors
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// Global error handler (last middleware)
app.use((err, req, res, next) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    console.error('UNEXPECTED:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is middleware and what are the types in Express?</div>
  <div class="qa-a">Middleware is a function with (req, res, next) that processes requests in the pipeline. Types: (1) Application-level — app.use(), runs for all routes, (2) Router-level — router.use(), scoped to router, (3) Route-specific — app.get('/path', middleware, handler), (4) Error-handling — (err, req, res, next), must have 4 params, (5) Built-in — express.json(), express.urlencoded(), express.static(), (6) Third-party — cors, helmet, morgan. Always call next() unless sending a response, or the request hangs indefinitely.</div>
</div>`,
  },
  {
    id: 'rest-api',
    title: 'REST API Design',
    category: 'Web',
    starterCode: `// REST API Design Principles & Patterns

// Simulate a RESTful User API
const db = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-01' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user', createdAt: '2024-01-02' },
    { id: 3, name: 'Carol', email: 'carol@example.com', role: 'user', createdAt: '2024-01-03' },
  ]
};

// REST principles: Resources + HTTP Methods + Proper Status Codes

const api = {
  // GET /users?page=1&limit=10&role=admin
  getUsers({ page = 1, limit = 10, role } = {}) {
    let results = [...db.users];
    if (role) results = results.filter(u => u.role === role);
    const start = (page - 1) * limit;
    return {
      status: 200,
      data: results.slice(start, start + limit),
      meta: { total: results.length, page, limit, pages: Math.ceil(results.length / limit) }
    };
  },

  // GET /users/:id
  getUser(id) {
    const user = db.users.find(u => u.id === parseInt(id));
    if (!user) return { status: 404, error: { message: 'User not found', code: 'USER_NOT_FOUND' } };
    return { status: 200, data: user };
  },

  // POST /users
  createUser({ name, email, role = 'user' }) {
    if (!name || !email) return { status: 400, error: { message: 'name and email required' } };
    if (db.users.find(u => u.email === email))
      return { status: 409, error: { message: 'Email already exists' } };
    const user = { id: Date.now(), name, email, role, createdAt: new Date().toISOString() };
    db.users.push(user);
    return { status: 201, data: user };
  },

  // PATCH /users/:id
  updateUser(id, updates) {
    const idx = db.users.findIndex(u => u.id === parseInt(id));
    if (idx === -1) return { status: 404, error: { message: 'User not found' } };
    db.users[idx] = { ...db.users[idx], ...updates, id: db.users[idx].id };
    return { status: 200, data: db.users[idx] };
  },

  // DELETE /users/:id
  deleteUser(id) {
    const idx = db.users.findIndex(u => u.id === parseInt(id));
    if (idx === -1) return { status: 404, error: { message: 'User not found' } };
    db.users.splice(idx, 1);
    return { status: 204 };
  }
};

console.log('GET /users:', JSON.stringify(api.getUsers(), null, 2));
console.log('GET /users/1:', api.getUser(1));
console.log('POST /users:', api.createUser({ name: 'Dave', email: 'dave@example.com' }));
console.log('PATCH /users/1:', api.updateUser(1, { role: 'superadmin' }));
console.log('DELETE /users/99:', api.deleteUser(99));`,
    content: `
<h1>REST API Design</h1>
<p>REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use HTTP methods and standard conventions to create predictable, scalable interfaces.</p>

<h2>REST Principles</h2>
<table>
  <tr><th>Principle</th><th>Description</th></tr>
  <tr><td>Stateless</td><td>Each request must contain all information needed — server stores no session state</td></tr>
  <tr><td>Client-Server</td><td>Client and server are independent — communicate only via API</td></tr>
  <tr><td>Uniform Interface</td><td>Standard HTTP methods, resource URLs, status codes</td></tr>
  <tr><td>Resource-Based</td><td>Everything is a resource identified by URL (/users/42)</td></tr>
  <tr><td>Cacheable</td><td>Responses should indicate if they can be cached</td></tr>
  <tr><td>Layered System</td><td>Client can't tell if connected to server directly or through proxy</td></tr>
</table>

<h2>HTTP Methods &amp; Resource Operations</h2>
<table>
  <tr><th>Method</th><th>URL</th><th>Action</th><th>Status Codes</th></tr>
  <tr><td>GET</td><td>/users</td><td>List all users</td><td>200</td></tr>
  <tr><td>GET</td><td>/users/:id</td><td>Get single user</td><td>200, 404</td></tr>
  <tr><td>POST</td><td>/users</td><td>Create user</td><td>201, 400, 409</td></tr>
  <tr><td>PUT</td><td>/users/:id</td><td>Replace user (full update)</td><td>200, 404</td></tr>
  <tr><td>PATCH</td><td>/users/:id</td><td>Partial update</td><td>200, 404</td></tr>
  <tr><td>DELETE</td><td>/users/:id</td><td>Delete user</td><td>204, 404</td></tr>
</table>

<h2>URL Design Best Practices</h2>
<pre><code>// ✅ Good URL design
GET    /users                     // collection
GET    /users/42                  // single resource
GET    /users/42/orders           // nested resource
GET    /users?role=admin&page=2   // filtering, pagination
POST   /users                     // create
PATCH  /users/42                  // partial update
DELETE /users/42                  // delete

// ❌ Avoid — not RESTful
GET /getUsers
POST /createUser
GET /user/delete/42
POST /users/42/update
/Users        // case sensitive — use lowercase
/user_posts   // use hyphens or nesting: /users/:id/posts</code></pre>

<h2>Response Structure</h2>
<pre><code>// ✅ Consistent response envelope
// Success (200/201)
{
  "data": { "id": 1, "name": "Alice" },  // or array for lists
  "meta": {                               // optional metadata
    "total": 100,
    "page": 1,
    "limit": 10
  }
}

// Error (4xx/5xx)
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",             // machine-readable code
    "field": "email"                      // for validation errors
  }
}

// List with pagination
{
  "data": [...],
  "meta": {
    "total": 1543,
    "page": 2,
    "limit": 20,
    "pages": 78,
    "nextPage": 3,
    "prevPage": 1
  }
}</code></pre>

<h2>Idempotency</h2>
<table>
  <tr><th>Method</th><th>Safe?</th><th>Idempotent?</th><th>Description</th></tr>
  <tr><td>GET</td><td>Yes</td><td>Yes</td><td>No side effects, same result always</td></tr>
  <tr><td>HEAD</td><td>Yes</td><td>Yes</td><td>GET without body</td></tr>
  <tr><td>OPTIONS</td><td>Yes</td><td>Yes</td><td>Discover capabilities</td></tr>
  <tr><td>DELETE</td><td>No</td><td>Yes</td><td>Delete once or twice — resource gone either way</td></tr>
  <tr><td>PUT</td><td>No</td><td>Yes</td><td>Same PUT repeated = same state</td></tr>
  <tr><td>PATCH</td><td>No</td><td>Maybe</td><td>Depends on operation (set vs increment)</td></tr>
  <tr><td>POST</td><td>No</td><td>No</td><td>Creates new resource each call</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between PUT and PATCH?</div>
  <div class="qa-a">PUT replaces the entire resource with the provided data — fields not included are removed or reset to defaults. PATCH partially updates a resource — only the specified fields are changed. PUT is idempotent: the same PUT request always produces the same state. PATCH may or may not be idempotent (PATCH to set a value is idempotent; PATCH to increment a counter is not). Use PUT for complete replacement, PATCH for partial updates (much more common).</div>
</div>`,
  },
  {
    id: 'nodejs-how',
    title: 'How Node.js Works',
    category: 'Fundamentals',
    starterCode: `// How Node.js Works: Architecture Demo

// Node.js Internal Components:
// 1. V8 Engine — executes JavaScript
// 2. libuv — event loop, async I/O, thread pool
// 3. Node.js Bindings (C++) — bridge between JS and libuv
// 4. Core Modules — fs, http, crypto, etc.

console.log('=== Node.js Architecture Demo ===\\n');

// The Call Stack (synchronous execution)
function c() { return 'c result'; }
function b() { return c(); }
function a() { return b(); }

console.log('Call Stack: a() → b() → c()');
console.log('Result:', a());

// Demonstrate event loop phases
console.log('\\n=== Event Loop Phase Order ===');
console.log('Phase 1 - Sync (immediate)');

// Microtasks (run between EVERY event loop phase)
Promise.resolve().then(() => console.log('Phase 3 - Promise microtask'));
queueMicrotask(() => console.log('Phase 3 - queueMicrotask'));

// Timer phase (Phase 2 in our demo)
setTimeout(() => console.log('Phase 4 - setTimeout (Timer phase)'), 0);
setTimeout(() => console.log('Phase 4 - setTimeout #2'), 0);

// Check phase (setImmediate runs after I/O, in Check phase)
// setImmediate(() => console.log('Phase 5 - setImmediate (Check phase)'));

console.log('Phase 2 - Sync (still synchronous)');

// Thread pool demo
const start = Date.now();
console.log('\\n=== Thread Pool Concept ===');
console.log('Default pool size: 4 threads');
console.log('Used for: fs operations, crypto, DNS, zlib');
console.log('Network I/O uses OS epoll/kqueue (not thread pool)');
console.log('Tip: Set UV_THREADPOOL_SIZE=8 for CPU-heavy apps');`,
    content: `
<h1>How Node.js Works</h1>

<h2>Node.js Architecture</h2>
<pre><code>┌─────────────────────────────────────────────────┐
│              Your JavaScript Code                │
├─────────────────────────────────────────────────┤
│          Node.js Core Modules (JS + C++)         │
│  (fs, http, crypto, path, events, stream, ...)   │
├─────────────────────────────────────────────────┤
│           Node.js Bindings (C++ layer)           │
├──────────────────────┬──────────────────────────┤
│    V8 Engine (C++)   │      libuv (C)            │
│  ─ Executes JS       │  ─ Event Loop             │
│  ─ JIT Compilation   │  ─ Async I/O              │
│  ─ Garbage Collection│  ─ Thread Pool (4)        │
│  ─ Heap & Stack      │  ─ File, DNS, Crypto      │
└──────────────────────┴──────────────────────────┘
│              Operating System                    │
│       (epoll / kqueue / IOCP for network I/O)    │
└─────────────────────────────────────────────────┘</code></pre>

<h2>Startup Sequence</h2>
<pre><code>1. Node.js initializes V8 engine
2. libuv event loop is created
3. Built-in modules are loaded (lazily)
4. Your script (input.js) is loaded
5. Script is wrapped in module wrapper:
   (function(exports, require, module, __filename, __dirname) {
     // your code here
   })
6. Script executes synchronously (call stack)
7. Event loop starts — keeps running while:
   - There are pending I/O callbacks
   - There are active timers
   - There are active event listeners
8. When event loop has nothing to do → process.exit(0)</code></pre>

<h2>The Call Stack</h2>
<pre><code>// JavaScript is single-threaded — one call stack
// LIFO (Last In, First Out)

function main() {
  console.log('main start');
  readFile();              // I/O — delegated to libuv
  console.log('main end'); // continues without waiting
}

// Call stack during sync execution:
// [main] → [console.log] → [readFile] → back to [main] → [console.log]
// After main finishes, stack is empty
// Event loop picks up readFile callback when I/O completes</code></pre>

<h2>Libuv &amp; Async I/O</h2>
<pre><code>// When Node.js hits an async operation:

// 1. fs.readFile → libuv creates a work request
//    → queued to thread pool (if file I/O)
//    → or registered with OS (if network I/O)

// 2. Node.js immediately returns control to event loop

// 3. Thread in pool completes file read
//    → result placed in completion queue

// 4. Event loop finds completed request
//    → pushes callback onto appropriate queue

// 5. Call stack empty → event loop runs callback

// Thread Pool (UV_THREADPOOL_SIZE, default 4):
// - File system operations
// - DNS lookups (dns.lookup)
// - Crypto (hash, pbkdf2, randomBytes)
// - Zlib (compression)

// OS async (NOT thread pool — uses epoll/kqueue/IOCP):
// - TCP/UDP sockets
// - HTTP/HTTPS requests
// - Pipes, TTY</code></pre>

<h2>Node.js vs Browser JavaScript</h2>
<table>
  <tr><th></th><th>Node.js</th><th>Browser</th></tr>
  <tr><td>Global object</td><td>global / globalThis</td><td>window / globalThis</td></tr>
  <tr><td>Module system</td><td>CJS (require) or ESM</td><td>ESM only</td></tr>
  <tr><td>File access</td><td>Yes (fs module)</td><td>No (sandboxed)</td></tr>
  <tr><td>HTTP servers</td><td>Yes (http module)</td><td>No</td></tr>
  <tr><td>DOM/BOM</td><td>No</td><td>Yes (document, window)</td></tr>
  <tr><td>setTimeout/Promise</td><td>Yes</td><td>Yes</td></tr>
  <tr><td>process object</td><td>Yes</td><td>No</td></tr>
  <tr><td>__dirname/__filename</td><td>CJS only</td><td>No</td></tr>
  <tr><td>setImmediate</td><td>Yes (check phase)</td><td>No</td></tr>
  <tr><td>process.nextTick</td><td>Yes</td><td>No</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: Is Node.js truly single-threaded?</div>
  <div class="qa-a">JavaScript execution in Node.js is single-threaded — your JS code runs on one main thread. But Node.js itself is NOT purely single-threaded: libuv maintains a thread pool (default 4 threads) for file I/O, crypto, DNS, and zlib. Network I/O uses OS-level async APIs (epoll on Linux, kqueue on macOS, IOCP on Windows) without threads. The Cluster module forks entire processes. Worker Threads API enables parallel JS execution in separate threads. So: "single-threaded" means your JS runs on one thread — the runtime has multiple threads working beneath.</div>
</div>`,
  },
  {
    id: 'callback-pattern',
    title: 'Callback Pattern',
    category: 'Async',
    starterCode: `// Callback Pattern in Node.js

// 1. Node.js Error-First (Error-Back) Convention
function readFile(filename, callback) {
  // Simulate async file read
  setTimeout(() => {
    if (!filename) {
      callback(new Error('Filename is required'), null);
      return;
    }
    callback(null, \`Contents of \${filename}\`); // error=null, data=result
  }, 50);
}

// Always check error FIRST
readFile('data.txt', (err, data) => {
  if (err) {
    console.error('Error reading file:', err.message);
    return; // IMPORTANT: return to stop execution
  }
  console.log('File contents:', data);
});

// 2. Callback Hell (Pyramid of Doom)
console.log('\\n=== Callback Hell Example ===');
function getUser(id, cb) { setTimeout(() => cb(null, { id, name: 'Alice' }), 30); }
function getOrders(userId, cb) { setTimeout(() => cb(null, [{id: 1, total: 99}]), 30); }
function getProduct(orderId, cb) { setTimeout(() => cb(null, { id: orderId, name: 'Laptop' }), 30); }

// Nested → hard to read, maintain, handle errors
getUser(1, (err, user) => {
  if (err) return console.error(err);
  console.log('User:', user.name);
  getOrders(user.id, (err, orders) => {
    if (err) return console.error(err);
    console.log('Orders:', orders.length);
    getProduct(orders[0].id, (err, product) => {
      if (err) return console.error(err);
      console.log('Product:', product.name);
    });
  });
});

// 3. Fix: Named functions flatten the pyramid
function handleUser(err, user) {
  if (err) return console.error(err);
  getOrders(user.id, handleOrders);
}
function handleOrders(err, orders) {
  if (err) return console.error(err);
  getProduct(orders[0].id, handleProduct);
}
function handleProduct(err, product) {
  if (err) return console.error(err);
  console.log('\\nFlattened - Product:', product.name);
}

getUser(1, handleUser);`,
    content: `
<h1>Callback Pattern</h1>

<h2>What is a Callback?</h2>
<p>A callback is a function passed as an argument to another function, to be called when an operation completes. In Node.js, callbacks power the event-driven, non-blocking I/O model.</p>
<pre><code>// Higher-order function that accepts a callback
function greet(name, callback) {
  const message = \`Hello, \${name}!\`;
  callback(message); // invoke the callback
}

// Passing a function as argument
greet('Alice', (msg) => console.log(msg)); // Hello, Alice!</code></pre>

<h2>Error-First Convention (Node.js Standard)</h2>
<p>All Node.js core async APIs follow this convention: the first argument to a callback is always either an Error or null.</p>
<pre><code>// Pattern: callback(error, result)
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {                    // always check error FIRST
    console.error(err.message);
    return;                     // return to prevent using undefined data
  }
  console.log(data);            // safe to use data here
});

// Your own async functions should follow same convention
function fetchUser(id, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) return callback(err);          // pass error up
    if (!rows.length) return callback(new Error('User not found'));
    callback(null, rows[0]);                // success: error=null
  });
}</code></pre>

<h2>Callback Hell</h2>
<pre><code>// ❌ The pyramid of doom
getUser(userId, (err, user) => {
  if (err) return handleError(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handleError(err);
    getProducts(orders[0].id, (err, products) => {
      if (err) return handleError(err);
      sendEmail(user.email, products, (err, result) => {
        if (err) return handleError(err);
        // ... even more nesting
      });
    });
  });
});

// Problems:
// 1. Hard to read and understand
// 2. Error handling repetition
// 3. Hard to maintain and debug
// 4. Hard to handle parallel operations</code></pre>

<h2>Solutions to Callback Hell</h2>
<pre><code>// ✅ Solution 1: Named functions (flatten the pyramid)
function onProducts(err, products) { /* ... */ }
function onOrders(err, orders) {
  if (err) return handleError(err);
  getProducts(orders[0].id, onProducts);
}
function onUser(err, user) {
  if (err) return handleError(err);
  getOrders(user.id, onOrders);
}
getUser(userId, onUser);

// ✅ Solution 2: Promises (modern standard)
getUser(userId)
  .then(user => getOrders(user.id))
  .then(orders => getProducts(orders[0].id))
  .then(products => sendEmail(email, products))
  .catch(handleError);

// ✅ Solution 3: async/await (cleanest)
async function processOrder(userId) {
  const user = await getUser(userId);
  const orders = await getOrders(user.id);
  const products = await getProducts(orders[0].id);
  await sendEmail(user.email, products);
}</code></pre>

<h2>Promisifying Callbacks</h2>
<pre><code>// Convert callback-style to Promise
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Now use with async/await
const data = await readFile('file.txt', 'utf8');

// Or manually wrap
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// fs.promises — modern Node.js has built-in promise versions
const data = await fs.promises.readFile('file.txt', 'utf8');</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Why does Node.js use error-first callbacks?</div>
  <div class="qa-a">The error-first pattern ensures errors are always handled and makes the API consistent. In async code, you can't use try/catch for errors that occur in callbacks (they happen in a different call stack frame). By always passing the error as the first argument, it forces callers to explicitly handle errors. If you forget to check err, you proceed with undefined data and get mysterious bugs — the pattern makes error handling visible and deliberate.</div>
</div>`,
  },
  {
    id: 'process-module',
    title: 'Process & OS',
    category: 'Core',
    starterCode: `// process object & OS module

// process is a global object — no require needed!
console.log('=== Process Info ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('PID:', process.pid);
console.log('Working dir:', process.cwd());

// Command line arguments
console.log('\\n=== CLI Args ===');
console.log('process.argv:', process.argv);
// process.argv[0] = 'node'
// process.argv[1] = script path
// process.argv[2+] = user arguments
// Run: node script.js --name=Alice --port=3000

// Environment variables
console.log('\\n=== Environment Variables ===');
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT) || 3000;
console.log('NODE_ENV:', NODE_ENV);
console.log('PORT:', PORT);

// Memory usage
const mem = process.memoryUsage();
console.log('\\n=== Memory Usage ===');
Object.entries(mem).forEach(([key, bytes]) => {
  console.log(\`\${key.padEnd(15)}: \${(bytes / 1024 / 1024).toFixed(2)} MB\`);
});

// CPU usage
const cpuBefore = process.cpuUsage();
// Simulate some work
let x = 0;
for (let i = 0; i < 1e6; i++) x += Math.sqrt(i);
const cpuAfter = process.cpuUsage(cpuBefore);
console.log('\\n=== CPU Usage (after 1M sqrt operations) ===');
console.log(\`User:   \${(cpuAfter.user / 1000).toFixed(2)} ms\`);
console.log(\`System: \${(cpuAfter.system / 1000).toFixed(2)} ms\`);

// Uptime
console.log('\\nProcess uptime:', process.uptime().toFixed(2), 'seconds');`,
    content: `
<h1>Process Object &amp; OS Module</h1>

<h2>The process Object</h2>
<p>process is a global object available in every Node.js module — no require() needed. It provides information about and control over the current Node.js process.</p>

<h2>Key process Properties</h2>
<pre><code>process.version        // 'v20.11.0' — Node.js version
process.versions       // all dependency versions (V8, libuv, etc.)
process.platform       // 'linux', 'darwin', 'win32'
process.arch           // 'x64', 'arm64', 'ia32'
process.pid            // process ID (number)
process.ppid           // parent process ID
process.cwd()          // current working directory
process.chdir(dir)     // change working directory
process.uptime()       // seconds since process started
process.title          // process name (settable: ps aux)</code></pre>

<h2>Environment Variables</h2>
<pre><code>// Access via process.env (object of all env vars)
const port = parseInt(process.env.PORT) || 3000;
const env = process.env.NODE_ENV || 'development';
const dbUrl = process.env.DATABASE_URL;

// Never hardcode secrets — use environment variables!
// Set in terminal: PORT=8080 NODE_ENV=production node app.js

// Use dotenv for local development:
require('dotenv').config(); // loads .env file into process.env</code></pre>

<h2>Command Line Arguments</h2>
<pre><code>// process.argv = ['node', 'script.js', ...user_args]
// node app.js --port 3000 --env production

const args = process.argv.slice(2); // remove node and script path
// ['--port', '3000', '--env', 'production']

// Parse arguments
const parseArgs = (args) => {
  return args.reduce((result, arg, i) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      result[key] = next && !next.startsWith('--') ? next : true;
    }
    return result;
  }, {});
};
const { port, env } = parseArgs(process.argv.slice(2));

// Better: use the built-in util.parseArgs (Node 18+)
const { values } = require('util').parseArgs({
  options: {
    port: { type: 'string', short: 'p' },
    env: { type: 'string' },
  }
});</code></pre>

<h2>Graceful Shutdown</h2>
<pre><code>// Handle shutdown signals for clean exit
const server = app.listen(3000);
const db = connectToDatabase();

async function shutdown(signal) {
  console.log(\`\\nReceived \${signal}. Starting graceful shutdown...\`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');

    // Close database connections
    await db.close();
    console.log('Database connections closed');

    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop, K8s
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});</code></pre>

<h2>Memory &amp; Performance</h2>
<pre><code>// Monitor memory usage
const mem = process.memoryUsage();
// {
//   rss: 45MB,          // Resident Set Size — total memory used
//   heapTotal: 17MB,    // V8 heap total
//   heapUsed: 12MB,     // V8 heap currently used
//   external: 1MB,      // C++ objects bound to JS
//   arrayBuffers: 0     // ArrayBuffers and SharedArrayBuffers
// }

// Detect memory leak: heapUsed growing steadily over time
setInterval(() => {
  const { heapUsed } = process.memoryUsage();
  console.log(\`Heap: \${(heapUsed / 1024 / 1024).toFixed(1)}MB\`);
}, 5000);

// CPU usage
const start = process.cpuUsage();
doHeavyWork();
const { user, system } = process.cpuUsage(start);
console.log(\`CPU: user=\${user/1000}ms system=\${system/1000}ms\`);</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between SIGTERM and SIGINT?</div>
  <div class="qa-a">SIGINT (interrupt) is sent by Ctrl+C in the terminal — means the user wants to stop the process. SIGTERM (terminate) is sent by process managers (Docker stop, Kubernetes, systemd, pm2 stop) requesting graceful termination. Both should trigger graceful shutdown. SIGKILL (kill -9) cannot be caught — it forces immediate termination and should only be used as a last resort after graceful shutdown timeout. Best practice: handle both SIGTERM and SIGINT with the same graceful shutdown function.</div>
</div>`,
  },
];
