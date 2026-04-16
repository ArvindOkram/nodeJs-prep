export const databases = [
  {
    id: 'sql-vs-nosql',
    title: 'SQL vs NoSQL',
    category: 'Databases',
    starterCode: `// SQL vs NoSQL — Conceptual Demo in JavaScript
// Simulating relational vs document data models

// ========== RELATIONAL (SQL) MODEL ==========
// Normalized: data split across tables, joined via foreign keys
const users = [
  { id: 1, name: 'Alice', email: 'alice@ex.com' },
  { id: 2, name: 'Bob', email: 'bob@ex.com' },
];

const orders = [
  { id: 101, user_id: 1, product: 'Laptop', amount: 999 },
  { id: 102, user_id: 1, product: 'Mouse', amount: 25 },
  { id: 103, user_id: 2, product: 'Keyboard', amount: 75 },
];

// SQL JOIN simulation
function sqlJoin(users, orders) {
  return orders.map(order => {
    const user = users.find(u => u.id === order.user_id);
    return { ...order, userName: user.name };
  });
}

console.log('=== SQL (Relational) — JOIN result ===');
console.log(JSON.stringify(sqlJoin(users, orders), null, 2));

// ========== DOCUMENT (NoSQL) MODEL ==========
// Denormalized: embedded subdocuments, no joins needed
const usersNoSQL = [
  {
    _id: 'user_1',
    name: 'Alice',
    email: 'alice@ex.com',
    orders: [
      { product: 'Laptop', amount: 999 },
      { product: 'Mouse', amount: 25 },
    ]
  },
  {
    _id: 'user_2',
    name: 'Bob',
    email: 'bob@ex.com',
    orders: [
      { product: 'Keyboard', amount: 75 },
    ]
  },
];

console.log('\\n=== NoSQL (Document) — Single read ===');
console.log(JSON.stringify(usersNoSQL[0], null, 2));

// ========== KEY-VALUE MODEL ==========
const kvStore = new Map();
kvStore.set('session:abc123', { userId: 1, expires: Date.now() + 3600000 });
kvStore.set('cache:user:1', { name: 'Alice', email: 'alice@ex.com' });

console.log('\\n=== Key-Value Store ===');
console.log('session lookup:', kvStore.get('session:abc123'));
console.log('cache lookup:', kvStore.get('cache:user:1'));

// ========== GRAPH MODEL ==========
const graph = {
  nodes: [
    { id: 'alice', type: 'Person' },
    { id: 'bob', type: 'Person' },
    { id: 'laptop', type: 'Product' },
  ],
  edges: [
    { from: 'alice', to: 'bob', rel: 'FRIENDS_WITH' },
    { from: 'alice', to: 'laptop', rel: 'PURCHASED' },
    { from: 'bob', to: 'laptop', rel: 'VIEWED' },
  ],
};

function friendsWhoViewed(graph, person, product) {
  const friends = graph.edges
    .filter(e => e.from === person && e.rel === 'FRIENDS_WITH')
    .map(e => e.to);
  return graph.edges
    .filter(e => friends.includes(e.from) && e.to === product && e.rel === 'VIEWED')
    .map(e => e.from);
}

console.log('\\n=== Graph Query: Friends of Alice who viewed Laptop ===');
console.log(friendsWhoViewed(graph, 'alice', 'laptop'));`,
    content: `
<h1>SQL vs NoSQL Databases</h1>
<p>Understanding database paradigms is fundamental for any SDE3-level engineer. The choice between SQL and NoSQL is not about which is "better" — it is about which tradeoffs align with your system's requirements. This topic covers all major database models, their strengths, and a decision framework for system design interviews.</p>

<h2>Database Model Taxonomy</h2>
<pre><code>                        Databases
                            |
          ┌─────────────────┼─────────────────┐
      Relational         Non-Relational      NewSQL
       (SQL)              (NoSQL)          (Hybrid)
          |                  |
    ┌─────┴─────┐    ┌──────┼──────┬──────────┐
  OLTP        OLAP  Document  Key-Value  Column-Family  Graph
PostgreSQL  Redshift MongoDB   Redis     Cassandra      Neo4j
MySQL       BigQuery CouchDB   Memcached HBase          Amazon Neptune
                     DynamoDB  DynamoDB  ScyllaDB       ArangoDB</code></pre>

<h2>1. Relational (SQL) Databases</h2>
<p>Relational databases store data in <strong>tables</strong> (relations) with <strong>rows</strong> (tuples) and <strong>columns</strong> (attributes). They enforce a strict schema and use SQL (Structured Query Language) for queries. Relationships are modeled through foreign keys and enforced by referential integrity constraints.</p>

<h3>Core Principles</h3>
<ul>
  <li><strong>Schema-on-write</strong> — data must conform to the schema before being written</li>
  <li><strong>Normalization</strong> — data is split into tables to eliminate redundancy (1NF, 2NF, 3NF, BCNF)</li>
  <li><strong>ACID transactions</strong> — atomicity, consistency, isolation, durability (see ACID vs BASE topic)</li>
  <li><strong>Declarative queries</strong> — SQL describes what you want, not how to get it; the query optimizer decides execution</li>
</ul>

<h3>When SQL Shines</h3>
<ul>
  <li>Complex queries with JOINs across multiple tables</li>
  <li>Strong consistency requirements (financial systems, inventory)</li>
  <li>Well-defined, stable schema</li>
  <li>Ad-hoc analytics and reporting</li>
  <li>Multi-row transactions (transfer money between accounts)</li>
</ul>

<h2>2. Document Databases</h2>
<p>Document databases (MongoDB, CouchDB, DynamoDB in document mode) store data as semi-structured documents — typically JSON or BSON. Each document is self-contained and can have a different structure from other documents in the same collection.</p>

<h3>Core Principles</h3>
<ul>
  <li><strong>Schema-on-read</strong> — no enforced schema; the application interprets the structure</li>
  <li><strong>Denormalization</strong> — related data is embedded within documents, reducing the need for joins</li>
  <li><strong>Document = aggregate</strong> — follows the Domain-Driven Design aggregate pattern</li>
  <li><strong>Horizontal scaling</strong> — designed to shard across multiple nodes</li>
</ul>

<h3>Data Modeling: Embedding vs Referencing</h3>
<pre><code>// EMBEDDING (denormalized) — best for 1:few, data read together
{
  "_id": "user_1",
  "name": "Alice",
  "addresses": [                    // Embedded subdocument
    { "city": "NYC", "zip": "10001" },
    { "city": "SF", "zip": "94102" }
  ]
}

// REFERENCING (normalized) — best for 1:many, many:many
{
  "_id": "user_1",
  "name": "Alice",
  "order_ids": ["ord_101", "ord_102"]  // References
}
// Requires a second query to fetch orders</code></pre>

<h2>3. Key-Value Databases</h2>
<p>Key-value stores (Redis, Memcached, DynamoDB in KV mode, etcd) are the simplest NoSQL model. Every item is stored as a key-value pair. The database treats the value as an opaque blob — it does not inspect or index the value's contents.</p>

<h3>Access Patterns</h3>
<ul>
  <li><strong>GET(key)</strong> — O(1) lookup</li>
  <li><strong>SET(key, value)</strong> — O(1) write</li>
  <li><strong>DELETE(key)</strong> — O(1) removal</li>
  <li>No range queries, no filtering by value (unless the DB extends the model, like Redis sorted sets)</li>
</ul>

<h3>Use Cases</h3>
<ul>
  <li>Session storage: <code>session:&lt;token&gt; → { userId, expiry, cart }</code></li>
  <li>Caching: <code>cache:user:42 → serialized user object</code></li>
  <li>Rate limiting: <code>ratelimit:ip:1.2.3.4 → counter</code></li>
  <li>Feature flags: <code>feature:dark-mode → true/false</code></li>
  <li>Distributed locks: <code>lock:order:789 → owner_id (with TTL)</code></li>
</ul>

<h2>4. Column-Family Databases</h2>
<p>Column-family databases (Cassandra, HBase, ScyllaDB) store data in rows and column families, but unlike relational databases, each row can have a different set of columns. Data is stored column-by-column on disk, making them excellent for write-heavy workloads and time-series data.</p>

<pre><code>// Cassandra data model (conceptual)
// Row key: user_id
// Column family: activity
//
// user_123 → {
//   "2024-01-15T10:00:00": { action: "login", ip: "1.2.3.4" },
//   "2024-01-15T10:05:00": { action: "purchase", item: "laptop" },
//   "2024-01-15T10:10:00": { action: "logout" }
// }
//
// Columns are sorted by timestamp → efficient range scans
// "Give me all activity for user_123 between Jan 15 10:00 and 10:10"</code></pre>

<h3>Key Properties</h3>
<ul>
  <li><strong>Partition key</strong> determines which node stores the data</li>
  <li><strong>Clustering key</strong> determines sort order within a partition</li>
  <li>Designed for <strong>write-heavy</strong> workloads (append-only, LSM-tree based)</li>
  <li>Excellent for time-series, IoT sensor data, activity logs</li>
</ul>

<h2>5. Graph Databases</h2>
<p>Graph databases (Neo4j, Amazon Neptune, ArangoDB, JanusGraph) model data as <strong>nodes</strong> (entities), <strong>edges</strong> (relationships), and <strong>properties</strong>. They excel at traversing deep relationships, which would require expensive recursive JOINs in SQL.</p>

<pre><code>// Graph model
//   (Alice)--[FRIENDS_WITH]-->(Bob)
//   (Alice)--[PURCHASED]-->(Laptop)
//   (Bob)--[VIEWED]-->(Laptop)
//
// Cypher query (Neo4j):
// MATCH (a:Person {name: 'Alice'})-[:FRIENDS_WITH]->(friend)-[:VIEWED]->(p:Product)
// RETURN friend.name, p.name
//
// This multi-hop traversal is O(relationships) not O(total data)
// In SQL this would be multiple self-joins — O(n²) or worse</code></pre>

<h3>Use Cases</h3>
<ul>
  <li>Social networks (friends of friends, mutual connections)</li>
  <li>Recommendation engines ("users who bought X also bought Y")</li>
  <li>Fraud detection (ring detection in transaction graphs)</li>
  <li>Knowledge graphs (Google Knowledge Graph, Wikipedia connections)</li>
  <li>Network topology (routing, dependency graphs)</li>
</ul>

<h2>Comprehensive Comparison Table</h2>
<table>
  <tr>
    <th>Dimension</th>
    <th>Relational (SQL)</th>
    <th>Document</th>
    <th>Key-Value</th>
    <th>Column-Family</th>
    <th>Graph</th>
  </tr>
  <tr>
    <td><strong>Data Model</strong></td>
    <td>Tables, rows, columns</td>
    <td>JSON/BSON documents</td>
    <td>Key → opaque value</td>
    <td>Row key → column families</td>
    <td>Nodes, edges, properties</td>
  </tr>
  <tr>
    <td><strong>Schema</strong></td>
    <td>Strict, predefined</td>
    <td>Flexible, per-document</td>
    <td>Schema-less</td>
    <td>Flexible columns per row</td>
    <td>Flexible</td>
  </tr>
  <tr>
    <td><strong>Query Language</strong></td>
    <td>SQL</td>
    <td>MQL, N1QL, PartiQL</td>
    <td>GET/SET API</td>
    <td>CQL (Cassandra), HBase API</td>
    <td>Cypher, Gremlin, SPARQL</td>
  </tr>
  <tr>
    <td><strong>Joins</strong></td>
    <td>Native, efficient</td>
    <td>$lookup (limited)</td>
    <td>None</td>
    <td>Not supported</td>
    <td>Native traversals</td>
  </tr>
  <tr>
    <td><strong>Transactions</strong></td>
    <td>Full ACID</td>
    <td>Single-doc ACID; multi-doc varies</td>
    <td>Single-key atomic</td>
    <td>Row-level atomic</td>
    <td>Varies (Neo4j: full ACID)</td>
  </tr>
  <tr>
    <td><strong>Scaling</strong></td>
    <td>Primarily vertical; sharding complex</td>
    <td>Horizontal (auto-sharding)</td>
    <td>Horizontal (trivial)</td>
    <td>Horizontal (designed for it)</td>
    <td>Limited horizontal</td>
  </tr>
  <tr>
    <td><strong>Consistency</strong></td>
    <td>Strong</td>
    <td>Tunable</td>
    <td>Tunable</td>
    <td>Tunable (eventual default)</td>
    <td>Strong (single node)</td>
  </tr>
  <tr>
    <td><strong>Best For</strong></td>
    <td>Complex queries, transactions</td>
    <td>Flexible schemas, rapid iteration</td>
    <td>Caching, sessions, counters</td>
    <td>Time-series, write-heavy</td>
    <td>Relationship traversals</td>
  </tr>
  <tr>
    <td><strong>Examples</strong></td>
    <td>PostgreSQL, MySQL, Oracle</td>
    <td>MongoDB, CouchDB, Firestore</td>
    <td>Redis, Memcached, etcd</td>
    <td>Cassandra, HBase, ScyllaDB</td>
    <td>Neo4j, Neptune, ArangoDB</td>
  </tr>
</table>

<h2>Query Language Comparison</h2>
<pre><code>-- SQL (PostgreSQL)
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;

// MongoDB (MQL)
db.users.aggregate([
  { $match: { created_at: { $gt: ISODate("2024-01-01") } } },
  { $lookup: { from: "orders", localField: "_id", foreignField: "user_id", as: "orders" } },
  { $project: { name: 1, order_count: { $size: "$orders" } } },
  { $match: { order_count: { $gt: 5 } } },
  { $sort: { order_count: -1 } }
]);

// Cassandra (CQL) — must query by partition key
SELECT * FROM user_orders
WHERE user_id = 'user_123'
AND order_date > '2024-01-01';
// Cannot do: SELECT * FROM user_orders WHERE amount > 100 (no arbitrary filters)

// Neo4j (Cypher)
MATCH (u:User)-[:PLACED]->(o:Order)
WHERE u.created_at > datetime('2024-01-01')
WITH u, count(o) AS order_count
WHERE order_count > 5
RETURN u.name, order_count
ORDER BY order_count DESC;</code></pre>

<h2>Scaling: Vertical vs Horizontal</h2>
<table>
  <tr>
    <th>Aspect</th>
    <th>Vertical Scaling (Scale Up)</th>
    <th>Horizontal Scaling (Scale Out)</th>
  </tr>
  <tr>
    <td>How</td>
    <td>Bigger machine (more CPU, RAM, SSD)</td>
    <td>More machines (distribute data)</td>
  </tr>
  <tr>
    <td>Cost curve</td>
    <td>Exponential (diminishing returns)</td>
    <td>Linear (add commodity hardware)</td>
  </tr>
  <tr>
    <td>Ceiling</td>
    <td>Hard limit (largest available machine)</td>
    <td>Practically unlimited</td>
  </tr>
  <tr>
    <td>Complexity</td>
    <td>Simple (no code changes)</td>
    <td>Complex (sharding, replication, consensus)</td>
  </tr>
  <tr>
    <td>Downtime</td>
    <td>Usually requires restart</td>
    <td>Can add nodes with zero downtime</td>
  </tr>
  <tr>
    <td>Typical DB</td>
    <td>PostgreSQL, MySQL, Oracle</td>
    <td>Cassandra, MongoDB, DynamoDB</td>
  </tr>
</table>

<h2>Polyglot Persistence</h2>
<p>Modern systems rarely use a single database. <strong>Polyglot persistence</strong> means using different databases for different parts of the system, each chosen for its strengths.</p>

<pre><code>E-Commerce System — Polyglot Persistence Example
┌────────────────────────────────────────────────────────┐
│                    API Gateway                          │
└──────────┬──────────┬──────────┬──────────┬────────────┘
           │          │          │          │
    ┌──────▼──┐ ┌─────▼────┐ ┌──▼─────┐ ┌─▼──────────┐
    │ Product │ │  Order   │ │ Search │ │ Recommend  │
    │ Catalog │ │ Service  │ │ Service│ │  Service   │
    └────┬────┘ └────┬─────┘ └───┬────┘ └─────┬──────┘
         │           │           │             │
    ┌────▼────┐ ┌────▼─────┐ ┌──▼──────┐ ┌───▼──────┐
    │MongoDB  │ │PostgreSQL│ │Elastic- │ │  Neo4j   │
    │(flexible│ │(ACID txn)│ │search   │ │(user     │
    │ schema) │ │          │ │(full-   │ │ behavior │
    │         │ │          │ │ text)   │ │ graph)   │
    └─────────┘ └──────────┘ └─────────┘ └──────────┘
         +               +
    ┌─────────┐    ┌──────────┐
    │  Redis  │    │ Cassandra│
    │ (cache, │    │ (event   │
    │ session)│    │  log)    │
    └─────────┘    └──────────┘</code></pre>

<div class="warning-note"><strong>Polyglot persistence tradeoff:</strong> Using multiple databases increases operational complexity — more systems to monitor, backup, upgrade, and maintain. Only adopt this pattern when the performance or modeling benefits clearly outweigh the operational overhead. Start simple (often just PostgreSQL + Redis) and add specialized databases as needs emerge.</div>

<h2>Use Case Decision Matrix</h2>
<table>
  <tr>
    <th>Requirement</th>
    <th>Best Choice</th>
    <th>Reasoning</th>
  </tr>
  <tr>
    <td>Complex transactions (banking)</td>
    <td>PostgreSQL / MySQL</td>
    <td>Full ACID, strong consistency</td>
  </tr>
  <tr>
    <td>Rapidly evolving schema (startup MVP)</td>
    <td>MongoDB</td>
    <td>Schema flexibility, fast iteration</td>
  </tr>
  <tr>
    <td>Caching layer</td>
    <td>Redis / Memcached</td>
    <td>Sub-millisecond latency, in-memory</td>
  </tr>
  <tr>
    <td>Time-series / IoT data</td>
    <td>Cassandra / TimescaleDB</td>
    <td>Write-heavy, range queries on time</td>
  </tr>
  <tr>
    <td>Full-text search</td>
    <td>Elasticsearch</td>
    <td>Inverted index, relevance scoring</td>
  </tr>
  <tr>
    <td>Social graph / recommendations</td>
    <td>Neo4j</td>
    <td>Efficient multi-hop traversals</td>
  </tr>
  <tr>
    <td>Serverless, auto-scaling</td>
    <td>DynamoDB / Firestore</td>
    <td>Managed, pay-per-request</td>
  </tr>
  <tr>
    <td>Event streaming / log</td>
    <td>Kafka (not a DB, but often used as one)</td>
    <td>Append-only, high throughput, replay</td>
  </tr>
  <tr>
    <td>Global distribution, strong consistency</td>
    <td>Google Spanner / CockroachDB</td>
    <td>NewSQL: SQL + horizontal scaling + global</td>
  </tr>
</table>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose a relational database over a document database?</div>
  <div class="qa-a">Choose relational when you need: (1) Multi-table transactions with ACID guarantees — e.g., transferring money between accounts. (2) Complex queries involving multiple JOINs, GROUP BY, HAVING, and subqueries. (3) Strong schema enforcement — e.g., financial records where every row must have exact columns. (4) Ad-hoc querying and reporting — SQL's declarative nature makes it easy to write arbitrary queries. (5) Referential integrity — foreign keys prevent orphaned records. Choose document when your data is naturally hierarchical (like a product catalog with variable attributes), you need schema flexibility for rapid iteration, or your read pattern is "fetch entire aggregate by ID."</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is polyglot persistence and what are its tradeoffs?</div>
  <div class="qa-a">Polyglot persistence means using different database technologies for different parts of a system based on their strengths. For example: PostgreSQL for orders (ACID), Redis for caching (speed), Elasticsearch for search (full-text), and Cassandra for analytics (write throughput). <strong>Benefits:</strong> optimal performance for each use case, leverage each DB's strengths. <strong>Tradeoffs:</strong> increased operational complexity (monitoring, backups, upgrades for each DB), data consistency across systems requires careful design (events, sagas), team must learn multiple technologies, and more infrastructure to manage. Start with a minimal set and add databases only when a clear need emerges.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can MongoDB do JOINs? How does it compare to SQL JOINs?</div>
  <div class="qa-a">MongoDB supports <code>$lookup</code> in its aggregation pipeline, which functions like a LEFT OUTER JOIN. However, it has significant limitations compared to SQL: (1) It is generally slower than SQL JOINs because MongoDB is not optimized for cross-collection operations. (2) It only works within the same database (not across sharded collections easily). (3) It lacks the full expressiveness of SQL JOINs (no INNER JOIN semantics directly, no complex join predicates). The MongoDB philosophy is to design your schema so that joins are unnecessary — embed related data within documents. If you find yourself doing many $lookups, it may indicate that a relational database is a better fit for that use case.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why can't traditional SQL databases scale horizontally as easily as NoSQL?</div>
  <div class="qa-a">The core challenge is that SQL databases guarantee ACID transactions and support JOINs across any tables. When you shard data across multiple nodes: (1) <strong>JOINs become distributed</strong> — a JOIN between two tables on different shards requires network round-trips and coordination. (2) <strong>Transactions span nodes</strong> — maintaining ACID across shards requires distributed transaction protocols like 2PC, which are slow and complex. (3) <strong>Foreign keys across shards</strong> are nearly impossible to enforce efficiently. NoSQL databases trade away some of these features (no cross-shard joins, limited transactions) to achieve easy horizontal scaling. NewSQL databases like Google Spanner and CockroachDB attempt to solve this with innovations like TrueTime and distributed consensus (Raft/Paxos).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle schema migrations in NoSQL vs SQL?</div>
  <div class="qa-a"><strong>SQL:</strong> Schema changes are explicit ALTER TABLE operations. These can be expensive (locking the table) and require migration scripts (tools like Flyway, Liquibase, Alembic). All rows must conform to the new schema. Rollbacks require reverse migrations. <strong>NoSQL (Document):</strong> Schema is implicit in the application code. You handle migrations lazily — old documents coexist with new ones. The application reads both formats and handles them appropriately (often via a version field). This is simpler for adding fields but creates technical debt if not managed carefully — you can end up with documents in dozens of different "schema versions." Best practice: use a schema validation layer (MongoDB schema validation, Mongoose schemas) even in NoSQL to catch issues early.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is NewSQL, and when would you consider it?</div>
  <div class="qa-a">NewSQL databases (Google Spanner, CockroachDB, TiDB, YugabyteDB) aim to combine the best of both worlds: SQL's ACID transactions and relational model with NoSQL's horizontal scalability. They use distributed consensus protocols (Raft, Paxos) to maintain consistency across nodes. Consider NewSQL when you need: (1) SQL semantics and ACID transactions, (2) horizontal scaling beyond a single machine, and (3) global distribution with strong consistency. The tradeoffs are higher latency for writes (distributed consensus overhead), operational complexity, and cost. They are ideal for global financial systems, inventory management across regions, or any use case that has outgrown a single PostgreSQL instance but requires strong consistency.</div>
</div>
`
  },
  {
    id: 'acid-vs-base',
    title: 'ACID vs BASE',
    category: 'Databases',
    starterCode: `// ACID vs BASE — Transaction Models Demonstrated in JavaScript

// ========== ACID SIMULATION ==========
console.log('=== ACID Transaction Simulation ===');

class BankAccount {
  constructor(name, balance) {
    this.name = name;
    this.balance = balance;
  }
}

function transfer(from, to, amount) {
  // Simulate ACID transaction
  console.log('\\nBefore transfer:');
  console.log('  ' + from.name + ': $' + from.balance);
  console.log('  ' + to.name + ': $' + to.balance);

  // BEGIN TRANSACTION
  const snapshot = { fromBal: from.balance, toBal: to.balance };

  try {
    // ATOMICITY: both operations succeed or both fail
    if (from.balance < amount) {
      throw new Error('Insufficient funds');
    }
    from.balance -= amount;
    to.balance += amount;

    // CONSISTENCY: total money in system unchanged
    const totalBefore = snapshot.fromBal + snapshot.toBal;
    const totalAfter = from.balance + to.balance;
    if (totalBefore !== totalAfter) {
      throw new Error('Consistency violation!');
    }

    // DURABILITY: (simulated) write to persistent storage
    console.log('\\nTransaction COMMITTED (ACID):');
    console.log('  ' + from.name + ': $' + from.balance);
    console.log('  ' + to.name + ': $' + to.balance);
    console.log('  Total preserved: $' + totalAfter);
  } catch (err) {
    // ROLLBACK — restore snapshot
    from.balance = snapshot.fromBal;
    to.balance = snapshot.toBal;
    console.log('\\nTransaction ROLLED BACK: ' + err.message);
  }
}

const alice = new BankAccount('Alice', 1000);
const bob = new BankAccount('Bob', 500);
transfer(alice, bob, 200);  // Success
transfer(alice, bob, 5000); // Fails — rolled back

// ========== BASE / EVENTUAL CONSISTENCY SIMULATION ==========
console.log('\\n\\n=== BASE / Eventual Consistency Simulation ===');

class EventualNode {
  constructor(name) {
    this.name = name;
    this.data = {};
    this.version = 0;
  }
  write(key, value) {
    this.data[key] = value;
    this.version++;
    console.log('[' + this.name + '] wrote ' + key + '=' + value + ' (v' + this.version + ')');
  }
}

const node1 = new EventualNode('US-East');
const node2 = new EventualNode('EU-West');
const node3 = new EventualNode('AP-South');

// Write to one node (basically available)
node1.write('user:123', 'Alice Updated');

// Other nodes still have stale data (soft state)
console.log('\\nImmediately after write:');
console.log('  ' + node1.name + ': ' + (node1.data['user:123'] || 'NOT SET'));
console.log('  ' + node2.name + ': ' + (node2.data['user:123'] || 'NOT SET') + ' (stale)');
console.log('  ' + node3.name + ': ' + (node3.data['user:123'] || 'NOT SET') + ' (stale)');

// Simulate replication delay (eventually consistent)
setTimeout(() => {
  node2.data['user:123'] = node1.data['user:123'];
  node3.data['user:123'] = node1.data['user:123'];
  console.log('\\nAfter replication (eventually consistent):');
  console.log('  ' + node1.name + ': ' + node1.data['user:123']);
  console.log('  ' + node2.name + ': ' + node2.data['user:123']);
  console.log('  ' + node3.name + ': ' + node3.data['user:123']);
  console.log('  All nodes converged!');
}, 100);`,
    content: `
<h1>ACID vs BASE</h1>
<p>ACID and BASE represent two fundamentally different approaches to data consistency in distributed systems. Understanding both models — and when to choose each — is essential for SDE3-level system design. ACID prioritizes correctness; BASE prioritizes availability and performance.</p>

<h2>ACID Properties — Deep Dive</h2>
<pre><code>ACID = Atomicity + Consistency + Isolation + Durability

Transaction: BEGIN → operation1 → operation2 → ... → COMMIT/ROLLBACK

Key guarantee: Even if the system crashes mid-transaction,
the database will NEVER be left in a partial/corrupted state.</code></pre>

<h3>Atomicity</h3>
<p><strong>Definition:</strong> A transaction is an indivisible unit of work. Either ALL operations within the transaction succeed and are committed, or NONE of them take effect (the transaction is rolled back). There is no partial application.</p>

<pre><code>-- Transfer $100 from Alice to Bob
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE user = 'Alice';
  UPDATE accounts SET balance = balance + 100 WHERE user = 'Bob';
COMMIT;

-- If the system crashes after the first UPDATE but before COMMIT:
-- The write-ahead log (WAL) ensures the first UPDATE is rolled back
-- Alice's money is NOT lost</code></pre>

<p><strong>Implementation:</strong> Most databases use a <strong>Write-Ahead Log (WAL)</strong>. Before modifying data pages, the database writes the intended changes to a sequential log. On crash recovery, uncommitted changes in the WAL are rolled back, and committed changes are replayed.</p>

<h3>Consistency</h3>
<p><strong>Definition:</strong> A transaction moves the database from one valid state to another valid state. All integrity constraints (primary keys, foreign keys, unique constraints, CHECK constraints, triggers) are satisfied before and after the transaction.</p>

<div class="warning-note"><strong>Note on "Consistency":</strong> The "C" in ACID refers to application-level invariants (e.g., "account balance >= 0"). The "C" in CAP refers to linearizability — all nodes see the same data at the same time. These are different concepts despite sharing the same word.</div>

<h3>Isolation</h3>
<p><strong>Definition:</strong> Concurrent transactions execute as if they were serial — one after another. In practice, databases offer isolation <em>levels</em> that trade strictness for performance.</p>

<h4>Isolation Levels</h4>
<table>
  <tr>
    <th>Isolation Level</th>
    <th>Dirty Read</th>
    <th>Non-Repeatable Read</th>
    <th>Phantom Read</th>
    <th>Performance</th>
  </tr>
  <tr>
    <td><strong>Read Uncommitted</strong></td>
    <td>Possible</td>
    <td>Possible</td>
    <td>Possible</td>
    <td>Fastest</td>
  </tr>
  <tr>
    <td><strong>Read Committed</strong></td>
    <td>Prevented</td>
    <td>Possible</td>
    <td>Possible</td>
    <td>Fast</td>
  </tr>
  <tr>
    <td><strong>Repeatable Read</strong></td>
    <td>Prevented</td>
    <td>Prevented</td>
    <td>Possible</td>
    <td>Moderate</td>
  </tr>
  <tr>
    <td><strong>Serializable</strong></td>
    <td>Prevented</td>
    <td>Prevented</td>
    <td>Prevented</td>
    <td>Slowest</td>
  </tr>
</table>

<pre><code>Read Phenomena Explained:

DIRTY READ:  T1 writes X=100 (not committed)
             T2 reads X=100
             T1 rolls back → T2 has a value that never existed

NON-REPEATABLE READ:
             T1 reads X=50
             T2 updates X=100, commits
             T1 reads X=100 (different value in same txn!)

PHANTOM READ:
             T1: SELECT * WHERE age > 25 → 10 rows
             T2: INSERT row with age=30, commits
             T1: SELECT * WHERE age > 25 → 11 rows (phantom row appeared)</code></pre>

<h4>MVCC (Multi-Version Concurrency Control)</h4>
<p>PostgreSQL and MySQL InnoDB use MVCC to implement isolation without heavy locking. Each row has a version; readers see a <strong>snapshot</strong> of the data at their transaction's start time. Writers create new versions rather than overwriting. This allows readers and writers to operate concurrently without blocking each other.</p>

<h3>Durability</h3>
<p><strong>Definition:</strong> Once a transaction is committed, its effects are permanent — even if the system crashes immediately after. The data survives power failures, OS crashes, and hardware failures.</p>
<p><strong>Implementation:</strong> WAL is flushed to disk (fsync) before the COMMIT returns to the client. Some databases offer relaxed durability (e.g., <code>synchronous_commit=off</code> in PostgreSQL) for higher write throughput at the risk of losing the last few milliseconds of commits on crash.</p>

<h2>BASE Properties — Deep Dive</h2>
<pre><code>BASE = Basically Available + Soft state + Eventually consistent

Philosophy: "It's okay to be temporarily wrong, as long as we're always available
and eventually converge to the correct state."</code></pre>

<h3>Basically Available</h3>
<p>The system guarantees availability as defined by the CAP theorem. Every request receives a response (not an error), but the response may be stale or incomplete. The system distributes data across nodes so that even if some nodes fail, the rest continue serving requests.</p>

<h3>Soft State</h3>
<p>The system's state may change over time, even without new input. This happens because of asynchronous replication — data written to one node takes time to propagate to others. During this window, different nodes may return different values for the same key.</p>

<h3>Eventually Consistent</h3>
<p>If no new updates are made, all replicas will eventually converge to the same value. The "eventually" can be milliseconds or seconds, depending on the system. Cassandra, DynamoDB, and DNS are examples of eventually consistent systems.</p>

<h2>ACID vs BASE Comparison</h2>
<table>
  <tr>
    <th>Aspect</th>
    <th>ACID</th>
    <th>BASE</th>
  </tr>
  <tr>
    <td><strong>Consistency Model</strong></td>
    <td>Strong (immediate)</td>
    <td>Eventual</td>
  </tr>
  <tr>
    <td><strong>Availability</strong></td>
    <td>May sacrifice for consistency</td>
    <td>Prioritizes availability</td>
  </tr>
  <tr>
    <td><strong>Scaling</strong></td>
    <td>Vertical (primarily)</td>
    <td>Horizontal (designed for it)</td>
  </tr>
  <tr>
    <td><strong>Data Model</strong></td>
    <td>Relational (typically)</td>
    <td>NoSQL (typically)</td>
  </tr>
  <tr>
    <td><strong>Performance</strong></td>
    <td>Lower (locking, coordination)</td>
    <td>Higher (no global coordination)</td>
  </tr>
  <tr>
    <td><strong>Use Case</strong></td>
    <td>Financial, inventory, booking</td>
    <td>Social feeds, analytics, caching</td>
  </tr>
  <tr>
    <td><strong>Failure Mode</strong></td>
    <td>Reject writes if consistency can't be guaranteed</td>
    <td>Accept writes, reconcile later</td>
  </tr>
  <tr>
    <td><strong>Example Systems</strong></td>
    <td>PostgreSQL, MySQL, Oracle, SQL Server</td>
    <td>Cassandra, DynamoDB, CouchDB, Riak</td>
  </tr>
</table>

<h2>Two-Phase Commit (2PC)</h2>
<p>2PC is a protocol for achieving ACID transactions across multiple nodes (distributed transactions). It uses a <strong>coordinator</strong> and multiple <strong>participants</strong>.</p>

<pre><code>Two-Phase Commit Protocol:

Phase 1: PREPARE (Voting)
  Coordinator → All Participants: "Can you commit?"
  Each Participant:
    - Acquires locks, writes to WAL
    - Responds: VOTE_COMMIT or VOTE_ABORT

Phase 2: COMMIT/ABORT (Decision)
  If ALL voted COMMIT:
    Coordinator → All: "COMMIT"
    Participants: apply changes, release locks
  If ANY voted ABORT:
    Coordinator → All: "ABORT"
    Participants: rollback, release locks

Timeline:
  Coordinator    Participant A    Participant B
      |               |               |
      |---PREPARE---->|               |
      |---PREPARE------------------->|
      |               |               |
      |<--VOTE_YES----|               |
      |<--VOTE_YES--------------------|
      |               |               |
      |---COMMIT----->|               |
      |---COMMIT--------------------->|
      |               |               |
      |<----ACK-------|               |
      |<----ACK------------------------|</code></pre>

<h3>2PC Problems</h3>
<ul>
  <li><strong>Blocking protocol:</strong> If the coordinator crashes after Phase 1 but before Phase 2, participants are stuck holding locks indefinitely (they voted but don't know the decision)</li>
  <li><strong>Single point of failure:</strong> The coordinator is critical — if it dies, the whole transaction is in limbo</li>
  <li><strong>Performance:</strong> Requires multiple network round trips and disk flushes — very slow for high-throughput systems</li>
  <li><strong>Not partition-tolerant:</strong> If a network partition separates the coordinator from a participant, the protocol can't make progress</li>
</ul>

<h2>Saga Pattern — Alternative to 2PC</h2>
<p>The Saga pattern breaks a distributed transaction into a sequence of local transactions, each with a <strong>compensating action</strong> (undo). If any step fails, the compensating actions for completed steps are executed in reverse order.</p>

<pre><code>Saga: Book a Trip (Flight + Hotel + Car)

Step 1: Book Flight       → Compensate: Cancel Flight
Step 2: Book Hotel         → Compensate: Cancel Hotel
Step 3: Book Car Rental    → Compensate: Cancel Car

Happy Path:
  Book Flight ✓ → Book Hotel ✓ → Book Car ✓ → DONE

Failure at Step 3:
  Book Flight ✓ → Book Hotel ✓ → Book Car ✗
                   Cancel Hotel ← Cancel Flight ← COMPENSATING

Two Saga Execution Styles:
┌────────────────────────────────────────────────────────┐
│ CHOREOGRAPHY (Event-driven)                            │
│   Flight Service → "flight.booked" event               │
│   Hotel Service (listens) → "hotel.booked" event       │
│   Car Service (listens) → "car.booked" event           │
│   If failure → publishes "car.failed" → others react   │
│   Pro: Decoupled, simple   Con: Hard to track flow     │
├────────────────────────────────────────────────────────┤
│ ORCHESTRATION (Central coordinator)                    │
│   Saga Orchestrator calls each service in order         │
│   On failure, orchestrator calls compensating actions   │
│   Pro: Clear flow, easy to monitor  Con: Single point  │
└────────────────────────────────────────────────────────┘</code></pre>

<div class="warning-note"><strong>Saga does NOT provide isolation.</strong> Between steps, other transactions can see intermediate states (e.g., flight booked but hotel not yet). To handle this, use <strong>semantic locks</strong> (mark resources as "pending"), <strong>commutative updates</strong>, or <strong>re-read values</strong> before compensating. This is the key tradeoff compared to 2PC.</div>

<h2>Practical Examples</h2>

<h3>When to Use ACID</h3>
<ul>
  <li><strong>Banking:</strong> Transferring money between accounts — must be atomic, or you lose/duplicate money</li>
  <li><strong>E-commerce inventory:</strong> Decrementing stock must be consistent — can't oversell</li>
  <li><strong>Booking systems:</strong> Can't double-book the same hotel room or flight seat</li>
  <li><strong>Healthcare:</strong> Patient records must be accurate and consistent at all times</li>
</ul>

<h3>When to Use BASE</h3>
<ul>
  <li><strong>Social media feeds:</strong> It's fine if a post takes a few seconds to appear on all followers' feeds</li>
  <li><strong>Analytics dashboards:</strong> Slightly stale data is acceptable — real-time accuracy is not critical</li>
  <li><strong>Shopping cart:</strong> A user's cart can be eventually consistent — worst case they see a slight delay</li>
  <li><strong>DNS:</strong> The classic eventually consistent system — propagation takes hours, and that's by design</li>
  <li><strong>Content delivery:</strong> CDN caches may serve stale content until TTL expires</li>
</ul>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Can a system be both ACID and horizontally scalable?</div>
  <div class="qa-a">Yes — this is exactly what NewSQL databases like Google Spanner and CockroachDB achieve. Spanner uses synchronized clocks (TrueTime) and Paxos consensus to provide ACID transactions across globally distributed nodes. CockroachDB uses Raft consensus and serializable snapshot isolation (SSI). However, these systems have higher write latency than single-node databases due to the consensus overhead. They also trade some availability during network partitions (they are CP in CAP terms). For most applications, starting with a single-node PostgreSQL and adding read replicas is sufficient — you only need NewSQL when you've genuinely outgrown a single node's capacity.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between 2PC and Saga. When would you use each?</div>
  <div class="qa-a"><strong>2PC</strong> provides true atomicity — either all participants commit or all abort. It holds locks across all participants for the entire duration, ensuring isolation. Use 2PC when you need strict consistency across a small number of services and can tolerate higher latency (e.g., financial transactions across two databases). <strong>Sagas</strong> use compensating transactions — if step N fails, undo steps N-1...1. They don't hold distributed locks, so they're more available and performant, but they sacrifice isolation (intermediate states are visible). Use Sagas for long-running business processes across many microservices (e.g., order fulfillment, travel booking) where strict isolation is less critical than availability. In practice, most microservice architectures use Sagas because 2PC doesn't scale well across many services.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the Write-Ahead Log (WAL), and why is it essential for ACID?</div>
  <div class="qa-a">The WAL (also called redo log in MySQL) is a sequential, append-only log where every data modification is recorded BEFORE it is applied to the actual data pages. This ensures Atomicity (on crash, replay or rollback using WAL) and Durability (committed data is in the WAL even if data pages aren't flushed). The WAL is sequential writes (fast on disk), while data pages are random writes (slow). PostgreSQL's WAL is also the foundation for replication — replicas replay the leader's WAL to stay in sync. Key insight: without WAL, a crash during a partial page write could corrupt the database irreparably.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does MVCC achieve isolation without heavy locking?</div>
  <div class="qa-a">MVCC (Multi-Version Concurrency Control) maintains multiple versions of each row, tagged with transaction IDs. When a transaction starts, it gets a snapshot — a set of transaction IDs that are considered "visible." Readers see the version of each row committed before their snapshot; writers create new versions. This means readers never block writers and writers never block readers. PostgreSQL implements this by keeping old row versions in the table itself (cleaned up by VACUUM). MySQL InnoDB stores old versions in the undo log. The tradeoff is storage overhead (multiple versions) and the need for garbage collection of old versions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What isolation level does PostgreSQL use by default, and is it sufficient for most applications?</div>
  <div class="qa-a">PostgreSQL defaults to <strong>Read Committed</strong>. Each statement within a transaction sees the latest committed data at the time that statement starts executing. This prevents dirty reads but allows non-repeatable reads and phantom reads. For most web applications, Read Committed is sufficient — you rarely need to read the same row twice within a single request-handling transaction. However, for financial applications where you read a balance, make a decision, and then update, you should use <strong>Repeatable Read</strong> or <strong>Serializable</strong> to prevent another transaction from changing the balance between your read and write. PostgreSQL's Serializable level uses Serializable Snapshot Isolation (SSI), which detects conflicts at commit time rather than using heavy locking.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: In a microservices architecture, how do you maintain data consistency across services without 2PC?</div>
  <div class="qa-a">The standard approach is the <strong>Transactional Outbox Pattern</strong> combined with <strong>Sagas</strong>. Each service writes to its own database AND publishes domain events. The Outbox pattern ensures atomicity of the DB write + event publish: the event is written to an "outbox" table in the same local transaction as the data change. A separate process (or CDC like Debezium) reads the outbox and publishes to the event broker (Kafka). Downstream services react to events and perform their local transactions. If something fails, compensating events are published. This gives you eventual consistency without distributed transactions. The key insight: accept that cross-service consistency is eventual, and design your business logic to handle intermediate states gracefully.</div>
</div>
`
  },
  {
    id: 'cap-theorem',
    title: 'CAP Theorem & PACELC',
    category: 'Databases',
    starterCode: `// CAP Theorem — Simulating Partition Tolerance Tradeoffs

console.log('=== CAP Theorem Simulation ===');
console.log('Simulating a 3-node distributed database with a network partition\\n');

class Node {
  constructor(name) {
    this.name = name;
    this.data = { user: 'Alice', version: 1 };
    this.isPartitioned = false;
  }
}

const nodeA = new Node('Node-A (Leader)');
const nodeB = new Node('Node-B');
const nodeC = new Node('Node-C');

// Before partition — all nodes in sync
console.log('--- Before Network Partition ---');
console.log('All nodes: user=' + nodeA.data.user + ', v=' + nodeA.data.version);

// Simulate network partition: Node-C is separated
nodeC.isPartitioned = true;
console.log('\\n⚡ NETWORK PARTITION: Node-C is isolated from A and B');

// Client writes to Node-A
nodeA.data = { user: 'Bob', version: 2 };
nodeB.data = { user: 'Bob', version: 2 }; // Replication to B works

console.log('\\nClient writes user=Bob to Node-A');
console.log('  Node-A: user=' + nodeA.data.user + ', v=' + nodeA.data.version + ' (updated)');
console.log('  Node-B: user=' + nodeB.data.user + ', v=' + nodeB.data.version + ' (replicated)');
console.log('  Node-C: user=' + nodeC.data.user + ', v=' + nodeC.data.version + ' (STALE - partitioned)');

// ========== CP SYSTEM (e.g., MongoDB, HBase) ==========
console.log('\\n--- CP System Behavior (Consistency + Partition Tolerance) ---');
console.log('Client reads from Node-C:');
console.log('  → REJECTED! Node-C returns error (503 unavailable)');
console.log('  → CP system sacrifices availability to prevent stale reads');

// ========== AP SYSTEM (e.g., Cassandra, DynamoDB) ==========
console.log('\\n--- AP System Behavior (Availability + Partition Tolerance) ---');
console.log('Client reads from Node-C:');
console.log('  → Returns: user=' + nodeC.data.user + ', v=' + nodeC.data.version + ' (STALE but available)');
console.log('  → AP system sacrifices consistency to remain available');

// ========== After partition heals ==========
console.log('\\n--- After Partition Heals ---');
nodeC.isPartitioned = false;
nodeC.data = { ...nodeA.data }; // Sync
console.log('Node-C syncs: user=' + nodeC.data.user + ', v=' + nodeC.data.version);
console.log('All nodes eventually consistent!');

// ========== PACELC Extension ==========
console.log('\\n\\n=== PACELC Extension ===');
console.log('During Partition:');
console.log('  Choose between Availability (A) and Consistency (C)');
console.log('\\nElse (no partition):');
console.log('  Choose between Latency (L) and Consistency (C)');
console.log('\\nExamples:');
console.log('  DynamoDB: PA/EL (Available during partition, Low latency normally)');
console.log('  MongoDB:  PC/EC (Consistent during partition, Consistent normally)');
console.log('  Cassandra: PA/EL (Available during partition, Low latency normally)');
console.log('  Spanner:  PC/EC (Consistent always, higher latency)');`,
    content: `
<h1>CAP Theorem & PACELC</h1>
<p>The CAP theorem is arguably the most important theoretical result in distributed systems. First conjectured by Eric Brewer in 2000 and proven by Gilbert and Lynch in 2002, it defines the fundamental tradeoffs that every distributed database must make. PACELC extends CAP to cover the common case when there is no partition.</p>

<h2>CAP Theorem Statement</h2>
<pre><code>In a distributed data store, you can only guarantee TWO out of THREE:

  C — Consistency:  Every read receives the most recent write (linearizability)
  A — Availability: Every request receives a non-error response (may be stale)
  P — Partition Tolerance: System continues operating despite network partitions

             C
            / \\
           /   \\
         CP     CA
         /       \\
        P ——AP—— A

Since network partitions WILL happen in any distributed system,
you must choose: CP or AP.

CA is theoretical — only possible on a single node (not distributed).</code></pre>

<h2>Why You Can't Have All Three — Proof Intuition</h2>
<p>Imagine two nodes, N1 and N2, with a network partition between them:</p>

<pre><code>  Client → [N1]  ✗ partition ✗  [N2]

Scenario: Client writes X=1 to N1. Another client reads X from N2.

Option 1 (Choose Consistency — CP):
  N2 refuses to serve the read because it can't verify it has the latest data.
  → Consistency ✓, Availability ✗

Option 2 (Choose Availability — AP):
  N2 returns its current value of X (stale).
  → Availability ✓, Consistency ✗

Option 3 (Choose CA — no partition tolerance):
  This requires guaranteeing no partitions ever occur.
  In any network, partitions ARE possible (cables fail, switches die).
  → Not realistic for distributed systems.</code></pre>

<div class="warning-note"><strong>Common misconception:</strong> CAP does NOT mean you permanently give up C or A. The tradeoff only applies DURING a partition. When the network is healthy, you can have both consistency and availability. This is why PACELC is a more nuanced and practical framework.</div>

<h2>CP Systems — Consistency + Partition Tolerance</h2>
<p>CP systems refuse to serve requests (become unavailable) when they cannot guarantee consistency. They choose to be correct over being responsive.</p>

<table>
  <tr>
    <th>System</th>
    <th>CP Behavior</th>
    <th>Details</th>
  </tr>
  <tr>
    <td><strong>MongoDB</strong></td>
    <td>Primary unavailable during leader election</td>
    <td>When the primary goes down, writes are rejected until a new primary is elected (typically 10-30 seconds). Reads from secondaries return stale data unless using readConcern: "majority"</td>
  </tr>
  <tr>
    <td><strong>HBase</strong></td>
    <td>Region unavailable during failover</td>
    <td>Uses ZooKeeper for coordination. If a RegionServer fails, its regions are unavailable until reassigned</td>
  </tr>
  <tr>
    <td><strong>Redis Cluster</strong></td>
    <td>Slot unavailable if master + replicas fail</td>
    <td>If a hash slot's master fails and has no replicas, that portion of keyspace is unavailable</td>
  </tr>
  <tr>
    <td><strong>etcd / ZooKeeper</strong></td>
    <td>Requires majority quorum</td>
    <td>Uses Raft/ZAB consensus. If majority of nodes are partitioned away, the minority cannot serve writes</td>
  </tr>
  <tr>
    <td><strong>Google Spanner</strong></td>
    <td>Rejects writes without quorum</td>
    <td>Uses Paxos. Prioritizes strong consistency (external consistency) even at the cost of availability during partitions</td>
  </tr>
</table>

<h2>AP Systems — Availability + Partition Tolerance</h2>
<p>AP systems continue serving requests during partitions, even if the data might be stale. They choose to be responsive over being correct, and resolve inconsistencies after the partition heals.</p>

<table>
  <tr>
    <th>System</th>
    <th>AP Behavior</th>
    <th>Conflict Resolution</th>
  </tr>
  <tr>
    <td><strong>Cassandra</strong></td>
    <td>Writes accepted on any available node</td>
    <td>Last-write-wins (timestamp). Tunable consistency (QUORUM for stronger guarantees)</td>
  </tr>
  <tr>
    <td><strong>DynamoDB</strong></td>
    <td>Writes accepted with eventual consistency</td>
    <td>Last-writer-wins. Conditional writes for stronger guarantees</td>
  </tr>
  <tr>
    <td><strong>CouchDB</strong></td>
    <td>Multi-master, accepts writes on any node</td>
    <td>Deterministic revision tree — conflicts are stored and app resolves</td>
  </tr>
  <tr>
    <td><strong>Riak</strong></td>
    <td>Writes accepted with sloppy quorum</td>
    <td>Vector clocks, CRDTs for automatic resolution</td>
  </tr>
  <tr>
    <td><strong>DNS</strong></td>
    <td>Always returns a record (possibly stale)</td>
    <td>TTL-based expiry, eventual propagation</td>
  </tr>
</table>

<h2>PACELC Extension</h2>
<p>Eric Brewer himself acknowledged that CAP is an oversimplification. The PACELC theorem (proposed by Daniel Abadi) extends CAP to address the common case — when there is NO partition:</p>

<pre><code>PACELC:

IF there is a Partition (P):
  Choose between Availability (A) and Consistency (C)
ELSE (E) — normal operation:
  Choose between Latency (L) and Consistency (C)

This gives 4 categories:
  PA/EL — Available during partition, Low latency normally
  PA/EC — Available during partition, Consistent normally
  PC/EL — Consistent during partition, Low latency normally
  PC/EC — Consistent during partition, Consistent normally</code></pre>

<h3>PACELC Classification of Real Systems</h3>
<table>
  <tr>
    <th>System</th>
    <th>P → A or C?</th>
    <th>E → L or C?</th>
    <th>PACELC</th>
    <th>Explanation</th>
  </tr>
  <tr>
    <td><strong>DynamoDB</strong></td>
    <td>A</td>
    <td>L</td>
    <td>PA/EL</td>
    <td>Prioritizes availability and speed. Eventually consistent reads by default</td>
  </tr>
  <tr>
    <td><strong>Cassandra</strong></td>
    <td>A</td>
    <td>L</td>
    <td>PA/EL</td>
    <td>Tunable, but default is eventual consistency for speed. With QUORUM: PC/EC</td>
  </tr>
  <tr>
    <td><strong>MongoDB</strong></td>
    <td>C</td>
    <td>C</td>
    <td>PC/EC</td>
    <td>Single primary for writes ensures consistency. Leader election during partition</td>
  </tr>
  <tr>
    <td><strong>Google Spanner</strong></td>
    <td>C</td>
    <td>C</td>
    <td>PC/EC</td>
    <td>Strong consistency always, higher latency due to Paxos + TrueTime</td>
  </tr>
  <tr>
    <td><strong>PostgreSQL (single node)</strong></td>
    <td>N/A</td>
    <td>C</td>
    <td>-/EC</td>
    <td>Not distributed; no partition concern. Strong consistency</td>
  </tr>
  <tr>
    <td><strong>CockroachDB</strong></td>
    <td>C</td>
    <td>C</td>
    <td>PC/EC</td>
    <td>Serializable by default. Uses Raft consensus</td>
  </tr>
  <tr>
    <td><strong>Riak</strong></td>
    <td>A</td>
    <td>L</td>
    <td>PA/EL</td>
    <td>Sloppy quorum, hinted handoff. Prioritizes availability</td>
  </tr>
  <tr>
    <td><strong>Cosmos DB</strong></td>
    <td>Tunable</td>
    <td>Tunable</td>
    <td>Tunable</td>
    <td>5 consistency levels from strong to eventual</td>
  </tr>
</table>

<h2>Tunable Consistency</h2>
<p>Many modern databases let you tune the consistency-availability tradeoff per-request using <strong>quorum</strong> settings:</p>

<pre><code>Cassandra Consistency Levels:

Replication Factor (RF) = 3 (data on 3 nodes)

  ONE:      Write/Read from 1 node  → Fastest, least consistent
  QUORUM:   Write/Read from 2 nodes → Balanced (majority = RF/2 + 1)
  ALL:      Write/Read from 3 nodes → Slowest, strongest consistency

Strong Consistency Formula:
  R + W > N  (where R=read replicas, W=write replicas, N=total replicas)

  Example: N=3, W=QUORUM(2), R=QUORUM(2) → 2+2=4 > 3 → Strong consistency
  Example: N=3, W=ONE(1), R=ONE(1) → 1+1=2 < 3 → Eventual consistency
  Example: N=3, W=ALL(3), R=ONE(1) → 3+1=4 > 3 → Strong consistency (slow writes)</code></pre>

<h2>Real-World Tradeoff Examples</h2>

<h3>Example 1: E-Commerce Inventory</h3>
<pre><code>Scenario: Black Friday sale. 1000 people buying the last item.

CP approach (PostgreSQL):
  SELECT quantity FROM products WHERE id = 1 FOR UPDATE;
  -- Locks the row. Only one transaction proceeds at a time.
  -- If database node fails: orders rejected (unavailable)
  -- But: Never oversells ✓

AP approach (Cassandra with ONE consistency):
  -- Multiple nodes accept decrement concurrently
  -- During partition: all nodes continue accepting orders
  -- Risk: quantity goes negative → overselling!
  -- Fix: Use conditional updates (lightweight transactions) or
  --       accept overselling and apologize/compensate</code></pre>

<h3>Example 2: Social Media Timeline</h3>
<pre><code>Scenario: User posts a photo. Followers see it in their feeds.

AP approach (preferred for social media):
  -- Write to nearest node (fast, available)
  -- Replicate asynchronously to other regions
  -- A follower in another region may not see the post for 1-2 seconds
  -- Acceptable! Users won't notice a 1-second delay

CP approach (overkill for this use case):
  -- Wait for all replicas to acknowledge before confirming post
  -- If any replica is down, post fails (user sees error)
  -- Unnecessary strictness for a social media feed</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Is it true that you must always give up either consistency or availability?</div>
  <div class="qa-a">No — the CAP tradeoff only applies DURING a network partition. When the network is healthy (which is the common case), you can have both strong consistency and high availability. This is the key insight behind PACELC: the "Else" part addresses the normal operating mode. For example, Cassandra with QUORUM reads and writes provides strong consistency when all nodes are reachable, and only falls back to eventual consistency during partitions if configured to do so. The real engineering question is: what behavior do you want during the (hopefully rare) partition events?</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Where does PostgreSQL fit in CAP?</div>
  <div class="qa-a">A single-node PostgreSQL is technically outside CAP — CAP only applies to distributed systems. It provides strong consistency (ACID) and full availability (single point of failure aside). With streaming replication: if you use synchronous replication, it becomes CP — the primary waits for the replica to acknowledge before confirming writes, and if the replica is unreachable, writes block (sacrificing availability). With asynchronous replication, it leans AP — the primary continues accepting writes even if replicas are down, but replicas may serve stale data. Tools like Patroni manage automatic failover, making PostgreSQL HA more practical.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Cassandra achieve tunable consistency?</div>
  <div class="qa-a">Cassandra lets you set consistency level per-query. With a replication factor (RF) of 3: write at QUORUM (2 of 3 nodes acknowledge) and read at QUORUM (read from 2 of 3 nodes) gives you strong consistency because R + W > N (2 + 2 > 3 — at least one node must have the latest write). Write at ONE and read at ONE gives eventual consistency (1 + 1 = 2, which is not > 3). This per-query tunability lets you mix: use QUORUM for critical operations (payments) and ONE for less critical reads (product listings). The tradeoff is latency — QUORUM is slower because you wait for multiple nodes.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens to AP systems when the partition heals? How do conflicts get resolved?</div>
  <div class="qa-a">When the partition heals, AP systems must reconcile divergent data. Common strategies: (1) <strong>Last-writer-wins (LWW)</strong> — Cassandra uses timestamps; the write with the latest timestamp wins. Simple but can lose data if clocks are skewed. (2) <strong>Vector clocks</strong> — Riak tracks causality; concurrent writes are detected and either automatically merged or flagged for application resolution. (3) <strong>CRDTs (Conflict-free Replicated Data Types)</strong> — data structures designed so that concurrent updates can always be merged deterministically (e.g., G-Counter, OR-Set). Used by Riak and Redis Enterprise. (4) <strong>Application-level resolution</strong> — CouchDB stores all conflicting revisions and lets the application decide which to keep.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Google Spanner achieve strong consistency globally while still being "available"?</div>
  <div class="qa-a">Spanner is technically CP — during a partition, it sacrifices availability. However, Google's private network makes partitions extremely rare, so in practice it feels highly available. Spanner achieves external consistency (stronger than linearizability) using: (1) <strong>TrueTime API</strong> — GPS and atomic clocks in every datacenter provide globally synchronized timestamps with bounded uncertainty (usually < 7ms). (2) <strong>Paxos consensus</strong> — every write goes through a Paxos group spanning datacenters. (3) <strong>Wait-out</strong> — after a write, Spanner waits for the TrueTime uncertainty interval to pass before making the write visible, ensuring that any subsequent read anywhere in the world will see it. The cost is write latency (~10-15ms for cross-region), which is the PACELC tradeoff: PC/EC.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: In a system design interview, how should you discuss CAP?</div>
  <div class="qa-a">First, identify the consistency requirements of the specific feature, not the entire system. Different features may need different tradeoffs. For example, in an e-commerce system: inventory checks need CP (no overselling), but product reviews can be AP (eventual consistency is fine). Then, frame your database choice in terms of PACELC: "During normal operation, we need low latency for reads, so we'll use Cassandra with ONE consistency for the product catalog. For the checkout flow, we need strong consistency, so we'll use PostgreSQL." Avoid saying "we need CAP" — it shows misunderstanding. Instead, explain the specific tradeoffs you're making and why they're acceptable for each use case. Always quantify: "We can tolerate up to 2 seconds of stale data for the feed, but zero staleness for account balance."</div>
</div>
`
  },
  {
    id: 'db-sharding',
    title: 'Database Sharding',
    category: 'Databases',
    starterCode: `// Database Sharding Strategies — JavaScript Simulation

// ========== HASH-BASED SHARDING ==========
console.log('=== Hash-Based Sharding ===');

function hashShard(key, numShards) {
  // Simple hash function (FNV-1a inspired)
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash % numShards;
}

const users = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi'];
const NUM_SHARDS = 3;

console.log('Distributing users across ' + NUM_SHARDS + ' shards:');
const shards = { 0: [], 1: [], 2: [] };
users.forEach(user => {
  const shard = hashShard(user, NUM_SHARDS);
  shards[shard].push(user);
  console.log('  ' + user + ' → Shard ' + shard);
});
console.log('\\nShard distribution:', JSON.stringify(shards));

// ========== RANGE-BASED SHARDING ==========
console.log('\\n=== Range-Based Sharding ===');

function rangeShard(userId) {
  if (userId < 1000) return 'Shard-A (0-999)';
  if (userId < 2000) return 'Shard-B (1000-1999)';
  return 'Shard-C (2000+)';
}

[42, 500, 1500, 1999, 2500, 3000].forEach(id => {
  console.log('  User ' + id + ' → ' + rangeShard(id));
});

// ========== CONSISTENT HASHING ==========
console.log('\\n=== Consistent Hashing ===');

class ConsistentHash {
  constructor() {
    this.ring = new Map(); // position → node
    this.sortedKeys = [];
    this.virtualNodes = 3; // virtual nodes per real node
  }

  addNode(node) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = node + '-vn' + i;
      const pos = this._hash(key);
      this.ring.set(pos, node);
      this.sortedKeys.push(pos);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  removeNode(node) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = node + '-vn' + i;
      const pos = this._hash(key);
      this.ring.delete(pos);
      this.sortedKeys = this.sortedKeys.filter(k => k !== pos);
    }
  }

  getNode(key) {
    const hash = this._hash(key);
    for (const pos of this.sortedKeys) {
      if (hash <= pos) return this.ring.get(pos);
    }
    return this.ring.get(this.sortedKeys[0]); // wrap around
  }

  _hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) >>> 0;
    }
    return hash % 1000;
  }
}

const ch = new ConsistentHash();
ch.addNode('Node-A');
ch.addNode('Node-B');
ch.addNode('Node-C');

console.log('With 3 nodes:');
const testKeys = ['user:1', 'user:2', 'user:3', 'order:1', 'order:2'];
const before = {};
testKeys.forEach(key => {
  const node = ch.getNode(key);
  before[key] = node;
  console.log('  ' + key + ' → ' + node);
});

// Add a new node — see how few keys move
ch.addNode('Node-D');
console.log('\\nAfter adding Node-D:');
let moved = 0;
testKeys.forEach(key => {
  const node = ch.getNode(key);
  const didMove = before[key] !== node;
  if (didMove) moved++;
  console.log('  ' + key + ' → ' + node + (didMove ? ' (MOVED)' : ''));
});
console.log('\\nKeys moved: ' + moved + '/' + testKeys.length);
console.log('(With naive hash mod N, ALL keys would move!)');`,
    content: `
<h1>Database Sharding</h1>
<p>Sharding (horizontal partitioning) is the technique of distributing data across multiple database instances (shards) so that each shard holds a subset of the total data. It is the primary mechanism for scaling databases beyond the capacity of a single machine. Understanding sharding deeply — strategies, tradeoffs, and pitfalls — is critical for SDE3-level system design.</p>

<h2>Why Shard?</h2>
<pre><code>Single Database Limits:
┌─────────────────────────────────────────────────────┐
│ Disk: 2TB SSD → data won't fit                      │
│ CPU: 64 cores → can't handle 100K QPS              │
│ Memory: 512GB → working set exceeds RAM             │
│ Network: 10Gbps → bandwidth saturated               │
└─────────────────────────────────────────────────────┘

Sharding Solution:
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Shard 1  │  │ Shard 2  │  │ Shard 3  │  │ Shard 4  │
│ Users    │  │ Users    │  │ Users    │  │ Users    │
│ A-F      │  │ G-M      │  │ N-S      │  │ T-Z      │
│ 500GB    │  │ 500GB    │  │ 500GB    │  │ 500GB    │
│ 25K QPS  │  │ 25K QPS  │  │ 25K QPS  │  │ 25K QPS  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
Total: 2TB storage, 100K QPS</code></pre>

<h2>Sharding Strategies</h2>

<h3>1. Hash-Based Sharding</h3>
<p>Apply a hash function to the shard key, then mod by the number of shards: <code>shard = hash(key) % N</code></p>

<pre><code>hash("user_123") % 4 = 2  → Shard 2
hash("user_456") % 4 = 0  → Shard 0
hash("user_789") % 4 = 3  → Shard 3

Pros:
  ✓ Even distribution (good hash function → uniform)
  ✓ Simple to implement
  ✓ Any key type works

Cons:
  ✗ Adding/removing shards requires rehashing ALL data
    (hash(key) % 4 ≠ hash(key) % 5 for most keys)
  ✗ Range queries impossible (adjacent keys go to different shards)
  ✗ Hot keys still possible if one key gets disproportionate traffic</code></pre>

<h3>2. Range-Based Sharding</h3>
<p>Divide the key space into contiguous ranges, each assigned to a shard.</p>

<pre><code>Shard 0: user_id 0 - 999,999
Shard 1: user_id 1,000,000 - 1,999,999
Shard 2: user_id 2,000,000 - 2,999,999

Or by time:
Shard 0: Jan-Mar 2024
Shard 1: Apr-Jun 2024
Shard 2: Jul-Sep 2024

Pros:
  ✓ Range queries are efficient (scan one shard)
  ✓ Easy to understand and implement
  ✓ Adding shards = splitting a range (no global reshuffle)

Cons:
  ✗ Hot spots! New users (high IDs) all go to the last shard
  ✗ Uneven distribution if data isn't uniformly distributed
  ✗ Time-based ranges: most recent shard gets all writes</code></pre>

<h3>3. Directory-Based Sharding</h3>
<p>A lookup table (directory) maps each key (or key range) to a shard. The directory is a separate service or table.</p>

<pre><code>Directory Table:
┌─────────────┬─────────┐
│ Key/Range   │ Shard   │
├─────────────┼─────────┤
│ user_123    │ Shard-2 │
│ user_456    │ Shard-0 │
│ tenant_A    │ Shard-1 │
│ tenant_B    │ Shard-3 │
└─────────────┴─────────┘

Pros:
  ✓ Maximum flexibility — can move individual keys/ranges
  ✓ Easy rebalancing — just update the directory
  ✓ Supports arbitrary placement (geo-aware, tenant-based)

Cons:
  ✗ Directory is a single point of failure (must be replicated)
  ✗ Every request requires a directory lookup (extra latency)
  ✗ Directory itself can become a bottleneck (cache it!)</code></pre>

<h3>4. Consistent Hashing</h3>
<p>The most important sharding technique for distributed systems. Consistent hashing minimizes data movement when nodes are added or removed.</p>

<pre><code>Hash Ring (0 to 2^32 - 1):

           0
          /|\\
        /  |  \\
      /    |    \\
    N1     |     N3      ← Nodes placed on ring by hashing their ID
   /       |       \\
  |        |        |
  |        |        |
   \\       |       /
    N2     |     N4
      \\    |    /
        \\  |  /
          \\|/
         2^32

Rule: A key is stored on the FIRST node encountered
      when walking CLOCKWISE from the key's hash position.

Adding Node N5:
  Only keys between N4 and N5 (on the ring) need to move from their
  current owner to N5. All other keys stay put!
  ~1/N of keys move (instead of ALL keys with hash-mod-N)

Virtual Nodes:
  Problem: With few physical nodes, distribution can be uneven.
  Solution: Each physical node gets K virtual nodes on the ring.

  Physical Node A → Virtual: A-0, A-1, A-2, A-3, ...
  Physical Node B → Virtual: B-0, B-1, B-2, B-3, ...

  More points on ring → more uniform distribution
  Typical: 100-200 virtual nodes per physical node</code></pre>

<h2>Shard Key Selection</h2>
<p>Choosing the right shard key is the most critical sharding decision. A bad shard key leads to hot spots, unbalanced shards, and cross-shard queries.</p>

<table>
  <tr>
    <th>Criteria</th>
    <th>Good Shard Key</th>
    <th>Bad Shard Key</th>
  </tr>
  <tr>
    <td><strong>Cardinality</strong></td>
    <td>High (user_id — millions of distinct values)</td>
    <td>Low (country — only ~200 values)</td>
  </tr>
  <tr>
    <td><strong>Distribution</strong></td>
    <td>Uniform (hash of user_id)</td>
    <td>Skewed (celebrity user_id gets 10x traffic)</td>
  </tr>
  <tr>
    <td><strong>Query Pattern</strong></td>
    <td>Most queries include the shard key</td>
    <td>Queries often need data from multiple shards</td>
  </tr>
  <tr>
    <td><strong>Monotonicity</strong></td>
    <td>Random (UUID, hashed timestamp)</td>
    <td>Monotonic (auto-increment ID — all writes to one shard)</td>
  </tr>
  <tr>
    <td><strong>Growth</strong></td>
    <td>Grows with data (new users → new IDs)</td>
    <td>Bounded (status enum — can't split further)</td>
  </tr>
</table>

<h3>Shard Key Examples</h3>
<pre><code>E-Commerce System:

  Orders table:
    Good shard key: customer_id (queries are usually "show MY orders")
    Bad shard key: order_date (all today's orders on one shard)
    Bad shard key: status (only 5 values — very few shards possible)

  Products table:
    Good shard key: product_id (high cardinality, uniform lookups)
    Bad shard key: category (electronics = 50% of products → hot shard)

Multi-tenant SaaS:
    Good shard key: tenant_id (natural isolation, per-tenant queries)
    Challenge: One huge tenant → hot shard (solve with sub-sharding)</code></pre>

<h2>Cross-Shard Queries</h2>
<p>The biggest operational pain point of sharding. When a query needs data from multiple shards, it becomes a distributed query.</p>

<pre><code>Problem: "Find all orders over $100 across all customers"

Without sharding (single DB):
  SELECT * FROM orders WHERE amount > 100;  -- Simple!

With sharding by customer_id:
  Must query ALL shards, then merge results:

  App Server
      |
      ├── Shard 1: SELECT * FROM orders WHERE amount > 100
      ├── Shard 2: SELECT * FROM orders WHERE amount > 100
      ├── Shard 3: SELECT * FROM orders WHERE amount > 100
      └── Shard 4: SELECT * FROM orders WHERE amount > 100
      |
      └── Merge & sort results in application layer

Issues:
  - Latency = slowest shard (tail latency)
  - Memory: must hold partial results from all shards
  - Pagination is complex (can't use simple OFFSET/LIMIT)
  - JOINs across shards are extremely expensive
  - Aggregations (SUM, COUNT, AVG) need scatter-gather</code></pre>

<h3>Mitigation Strategies</h3>
<ul>
  <li><strong>Denormalize:</strong> Duplicate data so that most queries can be served by a single shard</li>
  <li><strong>Secondary index:</strong> Maintain a global secondary index (e.g., in Elasticsearch) for cross-shard queries</li>
  <li><strong>CQRS:</strong> Separate read models (optimized for queries) from write models (sharded for writes)</li>
  <li><strong>Materialized views:</strong> Pre-compute cross-shard aggregations</li>
</ul>

<h2>Rebalancing Strategies</h2>
<p>Over time, shards become unbalanced (data growth, traffic changes). Rebalancing redistributes data.</p>

<table>
  <tr>
    <th>Strategy</th>
    <th>How It Works</th>
    <th>Pros/Cons</th>
  </tr>
  <tr>
    <td><strong>Fixed partition count</strong></td>
    <td>Create many more partitions than nodes (e.g., 1000 partitions for 10 nodes). Move whole partitions between nodes</td>
    <td>Simple to implement. Used by Elasticsearch, Riak, Cassandra</td>
  </tr>
  <tr>
    <td><strong>Dynamic splitting</strong></td>
    <td>When a shard exceeds a size threshold, split it into two. Like B-tree splits</td>
    <td>Adapts to data growth. Used by HBase, MongoDB. Can cause temporary write pauses</td>
  </tr>
  <tr>
    <td><strong>Proportional to nodes</strong></td>
    <td>Fixed number of partitions per node. Adding a node steals random partitions from existing nodes</td>
    <td>Used by Cassandra. Consistent hashing with virtual nodes handles this naturally</td>
  </tr>
</table>

<h2>Hot Spots and Mitigation</h2>
<pre><code>Problem: Celebrity user (1M followers) → their shard gets 100x traffic

Solutions:

1. Shard key salting:
   Instead of shard_key = user_id
   Use shard_key = user_id + "_" + random(0..9)
   Spreads one user's data across 10 shards
   Reads must query all 10 and merge

2. Dedicated shard:
   Identify hot users → give them their own shard
   More operational overhead but clean isolation

3. Caching layer:
   Put Redis/Memcached in front
   Cache hot user's data → most reads never hit the shard

4. Read replicas:
   Add replicas for the hot shard specifically
   Writes go to primary; reads spread across replicas</code></pre>

<div class="warning-note"><strong>Sharding is a last resort.</strong> Before sharding, try: (1) vertical scaling (bigger machine), (2) read replicas, (3) caching layer, (4) query optimization and indexing, (5) archiving old data. Sharding introduces massive operational complexity — cross-shard queries, distributed transactions, rebalancing, schema changes across shards, and operational monitoring. Only shard when you've genuinely exhausted simpler options.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you shard a social media application's database?</div>
  <div class="qa-a">The primary shard key should be <strong>user_id</strong> because most queries are user-centric ("show my feed," "show my posts," "show my followers"). This ensures that a user's own data is co-located on one shard. For the follower graph (who follows whom), I'd shard by the follower's user_id so that "show me who I follow" is single-shard. The inverse query ("who follows user X") requires a secondary index — either a separate table sharded by followed_user_id or an async-maintained search index. For the news feed, I'd use a fanout-on-write approach: when a user posts, write to each follower's feed (already on the follower's shard). For celebrities, fanout-on-read avoids writing to millions of followers' shards.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain consistent hashing and why virtual nodes are necessary.</div>
  <div class="qa-a">Consistent hashing maps both nodes and keys to positions on a circular hash space (0 to 2^32). A key is assigned to the first node clockwise from its position. When a node is added, only keys between the new node and its predecessor move — roughly 1/N of keys, vs. ALL keys with simple hash-mod-N. <strong>Virtual nodes</strong> solve the non-uniformity problem: with only a few physical nodes, the hash function may place them unevenly on the ring, causing some nodes to own much larger arc segments (more keys). By creating 100-200 virtual nodes per physical node, each mapped to random ring positions, the arc segments become roughly equal. An added benefit: when a physical node fails, its load is distributed across many other nodes (not just one neighbor), preventing cascade overload.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the challenges of doing JOINs in a sharded database?</div>
  <div class="qa-a">JOINs across shards require moving data over the network, which is fundamentally expensive. Challenges: (1) <strong>Scatter-gather:</strong> The query coordinator must send the query to all relevant shards, collect partial results, and merge them — latency is the max of all shards. (2) <strong>Data volume:</strong> Intermediate JOIN results may be enormous and must be shuffled between shards. (3) <strong>No local index:</strong> If the JOIN column isn't the shard key, the database can't use local indexes efficiently. (4) <strong>Consistency:</strong> Data on different shards may be at slightly different points in time. Mitigation: co-locate related data on the same shard (shard orders by customer_id if you often JOIN orders with customers), denormalize to avoid JOINs, or use a CQRS pattern with a separate read model.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does MongoDB handle sharding?</div>
  <div class="qa-a">MongoDB uses a <strong>range-based</strong> or <strong>hash-based</strong> sharding strategy (configurable per collection). The architecture consists of: (1) <strong>Shard servers:</strong> Each shard is a replica set holding a subset of data. (2) <strong>Config servers:</strong> Store the shard key ranges → shard mapping (metadata). Run as a replica set for high availability. (3) <strong>mongos routers:</strong> Stateless query routers that sit between the application and shards. They consult config servers to route queries to the correct shard(s). For queries that include the shard key, mongos routes to a single shard (targeted query). For queries without the shard key, mongos broadcasts to all shards (scatter-gather). MongoDB handles auto-splitting (when a chunk exceeds 128MB) and auto-balancing (background process moves chunks between shards).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle distributed transactions across shards?</div>
  <div class="qa-a">There are several approaches in order of preference: (1) <strong>Design to avoid them:</strong> Choose your shard key so that transactions are single-shard (e.g., shard by account_id so transfers within an account are local). (2) <strong>Two-phase commit (2PC):</strong> The coordinator asks all shards to prepare, then commits or aborts. MongoDB 4.2+ supports multi-shard transactions using 2PC internally. The cost is higher latency and reduced throughput. (3) <strong>Saga pattern:</strong> Break the transaction into a sequence of local transactions with compensating actions. More available but weaker isolation. (4) <strong>Avoid sharding the table that needs transactions:</strong> Keep the transaction-heavy table on a single (larger) server while sharding less critical tables. In practice, most systems use a combination: careful shard key design to minimize cross-shard transactions, and Sagas for the cases that can't be avoided.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What's the difference between partitioning and sharding?</div>
  <div class="qa-a"><strong>Partitioning</strong> is the general concept of dividing data into subsets. It can be <strong>vertical</strong> (splitting columns — e.g., frequently accessed columns in one table, blobs in another) or <strong>horizontal</strong> (splitting rows). <strong>Sharding</strong> is specifically horizontal partitioning across multiple database instances/servers. In PostgreSQL, you can do table partitioning (horizontal, within a single server) for performance — e.g., partition orders by month, so queries for recent orders only scan the latest partition. Sharding goes further by placing partitions on separate physical servers, adding the complexity of distributed queries, network latency, and consistency challenges. Partition = logical division; shard = physical distribution.</div>
</div>
`
  },
  {
    id: 'db-replication',
    title: 'Database Replication',
    category: 'Databases',
    starterCode: `// Database Replication Strategies — JavaScript Simulation

// ========== SINGLE-LEADER REPLICATION ==========
console.log('=== Single-Leader (Master-Slave) Replication ===\\n');

class ReplicaNode {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.data = {};
    this.log = [];
    this.replicationLag = 0;
  }

  write(key, value) {
    if (this.role !== 'leader') {
      console.log('[' + this.name + '] REJECTED write — I am a follower!');
      return null;
    }
    this.data[key] = value;
    const entry = { key, value, timestamp: Date.now() };
    this.log.push(entry);
    console.log('[' + this.name + '] WRITE: ' + key + ' = ' + value);
    return entry;
  }

  applyLog(entry, lag) {
    this.data[entry.key] = entry.value;
    this.log.push(entry);
    this.replicationLag = lag;
    console.log('[' + this.name + '] REPLICATED: ' + entry.key + ' = ' + entry.value + ' (lag: ' + lag + 'ms)');
  }

  read(key) {
    const val = this.data[key] || 'NOT FOUND';
    console.log('[' + this.name + '] READ: ' + key + ' = ' + val);
    return val;
  }
}

const leader = new ReplicaNode('Primary', 'leader');
const follower1 = new ReplicaNode('Replica-1', 'follower');
const follower2 = new ReplicaNode('Replica-2', 'follower');

// Write goes to leader
const entry = leader.write('user:1', 'Alice');

// Sync replication to follower1 (waits for ack)
follower1.applyLog(entry, 5);

// Async replication to follower2 (eventual)
setTimeout(() => {
  follower2.applyLog(entry, 50);
}, 50);

// Read from follower (might be stale)
console.log('');
leader.read('user:1');
follower1.read('user:1');    // Has the data (sync replica)
follower2.read('user:1');    // Might NOT have it yet (async)

// ========== QUORUM READS/WRITES ==========
console.log('\\n\\n=== Quorum-Based Replication (Leaderless) ===\\n');

class QuorumNode {
  constructor(name) {
    this.name = name;
    this.data = {};
  }
  write(key, value, version) {
    this.data[key] = { value, version };
    return true;
  }
  read(key) {
    return this.data[key] || null;
  }
}

const nodes = [new QuorumNode('N1'), new QuorumNode('N2'), new QuorumNode('N3')];
const N = 3, W = 2, R = 2; // Quorum config

console.log('Config: N=' + N + ', W=' + W + ', R=' + R);
console.log('Strong consistency: R + W > N → ' + R + ' + ' + W + ' = ' + (R+W) + ' > ' + N + ' → ' + (R+W > N));

// Write with quorum
console.log('\\nWriting user:1 = Bob (W=' + W + ')');
let writeAcks = 0;
nodes.forEach((node, i) => {
  if (i < W) { // Write to W nodes
    node.write('user:1', 'Bob', 2);
    writeAcks++;
    console.log('  [' + node.name + '] ACK write');
  }
});
console.log('  Write success: ' + writeAcks + '/' + W + ' acks received');

// One node still has stale data
nodes[2].write('user:1', 'Alice', 1); // Old version

// Read with quorum
console.log('\\nReading user:1 (R=' + R + ')');
const responses = [];
nodes.forEach((node, i) => {
  if (i < R) {
    const resp = node.read('user:1');
    responses.push(resp);
    console.log('  [' + node.name + '] returns: ' + JSON.stringify(resp));
  }
});

// Pick highest version
const latest = responses.reduce((a, b) => (a && b && a.version > b.version) ? a : b);
console.log('\\nQuorum result (highest version): ' + JSON.stringify(latest));

// ========== CONFLICT RESOLUTION ==========
console.log('\\n\\n=== Conflict Resolution: Last-Writer-Wins ===\\n');

const writes = [
  { node: 'US-East', value: 'Alice Smith', timestamp: 1000 },
  { node: 'EU-West', value: 'Alice Johnson', timestamp: 1002 },
  { node: 'AP-South', value: 'Alice Williams', timestamp: 999 },
];

console.log('Concurrent writes during partition:');
writes.forEach(w => console.log('  [' + w.node + '] wrote "' + w.value + '" at t=' + w.timestamp));

const winner = writes.reduce((a, b) => a.timestamp > b.timestamp ? a : b);
console.log('\\nLWW winner: "' + winner.value + '" from ' + winner.node + ' (latest timestamp)');
console.log('WARNING: Other writes are silently LOST!');`,
    content: `
<h1>Database Replication</h1>
<p>Replication is the process of maintaining copies of the same data on multiple machines. It serves three purposes: <strong>high availability</strong> (system continues if a node fails), <strong>low latency</strong> (serve reads from a geographically close replica), and <strong>read scalability</strong> (distribute read load across replicas). Understanding replication topologies, consistency guarantees, and conflict resolution is essential for SDE3-level system design.</p>

<h2>Replication Topologies Overview</h2>
<pre><code>1. Single-Leader (Master-Slave)
   ┌──────────┐
   │  Leader   │ ← All writes
   └────┬─────┘
        │ replication stream
   ┌────┼────────────┐
   ▼    ▼            ▼
┌──────┐ ┌──────┐ ┌──────┐
│ F1   │ │ F2   │ │ F3   │  ← Reads distributed
└──────┘ └──────┘ └──────┘

2. Multi-Leader
   ┌──────────┐      ┌──────────┐
   │ Leader 1 │ ←──→ │ Leader 2 │  ← Writes to either
   └────┬─────┘      └────┬─────┘
        │                  │
   ┌────┼──┐          ┌───┼───┐
   ▼    ▼  ▼          ▼   ▼   ▼
  F1   F2  F3        F4  F5  F6

3. Leaderless
   ┌──────┐  ┌──────┐  ┌──────┐
   │  N1  │  │  N2  │  │  N3  │  ← Write to W nodes
   └──────┘  └──────┘  └──────┘    Read from R nodes
   (all peers, no leader)</code></pre>

<h2>1. Single-Leader Replication</h2>
<p>One node (the leader/primary/master) accepts all writes. It sends a <strong>replication stream</strong> (WAL or logical changes) to followers (replicas/secondaries/slaves). Followers apply changes in the same order.</p>

<h3>How It Works</h3>
<pre><code>Write Path:
  1. Client sends write to leader
  2. Leader writes to its WAL (Write-Ahead Log)
  3. Leader applies change to its data
  4. Leader sends WAL entry to followers
  5. Followers apply the WAL entry
  6. (Sync) Leader waits for follower ack → then responds to client
     (Async) Leader responds to client immediately

Read Path:
  - Read from leader: always up-to-date
  - Read from follower: may be stale (replication lag)</code></pre>

<h3>Synchronous vs Asynchronous Replication</h3>
<table>
  <tr>
    <th>Aspect</th>
    <th>Synchronous</th>
    <th>Asynchronous</th>
    <th>Semi-Synchronous</th>
  </tr>
  <tr>
    <td><strong>How</strong></td>
    <td>Leader waits for ALL followers to ACK</td>
    <td>Leader responds immediately; followers catch up</td>
    <td>Leader waits for ONE follower to ACK</td>
  </tr>
  <tr>
    <td><strong>Durability</strong></td>
    <td>Strongest — data on N nodes before client confirmed</td>
    <td>Weakest — data may be on leader only</td>
    <td>Moderate — data on at least 2 nodes</td>
  </tr>
  <tr>
    <td><strong>Latency</strong></td>
    <td>Highest — wait for slowest follower</td>
    <td>Lowest — no waiting</td>
    <td>Moderate — wait for fastest follower</td>
  </tr>
  <tr>
    <td><strong>Availability</strong></td>
    <td>Any follower failure blocks writes</td>
    <td>Followers can fail without affecting writes</td>
    <td>Can tolerate some follower failures</td>
  </tr>
  <tr>
    <td><strong>Data loss risk</strong></td>
    <td>None (if leader fails, followers have all data)</td>
    <td>Possible (unreplicated writes lost if leader fails)</td>
    <td>Minimal (at most, last few transactions)</td>
  </tr>
  <tr>
    <td><strong>Used by</strong></td>
    <td>PostgreSQL (sync mode), MySQL Group Replication</td>
    <td>PostgreSQL (default), MySQL (default), MongoDB</td>
    <td>MySQL semi-sync, PostgreSQL with sync standby</td>
  </tr>
</table>

<h3>Failover Process</h3>
<pre><code>Leader Failure Detected (heartbeat timeout)
       │
       ▼
Follower with most recent data elected as new leader
       │
       ▼
Other followers reconfigured to replicate from new leader
       │
       ▼
Application/proxy updated to point to new leader

Challenges:
  1. Split-brain: Old leader comes back, thinks it's still leader
     → Two leaders accepting writes → data divergence!
     Solution: Fencing (STONITH — Shoot The Other Node In The Head)

  2. Data loss: If async, new leader may be behind old leader
     → Writes acknowledged to client but not replicated are lost
     → Old leader's unreplicated writes must be discarded on rejoin

  3. Detection delay: Too fast → false positives (flapping)
                      Too slow → longer downtime</code></pre>

<h2>2. Multi-Leader Replication</h2>
<p>Multiple nodes accept writes. Each leader replicates its changes to all other leaders. This is common in <strong>multi-datacenter</strong> deployments where each datacenter has a leader.</p>

<h3>Use Cases</h3>
<ul>
  <li><strong>Multi-datacenter:</strong> A leader in each datacenter reduces write latency for local clients</li>
  <li><strong>Offline-capable apps:</strong> Each device is a "leader" that writes locally and syncs when online (e.g., CouchDB, Google Docs)</li>
  <li><strong>Collaborative editing:</strong> Multiple users editing simultaneously (each user's local state is a "leader")</li>
</ul>

<h3>The Core Challenge: Write Conflicts</h3>
<pre><code>User A (US-East Leader)      User B (EU-West Leader)
   |                              |
   |  UPDATE title = "A's edit"   |  UPDATE title = "B's edit"
   |  at T=100                    |  at T=101
   |                              |
   └──────── replicate ──────────→│
   │←──────── replicate ──────────┘
   |                              |
   |  CONFLICT: which title wins? |

Both writes were accepted (no single leader to serialize).
After replication, both leaders have conflicting values.</code></pre>

<h2>3. Leaderless Replication</h2>
<p>No single node is designated as leader. Clients write to <strong>W</strong> nodes and read from <strong>R</strong> nodes. Popularized by Amazon's Dynamo paper, used by Cassandra, Riak, and DynamoDB.</p>

<h3>Quorum Protocol</h3>
<pre><code>Parameters:
  N = number of replicas (e.g., 3)
  W = write quorum (minimum nodes that must ACK a write)
  R = read quorum (minimum nodes to query for a read)

Strong consistency guarantee: W + R > N

Example (N=3):
  W=2, R=2: Strong (2+2=4 > 3) — at least 1 node has latest write in any read
  W=1, R=1: Eventual (1+1=2 < 3) — fastest, but may read stale data
  W=3, R=1: Strong (3+1=4 > 3) — slow writes, fast reads, no data loss

  Read from R=2 nodes:
  ┌──────┐  Response: value=X, version=5
  │  N1  │──────────────────────────────→ ┌───────────┐
  └──────┘                                │  Client   │
  ┌──────┐  Response: value=Y, version=7  │ picks     │
  │  N2  │──────────────────────────────→ │ version=7 │
  └──────┘                                └───────────┘
  ┌──────┐  (not queried — R=2 is enough)
  │  N3  │
  └──────┘</code></pre>

<h3>Read Repair and Anti-Entropy</h3>
<pre><code>Read Repair:
  When a client reads from R nodes and detects a stale node:
  Client reads from N1 (v7) and N2 (v5)
  Client writes v7 back to N2 → N2 is now up-to-date
  (Repairs happen lazily, on read)

Anti-Entropy (Background Process):
  Periodically, nodes compare their data using Merkle trees
  Identify differences and sync missing/outdated data
  Ensures eventually all replicas converge, even without reads</code></pre>

<h2>Replication Lag and Its Effects</h2>
<p>In asynchronous replication, followers lag behind the leader. This creates several observable anomalies:</p>

<h3>Anomaly 1: Read-Your-Own-Writes</h3>
<pre><code>Timeline:
  T=0: User writes "new profile photo" → Leader
  T=1: User refreshes page → Routed to stale Follower
  T=1: Follower hasn't received the write yet!
  T=1: User sees OLD profile photo → Confused!

Solution: Read-after-write consistency
  - Always read user's own data from the leader
  - Or: track the latest write timestamp per user;
    read from a follower only if it's caught up to that timestamp</code></pre>

<h3>Anomaly 2: Monotonic Reads</h3>
<pre><code>Timeline:
  T=0: User reads from Follower-A → sees new data (v2)
  T=1: User reads from Follower-B → sees OLD data (v1)
  T=1: It looks like data went BACKWARD in time!

Solution: Monotonic reads
  - Always route the same user to the same follower (sticky sessions)
  - Or: include a "minimum version" in read requests</code></pre>

<h3>Anomaly 3: Consistent Prefix Reads</h3>
<pre><code>Chat between Alice and Bob:
  Alice: "How's the weather?"  (written at T=1)
  Bob: "It's sunny!"          (written at T=2)

If a third party reads from a lagging replica that has Bob's
reply but not Alice's question:
  Bob: "It's sunny!"          ← Makes no sense without context!
  Alice: "How's the weather?" ← Arrives later

Solution: Consistent prefix reads
  - Ensure causally related writes go to the same partition
  - Or: use logical timestamps to order events</code></pre>

<h2>Conflict Resolution Strategies</h2>
<table>
  <tr>
    <th>Strategy</th>
    <th>How It Works</th>
    <th>Pros</th>
    <th>Cons</th>
    <th>Used By</th>
  </tr>
  <tr>
    <td><strong>Last-Writer-Wins (LWW)</strong></td>
    <td>Highest timestamp wins; other writes discarded</td>
    <td>Simple, deterministic</td>
    <td>Data loss (concurrent writes lost). Clock skew causes wrong winner</td>
    <td>Cassandra, DynamoDB</td>
  </tr>
  <tr>
    <td><strong>Vector Clocks</strong></td>
    <td>Track causal dependencies. Detect concurrent writes vs sequential</td>
    <td>No data loss; detects true conflicts</td>
    <td>Complex. Client must resolve conflicts</td>
    <td>Riak (deprecated in favor of CRDTs)</td>
  </tr>
  <tr>
    <td><strong>CRDTs</strong></td>
    <td>Data structures designed for automatic merge (G-Counter, OR-Set, LWW-Register)</td>
    <td>Automatic, guaranteed convergence, no data loss</td>
    <td>Limited to supported types. Space overhead</td>
    <td>Riak, Redis Enterprise, Automerge</td>
  </tr>
  <tr>
    <td><strong>Application-level</strong></td>
    <td>Store all conflicting versions; app chooses</td>
    <td>Full control, domain-specific logic</td>
    <td>Complex application code, UI for conflict resolution</td>
    <td>CouchDB, custom implementations</td>
  </tr>
  <tr>
    <td><strong>Merge functions</strong></td>
    <td>Custom merge logic — e.g., union of sets, max of values</td>
    <td>Domain-appropriate resolution</td>
    <td>Must be carefully designed, commutative + associative</td>
    <td>Custom implementations</td>
  </tr>
</table>

<h3>CRDTs Explained</h3>
<pre><code>CRDT = Conflict-free Replicated Data Type

Key property: Any two replicas can be merged and ALWAYS converge
              to the same result, regardless of order of operations.

G-Counter (Grow-only Counter):
  Each node maintains its own counter.
  Total = sum of all node counters.

  Node A: [A:3, B:0, C:0]  total=3
  Node B: [A:0, B:5, C:0]  total=5
  Node C: [A:0, B:0, C:2]  total=2

  Merge: [A:max(3,0,0), B:max(0,5,0), C:max(0,0,2)]
       = [A:3, B:5, C:2]  total=10

OR-Set (Observed-Remove Set):
  Add and remove operations tracked with unique tags.
  Add: insert (element, unique_tag)
  Remove: remove all tags for element
  Merge: union of all (element, tag) pairs, minus removed tags
  Result: If any replica added the element after all removes, it's in the set</code></pre>

<div class="warning-note"><strong>Replication ≠ Backup.</strong> Replication protects against node failures (high availability). But if you accidentally DELETE all data, that deletion replicates to all replicas instantly. You need separate backups (point-in-time snapshots) to protect against logical errors, accidental deletions, and corruption.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: In a single-leader setup, how do you handle the case where the leader fails?</div>
  <div class="qa-a">The process is called <strong>failover</strong> and can be automatic or manual. Automatic failover: (1) Detection — followers monitor the leader's heartbeat. If no heartbeat for a configured timeout (e.g., 30 seconds), the leader is declared dead. (2) Election — followers elect a new leader, typically the one with the most up-to-date replication log. Tools like Patroni (PostgreSQL) or MongoDB's replica set election protocol handle this. (3) Reconfiguration — other followers start replicating from the new leader, and the application/proxy is updated. Key challenges: split-brain (two leaders), data loss (async unreplicated writes), and false failover detection (leader was just slow, not dead). Use fencing tokens and consensus protocols to mitigate split-brain.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use multi-leader replication?</div>
  <div class="qa-a">Multi-leader is primarily useful in three scenarios: (1) <strong>Multi-datacenter:</strong> Each datacenter has a local leader for low write latency. The alternative — single leader in one datacenter — means all writes from other datacenters cross the WAN. (2) <strong>Offline-first applications:</strong> Each device (phone, laptop) acts as a local "leader" and syncs when reconnected. CouchDB/PouchDB are designed for this. (3) <strong>Collaborative editing:</strong> Google Docs uses a form of multi-leader where each user's local state is authoritative. The massive downside is write conflicts — if two leaders modify the same data, you need conflict resolution (LWW, CRDTs, or application-level merging). I'd avoid multi-leader unless the use case specifically demands it.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the quorum formula W + R > N and its implications.</div>
  <div class="qa-a">With N replicas, if you write to W nodes and read from R nodes, then W + R > N guarantees that at least one node in the read set has the latest write (by the pigeonhole principle). Example: N=3, W=2, R=2. Writes go to 2 of 3 nodes; reads query 2 of 3 nodes. At least one node must be in both sets. The client picks the response with the highest version. You can tune this: W=1, R=3 means fast writes but reads must query all nodes. W=3, R=1 means slow writes (wait for all) but reads are fast (any single node has the latest). W=1, R=1 means fast everything but no consistency guarantee — the read and write might hit non-overlapping nodes. The tradeoff is always latency vs. consistency.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is read-after-write consistency, and how do you implement it?</div>
  <div class="qa-a">Read-after-write consistency guarantees that if a user writes data and then reads it back, they will always see their own write (not stale data from a lagging replica). Implementation strategies: (1) <strong>Read from leader for own data:</strong> E.g., always read the user's own profile from the leader, but other users' profiles can come from followers. (2) <strong>Track write timestamp:</strong> After writing, the client stores the write's timestamp. On reads, the client sends this timestamp; the system ensures the replica is caught up to at least that timestamp before serving the read. (3) <strong>Logical timestamps:</strong> Return a monotonic token with each write. Subsequent reads include this token, and the system routes to a replica that has processed at least up to that token. In PostgreSQL, you can use <code>pg_last_wal_replay_lsn()</code> on replicas to check their replication position.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do CRDTs solve the conflict resolution problem?</div>
  <div class="qa-a">CRDTs are data structures where concurrent updates always merge deterministically, regardless of the order in which updates are applied or merged. They satisfy three mathematical properties: commutativity (merge(A,B) = merge(B,A)), associativity (merge(merge(A,B),C) = merge(A,merge(B,C))), and idempotency (merge(A,A) = A). Examples: (1) G-Counter — each node increments only its own counter; total is the sum. No conflicts possible. (2) PN-Counter — two G-Counters (one for increments, one for decrements). (3) OR-Set — add/remove operations tagged with unique IDs; merge is deterministic. CRDTs are ideal for collaborative editing, distributed counters, and shared state across replicas. The tradeoff: they only work for specific data structures and operations, and they can have memory overhead (storing metadata for conflict detection).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between physical and logical replication?</div>
  <div class="qa-a"><strong>Physical replication</strong> (also called byte-level or WAL shipping): The leader sends its raw WAL (Write-Ahead Log) bytes to followers. Followers replay the exact same disk-level changes. This is fast and simple but tightly couples replicas to the same database version and architecture. PostgreSQL streaming replication uses this. <strong>Logical replication</strong>: The leader sends higher-level change descriptions — "INSERT row (1, 'Alice', 'alice@ex.com') into users table." This is decoupled from the physical storage format, allowing: different database versions (for zero-downtime upgrades), different schemas (for data transformation), selective replication (only certain tables), and even cross-platform replication (PostgreSQL to MySQL). PostgreSQL logical replication, MySQL binlog (row-based), and MongoDB's oplog are examples. The tradeoff: logical replication has higher overhead for high-throughput writes because it must decode and re-encode changes.</div>
</div>
`
  },
  {
    id: 'db-indexing',
    title: 'Database Indexing Theory',
    category: 'Databases',
    starterCode: `// Database Indexing — Data Structure Simulations

// ========== B-TREE SIMULATION ==========
console.log('=== B-Tree Index (Simplified) ===\\n');

class BTreeNode {
  constructor(order) {
    this.keys = [];
    this.children = [];
    this.isLeaf = true;
    this.order = order; // max keys per node
  }
}

// Simplified B-Tree (insert only, no splitting for brevity)
class SimpleBTree {
  constructor(order) {
    this.root = new BTreeNode(order);
    this.comparisons = 0;
  }

  insert(key, value) {
    // Simplified: just insert into root's keys (real B-Tree splits)
    this.root.keys.push({ key, value });
    this.root.keys.sort((a, b) => a.key - b.key);
  }

  search(key) {
    this.comparisons = 0;
    // Binary search within the node
    let low = 0, high = this.root.keys.length - 1;
    while (low <= high) {
      this.comparisons++;
      const mid = Math.floor((low + high) / 2);
      if (this.root.keys[mid].key === key) return { found: this.root.keys[mid], comparisons: this.comparisons };
      if (this.root.keys[mid].key < key) low = mid + 1;
      else high = mid - 1;
    }
    return { found: null, comparisons: this.comparisons };
  }
}

const btree = new SimpleBTree(4);
[10, 20, 30, 40, 50, 25, 35, 15, 5, 45].forEach(k => btree.insert(k, 'row_' + k));

console.log('Inserted keys: [10, 20, 30, 40, 50, 25, 35, 15, 5, 45]');
const result = btree.search(35);
console.log('Search for 35: ' + JSON.stringify(result));
console.log('B-Tree: O(log n) lookups, ~' + Math.ceil(Math.log2(10)) + ' comparisons for 10 keys\\n');

// ========== HASH INDEX SIMULATION ==========
console.log('=== Hash Index ===\\n');

class HashIndex {
  constructor(buckets) {
    this.buckets = new Array(buckets).fill(null).map(() => []);
    this.numBuckets = buckets;
  }

  _hash(key) {
    if (typeof key === 'number') return key % this.numBuckets;
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % this.numBuckets;
    return h;
  }

  put(key, value) {
    const bucket = this._hash(key);
    this.buckets[bucket].push({ key, value });
    console.log('  PUT ' + key + ' → bucket ' + bucket);
  }

  get(key) {
    const bucket = this._hash(key);
    const entry = this.buckets[bucket].find(e => e.key === key);
    return entry ? entry.value : null;
  }
}

const hashIdx = new HashIndex(4);
hashIdx.put('alice', { id: 1, email: 'alice@ex.com' });
hashIdx.put('bob', { id: 2, email: 'bob@ex.com' });
hashIdx.put('charlie', { id: 3, email: 'charlie@ex.com' });

console.log('\\nGET alice:', JSON.stringify(hashIdx.get('alice')));
console.log('Hash Index: O(1) exact lookups, NO range queries\\n');

// ========== BLOOM FILTER ==========
console.log('=== Bloom Filter ===\\n');

class BloomFilter {
  constructor(size) {
    this.bits = new Array(size).fill(0);
    this.size = size;
  }

  _hashes(key) {
    let h1 = 0, h2 = 0;
    for (let i = 0; i < key.length; i++) {
      h1 = (h1 * 31 + key.charCodeAt(i)) % this.size;
      h2 = (h2 * 37 + key.charCodeAt(i)) % this.size;
    }
    return [h1, h2];
  }

  add(key) {
    const [h1, h2] = this._hashes(key);
    this.bits[h1] = 1;
    this.bits[h2] = 1;
  }

  mightContain(key) {
    const [h1, h2] = this._hashes(key);
    return this.bits[h1] === 1 && this.bits[h2] === 1;
  }
}

const bloom = new BloomFilter(20);
['apple', 'banana', 'cherry'].forEach(item => bloom.add(item));

console.log('Added: apple, banana, cherry');
console.log('mightContain("apple"):', bloom.mightContain('apple'), '(true positive)');
console.log('mightContain("banana"):', bloom.mightContain('banana'), '(true positive)');
console.log('mightContain("grape"):', bloom.mightContain('grape'), '(may be false positive!)');
console.log('mightContain("melon"):', bloom.mightContain('melon'), '(may be false positive!)');
console.log('\\nBloom Filter: NEVER false negatives, POSSIBLE false positives');
console.log('Used by: Cassandra, LevelDB, RocksDB to skip unnecessary disk reads');

// ========== LSM TREE CONCEPT ==========
console.log('\\n=== LSM Tree (Log-Structured Merge Tree) ===\\n');

console.log('Write path:');
console.log('  1. Write to in-memory Memtable (sorted, e.g., Red-Black tree)');
console.log('  2. When Memtable full → flush to disk as SSTable (sorted, immutable)');
console.log('  3. Background: merge (compact) SSTables to reduce count');
console.log('');
console.log('Read path:');
console.log('  1. Check Memtable (most recent data)');
console.log('  2. Check Bloom filters for each SSTable');
console.log('  3. Search SSTables from newest to oldest');
console.log('  4. Return first match found');
console.log('');
console.log('Why fast writes? Sequential writes only (append-only)!');
console.log('Why slow reads? May need to check multiple SSTables');`,
    content: `
<h1>Database Indexing Theory</h1>
<p>Indexes are the backbone of database performance. They transform O(n) full table scans into O(log n) or O(1) lookups, often making the difference between a 10ms query and a 10-second query. Understanding the data structures behind indexes — their tradeoffs, strengths, and limitations — is essential for SDE3-level engineering.</p>

<h2>Why Indexes Matter</h2>
<pre><code>Without index (full table scan):
  SELECT * FROM users WHERE email = 'alice@ex.com'
  → Scan ALL 10 million rows: O(n) = ~10,000ms

With B-Tree index on email:
  → Tree traversal: O(log n) = log₂(10,000,000) ≈ 23 comparisons = ~1ms

With Hash index on email:
  → Direct lookup: O(1) = ~0.1ms

The cost: indexes use extra disk space and slow down writes
(every INSERT/UPDATE must also update the index)</code></pre>

<h2>1. B-Tree and B+Tree</h2>
<p>The <strong>B+Tree</strong> is the default index structure for virtually all relational databases (PostgreSQL, MySQL InnoDB, Oracle, SQL Server). It is optimized for disk-based storage where reading a block of data (page) is much cheaper than reading individual bytes.</p>

<h3>B-Tree vs B+Tree</h3>
<table>
  <tr>
    <th>Property</th>
    <th>B-Tree</th>
    <th>B+Tree</th>
  </tr>
  <tr>
    <td>Data location</td>
    <td>In ALL nodes (internal + leaf)</td>
    <td>Only in LEAF nodes</td>
  </tr>
  <tr>
    <td>Leaf linking</td>
    <td>Not linked</td>
    <td>Leaves form a linked list</td>
  </tr>
  <tr>
    <td>Range queries</td>
    <td>Requires tree traversal</td>
    <td>Follow leaf pointers (very efficient)</td>
  </tr>
  <tr>
    <td>Internal node capacity</td>
    <td>Fewer keys (data takes space)</td>
    <td>More keys (only keys + child pointers)</td>
  </tr>
  <tr>
    <td>Tree height</td>
    <td>Taller</td>
    <td>Shorter (more fanout)</td>
  </tr>
  <tr>
    <td>Used by</td>
    <td>MongoDB (WiredTiger)</td>
    <td>PostgreSQL, MySQL InnoDB, Oracle</td>
  </tr>
</table>

<h3>B+Tree Structure</h3>
<pre><code>B+Tree (order 4 — max 3 keys per node):

                    [30 | 60]                    ← Root (internal)
                   /    |    \\
          [10|20]    [40|50]    [70|80|90]        ← Internal nodes
          / | \\     / | \\      / | \\ \\
        [5] [15] [25] [35] [45] [55] [65] [75] [85] [95]  ← Leaf nodes
         ↔   ↔    ↔    ↔    ↔    ↔    ↔    ↔    ↔    ↔    (doubly linked)

        Leaf nodes contain: [key | pointer to actual row on disk]
        Leaf linked list enables efficient range scans:
          SELECT * WHERE id BETWEEN 25 AND 55
          → Find leaf for 25, then follow pointers to 55

Properties:
  - All leaves at same depth (balanced)
  - Each node = one disk page (typically 4KB-16KB)
  - Fanout: ~500 keys per node for 8-byte keys on 8KB pages
  - Height 3 B+Tree with fanout 500: 500³ = 125 million keys!
  - That's 3 disk reads for any lookup among 125M rows</code></pre>

<h3>B+Tree Operations Complexity</h3>
<table>
  <tr>
    <th>Operation</th>
    <th>Complexity</th>
    <th>Disk I/Os</th>
  </tr>
  <tr>
    <td>Point lookup</td>
    <td>O(log n)</td>
    <td>2-4 (tree height)</td>
  </tr>
  <tr>
    <td>Range scan</td>
    <td>O(log n + k) where k = result size</td>
    <td>Height + sequential leaf reads</td>
  </tr>
  <tr>
    <td>Insert</td>
    <td>O(log n)</td>
    <td>Height + possible page splits</td>
  </tr>
  <tr>
    <td>Delete</td>
    <td>O(log n)</td>
    <td>Height + possible page merges</td>
  </tr>
  <tr>
    <td>Full scan</td>
    <td>O(n)</td>
    <td>Read all leaf pages sequentially</td>
  </tr>
</table>

<h2>2. LSM Trees (Log-Structured Merge Trees)</h2>
<p>LSM Trees are optimized for <strong>write-heavy</strong> workloads. Instead of updating data in-place (like B+Trees), they buffer writes in memory and periodically flush sorted batches to disk. Used by Cassandra, LevelDB, RocksDB, HBase, and ScyllaDB.</p>

<h3>Architecture</h3>
<pre><code>WRITE PATH:
                    ┌─────────────────┐
  Write ──────────→ │    Memtable     │  ← In-memory sorted structure
                    │ (Red-Black tree │     (e.g., skip list, red-black tree)
                    │  or Skip List)  │
                    └────────┬────────┘
                             │ When full (~64MB), flush to disk
                             ▼
                    ┌─────────────────┐
                    │  SSTable (L0)   │  ← Sorted String Table (immutable)
                    └─────────────────┘
                    ┌─────────────────┐
                    │  SSTable (L0)   │  ← Multiple L0 SSTables may overlap
                    └────────┬────────┘
                             │ Compaction (merge sort)
                             ▼
              ┌──────────────────────────────┐
              │     SSTable (L1 — merged)    │  ← Larger, non-overlapping
              └──────────────────────────────┘
              ┌──────────────────────────────────────────┐
              │          SSTable (L2 — larger)           │
              └──────────────────────────────────────────┘

READ PATH:
  1. Check Memtable (newest data)
  2. Check Bloom filter for each SSTable (skip if key definitely not present)
  3. Search SSTables from newest to oldest (binary search within each)
  4. Return first match found</code></pre>

<h3>B+Tree vs LSM Tree Comparison</h3>
<table>
  <tr>
    <th>Aspect</th>
    <th>B+Tree</th>
    <th>LSM Tree</th>
  </tr>
  <tr>
    <td><strong>Write performance</strong></td>
    <td>Moderate (random I/O for in-place updates)</td>
    <td>Excellent (sequential I/O, append-only)</td>
  </tr>
  <tr>
    <td><strong>Read performance</strong></td>
    <td>Excellent (single tree traversal)</td>
    <td>Moderate (may check multiple SSTables)</td>
  </tr>
  <tr>
    <td><strong>Space usage</strong></td>
    <td>Moderate (fragmentation from updates)</td>
    <td>Can be higher (dead entries until compaction)</td>
  </tr>
  <tr>
    <td><strong>Write amplification</strong></td>
    <td>Moderate (update page + WAL)</td>
    <td>High (data written multiple times during compaction)</td>
  </tr>
  <tr>
    <td><strong>Read amplification</strong></td>
    <td>Low (1 tree traversal)</td>
    <td>High (check memtable + multiple SSTables)</td>
  </tr>
  <tr>
    <td><strong>Concurrency</strong></td>
    <td>Complex (page-level locking)</td>
    <td>Simple (memtable is the only mutable structure)</td>
  </tr>
  <tr>
    <td><strong>Use case</strong></td>
    <td>OLTP, read-heavy, point lookups</td>
    <td>Write-heavy, time-series, logs</td>
  </tr>
  <tr>
    <td><strong>Examples</strong></td>
    <td>PostgreSQL, MySQL, Oracle</td>
    <td>Cassandra, RocksDB, LevelDB, HBase</td>
  </tr>
</table>

<h3>Write Amplification</h3>
<pre><code>Write amplification = Total bytes written to disk / Bytes of new data

B+Tree:
  1 write to WAL + 1 write to data page = ~2x
  Page splits add more writes

LSM Tree:
  1 write to WAL + 1 write to memtable flush + N compaction rewrites
  With leveled compaction: ~10-30x write amplification!

  Why it's still fast: ALL writes are SEQUENTIAL
  Sequential SSD write: ~500 MB/s
  Random SSD write: ~50 MB/s
  10x write amplification × sequential > 1x random</code></pre>

<h2>3. Hash Indexes</h2>
<p>Hash indexes provide O(1) exact-match lookups using a hash table. They are the fastest for equality queries but cannot support range queries, ordering, or prefix matching.</p>

<pre><code>Hash Index:
  hash("alice@ex.com") = 4217
  bucket[4217] → { row_pointer: page5, offset: 128 }

Supported:   WHERE email = 'alice@ex.com'     ← O(1)
NOT supported: WHERE email > 'a' AND email < 'b'  ← No range support
NOT supported: WHERE email LIKE 'alice%'        ← No prefix support
NOT supported: ORDER BY email                   ← No ordering</code></pre>

<div class="warning-note"><strong>PostgreSQL note:</strong> PostgreSQL supports hash indexes but they were not WAL-logged until version 10, meaning they were not crash-safe. Even now, B-tree indexes are almost always preferred because they support both equality AND range queries. Use hash indexes only when you are certain you will never need range queries on that column and benchmarks show a measurable improvement.</div>

<h2>4. Inverted Indexes</h2>
<p>Inverted indexes map content (words, terms) to documents containing that content. They are the foundation of full-text search engines like Elasticsearch, Solr, and PostgreSQL's full-text search.</p>

<pre><code>Documents:
  doc1: "The quick brown fox"
  doc2: "The lazy brown dog"
  doc3: "Quick fox jumps"

Inverted Index:
  "the"   → [doc1, doc2]
  "quick" → [doc1, doc3]
  "brown" → [doc1, doc2]
  "fox"   → [doc1, doc3]
  "lazy"  → [doc2]
  "dog"   → [doc2]
  "jumps" → [doc3]

Query: "quick AND fox"
  "quick" → [doc1, doc3]
  "fox"   → [doc1, doc3]
  Intersection: [doc1, doc3]

Query: "brown AND NOT dog"
  "brown" → [doc1, doc2]
  "dog"   → [doc2]
  Difference: [doc1]

Additional index data:
  - Term frequency (TF): how often in each doc
  - Document frequency (DF): how many docs contain term
  - Positions: where in the doc (for phrase queries)
  → TF-IDF / BM25 scoring for relevance ranking</code></pre>

<h2>5. Bloom Filters</h2>
<p>A Bloom filter is a space-efficient probabilistic data structure that tells you whether an element is <strong>definitely NOT in the set</strong> or <strong>possibly in the set</strong>. It has zero false negatives but a tunable false positive rate.</p>

<pre><code>Bloom Filter (m=10 bits, k=3 hash functions):

Insert "apple":
  h1("apple")=2, h2("apple")=5, h3("apple")=8
  bits: [0,0,1,0,0,1,0,0,1,0]

Insert "banana":
  h1("banana")=1, h2("banana")=4, h3("banana")=8
  bits: [0,1,1,0,1,1,0,0,1,0]

Query "apple":
  h1=2 ✓, h2=5 ✓, h3=8 ✓ → POSSIBLY IN SET (true positive)

Query "grape":
  h1=2 ✓, h2=4 ✓, h3=7 ✗ → DEFINITELY NOT IN SET

Query "cherry":
  h1=1 ✓, h2=5 ✓, h3=8 ✓ → POSSIBLY IN SET (false positive!)

Used by:
  - LSM Trees: skip SSTables that definitely don't have the key
  - Cassandra: avoid unnecessary disk reads
  - Chrome: check URLs against malware database
  - CDN: check if content is in cache before fetching from origin</code></pre>

<h2>6. SSTables and Memtables</h2>
<pre><code>SSTable (Sorted String Table):
  - Immutable file on disk
  - Keys are sorted (enables binary search and merging)
  - Stored as: [key1|value1][key2|value2]...[index_block][bloom_filter]
  - The index block maps key ranges to file offsets (sparse index)
  - Because keys are sorted, range queries are efficient

Memtable:
  - In-memory sorted data structure (Red-Black tree, Skip List, or AVL tree)
  - All writes go here first (fast — no disk I/O)
  - When it reaches a size threshold, it's flushed as an SSTable
  - While flushing, a new empty memtable starts accepting writes
  - Also write to WAL for durability (crash recovery)</code></pre>

<h2>Space-Time Tradeoffs in Indexing</h2>
<table>
  <tr>
    <th>Index Type</th>
    <th>Space Overhead</th>
    <th>Point Lookup</th>
    <th>Range Query</th>
    <th>Write Cost</th>
    <th>Best For</th>
  </tr>
  <tr>
    <td><strong>B+Tree</strong></td>
    <td>10-30% of data</td>
    <td>O(log n)</td>
    <td>O(log n + k)</td>
    <td>O(log n)</td>
    <td>General OLTP</td>
  </tr>
  <tr>
    <td><strong>Hash</strong></td>
    <td>Moderate</td>
    <td>O(1)</td>
    <td>Not supported</td>
    <td>O(1) amortized</td>
    <td>Equality-only lookups</td>
  </tr>
  <tr>
    <td><strong>LSM/SSTable</strong></td>
    <td>Variable (compaction)</td>
    <td>O(log n) per level</td>
    <td>Supported</td>
    <td>O(1) amortized</td>
    <td>Write-heavy workloads</td>
  </tr>
  <tr>
    <td><strong>Inverted</strong></td>
    <td>Can exceed data size</td>
    <td>O(1) per term</td>
    <td>N/A (text search)</td>
    <td>O(terms)</td>
    <td>Full-text search</td>
  </tr>
  <tr>
    <td><strong>Bloom Filter</strong></td>
    <td>~10 bits/element</td>
    <td>"Maybe" / "No"</td>
    <td>Not supported</td>
    <td>O(k) hash ops</td>
    <td>Membership pre-check</td>
  </tr>
  <tr>
    <td><strong>GiST/GIN</strong></td>
    <td>Varies</td>
    <td>O(log n)</td>
    <td>Spatial/containment</td>
    <td>Moderate-High</td>
    <td>Geospatial, JSONB, arrays</td>
  </tr>
</table>

<div class="warning-note"><strong>Index everything?</strong> No. Each index slows down writes (INSERT, UPDATE, DELETE) because the index must be updated too. An over-indexed table can have write performance 5-10x worse than an unindexed one. The rule of thumb: index columns used in WHERE, JOIN, and ORDER BY clauses of frequent queries. Use EXPLAIN ANALYZE to verify that queries actually use your indexes.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why do databases use B+Trees instead of binary search trees or hash tables?</div>
  <div class="qa-a">Binary search trees (BST) have O(log₂ n) height, meaning many disk I/Os per lookup. B+Trees have a high branching factor (~500), so a tree of height 3 can hold 125 million keys — only 3 disk reads for any lookup. Hash tables provide O(1) lookups but don't support range queries (WHERE age BETWEEN 20 AND 30) or ordering (ORDER BY). B+Trees support both equality and range queries efficiently. Additionally, B+Trees align with disk I/O: each node is one disk page (4KB-16KB), and sequential leaf scanning for range queries leverages disk prefetching. The linked list of leaf nodes makes full index scans fast and sequential.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose an LSM-tree based database over a B+Tree based one?</div>
  <div class="qa-a">Choose LSM when your workload is <strong>write-heavy</strong> with a high write-to-read ratio (>10:1). Examples: time-series data (IoT sensors writing millions of data points), event logging, metrics collection, and message queues. LSM writes are always sequential (memtable flush + compaction), which is much faster than B+Tree's random I/O for in-place updates. Choose B+Tree when reads dominate or when you need low-latency point lookups — B+Tree serves reads in a single tree traversal, while LSM may need to check memtable + multiple SSTables. Also choose B+Tree when write amplification is a concern (LSM can amplify writes 10-30x due to compaction). Real-world: PostgreSQL (B+Tree) for OLTP; Cassandra, RocksDB (LSM) for write-heavy.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain how Elasticsearch uses inverted indexes to achieve fast full-text search.</div>
  <div class="qa-a">Elasticsearch builds an inverted index during the "analysis" phase. Each document's text goes through: (1) <strong>Tokenization</strong> — split text into tokens ("The quick fox" → ["the", "quick", "fox"]). (2) <strong>Token filters</strong> — lowercase, stemming ("running" → "run"), stop word removal ("the" removed), synonyms. (3) <strong>Indexing</strong> — each token maps to a posting list (sorted list of document IDs containing that token). For a search query, Elasticsearch: tokenizes the query the same way, looks up each term's posting list in O(1), computes set intersections (AND) or unions (OR), and ranks results using BM25 (an improved TF-IDF). The inverted index is stored as immutable <strong>segments</strong> (similar to SSTables). New documents go to an in-memory buffer, periodically flushed as new segments. Background merge (similar to LSM compaction) combines small segments. This is why Elasticsearch has near-real-time search (~1 second delay) rather than truly real-time.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a covering index, and why is it faster?</div>
  <div class="qa-a">A covering index contains all the columns needed to answer a query, so the database never needs to look up the actual table row (no "heap fetch"). Example: <code>CREATE INDEX idx ON orders(customer_id, order_date, total)</code>. For the query <code>SELECT order_date, total FROM orders WHERE customer_id = 123</code>, the database finds the index entry and already has order_date and total — no need to fetch the full row. This is significantly faster because: (1) the index is smaller than the table, so more of it fits in memory/cache, (2) it avoids random I/O to fetch full rows scattered across disk pages, (3) for range queries, sequential index scanning is much faster than random heap accesses. In PostgreSQL, you can see this in EXPLAIN output as "Index Only Scan" (vs. "Index Scan" which still fetches the heap).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a composite index, and does column order matter?</div>
  <div class="qa-a">A composite index indexes multiple columns. Column order matters enormously due to the <strong>leftmost prefix rule</strong>. For index (A, B, C), the B+Tree sorts by A first, then B within equal A values, then C within equal (A, B) values. This means: <code>WHERE A = 1</code> uses the index. <code>WHERE A = 1 AND B = 2</code> uses the index. <code>WHERE A = 1 AND B = 2 AND C = 3</code> uses the full index. But <code>WHERE B = 2</code> CANNOT use the index (no leftmost prefix). <code>WHERE A = 1 AND C = 3</code> can use A but not skip to C. Rule of thumb for column order: (1) Equality conditions first (high selectivity). (2) Range conditions last. (3) Columns used in ORDER BY after WHERE columns. Example: for <code>WHERE status = 'active' AND created_at > '2024-01-01' ORDER BY created_at</code>, the ideal index is (status, created_at).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do Bloom filters reduce read amplification in LSM trees?</div>
  <div class="qa-a">In an LSM tree, a point lookup might need to check the memtable, then each SSTable from newest to oldest — potentially dozens of SSTables (this is read amplification). Each SSTable check requires at least one disk read to load the relevant block. Bloom filters eliminate most of these unnecessary reads. Each SSTable has an associated Bloom filter (typically loaded into memory). Before searching an SSTable for a key, the system checks the Bloom filter: if it says "not present" (guaranteed correct), the SSTable is skipped entirely with zero disk I/O. If it says "possibly present" (might be a false positive), the SSTable is searched. With a 1% false positive rate and 10 SSTables, on average you'll only do 0.1 unnecessary disk reads per lookup instead of 10. The memory cost is small: ~10 bits per key, so 1 billion keys need only ~1.2 GB of Bloom filter memory.</div>
</div>
`
  },
  {
    id: 'db-selection',
    title: 'Database Selection Guide',
    category: 'Databases',
    starterCode: `// Database Selection Framework — Decision Engine

console.log('=== Database Selection Decision Engine ===\\n');

const databases = {
  'PostgreSQL': {
    type: 'Relational',
    strengths: ['ACID transactions', 'Complex queries/JOINs', 'JSONB support', 'Extensions (PostGIS, pg_trgm)'],
    weaknesses: ['Vertical scaling limit', 'Sharding complexity', 'Write-heavy workloads'],
    bestFor: ['General OLTP', 'Financial systems', 'Geospatial', 'Multi-model needs'],
    scaleCeiling: '~10TB, ~50K QPS (single node)',
  },
  'MongoDB': {
    type: 'Document',
    strengths: ['Schema flexibility', 'Horizontal scaling', 'Rich query language', 'Multi-doc transactions'],
    weaknesses: ['No JOINs (only $lookup)', 'Memory hungry', 'Write locking (pre-WiredTiger)'],
    bestFor: ['Flexible schemas', 'Content management', 'Catalog/Product data', 'Prototyping'],
    scaleCeiling: '~Petabytes across shards',
  },
  'Redis': {
    type: 'Key-Value (In-Memory)',
    strengths: ['Sub-millisecond latency', 'Rich data structures', 'Pub/Sub', 'Lua scripting'],
    weaknesses: ['Memory-bound', 'Limited query capability', 'Persistence tradeoffs'],
    bestFor: ['Caching', 'Sessions', 'Rate limiting', 'Leaderboards', 'Pub/Sub'],
    scaleCeiling: '~1TB (Redis Cluster)',
  },
  'Elasticsearch': {
    type: 'Search Engine',
    strengths: ['Full-text search', 'Aggregations', 'Near real-time', 'Horizontal scaling'],
    weaknesses: ['Not a primary database', 'Eventual consistency', 'Resource intensive'],
    bestFor: ['Search', 'Log analytics', 'Monitoring', 'Autocomplete'],
    scaleCeiling: '~Petabytes across shards',
  },
  'Cassandra': {
    type: 'Column-Family',
    strengths: ['Write throughput', 'Linear scalability', 'Multi-DC replication', 'No SPOF'],
    weaknesses: ['Limited queries (partition key required)', 'No JOINs', 'Eventual consistency default'],
    bestFor: ['Time-series', 'IoT data', 'Event logging', 'Write-heavy workloads'],
    scaleCeiling: '~Petabytes, millions of writes/sec',
  },
  'DynamoDB': {
    type: 'Key-Value/Document (Managed)',
    strengths: ['Auto-scaling', 'Single-digit ms latency', 'Managed/serverless', 'Global tables'],
    weaknesses: ['Vendor lock-in', 'Limited query flexibility', 'Costly at scale', 'No JOINs'],
    bestFor: ['Serverless apps', 'Gaming leaderboards', 'Session stores', 'IoT'],
    scaleCeiling: '~Unlimited (AWS managed)',
  },
  'Neo4j': {
    type: 'Graph',
    strengths: ['Relationship traversals', 'Cypher query language', 'ACID transactions', 'Visual tools'],
    weaknesses: ['Limited horizontal scaling', 'Not suited for non-graph queries', 'Smaller ecosystem'],
    bestFor: ['Social networks', 'Fraud detection', 'Recommendation engines', 'Knowledge graphs'],
    scaleCeiling: '~Hundreds of billions of relationships',
  },
};

// Decision function
function selectDatabase(requirements) {
  console.log('Requirements:', JSON.stringify(requirements, null, 2));
  console.log('');

  const scores = {};
  for (const [name, db] of Object.entries(databases)) {
    let score = 0;
    if (requirements.needsACID && db.strengths.some(s => s.includes('ACID'))) score += 3;
    if (requirements.needsSearch && db.type === 'Search Engine') score += 5;
    if (requirements.writeHeavy && db.strengths.some(s => s.includes('Write'))) score += 3;
    if (requirements.needsFlexSchema && db.type === 'Document') score += 3;
    if (requirements.needsCaching && db.type.includes('In-Memory')) score += 5;
    if (requirements.needsGraphTraversal && db.type === 'Graph') score += 5;
    if (requirements.needsServerless && db.strengths.some(s => s.includes('serverless'))) score += 3;
    scores[name] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(e => e[1] > 0);
  console.log('Recommendations:');
  sorted.forEach(([name, score], i) => {
    const db = databases[name];
    console.log((i+1) + '. ' + name + ' (score: ' + score + ')');
    console.log('   Type: ' + db.type);
    console.log('   Best for: ' + db.bestFor.join(', '));
    console.log('');
  });
}

// Example: E-commerce system
console.log('--- Scenario 1: E-Commerce Platform ---');
selectDatabase({ needsACID: true, needsSearch: true, needsFlexSchema: false });

console.log('\\n--- Scenario 2: IoT Data Platform ---');
selectDatabase({ writeHeavy: true, needsACID: false, needsCaching: true });

console.log('\\n--- Scenario 3: Social Network ---');
selectDatabase({ needsGraphTraversal: true, needsCaching: true, needsSearch: true });`,
    content: `
<h1>Database Selection Guide</h1>
<p>Choosing the right database is one of the most impactful architectural decisions in system design. There is no "best" database — only the best database <strong>for your specific requirements</strong>. This guide provides a structured framework for evaluating databases, detailed profiles of major databases, and guidance for justifying your choice in system design interviews.</p>

<h2>Decision Framework</h2>
<pre><code>Step 1: Identify Requirements
  ├── Data model (structured? semi-structured? graph?)
  ├── Query patterns (OLTP? OLAP? search? traversal?)
  ├── Consistency requirements (strong? eventual? tunable?)
  ├── Scale (data size, QPS, growth rate)
  ├── Latency requirements (ms? sub-ms?)
  └── Operational constraints (managed? self-hosted? team expertise?)

Step 2: Filter Candidates
  ├── Eliminate databases that can't meet hard requirements
  └── Shortlist 2-3 candidates

Step 3: Evaluate Tradeoffs
  ├── Read vs write performance
  ├── Consistency vs availability
  ├── Operational complexity vs features
  └── Cost (license, infrastructure, team training)

Step 4: Justify Your Choice
  └── "We chose X because [requirement] is our top priority,
       and X excels at that while Y and Z have [specific weakness]"</code></pre>

<h2>PostgreSQL — The Swiss Army Knife</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose PostgreSQL When</th>
    <th>Avoid PostgreSQL When</th>
  </tr>
  <tr>
    <td>You need ACID transactions</td>
    <td>You need to scale writes beyond one machine</td>
  </tr>
  <tr>
    <td>Complex queries with JOINs, CTEs, window functions</td>
    <td>Simple key-value access patterns only</td>
  </tr>
  <tr>
    <td>You want one database to handle relational + JSON + full-text + geospatial</td>
    <td>You need sub-millisecond latency for millions of simple lookups</td>
  </tr>
  <tr>
    <td>Data integrity is critical (financial, healthcare)</td>
    <td>Data volume exceeds ~10TB or QPS exceeds ~50K on one node</td>
  </tr>
  <tr>
    <td>You're unsure about requirements (PostgreSQL is a safe default)</td>
    <td>Workload is almost exclusively append-only writes (use Cassandra/Kafka)</td>
  </tr>
</table>

<h3>Key Features for System Design</h3>
<ul>
  <li><strong>JSONB:</strong> Store and query JSON natively — can serve as a document database</li>
  <li><strong>Full-text search:</strong> Built-in tsvector/tsquery (avoid Elasticsearch for simple search)</li>
  <li><strong>PostGIS:</strong> Industry-standard geospatial extension</li>
  <li><strong>Streaming replication:</strong> Read replicas for scaling reads</li>
  <li><strong>Table partitioning:</strong> Partition by range, list, or hash without sharding</li>
  <li><strong>LISTEN/NOTIFY:</strong> Built-in pub/sub for simple event-driven patterns</li>
</ul>

<div class="warning-note"><strong>PostgreSQL as a starting point:</strong> In system design interviews, PostgreSQL is often the best starting database because it covers so many use cases. Start with PostgreSQL and only introduce specialized databases when PostgreSQL can't meet a specific requirement. This shows maturity — premature optimization by using 5 different databases on day one is a red flag.</div>

<h2>MongoDB — Flexible Document Store</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose MongoDB When</th>
    <th>Avoid MongoDB When</th>
  </tr>
  <tr>
    <td>Schema varies significantly between records (product catalogs)</td>
    <td>You need complex JOINs across collections</td>
  </tr>
  <tr>
    <td>Data is hierarchical/nested (fits naturally as documents)</td>
    <td>Strong transactional requirements across multiple collections</td>
  </tr>
  <tr>
    <td>You need built-in horizontal scaling (sharding)</td>
    <td>Data is highly relational with many-to-many relationships</td>
  </tr>
  <tr>
    <td>Rapid prototyping and schema iteration</td>
    <td>You need complex aggregations that SQL handles naturally</td>
  </tr>
  <tr>
    <td>You work with JSON-native data (APIs, IoT payloads)</td>
    <td>Data integrity constraints are critical (no foreign keys)</td>
  </tr>
</table>

<h3>Key Features</h3>
<ul>
  <li><strong>Flexible schema:</strong> Each document can have different fields</li>
  <li><strong>Aggregation pipeline:</strong> Powerful data processing ($match, $group, $lookup, $unwind)</li>
  <li><strong>Change streams:</strong> Real-time event notifications on data changes</li>
  <li><strong>Auto-sharding:</strong> Horizontal scaling with hash or range-based sharding</li>
  <li><strong>Atlas:</strong> Fully managed cloud service with global clusters</li>
</ul>

<h2>Redis — In-Memory Speed</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose Redis When</th>
    <th>Avoid Redis When</th>
  </tr>
  <tr>
    <td>Sub-millisecond latency is required</td>
    <td>Data exceeds available memory (Redis is memory-bound)</td>
  </tr>
  <tr>
    <td>Caching layer for a primary database</td>
    <td>You need complex queries or JOINs</td>
  </tr>
  <tr>
    <td>Session storage, rate limiting, leaderboards</td>
    <td>Durability is critical (Redis can lose seconds of data)</td>
  </tr>
  <tr>
    <td>Real-time features (pub/sub, streams)</td>
    <td>Data is relational or requires transactions across keys</td>
  </tr>
  <tr>
    <td>Distributed locking, semaphores</td>
    <td>You need full-text search or complex filtering</td>
  </tr>
</table>

<h3>Data Structure Superpowers</h3>
<pre><code>String:  SET/GET — caching, counters (INCR)
Hash:    HSET/HGET — object storage, user profiles
List:    LPUSH/RPOP — message queues, activity feeds
Set:     SADD/SMEMBERS — tags, unique visitors, intersections
Sorted Set: ZADD/ZRANGE — leaderboards, priority queues, rate limiters
Stream:  XADD/XREAD — event streaming, audit log (like Kafka-lite)
HyperLogLog: PFADD/PFCOUNT — unique count estimation (12KB for billions)
Bitmap:  SETBIT/BITCOUNT — feature flags, daily active users</code></pre>

<h2>Elasticsearch — Search and Analytics</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose Elasticsearch When</th>
    <th>Avoid Elasticsearch When</th>
  </tr>
  <tr>
    <td>Full-text search with relevance ranking</td>
    <td>You need it as a primary database (no ACID, eventual consistency)</td>
  </tr>
  <tr>
    <td>Log aggregation and analytics (ELK stack)</td>
    <td>Simple key-value lookups (overkill)</td>
  </tr>
  <tr>
    <td>Autocomplete, fuzzy matching, "did you mean"</td>
    <td>Transactional writes (Elasticsearch is optimized for batch writes)</td>
  </tr>
  <tr>
    <td>Complex aggregations on semi-structured data</td>
    <td>Budget is tight (Elasticsearch is resource-intensive)</td>
  </tr>
  <tr>
    <td>Geospatial search (within X km of point)</td>
    <td>Data frequently updated in place (ES segments are immutable)</td>
  </tr>
</table>

<div class="warning-note"><strong>Elasticsearch is NOT a primary database.</strong> Always have a source of truth (PostgreSQL, MongoDB) and sync data to Elasticsearch for search. If Elasticsearch data is corrupted or lost, you should be able to rebuild the index from the primary database. Use change data capture (Debezium) or application-level dual writes to keep ES in sync.</div>

<h2>Kafka — Event Streaming Platform</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose Kafka When</th>
    <th>Avoid Kafka When</th>
  </tr>
  <tr>
    <td>Event-driven microservices (event sourcing, CQRS)</td>
    <td>Simple request-response communication (use HTTP/gRPC)</td>
  </tr>
  <tr>
    <td>High-throughput data pipeline (millions of events/sec)</td>
    <td>You need complex queries on the data (Kafka is append-only)</td>
  </tr>
  <tr>
    <td>Data replay capability (re-process historical events)</td>
    <td>Low-latency point-to-point messaging (use RabbitMQ)</td>
  </tr>
  <tr>
    <td>Decoupling producers from consumers</td>
    <td>Team is small and doesn't need the operational complexity</td>
  </tr>
  <tr>
    <td>Change data capture (CDC) pipeline</td>
    <td>Message ordering isn't important (simpler queues suffice)</td>
  </tr>
</table>

<h3>Kafka Architecture</h3>
<pre><code>Producer → Topic (partitioned) → Consumer Group

Topic: "orders"
  Partition 0: [msg1, msg4, msg7, ...]  ← Consumer A
  Partition 1: [msg2, msg5, msg8, ...]  ← Consumer B
  Partition 2: [msg3, msg6, msg9, ...]  ← Consumer C

Key properties:
  - Ordered within a partition (not across partitions)
  - Messages retained for configurable duration (days/weeks)
  - Consumers track their offset — can replay from any point
  - Each partition can only be consumed by one consumer in a group</code></pre>

<h2>Cassandra — Write-Heavy, Always-On</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose Cassandra When</th>
    <th>Avoid Cassandra When</th>
  </tr>
  <tr>
    <td>Write throughput is the primary concern</td>
    <td>You need ad-hoc queries (must query by partition key)</td>
  </tr>
  <tr>
    <td>Time-series data (IoT sensors, metrics, logs)</td>
    <td>You need JOINs or complex aggregations</td>
  </tr>
  <tr>
    <td>Multi-datacenter with high availability</td>
    <td>Data model requires frequent schema changes</td>
  </tr>
  <tr>
    <td>Linear horizontal scalability</td>
    <td>Strong consistency is always required (Cassandra defaults to eventual)</td>
  </tr>
  <tr>
    <td>No single point of failure (peer-to-peer architecture)</td>
    <td>Team is small (Cassandra requires significant operational expertise)</td>
  </tr>
</table>

<h3>Data Modeling Rule</h3>
<pre><code>Cassandra Rule: Design your tables based on your QUERIES, not your data.

Anti-pattern (relational thinking):
  CREATE TABLE users (id UUID PRIMARY KEY, name TEXT, email TEXT);
  CREATE TABLE orders (id UUID PRIMARY KEY, user_id UUID, total DECIMAL);
  -- Can't JOIN! Can't query orders by user_id efficiently!

Cassandra way:
  CREATE TABLE orders_by_user (
    user_id UUID,
    order_date TIMESTAMP,
    order_id UUID,
    total DECIMAL,
    PRIMARY KEY (user_id, order_date)
  ) WITH CLUSTERING ORDER BY (order_date DESC);
  -- Partition key: user_id (determines which node)
  -- Clustering key: order_date (sorted within partition)
  -- Perfect for: "Show me user X's orders, most recent first"</code></pre>

<h2>DynamoDB — Serverless NoSQL</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose DynamoDB When</th>
    <th>Avoid DynamoDB When</th>
  </tr>
  <tr>
    <td>AWS-native serverless architecture</td>
    <td>You need to avoid vendor lock-in</td>
  </tr>
  <tr>
    <td>Predictable, single-digit millisecond latency at any scale</td>
    <td>Complex queries or ad-hoc reporting</td>
  </tr>
  <tr>
    <td>Pay-per-request pricing fits your traffic pattern</td>
    <td>Data model requires JOINs or multi-table transactions</td>
  </tr>
  <tr>
    <td>Global tables for multi-region active-active</td>
    <td>Cost-sensitive at high, consistent throughput (can be expensive)</td>
  </tr>
  <tr>
    <td>Zero operational overhead (fully managed)</td>
    <td>Team has strong PostgreSQL/MySQL expertise</td>
  </tr>
</table>

<h2>Neo4j — Graph Relationships</h2>
<h3>When and Why</h3>
<table>
  <tr>
    <th>Choose Neo4j When</th>
    <th>Avoid Neo4j When</th>
  </tr>
  <tr>
    <td>Queries involve multi-hop relationships (friends of friends)</td>
    <td>Data is tabular without meaningful relationships</td>
  </tr>
  <tr>
    <td>Relationship traversal performance is critical</td>
    <td>You need horizontal scaling for massive datasets</td>
  </tr>
  <tr>
    <td>Fraud detection, recommendation engines</td>
    <td>Simple CRUD operations (overkill)</td>
  </tr>
  <tr>
    <td>Knowledge graphs, network analysis</td>
    <td>Write-heavy workloads (Neo4j is optimized for reads)</td>
  </tr>
</table>

<h2>System Design Interview: Complete Database Stack Examples</h2>

<h3>E-Commerce Platform</h3>
<pre><code>┌─────────────────────────────────────────────────────────────┐
│                    E-Commerce Database Stack                 │
├──────────────────┬──────────────────────────────────────────┤
│ PostgreSQL       │ Orders, payments, inventory (ACID)       │
│ MongoDB          │ Product catalog (flexible attributes)     │
│ Redis            │ Session, cart, cache, rate limiting       │
│ Elasticsearch    │ Product search, autocomplete              │
│ Kafka            │ Order events, inventory sync, CDC         │
│ Cassandra        │ Click-stream analytics, activity log      │
└──────────────────┴──────────────────────────────────────────┘

Justification:
  "Orders and payments MUST be ACID → PostgreSQL.
   Product catalogs have varying attributes (clothing vs electronics)
   → MongoDB's flexible schema fits naturally.
   Search needs full-text + faceting → Elasticsearch.
   Sub-ms caching for hot product pages → Redis.
   Event-driven order processing across services → Kafka.
   High-volume analytics writes → Cassandra."</code></pre>

<h3>Social Media Platform</h3>
<pre><code>┌─────────────────────────────────────────────────────────────┐
│                  Social Media Database Stack                 │
├──────────────────┬──────────────────────────────────────────┤
│ PostgreSQL       │ User accounts, auth, settings (ACID)     │
│ Neo4j            │ Social graph (followers, mutual friends)  │
│ Cassandra        │ Posts/timeline (write-heavy fan-out)      │
│ Redis            │ Feed cache, online presence, counters     │
│ Elasticsearch    │ User search, content search               │
│ Kafka            │ Fan-out events, notifications pipeline    │
│ S3 + CDN         │ Media storage (images, videos)            │
└──────────────────┴──────────────────────────────────────────┘</code></pre>

<h3>Real-Time Analytics Dashboard</h3>
<pre><code>┌─────────────────────────────────────────────────────────────┐
│              Analytics Dashboard Database Stack              │
├──────────────────┬──────────────────────────────────────────┤
│ Kafka            │ Event ingestion (millions/sec)            │
│ Apache Flink     │ Stream processing (real-time aggregation) │
│ Cassandra        │ Raw event storage (time-series)           │
│ ClickHouse       │ OLAP queries (fast aggregation on columns)│
│ Redis            │ Real-time counters, current dashboard     │
│ PostgreSQL       │ Dashboard config, user management         │
└──────────────────┴──────────────────────────────────────────┘</code></pre>

<h2>Quick Reference: Database Selection Cheat Sheet</h2>
<table>
  <tr>
    <th>If You Need...</th>
    <th>Use</th>
    <th>Because</th>
  </tr>
  <tr>
    <td>A safe default for most apps</td>
    <td>PostgreSQL</td>
    <td>ACID + JSON + FTS + extensions</td>
  </tr>
  <tr>
    <td>Flexible schema + horizontal scaling</td>
    <td>MongoDB</td>
    <td>Document model, auto-sharding</td>
  </tr>
  <tr>
    <td>Sub-ms caching</td>
    <td>Redis</td>
    <td>In-memory, rich data structures</td>
  </tr>
  <tr>
    <td>Full-text search</td>
    <td>Elasticsearch</td>
    <td>Inverted index, BM25, faceting</td>
  </tr>
  <tr>
    <td>Write-heavy time-series</td>
    <td>Cassandra</td>
    <td>LSM tree, linear scalability</td>
  </tr>
  <tr>
    <td>Event streaming / decoupling</td>
    <td>Kafka</td>
    <td>Append-only log, replay, high throughput</td>
  </tr>
  <tr>
    <td>Relationship traversals</td>
    <td>Neo4j</td>
    <td>Native graph, Cypher queries</td>
  </tr>
  <tr>
    <td>Serverless on AWS</td>
    <td>DynamoDB</td>
    <td>Managed, auto-scaling, pay-per-request</td>
  </tr>
  <tr>
    <td>Global ACID at scale</td>
    <td>CockroachDB / Spanner</td>
    <td>NewSQL: distributed SQL</td>
  </tr>
  <tr>
    <td>OLAP / analytics</td>
    <td>ClickHouse / BigQuery</td>
    <td>Columnar storage, fast aggregations</td>
  </tr>
</table>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: In a system design interview, how do you decide between PostgreSQL and MongoDB?</div>
  <div class="qa-a">Ask yourself three questions: (1) <strong>Are relationships between entities important?</strong> If you need JOINs across multiple entities (users → orders → products → reviews), PostgreSQL is better. If data is naturally hierarchical and usually accessed as a unit (a user profile with embedded preferences), MongoDB works well. (2) <strong>Is schema stability or flexibility more important?</strong> If your schema is well-defined and changes infrequently, PostgreSQL's strict schema catches bugs. If attributes vary widely (product catalog where electronics and clothing have different fields), MongoDB's flexibility is valuable. (3) <strong>Do you need multi-entity transactions?</strong> PostgreSQL has battle-tested multi-table ACID transactions. MongoDB supports multi-document transactions since 4.0, but they are slower and have limitations. My default: start with PostgreSQL (it handles JSON too via JSONB) and switch to MongoDB only if the schema flexibility benefit is clearly significant.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you justify using Redis alongside a primary database?</div>
  <div class="qa-a">Redis serves as a <strong>caching layer</strong> to reduce load on the primary database and improve latency. Justification: "Our product page is read 1000x more than it's written. Without caching, every read hits PostgreSQL. With Redis: (1) Cache product data with a 5-minute TTL — 99% of reads served from Redis in <1ms. (2) Use Redis sorted sets for the leaderboard instead of expensive ORDER BY queries. (3) Store user sessions in Redis (fast lookups, automatic expiry). (4) Use Redis for rate limiting (INCR with EXPIRE). The tradeoff is cache invalidation complexity — we use write-through caching for critical data and TTL-based expiry for less critical data. We accept that users might see slightly stale data for 5 minutes on product listings, but inventory counts are always read from PostgreSQL."</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you introduce Elasticsearch into a system?</div>
  <div class="qa-a">Introduce Elasticsearch when you need search capabilities that your primary database can't efficiently provide: (1) <strong>Full-text search with relevance ranking</strong> — e.g., searching products by name, description, reviews with BM25 scoring. PostgreSQL's full-text search works for simple cases but Elasticsearch excels at complex analyzers, fuzzy matching, and relevance tuning. (2) <strong>Autocomplete/typeahead</strong> — edge n-gram tokenizers provide fast prefix matching. (3) <strong>Log analytics</strong> — the ELK stack (Elasticsearch + Logstash + Kibana) is the standard for log aggregation. (4) <strong>Faceted search</strong> — "show me laptops under $1000 with 16GB RAM" with real-time facet counts. Architecture: always keep a primary database as the source of truth. Sync data to ES via change data capture (Debezium → Kafka → ES) or application-level dual writes. Accept that ES data is eventually consistent (1-2 second delay).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle a scenario where you need both strong consistency and high write throughput?</div>
  <div class="qa-a">This is inherently a tension — strong consistency requires coordination (consensus protocols, locks), which limits throughput. Strategies: (1) <strong>Partition the problem:</strong> Not all data needs strong consistency. Use PostgreSQL for the strongly consistent part (account balances, inventory) and Cassandra/Kafka for the high-throughput part (event logs, analytics). (2) <strong>NewSQL:</strong> CockroachDB or Google Spanner provide strong consistency with horizontal scaling, but at higher write latency (~10-15ms for cross-region). Suitable when you genuinely need both. (3) <strong>Shard wisely:</strong> If most transactions are single-entity (e.g., update one user's balance), shard by that entity. Each shard has its own strong consistency, and you avoid distributed transactions. (4) <strong>Reduce consistency scope:</strong> Use eventual consistency for non-critical paths and strong consistency only where business rules demand it.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What questions should you ask before choosing a database in a system design interview?</div>
  <div class="qa-a">Before choosing, clarify: (1) <strong>Data volume:</strong> How much data total? Growth rate? Can it fit on one machine? (2) <strong>Query patterns:</strong> Read-heavy or write-heavy? Point lookups or range scans? JOINs needed? Full-text search? (3) <strong>Consistency requirements:</strong> Can we tolerate stale reads? Are there financial transactions? (4) <strong>Latency requirements:</strong> What's the p99 latency target? Sub-millisecond? Single-digit milliseconds? (5) <strong>Availability requirements:</strong> What's the downtime tolerance? Multi-region needed? (6) <strong>Schema stability:</strong> Is the schema well-defined or rapidly evolving? (7) <strong>Operational constraints:</strong> Team size? Managed service budget? Existing expertise? (8) <strong>Compliance:</strong> Data residency requirements? Encryption needs? These questions demonstrate that you make data-driven architectural decisions rather than defaulting to whatever you last used.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you keep multiple databases in sync in a polyglot persistence architecture?</div>
  <div class="qa-a">The main patterns are: (1) <strong>Change Data Capture (CDC):</strong> Use tools like Debezium to capture changes from the primary database's transaction log (PostgreSQL WAL, MySQL binlog) and publish them to Kafka. Downstream consumers update Elasticsearch, Redis, and other databases. This is the most reliable approach — changes are guaranteed to be captured. (2) <strong>Application-level dual writes:</strong> The application writes to both databases. Problem: if one write fails and the other succeeds, you have inconsistency. Use the Transactional Outbox pattern: write to the primary DB + an outbox table in one transaction. A separate process reads the outbox and updates secondary databases. (3) <strong>Event sourcing:</strong> All state changes are events published to Kafka. Each database consumes events and builds its own view. Most reliable but requires the entire architecture to be event-driven. My preference: CDC with Debezium for existing systems, event sourcing for greenfield systems.</div>
</div>
`
  },
];
