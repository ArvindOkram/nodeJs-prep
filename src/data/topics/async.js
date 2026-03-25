export const async = [
  {
    id: 'async',
    title: 'Async Programming',
    category: 'Async',
    starterCode: `// Async Programming Patterns Comparison

// 1. CALLBACK (old style)
function fetchUserCallback(id, callback) {
  setTimeout(() => {
    if (id > 0) callback(null, { id, name: 'Alice' });
    else callback(new Error('Invalid ID'), null);
  }, 100);
}

// 2. PROMISE
function fetchUserPromise(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: 'Alice' });
      else reject(new Error('Invalid ID'));
    }, 100);
  });
}

// 3. ASYNC/AWAIT (modern)
async function main() {
  console.log('--- Callback ---');
  fetchUserCallback(1, (err, user) => {
    if (err) console.error('Error:', err.message);
    else console.log('User:', user.name);
  });

  console.log('--- Promise ---');
  fetchUserPromise(1)
    .then(u => console.log('User:', u.name))
    .catch(e => console.error(e.message));

  console.log('--- Async/Await ---');
  try {
    const user = await fetchUserPromise(1);
    console.log('User:', user.name);

    // Parallel execution
    const [u1, u2] = await Promise.all([
      fetchUserPromise(1),
      fetchUserPromise(2)
    ]);
    console.log('Parallel:', u1.name, u2.name);
  } catch (e) {
    console.error(e.message);
  }
}

main();`,
    content: `
<h1>Async Programming</h1>

<h2>Three Patterns — Same Goal</h2>
<table>
  <tr><th>Pattern</th><th>Introduced</th><th>Readability</th><th>Error Handling</th></tr>
  <tr><td>Callbacks</td><td>Always</td><td>Poor (nesting)</td><td>Error-first pattern</td></tr>
  <tr><td>Promises</td><td>ES6 (2015)</td><td>Good (chaining)</td><td>.catch()</td></tr>
  <tr><td>Async/Await</td><td>ES8 (2017)</td><td>Excellent (sync-like)</td><td>try/catch</td></tr>
</table>

<h2>1. Callbacks (Error-First Pattern)</h2>
<pre><code>// Node.js convention: first arg is error, second is result
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) { console.error(err.message); return; }
  console.log(data);
});
// Code here runs BEFORE the file is read (non-blocking)</code></pre>

<h3>Callback Hell</h3>
<pre><code>// ❌ Deeply nested — hard to read and maintain
getUser(id, (err, user) => {
  getOrders(user.id, (err, orders) => {
    getProduct(orders[0].productId, (err, product) => {
      // ... more nesting
    });
  });
});</code></pre>

<h2>2. Promises</h2>
<pre><code>// States: pending → fulfilled | rejected (immutable once settled)
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve({ id: 1, name: 'Alice' }), 1000);
});

p.then(user => console.log(user))
 .catch(err => console.error(err))
 .finally(() => console.log('Done')); // always runs

// Promise chaining (flat, readable)
fetchUser(1)
  .then(user => fetchOrders(user.id))
  .then(orders => fetchProduct(orders[0].productId))
  .then(product => console.log(product))
  .catch(err => console.error(err)); // catches any error in chain</code></pre>

<h3>Promise Combinators</h3>
<pre><code>// all — parallel, fails if ANY reject
Promise.all([p1, p2, p3]).then(([r1, r2, r3]) => ...);

// allSettled — parallel, waits for ALL regardless of outcome
Promise.allSettled([p1, p2]).then(results => {
  results.forEach(r => {
    if (r.status === 'fulfilled') console.log(r.value);
    else console.log(r.reason);
  });
});

// race — first settled wins
Promise.race([fetchData(), timeout(3000)]);

// any — first FULFILLED wins (ignores rejections)
Promise.any([p1, p2, p3]);</code></pre>

<h2>3. Async / Await</h2>
<pre><code>// async function always returns a Promise
// await pauses execution inside the async function only
async function getProductForUser(userId) {
  try {
    const user    = await fetchUser(userId);
    const orders  = await fetchOrders(user.id);
    const product = await fetchProduct(orders[0].productId);
    return product;
  } catch (err) {
    console.error('Failed:', err.message);
    throw err; // re-throw if caller needs to handle
  }
}

// ⚠️ Common mistake: sequential awaits when independent
// ❌ Slow — each waits for previous
const user   = await fetchUser(1);    // 100ms
const orders = await fetchOrders(1);  // 100ms  = 200ms total

// ✅ Fast — parallel with Promise.all
const [user, orders] = await Promise.all([
  fetchUser(1),   // runs simultaneously
  fetchOrders(1), // runs simultaneously = ~100ms total
]);</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between async/await and Promises?</div>
  <div class="qa-a">async/await is syntactic sugar built on top of Promises — under the hood it's the same mechanism. An async function returns a Promise. await unwraps a Promise and pauses execution of the async function (not the event loop!) until the Promise settles. The main advantage is readability — async/await code looks synchronous and is easier to reason about, especially with try/catch error handling vs .catch() chains.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Does await block the event loop?</div>
  <div class="qa-a">No. await only pauses the current async function's execution — the event loop continues processing other callbacks. This is the key difference from synchronous blocking: <code>await fetchData()</code> yields control back to the event loop while waiting, so other requests can be handled. Only synchronous code (a large for loop, readFileSync) actually blocks the event loop.</div>
</div>`,
  },
];
