export const postgresql = [
  {
    id: 'pg-architecture',
    title: 'PostgreSQL Architecture',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Architecture: Exploring Data with Joins & Aggregations
-- Available tables: employees, departments, orders, customers, products

-- 1. Basic join: employees with their departments
SELECT e.id, e.name, d.name AS department, e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
ORDER BY e.salary DESC;

-- 2. Aggregation: department stats
SELECT d.name AS department,
       COUNT(e.id) AS emp_count,
       ROUND(AVG(e.salary), 2) AS avg_salary,
       SUM(e.salary) AS total_payroll
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY total_payroll DESC;

-- 3. Subquery: employees earning above their department average
SELECT e.name, e.salary, d.name AS department
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
);

-- 4. Multi-table join with aggregation
SELECT c.name AS customer,
       COUNT(o.id) AS order_count,
       ROUND(SUM(o.total), 2) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;`,
    content: `
<h1>PostgreSQL Architecture</h1>
<p>PostgreSQL is a powerful, open-source object-relational database system with over 35 years of active development. Understanding its internal architecture is critical for SDE3-level engineers who need to diagnose performance issues, plan capacity, and design systems that scale.</p>

<h2>Process Architecture</h2>
<p>PostgreSQL uses a <strong>multi-process architecture</strong> (not multi-threaded). Every client connection gets its own dedicated OS process.</p>

<pre><code>                    ┌─────────────────────────┐
   Client ──────────│     Postmaster (PID 1)   │
   Client ──────────│  (main listener process)  │
   Client ──────────│    Forks backend per conn  │
                    └────────┬────────────────┘
                             │ fork()
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Backend 1│  │ Backend 2│  │ Backend 3│
        │ (PID 101)│  │ (PID 102)│  │ (PID 103)│
        └──────────┘  └──────────┘  └──────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Shared Memory   │
                    │ (shared_buffers, │
                    │  WAL buffers,    │
                    │  CLOG, etc.)     │
                    └─────────────────┘</code></pre>

<h3>Key Processes</h3>
<table>
  <tr><th>Process</th><th>Role</th><th>Critical?</th></tr>
  <tr><td><strong>Postmaster</strong></td><td>Listens for connections, forks backend processes</td><td>Yes - parent of all</td></tr>
  <tr><td><strong>Backend Process</strong></td><td>One per client connection, executes queries</td><td>Per-connection</td></tr>
  <tr><td><strong>Background Writer</strong></td><td>Writes dirty buffers to disk periodically</td><td>Yes</td></tr>
  <tr><td><strong>WAL Writer</strong></td><td>Flushes WAL buffers to disk</td><td>Yes</td></tr>
  <tr><td><strong>Checkpointer</strong></td><td>Creates checkpoints, flushes all dirty pages</td><td>Yes</td></tr>
  <tr><td><strong>Autovacuum Launcher</strong></td><td>Starts autovacuum workers</td><td>Yes</td></tr>
  <tr><td><strong>Stats Collector</strong></td><td>Collects usage statistics</td><td>Helpful</td></tr>
  <tr><td><strong>Logical Replication Worker</strong></td><td>Handles logical replication</td><td>If replication used</td></tr>
</table>

<h2>Shared Memory</h2>
<p>Shared memory is the backbone of PostgreSQL's I/O performance. It is allocated at server start and shared by all backend processes.</p>

<h3>shared_buffers</h3>
<p>This is PostgreSQL's main data cache. When a backend needs to read a table page, it first checks shared_buffers. If it's not there (cache miss), it reads from the OS page cache or disk.</p>
<pre><code>-- Recommended: 25% of total RAM for dedicated DB server
-- Example for 64GB server:
shared_buffers = 16GB

-- Check current setting:
SHOW shared_buffers;

-- Check buffer hit ratio (should be > 99%):
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;</code></pre>

<h3>WAL Buffers</h3>
<p>WAL (Write-Ahead Log) buffers hold WAL records in memory before flushing to disk. Default is 1/32 of shared_buffers, capped at 64MB.</p>
<pre><code>wal_buffers = 64MB          -- Usually auto-tuned
wal_level = replica          -- minimal, replica, or logical
max_wal_size = 2GB           -- Trigger checkpoint if WAL grows past this
min_wal_size = 80MB</code></pre>

<h3>CLOG (Commit Log)</h3>
<p>The CLOG tracks the commit status of every transaction. Each transaction ID maps to 2 bits:</p>
<table>
  <tr><th>Status</th><th>Bits</th><th>Meaning</th></tr>
  <tr><td>IN_PROGRESS</td><td>00</td><td>Transaction still running</td></tr>
  <tr><td>COMMITTED</td><td>01</td><td>Transaction committed</td></tr>
  <tr><td>ABORTED</td><td>10</td><td>Transaction rolled back</td></tr>
  <tr><td>SUB_COMMITTED</td><td>11</td><td>Subtransaction committed</td></tr>
</table>

<h2>MVCC (Multi-Version Concurrency Control)</h2>
<p>MVCC is the foundation of PostgreSQL's concurrency model. Instead of locking rows for reads, PostgreSQL keeps multiple versions of each row and uses visibility rules to determine which version each transaction can see.</p>

<h3>How MVCC Works Internally</h3>
<pre><code>Every row (tuple) has hidden system columns:
┌─────────┬─────────┬──────────────────────────────────┐
│  xmin   │  xmax   │     actual row data              │
├─────────┼─────────┼──────────────────────────────────┤
│  100    │  0      │ ('Alice', 50000)                 │  ← Inserted by txn 100
│  100    │  105    │ ('Alice', 50000)                 │  ← Deleted/updated by txn 105
│  105    │  0      │ ('Alice', 60000)                 │  ← New version by txn 105
└─────────┴─────────┴──────────────────────────────────┘

xmin = transaction ID that created this row version
xmax = transaction ID that deleted/updated this row (0 if still live)

Visibility rule:
  A row is visible to transaction T if:
  1. xmin is committed AND xmin < T's snapshot
  2. xmax is either 0 (not deleted) OR xmax is not committed OR xmax > T's snapshot</code></pre>

<div class="warning-note">MVCC means UPDATE creates a new row version and marks the old one as dead. This is why VACUUM is critical — without it, dead rows accumulate and bloat the table.</div>

<h3>Transaction ID Wraparound</h3>
<p>PostgreSQL uses 32-bit transaction IDs (~4.2 billion). When IDs wrap around, old transactions could appear to be "in the future." PostgreSQL prevents this via <strong>aggressive VACUUM</strong> that freezes old transaction IDs.</p>
<pre><code>-- Check transaction ID age (danger if approaching 2 billion):
SELECT datname,
       age(datfrozenxid) AS xid_age,
       current_setting('autovacuum_freeze_max_age') AS freeze_max
FROM pg_database
ORDER BY age(datfrozenxid) DESC;</code></pre>

<h2>WAL (Write-Ahead Log)</h2>
<p>The WAL guarantees durability. Before any data modification reaches the actual data files, it is first written to the WAL. This ensures crash recovery is possible.</p>

<h3>WAL Write Flow</h3>
<pre><code>1. Backend modifies page in shared_buffers (dirty page)
2. WAL record is written to WAL buffer
3. On COMMIT:
   a. WAL buffer is flushed to WAL file on disk (fsync)
   b. Commit confirmation sent to client
4. Background writer / checkpointer eventually writes
   dirty data pages to disk
5. On CRASH:
   a. PostgreSQL replays WAL from last checkpoint
   b. Applies all committed changes
   c. Undoes all uncommitted changes</code></pre>

<h3>WAL Levels</h3>
<table>
  <tr><th>Level</th><th>Info Logged</th><th>Use Case</th></tr>
  <tr><td><strong>minimal</strong></td><td>Only crash recovery</td><td>Standalone, no replication</td></tr>
  <tr><td><strong>replica</strong></td><td>+ replication data</td><td>Streaming replication, PITR</td></tr>
  <tr><td><strong>logical</strong></td><td>+ logical decoding</td><td>Logical replication, CDC</td></tr>
</table>

<h2>VACUUM and Autovacuum</h2>
<p>VACUUM reclaims storage from dead tuples created by MVCC. Without VACUUM, tables and indexes bloat indefinitely.</p>

<h3>Types of VACUUM</h3>
<table>
  <tr><th>Command</th><th>What It Does</th><th>Locks?</th></tr>
  <tr><td><code>VACUUM</code></td><td>Marks dead tuples as reusable; does NOT return space to OS</td><td>No (concurrent)</td></tr>
  <tr><td><code>VACUUM FULL</code></td><td>Rewrites entire table, returns space to OS</td><td>ACCESS EXCLUSIVE lock</td></tr>
  <tr><td><code>VACUUM ANALYZE</code></td><td>VACUUM + update planner statistics</td><td>No</td></tr>
  <tr><td><code>VACUUM FREEZE</code></td><td>Freeze old transaction IDs to prevent wraparound</td><td>No</td></tr>
</table>

<h3>Autovacuum Tuning</h3>
<pre><code>-- Key autovacuum parameters:
autovacuum = on                           -- Don't turn this off!
autovacuum_vacuum_threshold = 50          -- Min dead tuples before vacuum
autovacuum_vacuum_scale_factor = 0.2      -- Fraction of table size
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1

-- Formula: vacuum triggers when
-- dead_tuples > threshold + scale_factor * table_size

-- For a table with 1M rows:
-- Vacuum triggers at: 50 + 0.2 * 1,000,000 = 200,050 dead tuples

-- For large tables, lower the scale_factor per-table:
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.01);</code></pre>

<div class="warning-note">Never disable autovacuum in production. If autovacuum falls behind, you risk transaction ID wraparound, which forces PostgreSQL to shut down to prevent data corruption.</div>

<h2>Connection Pooling</h2>
<p>Each PostgreSQL connection is a forked OS process consuming ~5-10MB RAM. Without pooling, 1000 connections = 5-10GB just for connections.</p>

<h3>PgBouncer vs pgpool-II</h3>
<table>
  <tr><th>Feature</th><th>PgBouncer</th><th>pgpool-II</th></tr>
  <tr><td>Architecture</td><td>Lightweight, single-process</td><td>Heavier, multi-process</td></tr>
  <tr><td>Pool modes</td><td>Session, Transaction, Statement</td><td>Session only</td></tr>
  <tr><td>Load balancing</td><td>No (single backend)</td><td>Yes (read queries)</td></tr>
  <tr><td>Failover</td><td>No built-in</td><td>Yes</td></tr>
  <tr><td>Memory usage</td><td>~2KB per connection</td><td>~fork per connection</td></tr>
  <tr><td>Best for</td><td>Connection pooling only</td><td>Pooling + HA + LB</td></tr>
</table>

<h3>PgBouncer Pool Modes</h3>
<pre><code>Session mode:    Connection assigned for entire client session
                 Most compatible, least efficient

Transaction mode: Connection returned to pool after each transaction
                  Best balance of compatibility and efficiency
                  ⚠️ Cannot use: SET, LISTEN/NOTIFY, prepared statements

Statement mode:  Connection returned after each statement
                 Most efficient, least compatible
                 ⚠️ No multi-statement transactions</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Explain PostgreSQL's process architecture. Why processes instead of threads?</div>
  <div class="qa-a">PostgreSQL uses a multi-process model where the postmaster forks a new backend process for each client connection. This design was chosen for: (1) Fault isolation — a crash in one backend doesn't bring down others; (2) Simplicity — no complex thread synchronization for shared state; (3) Portability — processes work consistently across all Unix systems. The downside is higher memory overhead per connection (~5-10MB per process), which is why connection pooling (PgBouncer) is essential in production. Modern PostgreSQL (15+) is exploring multi-threading for background workers but maintains process-per-connection for backends.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is MVCC and why does PostgreSQL use it?</div>
  <div class="qa-a">MVCC (Multi-Version Concurrency Control) allows readers and writers to not block each other. Instead of locking rows for reads, PostgreSQL keeps multiple physical versions of each row. Each version has xmin (creating transaction ID) and xmax (deleting transaction ID). A transaction sees only versions that were committed before its snapshot was taken. This provides excellent read concurrency but creates dead tuples that must be cleaned by VACUUM. The tradeoff is storage bloat and the need for regular maintenance.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens during a PostgreSQL crash recovery?</div>
  <div class="qa-a">On crash recovery: (1) PostgreSQL finds the last checkpoint in pg_control; (2) It reads WAL from that checkpoint forward; (3) For each WAL record, it checks if the corresponding data page is already up-to-date (using LSN comparison); (4) If the page is stale, it replays the WAL record (redo); (5) After all WAL is replayed, the database is in a consistent state with all committed transactions applied and all uncommitted transactions effectively rolled back. This is why WAL must be written to disk before a COMMIT is acknowledged — it guarantees durability.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you run VACUUM FULL, and what are the risks?</div>
  <div class="qa-a">VACUUM FULL rewrites the entire table to reclaim disk space back to the OS. Use it when a table has significant bloat (e.g., after a massive DELETE or UPDATE affecting most rows). The risks are: (1) It takes an ACCESS EXCLUSIVE lock, blocking ALL reads and writes; (2) It requires temporary disk space equal to the table size; (3) It rewrites all indexes; (4) For large tables, this can mean hours of downtime. Alternatives: pg_repack (online table rewrite), or simply let regular VACUUM reclaim space for reuse within the table (space is not returned to OS but is reusable by new inserts).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you size shared_buffers and what's the double-buffering issue?</div>
  <div class="qa-a">The general recommendation is 25% of total RAM for a dedicated database server. The "double-buffering" issue is that PostgreSQL has its own buffer cache (shared_buffers) and the OS also has a page cache. Data can exist in both caches simultaneously, wasting memory. Setting shared_buffers too high (e.g., 75% of RAM) leaves insufficient room for the OS page cache, which can degrade performance. The 25% guideline leaves enough room for the OS to cache frequently accessed data files. Monitor the buffer hit ratio (should be > 99%) via pg_statio_user_tables and adjust accordingly.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain transaction ID wraparound and how PostgreSQL prevents it.</div>
  <div class="qa-a">PostgreSQL uses 32-bit transaction IDs, giving ~4.2 billion unique IDs. With MVCC, visibility depends on comparing transaction IDs. If IDs wrap around, old committed transactions could appear to be "in the future" and become invisible — causing data loss. PostgreSQL prevents this by "freezing" old rows: marking them as definitively visible to all transactions regardless of ID comparison. Autovacuum does this automatically when a table approaches the freeze threshold (autovacuum_freeze_max_age, default 200M). If autovacuum falls behind, PostgreSQL will issue warnings, then eventually shut down (read-only mode) at 40M transactions before wraparound to force a manual VACUUM FREEZE.</div>
</div>`
  },
  {
    id: 'pg-indexing',
    title: 'PostgreSQL Indexing',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Indexing: Index Creation & Query Patterns
-- Available tables: employees, departments, orders, customers, products

-- 1. Create an index on employee salary
CREATE INDEX idx_emp_salary ON employees(salary);

-- 2. Query using the indexed column
SELECT name, salary FROM employees
WHERE salary > 80000
ORDER BY salary DESC;

-- 3. Composite index example
CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date);

-- 4. Query that benefits from composite index
SELECT o.id, c.name, o.total, o.order_date
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.customer_id = 1
ORDER BY o.order_date DESC;

-- 5. Partial index: only index active orders
CREATE INDEX idx_orders_pending ON orders(customer_id)
WHERE status = 'pending';

-- 6. Query using partial index
SELECT * FROM orders
WHERE status = 'pending' AND customer_id = 2;

-- 7. Expression index
CREATE INDEX idx_cust_lower_email ON customers(LOWER(email));

-- 8. Aggregation using indexed columns
SELECT p.category,
       COUNT(*) AS product_count,
       ROUND(AVG(p.price), 2) AS avg_price
FROM products p
GROUP BY p.category
ORDER BY avg_price DESC;`,
    content: `
<h1>PostgreSQL Indexing</h1>
<p>Indexes are the single most impactful tool for query performance. Understanding index types, when to use them, and their tradeoffs is essential for any SDE3 working with PostgreSQL at scale.</p>

<h2>Index Types Overview</h2>
<table>
  <tr><th>Index Type</th><th>Data Structure</th><th>Best For</th><th>Supports</th></tr>
  <tr><td><strong>B-Tree</strong></td><td>Balanced tree</td><td>Equality and range queries</td><td>=, <, >, <=, >=, BETWEEN, IN, IS NULL, LIKE 'prefix%'</td></tr>
  <tr><td><strong>Hash</strong></td><td>Hash table</td><td>Equality-only queries</td><td>= only</td></tr>
  <tr><td><strong>GIN</strong></td><td>Generalized Inverted</td><td>Full-text search, arrays, JSONB</td><td>@>, @@, ?</td></tr>
  <tr><td><strong>GiST</strong></td><td>Generalized Search Tree</td><td>Geometric, full-text, range types</td><td><<, >>, ~=, &&</td></tr>
  <tr><td><strong>BRIN</strong></td><td>Block Range</td><td>Very large naturally ordered tables</td><td>Time-series, sequential IDs</td></tr>
  <tr><td><strong>SP-GiST</strong></td><td>Space-Partitioned GiST</td><td>Non-balanced structures (quad-trees, radix trees)</td><td>IP ranges, phone numbers</td></tr>
</table>

<h2>B-Tree Index (Default)</h2>
<p>B-Tree is the default and most commonly used index type. It maintains sorted data and supports range queries efficiently.</p>

<pre><code>-- Basic B-Tree index
CREATE INDEX idx_emp_salary ON employees(salary);

-- Composite B-Tree index (column order matters!)
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);

-- Unique index (also enforces uniqueness constraint)
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Index with sort order specification
CREATE INDEX idx_emp_hire_desc ON employees(hire_date DESC NULLS LAST);</code></pre>

<h3>B-Tree Internal Structure</h3>
<pre><code>              ┌────────────────────┐
              │  Root Page          │
              │  [30] [60] [90]     │
              └──┬────┬────┬────┬──┘
                 │    │    │    │
         ┌───────┘    │    │    └───────┐
         ▼            ▼    ▼            ▼
   ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
   │ Internal │ │Internal │ │Internal │ │ Internal │
   │ [10][20] │ │[40][50] │ │[70][80] │ │[95][99]  │
   └──┬───┬───┘ └──┬──┬───┘ └──┬──┬───┘ └──┬───┬───┘
      │   │        │  │        │  │        │   │
      ▼   ▼        ▼  ▼        ▼  ▼        ▼   ▼
   ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
   │Leaf │←→│Leaf │←→│Leaf │←→│Leaf │  (doubly linked)
   │Pages│     │Pages│     │Pages│     │Pages│
   └─────┘     └─────┘     └─────┘     └─────┘

   Each leaf page contains: (key, pointer to heap tuple)
   Leaf pages are linked for efficient range scans.</code></pre>

<h2>Hash Index</h2>
<pre><code>-- Hash index: only useful for equality comparisons
CREATE INDEX idx_cust_email_hash ON customers USING hash (email);

-- This query uses the hash index:
SELECT * FROM customers WHERE email = 'alice@example.com';

-- This query CANNOT use the hash index (range query):
SELECT * FROM customers WHERE email > 'a' AND email < 'b';</code></pre>
<div class="warning-note">Before PostgreSQL 10, hash indexes were not crash-safe (not WAL-logged). Always use PostgreSQL 10+ if you rely on hash indexes. Even then, B-Tree is usually preferred because it handles both equality and range queries.</div>

<h2>GIN (Generalized Inverted Index)</h2>
<p>GIN indexes are ideal for values that contain multiple elements (arrays, JSONB, full-text search vectors).</p>
<pre><code>-- Full-text search
CREATE INDEX idx_articles_fts ON articles USING gin(to_tsvector('english', body));
SELECT * FROM articles WHERE to_tsvector('english', body) @@ to_tsquery('postgres & replication');

-- JSONB containment
CREATE INDEX idx_events_data ON events USING gin(data);
SELECT * FROM events WHERE data @> '{"type": "click"}';

-- Array contains
CREATE INDEX idx_tags ON posts USING gin(tags);
SELECT * FROM posts WHERE tags @> ARRAY['postgresql'];</code></pre>

<h3>GIN vs GiST for Full-Text Search</h3>
<table>
  <tr><th>Aspect</th><th>GIN</th><th>GiST</th></tr>
  <tr><td>Build time</td><td>Slower (3x)</td><td>Faster</td></tr>
  <tr><td>Lookup speed</td><td>Faster (3x)</td><td>Slower</td></tr>
  <tr><td>Index size</td><td>Larger (2-3x)</td><td>Smaller</td></tr>
  <tr><td>Update speed</td><td>Slower</td><td>Faster</td></tr>
  <tr><td>Best for</td><td>Read-heavy, static data</td><td>Write-heavy, frequently updated</td></tr>
</table>

<h2>BRIN (Block Range Index)</h2>
<p>BRIN stores summary info (min/max) for ranges of physical table blocks. Extremely small index size for naturally ordered data.</p>
<pre><code>-- Perfect for time-series data where rows are inserted in order
CREATE INDEX idx_logs_created ON logs USING brin(created_at);

-- BRIN index size comparison for 1 billion rows:
-- B-Tree: ~21 GB
-- BRIN:   ~60 KB (!!)

-- But BRIN only works well when physical order correlates with logical order.
-- If data is randomly ordered, BRIN scans too many blocks.</code></pre>

<h2>Partial Indexes</h2>
<p>Index only a subset of rows. Smaller index, faster updates, targeted optimization.</p>
<pre><code>-- Only index active orders (maybe 5% of all orders)
CREATE INDEX idx_active_orders ON orders(customer_id, order_date)
WHERE status = 'active';

-- Query MUST include the WHERE clause to use this index:
SELECT * FROM orders
WHERE status = 'active' AND customer_id = 42;  -- Uses partial index ✓

SELECT * FROM orders
WHERE customer_id = 42;  -- Cannot use partial index ✗</code></pre>

<h2>Expression Indexes</h2>
<pre><code>-- Index on a function/expression result
CREATE INDEX idx_emp_lower_name ON employees(LOWER(name));

-- This query uses the expression index:
SELECT * FROM employees WHERE LOWER(name) = 'alice';

-- This query does NOT use it (different expression):
SELECT * FROM employees WHERE name = 'Alice';</code></pre>

<h2>Covering Indexes (INCLUDE)</h2>
<p>PostgreSQL 11+ supports INCLUDE columns that are stored in the index leaf pages but not part of the search key. This enables index-only scans for queries that need additional columns.</p>
<pre><code>-- Without INCLUDE: index-only scan not possible if SELECT needs 'name'
CREATE INDEX idx_emp_dept ON employees(department_id);

-- With INCLUDE: enables index-only scan
CREATE INDEX idx_emp_dept_covering ON employees(department_id) INCLUDE (name, salary);

-- This query can now be served entirely from the index:
SELECT name, salary FROM employees WHERE department_id = 5;
-- No need to visit the heap (table) at all!</code></pre>

<h2>Index-Only Scans</h2>
<p>When all columns needed by a query are in the index, PostgreSQL can skip reading the heap table entirely. This is dramatically faster.</p>
<pre><code>-- Requirements for index-only scan:
-- 1. All SELECT columns must be in the index (key or INCLUDE)
-- 2. All WHERE columns must be in the index
-- 3. The visibility map must be up-to-date (VACUUM keeps it current)

EXPLAIN ANALYZE
SELECT department_id, salary FROM employees WHERE department_id = 3;
-- If index on (department_id) INCLUDE (salary) exists:
--   -> Index Only Scan using idx_emp_dept_covering
--      Heap Fetches: 0  ← this means true index-only scan!</code></pre>

<div class="warning-note">Index-only scans require the visibility map to be up-to-date. If VACUUM hasn't run recently, PostgreSQL must still check the heap to verify tuple visibility, shown as "Heap Fetches" > 0 in EXPLAIN output.</div>

<h2>Composite Index Column Order</h2>
<p>The order of columns in a composite index critically affects which queries can use it.</p>
<pre><code>CREATE INDEX idx_abc ON table(a, b, c);

-- Can use this index:
WHERE a = 1                        ✓  (leftmost prefix)
WHERE a = 1 AND b = 2              ✓  (leftmost prefix)
WHERE a = 1 AND b = 2 AND c = 3   ✓  (full match)
WHERE a = 1 AND c = 3              ✓  (a filtered, c scanned within a)

-- Cannot efficiently use this index:
WHERE b = 2                        ✗  (skips leading column)
WHERE c = 3                        ✗  (skips leading columns)
WHERE b = 2 AND c = 3              ✗  (skips leading column)

-- Column order strategy:
-- 1. Equality columns first (WHERE x = val)
-- 2. Range/inequality column last (WHERE y > val)
-- 3. High cardinality columns before low cardinality</code></pre>

<h2>When NOT to Use Indexes</h2>
<ul>
  <li><strong>Small tables</strong> — Sequential scan is faster for tables with < few thousand rows</li>
  <li><strong>Low selectivity</strong> — If a query returns > 10-15% of rows, a seq scan is often faster</li>
  <li><strong>Write-heavy tables</strong> — Each index adds overhead to INSERT/UPDATE/DELETE</li>
  <li><strong>Rarely queried columns</strong> — Index maintenance cost without query benefit</li>
  <li><strong>Highly volatile tables</strong> — Frequent UPDATEs create dead index entries</li>
</ul>

<h2>EXPLAIN ANALYZE Reading</h2>
<pre><code>EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.name, d.name
FROM employees e JOIN departments d ON e.department_id = d.id
WHERE e.salary > 90000;

-- Output breakdown:
-- Hash Join  (cost=1.09..2.34 rows=5 width=64)
--            (actual time=0.045..0.062 rows=3 loops=1)
--   ↑ cost: startup..total (in arbitrary units)
--   ↑ actual time: startup..total (in milliseconds)
--   ↑ rows: estimated vs actual
--   Hash Cond: (e.department_id = d.id)
--   ->  Seq Scan on employees e
--         Filter: (salary > 90000)
--         Rows Removed by Filter: 97
--   ->  Hash
--         ->  Seq Scan on departments d
--               Buckets: 1024
-- Planning Time: 0.2 ms
-- Execution Time: 0.1 ms</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: You have a table with 500M rows and queries filter on (tenant_id, created_at). What index strategy would you use?</div>
  <div class="qa-a">For a multi-tenant time-series table at this scale: (1) Create a composite B-Tree index on (tenant_id, created_at DESC) — tenant_id first for equality, created_at second for range scans; (2) Consider partitioning by tenant_id or created_at range, with local indexes on each partition; (3) If queries always filter on tenant_id, a partial BRIN index per tenant could save enormous space; (4) Add INCLUDE columns for frequently selected fields to enable index-only scans; (5) Set a lower autovacuum_vacuum_scale_factor (0.01) to keep the visibility map current for index-only scans. Monitor with pg_stat_user_indexes to verify the index is actually being used.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a GIN index and a B-Tree index? When would you choose GIN?</div>
  <div class="qa-a">B-Tree indexes work on scalar values where each row maps to one index entry. GIN (Generalized Inverted Index) is designed for composite/container values where a single row can have multiple keys (arrays, JSONB, full-text search). GIN builds an inverted index: it maps each element to the set of rows containing it. Choose GIN for: full-text search (tsvector), JSONB containment queries (@>), array operations (@>, &&), or trigram similarity searches. GIN is slower to build and update than B-Tree but much faster for lookups on multi-valued data. For write-heavy workloads on multi-valued data, consider GiST as it has faster updates at the cost of slower reads.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain BRIN indexes. When are they a game-changer and when do they fail?</div>
  <div class="qa-a">BRIN (Block Range INdex) stores min/max values for ranges of physical disk blocks (default 128 pages per range). For a 1TB table, a B-Tree index might be 20GB while a BRIN index is just a few MB. BRIN is a game-changer for: time-series data inserted in order (logs, events, sensor data), auto-increment IDs, or any column where physical order correlates with logical order. BRIN fails when: data is randomly ordered (high physical-to-logical correlation is broken), data has been heavily updated causing out-of-order storage, or queries need exact lookups rather than range scans. You can check correlation with: SELECT correlation FROM pg_stats WHERE tablename = 'your_table' AND attname = 'your_column' — values close to 1.0 or -1.0 are ideal for BRIN.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does a covering index with INCLUDE differ from just adding columns to the index key?</div>
  <div class="qa-a">When you add columns to the index key (e.g., CREATE INDEX ON t(a, b, c)), all columns participate in the sort order and can be used for filtering. With INCLUDE (e.g., CREATE INDEX ON t(a) INCLUDE (b, c)), only 'a' is in the search tree — b and c are stored only in leaf pages. Differences: (1) INCLUDE columns don't affect sort order or search; (2) INCLUDE columns don't have the B-Tree 'one-third of a page' size limit; (3) INCLUDE avoids bloating the tree's internal pages with data only needed at the leaves; (4) INCLUDE columns can use data types that don't have a B-Tree operator class. Use INCLUDE when you need columns for SELECT but never filter or sort on them. Use key columns when you filter or sort on them.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: You notice a query is doing an Index Scan instead of an Index Only Scan. What could be wrong?</div>
  <div class="qa-a">Several possibilities: (1) The index doesn't contain all columns needed by the query — add INCLUDE columns; (2) The visibility map is out of date — run VACUUM on the table; (3) Too many recent modifications have dirtied the visibility map — check pg_stat_user_tables.n_dead_tup and ensure autovacuum is running frequently enough; (4) The query references a column not in the index in a WHERE, SELECT, or ORDER BY clause; (5) For expression indexes, the exact expression must match. To diagnose: run EXPLAIN (ANALYZE, BUFFERS) and look at "Heap Fetches" — if it's non-zero even with all columns in the index, it's a visibility map issue. Running VACUUM ANALYZE on the table and retrying usually resolves it.</div>
</div>`
  },
  {
    id: 'pg-query-optimization',
    title: 'PostgreSQL Query Optimization',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Query Optimization Patterns
-- Available tables: employees, departments, orders, customers, products

-- 1. JOIN with filtering and ordering
SELECT e.name, e.salary, d.name AS department
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
WHERE e.salary > 60000
ORDER BY e.salary DESC;

-- 2. Subquery vs JOIN (compare approaches)
-- Approach A: Subquery
SELECT name, salary FROM employees
WHERE department_id IN (
  SELECT id FROM departments WHERE budget > 200000
);

-- Approach B: JOIN (often more efficient)
SELECT e.name, e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE d.budget > 200000;

-- 3. Window function: rank employees by salary within department
SELECT e.name, e.salary, d.name AS dept,
       RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- 4. CTE (Common Table Expression)
WITH dept_stats AS (
  SELECT department_id,
         AVG(salary) AS avg_salary,
         COUNT(*) AS emp_count
  FROM employees
  GROUP BY department_id
)
SELECT d.name, ds.avg_salary, ds.emp_count
FROM dept_stats ds
JOIN departments d ON ds.department_id = d.id
WHERE ds.emp_count > 1
ORDER BY ds.avg_salary DESC;

-- 5. Complex: top customer per product category
SELECT p.category, c.name AS top_customer, sub.total_spent
FROM (
  SELECT o.customer_id, p2.category,
         SUM(o.total) AS total_spent,
         RANK() OVER (PARTITION BY p2.category ORDER BY SUM(o.total) DESC) AS rnk
  FROM orders o
  JOIN products p2 ON o.product_id = p2.id
  GROUP BY o.customer_id, p2.category
) sub
JOIN customers c ON sub.customer_id = c.id
JOIN products p ON p.category = sub.category
WHERE sub.rnk = 1
GROUP BY p.category, c.name, sub.total_spent;`,
    content: `
<h1>PostgreSQL Query Optimization</h1>
<p>Query optimization is the most impactful skill for database performance. An SDE3 must understand how the query planner works, read execution plans, and systematically optimize slow queries.</p>

<h2>EXPLAIN / EXPLAIN ANALYZE</h2>
<p>EXPLAIN shows the planned execution path. EXPLAIN ANALYZE actually runs the query and shows real timing.</p>

<pre><code>-- Show plan only (doesn't execute)
EXPLAIN SELECT * FROM employees WHERE salary > 80000;

-- Execute and show actual times + row counts
EXPLAIN ANALYZE SELECT * FROM employees WHERE salary > 80000;

-- Full diagnostic output
EXPLAIN (ANALYZE, BUFFERS, TIMING, VERBOSE, FORMAT TEXT)
SELECT * FROM employees WHERE salary > 80000;</code></pre>

<h3>Reading EXPLAIN Output</h3>
<pre><code>Hash Join  (cost=3.25..8.50 rows=10 width=72) (actual time=0.05..0.08 rows=8 loops=1)
  ↑ node type   ↑ estimated cost  ↑ est. rows    ↑ actual time    ↑ actual rows

  cost=STARTUP..TOTAL
    startup: cost before first row can be emitted
    total:   cost to emit all rows
    (units are arbitrary but proportional to disk page fetches)

  rows: estimated by planner vs actual from execution

  width: average row size in bytes

  loops: how many times this node was executed (important for nested loops)

  Buffers: shared hit=42 read=3
    shared hit: pages found in shared_buffers (cache hit)
    read: pages read from OS (may still be in OS page cache)
    written: pages written (evicted dirty buffers)</code></pre>

<h2>Scan Types</h2>
<table>
  <tr><th>Scan Type</th><th>How It Works</th><th>When Used</th></tr>
  <tr><td><strong>Seq Scan</strong></td><td>Reads entire table sequentially</td><td>No suitable index, or large portion of table needed</td></tr>
  <tr><td><strong>Index Scan</strong></td><td>Traverses index, then fetches each matching row from heap</td><td>Selective queries with suitable index</td></tr>
  <tr><td><strong>Index Only Scan</strong></td><td>Reads only from index (no heap access)</td><td>All needed columns are in the index + visibility map is current</td></tr>
  <tr><td><strong>Bitmap Index Scan</strong></td><td>Scans index, builds bitmap of matching pages, then fetches pages</td><td>Moderate selectivity, or OR conditions across multiple indexes</td></tr>
  <tr><td><strong>TID Scan</strong></td><td>Fetches by physical tuple ID</td><td>WHERE ctid = '(0,1)' (rare)</td></tr>
</table>

<h3>Bitmap Scan Deep Dive</h3>
<pre><code>-- Bitmap scan is two-phase:
-- Phase 1: Bitmap Index Scan - scan index, build bitmap of matching pages
-- Phase 2: Bitmap Heap Scan - fetch those pages, recheck conditions

EXPLAIN ANALYZE
SELECT * FROM orders WHERE total > 100 AND total < 200;

-- Output:
-- Bitmap Heap Scan on orders
--   Recheck Cond: (total > 100 AND total < 200)
--   -> Bitmap Index Scan on idx_orders_total
--        Index Cond: (total > 100 AND total < 200)

-- Key insight: bitmap scan fetches pages in physical order,
-- avoiding random I/O. It can also combine multiple indexes:

-- BitmapAnd / BitmapOr: combines bitmaps from different indexes
SELECT * FROM orders WHERE customer_id = 5 OR total > 500;
-- -> BitmapOr
--      -> Bitmap Index Scan on idx_orders_customer
--      -> Bitmap Index Scan on idx_orders_total</code></pre>

<h2>Join Algorithms</h2>
<p>PostgreSQL has three join algorithms. The planner picks the best one based on table sizes, available indexes, and statistics.</p>

<table>
  <tr><th>Algorithm</th><th>How It Works</th><th>Best When</th><th>Cost</th></tr>
  <tr><td><strong>Nested Loop</strong></td><td>For each row in outer, scan inner table</td><td>Small outer table, indexed inner table</td><td>O(N * M) worst, O(N * log M) with index</td></tr>
  <tr><td><strong>Hash Join</strong></td><td>Build hash table from smaller table, probe with larger</td><td>No useful index, one table fits in work_mem</td><td>O(N + M)</td></tr>
  <tr><td><strong>Merge Join</strong></td><td>Sort both tables, merge in order</td><td>Both tables already sorted, or sort is cheap</td><td>O(N log N + M log M)</td></tr>
</table>

<pre><code>-- Force specific join method (for testing, not production!):
SET enable_hashjoin = off;
SET enable_nestloop = off;
SET enable_mergejoin = off;

-- Increase work_mem to allow larger hash tables:
SET work_mem = '256MB';  -- Per-operation, not total!</code></pre>

<div class="warning-note">work_mem is allocated per sort/hash operation, not per query or per connection. A complex query with 10 sorts could use 10 * work_mem. Setting it too high (e.g., 1GB) with 100 connections could exhaust server memory.</div>

<h2>CTE vs Subquery Performance</h2>
<p>Before PostgreSQL 12, CTEs were always optimization fences (materialized). PostgreSQL 12+ can inline CTEs.</p>

<pre><code>-- PostgreSQL 12+: CTE is inlined (optimized like a subquery)
WITH active_customers AS (
  SELECT * FROM customers WHERE created_at > '2024-01-01'
)
SELECT * FROM active_customers WHERE city = 'New York';
-- Planner can push WHERE city = 'New York' into the CTE scan

-- Force materialization (old behavior):
WITH active_customers AS MATERIALIZED (
  SELECT * FROM customers WHERE created_at > '2024-01-01'
)
SELECT * FROM active_customers WHERE city = 'New York';
-- CTE is computed first, then filtered — may be slower

-- Force inlining:
WITH active_customers AS NOT MATERIALIZED (
  SELECT * FROM customers WHERE created_at > '2024-01-01'
)
SELECT * FROM active_customers WHERE city = 'New York';</code></pre>

<h3>When to Materialize a CTE</h3>
<ul>
  <li>CTE is referenced multiple times — materialize to avoid recomputation</li>
  <li>CTE result is small but expensive to compute</li>
  <li>You need to prevent the planner from pushing predicates into the CTE</li>
</ul>

<h2>Query Planner Statistics</h2>
<pre><code>-- View planner stats for a column:
SELECT tablename, attname,
       n_distinct,       -- estimated number of distinct values
       most_common_vals,  -- most common values
       most_common_freqs, -- frequency of most common values
       correlation        -- physical vs logical ordering (-1 to 1)
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';

-- Update statistics:
ANALYZE orders;

-- Increase statistics target for better estimates on specific columns:
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
-- Default is 100. Higher = more accurate but slower ANALYZE.</code></pre>

<h2>Common Anti-Patterns</h2>

<h3>1. SELECT * (fetching unnecessary columns)</h3>
<pre><code>-- Bad: fetches all columns, prevents index-only scans
SELECT * FROM employees WHERE department_id = 5;

-- Good: select only needed columns
SELECT name, salary FROM employees WHERE department_id = 5;</code></pre>

<h3>2. N+1 Query Problem</h3>
<pre><code>-- Bad: N+1 queries from application code
for dept in departments:
    employees = SELECT * FROM employees WHERE department_id = dept.id;

-- Good: single query with JOIN
SELECT d.name, e.name, e.salary
FROM departments d
JOIN employees e ON d.id = e.department_id;</code></pre>

<h3>3. Functions on Indexed Columns</h3>
<pre><code>-- Bad: function on column prevents index usage
SELECT * FROM employees WHERE LOWER(name) = 'alice';
-- → Seq Scan (unless expression index exists)

-- Good: create expression index
CREATE INDEX idx_emp_lower_name ON employees(LOWER(name));

-- Or: normalize data on write
-- Store lowercase in a separate column with a regular index</code></pre>

<h3>4. Implicit Type Casting</h3>
<pre><code>-- Bad: column is INTEGER but compared to TEXT
SELECT * FROM employees WHERE id = '42';
-- May prevent index usage due to implicit cast

-- Good: use correct types
SELECT * FROM employees WHERE id = 42;</code></pre>

<h3>5. OR Conditions on Different Columns</h3>
<pre><code>-- Bad: OR across different columns — hard to index
SELECT * FROM orders WHERE customer_id = 5 OR total > 1000;

-- Better: use UNION ALL (each part can use its own index)
SELECT * FROM orders WHERE customer_id = 5
UNION ALL
SELECT * FROM orders WHERE total > 1000 AND customer_id != 5;</code></pre>

<h3>6. OFFSET for Pagination</h3>
<pre><code>-- Bad: OFFSET scans and discards rows
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;
-- Must scan 100,020 rows, discard 100,000

-- Good: keyset pagination (cursor-based)
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
-- Index scan, fetches exactly 20 rows</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: A query is doing a Seq Scan on a 100M row table despite having an index. What could be wrong?</div>
  <div class="qa-a">Several possibilities: (1) The query returns too many rows — the planner estimates > 10-15% of the table, so seq scan is faster than random I/O from index scan; (2) Statistics are stale — run ANALYZE to update pg_stats; (3) The WHERE clause uses a function on the indexed column (e.g., WHERE LOWER(name) = 'x') — create an expression index; (4) Type mismatch causing implicit cast; (5) The table was recently loaded and needs ANALYZE; (6) random_page_cost is too high for your SSD storage — lower it (1.1 for SSD vs default 4.0); (7) work_mem or effective_cache_size are misconfigured; (8) The index doesn't match the query's leftmost column requirement for composite indexes.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between Nested Loop, Hash Join, and Merge Join. When does the planner choose each?</div>
  <div class="qa-a">Nested Loop: iterates outer table, for each row does a lookup in inner table. Best when outer is small and inner has an index (O(N*logM)). Hash Join: builds a hash table from the smaller table, then probes it for each row of the larger table. Best when no useful indexes exist and one table fits in work_mem (O(N+M)). Merge Join: sorts both tables then merges. Best when both tables are already sorted (from an index or previous sort) or when both are large and sorted merge is cheaper than hash. The planner uses statistics (row counts, distinct values) and cost parameters (seq_page_cost, random_page_cost, cpu_tuple_cost) to estimate the cheapest plan. You can influence it by creating indexes, adjusting work_mem, or updating statistics.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you optimize a slow dashboard query that joins 5 tables with multiple aggregations?</div>
  <div class="qa-a">Systematic approach: (1) Run EXPLAIN (ANALYZE, BUFFERS) to identify the bottleneck node; (2) Check if statistics are current (ANALYZE the tables); (3) Look for seq scans that should be index scans — add missing indexes; (4) Check join order — sometimes restructuring joins or adding indexes changes the plan; (5) Increase work_mem if you see sorts spilling to disk ("Sort Method: external merge"); (6) Consider materialized views for pre-computed aggregations (REFRESH MATERIALIZED VIEW CONCURRENTLY); (7) If the query is for a dashboard, consider caching at the application layer; (8) Break complex CTEs into temporary tables with indexes if the planner makes bad cardinality estimates; (9) Check for implicit casts, functions on indexed columns, or unnecessary DISTINCT/ORDER BY operations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the impact of work_mem and how do you tune it?</div>
  <div class="qa-a">work_mem controls the maximum memory available for internal sort operations and hash tables before spilling to temporary disk files. Default is 4MB. Impact: (1) Too low: sorts and hash joins spill to disk (visible as "Sort Method: external merge Disk" in EXPLAIN), dramatically slower; (2) Too high: with many concurrent queries, total memory usage can exceed available RAM (work_mem * concurrent_operations). Tuning strategy: set the global default conservatively (e.g., 32-64MB), then use SET LOCAL work_mem = '256MB' for specific expensive queries. Monitor with log_temp_files = 0 to log all temp file usage. Calculate: available_ram / max_connections / avg_sorts_per_query = safe work_mem.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why is OFFSET-based pagination problematic and what are the alternatives?</div>
  <div class="qa-a">OFFSET N forces PostgreSQL to scan and discard N rows before returning results. For OFFSET 1000000, it scans over a million rows. Performance degrades linearly with page depth. Alternatives: (1) Keyset pagination (cursor-based): WHERE id > last_seen_id ORDER BY id LIMIT 20 — uses an index scan, constant time regardless of page depth; (2) For complex sorts: WHERE (sort_col, id) > (last_sort_val, last_id) ORDER BY sort_col, id LIMIT 20; (3) Materialized page numbers using a helper table; (4) Estimated counts with EXPLAIN for total row counts instead of COUNT(*). Keyset pagination is the standard recommendation but requires a unique, sortable column combination and doesn't support jumping to arbitrary pages.</div>
</div>`
  },
  {
    id: 'pg-transactions',
    title: 'PostgreSQL Transactions & Concurrency',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Transactions & Concurrency
-- Available tables: employees, departments, orders, customers, products

-- 1. Basic transaction: transfer budget between departments
BEGIN;
  UPDATE departments SET budget = budget - 10000 WHERE id = 1;
  UPDATE departments SET budget = budget + 10000 WHERE id = 2;
COMMIT;

-- Verify the transfer
SELECT id, name, budget FROM departments WHERE id IN (1, 2);

-- 2. Transaction with savepoint (partial rollback)
BEGIN;
  UPDATE employees SET salary = salary * 1.10 WHERE department_id = 1;

  SAVEPOINT before_dept2;
  UPDATE employees SET salary = salary * 1.20 WHERE department_id = 2;

  -- Oops, 20% is too much, rollback just dept 2
  ROLLBACK TO SAVEPOINT before_dept2;
  UPDATE employees SET salary = salary * 1.05 WHERE department_id = 2;
COMMIT;

-- Verify salaries
SELECT e.name, e.salary, d.name AS dept
FROM employees e
JOIN departments d ON e.department_id = d.id
ORDER BY d.name, e.salary DESC;

-- 3. Demonstrate isolation: read committed behavior
-- Session sees only committed data
SELECT name, salary FROM employees WHERE id = 1;

-- 4. Locking: SELECT FOR UPDATE
BEGIN;
  SELECT * FROM products WHERE id = 1 FOR UPDATE;
  -- This row is now locked until COMMIT/ROLLBACK
  UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;

SELECT * FROM products WHERE id = 1;`,
    content: `
<h1>PostgreSQL Transactions & Concurrency</h1>
<p>Transaction management and concurrency control are fundamental to building reliable systems. Understanding how PostgreSQL implements ACID properties through MVCC is essential for SDE3 interviews.</p>

<h2>ACID Properties Deep Dive</h2>
<table>
  <tr><th>Property</th><th>Meaning</th><th>PostgreSQL Implementation</th></tr>
  <tr><td><strong>Atomicity</strong></td><td>All or nothing — transaction fully succeeds or fully rolls back</td><td>WAL + CLOG: uncommitted changes are invisible; rollback marks transaction as aborted in CLOG</td></tr>
  <tr><td><strong>Consistency</strong></td><td>Database moves from one valid state to another</td><td>Constraints (CHECK, FK, UNIQUE, NOT NULL) enforced at statement end or transaction end (DEFERRED)</td></tr>
  <tr><td><strong>Isolation</strong></td><td>Concurrent transactions don't interfere</td><td>MVCC with snapshot isolation; multiple isolation levels available</td></tr>
  <tr><td><strong>Durability</strong></td><td>Committed data survives crashes</td><td>WAL is fsync'd to disk before COMMIT returns; crash recovery replays WAL</td></tr>
</table>

<h2>Isolation Levels</h2>
<p>PostgreSQL supports all four SQL standard isolation levels, but internally implements only three distinct behaviors.</p>

<table>
  <tr><th>Level</th><th>Dirty Read</th><th>Non-Repeatable Read</th><th>Phantom Read</th><th>Serialization Anomaly</th></tr>
  <tr><td><strong>Read Uncommitted</strong></td><td>Not possible*</td><td>Possible</td><td>Possible</td><td>Possible</td></tr>
  <tr><td><strong>Read Committed</strong></td><td>Not possible</td><td>Possible</td><td>Possible</td><td>Possible</td></tr>
  <tr><td><strong>Repeatable Read</strong></td><td>Not possible</td><td>Not possible</td><td>Not possible*</td><td>Possible</td></tr>
  <tr><td><strong>Serializable</strong></td><td>Not possible</td><td>Not possible</td><td>Not possible</td><td>Not possible</td></tr>
</table>
<p>* PostgreSQL's MVCC prevents dirty reads even at Read Uncommitted level. Phantoms are prevented at Repeatable Read due to snapshot isolation (stricter than SQL standard requires).</p>

<h3>Read Committed (Default)</h3>
<pre><code>-- Default level. Each statement sees data committed before that statement began.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

BEGIN;
  -- Statement 1: sees data committed before this moment
  SELECT salary FROM employees WHERE id = 1;  -- returns 50000

  -- Meanwhile, another transaction commits: UPDATE employees SET salary = 60000 WHERE id = 1;

  -- Statement 2: sees the new committed value!
  SELECT salary FROM employees WHERE id = 1;  -- returns 60000
  -- This is a "non-repeatable read" — same query, different result
COMMIT;</code></pre>

<h3>Repeatable Read</h3>
<pre><code>-- Transaction sees a snapshot from its start. All queries see the same data.
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

BEGIN;
  SELECT salary FROM employees WHERE id = 1;  -- returns 50000

  -- Another transaction commits: UPDATE employees SET salary = 60000 WHERE id = 1;

  SELECT salary FROM employees WHERE id = 1;  -- still returns 50000!
  -- Snapshot from transaction start is used for ALL queries

  -- But if THIS transaction tries to UPDATE the same row:
  UPDATE employees SET salary = 55000 WHERE id = 1;
  -- ERROR: could not serialize access due to concurrent update
  -- Must retry the entire transaction!
COMMIT;</code></pre>

<h3>Serializable</h3>
<pre><code>-- Strictest level. Guarantees that concurrent transactions produce the
-- same result as if they ran serially (one after another).

SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- PostgreSQL uses SSI (Serializable Snapshot Isolation):
-- It tracks read/write dependencies between transactions.
-- If a cycle is detected, one transaction is aborted.

-- Example: write skew anomaly (prevented only at Serializable)
-- Two doctors on-call, rule: at least one must be on-call

-- Transaction A:                    Transaction B:
-- BEGIN SERIALIZABLE;               BEGIN SERIALIZABLE;
-- SELECT count(*) FROM doctors      SELECT count(*) FROM doctors
--   WHERE on_call = true; → 2         WHERE on_call = true; → 2
-- UPDATE doctors SET on_call=false  UPDATE doctors SET on_call=false
--   WHERE id = 1;                     WHERE id = 2;
-- COMMIT; ✓                         COMMIT; ✗ serialization failure!

-- At Repeatable Read, both would commit → 0 doctors on call (violation!)</code></pre>

<h2>MVCC Implementation Details</h2>
<pre><code>-- Every tuple has these hidden system columns:
-- xmin:     Transaction ID that inserted this tuple
-- xmax:     Transaction ID that deleted/updated this tuple (0 if alive)
-- cmin/cmax: Command IDs within the transaction
-- ctid:     Physical location (page, offset)

-- View hidden columns:
SELECT xmin, xmax, ctid, * FROM employees LIMIT 5;

-- Tuple lifecycle:
-- INSERT:  creates tuple with xmin=current_txn, xmax=0
-- UPDATE:  sets xmax=current_txn on old tuple, creates new tuple with xmin=current_txn
-- DELETE:  sets xmax=current_txn on the tuple
-- COMMIT:  marks transaction as committed in CLOG
-- ABORT:   marks transaction as aborted in CLOG</code></pre>

<h3>Snapshot Visibility Rules</h3>
<pre><code>A tuple is VISIBLE to transaction T's snapshot if:
1. xmin_committed AND xmin < snapshot_xmin
   (inserted by a committed transaction that started before our snapshot)
2. AND (xmax is 0 OR xmax_aborted OR xmax >= snapshot_xmin)
   (not deleted, or deleted by an aborted txn, or deleted by a txn
    that started after our snapshot)

Snapshot contains:
- xmin: lowest still-running transaction ID
- xmax: first unassigned transaction ID
- xip[]: list of in-progress transaction IDs between xmin and xmax</code></pre>

<h2>Deadlocks</h2>
<p>A deadlock occurs when two or more transactions are waiting for each other to release locks.</p>

<pre><code>-- Classic deadlock scenario:
-- Transaction A:                    Transaction B:
-- BEGIN;                            BEGIN;
-- UPDATE accounts SET bal=bal-100   UPDATE accounts SET bal=bal-100
--   WHERE id = 1;  (locks row 1)     WHERE id = 2;  (locks row 2)
-- UPDATE accounts SET bal=bal+100   UPDATE accounts SET bal=bal+100
--   WHERE id = 2;  (waits for B)     WHERE id = 1;  (waits for A)
-- → DEADLOCK!

-- PostgreSQL detects deadlocks via a wait-for graph.
-- Detection runs every deadlock_timeout (default 1 second).
-- One transaction is aborted with: ERROR: deadlock detected

-- Prevention strategies:
-- 1. Always lock resources in a consistent order (e.g., by ID)
-- 2. Keep transactions short
-- 3. Use SELECT ... FOR UPDATE NOWAIT or SKIP LOCKED
-- 4. Use advisory locks for application-level coordination</code></pre>

<h2>Lock Types</h2>

<h3>Table-Level Locks</h3>
<table>
  <tr><th>Lock Mode</th><th>Acquired By</th><th>Conflicts With</th></tr>
  <tr><td>ACCESS SHARE</td><td>SELECT</td><td>ACCESS EXCLUSIVE</td></tr>
  <tr><td>ROW SHARE</td><td>SELECT FOR UPDATE/SHARE</td><td>EXCLUSIVE, ACCESS EXCLUSIVE</td></tr>
  <tr><td>ROW EXCLUSIVE</td><td>INSERT, UPDATE, DELETE</td><td>SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE</td></tr>
  <tr><td>SHARE</td><td>CREATE INDEX (non-concurrent)</td><td>ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE</td></tr>
  <tr><td>ACCESS EXCLUSIVE</td><td>ALTER TABLE, DROP TABLE, VACUUM FULL, LOCK TABLE</td><td>Everything</td></tr>
</table>

<h3>Row-Level Locks</h3>
<pre><code>-- FOR UPDATE: exclusive lock, blocks other FOR UPDATE and modifications
SELECT * FROM products WHERE id = 1 FOR UPDATE;

-- FOR NO KEY UPDATE: like FOR UPDATE but doesn't block FOR KEY SHARE
-- Used internally by UPDATE that doesn't modify key columns
SELECT * FROM products WHERE id = 1 FOR NO KEY UPDATE;

-- FOR SHARE: shared lock, blocks modifications but allows other FOR SHARE
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- FOR KEY SHARE: weakest, only blocks FOR UPDATE
-- Used internally by FK checks
SELECT * FROM products WHERE id = 1 FOR KEY SHARE;

-- NOWAIT: fail immediately instead of waiting
SELECT * FROM products WHERE id = 1 FOR UPDATE NOWAIT;
-- ERROR: could not obtain lock on row

-- SKIP LOCKED: skip locked rows (great for job queues)
SELECT * FROM jobs WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;</code></pre>

<h3>Advisory Locks</h3>
<pre><code>-- Application-level locks using arbitrary integer keys
-- These don't correspond to any database object

-- Session-level (held until session ends or explicit unlock):
SELECT pg_advisory_lock(12345);           -- blocking acquire
SELECT pg_try_advisory_lock(12345);       -- non-blocking (returns bool)
SELECT pg_advisory_unlock(12345);         -- release

-- Transaction-level (released at COMMIT/ROLLBACK):
SELECT pg_advisory_xact_lock(12345);

-- Use case: prevent duplicate cron job execution
SELECT pg_try_advisory_lock(hashtext('daily_report'));
-- Returns true if acquired, false if another process holds it</code></pre>

<h2>Optimistic vs Pessimistic Locking</h2>

<h3>Pessimistic Locking</h3>
<pre><code>-- Lock row before modifying — prevents conflicts but reduces concurrency
BEGIN;
  SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
  -- Row is locked. Other transactions wait.
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;</code></pre>

<h3>Optimistic Locking</h3>
<pre><code>-- Don't lock; instead, detect conflicts at write time using a version column
-- Step 1: Read with version
SELECT id, quantity, version FROM inventory WHERE product_id = 1;
-- Returns: quantity=10, version=5

-- Step 2: Update only if version hasn't changed
UPDATE inventory
SET quantity = quantity - 1, version = version + 1
WHERE product_id = 1 AND version = 5;

-- If affected_rows = 0 → someone else modified it → retry!
-- If affected_rows = 1 → success

-- Better for high-concurrency, low-conflict scenarios
-- Avoids holding locks during business logic computation</code></pre>

<table>
  <tr><th>Aspect</th><th>Pessimistic</th><th>Optimistic</th></tr>
  <tr><td>When to use</td><td>High conflict rate</td><td>Low conflict rate</td></tr>
  <tr><td>Latency</td><td>Lock wait time</td><td>Retry cost on conflict</td></tr>
  <tr><td>Throughput</td><td>Lower under low contention</td><td>Higher under low contention</td></tr>
  <tr><td>Deadlocks</td><td>Possible</td><td>Not possible</td></tr>
  <tr><td>Implementation</td><td>FOR UPDATE</td><td>Version column / conditional UPDATE</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between Read Committed and Repeatable Read isolation levels with a concrete example.</div>
  <div class="qa-a">In Read Committed (default), each SQL statement sees a fresh snapshot of committed data. If another transaction commits between your two SELECTs, the second SELECT sees the new data. In Repeatable Read, the transaction uses a single snapshot taken at the start of the first query. All subsequent queries see that same snapshot, regardless of other commits. Example: A bank report transaction reads account balances. With Read Committed, if a transfer commits between reading Account A and Account B, the report might see inconsistent totals. With Repeatable Read, the report sees a consistent snapshot. The tradeoff: Repeatable Read may get serialization errors on UPDATE if the target row was modified by a concurrent committed transaction, requiring application-level retry logic.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a write skew anomaly and which isolation level prevents it?</div>
  <div class="qa-a">Write skew occurs when two transactions read overlapping data, make decisions based on what they read, then write to different rows — creating an inconsistent state. Classic example: two doctors are on-call, business rule says at least one must remain. Doctor A checks (2 on-call), decides to go off-call. Concurrently, Doctor B does the same. Both transactions see 2 on-call, both go off-call, result: 0 on-call. This violates the invariant. Read Committed and Repeatable Read both allow this because neither transaction modifies the row the other reads. Only Serializable prevents it via SSI (Serializable Snapshot Isolation), which tracks read-write dependencies and aborts one transaction if a dangerous pattern is detected.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a reliable job queue in PostgreSQL?</div>
  <div class="qa-a">Use SELECT ... FOR UPDATE SKIP LOCKED: (1) Workers run: BEGIN; SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED; (2) If a row is returned, process it: UPDATE jobs SET status = 'processing', worker_id = ... WHERE id = ...; (3) After processing: UPDATE jobs SET status = 'done'; COMMIT; SKIP LOCKED means multiple workers don't block each other — they each grab a different pending job. Add a timeout column for stuck jobs. For high throughput, consider LISTEN/NOTIFY for instant wake-up instead of polling. For production scale, consider pgqueuer or Postgres-backed queue libraries that handle edge cases (retries, dead letter, priorities).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use advisory locks vs row-level locks?</div>
  <div class="qa-a">Use row-level locks (FOR UPDATE) when protecting specific database rows from concurrent modification — the lock is tied to the data. Use advisory locks when you need application-level mutual exclusion that doesn't correspond to specific rows: (1) Preventing duplicate cron job execution across servers; (2) Rate limiting per-user operations; (3) Coordinating cache invalidation; (4) Protecting external resource access (file system, API calls). Advisory locks are lighter weight (no table overhead) and can use pg_try_advisory_lock for non-blocking attempts. The key difference: row locks are released at transaction end; session-level advisory locks persist until explicitly released or session disconnect.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle deadlocks in a production application?</div>
  <div class="qa-a">Prevention and detection strategy: (1) Prevention: always acquire locks in a consistent order — e.g., sort account IDs before locking in a transfer; (2) Keep transactions short — do computation outside the transaction, only do DB operations inside; (3) Use statement_timeout and lock_timeout to prevent indefinite waits; (4) In application code: catch the deadlock error (error code 40P01), implement retry with exponential backoff (3-5 retries); (5) Monitor: check pg_stat_activity for waiting queries, log_lock_waits = on to log waits > deadlock_timeout, query pg_locks to visualize the lock graph; (6) For hotspot rows (counters), consider redesigning with partitioned counters or batch updates to reduce contention.</div>
</div>`
  },
  {
    id: 'pg-partitioning',
    title: 'PostgreSQL Partitioning',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Partitioning Concepts
-- Simulating partitioning with SQLite tables and queries

-- Create "partitioned" tables by date range
CREATE TABLE orders_2024_q1 (
  id INTEGER, customer_id INTEGER, product_id INTEGER,
  quantity INTEGER, total REAL, order_date TEXT, status TEXT
);

CREATE TABLE orders_2024_q2 (
  id INTEGER, customer_id INTEGER, product_id INTEGER,
  quantity INTEGER, total REAL, order_date TEXT, status TEXT
);

-- Insert data into partitions
INSERT INTO orders_2024_q1
SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2024-04-01';

INSERT INTO orders_2024_q2
SELECT * FROM orders WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';

-- Query specific partition (partition pruning concept)
SELECT COUNT(*) AS q1_orders FROM orders_2024_q1;
SELECT COUNT(*) AS q2_orders FROM orders_2024_q2;

-- Aggregate across partitions (like querying parent table)
SELECT 'Q1' AS quarter, COUNT(*) AS cnt, ROUND(SUM(total), 2) AS revenue
FROM orders_2024_q1
UNION ALL
SELECT 'Q2' AS quarter, COUNT(*) AS cnt, ROUND(SUM(total), 2) AS revenue
FROM orders_2024_q2;

-- Partitioning benefit: analyze each partition independently
SELECT status, COUNT(*) AS cnt
FROM orders_2024_q1
GROUP BY status;`,
    content: `
<h1>PostgreSQL Partitioning</h1>
<p>Table partitioning splits a large table into smaller physical pieces while maintaining a single logical table interface. It is essential for managing tables with hundreds of millions to billions of rows.</p>

<h2>Why Partition?</h2>
<ul>
  <li><strong>Query performance</strong> — Partition pruning skips irrelevant partitions entirely</li>
  <li><strong>Maintenance</strong> — VACUUM, REINDEX, and backups can target individual partitions</li>
  <li><strong>Data lifecycle</strong> — Drop old partitions instantly (vs DELETE which generates WAL and dead tuples)</li>
  <li><strong>Parallel execution</strong> — Parallel scans across partitions</li>
  <li><strong>Shared_buffers efficiency</strong> — Hot partitions stay in cache, cold ones don't waste memory</li>
</ul>

<h2>Partition Types</h2>

<h3>Range Partitioning</h3>
<p>Most common. Partition by a continuous range of values (dates, IDs, amounts).</p>
<pre><code>-- PostgreSQL 10+ declarative syntax
CREATE TABLE orders (
    id          BIGSERIAL,
    customer_id INTEGER NOT NULL,
    total       NUMERIC(10,2),
    order_date  DATE NOT NULL,
    status      TEXT
) PARTITION BY RANGE (order_date);

-- Create partitions for each month
CREATE TABLE orders_2024_01 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE orders_2024_03 PARTITION OF orders
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Default partition catches rows that don't match any partition
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Query with partition pruning:
SELECT * FROM orders WHERE order_date = '2024-02-15';
-- Only scans orders_2024_02!</code></pre>

<h3>List Partitioning</h3>
<p>Partition by discrete values. Ideal for categorical data.</p>
<pre><code>CREATE TABLE customers (
    id      BIGSERIAL,
    name    TEXT,
    country TEXT NOT NULL,
    email   TEXT
) PARTITION BY LIST (country);

CREATE TABLE customers_us PARTITION OF customers
    FOR VALUES IN ('US', 'USA');
CREATE TABLE customers_eu PARTITION OF customers
    FOR VALUES IN ('UK', 'DE', 'FR', 'IT', 'ES');
CREATE TABLE customers_asia PARTITION OF customers
    FOR VALUES IN ('JP', 'CN', 'IN', 'KR');
CREATE TABLE customers_other PARTITION OF customers DEFAULT;</code></pre>

<h3>Hash Partitioning</h3>
<p>Distributes rows evenly across partitions using a hash function. Good for uniform distribution when there's no natural range or list.</p>
<pre><code>CREATE TABLE events (
    id      BIGSERIAL,
    user_id INTEGER NOT NULL,
    type    TEXT,
    data    JSONB
) PARTITION BY HASH (user_id);

-- Create 4 hash partitions (must use modulus and remainder)
CREATE TABLE events_0 PARTITION OF events
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_1 PARTITION OF events
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE events_2 PARTITION OF events
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE events_3 PARTITION OF events
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);</code></pre>

<h2>Partition Pruning</h2>
<p>The query planner eliminates partitions that cannot contain matching rows. This is the primary performance benefit.</p>

<pre><code>-- Static pruning (at plan time):
EXPLAIN SELECT * FROM orders WHERE order_date = '2024-02-15';
-- Scans only: orders_2024_02

-- Dynamic pruning (at execution time, PostgreSQL 11+):
EXPLAIN SELECT * FROM orders WHERE order_date = $1;
-- Prunes at runtime when parameter value is known

-- Pruning with JOIN:
SELECT o.*, c.name
FROM orders o JOIN customers c ON o.customer_id = c.id
WHERE o.order_date BETWEEN '2024-01-01' AND '2024-01-31';
-- Only orders_2024_01 is scanned

-- Verify pruning in EXPLAIN:
EXPLAIN (ANALYZE)
SELECT * FROM orders WHERE order_date = '2024-02-15';
-- Should show: "Partitions selected: 1 out of 12"</code></pre>

<div class="warning-note">Partition pruning requires the WHERE clause to reference the partition key directly. Wrapping the partition key in a function (e.g., WHERE EXTRACT(MONTH FROM order_date) = 2) prevents pruning. Use explicit range conditions instead.</div>

<h2>Sub-Partitioning</h2>
<pre><code>-- Partition by date, then sub-partition by region
CREATE TABLE events (
    id         BIGSERIAL,
    event_date DATE NOT NULL,
    region     TEXT NOT NULL,
    data       JSONB
) PARTITION BY RANGE (event_date);

CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
    PARTITION BY LIST (region);

CREATE TABLE events_2024_01_us PARTITION OF events_2024_01
    FOR VALUES IN ('US');
CREATE TABLE events_2024_01_eu PARTITION OF events_2024_01
    FOR VALUES IN ('EU');
CREATE TABLE events_2024_01_other PARTITION OF events_2024_01
    DEFAULT;</code></pre>

<h2>When to Partition</h2>
<table>
  <tr><th>Scenario</th><th>Partition?</th><th>Reason</th></tr>
  <tr><td>Table < 10GB</td><td>Usually no</td><td>Index scan is sufficient</td></tr>
  <tr><td>Table 10-100GB</td><td>Maybe</td><td>If queries naturally filter on partition key</td></tr>
  <tr><td>Table > 100GB</td><td>Yes</td><td>Maintenance, pruning, and lifecycle benefits are significant</td></tr>
  <tr><td>Time-series data</td><td>Yes</td><td>Natural range partitioning, easy old data removal</td></tr>
  <tr><td>Multi-tenant</td><td>Consider</td><td>List partition by tenant_id if tenants vary in size</td></tr>
  <tr><td>Frequent bulk deletes</td><td>Yes</td><td>DROP partition is instant vs DELETE generating WAL</td></tr>
</table>

<h2>Partition Management</h2>
<pre><code>-- Attach an existing table as a partition
ALTER TABLE orders ATTACH PARTITION orders_2024_06
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
-- ⚠️ This scans the table to verify all rows match the constraint!
-- For large tables, add a CHECK constraint first to skip the scan:
ALTER TABLE orders_2024_06 ADD CONSTRAINT check_date
    CHECK (order_date >= '2024-06-01' AND order_date < '2024-07-01');
ALTER TABLE orders ATTACH PARTITION orders_2024_06
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
-- Now PostgreSQL skips the scan because the CHECK already guarantees it.

-- Detach a partition (PostgreSQL 14+ supports CONCURRENTLY)
ALTER TABLE orders DETACH PARTITION orders_2023_01;
ALTER TABLE orders DETACH PARTITION orders_2023_01 CONCURRENTLY;

-- Drop old data instantly
DROP TABLE orders_2022_01;  -- Instant! No VACUUM needed.</code></pre>

<h2>Partitioning vs Sharding</h2>
<table>
  <tr><th>Aspect</th><th>Partitioning</th><th>Sharding</th></tr>
  <tr><td>Scope</td><td>Single database server</td><td>Multiple database servers</td></tr>
  <tr><td>Transparency</td><td>Fully transparent to queries</td><td>Requires application or middleware awareness</td></tr>
  <tr><td>Cross-partition queries</td><td>Handled by PostgreSQL automatically</td><td>Requires distributed query coordination</td></tr>
  <tr><td>Transactions</td><td>Full ACID</td><td>Distributed transactions (2PC) or eventual consistency</td></tr>
  <tr><td>Scaling limit</td><td>Single server resources</td><td>Horizontal — add more servers</td></tr>
  <tr><td>Complexity</td><td>Low (declarative)</td><td>High (coordination, routing, rebalancing)</td></tr>
  <tr><td>Tools</td><td>Built-in PostgreSQL</td><td>Citus, Vitess, custom application logic</td></tr>
</table>

<h2>Time-Series Partitioning Strategy</h2>
<pre><code>-- Recommended approach for time-series data:
-- 1. Partition by time range (daily, weekly, monthly — based on volume)
-- 2. Automate partition creation (pg_partman extension)
-- 3. Use BRIN indexes within each partition
-- 4. Drop old partitions for retention

-- pg_partman example:
CREATE EXTENSION pg_partman;
SELECT partman.create_parent(
    p_parent_table := 'public.events',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'daily',
    p_premake := 7          -- create 7 future partitions
);

-- Maintenance (run via cron):
SELECT partman.run_maintenance();

-- Retention policy (drop partitions older than 90 days):
UPDATE partman.part_config
SET retention = '90 days', retention_keep_table = false
WHERE parent_table = 'public.events';</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: You have a 2TB orders table growing 50GB/month. How would you partition it?</div>
  <div class="qa-a">Strategy: (1) Partition by order_date using monthly range partitions — aligns with natural query patterns ("show me last month's orders") and retention policies; (2) Create partitions in advance using pg_partman with premake=3 (3 months ahead); (3) Create local indexes on each partition (e.g., on customer_id, status); (4) Set up retention: detach and archive partitions older than the retention period, drop after archival; (5) Use BRIN index on order_date within each partition since data is naturally time-ordered; (6) Monitor partition sizes — if a month exceeds 100GB, switch to weekly partitions; (7) Consider sub-partitioning by a second dimension (e.g., region) if queries commonly filter on both; (8) Ensure the partition key (order_date) is included in the primary key and all unique constraints.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the limitations of PostgreSQL partitioning?</div>
  <div class="qa-a">Key limitations: (1) Unique constraints and primary keys must include the partition key — you cannot have a globally unique id without including order_date; (2) Foreign keys referencing partitioned tables are not supported until PostgreSQL 12, and FK from partitioned tables have limitations; (3) Before PostgreSQL 13, row movement between partitions on UPDATE of the partition key had issues; (4) Too many partitions (thousands) can slow down planning — keep it under a few hundred; (5) Global indexes don't exist — each partition has its own indexes, meaning a query touching many partitions must scan many indexes; (6) BEFORE ROW triggers must be defined on each partition; (7) No automatic partition creation for new data — you need pg_partman or manual DDL; (8) ATTACH PARTITION requires scanning the table unless a matching CHECK constraint exists.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does partition pruning work and what can prevent it?</div>
  <div class="qa-a">Partition pruning is the planner's ability to exclude partitions that cannot contain matching rows. It works by comparing WHERE clause conditions against partition bounds. Static pruning happens at plan time for literal values. Dynamic pruning (PostgreSQL 11+) happens at execution time for parameterized queries. Things that prevent pruning: (1) Wrapping the partition key in a function: WHERE DATE_TRUNC('month', order_date) = '2024-01' — use explicit range instead; (2) Type mismatch on the partition key; (3) Using OR with non-partition columns mixed in; (4) Cross-type comparisons that prevent direct bound checking; (5) Querying via a view that obscures the partition key filter. Always verify with EXPLAIN ANALYZE and check "Partitions removed" or "Subplans Removed" counts.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle the requirement for a globally unique ID across a partitioned table?</div>
  <div class="qa-a">Options: (1) Include the partition key in the primary key: PRIMARY KEY (id, order_date) — this is the standard approach but means the PK includes a non-meaningful column; (2) Use UUIDs (uuid_generate_v4()) which are globally unique without needing a shared sequence; (3) Use a sequence — sequences are global, so BIGSERIAL still gives unique IDs across partitions, but you can't enforce uniqueness via PRIMARY KEY constraint without including the partition key; (4) Use a separate mapping table for global uniqueness; (5) Use application-generated IDs (Snowflake IDs, ULIDs) that embed timestamp + machine ID + sequence. For most applications, option (1) with a composite PK or (2) with UUIDs is the pragmatic choice.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Partitioning vs. using partial indexes — when would you prefer one over the other?</div>
  <div class="qa-a">Partial indexes are better when: (1) The table isn't huge (< 50GB) but queries consistently filter on a specific condition; (2) Only a small fraction of rows match the condition (e.g., WHERE status = 'active' on a table that's 95% archived); (3) You want to avoid the operational complexity of partition management. Partitioning is better when: (1) The table is very large and growing; (2) You need data lifecycle management (drop old data); (3) Queries naturally align with the partition key; (4) You need parallel execution across partitions; (5) VACUUM performance on the full table is problematic. They can also be combined: partitioned table with partial indexes on each partition for additional filtering.</div>
</div>`
  },
  {
    id: 'pg-replication',
    title: 'PostgreSQL Replication & HA',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Replication & HA: Read/Write Patterns
-- Available tables: employees, departments, orders, customers, products

-- 1. Write operation (goes to PRIMARY)
INSERT INTO orders (id, customer_id, product_id, quantity, total, order_date, status)
VALUES (9999, 1, 1, 2, 59.98, '2024-06-15', 'pending');

-- 2. Read operations (can go to REPLICA)
-- Heavy analytics query — perfect for read replica
SELECT d.name AS department,
       COUNT(e.id) AS headcount,
       ROUND(AVG(e.salary), 2) AS avg_salary,
       MIN(e.salary) AS min_salary,
       MAX(e.salary) AS max_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY headcount DESC;

-- 3. Read-heavy report — route to replica
SELECT c.country,
       COUNT(DISTINCT c.id) AS customers,
       COUNT(o.id) AS total_orders,
       ROUND(SUM(o.total), 2) AS revenue
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.country
ORDER BY revenue DESC;

-- 4. Write-then-read pattern (must use PRIMARY for consistency)
UPDATE products SET stock = stock - 1 WHERE id = 1;
SELECT id, name, stock FROM products WHERE id = 1;

-- 5. Read that tolerates slight delay (replica-safe)
SELECT p.category,
       COUNT(*) AS product_count,
       ROUND(AVG(p.price), 2) AS avg_price
FROM products p
GROUP BY p.category;`,
    content: `
<h1>PostgreSQL Replication & High Availability</h1>
<p>Replication and high availability are critical for production PostgreSQL deployments. Understanding the different replication modes, their tradeoffs, and failover strategies is essential for SDE3 engineers designing resilient systems.</p>

<h2>Replication Overview</h2>
<pre><code>                    ┌──────────────┐
    Writes ────────▶│   PRIMARY    │
                    │  (read/write) │
                    └──────┬───────┘
                           │ WAL stream
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ REPLICA 1│ │ REPLICA 2│ │ REPLICA 3│
        │(read-only)│ │(read-only)│ │(read-only)│
        │  sync     │ │  async   │ │  async   │
        └──────────┘ └──────────┘ └──────────┘
              ▲            ▲            ▲
              └────────────┼────────────┘
                    Reads (load balanced)</code></pre>

<h2>Streaming Replication</h2>
<p>The primary continuously streams WAL records to replicas over a TCP connection. This is the most common replication method.</p>

<h3>Asynchronous Replication (Default)</h3>
<pre><code>-- Primary commits and acknowledges client immediately.
-- WAL is streamed to replicas asynchronously.

-- Primary postgresql.conf:
wal_level = replica
max_wal_senders = 10        -- max number of replication connections
wal_keep_size = 1GB         -- keep WAL for slow replicas

-- Replica recovery.conf / postgresql.conf (PG12+):
primary_conninfo = 'host=primary port=5432 user=replicator'
primary_slot_name = 'replica1'

-- Pros:  No performance impact on primary
-- Cons:  Data loss possible if primary crashes before replica receives WAL
-- Lag:   Typically milliseconds, but can grow under load</code></pre>

<h3>Synchronous Replication</h3>
<pre><code>-- Primary waits for at least one replica to confirm WAL receipt before committing.

-- Primary postgresql.conf:
synchronous_standby_names = 'FIRST 1 (replica1, replica2)'
-- FIRST 1: wait for first replica to confirm
-- ANY 2 (r1, r2, r3): wait for any 2 of 3 replicas

synchronous_commit = on       -- default: wait for local + sync standby WAL flush
-- Options:
--   off:            don't wait for anything (fastest, risk data loss)
--   local:          wait for local WAL flush only
--   remote_write:   wait for standby to receive (in memory, not flushed)
--   on:             wait for standby to flush WAL to disk
--   remote_apply:   wait for standby to replay WAL (strongest)

-- Pros:  Zero data loss (RPO = 0)
-- Cons:  Commit latency increases by network round-trip
--        If sync replica goes down, primary blocks (unless FIRST 1 with multiple)</code></pre>

<div class="warning-note">With synchronous_commit = on and only one synchronous replica, the primary will stop accepting writes if that replica goes down. Always configure at least 2 synchronous candidates: FIRST 1 (replica1, replica2) so the primary can fall back to the second replica.</div>

<h2>Logical Replication</h2>
<p>Instead of streaming physical WAL bytes, logical replication streams a decoded stream of INSERT/UPDATE/DELETE operations.</p>

<pre><code>-- Logical replication setup:
-- Primary:
wal_level = logical
max_replication_slots = 10

-- Create publication (what to replicate):
CREATE PUBLICATION my_pub FOR TABLE orders, customers;
-- Or replicate all tables:
CREATE PUBLICATION my_pub FOR ALL TABLES;

-- Subscriber (another PostgreSQL instance):
CREATE SUBSCRIPTION my_sub
    CONNECTION 'host=primary port=5432 dbname=mydb'
    PUBLICATION my_pub;</code></pre>

<h3>Streaming vs Logical Replication</h3>
<table>
  <tr><th>Aspect</th><th>Streaming (Physical)</th><th>Logical</th></tr>
  <tr><td>What's replicated</td><td>Byte-level WAL records</td><td>Decoded row changes</td></tr>
  <tr><td>Replica is</td><td>Exact byte-for-byte copy</td><td>Independent database</td></tr>
  <tr><td>Schema changes</td><td>Automatically replicated</td><td>Must be applied manually</td></tr>
  <tr><td>Selective replication</td><td>No (all-or-nothing)</td><td>Yes (per-table, per-column, with filters)</td></tr>
  <tr><td>Cross-version</td><td>Must match major version</td><td>Different major versions OK</td></tr>
  <tr><td>Write on replica</td><td>No (read-only)</td><td>Yes (different tables)</td></tr>
  <tr><td>Use cases</td><td>HA failover, read replicas</td><td>Data migration, CDC, selective sync</td></tr>
  <tr><td>Performance overhead</td><td>Lower</td><td>Higher (decoding cost)</td></tr>
</table>

<h2>WAL Shipping</h2>
<pre><code>-- Older method: archive completed WAL files to a shared location.
-- Replica fetches and replays them.

-- Primary postgresql.conf:
archive_mode = on
archive_command = 'cp %p /archive/%f'

-- Replica restore_command:
restore_command = 'cp /archive/%f %p'

-- Granularity: entire WAL segment (16MB default)
-- Lag: can be up to a full WAL segment behind
-- Used as: fallback for streaming replication (if stream breaks)</code></pre>

<h2>Hot Standby vs Warm Standby</h2>
<table>
  <tr><th>Type</th><th>Accepts Reads?</th><th>Accepts Writes?</th><th>Use Case</th></tr>
  <tr><td><strong>Hot Standby</strong></td><td>Yes (read-only queries)</td><td>No</td><td>Read replicas, reporting, HA failover</td></tr>
  <tr><td><strong>Warm Standby</strong></td><td>No</td><td>No</td><td>HA failover only (lower resource usage)</td></tr>
</table>
<pre><code>-- Enable hot standby on replica:
hot_standby = on                     -- Allow read queries
hot_standby_feedback = on            -- Prevent primary VACUUM from removing
                                     -- rows still needed by replica queries
max_standby_streaming_delay = 30s    -- Max delay before canceling replica queries
                                     -- that conflict with WAL replay</code></pre>

<h2>Failover and Switchover</h2>
<pre><code>Failover: Unplanned promotion when primary crashes
──────────────────────────────────────────────
1. Primary crashes
2. Monitoring system detects failure (timeout)
3. Promote replica: pg_ctl promote -D /data
   (or: SELECT pg_promote();)
4. Replica becomes new primary (accepts writes)
5. Update connection strings / DNS
6. Old primary (when recovered) must be rebuilt as replica

Switchover: Planned role swap (zero or near-zero downtime)
──────────────────────────────────────────────
1. Stop writes to primary (set read-only or drain connections)
2. Wait for replica to catch up (check pg_stat_replication.replay_lsn)
3. Promote replica
4. Reconfigure old primary as replica of new primary
5. Update connection routing</code></pre>

<h2>Patroni (HA Automation)</h2>
<p>Patroni is the industry-standard tool for PostgreSQL high availability. It manages failover, switchover, and replica configuration automatically.</p>

<pre><code>Architecture:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Node 1     │     │  Node 2     │     │  Node 3     │
│  Patroni    │     │  Patroni    │     │  Patroni    │
│  PostgreSQL │     │  PostgreSQL │     │  PostgreSQL │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │   etcd /    │  ← Distributed consensus store
                    │   Consul /  │     (holds leader key)
                    │   ZooKeeper │
                    └─────────────┘

Key features:
- Automatic leader election via DCS (distributed consensus store)
- Automatic failover with configurable timeout
- REST API for health checks and management
- Supports synchronous replication configuration
- Integrates with HAProxy / PgBouncer for connection routing</code></pre>

<h2>Read Replicas for Scaling</h2>
<pre><code>Application-Level Read/Write Splitting:

┌────────────┐
│ Application│
└─────┬──────┘
      │
      ├── WRITE queries ──▶ Primary (via PgBouncer)
      │
      └── READ queries ───▶ Load Balancer (HAProxy)
                                   │
                            ┌──────┼──────┐
                            ▼      ▼      ▼
                         Replica Replica Replica

Implementation approaches:
1. Application-level: use different connection strings
   const primaryPool = new Pool({ host: 'primary' });
   const replicaPool = new Pool({ host: 'replica' });

2. Middleware: ProxySQL, Pgpool-II route based on query type

3. DNS-based: primary.db.internal / replica.db.internal</code></pre>

<div class="warning-note">Replication lag means replicas may serve stale data. After a write, reading from a replica might not see the change yet. For read-after-write consistency, route the read to the primary. For eventual consistency tolerance (dashboards, reports), replicas are fine.</div>

<h2>Split-Brain Problem</h2>
<p>Split-brain occurs when two nodes both believe they are the primary and accept writes. This causes data divergence and potential data loss.</p>

<pre><code>Split-brain scenario:
1. Network partition separates primary from the consensus store
2. Patroni/failover tool promotes a replica (it can reach the DCS)
3. Old primary is still running and accepting writes (hasn't noticed)
4. Now TWO nodes accept writes → data diverges!

Prevention:
1. Fencing: Patroni uses the DCS leader key with a TTL.
   If the primary can't renew its key, it demotes itself.

2. Watchdog: Linux watchdog device reboots the node if Patroni stops.
   Ensures the old primary is truly dead before promoting a new one.

3. pg_hba.conf: Restrict replication access so the old primary
   can't accidentally replicate from the new primary.

4. Network design: Ensure the DCS is reachable from the same
   network segment as the clients (if primary can't reach DCS,
   clients probably can't reach primary either).</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between synchronous and asynchronous replication. When would you choose each?</div>
  <div class="qa-a">Asynchronous: the primary commits and acknowledges the client immediately, then streams WAL to replicas in the background. Faster commits but risk of data loss if the primary crashes before replicas receive the WAL. Choose for: read replicas for analytics, geographic distribution where latency matters, non-critical data. Synchronous: the primary waits for at least one replica to confirm WAL receipt (or flush, or apply, depending on synchronous_commit setting) before acknowledging the commit. Zero data loss (RPO=0) but increased commit latency by at least one network round-trip. Choose for: financial transactions, critical data that cannot tolerate any loss. Best practice: use FIRST 1 (r1, r2) so if one sync replica fails, the other takes over without blocking the primary.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use logical replication instead of streaming replication?</div>
  <div class="qa-a">Use logical replication when: (1) You need to replicate only specific tables, not the entire database; (2) Cross-version upgrades — replicate from PG14 to PG16 during migration; (3) You need to replicate to a database with a different schema (extra columns, different indexes); (4) Bi-directional replication (with conflict resolution); (5) Change Data Capture (CDC) — feeding changes to Kafka, Elasticsearch, or data warehouses via logical decoding plugins (wal2json, pgoutput); (6) Consolidating data from multiple PostgreSQL instances into one. Downsides: DDL changes are not replicated, higher CPU overhead for decoding, more complex monitoring, and sequence values are not replicated.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Patroni handle automatic failover? What are the failure scenarios?</div>
  <div class="qa-a">Patroni maintains a leader key in a distributed consensus store (etcd/Consul/ZooKeeper) with a TTL (typically 30s). The leader must renew this key periodically. If the leader fails to renew (due to crash, network issue, or overload): (1) The TTL expires; (2) Replicas detect the leader key is gone; (3) The most caught-up replica attempts to acquire the leader key; (4) Winner promotes itself to primary via pg_promote(); (5) Other replicas reconfigure to follow the new primary. Failure scenarios: (a) Primary crash — clean failover, possible data loss with async replication; (b) Network partition — primary loses DCS access, demotes itself (fencing), replica promotes; (c) DCS failure — Patroni enters a safe mode, no failover possible, existing primary continues; (d) Cascading failures — if all replicas are behind, the most caught-up one promotes with potential data gap. Recovery: old primary must be rebuilt as a replica (pg_rewind or pg_basebackup).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle replication lag in application design?</div>
  <div class="qa-a">Strategies: (1) Read-your-writes consistency: after a write, route subsequent reads from the same user to the primary for a brief window (e.g., 5 seconds), then fall back to replica; (2) Causal consistency: pass the primary's LSN to the application after a write, then when reading from replica, wait until the replica has replayed past that LSN (using pg_last_wal_replay_lsn()); (3) Monitor lag: query pg_stat_replication on the primary to check replay_lag, write_lag, flush_lag; set alerts at thresholds (e.g., > 1 second); (4) Categorize queries: dashboards and reports tolerate staleness (replica), user-facing profile edits need consistency (primary); (5) Application-level: use an in-process cache or session-local flag to route reads to primary for recently-written data.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the split-brain problem and how do you prevent it?</div>
  <div class="qa-a">Split-brain occurs when two database nodes both accept writes simultaneously, causing data divergence that is extremely difficult to reconcile. In PostgreSQL replication, this happens when the old primary doesn't realize it's been replaced. Prevention: (1) Use a distributed consensus store (etcd) with Patroni — the leader key has a TTL, and the primary must renew it; if it can't, it demotes to read-only; (2) Enable watchdog on all nodes — if Patroni stops, the OS reboots the node, ensuring a truly dead primary; (3) Network fencing (STONITH — Shoot The Other Node In The Head) — physically power off the old primary before promoting; (4) Design the network so clients and DCS are on the same network segment; (5) Set synchronous replication so even if split-brain occurs momentarily, the old primary can't commit without replica acknowledgment.</div>
</div>`
  },
  {
    id: 'pg-scaling',
    title: 'PostgreSQL Scaling Strategies',
    category: 'PostgreSQL',
    editorMode: 'sql',
    starterCode: `-- PostgreSQL Scaling Strategies: Materialized Views & Aggregations
-- Available tables: employees, departments, orders, customers, products

-- 1. Simulate a materialized view: pre-computed product sales summary
CREATE TABLE mv_product_sales AS
SELECT p.id AS product_id,
       p.name AS product_name,
       p.category,
       COUNT(o.id) AS total_orders,
       SUM(o.quantity) AS total_units,
       ROUND(SUM(o.total), 2) AS total_revenue,
       ROUND(AVG(o.total), 2) AS avg_order_value
FROM products p
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY p.id, p.name, p.category;

-- Query the "materialized view" (instant, no joins needed)
SELECT * FROM mv_product_sales ORDER BY total_revenue DESC;

-- 2. Customer lifetime value (CLTV) summary
CREATE TABLE mv_customer_ltv AS
SELECT c.id AS customer_id,
       c.name,
       c.country,
       COUNT(o.id) AS order_count,
       ROUND(SUM(o.total), 2) AS lifetime_value,
       MIN(o.order_date) AS first_order,
       MAX(o.order_date) AS last_order
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.country;

SELECT * FROM mv_customer_ltv ORDER BY lifetime_value DESC;

-- 3. Department budget utilization
SELECT d.name,
       d.budget,
       ROUND(SUM(e.salary), 2) AS total_salaries,
       ROUND(SUM(e.salary) / d.budget * 100, 1) AS utilization_pct
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name, d.budget
ORDER BY utilization_pct DESC;`,
    content: `
<h1>PostgreSQL Scaling Strategies</h1>
<p>Scaling PostgreSQL for high-traffic applications requires a multi-layered approach. An SDE3 must understand when to apply each strategy and the tradeoffs involved.</p>

<h2>Scaling Decision Framework</h2>
<pre><code>                        Is it a READ problem?
                        /                    \\
                      Yes                    No (WRITE problem)
                      /                        \\
              Add read replicas            Is it a single table?
              + caching layer              /                  \\
                                         Yes                  No
                                         /                      \\
                                  Partitioning             Sharding
                                  + vertical scaling       + Citus / app-level</code></pre>

<h2>Vertical Scaling</h2>
<p>Scale up: add more CPU, RAM, faster disks to a single server.</p>

<table>
  <tr><th>Resource</th><th>What It Helps</th><th>PostgreSQL Config</th></tr>
  <tr><td><strong>RAM</strong></td><td>Larger shared_buffers, more OS page cache</td><td>shared_buffers = 25% of RAM</td></tr>
  <tr><td><strong>CPU</strong></td><td>More parallel workers, concurrent queries</td><td>max_parallel_workers_per_gather, max_worker_processes</td></tr>
  <tr><td><strong>SSD/NVMe</strong></td><td>Faster random I/O for index scans</td><td>random_page_cost = 1.1 (for SSD, default 4.0)</td></tr>
  <tr><td><strong>Network</strong></td><td>Faster replication, backup</td><td>Dedicated replication network</td></tr>
</table>

<h3>Key Configuration for Scaling Up</h3>
<pre><code>-- For a 64GB RAM, 16-core server:
shared_buffers = 16GB              -- 25% of RAM
effective_cache_size = 48GB        -- 75% of RAM (shared_buffers + OS cache)
work_mem = 64MB                    -- per-sort operation
maintenance_work_mem = 2GB         -- for VACUUM, CREATE INDEX
max_connections = 200              -- use PgBouncer for more
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_worker_processes = 16

-- Checkpointing
checkpoint_completion_target = 0.9
max_wal_size = 4GB

-- WAL
wal_buffers = 64MB
synchronous_commit = off           -- only if you tolerate small data loss window</code></pre>

<h2>Read Replicas</h2>
<pre><code>Application-level routing:
┌────────────────┐
│   Application  │
│                │
│  if (write)    │──▶ Primary DB
│  else          │──▶ Replica Pool (round-robin)
└────────────────┘

-- Node.js example with separate pools:
const primary = new Pool({ host: 'primary.db.internal', ... });
const replica = new Pool({ host: 'replica.db.internal', ... });

async function getOrders(userId) {
  // Read from replica (tolerates slight lag)
  return replica.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
}

async function createOrder(data) {
  // Write to primary
  const result = await primary.query(
    'INSERT INTO orders (...) VALUES (...) RETURNING id', [...]
  );
  // Read-after-write: use primary for immediate read
  return primary.query('SELECT * FROM orders WHERE id = $1', [result.rows[0].id]);
}</code></pre>

<h2>Connection Pooling with PgBouncer</h2>
<p>PgBouncer sits between your application and PostgreSQL, multiplexing many application connections to fewer database connections.</p>

<pre><code>Without PgBouncer:          With PgBouncer:
App (1000 conns) ──▶ PG     App (1000 conns) ──▶ PgBouncer ──▶ PG (50 conns)
PG: 1000 processes           PG: 50 processes
RAM: ~10GB for connections   RAM: ~500MB for connections</code></pre>

<h3>PgBouncer Pool Modes</h3>
<table>
  <tr><th>Mode</th><th>Connection Returned After</th><th>Compatibility</th><th>Efficiency</th></tr>
  <tr><td><strong>Session</strong></td><td>Client disconnects</td><td>Full (all features work)</td><td>Low (like no pooling)</td></tr>
  <tr><td><strong>Transaction</strong></td><td>Transaction ends (COMMIT/ROLLBACK)</td><td>High (most features work)</td><td>High (recommended)</td></tr>
  <tr><td><strong>Statement</strong></td><td>Each statement</td><td>Low (no multi-statement txns)</td><td>Highest</td></tr>
</table>

<div class="warning-note">In transaction mode, these PostgreSQL features do NOT work: SET/RESET (session-level settings), LISTEN/NOTIFY, prepared statements (unless server-side), advisory session locks, temporary tables. Design your application accordingly.</div>

<pre><code>-- PgBouncer configuration (pgbouncer.ini):
[databases]
mydb = host=primary port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 5000           -- max connections from applications
default_pool_size = 50           -- connections to PostgreSQL per database/user
min_pool_size = 10               -- keep at least 10 connections warm
reserve_pool_size = 10           -- extra connections for burst
reserve_pool_timeout = 3         -- seconds before using reserve pool
server_idle_timeout = 300        -- close idle server connections after 5 min
query_timeout = 30               -- kill queries running longer than 30s</code></pre>

<h2>Sharding Strategies</h2>
<p>Sharding distributes data across multiple independent PostgreSQL instances. Use when a single server can't handle the write volume or data size.</p>

<h3>Application-Level Sharding</h3>
<pre><code>-- Shard by tenant_id (multi-tenant SaaS):
function getShardForTenant(tenantId) {
  const shards = ['shard1.db', 'shard2.db', 'shard3.db', 'shard4.db'];
  return shards[tenantId % shards.length];
}

-- Shard by user_id (social network):
function getShardForUser(userId) {
  const hash = consistentHash(userId);  // consistent hashing for rebalancing
  return shardMap.get(hash);
}

Challenges:
1. Cross-shard queries are very expensive (scatter-gather)
2. Cross-shard transactions require 2PC (two-phase commit)
3. Rebalancing data when adding shards is complex
4. Application must be shard-aware</code></pre>

<h3>Citus (Distributed PostgreSQL)</h3>
<pre><code>-- Citus extends PostgreSQL with distributed tables

-- Create a distributed table (sharded by tenant_id):
SELECT create_distributed_table('orders', 'tenant_id');

-- Queries are automatically routed to the correct shard:
SELECT * FROM orders WHERE tenant_id = 42;
-- → Routed to the shard containing tenant 42

-- Cross-shard aggregations are parallelized:
SELECT tenant_id, SUM(total) FROM orders GROUP BY tenant_id;
-- → Executed on each shard in parallel, results merged

-- Reference tables (replicated to all shards):
SELECT create_reference_table('countries');
-- → JOINs with reference tables are local (no network hop)

-- Co-located tables (same shard key = same shard):
SELECT create_distributed_table('order_items', 'tenant_id');
-- JOINs between orders and order_items for the same tenant are local!</code></pre>

<h2>Caching Layer</h2>
<pre><code>Application Cache Strategy:

┌────────────┐     ┌─────────┐     ┌──────────┐
│ Application│────▶│  Redis  │────▶│PostgreSQL│
│            │     │ (cache) │     │ (source) │
└────────────┘     └─────────┘     └──────────┘

Cache Patterns:

1. Cache-Aside (Lazy Loading):
   read(key):
     value = redis.get(key)
     if value is null:
       value = postgres.query(...)
       redis.set(key, value, TTL=300)
     return value

2. Write-Through:
   write(key, value):
     postgres.update(key, value)
     redis.set(key, value)

3. Write-Behind (Async):
   write(key, value):
     redis.set(key, value)
     queue.add('db_write', {key, value})
     // Background worker writes to postgres

Cache Invalidation Strategies:
- TTL-based: set expiry, tolerate staleness
- Event-based: listen to PostgreSQL NOTIFY or WAL changes
- Version-based: include version in cache key, increment on write</code></pre>

<h2>Materialized Views</h2>
<p>Pre-computed query results stored as a table. Ideal for expensive aggregations that don't need real-time data.</p>

<pre><code>-- Create materialized view
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT order_date::date AS day,
       COUNT(*) AS order_count,
       SUM(total) AS revenue,
       AVG(total) AS avg_order_value
FROM orders
GROUP BY order_date::date
ORDER BY day;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_mv_daily_revenue_day ON mv_daily_revenue(day);

-- Query is instant (reads pre-computed table)
SELECT * FROM mv_daily_revenue WHERE day >= '2024-01-01';

-- Refresh (blocks reads during refresh):
REFRESH MATERIALIZED VIEW mv_daily_revenue;

-- Concurrent refresh (doesn't block reads, requires unique index):
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
-- ⚠️ CONCURRENTLY is slower but allows reads during refresh</code></pre>

<h3>Materialized View Refresh Strategies</h3>
<table>
  <tr><th>Strategy</th><th>How</th><th>When</th></tr>
  <tr><td>Scheduled</td><td>Cron job: REFRESH MATERIALIZED VIEW CONCURRENTLY</td><td>Regular intervals (5min, hourly)</td></tr>
  <tr><td>Trigger-based</td><td>Trigger on source tables calls refresh</td><td>After significant changes</td></tr>
  <tr><td>Application-driven</td><td>Application code calls refresh after batch operations</td><td>After ETL jobs, imports</td></tr>
  <tr><td>pg_ivm (incremental)</td><td>Extension for incremental materialized view maintenance</td><td>When you need near-real-time</td></tr>
</table>

<h2>Database Per Service (Microservices)</h2>
<pre><code>Monolith:                    Microservices:
┌──────────────────┐         ┌─────────┐  ┌─────────┐  ┌─────────┐
│   Application    │         │ Orders  │  │ Users   │  │Inventory│
│                  │         │ Service │  │ Service │  │ Service │
└────────┬─────────┘         └────┬────┘  └────┬────┘  └────┬────┘
         │                        │            │            │
    ┌────┴────┐              ┌────┴──┐   ┌────┴──┐   ┌────┴──┐
    │ Single  │              │Orders │   │Users  │   │Invent.│
    │   DB    │              │  DB   │   │  DB   │   │  DB   │
    └─────────┘              └───────┘   └───────┘   └───────┘

Benefits:
- Independent scaling per service
- Technology flexibility per service
- Failure isolation
- Independent schema evolution

Challenges:
- No cross-service JOINs (must use API calls)
- No cross-service transactions (use Saga pattern)
- Data consistency is eventual
- Increased operational complexity</code></pre>

<h2>Data Archival Strategies</h2>
<pre><code>-- For tables that grow indefinitely (logs, events, audit):

-- 1. Partitioning + DROP (instant deletion of old data)
ALTER TABLE events DETACH PARTITION events_2022_q1;
-- Archive to S3/cold storage if needed
COPY events_2022_q1 TO '/tmp/events_2022_q1.csv' CSV;
DROP TABLE events_2022_q1;

-- 2. Move to archive table
INSERT INTO orders_archive SELECT * FROM orders WHERE order_date < '2023-01-01';
DELETE FROM orders WHERE order_date < '2023-01-01';
VACUUM orders;

-- 3. Foreign Data Wrapper to archive storage
CREATE EXTENSION postgres_fdw;
CREATE SERVER archive_server FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'archive-db', dbname 'archive');
CREATE FOREIGN TABLE orders_archive_remote (...)
    SERVER archive_server OPTIONS (table_name 'orders_archive');

-- 4. pg_partman retention
UPDATE partman.part_config
SET retention = '365 days',
    retention_keep_table = false  -- or true to keep detached
WHERE parent_table = 'public.events';</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Your PostgreSQL database handles 10,000 reads/sec and 500 writes/sec. Performance is degrading. What's your scaling plan?</div>
  <div class="qa-a">Step-by-step: (1) First, optimize queries — run pg_stat_statements to find the top queries by total time, add missing indexes, fix slow queries. This alone often solves the problem. (2) Add PgBouncer for connection pooling — reduce connection overhead from potentially hundreds of processes. (3) Add 2-3 read replicas — route the 10,000 reads/sec to replicas via application-level routing or HAProxy. (4) Add a Redis caching layer for hot data — cache frequently read, infrequently changed data with TTL. (5) If writes are the bottleneck: vertical scale (more CPU, NVMe storage), partition large tables, batch small writes, consider async commits for non-critical writes. (6) If a single table is the bottleneck: partition it. (7) Only if all else fails: consider sharding with Citus.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement connection pooling? What pool mode would you choose and why?</div>
  <div class="qa-a">Use PgBouncer in transaction mode. Configuration: set default_pool_size to match the number of connections PostgreSQL can efficiently handle (typically 2-4x CPU cores, e.g., 50-100 for a 16-core server). Set max_client_conn much higher (e.g., 5000) to absorb application connections. Transaction mode because: (1) connections are returned to the pool after each transaction, maximizing reuse; (2) most applications use standard queries that are compatible; (3) it provides the best balance of efficiency and compatibility. Avoid statement mode unless you're certain no multi-statement transactions are used. If you need session-level features (prepared statements, SET), either use session mode for those specific connections or redesign to avoid session state. Monitor pgbouncer SHOW POOLS to track pool utilization and wait times.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use materialized views vs. a caching layer like Redis?</div>
  <div class="qa-a">Materialized views when: (1) The result is a SQL aggregation or transformation — keeping it in PostgreSQL avoids serialization/deserialization overhead; (2) Other SQL queries need to JOIN with the result; (3) You need transactional consistency during refresh; (4) The data is used primarily by the database layer. Redis when: (1) Sub-millisecond read latency is required; (2) The data is consumed by the application layer (API responses, session data); (3) You need key-based access patterns; (4) Data changes frequently and you need instant invalidation; (5) You need distributed caching across multiple application servers. Often you use both: materialized view for complex aggregations refreshed periodically, Redis for caching the materialized view results for even faster access at the application layer.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Citus distribute queries across shards? What are the limitations?</div>
  <div class="qa-a">Citus distributes tables by a chosen distribution column (shard key). Each row is assigned to a shard based on a hash of the distribution column. Query routing: (1) Queries that filter on the distribution column are routed to a single shard (fast); (2) Queries without the distribution column require scatter-gather across all shards (slower); (3) JOINs between tables co-located on the same distribution column are local to each shard (fast); (4) JOINs with reference tables (replicated to all shards) are local. Limitations: (1) Cross-shard transactions have higher latency; (2) Cannot change the distribution column after table creation; (3) Complex subqueries and CTEs may not parallelize well; (4) Some PostgreSQL features (cursors, certain window functions across shards) have restrictions; (5) Data skew if the distribution column is not well-chosen (one shard gets disproportionate data).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Describe a data archival strategy for a table with 5 billion rows growing by 100M rows/month.</div>
  <div class="qa-a">Strategy: (1) Partition by month using declarative range partitioning on the timestamp column. Each partition holds ~100M rows (~manageable size). (2) Use pg_partman to automate partition creation (premake=3) and retention. (3) For retention: detach partitions older than the retention period (e.g., 12 months). (4) Export detached partitions to columnar storage (Parquet files on S3) using pg_dump or COPY for long-term archival. (5) For querying archived data: use foreign data wrappers (parquet_fdw or s3_fdw) to make archived data queryable without loading it into PostgreSQL. (6) Create a UNION ALL view spanning active partitions + foreign tables for transparent access. (7) Monitor partition sizes and adjust the interval (daily partitions if growth accelerates). (8) For the existing 5B rows: create new partitioned table, migrate data partition-by-partition during low-traffic windows, then swap table names.</div>
</div>`
  }
];
