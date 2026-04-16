export const aws = [
  {
    id: 'aws-lambda',
    title: 'AWS Lambda Deep Dive',
    category: 'AWS',
    starterCode: `// AWS Lambda Patterns — Simulated in Browser
// =============================================

// 1. Execution Context Reuse
// Initialize OUTSIDE the handler (reused across warm invocations)
const dbPool = (() => {
  console.log('[INIT] Creating DB connection pool (runs once per cold start)');
  return { query: (sql) => ({ rows: [{ count: 42 }], sql }) };
})();

const cache = new Map();

// Lambda handler
async function handler(event, context) {
  console.log('\\n=== Lambda Invocation ===');
  console.log('Event:', JSON.stringify(event));
  console.log('Request ID:', context.awsRequestId);
  console.log('Remaining time:', context.getRemainingTimeInMillis(), 'ms');

  // Reuse the connection from init phase
  const result = dbPool.query('SELECT count(*) FROM users');
  console.log('DB result (reused connection):', result.rows[0]);

  // Cache pattern — survives across warm invocations
  const cacheKey = event.userId || 'default';
  if (cache.has(cacheKey)) {
    console.log('Cache HIT for', cacheKey);
  } else {
    console.log('Cache MISS for', cacheKey, '— fetching & caching');
    cache.set(cacheKey, { data: 'user-profile', ts: Date.now() });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success', cached: cache.has(cacheKey) })
  };
}

// 2. Simulate cold start vs warm start
console.log('--- COLD START (first invocation) ---');
const context = {
  awsRequestId: 'req-' + Math.random().toString(36).slice(2, 10),
  getRemainingTimeInMillis: () => 14500
};

handler({ userId: 'u123', action: 'getProfile' }, context)
  .then(res => {
    console.log('Response:', res.statusCode);
    console.log('\\n--- WARM START (second invocation, same container) ---');
    // Second invocation reuses init + cache
    return handler({ userId: 'u123', action: 'getProfile' }, {
      ...context,
      awsRequestId: 'req-' + Math.random().toString(36).slice(2, 10)
    });
  })
  .then(res => console.log('Response:', res.statusCode));

// 3. SQS batch processor pattern
console.log('\\n=== SQS Batch Processor Pattern ===');
async function sqsBatchHandler(event) {
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      console.log('Processing message:', body.orderId || body.id);
      // Simulate processing
      if (body.shouldFail) throw new Error('Processing failed');
      console.log('  ✓ Success');
    } catch (err) {
      console.log('  ✗ Failed:', err.message);
      // Partial batch failure — only retry failed messages
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

const sqsEvent = {
  Records: [
    { messageId: 'msg-1', body: '{"orderId":"ORD-001"}' },
    { messageId: 'msg-2', body: '{"orderId":"ORD-002","shouldFail":true}' },
    { messageId: 'msg-3', body: '{"orderId":"ORD-003"}' }
  ]
};

sqsBatchHandler(sqsEvent).then(result => {
  console.log('Batch result:', JSON.stringify(result));
  console.log('Only failed messages return to SQS for retry!');
});`,
    content: `
<h1>AWS Lambda Deep Dive</h1>
<p>AWS Lambda is the backbone of serverless architectures. As an SDE-2/SDE-3, you are expected to know not just <em>how</em> to write Lambdas but <em>why</em> they behave the way they do — cold starts, concurrency models, retry semantics, and cost optimization. This is directly relevant to your work at Habuild (Lambda + EventBridge + SQS) and Niyo (Lambda + S3 + SQS).</p>

<h2>Lambda Execution Lifecycle</h2>
<pre><code>┌──────────────────────────────────────────────────────────────┐
│                    LAMBDA LIFECYCLE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  COLD START (first invocation or scale-up)                   │
│  ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌────────┐ │
│  │ Download │──▶│  Init   │──▶│   Handler   │──▶│Shutdown│ │
│  │  Code    │   │ Runtime │   │  Execution  │   │(freeze)│ │
│  │         │   │ + Your  │   │             │   │        │ │
│  │         │   │  Init   │   │             │   │        │ │
│  └─────────┘   └─────────┘   └─────────────┘   └────────┘ │
│  ~100-500ms     ~50-2000ms     Your code time    ~few ms    │
│                                                              │
│  WARM START (subsequent invocation, same container)          │
│  ┌─────────────┐   ┌────────┐                               │
│  │   Handler   │──▶│Shutdown│  (skips download + init!)     │
│  │  Execution  │   │(freeze)│                               │
│  └─────────────┘   └────────┘                               │
└──────────────────────────────────────────────────────────────┘</code></pre>

<h3>The Init Phase — Why It Matters</h3>
<p>Code that runs <strong>outside</strong> your handler function executes during the Init phase. This is the single most important optimization:</p>
<pre><code>// ✅ GOOD — initialized once per cold start, reused across invocations
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: 'ap-south-1' });
const cache = new Map();

// ✅ GOOD — resolved once, reused
const SECRET = process.env.API_SECRET;

exports.handler = async (event) =&gt; {
  // ❌ BAD — this creates a new client on EVERY invocation
  // const client = new DynamoDBClient({});

  return client.send(new GetItemCommand({ ... }));
};</code></pre>

<h2>Cold Starts: Causes &amp; Mitigation</h2>
<table>
  <tr><th>Cold Start Factor</th><th>Impact</th><th>Mitigation</th></tr>
  <tr><td>Package size</td><td>Larger bundle = longer download</td><td>Tree-shake, use layers, avoid aws-sdk v2 (use v3 modular)</td></tr>
  <tr><td>Runtime</td><td>Java/C# &gt; Python/Node.js</td><td>Use Node.js or Python for latency-sensitive</td></tr>
  <tr><td>VPC</td><td>ENI attachment adds 1-10s (old), now ~1s with Hyperplane</td><td>Avoid VPC unless necessary</td></tr>
  <tr><td>Init code</td><td>DB connections, SDK init, config loading</td><td>Lazy-init, minimize init work</td></tr>
  <tr><td>Memory allocation</td><td>More memory = more CPU = faster init</td><td>1024MB+ for Node.js Lambdas</td></tr>
  <tr><td>Provisioned Concurrency</td><td>Eliminates cold starts entirely</td><td>Use for latency-critical paths (costs more)</td></tr>
</table>

<h3>Keep-Warm Strategy (Budget Option)</h3>
<pre><code>// EventBridge rule: rate(5 minutes) → triggers this Lambda
// At Habuild, you can use this for latency-critical endpoints

exports.handler = async (event) =&gt; {
  // Detect warm-up ping
  if (event.source === 'aws.events' || event.warmup) {
    console.log('Warm-up ping — keeping container alive');
    return { statusCode: 200, body: 'warm' };
  }

  // Actual business logic
  return processRequest(event);
};</code></pre>

<h2>Concurrency Model</h2>
<pre><code>Account Limit: 1000 concurrent (default, can increase)
│
├── Reserved Concurrency (per function)
│   └── Guaranteed N instances, caps at N
│   └── Other functions CANNOT use these slots
│
├── Provisioned Concurrency (per function/alias)
│   └── Pre-initialized instances (no cold start)
│   └── Costs $$ even when idle
│   └── Use for: API endpoints, real-time processing
│
└── Unreserved Concurrency
    └── Shared pool = Account limit - all reserved
    └── Must keep ≥100 unreserved (AWS enforced)</code></pre>

<div class="warning-note"><strong>Interview trap:</strong> If you set reserved concurrency to 0, the function is effectively <strong>disabled</strong> — it cannot execute at all. This is actually used as a kill-switch in production.</div>

<h2>Memory &amp; CPU Relationship</h2>
<p>Lambda allocates CPU proportionally to memory. At <strong>1,769 MB</strong>, you get exactly 1 vCPU. This is a key interview fact:</p>
<table>
  <tr><th>Memory</th><th>vCPU</th><th>Best For</th></tr>
  <tr><td>128 MB</td><td>~0.07 vCPU</td><td>Simple transforms, tiny responses</td></tr>
  <tr><td>512 MB</td><td>~0.29 vCPU</td><td>API handlers, light processing</td></tr>
  <tr><td>1024 MB</td><td>~0.58 vCPU</td><td>Node.js APIs (sweet spot)</td></tr>
  <tr><td>1769 MB</td><td>1 vCPU</td><td>CPU-intensive, image processing</td></tr>
  <tr><td>3538 MB</td><td>2 vCPU</td><td>Multi-threaded workloads</td></tr>
  <tr><td>10240 MB</td><td>6 vCPU</td><td>ML inference, heavy ETL</td></tr>
</table>

<h2>Lambda Invocation Patterns &amp; Error Handling</h2>
<table>
  <tr><th>Invocation Type</th><th>Retry Behavior</th><th>Error Handling</th><th>Example Trigger</th></tr>
  <tr><td><strong>Synchronous</strong></td><td>No retries (caller handles)</td><td>Error returned to caller</td><td>API Gateway, ALB</td></tr>
  <tr><td><strong>Asynchronous</strong></td><td>2 retries (3 total attempts)</td><td>DLQ / On-Failure Destination</td><td>S3 events, SNS, EventBridge</td></tr>
  <tr><td><strong>Poll-based</strong></td><td>Retries until message expires</td><td>Partial batch failure, DLQ on source</td><td>SQS, DynamoDB Streams, Kinesis</td></tr>
</table>

<h3>Async Invocation Failure Flow</h3>
<pre><code>EventBridge Rule fires → Lambda (async invocation)
  │
  ├── Attempt 1: FAIL (exception thrown)
  │     └── Wait ~1 minute
  ├── Attempt 2: FAIL
  │     └── Wait ~2 minutes
  └── Attempt 3: FAIL
        └── Send to:
            ├── DLQ (SQS queue) ← older approach
            └── On-Failure Destination ← preferred (richer metadata)
                ├── SQS
                ├── SNS
                ├── Lambda
                └── EventBridge</code></pre>

<div class="warning-note"><strong>At Habuild:</strong> For EventBridge → Lambda schedules, always configure an On-Failure Destination or DLQ. Silent failures in async Lambdas are the #1 cause of "it just stopped working" incidents.</div>

<h2>Common Patterns (Relevant to Your Work)</h2>

<h3>Pattern 1: EventBridge Scheduled Lambda (Habuild)</h3>
<pre><code>// EventBridge Rule: cron(0 9 * * ? *)  → 9 AM daily
// Use case: Send WhatsApp reminders, generate reports

exports.handler = async (event) =&gt; {
  console.log('Scheduled event:', JSON.stringify(event));
  // event.source === 'aws.events'
  // event.detail-type === 'Scheduled Event'

  const users = await db.query('SELECT * FROM users WHERE active = true');

  // Process in batches to stay within 15-min timeout
  const batches = chunk(users, 100);
  for (const batch of batches) {
    await Promise.all(batch.map(u =&gt; sendWhatsAppReminder(u)));
  }

  return { processed: users.length };
};</code></pre>

<h3>Pattern 2: SQS → Lambda with Partial Batch Failure</h3>
<pre><code>// Lambda event source mapping with SQS
// FunctionResponseTypes: ['ReportBatchItemFailures']

exports.handler = async (event) =&gt; {
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      await processOrder(body);
    } catch (err) {
      // Only THIS message returns to SQS for retry
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  // Without this, ALL messages retry on any single failure!
  return { batchItemFailures };
};</code></pre>

<h3>Pattern 3: S3 Trigger → Lambda (Niyo)</h3>
<pre><code>// S3 PutObject event → Lambda
exports.handler = async (event) =&gt; {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));

    console.log('New file:', \`s3://\${bucket}/\${key}\`);

    // Download, process, upload result
    const file = await s3.getObject({ Bucket: bucket, Key: key });
    const processed = await transformCSV(file.Body);
    await s3.putObject({
      Bucket: bucket,
      Key: \`processed/\${key}\`,
      Body: processed
    });
  }
};</code></pre>

<h2>Lambda Limits (Must Know for Interviews)</h2>
<table>
  <tr><th>Limit</th><th>Value</th><th>Notes</th></tr>
  <tr><td>Max timeout</td><td>15 minutes</td><td>Use Step Functions for longer workflows</td></tr>
  <tr><td>Sync payload (request)</td><td>6 MB</td><td>API Gateway further limits to 10 MB</td></tr>
  <tr><td>Async payload</td><td>256 KB</td><td>S3/SNS events are typically small</td></tr>
  <tr><td>/tmp storage</td><td>10 GB (was 512 MB)</td><td>Ephemeral, cleared between cold starts</td></tr>
  <tr><td>Memory</td><td>128 MB – 10,240 MB</td><td>CPU scales proportionally</td></tr>
  <tr><td>Deployment package</td><td>50 MB zipped / 250 MB unzipped</td><td>Use layers or container images for larger</td></tr>
  <tr><td>Container image</td><td>10 GB</td><td>ECR-based, slower cold start</td></tr>
  <tr><td>Env variables</td><td>4 KB total</td><td>Use SSM Parameter Store for more</td></tr>
  <tr><td>Concurrent executions</td><td>1000 (default)</td><td>Request increase for production</td></tr>
</table>

<h2>Cost Optimization</h2>
<ul>
  <li><strong>Right-size memory:</strong> Use AWS Lambda Power Tuning to find optimal memory. More memory = more CPU = faster execution = potentially cheaper.</li>
  <li><strong>Minimize package size:</strong> Use esbuild/webpack bundling. AWS SDK v3 modular imports save ~40MB.</li>
  <li><strong>Arm64 (Graviton2):</strong> 20% cheaper, often 20% faster for Node.js. Switch by changing architecture setting.</li>
  <li><strong>Avoid idle provisioned concurrency:</strong> Use Application Auto Scaling to schedule provisioned concurrency for peak hours only.</li>
  <li><strong>Batch processing:</strong> Process SQS messages in batches (up to 10,000) instead of one-at-a-time.</li>
</ul>

<h2>When NOT to Use Lambda</h2>
<ul>
  <li>Long-running processes (&gt;15 minutes) → Use ECS/Fargate or Step Functions</li>
  <li>Consistent high throughput with predictable load → ECS is cheaper at scale</li>
  <li>WebSocket connections → Use API Gateway WebSocket or ECS</li>
  <li>Stateful applications → ECS/EKS with persistent storage</li>
  <li>GPU workloads → EC2 or SageMaker</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: How would you reduce Lambda cold start time?</div>
  <div class="qa-a"><strong>1)</strong> Minimize package size — tree-shake, use SDK v3 modular imports, bundle with esbuild. <strong>2)</strong> Increase memory to at least 1024 MB (more CPU = faster init). <strong>3)</strong> Move initialization (DB connections, SDK clients) outside the handler for execution context reuse. <strong>4)</strong> Avoid VPC unless required. <strong>5)</strong> Use Provisioned Concurrency for latency-critical paths. <strong>6)</strong> Use Graviton2 (arm64) — faster init. <strong>7)</strong> Keep-warm pattern via EventBridge schedule for budget scenarios. <strong>8)</strong> Lazy-load modules that aren't needed for every invocation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle failures in async Lambda invocations?</div>
  <div class="qa-a">Async invocations (S3 events, EventBridge, SNS) retry automatically — <strong>2 retries with backoff</strong> (total 3 attempts). After all retries fail: <strong>1)</strong> Configure an On-Failure Destination (preferred) — sends to SQS, SNS, another Lambda, or EventBridge with full context (request payload, error, stack trace). <strong>2)</strong> Or use a Dead Letter Queue (SQS/SNS) — simpler but less metadata. <strong>3)</strong> Set MaximumRetryAttempts (0-2) and MaximumEventAge (60s-6hrs) to control retry behavior. <strong>4)</strong> For SQS-triggered Lambdas specifically, use ReportBatchItemFailures to avoid retrying the entire batch.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you NOT use Lambda?</div>
  <div class="qa-a">Don't use Lambda when: <strong>1)</strong> Execution exceeds 15 minutes (use Step Functions or ECS). <strong>2)</strong> You need consistent high-throughput with predictable traffic — ECS/Fargate is cheaper at sustained load because Lambda's per-invocation pricing adds up. <strong>3)</strong> You need persistent connections (WebSockets, long-polling) — Lambda doesn't maintain state between invocations. <strong>4)</strong> You need GPU compute (ML training/inference at scale). <strong>5)</strong> You have large deployment artifacts (&gt;10GB). The break-even point is roughly: if your Lambda runs &gt;60% of the time, ECS is likely cheaper.</div>
</div>
`
  },
  {
    id: 'aws-sqs-sns-eb',
    title: 'SQS vs SNS vs EventBridge',
    category: 'AWS',
    starterCode: `// SQS vs SNS vs EventBridge — Simulated Patterns
// ================================================

// 1. SQS — Point-to-point queue with visibility timeout
class SQSQueue {
  constructor(name, opts = {}) {
    this.name = name;
    this.fifo = opts.fifo || false;
    this.messages = [];
    this.inFlight = new Map();
    this.dlq = opts.dlq || null;
    this.maxReceives = opts.maxReceiveCount || 3;
    this.visibilityTimeout = opts.visibilityTimeout || 30;
  }

  sendMessage(body, groupId = null) {
    const msg = {
      messageId: 'msg-' + Math.random().toString(36).slice(2, 8),
      body: JSON.stringify(body),
      receiveCount: 0,
      groupId
    };
    this.messages.push(msg);
    console.log(\`[\${this.name}] Sent: \${msg.messageId}\`);
    return msg.messageId;
  }

  receiveMessage() {
    const msg = this.messages.shift();
    if (!msg) return null;
    msg.receiveCount++;
    if (msg.receiveCount > this.maxReceives && this.dlq) {
      console.log(\`[\${this.name}] Message \${msg.messageId} exceeded maxReceives → DLQ\`);
      this.dlq.sendMessage(JSON.parse(msg.body));
      return null;
    }
    this.inFlight.set(msg.messageId, msg);
    console.log(\`[\${this.name}] Received: \${msg.messageId} (attempt \${msg.receiveCount})\`);
    return msg;
  }

  deleteMessage(messageId) {
    this.inFlight.delete(messageId);
    console.log(\`[\${this.name}] Deleted: \${messageId}\`);
  }

  nack(messageId) {
    const msg = this.inFlight.get(messageId);
    if (msg) {
      this.inFlight.delete(messageId);
      this.messages.push(msg); // Return to queue
      console.log(\`[\${this.name}] NACKed: \${messageId} → back to queue\`);
    }
  }
}

// 2. SNS — Fan-out pub/sub
class SNSTopic {
  constructor(name) {
    this.name = name;
    this.subscribers = [];
  }
  subscribe(name, handler) {
    this.subscribers.push({ name, handler });
    console.log(\`[\${this.name}] Subscriber added: \${name}\`);
  }
  publish(message) {
    console.log(\`\\n[\${this.name}] Publishing to \${this.subscribers.length} subscribers\`);
    this.subscribers.forEach(sub => {
      console.log(\`  → Delivering to \${sub.name}\`);
      sub.handler(message);
    });
  }
}

// 3. EventBridge — Content-based routing
class EventBridge {
  constructor() { this.rules = []; }
  putRule(name, pattern, targets) {
    this.rules.push({ name, pattern, targets });
    console.log(\`[EventBridge] Rule added: \${name}\`);
  }
  putEvent(event) {
    console.log(\`\\n[EventBridge] Event: \${event.source}/\${event['detail-type']}\`);
    for (const rule of this.rules) {
      if (this.matchPattern(event, rule.pattern)) {
        console.log(\`  Matched rule: \${rule.name}\`);
        rule.targets.forEach(t => t.handler(event));
      }
    }
  }
  matchPattern(event, pattern) {
    for (const [key, values] of Object.entries(pattern)) {
      if (key === 'detail') {
        for (const [dk, dv] of Object.entries(values)) {
          if (!dv.includes(event.detail?.[dk])) return false;
        }
      } else if (!values.includes(event[key])) return false;
    }
    return true;
  }
}

// === DEMO: SNS → SQS Fan-Out ===
console.log('=== SNS → SQS Fan-Out Pattern ===');
const emailQueue = new SQSQueue('email-queue');
const smsQueue = new SQSQueue('sms-queue');
const analyticsQueue = new SQSQueue('analytics-queue');

const orderTopic = new SNSTopic('order-events');
orderTopic.subscribe('email-queue', (msg) => emailQueue.sendMessage(msg));
orderTopic.subscribe('sms-queue', (msg) => smsQueue.sendMessage(msg));
orderTopic.subscribe('analytics-queue', (msg) => analyticsQueue.sendMessage(msg));

orderTopic.publish({ orderId: 'ORD-001', amount: 999, userId: 'u42' });

// === DEMO: EventBridge Content-Based Routing ===
console.log('\\n=== EventBridge Content-Based Routing ===');
const eb = new EventBridge();

eb.putRule('high-value-orders', {
  source: ['order-service'],
  'detail-type': ['OrderPlaced'],
  detail: { tier: ['premium'] }
}, [{ name: 'VIP-Lambda', handler: (e) => console.log('    VIP handler:', e.detail) }]);

eb.putRule('all-orders', {
  source: ['order-service'],
  'detail-type': ['OrderPlaced']
}, [{ name: 'Analytics-Lambda', handler: (e) => console.log('    Analytics:', e.detail) }]);

eb.putEvent({
  source: 'order-service',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'ORD-X', tier: 'premium', amount: 5000 }
});

eb.putEvent({
  source: 'order-service',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'ORD-Y', tier: 'standard', amount: 200 }
});

// === DEMO: SQS DLQ ===
console.log('\\n=== SQS Dead Letter Queue ===');
const dlq = new SQSQueue('order-dlq');
const mainQueue = new SQSQueue('order-queue', { dlq, maxReceiveCount: 2 });
mainQueue.sendMessage({ orderId: 'POISON-001' });

// Simulate 3 failed processing attempts
for (let i = 0; i < 3; i++) {
  const msg = mainQueue.receiveMessage();
  if (msg) mainQueue.nack(msg.messageId);
}
console.log('DLQ now has', dlq.messages.length, 'message(s)');`,
    content: `
<h1>SQS vs SNS vs EventBridge</h1>
<p>These three services form the messaging backbone of AWS architectures. At Habuild you use <strong>SQS + EventBridge</strong> daily, and at Niyo you used <strong>SQS</strong> extensively. Understanding when to pick each — and how they combine — is an SDE-2/SDE-3 interview staple.</p>

<h2>SQS (Simple Queue Service)</h2>
<p>A fully managed <strong>point-to-point</strong> message queue. Messages are consumed by a single consumer (or consumer group). Core model: producer → queue → consumer.</p>

<h3>Standard vs FIFO</h3>
<table>
  <tr><th>Feature</th><th>Standard Queue</th><th>FIFO Queue</th></tr>
  <tr><td>Ordering</td><td>Best-effort (mostly ordered)</td><td>Strict FIFO within Message Group</td></tr>
  <tr><td>Deduplication</td><td>At-least-once (duplicates possible)</td><td>Exactly-once (5-min dedup window)</td></tr>
  <tr><td>Throughput</td><td>Unlimited</td><td>300 msg/s (3000 with batching, higher with high-throughput mode)</td></tr>
  <tr><td>Use case</td><td>High throughput, order not critical</td><td>Financial transactions, sequential processing</td></tr>
  <tr><td>Queue name</td><td>Any name</td><td>Must end in <code>.fifo</code></td></tr>
</table>

<h3>Key SQS Concepts</h3>
<pre><code>Producer sends message
  │
  ▼
┌─────────────────────────────────┐
│         SQS Queue               │
│                                 │
│  Visibility Timeout: 30s        │  ← message "hidden" while being processed
│  Message Retention: 4d (max 14) │
│  Max Message Size: 256 KB       │  ← use S3 for larger payloads
│  Long Polling: 0-20s            │  ← reduces empty responses &amp; cost
│  Delay Queue: 0-15 min          │  ← delay before message becomes visible
│                                 │
│  DLQ: after N failed receives   │  ← poison message isolation
└─────────────────────────────────┘
  │
  ▼
Consumer polls → receives → processes → deletes
(if not deleted within visibility timeout, message reappears)</code></pre>

<div class="warning-note"><strong>Visibility Timeout vs Message Retention:</strong> Visibility timeout (default 30s, max 12hrs) is how long a message is hidden after being received. Message retention (default 4 days, max 14 days) is how long SQS keeps undeleted messages. If your Lambda times out at 5 minutes, set visibility timeout to 6x that (30 minutes) to prevent duplicate processing.</div>

<h3>Long Polling (Important for Cost)</h3>
<p>Short polling returns immediately (even if queue is empty) — wastes API calls. <strong>Long polling</strong> (ReceiveMessageWaitTimeSeconds = 1-20) waits up to 20 seconds for messages to arrive. This reduces costs by 50-90% for low-traffic queues.</p>

<h2>SNS (Simple Notification Service)</h2>
<p>A fully managed <strong>pub/sub</strong> service. One message published to a topic is delivered to <strong>all subscribers</strong>. Core model: publisher → topic → N subscribers.</p>

<h3>SNS Subscription Types</h3>
<ul>
  <li><strong>SQS</strong> — most common, enables fan-out + independent processing</li>
  <li><strong>Lambda</strong> — direct invocation</li>
  <li><strong>HTTP/HTTPS</strong> — webhook endpoints</li>
  <li><strong>Email / Email-JSON</strong> — notifications</li>
  <li><strong>SMS</strong> — text messages</li>
  <li><strong>Kinesis Data Firehose</strong> — stream to S3/Redshift</li>
</ul>

<h3>SNS → SQS Fan-Out Pattern</h3>
<pre><code>                    ┌──────────┐
                    │ Producer │
                    └────┬─────┘
                         │ publish
                         ▼
                   ┌───────────┐
                   │ SNS Topic │
                   └─────┬─────┘
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │SQS: Email│ │SQS: SMS│ │SQS:Analytics│
         └────┬───┘ └────┬───┘ └────┬───────┘
              ▼          ▼          ▼
         Lambda A    Lambda B   Lambda C
         (send email) (send sms) (log metrics)

Each queue processes INDEPENDENTLY at its own pace.
If Lambda C is slow, it doesn't affect A or B.</code></pre>

<h2>EventBridge</h2>
<p>A <strong>serverless event bus</strong> with content-based routing, schema discovery, and cross-account support. It is the evolution of CloudWatch Events and is AWS's recommended approach for event-driven architectures.</p>

<h3>EventBridge Concepts</h3>
<pre><code>Event Source (AWS service / custom app / SaaS)
  │
  ▼
┌──────────────────────────────────────────────┐
│              EventBridge Event Bus            │
│                                              │
│  Rule 1: source=["order-service"]            │
│          detail-type=["OrderPlaced"]         │
│          detail: { amount: [{ numeric: ["&gt;", 1000] }] }  │
│          → Target: VIP Lambda                │
│                                              │
│  Rule 2: source=["order-service"]            │
│          → Target: Analytics SQS Queue       │
│                                              │
│  Rule 3: schedule: rate(5 minutes)           │
│          → Target: Health-check Lambda       │
└──────────────────────────────────────────────┘</code></pre>

<h3>EventBridge Rule Patterns (Content-Based Routing)</h3>
<pre><code>// Match specific event types
{ "source": ["order-service"], "detail-type": ["OrderPlaced"] }

// Match with content filtering (prefix, numeric, exists)
{
  "source": ["payment-service"],
  "detail": {
    "amount": [{ "numeric": ["&gt;=", 1000] }],
    "currency": ["INR", "USD"],
    "status": [{ "anything-but": "pending" }]
  }
}</code></pre>

<h2>The Big Comparison</h2>
<table>
  <tr><th>Feature</th><th>SQS</th><th>SNS</th><th>EventBridge</th></tr>
  <tr><td><strong>Model</strong></td><td>Queue (pull)</td><td>Pub/Sub (push)</td><td>Event Bus (push, rule-based)</td></tr>
  <tr><td><strong>Consumers</strong></td><td>Single consumer group</td><td>Multiple subscribers</td><td>Multiple targets per rule</td></tr>
  <tr><td><strong>Ordering</strong></td><td>FIFO available</td><td>FIFO for SQS subscribers</td><td>No ordering guarantee</td></tr>
  <tr><td><strong>Deduplication</strong></td><td>FIFO: exactly-once</td><td>No</td><td>No</td></tr>
  <tr><td><strong>Content routing</strong></td><td>No</td><td>Filter policies (limited)</td><td>Rich pattern matching</td></tr>
  <tr><td><strong>Max message size</strong></td><td>256 KB</td><td>256 KB</td><td>256 KB</td></tr>
  <tr><td><strong>Max targets</strong></td><td>1 consumer group</td><td>12.5M subscriptions/topic</td><td>5 targets/rule (300 rules/bus)</td></tr>
  <tr><td><strong>Retry/DLQ</strong></td><td>Built-in DLQ</td><td>Delivery retries</td><td>Retry policy + DLQ per target</td></tr>
  <tr><td><strong>Cross-account</strong></td><td>Yes (policy)</td><td>Yes (policy)</td><td>Yes (native, event bus to event bus)</td></tr>
  <tr><td><strong>Schema registry</strong></td><td>No</td><td>No</td><td>Yes (auto-discover schemas)</td></tr>
  <tr><td><strong>Archive &amp; replay</strong></td><td>No</td><td>No</td><td>Yes (replay past events)</td></tr>
  <tr><td><strong>Latency</strong></td><td>~1-10ms (polling)</td><td>~50-100ms</td><td>~400ms-1s typical</td></tr>
  <tr><td><strong>Cost</strong></td><td>$0.40/1M requests</td><td>$0.50/1M publishes</td><td>$1.00/1M events</td></tr>
</table>

<h2>FIFO Queues Deep Dive</h2>
<pre><code>// FIFO Queue: Message Group ID determines ordering scope

// All messages with same groupId are strictly ordered
sqs.sendMessage({
  QueueUrl: 'https://sqs.../order-queue.fifo',
  MessageBody: JSON.stringify({ orderId: 'ORD-1', step: 'created' }),
  MessageGroupId: 'order-ORD-1',        // ← ordering per order
  MessageDeduplicationId: 'ORD-1-created' // ← prevents duplicates in 5-min window
});

// Different groupIds can be processed in parallel
// GroupId 'order-ORD-1' → Consumer A (sequential)
// GroupId 'order-ORD-2' → Consumer B (sequential)
// Both groups process simultaneously!</code></pre>

<h2>Common Architecture Patterns</h2>

<h3>Pattern: EventBridge → Multiple Targets (Habuild-style)</h3>
<pre><code>EventBridge (custom bus: "habuild-events")
  │
  ├── Rule: source=["user-service"], detail-type=["UserSignedUp"]
  │   ├── Target 1: Lambda (send welcome WhatsApp)
  │   ├── Target 2: SQS (analytics-queue)
  │   └── Target 3: Lambda (create CRM entry)
  │
  ├── Rule: schedule rate(1 hour)
  │   └── Target: Lambda (sync data to reporting DB)
  │
  └── Rule: source=["payment-service"], detail-type=["PaymentFailed"]
      └── Target: SNS → PagerDuty webhook</code></pre>

<h3>Pattern: SQS as Lambda Event Source (Habuild &amp; Niyo)</h3>
<pre><code>// Lambda event source mapping configuration
{
  "EventSourceArn": "arn:aws:sqs:ap-south-1:123:order-queue",
  "FunctionName": "process-orders",
  "BatchSize": 10,                    // Max messages per invocation
  "MaximumBatchingWindowSeconds": 5,   // Wait up to 5s to fill batch
  "FunctionResponseTypes": ["ReportBatchItemFailures"],
  "ScalingConfig": {
    "MaximumConcurrency": 50          // Cap Lambda concurrency
  }
}

// Lambda scales automatically:
// - 5 pollers initially
// - Adds 60/min more if queue depth grows
// - Up to 1000 concurrent (or your limit)</code></pre>

<div class="warning-note"><strong>SQS → Lambda gotcha:</strong> If you DON'T enable ReportBatchItemFailures and any single message in a batch fails, <strong>all messages in the batch</strong> return to the queue. This causes duplicate processing for messages that already succeeded. Always enable partial batch failure reporting.</div>

<h2>Handling Poison Messages</h2>
<pre><code>Main Queue (maxReceiveCount: 3)
  │
  │  Message fails processing 3 times
  │
  ▼
Dead Letter Queue (DLQ)
  │
  │  Options:
  ├── 1. CloudWatch Alarm on DLQ depth &gt; 0 → alert on-call
  ├── 2. Lambda triggered by DLQ → auto-retry with fix
  ├── 3. Manual inspection via AWS Console
  └── 4. DLQ Redrive (native feature) → send back to source queue

// Best practice: Set DLQ retention to max (14 days)
// Always have a CloudWatch alarm on ApproximateNumberOfMessagesVisible &gt; 0</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: When would you use EventBridge over SNS+SQS?</div>
  <div class="qa-a"><strong>Use EventBridge when:</strong> 1) You need content-based routing — EventBridge rules can filter on any field in the event body, while SNS filter policies are limited. 2) You want schema discovery and evolution. 3) You need event archive and replay (debugging production issues). 4) You are building cross-account event architectures. 5) You want to react to AWS service events natively (S3, EC2, CodePipeline). <strong>Use SNS+SQS when:</strong> 1) You need strict FIFO ordering. 2) You need very high throughput with low latency (&lt;10ms). 3) You have millions of subscribers. 4) Cost is a primary concern ($0.40-0.50 vs $1.00/1M). At Habuild, EventBridge is ideal for the scheduling + event routing use cases, while SQS handles the actual reliable message processing.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle poison messages in SQS?</div>
  <div class="qa-a"><strong>1)</strong> Configure a Dead Letter Queue with maxReceiveCount (typically 3-5). After N failed attempts, the message moves to the DLQ automatically. <strong>2)</strong> Set up a CloudWatch alarm on the DLQ's ApproximateNumberOfMessagesVisible metric to alert immediately. <strong>3)</strong> Build a DLQ processor Lambda that inspects failed messages, logs the error context, and either retries with a fix or routes to manual review. <strong>4)</strong> Use SQS DLQ Redrive to replay messages back to the source queue after fixing the bug. <strong>5)</strong> Implement idempotent consumers so replayed messages don't cause duplicates. <strong>6)</strong> Always set DLQ retention to 14 days (maximum) to give your team time to investigate.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a notification system using SQS, SNS, and EventBridge.</div>
  <div class="qa-a"><strong>Architecture:</strong> Application services emit events to an EventBridge custom bus. EventBridge rules route events: "UserSignedUp" → SNS "welcome-notifications" topic, "OrderPlaced" → SNS "order-notifications" topic, "PaymentFailed" → direct to Lambda for urgent handling. Each SNS topic fans out to SQS queues per channel: email-queue, sms-queue, push-queue, whatsapp-queue. Each queue has its own Lambda consumer that calls the appropriate delivery API. <strong>Why this design:</strong> EventBridge provides flexible routing without code changes. SNS provides fan-out to multiple channels. SQS provides buffering, retry, and independent scaling per channel. If the SMS provider is down, only sms-queue backs up — email and push continue normally. DLQ on each queue catches persistent failures. CloudWatch alarms on DLQ depth trigger PagerDuty alerts.</div>
</div>
`
  },
  {
    id: 'aws-s3',
    title: 'S3: Storage, Lifecycle & Security',
    category: 'AWS',
    starterCode: `// S3 Patterns — Simulated in Browser
// ====================================

// 1. Pre-signed URL generation (simulated)
class S3Client {
  constructor(bucket) {
    this.bucket = bucket;
    this.objects = new Map();
    console.log(\`[S3] Bucket initialized: \${bucket}\`);
  }

  putObject(key, body, metadata = {}) {
    const obj = {
      key,
      body,
      size: typeof body === 'string' ? body.length : 0,
      lastModified: new Date(),
      storageClass: metadata.storageClass || 'STANDARD',
      versionId: 'v-' + Math.random().toString(36).slice(2, 8),
      metadata
    };
    this.objects.set(key, obj);
    console.log(\`[S3] PUT s3://\${this.bucket}/\${key} (\${obj.size} bytes, \${obj.storageClass})\`);
    return obj;
  }

  getObject(key) {
    const obj = this.objects.get(key);
    if (!obj) throw new Error(\`NoSuchKey: \${key}\`);
    console.log(\`[S3] GET s3://\${this.bucket}/\${key}\`);
    return { ...obj };
  }

  generatePresignedUrl(key, operation, expiresIn = 3600) {
    const url = \`https://\${this.bucket}.s3.amazonaws.com/\${key}?X-Amz-Expires=\${expiresIn}&X-Amz-Signature=abc123\`;
    console.log(\`[S3] Pre-signed URL (\${operation}, expires: \${expiresIn}s):\`);
    console.log(\`  \${url}\`);
    return url;
  }

  listObjects(prefix = '') {
    const results = [];
    for (const [key, obj] of this.objects) {
      if (key.startsWith(prefix)) {
        results.push({ key, size: obj.size, storageClass: obj.storageClass });
      }
    }
    console.log(\`[S3] LIST prefix="\${prefix}" → \${results.length} objects\`);
    return results;
  }
}

// 2. Lifecycle simulation
class LifecycleManager {
  constructor(s3) {
    this.s3 = s3;
    this.rules = [];
  }

  addRule(rule) {
    this.rules.push(rule);
    console.log(\`[Lifecycle] Rule added: \${rule.id}\`);
  }

  evaluate() {
    console.log('\\n=== Evaluating Lifecycle Rules ===');
    for (const [key, obj] of this.s3.objects) {
      const ageDays = Math.floor((Date.now() - obj.lastModified) / 86400000);
      for (const rule of this.rules) {
        if (key.startsWith(rule.prefix || '')) {
          if (rule.transition && ageDays >= rule.transition.days) {
            console.log(\`  \${key}: transition \${obj.storageClass} → \${rule.transition.storageClass} (age: \${ageDays}d)\`);
            obj.storageClass = rule.transition.storageClass;
          }
          if (rule.expiration && ageDays >= rule.expiration.days) {
            console.log(\`  \${key}: EXPIRED (age: \${ageDays}d, rule: \${rule.expiration.days}d)\`);
          }
        }
      }
    }
  }
}

// === DEMO ===
const s3 = new S3Client('habuild-uploads');

// Upload files
s3.putObject('uploads/2024/report.pdf', 'PDF content here...', { contentType: 'application/pdf' });
s3.putObject('uploads/2024/photo.jpg', 'JPEG binary...', { contentType: 'image/jpeg' });
s3.putObject('logs/2024-01/app.log', 'Log data...'.repeat(100));
s3.putObject('temp/export.csv', 'id,name,email...');

// Generate pre-signed URLs
console.log('\\n=== Pre-signed URLs ===');
s3.generatePresignedUrl('uploads/2024/report.pdf', 'GET', 900);
s3.generatePresignedUrl('uploads/user-avatar.jpg', 'PUT', 300);

// List objects
console.log('');
s3.listObjects('uploads/');
s3.listObjects('logs/');

// Lifecycle rules
const lifecycle = new LifecycleManager(s3);
lifecycle.addRule({
  id: 'archive-old-logs',
  prefix: 'logs/',
  transition: { days: 30, storageClass: 'GLACIER' },
  expiration: { days: 365 }
});
lifecycle.addRule({
  id: 'cleanup-temp',
  prefix: 'temp/',
  expiration: { days: 1 }
});
lifecycle.evaluate();

// Multipart upload simulation
console.log('\\n=== Multipart Upload (conceptual) ===');
const fileSize = 150; // MB
const partSize = 25;  // MB each
const parts = Math.ceil(fileSize / partSize);
console.log(\`File: \${fileSize}MB → \${parts} parts of \${partSize}MB each\`);
console.log('Upload concurrently (5 parallel) → ~' + Math.ceil(parts/5) + ' rounds');
console.log('If part 3 fails, retry ONLY part 3 (not entire file)');
console.log('After all parts uploaded → CompleteMultipartUpload → S3 assembles');`,
    content: `
<h1>S3: Storage, Lifecycle &amp; Security</h1>
<p>Amazon S3 is the foundational storage service of AWS. At Niyo you automated S3 → SFTP transfers and managed file uploads; at Habuild you work with S3 for object storage. For SDE-2/SDE-3 interviews, you need to know storage classes, security models, performance optimization, and event-driven patterns.</p>

<h2>Storage Classes Comparison</h2>
<table>
  <tr><th>Storage Class</th><th>Availability</th><th>Durability</th><th>Min Duration</th><th>Retrieval Time</th><th>Cost (GB/mo)</th><th>Use Case</th></tr>
  <tr><td><strong>Standard</strong></td><td>99.99%</td><td>11 nines</td><td>None</td><td>Instant</td><td>~$0.023</td><td>Frequently accessed data</td></tr>
  <tr><td><strong>Intelligent-Tiering</strong></td><td>99.9%</td><td>11 nines</td><td>None</td><td>Instant*</td><td>~$0.023 + monitoring fee</td><td>Unpredictable access patterns</td></tr>
  <tr><td><strong>Standard-IA</strong></td><td>99.9%</td><td>11 nines</td><td>30 days</td><td>Instant</td><td>~$0.0125</td><td>Infrequent access, need fast retrieval</td></tr>
  <tr><td><strong>One Zone-IA</strong></td><td>99.5%</td><td>11 nines</td><td>30 days</td><td>Instant</td><td>~$0.01</td><td>Re-creatable data, secondary backups</td></tr>
  <tr><td><strong>Glacier Instant</strong></td><td>99.9%</td><td>11 nines</td><td>90 days</td><td>Milliseconds</td><td>~$0.004</td><td>Archive with instant access needs</td></tr>
  <tr><td><strong>Glacier Flexible</strong></td><td>99.99%</td><td>11 nines</td><td>90 days</td><td>1-12 hours</td><td>~$0.0036</td><td>Archive, 1-12 hour retrieval OK</td></tr>
  <tr><td><strong>Glacier Deep Archive</strong></td><td>99.99%</td><td>11 nines</td><td>180 days</td><td>12-48 hours</td><td>~$0.00099</td><td>Compliance, long-term archive</td></tr>
</table>

<div class="warning-note"><strong>Interview trap:</strong> All storage classes have 11 nines (99.999999999%) durability — that is NOT the differentiator. The differences are in <strong>availability</strong>, <strong>retrieval time</strong>, and <strong>cost</strong>. One Zone-IA has lower availability (99.5%) because data is in only one AZ — if that AZ is destroyed, data is lost.</div>

<h2>Lifecycle Policies</h2>
<pre><code>// Example: Cost-optimized lifecycle for user uploads
{
  "Rules": [
    {
      "ID": "optimize-uploads",
      "Filter": { "Prefix": "uploads/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },    // After 30d → IA
        { "Days": 90,  "StorageClass": "GLACIER_IR" },     // After 90d → Glacier Instant
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }    // After 1yr → Deep Archive
      ],
      "Expiration": { "Days": 2555 }  // Delete after 7 years (compliance)
    },
    {
      "ID": "cleanup-incomplete-uploads",
      "Filter": { "Prefix": "" },
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    },
    {
      "ID": "delete-temp-files",
      "Filter": { "Prefix": "temp/" },
      "Status": "Enabled",
      "Expiration": { "Days": 1 }
    }
  ]
}</code></pre>

<div class="warning-note"><strong>Hidden cost:</strong> Incomplete multipart uploads keep accumulating and you get charged for them. Always add an <code>AbortIncompleteMultipartUpload</code> lifecycle rule. This is missed in most setups and can silently cost money.</div>

<h2>Pre-signed URLs</h2>
<p>Pre-signed URLs grant temporary access to private S3 objects without making them public or sharing AWS credentials.</p>

<h3>Download (GET)</h3>
<pre><code>const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const client = new S3Client({ region: 'ap-south-1' });

const url = await getSignedUrl(client, new GetObjectCommand({
  Bucket: 'habuild-uploads',
  Key: 'reports/monthly-jan.pdf'
}), { expiresIn: 900 }); // 15 minutes

// User downloads directly from S3 — no data through your server!</code></pre>

<h3>Upload (PUT)</h3>
<pre><code>const uploadUrl = await getSignedUrl(client, new PutObjectCommand({
  Bucket: 'habuild-uploads',
  Key: \`uploads/\${userId}/\${fileName}\`,
  ContentType: 'image/jpeg',
  Metadata: { 'uploaded-by': userId }
}), { expiresIn: 300 }); // 5 minutes

// Client uploads directly to S3 with:
// PUT &lt;uploadUrl&gt;
// Content-Type: image/jpeg
// Body: &lt;file binary&gt;</code></pre>

<h3>Upload Flow Architecture</h3>
<pre><code>Client                  Your API              S3
  │                        │                   │
  │ 1. Request upload URL  │                   │
  │───────────────────────▶│                   │
  │                        │ 2. Generate        │
  │                        │   pre-signed PUT   │
  │  3. Return URL         │                   │
  │◀───────────────────────│                   │
  │                                            │
  │ 4. Upload file directly to S3              │
  │───────────────────────────────────────────▶│
  │                                            │
  │                        │ 5. S3 Event →     │
  │                        │◀──────────────────│
  │                        │ Lambda processes  │
  │                        │ (resize, scan, etc)│</code></pre>

<h2>S3 Event Notifications</h2>
<pre><code>// S3 can notify on: ObjectCreated, ObjectRemoved, ObjectRestore, Replication

// Targets:
// 1. Lambda (most common) — process uploads, generate thumbnails
// 2. SQS — buffer events, process in batches
// 3. SNS — fan out to multiple consumers
// 4. EventBridge — richest routing (recommended for new designs)

// EventBridge is preferred because:
// - Filter on any object metadata (prefix, suffix, size, etc.)
// - Route to 20+ target types
// - Archive and replay events</code></pre>

<h2>Encryption</h2>
<table>
  <tr><th>Type</th><th>Key Management</th><th>Performance</th><th>Cost</th><th>Use Case</th></tr>
  <tr><td><strong>SSE-S3</strong></td><td>AWS manages everything</td><td>No impact</td><td>Free</td><td>Default, most use cases</td></tr>
  <tr><td><strong>SSE-KMS</strong></td><td>KMS key (you control rotation, policies)</td><td>KMS rate limits apply</td><td>KMS key cost + API calls</td><td>Compliance, audit trail needed</td></tr>
  <tr><td><strong>SSE-C</strong></td><td>You provide key per request</td><td>No impact</td><td>Free</td><td>Client-controlled encryption</td></tr>
  <tr><td><strong>Client-side</strong></td><td>Encrypt before upload</td><td>Client CPU cost</td><td>Free</td><td>Maximum security (AWS never sees plaintext)</td></tr>
</table>

<div class="warning-note"><strong>SSE-KMS throttling:</strong> KMS has a request rate limit (5,500–30,000 req/s depending on region). If you use SSE-KMS on a high-throughput bucket, every GET/PUT calls KMS. For high-throughput scenarios, use S3 Bucket Keys to reduce KMS calls by up to 99%.</div>

<h2>Security: Bucket Policies vs IAM vs ACLs</h2>
<pre><code>Access Decision Flow:
  1. Is there an explicit DENY? → DENIED (always wins)
  2. Is there an explicit ALLOW in any policy? → Check all policies:
     - IAM policy (attached to user/role)
     - Bucket policy (attached to bucket)
     - ACL (legacy, avoid)
  3. No explicit allow? → DENIED (default deny)

Best Practice Hierarchy:
  ┌─────────────────────────────┐
  │ IAM Policies                │ ← WHO can access (identity-based)
  │ (attached to roles/users)   │
  ├─────────────────────────────┤
  │ Bucket Policies             │ ← WHAT can be accessed (resource-based)
  │ (attached to bucket)        │   Cross-account access, public access
  ├─────────────────────────────┤
  │ S3 Block Public Access      │ ← Override, prevents any public access
  │ (account + bucket level)    │   ALWAYS enable at account level
  ├─────────────────────────────┤
  │ ACLs                        │ ← LEGACY — disable with BucketOwnerEnforced
  └─────────────────────────────┘</code></pre>

<h2>Performance Optimization</h2>

<h3>Multipart Upload</h3>
<ul>
  <li><strong>Required for:</strong> files &gt; 5 GB. <strong>Recommended for:</strong> files &gt; 100 MB.</li>
  <li>Upload parts in parallel (5-10 concurrent) for maximum throughput.</li>
  <li>Each part: 5 MB to 5 GB. If one part fails, retry only that part.</li>
  <li>Maximum parts: 10,000 per upload.</li>
</ul>

<h3>Transfer Acceleration</h3>
<p>Uses CloudFront edge locations to speed up uploads from distant clients. Enable on bucket, use <code>bucketname.s3-accelerate.amazonaws.com</code> endpoint. 50-500% faster for cross-region transfers.</p>

<h3>Byte-Range Fetches</h3>
<pre><code>// Download only the first 1MB of a large file
const response = await s3.getObject({
  Bucket: 'my-bucket',
  Key: 'huge-file.parquet',
  Range: 'bytes=0-1048575'  // First 1MB
});
// Use case: read Parquet file footer, skip irrelevant data
// Enables parallel download of different ranges</code></pre>

<h3>S3 Request Performance</h3>
<p>S3 supports <strong>5,500 GET/HEAD</strong> and <strong>3,500 PUT/POST/DELETE</strong> requests per second <strong>per prefix</strong>. To maximize throughput, distribute keys across multiple prefixes:</p>
<pre><code>// ❌ Single prefix bottleneck
uploads/2024/01/file1.jpg
uploads/2024/01/file2.jpg

// ✅ Distributed prefixes (hash-based)
uploads/a1b2/2024/01/file1.jpg
uploads/c3d4/2024/01/file2.jpg
// Each unique prefix gets its own 5,500/3,500 rps budget</code></pre>

<h2>S3 → SFTP Transfers (Niyo Context)</h2>
<pre><code>// AWS Transfer Family — managed SFTP server backed by S3
// At Niyo, this was used to automate partner file exchange

Architecture:
  External Partner → SFTP Upload → AWS Transfer Family → S3 Bucket
                                                          │
                                                    S3 Event Notification
                                                          │
                                                          ▼
                                                    Lambda: validate &amp; process
                                                          │
                                                     SQS → downstream processing</code></pre>

<h2>Cross-Region Replication (CRR)</h2>
<pre><code>Source Bucket (ap-south-1)                Destination Bucket (us-east-1)
  │                                         │
  │  ──── Replication Rule ────────────▶    │
  │  - Replicate all or by prefix           │
  │  - Replicate encrypted objects          │
  │  - Replicate delete markers (optional)  │
  │  - RTC: &lt;15 min SLA (99.99%)           │
  │                                         │
  └── Versioning REQUIRED on both buckets ──┘</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How would you serve private content to authenticated users?</div>
  <div class="qa-a"><strong>Approach 1 — Pre-signed URLs:</strong> User authenticates with your API. API generates a pre-signed GET URL (expires in 5-15 minutes). User downloads directly from S3. Pros: simple, no bandwidth through your server. Cons: URL can be shared during validity window. <strong>Approach 2 — CloudFront Signed URLs/Cookies:</strong> Create a CloudFront distribution with S3 as origin. Use Origin Access Control (OAC) so S3 only accepts requests from CloudFront. Generate signed URLs or signed cookies for authenticated users. Pros: CDN caching, better performance, can restrict by IP/date. Best for: video streaming, many assets per page (use signed cookies). <strong>Approach 3 — Lambda@Edge:</strong> Validate JWT at the edge before allowing access. Most flexible but complex. For most cases, CloudFront + signed URLs is the optimal balance of security and performance.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a file upload system for 100K daily uploads.</div>
  <div class="qa-a"><strong>Architecture:</strong> <strong>1) Upload flow:</strong> Client requests a pre-signed PUT URL from your API (with file metadata validation: type, max size). Client uploads directly to S3 — your server handles zero file data. Use multipart upload for files &gt; 100MB. <strong>2) Processing:</strong> S3 event notification (via EventBridge) triggers a Lambda on each upload. Lambda validates the file (virus scan via ClamAV Lambda layer, file type verification), generates thumbnails if needed, and writes metadata to DynamoDB. <strong>3) Storage optimization:</strong> Lifecycle rules: Standard → Standard-IA after 30 days → Glacier after 90 days. AbortIncompleteMultipartUpload after 1 day. <strong>4) Performance:</strong> 100K/day = ~1.2 uploads/sec avg. S3 handles 3,500 PUT/s per prefix — no bottleneck. Use distributed key prefixes if traffic is bursty. Enable Transfer Acceleration for mobile users. <strong>5) Security:</strong> Block all public access. SSE-S3 encryption. Pre-signed URLs expire in 5 minutes. Separate buckets for raw uploads vs processed files. <strong>6) Cost:</strong> ~$5/day for S3 operations (100K PUTs) + storage. Pre-signed URLs mean zero data transfer through your API servers.</div>
</div>
`
  },
  {
    id: 'aws-architecture',
    title: 'AWS Architecture Patterns for Backend',
    category: 'AWS',
    starterCode: `// AWS Architecture Patterns — Simulated in Browser
// =================================================

// 1. Event-Driven Architecture Simulation
class EventDrivenSystem {
  constructor() {
    this.services = new Map();
    this.eventLog = [];
  }

  registerService(name, handler) {
    this.services.set(name, handler);
    console.log(\`[System] Registered: \${name}\`);
  }

  async emit(source, eventType, detail) {
    const event = {
      id: 'evt-' + Math.random().toString(36).slice(2, 8),
      source,
      type: eventType,
      detail,
      timestamp: new Date().toISOString()
    };
    this.eventLog.push(event);
    console.log(\`\\n[Event] \${source} → \${eventType}\`);

    // Route to interested services
    for (const [name, handler] of this.services) {
      if (handler.handles?.includes(eventType)) {
        try {
          const result = await handler.process(event);
          console.log(\`  [\${name}] ✓ \${result}\`);
        } catch (err) {
          console.log(\`  [\${name}] ✗ \${err.message}\`);
        }
      }
    }
  }
}

const system = new EventDrivenSystem();

// WhatsApp Notification Service (like Habuild)
system.registerService('whatsapp-service', {
  handles: ['UserSignedUp', 'PaymentReceived', 'ClassReminder'],
  process: async (event) => {
    const { detail } = event;
    const templates = {
      UserSignedUp: \`Welcome to Habuild, \${detail.name}! 🏋️\`,
      PaymentReceived: \`Payment of ₹\${detail.amount} received.\`,
      ClassReminder: \`Your class starts in 15 minutes!  \`
    };
    return \`WhatsApp sent: "\${templates[event.type] || 'Notification'}"\`;
  }
});

// Analytics Service
system.registerService('analytics', {
  handles: ['UserSignedUp', 'PaymentReceived', 'ClassAttended'],
  process: async (event) => {
    return \`Logged to Keyspaces: \${event.type} at \${event.timestamp}\`;
  }
});

// CRM Service
system.registerService('crm', {
  handles: ['UserSignedUp'],
  process: async (event) => {
    return \`CRM entry created for \${event.detail.name}\`;
  }
});

// Simulate events
(async () => {
  await system.emit('user-service', 'UserSignedUp', {
    userId: 'u-001', name: 'Ravi Kumar', plan: 'premium'
  });

  await system.emit('payment-service', 'PaymentReceived', {
    userId: 'u-001', amount: 999, method: 'UPI'
  });

  await system.emit('scheduler', 'ClassReminder', {
    userId: 'u-001', classId: 'yoga-morning', time: '6:00 AM'
  });

  // 2. Serverless API Pattern
  console.log('\\n=== Serverless API Pattern ===');
  console.log('API Gateway → Lambda → DynamoDB');

  // Simulating API Gateway → Lambda → DB
  const routeTable = {
    'GET /users/:id': async (params) => {
      console.log(\`  Lambda: getUser(\${params.id})\`);
      return { statusCode: 200, body: { id: params.id, name: 'Arvind' } };
    },
    'POST /users': async (body) => {
      console.log('  Lambda: createUser()');
      return { statusCode: 201, body: { id: 'u-new', ...body } };
    },
    'PUT /users/:id': async (params, body) => {
      console.log(\`  Lambda: updateUser(\${params.id})\`);
      return { statusCode: 200, body: { id: params.id, ...body } };
    }
  };

  for (const [route, handler] of Object.entries(routeTable)) {
    console.log(\`\\nRoute: \${route}\`);
    const result = await handler({ id: 'u-001' }, { name: 'Updated' });
    console.log('  Response:', JSON.stringify(result));
  }

  // 3. Cost comparison
  console.log('\\n=== Lambda vs ECS Cost Comparison ===');
  const invocationsPerMonth = 1000000;
  const avgDurationMs = 200;
  const memoryMB = 512;

  const lambdaCost = (() => {
    const gbSeconds = (memoryMB / 1024) * (avgDurationMs / 1000) * invocationsPerMonth;
    const computeCost = gbSeconds * 0.0000166667;
    const requestCost = invocationsPerMonth * 0.0000002;
    return computeCost + requestCost;
  })();

  const ecsCost = (() => {
    // 1 vCPU, 2GB Fargate task running 24/7
    const vCPUCost = 0.04048 * 24 * 30;
    const memoryCost = 0.004445 * 2 * 24 * 30;
    return vCPUCost + memoryCost;
  })();

  console.log(\`Lambda: \${invocationsPerMonth.toLocaleString()} invocations/mo\`);
  console.log(\`  Duration: \${avgDurationMs}ms, Memory: \${memoryMB}MB\`);
  console.log(\`  Cost: $\${lambdaCost.toFixed(2)}/month\`);
  console.log(\`\\nECS Fargate: 1 task running 24/7\`);
  console.log(\`  Cost: $\${ecsCost.toFixed(2)}/month\`);
  console.log(\`\\nBreak-even: Lambda is cheaper below ~60% utilization\`);
})();`,
    content: `
<h1>AWS Architecture Patterns for Backend</h1>
<p>As an SDE-2/SDE-3, you are expected to design systems, not just write Lambda handlers. This topic covers the architecture patterns you encounter daily — event-driven systems at Habuild (Lambda + EventBridge + SQS + Keyspaces), serverless APIs, database selection, and observability. These are the patterns that come up in system design interviews.</p>

<h2>Event-Driven Architecture</h2>
<pre><code>┌──────────────────────────────────────────────────────────────────┐
│              Event-Driven Architecture (Habuild-style)           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Service    Payment Service    Scheduler                    │
│       │                │                │                        │
│       ▼                ▼                ▼                        │
│  ┌─────────────────────────────────────────┐                    │
│  │          EventBridge (Custom Bus)        │                    │
│  └─────────┬──────────┬──────────┬─────────┘                    │
│            │          │          │                               │
│     ┌──────▼───┐ ┌────▼────┐ ┌──▼──────────┐                   │
│     │ SQS:     │ │ SQS:    │ │ Lambda:      │                   │
│     │ WhatsApp │ │Analytics│ │ Real-time    │                   │
│     │ Queue    │ │ Queue   │ │ Alerts       │                   │
│     └────┬─────┘ └────┬────┘ └──────────────┘                   │
│          ▼            ▼                                          │
│     Lambda:       Lambda:                                        │
│     Send via      Write to                                       │
│     WhatsApp API  Keyspaces                                      │
│                                                                  │
│  Benefits:                                                       │
│  • Loose coupling — services don't know about each other        │
│  • Independent scaling — WhatsApp queue can back up without     │
│    affecting payments                                            │
│  • Easy to add new consumers — no code change in producers      │
│  • Event replay — debug production issues by replaying events   │
└──────────────────────────────────────────────────────────────────┘</code></pre>

<h2>Serverless API Pattern</h2>
<pre><code>Client (Mobile/Web)
  │
  ▼
┌─────────────────┐
│  API Gateway     │  ← Rate limiting, auth (Cognito/JWT), throttling
│  (REST or HTTP)  │  ← HTTP API is cheaper &amp; faster for most use cases
└────────┬────────┘
         │
    ┌────┴─────────────────────────┐
    ▼              ▼               ▼
Lambda:         Lambda:         Lambda:
GET /users      POST /orders    GET /analytics
    │              │               │
    ▼              ▼               ▼
DynamoDB        DynamoDB +      Keyspaces
(user data)     SQS (async)     (time-series)

// HTTP API vs REST API
// HTTP API: 70% cheaper, faster, supports JWT natively, no usage plans
// REST API: API keys, usage plans, request validation, caching
// Use HTTP API unless you specifically need REST API features</code></pre>

<h2>Lambda vs ECS vs EKS</h2>
<table>
  <tr><th>Aspect</th><th>Lambda</th><th>ECS Fargate</th><th>EKS (Kubernetes)</th></tr>
  <tr><td><strong>Cold start</strong></td><td>100ms-2s</td><td>30-60s (task startup)</td><td>30-60s (pod startup)</td></tr>
  <tr><td><strong>Max duration</strong></td><td>15 minutes</td><td>Unlimited</td><td>Unlimited</td></tr>
  <tr><td><strong>Scaling speed</strong></td><td>Instant (ms)</td><td>Minutes</td><td>Minutes</td></tr>
  <tr><td><strong>Scale to zero</strong></td><td>Yes (default)</td><td>Yes (but slow scale-up)</td><td>Yes (with KEDA)</td></tr>
  <tr><td><strong>Operational cost</strong></td><td>Near-zero ops</td><td>Low ops</td><td>High ops (cluster mgmt)</td></tr>
  <tr><td><strong>Cost model</strong></td><td>Per invocation+duration</td><td>Per vCPU/memory/second</td><td>Cluster + per pod</td></tr>
  <tr><td><strong>Best for low traffic</strong></td><td>Cheapest (scale to 0)</td><td>Moderate</td><td>Expensive (base cost)</td></tr>
  <tr><td><strong>Best for high traffic</strong></td><td>Expensive at scale</td><td>Cost-effective</td><td>Cost-effective</td></tr>
  <tr><td><strong>Complexity</strong></td><td>Low</td><td>Medium</td><td>High</td></tr>
  <tr><td><strong>Persistent connections</strong></td><td>No</td><td>Yes</td><td>Yes</td></tr>
  <tr><td><strong>Docker support</strong></td><td>Container images</td><td>Full Docker</td><td>Full Docker + K8s</td></tr>
  <tr><td><strong>When to choose</strong></td><td>Event-driven, spiky traffic, microservices</td><td>Longer processes, steady traffic, simpler ops</td><td>Multi-cloud, large team, existing K8s expertise</td></tr>
</table>

<div class="warning-note"><strong>Cost rule of thumb:</strong> Lambda is cheaper when utilization is below ~60%. If your Lambda runs for 12+ hours/day, switch to ECS Fargate. If you need full Kubernetes features (service mesh, complex networking, multi-cloud), use EKS. Start with Lambda, move to ECS when cost becomes a concern.</div>

<h2>AWS Keyspaces (Cassandra) — Habuild Context</h2>
<p>AWS Keyspaces is a managed Apache Cassandra-compatible database. You use it at Habuild for write-heavy, time-series-like workloads.</p>

<h3>When to Use Keyspaces</h3>
<ul>
  <li><strong>Write-heavy workloads:</strong> Keyspaces excels at high write throughput (thousands of writes/sec).</li>
  <li><strong>Time-series data:</strong> User activity logs, event tracking, IoT data.</li>
  <li><strong>Known query patterns:</strong> Design your partition key around your access pattern.</li>
  <li><strong>Wide rows:</strong> Storing many related records under one partition key.</li>
</ul>

<h3>Keyspaces vs DynamoDB</h3>
<table>
  <tr><th>Feature</th><th>Keyspaces</th><th>DynamoDB</th></tr>
  <tr><td>Query language</td><td>CQL (SQL-like)</td><td>PartiQL or API</td></tr>
  <tr><td>Schema</td><td>Table schema required</td><td>Schemaless (except keys)</td></tr>
  <tr><td>Data model</td><td>Wide-column (partition + clustering keys)</td><td>Key-value + document</td></tr>
  <tr><td>Consistency</td><td>Eventual or LOCAL_QUORUM</td><td>Eventual or Strong</td></tr>
  <tr><td>Max item size</td><td>1 MB per row</td><td>400 KB per item</td></tr>
  <tr><td>Serverless</td><td>Yes (on-demand mode)</td><td>Yes (on-demand mode)</td></tr>
  <tr><td>Best for</td><td>Cassandra migrations, CQL familiarity, wide rows</td><td>General purpose, DynamoDB Streams, DAX caching</td></tr>
</table>

<h2>Database Selection Guide</h2>
<table>
  <tr><th>Database</th><th>Type</th><th>Best For</th><th>Avoid When</th></tr>
  <tr><td><strong>DynamoDB</strong></td><td>Key-value / Document</td><td>Single-digit ms latency, serverless, known access patterns</td><td>Complex queries, joins, ad-hoc analytics</td></tr>
  <tr><td><strong>RDS (PostgreSQL)</strong></td><td>Relational</td><td>Complex queries, joins, ACID, existing SQL codebase</td><td>Massive write scale, schema-less data</td></tr>
  <tr><td><strong>Aurora</strong></td><td>Relational (MySQL/PG compatible)</td><td>5x PostgreSQL throughput, auto-scaling storage, multi-AZ</td><td>Cost-sensitive, simple workloads (use RDS instead)</td></tr>
  <tr><td><strong>Keyspaces</strong></td><td>Wide-column</td><td>Write-heavy, time-series, Cassandra migration</td><td>Complex queries, joins, unknown access patterns</td></tr>
  <tr><td><strong>ElastiCache (Redis)</strong></td><td>In-memory</td><td>Caching, session store, leaderboards, pub/sub</td><td>Primary data store, complex queries</td></tr>
  <tr><td><strong>Neptune</strong></td><td>Graph</td><td>Social networks, recommendation engines, fraud detection</td><td>Simple relationships, tabular data</td></tr>
  <tr><td><strong>Redshift</strong></td><td>Data warehouse</td><td>Analytics, BI dashboards, petabyte-scale queries</td><td>OLTP, real-time writes</td></tr>
</table>

<h2>ElastiCache (Redis) vs DynamoDB DAX</h2>
<table>
  <tr><th>Feature</th><th>ElastiCache (Redis)</th><th>DynamoDB DAX</th></tr>
  <tr><td>Use case</td><td>General-purpose caching, sessions, queues</td><td>DynamoDB-only caching</td></tr>
  <tr><td>Latency</td><td>Sub-ms</td><td>Microseconds (in-memory, DynamoDB wire-compatible)</td></tr>
  <tr><td>Data model</td><td>Strings, hashes, lists, sets, sorted sets</td><td>Same as DynamoDB items</td></tr>
  <tr><td>Code change</td><td>Explicit cache-aside logic needed</td><td>Drop-in replacement (same DynamoDB API)</td></tr>
  <tr><td>Works with</td><td>Anything (Redis protocol)</td><td>DynamoDB only</td></tr>
  <tr><td>Write-through</td><td>Manual implementation</td><td>Built-in</td></tr>
</table>

<h2>VPC &amp; Security for Backend Services</h2>
<pre><code>┌──────────────────────────── VPC (10.0.0.0/16) ────────────────────────┐
│                                                                       │
│  ┌── Public Subnet (10.0.1.0/24) ──┐  ┌── Public Subnet (10.0.2.0/24) ┐
│  │  ALB / API Gateway endpoint     │  │  NAT Gateway                    │
│  │  Bastion Host (if needed)       │  │                                 │
│  └──────────────────────────────────┘  └─────────────────────────────────┘
│                                                                       │
│  ┌── Private Subnet (10.0.3.0/24) ──┐  ┌── Private Subnet (10.0.4.0/24) ┐
│  │  ECS Tasks / Lambda (VPC)       │  │  ECS Tasks / Lambda (VPC)       │
│  │  RDS Primary                    │  │  RDS Replica                     │
│  │  ElastiCache Primary            │  │  ElastiCache Replica             │
│  └──────────────────────────────────┘  └─────────────────────────────────┘
│                                                                       │
│  Security Groups:                                                     │
│  • ALB SG: Allow 443 from 0.0.0.0/0                                 │
│  • App SG: Allow 8080 from ALB SG only                               │
│  • DB SG:  Allow 5432 from App SG only                               │
│  • Redis SG: Allow 6379 from App SG only                             │
│                                                                       │
│  VPC Endpoints (avoid NAT Gateway costs):                            │
│  • S3 Gateway Endpoint (free)                                        │
│  • DynamoDB Gateway Endpoint (free)                                  │
│  • SQS Interface Endpoint                                            │
│  • Secrets Manager Interface Endpoint                                │
└───────────────────────────────────────────────────────────────────────┘</code></pre>

<h2>IAM Best Practices</h2>
<ul>
  <li><strong>Least privilege:</strong> Give only the permissions needed. Never use <code>*</code> in production policies.</li>
  <li><strong>Use roles, not users:</strong> Lambda execution role, ECS task role — never embed access keys.</li>
  <li><strong>Condition keys:</strong> Restrict by IP, VPC, time, MFA status.</li>
  <li><strong>Permission boundaries:</strong> Set maximum permissions for delegated admin roles.</li>
  <li><strong>Service Control Policies (SCPs):</strong> Organization-wide guardrails (prevent region/service usage).</li>
</ul>
<pre><code>// ✅ Good Lambda execution role policy
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:ap-south-1:123456:table/users",
  "Condition": {
    "ForAllValues:StringEquals": {
      "dynamodb:LeadingKeys": ["\${aws:PrincipalTag/tenantId}"]
    }
  }
}

// ❌ Bad — overly permissive
{ "Effect": "Allow", "Action": "dynamodb:*", "Resource": "*" }</code></pre>

<h2>Secrets &amp; Configuration Management</h2>
<table>
  <tr><th>Service</th><th>Use For</th><th>Cost</th><th>Features</th></tr>
  <tr><td><strong>Environment Variables</strong></td><td>Non-sensitive config</td><td>Free</td><td>4KB limit, visible in console</td></tr>
  <tr><td><strong>SSM Parameter Store</strong></td><td>Config values, non-rotating secrets</td><td>Free (Standard)</td><td>Hierarchical, versioned, 10K params free</td></tr>
  <tr><td><strong>Secrets Manager</strong></td><td>Credentials, API keys</td><td>$0.40/secret/month</td><td>Auto-rotation, cross-account, audit trail</td></tr>
  <tr><td><strong>AppConfig</strong></td><td>Feature flags, dynamic config</td><td>Free tier available</td><td>Validation, gradual rollout, rollback</td></tr>
</table>
<pre><code>// Best practice: Cache secrets, refresh periodically
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const ssm = new SSMClient({});

let cachedSecret = null;
let cacheExpiry = 0;

async function getSecret(name) {
  if (cachedSecret &amp;&amp; Date.now() &lt; cacheExpiry) return cachedSecret;

  const result = await ssm.send(new GetParameterCommand({
    Name: name,
    WithDecryption: true
  }));

  cachedSecret = result.Parameter.Value;
  cacheExpiry = Date.now() + 300000; // 5 min cache
  return cachedSecret;
}

// Use Lambda Extensions for even better secret caching
// AWS Parameters and Secrets Lambda Extension caches automatically</code></pre>

<h2>Observability: CloudWatch + X-Ray</h2>
<pre><code>Observability Stack:
  ┌─────────────────────────────────────────────┐
  │  CloudWatch                                  │
  │  ├── Logs: Lambda logs, ECS logs            │
  │  ├── Metrics: Custom + AWS metrics          │
  │  ├── Alarms: CPU &gt; 80%, errors &gt; 5/min     │
  │  ├── Dashboards: Operational visibility     │
  │  └── Log Insights: Query logs with SQL-like │
  │                                              │
  │  X-Ray                                       │
  │  ├── Distributed tracing across services    │
  │  ├── Service map (visual dependency graph)  │
  │  ├── Latency analysis (P50, P95, P99)       │
  │  └── Error analysis per service             │
  │                                              │
  │  CloudWatch Embedded Metrics Format (EMF)    │
  │  └── High-cardinality metrics from logs     │
  └─────────────────────────────────────────────┘

// Enable X-Ray in Lambda: just set Tracing: Active
// For Node.js, use aws-xray-sdk to trace downstream calls</code></pre>

<h2>Well-Architected Framework (Brief)</h2>
<table>
  <tr><th>Pillar</th><th>Key Question</th><th>AWS Services</th></tr>
  <tr><td><strong>Operational Excellence</strong></td><td>Can you observe &amp; improve?</td><td>CloudWatch, X-Ray, CloudFormation</td></tr>
  <tr><td><strong>Security</strong></td><td>Who can do what?</td><td>IAM, KMS, WAF, GuardDuty</td></tr>
  <tr><td><strong>Reliability</strong></td><td>Does it recover from failure?</td><td>Multi-AZ, Auto Scaling, Route 53 failover</td></tr>
  <tr><td><strong>Performance Efficiency</strong></td><td>Are you using the right resources?</td><td>Lambda Power Tuning, ElastiCache, CloudFront</td></tr>
  <tr><td><strong>Cost Optimization</strong></td><td>Are you spending wisely?</td><td>Savings Plans, Spot, S3 lifecycle, right-sizing</td></tr>
  <tr><td><strong>Sustainability</strong></td><td>Minimizing environmental impact?</td><td>Graviton, efficient architectures, right-sizing</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: Design a scalable WhatsApp notification system on AWS (Habuild context).</div>
  <div class="qa-a"><strong>Architecture:</strong> <strong>1) Event ingestion:</strong> Application services (user-service, payment-service, class-service) publish events to EventBridge custom bus. <strong>2) Routing:</strong> EventBridge rules route notification-worthy events to an SQS queue (notifications-queue). Using SQS provides buffering if downstream is slow. <strong>3) Processing:</strong> Lambda polls SQS (batch size 10, batching window 5s). For each message, it renders the WhatsApp template (HSM template with variables), calls the WhatsApp Business API (via Gupshup/Interakt/Meta direct). <strong>4) Rate limiting:</strong> WhatsApp API has rate limits. Use SQS with MaximumConcurrency on the Lambda event source to control throughput. If rate-limited, messages stay in queue and retry. <strong>5) Failure handling:</strong> DLQ for messages that fail 3 times. CloudWatch alarm on DLQ depth. Separate Lambda processes DLQ: logs failure reason, retries via alternate channel (SMS fallback), or alerts ops. <strong>6) Scheduling:</strong> EventBridge cron rules trigger scheduled notifications (class reminders at T-15min). Lambda queries DB for eligible users, sends batch to SQS. <strong>7) Observability:</strong> Custom CloudWatch metrics: messages_sent, messages_failed, delivery_latency. X-Ray tracing across the chain. Dashboard showing daily send volume, failure rate, API latency.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle secrets/config in AWS?</div>
  <div class="qa-a"><strong>Layered approach:</strong> <strong>1) Non-sensitive config</strong> (feature flags, URLs, timeouts): SSM Parameter Store (free, versioned, hierarchical — e.g., /habuild/prod/db/host). <strong>2) Secrets</strong> (DB passwords, API keys): AWS Secrets Manager with automatic rotation. For RDS, Secrets Manager can rotate passwords automatically without app changes. <strong>3) In Lambda:</strong> Use the AWS Parameters and Secrets Lambda Extension — it runs as a sidecar, caches secrets locally, and refreshes them periodically. This avoids a cold-start API call and reduces Secrets Manager costs. <strong>4) Never store secrets in:</strong> environment variables (visible in console), code/git, CloudFormation templates (use dynamic references). <strong>5) Access pattern:</strong> Lambda execution role gets secretsmanager:GetSecretValue only for specific ARNs. Use resource-based policies on secrets for cross-account access. <strong>6) Rotation:</strong> Enable automatic rotation (30-90 day cycle). Use Secrets Manager's built-in Lambda rotation functions for RDS/Redshift.</div>
</div>
`
  }
];
