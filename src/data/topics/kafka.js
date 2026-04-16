export const kafka = [
  {
    id: 'kafka-architecture',
    title: 'Kafka Architecture',
    category: 'Kafka',
    starterCode: `// Simulating Kafka Broker + Topic + Partition Architecture
// Browser-compatible simulation using classes and arrays

class KafkaBroker {
  constructor(id) {
    this.id = id;
    this.topics = {};
    console.log(\`Broker \${id} started\`);
  }

  createTopic(name, numPartitions) {
    this.topics[name] = Array.from({ length: numPartitions }, (_, i) => ({
      partitionId: i,
      segments: [],
      highWatermark: 0,
      logEndOffset: 0,
    }));
    console.log(\`Topic "\${name}" created with \${numPartitions} partitions on broker \${this.id}\`);
  }

  append(topic, partitionId, message) {
    const partition = this.topics[topic][partitionId];
    const offset = partition.logEndOffset++;
    partition.segments.push({ offset, value: message, timestamp: Date.now() });
    partition.highWatermark = partition.logEndOffset;
    console.log(\`[Broker \${this.id}] Topic=\${topic} Partition=\${partitionId} Offset=\${offset} => "\${message}"\`);
    return offset;
  }

  read(topic, partitionId, fromOffset) {
    const partition = this.topics[topic][partitionId];
    return partition.segments.filter(s => s.offset >= fromOffset);
  }
}

// Simulate partition assignment (key-based hashing)
function partitionForKey(key, numPartitions) {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return hash % numPartitions;
}

// --- Demo ---
const broker = new KafkaBroker(0);
broker.createTopic('orders', 3);

const messages = [
  { key: 'user-101', value: 'Order #1 placed' },
  { key: 'user-202', value: 'Order #2 placed' },
  { key: 'user-101', value: 'Order #3 placed' },
  { key: 'user-303', value: 'Order #4 placed' },
  { key: 'user-202', value: 'Order #5 placed' },
];

console.log('\\n=== Producing messages (key-based partitioning) ===');
for (const msg of messages) {
  const p = partitionForKey(msg.key, 3);
  broker.append('orders', p, \`[\${msg.key}] \${msg.value}\`);
}

console.log('\\n=== Reading all messages from each partition ===');
for (let p = 0; p < 3; p++) {
  const records = broker.read('orders', p, 0);
  console.log(\`Partition \${p}: \${records.length} records\`, records.map(r => r.value));
}
console.log('\\nNotice: same key always goes to same partition (ordering guarantee per key)');`,
    content: `
<h1>Kafka Architecture</h1>
<p>Apache Kafka is a <strong>distributed, fault-tolerant, high-throughput event streaming platform</strong> originally developed at LinkedIn. Understanding its architecture deeply is critical for SDE3 interviews, especially for system design and distributed systems questions.</p>

<h2>High-Level Architecture</h2>
<pre><code>                        ┌──────────────────────────────┐
                        │        Kafka Cluster           │
  ┌──────────┐          │  ┌────────┐  ┌────────┐       │         ┌──────────┐
  │ Producer  │──────────│─▶│Broker 0│  │Broker 1│       │────────▶│ Consumer │
  │ (App)     │          │  │(Ctrl)  │  │        │       │         │ Group A  │
  └──────────┘          │  └────────┘  └────────┘       │         └──────────┘
                        │  ┌────────┐                    │         ┌──────────┐
  ┌──────────┐          │  │Broker 2│                    │────────▶│ Consumer │
  │ Producer  │──────────│─▶│        │                    │         │ Group B  │
  │ (App)     │          │  └────────┘                    │         └──────────┘
  └──────────┘          │                                │
                        │  ┌──────────────────────────┐  │
                        │  │ ZooKeeper / KRaft Quorum  │  │
                        │  └──────────────────────────┘  │
                        └──────────────────────────────┘</code></pre>

<h2>Brokers</h2>
<p>A <strong>broker</strong> is a single Kafka server. Each broker:</p>
<ul>
  <li>Stores a subset of partitions on disk as an append-only commit log</li>
  <li>Handles produce and fetch requests from clients</li>
  <li>Participates in replication (leader or follower for each partition)</li>
  <li>Is identified by a unique integer <code>broker.id</code></li>
</ul>
<p>In a typical production cluster you run 3-12+ brokers across racks/AZs for fault tolerance.</p>

<h3>Controller Broker</h3>
<p>One broker is elected as the <strong>controller</strong>. The controller is responsible for:</p>
<ul>
  <li>Partition leader election when a broker goes down</li>
  <li>Reassigning partitions during broker additions or removals</li>
  <li>Managing ISR (In-Sync Replica) list updates</li>
  <li>Communicating metadata changes to other brokers via LeaderAndIsr and UpdateMetadata requests</li>
</ul>

<h2>ZooKeeper vs KRaft</h2>
<table>
  <tr><th>Aspect</th><th>ZooKeeper Mode</th><th>KRaft Mode (3.3+)</th></tr>
  <tr><td>Metadata storage</td><td>External ZooKeeper ensemble</td><td>Internal Raft quorum</td></tr>
  <tr><td>Controller election</td><td>Ephemeral znode race</td><td>Raft leader election</td></tr>
  <tr><td>Scalability</td><td>~200K partitions per cluster</td><td>Millions of partitions</td></tr>
  <tr><td>Operational overhead</td><td>Two separate systems</td><td>Single system</td></tr>
  <tr><td>Recovery speed</td><td>Slow (full metadata reload)</td><td>Fast (incremental Raft log)</td></tr>
  <tr><td>Production ready</td><td>Yes (legacy)</td><td>Yes (Kafka 3.6+ recommended)</td></tr>
</table>

<div class="warning-note">KRaft is the future of Kafka. ZooKeeper is deprecated as of Kafka 3.5 and will be fully removed in Kafka 4.0. New deployments should always use KRaft.</div>

<h2>Topics, Partitions, and Offsets</h2>
<h3>Topics</h3>
<p>A <strong>topic</strong> is a named feed/category to which records are published. Think of it as a database table or a filesystem directory. Topics are <strong>multi-subscriber</strong>: many consumer groups can read from the same topic independently.</p>

<h3>Partitions</h3>
<p>Each topic is split into one or more <strong>partitions</strong>. Each partition is:</p>
<ul>
  <li>An <strong>ordered, immutable, append-only</strong> sequence of records (a commit log)</li>
  <li>Stored on a single broker (the partition leader) with replicas on other brokers</li>
  <li>The <strong>unit of parallelism</strong>: you can have at most as many consumers in a group as partitions</li>
</ul>

<pre><code>Topic: "orders" (3 partitions, replication-factor=3)

  Partition 0: [0][1][2][3][4][5][6]...  → Leader: Broker 0, Followers: Broker 1, 2
  Partition 1: [0][1][2][3][4]...         → Leader: Broker 1, Followers: Broker 0, 2
  Partition 2: [0][1][2][3][4][5]...      → Leader: Broker 2, Followers: Broker 0, 1

  Each [] is a record at that offset.</code></pre>

<h3>Offsets</h3>
<p>Each record within a partition gets a sequential, monotonically increasing <strong>offset</strong> (64-bit integer). Offsets are unique only within a partition. The consumer tracks which offset it has consumed — this is how Kafka achieves its high-performance "dumb broker, smart consumer" design.</p>

<pre><code>Key offsets for a consumer:
  ┌──────────────────────────────────────────────┐
  │ Log Start     Committed      Log End          │
  │ Offset        Offset         Offset           │
  │   ↓              ↓              ↓              │
  │  [0][1][2]...[45][46][47]...[52][53]          │
  │              ▲                    ▲             │
  │         Last consumed      Newest record       │
  │                                                │
  │  Consumer Lag = Log End Offset - Committed     │
  │                 = 53 - 46 = 7 records behind   │
  └──────────────────────────────────────────────┘</code></pre>

<h2>Log-Structured Storage</h2>
<p>Kafka stores each partition as a set of <strong>segment files</strong> on disk:</p>

<pre><code>/var/kafka-logs/orders-0/         ← Partition 0 directory
  ├── 00000000000000000000.log    ← Segment file (records 0-999)
  ├── 00000000000000000000.index  ← Offset index (sparse)
  ├── 00000000000000000000.timeindex  ← Timestamp index
  ├── 00000000000000001000.log    ← Next segment (records 1000-1999)
  ├── 00000000000000001000.index
  ├── 00000000000000001000.timeindex
  └── leader-epoch-checkpoint</code></pre>

<h3>Segment Details</h3>
<ul>
  <li><strong>.log file</strong>: The actual record data, stored sequentially. Records are written in batches (RecordBatch format since Kafka 0.11).</li>
  <li><strong>.index file</strong>: A sparse memory-mapped index mapping offsets to physical file positions. Every Nth record is indexed (controlled by <code>log.index.interval.bytes</code>).</li>
  <li><strong>.timeindex file</strong>: Maps timestamps to offsets, enabling time-based seeking.</li>
  <li>New segments are rolled when <code>log.segment.bytes</code> (default 1GB) or <code>log.roll.ms</code> is reached.</li>
</ul>

<h3>Log Compaction</h3>
<p>Kafka supports two cleanup policies:</p>
<table>
  <tr><th>Policy</th><th>Behavior</th><th>Use Case</th></tr>
  <tr><td><code>delete</code></td><td>Remove segments older than <code>retention.ms</code> or exceeding <code>retention.bytes</code></td><td>Event streams, logs</td></tr>
  <tr><td><code>compact</code></td><td>Keep only the latest value per key (tombstones with null delete keys)</td><td>Changelogs, snapshots, KTable backing</td></tr>
  <tr><td><code>compact,delete</code></td><td>Compact first, then delete old segments</td><td>Compacted topics with retention limits</td></tr>
</table>

<pre><code>Before compaction (key → value):
  [A:1] [B:2] [A:3] [C:4] [B:5] [A:6] [C:null]

After compaction:
  [B:5] [A:6]
  (C deleted via tombstone, older A and B values removed)</code></pre>

<h2>ISR (In-Sync Replicas)</h2>
<p>The ISR is the set of replicas that are <strong>fully caught up</strong> with the leader. A replica is in the ISR if it has fetched all messages up to the leader's log end offset within <code>replica.lag.time.max.ms</code> (default 30s).</p>

<pre><code>Partition 0 (replication-factor = 3):
  Leader:   Broker 0  (LEO = 100, HW = 98)
  Follower: Broker 1  (LEO = 98)  ← In ISR
  Follower: Broker 2  (LEO = 95)  ← OUT of ISR (lagging)

  ISR = {Broker 0, Broker 1}
  HW (High Watermark) = min(LEO of all ISR members) = 98
  Consumers can only read up to HW = offset 98</code></pre>

<p>Key properties:</p>
<ul>
  <li>Only ISR members are eligible for leader election (unless <code>unclean.leader.election.enable=true</code>)</li>
  <li><code>min.insync.replicas</code> defines minimum ISR size for a produce with <code>acks=all</code> to succeed</li>
  <li>If ISR shrinks below <code>min.insync.replicas</code>, producers with <code>acks=all</code> receive <code>NotEnoughReplicasException</code></li>
</ul>

<h2>Zero-Copy Transfer</h2>
<p>Kafka achieves extreme throughput by leveraging the OS <strong>sendfile()</strong> system call (zero-copy):</p>

<pre><code>Traditional path (4 copies, 4 context switches):
  Disk → Kernel Buffer → User Buffer → Socket Buffer → NIC

Zero-copy path (2 copies, 2 context switches):
  Disk → Kernel Buffer → NIC (via DMA)

  sendfile() tells the kernel to transfer data directly from
  the page cache to the network socket — the JVM never touches
  the bytes.</code></pre>

<p>This works because Kafka messages are stored in the same binary format on disk as sent over the network. No serialization/deserialization is needed on the broker side.</p>

<h3>Other Performance Optimizations</h3>
<ul>
  <li><strong>Sequential I/O</strong>: Append-only writes achieve disk throughput close to memory bandwidth</li>
  <li><strong>Page cache</strong>: Kafka relies on the OS page cache rather than JVM heap, avoiding GC overhead</li>
  <li><strong>Batching</strong>: Records are written and fetched in batches to amortize network and disk overhead</li>
  <li><strong>Compression</strong>: Batches are compressed end-to-end (producer → broker → consumer)</li>
</ul>

<h2>Metadata Flow</h2>
<pre><code>1. Client sends Metadata request to any broker (bootstrap server)
2. Broker returns full topic-partition-leader mapping
3. Client caches metadata and connects directly to partition leaders
4. Metadata refreshed on errors or periodically (metadata.max.age.ms)</code></pre>

<div class="warning-note">Producers and consumers connect to partition leaders directly for data. The bootstrap server list is only used for initial metadata discovery. Always provide multiple bootstrap servers for resilience.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: What happens when a Kafka broker goes down? Walk through the recovery process.</div>
  <div class="qa-a">When a broker goes down: (1) The controller detects the failure via ZooKeeper session timeout or KRaft heartbeat timeout. (2) For every partition where the dead broker was leader, the controller elects a new leader from the ISR. (3) The controller sends LeaderAndIsr requests to the new leaders and UpdateMetadata to all brokers. (4) Producers and consumers get metadata errors, refresh their metadata, and reconnect to new leaders. (5) When the broker comes back, it starts fetching from current leaders for all its assigned partitions and re-joins ISR once caught up. Total failover time is typically 1-10 seconds depending on the number of partitions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why does Kafka use an append-only log instead of a traditional database structure?</div>
  <div class="qa-a">Append-only logs give Kafka several critical advantages: (1) Sequential writes are 100-1000x faster than random writes on spinning disks and still faster on SSDs. (2) No in-place mutations means no locking or complex concurrency control. (3) The OS page cache can efficiently prefetch sequential reads. (4) Zero-copy transfer is possible because the on-disk format matches the wire format. (5) Compaction and retention can run as background processes without affecting write path. (6) Replicas can simply copy the log byte-for-byte. This design trades random-access flexibility for extreme throughput and simplicity.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Kafka achieve exactly-once semantics at the storage layer?</div>
  <div class="qa-a">Kafka uses producer IDs (PID) and sequence numbers. When <code>enable.idempotence=true</code>, the broker assigns a unique PID to each producer and the producer tags each record batch with a monotonically increasing sequence number per partition. The broker tracks the last 5 sequence numbers per PID per partition. If a duplicate batch arrives (same PID + sequence), the broker returns success but does not write it again. This prevents duplicates from retries and is the foundation of exactly-once semantics (combined with transactions for cross-partition atomicity).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the role of the High Watermark (HW) and Log End Offset (LEO) in replication.</div>
  <div class="qa-a">LEO is the offset of the next record to be written to a replica's log — it represents the latest data that replica has. HW is the minimum LEO across all ISR members — it represents the offset up to which data is committed (safely replicated). Consumers can only read up to HW. When a producer sends a batch, the leader appends it (increasing its LEO), followers fetch and append it (increasing their LEOs), and when all ISR members have the data, the leader advances HW. This ensures consumers never see data that could be lost if the leader fails. After a leader failure, the new leader truncates its log to HW to ensure consistency.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: You have a topic with 100 partitions across 5 brokers. One broker goes down permanently. What is your recovery plan?</div>
  <div class="qa-a">Immediate impact: 20 partitions lose one replica, and those where the dead broker was leader need leader election. Short-term: (1) Controller automatically elects new leaders from ISR for affected partitions. (2) Monitor that ISR sizes are maintained for remaining partitions. Medium-term: (1) Add a replacement broker. (2) Use <code>kafka-reassign-partitions</code> to move the dead broker's replicas to the new broker. (3) Monitor reassignment progress via <code>--verify</code>. (4) Ensure rack-awareness is maintained. Key configs: If <code>min.insync.replicas=2</code> and <code>replication-factor=3</code>, we still have 2 replicas so no data loss and no availability impact for acks=all producers. Long-term: Set up monitoring for under-replicated partitions and automate broker replacement.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the trade-offs of increasing the number of partitions for a topic?</div>
  <div class="qa-a">More partitions means: (1) Higher parallelism — more consumers can read concurrently. (2) Higher throughput since each partition can be on a different broker and disk. However, trade-offs include: (1) More file handles and memory on each broker (each partition has segment files, indexes). (2) Longer leader election time during broker failures (more partitions to process). (3) Higher end-to-end latency because the HW can only advance when all ISR members replicate — more partitions means more replication traffic. (4) More consumer rebalance time in consumer groups. (5) Cannot reduce partition count once increased. Rule of thumb: start with (expected throughput / throughput per partition) and adjust. A good target is 10-20 partitions per topic for most workloads, scaling up for high-throughput topics.</div>
</div>
`
  },
  {
    id: 'kafka-producers-consumers',
    title: 'Kafka Producers & Consumers',
    category: 'Kafka',
    starterCode: `// Simulating Kafka Producer & Consumer with Partitioning and Consumer Groups

class Partition {
  constructor(id) { this.id = id; this.log = []; this.offset = 0; }
  append(record) {
    const off = this.offset++;
    this.log.push({ offset: off, ...record, timestamp: Date.now() });
    return off;
  }
  read(fromOffset, maxRecords = 10) {
    return this.log.filter(r => r.offset >= fromOffset).slice(0, maxRecords);
  }
}

class Topic {
  constructor(name, numPartitions) {
    this.name = name;
    this.partitions = Array.from({ length: numPartitions }, (_, i) => new Partition(i));
  }
}

// --- Producer ---
class Producer {
  constructor(config = {}) {
    this.acks = config.acks ?? 'all';
    this.batchSize = config.batchSize ?? 3;
    this.buffer = [];
    this.partitioner = config.partitioner ?? 'key-hash';
  }

  hash(key, numPartitions) {
    let h = 0;
    for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
    return h % numPartitions;
  }

  send(topic, key, value) {
    const partitionId = key != null
      ? this.hash(key, topic.partitions.length)
      : Math.floor(Math.random() * topic.partitions.length);
    const offset = topic.partitions[partitionId].append({ key, value });
    console.log(\`[Producer] acks=\${this.acks} | Topic=\${topic.name} P\${partitionId} Offset=\${offset} | key=\${key} value="\${value}"\`);
  }
}

// --- Consumer Group ---
class ConsumerGroup {
  constructor(groupId, topic) {
    this.groupId = groupId;
    this.topic = topic;
    this.consumers = [];
    this.assignment = new Map(); // consumerId → [partitionIds]
    this.committedOffsets = {}; // partitionId → offset
    topic.partitions.forEach((_, i) => this.committedOffsets[i] = 0);
  }

  addConsumer(id) {
    this.consumers.push(id);
    this.rebalance();
    return id;
  }

  rebalance() {
    console.log(\`\\n[Rebalance] Group "\${this.groupId}" — \${this.consumers.length} consumers, \${this.topic.partitions.length} partitions\`);
    this.assignment.clear();
    this.consumers.forEach(c => this.assignment.set(c, []));
    this.topic.partitions.forEach((p, i) => {
      const consumer = this.consumers[i % this.consumers.length];
      this.assignment.get(consumer).push(i);
    });
    for (const [c, parts] of this.assignment) {
      console.log(\`  Consumer "\${c}" assigned partitions: [\${parts.join(', ')}]\`);
    }
  }

  poll(consumerId, maxRecords = 5) {
    const parts = this.assignment.get(consumerId) || [];
    const records = [];
    for (const pid of parts) {
      const fromOffset = this.committedOffsets[pid] || 0;
      const fetched = this.topic.partitions[pid].read(fromOffset, maxRecords);
      records.push(...fetched.map(r => ({ ...r, partition: pid })));
      if (fetched.length > 0) {
        this.committedOffsets[pid] = fetched[fetched.length - 1].offset + 1;
      }
    }
    return records;
  }
}

// --- Demo ---
const topic = new Topic('user-events', 4);
const producer = new Producer({ acks: 'all' });

console.log('=== Producing Messages ===');
['alice', 'bob', 'alice', 'charlie', 'bob', 'alice', 'dave', 'charlie'].forEach((user, i) => {
  producer.send(topic, user, \`Event #\${i + 1} from \${user}\`);
});

console.log('\\n=== Consumer Group with 2 Consumers ===');
const group = new ConsumerGroup('analytics-group', topic);
group.addConsumer('consumer-1');
group.addConsumer('consumer-2');

console.log('\\n=== Polling Records ===');
for (const cid of ['consumer-1', 'consumer-2']) {
  const records = group.poll(cid);
  console.log(\`\\n\${cid} received \${records.length} records:\`);
  records.forEach(r => console.log(\`  P\${r.partition} Offset=\${r.offset} key=\${r.key} => \${r.value}\`));
}

console.log('\\n=== Adding consumer-3 triggers rebalance ===');
group.addConsumer('consumer-3');`,
    content: `
<h1>Kafka Producers & Consumers</h1>
<p>The producer and consumer APIs are the primary interfaces for applications interacting with Kafka. An SDE3 must understand their internals deeply — from batching and partitioning strategies to consumer group rebalancing protocols.</p>

<h2>Producer Architecture</h2>
<pre><code>Application Thread               Producer Internals
  │                                │
  │ producer.send(record) ────────▶│ Serializer (key + value)
  │                                │       │
  │                                │  Partitioner (assign partition)
  │                                │       │
  │                                │  RecordAccumulator
  │                                │   ┌────────────────────┐
  │                                │   │ Batch for P0       │
  │                                │   │ Batch for P1       │
  │                                │   │ Batch for P2       │
  │                                │   └────────────────────┘
  │                                │       │
  │                                │  Sender Thread (background)
  │                                │   • Groups batches by broker
  │                                │   • Sends ProduceRequest
  │                                │   • Handles acks/retries
  │                                │       │
  │                                │       ▼
  │                                │   Kafka Brokers</code></pre>

<h2>Producer Acknowledgments (acks)</h2>
<table>
  <tr><th>acks</th><th>Behavior</th><th>Durability</th><th>Latency</th><th>Throughput</th></tr>
  <tr><td><code>0</code></td><td>Fire and forget, no response from broker</td><td>Lowest — data loss on any failure</td><td>Lowest</td><td>Highest</td></tr>
  <tr><td><code>1</code></td><td>Leader writes to its local log, responds</td><td>Medium — data loss if leader dies before replication</td><td>Medium</td><td>High</td></tr>
  <tr><td><code>all</code> (-1)</td><td>Leader waits for all ISR replicas to acknowledge</td><td>Highest — no data loss as long as ISR ≥ min.insync.replicas</td><td>Highest</td><td>Lower</td></tr>
</table>

<div class="warning-note">Using <code>acks=all</code> without setting <code>min.insync.replicas=2</code> (or higher) is a common mistake. If ISR shrinks to just the leader, <code>acks=all</code> effectively becomes <code>acks=1</code>. Always set both: <code>acks=all</code> + <code>min.insync.replicas=2</code> + <code>replication.factor=3</code>.</div>

<h2>Batching and Compression</h2>
<pre><code>Key producer configs for throughput:
┌──────────────────────┬──────────────────────────────────────────────────────┐
│ batch.size           │ Max bytes per batch (default 16KB). Larger = more   │
│                      │ throughput but more memory per partition.            │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ linger.ms            │ Wait up to N ms for more records before sending a   │
│                      │ batch (default 0). Set 5-100ms for throughput.      │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ buffer.memory        │ Total memory for unsent batches (default 32MB).     │
│                      │ If full, producer.send() blocks for max.block.ms.   │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ compression.type     │ none, gzip, snappy, lz4, zstd. Compression is      │
│                      │ per-batch, preserved on broker and decompressed     │
│                      │ only by consumer.                                   │
└──────────────────────┴──────────────────────────────────────────────────────┘</code></pre>

<h2>Idempotent Producer</h2>
<p>Enabled via <code>enable.idempotence=true</code> (default since Kafka 3.0):</p>
<ul>
  <li>Producer gets a unique <strong>Producer ID (PID)</strong> from the broker</li>
  <li>Each record batch gets a <strong>sequence number</strong> per partition</li>
  <li>Broker deduplicates batches with the same PID + sequence, preventing duplicates from retries</li>
  <li>Implies <code>acks=all</code>, <code>retries=MAX_INT</code>, <code>max.in.flight.requests.per.connection ≤ 5</code></li>
</ul>

<pre><code>// Producer config for idempotent production (Kafka 3.0+ defaults)
Properties props = new Properties();
props.put("bootstrap.servers", "broker1:9092,broker2:9092");
props.put("enable.idempotence", "true");     // deduplicate retries
props.put("acks", "all");                    // implied by idempotence
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");</code></pre>

<h2>Partitioner Strategies</h2>
<table>
  <tr><th>Strategy</th><th>Behavior</th><th>When to Use</th></tr>
  <tr><td><strong>Key-based (murmur2 hash)</strong></td><td>Hash of key mod numPartitions. Same key always goes to same partition.</td><td>When you need ordering per key (e.g., events per user)</td></tr>
  <tr><td><strong>Round-robin</strong></td><td>Distribute records evenly across partitions (used when key is null, pre-2.4)</td><td>When ordering doesn't matter and you want even load</td></tr>
  <tr><td><strong>Sticky (default since 2.4)</strong></td><td>For null keys, fill one batch for a single partition before moving to the next</td><td>Better batching efficiency with null keys</td></tr>
  <tr><td><strong>Custom</strong></td><td>Implement <code>Partitioner</code> interface for custom logic</td><td>Geo-routing, priority partitions, etc.</td></tr>
</table>

<div class="warning-note">Changing the number of partitions breaks key-based partitioning! Records with the same key may go to a different partition after adding partitions. Plan your partition count upfront or use a lookup-based partitioner.</div>

<h2>Consumer Architecture</h2>
<pre><code>Consumer Group "order-processing" (3 consumers, 6 partitions)

  ┌───────────┐    ┌───────────┐    ┌───────────┐
  │Consumer C1│    │Consumer C2│    │Consumer C3│
  │  P0, P1   │    │  P2, P3   │    │  P4, P5   │
  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
        │                │                │
        ▼                ▼                ▼
  ┌──────────────────────────────────────────────┐
  │         Kafka Topic (6 partitions)           │
  │  P0  P1  P2  P3  P4  P5                     │
  └──────────────────────────────────────────────┘

  Rule: Each partition is consumed by exactly ONE consumer
        in the group. If consumers > partitions, some sit idle.</code></pre>

<h2>Consumer Group Rebalancing</h2>
<p>Rebalancing redistributes partitions among consumers when:</p>
<ul>
  <li>A consumer joins or leaves the group</li>
  <li>A consumer crashes (misses heartbeat within <code>session.timeout.ms</code>)</li>
  <li>A consumer takes too long to process (<code>max.poll.interval.ms</code> exceeded)</li>
  <li>Topic partitions change</li>
</ul>

<h3>Rebalancing Protocols</h3>
<table>
  <tr><th>Protocol</th><th>Behavior</th><th>Downtime</th></tr>
  <tr><td><strong>Eager (legacy)</strong></td><td>All consumers revoke ALL partitions, then reassign everything</td><td>Full stop-the-world during rebalance</td></tr>
  <tr><td><strong>Cooperative / Incremental</strong></td><td>Only revoke partitions that need to move; consumers keep processing assigned partitions</td><td>Minimal — only migrating partitions pause</td></tr>
</table>

<pre><code>// Use cooperative rebalancing (recommended)
props.put("partition.assignment.strategy",
    "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");

// Assignment strategies available:
// RangeAssignor          — contiguous ranges per consumer (default)
// RoundRobinAssignor     — round-robin across consumers
// StickyAssignor         — minimize partition movement (eager)
// CooperativeStickyAssignor — sticky + cooperative (recommended)</code></pre>

<h2>Offset Management</h2>
<p>Consumer offsets are stored in an internal topic <code>__consumer_offsets</code> (50 partitions by default).</p>

<h3>Auto Commit vs Manual Commit</h3>
<table>
  <tr><th>Mode</th><th>Config</th><th>Behavior</th><th>Risk</th></tr>
  <tr><td>Auto commit</td><td><code>enable.auto.commit=true</code>, <code>auto.commit.interval.ms=5000</code></td><td>Offsets committed periodically in background</td><td>At-most-once or at-least-once depending on timing; possible duplicates or loss</td></tr>
  <tr><td>Sync manual</td><td><code>commitSync()</code></td><td>Blocks until offset is committed</td><td>Slower but guarantees offset is stored</td></tr>
  <tr><td>Async manual</td><td><code>commitAsync()</code></td><td>Non-blocking, callback on completion</td><td>May fail silently; use for intermediate commits</td></tr>
</table>

<pre><code>// Manual commit pattern (recommended for at-least-once)
consumer.subscribe(Arrays.asList("orders"));
while (true) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord record : records) {
        processRecord(record);  // Process first
    }
    consumer.commitSync();      // Then commit (at-least-once)
}

// For exactly-once: commit offset in the same transaction as the output
// (e.g., write to DB + commit offset atomically)</code></pre>

<h2>Consumer Lag Monitoring</h2>
<p><strong>Consumer lag</strong> = Log End Offset - Consumer Committed Offset. It measures how far behind a consumer group is.</p>
<pre><code># Check consumer lag via CLI
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
  --group order-processing --describe

GROUP              TOPIC     PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
order-processing   orders    0          12450           12500           50
order-processing   orders    1          9800            9800            0
order-processing   orders    2          11200           11350           150</code></pre>

<p>Monitoring consumer lag is critical in production. Common tools: Burrow (LinkedIn), Kafka Exporter + Prometheus + Grafana, Confluent Control Center.</p>

<h2>Important Consumer Configs</h2>
<pre><code>┌──────────────────────────┬──────────┬─────────────────────────────────────────────┐
│ Config                   │ Default  │ Purpose                                     │
├──────────────────────────┼──────────┼─────────────────────────────────────────────┤
│ max.poll.records         │ 500      │ Max records per poll() call                 │
│ max.poll.interval.ms     │ 300000   │ Max time between poll() before rebalance    │
│ session.timeout.ms       │ 45000    │ Heartbeat timeout (consumer considered dead)│
│ heartbeat.interval.ms    │ 3000     │ Heartbeat frequency (< session.timeout/3)   │
│ fetch.min.bytes          │ 1        │ Min data to return from fetch               │
│ fetch.max.wait.ms        │ 500      │ Max wait if fetch.min.bytes not met         │
│ auto.offset.reset        │ latest   │ Where to start when no committed offset:    │
│                          │          │ earliest / latest / none                    │
└──────────────────────────┴──────────┴─────────────────────────────────────────────┘</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: A consumer group has 4 consumers but the topic has 3 partitions. What happens?</div>
  <div class="qa-a">One consumer will sit idle with no partition assignment. Kafka assigns each partition to exactly one consumer within a group. With 4 consumers and 3 partitions, 3 consumers each get one partition and the 4th consumer remains idle (but stays in the group as a standby). If one of the active consumers fails, the idle consumer will pick up the orphaned partition during rebalance. This is why the max effective parallelism for a consumer group equals the number of partitions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between eager and cooperative rebalancing. Why does cooperative matter?</div>
  <div class="qa-a">In <strong>eager rebalancing</strong>, when a rebalance is triggered, ALL consumers revoke ALL their partitions simultaneously, then the group coordinator reassigns them. This creates a "stop-the-world" window where no consumer is processing any data. In <strong>cooperative rebalancing</strong>, only the partitions that need to move are revoked. Consumers continue processing their retained partitions throughout the rebalance. This is critical for large deployments — a group with 100 consumers and 1000 partitions, eager rebalancing causes complete processing halt for seconds or longer. With cooperative rebalancing, if only 10 partitions need to move, 990 partitions continue uninterrupted. The rebalance happens in two phases: (1) determine what needs to move, (2) revoke and reassign only those partitions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle a "slow consumer" that is falling behind?</div>
  <div class="qa-a">Diagnosis: Check consumer lag metrics. If lag is increasing, the consumer is slower than the producer. Solutions: (1) <strong>Scale out</strong>: Add more partitions and consumers (up to partitions = consumers). (2) <strong>Optimize processing</strong>: Use async processing, batch database writes, reduce per-record processing time. (3) <strong>Increase poll batch size</strong>: Set <code>max.poll.records</code> higher and process records in batches. (4) <strong>Separate processing from polling</strong>: Use a thread pool for record processing, but be careful with offset management — only commit offsets for fully processed records. (5) <strong>Increase max.poll.interval.ms</strong> if processing is inherently slow to prevent unnecessary rebalances. (6) <strong>Back-pressure</strong>: If lag is temporary (burst), it will self-recover. If sustained, you need more consumers/partitions.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a Consumer Group ID and a Group Instance ID?</div>
  <div class="qa-a"><code>group.id</code> identifies the consumer group — all consumers sharing the same group.id cooperate to consume a topic. <code>group.instance.id</code> is a static membership feature (KIP-345). When set, it gives a consumer a persistent identity. If the consumer disconnects and reconnects with the same instance ID within <code>session.timeout.ms</code>, it gets back its previous partition assignment without triggering a rebalance. This is crucial for stateful consumers (e.g., those maintaining local caches or RocksDB state stores in Kafka Streams) where rebalancing is expensive. Without static membership, any transient network glitch causes a full rebalance.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does the sticky partitioner work and why was it introduced?</div>
  <div class="qa-a">Before Kafka 2.4, null-key records were distributed via round-robin across partitions, meaning each record went to a different partition. This prevented efficient batching because the RecordAccumulator had many small, partially-filled batches across all partitions. The sticky partitioner "sticks" to one partition until a batch is full (or linger.ms expires), then switches to another partition. This dramatically improves batching efficiency — you get fewer, larger batches which compress better and require fewer network requests. For null-key, high-throughput workloads, the sticky partitioner can improve throughput by 2x or more while reducing latency.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Your producer is getting <code>NotEnoughReplicasException</code>. Diagnose the issue.</div>
  <div class="qa-a">This error means the number of in-sync replicas (ISR) for a partition has dropped below <code>min.insync.replicas</code> and the producer is using <code>acks=all</code>. Root causes: (1) Broker(s) are down — check broker health and logs. (2) Followers are lagging beyond <code>replica.lag.time.max.ms</code> due to high load, network issues, or slow disks — the lagging replicas get kicked out of ISR. (3) Under-provisioned cluster — brokers can't keep up with replication traffic. Diagnosis: Check <code>kafka-topics.sh --describe</code> for ISR sizes. Check under-replicated partitions metric. Resolution: Fix unhealthy brokers, add capacity, or temporarily lower <code>min.insync.replicas</code> (risky — reduces durability).</div>
</div>
`
  },
  {
    id: 'kafka-reliability',
    title: 'Kafka Reliability & Delivery',
    category: 'Kafka',
    starterCode: `// Simulating Kafka Delivery Semantics in Browser JavaScript

class SimulatedBroker {
  constructor() {
    this.log = [];
    this.producerSequences = {}; // PID → last sequence
    this.committed = new Set();
    this.dlq = [];
  }

  // Idempotent write: dedup by PID + sequence
  produce(pid, sequence, record) {
    const key = pid + ':' + sequence;
    if (this.producerSequences[pid] >= sequence) {
      console.log(\`  [Broker] DEDUP: PID=\${pid} seq=\${sequence} already seen, returning success without writing\`);
      return { status: 'duplicate', offset: -1 };
    }
    const offset = this.log.length;
    this.log.push({ offset, pid, sequence, ...record });
    this.producerSequences[pid] = sequence;
    return { status: 'ok', offset };
  }

  consume(fromOffset) {
    return this.log.filter(r => r.offset >= fromOffset);
  }
}

// === AT-MOST-ONCE ===
console.log('=== AT-MOST-ONCE DELIVERY ===');
console.log('Commit offset BEFORE processing. If processing fails, message is lost.');
const broker = new SimulatedBroker();
broker.produce('p1', 0, { value: 'msg-A' });
broker.produce('p1', 1, { value: 'msg-B' });
broker.produce('p1', 2, { value: 'msg-C' });

let consumerOffset = 0;
const records1 = broker.consume(consumerOffset);
consumerOffset = records1.length; // commit BEFORE processing
console.log(\`Committed offset=\${consumerOffset} BEFORE processing\`);
records1.forEach((r, i) => {
  if (i === 1) {
    console.log(\`  Processing \${r.value}... CRASHED! Message lost (already committed)\`);
  } else {
    console.log(\`  Processing \${r.value}... OK\`);
  }
});

// === AT-LEAST-ONCE ===
console.log('\\n=== AT-LEAST-ONCE DELIVERY ===');
console.log('Commit offset AFTER processing. If crash after process but before commit, reprocessed.');
let offset2 = 0;
const records2 = broker.consume(offset2);
let processedCount = 0;
records2.forEach((r, i) => {
  console.log(\`  Processing \${r.value}... OK\`);
  processedCount++;
  if (i === 1) {
    console.log(\`  CRASH after processing \${r.value} but before commit!\`);
    console.log(\`  On restart, will re-read from offset=\${offset2} → \${r.value} processed AGAIN\`);
  }
});
offset2 = processedCount; // commit AFTER processing
console.log(\`Committed offset=\${offset2}\`);

// === IDEMPOTENT PRODUCER ===
console.log('\\n=== IDEMPOTENT PRODUCER (deduplication) ===');
const broker2 = new SimulatedBroker();
console.log('Producer sends msg with PID=prod1, seq=0:');
console.log(' ', broker2.produce('prod1', 0, { value: 'order-created' }));
console.log('Network timeout! Producer retries same msg (PID=prod1, seq=0):');
console.log(' ', broker2.produce('prod1', 0, { value: 'order-created' }));
console.log('Producer sends next msg (PID=prod1, seq=1):');
console.log(' ', broker2.produce('prod1', 1, { value: 'order-updated' }));
console.log(\`Broker log has \${broker2.log.length} records (no duplicates):\`, broker2.log.map(r => r.value));

// === DEAD LETTER QUEUE ===
console.log('\\n=== DEAD LETTER QUEUE PATTERN ===');
const mainTopic = [
  { value: 'valid-event-1' },
  { value: 'POISON_PILL' },
  { value: 'valid-event-2' },
  { value: 'BAD_FORMAT' },
  { value: 'valid-event-3' },
];
const dlq = [];
let processed = 0;

for (const record of mainTopic) {
  try {
    if (record.value.includes('POISON') || record.value.includes('BAD')) {
      throw new Error(\`Cannot process: \${record.value}\`);
    }
    console.log(\`  Processed: \${record.value}\`);
    processed++;
  } catch (e) {
    dlq.push({ originalRecord: record, error: e.message, timestamp: Date.now() });
    console.log(\`  FAILED: \${record.value} → sent to DLQ\`);
  }
}
console.log(\`\\nProcessed: \${processed}, DLQ: \${dlq.length}\`);
console.log('DLQ contents:', dlq.map(d => d.originalRecord.value));`,
    content: `
<h1>Kafka Reliability & Delivery Semantics</h1>
<p>Understanding delivery guarantees is one of the most important aspects of Kafka for SDE3 interviews. Kafka can provide <strong>at-most-once</strong>, <strong>at-least-once</strong>, or <strong>exactly-once</strong> semantics depending on configuration.</p>

<h2>The Three Delivery Semantics</h2>
<table>
  <tr><th>Semantic</th><th>Guarantee</th><th>How</th><th>Use Case</th></tr>
  <tr><td><strong>At-most-once</strong></td><td>Messages may be lost, never duplicated</td><td>Commit offset before processing</td><td>Metrics, logs where loss is acceptable</td></tr>
  <tr><td><strong>At-least-once</strong></td><td>Messages never lost, may be duplicated</td><td>Commit offset after processing</td><td>Most common; requires idempotent consumers</td></tr>
  <tr><td><strong>Exactly-once</strong></td><td>Messages processed exactly once</td><td>Transactions + idempotent producer</td><td>Financial transactions, critical data pipelines</td></tr>
</table>

<h2>At-Most-Once</h2>
<pre><code>// Anti-pattern: committing before processing
while (true) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));
    consumer.commitSync();  // ← Offset committed FIRST
    for (ConsumerRecord record : records) {
        process(record);    // If this throws or crashes, message is LOST
    }
}

Timeline:
  poll() → [msg1, msg2, msg3]
  commitSync() → offset=3 stored in __consumer_offsets
  process(msg1) → OK
  process(msg2) → CRASH!

  After restart: consumer reads from offset=3
  msg2 and msg3 are LOST forever</code></pre>

<h2>At-Least-Once</h2>
<pre><code>// Standard pattern: commit after processing
while (true) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord record : records) {
        process(record);    // Process FIRST
    }
    consumer.commitSync();  // Then commit
}

Timeline:
  poll() → [msg1, msg2, msg3]
  process(msg1) → OK
  process(msg2) → OK
  process(msg3) → OK
  commitSync() → offset=3 stored

  BUT if crash after process(msg2) and before commitSync():
  After restart: consumer reads from previous offset
  msg1, msg2, msg3 are reprocessed → DUPLICATES

  Solution: Make consumers idempotent (use unique IDs, upserts, etc.)</code></pre>

<h2>Exactly-Once Semantics (EOS)</h2>
<p>Kafka's EOS is built on two foundations:</p>

<h3>1. Idempotent Producer</h3>
<pre><code>enable.idempotence=true (default since Kafka 3.0)

How it works:
  Producer                              Broker
    │                                     │
    │── ProduceRequest ──────────────────▶│
    │   PID=5, Seq=0, Data="order-1"     │  Write to log → offset 42
    │                                     │  Store: PID=5, lastSeq=0
    │◀──── Ack (offset=42) ──────────────│
    │                                     │
    │ (network timeout, no ack received)  │
    │                                     │
    │── RETRY same request ──────────────▶│
    │   PID=5, Seq=0, Data="order-1"     │  Check: PID=5, lastSeq=0 already!
    │                                     │  DEDUP — don't write again
    │◀──── Ack (offset=42) ──────────────│  Return same offset

Sequence tracking per partition per PID:
  Broker stores last 5 sequences per PID per partition
  OutOfOrderSequenceException if gap detected</code></pre>

<h3>2. Transactions</h3>
<p>Transactions extend idempotent production to enable <strong>atomic writes across multiple partitions and topics</strong>.</p>

<pre><code>// Transactional producer setup
Properties props = new Properties();
props.put("transactional.id", "order-processor-1");  // Unique per instance
props.put("enable.idempotence", "true");              // Implied

KafkaProducer producer = new KafkaProducer(props);
producer.initTransactions();

// Read-Process-Write pattern (exactly-once)
while (true) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));

    producer.beginTransaction();
    try {
        for (ConsumerRecord record : records) {
            // Process and produce output
            ProducerRecord output = transform(record);
            producer.send(output);
        }

        // Commit consumer offsets as part of the transaction
        producer.sendOffsetsToTransaction(
            currentOffsets,         // Map of topic-partition to offset
            consumer.groupMetadata()
        );

        producer.commitTransaction();
    } catch (Exception e) {
        producer.abortTransaction();
        // Consumer will re-read from last committed offset
    }
}</code></pre>

<h3>Transaction Internals</h3>
<pre><code>Transaction flow:
  1. Producer calls initTransactions()
     → Broker assigns PID, bumps epoch (fences old instances with same transactional.id)

  2. producer.beginTransaction()
     → Local state change only

  3. producer.send(record)
     → AddPartitionsToTxn request to Transaction Coordinator
     → ProduceRequest with transactional markers

  4. producer.sendOffsetsToTransaction(offsets, groupMetadata)
     → AddOffsetsToTxn request
     → TxnOffsetCommit to __consumer_offsets (marked as transactional)

  5. producer.commitTransaction()
     → EndTxn request to Transaction Coordinator
     → Coordinator writes COMMIT marker to all involved partitions
     → Offsets in __consumer_offsets become visible

  Consumer with isolation.level=read_committed:
     Only sees records from committed transactions
     Filters out records from aborted transactions</code></pre>

<h2>min.insync.replicas</h2>
<p>This broker/topic config defines the minimum number of ISR members required for a produce with <code>acks=all</code> to succeed:</p>

<table>
  <tr><th>replication.factor</th><th>min.insync.replicas</th><th>acks=all behavior</th><th>Tolerate broker failures</th></tr>
  <tr><td>3</td><td>2</td><td>Leader + 1 follower must ack</td><td>1 broker down OK</td></tr>
  <tr><td>3</td><td>3</td><td>All 3 must ack</td><td>0 — any failure blocks writes</td></tr>
  <tr><td>3</td><td>1</td><td>Only leader needs to ack (defeats purpose)</td><td>2 down, but data loss risk</td></tr>
  <tr><td>5</td><td>3</td><td>Leader + 2 followers</td><td>2 brokers down OK</td></tr>
</table>

<div class="warning-note">The golden rule for production: <code>replication.factor = 3</code>, <code>min.insync.replicas = 2</code>, <code>acks = all</code>. This tolerates 1 broker failure without data loss or availability impact.</div>

<h2>unclean.leader.election</h2>
<p>When all ISR members are offline, Kafka faces a choice:</p>
<ul>
  <li><code>unclean.leader.election.enable=false</code> (default): Partition stays offline until an ISR member recovers. <strong>No data loss, but unavailable.</strong></li>
  <li><code>unclean.leader.election.enable=true</code>: Allow an out-of-sync replica to become leader. <strong>Available, but messages not yet replicated to this replica are LOST.</strong></li>
</ul>

<pre><code>Scenario: replication.factor=3, ISR={B0, B1}
  B0 (leader) has offsets 0..100
  B1 (follower, in ISR) has offsets 0..100
  B2 (follower, out of ISR) has offsets 0..85

  B0 and B1 crash simultaneously.

  unclean.leader.election=false → Partition OFFLINE until B0 or B1 recovers
  unclean.leader.election=true  → B2 becomes leader, offsets 86-100 LOST</code></pre>

<h2>Message Ordering Guarantees</h2>
<ul>
  <li><strong>Within a partition</strong>: Total order guaranteed. Records are appended and consumed in the order they were produced.</li>
  <li><strong>Across partitions</strong>: No ordering guarantee. If you need global order, use a single partition (limits throughput).</li>
  <li><strong>Per-key ordering</strong>: Use key-based partitioning. All records with the same key go to the same partition, preserving their relative order.</li>
</ul>

<h3>Ordering with Retries</h3>
<pre><code>Without idempotence (max.in.flight.requests.per.connection > 1):
  Batch 1 (seq 0-4) ──→ Broker (FAILS, retry queued)
  Batch 2 (seq 5-9) ──→ Broker (SUCCESS, written)
  Batch 1 retry      ──→ Broker (SUCCESS, written)

  Result on broker: [5,6,7,8,9,0,1,2,3,4] ← OUT OF ORDER!

With idempotence:
  max.in.flight.requests.per.connection ≤ 5 is safe
  Broker tracks sequences and rejects out-of-order batches
  Producer retries maintain correct order</code></pre>

<h2>Dead Letter Queue (DLQ)</h2>
<p>A DLQ is a separate topic where messages that cannot be processed are sent instead of blocking the consumer or losing them.</p>

<pre><code>// DLQ pattern implementation
int maxRetries = 3;
while (true) {
    ConsumerRecords records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord record : records) {
        int attempts = 0;
        boolean success = false;
        while (attempts < maxRetries && !success) {
            try {
                process(record);
                success = true;
            } catch (RetryableException e) {
                attempts++;
                Thread.sleep(Math.min(1000 * (1 << attempts), 30000)); // exponential backoff
            } catch (NonRetryableException e) {
                break; // Don't retry
            }
        }
        if (!success) {
            // Send to DLQ with headers containing error info
            ProducerRecord dlqRecord = new ProducerRecord(
                "orders.DLQ", record.key(), record.value());
            dlqRecord.headers().add("error", e.getMessage().getBytes());
            dlqRecord.headers().add("original-topic", "orders".getBytes());
            dlqRecord.headers().add("retry-count", String.valueOf(attempts).getBytes());
            dlqProducer.send(dlqRecord);
        }
    }
    consumer.commitSync();
}</code></pre>

<div class="warning-note">Always monitor your DLQ. Set up alerts when DLQ lag increases. Have a process to investigate and replay DLQ messages after fixing the root cause.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Explain exactly-once semantics in Kafka end-to-end. What are its limitations?</div>
  <div class="qa-a">Kafka EOS guarantees that in a read-process-write pipeline, each input record is processed exactly once and the output is written exactly once. It works by combining: (1) Idempotent producer (dedup retries via PID+sequence), (2) Transactional writes (atomic multi-partition writes), (3) Consumer with <code>isolation.level=read_committed</code> (only sees committed data). Limitations: (1) EOS only works within the Kafka ecosystem — if your consumer writes to an external database, you need additional mechanisms (idempotent writes, outbox pattern). (2) Transaction overhead: ~10-20% throughput reduction. (3) Transactions have a timeout (<code>transaction.timeout.ms</code>, default 60s) — long-running transactions abort. (4) Cross-cluster EOS is not supported natively. (5) Zombie fencing requires unique <code>transactional.id</code> per input partition for proper fencing.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you ensure at-least-once delivery when writing from Kafka to a database?</div>
  <div class="qa-a">Pattern: Process then commit. (1) Poll records from Kafka. (2) Write results to the database. (3) Commit offsets to Kafka. If the consumer crashes after DB write but before offset commit, the record will be re-consumed and re-written to the DB (duplicate). To handle this, make the DB write idempotent: use UPSERT (INSERT ... ON CONFLICT UPDATE), or store the Kafka offset alongside the data in the same DB transaction (consumer stores <code>topic-partition-offset</code> in a metadata table; on startup, seeks to the stored offset rather than relying on __consumer_offsets). This gives you effectively-once processing with an external system.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Your Kafka cluster has <code>unclean.leader.election.enable=false</code> and a partition goes offline because all ISR members are down. What do you do?</div>
  <div class="qa-a">Immediate: (1) Alert and investigate why multiple brokers failed simultaneously (likely cascading failure, network partition, or bad deployment). (2) Try to recover at least one ISR member — restart the broker, check disk health, free resources. Long-term recovery: If ISR members can't recover their data (disk failure), you face a choice: (a) Accept data loss and force leader election using <code>kafka-leader-election.sh --election-type UNCLEAN</code> on the specific partition, or (b) Recover from the last backup/mirror. You should NOT set <code>unclean.leader.election.enable=true</code> globally, as that affects all partitions. Use the targeted CLI command for the specific partition. Prevention: Use rack-awareness (<code>broker.rack</code>) to spread ISR across failure domains, monitor under-replicated partitions, and have proper capacity planning.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Kafka's transaction protocol handle zombie instances?</div>
  <div class="qa-a">When a producer crashes and a new instance starts with the same <code>transactional.id</code>, the new instance calls <code>initTransactions()</code>. The Transaction Coordinator: (1) Looks up the existing PID and epoch for this transactional.id. (2) Increments the epoch (e.g., from 3 to 4). (3) Aborts any pending transactions from the old epoch. (4) Fences the old producer — if the zombie tries to send with the old epoch, brokers reject it with <code>ProducerFencedException</code>. This ensures that even if the old producer comes back to life (e.g., long GC pause), it cannot commit transactions or produce data. The epoch mechanism is the key to preventing split-brain scenarios in transactional processing.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose at-most-once over at-least-once semantics?</div>
  <div class="qa-a">At-most-once is appropriate when: (1) Data loss is acceptable but duplicates are worse — rare in practice. (2) Real-time metrics/monitoring where slightly incomplete data is fine but double-counting corrupts dashboards. (3) Extremely high-throughput scenarios where the overhead of offset management after processing is not justified (sensor telemetry with millions of events/sec). (4) Fire-and-forget audit logs where completeness is best-effort. In practice, most systems use at-least-once with idempotent processing because losing data is usually less acceptable than processing duplicates. The shift to exactly-once is warranted for financial systems, inventory management, or any system where both loss and duplication are unacceptable.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you implement retry topics vs a DLQ?</div>
  <div class="qa-a">A common pattern uses tiered retry topics with increasing delays: <code>orders</code> → <code>orders.retry-1</code> (1 min delay) → <code>orders.retry-2</code> (10 min delay) → <code>orders.retry-3</code> (1 hour delay) → <code>orders.DLQ</code>. Implementation: On failure, produce to the next retry topic with a timestamp header. A delayed consumer on each retry topic only processes messages whose timestamp + delay has passed. After exhausting all retry tiers, send to DLQ for manual investigation. This gives transient errors time to resolve (e.g., downstream service recovery) while not blocking processing of other messages. The DLQ should have infinite retention and alerting. Frameworks like Spring Kafka provide this pattern built-in with <code>@RetryableTopic</code>.</div>
</div>
`
  },
  {
    id: 'kafka-scaling',
    title: 'Kafka Scaling & Performance',
    category: 'Kafka',
    starterCode: `// Simulating Kafka Partition-Based Scaling and Consumer Groups

class KafkaSimulator {
  constructor(topicName, numPartitions) {
    this.topicName = topicName;
    this.partitions = Array.from({ length: numPartitions }, (_, i) => ({
      id: i, records: [], offset: 0
    }));
    this.consumerGroups = {};
    console.log(\`Topic "\${topicName}" created with \${numPartitions} partitions\`);
  }

  // Produce with round-robin
  produce(records) {
    records.forEach((value, i) => {
      const pid = i % this.partitions.length;
      const p = this.partitions[pid];
      p.records.push({ offset: p.offset++, value, ts: Date.now() });
    });
  }

  // Create consumer group
  createGroup(groupId, numConsumers) {
    const consumers = Array.from({ length: numConsumers }, (_, i) => ({
      id: \`\${groupId}-consumer-\${i}\`,
      assignedPartitions: [],
      processed: 0,
    }));
    // Assign partitions (range strategy)
    const partPerConsumer = Math.floor(this.partitions.length / numConsumers);
    const extra = this.partitions.length % numConsumers;
    let pIdx = 0;
    consumers.forEach((c, i) => {
      const count = partPerConsumer + (i < extra ? 1 : 0);
      c.assignedPartitions = Array.from({ length: count }, () => pIdx++);
    });
    this.consumerGroups[groupId] = consumers;
    return consumers;
  }

  // Simulate consumption
  simulateConsumption(groupId) {
    const consumers = this.consumerGroups[groupId];
    for (const c of consumers) {
      for (const pid of c.assignedPartitions) {
        c.processed += this.partitions[pid].records.length;
      }
    }
    return consumers;
  }
}

// === Demo: Scaling Consumers ===
const sim = new KafkaSimulator('orders', 12);

// Produce 120 records
const records = Array.from({ length: 120 }, (_, i) => \`order-\${i + 1}\`);
sim.produce(records);
console.log(\`Produced \${records.length} records across \${sim.partitions.length} partitions\`);
console.log(\`Records per partition: \${sim.partitions.map(p => p.records.length).join(', ')}\`);

// Scenario 1: 3 consumers
console.log('\\n=== Scenario 1: 3 Consumers for 12 Partitions ===');
const group1 = sim.createGroup('group-A', 3);
sim.simulateConsumption('group-A');
group1.forEach(c => {
  console.log(\`  \${c.id}: partitions=[\${c.assignedPartitions}] processed=\${c.processed} records\`);
});

// Scenario 2: 6 consumers (double parallelism)
console.log('\\n=== Scenario 2: 6 Consumers for 12 Partitions ===');
const group2 = sim.createGroup('group-B', 6);
sim.simulateConsumption('group-B');
group2.forEach(c => {
  console.log(\`  \${c.id}: partitions=[\${c.assignedPartitions}] processed=\${c.processed} records\`);
});

// Scenario 3: 12 consumers (max parallelism)
console.log('\\n=== Scenario 3: 12 Consumers (max parallelism) ===');
const group3 = sim.createGroup('group-C', 12);
sim.simulateConsumption('group-C');
group3.forEach(c => {
  console.log(\`  \${c.id}: partitions=[\${c.assignedPartitions}] processed=\${c.processed} records\`);
});

// Scenario 4: 15 consumers (3 idle!)
console.log('\\n=== Scenario 4: 15 Consumers — 3 will be IDLE ===');
const group4 = sim.createGroup('group-D', 15);
sim.simulateConsumption('group-D');
const idle = group4.filter(c => c.assignedPartitions.length === 0);
const active = group4.filter(c => c.assignedPartitions.length > 0);
console.log(\`  Active: \${active.length} consumers, Idle: \${idle.length} consumers\`);
idle.forEach(c => console.log(\`  \${c.id}: IDLE (no partitions)\`));

// === Batch size simulation ===
console.log('\\n=== Batching Simulation ===');
function simulateBatching(batchSize, lingerMs, totalRecords) {
  const batches = Math.ceil(totalRecords / batchSize);
  const networkCalls = batches;
  const totalLatency = batches * 2 + lingerMs; // simplified
  console.log(\`  batch.size=\${batchSize}, linger.ms=\${lingerMs}, records=\${totalRecords}\`);
  console.log(\`  → \${batches} batches, \${networkCalls} network calls, ~\${totalLatency}ms total\`);
}
simulateBatching(100, 0, 1000);
simulateBatching(1000, 5, 1000);
simulateBatching(5000, 20, 1000);`,
    content: `
<h1>Kafka Scaling & Performance</h1>
<p>Scaling Kafka effectively requires understanding its parallelism model, performance tuning knobs, and multi-datacenter strategies. This is a favorite SDE3 interview topic because it tests both theoretical knowledge and production experience.</p>

<h2>Partition: The Unit of Parallelism</h2>
<pre><code>Key scaling relationship:
  ┌────────────────────────────────────────────────────────────┐
  │  Max Consumer Parallelism = Number of Partitions           │
  │                                                            │
  │  Topic "orders" with 12 partitions:                        │
  │    3 consumers  → each gets 4 partitions (underutilized)   │
  │    6 consumers  → each gets 2 partitions                   │
  │   12 consumers  → each gets 1 partition (max parallelism)  │
  │   15 consumers  → 12 active + 3 IDLE                       │
  └────────────────────────────────────────────────────────────┘</code></pre>

<h3>How Many Partitions?</h3>
<p>Use this formula as a starting point:</p>
<pre><code>Partitions = max(T/Pp, T/Pc)

Where:
  T  = Target throughput (e.g., 100 MB/s)
  Pp = Throughput per partition on producer side (benchmark: ~10 MB/s)
  Pc = Throughput per partition on consumer side (depends on processing)

Example:
  Target: 100 MB/s
  Producer per partition: 10 MB/s → need 10 partitions
  Consumer per partition: 5 MB/s  → need 20 partitions
  Result: 20 partitions minimum</code></pre>

<h3>Partition Count Trade-offs</h3>
<table>
  <tr><th>More Partitions</th><th>Fewer Partitions</th></tr>
  <tr><td>Higher throughput and parallelism</td><td>Lower overhead per broker</td></tr>
  <tr><td>More file handles and memory per broker</td><td>Faster leader elections</td></tr>
  <tr><td>Longer recovery time during broker failure</td><td>Less rebalance overhead</td></tr>
  <tr><td>Higher end-to-end latency (more replication)</td><td>Lower end-to-end latency</td></tr>
  <tr><td>Cannot decrease later</td><td>Can always increase</td></tr>
</table>

<div class="warning-note">You cannot reduce the number of partitions for a topic. Plan carefully. Start with a reasonable number (e.g., 6-12 for moderate throughput) and increase if needed. Over-partitioning wastes resources and complicates operations.</div>

<h2>Broker Scaling</h2>

<h3>Vertical Scaling</h3>
<ul>
  <li><strong>Disks</strong>: Use multiple disks (JBOD with <code>log.dirs</code>) for higher I/O throughput. SSDs for low-latency, HDDs for high-throughput.</li>
  <li><strong>Memory</strong>: More RAM = larger OS page cache = more data served from memory (Kafka relies heavily on page cache, not JVM heap).</li>
  <li><strong>Network</strong>: 10Gbps+ NIC for high-throughput clusters. Replication traffic can be significant.</li>
  <li><strong>CPU</strong>: Mainly needed for compression/decompression and SSL/TLS.</li>
</ul>

<h3>Horizontal Scaling (Adding Brokers)</h3>
<pre><code>Adding a new broker to the cluster:
  1. Configure new broker with unique broker.id
  2. Start the broker — it joins the cluster automatically
  3. But EXISTING partitions are NOT moved automatically!
  4. Use kafka-reassign-partitions.sh to redistribute:

  # Generate a reassignment plan
  kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \\
    --topics-to-move-json-file topics.json \\
    --broker-list "0,1,2,3" \\        # Include new broker (3)
    --generate

  # Execute the plan
  kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \\
    --reassignment-json-file plan.json \\
    --execute

  # Monitor progress
  kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \\
    --reassignment-json-file plan.json \\
    --verify

  # Throttle replication to avoid impacting production
  kafka-reassign-partitions.sh ... --execute \\
    --throttle 50000000   # 50 MB/s</code></pre>

<h3>Rack Awareness</h3>
<pre><code># broker config
broker.rack=us-east-1a

With rack awareness enabled:
  Partition P0: Leader=Broker0(rack-a), Follower=Broker1(rack-b), Follower=Broker2(rack-c)

  This ensures that a single rack/AZ failure doesn't cause data loss.
  Kafka distributes replicas across racks automatically during topic creation.</code></pre>

<h2>Throughput Optimization</h2>

<h3>Producer Tuning</h3>
<pre><code>┌────────────────────────┬────────────────────────────────────────────────────────┐
│ Config                 │ Tuning Advice                                          │
├────────────────────────┼────────────────────────────────────────────────────────┤
│ batch.size             │ Default 16KB. Increase to 64KB-256KB for throughput.   │
│                        │ Larger batches = fewer requests = higher throughput.   │
├────────────────────────┼────────────────────────────────────────────────────────┤
│ linger.ms              │ Default 0. Set 5-100ms. Producer waits this long to   │
│                        │ fill a batch before sending. Trade latency for         │
│                        │ throughput.                                            │
├────────────────────────┼────────────────────────────────────────────────────────┤
│ buffer.memory          │ Default 32MB. Total buffer for all unsent batches.     │
│                        │ If full, producer.send() blocks up to max.block.ms.   │
│                        │ Increase for bursty workloads.                         │
├────────────────────────┼────────────────────────────────────────────────────────┤
│ max.in.flight.requests │ Default 5. Number of unacknowledged requests per       │
│ .per.connection        │ connection. Higher = more throughput, but with         │
│                        │ idempotence must be ≤ 5.                               │
├────────────────────────┼────────────────────────────────────────────────────────┤
│ compression.type       │ See compression comparison below.                      │
└────────────────────────┴────────────────────────────────────────────────────────┘</code></pre>

<h3>Consumer Tuning</h3>
<pre><code>┌──────────────────────────┬──────────────────────────────────────────────────────┐
│ Config                   │ Tuning Advice                                        │
├──────────────────────────┼──────────────────────────────────────────────────────┤
│ fetch.min.bytes          │ Default 1. Set higher (e.g., 1KB-1MB) to reduce     │
│                          │ fetch frequency and improve throughput.              │
├──────────────────────────┼──────────────────────────────────────────────────────┤
│ fetch.max.wait.ms        │ Default 500. Max time broker waits to fill           │
│                          │ fetch.min.bytes before responding.                   │
├──────────────────────────┼──────────────────────────────────────────────────────┤
│ max.partition.fetch.bytes│ Default 1MB. Max data per partition per fetch.       │
│                          │ Increase for large messages.                         │
├──────────────────────────┼──────────────────────────────────────────────────────┤
│ max.poll.records         │ Default 500. Reduce if processing is slow to avoid   │
│                          │ rebalance. Increase for batch processing.            │
└──────────────────────────┴──────────────────────────────────────────────────────┘</code></pre>

<h2>Compression Comparison</h2>
<table>
  <tr><th>Algorithm</th><th>Ratio</th><th>CPU (compress)</th><th>CPU (decompress)</th><th>Best For</th></tr>
  <tr><td><strong>none</strong></td><td>1x</td><td>-</td><td>-</td><td>Low CPU, low latency</td></tr>
  <tr><td><strong>gzip</strong></td><td>Best (~70%)</td><td>Highest</td><td>Medium</td><td>Max compression, bandwidth-constrained</td></tr>
  <tr><td><strong>snappy</strong></td><td>Good (~50%)</td><td>Low</td><td>Lowest</td><td>Balanced, Google's default</td></tr>
  <tr><td><strong>lz4</strong></td><td>Good (~50%)</td><td>Lowest</td><td>Lowest</td><td>Best speed, LinkedIn's choice</td></tr>
  <tr><td><strong>zstd</strong></td><td>Best (~70%)</td><td>Medium</td><td>Low</td><td>Best ratio/speed trade-off (recommended)</td></tr>
</table>

<pre><code>Compression flow:
  Producer compresses batch → Broker stores compressed → Consumer decompresses

  Broker DOES NOT decompress (zero-copy from disk to network).
  Exception: if broker and producer use different compression types,
  broker re-compresses (avoid this!).</code></pre>

<div class="warning-note"><code>zstd</code> is recommended for most use cases since Kafka 2.1. It provides the best ratio-to-speed trade-off. For ultra-low-latency requirements, use <code>lz4</code> or <code>snappy</code>.</div>

<h2>Quotas and Throttling</h2>
<p>Kafka supports resource quotas to prevent any single client from overwhelming the cluster:</p>

<pre><code># Per-user produce quota (bytes/sec)
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config 'producer_byte_rate=10485760' \\    # 10 MB/s
  --entity-type users --entity-name my-producer-app

# Per-user consume quota
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config 'consumer_byte_rate=20971520' \\    # 20 MB/s
  --entity-type users --entity-name my-consumer-app

# Per-client-id request percentage quota
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config 'request_percentage=25' \\           # Max 25% of broker CPU
  --entity-type clients --entity-name batch-processor

Quota types:
  - producer_byte_rate: Bytes/sec per producer
  - consumer_byte_rate: Bytes/sec per consumer
  - request_percentage: % of broker I/O threads (controls CPU)
  - controller_mutations_rate: Metadata change rate (topic creation, etc.)</code></pre>

<h2>Multi-Datacenter Strategies</h2>

<h3>Architecture Patterns</h3>
<pre><code>Pattern 1: Active-Passive (Disaster Recovery)
  DC1 (Active)                     DC2 (Passive)
  ┌──────────────┐   MirrorMaker  ┌──────────────┐
  │ Kafka Cluster│──────────────▶│ Kafka Cluster│
  │ (producers & │    2 / Repl.  │ (standby,     │
  │  consumers)  │               │  ready to     │
  └──────────────┘               │  activate)    │
                                  └──────────────┘

Pattern 2: Active-Active (Multi-Region)
  DC1                              DC2
  ┌──────────────┐                ┌──────────────┐
  │ Kafka Cluster│◀──────────────▶│ Kafka Cluster│
  │ local prod & │  Bidirectional │ local prod & │
  │ consumers    │  MirrorMaker 2 │ consumers    │
  └──────────────┘                └──────────────┘

  Challenge: Avoid infinite loops (MM2 handles via record headers)
  Challenge: Conflict resolution for same-key writes from both DCs

Pattern 3: Hub-and-Spoke (Aggregation)
  Edge DC1 ──┐
  Edge DC2 ──┼──▶ Central Kafka Cluster (aggregation & analytics)
  Edge DC3 ──┘</code></pre>

<h3>MirrorMaker 2 (MM2)</h3>
<p>MM2 (Kafka Connect-based) is the standard tool for cross-cluster replication:</p>
<ul>
  <li>Replicates topics, consumer group offsets, and ACLs</li>
  <li>Preserves topic names with source prefix (e.g., <code>dc1.orders</code>)</li>
  <li>Supports bidirectional replication with loop detection</li>
  <li>Handles offset translation (offsets differ between clusters)</li>
  <li>Automatically discovers new topics matching patterns</li>
</ul>

<h2>Performance Benchmarking</h2>
<pre><code># Built-in performance testing tools:

# Producer throughput test
kafka-producer-perf-test.sh \\
  --topic perf-test \\
  --throughput -1 \\                    # Unlimited
  --num-records 1000000 \\
  --record-size 1024 \\                # 1KB records
  --producer-props \\
    bootstrap.servers=localhost:9092 \\
    batch.size=65536 \\
    linger.ms=10 \\
    compression.type=zstd

# Consumer throughput test
kafka-consumer-perf-test.sh \\
  --bootstrap-server localhost:9092 \\
  --topic perf-test \\
  --messages 1000000 \\
  --threads 3

# Typical results for a 3-broker cluster (3x r5.xlarge):
#   Producer: 200-500 MB/s (depending on acks, compression)
#   Consumer: 300-700 MB/s (from page cache)</code></pre>

<h2>Key Metrics to Monitor</h2>
<pre><code>Broker metrics:
  - UnderReplicatedPartitions (should be 0)
  - ActiveControllerCount (exactly 1 in cluster)
  - OfflinePartitionsCount (should be 0)
  - RequestHandlerAvgIdlePercent (< 0.3 = overloaded)
  - NetworkProcessorAvgIdlePercent
  - LogFlushRateAndTimeMs
  - BytesIn/BytesOut per sec

Producer metrics:
  - record-send-rate
  - record-error-rate
  - request-latency-avg
  - batch-size-avg
  - buffer-available-bytes

Consumer metrics:
  - records-consumed-rate
  - records-lag-max (CRITICAL — consumer falling behind)
  - commit-latency-avg
  - rebalance-rate-and-time</code></pre>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: You need to migrate a Kafka topic from 6 partitions to 12 partitions without downtime. What is your approach?</div>
  <div class="qa-a">You can increase partitions online using <code>kafka-topics.sh --alter --partitions 12</code>. This is a live operation — no downtime needed. However, there are critical implications: (1) Existing data stays in old partitions; only new records go to the new ones. (2) Key-based partitioning breaks: records with the same key may now go to different partitions. (3) Consumer group rebalance will trigger. (4) You may need to increase consumers from 6 to up to 12. If key ordering is critical, you need a different approach: create a new topic with 12 partitions, migrate producers, backfill data using a consumer-to-producer bridge, then switch consumers. This is essentially a blue-green topic migration.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Your Kafka cluster is at 80% disk capacity. What are your options?</div>
  <div class="qa-a">Immediate actions: (1) Reduce retention: Lower <code>retention.ms</code> or <code>retention.bytes</code> for high-volume topics. (2) Enable or improve compression: Switch to <code>zstd</code> for better compression ratio. (3) Delete unused topics. (4) Compact eligible topics. Medium-term: (1) Add brokers and rebalance partitions to spread data across more disks. (2) Add disks to existing brokers (configure multiple <code>log.dirs</code>). (3) Move cold data to tiered storage (Kafka 3.6+ supports tiered storage natively). Long-term: (1) Implement topic lifecycle policies (auto-delete topics after N days of inactivity). (2) Right-size retention per topic based on actual consumer needs. (3) Set up disk usage alerts at 60% and 75%.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you achieve low end-to-end latency in Kafka?</div>
  <div class="qa-a">End-to-end latency = produce latency + replication latency + consume latency. Tuning: Producer side: <code>linger.ms=0</code> (or very small), <code>acks=1</code> (trade durability for speed), small <code>batch.size</code>, use <code>lz4</code> or <code>snappy</code> compression. Broker side: SSDs for storage, enough memory for page cache to serve recent data from RAM, tune <code>num.replica.fetchers</code> for faster replication. Consumer side: <code>fetch.min.bytes=1</code>, low <code>fetch.max.wait.ms</code>, process records immediately. Network: Colocate producers/consumers with brokers (same AZ). With these settings, Kafka can achieve sub-10ms end-to-end latency (p99). But note: <code>acks=1</code> risks data loss. For both low latency and durability, use <code>acks=all</code> with fast SSDs and same-AZ replicas — expect p99 ~20-50ms.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain Kafka tiered storage and why it matters.</div>
  <div class="qa-a">Tiered storage (KIP-405, GA in Kafka 3.6) separates the storage layer into local (hot) and remote (cold) tiers. Hot data stays on broker local disks for fast access. Old segments are offloaded to remote storage like S3, GCS, or HDFS. Benefits: (1) Brokers need much less local disk — costs drop significantly. (2) Retention can be extended to months/years cheaply. (3) Broker recovery is faster (less local data to replicate). (4) Decouples compute from storage, enabling more flexible scaling. How it works: The broker continuously uploads closed log segments to remote storage. When a consumer reads old data, the broker fetches from remote storage transparently. Hot data (recent segments) is served from local disk/page cache at full speed. This is a game-changer for cost-sensitive deployments with long retention requirements.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a multi-region Kafka deployment for a global e-commerce platform.</div>
  <div class="qa-a">Architecture: Active-active with regional Kafka clusters. Each region (US, EU, APAC) has its own Kafka cluster. Design: (1) Regional topics for local data (e.g., <code>us.orders</code>, <code>eu.orders</code>) — produced and consumed within the region for low latency. (2) Global aggregation topics replicated via MirrorMaker 2 to a central analytics cluster. (3) Shared reference data (product catalog, pricing) replicated to all regions. MM2 configuration: Bidirectional replication for shared topics with topic prefixes (e.g., <code>us.products</code>). Loop detection via source headers. Offset translation for consumer failover. Challenges: (1) Conflict resolution: Use region-specific keys or last-writer-wins with timestamps. (2) Latency: Cross-region replication adds 50-200ms. (3) Monitoring: Track replication lag per region pair. (4) Failover: Pre-configure consumers to read from failover region prefix. Test failover regularly.</div>
</div>
`
  },
  {
    id: 'kafka-patterns',
    title: 'Kafka Streams & Patterns',
    category: 'Kafka',
    starterCode: `// Simulating Event Sourcing, CQRS, and Saga Patterns with Kafka Concepts

// === EVENT STORE (simulating Kafka topic as event log) ===
class EventStore {
  constructor(name) {
    this.name = name;
    this.events = [];
    this.snapshots = {};
  }

  append(aggregateId, eventType, data) {
    const event = {
      offset: this.events.length,
      aggregateId,
      eventType,
      data,
      timestamp: Date.now(),
      version: this.events.filter(e => e.aggregateId === aggregateId).length + 1,
    };
    this.events.push(event);
    console.log(\`[EventStore] \${eventType} for \${aggregateId} (v\${event.version})\`);
    return event;
  }

  getEvents(aggregateId) {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }
}

// === AGGREGATE: Rebuild state from events ===
function rebuildOrder(events) {
  const state = { items: [], status: 'unknown', total: 0 };
  for (const event of events) {
    switch (event.eventType) {
      case 'OrderCreated':
        state.status = 'created';
        state.customerId = event.data.customerId;
        break;
      case 'ItemAdded':
        state.items.push(event.data);
        state.total += event.data.price;
        break;
      case 'OrderConfirmed':
        state.status = 'confirmed';
        break;
      case 'OrderShipped':
        state.status = 'shipped';
        state.trackingId = event.data.trackingId;
        break;
    }
  }
  return state;
}

// === CQRS: Read model (materialized view) ===
class OrderReadModel {
  constructor() { this.views = {}; }

  project(event) {
    const id = event.aggregateId;
    if (!this.views[id]) this.views[id] = { orderId: id, items: [], status: '', total: 0 };
    const view = this.views[id];
    switch (event.eventType) {
      case 'OrderCreated': view.status = 'created'; view.customerId = event.data.customerId; break;
      case 'ItemAdded': view.items.push(event.data.name); view.total += event.data.price; break;
      case 'OrderConfirmed': view.status = 'confirmed'; break;
      case 'OrderShipped': view.status = 'shipped'; break;
    }
    return view;
  }

  query(orderId) { return this.views[orderId]; }
  queryAll() { return Object.values(this.views); }
}

// === SAGA: Orchestrator for distributed transaction ===
class OrderSaga {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.state = 'INIT';
  }

  execute(orderId, customerId) {
    console.log(\`\\n[Saga] Starting order saga for \${orderId}\`);

    // Step 1: Reserve inventory
    this.state = 'RESERVING_INVENTORY';
    const inventoryOk = Math.random() > 0.3;
    if (inventoryOk) {
      this.eventStore.append(orderId, 'InventoryReserved', { customerId });
      console.log(\`[Saga] ✓ Inventory reserved\`);
    } else {
      this.eventStore.append(orderId, 'InventoryFailed', { reason: 'Out of stock' });
      console.log(\`[Saga] ✗ Inventory failed — compensating...\`);
      this.eventStore.append(orderId, 'OrderCancelled', { reason: 'No inventory' });
      this.state = 'COMPENSATED';
      return;
    }

    // Step 2: Process payment
    this.state = 'PROCESSING_PAYMENT';
    const paymentOk = Math.random() > 0.3;
    if (paymentOk) {
      this.eventStore.append(orderId, 'PaymentProcessed', { amount: 99.99 });
      console.log(\`[Saga] ✓ Payment processed\`);
    } else {
      this.eventStore.append(orderId, 'PaymentFailed', { reason: 'Insufficient funds' });
      console.log(\`[Saga] ✗ Payment failed — compensating...\`);
      // Compensate: release inventory
      this.eventStore.append(orderId, 'InventoryReleased', { reason: 'Payment failed' });
      this.eventStore.append(orderId, 'OrderCancelled', { reason: 'Payment failed' });
      this.state = 'COMPENSATED';
      return;
    }

    // Step 3: Confirm order
    this.eventStore.append(orderId, 'OrderConfirmed', {});
    this.state = 'COMPLETED';
    console.log(\`[Saga] ✓ Order saga completed successfully\`);
  }
}

// === DEMO ===
const store = new EventStore('orders-events');
const readModel = new OrderReadModel();

// Event Sourcing: Build order from events
console.log('=== EVENT SOURCING ===');
store.append('order-1', 'OrderCreated', { customerId: 'cust-42' });
store.append('order-1', 'ItemAdded', { name: 'Laptop', price: 999 });
store.append('order-1', 'ItemAdded', { name: 'Mouse', price: 29 });
store.append('order-1', 'OrderConfirmed', {});
store.append('order-1', 'OrderShipped', { trackingId: 'TRACK-123' });

const currentState = rebuildOrder(store.getEvents('order-1'));
console.log('\\nRebuilt order state:', JSON.stringify(currentState, null, 2));

// CQRS: Project events into read model
console.log('\\n=== CQRS READ MODEL ===');
store.events.forEach(e => readModel.project(e));
console.log('Query order-1:', JSON.stringify(readModel.query('order-1'), null, 2));

// Saga Pattern
console.log('\\n=== SAGA PATTERN ===');
const saga = new OrderSaga(store);
saga.execute('order-2', 'cust-99');
console.log(\`Saga final state: \${saga.state}\`);`,
    content: `
<h1>Kafka Streams & Patterns</h1>
<p>Kafka is not just a message broker — it's an event streaming platform that enables powerful architectural patterns. Understanding these patterns and Kafka Streams is essential for SDE3-level system design.</p>

<h2>Event Sourcing with Kafka</h2>
<p>Event sourcing stores <strong>every state change as an immutable event</strong> rather than storing current state. Kafka's append-only, immutable log is a natural fit.</p>

<pre><code>Traditional CRUD:                   Event Sourcing:
  UPDATE orders SET                   events topic:
    status='shipped',                   OrderCreated  {id: 1, customer: "Alice"}
    tracking='TRK-1'                    ItemAdded     {id: 1, item: "Laptop", price: 999}
    WHERE id=1;                         ItemAdded     {id: 1, item: "Mouse", price: 29}
                                        OrderPaid     {id: 1, amount: 1028}
  Only current state.                   OrderShipped  {id: 1, tracking: "TRK-1"}
  History lost.
                                        Full history preserved.
                                        Can rebuild state at any point in time.</code></pre>

<h3>Implementation with Kafka</h3>
<pre><code>Architecture:
  ┌──────────┐     ┌──────────────────┐     ┌────────────────┐
  │ Command  │────▶│ Kafka Topic      │────▶│ Event Handler  │
  │ Service  │     │ (Event Store)    │     │ (Projector)    │
  └──────────┘     │                  │     └───────┬────────┘
                   │ key: aggregateId │             │
                   │ value: event     │             ▼
                   │ compaction: OFF  │     ┌────────────────┐
                   │ retention: ∞     │     │ Read Model     │
                   └──────────────────┘     │ (DB / Cache)   │
                                            └────────────────┘

Topic config for event sourcing:
  cleanup.policy=delete (keep all events)
  retention.ms=-1 (infinite retention)
  OR
  cleanup.policy=compact (keep latest per aggregate + snapshots)</code></pre>

<h3>Snapshotting</h3>
<p>Rebuilding state from thousands of events is slow. Use snapshots:</p>
<pre><code>Events:  [e1] [e2] [e3] ... [e500] [SNAPSHOT-500] [e501] [e502] ... [e520]

To rebuild current state:
  1. Load latest snapshot (state at event 500)
  2. Replay events 501-520 on top

Snapshot topic: compacted topic keyed by aggregateId
  → always has latest snapshot per aggregate</code></pre>

<h2>CQRS (Command Query Responsibility Segregation)</h2>
<p>CQRS separates the <strong>write model</strong> (commands) from the <strong>read model</strong> (queries). Kafka connects them via events.</p>

<pre><code>┌────────────┐   Command    ┌────────────┐   Events   ┌──────────────┐
│ API        │─────────────▶│ Command    │───────────▶│ Kafka Topic  │
│ (Write)    │              │ Handler    │            │ (events)     │
└────────────┘              └────────────┘            └──────┬───────┘
                                                            │
                                            ┌───────────────┼───────────────┐
                                            │               │               │
                                            ▼               ▼               ▼
                                    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                                    │ Projector A  │ │ Projector B  │ │ Projector C  │
                                    │ (Orders DB)  │ │ (Search/ES)  │ │ (Analytics)  │
                                    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                                           │                │                │
┌────────────┐   Query      ┌──────────────┼────────────────┼────────────────┼──────┐
│ API        │◀─────────────│    Optimized Read Models (different views of same data)│
│ (Read)     │              └────────────────────────────────────────────────────────┘
└────────────┘

Benefits:
  - Write model optimized for validation and consistency
  - Read models optimized for specific query patterns
  - Multiple read models from single event stream
  - Independent scaling of reads and writes

Drawbacks:
  - Eventual consistency between write and read models
  - Increased complexity
  - Must handle projection failures and replay</code></pre>

<h2>Saga Pattern</h2>
<p>The Saga pattern manages <strong>distributed transactions across microservices</strong> without 2PC (two-phase commit). Kafka serves as the reliable event bus between services.</p>

<h3>Choreography-Based Saga</h3>
<pre><code>Each service listens to events and publishes its result:

  Order Service          Inventory Service       Payment Service
       │                       │                       │
       │──OrderCreated────────▶│                       │
       │                       │──InventoryReserved───▶│
       │                       │                       │──PaymentProcessed──▶ (done)
       │                       │                       │
  On failure (compensation):
       │                       │                       │──PaymentFailed
       │                       │◀──────────────────────│
       │◀──InventoryReleased──│                       │
       │                       │                       │
  OrderCancelled               │                       │

Topics:
  order-events          → OrderCreated, OrderCancelled
  inventory-events      → InventoryReserved, InventoryReleased, InventoryFailed
  payment-events        → PaymentProcessed, PaymentFailed</code></pre>

<h3>Orchestration-Based Saga</h3>
<pre><code>A central orchestrator coordinates the saga steps:

  ┌────────────────────────┐
  │    Saga Orchestrator   │
  │                        │
  │  State Machine:        │
  │  INIT                  │
  │   → RESERVING_INVENTORY│──▶ inventory-commands topic
  │   → PROCESSING_PAYMENT │──▶ payment-commands topic
  │   → CONFIRMING_ORDER   │──▶ order-commands topic
  │   → COMPLETED          │
  │                        │
  │  On failure at any step│
  │   → Run compensation   │
  │     in reverse order   │
  └────────────────────────┘

Orchestrator consumes from:
  inventory-results, payment-results, order-results

Advantages over choreography:
  - Centralized saga state (easier debugging)
  - Explicit compensation logic
  - Easier to add/remove steps</code></pre>

<h2>Outbox Pattern</h2>
<p>The outbox pattern solves the <strong>dual-write problem</strong>: atomically updating a database AND publishing to Kafka.</p>

<pre><code>Problem (dual write):
  1. Update DB ✓
  2. Publish to Kafka ✗ (network error)
  → DB and Kafka are inconsistent!

Solution (Outbox):
  ┌─────────────────────────────────────────────┐
  │ Database Transaction                         │
  │   1. INSERT INTO orders (...)                │
  │   2. INSERT INTO outbox (                    │
  │        aggregate_id, event_type, payload     │
  │      )                                       │
  │   COMMIT; ← atomic!                          │
  └──────────────────────┬──────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────┐
  │ CDC Connector (Debezium)                     │
  │   Reads outbox table via binlog/WAL          │
  │   Publishes to Kafka topic                   │
  │   Deletes processed outbox rows              │
  └──────────────────────┬──────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────┐
  │ Kafka Topic (events)                         │
  └─────────────────────────────────────────────┘

Outbox table schema:
  CREATE TABLE outbox (
    id            UUID PRIMARY KEY,
    aggregate_id  VARCHAR(255),
    aggregate_type VARCHAR(255),
    event_type    VARCHAR(255),
    payload       JSONB,
    created_at    TIMESTAMP DEFAULT NOW()
  );</code></pre>

<div class="warning-note">The outbox pattern is the recommended way to achieve reliable event publishing. Never do dual writes (update DB + publish to Kafka separately). Use Debezium CDC connector for production outbox implementations.</div>

<h2>Kafka Streams</h2>
<p>Kafka Streams is a <strong>client library</strong> (not a separate cluster) for building stream processing applications that read from and write to Kafka topics.</p>

<h3>KStream vs KTable</h3>
<table>
  <tr><th>Concept</th><th>KStream</th><th>KTable</th></tr>
  <tr><td>Represents</td><td>Record stream (append-only)</td><td>Changelog stream (upsert)</td></tr>
  <tr><td>Semantics</td><td>Each record is an independent event</td><td>Each record is an update to a key</td></tr>
  <tr><td>Analogy</td><td>INSERT</td><td>UPSERT</td></tr>
  <tr><td>Backed by</td><td>Regular topic</td><td>Compacted topic</td></tr>
  <tr><td>Join behavior</td><td>Windowed joins</td><td>Latest-value lookup</td></tr>
</table>

<pre><code>// Kafka Streams topology example (Java)
StreamsBuilder builder = new StreamsBuilder();

// KStream: stream of order events
KStream&lt;String, Order&gt; orders = builder.stream("orders");

// KTable: latest customer profile per customer ID
KTable&lt;String, Customer&gt; customers = builder.table("customers");

// Stream processing pipeline
orders
  .filter((key, order) -> order.getAmount() > 100)      // Filter high-value
  .selectKey((key, order) -> order.getCustomerId())      // Re-key by customer
  .join(customers, (order, customer) ->                  // Enrich with customer data
      new EnrichedOrder(order, customer))
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
  .count()                                                // Count per customer per hour
  .toStream()
  .to("high-value-order-counts");                        // Write to output topic</code></pre>

<h3>Windowing in Kafka Streams</h3>
<table>
  <tr><th>Window Type</th><th>Description</th><th>Use Case</th></tr>
  <tr><td><strong>Tumbling</strong></td><td>Fixed-size, non-overlapping (e.g., every 5 min)</td><td>Hourly aggregations, batch-like</td></tr>
  <tr><td><strong>Hopping</strong></td><td>Fixed-size, overlapping (e.g., 10 min window every 5 min)</td><td>Moving averages</td></tr>
  <tr><td><strong>Sliding</strong></td><td>Fixed-size, triggered per record within time difference</td><td>Continuous monitoring</td></tr>
  <tr><td><strong>Session</strong></td><td>Dynamic size based on inactivity gap</td><td>User sessions, click streams</td></tr>
</table>

<pre><code>Tumbling Window (5 min):
  |---Window 1---|---Window 2---|---Window 3---|
  0              5              10             15 (minutes)

Hopping Window (10 min window, 5 min advance):
  |------Window 1------|
       |------Window 2------|
            |------Window 3------|
  0    5    10   15   20 (minutes)

Session Window (5 min inactivity gap):
  |--Session 1--|       |--Session 2--|
  [e1][e2]  [e3]        [e4]    [e5][e6]
  0   1   2   3   4   5   6   7   8   9   10 (minutes)
              ↑ 5 min gap ↑</code></pre>

<h2>Schema Registry</h2>
<p>Schema Registry provides a centralized repository for schemas, ensuring producers and consumers agree on data format.</p>

<pre><code>Producer                  Schema Registry              Consumer
  │                           │                           │
  │──Register schema────────▶│                           │
  │◀──Schema ID (42)─────────│                           │
  │                           │                           │
  │ Send record:              │                           │
  │ [magic byte][schema-id:42]│[avro-encoded-payload]     │
  │                           │                           │
  │                           │    ◀──Get schema 42──────│
  │                           │────Schema definition────▶│
  │                           │                           │ Deserialize payload
  │                           │                           │

Supported formats: Avro, Protobuf, JSON Schema

Compatibility modes:
  BACKWARD  — new schema can read old data (can remove fields, add optional)
  FORWARD   — old schema can read new data (can add fields, remove optional)
  FULL      — both backward and forward compatible
  NONE      — no compatibility checking

Recommended: BACKWARD (default) or FULL for critical topics</code></pre>

<h2>Topic Design Patterns</h2>

<h3>1. Event Notification</h3>
<pre><code>// Thin event — just notifies that something happened
{
  "eventType": "OrderCreated",
  "orderId": "order-123",
  "timestamp": "2025-01-15T10:30:00Z"
}
// Consumer must call back to Order Service to get full details
// Pro: Small messages, loose coupling
// Con: Consumers need to make additional calls (chattier)</code></pre>

<h3>2. Event-Carried State Transfer</h3>
<pre><code>// Fat event — contains all relevant data
{
  "eventType": "OrderCreated",
  "orderId": "order-123",
  "customerId": "cust-42",
  "customerName": "Alice Smith",
  "customerEmail": "alice@example.com",
  "items": [
    {"sku": "LAP-001", "name": "Laptop", "price": 999, "qty": 1}
  ],
  "shippingAddress": { ... },
  "totalAmount": 999,
  "timestamp": "2025-01-15T10:30:00Z"
}
// Consumer has all data needed — no callbacks required
// Pro: Consumers are autonomous, can build local caches
// Con: Larger messages, tighter coupling to schema, data duplication</code></pre>

<h3>3. Single Topic vs Multiple Topics</h3>
<pre><code>Single topic (all events):
  "domain-events" → OrderCreated, PaymentProcessed, ShipmentSent, ...
  Pro: Simple, single consumer for all events
  Con: Consumers filter many irrelevant events, hard to scale independently

Topic per entity:
  "orders" → OrderCreated, OrderUpdated, OrderCancelled
  "payments" → PaymentProcessed, PaymentFailed
  "shipments" → ShipmentSent, ShipmentDelivered
  Pro: Focused consumers, independent scaling and retention
  Con: More topics to manage

Topic per event type:
  "order-created" → OrderCreated
  "order-cancelled" → OrderCancelled
  Pro: Maximum flexibility, precise subscriptions
  Con: Many topics, harder to maintain ordering per entity

Recommendation: Topic per entity is the best balance for most systems.</code></pre>

<div class="warning-note">Topic naming convention matters at scale. Use a consistent scheme like <code>{domain}.{entity}.{event-type}</code> (e.g., <code>ecommerce.orders.created</code>). Establish naming conventions early — changing topic names later is very disruptive.</div>

<h2>Interview Q&A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement event sourcing with Kafka? What are the challenges?</div>
  <div class="qa-a">Implementation: Use a Kafka topic per aggregate type with the aggregate ID as the message key. Set <code>retention.ms=-1</code> for infinite retention (you need the full event history). To reconstruct current state, consume all events for an aggregate and apply them sequentially. Use snapshots (stored in a compacted topic) to avoid replaying the entire history. Challenges: (1) Event schema evolution — events must be backward compatible forever (use Schema Registry with FULL compatibility). (2) Global ordering — events across aggregates have no guaranteed order; design for per-aggregate ordering only. (3) Performance — replaying many events is slow; snapshots are essential. (4) Topic deletion — you cannot delete individual events from Kafka; use tombstones for logical deletion. (5) Querying — Kafka is not queryable; you need projections (CQRS) for read access. (6) Scaling — very large aggregates with millions of events need careful snapshot strategies.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use a choreography-based saga vs an orchestration-based saga?</div>
  <div class="qa-a">Use <strong>choreography</strong> when: (1) The saga has few steps (2-3 services). (2) Services are truly independent and owned by different teams. (3) You want maximum decoupling — each service only knows its own events. (4) The failure/compensation logic is simple. Use <strong>orchestration</strong> when: (1) The saga has many steps or complex branching logic. (2) You need visibility into the saga state (debugging, monitoring). (3) Compensation logic is complex or order-dependent. (4) Business rules change frequently (easier to modify a centralized orchestrator). In practice, orchestration is more common for complex business workflows because choreography becomes difficult to understand and debug when you have many services — the "emergent behavior" problem where no single place shows the full flow.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the outbox pattern. Why can't you just publish to Kafka inside a DB transaction?</div>
  <div class="qa-a">The outbox pattern writes events to an outbox table in the same database transaction as the business data change, then a CDC connector (like Debezium) reads the database binlog and publishes those events to Kafka. Why not just publish to Kafka in the transaction? Because you cannot atomically commit a database transaction AND publish to Kafka — they are two separate systems. If the DB commit succeeds but the Kafka publish fails (network error), you have inconsistency. If you publish first and the DB commit fails, you have a phantom event in Kafka. The outbox pattern ensures atomicity by keeping everything in the database transaction. The CDC connector guarantees eventual delivery to Kafka with at-least-once semantics. Combined with idempotent consumers, this gives you a reliable end-to-end event-driven architecture.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between Kafka Streams and Kafka Connect? When do you use each?</div>
  <div class="qa-a"><strong>Kafka Streams</strong> is a client library for stream processing — transforming, aggregating, joining, and enriching data that is already in Kafka. It runs as part of your application (no separate cluster). Use it for: real-time aggregations, stream-table joins, windowed computations, event-driven microservices. <strong>Kafka Connect</strong> is a framework for moving data between Kafka and external systems (databases, search indexes, cloud storage, etc.). It has a runtime with pre-built connectors. Use it for: CDC from databases (Debezium), syncing to Elasticsearch, loading to data lakes (S3, HDFS), importing from legacy systems. Rule of thumb: Connect gets data in/out of Kafka, Streams processes data within Kafka. They often work together: Connect ingests data, Streams processes it, Connect exports results.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a real-time fraud detection system using Kafka Streams.</div>
  <div class="qa-a">Architecture: (1) Input: <code>transactions</code> topic with all payment events. (2) Kafka Streams application with multiple processing stages: Stage 1 — Enrichment: Join transaction stream with a KTable of customer profiles (from <code>customers</code> compacted topic) to add customer risk score. Stage 2 — Windowed aggregation: Use sliding windows (e.g., 1 hour) to compute per-customer metrics: transaction count, total amount, unique merchants, geographic spread. Stage 3 — Rule evaluation: Compare aggregated metrics against fraud rules (e.g., >10 transactions in 1 hour, >$5000 total, transactions from >3 countries). Stage 4 — Output: Suspicious transactions go to <code>fraud-alerts</code> topic; all scored transactions go to <code>scored-transactions</code>. State stores: Use RocksDB-backed state stores for windowed aggregations. Enable standby replicas (<code>num.standby.replicas=1</code>) for fast failover. Scaling: Partition the transactions topic by customer ID to ensure all transactions for one customer are processed by the same Streams instance. Scale instances up to partition count.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Kafka Streams handle fault tolerance and state recovery?</div>
  <div class="qa-a">Kafka Streams stores local state in RocksDB (on disk) and backs it up to Kafka changelog topics (compacted). Fault tolerance mechanisms: (1) If a Streams instance crashes, another instance (or a restarted one) picks up its partitions during rebalance. It restores state by replaying the changelog topic for those partitions. (2) Standby replicas (<code>num.standby.replicas</code>) maintain copies of state stores on other instances. When failover happens, the standby is already up-to-date — no replay needed (fast recovery). (3) The changelog topic is a compacted topic — only the latest value per key is retained, minimizing recovery time. (4) State stores support point-in-time recovery via offset tracking. (5) For very large state stores, you can enable state store caching (<code>cache.max.bytes.buffering</code>) to batch updates and reduce changelog writes. The key insight is that Kafka Streams treats Kafka itself as the durable storage layer, making local state ephemeral and recoverable.</div>
</div>
`
  },
];
