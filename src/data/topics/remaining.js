export const remaining = [
  {
    id: 'modules',
    title: 'Module System',
    category: 'Modules',
    starterCode: `// Module patterns simulation (browser-compatible)

// Simulating module.exports vs exports difference
function createModule() {
  let exports = {};
  let module = { exports };

  // ✅ This works — adds to shared object
  exports.add = (a, b) => a + b;
  console.log('exports.add works:', module.exports.add(2, 3));

  // ❌ This breaks the reference
  exports = { sub: (a, b) => a - b };
  console.log('After reassign, module.exports.sub:', module.exports.sub);
  // undefined! exports now points to new obj, module.exports still old

  // ✅ Always use module.exports to replace entirely
  module.exports = { mul: (a, b) => a * b };
  console.log('module.exports.mul:', module.exports.mul(3, 4));
}
createModule();

// Module caching simulation
function simulateCache() {
  const cache = {};
  function require(id) {
    if (cache[id]) { console.log(id, '→ from cache'); return cache[id]; }
    const mod = { counter: 0, inc() { this.counter++; } };
    cache[id] = mod;
    console.log(id, '→ loaded fresh');
    return mod;
  }
  const a = require('counter');
  const b = require('counter'); // cached
  a.inc();
  console.log('Shared state — b.counter:', b.counter); // 1, same instance!
}
simulateCache();`,
    content: `
<h1>Module System (CJS &amp; ESM)</h1>

<h2>Why Modules?</h2>
<p>Modules provide encapsulation — each file has its own scope. Node.js wraps every file in an IIFE (Module Wrapper) so variables don't leak globally.</p>

<h2>Module Wrapper</h2>
<pre><code>(function(exports, require, module, __filename, __dirname) {
  // your module code here
  // This is why __dirname and __filename work in every file
});</code></pre>

<h2>CommonJS (CJS) — Node.js Default</h2>
<pre><code>// math.js — exporting
exports.add = (a, b) => a + b;           // named export shorthand
exports.sub = (a, b) => a - b;

module.exports = { add, sub };           // replace entire export
module.exports = (a, b) => a + b;        // export a single function

// app.js — importing
const { add, sub } = require('./math');  // destructure
const math = require('./math');          // whole object
const add  = require('./math');          // single function export</code></pre>

<h3>module.exports vs exports — Critical Difference</h3>
<pre><code>// Both start pointing to the SAME object
console.log(module.exports === exports); // true

// ✅ OK — add properties to the shared object
exports.greet = () => 'Hello';

// ❌ BREAKS reference — exports now points elsewhere
exports = { greet: () => 'Hello' };    // module.exports still empty!

// ✅ Use module.exports when replacing entirely
module.exports = { greet: () => 'Hello' };</code></pre>

<h2>ES Modules (ESM)</h2>
<pre><code>// math.mjs (or package.json "type": "module")
export const add = (a, b) => a + b;       // named export
export default function multiply(a, b) {} // default export

// app.mjs
import multiply from './math.mjs';         // default — any name
import { add } from './math.mjs';          // named — exact name
import { add as plus } from './math.mjs'; // rename
import * as Math from './math.mjs';        // import all</code></pre>

<h2>CJS vs ESM Comparison</h2>
<table>
  <tr><th></th><th>CommonJS</th><th>ES Modules</th></tr>
  <tr><td>Syntax</td><td>require() / module.exports</td><td>import / export</td></tr>
  <tr><td>Loading</td><td>Synchronous</td><td>Asynchronous</td></tr>
  <tr><td>Resolution</td><td>Runtime (dynamic)</td><td>Parse time (static)</td></tr>
  <tr><td>Tree shaking</td><td>No</td><td>Yes (bundlers can remove unused)</td></tr>
  <tr><td>Top-level await</td><td>No</td><td>Yes</td></tr>
  <tr><td>__dirname</td><td>Available</td><td>Not available (use import.meta.url)</td></tr>
</table>

<h2>Module Caching</h2>
<pre><code>// counter.js
let count = 0;
module.exports = { inc: () => ++count, get: () => count };

// app.js
const c1 = require('./counter');
const c2 = require('./counter'); // returns SAME cached instance
c1.inc();
console.log(c2.get()); // 1 — shared state!
console.log(c1 === c2); // true</code></pre>
<p>Module code runs <strong>once</strong>. All subsequent require() calls return the cached export.</p>`,
  },
  {
    id: 'streams',
    title: 'Streams & Buffers',
    category: 'Core',
    starterCode: `// Buffer operations (browser-compatible)

// Create buffers
const b1 = Buffer.from('Hello Node.js', 'utf8');
console.log('Original:', b1.toString());
console.log('Hex:', b1.toString('hex'));
console.log('Base64:', b1.toString('base64'));
console.log('Bytes:', b1.length);

// Buffer concat
const b2 = Buffer.from(' World', 'utf8');
const combined = Buffer.concat([b1, b2]);
console.log('Combined:', combined.toString());

// Buffer from array
const b3 = Buffer.from([72, 101, 108, 108, 111]);
console.log('From bytes:', b3.toString()); // Hello

// Simulate stream chunking
function simulateStream(data, chunkSize = 5) {
  console.log('\\n=== Streaming', data.length, 'chars in', chunkSize, 'char chunks ===');
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    console.log('chunk:', JSON.stringify(chunk));
  }
  console.log('end: stream finished');
}

simulateStream('Hello World from Node.js Streams!', 8);`,
    content: `
<h1>Streams &amp; Buffers</h1>

<h2>Why Streams?</h2>
<p>Without streams, processing a 1GB file loads it entirely into RAM. With streams, it processes data <strong>chunk by chunk</strong> — constant memory usage regardless of file size.</p>
<pre><code>// ❌ Loads entire 1GB into memory
const data = fs.readFileSync('bigfile.mp4');
res.end(data);

// ✅ Streams chunks — memory stays constant
fs.createReadStream('bigfile.mp4').pipe(res);</code></pre>

<h2>Types of Streams</h2>
<table>
  <tr><th>Type</th><th>Direction</th><th>Examples</th><th>Key Events</th></tr>
  <tr><td>Readable</td><td>Read only</td><td>fs.createReadStream, http.IncomingMessage, process.stdin</td><td>data, end, error</td></tr>
  <tr><td>Writable</td><td>Write only</td><td>fs.createWriteStream, http.ServerResponse, process.stdout</td><td>drain, finish, error</td></tr>
  <tr><td>Duplex</td><td>Read + Write</td><td>TCP sockets, net.Socket</td><td>Both</td></tr>
  <tr><td>Transform</td><td>Read → modify → Write</td><td>zlib.createGzip(), crypto streams</td><td>Both</td></tr>
</table>

<h2>Readable Stream</h2>
<pre><code>const readable = fs.createReadStream('data.txt', {
  encoding: 'utf8',
  highWaterMark: 16 * 1024  // 16KB chunks (default)
});

readable.on('data',  chunk => console.log('Got chunk:', chunk.length, 'bytes'));
readable.on('end',   ()    => console.log('Stream finished'));
readable.on('error', err   => console.error('Error:', err.message));</code></pre>

<h2>Piping</h2>
<pre><code>const zlib = require('zlib');

// Compress a file — handles backpressure automatically
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => console.log('Compressed!'));

// Serve file via HTTP (memory efficient)
http.createServer((req, res) => {
  fs.createReadStream('video.mp4').pipe(res);
});</code></pre>

<h2>Transform Stream (Custom)</h2>
<pre><code>const { Transform } = require('stream');

class UpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback(); // signal this chunk is done
  }
}

fs.createReadStream('input.txt')
  .pipe(new UpperCase())
  .pipe(fs.createWriteStream('output.txt'));</code></pre>

<h2>Buffers</h2>
<pre><code>// Create
const b1 = Buffer.alloc(10);                      // 10 zero bytes
const b2 = Buffer.from('Hello', 'utf8');           // from string
const b3 = Buffer.from([72, 101, 108, 108, 111]);  // from bytes

// Convert
b2.toString()         // "Hello"  (utf8 default)
b2.toString('hex')    // "48656c6c6f"
b2.toString('base64') // "SGVsbG8="

// Operations
Buffer.concat([b2, Buffer.from(' World')])  // combine
b2.length  // 5 (bytes, not chars)</code></pre>

<h2>Backpressure</h2>
<p>When a writable can't consume data as fast as a readable produces it. <code>.pipe()</code> handles this automatically — pauses the readable when the writable's buffer is full, resumes on 'drain' event. Without backpressure handling, the process runs out of memory.</p>`,
  },
  {
    id: 'builtins',
    title: 'Built-in Modules',
    category: 'Core',
    starterCode: `// Built-in modules simulation

// PATH operations (simulated)
function pathJoin(...parts) {
  return parts.join('/').replace(/\\/+/g, '/');
}
function pathExtname(p) {
  return p.slice(p.lastIndexOf('.'));
}
function pathBasename(p) {
  return p.split('/').pop();
}
function pathDirname(p) {
  return p.split('/').slice(0, -1).join('/');
}

const filePath = pathJoin('/users/alice', 'docs', 'report.pdf');
console.log('join:', filePath);
console.log('basename:', pathBasename(filePath));
console.log('dirname:', pathDirname(filePath));
console.log('extname:', pathExtname(filePath));

// EventEmitter pattern (simulated)
class EventEmitter {
  constructor() { this._events = {}; }
  on(event, fn) {
    (this._events[event] ??= []).push(fn);
    return this;
  }
  emit(event, ...args) {
    (this._events[event] || []).forEach(fn => fn(...args));
  }
  off(event, fn) {
    this._events[event] = (this._events[event] || []).filter(f => f !== fn);
  }
}

const emitter = new EventEmitter();
emitter.on('order', (item, qty) => console.log(\`Order: \${qty}x \${item}\`));
emitter.on('order', (item) => console.log(\`Chef notified: \${item}\`));
emitter.emit('order', 'Pizza', 2);
emitter.emit('order', 'Pasta', 1);`,
    content: `
<h1>Built-in Modules</h1>

<h2>fs (File System)</h2>
<table>
  <tr><th>Method</th><th>Type</th><th>Notes</th></tr>
  <tr><td>fs.readFileSync(path, enc)</td><td>Sync (blocking)</td><td>Avoid in servers</td></tr>
  <tr><td>fs.readFile(path, enc, cb)</td><td>Async callback</td><td>Error-first callback</td></tr>
  <tr><td>fs.promises.readFile(path)</td><td>Promise</td><td>Use with async/await</td></tr>
  <tr><td>fs.writeFile(path, data, cb)</td><td>Async</td><td>Creates or overwrites</td></tr>
  <tr><td>fs.appendFile(path, data, cb)</td><td>Async</td><td>Append to file</td></tr>
  <tr><td>fs.createReadStream(path)</td><td>Stream</td><td>Memory-efficient</td></tr>
</table>
<pre><code>// Promise-based (best practice)
const { readFile, writeFile } = require('fs').promises;

async function process() {
  const data = await readFile('./input.txt', 'utf8');
  await writeFile('./output.txt', data.toUpperCase());
}

// Append: use { flag: 'a' }
await writeFile('./log.txt', 'New entry\n', { flag: 'a' });</code></pre>

<h2>path</h2>
<pre><code>const path = require('path');

path.join('/users', 'alice', 'docs')   // '/users/alice/docs' (normalized)
path.join(__dirname, '../data')        // go up one dir, into data/
path.resolve('./images', 'logo.png')   // absolute path from CWD
path.dirname('/users/alice/file.txt')  // '/users/alice'
path.basename('/users/alice/file.txt') // 'file.txt'
path.extname('report.pdf')             // '.pdf'
path.sep                               // '/' on Unix, '\\' on Windows</code></pre>

<h2>EventEmitter</h2>
<pre><code>const { EventEmitter } = require('events');

// Pattern: extend in a class
class PizzaShop extends EventEmitter {
  order(size, topping) {
    console.log(\`Order: \${size} \${topping}\`);
    this.emit('order', size, topping); // sync — all listeners fire now
  }
}
const shop = new PizzaShop();
shop.on('order', (size, top) => console.log(\`Chef: making \${size} \${top}\`));
shop.once('order', () => console.log('First order bonus!')); // fires once only
shop.order('large', 'pepperoni');</code></pre>

<h2>os Module</h2>
<pre><code>const os = require('os');
os.cpus().length   // number of CPU cores
os.totalmem()      // total memory in bytes
os.freemem()       // free memory in bytes
os.platform()      // 'linux', 'darwin', 'win32'
os.hostname()      // machine hostname
os.homedir()       // home directory</code></pre>

<h2>crypto Module</h2>
<pre><code>const crypto = require('crypto');

// Hashing (one-way)
const hash = crypto.createHash('sha256').update('password').digest('hex');

// HMAC (hash + secret key)
const hmac = crypto.createHmac('sha256', 'secret')
  .update('data').digest('hex');

// AES Encryption
const key = crypto.randomBytes(32);  // 32-byte key for AES-256
const iv  = crypto.randomBytes(16);  // Initialization Vector — randomness

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}
function decrypt(enc) {
  const d = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return d.update(enc, 'hex', 'utf8') + d.final('utf8');
}
const enc = encrypt('Hello World');
console.log(enc, '→', decrypt(enc));</code></pre>`,
  },
  {
    id: 'scaling',
    title: 'Scaling Node.js',
    category: 'Scaling',
    starterCode: `// Scaling concepts simulation

// Simulate Cluster-like load distribution
class LoadBalancer {
  constructor(workers) {
    this.workers = workers;
    this.index = 0;
  }
  // Round-robin distribution
  getWorker() {
    const worker = this.workers[this.index];
    this.index = (this.index + 1) % this.workers.length;
    return worker;
  }
}

const workers = [
  { id: 'worker-1', pid: 1001, requests: 0 },
  { id: 'worker-2', pid: 1002, requests: 0 },
  { id: 'worker-3', pid: 1003, requests: 0 },
  { id: 'worker-4', pid: 1004, requests: 0 },
];

const lb = new LoadBalancer(workers);

// Simulate 12 incoming requests
for (let i = 1; i <= 12; i++) {
  const w = lb.getWorker();
  w.requests++;
  console.log(\`Request \${i} → \${w.id} (pid \${w.pid})\`);
}

console.log('\\nLoad distribution:');
workers.forEach(w => console.log(\`  \${w.id}: \${w.requests} requests\`));`,
    content: `
<h1>Scaling Node.js</h1>

<h2>The Problem: One Core by Default</h2>
<p>Node.js runs on a <strong>single CPU core</strong>. An 8-core server uses only 1/8th of its capacity. The Cluster module and Worker Threads solve this.</p>

<h2>Cluster Module</h2>
<pre><code>const cluster = require('cluster');
const os = require('os');
const http = require('http');

if (cluster.isPrimary) {
  console.log(\`Primary \${process.pid} running\`);

  // Fork one worker per CPU core
  os.cpus().forEach(() => cluster.fork());

  // Auto-restart dead workers
  cluster.on('exit', (worker) => {
    console.log(\`Worker \${worker.process.pid} died — restarting\`);
    cluster.fork();
  });
} else {
  // Each worker has its own event loop and HTTP server
  http.createServer((req, res) => {
    res.end(\`Worker \${process.pid}\`);
  }).listen(3000);
  console.log(\`Worker \${process.pid} started\`);
}</code></pre>

<h2>pm2 — Production Process Manager</h2>
<pre><code>npm install -g pm2

pm2 start server.js -i max   # one worker per CPU core
pm2 start server.js -i 4     # exactly 4 workers
pm2 list                      # view all processes
pm2 logs                      # stream logs
pm2 restart server            # zero-downtime restart
pm2 startup                   # auto-start on system boot</code></pre>

<h2>Worker Threads</h2>
<pre><code>// main.js — offload CPU work
const { Worker } = require('worker_threads');

const worker = new Worker('./heavy.js', {
  workerData: { num: 45 }  // send data to worker
});
worker.on('message', result => console.log('Result:', result));
worker.on('error',   err    => console.error(err));

// heavy.js — runs in separate thread
const { workerData, parentPort } = require('worker_threads');
function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
parentPort.postMessage(fib(workerData.num)); // send back result</code></pre>

<h2>Cluster vs Worker Threads</h2>
<table>
  <tr><th></th><th>Cluster</th><th>Worker Threads</th></tr>
  <tr><td>Unit</td><td>Separate OS processes</td><td>Threads in same process</td></tr>
  <tr><td>Memory</td><td>Separate memory space</td><td>Can share via SharedArrayBuffer</td></tr>
  <tr><td>Communication</td><td>IPC (inter-process)</td><td>postMessage / SharedArrayBuffer</td></tr>
  <tr><td>Best for</td><td>HTTP servers, I/O-heavy</td><td>CPU-intensive (image, ML, crypto)</td></tr>
  <tr><td>Crash isolation</td><td>Worker crash isolated</td><td>Thread crash can affect process</td></tr>
</table>

<h2>Full Scaling Strategy</h2>
<ul>
  <li><strong>Vertical</strong> — Cluster/pm2 to use all CPU cores on one machine</li>
  <li><strong>Horizontal</strong> — Multiple machines behind a load balancer (Nginx)</li>
  <li><strong>Containers</strong> — Docker + Kubernetes for auto-scaling</li>
  <li><strong>Serverless</strong> — AWS Lambda, Vercel (auto-scales to zero)</li>
  <li><strong>Caching</strong> — Redis to reduce DB load</li>
  <li><strong>CDN</strong> — Serve static assets from edge nodes</li>
</ul>`,
  },
  {
    id: 'error-handling',
    title: 'Error Handling',
    category: 'Quality',
    starterCode: `// Error handling patterns

// 1. Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
class NotFoundError    extends AppError { constructor(m) { super(m, 404); } }
class ValidationError  extends AppError { constructor(m) { super(m, 400); } }

// 2. catchAsync wrapper (avoid repeating try/catch)
const catchAsync = fn => (...args) =>
  Promise.resolve(fn(...args)).catch(err => console.error('Caught:', err.message));

// 3. Simulate async route with error
const getUser = catchAsync(async (id) => {
  if (!id) throw new ValidationError('ID is required');
  if (id === 999) throw new NotFoundError('User not found');
  return { id, name: 'Alice' };
});

async function main() {
  // Success
  const user = await getUser(1);
  console.log('User:', user.name);

  // Operational errors (expected)
  await getUser(null);   // ValidationError
  await getUser(999);    // NotFoundError

  // Check error properties
  try {
    throw new NotFoundError('Item missing');
  } catch (e) {
    console.log('name:', e.name);
    console.log('status:', e.statusCode);
    console.log('operational:', e.isOperational);
  }
}
main();`,
    content: `
<h1>Error Handling</h1>

<h2>Two Types of Errors</h2>
<table>
  <tr><th>Type</th><th>Definition</th><th>Examples</th><th>Action</th></tr>
  <tr><td><strong>Operational</strong></td><td>Expected runtime problems</td><td>Invalid input, DB down, file not found, 404</td><td>Handle gracefully, return error response</td></tr>
  <tr><td><strong>Programmer</strong></td><td>Bugs in code</td><td>undefined is not a function, wrong arg type</td><td>Fix the code — crash and restart</td></tr>
</table>

<h2>Custom Error Classes</h2>
<pre><code>class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // flag for error handler
    Error.captureStackTrace(this, this.constructor);
  }
}
class NotFoundError   extends AppError { constructor(m) { super(m, 404); } }
class ValidationError extends AppError { constructor(m) { super(m, 400); } }
class UnauthorizedError extends AppError { constructor(m) { super(m, 401); } }

throw new NotFoundError('User not found');</code></pre>

<h2>Express Global Error Handler</h2>
<pre><code>// Must have exactly 4 params — Express detects as error middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : 'Internal Server Error';

  console.error('[ERROR]', err.stack);
  res.status(statusCode).json({ status: 'error', message });
});

// In routes — pass errors to next()
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    res.json(user);
  } catch (err) {
    next(err); // goes to global handler above
  }
});</code></pre>

<h2>catchAsync Wrapper (eliminate try/catch repetition)</h2>
<pre><code>const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Clean routes — no try/catch needed
app.get('/users', catchAsync(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));</code></pre>

<h2>Process-Level Safety Nets</h2>
<pre><code>// Sync uncaught error — MUST exit after this
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION!', err);
  process.exit(1); // state is unreliable — must exit
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION!', reason);
  server.close(() => process.exit(1)); // graceful shutdown
});

// Register these at the TOP of your entry file</code></pre>`,
  },
  {
    id: 'security',
    title: 'Security',
    category: 'Security',
    starterCode: `// Security: Input Validation Demo

// Joi-like validation (simulated)
function validateUser(data) {
  const errors = [];
  if (!data.name || data.name.length < 2)
    errors.push('name must be at least 2 characters');
  if (!data.email || !/.+@.+\..+/.test(data.email))
    errors.push('invalid email format');
  if (!data.password || data.password.length < 8)
    errors.push('password must be at least 8 characters');
  if (!/[A-Z]/.test(data.password))
    errors.push('password must contain uppercase letter');
  if (!/[0-9]/.test(data.password))
    errors.push('password must contain a number');
  return errors;
}

// Test cases
const inputs = [
  { name: 'Alice', email: 'alice@example.com', password: 'Secure123' },
  { name: 'B',    email: 'not-an-email',       password: 'weak'       },
  { name: 'Carol', email: 'carol@test.com',    password: 'NoNumbers!' },
];

inputs.forEach((input, i) => {
  const errors = validateUser(input);
  if (errors.length === 0) {
    console.log(\`✅ Input \${i+1} valid\`);
  } else {
    console.log(\`❌ Input \${i+1} errors:\`);
    errors.forEach(e => console.log('   -', e));
  }
});`,
    content: `
<h1>Security Best Practices</h1>

<h2>Common Vulnerabilities</h2>
<table>
  <tr><th>Vulnerability</th><th>What it is</th><th>Prevention</th></tr>
  <tr><td>SQL Injection</td><td>Malicious SQL in user input</td><td>Parameterized queries, ORMs</td></tr>
  <tr><td>XSS</td><td>Script injection into HTML output</td><td>Sanitize output, CSP headers</td></tr>
  <tr><td>CSRF</td><td>Forged requests from another site</td><td>CSRF tokens, SameSite cookies</td></tr>
  <tr><td>Path Traversal</td><td>../../etc/passwd in file paths</td><td>Validate and sanitize paths</td></tr>
  <tr><td>Prototype Pollution</td><td>Overwriting Object.prototype</td><td>Object.create(null), validate input</td></tr>
</table>

<h2>helmet — Security Headers</h2>
<pre><code>const helmet = require('helmet');
app.use(helmet());
// Sets automatically:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY         (prevent clickjacking)
// Content-Security-Policy       (prevent XSS)
// Strict-Transport-Security     (HTTPS only)
// X-XSS-Protection</code></pre>

<h2>Rate Limiting</h2>
<pre><code>const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per IP
  message: { error: 'Too many requests' },
  standardHeaders: true,
});
app.use('/api', limiter);

// Stricter for auth routes
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
app.use('/api/auth', authLimiter);</code></pre>

<h2>Input Validation (Joi)</h2>
<pre><code>const Joi = require('joi');

const schema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])/).required(),
  age:      Joi.number().integer().min(18),
});

// Middleware
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({
      errors: error.details.map(d => d.message)
    });
    next();
  };
}
app.post('/users', validate(schema), createUser);</code></pre>

<h2>Security Checklist</h2>
<ul>
  <li>Use <code>helmet()</code> on every Express app</li>
  <li>Validate all input — never trust req.body</li>
  <li>Hash passwords with bcrypt (never plain text, never MD5/SHA256)</li>
  <li>Use HTTPS in production (TLS certificate)</li>
  <li>Set cookies: <code>httpOnly: true, secure: true, sameSite: 'strict'</code></li>
  <li>Limit body size: <code>express.json({ limit: '10kb' })</code></li>
  <li>Run <code>npm audit</code> regularly</li>
  <li>Never log passwords, tokens, or sensitive data</li>
  <li>Use environment variables for all secrets</li>
</ul>`,
  },
  {
    id: 'auth',
    title: 'Authentication (JWT & bcrypt)',
    category: 'Security',
    starterCode: `// JWT structure simulation (no library needed)

// JWT = base64(header).base64(payload).signature

function base64url(obj) {
  return btoa(JSON.stringify(obj))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(header);
  const p = base64url({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 });
  // In real JWT: signature = HMAC-SHA256(h + '.' + p, secret)
  const sig = btoa(secret + h + p).slice(0, 20); // simplified
  return \`\${h}.\${p}.\${sig}\`;
}

function decodeToken(token) {
  const [h, p, sig] = token.split('.');
  const payload = JSON.parse(atob(p));
  const isExpired = payload.exp < Date.now();
  return { payload, isExpired };
}

// Simulate login flow
const user = { id: 1, email: 'alice@example.com', role: 'admin' };
const token = createToken({ id: user.id, email: user.email, role: user.role }, 'secret');

console.log('Token (first 60 chars):');
console.log(token.slice(0, 60) + '...');

const { payload, isExpired } = decodeToken(token);
console.log('\\nDecoded payload:');
console.log('  id:', payload.id);
console.log('  email:', payload.email);
console.log('  role:', payload.role);
console.log('  expired:', isExpired);

console.log('\\n⚠️  Note: The payload is only BASE64 encoded, not encrypted!');
console.log('Never put sensitive data (passwords) in JWT payload.');`,
    content: `
<h1>Authentication — JWT &amp; bcrypt</h1>

<h2>bcrypt — Password Hashing</h2>
<pre><code>const bcrypt = require('bcrypt');

// Hash (on register)
const hash = await bcrypt.hash('myPassword123', 12); // 12 salt rounds
// Store hash in DB — never the plain password

// Verify (on login)
const isMatch = await bcrypt.compare('myPassword123', storedHash); // true/false</code></pre>

<p><strong>Salt rounds</strong>: Each increment doubles compute time. 10 ≈ 100ms, 12 ≈ 400ms. Higher = more secure vs brute force. Never use MD5/SHA256 for passwords — they're too fast.</p>

<h2>JWT Structure</h2>
<pre><code>// Token = base64(header).base64(payload).HMAC_signature
// eyJhbGc...  .  eyJ1c2VyS...  .  SflKxw...
//   header        payload          signature

// Header: { "alg": "HS256", "typ": "JWT" }
// Payload: { "id": 1, "email": "alice@example.com", "iat": 1234, "exp": 5678 }
// Signature: HMAC-SHA256(header + "." + payload, SECRET_KEY)</code></pre>

<p class="warning-note">⚠️ The payload is only <strong>base64 encoded</strong>, not encrypted — anyone can decode it. Never put passwords or sensitive data in the payload.</p>

<h2>Full JWT Flow</h2>
<pre><code>const jwt = require('jsonwebtoken');
const JWT_SECRET  = process.env.JWT_SECRET; // from .env, never hardcode
const JWT_EXPIRES = '15m'; // short-lived access token

// On login — generate token
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// Auth middleware — verify token on protected routes
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded; // attach to request
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: msg });
  }
}

// Usage
app.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user }); // decoded payload
});</code></pre>

<h2>Session vs Token (JWT) Auth</h2>
<table>
  <tr><th></th><th>Session</th><th>JWT</th></tr>
  <tr><td>Storage</td><td>Server stores session data</td><td>Client stores token</td></tr>
  <tr><td>Stateless?</td><td>No — server must remember</td><td>Yes — self-contained</td></tr>
  <tr><td>Scalability</td><td>Needs shared store (Redis)</td><td>Easy horizontal scaling</td></tr>
  <tr><td>Revocation</td><td>Easy — delete from DB</td><td>Hard — valid until expiry</td></tr>
  <tr><td>Best for</td><td>Traditional web apps</td><td>SPAs, mobile, microservices</td></tr>
</table>`,
  },
  {
    id: 'process',
    title: 'process Object',
    category: 'Core',
    starterCode: `// process object (browser-compatible simulation)

// Simulate process object
const proc = {
  pid: 12345,
  version: 'v20.11.0',
  platform: 'darwin',
  env: { NODE_ENV: 'development', PORT: '3000' },
  argv: ['node', 'server.js', '--port=4000', '--env=production'],
  memoryUsage: () => ({
    rss:       Math.floor(Math.random() * 50 + 30) * 1024 * 1024,
    heapUsed:  Math.floor(Math.random() * 20 + 10) * 1024 * 1024,
    heapTotal: Math.floor(Math.random() * 30 + 20) * 1024 * 1024,
    external:  Math.floor(Math.random() * 5)  * 1024 * 1024,
  }),
  uptime: () => Math.floor(Math.random() * 3600),
};

// Log process info
console.log('=== Process Info ===');
console.log('PID:', proc.pid);
console.log('Node version:', proc.version);
console.log('Platform:', proc.platform);
console.log('Uptime:', proc.uptime() + 's');

// Environment variables
console.log('\\n=== Environment ===');
console.log('NODE_ENV:', proc.env.NODE_ENV);
console.log('PORT:', proc.env.PORT);

// Parse CLI arguments
console.log('\\n=== CLI Args ===');
proc.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    console.log(\`  \${key} = \${val ?? true}\`);
  }
});

// Memory
const mem = proc.memoryUsage();
const mb = b => (b / 1024 / 1024).toFixed(1) + ' MB';
console.log('\\n=== Memory ===');
console.log('RSS:       ', mb(mem.rss));
console.log('Heap Used: ', mb(mem.heapUsed));
console.log('Heap Total:', mb(mem.heapTotal));`,
    content: `
<h1>process Object &amp; Graceful Shutdown</h1>
<p>The <code>process</code> object is a global — no require needed. It provides info and control over the current Node.js process.</p>

<h2>Key Properties &amp; Methods</h2>
<pre><code>// Environment
process.env.NODE_ENV      // 'development' | 'production' | 'test'
process.env.PORT          // custom env vars from .env

// CLI Arguments
process.argv              // ['node', 'script.js', 'arg1', ...]
process.argv.slice(2)     // your actual arguments

// Info
process.pid               // process ID
process.version           // 'v20.11.0'
process.platform          // 'linux' | 'darwin' | 'win32'
process.cwd()             // current working directory
process.uptime()          // seconds since start

// Memory
process.memoryUsage()     // { rss, heapTotal, heapUsed, external }

// Exit
process.exit(0)           // success
process.exit(1)           // failure</code></pre>

<h2>Graceful Shutdown</h2>
<pre><code>const server = app.listen(3000);

function shutdown(signal) {
  console.log(\`\${signal} received. Shutting down...\`);

  server.close(async () => {
    // Stop accepting new connections, finish existing ones
    await mongoose.connection.close();
    await redisClient.quit();
    console.log('All connections closed');
    process.exit(0);
  });

  // Force exit if too slow
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/K8s stop
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C</code></pre>

<h2>Error Safety Nets</h2>
<pre><code>// Uncaught synchronous error — MUST exit
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', err);
  process.exit(1); // state is unreliable
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION', reason);
  server.close(() => process.exit(1));
});</code></pre>`,
  },
  {
    id: 'env-vars',
    title: 'Environment Variables',
    category: 'DevOps',
    starterCode: `// Environment variables and config patterns

// Simulate dotenv loading
function loadEnv(envString) {
  const env = {};
  envString.split('\\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...vals] = line.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

const envFile = \`
# App config
NODE_ENV=production
PORT=3000

# Database
DB_URL=mongodb://localhost:27017/myapp
DB_POOL_SIZE=10

# Auth
JWT_SECRET=super-secret-key-here
JWT_EXPIRES=7d

# Redis
REDIS_URL=redis://localhost:6379
\`;

const env = loadEnv(envFile);

// Config module pattern — centralised with validation
function createConfig(env) {
  const required = ['JWT_SECRET', 'DB_URL'];
  const missing = required.filter(k => !env[k]);
  if (missing.length) throw new Error(\`Missing required env vars: \${missing.join(', ')}\`);

  return {
    env:      env.NODE_ENV  || 'development',
    port:     parseInt(env.PORT) || 3000,
    db:  { url: env.DB_URL, poolSize: parseInt(env.DB_POOL_SIZE) || 5 },
    jwt: { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES || '7d' },
  };
}

const config = createConfig(env);
console.log('Config loaded:');
console.log('  env:', config.env);
console.log('  port:', config.port);
console.log('  db.poolSize:', config.db.poolSize);
console.log('  jwt.expiresIn:', config.jwt.expiresIn);
console.log('  jwt.secret:', '*'.repeat(config.jwt.secret.length));`,
    content: `
<h1>Environment Variables &amp; dotenv</h1>

<h2>Setup</h2>
<pre><code>npm install dotenv

// .env (NEVER commit — add to .gitignore)
NODE_ENV=development
PORT=3000
DB_URL=mongodb://localhost:27017/myapp
JWT_SECRET=supersecretkey

// app.js — load first, before anything else
require('dotenv').config();
console.log(process.env.PORT); // '3000'</code></pre>

<h2>Config Module Pattern (best practice)</h2>
<pre><code>// config/index.js
require('dotenv').config();

// Validate required vars on startup
const required = ['DB_URL', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(\`Missing env var: \${key}\`);
});

module.exports = {
  env:  process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  db:   { url: process.env.DB_URL },
  jwt:  {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '7d',
  },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
};

// Usage anywhere in app
const config = require('./config');
app.listen(config.port);</code></pre>

<h2>Multiple Environments</h2>
<pre><code>.env              # defaults (not committed)
.env.development  # dev overrides
.env.test         # test overrides
.env.production   # prod (use real secrets manager in actual prod)
.env.example      # ✅ Commit this — shows required vars without values</code></pre>

<h2>.env.example</h2>
<pre><code># Copy to .env and fill in values
NODE_ENV=development
PORT=3000
DB_URL=
JWT_SECRET=
REDIS_URL=</code></pre>

<h2>Best Practices</h2>
<ul>
  <li>Always add <code>.env</code> to <code>.gitignore</code></li>
  <li>Commit <code>.env.example</code> with empty values as documentation</li>
  <li>Validate required vars at startup — fail fast</li>
  <li>Use a config module — don't scatter <code>process.env</code> everywhere</li>
  <li>In production: use AWS Secrets Manager, HashiCorp Vault, or K8s secrets</li>
</ul>`,
  },
  {
    id: 'testing',
    title: 'Testing (Jest & Supertest)',
    category: 'Quality',
    starterCode: `// Testing patterns simulation

// Simple test runner
let passed = 0, failed = 0;

function expect(value) {
  return {
    toBe: (expected) => {
      if (value === expected) { passed++; console.log('  ✅ passed'); }
      else { failed++; console.log(\`  ❌ expected \${expected}, got \${value}\`); }
    },
    toEqual: (expected) => {
      const a = JSON.stringify(value), b = JSON.stringify(expected);
      if (a === b) { passed++; console.log('  ✅ passed'); }
      else { failed++; console.log(\`  ❌ \${a} != \${b}\`); }
    },
    toThrow: () => {
      try { value(); failed++; console.log('  ❌ expected throw but did not'); }
      catch { passed++; console.log('  ✅ passed (threw correctly)'); }
    },
    toBeTruthy: () => {
      if (value) { passed++; console.log('  ✅ passed'); }
      else { failed++; console.log('  ❌ expected truthy'); }
    },
  };
}

function test(name, fn) {
  console.log('TEST:', name);
  fn();
}

// Unit under test
function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}

function isPalindrome(str) {
  const s = str.toLowerCase().replace(/[^a-z]/g, '');
  return s === s.split('').reverse().join('');
}

// Tests
test('divides correctly', () => {
  expect(divide(10, 2)).toBe(5);
  expect(divide(9, 3)).toBe(3);
});

test('throws on zero', () => {
  expect(() => divide(5, 0)).toThrow();
});

test('palindrome check', () => {
  expect(isPalindrome('racecar')).toBeTruthy();
  expect(isPalindrome('A man a plan a canal Panama')).toBeTruthy();
});

console.log(\`\\nResults: \${passed} passed, \${failed} failed\`);`,
    content: `
<h1>Testing — Jest &amp; Supertest</h1>

<h2>Jest Basics</h2>
<pre><code>// math.test.js
const { add, divide } = require('./math');

describe('Math functions', () => {
  test('adds numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('throws on divide by zero', () => {
    expect(() => divide(5, 0)).toThrow('Cannot divide by zero');
  });
});</code></pre>

<h2>Common Matchers</h2>
<pre><code>expect(5).toBe(5)                     // strict ===
expect({a:1}).toEqual({a:1})          // deep equality
expect([1,2,3]).toContain(2)          // array has item
expect('hello').toMatch(/ell/)        // regex
expect(fn).toThrow()                  // function throws
expect(value).toBeTruthy()            // truthy
expect(value).toBeNull()              // null
expect(5).toBeGreaterThan(3)          // > 3
expect(mockFn).toHaveBeenCalled()     // mock was called
expect(mockFn).toHaveBeenCalledWith('arg') // called with</code></pre>

<h2>Async Tests</h2>
<pre><code>test('async with await', async () => {
  const data = await fetchUser(1);
  expect(data.name).toBe('Alice');
});

test('async error', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid ID');
});</code></pre>

<h2>Mocking</h2>
<pre><code>jest.mock('../db');
const db = require('../db');
db.findUser.mockResolvedValue({ id: 1, name: 'Alice' });

const mockFn = jest.fn().mockReturnValue(42);
console.log(mockFn()); // 42

// Spy on existing method
const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
// ... code ...
expect(spy).toHaveBeenCalledWith('expected');
spy.mockRestore();</code></pre>

<h2>API Testing with Supertest</h2>
<pre><code>// app.js — export app WITHOUT listening
const app = express();
// ... routes ...
module.exports = app;

// app.test.js
const request = require('supertest');
const app = require('./app');

test('GET /users returns 200', async () => {
  const res = await request(app)
    .get('/users')
    .set('Authorization', 'Bearer token')
    .expect(200)
    .expect('Content-Type', /json/);

  expect(res.body).toHaveLength(1);
});</code></pre>

<h2>Test Types</h2>
<table>
  <tr><th>Type</th><th>Tests</th><th>Speed</th><th>Mocks?</th></tr>
  <tr><td>Unit</td><td>Single function in isolation</td><td>Very fast</td><td>Yes</td></tr>
  <tr><td>Integration</td><td>Multiple modules together (route + real DB)</td><td>Medium</td><td>Sometimes</td></tr>
  <tr><td>E2E</td><td>Full user flows</td><td>Slow</td><td>No</td></tr>
</table>`,
  },
  {
    id: 'interview-qa',
    title: 'Interview Q&A',
    category: 'Interview',
    starterCode: `// Practice: implement common interview questions

// Q1: Implement a simple EventEmitter
class EventEmitter {
  constructor() { this._events = {}; }
  on(event, fn) { (this._events[event] ??= []).push(fn); return this; }
  off(event, fn) { this._events[event] = (this._events[event]||[]).filter(f=>f!==fn); }
  once(event, fn) {
    const wrapper = (...args) => { fn(...args); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }
  emit(event, ...args) { (this._events[event]||[]).forEach(f=>f(...args)); }
}

const e = new EventEmitter();
e.once('data', d => console.log('once:', d));
e.on('data', d => console.log('on:', d));
e.emit('data', 'first');   // both fire
e.emit('data', 'second');  // only 'on' fires (once already removed)

// Q2: Implement Promise.all
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let remaining = promises.length;
    if (!remaining) return resolve([]);
    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val;
        if (--remaining === 0) resolve(results);
      }).catch(reject);
    });
  });
}

myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
]).then(r => console.log('Promise.all:', r));

// Q3: Debounce function
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
const debouncedLog = debounce(msg => console.log('debounced:', msg), 100);
debouncedLog('a'); debouncedLog('b'); debouncedLog('c'); // only 'c' logs`,
    content: `
<h1>Interview Q&amp;A</h1>

<div class="qa-block"><div class="qa-q">Q: How does Node.js handle asynchronous operations?</div>
<div class="qa-a">Through its event-driven architecture and event loop. When an async operation starts (fs.readFile, DB query), Node registers a callback and immediately moves on. libuv handles the actual I/O using the OS or thread pool. On completion, the callback enters the event queue. The event loop picks it up when the call stack is empty and executes it. This lets one thread handle thousands of concurrent I/O operations.</div></div>

<div class="qa-block"><div class="qa-q">Q: Explain the event loop phases.</div>
<div class="qa-a">Timers → Pending Callbacks → Idle/Prepare → Poll → Check → Close Callbacks. Between each phase, microtask queues drain first: process.nextTick (highest priority), then Promise callbacks. Poll is where most I/O callbacks run — if the queue is empty, it waits for new events.</div></div>

<div class="qa-block"><div class="qa-q">Q: Why is Node.js single-threaded? Is it truly single-threaded?</div>
<div class="qa-a">Single-threaded at the JS execution level to avoid complexity: no deadlocks, race conditions, or synchronization. But not fully single-threaded: libuv uses a 4-thread pool for file I/O, crypto, DNS. The Cluster module forks processes. Worker Threads enable parallel JS. "Single-threaded" means your JS code runs in one thread — the runtime internals are not.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is callback hell and how do you solve it?</div>
<div class="qa-a">Deeply nested callbacks where each async op depends on the previous — a "pyramid of doom" that's hard to read, debug, and maintain. Solutions: (1) Promises — flat .then() chains, (2) async/await — synchronous-looking async code, (3) named functions — extract anonymous callbacks into named functions.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is the difference between cluster and worker threads?</div>
<div class="qa-a">Cluster forks separate OS processes — own memory, event loop, V8. Communicates via IPC. Best for HTTP servers, I/O-heavy. Worker Threads are threads within the same process — can share memory via SharedArrayBuffer, lower overhead. Best for CPU-intensive work like image processing or ML. Crash in a cluster worker is isolated; thread crash can affect the process.</div></div>

<div class="qa-block"><div class="qa-q">Q: How do you handle errors in Node.js?</div>
<div class="qa-a">Three layers: (1) try/catch inside async/await functions, (2) Express global error middleware (err, req, res, next) — catches anything passed to next(err), (3) process.on('unhandledRejection') and process.on('uncaughtException') as last-resort safety nets — these should exit the process since state is unreliable. Use custom error classes with statusCode and isOperational to distinguish operational errors from programmer bugs.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is middleware in Express?</div>
<div class="qa-a">A function with signature (req, res, next) that sits in the request-response pipeline. Can read/modify req or res, end the cycle by sending a response, or call next() to pass control. Runs in registration order. Types: application-level (app.use), router-level, route-specific, error-handling (4 params), built-in (json parser, static). Always call next() unless sending a response — otherwise the request hangs.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is the difference between process.nextTick and setImmediate?</div>
<div class="qa-a">process.nextTick fires before the next event loop iteration begins — it's a microtask with the highest priority, even above Promise callbacks. setImmediate fires in the Check phase of the event loop, after I/O callbacks. If both are called inside an I/O callback, nextTick always runs first. Overusing process.nextTick can starve I/O — prefer setImmediate for general async deferral.</div></div>

<div class="qa-block"><div class="qa-q">Q: How do you prevent memory leaks in Node.js?</div>
<div class="qa-a">Common causes: global variables accumulating data, event listeners not removed (emitter.off()), intervals not cleared (clearInterval), closures holding large object refs, pending Promises. Detection: monitor process.memoryUsage().heapUsed over time — steady growth indicates a leak. Use node --inspect with Chrome DevTools heap snapshots to compare object counts between snapshots. Fix: use WeakMap/WeakSet for caches, always remove event listeners when done, add TTL to caches.</div></div>`,
  },
];
