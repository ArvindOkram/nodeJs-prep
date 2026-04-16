export const redis = [
  {
    id: 'redis-architecture',
    title: 'Redis Architecture & Internals',
    category: 'Redis',
    starterCode: `// Simulating a Redis-like Key-Value Store with TTL
// In real Redis: single-threaded event loop + I/O threads (6+)

class MiniRedis {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  set(key, value, ttlMs = null) {
    this.store.set(key, { value, createdAt: Date.now() });
    if (ttlMs) {
      const expireAt = Date.now() + ttlMs;
      this.ttls.set(key, expireAt);
    }
    console.log(\`SET \${key} = \${JSON.stringify(value)}\${ttlMs ? ' TTL=' + ttlMs + 'ms' : ''}\`);
  }

  get(key) {
    // Lazy expiration — check TTL on access (like real Redis)
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      this.stats.evictions++;
      console.log(\`GET \${key} => EXPIRED (lazy deletion)\`);
      this.stats.misses++;
      return null;
    }
    if (!this.store.has(key)) {
      this.stats.misses++;
      console.log(\`GET \${key} => (nil)\`);
      return null;
    }
    this.stats.hits++;
    const val = this.store.get(key).value;
    console.log(\`GET \${key} => \${JSON.stringify(val)}\`);
    return val;
  }

  ttl(key) {
    if (!this.ttls.has(key)) return -1; // no TTL set
    const remaining = this.ttls.get(key) - Date.now();
    if (remaining <= 0) return -2; // expired
    return remaining;
  }

  // Simulate RDB snapshot
  rdbSnapshot() {
    const snapshot = {};
    for (const [k, v] of this.store) {
      if (!this.ttls.has(k) || Date.now() <= this.ttls.get(k)) {
        snapshot[k] = v.value;
      }
    }
    console.log('--- RDB Snapshot (fork + COW) ---');
    console.log(JSON.stringify(snapshot, null, 2));
    return snapshot;
  }

  info() {
    const { hits, misses, evictions } = this.stats;
    const ratio = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) : 0;
    console.log('--- Server Info ---');
    console.log(\`Keys: \${this.store.size}, Hits: \${hits}, Misses: \${misses}, Hit Ratio: \${ratio}%, Evictions: \${evictions}\`);
  }
}

// Demo
const r = new MiniRedis();
r.set('user:1', { name: 'Alice', role: 'SDE3' });
r.set('session:abc', 'token-xyz', 500); // 500ms TTL
r.set('config:max_conn', 100);

r.get('user:1');
r.get('session:abc');
r.get('nonexistent');

r.rdbSnapshot();
r.info();

// Demonstrate lazy expiration
setTimeout(() => {
  console.log('\\n--- After 600ms (TTL expired) ---');
  r.get('session:abc'); // should be expired
  r.info();
}, 600);`,
    content: `
<h1>Redis Architecture & Internals</h1>
<p>Redis (Remote Dictionary Server) is an <strong>in-memory data structure store</strong> used as a database, cache, message broker, and streaming engine. Understanding its internals is critical for SDE3 interviews where you must reason about performance, persistence trade-offs, and failure modes at scale.</p>

<h2>Single-Threaded Event Loop Model</h2>
<p>Redis processes all commands on a <strong>single main thread</strong> using an event loop (ae library). This eliminates locking overhead and context-switch costs, achieving sub-millisecond latency for most operations.</p>

<pre><code>// Redis event loop (simplified pseudocode)
while (server.running) {
  // 1. Process time events (cron jobs, TTL expiry sampling)
  processTimeEvents();

  // 2. Multiplex I/O — epoll/kqueue
  events = aeApiPoll(timeout);

  // 3. Handle file events (client read/write)
  for (event of events) {
    if (event.readable) readQueryFromClient(event.fd);
    if (event.writable) sendReplyToClient(event.fd);
  }

  // 4. Before sleep — flush AOF, handle async tasks
  beforeSleep();
}</code></pre>

<h3>I/O Threads in Redis 6+</h3>
<p>Redis 6 introduced <strong>multi-threaded I/O</strong> for reading client queries and writing responses. The command execution itself remains single-threaded, preserving atomicity guarantees.</p>
<pre><code># redis.conf — enable I/O threads
io-threads 4
io-threads-do-reads yes

# Flow:
# 1. I/O threads read data from sockets (parallel)
# 2. Main thread executes commands (serial — atomic)
# 3. I/O threads write responses back (parallel)</code></pre>

<table>
  <tr><th>Aspect</th><th>Before Redis 6</th><th>Redis 6+ with I/O Threads</th></tr>
  <tr><td>Socket reads</td><td>Main thread</td><td>I/O thread pool</td></tr>
  <tr><td>Command execution</td><td>Main thread</td><td>Main thread (unchanged)</td></tr>
  <tr><td>Socket writes</td><td>Main thread</td><td>I/O thread pool</td></tr>
  <tr><td>Throughput gain</td><td>Baseline</td><td>~2x on multi-core</td></tr>
  <tr><td>Atomicity</td><td>Guaranteed</td><td>Still guaranteed</td></tr>
</table>

<h2>Memory Management</h2>
<p>Redis uses <strong>jemalloc</strong> as its default memory allocator (over glibc malloc). jemalloc reduces fragmentation through size-class-based allocation and thread-local caches.</p>

<pre><code># Check memory usage
127.0.0.1:6379> INFO memory
used_memory:1024000          # Actual data
used_memory_rss:2048000      # OS-reported (includes fragmentation)
mem_fragmentation_ratio:2.0  # rss/used — ideally close to 1.0
mem_allocator:jemalloc-5.2.1

# Active defragmentation (Redis 4+)
activedefrag yes
active-defrag-threshold-lower 10   # start if frag > 10%
active-defrag-threshold-upper 100  # max effort if frag > 100%</code></pre>

<div class="warning-note">A mem_fragmentation_ratio significantly above 1.5 indicates fragmentation. Below 1.0 means Redis is using swap — a severe performance problem. Monitor this metric in production.</div>

<h2>Internal Data Encoding Optimizations</h2>
<p>Redis automatically selects compact internal encodings based on data size, switching to full data structures only when thresholds are exceeded.</p>

<table>
  <tr><th>Data Type</th><th>Small Encoding</th><th>Full Encoding</th><th>Threshold</th></tr>
  <tr><td>String</td><td>int (if numeric), embstr (&le;44 bytes)</td><td>raw (SDS)</td><td>44 bytes</td></tr>
  <tr><td>List</td><td>listpack (Redis 7+) / ziplist</td><td>quicklist (linked list of ziplists)</td><td>128 elements or 64-byte entries</td></tr>
  <tr><td>Set</td><td>intset (all integers) / listpack</td><td>hashtable</td><td>128 elements</td></tr>
  <tr><td>Sorted Set</td><td>listpack / ziplist</td><td>skiplist + hashtable</td><td>128 elements or 64-byte entries</td></tr>
  <tr><td>Hash</td><td>listpack / ziplist</td><td>hashtable</td><td>128 fields or 64-byte values</td></tr>
</table>

<pre><code># Check encoding of a key
127.0.0.1:6379> OBJECT ENCODING mykey
"ziplist"

# Tune thresholds
hash-max-ziplist-entries 128
hash-max-ziplist-value 64
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
set-max-intset-entries 512</code></pre>

<h3>Skiplist (Sorted Sets)</h3>
<p>Sorted Sets use a <strong>skiplist</strong> — a probabilistic data structure with O(log N) insert, delete, and search. Redis pairs this with a hashtable for O(1) score lookups by member.</p>

<pre><code>// Skiplist concept (simplified)
Level 3:  HEAD ---------> 30 ----------------------> NULL
Level 2:  HEAD ---------> 30 ---------> 70 --------> NULL
Level 1:  HEAD --> 10 --> 30 --> 50 --> 70 --> 90 --> NULL

// Each node is promoted to higher levels with probability 0.25
// Average O(log N) operations, worst case O(N) but extremely rare</code></pre>

<h2>Persistence: RDB vs AOF</h2>

<h3>RDB (Redis Database Snapshots)</h3>
<p>RDB creates point-in-time snapshots of the entire dataset. Redis forks a child process using <code>fork()</code>, which leverages <strong>copy-on-write (COW)</strong> to snapshot data while the parent continues serving requests.</p>

<pre><code># redis.conf — RDB triggers
save 900 1     # snapshot if >= 1 key changed in 900 seconds
save 300 10    # snapshot if >= 10 keys changed in 300 seconds
save 60 10000  # snapshot if >= 10000 keys changed in 60 seconds

rdbcompression yes    # LZF compression
rdbchecksum yes       # CRC64 checksum at end of file
dbfilename dump.rdb
dir /var/lib/redis/</code></pre>

<pre><code>// fork() and COW process
Parent Process (serving clients)
    |
    |-- fork() → Child Process (writes RDB to disk)
    |             - Reads from shared memory pages
    |             - No new allocations unless parent modifies data
    |
    |-- Parent continues: if it modifies a page,
    |   OS copies that page (COW) — child still sees original
    |
    |-- Child completes → renames temp file to dump.rdb (atomic)</code></pre>

<div class="warning-note">On a server with 30GB Redis data, fork() can cause a latency spike of 10-100ms. With heavy writes during BGSAVE, COW can temporarily double memory usage. Always reserve at least 50% extra memory headroom.</div>

<h3>AOF (Append-Only File)</h3>
<p>AOF logs every write command. On restart, Redis replays the AOF to reconstruct state.</p>

<pre><code># redis.conf — AOF configuration
appendonly yes
appendfilename "appendonly.aof"

# fsync policies
appendfsync always    # fsync after every write — safest, slowest
appendfsync everysec  # fsync once per second — good balance (default)
appendfsync no        # let OS decide — fastest, risk of data loss

# AOF rewrite — compact the log
auto-aof-rewrite-percentage 100   # rewrite when AOF is 2x last rewrite size
auto-aof-rewrite-min-size 64mb    # minimum size before rewrite triggers</code></pre>

<h3>RDB + AOF Hybrid (Redis 4+)</h3>
<p>When <code>aof-use-rdb-preamble yes</code> is set, AOF rewrite produces a file that starts with an RDB snapshot followed by AOF commands accumulated since the snapshot. This gives fast restarts (RDB) with minimal data loss (AOF).</p>

<pre><code># Hybrid AOF file structure:
[RDB preamble — binary snapshot of data at rewrite time]
[AOF tail — text commands appended after rewrite]

# Result:
# - Fast restart: load RDB portion first (binary, fast)
# - Then replay only the small AOF tail
# - Best of both worlds</code></pre>

<table>
  <tr><th>Feature</th><th>RDB</th><th>AOF</th><th>Hybrid</th></tr>
  <tr><td>Data loss window</td><td>Minutes (between snapshots)</td><td>~1 second (with everysec)</td><td>~1 second</td></tr>
  <tr><td>Restart speed</td><td>Fast (binary load)</td><td>Slow (replay commands)</td><td>Fast</td></tr>
  <tr><td>File size</td><td>Compact</td><td>Large (can be huge)</td><td>Moderate</td></tr>
  <tr><td>fork() overhead</td><td>Yes (BGSAVE)</td><td>Yes (BGREWRITEAOF)</td><td>Yes</td></tr>
  <tr><td>Recommended for</td><td>Backups, disaster recovery</td><td>Durability-first use cases</td><td>Production default</td></tr>
</table>

<h2>Redis Modules</h2>
<p>Redis modules extend core functionality with custom data types and commands. Key modules include:</p>
<ul>
  <li><strong>RediSearch</strong> — full-text search, secondary indexing</li>
  <li><strong>RedisJSON</strong> — native JSON document storage</li>
  <li><strong>RedisTimeSeries</strong> — time-series data with downsampling</li>
  <li><strong>RedisBloom</strong> — probabilistic data structures (Bloom, Cuckoo, Top-K, Count-Min Sketch)</li>
  <li><strong>RedisGraph</strong> — graph database using Cypher queries</li>
  <li><strong>RedisAI</strong> — run ML models (TensorFlow, PyTorch) inside Redis</li>
</ul>

<pre><code>// Node.js — using RediSearch module with ioredis
const Redis = require('ioredis');
const redis = new Redis();

// Create a search index
await redis.call('FT.CREATE', 'idx:products',
  'ON', 'HASH',
  'PREFIX', '1', 'product:',
  'SCHEMA',
    'name', 'TEXT', 'SORTABLE',
    'price', 'NUMERIC', 'SORTABLE',
    'category', 'TAG'
);

// Add documents
await redis.hset('product:1', { name: 'Gaming Laptop', price: 1299, category: 'electronics' });
await redis.hset('product:2', { name: 'Wireless Mouse', price: 29, category: 'electronics' });

// Full-text search with filters
const results = await redis.call('FT.SEARCH', 'idx:products',
  '@category:{electronics} @price:[0 100]',
  'SORTBY', 'price', 'ASC'
);
console.log(results); // Wireless Mouse</code></pre>

<h2>Key Expiry Mechanism</h2>
<p>Redis uses two strategies for handling expired keys:</p>
<ul>
  <li><strong>Lazy expiration</strong> — check TTL when a key is accessed; delete if expired</li>
  <li><strong>Active expiration</strong> — a periodic job (10 times/sec by default) samples 20 random keys with TTLs and deletes expired ones. If more than 25% are expired, it repeats immediately.</li>
</ul>

<pre><code>// Active expiry algorithm (runs in cron, 10 Hz)
function activeExpireCycle() {
  do {
    const sampled = randomSample(keysWithTTL, 20);
    let expired = 0;
    for (const key of sampled) {
      if (isExpired(key)) {
        delete(key);
        expired++;
      }
    }
    // If > 25% were expired, repeat immediately
    // This adapts to expiry rate
  } while (expired > 20 * 0.25);
}</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why is Redis single-threaded, and how does it still achieve high throughput?</div>
  <div class="qa-a">Redis is single-threaded for command execution to avoid locking overhead, context switches, and race conditions. It achieves high throughput (100K+ ops/sec on a single core) because: (1) all data is in memory — no disk I/O blocking; (2) operations are O(1) or O(log N); (3) it uses efficient I/O multiplexing (epoll/kqueue); (4) the event loop has minimal overhead. Redis 6+ adds I/O threads for socket read/write while keeping execution single-threaded.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the fork() process during BGSAVE. What can go wrong?</div>
  <div class="qa-a">During BGSAVE, Redis calls fork() to create a child process that writes the RDB snapshot. The child shares the same memory pages as the parent via copy-on-write. Problems include: (1) fork() latency — on a 30GB instance, fork() itself can take 10-100ms, blocking all clients; (2) COW memory amplification — if the parent writes heavily during the save, modified pages get copied, potentially doubling memory usage; (3) if the server runs out of memory during COW, the OOM killer may terminate Redis. Mitigation: reserve 50%+ extra RAM, monitor INFO persistence metrics, consider running BGSAVE on replicas instead.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose AOF over RDB, and vice versa?</div>
  <div class="qa-a">Choose AOF when you need minimal data loss (e.g., financial transactions) — with appendfsync everysec you lose at most 1 second of data. Choose RDB when you need fast restarts and can tolerate minutes of data loss (e.g., caching layer). In production, use the hybrid approach (aof-use-rdb-preamble yes) which gives you RDB's fast load time combined with AOF's durability. For cache-only use cases with no persistence needs, you can disable both entirely.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between ziplist and skiplist encoding for sorted sets?</div>
  <div class="qa-a">When a sorted set has fewer than 128 elements and all values are under 64 bytes, Redis stores it as a ziplist (or listpack in Redis 7+) — a contiguous block of memory that is cache-friendly and very compact, but O(N) for insertions. When it exceeds these thresholds, Redis converts it to a skiplist paired with a hashtable. The skiplist provides O(log N) range queries and insertions, while the hashtable enables O(1) score lookups by member. The automatic promotion is transparent to clients but has production implications — a large number of small sorted sets can suddenly balloon in memory when they cross thresholds.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Redis handle memory fragmentation? What is active defragmentation?</div>
  <div class="qa-a">Memory fragmentation occurs when freed memory leaves small unusable gaps between allocated blocks. Redis monitors this via the mem_fragmentation_ratio metric (RSS / used_memory). Active defragmentation (Redis 4+) runs in the background and moves allocations to reduce gaps without a restart. It uses jemalloc's je_malloc_stats and reallocates objects to consolidate memory. You configure thresholds (active-defrag-threshold-lower/upper) and CPU limits (active-defrag-cycle-min/max) so it does not impact latency. Without active defrag, the only solution was to restart Redis or perform a failover to a replica.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens when you run a slow command like KEYS * in production?</div>
  <div class="qa-a">Since Redis is single-threaded, KEYS * (O(N) over all keys) blocks every other client until it completes. On a database with millions of keys, this can cause seconds of downtime. Instead, use SCAN with a cursor and COUNT hint for incremental iteration. In production, rename dangerous commands (rename-command KEYS "") in redis.conf. Monitor slow commands with SLOWLOG GET to detect such issues before they cascade.</div>
</div>
`
  },
  {
    id: 'redis-data-structures',
    title: 'Redis Data Structures',
    category: 'Redis',
    starterCode: `// Simulating Redis Data Structures in JavaScript

// === 1. Strings (Redis: SET, GET, INCR) ===
class RedisStrings {
  constructor() { this.store = new Map(); }

  set(key, value) { this.store.set(key, String(value)); }
  get(key) { return this.store.get(key) || null; }
  incr(key) {
    const val = parseInt(this.store.get(key) || '0') + 1;
    this.store.set(key, String(val));
    return val;
  }
  incrby(key, amount) {
    const val = parseInt(this.store.get(key) || '0') + amount;
    this.store.set(key, String(val));
    return val;
  }
}

// === 2. Lists (Redis: LPUSH, RPUSH, LRANGE) ===
class RedisList {
  constructor() { this.store = new Map(); }

  lpush(key, ...values) {
    if (!this.store.has(key)) this.store.set(key, []);
    const list = this.store.get(key);
    list.unshift(...values.reverse());
    return list.length;
  }
  rpush(key, ...values) {
    if (!this.store.has(key)) this.store.set(key, []);
    const list = this.store.get(key);
    list.push(...values);
    return list.length;
  }
  lrange(key, start, stop) {
    const list = this.store.get(key) || [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
}

// === 3. Sets (Redis: SADD, SINTER, SUNION) ===
class RedisSet {
  constructor() { this.store = new Map(); }

  sadd(key, ...members) {
    if (!this.store.has(key)) this.store.set(key, new Set());
    const s = this.store.get(key);
    let added = 0;
    for (const m of members) { if (!s.has(m)) { s.add(m); added++; } }
    return added;
  }
  smembers(key) { return [...(this.store.get(key) || [])]; }
  sinter(key1, key2) {
    const a = this.store.get(key1) || new Set();
    const b = this.store.get(key2) || new Set();
    return [...a].filter(x => b.has(x));
  }
}

// === 4. Sorted Set (Redis: ZADD, ZRANGE) ===
class RedisSortedSet {
  constructor() { this.store = new Map(); }

  zadd(key, ...scoreMembers) {
    if (!this.store.has(key)) this.store.set(key, []);
    const zset = this.store.get(key);
    for (let i = 0; i < scoreMembers.length; i += 2) {
      const score = scoreMembers[i], member = scoreMembers[i + 1];
      const existing = zset.findIndex(e => e.member === member);
      if (existing >= 0) zset[existing].score = score;
      else zset.push({ score, member });
    }
    zset.sort((a, b) => a.score - b.score);
  }
  zrange(key, start, stop) {
    const zset = this.store.get(key) || [];
    return zset.slice(start, stop === -1 ? undefined : stop + 1).map(e => e.member);
  }
  zrangeWithScores(key, start, stop) {
    const zset = this.store.get(key) || [];
    return zset.slice(start, stop === -1 ? undefined : stop + 1);
  }
  zrank(key, member) {
    const zset = this.store.get(key) || [];
    return zset.findIndex(e => e.member === member);
  }
}

// === 5. Hash (Redis: HSET, HGET) ===
class RedisHash {
  constructor() { this.store = new Map(); }

  hset(key, field, value) {
    if (!this.store.has(key)) this.store.set(key, new Map());
    this.store.get(key).set(field, value);
  }
  hget(key, field) { return (this.store.get(key) || new Map()).get(field) || null; }
  hgetall(key) { return Object.fromEntries(this.store.get(key) || []); }
}

// Demo
console.log('=== Strings ===');
const str = new RedisStrings();
str.set('page:home:views', '100');
console.log('INCR:', str.incr('page:home:views')); // 101
console.log('INCRBY +50:', str.incrby('page:home:views', 50)); // 151

console.log('\\n=== Lists (Activity Feed) ===');
const list = new RedisList();
list.rpush('feed:user1', 'posted photo', 'liked comment', 'shared article');
console.log('Recent 2:', list.lrange('feed:user1', 0, 1));

console.log('\\n=== Sets (Social Features) ===');
const sets = new RedisSet();
sets.sadd('friends:alice', 'bob', 'charlie', 'dave');
sets.sadd('friends:bob', 'alice', 'charlie', 'eve');
console.log('Mutual friends:', sets.sinter('friends:alice', 'friends:bob'));

console.log('\\n=== Sorted Set (Leaderboard) ===');
const zset = new RedisSortedSet();
zset.zadd('leaderboard', 2500, 'player:alice', 1800, 'player:bob', 3200, 'player:charlie');
console.log('Top 3:', zset.zrangeWithScores('leaderboard', 0, -1));
console.log('Rank of bob:', zset.zrank('leaderboard', 'player:bob'));

console.log('\\n=== Hash (User Profile) ===');
const hash = new RedisHash();
hash.hset('user:1', 'name', 'Alice');
hash.hset('user:1', 'email', 'alice@example.com');
hash.hset('user:1', 'level', 'SDE3');
console.log('Profile:', hash.hgetall('user:1'));`,
    content: `
<h1>Redis Data Structures</h1>
<p>Redis provides <strong>8+ data structures</strong>, each optimized for specific access patterns. Understanding the right structure for each use case is fundamental to designing efficient Redis-backed systems. Redis is not just a key-value store — it is a <strong>data structure server</strong>.</p>

<h2>1. Strings</h2>
<p>The most basic type. Strings can hold text, serialized JSON, binary data (up to 512MB), or integers.</p>

<pre><code># Basic operations
SET user:1:name "Alice"
GET user:1:name          # "Alice"

# Atomic counters
SET page:views 0
INCR page:views          # 1
INCRBY page:views 100    # 101

# SET with options (Redis 6.2+)
SET session:abc "token" EX 3600 NX   # EX=TTL(sec), NX=only if not exists
# Equivalent to SETNX + EXPIRE in one atomic command

# Bit operations
SETBIT user:1:features 3 1    # Set bit 3
GETBIT user:1:features 3      # 1
BITCOUNT user:1:features      # Count set bits

# MGET/MSET for batch operations
MSET user:1:name "Alice" user:2:name "Bob"
MGET user:1:name user:2:name  # ["Alice", "Bob"]</code></pre>

<pre><code>// Node.js with ioredis
const Redis = require('ioredis');
const redis = new Redis();

// Atomic counter for rate limiting
const key = \`ratelimit:\${userId}:\${currentMinute}\`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > 100) throw new Error('Rate limit exceeded');</code></pre>

<h3>Use Cases</h3>
<ul>
  <li>Caching serialized objects (JSON.stringify)</li>
  <li>Atomic counters (page views, rate limiting)</li>
  <li>Distributed locks (SET key value NX EX 30)</li>
  <li>Session tokens</li>
  <li>Feature flags with bitmaps</li>
</ul>

<h2>2. Lists</h2>
<p>Doubly-linked lists (internally quicklist — linked list of ziplists). O(1) head/tail operations, O(N) indexed access.</p>

<pre><code># Push and pop
LPUSH queue:emails "email1" "email2"   # Push to head
RPUSH queue:emails "email3"             # Push to tail
LRANGE queue:emails 0 -1               # ["email2", "email1", "email3"]
LPOP queue:emails                       # "email2"
RPOP queue:emails                       # "email3"

# Blocking pop — consumer waits for data
BRPOP queue:emails 30   # Block up to 30 seconds

# Trim to keep only last N elements (bounded list)
LTRIM activity:user1 0 99   # Keep only 100 most recent items

# LPOS — find element position (Redis 6.0.6+)
LPOS mylist "target" RANK 1   # First occurrence</code></pre>

<pre><code>// Node.js — reliable queue with BRPOPLPUSH
// Producer
await redis.lpush('queue:jobs', JSON.stringify({ type: 'send_email', to: 'user@example.com' }));

// Consumer — atomic pop + push to processing queue
const job = await redis.brpoplpush('queue:jobs', 'queue:processing', 30);
// Process job...
await redis.lrem('queue:processing', 1, job); // Remove after success</code></pre>

<h3>Use Cases</h3>
<ul>
  <li>Message queues (LPUSH + BRPOP)</li>
  <li>Activity feeds (LPUSH + LTRIM for bounded feeds)</li>
  <li>Undo history stacks</li>
  <li>Recent items lists</li>
</ul>

<h2>3. Sets</h2>
<p>Unordered collections of unique strings. O(1) add/remove/membership check. Powerful set algebra operations.</p>

<pre><code># Basic operations
SADD tags:article1 "redis" "database" "nosql"
SADD tags:article2 "redis" "caching" "performance"
SMEMBERS tags:article1          # ["redis", "database", "nosql"]
SISMEMBER tags:article1 "redis" # 1 (true)
SCARD tags:article1             # 3 (cardinality)

# Set operations
SINTER tags:article1 tags:article2     # ["redis"] — intersection
SUNION tags:article1 tags:article2     # all unique tags
SDIFF tags:article1 tags:article2      # ["database", "nosql"] — in article1 but not article2

# Random members
SRANDMEMBER tags:article1 2   # 2 random members (non-destructive)
SPOP tags:article1             # Remove and return random member</code></pre>

<pre><code>// Node.js — mutual friends
await redis.sadd('friends:alice', 'bob', 'charlie', 'dave', 'eve');
await redis.sadd('friends:bob', 'alice', 'charlie', 'frank');

const mutual = await redis.sinter('friends:alice', 'friends:bob');
console.log('Mutual friends:', mutual); // ['charlie']

// Online users tracking
await redis.sadd('online:users', \`user:\${userId}\`);
// ... on disconnect:
await redis.srem('online:users', \`user:\${userId}\`);
const onlineCount = await redis.scard('online:users');</code></pre>

<h3>Use Cases</h3>
<ul>
  <li>Tagging systems</li>
  <li>Mutual friends / common interests</li>
  <li>Unique visitor tracking</li>
  <li>Online users tracking</li>
  <li>Random content selection (SRANDMEMBER)</li>
</ul>

<h2>4. Sorted Sets (ZSets)</h2>
<p>Like Sets but each member has an associated score (float64). Members are unique, scores are not. Internally: <strong>skiplist + hashtable</strong> for O(log N) range operations and O(1) score lookups.</p>

<pre><code># Leaderboard
ZADD leaderboard 2500 "alice" 1800 "bob" 3200 "charlie" 2100 "dave"

# Range by rank (ascending score)
ZRANGE leaderboard 0 -1 WITHSCORES   # All, lowest to highest
ZREVRANGE leaderboard 0 2 WITHSCORES # Top 3, highest first

# Range by score
ZRANGEBYSCORE leaderboard 2000 3000 WITHSCORES  # Scores between 2000-3000

# Rank lookup
ZREVRANK leaderboard "alice"  # 1 (0-indexed, descending)

# Increment score atomically
ZINCRBY leaderboard 500 "bob" # bob's score is now 2300

# Remove and count
ZREM leaderboard "dave"
ZCARD leaderboard             # 3
ZCOUNT leaderboard 2000 3000  # Count members with score in range

# Lexicographic range (when all scores are equal)
ZADD autocomplete 0 "apple" 0 "application" 0 "apply" 0 "banana"
ZRANGEBYLEX autocomplete "[app" "[app\\xff"  # ["apple", "application", "apply"]</code></pre>

<pre><code>// Node.js — real-time leaderboard
async function updateScore(userId, points) {
  await redis.zincrby('leaderboard:weekly', points, userId);
}

async function getTopPlayers(count = 10) {
  // ZREVRANGE returns highest scores first
  const results = await redis.zrevrange('leaderboard:weekly', 0, count - 1, 'WITHSCORES');
  const players = [];
  for (let i = 0; i < results.length; i += 2) {
    players.push({ userId: results[i], score: parseInt(results[i + 1]) });
  }
  return players;
}

async function getPlayerRank(userId) {
  const rank = await redis.zrevrank('leaderboard:weekly', userId);
  const score = await redis.zscore('leaderboard:weekly', userId);
  return { rank: rank !== null ? rank + 1 : null, score };
}</code></pre>

<h3>Use Cases</h3>
<ul>
  <li>Leaderboards and rankings</li>
  <li>Priority queues</li>
  <li>Rate limiters (sliding window)</li>
  <li>Autocomplete (lexicographic ranges)</li>
  <li>Time-series data (score = timestamp)</li>
  <li>Delayed job queues (score = execute-at timestamp)</li>
</ul>

<h2>5. Hashes</h2>
<p>Field-value maps attached to a key. Ideal for representing objects without serialization overhead.</p>

<pre><code># Object storage
HSET user:1000 name "Alice" email "alice@co.com" role "SDE3" joined "2022-01"
HGET user:1000 name           # "Alice"
HGETALL user:1000             # {name: "Alice", email: "alice@co.com", ...}
HMGET user:1000 name role     # ["Alice", "SDE3"]

# Atomic field increment
HINCRBY user:1000 login_count 1
HINCRBYFLOAT product:1 price -0.50

# Check existence
HEXISTS user:1000 email       # 1
HLEN user:1000                # number of fields

# Scan fields (safe for large hashes)
HSCAN user:1000 0 MATCH "login*" COUNT 100</code></pre>

<pre><code>// Node.js — session management
async function createSession(sessionId, userData) {
  const key = \`session:\${sessionId}\`;
  await redis.hmset(key, {
    userId: userData.id,
    role: userData.role,
    ip: userData.ip,
    createdAt: Date.now().toString()
  });
  await redis.expire(key, 3600); // 1 hour
}

async function getSession(sessionId) {
  const data = await redis.hgetall(\`session:\${sessionId}\`);
  return Object.keys(data).length > 0 ? data : null;
}

// Partial update without re-serializing
await redis.hset('session:abc', 'lastAccess', Date.now().toString());</code></pre>

<h3>Hash vs JSON String</h3>
<table>
  <tr><th>Aspect</th><th>Hash (HSET)</th><th>String (SET + JSON)</th></tr>
  <tr><td>Partial read</td><td>HGET — read one field</td><td>GET — must deserialize entire JSON</td></tr>
  <tr><td>Partial update</td><td>HSET — update one field</td><td>GET + modify + SET (not atomic)</td></tr>
  <tr><td>Memory (small)</td><td>Very efficient (ziplist)</td><td>Slightly larger</td></tr>
  <tr><td>Memory (large)</td><td>Hashtable overhead</td><td>More compact</td></tr>
  <tr><td>Nested objects</td><td>Not supported</td><td>Full JSON nesting</td></tr>
  <tr><td>Atomic increment</td><td>HINCRBY on numeric field</td><td>Not possible</td></tr>
</table>

<h2>6. Streams</h2>
<p>Redis Streams (5.0+) are an append-only log data structure designed for event sourcing and message queuing with consumer groups.</p>

<pre><code># Add entries (auto-generated ID = timestamp-sequence)
XADD events * user_id 1001 action "login" ip "1.2.3.4"
XADD events * user_id 1002 action "purchase" amount "49.99"

# Read entries
XRANGE events - +             # All entries
XRANGE events - + COUNT 10    # First 10
XLEN events                   # Count entries

# Consumer Groups
XGROUP CREATE events mygroup $ MKSTREAM

# Consumer reads from group
XREADGROUP GROUP mygroup consumer1 COUNT 5 BLOCK 2000 STREAMS events >

# Acknowledge processed message
XACK events mygroup 1234567890-0

# Check pending entries (unacknowledged)
XPENDING events mygroup - + 10

# Claim stale messages (consumer died)
XCLAIM events mygroup consumer2 60000 1234567890-0  # Claim after 60s idle</code></pre>

<pre><code>// Node.js — stream consumer with ioredis
async function consumeStream(groupName, consumerName) {
  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP', groupName, consumerName,
        'COUNT', 10, 'BLOCK', 5000,
        'STREAMS', 'events', '>'
      );
      if (results) {
        for (const [stream, messages] of results) {
          for (const [id, fields] of messages) {
            await processMessage(id, fields);
            await redis.xack('events', groupName, id);
          }
        }
      }
    } catch (err) {
      console.error('Consumer error:', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}</code></pre>

<h3>Streams vs Pub/Sub vs Lists</h3>
<table>
  <tr><th>Feature</th><th>Streams</th><th>Pub/Sub</th><th>Lists (BRPOP)</th></tr>
  <tr><td>Persistence</td><td>Yes (stored on disk)</td><td>No (fire-and-forget)</td><td>Yes</td></tr>
  <tr><td>Consumer groups</td><td>Yes (built-in)</td><td>No</td><td>No</td></tr>
  <tr><td>Replay/rewind</td><td>Yes (read from any ID)</td><td>No</td><td>No (consumed = gone)</td></tr>
  <tr><td>Fan-out</td><td>Multiple groups read same data</td><td>All subscribers get all messages</td><td>One consumer per message</td></tr>
  <tr><td>Acknowledgment</td><td>XACK</td><td>None</td><td>None</td></tr>
  <tr><td>Backpressure</td><td>BLOCK + COUNT</td><td>None (can drop)</td><td>BRPOP blocks</td></tr>
</table>

<h2>7. HyperLogLog</h2>
<p>Probabilistic data structure for <strong>cardinality estimation</strong> (count unique elements) using only ~12KB regardless of element count. Standard error: 0.81%.</p>

<pre><code># Count unique visitors
PFADD visitors:2024-01-15 "user:1001" "user:1002" "user:1003"
PFADD visitors:2024-01-15 "user:1001"  # Duplicate — no effect
PFCOUNT visitors:2024-01-15             # ~3

# Merge multiple HLLs (e.g., weekly unique visitors)
PFMERGE visitors:week1 visitors:2024-01-15 visitors:2024-01-16 visitors:2024-01-17
PFCOUNT visitors:week1                   # Approximate unique across all 3 days</code></pre>

<pre><code>// Node.js — unique event tracking
async function trackUniqueEvent(eventType, userId, date) {
  const key = \`hll:\${eventType}:\${date}\`;
  await redis.pfadd(key, userId);
  await redis.expire(key, 86400 * 30); // Keep 30 days
}

async function getUniqueCount(eventType, date) {
  return await redis.pfcount(\`hll:\${eventType}:\${date}\`);
}

// Merge for weekly/monthly reports
async function getWeeklyUniques(eventType, dates) {
  const keys = dates.map(d => \`hll:\${eventType}:\${d}\`);
  const destKey = \`hll:\${eventType}:weekly\`;
  await redis.pfmerge(destKey, ...keys);
  return await redis.pfcount(destKey);
}</code></pre>

<h2>8. Bitmaps & Geospatial</h2>

<h3>Bitmaps</h3>
<p>Strings treated as bit arrays. Extremely memory-efficient for boolean state tracking across large ID spaces.</p>

<pre><code># Daily active users (1 bit per user ID)
SETBIT dau:2024-01-15 1001 1   # User 1001 was active
SETBIT dau:2024-01-15 1002 1
GETBIT dau:2024-01-15 1001     # 1

# Count active users
BITCOUNT dau:2024-01-15        # 2

# Users active on BOTH days
BITOP AND active_both dau:2024-01-15 dau:2024-01-16
BITCOUNT active_both

# 100M users = only ~12.5 MB per day!</code></pre>

<h3>Geospatial</h3>
<pre><code># Store locations (uses sorted set internally)
GEOADD restaurants -73.985428 40.748817 "Empire State Diner"
GEOADD restaurants -73.968285 40.761431 "Central Park Cafe"

# Find nearby (within 2km radius)
GEOSEARCH restaurants FROMLONLAT -73.980 40.750 BYRADIUS 2 km ASC COUNT 5

# Distance between two members
GEODIST restaurants "Empire State Diner" "Central Park Cafe" km</code></pre>

<h2>Data Structure Selection Guide</h2>
<table>
  <tr><th>Use Case</th><th>Best Structure</th><th>Why</th></tr>
  <tr><td>Session cache</td><td>Hash or String</td><td>Partial updates with Hash, simple GET/SET with String</td></tr>
  <tr><td>Rate limiting</td><td>String (INCR) or Sorted Set</td><td>Fixed window with INCR, sliding window with ZSET</td></tr>
  <tr><td>Leaderboard</td><td>Sorted Set</td><td>O(log N) rank queries, atomic score updates</td></tr>
  <tr><td>Message queue</td><td>Stream or List</td><td>Streams for consumer groups, Lists for simple FIFO</td></tr>
  <tr><td>Unique counts</td><td>HyperLogLog</td><td>12KB regardless of cardinality</td></tr>
  <tr><td>Feature flags</td><td>Bitmap</td><td>1 bit per user, memory efficient</td></tr>
  <tr><td>Social graph</td><td>Set</td><td>SINTER for mutual friends, SUNION for recommendations</td></tr>
  <tr><td>Recent activity</td><td>List (capped) or Stream</td><td>LPUSH + LTRIM for bounded list</td></tr>
  <tr><td>Nearby search</td><td>Geospatial</td><td>Built-in radius queries</td></tr>
  <tr><td>Full-text search</td><td>RediSearch module</td><td>Inverted indexes, aggregation</td></tr>
</table>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: When would you use a Sorted Set vs a List for a job queue?</div>
  <div class="qa-a">Use a List (LPUSH/BRPOP) for simple FIFO queues where order is insertion time and you need blocking consumers. Use a Sorted Set when you need a priority queue (score = priority) or delayed jobs (score = execute-at timestamp) — you ZPOPMIN or ZRANGEBYSCORE to get the next job. Sorted Sets do not support blocking pops natively (until Redis 7.0 BZPOPMIN), so you may need to poll. For robust message queues with acknowledgment and consumer groups, Redis Streams are the best choice.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the memory implications of storing 10 million user objects as individual Strings vs Hashes.</div>
  <div class="qa-a">If you store each user as a JSON string (SET user:1 '{...}'), each key has per-key overhead (~70 bytes for the key object, dictEntry, SDS). For 10M keys, this overhead alone is ~700MB. An optimization is to use Hash bucketing: group users into buckets (e.g., HSET user_bucket:0 1 '{...}') with 100-200 users per hash. When a hash has fewer entries than hash-max-ziplist-entries (128), it uses ziplist encoding which is significantly more memory-efficient. Instagram famously reduced memory by 90% with this technique. The trade-off is more complex key management and inability to set per-user TTLs.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a sliding window rate limiter with Redis?</div>
  <div class="qa-a">Use a Sorted Set where the score is the timestamp of each request: (1) ZADD ratelimit:{userId} {now} {uniqueId} to record the request; (2) ZREMRANGEBYSCORE ratelimit:{userId} 0 {now - windowSize} to remove old entries; (3) ZCARD ratelimit:{userId} to count requests in the current window; (4) EXPIRE ratelimit:{userId} {windowSize} for cleanup. Wrap steps 1-3 in a Lua script or MULTI/EXEC for atomicity. This gives a true sliding window unlike the fixed-window INCR approach, but uses more memory per request.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is HyperLogLog and when is it appropriate vs exact counting with Sets?</div>
  <div class="qa-a">HyperLogLog estimates cardinality (unique count) with 0.81% standard error using only 12KB of memory regardless of the number of elements. A Set storing 10M unique user IDs would require ~800MB. Use HLL when: (1) you need approximate counts and can tolerate ~1% error; (2) the cardinality is large (millions+); (3) you need to merge counts across time periods (PFMERGE). Use exact Sets when: (1) you need to enumerate members; (2) you need exact counts; (3) the cardinality is small enough to fit in memory.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do Redis Streams differ from Kafka? When would you use one over the other?</div>
  <div class="qa-a">Redis Streams provide consumer groups, message acknowledgment, and replay — similar to Kafka. Key differences: (1) Redis stores everything in memory (limited by RAM), Kafka stores on disk (virtually unlimited retention); (2) Redis Streams are simpler to operate — no ZooKeeper/KRaft, no partition management; (3) Kafka supports multi-datacenter replication natively; (4) Kafka handles much higher throughput (millions of msgs/sec vs Redis's hundreds of thousands). Use Redis Streams for: moderate throughput, real-time features, when you already have Redis, and data fits in memory. Use Kafka for: high-throughput event streaming, long retention, cross-datacenter replication, and when you need a durable event log.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens internally when a ziplist-encoded Hash exceeds the threshold?</div>
  <div class="qa-a">When a hash exceeds hash-max-ziplist-entries (default 128) or any value exceeds hash-max-ziplist-value (default 64 bytes), Redis converts it from ziplist to a full hashtable in-place. This is a one-way conversion — it never converts back to ziplist even if you remove entries below the threshold. The conversion is O(N) and can cause a latency spike if the hash is large. In production, monitor OBJECT ENCODING on sample keys and tune thresholds carefully. Setting thresholds too high saves memory but increases CPU for linear scans within the ziplist.</div>
</div>
`
  },
  {
    id: 'redis-caching',
    title: 'Redis Caching Patterns',
    category: 'Redis',
    starterCode: `// Simulating Redis Caching Patterns in JavaScript

class CacheSimulator {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
    this.db = new Map(); // Simulated database
    this.stats = { hits: 0, misses: 0, writes: 0 };

    // Seed the "database"
    this.db.set('user:1', { name: 'Alice', role: 'SDE3', dept: 'Platform' });
    this.db.set('user:2', { name: 'Bob', role: 'SDE2', dept: 'Product' });
    this.db.set('product:1', { name: 'Widget', price: 49.99, stock: 150 });
  }

  // Check if key is expired
  isExpired(key) {
    if (!this.ttls.has(key)) return false;
    return Date.now() > this.ttls.get(key);
  }

  // === Pattern 1: Cache-Aside (Lazy Loading) ===
  async cacheAside(key) {
    console.log(\`\\n[Cache-Aside] GET \${key}\`);

    // 1. Check cache first
    if (this.cache.has(key) && !this.isExpired(key)) {
      this.stats.hits++;
      console.log('  -> Cache HIT');
      return this.cache.get(key);
    }

    // 2. Cache miss — read from DB
    this.stats.misses++;
    console.log('  -> Cache MISS, reading from DB...');
    const data = this.db.get(key);

    if (data) {
      // 3. Populate cache with TTL
      this.cache.set(key, data);
      this.ttls.set(key, Date.now() + 5000); // 5s TTL
      console.log('  -> Cached result with 5s TTL');
    }
    return data;
  }

  // === Pattern 2: Write-Through ===
  async writeThrough(key, value) {
    console.log(\`\\n[Write-Through] SET \${key}\`);

    // 1. Write to cache AND database atomically
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + 5000);
    this.db.set(key, value);
    this.stats.writes++;
    console.log('  -> Written to cache + DB (synchronous)');
  }

  // === Pattern 3: Write-Behind (Write-Back) ===
  async writeBehind(key, value) {
    console.log(\`\\n[Write-Behind] SET \${key}\`);

    // 1. Write to cache immediately
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + 5000);
    console.log('  -> Written to cache (instant)');

    // 2. Async write to DB (batched/delayed)
    setTimeout(() => {
      this.db.set(key, value);
      this.stats.writes++;
      console.log(\`  -> [Async] \${key} persisted to DB\`);
    }, 100);
  }

  // === Cache Stampede Protection ===
  async cacheAsideWithLock(key) {
    console.log(\`\\n[Cache-Aside + Lock] GET \${key}\`);

    if (this.cache.has(key) && !this.isExpired(key)) {
      this.stats.hits++;
      console.log('  -> Cache HIT');
      return this.cache.get(key);
    }

    // Acquire lock (simulated)
    const lockKey = \`lock:\${key}\`;
    if (this.cache.has(lockKey)) {
      console.log('  -> Lock held by another request, waiting...');
      // In real Redis: retry after short delay or return stale
      return this.cache.get(key); // return stale if available
    }

    this.cache.set(lockKey, true);
    console.log('  -> Lock acquired, fetching from DB...');

    const data = this.db.get(key);
    this.cache.set(key, data);
    this.ttls.set(key, Date.now() + 5000);
    this.cache.delete(lockKey); // release lock
    this.stats.misses++;

    console.log('  -> Fetched, cached, lock released');
    return data;
  }

  printStats() {
    const { hits, misses, writes } = this.stats;
    const ratio = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) : 0;
    console.log(\`\\n=== Stats: Hits=\${hits} Misses=\${misses} Writes=\${writes} HitRatio=\${ratio}% ===\`);
  }
}

// Demo
const sim = new CacheSimulator();

(async () => {
  // Cache-Aside pattern
  await sim.cacheAside('user:1');     // MISS
  await sim.cacheAside('user:1');     // HIT
  await sim.cacheAside('user:2');     // MISS

  // Write-Through pattern
  await sim.writeThrough('user:1', { name: 'Alice', role: 'SDE3', dept: 'Infra' });
  await sim.cacheAside('user:1');     // HIT (cache updated by write-through)

  // Write-Behind pattern
  await sim.writeBehind('product:1', { name: 'Widget Pro', price: 59.99, stock: 200 });

  // Stampede protection
  await sim.cacheAsideWithLock('user:2');

  sim.printStats();
})();`,
    content: `
<h1>Redis Caching Patterns</h1>
<p>Caching is the most common Redis use case. However, choosing the wrong caching pattern or ignoring invalidation leads to stale data, thundering herds, and cascading failures. SDE3 candidates must know the trade-offs deeply.</p>

<h2>1. Cache-Aside (Lazy Loading)</h2>
<p>The application manages the cache explicitly. On read, check cache first. On miss, load from DB and populate cache.</p>

<pre><code>// Cache-Aside with ioredis
async function getUser(userId) {
  const cacheKey = \`user:\${userId}\`;

  // 1. Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached); // HIT

  // 2. Cache miss — query database
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

  // 3. Populate cache with TTL
  if (user) {
    await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1 hour TTL
  }

  return user;
}

// Invalidation on write
async function updateUser(userId, data) {
  await db.query('UPDATE users SET ? WHERE id = ?', [data, userId]);
  await redis.del(\`user:\${userId}\`); // Invalidate cache
  // NOT set — delete! Next read will repopulate with fresh data
}</code></pre>

<table>
  <tr><th>Pros</th><th>Cons</th></tr>
  <tr><td>Only caches data that is actually read</td><td>Cache miss penalty (DB + cache write)</td></tr>
  <tr><td>Resilient — cache failure just means more DB reads</td><td>Stale data possible between DB write and cache delete</td></tr>
  <tr><td>Simple to implement</td><td>Cache stampede on popular key expiry</td></tr>
</table>

<div class="warning-note">Always DELETE the cache on write, never SET. If you SET the cache during writes, a race between two concurrent writers can store stale data. Delete-then-repopulate-on-read is safer because the read always fetches the latest from DB.</div>

<h2>2. Write-Through</h2>
<p>Every write goes to both cache and database synchronously. Reads always hit the cache.</p>

<pre><code>// Write-Through pattern
async function writeThrough(key, data) {
  // Write to DB first (source of truth)
  await db.query('INSERT INTO products ... ON DUPLICATE KEY UPDATE ...', [data]);

  // Then update cache (synchronous)
  await redis.setex(\`product:\${data.id}\`, 3600, JSON.stringify(data));
}

// Read is simple — always from cache
async function readThrough(key) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fallback to DB if cache was evicted
  const data = await db.query('...');
  if (data) await redis.setex(key, 3600, JSON.stringify(data));
  return data;
}</code></pre>

<table>
  <tr><th>Pros</th><th>Cons</th></tr>
  <tr><td>Cache is always consistent with DB</td><td>Write latency increases (cache + DB)</td></tr>
  <tr><td>Read performance is excellent</td><td>Caches data that may never be read</td></tr>
  <tr><td>Simpler consistency model</td><td>Cache churn on write-heavy workloads</td></tr>
</table>

<h2>3. Write-Behind (Write-Back)</h2>
<p>Write to cache immediately, asynchronously flush to database in batches. Optimizes write-heavy workloads.</p>

<pre><code>// Write-Behind with batch flushing
class WriteBehindCache {
  constructor() {
    this.dirtyKeys = new Set();
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  async write(key, data) {
    await redis.setex(key, 7200, JSON.stringify(data));
    this.dirtyKeys.add(key);
    // DB write happens asynchronously in flush()
  }

  async flush() {
    if (this.dirtyKeys.size === 0) return;

    const keys = [...this.dirtyKeys];
    this.dirtyKeys.clear();

    const pipeline = redis.pipeline();
    keys.forEach(k => pipeline.get(k));
    const results = await pipeline.exec();

    // Batch insert to DB
    const batch = results
      .filter(([err, val]) => !err && val)
      .map(([, val]) => JSON.parse(val));

    await db.batchUpsert(batch);
    console.log(\`Flushed \${batch.length} records to DB\`);
  }
}</code></pre>

<table>
  <tr><th>Pros</th><th>Cons</th></tr>
  <tr><td>Fastest write latency (cache only)</td><td>Data loss risk if Redis crashes before flush</td></tr>
  <tr><td>Batching reduces DB load</td><td>Complex failure handling</td></tr>
  <tr><td>Great for write-heavy workloads</td><td>Eventual consistency between cache and DB</td></tr>
</table>

<div class="warning-note">Write-Behind is risky without Redis persistence (AOF with fsync=always). If Redis crashes between writes and the flush, data is lost permanently. Use only when you can tolerate some data loss or have other durability guarantees.</div>

<h2>4. Read-Through</h2>
<p>The cache itself is responsible for loading data from the database on a miss. The application only talks to the cache layer. Often implemented via a caching library or proxy (e.g., Redis with a custom module or an application-level cache wrapper).</p>

<pre><code>// Read-Through abstraction
class ReadThroughCache {
  constructor(loader) {
    this.loader = loader; // Function that fetches from DB
  }

  async get(key) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    // Cache handles the DB fetch transparently
    const data = await this.loader(key);
    if (data) {
      await redis.setex(key, 3600, JSON.stringify(data));
    }
    return data;
  }
}

// Usage — application never touches DB directly for reads
const userCache = new ReadThroughCache(async (key) => {
  const id = key.split(':')[1];
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
});

const user = await userCache.get('user:1001');</code></pre>

<h2>Cache Invalidation Strategies</h2>

<table>
  <tr><th>Strategy</th><th>How</th><th>When to Use</th></tr>
  <tr><td>TTL-based</td><td>Set expiry on every key</td><td>Acceptable staleness window; simplest approach</td></tr>
  <tr><td>Event-driven</td><td>Delete cache on DB write events (CDC/webhooks)</td><td>Strong consistency needed; event infrastructure exists</td></tr>
  <tr><td>Version-based</td><td>Include version in cache key (user:1:v5)</td><td>Immutable-style caching; no explicit invalidation</td></tr>
  <tr><td>Pub/Sub broadcast</td><td>Publish invalidation events to all app instances</td><td>Multi-instance deployments with local caches</td></tr>
  <tr><td>Write-through</td><td>Update cache on every write</td><td>Read-heavy, write consistency required</td></tr>
</table>

<h2>Cache Stampede / Thundering Herd</h2>
<p>When a popular cache key expires, hundreds of concurrent requests simultaneously query the database and try to repopulate the cache, overwhelming the DB.</p>

<h3>Solution 1: Distributed Lock</h3>
<pre><code>async function getWithLock(key) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const lockKey = \`lock:\${key}\`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);

  if (acquired) {
    try {
      // Only one request fetches from DB
      const data = await db.query('...');
      await redis.setex(key, 3600, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Other requests wait and retry
    await sleep(50);
    return getWithLock(key); // Retry — cache should be populated
  }
}</code></pre>

<h3>Solution 2: Probabilistic Early Expiration (PER)</h3>
<pre><code>// XFetch algorithm — probabilistically refresh before TTL expires
async function xfetch(key, ttl, beta = 1.0) {
  const cached = await redis.get(key);
  if (cached) {
    const { value, delta, expiry } = JSON.parse(cached);
    const now = Date.now() / 1000;

    // Probabilistically recompute before expiry
    // Earlier refresh as expiry approaches
    const shouldRefresh = (now - delta * beta * Math.log(Math.random())) >= expiry;

    if (!shouldRefresh) return value;
  }

  const start = Date.now() / 1000;
  const freshData = await db.query('...');
  const delta = Date.now() / 1000 - start; // computation time

  await redis.setex(key, ttl, JSON.stringify({
    value: freshData,
    delta: delta,
    expiry: Date.now() / 1000 + ttl
  }));

  return freshData;
}</code></pre>

<h2>Cache Penetration</h2>
<p>Requests for non-existent keys always miss the cache and hit the database. An attacker can exploit this by querying for millions of non-existent IDs.</p>

<h3>Solution: Bloom Filter</h3>
<pre><code>// Using RedisBloom module
// On application startup — populate bloom filter with all valid IDs
await redis.call('BF.RESERVE', 'valid_ids', 0.001, 10000000); // 0.1% FP rate

// When inserting a new user
await db.insert(user);
await redis.call('BF.ADD', 'valid_ids', user.id);

// On read
async function getUser(userId) {
  // Check bloom filter first — O(1), filters 99.9% of invalid requests
  const exists = await redis.call('BF.EXISTS', 'valid_ids', userId);
  if (!exists) return null; // Definitely does not exist — skip DB

  return cacheAside(\`user:\${userId}\`);
}</code></pre>

<h3>Solution: Cache Null Results</h3>
<pre><code>async function getUserWithNullCache(userId) {
  const key = \`user:\${userId}\`;
  const cached = await redis.get(key);

  if (cached === 'NULL_SENTINEL') return null; // Cached negative result
  if (cached) return JSON.parse(cached);

  const user = await db.query('...');
  if (user) {
    await redis.setex(key, 3600, JSON.stringify(user));
  } else {
    // Cache the "not found" with a short TTL
    await redis.setex(key, 300, 'NULL_SENTINEL'); // 5 min
  }
  return user;
}</code></pre>

<h2>Cache Breakdown vs Cache Avalanche</h2>
<table>
  <tr><th>Problem</th><th>Description</th><th>Solution</th></tr>
  <tr><td>Cache Breakdown</td><td>A single hot key expires, causing a stampede</td><td>Locks, PER, never-expire + background refresh</td></tr>
  <tr><td>Cache Avalanche</td><td>Many keys expire at the same time, overwhelming DB</td><td>Jitter TTLs (add random offset), circuit breaker, multi-level cache</td></tr>
  <tr><td>Cache Penetration</td><td>Queries for non-existent data always miss</td><td>Bloom filter, cache null results</td></tr>
</table>

<pre><code>// TTL jitter to prevent cache avalanche
function setWithJitter(key, value, baseTTL) {
  // Add random 10-20% jitter
  const jitter = baseTTL * (0.1 + Math.random() * 0.1);
  const ttl = Math.floor(baseTTL + jitter);
  return redis.setex(key, ttl, JSON.stringify(value));
}

// Instead of: all product keys expire at 3600s
// Now: keys expire between 3960-4320s (random spread)</code></pre>

<h2>Hot Key Problem</h2>
<p>A single extremely popular key (e.g., trending product, viral post) creates a bottleneck on the Redis node hosting that key.</p>

<pre><code>// Solution 1: Local cache (L1) + Redis (L2)
const localCache = new Map();

async function getHotKey(key) {
  // L1: In-process cache (0 network latency)
  if (localCache.has(key)) {
    const { value, expiry } = localCache.get(key);
    if (Date.now() < expiry) return value;
  }

  // L2: Redis
  const data = await redis.get(key);
  if (data) {
    localCache.set(key, { value: JSON.parse(data), expiry: Date.now() + 1000 }); // 1s local TTL
    return JSON.parse(data);
  }
  return null;
}

// Solution 2: Key replication — spread across multiple keys
async function setHotKey(key, value, replicas = 5) {
  const pipeline = redis.pipeline();
  for (let i = 0; i < replicas; i++) {
    pipeline.setex(\`\${key}:r\${i}\`, 3600, JSON.stringify(value));
  }
  await pipeline.exec();
}

async function getHotKey(key, replicas = 5) {
  const replicaIndex = Math.floor(Math.random() * replicas);
  return redis.get(\`\${key}:r\${replicaIndex}\`);
}</code></pre>

<h2>Caching Pattern Decision Matrix</h2>
<table>
  <tr><th>Pattern</th><th>Consistency</th><th>Write Latency</th><th>Read Latency</th><th>Best For</th></tr>
  <tr><td>Cache-Aside</td><td>Eventual</td><td>Normal (DB only)</td><td>HIT: fast, MISS: slow</td><td>General purpose, read-heavy</td></tr>
  <tr><td>Write-Through</td><td>Strong</td><td>Slow (DB + cache)</td><td>Always fast</td><td>Read-heavy, consistency needed</td></tr>
  <tr><td>Write-Behind</td><td>Eventual</td><td>Very fast (cache only)</td><td>Always fast</td><td>Write-heavy, loss-tolerant</td></tr>
  <tr><td>Read-Through</td><td>Eventual</td><td>N/A</td><td>HIT: fast, MISS: slow</td><td>Simpler app code</td></tr>
</table>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You have a Cache-Aside setup and notice stale data after updates. What is the race condition and how do you fix it?</div>
  <div class="qa-a">Classic race: Thread A reads stale data from DB (just before Thread B's UPDATE commits), then Thread B deletes the cache, then Thread A writes stale data to cache. Fix: (1) Use delayed double-delete — delete cache, update DB, sleep briefly, delete cache again; (2) Use event-driven invalidation via CDC (Change Data Capture) from the DB binlog — this guarantees invalidation happens after the write commits; (3) Use write-through so cache is always updated as part of the write path. The CDC approach is most robust at scale.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle a cache avalanche where 50% of your cache expires at the same time?</div>
  <div class="qa-a">Multiple layers: (1) Add random jitter to TTLs — instead of all keys expiring at 3600s, spread between 3240-3960s; (2) Implement a circuit breaker on the DB — if too many cache misses arrive simultaneously, start rejecting/queuing excess requests; (3) Use a multi-level cache (in-process L1 + Redis L2) so not all misses hit Redis; (4) For critical keys, use background refresh before TTL expires (stale-while-revalidate pattern); (5) If using Redis Cluster, ensure even key distribution so no single node is overwhelmed.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the thundering herd problem and the XFetch probabilistic early expiration algorithm.</div>
  <div class="qa-a">When a hot cache key expires, N concurrent requests all see a cache miss and simultaneously query the database — this is the thundering herd. XFetch (also called Probabilistic Early Recomputation) addresses this by having each reader probabilistically decide to refresh the cache BEFORE it actually expires. The probability increases as the key approaches its TTL. The formula is: should_refresh = (now - delta * beta * log(random())) >= expiry, where delta is the recomputation time. This means on average only one request refreshes the key shortly before expiry, and others continue to read the still-valid cached value. The beta parameter controls how early the refresh window starts.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: In a microservices architecture, how do you handle cache invalidation when multiple services write to the same data?</div>
  <div class="qa-a">Options in increasing robustness: (1) TTL-only — accept eventual consistency within the TTL window; (2) Event-driven — each service publishes an invalidation event to a message bus (Kafka/Redis Streams) when it modifies data; all consuming services delete their cached copies; (3) CDC pipeline — use Debezium to capture database changelog and push invalidation events; (4) Centralized cache service — a single service owns the cache for each data domain and exposes it via API; other services request through it. Option 3 (CDC) is the gold standard because it is decoupled from application code and guarantees invalidation after commit.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle the hot key problem at scale (e.g., a flash sale product page)?</div>
  <div class="qa-a">Multi-pronged approach: (1) Local in-process cache (Guava/Caffeine in Java, lru-cache in Node.js) with 1-2 second TTL — eliminates Redis roundtrips for the hottest keys; (2) Key replication — replicate the hot key across N random suffixes (product:1:r0 through product:1:r9) and load-balance reads across them; (3) Read replicas — in Redis Cluster, add read replicas to the node hosting the hot key (replica-read-only no); (4) At the CDN layer, cache the API response with short TTL for truly hot endpoints. Monitor hot keys using redis-cli --hotkeys (based on LFU) or application-side tracking.</div>
</div>
`
  },
  {
    id: 'redis-pubsub',
    title: 'Redis Pub/Sub & Messaging',
    category: 'Redis',
    starterCode: `// Simulating Redis Pub/Sub and Streams in JavaScript

// === Pub/Sub Simulation ===
class PubSubBroker {
  constructor() {
    this.channels = new Map();       // channel -> Set of callbacks
    this.patterns = new Map();       // pattern -> Set of callbacks
  }

  subscribe(channel, callback) {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set());
    this.channels.get(channel).add(callback);
    console.log(\`[SUB] Subscribed to: \${channel}\`);
  }

  psubscribe(pattern, callback) {
    if (!this.patterns.has(pattern)) this.patterns.set(pattern, new Set());
    this.patterns.get(pattern).add(callback);
    console.log(\`[PSUB] Pattern subscribed: \${pattern}\`);
  }

  publish(channel, message) {
    let delivered = 0;

    // Exact channel subscribers
    if (this.channels.has(channel)) {
      for (const cb of this.channels.get(channel)) {
        cb(channel, message);
        delivered++;
      }
    }

    // Pattern subscribers
    for (const [pattern, callbacks] of this.patterns) {
      const regex = new RegExp('^' + pattern.replace(/\\*/g, '.*') + '$');
      if (regex.test(channel)) {
        for (const cb of callbacks) {
          cb(channel, message);
          delivered++;
        }
      }
    }

    console.log(\`[PUB] \${channel}: "\${message}" -> \${delivered} subscribers\`);
    return delivered;
  }
}

// === Stream Simulation (with Consumer Groups) ===
class StreamBroker {
  constructor() {
    this.streams = new Map();        // stream -> [entries]
    this.groups = new Map();         // stream:group -> { lastId, consumers, pending }
    this.idCounter = 0;
  }

  xadd(stream, fields) {
    if (!this.streams.has(stream)) this.streams.set(stream, []);
    const id = \`\${Date.now()}-\${this.idCounter++}\`;
    this.streams.get(stream).push({ id, fields });
    console.log(\`[XADD] \${stream} \${id} \${JSON.stringify(fields)}\`);
    return id;
  }

  xgroupCreate(stream, group, startId = '$') {
    const key = \`\${stream}:\${group}\`;
    const entries = this.streams.get(stream) || [];
    this.groups.set(key, {
      lastId: startId === '$' ? (entries.length > 0 ? entries[entries.length - 1].id : '0') : '0',
      pending: new Map(),   // consumer -> [entry ids]
      acked: new Set()
    });
    console.log(\`[XGROUP] Created group "\${group}" on stream "\${stream}"\`);
  }

  xreadgroup(group, consumer, stream, count = 1) {
    const key = \`\${stream}:\${group}\`;
    const groupState = this.groups.get(key);
    if (!groupState) return [];

    const entries = this.streams.get(stream) || [];
    const results = [];

    for (const entry of entries) {
      if (entry.id > groupState.lastId && !groupState.acked.has(entry.id)) {
        results.push(entry);
        // Track as pending for this consumer
        if (!groupState.pending.has(consumer)) groupState.pending.set(consumer, []);
        groupState.pending.get(consumer).push(entry.id);
        groupState.lastId = entry.id;
        if (results.length >= count) break;
      }
    }

    if (results.length > 0) {
      console.log(\`[XREADGROUP] \${consumer} read \${results.length} from \${stream}:\${group}\`);
    }
    return results;
  }

  xack(stream, group, id) {
    const key = \`\${stream}:\${group}\`;
    const groupState = this.groups.get(key);
    if (groupState) {
      groupState.acked.add(id);
      console.log(\`[XACK] \${stream}:\${group} acknowledged \${id}\`);
    }
  }
}

// === Demo ===
console.log('=== Pub/Sub Demo ===');
const pubsub = new PubSubBroker();

pubsub.subscribe('orders', (ch, msg) => console.log(\`  [Order Service] \${msg}\`));
pubsub.subscribe('orders', (ch, msg) => console.log(\`  [Analytics] \${msg}\`));
pubsub.psubscribe('user:*', (ch, msg) => console.log(\`  [User Events] \${ch}: \${msg}\`));

pubsub.publish('orders', 'New order #1234');
pubsub.publish('user:login', 'alice logged in');
pubsub.publish('user:purchase', 'bob purchased item');

console.log('\\n=== Stream + Consumer Group Demo ===');
const stream = new StreamBroker();

// Producer adds events
stream.xadd('events', { type: 'pageview', page: '/home' });
stream.xadd('events', { type: 'click', button: 'signup' });
stream.xadd('events', { type: 'purchase', amount: 49.99 });

// Create consumer group
stream.xgroupCreate('events', 'analytics', '0');

// Consumer 1 reads
const batch1 = stream.xreadgroup('analytics', 'worker-1', 'events', 2);
batch1.forEach(e => {
  console.log(\`  Processing: \${JSON.stringify(e.fields)}\`);
  stream.xack('events', 'analytics', e.id);
});

// Consumer 2 reads remaining
const batch2 = stream.xreadgroup('analytics', 'worker-2', 'events', 2);
batch2.forEach(e => {
  console.log(\`  Processing: \${JSON.stringify(e.fields)}\`);
  stream.xack('events', 'analytics', e.id);
});`,
    content: `
<h1>Redis Pub/Sub & Messaging</h1>
<p>Redis offers two messaging paradigms: the classic <strong>Pub/Sub</strong> system (fire-and-forget) and <strong>Streams</strong> (persistent, with consumer groups). Understanding when to use each — and their limitations — is essential for designing reliable distributed systems.</p>

<h2>Pub/Sub Basics</h2>
<p>Redis Pub/Sub delivers messages to all connected subscribers in real-time. Messages are not persisted — if a subscriber is disconnected, messages are lost.</p>

<pre><code># Terminal 1 — Subscriber
127.0.0.1:6379> SUBSCRIBE orders notifications
Reading messages...
1) "subscribe"
2) "orders"
3) (integer) 1

# Terminal 2 — Publisher
127.0.0.1:6379> PUBLISH orders '{"id":1234,"total":99.99}'
(integer) 2   # Number of subscribers who received the message

# Pattern-based subscription
127.0.0.1:6379> PSUBSCRIBE user:*
# Matches: user:login, user:logout, user:purchase, etc.

127.0.0.1:6379> PUBLISH user:login '{"userId":"alice"}'
# All PSUBSCRIBE user:* clients receive this</code></pre>

<pre><code>// Node.js with ioredis — Pub/Sub requires separate connections
const Redis = require('ioredis');
const subscriber = new Redis();  // Dedicated connection for subscribing
const publisher = new Redis();   // Separate connection for publishing

// Subscribe
subscriber.subscribe('orders', 'notifications', (err, count) => {
  console.log(\`Subscribed to \${count} channels\`);
});

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(\`[\${channel}] Received:\`, data);

  switch (channel) {
    case 'orders':
      processOrder(data);
      break;
    case 'notifications':
      sendNotification(data);
      break;
  }
});

// Pattern subscribe
subscriber.psubscribe('user:*');
subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(\`Pattern \${pattern} matched on \${channel}:\`, message);
});

// Publish from any connection
await publisher.publish('orders', JSON.stringify({
  id: 1234,
  items: ['widget'],
  total: 99.99
}));</code></pre>

<div class="warning-note">A Redis connection in subscribe mode can ONLY execute SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, and PING. You MUST use a separate connection for regular commands. ioredis handles this, but be aware of connection pool sizing.</div>

<h2>Pub/Sub Limitations</h2>
<table>
  <tr><th>Limitation</th><th>Implication</th><th>Workaround</th></tr>
  <tr><td>No persistence</td><td>Messages lost if subscriber is down</td><td>Use Streams instead</td></tr>
  <tr><td>No acknowledgment</td><td>Cannot confirm delivery</td><td>Use Streams with XACK</td></tr>
  <tr><td>No replay</td><td>Cannot re-read past messages</td><td>Use Streams with XRANGE</td></tr>
  <tr><td>All subscribers get all messages</td><td>Cannot distribute work across consumers</td><td>Use Streams consumer groups</td></tr>
  <tr><td>Backpressure</td><td>Slow subscriber causes output buffer to grow; Redis may disconnect it</td><td>Tune client-output-buffer-limit pubsub</td></tr>
</table>

<pre><code># Redis config — output buffer limits for Pub/Sub clients
# If a subscriber's output buffer exceeds these limits, Redis disconnects it
client-output-buffer-limit pubsub 32mb 8mb 60
# Hard limit: 32MB, Soft limit: 8MB for 60 seconds</code></pre>

<h2>Keyspace Notifications</h2>
<p>Redis can publish events when keys are modified or expired. This is useful for cache invalidation, session expiry handling, and event-driven architectures.</p>

<pre><code># Enable keyspace notifications
# K = keyspace events, E = keyevent events
# x = expired events, g = generic commands, $ = string commands
127.0.0.1:6379> CONFIG SET notify-keyspace-events KEgx

# Subscribe to expiry events
127.0.0.1:6379> PSUBSCRIBE __keyevent@0__:expired

# In another terminal:
127.0.0.1:6379> SET session:abc "data" EX 5
# After 5 seconds, subscriber receives:
# channel: __keyevent@0__:expired
# message: session:abc</code></pre>

<pre><code>// Node.js — handle session expiry
const notifySub = new Redis();
await notifySub.psubscribe('__keyevent@0__:expired');

notifySub.on('pmessage', (pattern, channel, expiredKey) => {
  if (expiredKey.startsWith('session:')) {
    const sessionId = expiredKey.split(':')[1];
    console.log(\`Session expired: \${sessionId}\`);
    // Clean up related data, send logout event, etc.
    cleanupSession(sessionId);
  }
});</code></pre>

<div class="warning-note">Keyspace notifications are delivered via Pub/Sub, so they are NOT reliable — if your listener is disconnected, expiry events are missed permanently. For critical workflows, pair keyspace notifications with periodic SCAN-based cleanup as a safety net.</div>

<h2>Redis Streams — Persistent Message Queue</h2>
<p>Streams (Redis 5.0+) are a log data structure that solves Pub/Sub's limitations. They provide persistence, consumer groups, acknowledgment, and replay.</p>

<h3>Stream Entry Structure</h3>
<pre><code># Entry ID format: <millisecondsTimestamp>-<sequenceNumber>
# Auto-generated with *
XADD events * user_id 1001 action "login" ip "10.0.0.1"
# Returns: "1678901234567-0"

# Explicit ID (useful for idempotent writes)
XADD events 1678901234567-0 user_id 1001 action "login"

# Capped stream (keep only last 10000 entries)
XADD events MAXLEN ~ 10000 * action "pageview"
# ~ means approximate trimming (more efficient — trims to nearest macro node)</code></pre>

<h3>Reading from Streams</h3>
<pre><code># Read all entries
XRANGE events - +
XRANGE events - + COUNT 10

# Read new entries (tail -f style)
XREAD COUNT 5 BLOCK 5000 STREAMS events $
# BLOCK 5000 = wait up to 5 seconds for new data
# $ = only new entries after this command is issued

# Read from specific ID
XREAD COUNT 5 STREAMS events 1678901234567-0</code></pre>

<h3>Consumer Groups</h3>
<p>Consumer groups allow distributing stream entries across multiple consumers, with each entry delivered to exactly one consumer in the group.</p>

<pre><code># Create consumer group starting from beginning (0) or end ($)
XGROUP CREATE events analytics 0 MKSTREAM

# Consumer reads (> means undelivered messages only)
XREADGROUP GROUP analytics worker-1 COUNT 5 BLOCK 2000 STREAMS events >
XREADGROUP GROUP analytics worker-2 COUNT 5 BLOCK 2000 STREAMS events >

# Each worker gets different entries — work is distributed!

# Acknowledge processing
XACK events analytics 1678901234567-0

# Check pending (unacknowledged) entries
XPENDING events analytics - + 10
# Shows: entryId, consumer, idle time, delivery count

# Claim messages from a dead consumer (idle > 60s)
XCLAIM events analytics worker-2 60000 1678901234567-0
# worker-2 takes over processing of stale entries

# Auto-claim (Redis 6.2+) — claim + read in one command
XAUTOCLAIM events analytics worker-2 60000 0-0 COUNT 10</code></pre>

<pre><code>// Node.js — robust stream consumer with error handling
const Redis = require('ioredis');
const redis = new Redis();

async function ensureConsumerGroup(stream, group) {
  try {
    await redis.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
    console.log(\`Created group \${group}\`);
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
    // Group already exists — ok
  }
}

async function processStream(stream, group, consumer) {
  await ensureConsumerGroup(stream, group);

  // Phase 1: Process any pending (unacknowledged) messages from previous runs
  let pendingId = '0-0';
  while (true) {
    const pending = await redis.xreadgroup(
      'GROUP', group, consumer,
      'COUNT', 10, 'STREAMS', stream, pendingId
    );
    if (!pending || pending[0][1].length === 0) break;

    for (const [id, fields] of pending[0][1]) {
      await handleMessage(id, fields);
      await redis.xack(stream, group, id);
      pendingId = id;
    }
  }

  // Phase 2: Read new messages
  while (true) {
    try {
      const result = await redis.xreadgroup(
        'GROUP', group, consumer,
        'COUNT', 10, 'BLOCK', 5000,
        'STREAMS', stream, '>'
      );

      if (result) {
        for (const [id, fields] of result[0][1]) {
          try {
            await handleMessage(id, fields);
            await redis.xack(stream, group, id);
          } catch (err) {
            console.error(\`Failed processing \${id}:\`, err);
            // Message stays in PEL — will be retried or claimed
          }
        }
      }
    } catch (err) {
      console.error('Stream read error:', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function handleMessage(id, fields) {
  const data = {};
  for (let i = 0; i < fields.length; i += 2) {
    data[fields[i]] = fields[i + 1];
  }
  console.log(\`Processing \${id}:\`, data);
  // ... business logic
}</code></pre>

<h3>Exactly-Once Processing with Streams</h3>
<p>Redis Streams provide at-least-once delivery by default (via XACK). For exactly-once semantics:</p>

<pre><code>// Exactly-once via idempotency key
async function processIdempotent(id, fields) {
  const idempotencyKey = \`processed:\${id}\`;

  // Check if already processed
  const already = await redis.set(idempotencyKey, '1', 'NX', 'EX', 86400);
  if (!already) {
    console.log(\`Skipping duplicate: \${id}\`);
    await redis.xack('events', 'mygroup', id);
    return;
  }

  // Process with idempotent DB operation
  await db.query(
    'INSERT INTO events (stream_id, data) VALUES (?, ?) ON CONFLICT (stream_id) DO NOTHING',
    [id, JSON.stringify(fields)]
  );

  await redis.xack('events', 'mygroup', id);
}</code></pre>

<h2>Pub/Sub vs Streams Decision Guide</h2>
<table>
  <tr><th>Requirement</th><th>Use Pub/Sub</th><th>Use Streams</th></tr>
  <tr><td>Real-time, ephemeral events</td><td>Yes</td><td>Overkill</td></tr>
  <tr><td>All consumers get every message</td><td>Yes (broadcast)</td><td>Possible (one group per consumer)</td></tr>
  <tr><td>Message durability</td><td>No</td><td>Yes</td></tr>
  <tr><td>Work distribution</td><td>No</td><td>Yes (consumer groups)</td></tr>
  <tr><td>Message acknowledgment</td><td>No</td><td>Yes (XACK)</td></tr>
  <tr><td>Replay history</td><td>No</td><td>Yes (XRANGE)</td></tr>
  <tr><td>Chat / notifications</td><td>Good fit</td><td>OK</td></tr>
  <tr><td>Job queue / task processing</td><td>Bad fit</td><td>Good fit</td></tr>
  <tr><td>Event sourcing</td><td>Bad fit</td><td>Good fit</td></tr>
</table>

<h2>Production Architecture Example</h2>
<pre><code>// Multi-service event bus using Redis Streams
//
// Producer Service (Order Service)
//   └── XADD order_events * type "order_created" orderId "1234" ...
//
// Consumer Group: "payment_service"
//   ├── payment-worker-1: XREADGROUP GROUP payment_service worker-1 ...
//   └── payment-worker-2: XREADGROUP GROUP payment_service worker-2 ...
//
// Consumer Group: "notification_service"
//   ├── notif-worker-1: XREADGROUP GROUP notification_service worker-1 ...
//   └── notif-worker-2: XREADGROUP GROUP notification_service worker-2 ...
//
// Consumer Group: "analytics_service"
//   └── analytics-worker-1: XREADGROUP GROUP analytics_service worker-1 ...
//
// Each group processes ALL events independently
// Within a group, events are distributed across workers</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why does Redis Pub/Sub require a separate connection? What happens if a subscriber is slow?</div>
  <div class="qa-a">When a connection enters subscribe mode, it enters a special state where it can only handle subscription-related commands (SUBSCRIBE, UNSUBSCRIBE, PING). The connection becomes a one-way message receiver. If a subscriber is slow, Redis buffers messages in the client's output buffer. If the buffer exceeds client-output-buffer-limit (default: 32MB hard, 8MB soft for 60s), Redis forcefully disconnects the client and all buffered messages are lost. This is why Pub/Sub is fire-and-forget — there is no delivery guarantee.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do Redis Streams handle consumer failure? Explain the PEL (Pending Entries List).</div>
  <div class="qa-a">When a consumer reads a message via XREADGROUP, the message ID is added to the PEL (Pending Entries List) for that consumer within the group. The PEL tracks: message ID, consumer name, delivery timestamp, and delivery count. The message stays in the PEL until XACK is called. If a consumer crashes before acknowledging, the messages remain in the PEL. Recovery options: (1) the same consumer reconnects and reads pending messages using ID '0' instead of '>'; (2) another consumer uses XCLAIM to take over messages idle for too long; (3) Redis 6.2+ offers XAUTOCLAIM which combines pending message scanning and claiming in one command. The delivery count in the PEL also lets you implement dead-letter logic — after N failed deliveries, move the message to a DLQ.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can Redis Streams replace Kafka? What are the trade-offs?</div>
  <div class="qa-a">Redis Streams can replace Kafka for small-to-medium workloads. Key trade-offs: (1) Storage: Kafka stores on disk (cheap, virtually unlimited retention), Redis stores in memory (expensive, limited by RAM); (2) Throughput: Kafka handles millions of messages/sec per partition, Redis Streams handles hundreds of thousands; (3) Partitioning: Kafka has native topic partitions, Redis Streams rely on Redis Cluster hash slots — multi-key operations across slots need careful key design; (4) Replication: Kafka has ISR-based replication with tunable acks, Redis replication is asynchronous (potential data loss on failover); (5) Ecosystem: Kafka has Kafka Connect, KSQL, Schema Registry. Use Redis Streams when: you already have Redis, throughput is moderate, data fits in memory, and you want simplicity. Use Kafka when: you need high throughput, long retention, cross-DC replication, or a streaming platform.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a reliable notification system using Redis?</div>
  <div class="qa-a">Use Redis Streams, not Pub/Sub, since notifications must be reliable. Design: (1) Producer XADDs to a stream (e.g., notifications:{userId}); (2) Create a consumer group per notification channel (push, email, SMS); (3) Workers XREADGROUP with BLOCK to process notifications; (4) After successful delivery, XACK the message; (5) A supervisor job periodically XAUTOCLAIMs messages idle for >60 seconds (dead consumers); (6) After 3 failed delivery attempts (tracked via XPENDING delivery count), move to a dead-letter stream for manual review; (7) Trim streams with MAXLEN ~ 10000 to bound memory usage. For truly critical notifications, back this with a database table and treat Redis as the fast path with the DB as the fallback.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain keyspace notifications and their reliability characteristics.</div>
  <div class="qa-a">Keyspace notifications use Pub/Sub internally to broadcast events when keys are modified, expired, or evicted. You enable them with CONFIG SET notify-keyspace-events and subscribe to channels like __keyevent@0__:expired. Since they use Pub/Sub, they have the same reliability issues: if your listener is disconnected, events are lost forever. Also, expired key notifications are delivered when Redis actually removes the key (via lazy or active expiry), not exactly at TTL time — there can be a delay. For production use, always pair keyspace notifications with a periodic SCAN-based reconciliation job. They are useful for cache invalidation cascades, session cleanup triggering, and debugging, but never as the sole mechanism for critical business logic.</div>
</div>
`
  },
  {
    id: 'redis-cluster',
    title: 'Redis Cluster & High Availability',
    category: 'Redis',
    starterCode: `// Simulating Redis Cluster Concepts
// Hash Slots, Consistent Hashing, and Failover

// === Consistent Hashing Ring ===
class ConsistentHashRing {
  constructor(nodes, virtualNodes = 150) {
    this.ring = new Map();       // position -> node
    this.sortedPositions = [];   // sorted ring positions
    this.virtualNodes = virtualNodes;
    this.nodeMap = new Map();    // node -> [positions]

    for (const node of nodes) {
      this.addNode(node);
    }
  }

  // Simple hash function (simulating CRC16 used by Redis Cluster)
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return Math.abs(hash);
  }

  addNode(node) {
    const positions = [];
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualKey = \`\${node}:vn\${i}\`;
      const pos = this.hash(virtualKey);
      this.ring.set(pos, node);
      positions.push(pos);
    }
    this.nodeMap.set(node, positions);
    this.sortedPositions = [...this.ring.keys()].sort((a, b) => a - b);
    console.log(\`[+] Added node: \${node} (\${this.virtualNodes} virtual nodes)\`);
  }

  removeNode(node) {
    const positions = this.nodeMap.get(node) || [];
    for (const pos of positions) {
      this.ring.delete(pos);
    }
    this.nodeMap.delete(node);
    this.sortedPositions = [...this.ring.keys()].sort((a, b) => a - b);
    console.log(\`[-] Removed node: \${node}\`);
  }

  getNode(key) {
    if (this.sortedPositions.length === 0) return null;
    const hash = this.hash(key);

    // Find the first position >= hash (clockwise on ring)
    let idx = this.sortedPositions.findIndex(pos => pos >= hash);
    if (idx === -1) idx = 0; // Wrap around

    return this.ring.get(this.sortedPositions[idx]);
  }
}

// === Redis Cluster Hash Slot Simulation ===
class RedisClusterSim {
  constructor() {
    this.slots = new Array(16384); // 16384 hash slots
    this.nodes = new Map();
  }

  // CRC16 simplified
  crc16(key) {
    let crc = 0;
    for (let i = 0; i < key.length; i++) {
      crc = ((crc << 5) + crc + key.charCodeAt(i)) & 0x3FFF; // mod 16384
    }
    return crc;
  }

  // Hash tag extraction: {tag}rest -> use "tag" for hashing
  extractHashTag(key) {
    const start = key.indexOf('{');
    if (start === -1) return key;
    const end = key.indexOf('}', start + 1);
    if (end === -1 || end === start + 1) return key;
    return key.substring(start + 1, end);
  }

  getSlot(key) {
    const hashPart = this.extractHashTag(key);
    return this.crc16(hashPart);
  }

  assignSlots(nodeId, startSlot, endSlot) {
    for (let i = startSlot; i <= endSlot; i++) {
      this.slots[i] = nodeId;
    }
    this.nodes.set(nodeId, { start: startSlot, end: endSlot, data: new Map() });
    console.log(\`Node \${nodeId}: slots \${startSlot}-\${endSlot}\`);
  }

  set(key, value) {
    const slot = this.getSlot(key);
    const node = this.slots[slot];
    console.log(\`SET \${key} -> slot \${slot} -> \${node}\`);
    this.nodes.get(node).data.set(key, value);
  }

  get(key) {
    const slot = this.getSlot(key);
    const node = this.slots[slot];
    const value = this.nodes.get(node).data.get(key);
    console.log(\`GET \${key} -> slot \${slot} -> \${node} = \${value}\`);
    return value;
  }
}

// Demo 1: Consistent Hash Ring
console.log('=== Consistent Hash Ring ===');
const ring = new ConsistentHashRing(['redis-1', 'redis-2', 'redis-3']);

const keys = ['user:1', 'user:2', 'user:3', 'session:abc', 'product:42'];
console.log('\\nKey distribution:');
const distribution = {};
for (const key of keys) {
  const node = ring.getNode(key);
  distribution[node] = (distribution[node] || 0) + 1;
  console.log(\`  \${key} -> \${node}\`);
}
console.log('Distribution:', distribution);

// Add a node — minimal key redistribution
console.log('\\n--- Adding redis-4 ---');
ring.addNode('redis-4');
console.log('New distribution:');
for (const key of keys) {
  console.log(\`  \${key} -> \${ring.getNode(key)}\`);
}

// Demo 2: Redis Cluster Hash Slots
console.log('\\n=== Redis Cluster (Hash Slots) ===');
const cluster = new RedisClusterSim();
cluster.assignSlots('master-1', 0, 5460);
cluster.assignSlots('master-2', 5461, 10922);
cluster.assignSlots('master-3', 10923, 16383);

console.log('\\nKey routing:');
cluster.set('user:1', 'Alice');
cluster.set('user:2', 'Bob');
cluster.set('product:1', 'Widget');

// Hash tags — force keys to same slot
console.log('\\nHash tags (same slot):');
console.log('Slot for {order}:1:', cluster.getSlot('{order}:1'));
console.log('Slot for {order}:2:', cluster.getSlot('{order}:2'));
console.log('Same slot?', cluster.getSlot('{order}:1') === cluster.getSlot('{order}:2'));`,
    content: `
<h1>Redis Cluster & High Availability</h1>
<p>Production Redis deployments need high availability and horizontal scaling. Redis provides two approaches: <strong>Redis Sentinel</strong> for HA with automatic failover, and <strong>Redis Cluster</strong> for sharding + HA. Understanding the trade-offs and failure modes is critical for SDE3-level system design.</p>

<h2>Redis Sentinel</h2>
<p>Sentinel is a distributed monitoring system that provides automatic failover for Redis master-replica setups. It does NOT provide sharding.</p>

<pre><code>// Sentinel Architecture
//
// Sentinel 1 ──┐
// Sentinel 2 ──┼── Monitor ──> Master (read/write)
// Sentinel 3 ──┘                 │
//                          ┌─────┴─────┐
//                       Replica 1   Replica 2
//                       (read-only) (read-only)
//
// If Master fails:
// 1. Sentinels detect failure (quorum agreement)
// 2. Sentinels elect a leader Sentinel
// 3. Leader promotes a replica to master
// 4. Other replicas reconfigured to replicate from new master
// 5. Clients are notified of the new master address</code></pre>

<pre><code># sentinel.conf
sentinel monitor mymaster 10.0.0.1 6379 2  # quorum of 2
sentinel down-after-milliseconds mymaster 5000  # 5s to declare SDOWN
sentinel failover-timeout mymaster 60000  # max failover time
sentinel parallel-syncs mymaster 1  # replicas syncing simultaneously

# Sentinel failure detection:
# SDOWN (Subjective Down) — one Sentinel thinks master is down
# ODOWN (Objective Down) — quorum Sentinels agree master is down
# Only ODOWN triggers failover</code></pre>

<pre><code>// Node.js — connecting via Sentinel with ioredis
const Redis = require('ioredis');

const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 }
  ],
  name: 'mymaster',          // Sentinel group name
  sentinelPassword: 'secret', // Sentinel auth (Redis 6.2+)
  password: 'redis-pass',     // Redis instance auth

  // Read from replicas for read scaling
  role: 'master',  // or 'slave' for read replicas

  // Automatic reconnect on failover
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on('ready', () => console.log('Connected to master'));
redis.on('+switch-master', () => console.log('Master switched — reconnecting'));</code></pre>

<h3>Sentinel Limitations</h3>
<ul>
  <li>No automatic sharding — all data must fit on a single master</li>
  <li>Write scaling is limited to a single master</li>
  <li>During failover (5-30 seconds), writes fail</li>
  <li>Async replication means acknowledged writes can be lost on failover</li>
</ul>

<h2>Redis Cluster</h2>
<p>Redis Cluster provides <strong>automatic sharding</strong> across multiple masters, each responsible for a subset of 16384 hash slots, plus built-in replication and failover.</p>

<h3>Hash Slot Assignment</h3>
<pre><code>// Redis Cluster uses CRC16(key) mod 16384 to determine the hash slot
//
// 16384 slots distributed across masters:
// Master A: slots 0-5460      + Replica A'
// Master B: slots 5461-10922  + Replica B'
// Master C: slots 10923-16383 + Replica C'
//
// Key "user:1000" → CRC16("user:1000") mod 16384 → slot 7438 → Master B

// Check slot assignment:
// 127.0.0.1:6379> CLUSTER KEYSLOT user:1000
// (integer) 7438

// View slot distribution:
// 127.0.0.1:6379> CLUSTER SLOTS
// 1) 1) (integer) 0
//    2) (integer) 5460
//    3) 1) "10.0.0.1"
//       2) (integer) 6379
// ...</code></pre>

<h3>Gossip Protocol</h3>
<p>Cluster nodes communicate via a gossip protocol on port+10000 (e.g., 16379). Each node periodically pings random nodes to share cluster topology, detect failures, and propagate configuration changes.</p>

<pre><code>// Gossip messages include:
// - Node ID, IP, port, flags (master/slave/fail)
// - Hash slot assignments
// - Replication topology
// - Cluster epoch (version counter for configuration)
//
// Failure detection:
// 1. Node A pings Node B, no response within cluster-node-timeout
// 2. Node A marks B as PFAIL (Probable Failure)
// 3. Node A gossips PFAIL to other nodes
// 4. If majority of masters mark B as PFAIL → FAIL
// 5. B's replica initiates failover</code></pre>

<h3>Client-Side Routing</h3>
<pre><code>// When a client sends a command to the wrong node:

// MOVED redirection — permanent slot migration completed
// Client: GET user:1000
// Server: -MOVED 7438 10.0.0.2:6379
// Client updates slot map and redirects to correct node

// ASK redirection — slot migration in progress
// Client: GET user:1000
// Server: -ASK 7438 10.0.0.2:6379
// Client sends ASKING + GET to target node (one-time redirect)
// Client does NOT update slot map (migration might fail)</code></pre>

<pre><code>// Node.js — ioredis Cluster client
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: '10.0.0.1', port: 6379 },
  { host: '10.0.0.2', port: 6379 },
  { host: '10.0.0.3', port: 6379 }
], {
  // Automatically handle MOVED/ASK redirections
  redisOptions: {
    password: 'secret'
  },

  // Scale reads to replicas
  scaleReads: 'slave',  // 'master' | 'slave' | 'all'

  // NAT mapping (for Docker/K8s)
  natMap: {
    '172.17.0.2:6379': { host: 'redis-1.example.com', port: 6379 },
    '172.17.0.3:6379': { host: 'redis-2.example.com', port: 6379 }
  },

  // Retry on CLUSTERDOWN
  clusterRetryStrategy(times) {
    return Math.min(times * 100, 3000);
  }
});

cluster.on('ready', () => console.log('Cluster connected'));
cluster.on('+node', (node) => console.log('Node added:', node.options.host));
cluster.on('-node', (node) => console.log('Node removed:', node.options.host));</code></pre>

<h3>Hash Tags for Multi-Key Operations</h3>
<p>Redis Cluster only allows multi-key operations when all keys hash to the same slot. Use <strong>hash tags</strong> to force co-location.</p>

<pre><code># Hash tag: only the part inside {braces} is hashed
# These all hash to the same slot:
SET {user:1000}:profile "..."
SET {user:1000}:settings "..."
SET {user:1000}:sessions "..."

# Now MGET works (all in same slot):
MGET {user:1000}:profile {user:1000}:settings

# MULTI/EXEC (transaction) works:
MULTI
SET {order:5678}:status "shipped"
HINCRBY {order:5678}:tracking updates 1
EXEC

# Lua scripts work (all keys must use same hash tag):
EVAL "redis.call('SET', KEYS[1], ARGV[1]) ..." 2 {user:1}:a {user:1}:b val1 val2</code></pre>

<div class="warning-note">Hash tags can create hot spots if overused. If all of a popular user's data is forced into one slot, that node becomes a bottleneck. Design hash tags around your access patterns — not every related key needs to be co-located.</div>

<h3>Failover Process in Cluster</h3>
<pre><code>// Automatic failover:
// 1. Master C becomes unreachable
// 2. Other masters detect PFAIL via gossip
// 3. Majority of masters agree → FAIL
// 4. Replica C' initiates election
//    - Waits: DELAY = 500ms + random(0,500) + rank * 1000ms
//    - Replica with most data (highest replication offset) has rank 0
// 5. Replica C' requests votes from all masters
// 6. Majority of masters grant vote → Replica C' promoted
// 7. New master C' broadcasts updated slot config
// 8. Cluster epoch incremented
//
// Manual failover (for maintenance):
// On the replica: CLUSTER FAILOVER
// Graceful: waits for replica to catch up, then promotes</code></pre>

<h2>Split-Brain Protection</h2>
<pre><code># Prevent writes to isolated master (minority partition)
min-replicas-to-write 1     # Refuse writes if fewer than 1 replica connected
min-replicas-max-lag 10     # Replica must have replicated within 10 seconds

# Scenario:
# Network partition isolates Master A from the rest of the cluster
# Master A has 0 connected replicas → rejects writes
# Meanwhile, Replica A' is promoted in the majority partition
# When partition heals, old Master A steps down
# Without min-replicas-to-write, both sides accept writes → data divergence</code></pre>

<h2>Resharding (Slot Migration)</h2>
<pre><code># Add a 4th master and redistribute slots
# Using redis-cli:
redis-cli --cluster add-node 10.0.0.4:6379 10.0.0.1:6379

# Reshard — move 4096 slots from existing masters to new node
redis-cli --cluster reshard 10.0.0.1:6379 \\
  --cluster-from all \\
  --cluster-to <new-node-id> \\
  --cluster-slots 4096 \\
  --cluster-yes

# During resharding:
# 1. Source node marks slots as MIGRATING
# 2. Target node marks slots as IMPORTING
# 3. Keys are moved one by one (MIGRATE command)
# 4. Clients may get ASK redirections during migration
# 5. After all keys moved, slot ownership is updated</code></pre>

<h2>Sentinel vs Cluster Comparison</h2>
<table>
  <tr><th>Feature</th><th>Sentinel</th><th>Cluster</th></tr>
  <tr><td>Purpose</td><td>HA only (failover)</td><td>HA + sharding</td></tr>
  <tr><td>Sharding</td><td>No — single master</td><td>Yes — 16384 hash slots</td></tr>
  <tr><td>Max data size</td><td>Single server memory</td><td>Sum of all master memories</td></tr>
  <tr><td>Write scaling</td><td>Single master</td><td>Multiple masters (linear)</td></tr>
  <tr><td>Multi-key ops</td><td>Fully supported</td><td>Only within same hash slot</td></tr>
  <tr><td>Failover time</td><td>5-30 seconds</td><td>1-5 seconds</td></tr>
  <tr><td>Complexity</td><td>Low</td><td>Medium-High</td></tr>
  <tr><td>Minimum nodes</td><td>3 Sentinels + 1 Master + 1 Replica</td><td>6 (3 masters + 3 replicas)</td></tr>
  <tr><td>Recommended for</td><td>Small datasets, simpler ops</td><td>Large datasets, high write throughput</td></tr>
</table>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You have a Redis Cluster and need to run a MULTI/EXEC transaction across keys owned by different nodes. How?</div>
  <div class="qa-a">You cannot run a transaction across different hash slots in Redis Cluster. Solutions: (1) Use hash tags to force related keys to the same slot — e.g., {order:1234}:items and {order:1234}:status will be on the same node; (2) Use Lua scripts with all KEYS using the same hash tag; (3) If the keys naturally belong to different domains, implement a saga pattern at the application level — each step is a separate Redis operation with compensating actions on failure. Hash tags are the standard approach, but beware of creating hot spots if one tag contains disproportionate traffic.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain how Redis Cluster handles a network partition. Can split-brain occur?</div>
  <div class="qa-a">In a network partition, the minority side loses quorum and its masters (if any) cannot get enough FAILOVER votes — so no conflicting promotions happen on that side. However, a master isolated in the minority partition still accepts writes for a window of time (cluster-node-timeout). These writes are lost when the partition heals because the majority side promoted a replica. To prevent this, configure min-replicas-to-write 1 — the isolated master will reject writes if it has no connected replicas. The majority side proceeds with failover as normal. When the partition heals, the old master discovers a higher config epoch, demotes itself to replica, and syncs from the new master — losing any writes it accepted while isolated.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you migrate from a Sentinel setup to Redis Cluster with minimal downtime?</div>
  <div class="qa-a">A phased approach: (1) Set up the Redis Cluster alongside the existing Sentinel deployment; (2) Implement dual-write in the application — write to both Sentinel master and Cluster; (3) Use a migration script to copy existing data from Sentinel to Cluster (SCAN + RESTORE/DUMP or use redis-shake); (4) Switch reads to the Cluster and verify data consistency; (5) Remove dual-write, point all traffic to Cluster; (6) Decommission Sentinel. Key considerations: refactor keys that need multi-key operations to use hash tags; test that all Lua scripts use proper KEYS parameters; update client libraries to use Cluster-aware connections. Some teams use a proxy like Twemproxy during the transition to abstract the topology change from the application.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between MOVED and ASK redirections?</div>
  <div class="qa-a">MOVED means the slot has permanently moved to another node — the client should update its local slot map and always route future requests for that slot to the new node. ASK means the slot is currently being migrated — the key might be on the target node but the migration is not complete. The client should send an ASKING command followed by the actual command to the target node, but should NOT update its slot map. The distinction matters because during resharding, some keys in a slot may still be on the source while others have already migrated. An ASK redirect happens when the source node does not have the specific key (already migrated) but still owns the slot officially.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Redis Cluster replica election work? What determines which replica is promoted?</div>
  <div class="qa-a">When a master fails and its replicas detect this (via FAIL state in gossip), replicas initiate an election. Each replica delays before requesting votes: delay = 500ms + random(0-500ms) + REPLICA_RANK * 1000ms. REPLICA_RANK is determined by the replica's replication offset — the replica with the most data has rank 0 and votes first. This ensures the most up-to-date replica is likely promoted. A replica needs votes from a majority of reachable masters. Once a replica receives majority votes, it promotes itself, takes over the dead master's slots, and broadcasts the new configuration with an incremented cluster epoch. If the first election fails (no majority), replicas retry with increased delay.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Your Redis Cluster is experiencing high latency during resharding. What is happening and how do you mitigate it?</div>
  <div class="qa-a">During resharding, the MIGRATE command moves keys from source to target node. Issues: (1) Big keys (large hashes, sets) cause single MIGRATE calls that block both source and target for the duration of the transfer; (2) MIGRATE uses a synchronous connection — each key transfer waits for a round trip; (3) ASK redirections add latency for client requests to migrating slots. Mitigation: (1) Identify and break up big keys before resharding (MEMORY USAGE, DEBUG OBJECT); (2) Use the --cluster-pipeline option to batch MIGRATE commands; (3) Reshard during low-traffic periods; (4) Migrate fewer slots at a time; (5) Monitor with CLUSTER INFO and SLOWLOG during migration. In Redis 7+, slot migration is significantly faster with improved MIGRATE batching.</div>
</div>
`
  },
  {
    id: 'redis-scaling',
    title: 'Redis Scaling & Production',
    category: 'Redis',
    starterCode: `// Redis Production Patterns: Rate Limiter + Leaderboard

// === Rate Limiter (Sliding Window with Sorted Set) ===
class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.windows = new Map(); // key -> sorted array of timestamps
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.windows.has(key)) this.windows.set(key, []);
    const timestamps = this.windows.get(key);

    // Remove expired entries (like ZREMRANGEBYSCORE)
    while (timestamps.length > 0 && timestamps[0] < windowStart) {
      timestamps.shift();
    }

    if (timestamps.length >= this.maxRequests) {
      const retryAfter = timestamps[0] + this.windowMs - now;
      console.log(\`[DENIED] \${key}: \${timestamps.length}/\${this.maxRequests} (retry in \${retryAfter}ms)\`);
      return false;
    }

    timestamps.push(now);
    console.log(\`[ALLOWED] \${key}: \${timestamps.length}/\${this.maxRequests}\`);
    return true;
  }
}

// === Leaderboard ===
class Leaderboard {
  constructor(name) {
    this.name = name;
    this.entries = []; // [{member, score}] kept sorted
  }

  addScore(member, score) {
    const idx = this.entries.findIndex(e => e.member === member);
    if (idx >= 0) {
      this.entries[idx].score += score;
    } else {
      this.entries.push({ member, score });
    }
    this.entries.sort((a, b) => b.score - a.score);
  }

  getTop(n) {
    return this.entries.slice(0, n).map((e, i) => ({
      rank: i + 1,
      ...e
    }));
  }

  getRank(member) {
    const idx = this.entries.findIndex(e => e.member === member);
    return idx >= 0 ? { rank: idx + 1, score: this.entries[idx].score } : null;
  }

  getAroundMe(member, range = 2) {
    const idx = this.entries.findIndex(e => e.member === member);
    if (idx === -1) return [];
    const start = Math.max(0, idx - range);
    const end = Math.min(this.entries.length, idx + range + 1);
    return this.entries.slice(start, end).map((e, i) => ({
      rank: start + i + 1,
      ...e,
      isMe: e.member === member
    }));
  }
}

// === Pipeline Simulation (Batching) ===
class RedisPipeline {
  constructor() {
    this.commands = [];
    this.store = new Map();
  }

  set(key, value) {
    this.commands.push({ op: 'SET', key, value });
    return this;
  }

  get(key) {
    this.commands.push({ op: 'GET', key });
    return this;
  }

  incr(key) {
    this.commands.push({ op: 'INCR', key });
    return this;
  }

  exec() {
    console.log(\`\\n[Pipeline] Executing \${this.commands.length} commands in batch:\`);
    const results = [];
    for (const cmd of this.commands) {
      switch (cmd.op) {
        case 'SET':
          this.store.set(cmd.key, cmd.value);
          results.push('OK');
          break;
        case 'GET':
          results.push(this.store.get(cmd.key) || null);
          break;
        case 'INCR':
          const val = (parseInt(this.store.get(cmd.key)) || 0) + 1;
          this.store.set(cmd.key, String(val));
          results.push(val);
          break;
      }
      console.log(\`  \${cmd.op} \${cmd.key} => \${results[results.length - 1]}\`);
    }
    this.commands = [];
    return results;
  }
}

// === Demo ===
console.log('=== Rate Limiter Demo ===');
const limiter = new SlidingWindowRateLimiter(1000, 3); // 3 req/sec
for (let i = 0; i < 5; i++) {
  limiter.isAllowed('user:alice');
}

console.log('\\n=== Leaderboard Demo ===');
const lb = new Leaderboard('weekly');
lb.addScore('alice', 2500);
lb.addScore('bob', 1800);
lb.addScore('charlie', 3200);
lb.addScore('dave', 2100);
lb.addScore('eve', 2900);
lb.addScore('alice', 300); // Alice scores more

console.log('Top 3:', lb.getTop(3));
console.log('Alice rank:', lb.getRank('alice'));
console.log('Around Dave:', lb.getAroundMe('dave'));

console.log('\\n=== Pipeline Demo ===');
const pipe = new RedisPipeline();
pipe.set('a', '1')
    .set('b', '2')
    .incr('a')
    .incr('a')
    .get('a')
    .get('b')
    .exec();`,
    content: `
<h1>Redis Scaling & Production</h1>
<p>Running Redis at scale requires deep understanding of memory management, batching strategies, atomic operations, and common production patterns. This topic covers everything an SDE3 needs to know for building and operating Redis-backed systems in production.</p>

<h2>Memory Management & Eviction Policies</h2>
<p>When Redis reaches maxmemory, it must evict keys according to the configured policy. Choosing the wrong policy can cause data loss or cache thrashing.</p>

<pre><code># Set maximum memory
maxmemory 4gb

# Eviction policies
maxmemory-policy allkeys-lru     # Evict any key using LRU approximation
# Other options:
# volatile-lru    — LRU among keys with TTL only
# allkeys-lfu     — LFU (Least Frequently Used) — Redis 4+
# volatile-lfu    — LFU among keys with TTL only
# allkeys-random  — Random eviction
# volatile-random — Random among keys with TTL
# volatile-ttl    — Evict keys with nearest TTL first
# noeviction      — Return errors on write when memory full</code></pre>

<table>
  <tr><th>Policy</th><th>Scope</th><th>Algorithm</th><th>Best For</th></tr>
  <tr><td>allkeys-lru</td><td>All keys</td><td>Approx. LRU</td><td>General caching (most common)</td></tr>
  <tr><td>allkeys-lfu</td><td>All keys</td><td>Approx. LFU</td><td>Caching with frequency-based popularity</td></tr>
  <tr><td>volatile-lru</td><td>Keys with TTL</td><td>Approx. LRU</td><td>Mix of cache + persistent data</td></tr>
  <tr><td>volatile-ttl</td><td>Keys with TTL</td><td>Nearest TTL</td><td>Short-lived data should go first</td></tr>
  <tr><td>noeviction</td><td>N/A</td><td>N/A</td><td>Data store (not cache) — errors on OOM</td></tr>
</table>

<h3>LRU vs LFU</h3>
<pre><code>// LRU (Least Recently Used):
// Evicts keys not accessed recently
// Problem: A key accessed once after a long time is "safe" from eviction
// even if it was only accessed once (scan pollution)

// LFU (Least Frequently Used) — Redis 4+:
// Tracks access frequency using a Morris counter (logarithmic counter)
// Evicts keys accessed least often
// Better for caching: a rarely-accessed key won't survive just because
// it was touched once recently

// Tune LFU:
// lfu-log-factor 10     — higher = slower frequency counter growth
// lfu-decay-time 1      — minutes before frequency counter is halved

// Check key access frequency:
// OBJECT FREQ mykey     — returns LFU frequency counter value</code></pre>

<div class="warning-note">Redis LRU is approximate — it samples maxmemory-samples keys (default 5) and evicts the least recently used among the sample. Increase to 10 for better accuracy at a small CPU cost. LFU sampling works the same way.</div>

<h2>Pipeline and MULTI/EXEC</h2>

<h3>Pipelining (Batching Network Round-Trips)</h3>
<p>Without pipelining, each command requires a network round-trip (~0.1-1ms). Pipelining sends multiple commands in one TCP packet and reads all responses at once.</p>

<pre><code>// Node.js — ioredis pipeline
const pipeline = redis.pipeline();

// Queue 1000 commands — sent in one batch
for (let i = 0; i < 1000; i++) {
  pipeline.set(\`key:\${i}\`, \`value:\${i}\`);
  pipeline.expire(\`key:\${i}\`, 3600);
}

// Execute all at once — single round-trip
const results = await pipeline.exec();
// results = [[null, 'OK'], [null, 1], [null, 'OK'], [null, 1], ...]
// Each result: [error, value]

console.log(\`Executed \${results.length} commands in 1 round-trip\`);

// Without pipeline: 1000 commands × 0.5ms RTT = 500ms
// With pipeline: 1000 commands in ~2-5ms total</code></pre>

<h3>MULTI/EXEC (Transactions)</h3>
<p>MULTI/EXEC provides atomic execution — all commands in the transaction execute without interruption from other clients. But it does NOT provide rollback on individual command failure.</p>

<pre><code>// Node.js — atomic transfer
async function transfer(from, to, amount) {
  const multi = redis.multi();

  multi.decrby(\`balance:\${from}\`, amount);
  multi.incrby(\`balance:\${to}\`, amount);
  multi.rpush('audit:log', JSON.stringify({
    from, to, amount, timestamp: Date.now()
  }));

  const results = await multi.exec();
  // All 3 commands execute atomically
  // results = [[null, newBalFrom], [null, newBalTo], [null, logLen]]

  // Check for errors
  for (const [err, result] of results) {
    if (err) throw new Error(\`Transaction failed: \${err}\`);
  }
}

// WATCH for optimistic locking (CAS)
async function safeTransfer(from, to, amount) {
  while (true) {
    await redis.watch(\`balance:\${from}\`);
    const balance = parseInt(await redis.get(\`balance:\${from}\`));

    if (balance < amount) {
      await redis.unwatch();
      throw new Error('Insufficient funds');
    }

    const result = await redis.multi()
      .decrby(\`balance:\${from}\`, amount)
      .incrby(\`balance:\${to}\`, amount)
      .exec();

    if (result) return result;  // Success
    // result === null means WATCH detected a change — retry
    console.log('Conflict detected, retrying...');
  }
}</code></pre>

<table>
  <tr><th>Feature</th><th>Pipeline</th><th>MULTI/EXEC</th></tr>
  <tr><td>Purpose</td><td>Reduce network round-trips</td><td>Atomic execution</td></tr>
  <tr><td>Isolation</td><td>No — other commands can interleave</td><td>Yes — no interleaving</td></tr>
  <tr><td>Atomicity</td><td>No</td><td>Yes (all-or-nothing execution)</td></tr>
  <tr><td>Rollback</td><td>N/A</td><td>No rollback — partial failures possible</td></tr>
  <tr><td>Performance</td><td>Reduces latency</td><td>Adds slight overhead (queuing)</td></tr>
  <tr><td>Can combine</td><td colspan="2">Yes — pipeline + MULTI/EXEC for batched atomic operations</td></tr>
</table>

<h2>Lua Scripting</h2>
<p>Lua scripts execute atomically on the Redis server — no other command can run while a Lua script is executing. This makes them perfect for complex atomic operations that MULTI/EXEC cannot express.</p>

<pre><code>// Lua script: atomic rate limiter
const rateLimitScript = \`
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  -- Remove expired entries
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

  -- Count current entries
  local count = redis.call('ZCARD', key)

  if count < limit then
    -- Add this request
    redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1  -- allowed
  else
    return 0  -- denied
  end
\`;

// Use EVALSHA for cached scripts (avoids resending script text)
const sha = await redis.script('LOAD', rateLimitScript);

async function isAllowed(userId, limit, windowMs) {
  const key = \`ratelimit:\${userId}\`;
  const now = Date.now();
  return await redis.evalsha(sha, 1, key, limit, windowMs, now);
}

// Token bucket via Lua
const tokenBucketScript = \`
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])

  local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local tokens = tonumber(bucket[1]) or capacity
  local lastRefill = tonumber(bucket[2]) or now

  -- Refill tokens based on elapsed time
  local elapsed = (now - lastRefill) / 1000
  tokens = math.min(capacity, tokens + elapsed * refillRate)

  if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
    redis.call('EXPIRE', key, math.ceil(capacity / refillRate) + 1)
    return 1
  else
    redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
    return 0
  end
\`;</code></pre>

<div class="warning-note">Lua scripts block the entire Redis server for their duration. Keep scripts short and avoid unbounded loops. If a script runs longer than lua-time-limit (default 5s), Redis starts rejecting other commands with BUSY errors. Use SCRIPT KILL to terminate a runaway script (only if no writes were made).</div>

<h2>Distributed Locking (Redlock Algorithm)</h2>
<p>Redis is commonly used for distributed locks. The Redlock algorithm, proposed by Redis's creator, uses multiple independent Redis instances for safety.</p>

<pre><code>// Simple distributed lock (single Redis)
async function acquireLock(lockKey, lockValue, ttlMs) {
  // SET NX (only if not exists) + EX (TTL for safety)
  const result = await redis.set(lockKey, lockValue, 'NX', 'PX', ttlMs);
  return result === 'OK';
}

// Release lock — ONLY if we still own it (Lua for atomicity)
const releaseLockScript = \`
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  else
    return 0
  end
\`;

async function releaseLock(lockKey, lockValue) {
  return await redis.eval(releaseLockScript, 1, lockKey, lockValue);
}

// Usage
const lockValue = crypto.randomUUID(); // Unique per acquisition
const acquired = await acquireLock('lock:order:1234', lockValue, 30000);

if (acquired) {
  try {
    await processOrder('1234');
  } finally {
    await releaseLock('lock:order:1234', lockValue);
  }
}</code></pre>

<h3>Redlock Algorithm (Multi-Instance)</h3>
<pre><code>// Redlock uses N independent Redis instances (typically 5)
//
// 1. Get current time T1
// 2. Try to acquire lock on ALL N instances with same key + value + TTL
// 3. Lock is acquired if:
//    a. Majority (N/2 + 1) instances granted the lock
//    b. Total acquisition time (T2 - T1) < lock TTL
// 4. Effective lock time = TTL - (T2 - T1) - clock drift
// 5. If lock fails, release on ALL instances

// Using redlock npm package
const Redlock = require('redlock');

const redlock = new Redlock(
  [redis1, redis2, redis3, redis4, redis5], // 5 independent instances
  {
    driftFactor: 0.01,     // Clock drift compensation
    retryCount: 3,
    retryDelay: 200,       // ms between retries
    retryJitter: 200       // Random jitter
  }
);

// Acquire and auto-extend
const lock = await redlock.acquire(['lock:resource:1'], 30000);
try {
  await doWork();
} finally {
  await lock.release();
}</code></pre>

<div class="warning-note">Redlock is controversial. Martin Kleppmann argued it is unsafe under network delays and process pauses (a GC pause can cause a lock to expire while the holder still thinks it holds it). Use fencing tokens for safety-critical operations: include a monotonically increasing token with each lock acquisition and have the protected resource reject operations with stale tokens.</div>

<h2>Rate Limiting Patterns</h2>

<pre><code>// 1. Fixed Window (simplest)
async function fixedWindowRateLimit(userId, limit, windowSec) {
  const key = \`rl:\${userId}:\${Math.floor(Date.now() / 1000 / windowSec)}\`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  return count <= limit;
}

// 2. Sliding Window Log (most accurate, uses sorted set)
async function slidingWindowLog(userId, limit, windowMs) {
  const key = \`rl:\${userId}\`;
  const now = Date.now();
  const pipe = redis.pipeline();

  pipe.zremrangebyscore(key, 0, now - windowMs);
  pipe.zadd(key, now, \`\${now}-\${Math.random()}\`);
  pipe.zcard(key);
  pipe.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipe.exec();
  const count = results[2][1];
  return count <= limit;
}

// 3. Token Bucket (allows bursts)
// See Lua script above — handles refill + consumption atomically

// 4. Sliding Window Counter (hybrid, memory efficient)
async function slidingWindowCounter(userId, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / windowSec);
  const previousWindow = currentWindow - 1;
  const elapsed = (now % windowSec) / windowSec; // 0.0 to 1.0

  const [currentCount, previousCount] = await redis.mget(
    \`rl:\${userId}:\${currentWindow}\`,
    \`rl:\${userId}:\${previousWindow}\`
  );

  // Weighted sum: previous window contributes proportionally
  const estimate = (parseInt(previousCount) || 0) * (1 - elapsed)
                 + (parseInt(currentCount) || 0);

  if (estimate >= limit) return false;

  const key = \`rl:\${userId}:\${currentWindow}\`;
  await redis.incr(key);
  await redis.expire(key, windowSec * 2);
  return true;
}</code></pre>

<h2>Leaderboard Implementation</h2>
<pre><code>// Full-featured leaderboard using Sorted Sets
class RedisLeaderboard {
  constructor(redis, name) {
    this.redis = redis;
    this.key = \`lb:\${name}\`;
  }

  async addScore(userId, points) {
    return this.redis.zincrby(this.key, points, userId);
  }

  async getTop(n = 10) {
    const raw = await this.redis.zrevrange(this.key, 0, n - 1, 'WITHSCORES');
    return this.parseResults(raw, 1);
  }

  async getRank(userId) {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(this.key, userId),
      this.redis.zscore(this.key, userId)
    ]);
    return rank !== null ? { rank: rank + 1, score: parseFloat(score) } : null;
  }

  // "Around me" view — show nearby players
  async getAroundMe(userId, range = 5) {
    const rank = await this.redis.zrevrank(this.key, userId);
    if (rank === null) return [];
    const start = Math.max(0, rank - range);
    const end = rank + range;
    const raw = await this.redis.zrevrange(this.key, start, end, 'WITHSCORES');
    return this.parseResults(raw, start + 1);
  }

  // Percentile rank
  async getPercentile(userId) {
    const [rank, total] = await Promise.all([
      this.redis.zrevrank(this.key, userId),
      this.redis.zcard(this.key)
    ]);
    if (rank === null) return null;
    return ((total - rank) / total * 100).toFixed(1);
  }

  parseResults(raw, startRank) {
    const results = [];
    for (let i = 0; i < raw.length; i += 2) {
      results.push({
        rank: startRank + i / 2,
        userId: raw[i],
        score: parseFloat(raw[i + 1])
      });
    }
    return results;
  }
}</code></pre>

<h2>Session Management</h2>
<pre><code>// Production session store with Redis
const session = require('express-session');
const RedisStore = require('connect-redis').default;

const sessionStore = new RedisStore({
  client: redis,
  prefix: 'sess:',
  ttl: 86400,           // 24 hours
  disableTouch: false,   // Update TTL on access
  serializer: {
    stringify: JSON.stringify,
    parse: JSON.parse
  }
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 86400000 }
}));

// Manual session management (without express-session)
class SessionManager {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.prefix = options.prefix || 'session:';
    this.ttl = options.ttl || 3600;
  }

  async create(userId, metadata = {}) {
    const sessionId = crypto.randomUUID();
    const key = \`\${this.prefix}\${sessionId}\`;

    await this.redis.hmset(key, {
      userId,
      createdAt: Date.now().toString(),
      ...metadata
    });
    await this.redis.expire(key, this.ttl);

    // Track active sessions per user
    await this.redis.sadd(\`user_sessions:\${userId}\`, sessionId);

    return sessionId;
  }

  async get(sessionId) {
    const key = \`\${this.prefix}\${sessionId}\`;
    const data = await this.redis.hgetall(key);
    if (Object.keys(data).length === 0) return null;

    // Touch — refresh TTL on access
    await this.redis.expire(key, this.ttl);
    return data;
  }

  async destroy(sessionId) {
    const key = \`\${this.prefix}\${sessionId}\`;
    const data = await this.redis.hgetall(key);
    if (data.userId) {
      await this.redis.srem(\`user_sessions:\${data.userId}\`, sessionId);
    }
    await this.redis.del(key);
  }

  async destroyAllForUser(userId) {
    const sessions = await this.redis.smembers(\`user_sessions:\${userId}\`);
    if (sessions.length > 0) {
      const keys = sessions.map(s => \`\${this.prefix}\${s}\`);
      await this.redis.del(...keys);
      await this.redis.del(\`user_sessions:\${userId}\`);
    }
  }
}</code></pre>

<h2>Production Monitoring & Troubleshooting</h2>

<h3>Key Metrics</h3>
<pre><code># Essential INFO sections
127.0.0.1:6379> INFO memory
used_memory_human: 2.5G
used_memory_rss_human: 3.1G
mem_fragmentation_ratio: 1.24
maxmemory_human: 4G
maxmemory_policy: allkeys-lfu

127.0.0.1:6379> INFO stats
total_connections_received: 1000000
total_commands_processed: 50000000
instantaneous_ops_per_sec: 25000
keyspace_hits: 45000000
keyspace_misses: 5000000
# Hit ratio: 90% — good!

127.0.0.1:6379> INFO clients
connected_clients: 150
blocked_clients: 3
# Alert if connected_clients is unexpectedly high

# Slow log — commands exceeding threshold
127.0.0.1:6379> SLOWLOG GET 10
# Default threshold: 10ms (slowlog-log-slower-than 10000 microseconds)

# Big key scan
redis-cli --bigkeys
# Samples keys and reports largest per type

# Memory usage of specific key
127.0.0.1:6379> MEMORY USAGE user:1000
(integer) 256  # bytes

# Latency monitoring
127.0.0.1:6379> LATENCY LATEST
127.0.0.1:6379> LATENCY HISTORY command</code></pre>

<h3>Common Production Issues</h3>
<table>
  <tr><th>Issue</th><th>Symptom</th><th>Resolution</th></tr>
  <tr><td>Memory fragmentation</td><td>RSS >> used_memory, frag ratio > 1.5</td><td>Enable active defrag, or restart</td></tr>
  <tr><td>Big keys</td><td>Slow deletes, BGSAVE slow, cluster migration timeout</td><td>UNLINK (async delete), split into smaller keys</td></tr>
  <tr><td>Hot keys</td><td>One shard/node overloaded</td><td>Local cache, key replication, read replicas</td></tr>
  <tr><td>Connection storm</td><td>connected_clients spikes, OOM</td><td>Connection pooling, maxclients limit</td></tr>
  <tr><td>Slow BGSAVE</td><td>Latency spikes, COW memory</td><td>BGSAVE on replica, reserve memory headroom</td></tr>
  <tr><td>KEYS * in production</td><td>Complete blockage for seconds</td><td>Use SCAN, rename-command KEYS ""</td></tr>
</table>

<pre><code># Rename dangerous commands in production
rename-command KEYS ""
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG "INTERNAL_CONFIG_a8f3"  # Obfuscate rather than disable</code></pre>

<h2>Memory Optimization Techniques</h2>
<pre><code>// 1. Use Hashes for small objects (ziplist encoding)
// Instead of: SET user:1:name "Alice", SET user:1:email "a@b.com"
// Use: HSET user:1 name "Alice" email "a@b.com"
// Saves ~50% memory for small objects

// 2. Hash bucketing (Instagram trick)
// Instead of 10M keys: SET user:1 "data" ... SET user:10000000 "data"
// Use 100K hashes with 100 entries each:
// HSET users:0 1 "data", HSET users:0 2 "data" ... HSET users:0 100 "data"
// HSET users:1 101 "data" ...
// Each hash stays under ziplist threshold — massive memory savings

function getUserBucket(userId) {
  const bucketId = Math.floor(userId / 100);
  const field = userId % 100;
  return { key: \`users:\${bucketId}\`, field: String(field) };
}

// 3. Short key names in high-volume scenarios
// "user:session:token:" → "u:s:t:"
// Saves 15 bytes per key × 10M keys = 150MB

// 4. Use MessagePack instead of JSON for serialization
// JSON: {"name":"Alice","age":30} = 27 bytes
// MessagePack: same data = 18 bytes (33% smaller)

// 5. Compress large values
const zlib = require('zlib');
async function setCompressed(key, data, ttl) {
  const json = JSON.stringify(data);
  if (json.length > 1024) { // Only compress if > 1KB
    const compressed = zlib.gzipSync(json);
    await redis.setex(key, ttl, compressed);
  } else {
    await redis.setex(key, ttl, json);
  }
}</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You discover Redis memory usage is 4GB but RSS is 8GB. What is happening and how do you fix it?</div>
  <div class="qa-a">The mem_fragmentation_ratio is 2.0, indicating severe memory fragmentation. This happens when Redis frequently allocates and frees memory blocks of varying sizes — the allocator (jemalloc) ends up with many small gaps that cannot be reused. Immediate fix: enable active defragmentation (activedefrag yes) with appropriate thresholds and CPU limits. If fragmentation is extreme, schedule a failover to a replica and restart the master (which reallocates memory compactly). Long-term: investigate access patterns causing fragmentation — often it is caused by updating string values with different sizes, or rapidly creating/deleting many small keys. Using fixed-size values and hash bucketing can reduce fragmentation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the Redlock algorithm and its controversy. When would you use it vs a simple Redis lock?</div>
  <div class="qa-a">Simple Redis lock (SET NX EX on a single instance) works when Redis is your only lock coordinator and you can tolerate rare failures (e.g., Redis crashes between lock acquisition and processing). Redlock uses N independent Redis instances (recommended 5) and requires majority agreement, providing safety even if up to N/2-1 instances fail. The controversy: Martin Kleppmann argued that Redlock is unsafe because (1) a GC pause can cause a process to believe it holds a lock after it has expired; (2) clock skew across Redis instances can invalidate the algorithm's timing assumptions. Antirez (Redis creator) countered that these are general distributed systems issues, not Redlock-specific. In practice: for efficiency locks (avoiding duplicate work), simple Redis lock is fine. For correctness locks (preventing data corruption), use Redlock with fencing tokens, or use a consensus system like ZooKeeper/etcd.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a distributed rate limiter that works across multiple application instances?</div>
  <div class="qa-a">Use Redis as the centralized state store with a Lua script for atomicity. The sliding window log approach (Sorted Set) is most accurate: ZADD the timestamp, ZREMRANGEBYSCORE to remove expired entries, and ZCARD to count — all in one Lua script for atomicity. For higher performance at scale: (1) Use the sliding window counter approach (two fixed windows with weighted interpolation) — uses only INCR operations, much less memory than sorted sets; (2) For very high throughput, use a local token bucket with periodic Redis sync — each instance maintains a local counter and periodically syncs with Redis to share quota; (3) Consider using Redis Cluster with hash tags to keep all rate limit keys for one user on the same node for Lua script execution.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between DEL and UNLINK? When does it matter?</div>
  <div class="qa-a">DEL is synchronous — it frees the memory immediately, blocking the main thread. For large data structures (a Set with 1M members, a List with 500K elements), DEL can block Redis for hundreds of milliseconds, causing timeouts for all other clients. UNLINK (Redis 4.0+) is asynchronous — it removes the key from the keyspace immediately (O(1)) but delegates the actual memory reclamation to a background thread. UNLINK matters when: (1) deleting large collections (>10K elements); (2) using FLUSHDB/FLUSHALL — use FLUSHDB ASYNC instead; (3) deleting keys during peak traffic. Also set lazyfree-lazy-eviction yes and lazyfree-lazy-expire yes so that evictions and TTL expirations also use async deletion.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a real-time leaderboard for a game with 50 million players. How do you handle reads and writes at scale?</div>
  <div class="qa-a">Architecture: (1) Use Redis Sorted Set as the primary leaderboard store — ZINCRBY for score updates (O(log N)), ZREVRANK for rank queries (O(log N)); (2) With 50M members, a single sorted set uses ~4GB memory — fits in one Redis instance but creates a hot key. Solution: shard the leaderboard by score ranges or use Redis Cluster; (3) For the "top 100" query (most frequent), cache it in-process with 1-second TTL — ZREVRANGE 0 99 is O(log N + 100) and can be called thousands of times per second; (4) For "my rank" queries, ZREVRANK is O(log N) — fast enough for most loads; (5) For "around me" queries, combine ZREVRANK + ZREVRANGE for the surrounding window; (6) Write scaling: batch score updates using Redis pipeline; (7) For read scaling, use read replicas with scaleReads: 'slave' in ioredis; (8) Reset strategy: for weekly leaderboards, create lb:week:2024-03 and swap atomically with RENAME.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do Lua scripts work in Redis Cluster? What are the constraints?</div>
  <div class="qa-a">Lua scripts in Redis Cluster must declare all keys they access via the KEYS array, and all keys must hash to the same slot. This is because the script executes on a single node — it cannot access keys on other nodes. Use hash tags to ensure co-location: e.g., EVAL script 2 {user:1}:balance {user:1}:history. If your script accesses undeclared keys, it may work on a single instance but fail unpredictably in Cluster mode. For cross-slot operations, you must split the logic into multiple scripts or use application-level orchestration. Also, EVALSHA is preferred over EVAL in production — it sends only the script's SHA1 hash instead of the full script text, reducing network bandwidth. Load scripts once with SCRIPT LOAD and use EVALSHA thereafter.</div>
</div>
`
  }
];