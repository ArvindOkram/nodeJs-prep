export const nodejsAdvanced = [
  {
    id: 'worker-threads',
    title: 'Worker Threads',
    category: 'Advanced',
    starterCode: `// Worker Threads Concepts (Browser-compatible simulation)
// In real Node.js you'd use require('worker_threads')

// Simulating shared memory with SharedArrayBuffer
const shared = new SharedArrayBuffer(16);
const view = new Int32Array(shared);

// Simulate two "threads" writing to shared memory
view[0] = 42;
view[1] = 100;
console.log('=== SharedArrayBuffer Demo ===');
console.log('Shared memory view:', Array.from(view));

// Simulate Atomics for thread-safe operations
Atomics.store(view, 0, 99);
Atomics.add(view, 1, 50);
console.log('After Atomics.store(0, 99):', Atomics.load(view, 0));
console.log('After Atomics.add(1, 50):', Atomics.load(view, 1));

// Worker pool pattern simulation
class WorkerPool {
  constructor(size) {
    this.size = size;
    this.queue = [];
    this.active = 0;
  }
  submit(task) {
    return new Promise((resolve) => {
      const run = () => {
        this.active++;
        console.log('Running task, active workers:', this.active + '/' + this.size);
        setTimeout(() => {
          this.active--;
          resolve(task());
          if (this.queue.length > 0) this.queue.shift()();
        }, 100);
      };
      if (this.active < this.size) run();
      else this.queue.push(run);
    });
  }
}

const pool = new WorkerPool(2);
console.log('\\n=== Worker Pool Pattern ===');
Promise.all([
  pool.submit(() => 'Task A done'),
  pool.submit(() => 'Task B done'),
  pool.submit(() => 'Task C done (was queued)'),
]).then(results => results.forEach(r => console.log(r)));

// MessageChannel simulation
console.log('\\n=== MessageChannel Demo ===');
const channel = new MessageChannel();
channel.port1.onmessage = (e) => console.log('Port1 received:', e.data);
channel.port2.postMessage({ type: 'COMPUTE', payload: [1,2,3] });`,
    content: `
<h1>Worker Threads</h1>
<p>Worker Threads (<code>worker_threads</code> module, added in Node.js 10.5) allow you to run JavaScript in <strong>parallel OS threads</strong> that share the same process memory. Unlike child processes, workers share the V8 isolate heap boundary but each get their own V8 instance and event loop. This makes them ideal for <strong>CPU-bound tasks</strong> without the overhead of process spawning.</p>

<h2>Architecture Overview</h2>
<pre><code>Main Thread (Event Loop)
├── Worker Thread 1 (own V8 instance + event loop)
├── Worker Thread 2 (own V8 instance + event loop)
└── Worker Thread N
    ↕ Communication via:
    - parentPort / MessagePort (structured clone)
    - SharedArrayBuffer (zero-copy shared memory)
    - Transferable objects (ArrayBuffer ownership transfer)</code></pre>

<h2>Basic Usage</h2>
<pre><code>// main.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread — spawn a worker
  const worker = new Worker(__filename, {
    workerData: { start: 0, end: 1_000_000 }
  });

  worker.on('message', (result) => console.log('Sum:', result));
  worker.on('error', (err) => console.error('Worker error:', err));
  worker.on('exit', (code) => {
    if (code !== 0) console.error('Worker exited with code', code);
  });
} else {
  // Worker thread — do CPU-intensive work
  const { start, end } = workerData;
  let sum = 0;
  for (let i = start; i < end; i++) sum += i;
  parentPort.postMessage(sum);
}</code></pre>

<h2>Worker Threads vs Child Process vs Cluster</h2>
<table>
  <tr><th>Feature</th><th>Worker Threads</th><th>Child Process</th><th>Cluster</th></tr>
  <tr><td>Module</td><td><code>worker_threads</code></td><td><code>child_process</code></td><td><code>cluster</code></td></tr>
  <tr><td>Memory</td><td>Shared (SharedArrayBuffer)</td><td>Separate per process</td><td>Separate per process</td></tr>
  <tr><td>Overhead</td><td>Low (~few MB per worker)</td><td>High (~30MB+ per process)</td><td>High (full process clone)</td></tr>
  <tr><td>Communication</td><td>MessagePort, SharedArrayBuffer</td><td>IPC (serialized JSON)</td><td>IPC (serialized JSON)</td></tr>
  <tr><td>Use Case</td><td>CPU-bound parallel computation</td><td>Run external programs, isolation</td><td>Multi-core HTTP servers</td></tr>
  <tr><td>Isolation</td><td>Same process, separate V8</td><td>Full process isolation</td><td>Full process isolation</td></tr>
  <tr><td>Crash Impact</td><td>Can crash main process</td><td>Isolated crash</td><td>Isolated crash</td></tr>
  <tr><td>Spawn Time</td><td>~5-10ms</td><td>~30-100ms</td><td>~30-100ms</td></tr>
</table>

<h2>SharedArrayBuffer &amp; Atomics</h2>
<p>SharedArrayBuffer allows true shared memory between threads. Without Atomics, concurrent access leads to race conditions.</p>
<pre><code>// Main thread
const shared = new SharedArrayBuffer(4); // 4 bytes
const view = new Int32Array(shared);     // typed view

const worker = new Worker('./worker.js', { workerData: { shared } });

// Worker thread (worker.js)
const { workerData } = require('worker_threads');
const view = new Int32Array(workerData.shared);

// Thread-safe operations with Atomics
Atomics.add(view, 0, 1);          // atomic increment
Atomics.store(view, 0, 42);       // atomic write
const val = Atomics.load(view, 0); // atomic read

// Wait/notify for thread synchronization
Atomics.wait(view, 0, 0);         // block until view[0] !== 0
Atomics.notify(view, 0, 1);       // wake one waiting thread</code></pre>

<h3>Atomics API Reference</h3>
<table>
  <tr><th>Method</th><th>Description</th></tr>
  <tr><td><code>Atomics.load(arr, idx)</code></td><td>Read value atomically</td></tr>
  <tr><td><code>Atomics.store(arr, idx, val)</code></td><td>Write value atomically</td></tr>
  <tr><td><code>Atomics.add(arr, idx, val)</code></td><td>Add and return old value</td></tr>
  <tr><td><code>Atomics.sub(arr, idx, val)</code></td><td>Subtract and return old value</td></tr>
  <tr><td><code>Atomics.compareExchange(arr, idx, expected, replacement)</code></td><td>CAS operation</td></tr>
  <tr><td><code>Atomics.wait(arr, idx, val, timeout?)</code></td><td>Block thread until value changes</td></tr>
  <tr><td><code>Atomics.notify(arr, idx, count)</code></td><td>Wake waiting threads</td></tr>
</table>

<h2>Worker Pool Pattern</h2>
<p>Creating a new worker per task is expensive. A worker pool reuses a fixed number of workers, queuing tasks when all are busy. Libraries like <code>workerpool</code> and <code>piscina</code> implement this.</p>
<pre><code>const { Worker } = require('worker_threads');
const os = require('os');

class WorkerPool {
  constructor(workerFile, poolSize = os.cpus().length) {
    this.workerFile = workerFile;
    this.pool = [];
    this.queue = [];

    for (let i = 0; i < poolSize; i++) {
      this.pool.push({ worker: new Worker(workerFile), busy: false });
    }
  }

  run(taskData) {
    return new Promise((resolve, reject) => {
      const available = this.pool.find(w => !w.busy);
      if (available) {
        this._execute(available, taskData, resolve, reject);
      } else {
        this.queue.push({ taskData, resolve, reject });
      }
    });
  }

  _execute(entry, taskData, resolve, reject) {
    entry.busy = true;
    entry.worker.postMessage(taskData);
    const onMessage = (result) => {
      entry.worker.removeListener('error', onError);
      entry.busy = false;
      resolve(result);
      // Process queued task
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this._execute(entry, next.taskData, next.resolve, next.reject);
      }
    };
    const onError = (err) => {
      entry.worker.removeListener('message', onMessage);
      entry.busy = false;
      reject(err);
    };
    entry.worker.once('message', onMessage);
    entry.worker.once('error', onError);
  }

  destroy() {
    this.pool.forEach(({ worker }) => worker.terminate());
  }
}

// Usage
const pool = new WorkerPool('./heavy-task.js', 4);
const results = await Promise.all([
  pool.run({ task: 'resize', file: 'img1.jpg' }),
  pool.run({ task: 'resize', file: 'img2.jpg' }),
  pool.run({ task: 'resize', file: 'img3.jpg' }),
]);</code></pre>

<h2>MessageChannel &amp; Transferable Objects</h2>
<pre><code>const { Worker, MessageChannel } = require('worker_threads');

// MessageChannel — direct port-to-port communication
const { port1, port2 } = new MessageChannel();
const worker = new Worker('./worker.js');

// Transfer port2 to the worker (zero-copy)
worker.postMessage({ port: port2 }, [port2]);

// Communicate directly via port1
port1.on('message', (msg) => console.log('From worker:', msg));
port1.postMessage('Hello worker!');

// Transferable Objects — zero-copy ArrayBuffer transfer
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
// After transfer, buffer.byteLength becomes 0 in sender
worker.postMessage({ data: buffer }, [buffer]);
console.log(buffer.byteLength); // 0 — ownership transferred</code></pre>

<h2>Real-World Use Cases</h2>
<table>
  <tr><th>Use Case</th><th>Why Worker Threads</th><th>Alternative</th></tr>
  <tr><td>Image processing (sharp)</td><td>CPU-heavy pixel manipulation</td><td>C++ addon</td></tr>
  <tr><td>Video transcoding</td><td>Parallel frame processing</td><td>ffmpeg child process</td></tr>
  <tr><td>Bcrypt hashing</td><td>Prevent blocking event loop</td><td>crypto thread pool</td></tr>
  <tr><td>JSON parsing large files</td><td>Parse in worker, send result</td><td>Streaming parser</td></tr>
  <tr><td>Machine learning inference</td><td>Tensor math is CPU-bound</td><td>TensorFlow C++ binding</td></tr>
  <tr><td>PDF generation</td><td>Layout computation is heavy</td><td>Puppeteer child process</td></tr>
</table>

<h2>Production Best Practices</h2>
<ul>
  <li><strong>Pool workers</strong> — never create a new worker per request; use piscina or a custom pool</li>
  <li><strong>Use transferable objects</strong> when sending large buffers to avoid structured clone overhead</li>
  <li><strong>Handle worker crashes</strong> — listen to <code>error</code> and <code>exit</code> events, restart workers automatically</li>
  <li><strong>Limit pool size</strong> to <code>os.cpus().length - 1</code> to leave the main thread a core</li>
  <li><strong>Avoid sharing mutable state</strong> unless absolutely necessary; prefer message passing</li>
  <li><strong>Profile first</strong> — only offload to workers if the task actually blocks the event loop (&gt;50ms)</li>
</ul>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: When should you use Worker Threads vs Child Processes vs Cluster?</div>
  <div class="qa-a">Use <strong>Worker Threads</strong> for CPU-bound tasks (computation, parsing, image processing) where you need shared memory and low overhead. Use <strong>Child Processes</strong> when you need full isolation (running untrusted code, executing external programs like ffmpeg). Use <strong>Cluster</strong> when you want to scale an HTTP server across all CPU cores with automatic load balancing. Key difference: workers share process memory (via SharedArrayBuffer), while child processes and cluster workers have completely separate memory spaces.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does data transfer work between threads? What is structured cloning?</div>
  <div class="qa-a">By default, data sent via <code>postMessage()</code> is <strong>structured-cloned</strong> — a deep copy algorithm that handles objects, arrays, Maps, Sets, Dates, RegExps, ArrayBuffers, etc. (but NOT functions or prototypes). For large data, this copy is expensive. Two optimizations exist: (1) <strong>Transferable objects</strong> — ownership of an ArrayBuffer is moved to the receiver (zero-copy, sender loses access). (2) <strong>SharedArrayBuffer</strong> — both threads access the same memory with no copying, but you must use Atomics for thread safety.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if a Worker Thread throws an unhandled exception?</div>
  <div class="qa-a">If a worker has an unhandled exception and the main thread has an <code>error</code> event listener on that worker, the error is emitted there. If there is NO error listener, the error propagates to the main thread as an unhandled rejection. The worker then exits with code 1. The <code>exit</code> event fires with a non-zero code. Importantly, unlike child processes, an unhandled error in a worker does NOT automatically crash the main process if you have proper error handlers — but shared state corruption via SharedArrayBuffer could cause issues.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain Atomics.wait() and Atomics.notify(). Why can you not use Atomics.wait() on the main thread?</div>
  <div class="qa-a"><code>Atomics.wait()</code> blocks the calling thread until the value at a given index changes or a timeout is reached. <code>Atomics.notify()</code> wakes threads waiting on that index. You <strong>cannot use Atomics.wait() on the main thread</strong> because it would block the event loop, freezing all I/O, timers, and request handling. Node.js throws a TypeError if you try. On worker threads, blocking is acceptable because each worker has its own event loop. Use <code>Atomics.waitAsync()</code> (non-blocking, returns a Promise) as the main-thread alternative.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a worker pool for an image processing API?</div>
  <div class="qa-a">Create a pool of N workers (N = CPU cores - 1) at server startup. Each worker loads the image processing library (e.g., sharp). Incoming requests are queued and dispatched to available workers via postMessage. The worker processes the image and sends the result back. Key considerations: (1) Use transferable ArrayBuffers to send/receive image data without copying. (2) Set a timeout per task to kill hung workers and replace them. (3) Implement backpressure — if the queue exceeds a threshold, return 503 to new requests. (4) Monitor worker health and restart crashed workers. Libraries like <strong>piscina</strong> handle all of this with a battle-tested implementation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can Worker Threads share JavaScript objects directly?</div>
  <div class="qa-a">No. JavaScript objects cannot be directly shared between threads because each worker has its own V8 isolate with its own heap. The only way to share memory is through <strong>SharedArrayBuffer</strong>, which provides raw binary memory. If you need to share structured data, you must (1) serialize/deserialize manually into the SharedArrayBuffer, or (2) use postMessage with structured cloning (which creates a copy). This is fundamentally different from languages like Java where threads share the same heap and object references.</div>
</div>
`
  },
  {
    id: 'libuv',
    title: 'Libuv & Thread Pool',
    category: 'Core',
    starterCode: `// Libuv & Event Loop Deep Dive (Browser-compatible simulation)

// Simulating event loop phases
console.log('=== Event Loop Phase Simulation ===');

// Phase 1: Timers
setTimeout(() => console.log('Phase 1 - Timer callback'), 0);

// Phase 2: I/O (simulated via Promise microtask)
Promise.resolve().then(() => console.log('Microtask - runs between phases'));

// Phase 3: setImmediate equivalent (simulated)
// In Node.js: setImmediate(() => ...)
setTimeout(() => console.log('Phase 4 - Check/Immediate equivalent'), 0);

// Phase 5: Close callbacks
// In Node.js: socket.on('close', () => ...)

console.log('Synchronous code runs first');

// Simulating thread pool behavior
console.log('\\n=== Thread Pool Simulation ===');
const UV_THREADPOOL_SIZE = 4;
let activeThreads = 0;
const taskQueue = [];

function submitToThreadPool(taskName, duration) {
  return new Promise((resolve) => {
    const execute = () => {
      activeThreads++;
      console.log('Thread pool: START ' + taskName +
        ' (active: ' + activeThreads + '/' + UV_THREADPOOL_SIZE + ')');
      setTimeout(() => {
        console.log('Thread pool: DONE ' + taskName);
        activeThreads--;
        resolve(taskName);
        if (taskQueue.length > 0) taskQueue.shift()();
      }, duration);
    };
    if (activeThreads < UV_THREADPOOL_SIZE) execute();
    else {
      console.log('Thread pool: QUEUED ' + taskName);
      taskQueue.push(execute);
    }
  });
}

// Submit 6 tasks to a pool of 4
Promise.all([
  submitToThreadPool('fs.readFile', 200),
  submitToThreadPool('crypto.pbkdf2', 300),
  submitToThreadPool('dns.lookup', 150),
  submitToThreadPool('zlib.gzip', 250),
  submitToThreadPool('fs.stat (queued)', 100),
  submitToThreadPool('crypto.randomBytes (queued)', 200),
]).then(results => {
  console.log('\\nAll tasks complete:', results);
});`,
    content: `
<h1>Libuv &amp; Thread Pool</h1>
<p><strong>libuv</strong> is the C library that powers Node.js's asynchronous I/O. It provides the event loop, thread pool, async file/network operations, timers, signals, and child process management. Understanding libuv is critical for diagnosing performance bottlenecks and understanding why certain operations behave differently.</p>

<h2>Libuv Architecture</h2>
<pre><code>                    Node.js Application
                           │
                    Node.js Bindings (C++)
                           │
                         libuv
                    ┌──────┴──────┐
                    │  Event Loop │
                    └──────┬──────┘
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────┴─────┐   ┌──────┴──────┐   ┌─────┴─────┐
   │ Thread Pool│   │  OS Async   │   │  Timers   │
   │ (4 threads)│   │  Primitives │   │  Heap     │
   │            │   │             │   │           │
   │ - fs ops   │   │ - TCP/UDP   │   │ - setTimeout│
   │ - DNS      │   │ - Pipes     │   │ - setInterval│
   │ - crypto   │   │ - TTY       │   │           │
   │ - zlib     │   │ - Signals   │   │           │
   └────────────┘   └─────────────┘   └───────────┘
                           │
                    ┌──────┴──────┐
                    │  OS Kernel  │
                    │ epoll/kqueue│
                    │ IOCP        │
                    └─────────────┘</code></pre>

<h2>Event Loop Phases — Deep Dive</h2>
<pre><code>   ┌───────────────────────────┐
┌─►│        timers              │  ← setTimeout, setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks      │  ← I/O callbacks deferred to next iteration
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare        │  ← internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐     ┌───────────────┐
│  │           poll             │◄────┤  incoming:    │
│  │  (retrieve new I/O events) │     │  connections, │
│  └─────────────┬─────────────┘     │  data, etc.   │
│  ┌─────────────┴─────────────┐     └───────────────┘
│  │           check            │  ← setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks       │  ← socket.on('close'), cleanup
   └───────────────────────────┘

Between EVERY phase: process.nextTick queue + Promise microtask queue</code></pre>

<h3>Phase Details</h3>
<table>
  <tr><th>Phase</th><th>Description</th><th>Example Callbacks</th></tr>
  <tr><td><strong>Timers</strong></td><td>Execute callbacks scheduled by setTimeout/setInterval whose threshold has elapsed</td><td>setTimeout(cb, 100)</td></tr>
  <tr><td><strong>Pending</strong></td><td>Execute I/O callbacks deferred to next loop iteration (e.g., TCP errors)</td><td>ECONNREFUSED callbacks</td></tr>
  <tr><td><strong>Idle/Prepare</strong></td><td>Internal only — used by libuv internals</td><td>N/A</td></tr>
  <tr><td><strong>Poll</strong></td><td>Retrieve new I/O events; execute I/O callbacks. Blocks here if nothing else pending.</td><td>fs.read callback, incoming HTTP data</td></tr>
  <tr><td><strong>Check</strong></td><td>setImmediate callbacks execute here</td><td>setImmediate(cb)</td></tr>
  <tr><td><strong>Close</strong></td><td>Close event callbacks</td><td>socket.on('close')</td></tr>
</table>

<h2>Thread Pool</h2>
<p>libuv maintains a thread pool for operations that cannot be done asynchronously at the OS level. The default size is <strong>4 threads</strong>.</p>

<h3>Operations That Use the Thread Pool</h3>
<table>
  <tr><th>Category</th><th>Operations</th><th>Why Thread Pool?</th></tr>
  <tr><td><strong>File System</strong></td><td>fs.readFile, fs.writeFile, fs.stat, fs.readdir, etc.</td><td>POSIX file I/O is blocking; no true async file API on most OSes</td></tr>
  <tr><td><strong>DNS</strong></td><td>dns.lookup() (NOT dns.resolve)</td><td>Uses getaddrinfo() which is blocking C call</td></tr>
  <tr><td><strong>Crypto</strong></td><td>crypto.pbkdf2, crypto.scrypt, crypto.randomBytes, crypto.randomFill</td><td>CPU-intensive computation</td></tr>
  <tr><td><strong>Zlib</strong></td><td>zlib.gzip, zlib.deflate, zlib.inflate, etc.</td><td>CPU-intensive compression</td></tr>
  <tr><td><strong>C++ Addons</strong></td><td>uv_queue_work() from custom addons</td><td>Developer-offloaded blocking work</td></tr>
</table>

<h3>Operations That Use OS Async Mechanisms (NOT Thread Pool)</h3>
<table>
  <tr><th>Category</th><th>Operations</th><th>OS Mechanism</th></tr>
  <tr><td><strong>Network I/O</strong></td><td>TCP, UDP, HTTP, HTTPS, WebSocket</td><td>epoll (Linux), kqueue (macOS), IOCP (Windows)</td></tr>
  <tr><td><strong>DNS resolve</strong></td><td>dns.resolve(), dns.resolve4(), etc.</td><td>c-ares library (async DNS)</td></tr>
  <tr><td><strong>Pipes</strong></td><td>IPC, stdin/stdout</td><td>OS pipe primitives</td></tr>
  <tr><td><strong>Signals</strong></td><td>process.on('SIGTERM')</td><td>OS signal handling</td></tr>
  <tr><td><strong>Child processes</strong></td><td>child_process.spawn</td><td>OS process APIs</td></tr>
</table>

<h2>UV_THREADPOOL_SIZE</h2>
<pre><code>// Default: 4 threads
// Max: 1024 threads
// MUST be set before Node.js starts (environment variable)

// Set via environment variable (before node starts):
// UV_THREADPOOL_SIZE=8 node server.js

// Or in code (must be VERY early, before any async ops):
process.env.UV_THREADPOOL_SIZE = 16;

// When to increase:
// - High fs I/O concurrency
// - Many concurrent crypto operations
// - Lots of dns.lookup() calls
// - Seeing unexplained latency in fs/crypto operations</code></pre>

<h3>Thread Pool Saturation Problem</h3>
<pre><code>// If you make 10 concurrent fs.readFile calls with default pool size 4:
// - First 4 execute immediately on thread pool
// - Remaining 6 wait in queue
// - Total time ≈ 3x a single read (not 10x, but not 1x either)

const fs = require('fs');
const start = Date.now();

// 10 concurrent reads, only 4 threads available
for (let i = 0; i < 10; i++) {
  fs.readFile('/some/file', () => {
    console.log(\`File \${i}: \${Date.now() - start}ms\`);
  });
}
// You'll see results in 3 batches of 4-4-2</code></pre>

<h2>OS Async Primitives</h2>
<table>
  <tr><th>OS</th><th>Mechanism</th><th>Description</th></tr>
  <tr><td>Linux</td><td><strong>epoll</strong></td><td>Scalable I/O event notification. O(1) for monitoring, O(n) for ready fds.</td></tr>
  <tr><td>macOS/BSD</td><td><strong>kqueue</strong></td><td>Similar to epoll. Handles files, sockets, signals, processes, timers.</td></tr>
  <tr><td>Windows</td><td><strong>IOCP</strong></td><td>I/O Completion Ports. True async I/O — OS notifies on completion.</td></tr>
  <tr><td>SunOS</td><td><strong>event ports</strong></td><td>Solaris event notification facility.</td></tr>
</table>

<h2>process.nextTick vs setImmediate vs setTimeout</h2>
<pre><code>// Execution order:
// 1. Synchronous code
// 2. process.nextTick (microtask — runs between phases)
// 3. Promise.then (microtask — runs after nextTick)
// 4. setTimeout(cb, 0) — timer phase
// 5. setImmediate(cb) — check phase

process.nextTick(() => console.log('1. nextTick'));
Promise.resolve().then(() => console.log('2. Promise'));
setTimeout(() => console.log('3. setTimeout'), 0);
setImmediate(() => console.log('4. setImmediate'));
console.log('0. Synchronous');

// Output: 0, 1, 2, 3, 4
// (setTimeout vs setImmediate order can vary outside I/O cycle)</code></pre>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: What is libuv and why does Node.js need it?</div>
  <div class="qa-a">libuv is a multi-platform C library that provides Node.js with its event loop, async I/O operations, thread pool, timers, signals, and child process management. Node.js needs it because JavaScript is single-threaded — libuv bridges the gap by providing non-blocking I/O primitives that work across all operating systems. It abstracts away the differences between epoll (Linux), kqueue (macOS), and IOCP (Windows) behind a unified API. Without libuv, Node.js would have no way to perform async file I/O, network operations, or DNS lookups.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why does dns.lookup() use the thread pool but dns.resolve() does not?</div>
  <div class="qa-a"><code>dns.lookup()</code> calls the OS's <code>getaddrinfo()</code> function, which is a blocking C call that reads /etc/hosts, consults nsswitch.conf, and may query local DNS caches. Since it's blocking, it must run on the thread pool. <code>dns.resolve()</code> uses the <strong>c-ares</strong> library, which implements DNS resolution asynchronously using non-blocking sockets — it builds and sends DNS packets directly, bypassing the OS resolver. This means dns.resolve() does NOT consume a thread pool slot. In high-throughput servers, prefer dns.resolve() to avoid thread pool starvation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens when the thread pool is saturated? How do you diagnose it?</div>
  <div class="qa-a">When all thread pool threads are busy, new operations (fs, crypto, dns.lookup, zlib) queue up and wait. Symptoms include: unexplained latency in file reads or crypto operations, especially under load. To diagnose: (1) Use <code>UV_THREADPOOL_SIZE=128</code> and see if latency drops — if yes, pool was the bottleneck. (2) Use clinic.js doctor — it flags event loop delays caused by pool saturation. (3) Add timing around individual fs/crypto calls. Solutions: increase UV_THREADPOOL_SIZE, batch operations, use streaming APIs instead of readFile for large files, or use dns.resolve() instead of dns.lookup().</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the relationship between the poll phase and I/O callbacks. When does the event loop block?</div>
  <div class="qa-a">The poll phase has two main functions: (1) calculate how long it should block waiting for I/O, and (2) process events in the poll queue. When the event loop enters poll, if there are <strong>no timers scheduled</strong> and <strong>no setImmediate callbacks</strong>, the loop will block in the poll phase, waiting for I/O events (via epoll_wait/kevent). If a timer is scheduled, poll will block only until the next timer's threshold. If setImmediate is queued, poll won't block at all and moves to the check phase. This is why setImmediate always fires before setTimeout(0) inside an I/O callback — the I/O callback runs in poll, then check (setImmediate) runs before the loop wraps back to timers.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: In what order do process.nextTick, Promises, setTimeout(0), and setImmediate execute, and why?</div>
  <div class="qa-a">Order: (1) <strong>process.nextTick</strong> — highest priority microtask, runs immediately after current operation, before ANY other I/O or timers. (2) <strong>Promise.then</strong> — microtask queue, runs after all nextTick callbacks. (3) <strong>setTimeout(fn, 0)</strong> — timer phase, minimum delay is actually 1ms. (4) <strong>setImmediate</strong> — check phase, after poll. However, the order of setTimeout(0) vs setImmediate is non-deterministic in the main module (depends on process startup time). Inside an I/O callback, setImmediate always fires first because poll moves to check before wrapping to timers. nextTick can starve the event loop if called recursively — always prefer setImmediate for recursive async calls.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does libuv handle file I/O differently across operating systems?</div>
  <div class="qa-a">Unlike network I/O, most operating systems do NOT provide true async file I/O APIs. Linux has io_uring (recent) and AIO (limited), macOS has no reliable async file API, and only Windows has true async file I/O via IOCP. Because of this inconsistency, libuv uses the <strong>thread pool</strong> for ALL file system operations across all platforms — it simulates async behavior by running blocking POSIX calls (open, read, write, stat) on worker threads. The thread pool approach provides a consistent, portable API. Network I/O is different: all platforms have efficient async networking (epoll, kqueue, IOCP), so libuv uses those directly.</div>
</div>
`
  },
  {
    id: 'memory-management',
    title: 'Memory Management & GC',
    category: 'Advanced',
    starterCode: `// Memory Management & GC Concepts (Browser-compatible)

// V8 Memory Structure Demo
console.log('=== V8 Memory Zones ===');
const memoryZones = {
  'New Space (Young Gen)': 'Short-lived objects, ~1-8MB, Scavenge GC',
  'Old Space (Old Gen)': 'Long-lived objects, Mark-Sweep-Compact GC',
  'Large Object Space': 'Objects > 256KB, never moved by GC',
  'Code Space': 'JIT compiled code (executable memory)',
  'Map Space': 'Hidden classes / object shapes'
};
Object.entries(memoryZones).forEach(([zone, desc]) => {
  console.log(zone + ': ' + desc);
});

// Memory leak detection simulation
console.log('\\n=== Memory Leak Patterns ===');

// Leak 1: Growing array (simulates global cache without bounds)
const cache = [];
function addToCache(item) {
  cache.push(item);
  // Missing: eviction policy!
}
for (let i = 0; i < 5; i++) addToCache({ id: i, data: 'x'.repeat(100) });
console.log('Unbounded cache size:', cache.length);

// Leak 2: Closure holding reference
function createLeak() {
  const hugeData = new Array(10000).fill('leak');
  return function() {
    // This closure keeps hugeData alive even if only
    // a small part is needed
    return hugeData.length;
  };
}
const leakyFn = createLeak();
console.log('Closure holding large array, length:', leakyFn());

// Leak 3: Event listener accumulation
class Emitter {
  constructor() { this.listeners = []; }
  on(fn) { this.listeners.push(fn); }
  emit(data) { this.listeners.forEach(fn => fn(data)); }
  listenerCount() { return this.listeners.length; }
}
const emitter = new Emitter();
for (let i = 0; i < 100; i++) {
  emitter.on(() => {}); // Forgot to remove listeners!
}
console.log('Leaked listeners:', emitter.listenerCount());

// WeakRef demo
console.log('\\n=== WeakRef Demo ===');
let target = { name: 'important data', size: 'large' };
const weakRef = new WeakRef(target);
console.log('Before deref:', weakRef.deref()?.name);
target = null; // Allow GC to collect
// In real scenario, after GC, weakRef.deref() returns undefined
console.log('After nulling target, deref may still work (GC not yet run):', weakRef.deref()?.name);

// FinalizationRegistry demo
const registry = new FinalizationRegistry((heldValue) => {
  console.log('Object was garbage collected! Cleanup:', heldValue);
});
let obj = { data: 'temporary' };
registry.register(obj, 'cleanup-resource-123');
console.log('Registered object for finalization tracking');`,
    content: `
<h1>Memory Management &amp; Garbage Collection</h1>
<p>Understanding V8's memory management is critical for building high-performance Node.js applications. Memory leaks are among the most common production issues in long-running Node.js servers. This topic covers V8's heap structure, garbage collection strategies, common leak patterns, and profiling techniques.</p>

<h2>V8 Memory Structure</h2>
<pre><code>V8 Heap Memory
├── New Space (Young Generation)  ~1-8 MB
│   ├── Semi-space A (From)
│   └── Semi-space B (To)
├── Old Space (Old Generation)    ~700 MB - 1.7 GB
│   ├── Old Pointer Space         (objects with pointers to other objects)
│   └── Old Data Space            (objects with only data, no pointers)
├── Large Object Space            (objects > 256 KB, never moved)
├── Code Space                    (JIT-compiled executable code)
├── Map Space                     (hidden classes / shapes)
└── Cell Space, Property Cell, etc.

Non-Heap Memory
├── Stack (call stack, ~1 MB per thread)
├── Buffers (off-heap, C++ allocated)
└── External (C++ objects bound to JS)</code></pre>

<h3>Memory Limits</h3>
<table>
  <tr><th>Platform</th><th>Default Old Space Limit</th><th>Override</th></tr>
  <tr><td>64-bit</td><td>~1.7 GB</td><td><code>--max-old-space-size=4096</code> (4 GB)</td></tr>
  <tr><td>32-bit</td><td>~700 MB</td><td><code>--max-old-space-size=2048</code></td></tr>
  <tr><td>New Space</td><td>~1-8 MB (adjustable)</td><td><code>--max-semi-space-size=64</code></td></tr>
</table>

<h2>Garbage Collection Strategies</h2>

<h3>Scavenge (Minor GC) — Young Generation</h3>
<pre><code>New Space: Semi-space A (From) ←→ Semi-space B (To)

1. Objects are allocated in From-space
2. When From-space is full, Scavenge triggers:
   a. Live objects in From-space are identified (reachable from roots)
   b. Live objects are copied to To-space (compacted)
   c. Dead objects in From-space are discarded
   d. From and To spaces swap roles
3. Objects surviving 2 scavenges are "promoted" to Old Space

Characteristics:
- Very fast (~1-5ms)
- Runs frequently
- Uses Cheney's semi-space algorithm
- Stop-the-world (pauses JS execution)
- Only scans young generation (small)</code></pre>

<h3>Mark-Sweep-Compact (Major GC) — Old Generation</h3>
<pre><code>Three phases:

1. MARK — traverse object graph from roots (global, stack, handles)
   - Tri-color marking: white (unvisited), grey (visited, children pending), black (done)
   - Uses incremental marking to reduce pause times
   - Concurrent marking (V8 7.0+): marking on background threads

2. SWEEP — free memory of white (unreachable) objects
   - Creates free-list of available memory blocks
   - Can be done concurrently with JS execution

3. COMPACT (occasional) — defragment memory
   - Move live objects together to eliminate fragmentation
   - Update all pointers
   - Expensive, only when fragmentation is high

Characteristics:
- Slower than Scavenge (~10-100ms+ pauses)
- Runs less frequently
- Incremental + concurrent to reduce pauses
- Full stop-the-world only for pointer updates in compaction</code></pre>

<h3>GC Comparison</h3>
<table>
  <tr><th></th><th>Scavenge (Minor)</th><th>Mark-Sweep-Compact (Major)</th></tr>
  <tr><td>Space</td><td>New Space only</td><td>Old Space</td></tr>
  <tr><td>Frequency</td><td>Very frequent</td><td>Less frequent</td></tr>
  <tr><td>Speed</td><td>~1-5ms</td><td>~10-100ms+</td></tr>
  <tr><td>Algorithm</td><td>Copying (Cheney's)</td><td>Mark-Sweep-Compact</td></tr>
  <tr><td>Concurrency</td><td>Stop-the-world</td><td>Incremental + concurrent marking</td></tr>
  <tr><td>Trigger</td><td>From-space full</td><td>Old space growing, allocation failures</td></tr>
</table>

<h2>Common Memory Leak Patterns</h2>

<h3>1. Closures Retaining Large Scope</h3>
<pre><code>function processData() {
  const hugeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB
  // ... process buffer ...

  return function getStats() {
    // This closure keeps hugeBuffer alive!
    return hugeBuffer.length;
  };
}
const stats = processData(); // 100MB stuck in memory

// FIX: Extract only what you need
function processDataFixed() {
  const hugeBuffer = Buffer.alloc(100 * 1024 * 1024);
  const length = hugeBuffer.length;
  // hugeBuffer can be GC'd after this function returns
  return function getStats() {
    return length; // only captures the number
  };
}</code></pre>

<h3>2. Event Listener Accumulation</h3>
<pre><code>// LEAK: Adding listeners in a loop/request handler without removing
const EventEmitter = require('events');
const emitter = new EventEmitter();

function handleRequest(req, res) {
  // New listener added per request — never removed!
  emitter.on('data', (chunk) => {
    res.write(chunk);
  });
}

// FIX: Use once(), or remove listeners in cleanup
function handleRequestFixed(req, res) {
  const handler = (chunk) => res.write(chunk);
  emitter.on('data', handler);
  req.on('close', () => emitter.removeListener('data', handler));
}

// Node.js warning at 11 listeners:
// MaxListenersExceededWarning — possible EventEmitter memory leak</code></pre>

<h3>3. Unbounded Caches</h3>
<pre><code>// LEAK: Cache grows forever
const cache = new Map();
function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = db.findUser(id);
  cache.set(id, user); // never evicted!
  return user;
}

// FIX: Use LRU cache with max size
const LRU = require('lru-cache');
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 });</code></pre>

<h3>4. Global Variables &amp; Accidental Globals</h3>
<pre><code>// LEAK: Forgetting var/let/const creates global
function handler() {
  results = []; // implicitly global! Never GC'd
  // Use 'use strict' to catch this
}</code></pre>

<h3>5. Detached DOM / Orphaned Timers</h3>
<pre><code>// LEAK: setInterval keeps reference alive
function startPolling(resource) {
  setInterval(() => {
    resource.check(); // resource can never be GC'd
  }, 1000);
}

// FIX: Store and clear interval
function startPolling(resource) {
  const id = setInterval(() => resource.check(), 1000);
  resource.on('close', () => clearInterval(id));
}</code></pre>

<h2>process.memoryUsage()</h2>
<pre><code>const mem = process.memoryUsage();
console.log({
  rss:       mem.rss,       // Resident Set Size — total allocated by OS
  heapTotal: mem.heapTotal, // V8 heap allocated
  heapUsed:  mem.heapUsed,  // V8 heap actually used
  external:  mem.external,  // C++ objects bound to JS (Buffers)
  arrayBuffers: mem.arrayBuffers // ArrayBuffer + SharedArrayBuffer
});

// Key insight:
// heapUsed growing over time = likely JS memory leak
// rss growing but heapUsed stable = native/Buffer leak
// external growing = Buffer/C++ addon leak</code></pre>

<h2>Heap Snapshots &amp; Profiling</h2>
<pre><code>// 1. Chrome DevTools (recommended)
node --inspect server.js
// Open chrome://inspect → Take heap snapshot

// 2. Programmatic heap snapshot
const v8 = require('v8');
const fs = require('fs');

// Write snapshot to file
const snapshotStream = v8.writeHeapSnapshot();
console.log('Snapshot written to:', snapshotStream);

// 3. Heap dump on OOM
node --max-old-space-size=512 --heapsnapshot-signal=SIGUSR2 server.js
// Send: kill -USR2 &lt;pid&gt;

// 4. Compare snapshots technique
// Snapshot 1 → do operations → Snapshot 2 → compare
// Objects present in Snapshot 2 but not 1 = potential leaks

// 5. Clinic.js
// npx clinic heapprofiler -- node server.js</code></pre>

<h2>WeakRef &amp; FinalizationRegistry</h2>
<pre><code>// WeakRef — hold reference that doesn't prevent GC
let target = { data: 'large object' };
const weak = new WeakRef(target);

weak.deref(); // returns target object (or undefined if GC'd)
target = null; // now GC can collect it

// FinalizationRegistry — callback when object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log('Cleaned up:', heldValue);
  // Close file handles, release native resources, etc.
});

let resource = createExpensiveResource();
registry.register(resource, 'resource-cleanup-token');

// Use case: Cache that auto-evicts
class WeakCache {
  constructor() { this.cache = new Map(); }
  set(key, value) {
    this.cache.set(key, new WeakRef(value));
  }
  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (!value) this.cache.delete(key); // auto-cleanup
    return value;
  }
}</code></pre>

<h2>Production Memory Management Checklist</h2>
<ul>
  <li>Set <code>--max-old-space-size</code> based on container limits (70-80% of container memory)</li>
  <li>Monitor <code>process.memoryUsage()</code> via metrics (Prometheus, DataDog)</li>
  <li>Set up alerts for RSS exceeding thresholds</li>
  <li>Use <code>--heapsnapshot-signal=SIGUSR2</code> in production for on-demand debugging</li>
  <li>Use WeakMap/WeakSet for caches that reference objects</li>
  <li>Always remove event listeners and clear timers on cleanup</li>
  <li>Prefer streaming over loading entire files into memory</li>
  <li>Use LRU caches with size limits instead of plain Maps</li>
</ul>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Explain V8's garbage collection strategy. What is the generational hypothesis?</div>
  <div class="qa-a">V8 uses <strong>generational garbage collection</strong> based on the hypothesis that most objects die young. Memory is split into Young Generation (New Space) and Old Generation (Old Space). Young objects are collected by <strong>Scavenge</strong> (fast, copies survivors between two semi-spaces). Objects surviving 2 scavenges are promoted to Old Space, where they're collected by <strong>Mark-Sweep-Compact</strong> (slower, runs less often). V8 uses incremental and concurrent marking to reduce pause times. Scavenge is ~1-5ms and frequent. Major GC can be ~10-100ms but is less frequent. The generational approach optimizes for the common case: short-lived temporary objects.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you debug a memory leak in a production Node.js application?</div>
  <div class="qa-a">Step-by-step approach: (1) <strong>Detect</strong> — monitor RSS/heapUsed over time via metrics. A continuously growing line confirms a leak. (2) <strong>Reproduce</strong> — identify which endpoint or operation causes growth using load testing. (3) <strong>Capture heap snapshots</strong> — take snapshot A, perform the operation N times, take snapshot B, compare. Objects in B but not A are candidates. Use <code>--inspect</code> with Chrome DevTools. (4) <strong>Analyze</strong> — look at the "Comparison" view for retained size growth. Check the "Retainers" panel to see why objects can't be GC'd. (5) <strong>Common culprits</strong>: growing Maps/arrays, closures capturing scope, unremoved event listeners, leaked timers, circular references with external resources. (6) Tools: Chrome DevTools, clinic.js heapProfiler, <code>--heapsnapshot-signal</code> for production snapshots without restart.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What causes a "JavaScript heap out of memory" error? How do you fix it?</div>
  <div class="qa-a">This error (FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed) occurs when V8 cannot allocate memory because the heap has reached its limit. Causes: (1) Memory leak — unbounded growth. (2) Processing too-large data in memory. (3) Heap limit too low for the workload. Fixes: (1) <strong>Increase heap</strong>: <code>--max-old-space-size=4096</code> (temporary fix). (2) <strong>Fix the leak</strong> — use heap snapshots to find it. (3) <strong>Stream instead of buffer</strong> — don't read entire files into memory. (4) <strong>Paginate</strong> — process data in batches. (5) <strong>Use worker threads</strong> — each worker gets its own heap. (6) In containers, set heap to 70-80% of container memory limit, and ensure the container OOM killer isn't fighting V8's GC.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between rss, heapTotal, heapUsed, and external in process.memoryUsage()?</div>
  <div class="qa-a"><strong>rss</strong> (Resident Set Size) is the total memory allocated by the OS for the process, including code, stack, heap, and C++ allocations. <strong>heapTotal</strong> is V8's total allocated heap size (may include free space). <strong>heapUsed</strong> is the actual memory used by JavaScript objects in V8's heap. <strong>external</strong> is memory used by C++ objects that are bound to JavaScript objects (like Buffers created with Buffer.alloc). <strong>arrayBuffers</strong> is the memory for ArrayBuffers and SharedArrayBuffers. To detect a JS leak, watch heapUsed. If rss grows but heapUsed doesn't, the leak is in native code or Buffers (check external). heapTotal can be larger than heapUsed due to GC not yet reclaiming memory or V8 pre-allocating.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do WeakRef and FinalizationRegistry help with memory management? What are the caveats?</div>
  <div class="qa-a"><strong>WeakRef</strong> holds a reference to an object without preventing garbage collection. If the only references to an object are weak, GC can collect it. <code>deref()</code> returns the object or undefined if collected. <strong>FinalizationRegistry</strong> lets you register a callback that runs when a registered object is GC'd — useful for releasing native resources (file handles, connections). Caveats: (1) GC timing is non-deterministic — you cannot rely on when (or if) finalization callbacks run. (2) The callback may never run if the process exits. (3) Don't use them for critical cleanup — always have explicit close/dispose methods. (4) Accessing a WeakRef in a finalizer can resurrect the object. (5) Performance overhead for tracking registered objects. They're best for optimization (caches, resource pools) rather than correctness-critical cleanup.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why are Buffers allocated off the V8 heap, and what implications does this have?</div>
  <div class="qa-a">Buffers are allocated outside V8's managed heap (in C++ memory via libuv/malloc) for several reasons: (1) V8's heap has a size limit (~1.7GB); Buffers for file I/O or network data can be much larger. (2) Buffer data is raw binary — V8's GC is designed for JavaScript objects, not arbitrary binary data. (3) Off-heap allocation avoids GC overhead for large binary data. (4) Buffers can be passed directly to OS syscalls without copying from the V8 heap. Implications: Buffer memory shows up in <code>external</code>/<code>rss</code> but NOT in <code>heapUsed</code>. A Buffer leak won't trigger V8's heap OOM — instead, the process's RSS grows until the OS OOM killer terminates it. Monitor rss and external separately from heapUsed to catch Buffer leaks.</div>
</div>
`
  },
  {
    id: 'design-patterns',
    title: 'Node.js Design Patterns',
    category: 'Advanced',
    starterCode: `// Node.js Design Patterns (Browser-compatible)

// === 1. Middleware Pattern (Express-like) ===
console.log('=== Middleware Pattern ===');
class App {
  constructor() { this.middlewares = []; }
  use(fn) { this.middlewares.push(fn); }
  async handle(req) {
    let idx = 0;
    const next = async () => {
      if (idx < this.middlewares.length) {
        const mw = this.middlewares[idx++];
        await mw(req, next);
      }
    };
    await next();
  }
}
const app = new App();
app.use(async (req, next) => {
  req.startTime = Date.now();
  console.log('Logger: ' + req.method + ' ' + req.path);
  await next();
  console.log('Logger: completed in ' + (Date.now() - req.startTime) + 'ms');
});
app.use(async (req, next) => {
  if (!req.auth) { console.log('Auth: denied!'); return; }
  console.log('Auth: passed');
  await next();
});
app.use(async (req, next) => { console.log('Handler: processing request'); });
app.handle({ method: 'GET', path: '/api/users', auth: true });

// === 2. Observer Pattern (EventEmitter) ===
console.log('\\n=== Observer Pattern ===');
class EventEmitter {
  constructor() { this.events = {}; }
  on(event, fn) { (this.events[event] ??= []).push(fn); }
  emit(event, ...args) { (this.events[event] || []).forEach(fn => fn(...args)); }
  off(event, fn) {
    this.events[event] = (this.events[event] || []).filter(f => f !== fn);
  }
}
const orders = new EventEmitter();
orders.on('placed', (o) => console.log('Email: order ' + o.id + ' confirmed'));
orders.on('placed', (o) => console.log('Inventory: reserve ' + o.item));
orders.on('placed', (o) => console.log('Analytics: track order'));
orders.emit('placed', { id: 'ORD-001', item: 'Widget' });

// === 3. Factory Pattern ===
console.log('\\n=== Factory Pattern ===');
function createDB(type) {
  switch(type) {
    case 'postgres': return { query: (q) => console.log('PG:', q), type };
    case 'mongo': return { query: (q) => console.log('Mongo:', q), type };
    default: throw new Error('Unknown DB: ' + type);
  }
}
const db = createDB('postgres');
db.query('SELECT * FROM users');

// === 4. Circuit Breaker Pattern ===
console.log('\\n=== Circuit Breaker ===');
class CircuitBreaker {
  constructor(fn, opts = {}) {
    this.fn = fn;
    this.failures = 0;
    this.threshold = opts.threshold || 3;
    this.resetTimeout = opts.resetTimeout || 5000;
    this.state = 'CLOSED';
  }
  async call(...args) {
    if (this.state === 'OPEN') {
      console.log('Circuit OPEN — fast fail');
      throw new Error('Circuit open');
    }
    try {
      const result = await this.fn(...args);
      this.failures = 0;
      this.state = 'CLOSED';
      return result;
    } catch(e) {
      this.failures++;
      console.log('Failure #' + this.failures);
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        console.log('Circuit OPENED after ' + this.threshold + ' failures');
        setTimeout(() => { this.state = 'HALF_OPEN'; }, this.resetTimeout);
      }
      throw e;
    }
  }
}
const breaker = new CircuitBreaker(async () => { throw new Error('Service down'); }, { threshold: 3 });
(async () => {
  for (let i = 0; i < 4; i++) {
    try { await breaker.call(); } catch(e) { console.log('Call failed:', e.message); }
  }
})();`,
    content: `
<h1>Node.js Design Patterns</h1>
<p>Design patterns in Node.js leverage JavaScript's functional nature, the event-driven architecture, and the module system. Understanding these patterns is essential for building maintainable, scalable applications. This covers the most important patterns encountered in production Node.js systems.</p>

<h2>1. Middleware Pattern</h2>
<p>The middleware pattern composes functions into a pipeline where each function can process a request, modify context, and pass control to the next function. This is the backbone of Express, Koa, and many Node.js frameworks.</p>

<pre><code>// Express-style middleware chain
app.use(logger);         // Middleware 1
app.use(authenticate);   // Middleware 2
app.use(rateLimit);      // Middleware 3
app.get('/api', handler); // Route handler

// Each middleware signature: (req, res, next) => {}
function logger(req, res, next) {
  console.log(\`\${req.method} \${req.url}\`);
  const start = Date.now();
  res.on('finish', () => {
    console.log(\`\${res.statusCode} - \${Date.now() - start}ms\`);
  });
  next(); // Pass to next middleware
}

function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
    // NOT calling next() stops the chain
  }
}</code></pre>

<h3>Koa's Onion Model (async/await)</h3>
<pre><code>// Koa middleware flows DOWN then back UP (onion model)
app.use(async (ctx, next) => {
  const start = Date.now();
  await next(); // Go deeper into onion
  // This runs AFTER all inner middleware complete
  ctx.set('X-Response-Time', \`\${Date.now() - start}ms\`);
});

// Execution order with 3 middlewares:
// → MW1 before next()
//   → MW2 before next()
//     → MW3 (handler)
//   ← MW2 after next()
// ← MW1 after next()</code></pre>

<h2>2. Observer Pattern (EventEmitter)</h2>
<p>Node.js's EventEmitter implements the Observer pattern, enabling decoupled communication between components. It is the foundation of Streams, HTTP server, and almost every core module.</p>

<pre><code>const EventEmitter = require('events');

class OrderService extends EventEmitter {
  placeOrder(order) {
    // Business logic
    this.emit('order:placed', order);
  }
  cancelOrder(orderId) {
    this.emit('order:cancelled', { orderId });
  }
}

const orderService = new OrderService();

// Decoupled listeners — each module subscribes independently
orderService.on('order:placed', (order) => emailService.sendConfirmation(order));
orderService.on('order:placed', (order) => inventory.reserve(order.items));
orderService.on('order:placed', (order) => analytics.track('purchase', order));
orderService.on('order:cancelled', ({ orderId }) => refundService.process(orderId));

// Best practices:
orderService.once('ready', init);           // Auto-removes after first call
orderService.setMaxListeners(20);           // Increase from default 10
orderService.removeListener('event', fn);   // Cleanup
orderService.removeAllListeners('event');   // Nuclear option</code></pre>

<h2>3. Factory Pattern</h2>
<p>Factories create objects without exposing instantiation logic. In Node.js, this is commonly used for creating database connections, loggers, and service instances based on configuration.</p>

<pre><code>// Database factory
function createDatabase(config) {
  switch (config.type) {
    case 'postgresql':
      return new PostgresAdapter(config);
    case 'mongodb':
      return new MongoAdapter(config);
    case 'redis':
      return new RedisAdapter(config);
    default:
      throw new Error(\`Unknown database type: \${config.type}\`);
  }
}

// Logger factory with different transports
function createLogger(env) {
  const transports = [];
  if (env === 'production') {
    transports.push(new ElasticTransport());
    transports.push(new FileTransport('/var/log/app.log'));
  } else {
    transports.push(new ConsoleTransport({ color: true }));
  }
  return new Logger(transports);
}

// Abstract Factory — family of related objects
class CloudProviderFactory {
  static create(provider) {
    switch (provider) {
      case 'aws': return {
        storage: new S3(),
        compute: new Lambda(),
        queue: new SQS()
      };
      case 'gcp': return {
        storage: new GCS(),
        compute: new CloudFunctions(),
        queue: new PubSub()
      };
    }
  }
}</code></pre>

<h2>4. Singleton Pattern (Module Caching)</h2>
<p>Node.js's <code>require()</code> caches modules after first load, making every module a natural singleton. This is commonly used for database connections, configuration, and shared state.</p>

<pre><code>// db.js — singleton by default due to module caching
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000
});

module.exports = pool;

// Any file that requires db.js gets the SAME pool instance:
// fileA.js: const db = require('./db'); // creates pool
// fileB.js: const db = require('./db'); // same pool (cached)

// WARNING: Module cache is per-process. In cluster mode,
// each worker has its own singleton instance.

// Explicit Singleton (when you need lazy initialization):
class ConfigManager {
  static #instance = null;

  static getInstance() {
    if (!ConfigManager.#instance) {
      ConfigManager.#instance = new ConfigManager();
    }
    return ConfigManager.#instance;
  }

  constructor() {
    if (ConfigManager.#instance) {
      throw new Error('Use ConfigManager.getInstance()');
    }
    this.config = this.loadConfig();
  }
}</code></pre>

<h2>5. Strategy Pattern</h2>
<p>The Strategy pattern defines a family of algorithms and makes them interchangeable. In Node.js, this is commonly used for authentication strategies (Passport.js), caching strategies, and payment processing.</p>

<pre><code>// Authentication strategies
class AuthManager {
  constructor() {
    this.strategies = new Map();
  }

  use(name, strategy) {
    this.strategies.set(name, strategy);
  }

  async authenticate(name, req) {
    const strategy = this.strategies.get(name);
    if (!strategy) throw new Error(\`Unknown strategy: \${name}\`);
    return strategy.authenticate(req);
  }
}

const jwtStrategy = {
  authenticate(req) {
    const token = req.headers.authorization?.split(' ')[1];
    return jwt.verify(token, SECRET);
  }
};

const apiKeyStrategy = {
  authenticate(req) {
    const key = req.headers['x-api-key'];
    return db.query('SELECT * FROM api_keys WHERE key = $1', [key]);
  }
};

const auth = new AuthManager();
auth.use('jwt', jwtStrategy);
auth.use('api-key', apiKeyStrategy);

// Caching strategy
const cachingStrategies = {
  'cache-first': async (key, fetchFn) => {
    const cached = await cache.get(key);
    if (cached) return cached;
    const data = await fetchFn();
    await cache.set(key, data);
    return data;
  },
  'network-first': async (key, fetchFn) => {
    try {
      const data = await fetchFn();
      await cache.set(key, data);
      return data;
    } catch {
      return cache.get(key); // fallback to cache
    }
  }
};</code></pre>

<h2>6. Dependency Injection</h2>
<pre><code>// Without DI — tightly coupled, hard to test
class UserService {
  constructor() {
    this.db = require('./db');       // hard dependency
    this.mailer = require('./mailer'); // hard dependency
  }
}

// With DI — loosely coupled, easily testable
class UserService {
  constructor({ db, mailer, logger }) {
    this.db = db;
    this.mailer = mailer;
    this.logger = logger;
  }

  async createUser(data) {
    const user = await this.db.insert('users', data);
    await this.mailer.send(user.email, 'Welcome!');
    this.logger.info('User created', { id: user.id });
    return user;
  }
}

// Production
const service = new UserService({
  db: new PostgresDB(config),
  mailer: new SendGrid(apiKey),
  logger: new Winston()
});

// Testing — inject mocks!
const service = new UserService({
  db: { insert: jest.fn().mockResolvedValue({ id: 1 }) },
  mailer: { send: jest.fn() },
  logger: { info: jest.fn() }
});

// DI Container (awilix example)
const { createContainer, asClass } = require('awilix');
const container = createContainer();
container.register({
  userService: asClass(UserService).scoped(),
  db: asClass(PostgresDB).singleton(),
  mailer: asClass(SendGrid).singleton(),
});</code></pre>

<h2>7. Circuit Breaker Pattern</h2>
<p>Prevents cascading failures in distributed systems by failing fast when a downstream service is unresponsive. Essential for microservice architectures.</p>

<pre><code>class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.state = 'CLOSED';     // CLOSED → OPEN → HALF_OPEN → CLOSED
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.threshold = options.threshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenMax = options.halfOpenMax || 3;
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.fn(...args);

      if (this.state === 'HALF_OPEN') {
        this.successes++;
        if (this.successes >= this.halfOpenMax) {
          this.state = 'CLOSED';
          this.failures = 0;
        }
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}

// State machine:
// CLOSED  → requests pass through normally
//           failures increment counter
//           at threshold → switch to OPEN
// OPEN    → all requests fail immediately (fast fail)
//           after resetTimeout → switch to HALF_OPEN
// HALF_OPEN → limited requests pass through
//             if N succeed → CLOSED
//             if any fail → back to OPEN</code></pre>

<h3>Circuit Breaker States</h3>
<table>
  <tr><th>State</th><th>Behavior</th><th>Transition</th></tr>
  <tr><td><strong>CLOSED</strong></td><td>Normal operation, requests pass through</td><td>Failures exceed threshold → OPEN</td></tr>
  <tr><td><strong>OPEN</strong></td><td>All requests fail immediately, no calls made</td><td>After reset timeout → HALF_OPEN</td></tr>
  <tr><td><strong>HALF_OPEN</strong></td><td>Limited trial requests allowed</td><td>Success → CLOSED, Failure → OPEN</td></tr>
</table>

<h2>Pattern Selection Guide</h2>
<table>
  <tr><th>Pattern</th><th>When to Use</th><th>Node.js Example</th></tr>
  <tr><td>Middleware</td><td>Request processing pipeline, composable transformations</td><td>Express, Koa, custom API gateways</td></tr>
  <tr><td>Observer</td><td>Decoupled event-driven communication</td><td>EventEmitter, domain events</td></tr>
  <tr><td>Factory</td><td>Object creation based on config/environment</td><td>DB adapters, logger setup</td></tr>
  <tr><td>Singleton</td><td>Shared state, connection pools, config</td><td>Module caching, DB pools</td></tr>
  <tr><td>Strategy</td><td>Interchangeable algorithms</td><td>Passport.js, cache policies</td></tr>
  <tr><td>DI</td><td>Testability, loose coupling</td><td>Service constructors, awilix</td></tr>
  <tr><td>Circuit Breaker</td><td>Resilience to downstream failures</td><td>opossum, cockatiel libraries</td></tr>
</table>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How does the middleware pattern work in Express? What happens when you don't call next()?</div>
  <div class="qa-a">Express maintains an array of middleware functions. When a request arrives, Express iterates through them in order, calling each with (req, res, next). Each middleware can: (1) modify req/res, (2) end the response (res.send()), or (3) call next() to pass control to the next middleware. If you <strong>don't call next()</strong>, the chain stops — no subsequent middleware or route handlers execute, and the request hangs (eventually times out) unless you explicitly send a response. This is intentional for auth middleware (deny access) or error handling. Error-handling middleware has 4 params: (err, req, res, next).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why is module.exports a natural Singleton in Node.js? When does this break?</div>
  <div class="qa-a">Node.js caches modules in <code>require.cache</code> after the first require(). Subsequent require() calls for the same resolved path return the cached exports object — same reference, same instance. This makes any module-level object effectively a singleton. It breaks in these cases: (1) <strong>Cluster mode</strong> — each worker process has its own module cache. (2) <strong>Different resolved paths</strong> — symlinks or different relative paths to the same file might create separate cache entries. (3) <strong>Deleting from require.cache</strong> — manually clearing forces re-execution. (4) <strong>ESM modules</strong> — import() has its own module cache, separate from require.cache. (5) <strong>Worker Threads</strong> — each worker has its own module cache.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the Circuit Breaker pattern. When and why would you use it?</div>
  <div class="qa-a">The Circuit Breaker prevents cascading failures in distributed systems. It wraps calls to external services and monitors failures. Three states: <strong>CLOSED</strong> (normal — requests pass through), <strong>OPEN</strong> (failures exceeded threshold — requests fail immediately without calling the service), <strong>HALF_OPEN</strong> (after cooldown — allows limited trial requests). Use it when: (1) calling unreliable external APIs, (2) preventing one failing microservice from taking down the whole system, (3) avoiding thread/connection pool exhaustion from hanging requests. Key parameters: failure threshold, reset timeout, half-open trial count. Libraries: opossum (Node.js), cockatiel (TypeScript). It pairs well with retry policies, timeouts, and fallback responses.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement Dependency Injection in Node.js? Why is it important?</div>
  <div class="qa-a">DI in Node.js is typically done via <strong>constructor injection</strong> — pass dependencies as constructor/function parameters instead of requiring them directly. Example: <code>class UserService { constructor({ db, mailer }) { ... } }</code>. For larger apps, use a DI container like awilix or tsyringe that auto-resolves dependency graphs. DI is important because: (1) <strong>Testability</strong> — inject mocks/stubs instead of real DB/API clients. (2) <strong>Loose coupling</strong> — components depend on interfaces, not implementations. (3) <strong>Configuration flexibility</strong> — swap implementations based on environment. (4) <strong>Single Responsibility</strong> — each module declares its needs explicitly. Without DI, you end up with require() calls that create hard dependencies, making unit testing require module mocking hacks like proxyquire or jest.mock().</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Compare the Observer pattern (EventEmitter) vs Pub/Sub. When would you use each?</div>
  <div class="qa-a"><strong>Observer (EventEmitter)</strong> is in-process — the emitter knows about its listeners (direct coupling). Listeners subscribe directly to the emitter object. It's synchronous by default (listeners fire immediately on emit). Use for: in-process events, Streams, component communication within a service. <strong>Pub/Sub</strong> adds a broker/channel between publishers and subscribers — fully decoupled. Neither knows about the other. The broker handles routing, persistence, and delivery guarantees. Use for: inter-service communication, message queues (Redis Pub/Sub, RabbitMQ, Kafka). Key differences: Pub/Sub works across processes/machines, supports persistence, retry, and backpressure. EventEmitter is zero-overhead, synchronous, and in-process only. In practice, use EventEmitter within a service and Pub/Sub between services.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the Strategy pattern? Give a real-world Node.js example.</div>
  <div class="qa-a">The Strategy pattern defines a family of interchangeable algorithms. The best real-world Node.js example is <strong>Passport.js</strong>: <code>passport.use('local', new LocalStrategy(...))</code>, <code>passport.use('google', new GoogleStrategy(...))</code>. At runtime, you choose which strategy to use: <code>passport.authenticate('google')</code>. The calling code doesn't know the details of each auth method — it just calls authenticate with a strategy name. Other examples: caching strategies (cache-first vs network-first), payment processors (Stripe vs PayPal), file storage (local vs S3 vs GCS). Implementation: a Map of named strategies with a common interface (e.g., <code>authenticate(req)</code>, <code>pay(amount)</code>). Add new strategies without modifying existing code — Open/Closed principle.</div>
</div>
`
  },
  {
    id: 'performance',
    title: 'Performance Optimization',
    category: 'Scaling',
    starterCode: `// Performance Optimization Patterns (Browser-compatible)

// === Connection Pooling Simulation ===
console.log('=== Connection Pool ===');
class ConnectionPool {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.pool = [];
    this.waiting = [];
    this.created = 0;
  }
  async acquire() {
    if (this.pool.length > 0) {
      console.log('Pool: reusing connection (pool size: ' + this.pool.length + ')');
      return this.pool.pop();
    }
    if (this.created < this.maxSize) {
      this.created++;
      console.log('Pool: creating new connection #' + this.created);
      return { id: this.created, query: (q) => 'Result: ' + q };
    }
    console.log('Pool: waiting for available connection...');
    return new Promise(r => this.waiting.push(r));
  }
  release(conn) {
    if (this.waiting.length > 0) {
      this.waiting.shift()(conn);
    } else {
      this.pool.push(conn);
    }
  }
}

const pool = new ConnectionPool(3);
(async () => {
  const c1 = await pool.acquire();
  const c2 = await pool.acquire();
  const c3 = await pool.acquire();
  console.log(c1.query('SELECT 1'));
  pool.release(c1);
  const c4 = await pool.acquire(); // reuses c1
  pool.release(c2);
  pool.release(c3);
  pool.release(c4);
})();

// === Caching Strategy ===
console.log('\\n=== LRU Cache ===');
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
  }
  get(key) {
    if (!this.cache.has(key)) { console.log('MISS: ' + key); return undefined; }
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // move to end (most recent)
    console.log('HIT: ' + key + ' = ' + value);
    return value;
  }
  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const oldest = this.cache.keys().next().value;
      console.log('EVICT: ' + oldest);
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }
}

const lru = new LRUCache(3);
lru.set('a', 1); lru.set('b', 2); lru.set('c', 3);
lru.get('a');     // hit, moves to end
lru.set('d', 4); // evicts 'b' (least recently used)
lru.get('b');     // miss

// === N+1 Query Detection ===
console.log('\\n=== N+1 Query Problem ===');
const users = [{id:1,name:'Alice'},{id:2,name:'Bob'},{id:3,name:'Charlie'}];
let queryCount = 0;
const fakeDB = {
  query(q) { queryCount++; console.log('Query #' + queryCount + ': ' + q); }
};

// BAD: N+1 queries
queryCount = 0;
console.log('N+1 approach:');
fakeDB.query('SELECT * FROM users'); // 1 query
users.forEach(u => fakeDB.query('SELECT * FROM orders WHERE user_id=' + u.id));
console.log('Total queries (N+1): ' + queryCount);

// GOOD: Batched
queryCount = 0;
console.log('\\nBatched approach:');
fakeDB.query('SELECT * FROM users');
fakeDB.query('SELECT * FROM orders WHERE user_id IN (1,2,3)');
console.log('Total queries (batched): ' + queryCount);`,
    content: `
<h1>Performance Optimization</h1>
<p>Performance optimization in Node.js requires understanding the event loop, V8 internals, OS-level behavior, and application architecture. This covers profiling tools, optimization techniques, and architectural patterns for building high-throughput Node.js applications.</p>

<h2>Profiling Tools</h2>

<h3>Built-in V8 Profiler</h3>
<pre><code>// CPU profiling with --prof
node --prof server.js
// Run load test, then process the isolate-*.log:
node --prof-process isolate-0x*.log > profile.txt

// Key sections in output:
// [Summary] — ticks in JS, C++, GC, etc.
// [JavaScript] — JS functions sorted by tick count
// [C++] — native code hot spots
// [Bottom up (heavy) profile] — call stacks leading to hot functions</code></pre>

<h3>Clinic.js Suite</h3>
<pre><code># Doctor — overall health check
npx clinic doctor -- node server.js
# Detects: event loop delays, I/O issues, memory issues

# Flame — CPU flame graphs
npx clinic flame -- node server.js
# Shows: which functions consume CPU time

# BubbleProf — async flow visualization
npx clinic bubbleprof -- node server.js
# Shows: async operation timing and relationships

# HeapProfiler — memory allocation tracking
npx clinic heapprofiler -- node server.js</code></pre>

<h3>Chrome DevTools</h3>
<pre><code>// Start with inspect
node --inspect server.js
// Open chrome://inspect

// Available panels:
// - CPU Profiler: record, analyze flame chart
// - Memory: heap snapshots, allocation timeline
// - Performance: timeline of events, GC pauses</code></pre>

<h2>CPU Profiling &amp; Flame Graphs</h2>
<pre><code>// Using 0x for flame graphs (simplest approach)
npx 0x server.js
// Load test the server, then Ctrl+C
// Opens interactive flame graph in browser

// Reading a flame graph:
// - X-axis: stack frames (NOT time)
// - Y-axis: call stack depth
// - Width: proportion of CPU time
// - Look for wide bars = hot functions
// - "Plateau" at top = function doing actual work
// - Hot paths (red/orange) = optimization targets

// Common CPU bottlenecks:
// 1. JSON.parse/stringify on large objects
// 2. RegExp with catastrophic backtracking
// 3. Synchronous crypto operations
// 4. Deep object cloning/copying
// 5. Template rendering
// 6. Compression (gzip/brotli)</code></pre>

<h2>Memory Optimization</h2>
<pre><code>// 1. Use Streams instead of buffering
// BAD: Loads entire file into memory
const data = fs.readFileSync('huge-file.csv', 'utf8');
process(data); // 2GB file = 2GB in memory

// GOOD: Stream processing, constant memory
const stream = fs.createReadStream('huge-file.csv');
const rl = readline.createInterface({ input: stream });
rl.on('line', (line) => processLine(line)); // ~few KB at a time

// 2. Use Buffer.allocUnsafe for performance (when you'll fill it)
const buf = Buffer.allocUnsafe(1024); // faster, uninitialized
// vs Buffer.alloc(1024); // slower, zero-filled (safer)

// 3. Avoid creating unnecessary closures in hot paths
// BAD: New function created every iteration
arr.forEach(item => {
  setTimeout(() => processItem(item), 100);
});

// BETTER: Pre-bind or use named functions
function processWithDelay(item) {
  setTimeout(processItem, 100, item);
}
arr.forEach(processWithDelay);

// 4. Use object pools for frequently created/destroyed objects
class ObjectPool {
  constructor(factory, max = 100) {
    this.factory = factory;
    this.pool = [];
    this.max = max;
  }
  acquire() {
    return this.pool.pop() || this.factory();
  }
  release(obj) {
    if (this.pool.length < this.max) {
      obj.reset(); // Reset state
      this.pool.push(obj);
    }
  }
}</code></pre>

<h2>Connection Pooling</h2>
<pre><code>// PostgreSQL connection pool (pg library)
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  database: 'myapp',
  max: 20,                    // max connections in pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if can't connect in 2s
  maxUses: 7500,              // close connection after N queries
});

// Key pool sizing formula (from PostgreSQL wiki):
// connections = (core_count * 2) + effective_spindle_count
// For SSD: connections ≈ core_count * 2 + 1
// With 4 cores: ~9-10 connections per instance

// Monitor pool health
pool.on('connect', () => console.log('New connection created'));
pool.on('acquire', () => console.log('Connection acquired from pool'));
pool.on('remove', () => console.log('Connection removed from pool'));

console.log({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
});</code></pre>

<h2>Caching Strategies</h2>
<table>
  <tr><th>Strategy</th><th>Description</th><th>Use Case</th></tr>
  <tr><td><strong>Cache-Aside (Lazy)</strong></td><td>App checks cache first, fetches from DB on miss, populates cache</td><td>General purpose, most common</td></tr>
  <tr><td><strong>Read-Through</strong></td><td>Cache layer fetches from DB on miss automatically</td><td>When cache library supports it</td></tr>
  <tr><td><strong>Write-Through</strong></td><td>Writes go to cache AND DB simultaneously</td><td>Strong consistency needed</td></tr>
  <tr><td><strong>Write-Behind</strong></td><td>Write to cache first, async batch write to DB</td><td>High write throughput, eventual consistency OK</td></tr>
  <tr><td><strong>Cache Stampede Prevention</strong></td><td>Lock/coalesce concurrent requests for same expired key</td><td>Hot keys with expensive computation</td></tr>
</table>

<pre><code>// Cache-Aside with Redis
async function getUser(id) {
  // 1. Check cache
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — fetch from DB
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);

  // 3. Populate cache with TTL
  await redis.setex(\`user:\${id}\`, 300, JSON.stringify(user)); // 5 min TTL

  return user;
}

// Cache stampede prevention with locking
async function getUserWithLock(id) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const locked = await redis.set(\`lock:user:\${id}\`, '1', 'EX', 5, 'NX');
  if (!locked) {
    // Another request is fetching — wait and retry
    await new Promise(r => setTimeout(r, 100));
    return getUserWithLock(id);
  }

  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await redis.setex(\`user:\${id}\`, 300, JSON.stringify(user));
  await redis.del(\`lock:user:\${id}\`);
  return user;
}</code></pre>

<h2>Load Balancing</h2>
<pre><code># Nginx reverse proxy with load balancing
upstream nodejs_cluster {
    least_conn;                    # Least connections algorithm
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    keepalive 64;                  # Keep-alive connections to upstream
}

server {
    listen 80;
    location / {
        proxy_pass http://nodejs_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # Enable keep-alive
        proxy_set_header X-Real-IP $remote_addr;
    }
}</code></pre>

<h3>Load Balancing Algorithms</h3>
<table>
  <tr><th>Algorithm</th><th>Description</th><th>Best For</th></tr>
  <tr><td><strong>Round Robin</strong></td><td>Distribute sequentially</td><td>Uniform request cost</td></tr>
  <tr><td><strong>Least Connections</strong></td><td>Send to server with fewest active connections</td><td>Variable request duration</td></tr>
  <tr><td><strong>IP Hash</strong></td><td>Same client IP always goes to same server</td><td>Session affinity / sticky sessions</td></tr>
  <tr><td><strong>Weighted</strong></td><td>Distribute based on server capacity weights</td><td>Heterogeneous servers</td></tr>
  <tr><td><strong>Random</strong></td><td>Random selection (with power of 2 choices)</td><td>Large clusters</td></tr>
</table>

<h2>Microservices vs Monolith</h2>
<table>
  <tr><th></th><th>Monolith</th><th>Microservices</th></tr>
  <tr><td>Deployment</td><td>Single unit, simple</td><td>Independent services, complex orchestration</td></tr>
  <tr><td>Scaling</td><td>Scale entire app</td><td>Scale individual services</td></tr>
  <tr><td>Data</td><td>Single database</td><td>Database per service (recommended)</td></tr>
  <tr><td>Complexity</td><td>In-process calls</td><td>Network calls, service discovery, circuit breakers</td></tr>
  <tr><td>Consistency</td><td>ACID transactions</td><td>Eventual consistency, sagas</td></tr>
  <tr><td>Team Size</td><td>Works for small teams</td><td>Best for large organizations</td></tr>
  <tr><td>Debugging</td><td>Single process stack trace</td><td>Distributed tracing needed (Jaeger, Zipkin)</td></tr>
  <tr><td>Latency</td><td>In-process (ns)</td><td>Network hop (ms)</td></tr>
</table>

<h2>N+1 Query Problem</h2>
<pre><code>// N+1 PROBLEM: 1 query for users + N queries for orders
const users = await db.query('SELECT * FROM users');  // 1 query
for (const user of users) {
  // N queries — one per user!
  user.orders = await db.query(
    'SELECT * FROM orders WHERE user_id = $1', [user.id]
  );
}
// With 1000 users = 1001 queries!

// FIX 1: Batch with IN clause
const users = await db.query('SELECT * FROM users');
const userIds = users.map(u => u.id);
const orders = await db.query(
  'SELECT * FROM orders WHERE user_id = ANY($1)', [userIds]
); // 2 queries total!

// FIX 2: JOIN
const results = await db.query(\`
  SELECT u.*, o.id as order_id, o.total
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
\`); // 1 query!

// FIX 3: DataLoader (batching + caching)
const DataLoader = require('dataloader');
const orderLoader = new DataLoader(async (userIds) => {
  const orders = await db.query(
    'SELECT * FROM orders WHERE user_id = ANY($1)', [userIds]
  );
  // Must return results in same order as input keys
  return userIds.map(id => orders.filter(o => o.user_id === id));
});

// All these calls get batched into ONE query
await Promise.all(users.map(u => orderLoader.load(u.id)));</code></pre>

<h2>Key Performance Metrics</h2>
<table>
  <tr><th>Metric</th><th>Target</th><th>Tool</th></tr>
  <tr><td>Event loop lag</td><td>&lt; 10ms</td><td>clinic doctor, prom-client</td></tr>
  <tr><td>P99 response time</td><td>&lt; 200ms (API)</td><td>Prometheus, DataDog</td></tr>
  <tr><td>Throughput (RPS)</td><td>Depends on workload</td><td>autocannon, wrk</td></tr>
  <tr><td>Memory (RSS)</td><td>Stable, no growth</td><td>process.memoryUsage()</td></tr>
  <tr><td>CPU utilization</td><td>&lt; 70% average</td><td>os.loadavg(), top</td></tr>
  <tr><td>GC pause time</td><td>&lt; 100ms P99</td><td>--trace-gc, clinic</td></tr>
  <tr><td>Connection pool utilization</td><td>&lt; 80%</td><td>Pool monitoring</td></tr>
</table>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you identify and fix a performance bottleneck in a Node.js API?</div>
  <div class="qa-a">Systematic approach: (1) <strong>Measure baseline</strong> — use autocannon/wrk to get current RPS and P99 latency. (2) <strong>Check event loop lag</strong> — use clinic doctor to detect if the loop is blocked. High lag = CPU-bound code on main thread. (3) <strong>CPU profile</strong> — use clinic flame or 0x to generate flame graphs. Wide bars at the top indicate hot functions. (4) <strong>Check I/O</strong> — look for N+1 queries (enable query logging), unoptimized DB queries (EXPLAIN), missing indexes. (5) <strong>Check memory</strong> — watch for GC pauses (--trace-gc), memory leaks (growing RSS). (6) <strong>Check external services</strong> — slow Redis/DB, missing connection pooling, no caching. Common fixes: add indexes, batch queries, implement caching (Redis), offload CPU work to worker threads, use streaming for large data.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the N+1 query problem and how to solve it.</div>
  <div class="qa-a">N+1 occurs when you fetch a list (1 query) then fetch related data for each item individually (N queries). Example: fetching 100 users + their orders = 101 queries instead of 2. Solutions: (1) <strong>JOIN</strong> — combine into a single query with LEFT JOIN. (2) <strong>Batch with IN/ANY</strong> — fetch all related data in one query using <code>WHERE user_id = ANY($1)</code>. (3) <strong>DataLoader</strong> — Facebook's library that automatically batches and caches individual loads within a single tick. It collects all .load(id) calls in the current event loop tick and makes one batched query. (4) <strong>ORM eager loading</strong> — Sequelize: <code>include: [Order]</code>, Prisma: <code>include: { orders: true }</code>. DataLoader is the standard solution for GraphQL resolvers where N+1 is especially common.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What caching strategies do you know? When would you use each?</div>
  <div class="qa-a">Five main strategies: (1) <strong>Cache-Aside</strong> — app checks cache, on miss fetches from DB and populates cache. Most common, gives full control. Good for read-heavy data. (2) <strong>Read-Through</strong> — cache library handles fetching on miss. Simpler app code. (3) <strong>Write-Through</strong> — every write goes to cache AND DB. Ensures cache is always fresh. Higher write latency. (4) <strong>Write-Behind (Write-Back)</strong> — write to cache first, asynchronously batch to DB. Highest write throughput, risk of data loss on crash. Good for analytics/counters. (5) <strong>Cache Stampede Prevention</strong> — when a hot key expires and 100 concurrent requests all try to rebuild it. Solutions: mutex lock (only one rebuilds), stale-while-revalidate (serve stale data while one request rebuilds), probabilistic early expiration. Choose based on consistency needs, read/write ratio, and tolerance for stale data.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you choose between microservices and monolith for a new project?</div>
  <div class="qa-a">Start with a <strong>modular monolith</strong> — it's almost always the right first step. Reasons: (1) Small teams (&lt;10 devs) don't have the operational capacity for microservices. (2) Service boundaries are hard to define upfront — wrong boundaries create distributed monolith (worst of both worlds). (3) Network calls add latency, complexity (retries, circuit breakers, distributed tracing), and new failure modes. Move to microservices when: (1) <strong>Independent deployment</strong> is needed — different teams deploy different services at different cadences. (2) <strong>Scaling requirements differ</strong> — one component needs 20 instances while others need 2. (3) <strong>Technology diversity</strong> — one service needs Python ML, another needs Go for performance. (4) <strong>Team boundaries</strong> — Conway's Law, large org with autonomous teams. The monolith should have clear module boundaries so extraction to services is straightforward when needed.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you size a database connection pool?</div>
  <div class="qa-a">The PostgreSQL wiki formula: <code>connections = (cores * 2) + spindle_count</code>. For SSD, spindle_count ≈ 1, so with 4 cores: ~9 connections. This is per Node.js process. Key considerations: (1) <strong>Total connections</strong> — if you have 4 Node.js instances each with max 20 = 80 connections. PostgreSQL default max_connections is 100. Use PgBouncer for connection multiplexing if needed. (2) <strong>Idle timeout</strong> — close idle connections to free DB resources (30s is common). (3) <strong>Connection timeout</strong> — fail fast (2-5s) rather than queue indefinitely. (4) <strong>Monitor waitingCount</strong> — if requests frequently wait for connections, the pool is too small or queries are too slow. (5) <strong>maxUses</strong> — close connections after N queries to prevent memory leaks in the driver. Too many connections hurt performance (context switching, memory), too few cause queuing delays.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are flame graphs and how do you read them?</div>
  <div class="qa-a">Flame graphs visualize CPU profiling data. The X-axis represents the entire sample population (not time), and each bar's width shows the proportion of samples that included that function. The Y-axis shows the call stack — bottom is the entry point, top is the function actually running. To read: (1) Look for <strong>wide bars at the top</strong> — these are functions consuming the most CPU directly ("on-CPU" time). (2) Wide bars lower in the stack indicate functions whose children consume a lot of CPU. (3) <strong>Plateaus</strong> at the top are hot functions to optimize. (4) Color is usually random (not meaningful). Generate with <code>npx 0x server.js</code> or <code>npx clinic flame -- node server.js</code>. Common findings: JSON.parse on large payloads, regex backtracking, synchronous crypto, excessive GC (visible as V8 GC frames).</div>
</div>
`
  },
  {
    id: 'node-internals',
    title: 'Node.js Internals',
    category: 'Core',
    starterCode: `// Node.js Internals Simulation (Browser-compatible)

// === How require() Works ===
console.log('=== require() Internals ===');

const moduleCache = {};
const fileSystem = {
  '/app/math.js': 'module.exports = { add: (a,b) => a+b, sub: (a,b) => a-b };',
  '/app/utils.js': 'module.exports = { greet: (n) => "Hello " + n };',
  '/app/node_modules/lodash/index.js': 'module.exports = { VERSION: "4.17.21" };'
};

function customRequire(id, fromDir = '/app') {
  // Step 1: Resolve path
  const resolved = resolveModule(id, fromDir);
  console.log('Resolve: "' + id + '" → ' + resolved);

  // Step 2: Check cache
  if (moduleCache[resolved]) {
    console.log('Cache HIT: ' + resolved);
    return moduleCache[resolved].exports;
  }

  // Step 3: Load source
  const source = fileSystem[resolved];
  if (!source) throw new Error('MODULE_NOT_FOUND: ' + id);

  // Step 4: Wrap in module function
  const module = { exports: {}, id: resolved };
  const exports = module.exports;
  const wrapper = new Function('exports', 'require', 'module',
    source + '\\nreturn module.exports;'
  );

  // Step 5: Execute & cache
  const result = wrapper(exports, customRequire, module);
  module.exports = result || module.exports;
  moduleCache[resolved] = module;
  console.log('Loaded & cached: ' + resolved);

  return module.exports;
}

function resolveModule(id, fromDir) {
  if (id.startsWith('./') || id.startsWith('/')) {
    return fromDir + '/' + id.replace('./', '') + (id.endsWith('.js') ? '' : '.js');
  }
  return fromDir + '/node_modules/' + id + '/index.js';
}

const math = customRequire('./math');
console.log('math.add(2,3):', math.add(2, 3));
const mathAgain = customRequire('./math'); // cached!
console.log('Same instance?', math === mathAgain);

const lodash = customRequire('lodash');
console.log('lodash version:', lodash.VERSION);

// === Stream Backpressure Simulation ===
console.log('\\n=== Stream Backpressure ===');
class SimulatedStream {
  constructor(name, highWaterMark) {
    this.name = name;
    this.hwm = highWaterMark;
    this.buffer = 0;
  }
  write(size) {
    this.buffer += size;
    const ok = this.buffer < this.hwm;
    console.log(this.name + ': write ' + size +
      'KB (buffer: ' + this.buffer + '/' + this.hwm + 'KB)' +
      (ok ? ' ✓' : ' ✗ BACKPRESSURE'));
    return ok;
  }
  drain(amount) {
    this.buffer = Math.max(0, this.buffer - amount);
    console.log(this.name + ': drained ' + amount + 'KB (buffer: ' + this.buffer + 'KB)');
  }
}

const writable = new SimulatedStream('Writable', 64);
for (let i = 0; i < 5; i++) {
  const canContinue = writable.write(20);
  if (!canContinue) {
    console.log('>> Producer pauses, waits for drain event');
    writable.drain(60);
    console.log('>> Drain event fired, producer resumes');
  }
}`,
    content: `
<h1>Node.js Internals</h1>
<p>Understanding Node.js internals — how require() resolves modules, how the event loop tick works, how Buffers manage memory, and how streams handle backpressure — separates senior engineers from mid-level ones. This knowledge is essential for debugging complex production issues and making informed architectural decisions.</p>

<h2>How require() Works Internally</h2>
<p>When you call <code>require('some-module')</code>, Node.js executes a 5-step process:</p>

<pre><code>require(id)
  │
  ├── Step 1: RESOLVE — find the absolute file path
  │   ├── Core module? (fs, http, path) → return built-in
  │   ├── Starts with './' or '../'? → resolve relative to caller
  │   ├── Starts with '/'? → absolute path
  │   └── Bare specifier? → walk up node_modules directories
  │
  ├── Step 2: CHECK CACHE — Module._cache[resolvedPath]
  │   └── If cached → return cached module.exports (DONE)
  │
  ├── Step 3: LOAD — read file contents
  │   ├── .js  → read as UTF-8 text
  │   ├── .json → JSON.parse(content)
  │   ├── .node → dlopen() native C++ addon
  │   └── Others → treated as .js
  │
  ├── Step 4: WRAP — wrap in module function
  │   (function(exports, require, module, __filename, __dirname) {
  │     // your module code here
  │   });
  │
  └── Step 5: EXECUTE — run the wrapper, cache result
      Module._cache[resolvedPath] = module;
      return module.exports;</code></pre>

<h3>Module Resolution Algorithm</h3>
<pre><code>// For: require('lodash') called from /app/src/handlers/user.js
// Node.js searches in this order:

1. /app/src/handlers/node_modules/lodash
2. /app/src/node_modules/lodash
3. /app/node_modules/lodash          ← usually found here
4. /node_modules/lodash
5. ~/.node_modules/lodash            (global fallback)
6. ~/.node_libraries/lodash          (global fallback)
7. $NODE_PATH directories            (if set)

// For each directory, Node.js tries:
require('lodash')
  → lodash.js
  → lodash.json
  → lodash.node
  → lodash/package.json → "main" field
  → lodash/index.js
  → lodash/index.json
  → lodash/index.node</code></pre>

<h3>Circular Dependencies</h3>
<pre><code>// a.js
console.log('a.js: loading');
exports.loaded = false;
const b = require('./b');  // b.js gets PARTIAL exports of a.js
console.log('a.js: b.loaded =', b.loaded);
exports.loaded = true;

// b.js
console.log('b.js: loading');
exports.loaded = false;
const a = require('./a');  // Gets a.js's PARTIAL exports (loaded = false)
console.log('b.js: a.loaded =', a.loaded); // false!
exports.loaded = true;

// When require('./a') is called:
// 1. a.js starts executing, exports.loaded = false
// 2. a.js hits require('./b')
// 3. b.js starts executing
// 4. b.js hits require('./a') — gets a.js's CURRENT exports (incomplete!)
// 5. b.js finishes
// 6. Control returns to a.js, which finishes

// ESM handles this differently — import bindings are live references</code></pre>

<h2>Event Loop Tick Lifecycle</h2>
<pre><code>// One complete "tick" of the event loop:

while (loop.alive()) {
  // 1. Update loop time (uv__update_time)
  loop.updateTime();

  // 2. Run due timers (setTimeout/setInterval)
  loop.runTimers();

  // 3. Run pending I/O callbacks (deferred from previous tick)
  loop.runPending();

  // 4. Run idle handlers (internal)
  loop.runIdle();

  // 5. Run prepare handlers (internal)
  loop.runPrepare();

  // 6. Poll for I/O
  //    - Calculate timeout: min(next timer, pending work)
  //    - epoll_wait/kevent/GetQueuedCompletionStatus
  //    - Execute I/O callbacks
  timeout = loop.calculatePollTimeout();
  loop.pollIO(timeout);

  // 7. Run check handlers (setImmediate)
  loop.runCheck();

  // 8. Run close callbacks (socket.destroy, etc.)
  loop.runClosing();

  // Between each phase: drain process.nextTick + Promise queues
  // (this is where microtasks run)
}

// Loop exits when: no timers, no pending I/O, no active handles</code></pre>

<h2>Binding Layer — C++ Addons &amp; N-API</h2>
<pre><code>// Node.js layered architecture:
// JavaScript (your code)
//     ↓ (V8 API)
// Node.js JavaScript layer (lib/*.js)
//     ↓ (internalBinding)
// C++ Binding layer (src/*.cc)
//     ↓
// libuv, OpenSSL, c-ares, zlib, etc.

// Example: fs.readFile flow
fs.readFile('file.txt', callback)
  → lib/fs.js (validation, argument processing)
    → binding.open(), binding.read() (C++ bindings in src/node_file.cc)
      → uv_fs_open(), uv_fs_read() (libuv async file I/O)
        → Thread pool → OS syscall (open, read)
          → Callback queued to event loop
            → Your JavaScript callback executes

// N-API (stable ABI for native addons)
// Benefits: addon works across Node.js versions without recompilation
#include &lt;node_api.h&gt;

napi_value Add(napi_env env, napi_callback_info info) {
  napi_value args[2];
  size_t argc = 2;
  napi_get_cb_info(env, info, &argc, args, NULL, NULL);

  double a, b;
  napi_get_value_double(env, args[0], &a);
  napi_get_value_double(env, args[1], &b);

  napi_value result;
  napi_create_double(env, a + b, &result);
  return result;
}</code></pre>

<h2>Buffer Internals</h2>
<pre><code>// Buffer memory allocation strategies:

// 1. Buffer.alloc(size) — safe, zero-filled
//    V8 ArrayBuffer → V8 manages GC
const safe = Buffer.alloc(256); // All zeros

// 2. Buffer.allocUnsafe(size) — fast, uninitialized
//    Uses a SLAB allocator for small buffers (&lt;= 4KB)
//    Slab = pre-allocated 8KB chunk, shared across Buffers
const fast = Buffer.allocUnsafe(100); // May contain old data!

// 3. Buffer.allocUnsafeSlow(size) — no slab, direct allocation
//    Each buffer gets its own C++ allocation
const direct = Buffer.allocUnsafeSlow(1024);

// Slab allocator visualization:
// 8KB Slab: [Buffer1(100B)|Buffer2(200B)|Buffer3(50B)|...free...]
//           ↑ offset 0    ↑ offset 100   ↑ offset 300

// Key insight: small Buffers share a slab
// If Buffer1 is GC'd but Buffer2 isn't, the slab stays alive
// This can cause apparent memory leaks with Buffer.slice()

// Buffer.from() — create from existing data
Buffer.from('hello', 'utf8');        // from string
Buffer.from([0x48, 0x65]);           // from array
Buffer.from(arrayBuffer, offset, length); // from ArrayBuffer (shared memory)

// Encoding support:
// utf8, ascii, base64, base64url, hex, latin1, binary, ucs2/utf16le</code></pre>

<h3>Buffer vs String Performance</h3>
<table>
  <tr><th>Operation</th><th>Buffer</th><th>String</th></tr>
  <tr><td>Storage</td><td>Off V8 heap (C++)</td><td>On V8 heap</td></tr>
  <tr><td>GC impact</td><td>Low (external memory)</td><td>High (V8 managed)</td></tr>
  <tr><td>Encoding</td><td>Raw binary</td><td>UTF-16 internally</td></tr>
  <tr><td>Concatenation</td><td>Expensive (copy)</td><td>V8 optimized (ConsString)</td></tr>
  <tr><td>Network I/O</td><td>Zero-copy possible</td><td>Must encode to bytes</td></tr>
  <tr><td>Comparison</td><td>Buffer.compare (memcmp)</td><td>String === (code points)</td></tr>
</table>

<h2>Stream Backpressure Internals</h2>
<pre><code>// Backpressure prevents fast producers from overwhelming slow consumers

// How it works internally:
// 1. Writable stream has an internal buffer with highWaterMark (default 16KB)
// 2. writable.write(chunk) returns:
//    - true:  buffer below highWaterMark → keep writing
//    - false: buffer at/above highWaterMark → STOP writing
// 3. When buffer drains, 'drain' event fires → resume writing

const readable = fs.createReadStream('huge-file.csv');
const writable = fs.createWriteStream('output.csv');

// Manual backpressure handling:
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause();  // Stop reading!
    writable.once('drain', () => {
      readable.resume(); // Resume when buffer drains
    });
  }
});

// pipe() handles backpressure automatically!
readable.pipe(writable); // Does the above for you

// highWaterMark settings:
// Readable: how much data to buffer before pausing read
// Writable: how much data to buffer before returning false from write()
// Transform: has both readable and writable highWaterMark

const stream = new Writable({
  highWaterMark: 64 * 1024, // 64KB buffer
  write(chunk, encoding, callback) {
    // Process chunk, call callback when done
    // callback() signals readiness for more data
    slowOperation(chunk).then(() => callback());
  }
});</code></pre>

<h3>Backpressure Flow</h3>
<pre><code>Producer (Readable)          Consumer (Writable)
     │                            │
     ├──write(chunk)──────────►   │
     │                     [buffer < HWM]
     │   ◄── returns true ────    │  (keep going)
     │                            │
     ├──write(chunk)──────────►   │
     │                     [buffer >= HWM]
     │   ◄── returns false ───    │  (STOP!)
     │                            │
     │  (producer pauses)         │  (consumer processes buffer)
     │                            │
     │                     [buffer drained]
     │   ◄── 'drain' event ───   │  (RESUME!)
     │                            │
     ├──write(chunk)──────────►   │
     │        ...                 │</code></pre>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Walk through what happens when you call require('express').</div>
  <div class="qa-a">(1) <strong>Resolve</strong>: 'express' is a bare specifier (no ./ or /), so Node.js walks up from the caller's directory checking node_modules: ./node_modules/express, ../node_modules/express, etc. Once found, it reads express/package.json and looks at the "main" field (typically "index.js"). (2) <strong>Cache check</strong>: Node checks Module._cache[resolvedPath]. If found, returns cached exports immediately. (3) <strong>Load</strong>: Reads the .js file as UTF-8 text. (4) <strong>Wrap</strong>: Wraps in <code>(function(exports, require, module, __filename, __dirname) { ... })</code>. This is why every module has access to these variables. (5) <strong>Execute</strong>: Calls the wrapper function. The module sets up module.exports (Express returns a createApplication function). The result is cached and returned. All subsequent require('express') calls get the same cached object.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Node.js handle circular dependencies? What are the pitfalls?</div>
  <div class="qa-a">When A requires B and B requires A (circular), Node.js gives B a <strong>partial/incomplete</strong> copy of A's exports — whatever A has exported so far at the point where require('./b') was called. This means B sees an incomplete version of A. Pitfalls: (1) Properties added to A's exports after the require('./b') call won't be visible in B's reference (unless they're added to the same object, not replaced). (2) If A does <code>module.exports = ...</code> (replaces entirely) after requiring B, B holds the old empty object. (3) This is one of the most common sources of "undefined is not a function" errors. Solutions: restructure to eliminate the cycle, use lazy requires (require inside a function, called after module load), or extract shared code into a third module. ESM handles this better with live bindings — import references update as the exporting module completes.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain stream backpressure. Why is it important and how does pipe() handle it?</div>
  <div class="qa-a">Backpressure is a mechanism that prevents a fast producer from overwhelming a slow consumer. Without it, data accumulates in memory buffers and can cause OOM crashes. Each writable stream has an internal buffer with a <code>highWaterMark</code> (default 16KB). When you call <code>write(chunk)</code>, it returns <code>false</code> if the buffer exceeds highWaterMark — signaling the producer to pause. When the buffer drains, a <code>'drain'</code> event fires, signaling the producer to resume. <code>pipe()</code> handles this automatically: it listens for false from write(), calls readable.pause(), and listens for 'drain' to call readable.resume(). Without pipe(), you must implement this manually. Common mistake: ignoring the return value of write() and writing in a tight loop — this buffers everything in memory. Always respect backpressure signals.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between Buffer.alloc(), Buffer.allocUnsafe(), and Buffer.from()?</div>
  <div class="qa-a"><strong>Buffer.alloc(size)</strong> creates a zero-filled buffer. Safe but slower because it must write zeros to every byte. <strong>Buffer.allocUnsafe(size)</strong> creates a buffer without zeroing — it may contain old data from previous allocations (security risk if exposed). For small buffers (<=4KB), it uses a slab allocator that pre-allocates 8KB chunks and carves out pieces, which is very fast. <strong>Buffer.from(data)</strong> creates a buffer from existing data (string, array, ArrayBuffer). Key insight: allocUnsafe's slab sharing means a small buffer can keep an entire 8KB slab alive if any other buffer from that slab is still referenced. This is why Buffer.slice() can cause apparent memory leaks — the slice holds a reference to the original buffer's underlying memory. Use Buffer.from(buf.slice()) to create a copy that can be independently GC'd.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Node.js communicate between the JavaScript layer and C++ layer?</div>
  <div class="qa-a">Node.js has a layered architecture: JS code → Node.js JS library (lib/*.js) → C++ bindings (src/*.cc) → libuv/OpenSSL/etc. The binding layer uses V8's C++ API. When you call <code>fs.readFile()</code>, it goes through lib/fs.js (argument validation, promise wrapping), then calls <code>internalBinding('fs')</code> which accesses C++ functions registered via <code>NODE_MODULE_INIT</code>. The C++ code calls libuv's <code>uv_fs_read()</code>, which either uses the thread pool (for file I/O) or OS async primitives (for network I/O). When the operation completes, libuv calls back into C++, which creates a JavaScript callback context and invokes the JS callback via V8's API. For native addons, N-API provides a stable ABI so addons don't break across Node.js versions — unlike raw V8 API bindings which change frequently.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why does the event loop sometimes exit and sometimes keep running?</div>
  <div class="qa-a">The event loop runs as long as there are <strong>active handles or requests</strong>. Handles are long-lived objects: TCP servers, timers (setInterval), file watchers, child processes. Requests are short-lived operations: fs.readFile, DNS lookup, one-shot setTimeout. The loop checks <code>uv__loop_alive()</code> each iteration — if there are no pending callbacks, no active handles, and no active requests, the loop exits and the process terminates. This is why: (1) A simple script with only synchronous code exits immediately. (2) <code>setTimeout(fn, 1000)</code> keeps the process alive for 1 second. (3) An HTTP server (<code>server.listen()</code>) keeps it alive forever (active handle). (4) <code>server.unref()</code> marks a handle as not keeping the loop alive — useful for background timers that shouldn't prevent shutdown. (5) <code>process.exit()</code> forces immediate exit regardless of pending work.</div>
</div>
`
  }
];
