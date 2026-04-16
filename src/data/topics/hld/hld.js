export const hld = [
  // ==================== SYSTEM DESIGN ====================
  {
    id: 'cap-theorem',
    title: 'CAP Theorem & Consistency Models',
    category: 'System Design',
    starterCode: `// CAP Theorem Simulator
// Demonstrates how different databases handle partition scenarios

class DistributedDB {
  constructor(name, type) {
    this.name = name;
    this.type = type; // 'CP' | 'AP' | 'CA'
    this.nodes = [
      { id: 'Node-A', data: { user: 'Alice', balance: 100 }, alive: true },
      { id: 'Node-B', data: { user: 'Alice', balance: 100 }, alive: true },
      { id: 'Node-C', data: { user: 'Alice', balance: 100 }, alive: true }
    ];
  }

  simulatePartition() {
    console.log(\`\\n--- \${this.name} (\${this.type}) during network partition ---\`);
    // Node-C gets partitioned
    this.nodes[2].alive = false;
    console.log('Node-C is now unreachable (network partition!)');
  }

  write(key, value) {
    if (this.type === 'CP') {
      // CP: Require majority quorum — reject if can't reach majority consistently
      const aliveNodes = this.nodes.filter(n => n.alive);
      const majority = Math.floor(this.nodes.length / 2) + 1;
      if (aliveNodes.length >= majority) {
        aliveNodes.forEach(n => n.data[key] = value);
        console.log(\`[CP] Write accepted: \${key}=\${value} (quorum: \${aliveNodes.length}/\${this.nodes.length})\`);
      } else {
        console.log(\`[CP] Write REJECTED — cannot reach quorum (\${aliveNodes.length}/\${this.nodes.length})\`);
      }
    } else if (this.type === 'AP') {
      // AP: Always accept writes — deal with conflicts later
      const aliveNodes = this.nodes.filter(n => n.alive);
      aliveNodes.forEach(n => n.data[key] = value);
      console.log(\`[AP] Write accepted: \${key}=\${value} (wrote to \${aliveNodes.length} nodes)\`);
      console.log('[AP] Warning: partitioned node has stale data — will resolve on repair');
    }
  }

  read(key) {
    if (this.type === 'CP') {
      const aliveNodes = this.nodes.filter(n => n.alive);
      const value = aliveNodes[0].data[key];
      console.log(\`[CP] Read \${key} = \${value} (consistent — quorum read)\`);
      return value;
    } else if (this.type === 'AP') {
      // Different nodes might return different values
      console.log('[AP] Reads from different nodes:');
      this.nodes.forEach(n => {
        const status = n.alive ? 'reachable' : 'partitioned';
        console.log(\`  \${n.id} (\${status}): \${key} = \${n.data[key]}\`);
      });
    }
  }

  heal() {
    console.log(\`\\n--- Partition healed for \${this.name} ---\`);
    this.nodes[2].alive = true;
    if (this.type === 'AP') {
      // Anti-entropy repair
      const latestValue = this.nodes[0].data;
      this.nodes[2].data = { ...latestValue };
      console.log('[AP] Anti-entropy repair: Node-C synced to latest state');
    }
  }
}

// Simulate PostgreSQL (CP)
const pg = new DistributedDB('PostgreSQL', 'CP');
pg.simulatePartition();
pg.write('balance', 200);
pg.read('balance');
pg.heal();

// Simulate Cassandra (AP)
const cass = new DistributedDB('Cassandra', 'AP');
cass.simulatePartition();
cass.write('balance', 200);
cass.read('balance');
cass.heal();

// Cassandra Tunable Consistency Demo
console.log('\\n=== Cassandra Tunable Consistency ===');
const consistencyLevels = ['ONE', 'QUORUM', 'ALL'];
const rf = 3; // replication factor
consistencyLevels.forEach(cl => {
  let required;
  if (cl === 'ONE') required = 1;
  else if (cl === 'QUORUM') required = Math.floor(rf / 2) + 1;
  else required = rf;
  const toleratedFailures = rf - required;
  console.log(\`CL=\${cl}: Need \${required}/\${rf} nodes, tolerate \${toleratedFailures} failure(s)\`);
});`,
    content: `
<h1>CAP Theorem & Consistency Models</h1>

<p>The CAP theorem is the foundation of distributed systems design. Every system design interview at SDE-2/SDE-3 level will test your understanding of these tradeoffs.</p>

<h2>CAP Theorem Explained</h2>

<p>In a distributed data store, you can only guarantee <strong>two out of three</strong> properties:</p>

<pre><code>                    C (Consistency)
                    /\\
                   /  \\
                  /    \\
                 / CP   \\
                /  zone  \\
               /----------\\
              / CA    AP   \\
             /   zone  zone \\
            /________________\\
     A (Availability)    P (Partition Tolerance)

C = Every read receives the most recent write or an error
A = Every request receives a non-error response (no guarantee it's latest)
P = System continues to operate despite network partitions
</code></pre>

<div class="warning-note">In real distributed systems, network partitions WILL happen. So the real choice is between <strong>CP</strong> (consistency + partition tolerance) and <strong>AP</strong> (availability + partition tolerance). CA systems only exist in single-node or tightly coupled environments.</div>

<h2>CP vs AP vs CA — Real Database Examples</h2>

<table>
<tr><th>Database</th><th>CAP Type</th><th>Consistency Model</th><th>Use Case</th></tr>
<tr><td><strong>PostgreSQL</strong></td><td>CP (single-node CA)</td><td>Strong (ACID)</td><td>Financial transactions, user accounts</td></tr>
<tr><td><strong>Cassandra</strong></td><td>AP (tunable)</td><td>Eventual (tunable to strong)</td><td>Time-series, messaging, IoT</td></tr>
<tr><td><strong>MongoDB</strong></td><td>CP (default)</td><td>Strong (single-doc), Eventual (reads from secondaries)</td><td>Product catalog, user profiles</td></tr>
<tr><td><strong>Redis</strong></td><td>AP (Cluster) / CP (Sentinel)</td><td>Eventual</td><td>Caching, sessions, rate limiting</td></tr>
<tr><td><strong>DynamoDB</strong></td><td>AP (default), CP (strongly consistent reads)</td><td>Eventual / Strong</td><td>Serverless apps, gaming leaderboards</td></tr>
<tr><td><strong>Zookeeper</strong></td><td>CP</td><td>Linearizable</td><td>Service discovery, leader election, config</td></tr>
</table>

<h2>Cassandra as an AP System — Tunable Consistency</h2>

<p>Cassandra is <strong>AP by default</strong> but offers tunable consistency, making it flexible for different workloads.</p>

<pre><code>Replication Factor (RF) = 3

Write/Read Consistency Levels:
┌───────────┬─────────────────┬────────────────────────┐
│ Level     │ Nodes Required  │ Behavior               │
├───────────┼─────────────────┼────────────────────────┤
│ ONE       │ 1 out of RF     │ Fastest, least durable │
│ QUORUM    │ RF/2 + 1 = 2    │ Balanced (recommended) │
│ ALL       │ RF = 3          │ Strongest, least avail │
│ LOCAL_ONE │ 1 in local DC   │ Multi-DC optimization  │
└───────────┴─────────────────┴────────────────────────┘

Strong consistency formula:
  R + W &gt; RF  →  Guarantees strong consistency
  Example: QUORUM read (2) + QUORUM write (2) &gt; RF (3) ✓
</code></pre>

<p>At Habuild, with Cassandra handling high-throughput messaging data, a typical setup uses <code>QUORUM</code> for writes and <code>ONE</code> for reads when slight staleness is acceptable, or <code>QUORUM/QUORUM</code> when consistency matters.</p>

<h2>PostgreSQL as a CP System</h2>

<p>PostgreSQL provides <strong>ACID guarantees</strong> with strong consistency. In replicated setups, it prioritizes consistency over availability:</p>
<ul>
<li><strong>Synchronous replication</strong>: Primary waits for standby acknowledgment — CP behavior</li>
<li><strong>Asynchronous replication</strong>: Primary doesn't wait — risk of data loss on failover</li>
<li>During a partition, synchronous replicas will block writes rather than accept potentially inconsistent data</li>
</ul>

<h2>MongoDB — CP by Default</h2>

<p>MongoDB uses a <strong>single primary per replica set</strong>. All writes go to the primary, making it CP:</p>
<ul>
<li>If the primary becomes unreachable, an election occurs (no writes during election — ~10s)</li>
<li>Read preference can be configured: <code>primary</code>, <code>primaryPreferred</code>, <code>secondary</code>, <code>secondaryPreferred</code>, <code>nearest</code></li>
<li>Using <code>secondary</code> read preference trades consistency for availability (AP-like reads)</li>
</ul>

<h2>Consistency Models Spectrum</h2>

<pre><code>Strongest ◀──────────────────────────────────────▶ Weakest

Linearizable → Sequential → Causal → Read-your-writes → Eventual

│ Every op      │ Total order  │ Respects  │ A client sees  │ Eventually
│ appears to    │ across all   │ causality │ its own writes │ all replicas
│ happen at     │ clients      │ "if A     │ immediately    │ converge
│ one instant   │              │ caused B, │                │
│               │              │ see A     │                │
│               │              │ before B" │                │
</code></pre>

<table>
<tr><th>Model</th><th>Guarantee</th><th>Example System</th></tr>
<tr><td>Linearizable (Strong)</td><td>Reads always return latest write</td><td>Zookeeper, Spanner</td></tr>
<tr><td>Sequential</td><td>All clients see same order</td><td>PostgreSQL (single node)</td></tr>
<tr><td>Causal</td><td>Causally related ops seen in order</td><td>MongoDB causal sessions</td></tr>
<tr><td>Read-your-writes</td><td>Client always sees own writes</td><td>DynamoDB (consistent reads)</td></tr>
<tr><td>Eventual</td><td>Replicas converge eventually</td><td>Cassandra (CL=ONE), DNS</td></tr>
</table>

<h2>PACELC Theorem</h2>

<p>PACELC extends CAP: <strong>if Partition, choose A or C; Else (normal operation), choose Latency or Consistency.</strong></p>

<table>
<tr><th>System</th><th>During Partition (PAC)</th><th>Else (ELC)</th><th>Classification</th></tr>
<tr><td>Cassandra</td><td>PA (available)</td><td>EL (low latency)</td><td>PA/EL</td></tr>
<tr><td>PostgreSQL</td><td>PC (consistent)</td><td>EC (consistent)</td><td>PC/EC</td></tr>
<tr><td>MongoDB</td><td>PC (consistent)</td><td>EC (consistent)</td><td>PC/EC</td></tr>
<tr><td>DynamoDB</td><td>PA (available)</td><td>EL (low latency)</td><td>PA/EL</td></tr>
<tr><td>Cosmos DB</td><td>PA (available)</td><td>EL (tunable)</td><td>PA/EL</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Your resume shows Cassandra and PostgreSQL — when would you choose one over the other?</div>
<div class="qa-a"><strong>Choose Cassandra when:</strong> You need high write throughput across regions, can tolerate eventual consistency, have time-series or append-heavy data (e.g., messaging events at Habuild with millions of daily messages). Cassandra excels at horizontal scaling with no single point of failure.<br/><br/><strong>Choose PostgreSQL when:</strong> You need ACID transactions, complex joins, strong consistency (e.g., user accounts, payment processing). PostgreSQL is the right choice when data integrity is paramount and your read/write patterns fit a relational model.<br/><br/><strong>At Habuild:</strong> We used Cassandra for high-volume messaging data (800K+ daily messages, append-heavy) and PostgreSQL for user accounts and financial data where ACID was non-negotiable.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How does Cassandra achieve tunable consistency?</div>
<div class="qa-a">Cassandra allows you to configure consistency per query using <strong>consistency levels</strong> (CL). With replication factor RF=3:<br/><br/>1. <strong>CL=ONE</strong>: Only 1 replica must respond — fastest but weakest guarantee<br/>2. <strong>CL=QUORUM</strong>: Majority (RF/2+1=2) must respond — balanced tradeoff<br/>3. <strong>CL=ALL</strong>: All replicas must respond — strongest but blocks if any node is down<br/><br/>Strong consistency is achieved when <code>R + W &gt; RF</code>. For example, QUORUM reads (2) + QUORUM writes (2) = 4 &gt; 3, so you're guaranteed to read the latest write. This lets you tune per-query: use CL=ONE for analytics reads (fast), QUORUM for user-facing writes (durable), and ALL for critical operations (consistent).</div>
</div>
`
  },

  {
    id: 'sharding-partitioning',
    title: 'Database Sharding & Partitioning',
    category: 'System Design',
    starterCode: `// Database Sharding Strategies Simulator
// ========================================

// 1. Hash-Based Sharding
class HashSharding {
  constructor(numShards) {
    this.numShards = numShards;
    this.shards = Array.from({ length: numShards }, () => []);
  }

  hashFunction(key) {
    let hash = 0;
    for (let i = 0; i < String(key).length; i++) {
      hash = ((hash << 5) - hash) + String(key).charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.numShards;
  }

  insert(userId, data) {
    const shard = this.hashFunction(userId);
    this.shards[shard].push({ userId, data });
    return shard;
  }

  getDistribution() {
    return this.shards.map((s, i) => ({ shard: i, count: s.length }));
  }
}

// 2. Range-Based Sharding
class RangeSharding {
  constructor(ranges) {
    this.ranges = ranges; // e.g., [{min:0, max:1000000}, {min:1000001, max:2000000}]
    this.shards = ranges.map(() => []);
  }

  insert(userId, data) {
    const idx = this.ranges.findIndex(r => userId >= r.min && userId <= r.max);
    if (idx !== -1) this.shards[idx].push({ userId, data });
    return idx;
  }

  getDistribution() {
    return this.shards.map((s, i) => ({
      shard: i,
      range: \`\${this.ranges[i].min}-\${this.ranges[i].max}\`,
      count: s.length
    }));
  }
}

// 3. Consistent Hashing (used by Cassandra)
class ConsistentHash {
  constructor(nodes) {
    this.ring = [];
    this.nodeMap = {};
    nodes.forEach(node => this.addNode(node));
  }

  hash(key) {
    let h = 0;
    for (let i = 0; i < String(key).length; i++) {
      h = ((h << 5) - h) + String(key).charCodeAt(i);
      h = h & 0x7FFFFFFF;
    }
    return h % 360; // Map to a ring of 360 degrees
  }

  addNode(node) {
    // Add 3 virtual nodes per physical node
    for (let v = 0; v < 3; v++) {
      const position = this.hash(node + '-vn' + v);
      this.ring.push({ position, node });
    }
    this.ring.sort((a, b) => a.position - b.position);
  }

  getNode(key) {
    const h = this.hash(String(key));
    for (const entry of this.ring) {
      if (entry.position >= h) return entry.node;
    }
    return this.ring[0].node; // wrap around
  }
}

// Demo
console.log('=== Hash-Based Sharding (4 shards) ===');
const hashShard = new HashSharding(4);
for (let i = 1; i <= 100; i++) hashShard.insert(i, { name: 'User' + i });
console.table(hashShard.getDistribution());

console.log('\\n=== Range-Based Sharding ===');
const rangeShard = new RangeSharding([
  { min: 0, max: 25 }, { min: 26, max: 50 },
  { min: 51, max: 75 }, { min: 76, max: 100 }
]);
// Simulate hot range — most users in 1-25
for (let i = 1; i <= 20; i++) rangeShard.insert(i, {});
for (let i = 26; i <= 30; i++) rangeShard.insert(i, {});
for (let i = 51; i <= 53; i++) rangeShard.insert(i, {});
for (let i = 76; i <= 77; i++) rangeShard.insert(i, {});
console.log('Distribution (notice hot spot in shard 0):');
console.table(rangeShard.getDistribution());

console.log('\\n=== Consistent Hashing (Cassandra-style) ===');
const ch = new ConsistentHash(['NodeA', 'NodeB', 'NodeC']);
const distribution = {};
for (let i = 1; i <= 30; i++) {
  const node = ch.getNode('user-' + i);
  distribution[node] = (distribution[node] || 0) + 1;
}
console.log('Key distribution across nodes:');
Object.entries(distribution).forEach(([node, count]) => {
  console.log(\`  \${node}: \${count} keys\`);
});`,
    content: `
<h1>Database Sharding & Partitioning</h1>

<p>Sharding is how you scale databases beyond a single machine. At SDE-2/SDE-3, you're expected to choose the right sharding strategy and articulate the tradeoffs.</p>

<h2>Vertical vs Horizontal Partitioning</h2>

<pre><code>VERTICAL PARTITIONING                HORIZONTAL PARTITIONING (SHARDING)
(split by columns)                   (split by rows)

┌──────────┐                         ┌──────────────────┐
│ Users    │                         │ Users (ALL cols)  │
│──────────│                         │──────────────────│
│ id       │   ┌──────────┐         │ Shard 1: id 1-1M │
│ name     │   │ Profiles │         │ Shard 2: id 1M-2M│
│ email    │   │──────────│         │ Shard 3: id 2M-3M│
│ password │   │ id       │         └──────────────────┘
│ bio      │→  │ bio      │
│ avatar   │   │ avatar   │         Each shard has all columns
│ settings │   │ settings │         but only a subset of rows
└──────────┘   └──────────┘
</code></pre>

<h2>Sharding Strategies</h2>

<h3>1. Hash-Based Sharding</h3>
<pre><code>shard_id = hash(shard_key) % num_shards

User 12345 → hash(12345) % 4 = 1 → Shard 1
User 67890 → hash(67890) % 4 = 3 → Shard 3

Pros: Even distribution, simple
Cons: Adding/removing shards requires reshuffling ALL data
</code></pre>

<h3>2. Range-Based Sharding</h3>
<pre><code>Shard 0: user_id    1 — 1,000,000
Shard 1: user_id    1,000,001 — 2,000,000
Shard 2: user_id    2,000,001 — 3,000,000

Pros: Range queries are efficient, easy to understand
Cons: Hot spots (new users all go to the last shard)
</code></pre>

<h3>3. Directory-Based Sharding</h3>
<pre><code>┌────────────┐     ┌────────────────────┐
│ Lookup     │     │ Shards             │
│ Service    │────▶│ Shard A: US users  │
│            │     │ Shard B: EU users  │
│ user → shard│    │ Shard C: APAC users│
└────────────┘     └────────────────────┘

Pros: Flexible, any mapping logic
Cons: Lookup service is a single point of failure
</code></pre>

<h3>4. Consistent Hashing</h3>
<pre><code>        Token Ring (0 — 2^128)
            ┌──────┐
         ╱──│Node A│──╲
       ╱    └──────┘    ╲
  ┌──────┐           ┌──────┐
  │Node D│           │Node B│
  └──────┘           └──────┘
       ╲    ┌──────┐    ╱
         ╲──│Node C│──╱
            └──────┘

Each node owns a range of tokens on the ring.
Adding a node only moves keys from adjacent nodes.
Virtual nodes (vnodes) improve distribution.
</code></pre>

<table>
<tr><th>Strategy</th><th>Distribution</th><th>Range Queries</th><th>Reshuffling on Scale</th><th>Complexity</th></tr>
<tr><td>Hash-based</td><td>Even</td><td>Not supported</td><td>Full reshuffle</td><td>Low</td></tr>
<tr><td>Range-based</td><td>Can be uneven</td><td>Efficient</td><td>Minimal (split ranges)</td><td>Low</td></tr>
<tr><td>Directory-based</td><td>Custom</td><td>Depends on mapping</td><td>Update directory only</td><td>Medium</td></tr>
<tr><td>Consistent Hashing</td><td>Even (with vnodes)</td><td>Not directly</td><td>Minimal (neighbors only)</td><td>Medium</td></tr>
</table>

<h2>Cassandra's Partition Key & Token Ring</h2>

<p>Cassandra uses <strong>consistent hashing</strong> with the partition key to distribute data:</p>

<pre><code>CREATE TABLE messages (
    chat_id UUID,         -- partition key
    message_id TIMEUUID,  -- clustering key
    sender TEXT,
    body TEXT,
    PRIMARY KEY (chat_id, message_id)
);

token(chat_id) → position on ring → assigned to a node
All messages in the same chat land on the same partition
  → efficient range scans within a partition
  → chat_id determines which node owns the data
</code></pre>

<div class="warning-note">Choose partition keys carefully in Cassandra. A partition that grows unbounded (e.g., all events for a popular user) creates hot spots. Use composite partition keys like <code>(user_id, date_bucket)</code> to bound partition size.</div>

<h2>PostgreSQL Table Partitioning</h2>

<pre><code>-- RANGE partitioning (most common)
CREATE TABLE orders (
    id SERIAL, created_at DATE, amount DECIMAL
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- LIST partitioning
CREATE TABLE users (id SERIAL, region TEXT)
    PARTITION BY LIST (region);

-- HASH partitioning
CREATE TABLE events (id SERIAL, user_id INT)
    PARTITION BY HASH (user_id);
</code></pre>

<h2>MongoDB Sharding</h2>

<pre><code>┌────────┐   ┌────────┐   ┌────────┐
│ mongos │   │ mongos │   │ mongos │  ← Query routers
└───┬────┘   └───┬────┘   └───┬────┘
    │            │            │
┌───┴────────────┴────────────┴───┐
│       Config Servers (CSRS)     │  ← Metadata (chunk → shard mapping)
└───┬────────────┬────────────┬───┘
    │            │            │
┌───┴───┐   ┌───┴───┐   ┌───┴───┐
│Shard 1│   │Shard 2│   │Shard 3│  ← Each shard is a replica set
└───────┘   └───────┘   └───────┘

sh.shardCollection("mydb.users", { user_id: "hashed" })
</code></pre>

<p><strong>Shard key selection in MongoDB</strong>: Use a field with high cardinality, write distribution, and that matches your query patterns. A hashed shard key gives even distribution; a ranged key supports range queries but risks hot spots.</p>

<h2>Common Problems & Solutions</h2>

<table>
<tr><th>Problem</th><th>Cause</th><th>Solution</th></tr>
<tr><td>Hot spots</td><td>Uneven key distribution</td><td>Consistent hashing with vnodes, composite keys, salting</td></tr>
<tr><td>Rebalancing</td><td>Adding/removing shards</td><td>Consistent hashing, background migration, virtual shards</td></tr>
<tr><td>Cross-shard queries</td><td>Data needed from multiple shards</td><td>Scatter-gather, denormalization, shared lookup tables</td></tr>
<tr><td>Cross-shard joins</td><td>Relational queries across shards</td><td>Denormalize, use application-level joins, CQRS</td></tr>
<tr><td>Distributed transactions</td><td>ACID across shards</td><td>2PC, Saga pattern, eventual consistency</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: How would you shard a user table for 100M users?</div>
<div class="qa-a"><strong>Step 1 — Choose the shard key:</strong> <code>user_id</code> (high cardinality, evenly distributed, most queries include it).<br/><br/><strong>Step 2 — Choose the strategy:</strong> Hash-based sharding with consistent hashing. <code>shard = hash(user_id) % N</code>. This gives even distribution and avoids hot spots from sequential IDs.<br/><br/><strong>Step 3 — Determine shard count:</strong> If each shard handles ~10M users with acceptable latency, start with 16 shards (giving room to grow). Use consistent hashing so adding shards only moves ~1/N of the data.<br/><br/><strong>Step 4 — Handle edge cases:</strong><br/>- Cross-shard queries (e.g., "find all users by email"): Build a secondary lookup table/index <code>email → user_id</code><br/>- Celebrity users (hot partitions): Application-level caching (Redis) for frequently accessed profiles<br/>- Transactions across users on different shards: Use Saga pattern or event-driven eventual consistency<br/><br/><strong>Step 5 — Operational:</strong> Use a shard proxy/router, implement health checks per shard, set up monitoring for shard sizes and query latencies.</div>
</div>
`
  },

  {
    id: 'replication',
    title: 'Database Replication Strategies',
    category: 'System Design',
    starterCode: `// Database Replication Simulator
// ================================

class ReplicationCluster {
  constructor(name, mode) {
    this.name = name;
    this.mode = mode; // 'sync' | 'async' | 'multi-master'
    this.primary = { id: 'Primary', data: {}, wal: [] };
    this.replicas = [
      { id: 'Replica-1', data: {}, lag: 0 },
      { id: 'Replica-2', data: {}, lag: 0 }
    ];
    this.writeCount = 0;
  }

  write(key, value) {
    this.writeCount++;
    const walEntry = { seq: this.writeCount, key, value, ts: Date.now() };
    this.primary.data[key] = value;
    this.primary.wal.push(walEntry);

    if (this.mode === 'sync') {
      // Synchronous: wait for ALL replicas before acknowledging
      this.replicas.forEach(r => {
        r.data[key] = value;
        r.lag = 0;
      });
      console.log(\`[SYNC] Write \${key}=\${value} — committed to primary + all replicas\`);
    } else if (this.mode === 'async') {
      // Async: acknowledge immediately, replicas catch up later
      this.replicas.forEach(r => r.lag++);
      console.log(\`[ASYNC] Write \${key}=\${value} — committed to primary only\`);
      console.log(\`  Replicas are \${this.replicas[0].lag} write(s) behind\`);
    }
  }

  replicaCatchUp() {
    if (this.mode === 'async') {
      console.log('\\n--- Replica catch-up (applying WAL) ---');
      this.replicas.forEach(r => {
        const behind = this.primary.wal.slice(-r.lag);
        behind.forEach(entry => { r.data[entry.key] = entry.value; });
        console.log(\`  \${r.id}: applied \${r.lag} entries, now in sync\`);
        r.lag = 0;
      });
    }
  }

  readFromReplica(replicaIdx, key) {
    const r = this.replicas[replicaIdx];
    const value = r.data[key];
    const primaryValue = this.primary.data[key];
    const isStale = value !== primaryValue;
    console.log(\`Read from \${r.id}: \${key}=\${value}\${isStale ? ' (STALE! Primary has ' + primaryValue + ')' : ' (up-to-date)'}\`);
    return value;
  }
}

// 1. Synchronous Replication (PostgreSQL sync mode)
console.log('=== Synchronous Replication (PostgreSQL) ===');
const syncCluster = new ReplicationCluster('PG-Sync', 'sync');
syncCluster.write('balance', 1000);
syncCluster.write('balance', 1500);
syncCluster.readFromReplica(0, 'balance');

// 2. Asynchronous Replication (PostgreSQL default)
console.log('\\n=== Asynchronous Replication ===');
const asyncCluster = new ReplicationCluster('PG-Async', 'async');
asyncCluster.write('balance', 1000);
asyncCluster.write('balance', 1500);
asyncCluster.write('balance', 2000);
console.log('\\nReading from stale replica:');
asyncCluster.readFromReplica(0, 'balance');
asyncCluster.replicaCatchUp();
console.log('\\nReading after catch-up:');
asyncCluster.readFromReplica(0, 'balance');

// 3. MongoDB Replica Set Election Simulation
console.log('\\n=== MongoDB Replica Set Election ===');
class MongoReplicaSet {
  constructor() {
    this.members = [
      { id: 'mongo-1', role: 'PRIMARY', priority: 2, alive: true },
      { id: 'mongo-2', role: 'SECONDARY', priority: 1, alive: true },
      { id: 'mongo-3', role: 'SECONDARY', priority: 1, alive: true }
    ];
  }
  primaryDown() {
    const primary = this.members.find(m => m.role === 'PRIMARY');
    primary.alive = false;
    primary.role = 'DOWN';
    console.log(\`\${primary.id} went DOWN!\`);
    this.election();
  }
  election() {
    console.log('Election triggered...');
    const candidates = this.members.filter(m => m.alive && m.role !== 'ARBITER');
    const winner = candidates.sort((a, b) => b.priority - a.priority)[0];
    winner.role = 'PRIMARY';
    console.log(\`\${winner.id} elected as new PRIMARY (priority: \${winner.priority})\`);
    this.members.filter(m => m.alive && m !== winner).forEach(m => m.role = 'SECONDARY');
    this.members.forEach(m => console.log(\`  \${m.id}: \${m.role}\`));
  }
}
const rs = new MongoReplicaSet();
rs.primaryDown();`,
    content: `
<h1>Database Replication Strategies</h1>

<p>Replication is how distributed databases achieve fault tolerance and read scalability. Understanding replication models is critical for SDE-2+ system design interviews.</p>

<h2>Replication Topologies</h2>

<pre><code>MASTER-SLAVE (PRIMARY-REPLICA)        MULTI-MASTER
┌────────┐                            ┌────────┐   ┌────────┐
│ Primary│──writes──▶                 │Master 1│◀──▶│Master 2│
│  (RW)  │                            │  (RW)  │   │  (RW)  │
└───┬────┘                            └───┬────┘   └───┬────┘
    │ replication                          │            │
    ├──────────┐                      ┌───┴────────────┴───┐
┌───┴───┐  ┌───┴───┐                 │  Conflict Resolution │
│Replica│  │Replica│                 │  (last-write-wins,   │
│  (RO) │  │  (RO) │                 │   vector clocks)     │
└───────┘  └───────┘                 └─────────────────────┘
</code></pre>

<h2>Synchronous vs Asynchronous Replication</h2>

<table>
<tr><th>Aspect</th><th>Synchronous</th><th>Asynchronous</th><th>Semi-Synchronous</th></tr>
<tr><td>Write latency</td><td>Higher (wait for replicas)</td><td>Lower (primary only)</td><td>Medium (wait for 1 replica)</td></tr>
<tr><td>Data durability</td><td>Strongest</td><td>Risk of data loss</td><td>Good balance</td></tr>
<tr><td>Availability</td><td>Lower (blocked if replica down)</td><td>Higher</td><td>Moderate</td></tr>
<tr><td>Consistency</td><td>Strong</td><td>Eventual</td><td>Strong for acked writes</td></tr>
<tr><td>Use case</td><td>Financial systems</td><td>Analytics replicas</td><td>Most production systems</td></tr>
</table>

<h2>PostgreSQL Streaming Replication</h2>

<pre><code>┌───────────┐    WAL stream     ┌───────────┐
│  Primary  │──────────────────▶│  Standby  │
│           │                    │(hot/warm) │
│ WAL Writer│                    │WAL Receiver│
└───────────┘                    └───────────┘

Configuration (postgresql.conf):
  wal_level = replica
  max_wal_senders = 3
  synchronous_commit = on         # sync mode
  synchronous_standby_names = '*' # which standbys

Hot Standby: accepts read queries while replicating
Warm Standby: only replicates, no reads
</code></pre>

<ul>
<li><strong>Streaming replication</strong>: Continuous WAL shipping via TCP connection</li>
<li><strong>Logical replication</strong>: Publishes specific tables/changes (selective replication)</li>
<li><strong>Failover</strong>: Use pg_promote() or tools like Patroni for automatic failover</li>
</ul>

<h2>MongoDB Replica Sets</h2>

<pre><code>┌─────────┐     ┌─────────────┐     ┌─────────────┐
│ PRIMARY │────▶│ SECONDARY 1 │     │ SECONDARY 2 │
│ (votes) │     │   (votes)   │     │   (votes)   │
└─────────┘     └─────────────┘     └─────────────┘
                      │
               ┌──────┴──────┐
               │   Election  │
               │  (majority  │
               │   needed)   │
               └─────────────┘

Read Preferences:
  primary           → always read from primary (default, strong consistency)
  primaryPreferred  → primary if available, else secondary
  secondary         → only read from secondaries (eventual consistency)
  secondaryPreferred→ secondary if available, else primary
  nearest           → lowest network latency member
</code></pre>

<ul>
<li><strong>Elections</strong>: Triggered when primary is unreachable. Needs majority vote (~10-12 seconds)</li>
<li><strong>Write concern</strong>: <code>w: "majority"</code> ensures write is acknowledged by majority of nodes</li>
<li><strong>Oplog</strong>: Capped collection of operations replicated to secondaries</li>
</ul>

<h2>Cassandra Replication</h2>

<pre><code>CREATE KEYSPACE messaging WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'us-east': 3,     -- 3 replicas in US East
  'eu-west': 2      -- 2 replicas in EU West
};

Token Ring with RF=3:
  Write to key "user-42":
  1. Coordinator receives write
  2. hash("user-42") → token 750
  3. Find 3 consecutive nodes on ring that own token 750+
  4. Write to all 3 replicas
  5. Return success based on consistency level

Repair mechanisms:
  - Read repair: fix inconsistencies during reads
  - Anti-entropy repair: periodic merkle-tree-based repair (nodetool repair)
  - Hinted handoff: store writes for downed nodes, deliver when they recover
</code></pre>

<h2>Redis Replication</h2>

<pre><code>REDIS SENTINEL                      REDIS CLUSTER
┌──────────┐                        ┌──────────┐  ┌──────────┐
│ Sentinel │ monitors all           │ Master 1 │──│ Replica 1│
│ (3 nodes)│                        │(slots 0- │  └──────────┘
└──────────┘                        │   5460)  │
      │                             └──────────┘
┌─────┴─────┐                       ┌──────────┐  ┌──────────┐
│  Master   │──▶│ Replica │         │ Master 2 │──│ Replica 2│
└───────────┘   └─────────┘         │(slots    │  └──────────┘
                                    │5461-10922│
Sentinel: single master,           └──────────┘
monitors + auto-failover           ┌──────────┐  ┌──────────┐
                                    │ Master 3 │──│ Replica 3│
Cluster: multi-master,             │(slots    │  └──────────┘
hash slots (16384 total),          │10923-    │
auto-sharding + replication        │  16383)  │
                                    └──────────┘
</code></pre>

<table>
<tr><th>Feature</th><th>Redis Sentinel</th><th>Redis Cluster</th></tr>
<tr><td>Sharding</td><td>No (single master)</td><td>Yes (16384 hash slots)</td></tr>
<tr><td>Auto-failover</td><td>Yes (Sentinel manages)</td><td>Yes (built-in)</td></tr>
<tr><td>Multi-key ops</td><td>All keys on one node</td><td>Only within same hash slot</td></tr>
<tr><td>Max data size</td><td>Single node memory</td><td>Sum of all master memory</td></tr>
<tr><td>Best for</td><td>HA for single instance</td><td>Scaling beyond single node</td></tr>
</table>

<h2>Conflict Resolution in Multi-Master</h2>

<ul>
<li><strong>Last-Write-Wins (LWW)</strong>: Cassandra's default — highest timestamp wins (can lose writes)</li>
<li><strong>Vector Clocks</strong>: Track causal ordering across nodes (DynamoDB uses this concept)</li>
<li><strong>CRDTs</strong>: Conflict-free Replicated Data Types — mathematically guaranteed convergence</li>
<li><strong>Application-level resolution</strong>: Let the application merge conflicting writes (custom logic)</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: How do you handle replication lag?</div>
<div class="qa-a"><strong>Detection:</strong> Monitor replication lag metrics (PostgreSQL: <code>pg_stat_replication.replay_lag</code>, MongoDB: <code>rs.printReplicationInfo()</code>, Redis: <code>INFO replication → master_repl_offset vs slave_repl_offset</code>).<br/><br/><strong>Mitigation strategies:</strong><br/>1. <strong>Read-your-writes consistency</strong>: After a write, read from primary for that user's session (or use sticky sessions)<br/>2. <strong>Monotonic reads</strong>: Pin a user to a specific replica to avoid reading older data after newer<br/>3. <strong>Write quorum</strong>: In Cassandra, use <code>QUORUM</code> writes + reads to guarantee seeing latest write<br/>4. <strong>Synchronous replication</strong> for critical data (at the cost of write latency)<br/>5. <strong>Application-level versioning</strong>: Include a version/timestamp in responses so clients can detect stale reads<br/><br/><strong>Real-world approach:</strong> Use async replication for read scalability but route writes and immediately subsequent reads to the primary. For Cassandra, tune consistency levels per query based on requirements.</div>
</div>
`
  },

  // ==================== SCALABILITY ====================
  {
    id: 'caching-strategies',
    title: 'Caching Strategies',
    category: 'Scalability',
    starterCode: `// Caching Strategies Simulator
// =============================

class CacheSimulator {
  constructor(strategy, ttlMs = 5000) {
    this.strategy = strategy;
    this.cache = new Map();
    this.db = new Map();
    this.stats = { hits: 0, misses: 0, dbReads: 0, dbWrites: 0 };
    this.ttlMs = ttlMs;
  }

  // Seed the DB
  seedDB(data) {
    Object.entries(data).forEach(([k, v]) => this.db.set(k, v));
  }

  // ---- Cache-Aside (Lazy Loading) ----
  cacheAsideRead(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return { value: this.cache.get(key).value, source: 'cache' };
    }
    this.stats.misses++;
    this.stats.dbReads++;
    const value = this.db.get(key);
    if (value !== undefined) {
      this.cache.set(key, { value, expiry: Date.now() + this.ttlMs });
    }
    return { value, source: 'db' };
  }

  cacheAsideWrite(key, value) {
    this.stats.dbWrites++;
    this.db.set(key, value);
    this.cache.delete(key); // Invalidate cache
    return { written: true, cacheInvalidated: true };
  }

  // ---- Write-Through ----
  writeThroughWrite(key, value) {
    this.stats.dbWrites++;
    this.db.set(key, value);
    this.cache.set(key, { value, expiry: Date.now() + this.ttlMs });
    return { written: true, cachedImmediately: true };
  }

  // ---- Write-Behind (Write-Back) ----
  writeBehindWrite(key, value) {
    this.cache.set(key, { value, expiry: Date.now() + this.ttlMs, dirty: true });
    // DB write happens later (async)
    return { written: false, cachedOnly: true, dbWritePending: true };
  }

  flushDirtyEntries() {
    let flushed = 0;
    for (const [key, entry] of this.cache) {
      if (entry.dirty) {
        this.db.set(key, entry.value);
        entry.dirty = false;
        this.stats.dbWrites++;
        flushed++;
      }
    }
    return { flushed };
  }

  getStats() { return { ...this.stats, cacheSize: this.cache.size }; }
}

// Demo: Cache-Aside
console.log('=== Cache-Aside (Lazy Loading) ===');
const ca = new CacheSimulator('cache-aside');
ca.seedDB({ user1: 'Alice', user2: 'Bob', user3: 'Charlie' });
console.log('Read user1:', ca.cacheAsideRead('user1')); // miss → DB
console.log('Read user1:', ca.cacheAsideRead('user1')); // hit → cache
console.log('Write user1:', ca.cacheAsideWrite('user1', 'Alice Updated'));
console.log('Read user1:', ca.cacheAsideRead('user1')); // miss → DB (invalidated)
console.log('Stats:', ca.getStats());

// Demo: Write-Through
console.log('\\n=== Write-Through ===');
const wt = new CacheSimulator('write-through');
wt.seedDB({ user1: 'Alice' });
console.log('Write:', wt.writeThroughWrite('user1', 'Alice v2'));
console.log('Read:', wt.cacheAsideRead('user1')); // hit (was cached on write)
console.log('Stats:', wt.getStats());

// Demo: Write-Behind
console.log('\\n=== Write-Behind (Write-Back) ===');
const wb = new CacheSimulator('write-behind');
console.log('Write (cache only):', wb.writeBehindWrite('user1', 'Fast Write'));
console.log('DB value before flush:', wb.db.get('user1')); // undefined!
console.log('Flush to DB:', wb.flushDirtyEntries());
console.log('DB value after flush:', wb.db.get('user1')); // now persisted

// LRU Eviction Simulation
console.log('\\n=== LRU Eviction Policy ===');
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val); // Move to end (most recent)
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
      console.log(\`  Evicted: \${oldest}\`);
    }
  }
}
const lru = new LRUCache(3);
['A', 'B', 'C', 'D', 'E'].forEach(k => {
  lru.put(k, k + '-value');
  console.log(\`Put \${k} → cache: [\${[...lru.cache.keys()].join(', ')}]\`);
});`,
    content: `
<h1>Caching Strategies</h1>

<p>Caching is the single most impactful optimization in system design. At SDE-2 level, you must know not just <em>when</em> to cache but <em>which strategy</em> to use and how to handle the hard problem: invalidation.</p>

<h2>Caching Strategies Overview</h2>

<pre><code>Cache-Aside                 Write-Through              Write-Behind
(Lazy Loading)              (Sync write)               (Async write)

App──▶Cache?                App──▶Cache──▶DB           App──▶Cache───▶(later)DB
 │     miss│                   write both sync           write cache only,
 ▼         ▼                                             flush to DB async
 DB──▶populate cache

Read-Through                Refresh-Ahead
(Cache manages DB reads)    (Proactive refresh)

App──▶Cache──▶DB            Cache monitors TTL
  (cache fetches            and refreshes BEFORE
   from DB on miss)         expiry if item is hot
</code></pre>

<table>
<tr><th>Strategy</th><th>Consistency</th><th>Read Latency</th><th>Write Latency</th><th>Best For</th></tr>
<tr><td>Cache-Aside</td><td>Eventual (stale on write)</td><td>Miss: high, Hit: low</td><td>Low (DB only)</td><td>Read-heavy, general purpose</td></tr>
<tr><td>Write-Through</td><td>Strong (always in sync)</td><td>Always low (cached)</td><td>Higher (write both)</td><td>Read-after-write consistency</td></tr>
<tr><td>Write-Behind</td><td>Eventual</td><td>Low</td><td>Very low (cache only)</td><td>Write-heavy workloads</td></tr>
<tr><td>Read-Through</td><td>Similar to cache-aside</td><td>Miss: high, Hit: low</td><td>N/A</td><td>Simplifies app code</td></tr>
<tr><td>Refresh-Ahead</td><td>Good (proactive)</td><td>Usually low</td><td>N/A</td><td>Predictable hot keys</td></tr>
</table>

<h2>Redis as Cache — Deep Dive</h2>

<h3>Eviction Policies</h3>
<table>
<tr><th>Policy</th><th>Behavior</th><th>Use Case</th></tr>
<tr><td><code>noeviction</code></td><td>Return error on memory limit</td><td>When data loss is unacceptable</td></tr>
<tr><td><code>allkeys-lru</code></td><td>Evict least recently used key</td><td>General-purpose caching</td></tr>
<tr><td><code>allkeys-lfu</code></td><td>Evict least frequently used key</td><td>Power-law access patterns</td></tr>
<tr><td><code>volatile-lru</code></td><td>LRU among keys with TTL</td><td>Mix of cache + persistent keys</td></tr>
<tr><td><code>volatile-ttl</code></td><td>Evict keys closest to expiry</td><td>When TTL reflects importance</td></tr>
<tr><td><code>allkeys-random</code></td><td>Random eviction</td><td>Uniform access patterns</td></tr>
</table>

<h3>TTL Best Practices</h3>
<pre><code># Set TTL on cache entries
SET user:12345 "{\\"name\\":\\"Alice\\"}" EX 3600    # 1 hour TTL
SET session:abc "data" PX 1800000               # 30 min in ms

# Sliding window TTL (reset on access)
GET user:12345
EXPIRE user:12345 3600    # Reset TTL on read
</code></pre>

<h2>Cache Invalidation Patterns</h2>

<ol>
<li><strong>TTL-based</strong>: Set expiry time. Simple but stale data exists until TTL expires.</li>
<li><strong>Event-driven</strong>: Invalidate cache on write events (Kafka, CDC, DB triggers).</li>
<li><strong>Version-based</strong>: Include version in cache key. New version = new cache entry.</li>
<li><strong>Active invalidation</strong>: Application explicitly deletes cache on write.</li>
</ol>

<pre><code>Event-Driven Invalidation (recommended for microservices):

Write to DB ──▶ Publish event (Kafka) ──▶ Cache Invalidation Service
                                              │
                                         DELETE from Redis

This decouples write path from cache management.
At Habuild, Kafka events triggered cache invalidation for
user profile changes across multiple services.
</code></pre>

<h2>Cache Stampede / Thundering Herd</h2>

<p>When a popular cache key expires, hundreds of requests simultaneously hit the database:</p>

<pre><code>Before TTL expires:          After TTL expires (stampede!):

Cache: user:hot ✓            Cache: user:hot ✗ (expired)
   │                            │ │ │ │ │ │ (100 requests)
   ▼                            ▼ ▼ ▼ ▼ ▼ ▼
 (served from cache)          DB gets 100 identical queries!
</code></pre>

<h3>Solutions</h3>
<table>
<tr><th>Solution</th><th>How It Works</th><th>Complexity</th></tr>
<tr><td><strong>Mutex/Lock</strong></td><td>First request acquires lock, others wait for cache fill</td><td>Medium</td></tr>
<tr><td><strong>Stale-while-revalidate</strong></td><td>Serve stale data while one request refreshes in background</td><td>Medium</td></tr>
<tr><td><strong>Probabilistic early expiry</strong></td><td>Each request has a small chance of refreshing before TTL</td><td>Low</td></tr>
<tr><td><strong>Pre-warming</strong></td><td>Proactively refresh hot keys before they expire</td><td>Medium</td></tr>
</table>

<pre><code>// Mutex-based stampede prevention (pseudocode)
async function getWithLock(key) {
  let value = await redis.get(key);
  if (value) return JSON.parse(value);

  const lockKey = \\\`lock:\${key}\\\`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);

  if (acquired) {
    // I'm the one to refresh
    value = await db.query(key);
    await redis.setex(key, 3600, JSON.stringify(value));
    await redis.del(lockKey);
    return value;
  } else {
    // Wait and retry
    await sleep(50);
    return getWithLock(key);
  }
}
</code></pre>

<h2>Caching Layers</h2>

<pre><code>Request Flow Through Caching Layers:

Client ──▶ CDN Cache ──▶ API Gateway Cache ──▶ App Cache (Redis) ──▶ DB
  │            │               │                     │
  │         Static assets   Rate limit data      Application data
  │         (images, JS)    API responses        Query results
  │
  └── Browser Cache (HTTP Cache-Control headers)

Cache-Control: public, max-age=3600, stale-while-revalidate=60
</code></pre>

<h2>Real Example: Habuild Automated Chat Responses</h2>

<p>At Habuild, the automated messaging system processed <strong>800K+ daily WhatsApp messages</strong>. Caching was critical:</p>

<ul>
<li><strong>Strategy</strong>: Cache-Aside with Redis for template responses and user state</li>
<li><strong>Hot data</strong>: Active chat sessions, message templates, user preferences</li>
<li><strong>TTL</strong>: 15 minutes for active sessions, 1 hour for templates</li>
<li><strong>Invalidation</strong>: Event-driven via Kafka when templates were updated</li>
<li><strong>Result</strong>: Reduced DB reads by ~80%, sub-10ms response for cached templates</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: What's the hardest problem in caching?</div>
<div class="qa-a"><strong>Cache invalidation</strong> is famously one of the two hard problems in computer science (along with naming things and off-by-one errors).<br/><br/>The core challenge: <strong>when do you invalidate, and how do you ensure consistency?</strong><br/><br/>1. <strong>TTL too short</strong>: High miss rate, more DB load<br/>2. <strong>TTL too long</strong>: Users see stale data<br/>3. <strong>Active invalidation</strong>: What if the invalidation message is lost? (Use Kafka for reliable delivery)<br/>4. <strong>Race conditions</strong>: Write happens, invalidation sent, but a concurrent read re-populates cache with old value before the write commits<br/><br/><strong>Best practice</strong>: Use event-driven invalidation (CDC or Kafka) + short TTLs as a safety net. Accept that some staleness is OK for most use cases.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How do you handle cache stampede?</div>
<div class="qa-a">Use a <strong>mutex/lock pattern</strong>: When a cache key expires, the first request acquires a distributed lock (Redis SETNX), fetches from DB, and repopulates cache. Other requests either wait briefly and retry, or get served slightly stale data (stale-while-revalidate pattern).<br/><br/>For extreme cases, use <strong>probabilistic early expiry</strong>: each request independently decides to refresh the cache slightly before TTL expires, spreading the refresh load. Combined with <strong>pre-warming</strong> for known hot keys (e.g., cron job that refreshes top 1000 keys every 5 minutes), you can virtually eliminate stampedes.</div>
</div>
`
  },

  {
    id: 'load-balancing',
    title: 'Load Balancing & Consistent Hashing',
    category: 'Scalability',
    starterCode: `// Load Balancing Algorithms & Consistent Hashing
// ===============================================

// 1. Round Robin
class RoundRobin {
  constructor(servers) { this.servers = servers; this.idx = 0; }
  next() {
    const server = this.servers[this.idx % this.servers.length];
    this.idx++;
    return server;
  }
}

// 2. Weighted Round Robin
class WeightedRoundRobin {
  constructor(servers) {
    this.pool = [];
    servers.forEach(s => {
      for (let i = 0; i < s.weight; i++) this.pool.push(s.name);
    });
    this.idx = 0;
  }
  next() {
    const server = this.pool[this.idx % this.pool.length];
    this.idx++;
    return server;
  }
}

// 3. Least Connections
class LeastConnections {
  constructor(servers) {
    this.servers = servers.map(s => ({ name: s, connections: 0 }));
  }
  next() {
    const server = this.servers.reduce((min, s) =>
      s.connections < min.connections ? s : min
    );
    server.connections++;
    return server.name;
  }
  release(name) {
    const s = this.servers.find(s => s.name === name);
    if (s) s.connections = Math.max(0, s.connections - 1);
  }
}

// 4. Consistent Hashing with Virtual Nodes
class ConsistentHashLB {
  constructor(servers, vnodes = 150) {
    this.ring = new Map();
    this.sortedKeys = [];
    servers.forEach(s => {
      for (let i = 0; i < vnodes; i++) {
        const hash = this.hash(s + ':' + i);
        this.ring.set(hash, s);
        this.sortedKeys.push(hash);
      }
    });
    this.sortedKeys.sort((a, b) => a - b);
  }

  hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) & 0x7FFFFFFF;
    }
    return h;
  }

  getServer(key) {
    const h = this.hash(key);
    for (const k of this.sortedKeys) {
      if (k >= h) return this.ring.get(k);
    }
    return this.ring.get(this.sortedKeys[0]);
  }
}

// Demo
console.log('=== Round Robin ===');
const rr = new RoundRobin(['Server-A', 'Server-B', 'Server-C']);
for (let i = 0; i < 6; i++) console.log(\`  Request \${i+1} → \${rr.next()}\`);

console.log('\\n=== Weighted Round Robin ===');
const wrr = new WeightedRoundRobin([
  { name: 'Big-Server', weight: 3 },
  { name: 'Small-Server', weight: 1 }
]);
const wrrDist = {};
for (let i = 0; i < 8; i++) {
  const s = wrr.next();
  wrrDist[s] = (wrrDist[s] || 0) + 1;
}
console.log('  Distribution:', wrrDist);

console.log('\\n=== Least Connections ===');
const lc = new LeastConnections(['S1', 'S2', 'S3']);
console.log('  ' + lc.next() + ' (conn=1)');
console.log('  ' + lc.next() + ' (conn=1)');
console.log('  ' + lc.next() + ' (conn=1)');
lc.release('S1');
console.log('  After S1 release: ' + lc.next() + ' (picks least)');

console.log('\\n=== Consistent Hashing ===');
const ch = new ConsistentHashLB(['Node-A', 'Node-B', 'Node-C']);
const dist = {};
for (let i = 0; i < 100; i++) {
  const node = ch.getServer('request-' + i);
  dist[node] = (dist[node] || 0) + 1;
}
console.log('  Distribution across 100 requests:');
Object.entries(dist).forEach(([k, v]) =>
  console.log(\`    \${k}: \${v} requests (\${v}%)\`)
);`,
    content: `
<h1>Load Balancing & Consistent Hashing</h1>

<p>Load balancing is the entry point of any scalable system. SDE-2+ interviews expect you to know not just <em>what</em> a load balancer does but the specific algorithms and when to use each one.</p>

<h2>Layer 4 vs Layer 7 Load Balancing</h2>

<pre><code>Layer 4 (Transport)                Layer 7 (Application)
┌─────────────────┐               ┌──────────────────┐
│ Sees: IP + Port │               │ Sees: Full HTTP   │
│ Fast (no parse) │               │ URL, headers,     │
│ TCP/UDP level   │               │ cookies, body     │
│ No content      │               │ Content-aware     │
│ awareness       │               │ routing           │
└─────────────────┘               └──────────────────┘

L4: Forward TCP packets without inspecting content
    → NLB (AWS), HAProxy TCP mode

L7: Parse HTTP, route based on URL path, headers, cookies
    → ALB (AWS), NGINX, HAProxy HTTP mode, Envoy
</code></pre>

<table>
<tr><th>Feature</th><th>Layer 4</th><th>Layer 7</th></tr>
<tr><td>Speed</td><td>Faster (no deep inspection)</td><td>Slower (parses HTTP)</td></tr>
<tr><td>Routing logic</td><td>IP + port only</td><td>URL path, headers, cookies, query params</td></tr>
<tr><td>SSL termination</td><td>No (pass-through)</td><td>Yes (offload SSL at LB)</td></tr>
<tr><td>Sticky sessions</td><td>IP-based only</td><td>Cookie-based (more reliable)</td></tr>
<tr><td>WebSocket support</td><td>Yes (TCP passthrough)</td><td>Yes (upgrade support)</td></tr>
<tr><td>Use case</td><td>High throughput, non-HTTP</td><td>HTTP APIs, microservices</td></tr>
</table>

<h2>Load Balancing Algorithms</h2>

<table>
<tr><th>Algorithm</th><th>How It Works</th><th>Pros</th><th>Cons</th></tr>
<tr><td><strong>Round Robin</strong></td><td>Cycle through servers sequentially</td><td>Simple, even distribution</td><td>Ignores server capacity and load</td></tr>
<tr><td><strong>Weighted RR</strong></td><td>RR with weights per server</td><td>Accounts for server capacity</td><td>Doesn't adapt to real-time load</td></tr>
<tr><td><strong>Least Connections</strong></td><td>Route to server with fewest active connections</td><td>Adapts to real load</td><td>Slightly more overhead</td></tr>
<tr><td><strong>IP Hash</strong></td><td>Hash client IP to pick server</td><td>Sticky without cookies</td><td>Uneven if IP distribution skewed</td></tr>
<tr><td><strong>Random</strong></td><td>Random server selection</td><td>Simplest implementation</td><td>Can be uneven for small N</td></tr>
<tr><td><strong>Least Response Time</strong></td><td>Route to fastest-responding server</td><td>Best user experience</td><td>Requires health monitoring</td></tr>
</table>

<h2>Consistent Hashing — Deep Dive</h2>

<pre><code>Traditional Hashing Problem:
  server = hash(key) % N
  Adding a server (N → N+1) remaps almost ALL keys!

Consistent Hashing:
  Arrange servers on a hash ring (0 → 2^32)
  Each key maps to the next server clockwise on the ring

      0°
      │
  ┌───┼───────────── Node A (45°)
  │   │              ╱
  │   │            ╱
  │   │          ╱
  Node D (315°) ·─── Key "user:42" (hash=60°) → goes to Node B
  │   │          ╲
  │   │            ╲
  │   │              ╲
  └───┼───────────── Node B (135°)  ← owns this key
      │
      │
      Node C (225°)
      │
     180°

Adding Node E at 90°:
  Only keys between 45° and 90° move (from Node B to Node E)
  All other keys stay put! (~1/N keys move instead of all)
</code></pre>

<h3>Virtual Nodes (vnodes)</h3>

<pre><code>Problem: With few physical nodes, distribution is uneven.
Solution: Each physical node gets multiple virtual positions on the ring.

Physical Node A → vnode A-1 (30°), A-2 (120°), A-3 (250°)
Physical Node B → vnode B-1 (75°), B-2 (180°), B-3 (310°)

More vnodes = more even distribution
Typical: 100-200 vnodes per physical node

Used by: Cassandra (token ring), DynamoDB, Memcached
</code></pre>

<h2>How Kafka Uses Partitioning</h2>

<pre><code>Kafka Topic: "user-events" (6 partitions)

Producer sends: { key: "user-42", value: "..." }
  partition = hash(key) % num_partitions
  partition = hash("user-42") % 6 = 3

┌──────────┐ ┌──────────┐ ┌──────────┐
│Partition 0│ │Partition 1│ │Partition 2│
│ Broker 1  │ │ Broker 2  │ │ Broker 1  │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│Partition 3│ │Partition 4│ │Partition 5│
│ Broker 3  │ │ Broker 2  │ │ Broker 3  │
└──────────┘ └──────────┘ └──────────┘

Same key always goes to same partition
  → Ordering guaranteed per key
  → Consumer groups: each partition consumed by exactly one consumer
</code></pre>

<h2>AWS Load Balancers Comparison</h2>

<table>
<tr><th>Feature</th><th>ALB</th><th>NLB</th><th>CLB (Legacy)</th></tr>
<tr><td>Layer</td><td>7 (HTTP/HTTPS)</td><td>4 (TCP/UDP/TLS)</td><td>4 + 7</td></tr>
<tr><td>Latency</td><td>~ms</td><td>~microseconds</td><td>~ms</td></tr>
<tr><td>Path-based routing</td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>WebSocket</td><td>Yes</td><td>Yes (TCP)</td><td>No</td></tr>
<tr><td>Static IP</td><td>No</td><td>Yes (Elastic IP)</td><td>No</td></tr>
<tr><td>gRPC</td><td>Yes</td><td>Yes (TCP)</td><td>No</td></tr>
<tr><td>Best for</td><td>HTTP APIs, microservices</td><td>High throughput, gaming, IoT</td><td>Legacy apps</td></tr>
</table>

<h2>Health Checks & Operational Patterns</h2>

<ul>
<li><strong>Health checks</strong>: LB periodically pings backends (HTTP GET /health). Unhealthy nodes are removed from the pool.</li>
<li><strong>Connection draining</strong>: When removing a server, allow in-flight requests to complete (typically 30s-300s).</li>
<li><strong>Sticky sessions</strong>: Route same user to same server (via cookie or IP hash). Needed for stateful apps but hurts scalability.</li>
<li><strong>Circuit breaking</strong>: Stop sending traffic to a server that's failing (different from health checks — faster reaction).</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: When would you use Layer 4 vs Layer 7 load balancing?</div>
<div class="qa-a"><strong>Layer 4 (NLB)</strong>: Use when you need ultra-low latency, high throughput (millions of requests/sec), or are handling non-HTTP protocols (gRPC streaming, raw TCP, gaming). Also when you need static IPs or AWS PrivateLink.<br/><br/><strong>Layer 7 (ALB)</strong>: Use for HTTP/HTTPS APIs where you need content-based routing (path routing to different microservices: <code>/api/users → user-service</code>, <code>/api/orders → order-service</code>), SSL termination, authentication integration, or request transformation.<br/><br/><strong>Combined</strong>: Many architectures use NLB in front of ALB — NLB provides static IP + TLS passthrough, ALB handles HTTP routing.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Explain consistent hashing with virtual nodes.</div>
<div class="qa-a">Consistent hashing maps both servers and keys onto a circular hash space (ring). Each key is assigned to the next server clockwise on the ring. This means adding or removing a server only affects keys in its adjacent range (~1/N of total keys), unlike modular hashing where adding a server remaps almost everything.<br/><br/><strong>Problem with basic consistent hashing</strong>: With few servers, the ring positions can be uneven, leading to some servers handling much more data than others.<br/><br/><strong>Virtual nodes solve this</strong>: Each physical server is mapped to 100-200 positions on the ring (virtual nodes). This creates a more uniform distribution. When a physical node goes down, its load is spread across many other nodes (not just its neighbor). Cassandra uses this approach — each node owns multiple token ranges, and you can see this with <code>nodetool ring</code>.</div>
</div>
`
  },

  {
    id: 'scaling-patterns',
    title: 'Scaling Patterns & Architecture',
    category: 'Scalability',
    starterCode: `// Scaling Patterns Demonstrations
// ================================

// 1. Connection Pool Simulator
class ConnectionPool {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.pool = [];
    this.waiting = [];
    this.stats = { acquired: 0, released: 0, waits: 0, timeouts: 0 };
  }

  async acquire() {
    if (this.pool.length < this.maxSize) {
      const conn = { id: this.stats.acquired + 1, createdAt: Date.now() };
      this.pool.push(conn);
      this.stats.acquired++;
      return conn;
    }
    this.stats.waits++;
    // Pool exhausted — wait
    console.log(\`  Pool full (\${this.pool.length}/\${this.maxSize}), request waiting...\`);
    return null;
  }

  release(conn) {
    this.pool = this.pool.filter(c => c.id !== conn.id);
    this.stats.released++;
  }

  getStatus() {
    return {
      active: this.pool.length,
      max: this.maxSize,
      totalAcquired: this.stats.acquired,
      waits: this.stats.waits
    };
  }
}

// 2. CQRS Pattern Demo
class CQRSSystem {
  constructor() {
    // Command (write) model — normalized
    this.writeDB = { orders: [], inventory: [] };
    // Query (read) model — denormalized for fast reads
    this.readDB = { orderSummaries: [] };
    this.eventLog = [];
  }

  // Command side
  placeOrder(order) {
    this.writeDB.orders.push(order);
    const event = {
      type: 'ORDER_PLACED',
      data: order,
      timestamp: Date.now()
    };
    this.eventLog.push(event);
    console.log(\`[COMMAND] Order placed: \${order.id}\`);

    // Project to read model (in real system, this is async)
    this.projectToReadModel(event);
  }

  // Projection to read model
  projectToReadModel(event) {
    if (event.type === 'ORDER_PLACED') {
      this.readDB.orderSummaries.push({
        orderId: event.data.id,
        customer: event.data.customer,
        total: event.data.total,
        status: 'placed'
      });
      console.log('[PROJECTION] Read model updated');
    }
  }

  // Query side
  getOrderSummaries() {
    console.log('[QUERY] Reading from denormalized read model:');
    return this.readDB.orderSummaries;
  }
}

// 3. Event Sourcing Demo
class EventSourcedAccount {
  constructor(id) {
    this.id = id;
    this.events = [];
    this.balance = 0; // derived state
  }

  apply(event) {
    this.events.push({ ...event, timestamp: Date.now() });
    // Rebuild state from event
    if (event.type === 'DEPOSITED') this.balance += event.amount;
    if (event.type === 'WITHDRAWN') this.balance -= event.amount;
  }

  deposit(amount) {
    this.apply({ type: 'DEPOSITED', amount });
    console.log(\`Deposited \${amount}, balance: \${this.balance}\`);
  }

  withdraw(amount) {
    if (amount > this.balance) {
      console.log(\`Cannot withdraw \${amount}, balance: \${this.balance}\`);
      return;
    }
    this.apply({ type: 'WITHDRAWN', amount });
    console.log(\`Withdrawn \${amount}, balance: \${this.balance}\`);
  }

  getHistory() { return this.events; }

  // Rebuild state from events (replay)
  static fromEvents(id, events) {
    const account = new EventSourcedAccount(id);
    events.forEach(e => account.apply(e));
    return account;
  }
}

// Demo
console.log('=== Connection Pool ===');
const pool = new ConnectionPool(3);
const c1 = pool.acquire(); console.log('Acquired conn 1');
const c2 = pool.acquire(); console.log('Acquired conn 2');
const c3 = pool.acquire(); console.log('Acquired conn 3');
pool.acquire(); // Should wait
console.log('Pool status:', pool.getStatus());

console.log('\\n=== CQRS Pattern ===');
const cqrs = new CQRSSystem();
cqrs.placeOrder({ id: 'ORD-1', customer: 'Alice', total: 99.99 });
cqrs.placeOrder({ id: 'ORD-2', customer: 'Bob', total: 149.99 });
console.log(cqrs.getOrderSummaries());

console.log('\\n=== Event Sourcing ===');
const account = new EventSourcedAccount('ACC-001');
account.deposit(1000);
account.withdraw(200);
account.deposit(500);
account.withdraw(1500);
console.log('Event history:', account.getHistory().map(e => e.type + '(' + (e.amount) + ')'));
console.log('Final balance:', account.balance);

console.log('\\n=== Replay events to rebuild state ===');
const rebuilt = EventSourcedAccount.fromEvents('ACC-001', account.getHistory());
console.log('Rebuilt balance:', rebuilt.balance, '(matches original:', rebuilt.balance === account.balance, ')');`,
    content: `
<h1>Scaling Patterns & Architecture</h1>

<p>At SDE-2/SDE-3 level, you're expected to not just <em>know</em> scaling patterns but articulate <em>when</em> to apply each one and the tradeoffs involved.</p>

<h2>Vertical vs Horizontal Scaling</h2>

<pre><code>VERTICAL SCALING                    HORIZONTAL SCALING
(Scale Up)                          (Scale Out)

┌──────────┐                        ┌────┐ ┌────┐ ┌────┐ ┌────┐
│          │                        │ S1 │ │ S2 │ │ S3 │ │ S4 │
│  BIGGER  │                        └────┘ └────┘ └────┘ └────┘
│  SERVER  │                              │
│          │                         ┌────┴────┐
│ More CPU │                         │   Load  │
│ More RAM │                         │ Balancer│
│ More SSD │                         └─────────┘
└──────────┘

Vertical: Simpler, but has a ceiling    Horizontal: Complex, but unlimited
          (biggest server available)                (add more machines)
</code></pre>

<table>
<tr><th>Aspect</th><th>Vertical Scaling</th><th>Horizontal Scaling</th></tr>
<tr><td>Complexity</td><td>Low (no code changes)</td><td>Higher (distributed concerns)</td></tr>
<tr><td>Cost curve</td><td>Exponential (2x CPU ≠ 2x cost)</td><td>Linear (add identical servers)</td></tr>
<tr><td>Availability</td><td>Single point of failure</td><td>No SPOF (with redundancy)</td></tr>
<tr><td>Ceiling</td><td>Hardware limits</td><td>Virtually unlimited</td></tr>
<tr><td>Best for</td><td>Databases, quick fix</td><td>Stateless services, web tier</td></tr>
</table>

<h2>Stateless Services — The Foundation of Scaling</h2>

<pre><code>STATEFUL (hard to scale)            STATELESS (easy to scale)

┌──────────┐                        ┌──────────┐  ┌──────────┐
│ Server 1 │ ← has user session     │ Server 1 │  │ Server 2 │
│ session: │   in memory             │ (no state│  │ (no state│
│ {user:A} │                        │  in mem) │  │  in mem) │
└──────────┘                        └─────┬────┘  └─────┬────┘
If Server 1 dies,                         │            │
session is LOST!                    ┌─────┴────────────┴─────┐
                                    │  External State Store   │
                                    │  (Redis, DB, JWT)       │
                                    └─────────────────────────┘

Rules for stateless services:
1. No in-memory sessions → use Redis or JWT
2. No local file storage → use S3 or shared storage
3. No machine-specific config → use environment variables
4. Idempotent operations → safe to retry on any instance
</code></pre>

<h2>Database Connection Pooling</h2>

<pre><code>Without Pool:                       With Pool:
Each request opens a new            Reuse existing connections
DB connection (expensive!)

Req 1 → open conn → query → close  Req 1 ─┐
Req 2 → open conn → query → close        │ ┌──────────┐
Req 3 → open conn → query → close  Req 2 ─┤ │  Pool    │──▶ DB
Req 4 → open conn → query → close        │ │ (10 conn)│
                                    Req 3 ─┤ └──────────┘
                                    Req 4 ─┘ (wait if pool full)

PostgreSQL: max_connections = 100 (default)
  With 20 app instances × 10 pool each = 200 connections → PROBLEM!

Solution: PgBouncer (connection pooler)
  App (200 virtual conn) → PgBouncer (20 real conn) → PostgreSQL
</code></pre>

<h2>Read Replicas for Read-Heavy Workloads</h2>

<pre><code>Typical web app: 90% reads, 10% writes

             ┌──────────────┐
  Writes ───▶│   Primary    │
             │   (Master)   │
             └──────┬───────┘
                    │ replication
          ┌─────────┼─────────┐
     ┌────┴───┐ ┌───┴────┐ ┌──┴─────┐
     │Replica 1│ │Replica 2│ │Replica 3│
     └────┬───┘ └───┬────┘ └──┬─────┘
          │         │          │
          └─────────┼──────────┘
                    │
  Reads ◀───── Read LB (route reads across replicas)
</code></pre>

<h2>CQRS (Command Query Responsibility Segregation)</h2>

<pre><code>Traditional:                        CQRS:
┌──────────┐                        ┌──────────┐   ┌──────────┐
│ Single   │                        │ Write    │   │ Read     │
│ Model    │                        │ Model    │   │ Model    │
│ (R + W)  │                        │(Normalized│  │(Denormal)│
└──────────┘                        └─────┬────┘   └────┬─────┘
                                          │              ▲
                                    ┌─────┴──────┐       │
                                    │ Event Bus  │───────┘
                                    │ (Kafka)    │ projections
                                    └────────────┘

Command side: normalized, optimized for writes
Query side: denormalized, optimized for reads
Event bus: propagates changes from write → read model
</code></pre>

<p>When to use CQRS:</p>
<ul>
<li>Read and write patterns are very different (e.g., complex joins for reads, simple inserts for writes)</li>
<li>Need to scale reads and writes independently</li>
<li>Different consistency requirements for reads vs writes</li>
</ul>

<h2>Event Sourcing</h2>

<p>Instead of storing current state, store the <strong>sequence of events</strong> that led to the current state:</p>

<pre><code>Traditional (State):               Event Sourcing:
┌──────────────────┐               ┌──────────────────────────┐
│ Account: ACC-001 │               │ Event Log for ACC-001:   │
│ Balance: $1300   │               │ 1. DEPOSITED    $1000    │
│ (how did we get  │               │ 2. WITHDRAWN    $200     │
│  here? unclear!) │               │ 3. DEPOSITED    $500     │
└──────────────────┘               │ Current State: $1300     │
                                   │ (replay events to derive)│
                                   └──────────────────────────┘

Benefits:
  ✓ Complete audit trail
  ✓ Time travel (rebuild state at any point)
  ✓ Debug production issues (replay events)
  ✓ Event-driven architecture natural fit

Challenges:
  ✗ Event schema evolution
  ✗ Eventual consistency
  ✗ Storage growth (snapshots needed)
</code></pre>

<h2>Monolith vs Microservices</h2>

<table>
<tr><th>Aspect</th><th>Monolith</th><th>Microservices</th></tr>
<tr><td>Deployment</td><td>Single unit</td><td>Independent services</td></tr>
<tr><td>Scaling</td><td>Entire app scales together</td><td>Scale individual services</td></tr>
<tr><td>Development speed</td><td>Faster initially</td><td>Faster at scale (team autonomy)</td></tr>
<tr><td>Debugging</td><td>Easier (single process)</td><td>Harder (distributed tracing)</td></tr>
<tr><td>Data consistency</td><td>ACID transactions easy</td><td>Distributed transactions hard</td></tr>
<tr><td>Tech diversity</td><td>Single stack</td><td>Polyglot (each service picks best tool)</td></tr>
<tr><td>Operational overhead</td><td>Low</td><td>High (Kubernetes, service mesh, observability)</td></tr>
<tr><td>Team size</td><td>Best for &lt;10 engineers</td><td>Needed for 10+ engineers working in parallel</td></tr>
</table>

<h2>Rearchitecting for Performance — Real Context</h2>

<p>At Habuild, rearchitecting the messaging platform for a <strong>60% performance improvement</strong> involved:</p>

<ul>
<li><strong>Connection pooling</strong>: Reduced DB connection overhead with PgBouncer for PostgreSQL</li>
<li><strong>Caching layer</strong>: Redis for frequently accessed user state and message templates</li>
<li><strong>Async processing</strong>: Kafka for decoupling message processing from the HTTP request path</li>
<li><strong>Read replicas</strong>: PostgreSQL replicas for analytics and reporting queries</li>
<li><strong>Stateless services</strong>: Moved session state to Redis, enabling horizontal scaling</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: When would you break a monolith into microservices?</div>
<div class="qa-a"><strong>Break when:</strong><br/>1. <strong>Team growth</strong>: Multiple teams stepping on each other's code (merge conflicts, deployment coordination)<br/>2. <strong>Scaling needs differ</strong>: One module needs 10x more resources than others (e.g., message processing vs. user profiles)<br/>3. <strong>Deployment independence</strong>: Need to deploy one feature without risking the whole system<br/>4. <strong>Technology constraints</strong>: One module needs a different language or database<br/><br/><strong>Don't break when:</strong><br/>1. Small team (&lt;5 engineers) — overhead will slow you down<br/>2. You don't have good DevOps practices (CI/CD, monitoring, containerization)<br/>3. Trying to fix a code organization problem (refactor the monolith instead)<br/><br/><strong>The Strangler Fig pattern</strong> is the safest approach: route new features to microservices, gradually extract existing features, keep the monolith running in parallel until migration is complete.</div>
</div>
`
  },

  // ==================== API & COMMUNICATION ====================
  {
    id: 'api-design',
    title: 'API Design: REST vs gRPC vs GraphQL',
    category: 'API & Communication',
    starterCode: `// API Design Patterns Simulator
// ==============================

// 1. REST Pagination Strategies
class RESTApi {
  constructor() {
    // Simulated data: 100 items
    this.data = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: 'Item ' + (i + 1),
      createdAt: new Date(2024, 0, 1 + i).toISOString()
    }));
  }

  // Offset-based pagination
  listOffset(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const items = this.data.slice(offset, offset + limit);
    return {
      data: items,
      pagination: {
        page, limit,
        total: this.data.length,
        totalPages: Math.ceil(this.data.length / limit),
        hasNext: offset + limit < this.data.length
      }
    };
  }

  // Cursor-based pagination (better for real-time data)
  listCursor(cursor = null, limit = 10) {
    let startIdx = 0;
    if (cursor) {
      startIdx = this.data.findIndex(d => d.id === cursor) + 1;
    }
    const items = this.data.slice(startIdx, startIdx + limit);
    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    return {
      data: items,
      pagination: {
        cursor: nextCursor,
        hasNext: nextCursor !== null,
        limit
      }
    };
  }
}

// 2. Idempotency Key Pattern
class IdempotentAPI {
  constructor() {
    this.processedKeys = new Map(); // idempotencyKey → result
    this.orders = [];
  }

  createOrder(idempotencyKey, orderData) {
    // Check if already processed
    if (this.processedKeys.has(idempotencyKey)) {
      const cached = this.processedKeys.get(idempotencyKey);
      console.log(\`  [IDEMPOTENT] Returning cached result for key: \${idempotencyKey}\`);
      return { ...cached, fromCache: true };
    }

    // Process new order
    const order = { id: 'ORD-' + (this.orders.length + 1), ...orderData };
    this.orders.push(order);

    // Cache result
    this.processedKeys.set(idempotencyKey, order);
    console.log(\`  [NEW] Created order: \${order.id}\`);
    return { ...order, fromCache: false };
  }
}

// 3. Rate Limiter (Token Bucket)
class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  tryConsume() {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return { allowed: true, remaining: this.tokens, limit: this.capacity };
    }
    return { allowed: false, remaining: 0, limit: this.capacity, retryAfter: 1 };
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// Demo: Pagination
console.log('=== Offset-Based Pagination ===');
const api = new RESTApi();
const page1 = api.listOffset(1, 5);
console.log(\`Page 1: [\${page1.data.map(d => d.id).join(', ')}]\`);
console.log('Pagination:', page1.pagination);

console.log('\\n=== Cursor-Based Pagination ===');
const c1 = api.listCursor(null, 5);
console.log(\`First batch: [\${c1.data.map(d => d.id).join(', ')}]\`);
const c2 = api.listCursor(c1.pagination.cursor, 5);
console.log(\`Next batch:  [\${c2.data.map(d => d.id).join(', ')}]\`);
console.log('Cursor:', c2.pagination);

// Demo: Idempotency
console.log('\\n=== Idempotency Keys ===');
const idempApi = new IdempotentAPI();
const key = 'client-req-abc-123';
console.log('First call:');
idempApi.createOrder(key, { item: 'Widget', qty: 2 });
console.log('Retry (same key):');
idempApi.createOrder(key, { item: 'Widget', qty: 2 });
console.log('Different key:');
idempApi.createOrder('client-req-xyz-456', { item: 'Gadget', qty: 1 });
console.log('Orders in DB:', idempApi.orders.length);

// Demo: Rate Limiting
console.log('\\n=== Rate Limiting (Token Bucket) ===');
const limiter = new TokenBucketRateLimiter(5, 2); // 5 burst, 2/sec refill
for (let i = 1; i <= 8; i++) {
  const result = limiter.tryConsume();
  console.log(\`Request \${i}: \${result.allowed ? 'ALLOWED' : 'REJECTED'} (remaining: \${Math.floor(result.remaining)})\`);
}`,
    content: `
<h1>API Design: REST vs gRPC vs GraphQL</h1>

<p>API design decisions affect performance, developer experience, and system evolution. SDE-2+ interviews test your ability to choose the right protocol and design robust APIs.</p>

<h2>REST Best Practices</h2>

<h3>Resource Naming Conventions</h3>
<pre><code>Good:                              Bad:
GET    /api/v1/users               GET    /api/v1/getUsers
GET    /api/v1/users/123           GET    /api/v1/user?id=123
POST   /api/v1/users               POST   /api/v1/createUser
PUT    /api/v1/users/123           POST   /api/v1/updateUser/123
DELETE /api/v1/users/123           GET    /api/v1/deleteUser/123
GET    /api/v1/users/123/orders    GET    /api/v1/getUserOrders

Rules:
1. Use nouns, not verbs (HTTP method is the verb)
2. Use plural nouns (/users not /user)
3. Use kebab-case (/order-items not /orderItems)
4. Nest for relationships (/users/123/orders)
5. Use query params for filtering (/users?status=active&amp;role=admin)
</code></pre>

<h3>HTTP Status Codes Cheat Sheet</h3>

<table>
<tr><th>Code</th><th>Meaning</th><th>When to Use</th></tr>
<tr><td><code>200</code></td><td>OK</td><td>Successful GET, PUT, PATCH</td></tr>
<tr><td><code>201</code></td><td>Created</td><td>Successful POST that created a resource</td></tr>
<tr><td><code>204</code></td><td>No Content</td><td>Successful DELETE (no body)</td></tr>
<tr><td><code>400</code></td><td>Bad Request</td><td>Invalid input, malformed JSON</td></tr>
<tr><td><code>401</code></td><td>Unauthorized</td><td>Missing or invalid authentication</td></tr>
<tr><td><code>403</code></td><td>Forbidden</td><td>Authenticated but not authorized</td></tr>
<tr><td><code>404</code></td><td>Not Found</td><td>Resource doesn't exist</td></tr>
<tr><td><code>409</code></td><td>Conflict</td><td>Duplicate resource, version conflict</td></tr>
<tr><td><code>422</code></td><td>Unprocessable Entity</td><td>Valid JSON but semantic error</td></tr>
<tr><td><code>429</code></td><td>Too Many Requests</td><td>Rate limit exceeded</td></tr>
<tr><td><code>500</code></td><td>Internal Server Error</td><td>Unhandled server error</td></tr>
<tr><td><code>502</code></td><td>Bad Gateway</td><td>Upstream service failed</td></tr>
<tr><td><code>503</code></td><td>Service Unavailable</td><td>Overloaded, maintenance</td></tr>
<tr><td><code>504</code></td><td>Gateway Timeout</td><td>Upstream service timed out</td></tr>
</table>

<h2>Pagination Strategies</h2>

<table>
<tr><th>Strategy</th><th>Mechanism</th><th>Pros</th><th>Cons</th></tr>
<tr><td><strong>Offset</strong></td><td><code>?page=3&amp;limit=20</code></td><td>Simple, jump to any page</td><td>Slow for large offsets (OFFSET 100000), inconsistent with real-time data</td></tr>
<tr><td><strong>Cursor</strong></td><td><code>?cursor=abc&amp;limit=20</code></td><td>Consistent, fast at any depth</td><td>Can't jump to arbitrary page</td></tr>
<tr><td><strong>Keyset</strong></td><td><code>?after_id=500&amp;limit=20</code></td><td>Very fast (indexed), consistent</td><td>Requires sortable, unique column</td></tr>
</table>

<pre><code>-- Offset: gets slower as offset grows
SELECT * FROM messages ORDER BY id LIMIT 20 OFFSET 100000;
-- DB must scan and skip 100,000 rows!

-- Keyset: constant speed regardless of position
SELECT * FROM messages WHERE id &gt; 100000 ORDER BY id LIMIT 20;
-- Uses index seek — instant!

-- Cursor (encoded keyset): opaque to client
-- cursor = base64("id:100020")
-- Server decodes: WHERE id &gt; 100020 ORDER BY id LIMIT 20
</code></pre>

<h2>gRPC — When and Why</h2>

<pre><code>// Protocol Buffers (protobuf) — gRPC's serialization format
// ~10x smaller and faster than JSON

syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);  // server streaming
  rpc Chat (stream Message) returns (stream Message);       // bidirectional
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
</code></pre>

<p><strong>When to use gRPC</strong>:</p>
<ul>
<li>Internal microservice-to-microservice communication (not public APIs)</li>
<li>High-throughput, low-latency requirements</li>
<li>Streaming data (real-time feeds, chat)</li>
<li>Polyglot environments (protobuf generates client/server code for any language)</li>
</ul>

<h2>GraphQL — When It's Better Than REST</h2>

<pre><code># Single request gets exactly what you need
query {
  user(id: "123") {
    name
    email
    orders(last: 5) {
      id
      total
      items {
        name
        quantity
      }
    }
  }
}

# REST equivalent: 3 separate requests
# GET /users/123
# GET /users/123/orders?limit=5
# GET /orders/{id}/items  (for each order)
</code></pre>

<p><strong>Use GraphQL when</strong>: Mobile clients (reduce over-fetching, save bandwidth), multiple frontend consumers needing different data shapes, rapidly evolving API.</p>
<p><strong>Avoid GraphQL when</strong>: Simple CRUD, file uploads, real-time streaming (use subscriptions sparingly), caching is critical (REST caches better with HTTP).</p>

<h2>Comparison: REST vs gRPC vs GraphQL</h2>

<table>
<tr><th>Aspect</th><th>REST</th><th>gRPC</th><th>GraphQL</th></tr>
<tr><td>Protocol</td><td>HTTP/1.1 or HTTP/2</td><td>HTTP/2 (required)</td><td>HTTP (usually POST)</td></tr>
<tr><td>Format</td><td>JSON (text)</td><td>Protobuf (binary)</td><td>JSON</td></tr>
<tr><td>Schema</td><td>OpenAPI (optional)</td><td>Protobuf (required)</td><td>SDL (required)</td></tr>
<tr><td>Streaming</td><td>SSE, WebSocket</td><td>Native (4 modes)</td><td>Subscriptions (WS)</td></tr>
<tr><td>Browser support</td><td>Native</td><td>Needs grpc-web</td><td>Native</td></tr>
<tr><td>Caching</td><td>HTTP caching built-in</td><td>No HTTP caching</td><td>Complex (per-field)</td></tr>
<tr><td>Learning curve</td><td>Low</td><td>Medium</td><td>Medium-High</td></tr>
<tr><td>Best for</td><td>Public APIs, CRUD</td><td>Internal microservices</td><td>Mobile, BFF</td></tr>
</table>

<h2>Idempotency Keys</h2>

<pre><code>POST /api/v1/payments
Idempotency-Key: "client-generated-uuid-xyz"
Content-Type: application/json

{ "amount": 100, "currency": "INR", "to": "merchant-123" }

Server behavior:
1. Check if Idempotency-Key exists in store (Redis, DB)
2. If exists → return cached response (don't charge again!)
3. If new → process payment, store result keyed by idempotency key
4. Key expires after 24-48 hours

WHY: Network retries, client crashes, load balancer retries
     can cause duplicate POST requests. Idempotency keys
     ensure the operation happens exactly once.
</code></pre>

<h2>Rate Limiting</h2>

<pre><code>Response Headers:
  X-RateLimit-Limit: 100        # Max requests per window
  X-RateLimit-Remaining: 42     # Requests left
  X-RateLimit-Reset: 1640000000 # Unix timestamp when window resets
  Retry-After: 30               # Seconds to wait (on 429)

Algorithms:
  Token Bucket: smooth bursts (most common)
  Sliding Window: precise counting
  Fixed Window: simple but allows 2x burst at window boundary
  Leaky Bucket: constant rate output
</code></pre>

<h2>API Versioning Strategies</h2>

<table>
<tr><th>Strategy</th><th>Example</th><th>Pros</th><th>Cons</th></tr>
<tr><td>URL path</td><td><code>/api/v1/users</code></td><td>Explicit, easy to route</td><td>URL changes, breaks bookmarks</td></tr>
<tr><td>Header</td><td><code>Accept: application/vnd.api.v2+json</code></td><td>Clean URLs</td><td>Hidden, harder to test</td></tr>
<tr><td>Query param</td><td><code>/api/users?version=2</code></td><td>Easy to test</td><td>Messy, optional param</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: Design a RESTful API for a messaging platform.</div>
<div class="qa-a"><strong>Resources and endpoints:</strong><br/><pre><code>POST   /api/v1/conversations                    # Create conversation
GET    /api/v1/conversations?cursor=X&amp;limit=20   # List user's conversations
GET    /api/v1/conversations/:id                  # Get conversation details
POST   /api/v1/conversations/:id/messages         # Send message
GET    /api/v1/conversations/:id/messages?cursor=X # List messages (cursor pagination)
PUT    /api/v1/messages/:id/read                  # Mark message as read
DELETE /api/v1/messages/:id                       # Delete message
POST   /api/v1/conversations/:id/participants     # Add participant
</code></pre>
<strong>Design decisions:</strong><br/>1. <strong>Cursor pagination</strong> for messages (real-time data, offset would miss new messages)<br/>2. <strong>Idempotency key</strong> on POST /messages (prevent duplicate sends on retry)<br/>3. <strong>WebSocket</strong> for real-time delivery (REST for fetching history)<br/>4. <strong>Rate limit</strong>: 60 messages/min per user to prevent spam</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How would you handle pagination for 10M records?</div>
<div class="qa-a"><strong>Never use offset pagination</strong> for large datasets. <code>OFFSET 5000000</code> means the DB scans and skips 5M rows — it's O(offset).<br/><br/><strong>Use keyset (cursor) pagination:</strong><br/><code>SELECT * FROM messages WHERE id &gt; :last_seen_id ORDER BY id LIMIT 20</code><br/><br/>This uses an index seek (O(log n)) regardless of how deep you are in the dataset. Encode the cursor as an opaque base64 string so clients can't tamper with it.<br/><br/>For <strong>composite sort orders</strong> (e.g., sort by created_at, then id): <code>WHERE (created_at, id) &gt; (:last_ts, :last_id) ORDER BY created_at, id LIMIT 20</code>. Ensure there's a composite index on (created_at, id).</div>
</div>
`
  },

  {
    id: 'message-queue-patterns',
    title: 'Message Queue Patterns',
    category: 'API & Communication',
    starterCode: `// Message Queue Patterns Simulator
// ==================================

// 1. Delivery Guarantees
class MessageBroker {
  constructor(mode) {
    this.mode = mode; // 'at-most-once' | 'at-least-once' | 'exactly-once'
    this.queue = [];
    this.processed = new Set();
    this.dlq = []; // Dead Letter Queue
    this.stats = { sent: 0, delivered: 0, duplicates: 0, failed: 0, dlq: 0 };
  }

  publish(msg) {
    this.queue.push({ id: msg.id, data: msg.data, attempts: 0, maxAttempts: 3 });
    this.stats.sent++;
  }

  consume(handler) {
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      msg.attempts++;

      try {
        if (this.mode === 'at-most-once') {
          // Acknowledge BEFORE processing — may lose messages
          handler(msg);
          this.stats.delivered++;
        }
        else if (this.mode === 'at-least-once') {
          // Acknowledge AFTER processing — may duplicate
          const success = handler(msg);
          if (success) {
            this.stats.delivered++;
          } else {
            if (msg.attempts < msg.maxAttempts) {
              this.queue.push(msg); // retry
            } else {
              this.dlq.push(msg);
              this.stats.dlq++;
              console.log(\`  [DLQ] Message \${msg.id} moved to DLQ after \${msg.maxAttempts} attempts\`);
            }
          }
        }
        else if (this.mode === 'exactly-once') {
          // Check if already processed (idempotency)
          if (this.processed.has(msg.id)) {
            this.stats.duplicates++;
            console.log(\`  [DEDUP] Message \${msg.id} already processed, skipping\`);
            continue;
          }
          handler(msg);
          this.processed.add(msg.id);
          this.stats.delivered++;
        }
      } catch (e) {
        this.stats.failed++;
        if (msg.attempts < msg.maxAttempts) {
          this.queue.push(msg);
        } else {
          this.dlq.push(msg);
          this.stats.dlq++;
        }
      }
    }
    return this.stats;
  }
}

// 2. Exponential Backoff with Jitter
function exponentialBackoff(attempt, baseMs = 100, maxMs = 10000) {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * exponential; // Full jitter
  return Math.min(exponential + jitter, maxMs);
}

// 3. Fan-Out Pattern (SNS → SQS)
class FanOut {
  constructor() {
    this.subscribers = {};
  }
  subscribe(topic, queue) {
    if (!this.subscribers[topic]) this.subscribers[topic] = [];
    this.subscribers[topic].push(queue);
  }
  publish(topic, message) {
    const subs = this.subscribers[topic] || [];
    console.log(\`  [FAN-OUT] Publishing to \${topic} → \${subs.length} subscribers\`);
    subs.forEach(q => q.push(message));
  }
}

// Demo: Delivery Guarantees
console.log('=== At-Least-Once (with DLQ) ===');
const aloBroker = new MessageBroker('at-least-once');
aloBroker.publish({ id: 'msg-1', data: 'Hello' });
aloBroker.publish({ id: 'msg-2', data: 'World' });
aloBroker.publish({ id: 'msg-3', data: 'Fail' });

let callCount = 0;
const aloStats = aloBroker.consume(msg => {
  if (msg.data === 'Fail') {
    callCount++;
    if (callCount <= 3) return false; // simulate failure
  }
  console.log(\`  Processed: \${msg.id} = \${msg.data}\`);
  return true;
});
console.log('Stats:', aloStats);

console.log('\\n=== Exactly-Once (Idempotent) ===');
const eoBroker = new MessageBroker('exactly-once');
// Simulate duplicate messages (network retry)
eoBroker.publish({ id: 'msg-1', data: 'Payment $100' });
eoBroker.publish({ id: 'msg-1', data: 'Payment $100' }); // duplicate!
eoBroker.publish({ id: 'msg-2', data: 'Payment $200' });
const eoStats = eoBroker.consume(msg => {
  console.log(\`  Processing: \${msg.id} = \${msg.data}\`);
});
console.log('Stats:', eoStats);

console.log('\\n=== Exponential Backoff ===');
for (let i = 0; i < 6; i++) {
  console.log(\`  Attempt \${i}: wait \${Math.round(exponentialBackoff(i))}ms\`);
}

console.log('\\n=== Fan-Out Pattern ===');
const fanout = new FanOut();
const emailQueue = [];
const smsQueue = [];
const analyticsQueue = [];
fanout.subscribe('order.created', emailQueue);
fanout.subscribe('order.created', smsQueue);
fanout.subscribe('order.created', analyticsQueue);
fanout.publish('order.created', { orderId: 'ORD-1', total: 99.99 });
console.log(\`  Email queue: \${emailQueue.length} msg(s)\`);
console.log(\`  SMS queue: \${smsQueue.length} msg(s)\`);
console.log(\`  Analytics queue: \${analyticsQueue.length} msg(s)\`);`,
    content: `
<h1>Message Queue Patterns</h1>

<p>Message queues are the backbone of distributed systems. At SDE-2 level with Kafka experience, interviewers will go deep into delivery guarantees, consumer patterns, and real-world tradeoffs.</p>

<h2>Delivery Guarantees</h2>

<pre><code>AT-MOST-ONCE              AT-LEAST-ONCE            EXACTLY-ONCE
(fire and forget)         (retry until ack)        (idempotent processing)

Producer──▶Broker         Producer──▶Broker         Producer──▶Broker
         ack first                 process first             dedup + process
         then process              then ack
                                   retry on fail

May LOSE messages         May DUPLICATE messages    No loss, no duplicates
Fastest                   Most common               Hardest / most expensive

Use: Metrics, logs        Use: Orders, emails       Use: Payments, transfers
</code></pre>

<table>
<tr><th>Guarantee</th><th>Message Loss</th><th>Duplicates</th><th>Complexity</th><th>Use Case</th></tr>
<tr><td>At-most-once</td><td>Possible</td><td>No</td><td>Low</td><td>Metrics, analytics, logs</td></tr>
<tr><td>At-least-once</td><td>No</td><td>Possible</td><td>Medium</td><td>Email notifications, order events</td></tr>
<tr><td>Exactly-once</td><td>No</td><td>No</td><td>High</td><td>Payment processing, financial txns</td></tr>
</table>

<h2>Idempotency — The Key to At-Least-Once</h2>

<pre><code>Problem: Consumer processes message, crashes before ack.
         Broker re-delivers → duplicate processing!

Solution: Make the consumer idempotent.

// Idempotent consumer pattern:
async function processPayment(message) {
  const { paymentId, amount } = message;

  // Check if already processed
  const existing = await db.query(
    'SELECT id FROM payments WHERE idempotency_key = $1',
    [paymentId]
  );
  if (existing.rows.length &gt; 0) {
    return; // Already processed — safe to skip
  }

  // Process in a transaction
  await db.transaction(async (tx) =&gt; {
    await tx.query(
      'INSERT INTO payments (idempotency_key, amount) VALUES ($1, $2)',
      [paymentId, amount]
    );
    await tx.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, message.userId]
    );
  });

  // NOW acknowledge the message
  message.ack();
}
</code></pre>

<h2>Dead Letter Queues (DLQ)</h2>

<pre><code>Main Queue                 DLQ
┌────────────┐            ┌────────────┐
│ msg-1 ✓    │            │ msg-3 ✗✗✗  │ ← failed 3 times
│ msg-2 ✓    │            │ msg-7 ✗✗✗  │
│ msg-3 ✗    │──(retry)──▶│            │
│ msg-3 ✗✗   │──(retry)──▶│ Inspect    │
│ msg-3 ✗✗✗  │──(to DLQ)─▶│ Fix        │
└────────────┘            │ Replay     │
                          └────────────┘

DLQ strategy:
1. Set maxRetries (e.g., 3-5)
2. Use exponential backoff between retries
3. Failed messages go to DLQ after max retries
4. Alert ops team on DLQ growth
5. Inspect, fix root cause, replay from DLQ
</code></pre>

<h2>Retry Strategies</h2>

<pre><code>// Exponential backoff with jitter
delay = min(cap, base * 2^attempt) + random(0, base * 2^attempt)

Attempt 0: ~100ms
Attempt 1: ~200ms
Attempt 2: ~400ms
Attempt 3: ~800ms
Attempt 4: ~1600ms
Attempt 5: ~3200ms  (capped at 10s)

WHY jitter? Without it, all retries happen at the same time
            (thundering herd). Jitter spreads them out.

Types:
  Full jitter:  random(0, base * 2^attempt)
  Equal jitter: base * 2^attempt / 2 + random(0, base * 2^attempt / 2)
  Decorrelated: min(cap, random(base, previous_delay * 3))
</code></pre>

<h2>Kafka Deep Dive</h2>

<pre><code>Kafka Architecture:
┌─────────────────────────────────────────────────┐
│ Kafka Cluster                                   │
│                                                 │
│  Topic: "user-events" (3 partitions, RF=2)     │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Partition 0│ │Partition 1│ │Partition 2│       │
│  │ Broker 1  │ │ Broker 2  │ │ Broker 3  │       │
│  │ (leader)  │ │ (leader)  │ │ (leader)  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │ replica     │ replica     │ replica     │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐       │
│  │ Broker 2  │ │ Broker 3  │ │ Broker 1  │       │
│  │ (follower)│ │ (follower)│ │ (follower)│       │
│  └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────┘

Consumer Group "group-1":
  Consumer A ← Partition 0
  Consumer B ← Partition 1, Partition 2

Consumer Group "group-2" (independent):
  Consumer X ← Partition 0, 1, 2

Key concepts:
  - Partition = unit of parallelism
  - Consumer group = logical subscriber
  - Each partition consumed by exactly ONE consumer in a group
  - Max consumers in a group = number of partitions
</code></pre>

<h3>Kafka Offset Management</h3>
<pre><code>Partition 0: [0][1][2][3][4][5][6][7][8][9]
                            ▲           ▲
                            │           │
                     committed      latest
                      offset        offset

auto.offset.reset: "earliest" | "latest"
enable.auto.commit: false (recommended for at-least-once)

Manual commit pattern:
  1. Poll messages
  2. Process batch
  3. Commit offset
  If crash between 2 and 3 → reprocess (at-least-once)
</code></pre>

<h3>Kafka Exactly-Once Semantics</h3>
<pre><code>Idempotent Producer (enable.idempotence=true):
  - Producer assigns sequence numbers
  - Broker deduplicates by producer ID + sequence
  - Prevents duplicate writes on producer retry

Transactional API:
  producer.beginTransaction();
  producer.send(record1);
  producer.send(record2);
  producer.sendOffsetsToTransaction(offsets, groupId);
  producer.commitTransaction();
  // All or nothing — atomic across topics/partitions
</code></pre>

<h2>RabbitMQ vs SQS vs Kafka</h2>

<table>
<tr><th>Feature</th><th>Kafka</th><th>RabbitMQ</th><th>SQS</th></tr>
<tr><td>Model</td><td>Log-based (append)</td><td>Broker-based (push/pull)</td><td>Managed queue (pull)</td></tr>
<tr><td>Ordering</td><td>Per partition</td><td>Per queue</td><td>FIFO queues only</td></tr>
<tr><td>Retention</td><td>Configurable (days/forever)</td><td>Until consumed</td><td>14 days max</td></tr>
<tr><td>Throughput</td><td>Millions/sec</td><td>Tens of thousands/sec</td><td>Thousands/sec (standard)</td></tr>
<tr><td>Replay</td><td>Yes (rewind offset)</td><td>No (once consumed, gone)</td><td>No</td></tr>
<tr><td>Consumer groups</td><td>Native</td><td>Via exchanges/bindings</td><td>Via multiple queues</td></tr>
<tr><td>Exactly-once</td><td>Transactional API</td><td>Not native</td><td>FIFO dedup (5min window)</td></tr>
<tr><td>Ops overhead</td><td>High (Zookeeper/KRaft)</td><td>Medium</td><td>None (managed)</td></tr>
<tr><td>Best for</td><td>Event streaming, high volume</td><td>Task queues, routing</td><td>Simple decoupling, serverless</td></tr>
</table>

<h2>Fan-Out Pattern (SNS to SQS)</h2>

<pre><code>                  ┌──────────┐
Order Service ───▶│ SNS Topic│
                  │"orders"  │
                  └────┬─────┘
                       │ fan-out
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │SQS: Email│ │SQS: SMS  │ │SQS: Audit│
   │ Service  │ │ Service  │ │ Service  │
   └──────────┘ └──────────┘ └──────────┘

Each SQS queue processes independently.
If Email service is slow, SMS and Audit are unaffected.
</code></pre>

<h2>Saga Pattern for Distributed Transactions</h2>

<pre><code>Order Saga (Choreography):

Order Service ──(OrderCreated)──▶ Payment Service
                                      │
                                 (PaymentCompleted)
                                      │
                                      ▼
                                 Inventory Service
                                      │
                                 (InventoryReserved)
                                      │
                                      ▼
                                 Shipping Service

If any step fails → publish compensating events:
  PaymentFailed → cancel order
  InventoryFailed → refund payment, cancel order
</code></pre>

<h2>Real Example: Habuild WhatsApp Broadcast System</h2>

<p>At Habuild, the WhatsApp broadcast system processed <strong>5M+ events daily</strong>:</p>
<ul>
<li><strong>Kafka</strong> as the backbone — events published per user action, broadcast triggers</li>
<li><strong>Consumer groups</strong>: Separate consumers for message delivery, analytics, and notification services</li>
<li><strong>At-least-once</strong> delivery with idempotent consumers (dedup by message ID in Cassandra)</li>
<li><strong>DLQ</strong> for failed message deliveries — monitored, replayed after WhatsApp API issues resolved</li>
<li><strong>Partition key</strong>: user_id — ensures all events for a user are ordered and processed by the same consumer</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: How do you ensure exactly-once processing?</div>
<div class="qa-a"><strong>True exactly-once is impossible</strong> in distributed systems. What we achieve is <strong>effectively exactly-once</strong> through idempotent processing with at-least-once delivery:<br/><br/>1. <strong>Producer side</strong>: Kafka's idempotent producer (enable.idempotence=true) prevents duplicate writes using producer ID + sequence numbers<br/>2. <strong>Consumer side</strong>: Store a unique message/event ID in the database within the same transaction as the business logic. On retry, check if the ID exists — if so, skip processing<br/>3. <strong>Kafka Transactions</strong>: For consume-transform-produce patterns, use Kafka's transactional API to atomically read from one topic, process, and write to another topic + commit offsets<br/><br/>The key insight: <strong>make your consumer idempotent</strong>, and at-least-once delivery becomes effectively exactly-once.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When would you use Kafka vs SQS vs RabbitMQ?</div>
<div class="qa-a"><strong>Kafka</strong>: High-throughput event streaming (100K+ events/sec), need message replay, event sourcing, log aggregation, real-time analytics. Accept operational complexity.<br/><br/><strong>SQS</strong>: Serverless architecture, simple task decoupling, don't want to manage infrastructure. Use FIFO queues when ordering matters. Best with AWS Lambda.<br/><br/><strong>RabbitMQ</strong>: Complex routing (topic, fanout, headers exchanges), traditional task queues, request-reply patterns, lower throughput but richer messaging semantics.<br/><br/><strong>At Habuild</strong>: We chose Kafka for the messaging pipeline because we needed high throughput (millions of events), message replay for debugging, and consumer groups for parallel processing across services.</div>
</div>
`
  },

  {
    id: 'microservices-patterns',
    title: 'Microservices Communication Patterns',
    category: 'API & Communication',
    starterCode: `// Microservices Communication Patterns
// =====================================

// 1. Circuit Breaker Pattern
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.state = 'CLOSED'; // CLOSED → OPEN → HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = options.failureThreshold || 3;
    this.recoveryTimeout = options.recoveryTimeout || 5000;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 2;
    this.openedAt = null;
    this.log = [];
  }

  async call(fn) {
    this.logState();

    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(\`  [\${this.name}] Transitioning to HALF_OPEN\`);
      } else {
        console.log(\`  [\${this.name}] OPEN — fast fail (not calling service)\`);
        return { error: 'Circuit is OPEN', failFast: true };
      }
    }

    try {
      const result = fn();
      this.onSuccess();
      return { result };
    } catch (err) {
      this.onFailure();
      return { error: err.message };
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log(\`  [\${this.name}] Recovery confirmed → CLOSED\`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.openedAt = Date.now();
      console.log(\`  [\${this.name}] HALF_OPEN failed → back to OPEN\`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
      console.log(\`  [\${this.name}] Threshold reached → OPEN\`);
    }
  }

  logState() {
    this.log.push({ state: this.state, failures: this.failureCount, ts: Date.now() });
  }
}

// 2. Bulkhead Pattern
class Bulkhead {
  constructor(name, maxConcurrent) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.rejected = 0;
  }

  tryExecute(taskName) {
    if (this.active >= this.maxConcurrent) {
      this.rejected++;
      console.log(\`  [BULKHEAD-\${this.name}] REJECTED \${taskName} (\${this.active}/\${this.maxConcurrent} slots used)\`);
      return false;
    }
    this.active++;
    console.log(\`  [BULKHEAD-\${this.name}] \${taskName} executing (\${this.active}/\${this.maxConcurrent})\`);
    return true;
  }

  release(taskName) {
    this.active = Math.max(0, this.active - 1);
    console.log(\`  [BULKHEAD-\${this.name}] \${taskName} released (\${this.active}/\${this.maxConcurrent})\`);
  }
}

// 3. Saga Orchestrator
class SagaOrchestrator {
  constructor(steps) {
    this.steps = steps; // [{name, execute, compensate}]
    this.completedSteps = [];
  }

  async execute() {
    console.log('\\n  Saga started...');
    for (const step of this.steps) {
      try {
        console.log(\`  Step: \${step.name}...\`);
        step.execute();
        this.completedSteps.push(step);
        console.log(\`  ✓ \${step.name} succeeded\`);
      } catch (err) {
        console.log(\`  ✗ \${step.name} FAILED: \${err.message}\`);
        await this.compensate();
        return { success: false, failedAt: step.name };
      }
    }
    return { success: true };
  }

  async compensate() {
    console.log('  Rolling back...');
    for (const step of this.completedSteps.reverse()) {
      try {
        step.compensate();
        console.log(\`  ↩ \${step.name} compensated\`);
      } catch (e) {
        console.log(\`  ⚠ \${step.name} compensation FAILED\`);
      }
    }
  }
}

// Demo: Circuit Breaker
console.log('=== Circuit Breaker ===');
const cb = new CircuitBreaker('PaymentService', { failureThreshold: 3, recoveryTimeout: 100 });

// Simulate failures
let callNum = 0;
function callPaymentService() {
  callNum++;
  if (callNum <= 4) throw new Error('Service unavailable');
  return 'Payment processed';
}

for (let i = 0; i < 5; i++) {
  cb.call(callPaymentService);
}

// Wait for recovery timeout, then try HALF_OPEN
cb.openedAt = Date.now() - 200; // simulate time passed
callNum = 10; // service recovered
cb.call(callPaymentService);
cb.call(callPaymentService);

// Demo: Bulkhead
console.log('\\n=== Bulkhead Pattern ===');
const paymentBulkhead = new Bulkhead('Payment', 2);
const orderBulkhead = new Bulkhead('Order', 3);

paymentBulkhead.tryExecute('pay-1');
paymentBulkhead.tryExecute('pay-2');
paymentBulkhead.tryExecute('pay-3'); // rejected
orderBulkhead.tryExecute('ord-1');   // separate pool — not affected
paymentBulkhead.release('pay-1');
paymentBulkhead.tryExecute('pay-3'); // now accepted

// Demo: Saga
console.log('\\n=== Saga Pattern (Orchestration) ===');
const orderSaga = new SagaOrchestrator([
  {
    name: 'Create Order',
    execute: () => console.log('    Order ORD-1 created'),
    compensate: () => console.log('    Order ORD-1 cancelled')
  },
  {
    name: 'Reserve Inventory',
    execute: () => console.log('    2x Widget reserved'),
    compensate: () => console.log('    2x Widget released')
  },
  {
    name: 'Process Payment',
    execute: () => { throw new Error('Insufficient funds'); },
    compensate: () => console.log('    Payment reversed')
  },
  {
    name: 'Arrange Shipping',
    execute: () => console.log('    Shipping arranged'),
    compensate: () => console.log('    Shipping cancelled')
  }
]);

orderSaga.execute();`,
    content: `
<h1>Microservices Communication Patterns</h1>

<p>Microservice communication patterns determine system reliability. At SDE-2+ with microservices experience, interviewers expect deep knowledge of failure handling, distributed transactions, and orchestration.</p>

<h2>Synchronous vs Asynchronous Communication</h2>

<pre><code>SYNCHRONOUS                          ASYNCHRONOUS
(request-response)                   (event-driven)

Service A ──HTTP──▶ Service B        Service A ──event──▶ Message Queue
           ◀─resp──                                           │
                                                    ┌─────────┼──────────┐
Tight coupling                       Service B ◀────┘         │          │
Both must be up                      Service C ◀──────────────┘          │
Cascading failures                   Service D ◀─────────────────────────┘
Simple to implement
                                     Loose coupling
                                     Temporal decoupling
                                     More complex
</code></pre>

<table>
<tr><th>Aspect</th><th>Synchronous (HTTP/gRPC)</th><th>Asynchronous (Queue/Events)</th></tr>
<tr><td>Coupling</td><td>Tight (direct dependency)</td><td>Loose (via broker)</td></tr>
<tr><td>Latency</td><td>Immediate response</td><td>Eventual (no immediate response)</td></tr>
<tr><td>Failure handling</td><td>Cascading failures risk</td><td>Isolated (queue buffers)</td></tr>
<tr><td>Debugging</td><td>Easier (request tracing)</td><td>Harder (distributed events)</td></tr>
<tr><td>Scalability</td><td>Limited by slowest service</td><td>Independent scaling</td></tr>
<tr><td>Use case</td><td>User-facing reads, queries</td><td>Background processing, events</td></tr>
</table>

<h2>Service Discovery</h2>

<pre><code>CLIENT-SIDE DISCOVERY               SERVER-SIDE DISCOVERY

┌──────────┐                        ┌──────────┐
│ Service A│                        │ Service A│
│          │──lookup──▶Registry     │          │──▶Load Balancer──▶Registry
│          │◀─addresses─┘           │          │      │
│          │──call──▶Service B      │          │      └──▶Service B
└──────────┘                        └──────────┘

Client-side:                        Server-side:
  Netflix Eureka + Ribbon             AWS ALB, Kubernetes Service
  Client gets list, picks one         LB queries registry, routes
  More control, more logic            Simpler clients, LB does work
  in client                           in infrastructure
</code></pre>

<h2>Circuit Breaker Pattern</h2>

<pre><code>State Machine:
                 ┌────────────────────────────┐
                 │                            │
                 ▼                            │
            ┌─────────┐   failure &gt;=     ┌────┴────┐
            │ CLOSED  │──threshold──────▶│  OPEN   │
            │(normal) │                  │(fail-   │
            └─────────┘                  │ fast)   │
                 ▲                       └────┬────┘
                 │                            │
                 │  success                   │ timeout
                 │  threshold met             │ elapsed
                 │                            ▼
            ┌────┴──────┐              ┌──────────┐
            │  CLOSED   │◀──success───│HALF_OPEN │
            │           │              │(testing) │
            └───────────┘  failure     └────┬─────┘
                           ──▶ OPEN ◀───────┘

CLOSED: Requests flow normally. Track failures.
OPEN: All requests immediately fail (fast-fail). After timeout, go to HALF_OPEN.
HALF_OPEN: Allow limited requests. If they succeed → CLOSED. If fail → OPEN.
</code></pre>

<pre><code>// Circuit Breaker in Node.js (simplified)
class CircuitBreaker {
  constructor(fn, options) {
    this.fn = fn;
    this.state = 'CLOSED';
    this.failures = 0;
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 30000;
    this.openedAt = null;
  }

  async call(...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt &lt; this.timeout) {
        throw new Error('Circuit is OPEN — failing fast');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures &gt;= this.threshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }
}

// Usage
const paymentBreaker = new CircuitBreaker(callPaymentAPI, {
  threshold: 5, timeout: 30000
});
</code></pre>

<h2>Bulkhead Pattern</h2>

<pre><code>Without Bulkhead:                   With Bulkhead:
┌─────────────────────┐            ┌──────────┐ ┌──────────┐
│ Shared Thread Pool  │            │ Pool:    │ │ Pool:    │
│ (100 threads)       │            │ Payment  │ │ Order    │
│                     │            │ (20 max) │ │ (30 max) │
│ Payment ← 95       │            └──────────┘ └──────────┘
│ (slow/stuck)        │            ┌──────────┐ ┌──────────┐
│ Order   ← 5        │            │ Pool:    │ │ Pool:    │
│ (starved!)          │            │ User     │ │ Search   │
└─────────────────────┘            │ (25 max) │ │ (25 max) │
                                   └──────────┘ └──────────┘
One slow service                   Isolated pools per service.
consumes all threads               Payment being slow doesn't
→ everything fails                 affect Order, User, Search.
</code></pre>

<h2>API Gateway Pattern</h2>

<pre><code>┌─────────┐     ┌─────────────────┐
│ Mobile  │────▶│                 │──▶ User Service
│ Client  │     │   API Gateway   │──▶ Order Service
└─────────┘     │                 │──▶ Payment Service
┌─────────┐     │ - Authentication│──▶ Product Service
│ Web     │────▶│ - Rate Limiting │
│ Client  │     │ - Request       │
└─────────┘     │   Routing       │
┌─────────┐     │ - Response      │
│ Partner │────▶│   Aggregation   │
│ API     │     │ - SSL Term.     │
└─────────┘     │ - Logging       │
                └─────────────────┘

Tools: Kong, AWS API Gateway, Envoy, NGINX
</code></pre>

<h2>Saga Pattern — Deep Dive</h2>

<pre><code>CHOREOGRAPHY                         ORCHESTRATION
(decentralized)                      (centralized)

Each service publishes events.       Central orchestrator directs flow.
No single coordinator.               Knows the full saga.

Order ──(OrderCreated)──▶             ┌────────────────┐
Payment ──(PaymentDone)──▶           │  Saga           │
Inventory ──(Reserved)──▶           │  Orchestrator   │
                                     │                 │
Pros: Simple, loosely coupled        │ 1. Create Order │
Cons: Hard to track,                 │ 2. Take Payment │
      difficult to debug,           │ 3. Reserve Stock│
      cyclic dependencies           │ 4. Ship Order   │
                                     └────────────────┘
                                     Pros: Clear flow, easy to debug
                                     Cons: Single point of coordination
</code></pre>

<h2>Distributed Transactions: 2PC vs Saga</h2>

<table>
<tr><th>Aspect</th><th>2PC (Two-Phase Commit)</th><th>Saga</th></tr>
<tr><td>Consistency</td><td>Strong (ACID)</td><td>Eventual</td></tr>
<tr><td>Availability</td><td>Lower (coordinator blocks)</td><td>Higher</td></tr>
<tr><td>Latency</td><td>Higher (all participants lock)</td><td>Lower per step</td></tr>
<tr><td>Failure handling</td><td>Coordinator decides rollback</td><td>Compensating transactions</td></tr>
<tr><td>Scalability</td><td>Poor (locks across services)</td><td>Good (no distributed locks)</td></tr>
<tr><td>Use case</td><td>Tightly coupled, same DB vendor</td><td>Microservices, different DBs</td></tr>
</table>

<div class="warning-note">In microservices, prefer Saga over 2PC. Two-phase commit doesn't scale well and creates tight coupling. Sagas with compensating transactions handle failures more gracefully in distributed systems.</div>

<h2>Temporal for Workflow Orchestration</h2>

<p>Temporal (used at Niyo) provides durable workflow execution for complex microservice orchestrations:</p>

<pre><code>// Temporal Workflow (concept)
async function orderWorkflow(orderId) {
  // Each step is automatically retried on failure
  // Workflow state is persisted — survives service restarts

  const order = await activities.createOrder(orderId);
  const payment = await activities.processPayment(order);

  try {
    const inventory = await activities.reserveInventory(order);
    const shipping = await activities.arrangeShipping(order);
    return { status: 'completed', trackingId: shipping.id };
  } catch (err) {
    // Automatic compensation
    await activities.refundPayment(payment.id);
    await activities.cancelOrder(orderId);
    throw err;
  }
}

// Temporal advantages over manual saga:
// - Durable execution (survives crashes)
// - Built-in retry policies
// - Visibility into workflow state
// - Timeouts and cancellation
// - No need for custom state machines
</code></pre>

<p><strong>Why Temporal over hand-rolled sagas:</strong></p>
<ul>
<li><strong>Durability</strong>: Workflow state is persisted. If the service restarts, execution resumes exactly where it left off.</li>
<li><strong>Visibility</strong>: Built-in UI shows workflow status, history, and enables debugging.</li>
<li><strong>Retry policies</strong>: Configurable per activity — no need to implement exponential backoff manually.</li>
<li><strong>Versioning</strong>: Support for workflow versioning during deployments.</li>
</ul>

<div class="qa-block">
<div class="qa-q">Q: How do you handle distributed transactions across microservices?</div>
<div class="qa-a"><strong>Use the Saga pattern</strong>, not 2PC. Here's the approach:<br/><br/>1. <strong>Break the transaction into local transactions</strong>: Each service performs its own local ACID transaction<br/>2. <strong>Choreography or Orchestration</strong>: Use Kafka events (choreography) for simple flows, or Temporal (orchestration) for complex multi-step workflows<br/>3. <strong>Compensating transactions</strong>: For each step, define a rollback action (e.g., refund payment, release inventory)<br/>4. <strong>Idempotency</strong>: Every step must be idempotent — retries are inevitable<br/>5. <strong>Monitoring</strong>: Track saga state for stuck/failed workflows, alert on DLQ<br/><br/><strong>Example from Niyo (microservices)</strong>: For a cross-border payment flow involving currency conversion, compliance check, and fund transfer — we used Temporal to orchestrate the saga. Each step was an activity with retry policies. If compliance check failed, Temporal automatically executed compensating activities to reverse the currency reservation.</div>
</div>
`
  }
];
