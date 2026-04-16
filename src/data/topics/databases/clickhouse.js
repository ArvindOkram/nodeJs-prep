export const clickhouse = [
  {
    id: 'ch-architecture',
    title: 'ClickHouse Architecture',
    category: 'ClickHouse',
    starterCode: `// Simulating ClickHouse Column-Oriented Storage vs Row-Oriented
// ============================================================

class RowStore {
  constructor() { this.rows = []; }
  insert(row) { this.rows.push(row); }
  // Row store reads ALL columns for every row
  sumColumn(colName) {
    let reads = 0;
    let sum = 0;
    for (const row of this.rows) {
      // Each row access touches ALL columns (cache unfriendly)
      reads += Object.keys(row).length;
      sum += row[colName];
    }
    return { sum, totalFieldsRead: reads };
  }
}

class ColumnStore {
  constructor() { this.columns = {}; }
  insert(row) {
    for (const [k, v] of Object.entries(row)) {
      if (!this.columns[k]) this.columns[k] = [];
      this.columns[k].push(v);
    }
  }
  // Column store reads ONLY the needed column
  sumColumn(colName) {
    const col = this.columns[colName] || [];
    let reads = col.length; // Only read target column
    const sum = col.reduce((a, b) => a + b, 0);
    return { sum, totalFieldsRead: reads };
  }
}

// Insert 1M-like simulation (1000 rows, 10 columns each)
const rowStore = new RowStore();
const colStore = new ColumnStore();

for (let i = 0; i < 1000; i++) {
  const row = {
    timestamp: Date.now(), user_id: i, event: 1,
    duration: Math.random() * 100 | 0, bytes: Math.random() * 10000 | 0,
    status: 200, region: 1, device: 2, version: 3, flag: i % 2
  };
  rowStore.insert(row);
  colStore.insert(row);
}

console.log('=== SUM(duration) over 1000 rows x 10 columns ===');
const rowResult = rowStore.sumColumn('duration');
const colResult = colStore.sumColumn('duration');
console.log('Row Store:', rowResult);
console.log('Column Store:', colResult);
console.log('Row store read ' + rowResult.totalFieldsRead + ' fields');
console.log('Column store read ' + colResult.totalFieldsRead + ' fields');
console.log('Column store reads ' + (rowResult.totalFieldsRead / colResult.totalFieldsRead).toFixed(0) + 'x fewer fields!');

// Simulate Sparse Index (granule-based)
console.log('\\n=== Sparse Index Simulation ===');
class SparseIndex {
  constructor(granuleSize) {
    this.granuleSize = granuleSize;
    this.data = [];
    this.index = []; // stores first key of each granule
  }
  bulkInsert(sortedRows) {
    this.data = sortedRows;
    for (let i = 0; i < sortedRows.length; i += this.granuleSize) {
      this.index.push({ key: sortedRows[i].key, offset: i });
    }
  }
  search(key) {
    // Binary search on sparse index to find granule
    let lo = 0, hi = this.index.length - 1, granuleIdx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.index[mid].key <= key) { granuleIdx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    const start = this.index[granuleIdx].offset;
    const end = Math.min(start + this.granuleSize, this.data.length);
    let scanned = 0;
    for (let i = start; i < end; i++) {
      scanned++;
      if (this.data[i].key === key) return { found: true, scanned, totalRows: this.data.length };
    }
    return { found: false, scanned, totalRows: this.data.length };
  }
}
const sparse = new SparseIndex(8192);
const rows = Array.from({ length: 100000 }, (_, i) => ({ key: i, val: 'data' }));
sparse.bulkInsert(rows);
console.log('Index entries:', sparse.index.length, '(vs', rows.length, 'rows)');
console.log('Search for key 55555:', sparse.search(55555));
console.log('Only scanned one granule instead of full table!');`,
    content: `
<h1>ClickHouse Architecture</h1>
<p>ClickHouse is an <strong>open-source, column-oriented OLAP database</strong> created at Yandex. It is designed for sub-second analytical queries over billions of rows. Understanding its architecture is critical for SDE3 interviews because it explains <em>why</em> ClickHouse achieves 100-1000x speedups over row-oriented databases for analytical workloads.</p>

<h2>Column-Oriented vs Row-Oriented Storage</h2>
<p>This is the single most important architectural decision in ClickHouse. In a row-oriented database (PostgreSQL, MySQL), an entire row is stored contiguously on disk. In a column-oriented database, each column is stored separately.</p>

<table>
  <tr><th>Aspect</th><th>Row-Oriented (PostgreSQL)</th><th>Column-Oriented (ClickHouse)</th></tr>
  <tr><td>Storage layout</td><td>Row1[col1,col2,...colN], Row2[...]</td><td>Col1[row1,row2,...rowN], Col2[...]</td></tr>
  <tr><td>Read SELECT *</td><td>Fast (sequential read of full rows)</td><td>Slow (must reassemble from all columns)</td></tr>
  <tr><td>Read SELECT col1, col2</td><td>Slow (reads ALL columns per row)</td><td>Fast (reads only 2 column files)</td></tr>
  <tr><td>Compression</td><td>Poor (mixed data types per block)</td><td>Excellent (same type = high compression)</td></tr>
  <tr><td>INSERT single row</td><td>Fast (append one block)</td><td>Slower (update N column files)</td></tr>
  <tr><td>Batch INSERT</td><td>Moderate</td><td>Very fast (bulk append per column)</td></tr>
  <tr><td>UPDATE/DELETE</td><td>Fast (in-place)</td><td>Very expensive (rewrite column files)</td></tr>
  <tr><td>Typical use</td><td>OLTP</td><td>OLAP / Analytics</td></tr>
</table>

<h3>Why Column Storage Is Faster for Analytics</h3>
<pre><code>-- Typical analytics query: aggregate one column across billions of rows
SELECT avg(duration) FROM events WHERE date = '2024-01-15';

-- Row store: reads ALL columns for every matching row (waste!)
-- Disk reads: date + user_id + event_type + duration + url + ip + ... (all cols)

-- Column store: reads ONLY date column (for filter) + duration column (for avg)
-- Disk reads: date + duration (just 2 cols out of maybe 50)</code></pre>
<p>With 50 columns, the column store reads <strong>~25x less data</strong> from disk. Combined with better compression (same-type data compresses 5-10x better), the effective speedup can be 100x+.</p>

<h2>MergeTree Engine Family</h2>
<p>The MergeTree family is the core storage engine of ClickHouse. Every production ClickHouse table uses some variant of MergeTree. The name comes from the LSM-tree-like merge process.</p>

<h3>How MergeTree Works</h3>
<pre><code>INSERT INTO events VALUES (...)
  │
  ▼
New "part" created on disk (immutable directory with column files)
  │
  ▼
Background merge process combines small parts into larger parts
(like LSM-tree compaction)
  │
  ▼
Merged part replaces source parts atomically</code></pre>

<h3>MergeTree Variants</h3>
<table>
  <tr><th>Engine</th><th>Purpose</th><th>Merge Behavior</th></tr>
  <tr><td><strong>MergeTree</strong></td><td>Base engine</td><td>Simply merges parts, no dedup/aggregation</td></tr>
  <tr><td><strong>ReplacingMergeTree</strong></td><td>Deduplication</td><td>Keeps latest row per ORDER BY key (eventual, not guaranteed)</td></tr>
  <tr><td><strong>SummingMergeTree</strong></td><td>Pre-aggregation</td><td>Sums numeric columns for rows with same ORDER BY key</td></tr>
  <tr><td><strong>AggregatingMergeTree</strong></td><td>Complex aggregation</td><td>Merges AggregateFunction states (used with materialized views)</td></tr>
  <tr><td><strong>CollapsingMergeTree</strong></td><td>Mutable rows</td><td>Uses Sign column (+1/-1) to cancel/replace rows</td></tr>
  <tr><td><strong>VersionedCollapsingMergeTree</strong></td><td>Concurrent mutable rows</td><td>Like Collapsing but supports out-of-order inserts via Version column</td></tr>
</table>

<h3>ReplacingMergeTree Deep Dive</h3>
<pre><code>CREATE TABLE user_profiles (
    user_id UInt64,
    name String,
    email String,
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id;

-- Insert initial row
INSERT INTO user_profiles VALUES (1, 'Alice', 'alice@old.com', '2024-01-01 00:00:00');
-- Insert updated row
INSERT INTO user_profiles VALUES (1, 'Alice', 'alice@new.com', '2024-01-02 00:00:00');

-- IMPORTANT: Before merge, BOTH rows exist!
SELECT * FROM user_profiles;
-- Returns 2 rows!

-- Use FINAL to force dedup at query time (slower)
SELECT * FROM user_profiles FINAL;
-- Returns 1 row (latest updated_at)

-- Or wait for background merge (non-deterministic timing)
OPTIMIZE TABLE user_profiles FINAL; -- force merge (expensive, don't do in production)</code></pre>

<div class="warning-note">ReplacingMergeTree does NOT guarantee deduplication at query time. You must use FINAL keyword or design queries with GROUP BY + argMax() to get correct results. This is one of the most common ClickHouse pitfalls.</div>

<h3>CollapsingMergeTree for Mutable Data</h3>
<pre><code>CREATE TABLE sessions (
    user_id UInt64,
    duration UInt32,
    sign Int8  -- +1 = insert, -1 = cancel
) ENGINE = CollapsingMergeTree(sign)
ORDER BY user_id;

-- Insert a session
INSERT INTO sessions VALUES (1, 100, 1);

-- "Update" the session: cancel old + insert new
INSERT INTO sessions VALUES (1, 100, -1), (1, 150, 1);

-- After merge: old rows cancel out, only (1, 150, 1) remains
-- Query pattern (works before merge too):
SELECT user_id, sum(duration * sign) as duration, sum(sign) as active
FROM sessions GROUP BY user_id HAVING active > 0;</code></pre>

<h2>Parts, Partitions, and Granules</h2>
<p>Understanding the physical storage hierarchy is essential for performance tuning.</p>

<pre><code>Table
 └── Partition (by PARTITION BY expression, e.g., toYYYYMM(date))
      ├── Part_1/  (immutable directory)
      │    ├── primary.idx        (sparse index)
      │    ├── column1.bin        (compressed column data)
      │    ├── column1.mrk2       (mark file: offset into .bin for each granule)
      │    ├── column2.bin
      │    ├── column2.mrk2
      │    ├── count.txt          (row count)
      │    └── checksums.txt
      ├── Part_2/
      └── Part_3/ (parts merge in background → fewer, larger parts)</code></pre>

<h3>Granules</h3>
<p>A <strong>granule</strong> is the smallest unit of data that ClickHouse reads. Default size is <code>index_granularity = 8192</code> rows. The sparse index stores the primary key value of the first row in each granule.</p>

<pre><code>-- 1 billion rows, 8192 granule size
-- Sparse index entries: 1,000,000,000 / 8192 ≈ 122,000 entries
-- At ~8 bytes per key, index size ≈ 1 MB (fits in memory!)

-- Compare: B-Tree index on 1B rows ≈ multiple GB</code></pre>

<h2>Primary Key and Sparse Index</h2>
<p>ClickHouse primary key is NOT like a traditional RDBMS primary key. It does NOT enforce uniqueness. It defines the physical sort order of data and creates a sparse index.</p>

<table>
  <tr><th>Aspect</th><th>B-Tree Index (PostgreSQL)</th><th>Sparse Index (ClickHouse)</th></tr>
  <tr><td>Index entry per</td><td>Every row</td><td>Every 8192 rows (granule)</td></tr>
  <tr><td>Index size (1B rows)</td><td>Gigabytes</td><td>~1 MB</td></tr>
  <tr><td>Fits in RAM</td><td>Often not</td><td>Always</td></tr>
  <tr><td>Lookup speed</td><td>O(log N) per row</td><td>O(log N) to find granule, then scan 8192 rows</td></tr>
  <tr><td>Point lookups</td><td>Very fast</td><td>OK (scans up to 8192 rows)</td></tr>
  <tr><td>Range scans</td><td>Good</td><td>Excellent (skip entire granules)</td></tr>
  <tr><td>Write overhead</td><td>High (maintain tree)</td><td>Minimal (append-only)</td></tr>
  <tr><td>Uniqueness</td><td>Enforced</td><td>NOT enforced</td></tr>
</table>

<h3>How Sparse Index Query Execution Works</h3>
<pre><code>-- Table ORDER BY (CounterID, Date)
-- Query: SELECT ... WHERE CounterID = 100 AND Date = '2024-01-15'

-- Step 1: Binary search sparse index for CounterID = 100
--         → Find granule range [4500, 4520]
-- Step 2: Within that range, find Date = '2024-01-15'
--         → Narrow to granules [4507, 4509]
-- Step 3: Read ONLY those 3 granules (3 × 8192 = 24,576 rows)
--         → Instead of scanning 1 billion rows!</code></pre>

<h2>Data Compression</h2>
<p>ClickHouse supports multiple compression codecs that can be combined per column.</p>

<table>
  <tr><th>Codec</th><th>Best For</th><th>Ratio</th><th>Speed</th></tr>
  <tr><td><strong>LZ4</strong> (default)</td><td>General purpose</td><td>Good</td><td>Very fast decompression</td></tr>
  <tr><td><strong>ZSTD</strong></td><td>Higher compression needed</td><td>Excellent</td><td>Slower than LZ4</td></tr>
  <tr><td><strong>Delta</strong></td><td>Monotonically increasing (timestamps, IDs)</td><td>Pre-processor</td><td>Fast</td></tr>
  <tr><td><strong>DoubleDelta</strong></td><td>Slowly changing sequences</td><td>Pre-processor</td><td>Fast</td></tr>
  <tr><td><strong>Gorilla</strong></td><td>Float values (gauges, metrics)</td><td>Pre-processor</td><td>Fast</td></tr>
  <tr><td><strong>T64</strong></td><td>Integer values with limited range</td><td>Pre-processor</td><td>Fast</td></tr>
</table>

<pre><code>-- Combine codecs: pre-processor + general compressor
CREATE TABLE metrics (
    timestamp DateTime CODEC(Delta, ZSTD),
    value Float64 CODEC(Gorilla, LZ4),
    counter_id UInt32 CODEC(T64, ZSTD),
    raw_text String CODEC(ZSTD(3))  -- ZSTD level 3
) ENGINE = MergeTree()
ORDER BY (counter_id, timestamp);</code></pre>

<div class="warning-note">Delta and DoubleDelta codecs require data to be sorted by the column they are applied to. Always ensure your ORDER BY matches codec usage for optimal compression.</div>

<h2>Vectorized Query Execution</h2>
<p>ClickHouse processes data in <strong>blocks (columns of ~65,536 values)</strong> rather than row-by-row. This enables:</p>
<ul>
  <li><strong>SIMD instructions</strong> — process 4-16 values in a single CPU instruction</li>
  <li><strong>CPU cache efficiency</strong> — sequential column data stays in L1/L2 cache</li>
  <li><strong>Branch prediction</strong> — type-homogeneous data = predictable branches</li>
  <li><strong>Loop unrolling</strong> — compiler optimizes tight column-processing loops</li>
</ul>

<pre><code>-- Row-at-a-time (traditional): for each row → evaluate WHERE → project columns → aggregate
-- Vectorized (ClickHouse):
--   1. Read block of 65K values from "status" column
--   2. SIMD compare all 65K values against 200 → bitmap
--   3. Read block of 65K values from "duration" column
--   4. Apply bitmap, SIMD-sum matching values
--   → 10-100x faster than row-at-a-time</code></pre>

<h2>Multi-Master Architecture</h2>
<p>Unlike many distributed databases, ClickHouse follows a <strong>multi-master</strong> model: every node in a cluster can accept both reads AND writes. There is no leader/follower distinction for writes.</p>

<pre><code>Client → Any ClickHouse Node → Writes locally → Replication to other replicas
Client → Any ClickHouse Node → Reads from local data

-- No single point of failure for writes
-- No write amplification through a leader
-- Conflict resolution: last-write-wins via ZooKeeper coordination</code></pre>

<p>ZooKeeper (or ClickHouse Keeper) is used only for <strong>coordination</strong> (replication log, DDL), not for data storage. Actual data replication is peer-to-peer between ClickHouse nodes.</p>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why is ClickHouse so fast for analytical queries compared to PostgreSQL?</div>
  <div class="qa-a">Multiple architectural advantages compound: (1) Column storage means only relevant columns are read from disk, reducing I/O by 10-50x. (2) Same-type column data compresses 5-10x better, further reducing I/O. (3) Vectorized execution processes 65K values at once using SIMD, maximizing CPU throughput. (4) Sparse indexing keeps the entire index in RAM (~1MB for 1B rows). (5) Data is physically sorted by primary key, enabling efficient range scans. (6) No row-level locking or MVCC overhead. Combined, these give 100-1000x speedups for typical OLAP queries.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a partition and a part in ClickHouse?</div>
  <div class="qa-a">A partition is a logical grouping defined by PARTITION BY (e.g., by month). A part is a physical directory on disk containing actual column data files. Each INSERT creates a new part within the appropriate partition. Background merges combine small parts into larger ones within the same partition. Parts never merge across partitions. Partitions enable efficient DROP PARTITION operations and can improve query performance when queries filter by partition key.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose ReplacingMergeTree over CollapsingMergeTree?</div>
  <div class="qa-a">Use ReplacingMergeTree when you need simple last-write-wins deduplication (e.g., CDC from a database where you want the latest state of each row). It is simpler to use but requires FINAL or argMax() in queries. Use CollapsingMergeTree when you need accurate aggregates (like SUM) that account for row updates/deletes — the +1/-1 sign mechanism ensures correct aggregation even before merges complete. CollapsingMergeTree is more complex but gives correct results without FINAL. VersionedCollapsingMergeTree adds support for out-of-order inserts.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does ClickHouse sparse index differ from a B-Tree index, and what are the tradeoffs?</div>
  <div class="qa-a">A B-Tree index has one entry per row, making point lookups O(log N) with direct row access. ClickHouse sparse index has one entry per granule (8192 rows), making the index ~8192x smaller. Point lookups require scanning up to 8192 rows within the target granule, which is slower than B-Tree for single-row lookups but still fast. The major advantage is: the sparse index always fits in RAM (even for billions of rows), writes are essentially free (append-only), and range scans are extremely efficient because data is physically sorted. The tradeoff is that ClickHouse cannot efficiently do random point lookups across many different primary key values.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain how ClickHouse handles concurrent writes to the same table on different replicas.</div>
  <div class="qa-a">Each replica independently accepts writes, creating local parts. ZooKeeper/ClickHouse Keeper maintains a replication log (a sequence of part names). When a replica writes a new part, it registers the part in ZooKeeper. Other replicas see the new entry in the replication log and fetch the part data directly from the source replica (peer-to-peer, not through ZooKeeper). Since parts are immutable and never modified, there are no write conflicts. The merge process is also coordinated: one replica decides which parts to merge (becomes the merge leader for that operation), executes the merge, and other replicas either fetch the result or perform the same merge locally.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if you choose a bad ORDER BY key?</div>
  <div class="qa-a">The ORDER BY (primary key) determines both the physical sort order and the sparse index. A bad key means: (1) The sparse index cannot skip granules for common queries, resulting in full scans instead of index lookups. (2) Compression suffers because similar values are not grouped together. (3) For ReplacingMergeTree/SummingMergeTree, the wrong key means incorrect deduplication or aggregation. The ideal ORDER BY should list columns in order of: most filtered first, lowest cardinality first (for better compression), and must match your most common query patterns. Changing ORDER BY later requires recreating the table and re-inserting all data.</div>
</div>
`
  },
  {
    id: 'ch-data-modeling',
    title: 'ClickHouse Data Modeling',
    category: 'ClickHouse',
    starterCode: `// Simulating ClickHouse Data Modeling Concepts
// =============================================

// 1. Denormalization vs Normalized in Analytics
class NormalizedDB {
  constructor() {
    this.events = [];
    this.users = new Map();
    this.products = new Map();
  }
  query(eventType) {
    let joins = 0;
    const results = [];
    for (const event of this.events) {
      if (event.type === eventType) {
        joins++; // user lookup
        const user = this.users.get(event.userId);
        joins++; // product lookup
        const product = this.products.get(event.productId);
        results.push({ ...event, userName: user?.name, productName: product?.name });
      }
    }
    return { results: results.length, joinLookups: joins };
  }
}

class DenormalizedDB {
  constructor() { this.events = []; }
  query(eventType) {
    let scans = 0;
    const results = [];
    for (const event of this.events) {
      scans++;
      if (event.type === eventType) results.push(event);
    }
    return { results: results.length, joinLookups: 0, scans };
  }
}

// Populate
const norm = new NormalizedDB();
const denorm = new DenormalizedDB();
for (let i = 0; i < 100; i++) {
  norm.users.set(i, { name: 'User' + i });
  norm.products.set(i, { name: 'Product' + i });
}
for (let i = 0; i < 10000; i++) {
  const userId = i % 100, productId = i % 100;
  const type = i % 3 === 0 ? 'purchase' : 'view';
  norm.events.push({ type, userId, productId });
  denorm.events.push({ type, userId, productId, userName: 'User' + userId, productName: 'Product' + productId });
}

console.log('=== Normalized (JOINs needed) ===');
console.log(norm.query('purchase'));
console.log('\\n=== Denormalized (no JOINs) ===');
console.log(denorm.query('purchase'));

// 2. Simulating Materialized View Pre-Aggregation
console.log('\\n=== Materialized View Simulation ===');
class MaterializedAggView {
  constructor() { this.aggregates = new Map(); }
  onInsert(row) {
    const key = row.date + '|' + row.category;
    const agg = this.aggregates.get(key) || { count: 0, totalRevenue: 0 };
    agg.count++;
    agg.totalRevenue += row.revenue;
    this.aggregates.set(key, agg);
  }
  query(date, category) {
    return this.aggregates.get(date + '|' + category);
  }
}

const rawTable = [];
const matView = new MaterializedAggView();
const categories = ['electronics', 'clothing', 'food'];

for (let i = 0; i < 50000; i++) {
  const row = {
    date: '2024-01-' + String((i % 28) + 1).padStart(2, '0'),
    category: categories[i % 3],
    revenue: Math.random() * 100 | 0,
    userId: i % 1000
  };
  rawTable.push(row);
  matView.onInsert(row); // Mat view updates on each insert
}

// Query: sum revenue for electronics on Jan 15
const t1 = performance.now();
let rawSum = 0, rawCount = 0;
for (const r of rawTable) {
  if (r.date === '2024-01-15' && r.category === 'electronics') {
    rawSum += r.revenue; rawCount++;
  }
}
const rawTime = performance.now() - t1;

const t2 = performance.now();
const mvResult = matView.query('2024-01-15', 'electronics');
const mvTime = performance.now() - t2;

console.log('Raw table scan: count=' + rawCount + ', sum=' + rawSum + ', time=' + rawTime.toFixed(3) + 'ms');
console.log('Mat view lookup: count=' + mvResult.count + ', sum=' + mvResult.totalRevenue + ', time=' + mvTime.toFixed(3) + 'ms');
console.log('Mat view is ~' + (rawTime / mvTime).toFixed(0) + 'x faster');

// 3. TTL Simulation
console.log('\\n=== TTL Auto-Expiry Simulation ===');
class TTLTable {
  constructor(ttlMs) { this.data = []; this.ttlMs = ttlMs; }
  insert(row) { this.data.push({ ...row, _insertedAt: Date.now() }); }
  compact() {
    const before = this.data.length;
    const cutoff = Date.now() - this.ttlMs;
    this.data = this.data.filter(r => r._insertedAt > cutoff);
    console.log('TTL compact: ' + before + ' → ' + this.data.length + ' rows (removed ' + (before - this.data.length) + ')');
  }
}
const ttlTable = new TTLTable(50); // 50ms TTL
for (let i = 0; i < 100; i++) ttlTable.insert({ id: i });
setTimeout(() => { ttlTable.compact(); }, 60);`,
    content: `
<h1>ClickHouse Data Modeling</h1>
<p>Data modeling in ClickHouse is fundamentally different from OLTP databases. The decisions you make at table creation time — especially ORDER BY and PARTITION BY — determine query performance for the lifetime of the table. Changing them later requires a full data rewrite. This section covers the critical modeling decisions for production ClickHouse deployments.</p>

<h2>Denormalization for Analytics</h2>
<p>In OLTP databases, we normalize to avoid data anomalies. In ClickHouse (OLAP), we <strong>denormalize aggressively</strong> because:</p>
<ul>
  <li>JOINs are expensive — ClickHouse loads the right-side table into memory</li>
  <li>Column storage makes wide tables cheap — unused columns are not read</li>
  <li>Compression handles repeated values well (e.g., LowCardinality)</li>
  <li>Analytics queries aggregate, not update — no update anomalies</li>
</ul>

<pre><code>-- OLTP (normalized): 3 tables with JOINs
SELECT u.name, p.title, count()
FROM events e
JOIN users u ON e.user_id = u.id
JOIN products p ON e.product_id = p.id
WHERE e.date = '2024-01-15'
GROUP BY u.name, p.title;

-- ClickHouse (denormalized): single wide table, no JOINs
SELECT user_name, product_title, count()
FROM events_denormalized
WHERE date = '2024-01-15'
GROUP BY user_name, product_title;</code></pre>

<div class="warning-note">In ClickHouse, avoid JOINs on large tables whenever possible. The right-side table of a JOIN is loaded entirely into memory by default (hash join). For dimension lookups, use Dictionaries instead of JOINs.</div>

<h2>Choosing the Right MergeTree Engine</h2>
<table>
  <tr><th>Scenario</th><th>Engine</th><th>Reasoning</th></tr>
  <tr><td>Immutable event log</td><td>MergeTree</td><td>No dedup or aggregation needed</td></tr>
  <tr><td>CDC from PostgreSQL (want latest state)</td><td>ReplacingMergeTree</td><td>Keeps latest version per key</td></tr>
  <tr><td>Real-time counters/metrics aggregation</td><td>SummingMergeTree</td><td>Auto-sums numeric columns on merge</td></tr>
  <tr><td>Complex aggregates in materialized views</td><td>AggregatingMergeTree</td><td>Stores intermediate aggregate states</td></tr>
  <tr><td>Mutable state with correct aggregates</td><td>CollapsingMergeTree</td><td>Sign column enables update/delete semantics</td></tr>
  <tr><td>Mutable state + out-of-order inserts</td><td>VersionedCollapsingMergeTree</td><td>Handles concurrent writers</td></tr>
</table>

<h2>Partition Key Selection</h2>
<p>PARTITION BY controls how data is physically split into independent directories. Choose carefully because:</p>
<ul>
  <li>Queries that filter by partition key skip entire partitions (fast pruning)</li>
  <li>DROP PARTITION is instant (deletes a directory)</li>
  <li>Parts never merge across partitions</li>
  <li>Too many partitions = too many parts = slow inserts and high memory usage</li>
</ul>

<pre><code>-- GOOD: Partition by month (reasonable number of partitions)
CREATE TABLE events (
    date Date,
    event_id UInt64,
    user_id UInt64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (user_id, date);

-- BAD: Partition by day with high cardinality → too many partitions
-- PARTITION BY toYYYYMMDD(date)  -- 365 partitions/year, gets out of hand

-- WORSE: Partition by something with high cardinality
-- PARTITION BY user_id  -- millions of partitions = disaster</code></pre>

<div class="warning-note">Rule of thumb: Keep total partition count under 1000. If you partition by month, that is 12 partitions per year — 83 years before you hit 1000. If you partition by day, you hit 1000 in under 3 years. Partition by hour is almost always wrong.</div>

<h2>ORDER BY (Primary Key) Selection</h2>
<p>This is the <strong>single most important decision</strong> when creating a ClickHouse table. ORDER BY determines:</p>
<ol>
  <li>Physical sort order on disk</li>
  <li>Sparse index structure</li>
  <li>Compression efficiency</li>
  <li>For Replacing/Summing/Collapsing: the key for dedup/aggregation</li>
</ol>

<h3>Rules for Choosing ORDER BY</h3>
<pre><code>-- Principle: Columns used in WHERE, in order of:
-- 1. Most frequently filtered
-- 2. Lowest cardinality first (better index skip, better compression)
-- 3. Time column last (for range queries)

-- Example: Analytics platform
-- Common queries filter by: tenant_id (always), event_type (often), timestamp (ranges)
-- Cardinality: tenant_id (~1000) < event_type (~50) < timestamp (infinite)

CREATE TABLE analytics (
    tenant_id UInt32,
    event_type LowCardinality(String),
    timestamp DateTime,
    user_id UInt64,
    properties String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, event_type, timestamp);

-- This ORDER BY means:
-- WHERE tenant_id = 5                         → excellent (first key column)
-- WHERE tenant_id = 5 AND event_type = 'click' → excellent (first two columns)
-- WHERE tenant_id = 5 AND timestamp > now()-1h  → good (skips by tenant, then range scan)
-- WHERE event_type = 'click'                   → mediocre (can't use index, must scan)
-- WHERE user_id = 123                          → terrible (not in ORDER BY at all)</code></pre>

<h2>Materialized Views for Pre-Aggregation</h2>
<p>Materialized views in ClickHouse are <strong>triggers on INSERT</strong> — not stored query results like in PostgreSQL. When data is inserted into the source table, the materialized view's SELECT is applied to the inserted block and the result is inserted into the target table.</p>

<pre><code>-- Source table: raw events (billions of rows)
CREATE TABLE events (
    date Date,
    user_id UInt64,
    event_type String,
    duration UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (event_type, date);

-- Target table for materialized view (pre-aggregated)
CREATE TABLE events_daily_agg (
    date Date,
    event_type String,
    total_count AggregateFunction(count),
    total_duration AggregateFunction(sum, UInt32),
    unique_users AggregateFunction(uniq, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (event_type, date);

-- Materialized view (trigger on INSERT to events)
CREATE MATERIALIZED VIEW events_daily_mv
TO events_daily_agg
AS SELECT
    date,
    event_type,
    countState() as total_count,
    sumState(duration) as total_duration,
    uniqState(user_id) as unique_users
FROM events
GROUP BY date, event_type;

-- Query the aggregated view (reads thousands of rows instead of billions)
SELECT
    date,
    event_type,
    countMerge(total_count) as count,
    sumMerge(total_duration) as total_dur,
    uniqMerge(unique_users) as uv
FROM events_daily_agg
GROUP BY date, event_type;</code></pre>

<div class="warning-note">Materialized views process data at INSERT time, not retroactively. If you create a materialized view on an existing table with data, it will NOT backfill. You must manually INSERT ... SELECT to populate historical data.</div>

<h2>Dictionaries for Dimension Lookups</h2>
<pre><code>-- Instead of JOINing to a users table, create a dictionary
CREATE DICTIONARY user_dict (
    user_id UInt64,
    name String,
    country String,
    segment String
) PRIMARY KEY user_id
SOURCE(CLICKHOUSE(TABLE 'users' DB 'default'))
LIFETIME(MIN 300 MAX 600)  -- refresh every 5-10 minutes
LAYOUT(HASHED());

-- Use in queries — much faster than JOIN
SELECT
    event_type,
    dictGet('user_dict', 'country', user_id) AS country,
    count()
FROM events
GROUP BY event_type, country;</code></pre>

<h2>TTL for Auto-Expiry</h2>
<pre><code>-- Row-level TTL: delete rows after 90 days
CREATE TABLE logs (
    timestamp DateTime,
    level String,
    message String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (level, timestamp)
TTL timestamp + INTERVAL 90 DAY;

-- Column-level TTL: clear heavy columns but keep lightweight ones
CREATE TABLE events (
    timestamp DateTime,
    event_type String,
    raw_payload String TTL timestamp + INTERVAL 30 DAY,
    user_agent String TTL timestamp + INTERVAL 7 DAY
) ENGINE = MergeTree()
ORDER BY (event_type, timestamp);

-- Move to cold storage TTL
ALTER TABLE events
    MODIFY TTL timestamp + INTERVAL 30 DAY TO VOLUME 'cold';</code></pre>

<h2>Nullable vs Default Values</h2>
<table>
  <tr><th>Aspect</th><th>Nullable(UInt32)</th><th>UInt32 (default 0)</th></tr>
  <tr><td>Storage</td><td>Extra null bitmap column</td><td>No overhead</td></tr>
  <tr><td>Performance</td><td>Slower (must check null bitmap)</td><td>Faster</td></tr>
  <tr><td>Memory</td><td>~12.5% more per column</td><td>Baseline</td></tr>
  <tr><td>Compression</td><td>Worse (extra column)</td><td>Better</td></tr>
  <tr><td>Semantics</td><td>Distinguishes null vs 0</td><td>Cannot distinguish</td></tr>
</table>

<div class="warning-note">Avoid Nullable columns unless you genuinely need NULL semantics. In analytics, a default value of 0 or empty string is usually sufficient and significantly more performant. Nullable columns add a hidden UInt8 column for the null bitmap, which impacts compression and query speed.</div>

<h2>LowCardinality Optimization</h2>
<pre><code>-- LowCardinality is dictionary encoding for columns with < ~10,000 unique values
-- Massive performance improvement for string columns like country, status, event_type

CREATE TABLE events (
    event_type LowCardinality(String),   -- ~50 unique values
    country LowCardinality(String),       -- ~200 unique values
    browser LowCardinality(String),       -- ~20 unique values
    user_agent String                      -- high cardinality, don't use LC
) ENGINE = MergeTree()
ORDER BY event_type;

-- Performance impact:
-- LowCardinality(String) vs String:
-- Storage: 5-10x less space
-- GROUP BY: 2-5x faster (operates on dictionary IDs, not strings)
-- Filter: faster (compare small integers, not strings)</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You have a table with 100 billion rows and queries are slow. Walk through your data modeling investigation.</div>
  <div class="qa-a">Systematic approach: (1) Check ORDER BY — are common WHERE clause columns in the primary key and in the right order? Run system.query_log to see which queries are slowest. (2) Check partition key — are queries pruning partitions? Look at parts_to_read in EXPLAIN. (3) Check if PREWHERE would help (column used in WHERE that is small and selective). (4) Look for missing materialized views — if queries aggregate over large date ranges, pre-aggregate with AggregatingMergeTree. (5) Check data types — String → LowCardinality(String) for low-cardinality columns, avoid Nullable. (6) Check compression — use SYSTEM PARTS to see compression ratios, tune codecs. (7) Consider sampling — if approximate results are acceptable, add SAMPLE BY clause.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do materialized views work in ClickHouse, and how do they differ from PostgreSQL materialized views?</div>
  <div class="qa-a">In PostgreSQL, a materialized view is a cached query result that must be manually refreshed (REFRESH MATERIALIZED VIEW). In ClickHouse, a materialized view is an INSERT trigger: when data is inserted into the source table, the MV's query runs on the new data block only and inserts the result into a target table. This means ClickHouse MVs are always up-to-date (no stale data), but they only see each block individually — they cannot do global aggregation across existing data. Combined with AggregatingMergeTree, they enable incremental aggregation by storing intermediate aggregate states that are merged at query time.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use SummingMergeTree vs a materialized view with AggregatingMergeTree?</div>
  <div class="qa-a">SummingMergeTree is simpler — it automatically sums all numeric columns during merges for rows with the same ORDER BY key. Use it when you only need SUM aggregates and the aggregation key matches your ORDER BY. AggregatingMergeTree is more flexible — it stores intermediate aggregate function states (count, uniq, quantile, avg, etc.) and merges them correctly. Use it when you need non-SUM aggregates like count-distinct, percentiles, or averages. AggregatingMergeTree is almost always used as the target table for a materialized view, where the MV's SELECT uses -State functions and the final query uses -Merge functions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle late-arriving data in a partitioned ClickHouse table?</div>
  <div class="qa-a">Late-arriving data naturally goes into the correct partition based on PARTITION BY expression. For example, if partitioned by toYYYYMM(date), a row with date='2024-01-15' arriving in February still goes to the 202401 partition. This is fine for ClickHouse — it creates a new part in that partition. However, if you use TTL and the partition has already been removed, the data is silently dropped. For materialized views, late data is still processed correctly since MVs trigger on INSERT. The concern is with ORDER BY — if the data within a partition is badly out of order, merge efficiency decreases. In practice this is rarely an issue because ClickHouse sorts within each part during INSERT.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the trade-offs of using more columns in the ORDER BY key?</div>
  <div class="qa-a">More columns in ORDER BY: PRO: enables index pruning for more query patterns, and improves compression for trailing columns (data is sorted, so trailing columns have local ordering). CON: the primary index becomes less selective for the first column (same index entries cover fewer rows of a single first-column value), and if early columns have high cardinality, the benefit of later columns diminishes. Also, writes are slightly slower with longer sort keys. Rule of thumb: 3-5 columns is typical. Put the most filtered, lowest-cardinality column first. Only include columns that appear in common WHERE clauses.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: You need to ingest user profile updates from PostgreSQL CDC into ClickHouse. Design the schema.</div>
  <div class="qa-a">Use ReplacingMergeTree with the CDC timestamp as the version column: CREATE TABLE user_profiles (...) ENGINE = ReplacingMergeTree(updated_at) ORDER BY user_id. CDC tools like Debezium produce insert/update/delete events. For inserts and updates, insert directly — ReplacingMergeTree keeps the latest version. For deletes, add an is_deleted UInt8 column set to 1. Query with: SELECT * FROM user_profiles FINAL WHERE is_deleted = 0. For high-throughput, avoid FINAL and instead use: SELECT argMax(name, updated_at) ... GROUP BY user_id HAVING argMax(is_deleted, updated_at) = 0. This avoids the merge overhead of FINAL.</div>
</div>
`
  },
  {
    id: 'ch-queries',
    title: 'ClickHouse Queries & Performance',
    category: 'ClickHouse',
    starterCode: `// Simulating ClickHouse Query Concepts in JavaScript
// ==================================================

// 1. arrayJoin simulation (ClickHouse's unique array explosion)
console.log('=== arrayJoin Simulation ===');
const rows = [
  { user: 'Alice', tags: ['frontend', 'react', 'typescript'] },
  { user: 'Bob', tags: ['backend', 'node', 'postgres'] },
];

function arrayJoin(data, arrayCol) {
  const result = [];
  for (const row of data) {
    for (const val of row[arrayCol]) {
      result.push({ ...row, [arrayCol]: val });
    }
  }
  return result;
}

const exploded = arrayJoin(rows, 'tags');
console.log('Before arrayJoin:', rows.length, 'rows');
console.log('After arrayJoin:', exploded.length, 'rows');
exploded.forEach(r => console.log('  ', r.user, '→', r.tags));

// 2. groupArray (inverse of arrayJoin)
console.log('\\n=== groupArray Simulation ===');
function groupArray(data, keyCol, valCol) {
  const groups = new Map();
  for (const row of data) {
    if (!groups.has(row[keyCol])) groups.set(row[keyCol], []);
    groups.get(row[keyCol]).push(row[valCol]);
  }
  return [...groups.entries()].map(([k, v]) => ({ [keyCol]: k, [valCol + 's']: v }));
}
console.log(groupArray(exploded, 'user', 'tags'));

// 3. Approximate COUNT DISTINCT (HyperLogLog simulation)
console.log('\\n=== Approximate uniq() via HyperLogLog ===');
class SimpleHLL {
  constructor(bits = 10) {
    this.m = 1 << bits;
    this.registers = new Uint8Array(this.m);
  }
  _hash(val) {
    let h = 0;
    const s = String(val);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  add(val) {
    const h = this._hash(val);
    const idx = h & (this.m - 1);
    const w = h >>> Math.log2(this.m);
    let rho = 1;
    let tmp = w;
    while ((tmp & 1) === 0 && tmp > 0) { rho++; tmp >>>= 1; }
    this.registers[idx] = Math.max(this.registers[idx], rho);
  }
  count() {
    const alpha = 0.7213 / (1 + 1.079 / this.m);
    let sum = 0;
    for (let i = 0; i < this.m; i++) sum += Math.pow(2, -this.registers[i]);
    return Math.round(alpha * this.m * this.m / sum);
  }
}

const hll = new SimpleHLL(10);
const exactSet = new Set();
for (let i = 0; i < 100000; i++) {
  const val = 'user_' + (Math.random() * 50000 | 0);
  hll.add(val);
  exactSet.add(val);
}
console.log('Exact distinct:', exactSet.size);
console.log('HLL estimate:', hll.count());
console.log('Error:', ((Math.abs(hll.count() - exactSet.size) / exactSet.size) * 100).toFixed(1) + '%');

// 4. PREWHERE vs WHERE simulation
console.log('\\n=== PREWHERE vs WHERE ===');
const data = Array.from({ length: 100000 }, (_, i) => ({
  status: i % 100 === 0 ? 404 : 200,  // 1% match rate
  payload: 'x'.repeat(1000),            // heavy column
  metric: Math.random() * 100
}));

// WHERE: read ALL columns, then filter
let whereReads = 0;
const t1 = performance.now();
const whereResult = data.filter(r => { whereReads += 3; return r.status === 404; });
const whereTime = performance.now() - t1;

// PREWHERE: read filter column first, then read other columns only for matches
let prewhereReads = 0;
const t2 = performance.now();
const prewhereResult = [];
for (const row of data) {
  prewhereReads++; // Read only status column
  if (row.status === 404) {
    prewhereReads += 2; // Now read payload + metric for matching rows only
    prewhereResult.push(row);
  }
}
const prewhereTime = performance.now() - t2;

console.log('WHERE: ' + whereReads + ' field reads, ' + whereTime.toFixed(2) + 'ms');
console.log('PREWHERE: ' + prewhereReads + ' field reads, ' + prewhereTime.toFixed(2) + 'ms');
console.log('PREWHERE read ' + (whereReads / prewhereReads).toFixed(1) + 'x fewer fields');

// 5. Window function simulation
console.log('\\n=== Window Function: Running Total ===');
const sales = [
  { date: '2024-01-01', amount: 100 },
  { date: '2024-01-02', amount: 250 },
  { date: '2024-01-03', amount: 180 },
  { date: '2024-01-04', amount: 320 },
];
let running = 0;
sales.forEach(s => {
  running += s.amount;
  console.log(s.date, 'amount:', s.amount, 'running_total:', running);
});`,
    content: `
<h1>ClickHouse Queries & Performance</h1>
<p>ClickHouse uses a SQL dialect that is mostly ANSI-compatible but includes powerful extensions for analytical workloads. Understanding these query patterns and optimization techniques is essential for getting the most out of ClickHouse in production. This section covers SQL differences, advanced functions, and performance optimization strategies.</p>

<h2>SQL Dialect Differences from Standard SQL</h2>
<table>
  <tr><th>Feature</th><th>Standard SQL</th><th>ClickHouse SQL</th></tr>
  <tr><td>String quoting</td><td>Single quotes for strings</td><td>Same, but double quotes are NOT for identifiers (use backticks)</td></tr>
  <tr><td>Boolean</td><td>TRUE/FALSE</td><td>1/0 (UInt8)</td></tr>
  <tr><td>NULL handling</td><td>NULL propagates</td><td>Same, but prefer avoiding Nullable types</td></tr>
  <tr><td>DELETE</td><td>DELETE FROM ... WHERE</td><td>ALTER TABLE ... DELETE WHERE (mutation, async, heavy)</td></tr>
  <tr><td>UPDATE</td><td>UPDATE ... SET ... WHERE</td><td>ALTER TABLE ... UPDATE ... WHERE (mutation, async, heavy)</td></tr>
  <tr><td>AUTO_INCREMENT</td><td>SERIAL / AUTO_INCREMENT</td><td>Not supported (use generateUUIDv4() or external sequencing)</td></tr>
  <tr><td>Subqueries</td><td>Correlated subqueries</td><td>Limited support; prefer JOINs or IN with subquery</td></tr>
  <tr><td>CTEs</td><td>WITH ... AS</td><td>Supported (but not recursive CTEs)</td></tr>
  <tr><td>UPSERT</td><td>INSERT ON CONFLICT</td><td>Not supported (use ReplacingMergeTree)</td></tr>
</table>

<h2>Array Functions</h2>
<p>ClickHouse has first-class array support that is extremely powerful for denormalized analytics data.</p>

<h3>arrayJoin — Unique to ClickHouse</h3>
<pre><code>-- arrayJoin "explodes" an array column into multiple rows
SELECT
    user_id,
    arrayJoin(visited_pages) AS page
FROM user_sessions;
-- user_id=1, visited_pages=['/home','/about','/pricing']
-- Becomes 3 rows: (1,'/home'), (1,'/about'), (1,'/pricing')

-- Practical use: tag analysis
SELECT
    arrayJoin(tags) AS tag,
    count() AS article_count
FROM articles
GROUP BY tag
ORDER BY article_count DESC;</code></pre>

<h3>groupArray — Collect values into an array</h3>
<pre><code>-- Inverse of arrayJoin
SELECT
    user_id,
    groupArray(event_type) AS events,        -- all events as array
    groupArray(10)(event_type) AS last_10,    -- only last 10
    groupArrayDistinct(event_type) AS unique_events
FROM user_events
GROUP BY user_id;</code></pre>

<h3>Higher-Order Array Functions</h3>
<pre><code>-- arrayMap: transform each element
SELECT arrayMap(x -> x * 2, [1, 2, 3, 4]);  -- [2, 4, 6, 8]

-- arrayFilter: filter elements
SELECT arrayFilter(x -> x > 2, [1, 2, 3, 4]);  -- [3, 4]

-- arrayExists: check if any element matches
SELECT arrayExists(x -> x = 'error', log_levels);  -- 1 or 0

-- arrayReduce: apply aggregate function to array
SELECT arrayReduce('sum', [1, 2, 3, 4]);  -- 10
SELECT arrayReduce('avg', [1, 2, 3, 4]);  -- 2.5

-- arrayEnumerate: like enumerate() in Python
SELECT arrayEnumerate([10, 20, 30]);  -- [1, 2, 3]

-- Multiple arrays with ARRAY JOIN
SELECT
    user_id, param_name, param_value
FROM events
ARRAY JOIN
    param_names AS param_name,
    param_values AS param_value;</code></pre>

<h2>Window Functions</h2>
<pre><code>-- Running totals, rankings, and lead/lag — supported since ClickHouse 21.1
SELECT
    date,
    revenue,
    sum(revenue) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
    row_number() OVER (ORDER BY revenue DESC) AS rank,
    lag(revenue) OVER (ORDER BY date) AS prev_day_revenue,
    revenue - lag(revenue) OVER (ORDER BY date) AS daily_change
FROM daily_metrics
ORDER BY date;

-- Partition window: per-category ranking
SELECT
    category,
    product_name,
    revenue,
    rank() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank_in_category
FROM products;

-- Moving average
SELECT
    date,
    value,
    avg(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma_7day
FROM metrics;</code></pre>

<h2>Approximate Functions</h2>
<p>ClickHouse offers approximate functions that trade small accuracy for massive speed gains. These are critical for real-time dashboards over billions of rows.</p>

<table>
  <tr><th>Function</th><th>Purpose</th><th>Algorithm</th><th>Error</th><th>Speed vs Exact</th></tr>
  <tr><td><strong>uniq()</strong></td><td>Approximate COUNT DISTINCT</td><td>HyperLogLog</td><td>~1-2%</td><td>10-100x faster</td></tr>
  <tr><td><strong>uniqExact()</strong></td><td>Exact COUNT DISTINCT</td><td>Hash set</td><td>0%</td><td>Baseline</td></tr>
  <tr><td><strong>uniqCombined()</strong></td><td>Approximate COUNT DISTINCT</td><td>HLL + hash for small sets</td><td>~1-2%</td><td>Best of both</td></tr>
  <tr><td><strong>uniqHLL12()</strong></td><td>Approximate COUNT DISTINCT</td><td>HLL with 2^12 registers</td><td>~1.6%</td><td>Very fast, mergeable</td></tr>
  <tr><td><strong>quantile(0.95)(x)</strong></td><td>Approximate percentile</td><td>Reservoir sampling</td><td>Approximate</td><td>Very fast</td></tr>
  <tr><td><strong>quantileTDigest(0.95)(x)</strong></td><td>Better percentile</td><td>t-digest</td><td>More accurate at extremes</td><td>Fast</td></tr>
  <tr><td><strong>quantileExact(0.95)(x)</strong></td><td>Exact percentile</td><td>Full sort</td><td>0%</td><td>Slow</td></tr>
  <tr><td><strong>median(x)</strong></td><td>Median (alias for quantile(0.5))</td><td>Reservoir sampling</td><td>Approximate</td><td>Very fast</td></tr>
</table>

<pre><code>-- Dashboard query: approximate is fine, 100x faster
SELECT
    toStartOfHour(timestamp) AS hour,
    count() AS events,
    uniq(user_id) AS unique_users,         -- HLL, ~2% error, very fast
    quantile(0.99)(latency_ms) AS p99      -- approximate p99
FROM events
WHERE date = today()
GROUP BY hour;

-- Billing query: must be exact
SELECT
    tenant_id,
    uniqExact(user_id) AS billable_users    -- exact, slower
FROM events
WHERE toYYYYMM(date) = 202401
GROUP BY tenant_id;</code></pre>

<h2>PREWHERE vs WHERE Optimization</h2>
<p>PREWHERE is a ClickHouse-specific optimization. It reads the filter columns first, identifies matching granules, and then reads the remaining columns <strong>only for matching rows</strong>. This is extremely powerful when the filter is selective and the table has many/large columns.</p>

<pre><code>-- ClickHouse automatically converts WHERE to PREWHERE in many cases
-- But you can be explicit:
SELECT user_id, payload, metadata
FROM events
PREWHERE status = 404  -- Read status column first (small), filter to 1%
WHERE length(metadata) > 100;  -- Then apply to remaining rows

-- When PREWHERE helps:
-- Table has 50 columns, query filters on small column → 50x less I/O
-- Filter selectivity is high (matches < 10% of rows)

-- When PREWHERE hurts:
-- Filter matches most rows (>50%) — you read the column twice (prewhere + final read)
-- Filter column is large (e.g., String) — no I/O savings</code></pre>

<div class="warning-note">ClickHouse automatically converts WHERE to PREWHERE when it estimates it will help. The optimize_move_to_prewhere setting (default: on) controls this. You rarely need to write PREWHERE explicitly, but understanding it helps debug slow queries.</div>

<h2>JOIN Strategies</h2>
<p>JOINs are the most expensive operation in ClickHouse. Understanding the strategies is critical.</p>

<table>
  <tr><th>Strategy</th><th>How It Works</th><th>Memory</th><th>Best For</th></tr>
  <tr><td><strong>Hash Join</strong> (default)</td><td>Right table loaded into hash table in memory</td><td>Right table must fit in RAM</td><td>Small right table (&lt;= few GB)</td></tr>
  <tr><td><strong>Partial Merge Join</strong></td><td>Sort both sides, merge on disk</td><td>Low (spills to disk)</td><td>Large right table that does not fit in RAM</td></tr>
  <tr><td><strong>Direct Join</strong></td><td>Lookup via Dictionary</td><td>Dictionary in memory</td><td>Dimension lookups (fastest)</td></tr>
  <tr><td><strong>Full Sorting Merge Join</strong></td><td>Full sort-merge</td><td>Low</td><td>Large-to-large table joins</td></tr>
</table>

<pre><code>-- Control join algorithm
SET join_algorithm = 'hash';           -- default
SET join_algorithm = 'partial_merge';  -- when right table too large for RAM
SET join_algorithm = 'direct';         -- requires right table to be a Dictionary
SET join_algorithm = 'auto';           -- ClickHouse decides

-- Pre-filter to reduce right table size (CRITICAL optimization)
SELECT l.user_id, l.event, r.name
FROM events l
JOIN (
    SELECT user_id, name FROM users WHERE country = 'US'
) r ON l.user_id = r.user_id
WHERE l.date = today();

-- Even better: use IN instead of JOIN when you only need to filter
SELECT user_id, event
FROM events
WHERE user_id IN (SELECT user_id FROM users WHERE country = 'US')
AND date = today();</code></pre>

<h2>Query Profiling</h2>
<pre><code>-- EXPLAIN shows query plan without executing
EXPLAIN SELECT count() FROM events WHERE date = today();
EXPLAIN PLAN SELECT ...;      -- logical plan
EXPLAIN PIPELINE SELECT ...;  -- execution pipeline
EXPLAIN SYNTAX SELECT ...;    -- shows query after optimization rewrites
EXPLAIN ESTIMATE SELECT ...;  -- estimated rows/parts to read

-- system.query_log: post-execution analysis
SELECT
    query,
    query_duration_ms,
    read_rows,
    read_bytes,
    memory_usage,
    result_rows,
    ProfileEvents
FROM system.query_log
WHERE type = 'QueryFinish'
ORDER BY query_duration_ms DESC
LIMIT 10;

-- Per-query settings for profiling
SET log_queries = 1;
SET send_logs_level = 'trace';

-- system.trace_log for CPU profiling
SELECT
    arrayStringConcat(arrayMap(x -> demangle(addressToSymbol(x)), trace), '\\n') AS stack,
    count() AS samples
FROM system.trace_log
WHERE query_id = 'your-query-id'
GROUP BY trace
ORDER BY samples DESC;</code></pre>

<h2>Sampling for Fast Approximate Queries</h2>
<pre><code>-- Define SAMPLE BY at table creation
CREATE TABLE events (
    date Date,
    user_id UInt64,
    event_type String,
    duration UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (event_type, sipHash64(user_id))  -- hash for uniform distribution
SAMPLE BY sipHash64(user_id);

-- Query with sampling: reads ~10% of data
SELECT
    event_type,
    count() * 10 AS estimated_count,  -- scale up
    avg(duration) AS avg_duration      -- avg doesn't need scaling
FROM events
SAMPLE 0.1  -- 10% sample
GROUP BY event_type;

-- Sampling with offset (for different samples)
SELECT count() FROM events SAMPLE 1/10 OFFSET 3/10;  -- 3rd decile</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: A dashboard query that counts unique users per hour is taking 30 seconds on 10 billion rows. How do you optimize it?</div>
  <div class="qa-a">Layered approach: (1) Replace uniqExact with uniq() — HyperLogLog gives ~2% error but is 10-100x faster. (2) Create a materialized view that pre-aggregates hourly with uniqState(user_id), so the dashboard reads thousands of rows instead of billions. (3) Ensure ORDER BY starts with the time column used in WHERE. (4) Use PREWHERE for date filtering. (5) If approximate is OK, add SAMPLE BY and query with SAMPLE 0.1. (6) If the table has many columns the dashboard doesn't need, it's already column-optimized — but verify with EXPLAIN that only needed columns are read.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use arrayJoin vs ARRAY JOIN in ClickHouse?</div>
  <div class="qa-a">arrayJoin() is a function that can be used in SELECT/WHERE and explodes one array. ARRAY JOIN is a clause (like FROM) that explodes array columns while preserving other columns and can explode multiple arrays in parallel. Use ARRAY JOIN when you need to explode arrays stored in table columns (e.g., ARRAY JOIN tags AS tag, tag_values AS val). Use arrayJoin() for ad-hoc array generation or in expressions (e.g., arrayJoin(range(10)) to generate rows). ARRAY JOIN is more efficient for stored arrays because it integrates with the query pipeline.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between uniq, uniqCombined, uniqExact, and uniqHLL12. When do you use each?</div>
  <div class="qa-a">uniq() uses an adaptive algorithm (HLL for large sets, exact for small sets) with ~1-2% error — good default for dashboards. uniqCombined() is similar but explicitly uses a combination of array + hash table + HLL depending on set size — best general-purpose approximate distinct. uniqExact() uses a hash set for 100% accuracy — use for billing, financial reporting, or SLAs that require exact numbers. uniqHLL12() uses HyperLogLog with fixed 2^12 registers — ~1.6% error, advantage is that states are fixed-size and efficiently mergeable across shards and time periods. For materialized views that aggregate unique users, uniqCombined or uniqHLL12 are preferred because their states merge correctly.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does PREWHERE optimization work internally?</div>
  <div class="qa-a">PREWHERE splits the query into two phases: Phase 1 reads only the PREWHERE columns from disk, evaluates the predicate, and produces a row bitmap of matching rows. Phase 2 reads the remaining columns from disk ONLY for granules that have at least one matching row, and within those granules, only materializes the matching rows. For a table with 50 columns where the PREWHERE condition matches 1% of rows, this means: Phase 1 reads 1 column file (2% of data). Phase 2 reads 49 column files but only for ~1% of granules. Net I/O reduction: ~98%. ClickHouse automatically promotes WHERE to PREWHERE when the filter column is small and selective.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: You need to join a 1TB fact table with a 500GB dimension table. How do you approach this?</div>
  <div class="qa-a">A 500GB dimension table will not fit in memory for hash join. Options: (1) Denormalize at ingestion time — best solution, avoid the join entirely. (2) Use partial_merge join algorithm (SET join_algorithm='partial_merge') which spills to disk. (3) Pre-filter the dimension table in a subquery to reduce its size. (4) Load the dimension into a Dictionary if it can be reduced (e.g., only needed columns). (5) Use IN instead of JOIN if you only need to filter (no columns from the dimension). (6) If the join is repeated, create a materialized view that joins at insert time. (7) Consider restructuring: can you partition both tables by the join key and run the join per-partition?</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the pitfalls of ClickHouse window functions compared to PostgreSQL?</div>
  <div class="qa-a">ClickHouse window functions have limitations: (1) They are processed after GROUP BY and before ORDER BY, same as standard SQL — but ClickHouse may not optimize them as aggressively. (2) The window function result cannot be used in WHERE — use subquery or CTE. (3) Performance can degrade significantly if the PARTITION BY has high cardinality because each partition is processed independently. (4) RANGE frames are supported but less optimized than ROWS frames. (5) No support for custom aggregate functions in window context. (6) For large datasets, a materialized view pre-computing the desired metric is almost always faster than a window function at query time.</div>
</div>
`
  },
  {
    id: 'ch-scaling',
    title: 'ClickHouse Replication & Scaling',
    category: 'ClickHouse',
    starterCode: `// Simulating ClickHouse Replication & Sharding
// =============================================

// 1. Replication: Data redundancy across replicas
console.log('=== Replication Simulation ===');
class Replica {
  constructor(name) {
    this.name = name;
    this.parts = new Map();
    this.replicationLog = [];
  }
  insert(partName, data) {
    this.parts.set(partName, data);
    this.replicationLog.push({ action: 'INSERT', partName, ts: Date.now() });
    return partName;
  }
  fetchPart(partName, fromReplica) {
    const data = fromReplica.parts.get(partName);
    if (data) {
      this.parts.set(partName, [...data]);
      this.replicationLog.push({ action: 'REPLICATED', partName, from: fromReplica.name });
    }
  }
  query(col) {
    let sum = 0;
    for (const [, rows] of this.parts) {
      for (const row of rows) sum += row[col] || 0;
    }
    return sum;
  }
}

class ZooKeeper {
  constructor() { this.log = []; this.replicas = []; }
  register(replica) { this.replicas.push(replica); }
  notifyInsert(source, partName) {
    this.log.push({ partName, source: source.name });
    // Tell other replicas to fetch this part
    for (const r of this.replicas) {
      if (r !== source) {
        console.log('  ZK: telling', r.name, 'to fetch', partName, 'from', source.name);
        r.fetchPart(partName, source);
      }
    }
  }
}

const zk = new ZooKeeper();
const r1 = new Replica('replica-1');
const r2 = new Replica('replica-2');
const r3 = new Replica('replica-3');
zk.register(r1); zk.register(r2); zk.register(r3);

// Write to any replica (multi-master)
const part1 = r1.insert('part_001', [{ duration: 100 }, { duration: 200 }]);
console.log('Written to', r1.name);
zk.notifyInsert(r1, part1);

const part2 = r2.insert('part_002', [{ duration: 300 }, { duration: 400 }]);
console.log('Written to', r2.name);
zk.notifyInsert(r2, part2);

console.log('\\nQuery all replicas (should be identical):');
console.log('  r1 sum(duration):', r1.query('duration'));
console.log('  r2 sum(duration):', r2.query('duration'));
console.log('  r3 sum(duration):', r3.query('duration'));

// 2. Sharding: Data partitioned across shards
console.log('\\n=== Sharding Simulation ===');
class Shard {
  constructor(name) { this.name = name; this.data = []; }
  insert(row) { this.data.push(row); }
  localQuery(filter) {
    return this.data.filter(filter);
  }
}

class DistributedTable {
  constructor(shards, shardKeyFn) {
    this.shards = shards;
    this.shardKeyFn = shardKeyFn;
  }
  insert(row) {
    const shardIdx = this.shardKeyFn(row) % this.shards.length;
    this.shards[shardIdx].insert(row);
  }
  // Distributed query: fan-out to all shards, merge results
  query(filterFn, aggregateFn) {
    console.log('  Distributed query → fan out to', this.shards.length, 'shards');
    const partialResults = this.shards.map(s => {
      const local = s.localQuery(filterFn);
      console.log('    ' + s.name + ':', local.length, 'matching rows');
      return local;
    });
    const allResults = partialResults.flat();
    return aggregateFn(allResults);
  }
}

const shards = [new Shard('shard-1'), new Shard('shard-2'), new Shard('shard-3')];
const distributed = new DistributedTable(shards, row => row.tenant_id);

// Insert data — sharded by tenant_id
for (let i = 0; i < 1000; i++) {
  distributed.insert({
    tenant_id: i % 10,
    event: 'click',
    duration: Math.random() * 100 | 0
  });
}

console.log('Data distribution:');
shards.forEach(s => console.log(' ', s.name + ':', s.data.length, 'rows'));

// Query: sum duration for tenant_id = 5
const result = distributed.query(
  r => r.tenant_id === 5,
  rows => ({ count: rows.length, totalDuration: rows.reduce((s, r) => s + r.duration, 0) })
);
console.log('Result for tenant_id=5:', result);

// 3. INSERT deduplication
console.log('\\n=== INSERT Deduplication ===');
class DedupTable {
  constructor() { this.data = []; this.insertedBlocks = new Set(); }
  insert(blockId, rows) {
    if (this.insertedBlocks.has(blockId)) {
      console.log('  Block', blockId, 'already inserted — SKIPPED (dedup)');
      return false;
    }
    this.insertedBlocks.add(blockId);
    this.data.push(...rows);
    console.log('  Block', blockId, 'inserted:', rows.length, 'rows');
    return true;
  }
}

const dedupTable = new DedupTable();
dedupTable.insert('block_abc123', [{ id: 1 }, { id: 2 }]);
dedupTable.insert('block_abc123', [{ id: 1 }, { id: 2 }]); // retry — deduped!
dedupTable.insert('block_def456', [{ id: 3 }, { id: 4 }]);
console.log('Total rows:', dedupTable.data.length, '(should be 4, not 6)');`,
    content: `
<h1>ClickHouse Replication & Scaling</h1>
<p>Scaling ClickHouse involves two orthogonal dimensions: <strong>replication</strong> (copies of the same data for high availability and read scaling) and <strong>sharding</strong> (splitting data across nodes for write scaling and larger datasets). Understanding when and how to use each is a critical SDE3 skill.</p>

<h2>ReplicatedMergeTree and ZooKeeper/ClickHouse Keeper</h2>
<p>Replication in ClickHouse is implemented at the <strong>table engine level</strong>, not at the server level. You explicitly create a ReplicatedMergeTree table to get replication.</p>

<pre><code>-- ReplicatedMergeTree syntax
CREATE TABLE events ON CLUSTER my_cluster (
    date Date,
    user_id UInt64,
    event_type String
) ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/events',   -- ZooKeeper path
    '{replica}'                              -- Replica identifier
)
PARTITION BY toYYYYMM(date)
ORDER BY (event_type, user_id);

-- ZooKeeper path components:
-- /clickhouse/tables/ — convention prefix
-- {shard} — macro, different per shard (e.g., '01', '02')
-- events — table name
-- {replica} — macro, different per replica (e.g., 'replica1', 'replica2')</code></pre>

<h3>How Replication Works Internally</h3>
<pre><code>1. Client INSERTs to any replica (multi-master)
   │
2. Replica creates new part locally
   │
3. Replica writes part metadata to ZooKeeper replication log
   /clickhouse/tables/01/events/log/log-000001234
   │
4. Other replicas watch the ZooKeeper log
   │
5. They see the new entry and fetch the part
   directly from the source replica (peer-to-peer)
   │
6. Each replica ends up with the same set of parts

Key insight: ZooKeeper stores only METADATA (part names, checksums).
Actual DATA is transferred directly between replicas.</code></pre>

<h3>ZooKeeper vs ClickHouse Keeper</h3>
<table>
  <tr><th>Aspect</th><th>ZooKeeper</th><th>ClickHouse Keeper</th></tr>
  <tr><td>Language</td><td>Java</td><td>C++ (built into ClickHouse)</td></tr>
  <tr><td>Deployment</td><td>Separate cluster (3-5 nodes)</td><td>Built-in or standalone</td></tr>
  <tr><td>Performance</td><td>Good</td><td>Better (optimized for ClickHouse patterns)</td></tr>
  <tr><td>Memory</td><td>JVM heap (tuning needed)</td><td>Lower footprint</td></tr>
  <tr><td>Protocol</td><td>ZooKeeper protocol</td><td>Compatible with ZooKeeper protocol</td></tr>
  <tr><td>Recommendation</td><td>Legacy</td><td>Preferred for new deployments</td></tr>
</table>

<div class="warning-note">ZooKeeper/Keeper is a critical dependency. If it goes down, ClickHouse can still serve reads from local data but cannot accept writes (because it cannot coordinate replication). Always deploy 3+ ZooKeeper/Keeper nodes for high availability. Monitor ZooKeeper latency — high latency directly impacts INSERT performance.</div>

<h2>Sharding with Distributed Table Engine</h2>
<p>When a single node cannot hold all your data or handle all your write throughput, you shard. ClickHouse sharding uses the <strong>Distributed table engine</strong> as a routing layer.</p>

<pre><code>-- Cluster configuration (in config.xml or via macros)
-- Example: 3 shards, 2 replicas each = 6 nodes total
&lt;remote_servers&gt;
  &lt;my_cluster&gt;
    &lt;shard&gt;
      &lt;replica&gt;&lt;host&gt;shard1-replica1&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
      &lt;replica&gt;&lt;host&gt;shard1-replica2&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
    &lt;/shard&gt;
    &lt;shard&gt;
      &lt;replica&gt;&lt;host&gt;shard2-replica1&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
      &lt;replica&gt;&lt;host&gt;shard2-replica2&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
    &lt;/shard&gt;
    &lt;shard&gt;
      &lt;replica&gt;&lt;host&gt;shard3-replica1&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
      &lt;replica&gt;&lt;host&gt;shard3-replica2&lt;/host&gt;&lt;port&gt;9000&lt;/port&gt;&lt;/replica&gt;
    &lt;/shard&gt;
  &lt;/my_cluster&gt;
&lt;/remote_servers&gt;

-- Local table (on each shard)
CREATE TABLE events_local ON CLUSTER my_cluster (
    date Date,
    tenant_id UInt32,
    event_type String,
    duration UInt32
) ENGINE = ReplicatedMergeTree(...)
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, event_type, date);

-- Distributed table (routing layer)
CREATE TABLE events_distributed ON CLUSTER my_cluster
AS events_local
ENGINE = Distributed(my_cluster, default, events_local, sipHash64(tenant_id));
-- Last argument: sharding key expression</code></pre>

<h3>How Distributed Queries Work</h3>
<pre><code>Client → Distributed table → Fan-out to all shards
                                 │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                 Shard 1       Shard 2       Shard 3
              (local query)  (local query)  (local query)
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                        Merge partial results
                                  │
                                  ▼
                          Return to client

-- Aggregation pushdown: GROUP BY is executed locally on each shard
-- Only partial aggregate states are sent to the coordinator
-- This minimizes network traffic</code></pre>

<h2>Shard Key Selection</h2>
<p>The shard key determines which rows go to which shard. This is one of the most important decisions for distributed ClickHouse.</p>

<table>
  <tr><th>Strategy</th><th>Shard Key</th><th>Pros</th><th>Cons</th></tr>
  <tr><td>Random</td><td>rand()</td><td>Perfectly balanced</td><td>Every query hits all shards</td></tr>
  <tr><td>By tenant</td><td>sipHash64(tenant_id)</td><td>Tenant queries hit one shard</td><td>Hot tenants cause imbalance</td></tr>
  <tr><td>By time</td><td>toYYYYMM(date)</td><td>Time-range queries efficient</td><td>Only latest shard gets writes</td></tr>
  <tr><td>Composite</td><td>sipHash64(tenant_id, date)</td><td>Good distribution</td><td>No single-shard query optimization</td></tr>
</table>

<pre><code>-- Best practice: shard by the most common filter column
-- If 90% of queries filter by tenant_id:
ENGINE = Distributed(cluster, db, table, sipHash64(tenant_id))

-- This means: SELECT ... WHERE tenant_id = 123
-- Routes to ONE shard instead of fanning out to ALL shards
-- Huge performance win for multi-tenant workloads</code></pre>

<div class="warning-note">If your largest tenant has 50% of the data and you shard by tenant_id, one shard holds 50% of data while others split 50%. This "data skew" problem is real. Solutions: (1) add a secondary column to the shard key, (2) use virtual sharding within the tenant, or (3) use random sharding if no single filter column dominates.</div>

<h2>Replication vs Sharding: When to Use Each</h2>
<table>
  <tr><th>Need</th><th>Solution</th><th>Example</th></tr>
  <tr><td>High availability (survive node failure)</td><td>Replication</td><td>2 replicas per shard</td></tr>
  <tr><td>Read scaling (more concurrent queries)</td><td>Replication</td><td>3 replicas, load balance reads</td></tr>
  <tr><td>Data exceeds single node disk</td><td>Sharding</td><td>Split 100TB across 5 shards</td></tr>
  <tr><td>Write throughput exceeds single node</td><td>Sharding</td><td>5 shards, each handles 20% of writes</td></tr>
  <tr><td>Both HA and large data</td><td>Both</td><td>3 shards x 2 replicas = 6 nodes</td></tr>
</table>

<h3>Typical Production Topologies</h3>
<pre><code>-- Small (< 1TB, moderate load)
-- 2 nodes: 1 shard x 2 replicas
-- Simple HA, no sharding complexity

-- Medium (1-10TB)
-- 6 nodes: 3 shards x 2 replicas
-- Good balance of scaling and redundancy

-- Large (10-100TB+)
-- 20+ nodes: 10 shards x 2 replicas
-- Consider tiered storage (hot/cold)

-- Multi-DC HA
-- 6 nodes: 3 shards x 2 replicas (1 replica per DC)
-- Reads from local DC, writes replicate across DCs</code></pre>

<h2>Cross-Datacenter Replication</h2>
<pre><code>-- Each shard has replicas in multiple datacenters
&lt;shard&gt;
  &lt;replica&gt;
    &lt;host&gt;dc1-shard1-replica1&lt;/host&gt;
    &lt;priority&gt;1&lt;/priority&gt;  &lt;!-- prefer local DC --&gt;
  &lt;/replica&gt;
  &lt;replica&gt;
    &lt;host&gt;dc2-shard1-replica1&lt;/host&gt;
    &lt;priority&gt;2&lt;/priority&gt;  &lt;!-- remote DC --&gt;
  &lt;/replica&gt;
&lt;/shard&gt;

-- Use load_balancing setting to prefer local replicas
SET load_balancing = 'nearest_hostname';  -- or 'in_order' with priority</code></pre>

<h2>Scaling Reads vs Writes</h2>
<ul>
  <li><strong>Scale reads:</strong> Add replicas. Each replica can serve queries independently. Use a load balancer (HAProxy, chproxy) to distribute queries.</li>
  <li><strong>Scale writes:</strong> Add shards. Each shard accepts writes for its portion of data. More shards = more aggregate write throughput.</li>
  <li><strong>Both:</strong> Add shards AND replicas. Common pattern: add shards for write scaling, then 2-3 replicas per shard for HA and read scaling.</li>
</ul>

<h2>INSERT Deduplication</h2>
<p>ClickHouse has built-in INSERT deduplication for ReplicatedMergeTree tables. If the same block of data is inserted twice (e.g., client retry), it is automatically deduplicated.</p>

<pre><code>-- Deduplication is based on block checksums
-- When a block is inserted, ClickHouse computes a hash and stores it in ZooKeeper
-- If the same hash appears again within replicated_deduplication_window (default: 100 last blocks),
-- the insert is silently ignored

-- This is why ClickHouse recommends inserting in batches of ≥1000 rows:
-- 1. Each INSERT creates one part (overhead per INSERT)
-- 2. Deduplication works per-block, not per-row
-- 3. Batching reduces ZooKeeper load

-- Control deduplication:
SET insert_deduplicate = 1;  -- default: enabled
-- replicated_deduplication_window = 100  -- server config</code></pre>

<div class="warning-note">INSERT deduplication only works for ReplicatedMergeTree and only deduplicates identical blocks. If you INSERT the same rows in a different order or split across different blocks, they will NOT be deduplicated. This is block-level dedup, not row-level dedup. For row-level dedup, use ReplacingMergeTree.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You have a ClickHouse cluster with 3 shards and 2 replicas per shard. One replica in shard 2 goes down. What happens to reads and writes?</div>
  <div class="qa-a">Reads: The remaining replica in shard 2 continues to serve read queries. The Distributed table engine automatically routes queries to available replicas. Read availability is maintained as long as at least one replica per shard is alive. Writes: Writes to shard 2 continue to work — they go to the surviving replica. The replication log in ZooKeeper accumulates entries for the down replica. When the down replica comes back, it catches up by replaying the replication log and fetching missing parts. If ZooKeeper is available, there is zero write downtime for a single replica failure.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you choose between sharding by tenant_id vs random sharding?</div>
  <div class="qa-a">Shard by tenant_id when: (1) Most queries filter by tenant_id — the query hits only 1 shard instead of all. (2) Tenants are relatively similar in size — no extreme data skew. (3) You want data isolation between tenants. Use random sharding when: (1) No single column dominates query filters. (2) You have one tenant with 50%+ of data (skew). (3) Most queries are global aggregations that must touch all data anyway. Hybrid approach: shard by sipHash64(tenant_id, date) to spread large tenants across shards while keeping some locality.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if ZooKeeper is down? Can ClickHouse still operate?</div>
  <div class="qa-a">Reads: Yes, ClickHouse continues to serve SELECT queries from local data. The data is already on disk and does not need ZooKeeper to read. Writes: No, INSERTs to ReplicatedMergeTree tables fail because ClickHouse cannot coordinate with ZooKeeper to register the new part in the replication log. Merges: Background merges also stop because merge coordination requires ZooKeeper. DDL: ALTER, CREATE TABLE, DROP TABLE on replicated tables fail. This is why ZooKeeper must be highly available (3-5 nodes with quorum). ClickHouse Keeper is recommended for new deployments as it is more stable and performant.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain how INSERT deduplication works and its limitations.</div>
  <div class="qa-a">When inserting into ReplicatedMergeTree, ClickHouse computes a hash of the inserted block (based on row contents). This hash is stored in ZooKeeper. If the same hash appears again within the deduplication window (default: 100 recent blocks), the insert is silently skipped. Limitations: (1) Block-level, not row-level — same rows in different order = different block = not deduped. (2) Only for ReplicatedMergeTree, not plain MergeTree. (3) Window is limited — if you replay inserts from hours ago, they may be outside the window. (4) Different column order or types will change the hash. (5) It does not protect against same data inserted as part of different blocks. For row-level dedup, use ReplacingMergeTree.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: You need to add a new shard to an existing ClickHouse cluster. Describe the process and challenges.</div>
  <div class="qa-a">Process: (1) Add the new shard nodes to the cluster configuration. (2) Create the local tables on the new shard (ON CLUSTER or manually). (3) Update the Distributed table to include the new shard. (4) New inserts will now be distributed across all shards including the new one. Challenges: (1) Existing data is NOT automatically rebalanced — old shards still hold all historical data. You must manually move data by INSERT ... SELECT from other shards, which is expensive. (2) During migration, queries may return inconsistent results if data is partially moved. (3) If sharding by hash(column), adding a shard changes the hash distribution — new inserts for existing keys may go to different shards than historical data. Solutions: use a two-phase approach (keep old routing, migrate data, then switch), or use ClickHouse Keeper-based rebalancing tools.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the recommended way to insert data into ClickHouse for maximum throughput?</div>
  <div class="qa-a">Best practices: (1) Batch inserts — minimum 1000 rows per INSERT, ideally 10,000-100,000 rows. Each INSERT creates one part; too many small parts cause merge pressure. (2) Insert at most once per second per table to avoid "too many parts" errors. (3) Use async_insert setting for high-frequency small inserts — ClickHouse buffers and batches them. (4) Insert into local tables directly when possible, not through Distributed table (avoids double network hop). (5) Use Buffer table engine as a write buffer for extremely high-frequency inserts. (6) Compress data in transit (native protocol does this automatically). (7) Parallelize inserts across shards but limit concurrency per shard to avoid overwhelming merges.</div>
</div>
`
  },
  {
    id: 'ch-production',
    title: 'ClickHouse vs Alternatives & Production',
    category: 'ClickHouse',
    starterCode: `// Simulating ClickHouse Production Concepts
// ==========================================

// 1. Mutation simulation (ALTER UPDATE/DELETE are heavy in ClickHouse)
console.log('=== Mutations: Why UPDATE/DELETE is Expensive ===');
class ImmutableColumnStore {
  constructor() { this.parts = []; }

  insert(rows) {
    // Each insert creates an immutable part
    this.parts.push({ id: this.parts.length, rows: [...rows], status: 'active' });
    console.log('  Created part_' + (this.parts.length - 1) + ' with', rows.length, 'rows');
  }

  // Mutation: must REWRITE entire parts (not in-place update!)
  mutateUpdate(predicate, updateFn) {
    console.log('  MUTATION started (rewrites parts asynchronously)...');
    let rewritten = 0;
    for (const part of this.parts) {
      if (part.status !== 'active') continue;
      let needsRewrite = false;
      for (const row of part.rows) {
        if (predicate(row)) { needsRewrite = true; break; }
      }
      if (needsRewrite) {
        // Must rewrite the ENTIRE part even if only 1 row matches
        const newRows = part.rows.map(r => predicate(r) ? updateFn(r) : r);
        this.parts.push({ id: this.parts.length, rows: newRows, status: 'active' });
        part.status = 'mutated_away';
        rewritten++;
        console.log('  Rewrote part_' + part.id + ' → part_' + (this.parts.length - 1));
      }
    }
    console.log('  Parts rewritten:', rewritten);
  }

  count() {
    let total = 0;
    for (const p of this.parts) {
      if (p.status === 'active') total += p.rows.length;
    }
    return total;
  }
}

const store = new ImmutableColumnStore();
store.insert([{ id: 1, status: 'active', amount: 100 }, { id: 2, status: 'active', amount: 200 }]);
store.insert([{ id: 3, status: 'active', amount: 300 }, { id: 4, status: 'active', amount: 400 }]);
store.insert([{ id: 5, status: 'active', amount: 500 }]);

console.log('Total rows:', store.count());
console.log('\\nRunning ALTER TABLE UPDATE status = cancelled WHERE id = 3...');
store.mutateUpdate(r => r.id === 3, r => ({ ...r, status: 'cancelled' }));
console.log('Total rows after mutation:', store.count());
console.log('Active parts:', store.parts.filter(p => p.status === 'active').length);

// 2. Buffer Table simulation
console.log('\\n=== Buffer Table: Batching High-Frequency Inserts ===');
class BufferTable {
  constructor(targetTable, flushSize, flushIntervalMs) {
    this.buffer = [];
    this.target = targetTable;
    this.flushSize = flushSize;
    this.flushInterval = flushIntervalMs;
    this.flushCount = 0;
  }
  insert(row) {
    this.buffer.push(row);
    if (this.buffer.length >= this.flushSize) this.flush();
  }
  flush() {
    if (this.buffer.length === 0) return;
    this.flushCount++;
    console.log('  Buffer flush #' + this.flushCount + ':', this.buffer.length, 'rows → target table');
    this.target.push(...this.buffer);
    this.buffer = [];
  }
}

const targetTable = [];
const buffer = new BufferTable(targetTable, 5, 1000);

// Simulate rapid individual inserts
for (let i = 0; i < 23; i++) {
  buffer.insert({ metric: 'cpu', value: Math.random() * 100 | 0 });
}
buffer.flush(); // flush remaining
console.log('23 individual inserts became', buffer.flushCount, 'batch flushes');
console.log('Target table rows:', targetTable.length);

// 3. Decision matrix simulation
console.log('\\n=== When to Use ClickHouse? Decision Matrix ===');
const scenarios = [
  { use: 'Real-time dashboard (1B events/day)', fit: 'PERFECT', reason: 'Column store + pre-agg MVs' },
  { use: 'Log analytics (100TB logs)', fit: 'PERFECT', reason: 'Compression + fast full scans' },
  { use: 'Time-series metrics', fit: 'GREAT', reason: 'Sorted by time + codecs' },
  { use: 'User-facing product search', fit: 'POOR', reason: 'Use Elasticsearch instead' },
  { use: 'OLTP banking transactions', fit: 'TERRIBLE', reason: 'No ACID, slow updates' },
  { use: 'Frequent row updates', fit: 'POOR', reason: 'Mutations rewrite entire parts' },
  { use: 'Small dataset (< 1GB)', fit: 'OVERKILL', reason: 'PostgreSQL is simpler' },
  { use: 'Ad-hoc SQL analytics', fit: 'GREAT', reason: 'Fast scans, good SQL support' },
  { use: 'IoT sensor data', fit: 'PERFECT', reason: 'High ingest + time-series + compression' },
];
scenarios.forEach(s => {
  console.log('[' + s.fit.padEnd(9) + '] ' + s.use);
  console.log('           ' + s.reason);
});`,
    content: `
<h1>ClickHouse vs Alternatives & Production</h1>
<p>Choosing the right analytical database is an SDE3-level architecture decision. This section compares ClickHouse against alternatives, covers production operational concerns, and discusses common pitfalls that can turn a promising ClickHouse deployment into an operational nightmare.</p>

<h2>ClickHouse vs Elasticsearch</h2>
<table>
  <tr><th>Dimension</th><th>ClickHouse</th><th>Elasticsearch</th></tr>
  <tr><td>Primary use</td><td>Analytical queries (aggregation, GROUP BY)</td><td>Full-text search + log exploration</td></tr>
  <tr><td>Query language</td><td>SQL</td><td>Query DSL (JSON) + KQL</td></tr>
  <tr><td>Aggregation speed</td><td>10-100x faster</td><td>Slower for pure aggregations</td></tr>
  <tr><td>Full-text search</td><td>Basic (token/ngram indexes)</td><td>Excellent (inverted index, BM25, fuzzy)</td></tr>
  <tr><td>Storage efficiency</td><td>5-10x better compression</td><td>Large (inverted index overhead)</td></tr>
  <tr><td>Ingestion</td><td>Very high (millions/sec per node)</td><td>Moderate (indexing overhead)</td></tr>
  <tr><td>JOINs</td><td>Supported (hash, merge)</td><td>Not supported (denormalize)</td></tr>
  <tr><td>Operational complexity</td><td>Lower (simpler architecture)</td><td>Higher (shard allocation, mappings, GC)</td></tr>
  <tr><td>Schema</td><td>Strict (defined at CREATE TABLE)</td><td>Dynamic (schema-on-write)</td></tr>
  <tr><td>Cost (same workload)</td><td>3-10x cheaper</td><td>Expensive (RAM + disk for indices)</td></tr>
</table>

<p><strong>Verdict:</strong> Use ClickHouse for analytics/dashboards/aggregation. Use Elasticsearch for full-text search and log exploration (Kibana). Many companies use both: Elasticsearch for search/exploration, ClickHouse for dashboards/metrics.</p>

<h2>ClickHouse vs Apache Druid vs Apache Pinot</h2>
<table>
  <tr><th>Dimension</th><th>ClickHouse</th><th>Apache Druid</th><th>Apache Pinot</th></tr>
  <tr><td>SQL support</td><td>Full SQL dialect</td><td>Limited SQL (Druid SQL)</td><td>Multi-stage SQL (improving)</td></tr>
  <tr><td>JOINs</td><td>Supported</td><td>Limited (lookup joins only)</td><td>Limited (improving)</td></tr>
  <tr><td>Ingestion</td><td>Batch + real-time</td><td>Real-time native (Kafka)</td><td>Real-time native (Kafka)</td></tr>
  <tr><td>Upserts</td><td>ReplacingMergeTree</td><td>Not supported</td><td>Supported (upsert mode)</td></tr>
  <tr><td>Operational complexity</td><td>Single binary</td><td>Many components (broker, historical, coordinator, middleManager)</td><td>Many components (server, broker, controller, minion)</td></tr>
  <tr><td>Community</td><td>Largest, fastest-growing</td><td>Mature, Apache project</td><td>Growing, Apache project</td></tr>
  <tr><td>Cloud offering</td><td>ClickHouse Cloud</td><td>Imply Cloud</td><td>StarTree Cloud</td></tr>
  <tr><td>Exact count distinct</td><td>uniqExact (slow)</td><td>Not practical</td><td>Not practical</td></tr>
  <tr><td>Best for</td><td>Flexible analytics, SQL users</td><td>Real-time event streaming</td><td>User-facing analytics (LinkedIn-scale)</td></tr>
</table>

<h2>ClickHouse vs Cloud Data Warehouses</h2>
<table>
  <tr><th>Dimension</th><th>ClickHouse</th><th>BigQuery</th><th>Redshift</th><th>Snowflake</th></tr>
  <tr><td>Deployment</td><td>Self-hosted or Cloud</td><td>Serverless</td><td>Managed clusters</td><td>Serverless compute</td></tr>
  <tr><td>Latency</td><td>Sub-second</td><td>2-30 seconds (cold start)</td><td>Sub-second to seconds</td><td>Seconds</td></tr>
  <tr><td>Real-time ingest</td><td>Yes (native)</td><td>Streaming inserts (limited)</td><td>Yes (streaming ingestion)</td><td>Snowpipe</td></tr>
  <tr><td>Cost model</td><td>Server cost only</td><td>Per-query (bytes scanned)</td><td>Per-cluster-hour</td><td>Credits (compute + storage)</td></tr>
  <tr><td>Concurrency</td><td>Moderate (100s)</td><td>High (serverless)</td><td>Moderate</td><td>High (multi-cluster)</td></tr>
  <tr><td>Control</td><td>Full (tune everything)</td><td>None (black box)</td><td>Some</td><td>Some</td></tr>
  <tr><td>Vendor lock-in</td><td>None (open source)</td><td>High</td><td>High</td><td>High</td></tr>
</table>

<p><strong>Key insight:</strong> ClickHouse excels at sub-second latency for real-time dashboards (p50 &lt; 100ms). Cloud warehouses are better for batch analytics, ad-hoc exploration by analysts, and when you want zero operational overhead. Many companies use ClickHouse for real-time + cloud warehouse for batch/historical analysis.</p>

<h2>When to Use ClickHouse</h2>
<h3>Ideal Use Cases</h3>
<ul>
  <li><strong>Real-time analytics dashboards</strong> — sub-second queries over billions of rows</li>
  <li><strong>Time-series data</strong> — metrics, monitoring, IoT sensor data (excellent compression with Delta/DoubleDelta codecs)</li>
  <li><strong>Log analytics</strong> — alternative to Elasticsearch with 5-10x better storage efficiency</li>
  <li><strong>Product analytics</strong> — user behavior analysis, funnel analysis, cohort analysis</li>
  <li><strong>Ad tech / clickstream</strong> — high-volume event processing with real-time reporting</li>
  <li><strong>Network/security monitoring</strong> — flow data, DNS logs, threat detection</li>
  <li><strong>Financial analytics</strong> — market data analysis, risk calculations (read-heavy)</li>
</ul>

<h3>When NOT to Use ClickHouse</h3>
<ul>
  <li><strong>OLTP workloads</strong> — no ACID transactions, no row-level locking, slow point lookups</li>
  <li><strong>Frequent updates/deletes</strong> — mutations rewrite entire parts, very expensive</li>
  <li><strong>Full-text search</strong> — basic support only; use Elasticsearch or Typesense</li>
  <li><strong>Small datasets (&lt; 1GB)</strong> — PostgreSQL is simpler and sufficient</li>
  <li><strong>Graph queries</strong> — no graph engine; use Neo4j or Neptune</li>
  <li><strong>Blob storage</strong> — not designed for large binary objects</li>
  <li><strong>Strong consistency requirements</strong> — eventually consistent replication model</li>
</ul>

<h2>Production Considerations</h2>

<h3>Mutations (ALTER UPDATE/DELETE)</h3>
<p>Mutations are the most misunderstood ClickHouse feature. They are NOT like UPDATE/DELETE in PostgreSQL.</p>

<pre><code>-- This is NOT a fast operation:
ALTER TABLE events DELETE WHERE user_id = 12345;
ALTER TABLE events UPDATE status = 'cancelled' WHERE order_id = 999;

-- What actually happens:
-- 1. ClickHouse queues the mutation
-- 2. Asynchronously rewrites ALL parts that contain matching rows
-- 3. Each affected part is read entirely, filtered, and written as a new part
-- 4. Old parts are eventually removed

-- Check mutation progress:
SELECT * FROM system.mutations WHERE is_done = 0;

-- A single ALTER DELETE on a 1TB table can take HOURS
-- During this time, disk I/O is consumed by rewriting</code></pre>

<div class="warning-note">Never design a system that relies on frequent ALTER UPDATE/DELETE in ClickHouse. If you need mutable data, use CollapsingMergeTree or ReplacingMergeTree. If you must delete data, use TTL or DROP PARTITION (instant) rather than ALTER DELETE. One common anti-pattern: using ClickHouse as a primary database and running DELETE on every user deletion request — this will destroy performance.</div>

<h3>Buffer Tables for High-Frequency Inserts</h3>
<pre><code>-- Problem: inserting 10,000 times/second with 1 row each = 10,000 parts/second
-- This causes "too many parts" errors and merge pressure

-- Solution 1: Buffer table engine
CREATE TABLE events_buffer AS events
ENGINE = Buffer(default, events,
    16,        -- num_layers
    10, 100,   -- min/max seconds before flush
    10000, 1000000, -- min/max rows before flush
    10000000, 100000000 -- min/max bytes before flush
);

-- Insert into buffer (fast, in-memory)
INSERT INTO events_buffer VALUES (...);
-- Buffer automatically flushes to events table in batches

-- Solution 2: async_insert (preferred in newer versions)
SET async_insert = 1;
SET wait_for_async_insert = 0;  -- don't wait for batch
-- ClickHouse collects inserts and batches them automatically</code></pre>

<h3>Monitoring: System Tables</h3>
<pre><code>-- Essential system tables for monitoring
-- 1. Query performance
SELECT query, query_duration_ms, read_rows, read_bytes, memory_usage
FROM system.query_log WHERE type = 'QueryFinish'
ORDER BY query_duration_ms DESC LIMIT 10;

-- 2. Part count per table (too many parts = problem)
SELECT database, table, count() as parts, sum(rows) as total_rows,
       formatReadableSize(sum(bytes_on_disk)) as disk_size
FROM system.parts WHERE active
GROUP BY database, table ORDER BY parts DESC;

-- 3. Merge progress
SELECT database, table, elapsed, progress, num_parts, result_part_name
FROM system.merges;

-- 4. Replication status
SELECT database, table, is_leader, total_replicas, active_replicas,
       queue_size, inserts_in_queue, merges_in_queue
FROM system.replicas;

-- 5. Current queries
SELECT query_id, user, elapsed, read_rows, memory_usage, query
FROM system.processes;

-- 6. Disk usage
SELECT name, path, free_space, total_space,
       formatReadableSize(free_space) as free,
       formatReadableSize(total_space) as total
FROM system.disks;</code></pre>

<h3>Key Metrics to Monitor (Grafana Dashboard)</h3>
<table>
  <tr><th>Metric</th><th>Warning Threshold</th><th>Critical Threshold</th></tr>
  <tr><td>Parts per partition</td><td>> 300</td><td>> 600 (inserts will fail at 3000 in some versions)</td></tr>
  <tr><td>Merge queue size</td><td>> 50</td><td>> 200</td></tr>
  <tr><td>Replication lag (queue_size)</td><td>> 20</td><td>> 100</td></tr>
  <tr><td>ZooKeeper latency</td><td>> 50ms</td><td>> 200ms</td></tr>
  <tr><td>Query duration p99</td><td>> 5s</td><td>> 30s</td></tr>
  <tr><td>Memory usage</td><td>> 80%</td><td>> 90%</td></tr>
  <tr><td>Disk free space</td><td>&lt; 30%</td><td>&lt; 10%</td></tr>
  <tr><td>Active mutations</td><td>> 0 for &gt;1hr</td><td>> 0 for &gt;24hr</td></tr>
</table>

<h2>ClickHouse Cloud vs Self-Hosted</h2>
<table>
  <tr><th>Aspect</th><th>Self-Hosted</th><th>ClickHouse Cloud</th></tr>
  <tr><td>Operations</td><td>You manage everything</td><td>Fully managed</td></tr>
  <tr><td>Scaling</td><td>Manual (add nodes, rebalance)</td><td>Auto-scaling</td></tr>
  <tr><td>Cost</td><td>Lower at scale (your hardware)</td><td>Higher per-query, lower ops cost</td></tr>
  <tr><td>Storage</td><td>Local disks or S3-backed</td><td>Shared storage (S3)</td></tr>
  <tr><td>Compute/storage separation</td><td>Coupled</td><td>Separated (pay for each independently)</td></tr>
  <tr><td>Version upgrades</td><td>Manual, risky</td><td>Managed, zero-downtime</td></tr>
  <tr><td>Backups</td><td>You manage</td><td>Automated</td></tr>
  <tr><td>Multi-tenancy</td><td>DIY isolation</td><td>Built-in workload isolation</td></tr>
</table>

<h2>Common Pitfalls and Best Practices</h2>

<h3>Pitfalls</h3>
<ol>
  <li><strong>Too many small INSERTs</strong> — Each INSERT creates a part. 1000 inserts/sec = "too many parts" error. Use batching, Buffer tables, or async_insert.</li>
  <li><strong>Wrong ORDER BY</strong> — Cannot be changed without recreating the table. Most impactful decision.</li>
  <li><strong>Over-partitioning</strong> — PARTITION BY toYYYYMMDD(date) with 5 years of data = 1825 partitions = slow.</li>
  <li><strong>Using Nullable everywhere</strong> — 12.5% storage overhead per Nullable column, slower queries.</li>
  <li><strong>Relying on ReplacingMergeTree dedup without FINAL</strong> — Queries return duplicates until background merge runs.</li>
  <li><strong>Large JOINs</strong> — Right table loaded into memory. A 100GB dimension table = OOM.</li>
  <li><strong>Frequent mutations</strong> — ALTER UPDATE/DELETE rewrites parts. Design around immutability.</li>
  <li><strong>Not monitoring part count</strong> — Parts grow silently until inserts fail.</li>
</ol>

<h3>Best Practices</h3>
<ol>
  <li><strong>Batch inserts</strong> — Minimum 1000 rows per INSERT, ideally 10K-100K.</li>
  <li><strong>Choose ORDER BY carefully</strong> — Most filtered columns first, lowest cardinality first.</li>
  <li><strong>Use LowCardinality(String)</strong> — For columns with &lt; 10K unique values.</li>
  <li><strong>Prefer defaults over Nullable</strong> — Use 0 or empty string instead of NULL.</li>
  <li><strong>Use materialized views</strong> — Pre-aggregate for dashboard queries.</li>
  <li><strong>Use dictionaries</strong> — For dimension lookups instead of JOINs.</li>
  <li><strong>Monitor system tables</strong> — Especially system.parts, system.merges, system.replicas.</li>
  <li><strong>Use TTL for data lifecycle</strong> — Automatic cleanup of old data.</li>
  <li><strong>Test with production-scale data</strong> — ClickHouse behavior changes dramatically with data size.</li>
  <li><strong>Use CODEC per column</strong> — Delta for timestamps, Gorilla for floats, ZSTD for strings.</li>
</ol>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Your team is considering migrating from Elasticsearch to ClickHouse for log analytics. What are the key considerations?</div>
  <div class="qa-a">Benefits: (1) 5-10x better compression = massive storage cost savings. (2) Faster aggregation queries for dashboards. (3) SQL vs Query DSL = easier for most engineers. (4) Lower operational complexity (single binary vs ES cluster management). Challenges: (1) ClickHouse full-text search is basic — if you need fuzzy matching, relevance scoring, or autocomplete, keep Elasticsearch for those use cases. (2) Schema is strict in ClickHouse — no dynamic fields (you can use Map type as a workaround). (3) ClickHouse cannot do field-level inverted index lookups as efficiently — grep-style search on raw text is a full scan. (4) Existing Kibana dashboards need to be rebuilt (Grafana with ClickHouse plugin is the alternative). Recommendation: Hybrid approach — use ClickHouse for metrics dashboards and long-term log storage, keep Elasticsearch for ad-hoc log exploration and search.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Describe how you would design a multi-tenant analytics platform on ClickHouse.</div>
  <div class="qa-a">Design: (1) Single table with tenant_id as first column in ORDER BY — enables index pruning per tenant. (2) Shard by sipHash64(tenant_id) so tenant queries hit one shard. (3) Use row-level security (row policies) for access control: CREATE ROW POLICY ON events FOR SELECT USING tenant_id = currentUser(). (4) Set per-user quotas and limits (max_memory_usage, max_execution_time) to prevent one tenant from consuming all resources. (5) Use materialized views per-tenant for heavy dashboards. (6) Monitor per-tenant query patterns in system.query_log. Challenge: Large tenants can cause data skew. Mitigation: sub-shard large tenants by hashing a secondary column, or use dedicated tables/clusters for top-N tenants.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: A production ClickHouse table is showing "too many parts" errors. How do you diagnose and fix this?</div>
  <div class="qa-a">Diagnosis: (1) SELECT partition, count() FROM system.parts WHERE table='events' AND active GROUP BY partition ORDER BY count() DESC — find which partition has too many parts. (2) Check insert frequency — are you doing many small inserts? (3) Check system.merges — are merges keeping up? (4) Check max_parts_in_total setting. Fix: Immediate: OPTIMIZE TABLE events FINAL — forces merge (heavy, but reduces parts). Short-term: Enable async_insert or use Buffer table to batch inserts. Long-term: Fix the application to batch inserts (minimum 1000 rows per INSERT). If inserts come from Kafka, increase poll batch size. Check if over-partitioning is the cause (too many partitions = too many independent part directories that cannot merge across partitions).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a real-time analytics pipeline with ClickHouse?</div>
  <div class="qa-a">Architecture: Kafka → ClickHouse (via Kafka table engine or ClickHouse-Kafka connector) → Materialized views → Dashboard queries. Details: (1) Create a Kafka engine table that reads from Kafka topics. (2) Create materialized views that transform and insert data from the Kafka table into MergeTree tables. (3) Use AggregatingMergeTree with materialized views for pre-aggregated dashboards. (4) For real-time dashboards, query the raw or pre-aggregated tables directly — ClickHouse sub-second latency is sufficient. (5) Use Grafana with the ClickHouse data source for visualization. (6) Set up async_insert for any HTTP/API-based ingestion. Key consideration: the Kafka engine table consumes messages as a consumer group — ensure enough partitions for parallelism and monitor consumer lag.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the operational differences between running ClickHouse at 100GB vs 100TB?</div>
  <div class="qa-a">At 100GB, ClickHouse is forgiving: bad ORDER BY still gives acceptable performance, single node is sufficient, no sharding needed, merges are fast. At 100TB: (1) ORDER BY becomes critical — wrong key = full scans on terabytes. (2) You need sharding (data does not fit one node), which adds complexity (Distributed tables, shard key selection, rebalancing). (3) Merges consume significant I/O — monitor merge queue and background_pool_size. (4) Compression codecs matter — proper codec selection saves terabytes of disk. (5) Materialized views are essential — cannot afford to scan 100TB for every dashboard query. (6) ZooKeeper becomes a bottleneck if not properly sized. (7) Backup and disaster recovery is complex — 100TB takes hours to restore. (8) Schema changes (ALTER) can take hours because they may rewrite parts. (9) You need tiered storage (hot SSD + cold S3/HDD) to control costs.</div>
</div>
`
  },
];
