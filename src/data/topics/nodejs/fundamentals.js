export const fundamentals = [
  {
    id: 'overview',
    title: 'What is Node.js?',
    category: 'Fundamentals',
    starterCode: `// Node.js Architecture Demo
// (Browser-compatible simulation)

// Simulate non-blocking behavior
console.log('=== Node.js Execution Model ===');
console.log('1. Sync: Reading config...');

// Simulating async I/O (non-blocking)
setTimeout(() => console.log('4. Async: File read complete'), 100);
setTimeout(() => console.log('5. Async: DB query complete'), 200);

console.log('2. Sync: Starting HTTP server...');
console.log('3. Sync: Server ready — handling requests now');

// Output shows Node.js continues while I/O happens in background`,
    content: `
<h1>What is Node.js?</h1>
<p>Node.js is an <strong>open-source, cross-platform JavaScript runtime environment</strong> that executes JavaScript code outside the browser. It is built on Chrome's <strong>V8 engine</strong> and uses <strong>libuv</strong> for async I/O.</p>

<h2>Architecture</h2>
<pre><code>Your JavaScript Code
        ↓
Node.js Bindings (C++)
        ↓
V8 Engine              +     libuv
(executes JS code)          (event loop, async I/O, thread pool)
        ↓                           ↓
   Machine Code             OS-level operations</code></pre>

<h2>Traditional Server vs Node.js</h2>
<table>
  <tr><th></th><th>Traditional (Apache)</th><th>Node.js</th></tr>
  <tr><td>Per Request</td><td>New OS thread (~2MB)</td><td>Event loop callback</td></tr>
  <tr><td>1000 connections</td><td>~2GB memory</td><td>~few MB</td></tr>
  <tr><td>I/O waiting</td><td>Thread blocks</td><td>Non-blocking, moves on</td></tr>
  <tr><td>Best for</td><td>CPU-intensive tasks</td><td>I/O-heavy, real-time apps</td></tr>
</table>

<h2>Key Characteristics</h2>
<ul>
  <li><strong>Event-driven</strong> — responds to events (HTTP requests, file reads, timers)</li>
  <li><strong>Non-blocking I/O</strong> — never waits; delegates I/O to OS/libuv and moves on</li>
  <li><strong>Single-threaded JS</strong> — one main thread, no race conditions in your code</li>
  <li><strong>Cross-platform</strong> — same code on Windows, macOS, Linux</li>
  <li><strong>NPM ecosystem</strong> — world's largest software registry (~2M+ packages)</li>
</ul>

<h2>Common Use Cases</h2>
<table>
  <tr><th>Use Case</th><th>Why Node.js</th><th>Examples</th></tr>
  <tr><td>REST APIs</td><td>Fast, lightweight, handles many requests</td><td>Express, Fastify</td></tr>
  <tr><td>Real-time apps</td><td>Event-driven, WebSocket support</td><td>Chat, live dashboards</td></tr>
  <tr><td>Streaming</td><td>Stream data chunk-by-chunk efficiently</td><td>Video, file transfer</td></tr>
  <tr><td>CLI tools</td><td>Scripting with JS</td><td>Webpack, ESLint</td></tr>
  <tr><td>Microservices</td><td>Lightweight, fast startup</td><td>Docker containers</td></tr>
</table>

<h2>Companies Using Node.js</h2>
<table>
  <tr><th>Company</th><th>Result</th></tr>
  <tr><td>Netflix</td><td>Startup time reduced by 70%</td></tr>
  <tr><td>LinkedIn</td><td>20x fewer servers, 2-10x faster</td></tr>
  <tr><td>PayPal</td><td>35% faster response time</td></tr>
  <tr><td>Uber</td><td>Handles millions of events/sec</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: Why is Node.js good for I/O-heavy applications?</div>
  <div class="qa-a">Because Node.js uses non-blocking I/O — when an I/O operation starts (DB query, file read), Node registers a callback and immediately moves on to handle other work. The callback fires when the operation completes. This means one Node.js server can handle thousands of concurrent I/O operations without spawning thousands of threads.</div>
</div>`,
  },
  {
    id: 'v8',
    title: 'V8 Engine',
    category: 'Fundamentals',
    starterCode: `// V8 JIT Optimization Demo
// V8 optimizes "hot" code paths it sees repeatedly

function add(a, b) {
  return a + b;
}

// First calls — V8 interprets (Ignition bytecode)
console.log('First calls (interpreting):');
console.log(add(1, 2));
console.log(add(3, 4));

// After many calls with same types — V8 JIT compiles (TurboFan)
// V8 assumes a and b are always numbers and optimizes
let sum = 0;
for (let i = 0; i < 1000; i++) sum = add(sum, i);
console.log('After 1000 calls (JIT optimized), sum:', sum);

// DEOPTIMIZATION: passing different types breaks the assumption
console.log('Deoptimize:', add('hello', ' world')); // string now!
// V8 has to fall back and re-optimize`,
    content: `
<h1>V8 Engine</h1>
<p>V8 is Google's open-source, high-performance JavaScript engine written in C++. Used in both Chrome and Node.js.</p>

<h2>JIT Compilation Pipeline</h2>
<pre><code>Source JS → Parser → AST → Ignition (Interpreter/Bytecode)
                                    ↓
                          Hot path detected (profiling)
                                    ↓
                         TurboFan (Optimizing Compiler)
                                    ↓
                           Optimized Machine Code
                                    ↓ (if type assumptions break)
                            Deoptimization → back to bytecode</code></pre>

<h2>Key Components</h2>
<table>
  <tr><th>Component</th><th>Role</th></tr>
  <tr><td>Parser</td><td>Converts JS source to AST (Abstract Syntax Tree)</td></tr>
  <tr><td>Ignition</td><td>Interpreter — converts AST to bytecode and executes it</td></tr>
  <tr><td>TurboFan</td><td>Optimizing compiler — compiles hot paths to machine code</td></tr>
  <tr><td>Orinoco GC</td><td>Garbage collector — manages heap memory</td></tr>
</table>

<h2>Garbage Collection</h2>
<p>V8 uses a <strong>generational garbage collector</strong>:</p>
<ul>
  <li><strong>Young Generation (Scavenger)</strong> — short-lived objects, collected very frequently and fast</li>
  <li><strong>Old Generation (Mark-Sweep)</strong> — long-lived objects, less frequent, more expensive GC</li>
</ul>

<h2>Memory Areas</h2>
<table>
  <tr><th>Area</th><th>What's Stored</th></tr>
  <tr><td>Heap</td><td>Objects, closures, arrays — V8 managed</td></tr>
  <tr><td>Stack</td><td>Primitives, function frames — auto-managed LIFO</td></tr>
  <tr><td>Buffer</td><td>Binary data — outside V8 heap, Node.js managed</td></tr>
</table>

<h2>Performance Tips for V8</h2>
<ul>
  <li>Keep object shapes consistent — don't add/delete properties dynamically (hidden classes)</li>
  <li>Use typed arrays for numeric data — V8 can optimize them heavily</li>
  <li>Avoid <code>arguments</code> object — use rest params instead</li>
  <li>Avoid frequent type changes — V8 deoptimizes when it sees mixed types</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: What is JIT compilation and why is it faster than interpretation?</div>
  <div class="qa-a">JIT (Just-In-Time) compilation converts JavaScript to native machine code at runtime, as opposed to interpreting it line-by-line. Machine code runs directly on the CPU without any translation overhead. V8 profiles which code paths run frequently ("hot paths") and specifically optimizes those with TurboFan, meaning the more you run code with consistent types, the faster V8 makes it.</div>
</div>`,
  },
  {
    id: 'event-loop',
    title: 'Event Loop',
    category: 'Fundamentals',
    starterCode: `// Event Loop Execution Order
// Demonstrates: sync → nextTick → Promise → Timer → setImmediate

console.log('=== Event Loop Order Demo ===');
console.log('1. sync start');

setTimeout(() => console.log('6. setTimeout (Timer phase)'), 0);

Promise.resolve()
  .then(() => console.log('4. Promise .then (microtask)'))
  .then(() => console.log('5. Promise chained .then'));

queueMicrotask(() => console.log('3. queueMicrotask'));

// Note: process.nextTick is Node.js only, not in browser
// In Node.js it would print as "2. process.nextTick"

console.log('2. sync end');

// Expected order:
// 1 → 2 → 3 → 4 → 5 → 6`,
    content: `
<h1>Event Loop</h1>
<p>The event loop is the heart of Node.js — it enables non-blocking I/O on a single thread by continuously checking for completed async operations and executing their callbacks.</p>

<h2>Event Loop Phases</h2>
<pre><code>   ┌──────────────────────────┐
┌─>│         timers           │  ← setTimeout, setInterval
│  └──────────┬───────────────┘
│  ┌──────────┴───────────────┐
│  │     pending callbacks    │  ← I/O errors from prev iteration
│  └──────────┬───────────────┘
│  ┌──────────┴───────────────┐
│  │     idle, prepare        │  ← internal Node.js use
│  └──────────┬───────────────┘
│  ┌──────────┴───────────────┐
│  │          poll            │  ← retrieve I/O events, execute callbacks
│  └──────────┬───────────────┘
│  ┌──────────┴───────────────┐
│  │          check           │  ← setImmediate callbacks
│  └──────────┬───────────────┘
│  ┌──────────┴───────────────┐
└──┤     close callbacks      │  ← socket.on('close', ...)
   └──────────────────────────┘
   ↑ Between EVERY phase: drain microtask queues (nextTick → Promise)</code></pre>

<h2>Microtask vs Macrotask Queues</h2>
<table>
  <tr><th>Type</th><th>Queue</th><th>Added By</th><th>Priority</th></tr>
  <tr><td>Microtask</td><td>nextTick queue</td><td>process.nextTick()</td><td>1st — highest</td></tr>
  <tr><td>Microtask</td><td>Promise queue</td><td>Promise.then(), queueMicrotask()</td><td>2nd</td></tr>
  <tr><td>Macrotask</td><td>Timer queue (min-heap)</td><td>setTimeout, setInterval</td><td>3rd</td></tr>
  <tr><td>Macrotask</td><td>I/O queue</td><td>fs.readFile, network</td><td>4th</td></tr>
  <tr><td>Macrotask</td><td>Check queue</td><td>setImmediate</td><td>5th</td></tr>
  <tr><td>Macrotask</td><td>Close queue</td><td>socket close events</td><td>6th</td></tr>
</table>

<h2>Full Execution Priority Order</h2>
<pre><code>Sync code
  → process.nextTick
    → Promise callbacks
      → Timers (setTimeout/setInterval)
        → I/O callbacks
          → setImmediate
            → Close callbacks</code></pre>

<h2>process.nextTick vs setImmediate</h2>
<table>
  <tr><th></th><th>process.nextTick()</th><th>setImmediate()</th></tr>
  <tr><td>When</td><td>Before next event loop phase (after current op)</td><td>Check phase — after I/O</td></tr>
  <tr><td>Microtask?</td><td>Yes — highest priority</td><td>No — macrotask</td></tr>
  <tr><td>Can starve I/O?</td><td>Yes — recursive use blocks loop</td><td>No</td></tr>
  <tr><td>Use case</td><td>Emit events post-constructor, critical deferrals</td><td>Post-I/O work</td></tr>
</table>

<h2>libuv Thread Pool</h2>
<ul>
  <li>Default: <strong>4 threads</strong></li>
  <li>Used for: file I/O, DNS, crypto, zlib</li>
  <li>Network I/O (TCP/UDP) does NOT use thread pool — uses OS epoll/kqueue</li>
  <li>Increase: <code>UV_THREADPOOL_SIZE=8 node server.js</code></li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: What happens if you block the event loop?</div>
  <div class="qa-a">All other operations halt — no HTTP requests processed, no timers fire, no I/O callbacks run. The app becomes completely unresponsive. Example: a large synchronous loop or crypto.pbkdf2Sync() call in a route handler will block all other users. Solution: use async APIs, offload CPU work to Worker Threads, or break work into chunks using setImmediate.</div>
</div>`,
  },
];
