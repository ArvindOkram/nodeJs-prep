export const mongodb = [
  {
    id: 'mongo-architecture',
    title: 'MongoDB Architecture',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Architecture — Exploring the basics
// Available collections: users, orders, products

// Check basic collection stats concept
db.users.find().limit(3);

// MongoDB stores data as BSON (Binary JSON)
// Each document has an _id field (ObjectId by default)
db.users.find(
  { age: { $gte: 25 } },
  { name: 1, email: 1, _id: 0 }
);

// MongoDB uses WiredTiger storage engine since 3.2
// Documents are stored in collections (analogous to tables)
db.products.find({ category: "electronics" });`,
    content: `
<h1>MongoDB Architecture</h1>
<p>MongoDB is a <strong>document-oriented NoSQL database</strong> designed for scalability, high availability, and high performance. Understanding its architecture is critical for SDE3-level interviews because it informs every decision from schema design to deployment topology.</p>

<h2>High-Level Architecture</h2>
<pre><code>Client Application
       |
    MongoDB Driver (Node.js, Python, Java, etc.)
       |
    mongos (Router — only in sharded clusters)
       |
    mongod (Database Server Process)
       |
  ┌────────────────────────────┐
  │   WiredTiger Storage Engine │
  │  ┌─────────┐ ┌───────────┐ │
  │  │  Cache   │ │  Journal  │ │
  │  │(in-memory│ │  (WAL)    │ │
  │  │ B-tree)  │ │           │ │
  │  └─────────┘ └───────────┘ │
  │        ↓                    │
  │   Data Files (.wt)         │
  │   on Disk (compressed)      │
  └────────────────────────────┘</code></pre>

<h2>Core Components</h2>
<table>
  <tr><th>Component</th><th>Role</th><th>Details</th></tr>
  <tr><td><strong>mongod</strong></td><td>Primary database process</td><td>Handles data requests, manages data access, performs background management. One per node.</td></tr>
  <tr><td><strong>mongos</strong></td><td>Query router (sharded clusters)</td><td>Routes queries to the correct shard(s). Stateless — can run multiple instances.</td></tr>
  <tr><td><strong>Config Servers</strong></td><td>Metadata store (sharded clusters)</td><td>Stores cluster metadata, shard key ranges, chunk locations. Deployed as a replica set.</td></tr>
</table>

<h2>WiredTiger Storage Engine</h2>
<p>Since MongoDB 3.2, <strong>WiredTiger</strong> is the default and only supported storage engine (MMAPv1 was removed in 4.2). WiredTiger is a high-performance, concurrent storage engine.</p>

<h3>Key Features</h3>
<table>
  <tr><th>Feature</th><th>Description</th><th>Impact</th></tr>
  <tr><td><strong>Document-Level Locking</strong></td><td>Locks individual documents, not entire collections or databases</td><td>Massive improvement over MMAPv1's collection-level locking. Enables high write concurrency.</td></tr>
  <tr><td><strong>Compression</strong></td><td>Snappy (default) for data, zlib/zstd for higher compression, prefix for indexes</td><td>50-80% storage reduction. zstd (4.2+) offers best ratio with acceptable CPU cost.</td></tr>
  <tr><td><strong>Journaling (WAL)</strong></td><td>Write-Ahead Log ensures durability</td><td>Writes go to journal first, then to data files. Checkpoints every 60s (or 2GB journal).</td></tr>
  <tr><td><strong>MVCC</strong></td><td>Multi-Version Concurrency Control</td><td>Readers don't block writers and vice versa. Each operation sees a consistent snapshot.</td></tr>
  <tr><td><strong>B-Tree Indexes</strong></td><td>Both data and indexes use B-tree structures</td><td>Efficient range queries, sorted access patterns.</td></tr>
</table>

<h3>WiredTiger Cache</h3>
<pre><code>// WiredTiger Internal Cache (default)
// Formula: max(256MB, 50% of (RAM - 1GB))

// Example: Server with 16GB RAM
// Cache = 50% of (16 - 1) = 7.5 GB

// Configure via:
// mongod --wiredTigerCacheSizeGB 10

// IMPORTANT: This is the INTERNAL cache only.
// MongoDB also uses the OS filesystem cache for
// reading compressed data from disk.</code></pre>

<div class="warning-note"><strong>Production Tip:</strong> Never set WiredTiger cache to more than 80% of available RAM. The OS needs memory for filesystem cache, connections, and the aggregation pipeline. A common mistake is setting it too high and causing OOM kills.</div>

<h3>Write Path in WiredTiger</h3>
<pre><code>Client Write Request
       ↓
1. Write to WiredTiger Cache (in-memory B-tree)
       ↓
2. Write to Journal (WAL) — every 50ms or on j:true
       ↓
3. Acknowledge to client (based on write concern)
       ↓
4. Checkpoint — flush dirty pages to data files
   (every 60 seconds or 2GB journal data)</code></pre>

<h2>MMAPv1 vs WiredTiger (Historical Context)</h2>
<table>
  <tr><th>Feature</th><th>MMAPv1 (deprecated)</th><th>WiredTiger</th></tr>
  <tr><td>Locking</td><td>Collection-level</td><td>Document-level</td></tr>
  <tr><td>Compression</td><td>None</td><td>Snappy, zlib, zstd</td></tr>
  <tr><td>Concurrency</td><td>Limited (readers block writers)</td><td>MVCC (non-blocking)</td></tr>
  <tr><td>In-place updates</td><td>Yes (with padding)</td><td>No (copy-on-write)</td></tr>
  <tr><td>Memory model</td><td>Memory-mapped files</td><td>Own cache + OS cache</td></tr>
</table>

<h2>Oplog (Operations Log)</h2>
<p>The <strong>oplog</strong> is a capped collection (<code>local.oplog.rs</code>) that records all write operations on the primary. Secondaries tail the oplog to replicate data.</p>

<pre><code>// Oplog entry structure (simplified)
{
  "ts": Timestamp(1620000000, 1),  // operation timestamp
  "op": "i",                        // i=insert, u=update, d=delete, c=command, n=noop
  "ns": "mydb.users",              // namespace (db.collection)
  "o": { "_id": ObjectId("..."), "name": "Alice", "age": 30 },  // document
  "o2": { "_id": ObjectId("...") }, // for updates: the query selector
  "wall": ISODate("2021-05-03T...")  // wall clock time
}

// Oplog is idempotent — applying the same entry multiple times
// produces the same result. This is critical for replication reliability.</code></pre>

<h3>Oplog Window</h3>
<p>The <strong>oplog window</strong> is the time difference between the oldest and newest entry. If a secondary falls behind by more than this window, it requires a full resync. Default oplog size: 5% of free disk space (min 990MB, max 50GB).</p>

<div class="warning-note"><strong>Production Alert:</strong> Monitor your oplog window. High-write workloads can shrink it to minutes. If a secondary goes down for maintenance longer than the oplog window, it needs a full initial sync (potentially hours for large datasets).</div>

<h2>MongoDB Wire Protocol</h2>
<p>MongoDB uses a custom binary protocol over TCP (default port 27017). Since MongoDB 3.6, the protocol uses <strong>OP_MSG</strong> as the primary message format.</p>

<pre><code>// Wire Protocol Evolution
// OP_INSERT, OP_UPDATE, OP_DELETE  → Legacy (removed in 6.0)
// OP_QUERY                         → Legacy (removed in 6.0)
// OP_MSG                           → Current (since 3.6)

// OP_MSG structure:
{
  flagBits: 0,           // checksum, moreToCome, exhaustAllowed
  sections: [
    { kind: 0, body: {   // command body
      find: "users",
      filter: { age: { $gt: 25 } },
      $db: "myapp"
    }}
  ],
  checksum: 0x12345678   // optional CRC-32C
}</code></pre>

<h2>Connection Management</h2>
<pre><code>// MongoDB drivers use connection pooling
// Node.js driver defaults:
{
  maxPoolSize: 100,      // max connections per mongos/mongod
  minPoolSize: 0,        // min idle connections
  maxIdleTimeMS: 0,      // max time a connection can be idle (0 = no limit)
  waitQueueTimeoutMS: 0, // max time to wait for a connection
  connectTimeoutMS: 30000,
  socketTimeoutMS: 0     // 0 means no timeout (OS default)
}

// Each connection consumes ~1MB of RAM on the server
// 100 app servers x 100 pool size = 10,000 connections = ~10GB RAM just for connections!</code></pre>

<div class="warning-note"><strong>Connection Storm:</strong> In microservice architectures, connection counts can explode. Use connection pooling wisely, consider MongoDB Atlas connection limits, and monitor <code>db.serverStatus().connections</code>. For serverless, consider Atlas Data API or connection string with <code>maxPoolSize=10</code>.</div>

<h2>BSON Format</h2>
<p>MongoDB stores data in <strong>BSON (Binary JSON)</strong>, which extends JSON with additional types.</p>
<table>
  <tr><th>JSON Type</th><th>BSON Additions</th></tr>
  <tr><td>String, Number, Boolean, Array, Object, null</td><td>ObjectId, Date, Timestamp, Int32, Int64, Decimal128, Binary, Regex, MinKey, MaxKey, Code</td></tr>
</table>

<pre><code>// BSON advantages over JSON:
// 1. Traversable — length-prefixed, can skip fields efficiently
// 2. Additional types — Date, ObjectId, Decimal128, etc.
// 3. Efficient encoding — integers stored as integers, not strings

// ObjectId structure (12 bytes):
// [4 bytes timestamp][5 bytes random][3 bytes counter]
// This means ObjectIds are roughly time-ordered!</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: What is document-level locking and why is it important?</div>
  <div class="qa-a">WiredTiger implements document-level concurrency control using optimistic locking. When two writes target different documents, they proceed in parallel without blocking each other. If two writes target the same document, one will proceed and the other will transparently retry. This is a massive improvement over MMAPv1's collection-level locking, which serialized all writes to the same collection. Document-level locking enables MongoDB to handle high write throughput on multi-core systems.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between the WiredTiger cache and the filesystem cache.</div>
  <div class="qa-a">WiredTiger maintains its own internal cache that stores data in an uncompressed, in-memory B-tree format optimized for CPU access. The OS filesystem cache stores compressed data pages as they exist on disk. A read first checks the WT cache (uncompressed, fast). If not found, it reads from the filesystem cache (compressed, needs decompression). If not there either, it reads from disk. The WT cache defaults to 50% of (RAM - 1GB), and the remaining memory is available for the filesystem cache, connections, and aggregation. Both caches work together — WT cache for hot data, filesystem cache for warm data.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does the oplog differ from a traditional database transaction log?</div>
  <div class="qa-a">The oplog is a capped collection in the <code>local</code> database that stores an idempotent representation of every write operation. Unlike traditional WAL/redo logs that store physical page changes, the oplog stores logical operations (insert document X, update field Y in document Z). Being idempotent means applying the same oplog entry multiple times produces the same result — critical for replication reliability. The oplog is also used by change streams, and its capped nature means old entries are automatically removed when size limits are reached.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens when a secondary's replication lag exceeds the oplog window?</div>
  <div class="qa-a">When a secondary falls behind the primary by more than the oplog window (the time span covered by the oplog), it enters the <strong>RECOVERING</strong> state and cannot serve reads. The secondary must perform a full <strong>initial sync</strong> — copying all data from the primary from scratch. For large datasets (terabytes), this can take hours or days. To prevent this: (1) size your oplog appropriately using <code>replSetResizeOplog</code>, (2) monitor replication lag with <code>rs.printReplicationInfo()</code>, and (3) avoid long-running maintenance windows on secondaries without increasing oplog size first.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why does MongoDB use a custom wire protocol instead of HTTP/REST?</div>
  <div class="qa-a">MongoDB's binary wire protocol (OP_MSG since 3.6) is optimized for database workloads: (1) binary BSON encoding avoids JSON serialization overhead, (2) the protocol supports cursor batching for large result sets, (3) it enables features like exhaust cursors where the server pushes results without per-batch requests, (4) compression (snappy, zlib, zstd) is built into the protocol layer, (5) lower overhead per message compared to HTTP headers. HTTP/REST would add latency and bandwidth overhead for the high-frequency, small-message patterns typical in database communication.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does MongoDB handle checkpointing, and what happens during a crash between checkpoints?</div>
  <div class="qa-a">WiredTiger creates checkpoints every 60 seconds (or when 2GB of journal data accumulates). A checkpoint writes all dirty data from the in-memory cache to the data files, creating a consistent snapshot on disk. If MongoDB crashes between checkpoints, the journal (WAL) is used for recovery: on restart, MongoDB applies all journal entries since the last checkpoint to bring the data files up to date. With <code>j: true</code> write concern, journal writes are flushed to disk on every acknowledged write. Without it, journal entries are flushed every 50ms by default, meaning up to 50ms of writes could be lost on a hard crash.</div>
</div>`
  },
  {
    id: 'mongo-data-modeling',
    title: 'MongoDB Data Modeling',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Data Modeling — Embedding vs Referencing
// Available collections: users, orders, products

// EMBEDDING: Orders have items embedded directly
// This is the "data that is accessed together" pattern
db.orders.find(
  { status: "completed" },
  { userId: 1, total: 1, "items.name": 1, _id: 0 }
);

// REFERENCING: Orders reference userId (not embedded user)
// Join user data with order data using $lookup
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
  }},
  { $unwind: "$user" },
  { $project: {
      "user.name": 1,
      total: 1,
      status: 1
  }}
]);

// Subset pattern: Only project needed fields
db.users.find(
  { department: "Engineering" },
  { name: 1, email: 1, skills: 1, _id: 0 }
);`,
    content: `
<h1>MongoDB Data Modeling</h1>
<p>Data modeling in MongoDB is fundamentally different from relational databases. Instead of normalizing into tables, you model data based on <strong>how the application accesses it</strong>. The golden rule: <em>data that is accessed together should be stored together</em>.</p>

<h2>Embedding vs Referencing</h2>
<table>
  <tr><th>Criteria</th><th>Embedding (Denormalization)</th><th>Referencing (Normalization)</th></tr>
  <tr><td>Read performance</td><td>Single query retrieves all data</td><td>Requires $lookup or multiple queries</td></tr>
  <tr><td>Write performance</td><td>Single atomic write</td><td>Multiple writes (no atomicity without transactions)</td></tr>
  <tr><td>Data duplication</td><td>Yes — updates may need to propagate</td><td>No — single source of truth</td></tr>
  <tr><td>Document size</td><td>Can grow unbounded (16MB limit!)</td><td>Predictable size</td></tr>
  <tr><td>Relationship type</td><td>Best for 1:1 and 1:few</td><td>Best for 1:many and many:many</td></tr>
  <tr><td>Access pattern</td><td>Data always read together</td><td>Data read independently</td></tr>
</table>

<h3>When to Embed</h3>
<pre><code>// EMBED when:
// 1. "Contains" relationship (address inside user)
// 2. One-to-few relationship (user has 2-3 addresses)
// 3. Data is always read together
// 4. Nested data doesn't change independently

// Example: User with embedded address
{
  _id: ObjectId("..."),
  name: "Alice",
  email: "alice@example.com",
  address: {                    // Embedded document
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94102"
  },
  phones: [                     // Embedded array (1:few)
    { type: "home", number: "555-0100" },
    { type: "work", number: "555-0200" }
  ]
}</code></pre>

<h3>When to Reference</h3>
<pre><code>// REFERENCE when:
// 1. Many-to-many relationships
// 2. Large or unbounded sub-documents
// 3. Data is frequently accessed independently
// 4. Data changes frequently and duplication is costly

// Example: Orders referencing users and products
// users collection
{ _id: ObjectId("user1"), name: "Alice", email: "alice@example.com" }

// orders collection (references user by ID)
{
  _id: ObjectId("order1"),
  userId: ObjectId("user1"),       // Reference
  items: [
    { productId: ObjectId("p1"), qty: 2, price: 29.99 },
    { productId: ObjectId("p2"), qty: 1, price: 49.99 }
  ],
  total: 109.97
}</code></pre>

<h2>Relationship Patterns</h2>

<h3>One-to-One</h3>
<pre><code>// Usually embed. Separate only if:
// - Subdocument is large and rarely accessed
// - Subdocument needs different access controls

// Embedded (preferred)
{
  _id: "user1",
  name: "Alice",
  profile: { bio: "...", avatar: "...", preferences: {...} }
}

// Referenced (for large/sensitive data)
// users: { _id: "user1", name: "Alice" }
// profiles: { _id: "profile1", userId: "user1", bio: "...", ... }</code></pre>

<h3>One-to-Many (Few)</h3>
<pre><code>// Embed the "many" side in the "one" side
// Example: Blog post with comments (if comments are few)
{
  _id: "post1",
  title: "MongoDB Modeling",
  comments: [       // Embedded — max ~100 is safe
    { author: "Bob", text: "Great post!", date: ISODate("...") },
    { author: "Carol", text: "Very helpful", date: ISODate("...") }
  ]
}</code></pre>

<h3>One-to-Many (Thousands)</h3>
<pre><code>// Reference from the "many" side to the "one" side
// Example: Event logging — millions of events per host
// hosts: { _id: "host1", name: "web-server-01", ip: "10.0.0.1" }
// events: { _id: "evt1", hostId: "host1", type: "error", msg: "...", ts: ISODate("...") }

// Index on events.hostId for efficient lookups
// db.events.createIndex({ hostId: 1, ts: -1 })</code></pre>

<h3>Many-to-Many</h3>
<pre><code>// Use arrays of references on one or both sides
// Example: Students and Courses

// students
{ _id: "s1", name: "Alice", courseIds: ["c1", "c2", "c3"] }

// courses
{ _id: "c1", name: "MongoDB 101", studentIds: ["s1", "s2", "s3"] }

// WARNING: If arrays can grow unbounded, reference from one side only
// and use $lookup or application-level joins for the other direction.

// Alternative: Junction collection (like relational)
// enrollments: { studentId: "s1", courseId: "c1", enrolledAt: ISODate("..."), grade: null }</code></pre>

<h2>Advanced Design Patterns</h2>

<h3>Subset Pattern</h3>
<pre><code>// Problem: Document has a large array but you usually only need recent items
// Solution: Keep recent subset in main doc, full history in separate collection

// products (main — fast reads)
{
  _id: "p1",
  name: "Widget",
  recentReviews: [         // Only last 10 reviews
    { user: "Alice", rating: 5, text: "...", date: ISODate("...") },
    // ... (max 10)
  ],
  avgRating: 4.5,
  totalReviews: 1250
}

// reviews (full history — archive)
{ _id: "r1", productId: "p1", user: "Alice", rating: 5, text: "...", date: ISODate("...") }
// ... 1250 documents</code></pre>

<h3>Bucket Pattern</h3>
<pre><code>// Problem: Time-series data with millions of small documents
// Solution: Group measurements into "buckets" by time window

// Instead of one document per reading:
// { sensorId: "s1", temp: 72.5, ts: ISODate("2024-01-01T00:00:00") }
// { sensorId: "s1", temp: 72.8, ts: ISODate("2024-01-01T00:01:00") }
// ... millions of tiny docs

// Bucket by hour:
{
  sensorId: "s1",
  date: ISODate("2024-01-01T00:00:00"),  // bucket start
  readings: [
    { temp: 72.5, ts: ISODate("2024-01-01T00:00:00") },
    { temp: 72.8, ts: ISODate("2024-01-01T00:01:00") },
    // ... up to 60 readings per hour
  ],
  count: 60,
  sum: 4350.2,          // Pre-computed for fast aggregation
  min: 71.1,
  max: 73.9
}

// Benefits: Fewer documents, pre-computed aggregates, better index efficiency
// MongoDB 5.0+ has native Time Series collections that automate this!</code></pre>

<h3>Computed Pattern</h3>
<pre><code>// Problem: Expensive aggregations computed on every read
// Solution: Pre-compute and store the result

// Instead of aggregating all orders on every request:
{
  _id: "user1",
  name: "Alice",
  // Pre-computed fields (updated on writes)
  stats: {
    totalOrders: 47,
    totalSpent: 3245.67,
    avgOrderValue: 69.06,
    lastOrderDate: ISODate("2024-03-15"),
    favoriteCategory: "electronics"
  }
}

// Update computed fields atomically with $inc, $set on each order
// db.users.updateOne(
//   { _id: "user1" },
//   { $inc: { "stats.totalOrders": 1, "stats.totalSpent": orderTotal },
//     $set: { "stats.lastOrderDate": new Date() } }
// )</code></pre>

<h3>Outlier Pattern</h3>
<pre><code>// Problem: Most documents are small, but a few are huge
// Example: Most users have 10 followers, celebrities have 10 million

// Regular user
{ _id: "user1", name: "Alice", followers: ["u2", "u3", "u4"], hasOverflow: false }

// Celebrity — flag overflow, store excess in separate collection
{ _id: "celeb1", name: "Famous Person", followers: [...first 1000...], hasOverflow: true }
// followers_overflow: { userId: "celeb1", followers: [...next batch...], page: 2 }</code></pre>

<h2>Schema Design Anti-Patterns</h2>

<h3>1. Unbounded Arrays</h3>
<pre><code>// BAD: Array grows without limit
{
  _id: "popular-post",
  title: "Viral Article",
  comments: [
    // Could grow to millions! Document will hit 16MB limit.
    // Each update rewrites the entire document.
    // Index on comments.userId becomes huge and slow.
  ]
}

// GOOD: Reference with a separate collection
// comments: { postId: "popular-post", userId: "u1", text: "...", ts: ISODate("...") }
// Index: db.comments.createIndex({ postId: 1, ts: -1 })</code></pre>

<h3>2. Deep Nesting</h3>
<pre><code>// BAD: Deeply nested documents (MongoDB supports up to 100 levels)
{
  company: {
    departments: [{
      teams: [{
        members: [{
          tasks: [{
            subtasks: [{
              // Querying and indexing this is painful
              // $elemMatch doesn't work well at depth > 2
            }]
          }]
        }]
      }]
    }]
  }
}

// GOOD: Flatten into separate collections with references</code></pre>

<h3>3. Massive Documents</h3>
<div class="warning-note"><strong>16MB Document Size Limit:</strong> BSON documents cannot exceed 16MB. This is a hard limit. Arrays of references, embedded comments, or activity logs can hit this. Always estimate maximum document size. If an array can grow unbounded, use a separate collection.</div>

<h3>4. Storing Large Files in Documents</h3>
<pre><code>// BAD: Storing files as Binary data in regular documents
{ _id: "file1", data: BinData(0, "...10MB of data..."), name: "report.pdf" }

// GOOD: Use GridFS for files > 16MB
// GridFS splits files into 255KB chunks stored in fs.chunks
// Metadata in fs.files
// Or better: store in S3/GCS and keep URL in MongoDB</code></pre>

<h2>Schema Validation</h2>
<pre><code>// MongoDB supports JSON Schema validation (3.6+)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "age"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\\\..+$",
          description: "must be a valid email"
        },
        age: {
          bsonType: "int",
          minimum: 0,
          maximum: 150,
          description: "must be between 0 and 150"
        },
        skills: {
          bsonType: "array",
          items: { bsonType: "string" },
          maxItems: 50
        }
      }
    }
  },
  validationLevel: "strict",    // "off", "strict", "moderate"
  validationAction: "error"     // "error" or "warn"
});

// validationLevel: "moderate" — only validates inserts and updates to
// documents that already match the schema (useful for migration)</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How do you decide between embedding and referencing?</div>
  <div class="qa-a">The decision is driven by access patterns, not data relationships. Ask: (1) Is the data always read together? Embed. (2) Can the embedded array grow unbounded? Reference. (3) Is the data updated independently? Reference. (4) What's the read-to-write ratio? High reads favor embedding (one query). (5) What's the cardinality? 1:few embed, 1:many reference, many:many use arrays of references or junction collection. (6) Does the data need to be accessed independently? Reference. The sweet spot is embedding data that's read together and has a bounded, predictable size.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the implications of the 16MB document size limit?</div>
  <div class="qa-a">The 16MB BSON limit means: (1) arrays cannot grow unbounded — a comments array with thousands of entries will eventually hit the limit, (2) embedded arrays should have a practical upper bound you can estimate, (3) GridFS must be used for files > 16MB, (4) consider the subset pattern if only recent data is needed, (5) the 16MB limit is on the BSON-encoded size, not the JSON representation — BSON can be larger due to type metadata. In practice, well-designed documents rarely exceed 100KB. If a document is approaching even 1MB, reconsider the schema.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the Bucket pattern and when you would use it.</div>
  <div class="qa-a">The Bucket pattern groups related data points into a single document, typically by time window. Instead of one document per IoT sensor reading (millions of tiny docs), you group readings by hour/day into one document. Benefits: (1) dramatically fewer documents and index entries, (2) pre-computed aggregates (sum, min, max, count) in each bucket for fast queries, (3) better write performance (updating one document vs inserting many), (4) natural data lifecycle — drop old buckets easily. Use it for time-series data, event logging, or any high-frequency data that's queried in ranges. MongoDB 5.0+ has native Time Series collections that automate this pattern.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle schema changes in production MongoDB?</div>
  <div class="qa-a">MongoDB's flexible schema is both a strength and a risk. Strategies: (1) Use <strong>schema validation</strong> with <code>validationLevel: "moderate"</code> during migration — this validates new writes but doesn't reject existing documents that don't match. (2) Use <strong>application-level versioning</strong> — add a <code>schemaVersion</code> field and handle different versions in application code. (3) Write <strong>migration scripts</strong> using <code>updateMany()</code> to backfill new fields. (4) Use <strong>default values</strong> in application code for missing fields. (5) Never remove fields abruptly — deprecate first, then remove after all documents are migrated. (6) Use change streams to transform documents lazily on read.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a schema for an e-commerce product catalog with variable attributes.</div>
  <div class="qa-a">This is the classic "polymorphic schema" problem. Approach: (1) Common fields at the top level: <code>_id, name, price, category, brand, images, createdAt</code>. (2) Category-specific attributes in a <code>specs</code> embedded document: for electronics <code>{ screenSize: 15, ram: 16, cpu: "M2" }</code>, for clothing <code>{ size: "M", color: "blue", material: "cotton" }</code>. (3) Use <strong>wildcard indexes</strong> on <code>specs.$**</code> to index all attribute fields. (4) Use <strong>schema validation</strong> per category (or application-level). (5) For filterable attributes, consider the <strong>Attribute pattern</strong>: store as <code>attributes: [{k: "color", v: "blue"}, {k: "size", v: "M"}]</code> with a compound index on <code>{"attributes.k": 1, "attributes.v": 1}</code>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between validationLevel "strict" and "moderate"?</div>
  <div class="qa-a"><strong>strict</strong> (default): applies validation rules to all inserts and updates. Any document that doesn't match is rejected. <strong>moderate</strong>: applies validation only to documents that already satisfy the validation rules. Existing non-conforming documents can still be updated (as long as the update doesn't make them conform — once they conform, they must stay conforming). This is essential for gradual migration — you can add validation to an existing collection without breaking updates to old-format documents.</div>
</div>`
  },
  {
    id: 'mongo-indexing',
    title: 'MongoDB Indexing',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Indexing — Query Performance
// Available collections: users, orders, products

// Without index: collection scan (COLLSCAN)
// With index: index scan (IXSCAN)

// Single field query — uses index on 'age' if it exists
db.users.find({ age: { $gt: 30 } });

// Compound index query: { department: 1, salary: -1 }
// Follows ESR rule: Equality, Sort, Range
db.users.find(
  { department: "Engineering" }
).sort({ salary: -1 });

// Covered query — only returns indexed fields, no doc fetch
db.users.find(
  { department: "Engineering" },
  { department: 1, salary: 1, _id: 0 }
);

// Multikey index — on array field 'skills'
db.users.find({ skills: "JavaScript" });

// Text search on product names
db.products.find({ name: { $regex: /phone/i } });

// Aggregation using indexes efficiently
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: "$userId",
      totalSpent: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]);`,
    content: `
<h1>MongoDB Indexing</h1>
<p>Indexes are the single most important factor in MongoDB query performance. Without an appropriate index, MongoDB performs a <strong>collection scan (COLLSCAN)</strong> — reading every document. At SDE3 level, you need to understand index internals, the ESR rule, and how to diagnose performance issues using <code>explain()</code>.</p>

<h2>Index Fundamentals</h2>
<p>MongoDB indexes are <strong>B-tree</strong> data structures (WiredTiger uses B+ trees internally) that store a small portion of the collection's data in an easily traversable form. Each index entry contains the value of the indexed field(s) and a pointer to the document on disk.</p>

<pre><code>// Create an index
db.users.createIndex({ email: 1 })          // ascending
db.users.createIndex({ age: -1 })           // descending
db.users.createIndex({ email: 1 }, { unique: true })  // unique constraint
db.users.createIndex({ name: 1 }, { background: true }) // non-blocking (pre-4.2)
// Note: Since 4.2, all index builds are hybrid (non-blocking for reads/writes)</code></pre>

<h2>Index Types</h2>

<h3>1. Single Field Index</h3>
<pre><code>db.users.createIndex({ email: 1 })

// Supports queries on:
db.users.find({ email: "alice@example.com" })  // exact match
db.users.find({ email: { $gt: "a" } })         // range
db.users.find().sort({ email: 1 })              // sort ascending
db.users.find().sort({ email: -1 })             // sort descending (traversed in reverse)

// Direction doesn't matter for single field indexes!
// { email: 1 } and { email: -1 } are equivalent for queries</code></pre>

<h3>2. Compound Index</h3>
<pre><code>db.users.createIndex({ department: 1, salary: -1, age: 1 })

// This single index supports these queries (prefix rule):
db.users.find({ department: "Eng" })                        // uses { department: 1 }
db.users.find({ department: "Eng", salary: { $gt: 50000 } }) // uses { department: 1, salary: -1 }
db.users.find({ department: "Eng" }).sort({ salary: -1 })    // uses full index

// Does NOT efficiently support:
db.users.find({ salary: { $gt: 50000 } })       // skips prefix
db.users.find({ age: { $gt: 25 } })              // skips prefix
db.users.find().sort({ salary: -1, department: 1 }) // wrong sort order

// INDEX PREFIX RULE: A compound index supports queries on any prefix
// { a: 1, b: 1, c: 1 } supports queries on:
//   { a: 1 }, { a: 1, b: 1 }, { a: 1, b: 1, c: 1 }</code></pre>

<div class="warning-note"><strong>Direction matters in compound indexes!</strong> For a compound index, the sort direction of each field matters. <code>{ a: 1, b: -1 }</code> supports <code>sort({ a: 1, b: -1 })</code> and <code>sort({ a: -1, b: 1 })</code> (full reversal), but NOT <code>sort({ a: 1, b: 1 })</code>.</div>

<h3>3. Multikey Index</h3>
<pre><code>// Automatically created when indexing an array field
db.users.createIndex({ skills: 1 })

// For a document: { skills: ["JavaScript", "Python", "Go"] }
// MongoDB creates THREE index entries (one per array element)

// Supports:
db.users.find({ skills: "JavaScript" })              // contains element
db.users.find({ skills: { $in: ["JavaScript", "Go"] } })  // contains any
db.users.find({ skills: { $all: ["JavaScript", "Go"] } }) // contains all

// LIMITATION: A compound index can have AT MOST ONE array field
// { tags: 1, categories: 1 } — INVALID if both are arrays
// This is because the cross-product would explode index size</code></pre>

<h3>4. Text Index</h3>
<pre><code>// Full-text search (one text index per collection)
db.products.createIndex({ name: "text", description: "text" })

// Query:
db.products.find({ $text: { $search: "wireless bluetooth" } })         // OR
db.products.find({ $text: { $search: "\\"wireless bluetooth\\"" } })   // exact phrase
db.products.find({ $text: { $search: "wireless -wired" } })            // exclude

// Text score (relevance):
db.products.find(
  { $text: { $search: "bluetooth speaker" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })

// Supports language-specific stemming and stop words
// For production full-text search, consider Atlas Search (Lucene-based)</code></pre>

<h3>5. Geospatial Indexes</h3>
<pre><code>// 2dsphere index for GeoJSON data (Earth-like sphere)
db.stores.createIndex({ location: "2dsphere" })

// Find stores near a point
db.stores.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
      $maxDistance: 5000  // meters
    }
  }
})

// Find stores within a polygon
db.stores.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[[-74,40],[-73,40],[-73,41],[-74,41],[-74,40]]]
      }
    }
  }
})</code></pre>

<h3>6. Hashed Index</h3>
<pre><code>// Used primarily for hash-based sharding
db.users.createIndex({ email: "hashed" })

// Supports ONLY equality queries — no range, no sort
db.users.find({ email: "alice@example.com" })  // works
db.users.find({ email: { $gt: "a" } })          // COLLSCAN! Cannot use hashed index

// Ensures uniform distribution — good for shard keys</code></pre>

<h3>7. Wildcard Index</h3>
<pre><code>// Index all fields in a document (MongoDB 4.2+)
db.products.createIndex({ "$**": 1 })

// Index all fields under a specific path
db.products.createIndex({ "specs.$**": 1 })

// Useful for:
// - Polymorphic schemas (different fields per document)
// - Ad-hoc query patterns that aren't known upfront

// LIMITATIONS:
// - Cannot support compound queries efficiently
// - Cannot support sort operations
// - Larger index size than targeted indexes
// - Not a replacement for proper compound indexes</code></pre>

<h3>8. TTL Index (Time-to-Live)</h3>
<pre><code>// Automatically delete documents after a specified time
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // delete after 1 hour
)

// Documents are deleted by a background thread every 60 seconds
// So actual deletion may be up to ~60 seconds late

// Can also use a specific expiry date:
// { _id: "session1", expiresAt: ISODate("2024-01-01T00:00:00Z") }
// db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Common uses: sessions, temp data, logs, cache entries</code></pre>

<h2>The ESR Rule (Equality, Sort, Range)</h2>
<p>The <strong>ESR Rule</strong> is the most important compound index design guideline. Order the fields in your compound index as: <strong>Equality</strong> fields first, then <strong>Sort</strong> fields, then <strong>Range</strong> fields.</p>

<pre><code>// Query:
db.orders.find({
  status: "completed",     // EQUALITY (exact match)
  total: { $gt: 100 }      // RANGE
}).sort({ createdAt: -1 })  // SORT

// OPTIMAL index following ESR:
db.orders.createIndex({ status: 1, createdAt: -1, total: 1 })
//                       ↑ E          ↑ S              ↑ R

// WHY this order?
// 1. Equality first: narrows to exact matches (most selective)
// 2. Sort next: index is already sorted, no in-memory sort needed
// 3. Range last: scans only the necessary range within sorted results

// BAD index: { status: 1, total: 1, createdAt: -1 }
// Range before Sort means MongoDB must sort in memory (SORT_KEY_GENERATOR)</code></pre>

<div class="warning-note"><strong>ESR is a guideline, not an absolute rule.</strong> If the range filter is very selective (filters out 99% of docs), putting it before sort may be faster. Always validate with <code>explain()</code> on production-like data.</div>

<h2>Index Intersection</h2>
<pre><code>// MongoDB can use multiple indexes for a single query (2.6+)
// If you have:
db.users.createIndex({ department: 1 })
db.users.createIndex({ age: 1 })

// This query CAN use both indexes:
db.users.find({ department: "Eng", age: { $gt: 30 } })

// MongoDB finds matching _ids from each index, then intersects them
// However, a compound index { department: 1, age: 1 } is almost always faster
// Index intersection is a fallback, not a strategy</code></pre>

<h2>Covered Queries</h2>
<pre><code>// A "covered query" is fulfilled entirely from the index — no document fetch
// Conditions:
// 1. All queried fields are in the index
// 2. All projected fields are in the index
// 3. No field in the query is an array (multikey)
// 4. _id is excluded from projection (unless it's in the index)

db.users.createIndex({ department: 1, email: 1, salary: 1 })

// COVERED — all fields in index, _id excluded
db.users.find(
  { department: "Eng" },
  { department: 1, email: 1, salary: 1, _id: 0 }
)
// explain() will show: totalDocsExamined: 0

// NOT COVERED — name is not in the index
db.users.find(
  { department: "Eng" },
  { department: 1, name: 1, _id: 0 }
)</code></pre>

<h2>Reading explain() Output</h2>
<pre><code>db.users.find({ department: "Eng", age: { $gt: 25 } }).explain("executionStats")

// Key fields to examine:
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "FETCH",                    // had to fetch documents
      "inputStage": {
        "stage": "IXSCAN",                // used an index scan
        "indexName": "dept_age_idx",
        "direction": "forward",
        "indexBounds": {
          "department": ["[\\"Eng\\", \\"Eng\\"]"],  // equality
          "age": ["(25, inf]"]                      // range
        }
      }
    }
  },
  "executionStats": {
    "nReturned": 150,           // documents returned
    "totalKeysExamined": 150,   // index entries scanned
    "totalDocsExamined": 150,   // documents fetched from disk
    "executionTimeMillis": 2    // total time
  }
}

// IDEAL: nReturned ≈ totalKeysExamined ≈ totalDocsExamined
// RED FLAGS:
//   totalKeysExamined >> nReturned → index not selective enough
//   totalDocsExamined >> nReturned → filtering after fetch
//   stage: "COLLSCAN" → no index used!
//   stage: "SORT" → in-memory sort (check for SORT_KEY_GENERATOR)</code></pre>

<h2>Index Management Best Practices</h2>
<table>
  <tr><th>Practice</th><th>Why</th></tr>
  <tr><td>Delete unused indexes</td><td>Indexes consume RAM and slow down writes. Use <code>$indexStats</code> to find unused ones.</td></tr>
  <tr><td>Limit to ~5-10 indexes per collection</td><td>Each write updates every index. Too many indexes kill write performance.</td></tr>
  <tr><td>Use compound indexes over multiple single-field</td><td>One compound index can serve many query shapes via prefix matching.</td></tr>
  <tr><td>Index only what you query</td><td>Indexes on fields never queried/sorted/filtered waste resources.</td></tr>
  <tr><td>Monitor index size</td><td>Indexes should fit in RAM. Use <code>db.collection.stats().indexSizes</code>.</td></tr>
  <tr><td>Use partial indexes</td><td><code>{ partialFilterExpression: { status: "active" } }</code> — smaller index, only indexes matching docs.</td></tr>
</table>

<pre><code>// Partial Index — only indexes active users
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { status: "active" } }
)
// 90% of users are inactive? Index is 10x smaller!

// IMPORTANT: query must include the partial filter expression
// or the index won't be considered by the planner
db.users.find({ email: "alice@example.com", status: "active" })  // uses index
db.users.find({ email: "alice@example.com" })                     // may NOT use index</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Explain the ESR rule and why field order matters in compound indexes.</div>
  <div class="qa-a">The ESR (Equality, Sort, Range) rule dictates optimal field ordering in compound indexes. <strong>Equality fields first</strong> because they provide exact matches, narrowing the search to a precise subset of the index. <strong>Sort fields next</strong> because with equality prefix already matched, the remaining index entries are already sorted — avoiding expensive in-memory sorts. <strong>Range fields last</strong> because range conditions scan a portion of the index; placing them after sort ensures the sort order is maintained by the index. Example: for <code>find({status:"active", price:{$gt:10}}).sort({date:-1})</code>, the optimal index is <code>{status:1, date:-1, price:1}</code>, NOT <code>{status:1, price:1, date:-1}</code>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a covered query and why is it fast?</div>
  <div class="qa-a">A covered query is one where all fields needed (both filter and projection) exist in the index itself, so MongoDB never needs to fetch the actual document from disk. It returns results directly from the index B-tree. This eliminates the most expensive part of query execution — random disk I/O to fetch documents. In <code>explain()</code> output, a covered query shows <code>totalDocsExamined: 0</code>. Requirements: all query fields in the index, all projected fields in the index, <code>_id: 0</code> in projection (unless _id is in the index), and no array/multikey fields. Covered queries can be 10-100x faster than regular queries on disk-bound workloads.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use a wildcard index vs a compound index?</div>
  <div class="qa-a">Wildcard indexes (<code>{"$**": 1}</code> or <code>{"field.$**": 1}</code>) are for polymorphic schemas where different documents have different fields (e.g., product catalogs with varying attributes). They index all scalar fields under the specified path. Use them when: (1) query patterns are unpredictable/ad-hoc, (2) the schema is polymorphic, (3) you need a baseline index for all fields. Use compound indexes when: (1) query patterns are known and stable, (2) you need multi-field query optimization, (3) you need sorted results, (4) you need covered queries. Compound indexes are almost always faster for known query patterns. Wildcard indexes cannot efficiently support compound predicates or sorts.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does MongoDB decide which index to use for a query?</div>
  <div class="qa-a">MongoDB uses a <strong>query planner</strong> that: (1) identifies all candidate indexes that could support the query, (2) creates a query plan for each candidate, (3) runs all plans concurrently in a "race" — the first plan to return a batch of results (101 documents or a full sort key set) wins, (4) caches the winning plan for future queries with the same "shape." The plan cache is invalidated when: the collection receives 1000+ writes, indexes are added/dropped, or the server restarts. You can view cached plans with <code>db.collection.getPlanCache().list()</code> and clear them with <code>.clear()</code>. This empirical approach means MongoDB adapts to data distribution changes over time.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the performance implications of too many indexes?</div>
  <div class="qa-a">Every index has costs: (1) <strong>Write amplification</strong> — each insert/update/delete must update every index. 10 indexes means 10x the index write operations. (2) <strong>RAM consumption</strong> — all active indexes should fit in RAM. If they spill to disk, every query causes page faults. (3) <strong>Storage overhead</strong> — indexes consume disk space (sometimes more than the data itself). (4) <strong>Write lock contention</strong> — more indexes mean more lock operations per write. (5) <strong>Build time</strong> — building indexes on large collections blocks the primary (or uses hybrid builds which are slower). Rule of thumb: keep indexes under 10 per collection, use compound indexes to cover multiple query patterns, and regularly audit with <code>db.collection.aggregate([{$indexStats:{}}])</code> to find and remove unused indexes.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain partial indexes and sparse indexes — what is the difference?</div>
  <div class="qa-a"><strong>Sparse indexes</strong> only include documents where the indexed field exists (skip documents with null/missing). <strong>Partial indexes</strong> (3.2+) are a superset — they include only documents matching an arbitrary <code>partialFilterExpression</code> filter. Partial indexes are strictly more powerful: you can replicate sparse behavior with <code>{ partialFilterExpression: { field: { $exists: true } } }</code>, but you can also do <code>{ partialFilterExpression: { status: "active" } }</code> to index only active documents. Key caveat: the query must include the partial filter expression, or the query planner will not consider the partial index. Sparse indexes have been largely superseded by partial indexes in modern MongoDB.</div>
</div>`
  },
  {
    id: 'mongo-aggregation',
    title: 'MongoDB Aggregation Pipeline',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Aggregation Pipeline
// Available collections: users, orders, products

// Basic aggregation: Total revenue by status
db.orders.aggregate([
  { $group: {
      _id: "$status",
      totalRevenue: { $sum: "$total" },
      orderCount: { $sum: 1 },
      avgOrder: { $avg: "$total" }
  }},
  { $sort: { totalRevenue: -1 } }
]);

// $lookup (JOIN) — Orders with user details
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "customer"
  }},
  { $unwind: "$customer" },
  { $project: {
      "customer.name": 1,
      total: 1,
      itemCount: { $size: "$items" }
  }},
  { $limit: 5 }
]);

// $unwind + $group — Top selling products
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: {
      _id: "$items.name",
      totalQty: { $sum: "$items.qty" },
      totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 }
]);

// $facet — Multiple aggregations in one query
db.products.aggregate([
  { $facet: {
      byCategory: [
        { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } }
      ],
      priceRanges: [
        { $bucket: {
            groupBy: "$price",
            boundaries: [0, 25, 50, 100, 500, Infinity],
            default: "Other",
            output: { count: { $sum: 1 } }
        }}
      ],
      topRated: [
        { $sort: { rating: -1 } },
        { $limit: 3 },
        { $project: { name: 1, rating: 1, price: 1 } }
      ]
  }}
]);`,
    content: `
<h1>MongoDB Aggregation Pipeline</h1>
<p>The aggregation pipeline is MongoDB's most powerful data processing framework. Documents enter a multi-stage pipeline where each stage transforms the documents. Understanding pipeline optimization, memory limits, and stage ordering is critical for SDE3 interviews.</p>

<h2>Pipeline Architecture</h2>
<pre><code>Input Documents
     ↓
┌─────────────┐
│   $match     │  ← Filter early (uses indexes!)
└──────┬──────┘
       ↓
┌─────────────┐
│   $project   │  ← Reshape documents
└──────┬──────┘
       ↓
┌─────────────┐
│   $group     │  ← Aggregate values
└──────┬──────┘
       ↓
┌─────────────┐
│   $sort      │  ← Order results
└──────┬──────┘
       ↓
Output Documents</code></pre>

<h2>Core Pipeline Stages</h2>

<h3>$match — Filter Documents</h3>
<pre><code>// Place $match as EARLY as possible — it can use indexes!
{ $match: { status: "completed", total: { $gt: 100 } } }

// $match at the beginning of a pipeline can use any index
// $match after $group/$project/$unwind CANNOT use indexes

// Supports all query operators: $gt, $in, $regex, $geoWithin, etc.
// Does NOT support $where or $text (use $match with $text only as first stage)</code></pre>

<h3>$group — Aggregate Values</h3>
<pre><code>{ $group: {
    _id: "$department",                        // group key (null for entire collection)
    totalSalary: { $sum: "$salary" },          // sum
    avgSalary: { $avg: "$salary" },            // average
    maxSalary: { $max: "$salary" },            // maximum
    minSalary: { $min: "$salary" },            // minimum
    employeeCount: { $sum: 1 },                // count
    employees: { $push: "$name" },             // collect into array
    uniqueCities: { $addToSet: "$city" },       // unique values
    firstHired: { $first: "$joinedAt" },       // first in group (with $sort)
    lastHired: { $last: "$joinedAt" }          // last in group (with $sort)
}}

// Multi-field group key:
{ $group: { _id: { dept: "$department", city: "$city" }, count: { $sum: 1 } } }

// Group entire collection:
{ $group: { _id: null, totalUsers: { $sum: 1 }, avgAge: { $avg: "$age" } } }</code></pre>

<h3>$project / $addFields — Reshape Documents</h3>
<pre><code>// $project — include/exclude/compute fields
{ $project: {
    name: 1,                                     // include
    email: 1,
    _id: 0,                                      // exclude
    nameUpper: { $toUpper: "$name" },             // computed
    ageGroup: {
      $switch: {
        branches: [
          { case: { $lt: ["$age", 30] }, then: "junior" },
          { case: { $lt: ["$age", 45] }, then: "mid" }
        ],
        default: "senior"
      }
    },
    fullName: { $concat: ["$firstName", " ", "$lastName"] },
    yearJoined: { $year: "$joinedAt" }
}}

// $addFields — adds new fields without dropping existing ones
{ $addFields: {
    totalItemValue: { $multiply: ["$qty", "$price"] },
    isExpensive: { $gt: ["$price", 100] }
}}</code></pre>

<h3>$unwind — Deconstruct Arrays</h3>
<pre><code>// Input: { name: "Alice", skills: ["JS", "Python", "Go"] }
{ $unwind: "$skills" }
// Output: 3 documents
// { name: "Alice", skills: "JS" }
// { name: "Alice", skills: "Python" }
// { name: "Alice", skills: "Go" }

// With preserveNullAndEmptyArrays:
{ $unwind: { path: "$skills", preserveNullAndEmptyArrays: true } }
// Documents with missing/empty skills are kept (with skills: null)

// With includeArrayIndex:
{ $unwind: { path: "$skills", includeArrayIndex: "skillIndex" } }
// { name: "Alice", skills: "JS", skillIndex: 0 }
// { name: "Alice", skills: "Python", skillIndex: 1 }</code></pre>

<h3>$lookup — Left Outer Join</h3>
<pre><code>// Basic $lookup (equality join)
{ $lookup: {
    from: "users",              // collection to join
    localField: "userId",       // field in current collection
    foreignField: "_id",        // field in "from" collection
    as: "user"                  // output array field
}}
// Result: user field is an ARRAY (even if 0 or 1 match)
// Usually followed by: { $unwind: "$user" }

// Correlated subquery $lookup (3.6+) — much more powerful
{ $lookup: {
    from: "orders",
    let: { userId: "$_id" },        // variables from current doc
    pipeline: [                      // sub-pipeline on "from" collection
      { $match: {
          $expr: { $eq: ["$userId", "$$userId"] }  // $$ = let variable
      }},
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ],
    as: "orderStats"
}}
// This is like a correlated subquery — very powerful for complex joins</code></pre>

<h3>$sort and $limit</h3>
<pre><code>// $sort — can use indexes if at the beginning of pipeline
{ $sort: { total: -1, createdAt: 1 } }

// $limit and $skip for pagination
{ $sort: { createdAt: -1 } },
{ $skip: 20 },
{ $limit: 10 }

// WARNING: $skip + $limit pagination is slow for large offsets
// Better: use range-based pagination with $match
// { $match: { createdAt: { $lt: lastSeenDate } } }
// { $sort: { createdAt: -1 } }
// { $limit: 10 }</code></pre>

<h3>$facet — Multiple Pipelines in One</h3>
<pre><code>// Run multiple aggregation pipelines on the same input
{ $facet: {
    // Pipeline 1: Total count
    totalCount: [
      { $count: "count" }
    ],
    // Pipeline 2: Paginated results
    results: [
      { $sort: { createdAt: -1 } },
      { $skip: 0 },
      { $limit: 10 }
    ],
    // Pipeline 3: Category breakdown
    categories: [
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]
}}
// Output: { totalCount: [{count: 1000}], results: [...10 docs], categories: [...] }

// GREAT for: search results with facets, dashboards, analytics pages</code></pre>

<h3>$bucket / $bucketAuto</h3>
<pre><code>// $bucket — group into specified ranges
{ $bucket: {
    groupBy: "$price",
    boundaries: [0, 25, 50, 100, 500],  // [0-25), [25-50), [50-100), [100-500)
    default: "500+",                      // catch-all for out-of-range
    output: {
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      products: { $push: "$name" }
    }
}}

// $bucketAuto — MongoDB decides the boundaries
{ $bucketAuto: {
    groupBy: "$price",
    buckets: 5,                // desired number of buckets
    granularity: "R5"          // optional: R5, R10, R20, 1-2-5, E6, etc.
}}</code></pre>

<h3>$graphLookup — Recursive Lookup</h3>
<pre><code>// Traverse graph/tree structures (e.g., org chart, categories)
// employees: { _id: "alice", name: "Alice", managerId: null }
//            { _id: "bob", name: "Bob", managerId: "alice" }
//            { _id: "carol", name: "Carol", managerId: "bob" }

{ $graphLookup: {
    from: "employees",
    startWith: "$_id",                  // starting value
    connectFromField: "_id",            // field in "from" docs
    connectToField: "managerId",        // field to match against
    as: "reportingChain",              // output field
    maxDepth: 5,                        // max recursion depth
    depthField: "level"                 // adds depth level to results
}}
// Alice's reportingChain: [Bob (level:0), Carol (level:1)]</code></pre>

<h2>Pipeline Optimization</h2>

<h3>Stage Ordering Matters</h3>
<pre><code>// BAD — processes all documents first, then filters
db.orders.aggregate([
  { $group: { _id: "$userId", total: { $sum: "$total" } } },
  { $match: { total: { $gt: 1000 } } }   // filters AFTER expensive group
]);

// GOOD — filter first, then group fewer documents
db.orders.aggregate([
  { $match: { status: "completed" } },     // filter early!
  { $group: { _id: "$userId", total: { $sum: "$total" } } },
  { $match: { total: { $gt: 1000 } } }
]);</code></pre>

<h3>Automatic Optimizations</h3>
<pre><code>// MongoDB's query optimizer automatically applies these:

// 1. $match coalescence — adjacent $match stages are merged
{ $match: { a: 1 } }, { $match: { b: 2 } }
// Optimized to: { $match: { a: 1, b: 2 } }

// 2. $match movement — $match moves before $project/$addFields if possible
{ $project: { status: 1 } }, { $match: { status: "active" } }
// Optimized to: { $match: { status: "active" } }, { $project: { status: 1 } }

// 3. $sort + $limit coalescence
{ $sort: { age: -1 } }, { $limit: 5 }
// MongoDB only tracks top 5 during sort (not full sort then truncate)

// 4. $lookup + $unwind + $match fusion
// These three stages can be fused into an optimized internal stage</code></pre>

<h2>Memory Limits</h2>
<div class="warning-note"><strong>100MB Memory Limit:</strong> Each pipeline stage has a 100MB RAM limit. Stages that exceed this ($group, $sort, $bucket on large datasets) will fail. Use <code>allowDiskUse: true</code> to spill to disk, but this is much slower. Better to $match early to reduce the working set.</div>

<pre><code>// Enable disk use for large aggregations
db.orders.aggregate([
  { $group: { _id: "$userId", total: { $sum: "$total" } } },
  { $sort: { total: -1 } }
], { allowDiskUse: true })

// $sort with an index avoids the memory limit entirely
// Place $sort early and ensure a supporting index exists</code></pre>

<h2>Aggregation vs MapReduce</h2>
<table>
  <tr><th>Feature</th><th>Aggregation Pipeline</th><th>MapReduce</th></tr>
  <tr><td>Performance</td><td>Native C++ operators, highly optimized</td><td>JavaScript execution, slower</td></tr>
  <tr><td>Index usage</td><td>$match can use indexes</td><td>Limited index usage</td></tr>
  <tr><td>Flexibility</td><td>Rich set of operators</td><td>Arbitrary JavaScript</td></tr>
  <tr><td>Sharding</td><td>Fully optimized for sharded clusters</td><td>Supported but less optimized</td></tr>
  <tr><td>Status</td><td>Recommended approach</td><td>Deprecated in 5.0+</td></tr>
</table>

<h2>Real-World Aggregation Examples</h2>
<pre><code>// E-commerce Analytics Dashboard
db.orders.aggregate([
  { $match: {
      createdAt: {
        $gte: ISODate("2024-01-01"),
        $lt: ISODate("2024-02-01")
      }
  }},
  { $facet: {
      // KPIs
      kpis: [
        { $group: {
            _id: null,
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
            avgOrderValue: { $avg: "$total" }
        }}
      ],
      // Daily revenue trend
      dailyTrend: [
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ],
      // Top customers
      topCustomers: [
        { $group: { _id: "$userId", spent: { $sum: "$total" } } },
        { $sort: { spent: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { name: "$user.name", spent: 1 } }
      ]
  }}
]);</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why is stage ordering important in the aggregation pipeline?</div>
  <div class="qa-a">Stage ordering directly impacts performance: (1) <strong>$match first</strong> — reduces the number of documents flowing through subsequent stages, and can use indexes (only at the beginning). (2) <strong>$project early</strong> — removes unnecessary fields to reduce memory usage in later stages like $group and $sort. (3) <strong>$sort before $group</strong> — allows $first/$last accumulators to work correctly. (4) <strong>$limit after $sort</strong> — MongoDB optimizes sort+limit into a top-k operation. Each document processed in expensive stages like $group, $unwind, and $lookup costs CPU and memory. Reducing the working set early means the 100MB memory limit per stage is less likely to be hit.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does $lookup work with sharded collections?</div>
  <div class="qa-a">The "from" collection in a $lookup can be sharded since MongoDB 5.1. Before that, only the input (driving) collection could be sharded, and the "from" collection had to be on the same database and unsharded. When both are sharded, the $lookup is executed as a scatter-gather operation: the mongos sends the pipeline to each shard holding input documents, and each shard performs the $lookup sub-pipeline against the "from" collection. If the join field is the shard key of the "from" collection, lookups are targeted. Otherwise, each $lookup fans out to all shards of the "from" collection — potentially expensive. For performance-critical joins, ensure the join field is the shard key or has an index on the "from" collection.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the performance implications of $unwind?</div>
  <div class="qa-a">$unwind deconstructs an array, creating one document per element. If a document has an array of 1000 elements, $unwind produces 1000 documents. This can: (1) explode the working set — 100 documents with 100-element arrays becomes 10,000 documents, (2) hit the 100MB memory limit, (3) slow down subsequent stages. Mitigation strategies: (1) $match before $unwind to reduce input, (2) $project to remove unnecessary fields before $unwind, (3) use array operators ($filter, $reduce, $map) instead of $unwind when possible, (4) use $unwind with includeArrayIndex for positional operations, (5) consider restructuring the pipeline to avoid $unwind entirely — $addFields with $filter can replace many $unwind + $match patterns.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the 100MB memory limit and how to work around it.</div>
  <div class="qa-a">Each individual stage in the aggregation pipeline is limited to 100MB of RAM. The most commonly affected stages are $group (accumulating results), $sort (buffering documents), and $bucket. Strategies: (1) <strong>$match early</strong> to reduce the dataset before memory-intensive stages. (2) <strong>$project</strong> to remove unnecessary fields before $group. (3) <strong>allowDiskUse: true</strong> allows MongoDB to spill to temporary files, but this is 10-100x slower than in-memory. (4) Use <strong>$sort with an index</strong> — indexed sorts bypass the memory limit entirely. (5) Break large aggregations into smaller batch jobs. (6) Use <strong>$merge</strong> or <strong>$out</strong> to write intermediate results to a temporary collection. The 100MB limit is per stage, not per pipeline — so a pipeline can theoretically use 100MB x N stages.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you paginate aggregation results efficiently?</div>
  <div class="qa-a">The naive $skip + $limit approach degrades with large offsets because MongoDB must process and discard $skip documents. Better approaches: (1) <strong>Range-based pagination</strong> — use $match with a range condition on the sort field: <code>{ $match: { createdAt: { $lt: lastSeenTimestamp } } }</code>, then $sort + $limit. This uses indexes efficiently regardless of page depth. (2) <strong>$facet for count + results</strong> — run total count and paginated results in a single query. (3) <strong>Cursor-based pagination</strong> — return the last document's sort key as a cursor, use it in the next $match. (4) <strong>Pre-computed materialized views</strong> — use $merge to write aggregation results to a collection, then paginate with a simple find(). Range-based pagination is O(log n) vs $skip's O(n).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use $graphLookup?</div>
  <div class="qa-a">$graphLookup performs recursive lookups on a collection, making it ideal for: (1) <strong>Org charts</strong> — find all reports under a manager recursively. (2) <strong>Category trees</strong> — find all subcategories of a parent. (3) <strong>Social graphs</strong> — friend-of-friend lookups. (4) <strong>Bill of materials</strong> — find all sub-components recursively. Use <code>maxDepth</code> to limit recursion and prevent runaway queries. Use <code>depthField</code> to know each result's depth. Use <code>restrictSearchWithMatch</code> to filter during traversal. Caveats: (1) no index optimization within the traversal, (2) results accumulate in memory (100MB limit), (3) for very large graphs, consider a dedicated graph database.</div>
</div>`
  },
  {
    id: 'mongo-replication',
    title: 'MongoDB Replication',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Replication — Read Preferences & Write Concerns
// Available collections: users, orders, products

// Default read: reads from primary
db.users.find({ department: "Engineering" });

// In a real replica set, you'd configure read preferences:
// db.users.find().readPref("secondaryPreferred")

// Write concern concepts demonstrated through queries:
// w:1 (default) — acknowledged by primary only
// w:"majority" — acknowledged by majority of replica set
// w:3 — acknowledged by 3 members

// Simulating a read from secondary-preferred
// (would include slightly stale data in real replica set)
db.users.find(
  { department: "Engineering" },
  { name: 1, salary: 1, _id: 0 }
).sort({ salary: -1 });

// Checking replication lag concept:
// In production you'd run rs.printReplicationInfo()
// and rs.printSecondaryReplicationInfo()

// Queries that benefit from secondary reads:
// Analytics/reporting (can tolerate slight staleness)
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      revenue: { $sum: "$total" },
      count: { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
]);`,
    content: `
<h1>MongoDB Replication</h1>
<p>Replication provides <strong>high availability</strong>, <strong>data redundancy</strong>, and <strong>read scaling</strong>. MongoDB uses <strong>replica sets</strong> — a group of mongod processes that maintain the same data. Understanding replication is essential for SDE3 roles because it directly impacts availability, consistency, and performance decisions.</p>

<h2>Replica Set Architecture</h2>
<pre><code>                    ┌──────────────┐
                    │   PRIMARY     │  ← All writes go here
                    │   (mongod)    │  ← Reads by default
                    └──────┬───────┘
                           │ Oplog replication
              ┌────────────┼────────────┐
              ↓                          ↓
     ┌──────────────┐          ┌──────────────┐
     │  SECONDARY    │          │  SECONDARY    │
     │  (mongod)     │          │  (mongod)     │
     └──────────────┘          └──────────────┘

     Minimum: 3 members (can be 2 data + 1 arbiter)
     Maximum: 50 members (7 voting)</code></pre>

<h2>Member Roles</h2>
<table>
  <tr><th>Role</th><th>Description</th><th>Use Case</th></tr>
  <tr><td><strong>Primary</strong></td><td>Receives all writes, default read target</td><td>Main data node</td></tr>
  <tr><td><strong>Secondary</strong></td><td>Replicates from primary via oplog</td><td>Redundancy, read scaling</td></tr>
  <tr><td><strong>Arbiter</strong></td><td>Votes in elections, holds no data</td><td>Break ties in elections (use sparingly)</td></tr>
  <tr><td><strong>Priority 0</strong></td><td>Cannot become primary</td><td>Dedicated reporting node, disaster recovery</td></tr>
  <tr><td><strong>Hidden</strong></td><td>Invisible to client drivers, priority 0</td><td>Dedicated backup, analytics workloads</td></tr>
  <tr><td><strong>Delayed</strong></td><td>Replicates with a time delay</td><td>Protection against human error (e.g., accidental drop)</td></tr>
</table>

<pre><code>// Replica set configuration example
rs.initiate({
  _id: "myRS",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 10 },        // preferred primary
    { _id: 1, host: "mongo2:27017", priority: 5 },         // can become primary
    { _id: 2, host: "mongo3:27017", priority: 5 },         // can become primary
    { _id: 3, host: "mongo4:27017", priority: 0, hidden: true },  // hidden reporting
    { _id: 4, host: "mongo5:27017", priority: 0, hidden: true,
              slaveDelay: 3600 }                            // 1-hour delayed member
  ]
})</code></pre>

<h2>Election Process</h2>
<p>MongoDB uses a consensus protocol based on <strong>Raft</strong> (modified) for leader election. Elections occur when the primary is unreachable.</p>

<pre><code>// Election triggers:
// 1. Primary becomes unreachable (heartbeat timeout: 10 seconds)
// 2. Primary steps down (rs.stepDown())
// 3. A higher-priority member becomes available
// 4. Replica set reconfiguration

// Election process:
// 1. A secondary detects primary is down (no heartbeat for electionTimeoutMillis)
// 2. It increments its term and requests votes from other members
// 3. Each member votes for at most ONE candidate per term
// 4. Candidate needs MAJORITY of votes (e.g., 2 of 3, 3 of 5)
// 5. Winner becomes new primary

// Factors affecting who wins:
// - Priority (higher priority members are preferred)
// - Oplog freshness (most up-to-date wins ties)
// - Network partitions (member must reach majority)

// Typical election time: 2-12 seconds
// During election: NO writes possible (but reads from secondaries can continue)</code></pre>

<div class="warning-note"><strong>Split Brain Prevention:</strong> A member can only become primary if it can reach a MAJORITY of voting members. In a 3-member set, if the primary is network-partitioned from both secondaries, it steps down. The two secondaries elect a new primary. The old primary cannot accept writes because it can't reach a majority. This prevents split-brain scenarios.</div>

<h2>Read Preferences</h2>
<table>
  <tr><th>Mode</th><th>Behavior</th><th>Use Case</th></tr>
  <tr><td><strong>primary</strong></td><td>All reads from primary (default)</td><td>Strong consistency required</td></tr>
  <tr><td><strong>primaryPreferred</strong></td><td>Primary if available, else secondary</td><td>Prefer consistency, tolerate stale on failover</td></tr>
  <tr><td><strong>secondary</strong></td><td>Always read from secondary</td><td>Reporting, analytics (stale OK)</td></tr>
  <tr><td><strong>secondaryPreferred</strong></td><td>Secondary if available, else primary</td><td>Read scaling with fallback</td></tr>
  <tr><td><strong>nearest</strong></td><td>Lowest network latency member</td><td>Geo-distributed clusters, latency-sensitive</td></tr>
</table>

<pre><code>// Node.js driver read preference examples:
const client = new MongoClient(uri, {
  readPreference: 'secondaryPreferred',
  readPreferenceTags: [
    { dc: 'east', usage: 'reporting' },  // prefer this tag set
    { dc: 'east' },                       // fallback
    {}                                     // any member
  ],
  maxStalenessSeconds: 120                // reject secondaries > 2min behind
});

// Per-operation read preference:
db.orders.find().readPref('secondary', [{ dc: 'east' }])</code></pre>

<div class="warning-note"><strong>Caution with secondary reads:</strong> Replication is asynchronous. Reads from secondaries may return stale data. A write followed by a secondary read may not see the write. For read-after-write consistency, use <code>primary</code> read preference or <code>readConcern: "majority"</code> with <code>afterClusterTime</code>.</div>

<h2>Write Concerns</h2>
<pre><code>// Write concern determines acknowledgment level
// { w: <value>, j: <boolean>, wtimeout: <milliseconds> }

// w: 1 (default) — acknowledged by primary only
db.users.insertOne(
  { name: "Alice" },
  { writeConcern: { w: 1 } }
);
// Fast, but data could be lost if primary crashes before replication

// w: "majority" — acknowledged by majority of replica set
db.users.insertOne(
  { name: "Alice" },
  { writeConcern: { w: "majority" } }
);
// Durable — data is on multiple nodes before acknowledgment
// Slower — must wait for replication

// w: 0 — fire and forget (no acknowledgment)
// Fastest, but no error detection. Used for non-critical logging.

// j: true — wait for journal write on primary
db.users.insertOne(
  { name: "Alice" },
  { writeConcern: { w: 1, j: true } }
);
// Without j:true, acknowledged write could be lost in a crash
// (journal flushes every 50ms by default)

// wtimeout — timeout for write concern
{ w: "majority", wtimeout: 5000 }
// If majority can't acknowledge within 5 seconds, return error
// (the write is NOT rolled back — it may still replicate)</code></pre>

<h3>Write Concern vs Durability Matrix</h3>
<table>
  <tr><th>Write Concern</th><th>Primary Crash</th><th>Primary + 1 Secondary Crash</th><th>Latency</th></tr>
  <tr><td>w:0</td><td>Data lost</td><td>Data lost</td><td>Lowest</td></tr>
  <tr><td>w:1</td><td>Data may be lost</td><td>Data lost</td><td>Low</td></tr>
  <tr><td>w:1, j:true</td><td>Durable (journaled)</td><td>Data lost</td><td>Medium</td></tr>
  <tr><td>w:majority</td><td>Durable</td><td>Durable</td><td>Higher</td></tr>
  <tr><td>w:majority, j:true</td><td>Durable</td><td>Durable (journaled on majority)</td><td>Highest</td></tr>
</table>

<h2>Oplog Mechanics</h2>
<pre><code>// The oplog is a capped collection: local.oplog.rs
// Each write on the primary creates an oplog entry
// Secondaries continuously tail the oplog

// Replication flow:
// 1. Client writes to primary
// 2. Primary writes to its data files and oplog (atomically)
// 3. Secondaries continuously poll primary's oplog
// 4. Each secondary applies oplog entries in order

// Check oplog status:
rs.printReplicationInfo()
// Output:
// configured oplog size:   1024MB
// log length start to end: 172800secs (48hrs)
// oplog first event time:  Mon Mar 01 2024 00:00:00
// oplog last event time:   Wed Mar 03 2024 00:00:00

// Check secondary replication lag:
rs.printSecondaryReplicationInfo()
// Output:
// source: mongo2:27017
//     syncedTo: Wed Mar 03 2024 00:00:00
//     2 secs (0 hrs) behind the primary

// Resize oplog (4.0+):
db.adminCommand({ replSetResizeOplog: 1, size: 4096 })  // 4GB</code></pre>

<h2>Rollbacks</h2>
<p>A <strong>rollback</strong> occurs when a former primary rejoins the replica set and its writes conflict with the new primary's writes.</p>

<pre><code>// Rollback scenario:
// 1. Primary (A) has writes w1, w2, w3
// 2. A goes down before w2, w3 replicate
// 3. Secondary (B) is elected primary
// 4. B receives new writes w4, w5
// 5. A comes back online — w2, w3 conflict with B's history
// 6. A rolls back w2, w3 to a rollback directory

// Rollback data is saved to: dbPath/rollback/<collection>/
// Files are in BSON format — can be recovered manually

// Prevention: Use w: "majority" write concern
// If writes require majority acknowledgment before success,
// they cannot be rolled back (they're on majority of nodes)

// MongoDB 4.0+ uses "majority reads" rollback algorithm
// that limits rollback to 1000 oplog entries or the previous
// stable checkpoint</code></pre>

<div class="warning-note"><strong>w: "majority" prevents rollbacks.</strong> In production systems handling financial or critical data, always use <code>w: "majority"</code>. The latency cost is typically 1-5ms for a local replica set and is well worth the durability guarantee.</div>

<h2>Read Concerns</h2>
<pre><code>// Read concern determines the consistency and isolation of reads
// "local"     — returns most recent data on the queried member (default)
// "available" — like local, but for sharded collections returns possibly orphaned docs
// "majority"  — returns data acknowledged by majority (no rollback possible)
// "linearizable" — majority + reflects all writes that completed before the read
// "snapshot"  — for multi-document transactions (point-in-time consistency)

// Read concern "majority" example:
db.users.find({ email: "alice@example.com" }).readConcern("majority")
// Guarantees the returned data won't be rolled back
// But may return slightly older data than "local"

// Read concern "linearizable" — strongest guarantee
// Read will reflect ALL acknowledged writes that completed before this read started
// Must be used with primary read preference
// Adds latency (must confirm with majority)
// Use sparingly for critical reads (e.g., checking if a payment exists)</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How does MongoDB's election process work, and what determines which secondary becomes primary?</div>
  <div class="qa-a">When the primary is unreachable (no heartbeat for <code>electionTimeoutMillis</code>, default 10s), eligible secondaries begin an election. A candidate increments its term number and requests votes. Each member votes for at most one candidate per term. The candidate needs a strict majority of votes (e.g., 2/3 or 3/5). Factors: (1) <strong>Priority</strong> — higher priority members are preferred; priority 0 members can never be elected. (2) <strong>Oplog freshness</strong> — a member won't vote for a candidate whose oplog is older than its own. (3) <strong>Reachability</strong> — must be able to reach a majority. (4) <strong>Veto</strong> — members can veto candidates they know are behind. Typical election completes in 2-12 seconds. During election, writes are blocked but secondary reads continue.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between read concern and read preference.</div>
  <div class="qa-a"><strong>Read preference</strong> determines WHICH member to read from (primary, secondary, nearest, etc.) — it's about routing. <strong>Read concern</strong> determines WHAT data to return from that member — it's about consistency. Example: <code>readPreference: "secondary"</code> with <code>readConcern: "majority"</code> reads from a secondary but only returns data that has been acknowledged by a majority of replica set members (won't be rolled back). They are orthogonal — you can combine any read preference with any read concern. The strongest combination is <code>readPreference: "primary"</code> with <code>readConcern: "linearizable"</code>, which provides the strongest consistency guarantee at the cost of latency.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When should you use w:majority vs w:1?</div>
  <div class="qa-a">Use <code>w: "majority"</code> for: (1) financial transactions, (2) user authentication data, (3) any write that cannot be lost, (4) systems where rollbacks are unacceptable. The latency overhead is typically 1-5ms for co-located replica sets. Use <code>w: 1</code> for: (1) high-throughput logging, (2) analytics data that can be regenerated, (3) session data or cache, (4) when latency is more important than durability. Since MongoDB 5.0, the default write concern for replica sets is <code>w: "majority"</code> (changed from <code>w: 1</code>). For critical applications, also add <code>j: true</code> to ensure the journal is flushed to disk on the primary before acknowledgment.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the risks of reading from secondaries?</div>
  <div class="qa-a">Risks: (1) <strong>Stale reads</strong> — secondaries lag behind the primary; you may not see recent writes. (2) <strong>Read-after-write inconsistency</strong> — write to primary, immediately read from secondary, miss your own write. (3) <strong>Non-monotonic reads</strong> — consecutive reads from different secondaries may go backward in time. (4) <strong>Orphaned documents</strong> — in sharded clusters with <code>readConcern: "available"</code>, chunk migration may show documents that don't belong to that shard. Mitigations: use <code>maxStalenessSeconds</code> to limit staleness, use <code>readConcern: "majority"</code> for durable reads, use causal consistency sessions for read-after-write guarantees. Only use secondary reads for workloads that can truly tolerate stale data: analytics, reporting, dashboards.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does a delayed replica set member help in production?</div>
  <div class="qa-a">A delayed member replicates data with a configurable time lag (e.g., 1 hour). It provides protection against human errors like: accidental <code>db.collection.drop()</code>, bad application deployments that corrupt data, or erroneous bulk updates. Recovery process: (1) stop the delayed member, (2) start it as a standalone on a different port, (3) export the needed data before the bad operation's timestamp, (4) import into the primary. Limitations: the delayed member must be <code>priority: 0</code> (can't become primary) and <code>hidden: true</code> (invisible to drivers). The delay window must be larger than your mean time to detect errors — a 1-hour delay is useless if you notice the problem after 2 hours.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is causal consistency in MongoDB?</div>
  <div class="qa-a">Causal consistency (3.6+) guarantees that operations within a <strong>causally consistent session</strong> observe a consistent view of the data — reads reflect prior writes, and operations are ordered. It provides: (1) <strong>Read your writes</strong> — if you write to primary, a subsequent read (even from a secondary) sees that write. (2) <strong>Monotonic reads</strong> — successive reads never go backward in time. (3) <strong>Monotonic writes</strong> — writes are applied in order. Implementation: the driver tracks cluster time and operation time, passing them to the server. The server waits until the secondary has replicated up to that point before returning results. Use with <code>readConcern: "majority"</code> and <code>readPreference: "secondary"</code> for the most useful combination — read scaling with causal guarantees.</div>
</div>`
  },
  {
    id: 'mongo-sharding',
    title: 'MongoDB Sharding',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Sharding — Shard Key Concepts
// Available collections: users, orders, products

// Shard key selection is the most critical sharding decision
// Good shard keys have: high cardinality, even distribution, query isolation

// Example: If users are sharded by 'city'
// Targeted query (goes to ONE shard):
db.users.find({ city: "San Francisco" });

// Example: If orders are sharded by 'userId'
// Targeted query:
db.orders.find({ userId: "user123" });

// Scatter-gather query (hits ALL shards — expensive):
db.users.find({ age: { $gt: 30 } });

// Demonstrating cardinality concepts
db.users.aggregate([
  { $group: { _id: "$city", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);

// High-cardinality field analysis (good shard key candidate)
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $group: { _id: null, uniqueEmails: { $sum: 1 } } }
]);

// Compound shard key concept: { city: 1, email: 1 }
// Balances between query isolation and even distribution
db.users.find({ city: "New York" }).sort({ email: 1 });`,
    content: `
<h1>MongoDB Sharding</h1>
<p>Sharding is MongoDB's approach to <strong>horizontal scaling</strong>. It distributes data across multiple machines (shards) to handle datasets and throughput beyond the capacity of a single server. Shard key selection is often the most consequential architectural decision in a MongoDB deployment.</p>

<h2>Sharded Cluster Architecture</h2>
<pre><code>                    Client Application
                           |
                    ┌──────┴──────┐
                    │   mongos     │  ← Query Router (stateless)
                    │   (router)   │     Can have multiple for HA
                    └──────┬──────┘
                           |
            ┌──────────────┼──────────────┐
            |              |              |
     ┌──────┴─────┐ ┌─────┴──────┐ ┌─────┴──────┐
     │  Shard 1    │ │  Shard 2    │ │  Shard 3    │
     │ (Replica    │ │ (Replica    │ │ (Replica    │
     │   Set)      │ │   Set)      │ │   Set)      │
     └────────────┘ └────────────┘ └────────────┘

            ┌──────────────────────────┐
            │    Config Servers         │
            │    (Replica Set)          │
            │  Stores: chunk ranges,    │
            │  shard metadata, balancer │
            └──────────────────────────┘</code></pre>

<h2>Component Details</h2>
<table>
  <tr><th>Component</th><th>Role</th><th>Deployment</th></tr>
  <tr><td><strong>mongos</strong></td><td>Routes queries to correct shard(s), merges results</td><td>Stateless — deploy multiple behind load balancer. Typically co-located with app servers.</td></tr>
  <tr><td><strong>Config Servers</strong></td><td>Store metadata: shard key ranges, chunk locations, cluster config</td><td>3-member replica set (CSRS). Must be highly available.</td></tr>
  <tr><td><strong>Shards</strong></td><td>Store the actual data partitions</td><td>Each shard is a replica set for HA.</td></tr>
</table>

<h2>Shard Key Selection</h2>
<p>The shard key determines how data is distributed across shards. It is <strong>immutable after creation</strong> (though MongoDB 5.0 allows <code>reshardCollection</code>). A bad shard key can doom a cluster to poor performance.</p>

<h3>Three Properties of a Good Shard Key</h3>
<table>
  <tr><th>Property</th><th>Description</th><th>Bad Example</th><th>Good Example</th></tr>
  <tr><td><strong>High Cardinality</strong></td><td>Many distinct values so data can be split into many chunks</td><td><code>{ continent: 1 }</code> — only 7 values</td><td><code>{ email: 1 }</code> — millions of values</td></tr>
  <tr><td><strong>Even Frequency</strong></td><td>Values are uniformly distributed, no "hot" values</td><td><code>{ status: 1 }</code> — "active" has 90% of docs</td><td><code>{ userId: 1 }</code> — evenly distributed</td></tr>
  <tr><td><strong>Non-Monotonic</strong></td><td>Values don't always increase/decrease (avoids hot shard)</td><td><code>{ _id: 1 }</code> — ObjectId always increases, all inserts go to last shard</td><td><code>{ _id: "hashed" }</code> — random distribution</td></tr>
</table>

<h3>Range Sharding vs Hashed Sharding</h3>
<pre><code>// RANGE SHARDING — shard key values are divided into contiguous ranges
sh.shardCollection("mydb.orders", { createdAt: 1 })

// Range: Shard A: [-inf, 2024-01-01)
//        Shard B: [2024-01-01, 2024-06-01)
//        Shard C: [2024-06-01, +inf)

// Pros: Range queries on shard key are targeted to specific shards
// Cons: Monotonically increasing values create a "hot shard"
//        (all new inserts go to the last shard)

// HASHED SHARDING — shard key values are hashed for random distribution
sh.shardCollection("mydb.orders", { userId: "hashed" })

// Pros: Even data distribution regardless of value distribution
// Cons: Range queries on shard key become scatter-gather
//        Cannot create compound hashed shard keys (pre-4.4)

// COMPOUND SHARD KEY — best of both worlds
sh.shardCollection("mydb.orders", { userId: 1, createdAt: 1 })
// Targeted queries: db.orders.find({ userId: "u123" })
// Range within user: db.orders.find({ userId: "u123", createdAt: { $gt: ... } })</code></pre>

<div class="warning-note"><strong>Never use a monotonically increasing field as the sole shard key!</strong> Using <code>{ _id: 1 }</code> (ObjectId) or <code>{ createdAt: 1 }</code> means all inserts go to the maximum chunk on one shard. This creates a write hot spot and the balancer can never keep up. Use hashed sharding or a compound shard key with a high-cardinality prefix.</div>

<h2>Chunks and the Balancer</h2>
<pre><code>// Data is divided into CHUNKS — contiguous ranges of shard key values
// Default chunk size: 128MB (was 64MB before 6.0)

// Example chunk distribution:
// Shard A: chunks [minKey, "g"), ["g", "m"), ["m", "s")
// Shard B: chunks ["s", "z"), ["z", maxKey)

// The BALANCER runs on the config server primary
// It migrates chunks between shards to maintain even distribution

// Balancer window (schedule during off-peak hours):
db.settings.updateOne(
  { _id: "balancer" },
  { $set: {
      activeWindow: { start: "02:00", stop: "06:00" }
  }},
  { upsert: true }
);

// Check balancer status:
sh.getBalancerState()        // enabled/disabled
sh.isBalancerRunning()       // currently active?
sh.status()                  // full cluster status</code></pre>

<h3>Chunk Migration Process</h3>
<pre><code>// 1. Balancer identifies imbalanced shards (threshold: 2 chunks difference for < 20 chunks)
// 2. Source shard begins copying chunk data to destination shard
// 3. During copy: new writes to the chunk go to source shard
// 4. After initial copy: source sends any new writes (delta) to destination
// 5. Config server updates chunk ownership metadata
// 6. Source shard deletes the migrated chunk data

// Migration is designed to be transparent to the application
// But it consumes I/O and network — can impact performance during peak hours</code></pre>

<h2>Zones (Tag-Aware Sharding)</h2>
<pre><code>// Zones allow you to control which shards store which data
// Use cases: data locality, tiered storage, compliance (data residency)

// Example: Geo-based sharding for GDPR compliance
// Shard A, B in EU data center — tagged "EU"
// Shard C, D in US data center — tagged "US"

sh.addShardTag("shard-eu-1", "EU")
sh.addShardTag("shard-eu-2", "EU")
sh.addShardTag("shard-us-1", "US")
sh.addShardTag("shard-us-2", "US")

// Define zone ranges (shard key: { region: 1, userId: 1 })
sh.addTagRange("mydb.users", { region: "EU", userId: MinKey }, { region: "EU", userId: MaxKey }, "EU")
sh.addTagRange("mydb.users", { region: "US", userId: MinKey }, { region: "US", userId: MaxKey }, "US")

// Now EU user data stays on EU shards, US data on US shards
// Queries with region filter are targeted to the correct zone</code></pre>

<h2>Targeted vs Scatter-Gather Queries</h2>
<pre><code>// TARGETED query — includes the shard key → goes to ONE shard
// Shard key: { userId: 1 }
db.orders.find({ userId: "user123" })          // targeted — fast!
db.orders.find({ userId: "user123", status: "completed" })  // targeted

// SCATTER-GATHER query — does NOT include shard key → goes to ALL shards
db.orders.find({ status: "completed" })         // scatter-gather — slow!
db.orders.find({ total: { $gt: 100 } })         // scatter-gather

// mongos fans out the query to every shard, then merges results
// Performance degrades linearly with number of shards for scatter-gather

// BROADCAST operations (always scatter-gather):
// - Queries without shard key
// - $lookup (unless optimized)
// - updateMany/deleteMany without shard key in filter</code></pre>

<h2>Jumbo Chunks</h2>
<pre><code>// A JUMBO chunk is a chunk that exceeds the max chunk size
// and cannot be split further (all documents have the same shard key value)

// Example: shard key { city: 1 }
// 500,000 documents with city: "New York" → one giant chunk
// Cannot split because all docs have the same shard key!
// The balancer cannot migrate jumbo chunks

// Consequences:
// - Uneven data distribution (one shard overloaded)
// - Balancer warnings in logs
// - Cannot scale writes for that shard key value

// Solutions:
// 1. Choose a shard key with higher cardinality
// 2. Use a compound shard key: { city: 1, _id: 1 }
// 3. Use sh.splitAt() to manually split (if compound key allows)
// 4. Reshard the collection (5.0+ with reshardCollection)

// Clear jumbo flag (if chunk was manually split):
db.adminCommand({
  clearJumboFlag: "mydb.users",
  find: { city: "New York" }
})</code></pre>

<div class="warning-note"><strong>Resharding (5.0+):</strong> MongoDB 5.0 introduced <code>reshardCollection</code> which allows changing the shard key of an existing collection. This was previously impossible without migrating data to a new collection. However, resharding is a heavyweight operation — it copies all data, requires temporary additional storage, and briefly blocks writes at cutover. Plan carefully.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you choose a shard key for a social media application?</div>
  <div class="qa-a">For a social media app, consider the access patterns: most queries are user-centric (user's posts, user's feed, user's messages). A good shard key for the posts collection would be <code>{ userId: "hashed" }</code> or <code>{ userId: 1 }</code>. Hashed distributes evenly but loses range query efficiency; range allows you to keep a user's posts together for efficient pagination. For a feed/timeline collection, <code>{ recipientId: 1, createdAt: -1 }</code> is ideal — it targets feed reads to one shard and supports time-range queries. Avoid <code>{ _id: 1 }</code> (hot shard) or <code>{ createdAt: 1 }</code> (monotonic — all writes go to one shard). If query patterns are diverse, a compound key like <code>{ userId: 1, createdAt: 1 }</code> provides both query isolation and range capability.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens during a chunk migration, and how does it affect application performance?</div>
  <div class="qa-a">During chunk migration: (1) The source shard copies the chunk's data to the destination in batches. (2) New writes to the chunk continue on the source shard. (3) After initial copy, the source sends any delta writes to the destination. (4) The config server atomically updates the chunk ownership. (5) The source deletes the migrated data. Impact: (a) increased I/O on both source and destination shards, (b) increased network traffic, (c) briefly elevated latency for queries targeting the migrating chunk, (d) the source shard must service both reads and the migration copy. To minimize impact: schedule the balancer during off-peak hours, use <code>_secondaryThrottle</code> to slow migrations, and ensure adequate disk I/O headroom.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between ranged and hashed sharding with trade-offs.</div>
  <div class="qa-a"><strong>Ranged sharding</strong> divides the shard key space into contiguous ranges. Pros: range queries on the shard key are targeted to specific shards (efficient), data locality for range-based access. Cons: monotonically increasing keys create hot spots (all inserts to one shard), uneven distribution if values are clustered. <strong>Hashed sharding</strong> hashes shard key values for random distribution. Pros: even distribution regardless of value patterns, no hot spots for inserts. Cons: range queries become scatter-gather (all shards), no data locality. Choose ranged when: range queries on the shard key are critical and the key is not monotonic. Choose hashed when: even write distribution is the priority and you rarely do range queries on the shard key. A compound shard key often provides the best balance.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the jumbo chunk problem and how do you resolve it?</div>
  <div class="qa-a">A jumbo chunk is a chunk where all documents share the same shard key value, making it indivisible. The chunk grows beyond the max size (128MB) but cannot be split or migrated. Causes: low-cardinality shard keys (e.g., <code>{ status: 1 }</code> with only 3 values) or high-frequency values (e.g., <code>{ city: 1 }</code> where one city has millions of users). Impact: the shard hosting the jumbo chunk becomes a hot spot, the balancer cannot redistribute data, and eventually the shard runs out of disk. Solutions: (1) Use high-cardinality shard keys from the start. (2) Use compound shard keys to ensure splittability: <code>{ city: 1, _id: 1 }</code>. (3) In MongoDB 5.0+, use <code>reshardCollection</code> to change to a better shard key. (4) As a last resort, migrate data to a new collection with a better shard key.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do config servers work in a sharded cluster?</div>
  <div class="qa-a">Config servers store all cluster metadata: shard key ranges, chunk-to-shard mappings, collection/database sharding status, and balancer state. They are deployed as a 3-member replica set (CSRS — Config Server Replica Set). The mongos routers cache metadata from config servers and refresh it when: (1) chunk migration occurs, (2) a stale chunk version error is received, (3) mongos restarts. Config servers must be highly available — if the config server primary is down, no chunk migrations or splits can occur. However, existing queries still work because mongos uses cached metadata. For reads, mongos uses readConcern "majority" against config servers to ensure consistent metadata. The config server's <code>config</code> database contains collections like <code>config.chunks</code>, <code>config.shards</code>, and <code>config.collections</code>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can you change the shard key after sharding a collection?</div>
  <div class="qa-a">Before MongoDB 4.4, the shard key was completely immutable. MongoDB 4.4 introduced <strong>refineCollectionShardKey</strong>, which allows adding a suffix to an existing shard key (e.g., <code>{ userId: 1 }</code> to <code>{ userId: 1, orderId: 1 }</code>) to improve chunk splitting. MongoDB 5.0 introduced <strong>reshardCollection</strong>, which allows changing the shard key entirely. Resharding works by: (1) creating a new sharded collection with the new key in the background, (2) copying all data to the new collection, (3) performing a brief cutover where writes are paused. The operation requires temporary disk space roughly equal to the collection size. It can take hours for large collections and has a brief write-blocking period at the end. Always test resharding in staging first.</div>
</div>`
  },
  {
    id: 'mongo-scaling',
    title: 'MongoDB Scaling & Performance',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Scaling & Performance
// Available collections: users, orders, products

// Performance-oriented queries

// Efficient query: uses index, projects only needed fields
db.users.find(
  { department: "Engineering", age: { $gt: 25 } },
  { name: 1, email: 1, salary: 1, _id: 0 }
).sort({ salary: -1 }).limit(10);

// Aggregation with pipeline optimization
// $match first to reduce documents early
db.orders.aggregate([
  { $match: {
      status: "completed",
      createdAt: { $gte: new Date("2024-01-01") }
  }},
  { $group: {
      _id: "$userId",
      totalSpent: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $match: { totalSpent: { $gt: 500 } } },
  { $sort: { totalSpent: -1 } },
  { $limit: 20 }
]);

// Batch operations for write performance
db.products.find({ stock: { $lt: 10 } })
  .sort({ stock: 1 })
  .limit(5);

// Count with hint for index usage
db.orders.find({ status: "pending" }).count();`,
    content: `
<h1>MongoDB Scaling & Performance</h1>
<p>At SDE3 level, you must understand not just how to write queries, but how to design systems that scale from thousands to millions of operations per second. This covers vertical scaling, horizontal scaling, read/write optimization, connection management, and real-time capabilities.</p>

<h2>Scaling Strategies Overview</h2>
<table>
  <tr><th>Strategy</th><th>How</th><th>When</th><th>Limits</th></tr>
  <tr><td><strong>Vertical Scaling</strong></td><td>More RAM, faster CPU, SSDs, NVMe</td><td>First approach, simplest</td><td>Hardware ceiling, single point of failure</td></tr>
  <tr><td><strong>Read Scaling</strong></td><td>Replica set secondaries with secondary read preference</td><td>Read-heavy workloads, analytics</td><td>Max 50 members, stale reads</td></tr>
  <tr><td><strong>Write Scaling</strong></td><td>Sharding (horizontal partitioning)</td><td>Write throughput exceeds single server</td><td>Shard key design is critical</td></tr>
  <tr><td><strong>Connection Scaling</strong></td><td>Connection pooling, mongos distribution</td><td>Many application instances</td><td>Memory per connection (~1MB)</td></tr>
</table>

<h2>Vertical Scaling (Scale Up)</h2>
<pre><code>// Key resources and their MongoDB impact:

// RAM — Most critical for MongoDB performance
// WiredTiger cache = 50% of (RAM - 1GB) by default
// Rule: Working set (data + indexes being actively used) should fit in RAM
// If working set > RAM → constant page faults → performance cliff

// Check working set vs cache:
db.serverStatus().wiredTiger.cache
// "bytes currently in the cache": 4294967296,    // 4GB in cache
// "tracked dirty bytes in the cache": 1048576,   // 1MB dirty
// "pages read into cache": 500000,               // reads
// "pages written from cache": 100000             // writes

// SSDs vs HDDs
// MongoDB random I/O patterns strongly favor SSDs
// NVMe > SSD > HDD (100x difference for random reads)

// CPU
// MongoDB uses multiple threads for: query execution, WiredTiger compression,
// replication, index builds. More cores help concurrent workloads.</code></pre>

<h2>Read Scaling with Replica Sets</h2>
<pre><code>// Strategy: Route read-heavy workloads to secondaries
// This offloads the primary for writes

// Best for:
// - Analytics dashboards (can tolerate 1-2 seconds staleness)
// - Reporting queries (heavy aggregations)
// - Search queries (especially with text indexes)
// - Geo-distributed reads (nearest member)

// Connection string with read preference:
// mongodb://host1,host2,host3/?replicaSet=myRS&readPreference=secondaryPreferred

// Per-query override:
db.analytics.find({...}).readPref("secondary")

// Hidden members for dedicated workloads:
// A hidden secondary can be used exclusively for analytics
// without affecting client-facing reads
rs.conf().members[3] = { host: "analytics:27017", priority: 0, hidden: true }

// WARNING: Secondary reads are NOT free scaling
// - Secondaries must apply the same oplog (write load)
// - Adding read replicas doesn't reduce write load
// - For write scaling, you MUST shard</code></pre>

<h2>Write Scaling with Sharding</h2>
<pre><code>// Sharding distributes writes across multiple machines
// Each shard handles a portion of the shard key range

// Write scaling formula (ideal):
// Total write throughput ≈ Per-shard throughput × Number of shards

// But only if:
// 1. Shard key distributes writes evenly (no hot shard)
// 2. Writes include the shard key (targeted, not broadcast)
// 3. No jumbo chunks

// Common write scaling pattern:
// Shard key: { tenantId: 1, _id: 1 }
// Multi-tenant SaaS: each tenant's writes go to their shard
// Growth: add shards as tenants increase

// Bulk write optimization:
// Ordered bulk writes (default): serial, stops on error
// Unordered bulk writes: parallel across shards, continues on error
const bulk = db.events.initializeUnorderedBulkOp();
// ... add operations ...
bulk.execute({ w: "majority" });</code></pre>

<h2>Connection Pooling</h2>
<pre><code>// Connection management is critical at scale
// Each connection: ~1MB server RAM + thread + file descriptors

// Problem: 50 microservices × 20 instances × 100 pool size = 100,000 connections!

// MongoDB connection pool configuration (Node.js driver):
const client = new MongoClient(uri, {
  maxPoolSize: 50,          // reduce from default 100
  minPoolSize: 10,          // keep warm connections
  maxIdleTimeMS: 30000,     // close idle connections after 30s
  waitQueueTimeoutMS: 10000, // fail fast if no connection available
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  compressors: ['zstd']     // wire protocol compression
});

// Monitor connections:
db.serverStatus().connections
// { "current": 150, "available": 51050, "totalCreated": 5000 }

// Solutions for connection overload:
// 1. Reduce maxPoolSize per app instance
// 2. Use connection string parameter maxPoolSize=10 for lambdas/serverless
// 3. Consider MongoDB Atlas Proxy / mongos load balancing
// 4. Use Atlas Data API for serverless (HTTP-based, no persistent connections)</code></pre>

<h2>Query Performance Optimization</h2>

<h3>Profiler</h3>
<pre><code>// MongoDB profiler captures slow operations
// Level 0: Off
// Level 1: Slow operations only (default threshold: 100ms)
// Level 2: All operations (WARNING: huge overhead)

db.setProfilingLevel(1, { slowms: 50 })    // log ops > 50ms

// Query profiled operations:
db.system.profile.find({
  millis: { $gt: 100 },
  op: "query"
}).sort({ ts: -1 }).limit(5)

// Profiler document fields:
// op: "query", "insert", "update", "command"
// millis: execution time
// planSummary: "IXSCAN { email: 1 }" or "COLLSCAN"
// nreturned: documents returned
// keysExamined: index entries scanned
// docsExamined: documents scanned</code></pre>

<h3>Performance Checklist</h3>
<table>
  <tr><th>Issue</th><th>Diagnosis</th><th>Solution</th></tr>
  <tr><td>Slow queries</td><td><code>explain()</code> shows COLLSCAN</td><td>Add appropriate index</td></tr>
  <tr><td>High keysExamined/nReturned ratio</td><td><code>explain()</code> stats</td><td>More selective index, compound index</td></tr>
  <tr><td>In-memory sorts</td><td><code>explain()</code> shows SORT stage</td><td>Index that covers the sort (ESR rule)</td></tr>
  <tr><td>High connection count</td><td><code>db.serverStatus().connections</code></td><td>Reduce pool size, add mongos</td></tr>
  <tr><td>Cache eviction storms</td><td>WiredTiger cache stats</td><td>Add RAM, reduce working set, optimize queries</td></tr>
  <tr><td>Write contention</td><td>Lock stats, tickets available</td><td>Schema redesign, shard the collection</td></tr>
  <tr><td>Large documents</td><td><code>Object.bsonsize(doc)</code></td><td>Subset pattern, separate collections</td></tr>
</table>

<h2>Change Streams for Real-Time</h2>
<pre><code>// Change streams (3.6+) provide real-time notifications of data changes
// Built on the oplog — no polling needed

// Watch a collection:
const changeStream = db.orders.watch([
  { $match: { "fullDocument.status": "completed" } }
]);

changeStream.on("change", (change) => {
  // change.operationType: "insert", "update", "replace", "delete"
  // change.fullDocument: the complete document (for insert/replace)
  // change.updateDescription: { updatedFields, removedFields } (for update)
  // change.documentKey: { _id: ... }
  // change._id: resume token (for resumability)
});

// Resume after disconnect:
const resumeToken = change._id;
const resumedStream = db.orders.watch([], { resumeAfter: resumeToken });

// Use cases:
// - Real-time dashboards
// - Event-driven microservices (CDC — Change Data Capture)
// - Cache invalidation
// - Triggering downstream processes
// - Syncing to Elasticsearch, data warehouses

// Requirements: replica set or sharded cluster (not standalone)
// fullDocument: "updateLookup" to include full doc on updates</code></pre>

<h2>Atlas Features for Scaling</h2>
<pre><code>// MongoDB Atlas (managed service) provides:

// 1. Auto-scaling — automatically adjusts cluster tier based on load
//    - Compute auto-scaling: scale up/down based on CPU
//    - Storage auto-scaling: expand disk automatically

// 2. Serverless instances — pay per operation, no capacity planning
//    - Automatic scaling from 0 to peak
//    - Best for: variable/unpredictable workloads

// 3. Atlas Search — Lucene-based full-text search
//    - $search aggregation stage
//    - Relevance scoring, fuzzy matching, facets, autocomplete
//    - Replaces need for Elasticsearch for many use cases

// 4. Atlas Data Lake — query data in S3/Azure Blob
//    - Federated queries across Atlas clusters and cloud storage

// 5. Online Archive — tier cold data to cheaper storage
//    - Automatically move old data based on date field
//    - Still queryable via federated queries

// 6. Global Clusters — zone-based sharding for geo-distribution
//    - Pin data to specific regions for compliance
//    - Read/write locally, replicate globally</code></pre>

<h2>Caching Strategies</h2>
<pre><code>// MongoDB + Redis/Memcached caching patterns:

// 1. Cache-Aside (Lazy Loading)
// Read: Check cache → if miss, read from MongoDB, populate cache
// Write: Write to MongoDB, invalidate cache
// Pros: Only caches what's actually read
// Cons: Cache misses are slow (3 round trips)

// 2. Write-Through
// Write: Write to cache AND MongoDB simultaneously
// Read: Always from cache
// Pros: Cache always fresh
// Cons: Write latency (2 writes), caches data that may never be read

// 3. Write-Behind (Write-Back)
// Write: Write to cache, async write to MongoDB
// Read: Always from cache
// Pros: Fastest writes
// Cons: Data loss risk if cache fails before async write

// 4. MongoDB as Cache (TTL indexes)
// Use a MongoDB collection with TTL index as a distributed cache
db.cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.cache.insertOne({
  key: "user:123:profile",
  value: { name: "Alice", ... },
  expiresAt: new Date(Date.now() + 3600000)  // 1 hour
})
// Pros: No additional infrastructure
// Cons: Slower than Redis for hot-path caching</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How do you determine if your MongoDB cluster needs to scale, and which scaling approach to use?</div>
  <div class="qa-a">Monitor these signals: (1) <strong>CPU consistently > 70%</strong> — may need vertical scaling or sharding. (2) <strong>WiredTiger cache evictions increasing</strong> — working set exceeds RAM; add memory or shard. (3) <strong>Replication lag growing</strong> — write volume exceeding secondary's apply rate. (4) <strong>Disk I/O at saturation</strong> — upgrade to NVMe or shard. (5) <strong>Connection count approaching limit</strong> — add mongos, reduce pool sizes. Decision tree: if reads are the bottleneck, add secondaries with read preference. If writes are the bottleneck, shard. If working set doesn't fit in RAM, add RAM first (cheapest). If a single document/collection is the hot spot, redesign the schema. Always optimize queries and indexes before scaling infrastructure.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does connection pooling work, and what happens when the pool is exhausted?</div>
  <div class="qa-a">The MongoDB driver maintains a pool of TCP connections to each mongod/mongos. When the application needs a connection, it checks out one from the pool. When done, it returns it. If the pool is exhausted (all connections in use), the request enters a wait queue. If it waits longer than <code>waitQueueTimeoutMS</code>, a MongoServerSelectionError is thrown. This causes cascading failures under load. Mitigation: (1) set appropriate <code>maxPoolSize</code> — not too high (wastes server RAM) or too low (request queuing). (2) Ensure operations complete quickly (don't hold connections during long processing). (3) Monitor <code>db.serverStatus().connections</code> on the server. (4) For serverless/lambda, use <code>maxPoolSize=1</code> or Atlas Data API. In microservice architectures, calculate total connections across all instances.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain change streams and how they differ from polling.</div>
  <div class="qa-a">Change streams use the oplog to push real-time notifications of data changes to the application — no polling needed. Benefits over polling: (1) <strong>Real-time</strong> — events are delivered as they happen, not on a polling interval. (2) <strong>Efficient</strong> — no wasted queries when nothing changes. (3) <strong>Resumable</strong> — each change event includes a resume token; if the app disconnects, it can resume from exactly where it left off. (4) <strong>Filtered</strong> — pipeline stages ($match, $project) filter server-side, reducing network traffic. Caveats: (1) requires a replica set or sharded cluster, (2) consumes one connection per watch, (3) dependent on oplog retention — if the resume token expires from the oplog, the stream cannot be resumed, (4) performance impact of fullDocument: "updateLookup" which re-reads the full document for every update.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle a hot shard scenario in production?</div>
  <div class="qa-a">Diagnosis: use <code>sh.status()</code> to check chunk distribution, <code>mongostat</code> for per-shard throughput, and <code>mongotop</code> for collection-level time. Common causes and solutions: (1) <strong>Monotonic shard key</strong> (e.g., timestamp) — all inserts go to one shard. Fix: reshard with hashed key or compound key with non-monotonic prefix. (2) <strong>Low-cardinality shard key</strong> — jumbo chunks on popular values. Fix: refine shard key to add suffix. (3) <strong>Application-level hot spot</strong> — one tenant/user generates disproportionate traffic. Fix: implement rate limiting, separate hot tenants to dedicated shards using zones. (4) <strong>Unbalanced after migration</strong> — wait for balancer or trigger manual chunk migration with <code>moveChunk</code>. Short-term: increase the hot shard's resources. Long-term: fix the shard key.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What monitoring metrics are critical for MongoDB in production?</div>
  <div class="qa-a">Key metrics: (1) <strong>opcounters</strong> — query, insert, update, delete rates (detect traffic spikes). (2) <strong>Replication lag</strong> — seconds behind primary (alert if > 10s). (3) <strong>WiredTiger cache</strong> — bytes in cache, dirty bytes, eviction rate (alert if evictions spike). (4) <strong>Connections</strong> — current, available (alert at 80% of max). (5) <strong>Lock %</strong> — collection-level lock acquisition time. (6) <strong>Queue lengths</strong> — readers/writers queued (indicates saturation). (7) <strong>Page faults</strong> — indicates working set exceeds RAM. (8) <strong>Oplog window</strong> — hours of oplog available (alert if < 2 hours). (9) <strong>Disk I/O</strong> — IOPS, latency, utilization. (10) <strong>Slow queries</strong> — from profiler or Atlas Performance Advisor. Tools: Atlas monitoring, Prometheus + Grafana, mongostat, mongotop, Datadog.</div>
</div>`
  },
  {
    id: 'mongo-transactions',
    title: 'MongoDB Transactions',
    category: 'MongoDB',
    editorMode: 'mongodb',
    starterCode: `// MongoDB Transactions — ACID Operations
// Available collections: users, orders, products

// MongoDB supports multi-document ACID transactions (4.0+)
// But many operations don't need transactions due to document model

// Single-document operations are already atomic:
db.users.updateOne(
  { _id: "user1" },
  {
    $set: { name: "Alice Updated" },
    $inc: { "stats.loginCount": 1 },
    $push: { "recentActivity": { action: "login", ts: new Date() } }
  }
);

// When you DO need transactions:
// Transferring money between accounts
// Creating an order AND updating product stock
// Any operation that must update multiple documents atomically

// Transaction-like pattern: update order and product stock
// In a real transaction, these would be atomic
db.orders.find({ status: "pending" }).limit(3);

db.products.find(
  { stock: { $lt: 5 } },
  { name: 1, stock: 1, _id: 0 }
);

// Demonstrating atomicity concepts with queries
// Find orders that might need transaction protection
db.orders.aggregate([
  { $unwind: "$items" },
  { $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
  }},
  { $unwind: "$product" },
  { $project: {
      "items.name": 1,
      "items.qty": 1,
      "product.stock": 1,
      needsRestock: { $lt: ["$product.stock", "$items.qty"] }
  }},
  { $match: { needsRestock: true } }
]);`,
    content: `
<h1>MongoDB Transactions</h1>
<p>MongoDB has supported <strong>multi-document ACID transactions</strong> since version 4.0 (replica sets) and 4.2 (sharded clusters). However, MongoDB's document model means many operations that require transactions in relational databases are naturally atomic in MongoDB. Understanding when to use transactions — and when to redesign your schema instead — is a key SDE3 skill.</p>

<h2>Single-Document Atomicity</h2>
<p>MongoDB guarantees that <strong>all writes to a single document are atomic</strong>. This is the foundation of MongoDB's data model — embed related data in one document to avoid transactions.</p>

<pre><code>// These are ALL atomic — no transaction needed:

// 1. Update multiple fields in one document
db.accounts.updateOne(
  { _id: "acct1" },
  {
    $set: { name: "Alice Updated", updatedAt: new Date() },
    $inc: { balance: -100, "stats.transactionCount": 1 },
    $push: {
      transactions: {
        $each: [{ amount: -100, type: "debit", ts: new Date() }],
        $slice: -100    // keep last 100 transactions
      }
    }
  }
);

// 2. findOneAndUpdate — atomic read-modify-write
db.counters.findOneAndUpdate(
  { _id: "orderId" },
  { $inc: { seq: 1 } },
  { returnDocument: "after" }
);

// 3. Array operations with positional operators
db.orders.updateOne(
  { _id: "order1", "items.productId": "p1" },
  { $set: { "items.$.status": "shipped" } }  // update matched array element
);

// KEY INSIGHT: If you can model your data so that related writes
// target a single document, you don't need transactions!</code></pre>

<h2>Multi-Document Transactions</h2>
<pre><code>// When you MUST update multiple documents atomically:

// Transaction API (Node.js driver):
const session = client.startSession();

try {
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary"
  });

  // Transfer $100 from Alice to Bob
  await accounts.updateOne(
    { _id: "alice", balance: { $gte: 100 } },  // check balance
    { $inc: { balance: -100 } },
    { session }
  );

  await accounts.updateOne(
    { _id: "bob" },
    { $inc: { balance: 100 } },
    { session }
  );

  // Create a transfer record
  await transfers.insertOne(
    { from: "alice", to: "bob", amount: 100, ts: new Date() },
    { session }
  );

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}

// With the convenient callback API (handles retries automatically):
await session.withTransaction(async () => {
  await accounts.updateOne({ _id: "alice" }, { $inc: { balance: -100 } }, { session });
  await accounts.updateOne({ _id: "bob" }, { $inc: { balance: 100 } }, { session });
  await transfers.insertOne({ from: "alice", to: "bob", amount: 100 }, { session });
});</code></pre>

<h2>Transaction Guarantees (ACID)</h2>
<table>
  <tr><th>Property</th><th>MongoDB Guarantee</th><th>Details</th></tr>
  <tr><td><strong>Atomicity</strong></td><td>All-or-nothing</td><td>Either all operations commit or all abort. On failure, all changes are rolled back.</td></tr>
  <tr><td><strong>Consistency</strong></td><td>Valid state transitions</td><td>Schema validation and unique indexes are enforced within transactions.</td></tr>
  <tr><td><strong>Isolation</strong></td><td>Snapshot isolation</td><td>Transaction sees a consistent snapshot of data as of its start. Other transactions' uncommitted writes are invisible.</td></tr>
  <tr><td><strong>Durability</strong></td><td>Based on write concern</td><td>With <code>w: "majority"</code>, committed data survives replica set failover.</td></tr>
</table>

<h2>Read and Write Concerns in Transactions</h2>
<pre><code>// Transactions use session-level read/write concerns:

session.startTransaction({
  // READ CONCERN:
  readConcern: { level: "snapshot" },
  // "snapshot" — the transaction reads from a consistent snapshot
  // "majority" — reads data acknowledged by majority
  // "local" — reads most recent local data

  // WRITE CONCERN:
  writeConcern: { w: "majority", j: true },
  // Applied at COMMIT time — all writes are flushed together
  // w: "majority" ensures committed data survives failover

  // READ PREFERENCE:
  readPreference: "primary"
  // Transactions MUST use "primary" read preference
  // (reads and writes go to the same node)
});

// IMPORTANT: Individual operations within a transaction
// CANNOT override the transaction's read/write concern.
// These are set at the transaction level only.</code></pre>

<h2>Transaction Limits and Constraints</h2>
<table>
  <tr><th>Limit</th><th>Value</th><th>Impact</th></tr>
  <tr><td>Transaction timeout</td><td>60 seconds (default)</td><td>Transaction automatically aborts if not committed within this time. Configurable with <code>transactionLifetimeLimitSeconds</code>.</td></tr>
  <tr><td>Oplog entry size</td><td>16MB per transaction</td><td>All changes in a transaction must fit in a single 16MB oplog entry. Limits the number of documents you can modify.</td></tr>
  <tr><td>Lock timeout</td><td>5ms (default)</td><td>If a transaction can't acquire a lock within <code>maxTransactionLockRequestTimeoutMillis</code>, it aborts.</td></tr>
  <tr><td>WiredTiger cache pressure</td><td>Varies</td><td>Long-running transactions hold old snapshot data in cache, increasing memory pressure.</td></tr>
  <tr><td>DDL operations</td><td>Not allowed</td><td>Cannot createCollection, dropCollection, createIndex within a transaction.</td></tr>
  <tr><td>Capped collections</td><td>Not supported</td><td>Cannot read from or write to capped collections in transactions.</td></tr>
</table>

<div class="warning-note"><strong>16MB Oplog Limit:</strong> All changes in a single transaction must fit in one 16MB oplog entry. For a 200-byte average document update, this limits transactions to roughly ~50,000-80,000 operations. For bulk updates affecting millions of documents, batch them into multiple transactions.</div>

<h2>When to Use Transactions vs Schema Redesign</h2>
<pre><code>// SCENARIO 1: Creating an order reduces product stock
// BAD: Two separate updates requiring a transaction
// db.orders.insertOne(order, { session });
// db.products.updateOne({ _id: pid }, { $inc: { stock: -qty } }, { session });

// BETTER: Embed inventory reservation in the order
// Then reconcile stock asynchronously with change streams
{
  _id: "order1",
  items: [{ productId: "p1", qty: 2, price: 29.99, reserved: true }],
  status: "pending"
}
// Use change stream on orders to update product stock asynchronously

// SCENARIO 2: Transfer between accounts
// This genuinely needs a transaction — can't embed two accounts in one doc
// session.withTransaction(async () => { ... })

// SCENARIO 3: User signup creates profile + settings + preferences
// BAD: Three inserts requiring a transaction
// BETTER: Embed all in one user document
{
  _id: "user1",
  profile: { name: "Alice", bio: "..." },
  settings: { theme: "dark", notifications: true },
  preferences: { language: "en", timezone: "UTC" }
}

// RULE OF THUMB:
// If you frequently need transactions between the same collections,
// it's a signal that your schema should be redesigned to embed that data.</code></pre>

<h2>Distributed Transactions (4.2+ Sharded Clusters)</h2>
<pre><code>// MongoDB 4.2 extended transactions to sharded clusters
// A single transaction can span multiple shards

// How it works internally:
// 1. mongos acts as the transaction coordinator
// 2. Uses a two-phase commit protocol:
//    Phase 1 (Prepare): Each shard prepares and votes
//    Phase 2 (Commit):  Coordinator tells all shards to commit

// Performance implications:
// - Cross-shard transactions are slower (network round trips)
// - More lock contention across shards
// - Coordinator adds overhead
// - Higher abort rate due to distributed conflicts

// Best practice: Design shard keys so related data is on the same shard
// If you frequently transaction across shards, reconsider your shard key</code></pre>

<h2>Retry Logic and Error Handling</h2>
<pre><code>// MongoDB transactions can fail due to:
// 1. TransientTransactionError — temporary failures (retryable)
//    - Lock conflicts, primary step-down
// 2. UnknownTransactionCommitResult — commit status unknown
//    - Network error during commit

// RETRY PATTERN:
async function runTransactionWithRetry(session, txnFunc) {
  while (true) {
    try {
      await txnFunc(session);
      break; // success
    } catch (error) {
      if (error.hasOwnProperty("errorLabels") &&
          error.errorLabels.includes("TransientTransactionError")) {
        console.log("TransientTransactionError, retrying...");
        continue; // retry entire transaction
      }
      throw error; // non-retryable error
    }
  }
}

async function commitWithRetry(session) {
  while (true) {
    try {
      await session.commitTransaction();
      break;
    } catch (error) {
      if (error.hasOwnProperty("errorLabels") &&
          error.errorLabels.includes("UnknownTransactionCommitResult")) {
        console.log("UnknownTransactionCommitResult, retrying commit...");
        continue; // retry commit only
      }
      throw error;
    }
  }
}

// The session.withTransaction() callback API handles all this automatically!</code></pre>

<h2>Transaction Anti-Patterns</h2>
<pre><code>// 1. Long-running transactions
// BAD: Hold transaction open while waiting for external API
session.startTransaction();
const result = await externalApi.processPayment(); // 5+ seconds!
await db.orders.updateOne({...}, { session });
await session.commitTransaction();
// FIX: Process external call BEFORE starting transaction

// 2. Large transactions
// BAD: Update millions of documents in one transaction
session.startTransaction();
for (const user of millionsOfUsers) {
  await db.users.updateOne({ _id: user._id }, {...}, { session });
}
// Will exceed 16MB oplog limit and 60-second timeout
// FIX: Batch into smaller transactions (1000 docs each)

// 3. Using transactions for single-document operations
// BAD: Transaction for a single document update
session.startTransaction();
await db.users.updateOne({ _id: "u1" }, { $set: { name: "Alice" } }, { session });
await session.commitTransaction();
// FIX: Single-doc updates are already atomic — no transaction needed

// 4. Using transactions as a substitute for proper schema design
// If you always transaction between users and orders,
// embed order summaries in the user document instead</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: When should you use transactions vs redesign your schema?</div>
  <div class="qa-a">Use transactions when: (1) Multiple documents in different collections must be updated atomically (e.g., financial transfers between accounts). (2) The documents can't logically be embedded (they're independently accessed, different lifecycles). (3) The transaction is short-lived and low-frequency. Redesign your schema when: (1) You're frequently transacting between the same collections — embed the data. (2) The "transaction" only touches one document — single-doc atomicity is sufficient. (3) Eventual consistency is acceptable — use change streams for async reconciliation. (4) The transaction would be large (thousands of documents). Rule: in MongoDB, needing frequent transactions is often a schema design smell. The document model is designed so that related data lives together, eliminating most transaction needs.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is snapshot isolation and how does MongoDB implement it?</div>
  <div class="qa-a">Snapshot isolation means a transaction reads from a consistent point-in-time snapshot of the data. All reads within the transaction see data as it existed when the transaction started, regardless of concurrent writes by other transactions. MongoDB implements this using WiredTiger's MVCC (Multi-Version Concurrency Control). WiredTiger maintains multiple versions of each document — when a transaction starts, it gets a snapshot timestamp and only sees versions before that timestamp. Concurrent writes create new versions that are invisible to the existing transaction. If two transactions try to modify the same document, one will get a write conflict and abort (with TransientTransactionError). This provides strong isolation without read locks, but requires careful handling of write conflicts.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the 16MB oplog entry limit for transactions and its implications.</div>
  <div class="qa-a">When a transaction commits, all its changes are written as a single oplog entry. Since oplog entries are BSON documents, they're limited to 16MB. This effectively limits the total size of changes in a single transaction. For small updates (changing a few fields per document), you can modify roughly 50,000-80,000 documents. For inserts of larger documents, the limit is much lower. Implications: (1) Bulk operations on large datasets must be batched into multiple transactions. (2) Each batch should be sized to stay well under 16MB. (3) The application must handle partial completion (some batches committed, others not). (4) For truly large bulk operations, consider using non-transactional bulk writes with idempotent operations and a reconciliation process.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do distributed transactions work across shards, and what are the performance implications?</div>
  <div class="qa-a">Distributed transactions (4.2+) use a two-phase commit (2PC) protocol. The mongos acts as the coordinator. Phase 1 (Prepare): the coordinator sends a prepare message to all participating shards; each shard writes a prepare oplog entry and responds with its vote. Phase 2 (Commit): if all shards vote yes, the coordinator sends commit; each shard commits and acknowledges. Performance implications: (1) minimum 2 additional network round trips versus single-shard transactions, (2) all participating shards hold locks during the prepare phase, (3) if any shard is slow or unavailable, the entire transaction blocks, (4) increased abort rate due to higher chance of conflicts across shards, (5) coordinator failure during 2PC triggers a recovery protocol. Best practice: design shard keys so that transactional operations target a single shard whenever possible.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if a transaction conflicts with another transaction?</div>
  <div class="qa-a">MongoDB uses optimistic concurrency control with write conflict detection. If two transactions attempt to modify the same document, the first one to write "wins" — its version is recorded. When the second transaction attempts to write to the same document, WiredTiger detects the conflict and the second transaction is aborted with a <code>TransientTransactionError</code> (error code 112: WriteConflict). The application should retry the entire transaction (not just the failed operation) because the transaction's snapshot is invalidated. The <code>session.withTransaction()</code> callback API handles retries automatically. To minimize conflicts: (1) keep transactions short (less time for conflicts), (2) access documents in a consistent order across transactions, (3) design schemas to reduce contention on the same documents, (4) consider using <code>findOneAndUpdate</code> outside transactions for simple atomic operations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does MongoDB ensure durability of committed transactions?</div>
  <div class="qa-a">Durability depends on the write concern used at commit time. With <code>w: "majority", j: true</code>: (1) the commit is replicated to a majority of replica set members, (2) the journal is flushed to disk on those members, (3) the data survives any single-node failure and even a minority of nodes failing simultaneously. With <code>w: 1</code>: the commit is acknowledged by the primary only — if the primary crashes before replication, committed data could be lost (rolled back when the primary rejoins). Since MongoDB 5.0, the default write concern is <code>w: "majority"</code>, which provides strong durability. For financial or critical transactions, always explicitly set <code>w: "majority", j: true</code> to ensure the strongest durability guarantee. The transaction's write concern is set once at the transaction level and applies to the commit operation.</div>
</div>`
  }
];
