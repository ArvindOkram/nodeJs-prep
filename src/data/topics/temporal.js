export const temporal = [
  {
    id: 'temporal-architecture',
    title: 'Temporal Architecture',
    category: 'Temporal',
    starterCode: `// Simulating Temporal Architecture Concepts in Browser JavaScript

// === Temporal Server Simulation ===
// Temporal Server has 4 internal services: Frontend, History, Matching, Internal Worker

class TemporalServer {
  constructor() {
    this.frontend = new FrontendService();
    this.history = new HistoryService();
    this.matching = new MatchingService();
    this.internalWorker = new InternalWorkerService();
    this.persistence = new PersistenceLayer('postgresql');
    console.log('Temporal Server initialized with all services');
  }

  startWorkflow(workflowId, input) {
    console.log('\\n--- Starting Workflow ---');
    // Frontend validates and routes
    const validated = this.frontend.validate(workflowId, input);
    // History service creates event history
    const historyId = this.history.createExecution(workflowId, input);
    // Matching service adds to task queue
    this.matching.addToTaskQueue('default', historyId);
    // Persist to DB
    this.persistence.save(historyId, { workflowId, input, status: 'RUNNING' });
    return historyId;
  }
}

class FrontendService {
  validate(id, input) {
    console.log('[Frontend] Validated request for workflow:', id);
    return true;
  }
}

class HistoryService {
  constructor() { this.events = new Map(); this.counter = 0; }
  createExecution(workflowId, input) {
    const runId = 'run-' + (++this.counter);
    this.events.set(runId, [
      { eventId: 1, type: 'WorkflowExecutionStarted', input },
      { eventId: 2, type: 'WorkflowTaskScheduled' }
    ]);
    console.log('[History] Created execution', runId, 'with initial events');
    return runId;
  }
}

class MatchingService {
  constructor() { this.queues = new Map(); }
  addToTaskQueue(queue, runId) {
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    this.queues.get(queue).push(runId);
    console.log('[Matching] Added', runId, 'to task queue:', queue);
  }
}

class InternalWorkerService {
  runSystemWorkflows() {
    console.log('[InternalWorker] Running archival, cleanup workflows');
  }
}

class PersistenceLayer {
  constructor(backend) {
    this.backend = backend;
    this.store = new Map();
    console.log('[Persistence] Using backend:', backend);
  }
  save(key, data) {
    this.store.set(key, { ...data, timestamp: Date.now() });
    console.log('[Persistence] Saved execution state for:', key);
  }
}

// === Demo ===
const server = new TemporalServer();
const runId = server.startWorkflow('order-processing', { orderId: 'ORD-123', amount: 99.99 });

// Show event sourcing
console.log('\\n--- Event History (Event Sourcing) ---');
const events = server.history.events.get(runId);
events.forEach(e => console.log('Event #' + e.eventId + ':', e.type));

// Compare with message queues
console.log('\\n--- Temporal vs Message Queues ---');
console.log('Message Queue: fire-and-forget, manual retry, no state tracking');
console.log('Temporal: durable execution, automatic retries, full event history');
console.log('Temporal: workflow state survives crashes, restarts, deployments');`,
    content: `
<h1>Temporal Architecture</h1>
<p><strong>Temporal</strong> is an open-source <strong>durable execution platform</strong> that enables developers to write fault-tolerant, reliable distributed applications using familiar programming constructs. Instead of writing complex error-handling, retry, and state-management code, developers write straightforward code and Temporal guarantees its execution to completion, even in the face of failures.</p>

<h2>What Problem Does Temporal Solve?</h2>
<p>In distributed systems, operations fail constantly: networks partition, services crash, databases timeout. Traditional approaches require:</p>
<ul>
  <li>Manual retry logic with exponential backoff</li>
  <li>Message queues with dead-letter queues and consumer groups</li>
  <li>Database-backed state machines for tracking progress</li>
  <li>Cron jobs to reconcile inconsistent states</li>
  <li>Complex error handling, compensation logic, and idempotency</li>
</ul>
<p>Temporal replaces all of this with a single programming model: <strong>write your business logic as code, and Temporal ensures it runs to completion</strong>.</p>

<h2>Core Concepts</h2>
<pre><code>                        +--------------------+
                        |   Temporal Client   |  (starts workflows, sends signals, queries)
                        +---------+----------+
                                  |
                                  v
                        +--------------------+
                        |  Temporal Server    |  (orchestration brain)
                        |  +--------------+  |
                        |  | Frontend Svc  |  |  &lt;-- gRPC gateway, rate limiting, auth
                        |  +--------------+  |
                        |  | History Svc   |  |  &lt;-- manages workflow state &amp; events
                        |  +--------------+  |
                        |  | Matching Svc  |  |  &lt;-- task queue dispatch
                        |  +--------------+  |
                        |  | Internal Wkr  |  |  &lt;-- system workflows (archival, replication)
                        +---------+----------+
                                  |
              +-------------------+-------------------+
              |                                       |
    +---------v---------+                   +---------v---------+
    |  Persistence DB   |                   |  Visibility Store |
    | (Cassandra/MySQL/ |                   | (Elasticsearch /  |
    |  PostgreSQL)      |                   |  Advanced Vis.)   |
    +-------------------+                   +-------------------+

              +-------------------+
              |     Workers       |  (your code, polls task queues)
              | +---------------+ |
              | | Workflow Wkr  | |  &lt;-- executes workflow logic
              | +---------------+ |
              | | Activity Wkr  | |  &lt;-- executes activities (side effects)
              | +---------------+ |
              +-------------------+</code></pre>

<h2>Temporal Server Internals</h2>

<h3>1. Frontend Service</h3>
<p>The gRPC gateway that all clients and workers communicate with. Responsibilities:</p>
<ul>
  <li>Rate limiting per namespace</li>
  <li>Request validation and authorization</li>
  <li>Routing requests to the appropriate History shard</li>
  <li>TLS termination</li>
</ul>

<h3>2. History Service</h3>
<p>The <strong>most critical service</strong> in Temporal. It manages the mutable state of workflow executions.</p>
<ul>
  <li>Maintains the event history for every workflow execution</li>
  <li>Implements the state machine that drives workflow progression</li>
  <li>Sharded by workflow ID for horizontal scaling</li>
  <li>Handles timers, activity completions, signals, and queries</li>
  <li>Transfers ownership during rebalancing</li>
</ul>
<pre><code>// History shard assignment
shardId = hash(namespaceId + workflowId) % numberOfShards
// Each History pod owns a range of shards
// Default: 4 shards (dev), 16384 shards (production)</code></pre>

<h3>3. Matching Service</h3>
<p>Manages task queues and dispatches tasks to workers via long-poll.</p>
<ul>
  <li>Workflow tasks: dispatched to workflow workers for replay</li>
  <li>Activity tasks: dispatched to activity workers for execution</li>
  <li>Supports sync (eager) and async dispatch modes</li>
  <li>Partitioned task queues for high throughput</li>
</ul>

<h3>4. Internal Worker Service</h3>
<p>Runs system-level workflows:</p>
<ul>
  <li>Archival workflows (moving completed histories to blob storage)</li>
  <li>Cross-cluster replication workflows</li>
  <li>Cleanup and retention enforcement</li>
</ul>

<h2>Persistence Layer</h2>
<table>
  <tr><th>Backend</th><th>Best For</th><th>Scaling</th><th>Notes</th></tr>
  <tr><td>PostgreSQL</td><td>Small-medium deployments</td><td>Single node (with read replicas)</td><td>Simplest setup, familiar to most teams</td></tr>
  <tr><td>MySQL</td><td>Small-medium deployments</td><td>Single node (with Vitess for sharding)</td><td>Battle-tested at Uber (where Temporal originated)</td></tr>
  <tr><td>Cassandra</td><td>Large-scale deployments</td><td>Horizontal, multi-DC</td><td>Best for massive scale, eventual consistency tradeoffs</td></tr>
  <tr><td>SQLite</td><td>Development/testing only</td><td>Single node</td><td>Used in temporalite for local dev</td></tr>
</table>

<h2>Visibility Store</h2>
<p>Supports listing, filtering, and searching workflow executions:</p>
<ul>
  <li><strong>Standard visibility</strong>: backed by the persistence DB, supports basic filters</li>
  <li><strong>Advanced visibility</strong>: backed by Elasticsearch, supports complex queries with custom search attributes</li>
</ul>
<pre><code>// Advanced visibility query examples
ExecutionStatus = "Running" AND CustomerId = "CUST-123"
StartTime &gt; "2024-01-01T00:00:00Z" AND WorkflowType = "OrderProcessing"
OrderAmount &gt; 1000 AND Region = "us-east-1"</code></pre>

<h2>Event Sourcing Under the Hood</h2>
<p>Temporal's core durability mechanism is <strong>event sourcing</strong>. Every state change in a workflow is recorded as an immutable event in the history.</p>
<pre><code>// Example workflow event history
EventID  Type                          Details
-------  ----------------------------  --------------------------
1        WorkflowExecutionStarted      input: {orderId: "123"}
2        WorkflowTaskScheduled
3        WorkflowTaskStarted           workerId: "worker-1"
4        WorkflowTaskCompleted         commands: [ScheduleActivity]
5        ActivityTaskScheduled         activityType: "chargePayment"
6        ActivityTaskStarted           workerId: "worker-2"
7        ActivityTaskCompleted         result: {txId: "TX-456"}
8        WorkflowTaskScheduled
9        WorkflowTaskStarted
10       WorkflowTaskCompleted         commands: [CompleteWorkflow]
11       WorkflowExecutionCompleted    result: {status: "success"}</code></pre>

<p>When a worker crashes and restarts, Temporal <strong>replays</strong> the event history to reconstruct the workflow's state. This is why workflow code must be deterministic -- the same events must produce the same commands on replay.</p>

<h2>How Temporal Achieves Durability</h2>
<ol>
  <li><strong>Every step persisted</strong>: Before an activity is scheduled, the decision is written to the database</li>
  <li><strong>Before any result is used</strong>: Activity results are persisted before the workflow continues</li>
  <li><strong>Replay on failure</strong>: If a worker crashes, another worker picks up the workflow task and replays history</li>
  <li><strong>Idempotent execution</strong>: Commands have unique IDs; duplicates are detected and ignored</li>
  <li><strong>Transactional task dispatch</strong>: Task scheduling and state persistence happen atomically</li>
</ol>

<h2>Temporal vs Alternatives</h2>
<table>
  <tr><th>Feature</th><th>Temporal</th><th>Message Queues (RabbitMQ/SQS)</th><th>Step Functions</th><th>Airflow/Prefect</th></tr>
  <tr><td>Programming Model</td><td>Code (any language)</td><td>Producers/consumers</td><td>JSON/YAML state machines</td><td>DAGs (Python)</td></tr>
  <tr><td>State Management</td><td>Automatic (event sourced)</td><td>Manual (DB-backed)</td><td>Built-in (limited)</td><td>Built-in (task-level)</td></tr>
  <tr><td>Retries</td><td>Automatic, configurable per activity</td><td>DLQ + manual</td><td>Built-in</td><td>Built-in</td></tr>
  <tr><td>Long-running</td><td>Years (continue-as-new)</td><td>Not designed for it</td><td>1 year max</td><td>Not designed for it</td></tr>
  <tr><td>Debugging</td><td>Full event history, replay</td><td>Log aggregation</td><td>Step-level logs</td><td>Task-level logs</td></tr>
  <tr><td>Latency</td><td>~50ms overhead per step</td><td>~1-10ms</td><td>~100ms per transition</td><td>Seconds (scheduler)</td></tr>
  <tr><td>Human-in-loop</td><td>Native (signals + timers)</td><td>Complex to build</td><td>Callbacks</td><td>Sensors (polling)</td></tr>
  <tr><td>Cost Model</td><td>Self-hosted or Temporal Cloud</td><td>Per message</td><td>Per state transition</td><td>Per task</td></tr>
  <tr><td>Vendor Lock-in</td><td>Open source, portable</td><td>Some (protocol-level)</td><td>AWS-locked</td><td>Open source</td></tr>
</table>

<div class="warning-note"><strong>Key Insight</strong>: Temporal is NOT a message queue. It is a <strong>durable execution engine</strong>. While message queues handle point-to-point communication, Temporal manages the entire lifecycle of a business process, including its state, retries, timeouts, and error handling.</div>

<h2>When to Use Temporal</h2>
<ul>
  <li><strong>Multi-step business processes</strong>: Order processing, payment flows, user onboarding</li>
  <li><strong>Long-running operations</strong>: Provisioning infrastructure, data pipelines, approval workflows</li>
  <li><strong>Microservice orchestration</strong>: Coordinating calls across multiple services reliably</li>
  <li><strong>Scheduled/cron jobs</strong>: Reliable recurring tasks with exactly-once semantics</li>
  <li><strong>Saga pattern</strong>: Distributed transactions with compensation</li>
</ul>

<h2>When NOT to Use Temporal</h2>
<ul>
  <li><strong>Simple request-response APIs</strong>: Temporal adds latency overhead (~50ms per step)</li>
  <li><strong>High-throughput event streaming</strong>: Use Kafka for event streaming at millions/sec</li>
  <li><strong>Sub-millisecond latency requirements</strong>: The persistence layer adds latency</li>
  <li><strong>Simple cron jobs</strong>: If you just need to run a script on a schedule without fault tolerance</li>
</ul>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: What is Temporal and how does it differ from a traditional message queue?</div>
  <div class="qa-a">Temporal is a durable execution platform that ensures code runs to completion despite failures. Unlike message queues (RabbitMQ, SQS) which provide fire-and-forget message delivery requiring manual state management, retry logic, and dead-letter handling, Temporal automatically manages workflow state through event sourcing, provides configurable retry policies, handles timeouts, and enables features like signals, queries, and long-running timers. With a message queue, you build the reliability layer yourself; with Temporal, reliability is built into the programming model.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the role of the History Service in Temporal.</div>
  <div class="qa-a">The History Service is the most critical component of Temporal Server. It manages the mutable state of every workflow execution by maintaining an append-only event history. It implements the state machine that drives workflow progression, handles timers, records activity completions, processes signals and queries, and manages workflow tasks. It is horizontally sharded by workflow ID (using consistent hashing), with each History pod owning a range of shards. When a workflow needs to make progress, the History Service creates a workflow task, and when workers complete it, the History Service persists the resulting commands atomically.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Temporal achieve fault tolerance through event sourcing?</div>
  <div class="qa-a">Every state transition in a workflow is persisted as an immutable event in the history before the workflow proceeds. When a worker crashes mid-execution, another worker picks up the workflow task and replays the entire event history to reconstruct the workflow's state in memory. Because workflow code is deterministic, replaying the same events produces the same sequence of commands. Activity results, timer firings, and signal deliveries are all recorded as events, so on replay the workflow does not re-execute activities -- it uses the recorded results. This guarantees exactly-once semantics for the workflow logic.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the trade-offs of different Temporal persistence backends?</div>
  <div class="qa-a">PostgreSQL and MySQL are the simplest to set up and operate, making them ideal for small-to-medium deployments. PostgreSQL is the most popular choice for new deployments. MySQL was the original backend used at Uber. Both support vertical scaling and read replicas, but horizontal sharding requires additional tooling (e.g., Vitess for MySQL). Cassandra provides native horizontal scaling and multi-datacenter replication, making it the best choice for very large deployments (millions of concurrent workflows), but it has a higher operational complexity and eventual consistency trade-offs. For local development, SQLite via temporalite provides a zero-dependency setup.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does the Matching Service work and how do task queues enable worker isolation?</div>
  <div class="qa-a">The Matching Service manages task queues and dispatches tasks to workers. Workers long-poll the Matching Service for tasks on their configured queue. This pull-based model means Temporal never pushes work to overwhelmed workers -- workers only take tasks when they have capacity. Task queues enable routing specific workflow types or activities to dedicated worker fleets, providing isolation (e.g., CPU-intensive activities on high-CPU instances, external API calls through workers with specific network access). Task queues are partitioned for throughput and support sticky execution to optimize workflow task processing by routing tasks to the worker that has the workflow's state cached in memory.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the visibility store and how does advanced visibility help in production?</div>
  <div class="qa-a">The visibility store enables listing, filtering, and searching workflow executions. Standard visibility uses the persistence database and supports basic filters (workflow type, status, time range). Advanced visibility, backed by Elasticsearch, supports SQL-like queries on custom search attributes that you define (e.g., CustomerId, OrderAmount, Region). In production, advanced visibility is critical for operational workflows: finding all failed workflows for a specific customer, aggregating metrics, building dashboards, and debugging issues. Temporal Cloud provides advanced visibility by default.</div>
</div>
`
  },
  {
    id: 'temporal-workflows',
    title: 'Workflows & Activities',
    category: 'Temporal',
    starterCode: `// Simulating Temporal Workflows & Activities in Browser JavaScript

// === Activity with Retry Policy ===
class ActivityRetryPolicy {
  constructor(options = {}) {
    this.initialInterval = options.initialInterval || 1000;
    this.backoffCoefficient = options.backoffCoefficient || 2.0;
    this.maximumInterval = options.maximumInterval || 30000;
    this.maximumAttempts = options.maximumAttempts || 5;
    this.nonRetryableErrors = options.nonRetryableErrors || [];
  }

  getNextDelay(attempt) {
    const delay = Math.min(
      this.initialInterval * Math.pow(this.backoffCoefficient, attempt - 1),
      this.maximumInterval
    );
    return delay;
  }
}

// === Activity Executor (simulates Temporal activity execution) ===
async function executeActivity(name, fn, retryPolicy) {
  let attempt = 0;
  const maxAttempts = retryPolicy.maximumAttempts;

  while (attempt < maxAttempts) {
    attempt++;
    console.log('[Activity: ' + name + '] Attempt ' + attempt + '/' + maxAttempts);
    try {
      const result = await fn(attempt);
      console.log('[Activity: ' + name + '] Succeeded on attempt ' + attempt);
      return result;
    } catch (err) {
      if (retryPolicy.nonRetryableErrors.includes(err.message)) {
        console.log('[Activity: ' + name + '] Non-retryable error: ' + err.message);
        throw err;
      }
      if (attempt >= maxAttempts) {
        console.log('[Activity: ' + name + '] Max attempts reached. Failing.');
        throw err;
      }
      const delay = retryPolicy.getNextDelay(attempt);
      console.log('[Activity: ' + name + '] Failed, retrying in ' + delay + 'ms...');
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// === Deterministic Workflow Simulation ===
class WorkflowContext {
  constructor() {
    this.events = [];
    this.isReplaying = false;
  }

  recordEvent(type, data) {
    this.events.push({ type, data, timestamp: Date.now() });
  }
}

// === Simulate an Order Processing Workflow ===
async function orderWorkflow(ctx, orderId) {
  console.log('\\n=== Order Workflow Started: ' + orderId + ' ===');
  ctx.recordEvent('WorkflowStarted', { orderId });

  // Activity 1: Validate Order
  const retryPolicy = new ActivityRetryPolicy({
    initialInterval: 100,
    backoffCoefficient: 2,
    maximumAttempts: 3
  });

  const validated = await executeActivity('validateOrder', async (attempt) => {
    // Simulates success on first try
    return { valid: true, total: 99.99 };
  }, retryPolicy);
  ctx.recordEvent('ActivityCompleted', { activity: 'validateOrder', result: validated });

  // Activity 2: Charge Payment (might fail then succeed)
  const payment = await executeActivity('chargePayment', async (attempt) => {
    if (attempt < 2) throw new Error('Payment gateway timeout');
    return { transactionId: 'TX-' + Math.random().toString(36).slice(2, 8) };
  }, retryPolicy);
  ctx.recordEvent('ActivityCompleted', { activity: 'chargePayment', result: payment });

  // Activity 3: Ship Order
  const shipment = await executeActivity('shipOrder', async () => {
    return { trackingNumber: 'SHIP-' + Math.random().toString(36).slice(2, 8) };
  }, retryPolicy);
  ctx.recordEvent('ActivityCompleted', { activity: 'shipOrder', result: shipment });

  console.log('\\n=== Workflow Completed ===');
  console.log('Payment TX:', payment.transactionId);
  console.log('Tracking:', shipment.trackingNumber);

  // Show event history
  console.log('\\n--- Event History ---');
  ctx.events.forEach((e, i) =>
    console.log((i + 1) + '. ' + e.type + ':', JSON.stringify(e.data))
  );
}

const ctx = new WorkflowContext();
orderWorkflow(ctx, 'ORD-42');`,
    content: `
<h1>Workflows &amp; Activities</h1>
<p>Workflows and Activities are the two fundamental building blocks in Temporal. Understanding their separation, constraints, and interaction is essential for designing reliable distributed systems.</p>

<h2>Workflows: Deterministic Orchestration</h2>
<p>A <strong>Workflow</strong> is a function that orchestrates activities and other operations. It must be <strong>deterministic</strong> because Temporal replays the event history to reconstruct state after failures.</p>

<pre><code>// TypeScript Temporal SDK — Workflow Definition
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { chargePayment, sendEmail, shipOrder } = proxyActivities&lt;typeof activities&gt;({
  startToCloseTimeout: '30s',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

export async function orderWorkflow(order: Order): Promise&lt;OrderResult&gt; {
  // Step 1: Charge payment (activity)
  const paymentResult = await chargePayment(order);

  // Step 2: Wait 1 hour (durable timer — survives restarts!)
  await sleep('1 hour');

  // Step 3: Ship order (activity)
  const shipmentResult = await shipOrder(order);

  // Step 4: Send confirmation (activity)
  await sendEmail(order.email, shipmentResult.trackingNumber);

  return { paymentResult, shipmentResult };
}</code></pre>

<h2>Determinism Constraints</h2>
<p>Workflow code is replayed from history on every workflow task. Therefore, the code MUST be deterministic. The same input and history must always produce the same sequence of commands.</p>

<h3>What You CANNOT Do in a Workflow</h3>
<table>
  <tr><th>Forbidden</th><th>Why</th><th>Alternative</th></tr>
  <tr><td><code>Math.random()</code></td><td>Produces different values on replay</td><td>Use <code>workflow.uuid4()</code> or side effects</td></tr>
  <tr><td><code>Date.now()</code></td><td>Time changes between replays</td><td>Use <code>workflow.now()</code></td></tr>
  <tr><td>Network calls (fetch, HTTP)</td><td>Results differ on replay</td><td>Use an Activity</td></tr>
  <tr><td>File I/O</td><td>File contents may change</td><td>Use an Activity</td></tr>
  <tr><td>Database access</td><td>Data changes between replays</td><td>Use an Activity</td></tr>
  <tr><td>Non-deterministic libraries</td><td>May use random/time internally</td><td>Wrap in activities or side effects</td></tr>
  <tr><td>Global mutable state</td><td>Shared across workflow instances</td><td>Use workflow-scoped variables</td></tr>
  <tr><td><code>setTimeout</code> / <code>setInterval</code></td><td>Non-deterministic timing</td><td>Use <code>workflow.sleep()</code></td></tr>
</table>

<div class="warning-note"><strong>Non-determinism is the #1 production issue with Temporal.</strong> If workflow code changes behavior between replays (e.g., you add a new activity call between two existing ones), Temporal will throw a non-determinism error. Always use the versioning/patching API when changing workflow logic.</div>

<h2>Activities: Non-Deterministic Side Effects</h2>
<p>Activities are the <strong>only place where side effects belong</strong>. They execute once and their results are recorded in the event history. On replay, the recorded result is used instead of re-executing.</p>

<pre><code>// TypeScript — Activity Definitions
import Stripe from 'stripe';
import { ApplicationFailure } from '@temporalio/activity';

export async function chargePayment(order: Order): Promise&lt;PaymentResult&gt; {
  const stripe = new Stripe(process.env.STRIPE_KEY);
  try {
    const charge = await stripe.charges.create({
      amount: order.amount,
      currency: 'usd',
      source: order.paymentToken,
    });
    return { transactionId: charge.id, status: 'charged' };
  } catch (err) {
    // Non-retryable error: invalid card
    if (err.code === 'card_declined') {
      throw ApplicationFailure.nonRetryable('Card declined', 'CARD_DECLINED');
    }
    throw err; // Retryable by default
  }
}

export async function sendEmail(to: string, trackingNumber: string): Promise&lt;void&gt; {
  await emailService.send({ to, subject: 'Order Shipped', body: trackingNumber });
}

export async function shipOrder(order: Order): Promise&lt;ShipmentResult&gt; {
  const shipment = await shippingAPI.createShipment(order);
  return { trackingNumber: shipment.tracking, carrier: shipment.carrier };
}</code></pre>

<h2>Activity Retry Policies</h2>
<p>Every activity can have a retry policy that controls how failures are handled:</p>

<pre><code>const retryPolicy = {
  initialInterval: '1s',        // First retry after 1 second
  backoffCoefficient: 2.0,      // Each retry doubles the interval
  maximumInterval: '1m',        // Cap interval at 1 minute
  maximumAttempts: 10,          // Give up after 10 attempts (0 = unlimited)
  nonRetryableErrorTypes: [     // These errors skip retry
    'CARD_DECLINED',
    'INVALID_INPUT'
  ],
};

// Retry timeline: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, FAIL</code></pre>

<table>
  <tr><th>Parameter</th><th>Default</th><th>Description</th></tr>
  <tr><td><code>initialInterval</code></td><td>1s</td><td>Delay before the first retry</td></tr>
  <tr><td><code>backoffCoefficient</code></td><td>2.0</td><td>Multiplier for each subsequent retry delay</td></tr>
  <tr><td><code>maximumInterval</code></td><td>100x initial</td><td>Maximum delay between retries</td></tr>
  <tr><td><code>maximumAttempts</code></td><td>0 (unlimited)</td><td>Total number of attempts including the first</td></tr>
  <tr><td><code>nonRetryableErrorTypes</code></td><td>[]</td><td>Error types that should not be retried</td></tr>
</table>

<h2>Activity Heartbeating</h2>
<p>For long-running activities (file processing, data migration), heartbeating tells Temporal the activity is still alive:</p>

<pre><code>import { heartbeat, activityInfo } from '@temporalio/activity';

export async function processLargeFile(fileUrl: string): Promise&lt;void&gt; {
  const chunks = await downloadInChunks(fileUrl);
  for (let i = 0; i &lt; chunks.length; i++) {
    await processChunk(chunks[i]);
    // Report progress; also serves as a "I'm still alive" signal
    heartbeat({ progress: (i + 1) / chunks.length * 100 });
  }
}

// If the worker crashes, the activity is rescheduled.
// The new execution can read the last heartbeat details:
export async function resumableActivity(): Promise&lt;void&gt; {
  const { heartbeatDetails } = activityInfo();
  const lastProgress = heartbeatDetails?.progress ?? 0;
  // Resume from where we left off
}</code></pre>

<h2>Activity Timeouts</h2>
<p>Temporal provides four timeout types for fine-grained control:</p>

<pre><code>Timeline:
|------- scheduleToClose (end-to-end, including retries) -------|
|--scheduleToStart--|--startToClose--|
                    |---heartbeat----|---heartbeat----|</code></pre>

<table>
  <tr><th>Timeout</th><th>What It Measures</th><th>Use Case</th></tr>
  <tr><td><code>scheduleToStart</code></td><td>Time waiting in task queue for a worker</td><td>Detect worker fleet issues</td></tr>
  <tr><td><code>startToClose</code></td><td>Time from worker pickup to completion</td><td>Individual attempt deadline</td></tr>
  <tr><td><code>scheduleToClose</code></td><td>Total time including all retries</td><td>Overall SLA deadline</td></tr>
  <tr><td><code>heartbeatTimeout</code></td><td>Max gap between heartbeats</td><td>Detect stuck long-running activities</td></tr>
</table>

<div class="warning-note"><strong>You must set at least one of <code>scheduleToClose</code> or <code>startToClose</code>.</strong> If neither is set, the activity will never time out, which can lead to stuck workflows in production.</div>

<h2>Workflow Timeouts</h2>
<pre><code>// Starting a workflow with timeouts
const handle = await client.workflow.start(orderWorkflow, {
  workflowId: 'order-123',
  taskQueue: 'orders',
  args: [orderData],
  workflowExecutionTimeout: '24h',  // Total time including retries &amp; continue-as-new
  workflowRunTimeout: '1h',         // Single run (before continue-as-new)
  workflowTaskTimeout: '10s',       // Time for worker to complete a workflow task (default 10s)
});</code></pre>

<h2>Local Activities vs Regular Activities</h2>
<table>
  <tr><th>Aspect</th><th>Regular Activity</th><th>Local Activity</th></tr>
  <tr><td>Execution</td><td>Dispatched via task queue (may go to different worker)</td><td>Executed on the same worker as the workflow</td></tr>
  <tr><td>Persistence</td><td>Full event history (scheduled + started + completed)</td><td>Marker event only (on completion)</td></tr>
  <tr><td>Latency</td><td>~50ms overhead (2 DB writes + task queue)</td><td>~5ms overhead (1 DB write)</td></tr>
  <tr><td>Use Case</td><td>Most activities, especially long-running ones</td><td>Short, fast activities (&lt;5s), high volume</td></tr>
  <tr><td>Heartbeating</td><td>Supported</td><td>Not supported</td></tr>
  <tr><td>Rate Limiting</td><td>Per task queue</td><td>Per worker</td></tr>
</table>

<pre><code>import { proxyLocalActivities } from '@temporalio/workflow';

const { validateInput, lookupCache } = proxyLocalActivities({
  startToCloseTimeout: '5s',
});

// Use local activities for fast, simple operations
const isValid = await validateInput(data);
const cached = await lookupCache(key);</code></pre>

<h2>Side Effects and Mutable Side Effects</h2>
<pre><code>import { sideEffect, uuid4 } from '@temporalio/workflow';

// Side effect: recorded once, replayed from history
const randomId = sideEffect(() =&gt; crypto.randomUUID());

// uuid4() is a built-in deterministic UUID generator
const workflowUniqueId = uuid4();

// Mutable side effect: re-evaluated periodically
// Useful for reading a value that changes and you want the latest
const configValue = mutableSideEffect('config-version', () =&gt; {
  return globalConfig.version; // re-evaluated, recorded if changed
});</code></pre>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: Why must workflow code be deterministic, and what happens if it isn't?</div>
  <div class="qa-a">Workflow code must be deterministic because Temporal uses event sourcing and replay to reconstruct workflow state. When a worker picks up a workflow task, it replays the entire event history through the workflow code, matching each recorded event with the expected command. If the code produces different commands on replay (e.g., because you added a new activity call), Temporal throws a NonDeterminismError and the workflow becomes stuck. This is why you must never use Math.random(), Date.now(), or direct I/O in workflows. When you need to change workflow logic, use the versioning API (workflow.patched()) to handle both old and new execution paths.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the difference between activity timeouts and when to use each.</div>
  <div class="qa-a">There are four activity timeouts: (1) scheduleToStart -- time the task sits in the queue waiting for a worker; use it to detect worker fleet issues. (2) startToClose -- time for a single attempt; set this to your expected maximum activity duration plus buffer. (3) scheduleToClose -- total time including all retries; set this to your overall SLA. (4) heartbeatTimeout -- maximum gap between heartbeat calls; use for long-running activities to detect worker crashes quickly. You must set at least startToClose or scheduleToClose. In practice, most teams set startToClose per-activity and scheduleToClose as an overall SLA guard.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use local activities over regular activities?</div>
  <div class="qa-a">Local activities execute on the same worker that runs the workflow, bypassing the task queue. This reduces latency from ~50ms to ~5ms and generates fewer history events (a single marker instead of three events). Use local activities for short, fast operations under 5 seconds: input validation, cache lookups, lightweight transformations. Avoid them for long-running operations because they don't support heartbeating, and if the worker crashes during a local activity, the entire workflow task is retried. Regular activities are better for anything involving network calls, external APIs, or operations over 5 seconds.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does activity heartbeating enable resumable long-running activities?</div>
  <div class="qa-a">When an activity calls heartbeat(), it sends a progress update to the Temporal server. This serves two purposes: (1) it signals that the activity is still alive, preventing the heartbeat timeout from triggering; (2) it can carry arbitrary details (like progress percentage or last processed offset). If a worker crashes, Temporal reschedules the activity on another worker. The new execution can read the last heartbeat details via activityInfo().heartbeatDetails and resume processing from where the previous attempt left off, rather than starting over. This is essential for activities that process large datasets, download large files, or perform batch operations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do retry policies interact with timeouts?</div>
  <div class="qa-a">Retry policies and timeouts work together: each retry attempt is bounded by startToClose timeout, and the total retry loop is bounded by scheduleToClose timeout. If an attempt exceeds startToClose, it is cancelled and counts as a failure, triggering the next retry. If the total elapsed time exceeds scheduleToClose, no more retries are attempted regardless of maximumAttempts. The backoff between retries (controlled by initialInterval and backoffCoefficient, capped at maximumInterval) counts toward scheduleToClose. NonRetryableErrorTypes bypass the retry policy entirely, causing immediate activity failure. Understanding this interaction is critical for setting SLAs: set scheduleToClose to your SLA, and startToClose to a reasonable per-attempt limit.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a Workflow and an Activity in terms of execution guarantees?</div>
  <div class="qa-a">Workflows have exactly-once execution semantics -- the workflow logic runs to completion exactly once (logically), even if the underlying worker crashes and replays occur. Activities have at-most-once or at-least-once semantics depending on configuration. By default, failed activities are retried (at-least-once), so activities should be idempotent. If maximumAttempts is set to 1, an activity has at-most-once semantics. The key insight is that workflow code never re-executes side effects on replay (it uses recorded results), while activities may genuinely re-execute if the previous attempt failed or the result was not recorded.</div>
</div>
`
  },
  {
    id: 'temporal-signals',
    title: 'Signals, Queries & Child Workflows',
    category: 'Temporal',
    starterCode: `// Simulating Temporal Signals, Queries & Child Workflows

// === Workflow with Signal & Query Support ===
class SignalableWorkflow {
  constructor(id) {
    this.id = id;
    this.state = 'PENDING';
    this.items = [];
    this.signalHandlers = {};
    this.queryHandlers = {};
    this.pendingSignals = [];
    this.resolvers = new Map();

    // Register signal handlers
    this.registerSignal('addItem', (item) => {
      this.items.push(item);
      console.log('[Signal] Item added:', item.name, '($' + item.price + ')');
    });

    this.registerSignal('approve', () => {
      this.state = 'APPROVED';
      console.log('[Signal] Order approved!');
      if (this.resolvers.has('waitForApproval')) {
        this.resolvers.get('waitForApproval')();
        this.resolvers.delete('waitForApproval');
      }
    });

    this.registerSignal('reject', (reason) => {
      this.state = 'REJECTED';
      console.log('[Signal] Order rejected:', reason);
      if (this.resolvers.has('waitForApproval')) {
        this.resolvers.get('waitForApproval')();
      }
    });

    // Register query handlers
    this.registerQuery('getState', () => ({
      state: this.state,
      itemCount: this.items.length,
      total: this.items.reduce((sum, i) => sum + i.price, 0)
    }));

    this.registerQuery('getItems', () => [...this.items]);
  }

  registerSignal(name, handler) { this.signalHandlers[name] = handler; }
  registerQuery(name, handler) { this.queryHandlers[name] = handler; }

  signal(name, data) {
    console.log('\\n>> Received signal: ' + name);
    if (this.signalHandlers[name]) this.signalHandlers[name](data);
  }

  query(name) {
    if (this.queryHandlers[name]) return this.queryHandlers[name]();
    throw new Error('Unknown query: ' + name);
  }

  waitForSignal(resolverKey) {
    return new Promise(resolve => { this.resolvers.set(resolverKey, resolve); });
  }
}

// === Simulate a Human-in-the-Loop Order Workflow ===
async function orderApprovalWorkflow() {
  const wf = new SignalableWorkflow('order-workflow-1');
  console.log('=== Order Approval Workflow Started ===');
  console.log('Waiting for items to be added via signals...\\n');

  // Simulate external signals arriving
  wf.signal('addItem', { name: 'Laptop', price: 1299 });
  wf.signal('addItem', { name: 'Mouse', price: 49 });
  wf.signal('addItem', { name: 'Keyboard', price: 89 });

  // Query the workflow state
  console.log('\\n--- Query: getState ---');
  console.log(JSON.stringify(wf.query('getState'), null, 2));

  console.log('\\n--- Query: getItems ---');
  console.log(JSON.stringify(wf.query('getItems'), null, 2));

  // Simulate waiting for approval with timeout
  console.log('\\nWaiting for approval signal (with 2s timeout)...');

  const approvalTimeout = new Promise(resolve =>
    setTimeout(() => resolve('TIMEOUT'), 2000)
  );

  // Simulate approval arriving after 500ms
  setTimeout(() => wf.signal('approve'), 500);

  const raceResult = await Promise.race([
    wf.waitForSignal('waitForApproval').then(() => wf.state),
    approvalTimeout
  ]);

  if (raceResult === 'TIMEOUT') {
    console.log('Approval timed out! Auto-cancelling order.');
  } else {
    console.log('\\nFinal state: ' + wf.state);
    console.log('Proceeding to payment...');
  }

  // === Child Workflow Simulation ===
  console.log('\\n=== Spawning Child Workflow: Payment ===');
  const paymentResult = await childWorkflow('payment-wf-1', async () => {
    console.log('[Child] Processing payment for $' + wf.query('getState').total);
    await new Promise(r => setTimeout(r, 300));
    console.log('[Child] Payment completed.');
    return { txId: 'TX-' + Math.random().toString(36).slice(2, 8) };
  });
  console.log('Child workflow result:', JSON.stringify(paymentResult));
  console.log('\\n=== Workflow Completed Successfully ===');
}

async function childWorkflow(id, fn) {
  console.log('[Parent] Started child workflow: ' + id);
  const result = await fn();
  console.log('[Parent] Child workflow ' + id + ' completed');
  return result;
}

orderApprovalWorkflow();`,
    content: `
<h1>Signals, Queries &amp; Child Workflows</h1>
<p>Temporal workflows are not just fire-and-forget -- they are <strong>interactive, long-lived entities</strong> that can receive external input (signals), expose internal state (queries), and orchestrate other workflows (child workflows). These mechanisms are fundamental to building real-world applications.</p>

<h2>Signals: External Events Into Running Workflows</h2>
<p>A <strong>signal</strong> is an asynchronous message sent to a running workflow from an external source. Signals are durable -- they are persisted in the event history and delivered exactly once.</p>

<pre><code>// Defining signal handlers in a workflow
import { defineSignal, setHandler, condition } from '@temporalio/workflow';

// Define signal types
const addItemSignal = defineSignal&lt;[Item]&gt;('addItem');
const approveSignal = defineSignal('approve');
const cancelSignal = defineSignal&lt;[string]&gt;('cancel');

export async function shoppingCartWorkflow(): Promise&lt;OrderResult&gt; {
  const items: Item[] = [];
  let approved = false;
  let cancelled = false;

  // Register signal handlers
  setHandler(addItemSignal, (item) =&gt; { items.push(item); });
  setHandler(approveSignal, () =&gt; { approved = true; });
  setHandler(cancelSignal, (reason) =&gt; { cancelled = true; });

  // Wait until approved or cancelled (with 24h timeout)
  const gotDecision = await condition(
    () =&gt; approved || cancelled,
    '24h'  // durable timer!
  );

  if (!gotDecision) return { status: 'expired' };
  if (cancelled) return { status: 'cancelled' };

  // Proceed with checkout
  const payment = await chargePayment(items);
  return { status: 'completed', payment };
}</code></pre>

<pre><code>// Sending signals from a client
const handle = client.workflow.getHandle('cart-user-123');
await handle.signal(addItemSignal, { id: 'SKU-1', name: 'Widget', price: 29.99 });
await handle.signal(addItemSignal, { id: 'SKU-2', name: 'Gadget', price: 49.99 });
await handle.signal(approveSignal);</code></pre>

<h3>Signal Properties</h3>
<ul>
  <li><strong>Asynchronous</strong>: The sender does not wait for a response</li>
  <li><strong>Durable</strong>: Persisted in event history, delivered exactly once</li>
  <li><strong>Ordered</strong>: Signals are processed in the order they are received</li>
  <li><strong>Buffered</strong>: If the workflow is not ready, signals are buffered and delivered when it is</li>
  <li><strong>Can be sent to not-yet-started workflows</strong>: Signal-with-start API</li>
</ul>

<h2>Queries: Synchronous Read of Workflow State</h2>
<p>A <strong>query</strong> is a synchronous, read-only operation that returns the current state of a workflow. Queries do NOT modify state and are NOT recorded in event history.</p>

<pre><code>import { defineQuery, setHandler } from '@temporalio/workflow';

const getCartQuery = defineQuery&lt;CartState&gt;('getCart');
const getStatusQuery = defineQuery&lt;string&gt;('getStatus');

export async function shoppingCartWorkflow(): Promise&lt;OrderResult&gt; {
  const items: Item[] = [];
  let status = 'active';

  setHandler(getCartQuery, () =&gt; ({
    items: [...items],
    total: items.reduce((s, i) =&gt; s + i.price, 0),
    count: items.length,
  }));

  setHandler(getStatusQuery, () =&gt; status);

  // ... workflow logic
}

// Querying from client
const handle = client.workflow.getHandle('cart-user-123');
const cart = await handle.query(getCartQuery);
console.log('Cart total:', cart.total);</code></pre>

<h3>Query vs Signal</h3>
<table>
  <tr><th>Aspect</th><th>Signal</th><th>Query</th></tr>
  <tr><td>Direction</td><td>External -> Workflow</td><td>External -> Workflow -> External</td></tr>
  <tr><td>Synchronous</td><td>No (fire-and-forget)</td><td>Yes (returns a value)</td></tr>
  <tr><td>Modifies state</td><td>Yes (can mutate workflow variables)</td><td>No (read-only)</td></tr>
  <tr><td>In event history</td><td>Yes</td><td>No</td></tr>
  <tr><td>Durable</td><td>Yes</td><td>No (ephemeral)</td></tr>
</table>

<h2>Updates: Signal + Query Combined</h2>
<p>An <strong>update</strong> combines the mutation capability of a signal with the synchronous response of a query. The caller sends data, the workflow processes it, and returns a result -- all in one round trip.</p>

<pre><code>import { defineUpdate, setHandler } from '@temporalio/workflow';

const addItemUpdate = defineUpdate&lt;AddItemResult, [Item]&gt;('addItem');

export async function shoppingCartWorkflow(): Promise&lt;OrderResult&gt; {
  const items: Item[] = [];

  setHandler(addItemUpdate, (item) =&gt; {
    if (items.length &gt;= 100) {
      throw new Error('Cart full');
    }
    items.push(item);
    return { itemCount: items.length, total: items.reduce((s, i) =&gt; s + i.price, 0) };
  });
  // ...
}

// Client gets a response!
const result = await handle.executeUpdate(addItemUpdate, {
  args: [{ id: 'SKU-1', name: 'Widget', price: 29.99 }],
});
console.log('New cart total:', result.total);</code></pre>

<div class="warning-note"><strong>Updates are available in Temporal SDK v1.9+.</strong> They are the recommended approach when you need to both mutate workflow state and get a response. Before updates, this pattern required a signal followed by a query, which had race conditions.</div>

<h2>Child Workflows</h2>
<p>A workflow can start other workflows as children. Child workflows have their own event history, enabling decomposition of complex processes.</p>

<pre><code>import { executeChild, startChild, ParentClosePolicy } from '@temporalio/workflow';

export async function parentWorkflow(orders: Order[]): Promise&lt;void&gt; {
  // Option 1: Execute child and await result
  const result = await executeChild(paymentWorkflow, {
    workflowId: 'payment-' + orders[0].id,
    args: [orders[0]],
  });

  // Option 2: Start child without waiting (fire-and-forget)
  const childHandle = await startChild(notificationWorkflow, {
    workflowId: 'notify-' + orders[0].id,
    args: [orders[0].email],
    parentClosePolicy: ParentClosePolicy.ABANDON, // child continues if parent ends
  });

  // Option 3: Fan-out to multiple children
  const results = await Promise.all(
    orders.map(order =&gt;
      executeChild(processOrderWorkflow, {
        workflowId: 'process-' + order.id,
        args: [order],
      })
    )
  );
}</code></pre>

<h3>Parent Close Policies</h3>
<table>
  <tr><th>Policy</th><th>Behavior When Parent Completes/Fails</th><th>Use Case</th></tr>
  <tr><td><code>TERMINATE</code></td><td>Child is terminated immediately</td><td>Child is meaningless without parent</td></tr>
  <tr><td><code>ABANDON</code></td><td>Child continues running independently</td><td>Child has independent value (notifications)</td></tr>
  <tr><td><code>REQUEST_CANCEL</code></td><td>Cancellation is requested on the child</td><td>Child should clean up and exit</td></tr>
</table>

<h3>When to Use Child Workflows vs Activities</h3>
<table>
  <tr><th>Use Child Workflow When</th><th>Use Activity When</th></tr>
  <tr><td>Logic requires its own event history (too complex for one workflow)</td><td>Simple side effect (API call, DB query)</td></tr>
  <tr><td>Need separate retry/timeout from parent</td><td>Operation completes in minutes</td></tr>
  <tr><td>Want to manage lifecycle independently</td><td>No complex orchestration needed</td></tr>
  <tr><td>Need signals/queries on the sub-process</td><td>No external interaction needed</td></tr>
  <tr><td>History size is a concern (distribute events)</td><td>Few events generated</td></tr>
</table>

<h2>Continue-As-New</h2>
<p>Workflows accumulate event history over time. Very long-running workflows (running for months/years) can build up millions of events, causing performance issues. <strong>Continue-as-new</strong> creates a new workflow execution with fresh history while passing along current state.</p>

<pre><code>import { continueAsNew, sleep } from '@temporalio/workflow';

export async function pollingWorkflow(state: PollingState): Promise&lt;void&gt; {
  let iterationsThisRun = 0;

  while (true) {
    const result = await checkStatus(state.resourceId);

    if (result.done) {
      await notifyComplete(state.resourceId);
      return;
    }

    state.lastChecked = result.timestamp;
    iterationsThisRun++;

    // Continue-as-new every 1000 iterations to prevent history bloat
    if (iterationsThisRun &gt;= 1000) {
      await continueAsNew&lt;typeof pollingWorkflow&gt;(state);
      // This line never executes -- continueAsNew terminates the current run
    }

    await sleep('30s'); // Durable timer
  }
}</code></pre>

<div class="warning-note"><strong>History size limit</strong>: Temporal warns at 10,240 events and terminates at 51,200 events by default. Use continue-as-new for any workflow that may exceed these limits. Always design long-running workflows with continue-as-new from the start.</div>

<h2>Durable Timers and Sleep</h2>
<p>Temporal timers are <strong>durable</strong> -- they survive server restarts, worker crashes, and deployments. A <code>sleep('30 days')</code> truly sleeps for 30 days without holding any resources.</p>

<pre><code>import { sleep, condition } from '@temporalio/workflow';

export async function trialWorkflow(userId: string): Promise&lt;void&gt; {
  await sendWelcomeEmail(userId);

  // Sleep for 7 days (durable -- no resources held!)
  await sleep('7 days');
  await sendMidTrialEmail(userId);

  // Sleep for another 7 days
  await sleep('7 days');

  // Check if user converted (via signal)
  let converted = false;
  setHandler(convertSignal, () =&gt; { converted = true; });

  if (!converted) {
    await sendTrialEndingEmail(userId);
    // Give them 3 more days
    const didConvert = await condition(() =&gt; converted, '3 days');
    if (!didConvert) {
      await disableAccount(userId);
    }
  }
}</code></pre>

<h2>Cancellation and Cleanup</h2>
<pre><code>import {
  CancellationScope,
  CancelledFailure,
  isCancellation,
} from '@temporalio/workflow';

export async function bookingWorkflow(booking: Booking): Promise&lt;void&gt; {
  let hotelBooked = false;
  let flightBooked = false;

  try {
    hotelBooked = await bookHotel(booking);
    flightBooked = await bookFlight(booking);
    await confirmBooking(booking);
  } catch (err) {
    if (isCancellation(err)) {
      // Cancellation requested -- run cleanup in non-cancellable scope
      await CancellationScope.nonCancellable(async () =&gt; {
        if (hotelBooked) await cancelHotel(booking);
        if (flightBooked) await cancelFlight(booking);
        await notifyUser(booking.userId, 'Booking cancelled');
      });
    }
    throw err;
  }
}</code></pre>

<h2>Error Handling</h2>
<pre><code>import { ApplicationFailure } from '@temporalio/common';

// In activities — throw non-retryable errors for business logic failures
throw ApplicationFailure.nonRetryable(
  'Insufficient funds',
  'INSUFFICIENT_FUNDS',
  { accountId, balance, required }
);

// In workflows — catch specific failure types
try {
  await chargePayment(order);
} catch (err) {
  if (err instanceof ApplicationFailure &amp;&amp; err.type === 'INSUFFICIENT_FUNDS') {
    await notifyInsufficientFunds(order.userId);
    return { status: 'payment_failed' };
  }
  throw err; // Re-throw unexpected errors
}</code></pre>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a signal and a query in Temporal?</div>
  <div class="qa-a">A signal is an asynchronous, durable message that can mutate workflow state. It is recorded in the event history and delivered exactly once. The sender does not receive a response. A query is a synchronous, read-only operation that returns the current state of a workflow. It is NOT recorded in event history and cannot modify state. Use signals to push data/events into a workflow, and queries to inspect the current state. For cases where you need both mutation and a response, use updates (available in SDK v1.9+).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When should you use child workflows versus activities?</div>
  <div class="qa-a">Use child workflows when the sub-process is complex enough to warrant its own event history (avoiding history bloat on the parent), when you need independent retry/timeout policies, when the sub-process needs to receive signals or queries independently, or when you want a separate lifecycle (e.g., the child should continue running even if the parent completes). Use activities for simple side effects like API calls, database operations, or file I/O. Activities are lighter weight and don't create a separate workflow execution. A good heuristic: if the sub-process has branching logic or multiple steps, consider a child workflow; if it's a single operation, use an activity.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain continue-as-new and why it is necessary for long-running workflows.</div>
  <div class="qa-a">Continue-as-new terminates the current workflow execution and starts a new one with fresh event history, passing the current state as input. It is necessary because Temporal replays the entire event history on every workflow task to reconstruct state. A workflow running for months might accumulate hundreds of thousands of events, making replay slow and eventually hitting the history size limit (51,200 events by default). Continue-as-new solves this by periodically resetting the history. The workflow is logically continuous (same workflow ID), but physically splits into multiple runs. Design long-running workflows to continue-as-new periodically (e.g., every 1000 iterations or every 24 hours).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do Temporal's durable timers work and why are they significant?</div>
  <div class="qa-a">When a workflow calls sleep() or sets a timer, Temporal records a TimerStarted event in the history and the server schedules a TimerFired event for the specified duration. No worker resources are held during the wait -- the workflow is completely unloaded from memory. When the timer fires, a workflow task is created and a worker replays the history to resume execution. This means a sleep('30 days') literally holds zero resources for 30 days and survives server restarts, deployments, and infrastructure changes. This is fundamentally different from setTimeout in application code, which is lost on process restart. Durable timers enable patterns like free-trial management, subscription billing, and SLA enforcement.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does cancellation propagation work in Temporal workflows?</div>
  <div class="qa-a">When a workflow receives a cancellation request, a CancelledFailure is thrown at the next await point. This propagates through the call stack like a normal exception, which means you can catch it with try/catch. However, cleanup activities (like rolling back a transaction) must run in a CancellationScope.nonCancellable() scope, otherwise they would also be cancelled immediately. Cancellation also propagates to child workflows (based on the parent close policy) and to running activities (the activity's context.cancelled signal is triggered). The key design principle is: cancellation is cooperative -- the workflow code decides how to handle it, including what cleanup to perform.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are the different parent close policies for child workflows?</div>
  <div class="qa-a">There are three parent close policies: (1) TERMINATE -- the child is immediately terminated when the parent completes or fails; use when the child has no value without the parent. (2) ABANDON -- the child continues running independently; use for fire-and-forget operations like sending notifications. (3) REQUEST_CANCEL -- a cancellation request is sent to the child, giving it a chance to clean up; use when the child should gracefully shut down. The default policy is TERMINATE. Choosing the right policy is important for correctness: if a child workflow processes a payment, you probably want ABANDON so the payment completes even if the parent fails.</div>
</div>
`
  },
  {
    id: 'temporal-patterns',
    title: 'Temporal Patterns & Use Cases',
    category: 'Temporal',
    starterCode: `// Simulating Temporal Saga Pattern with Compensation

// === Saga: Distributed Transaction with Rollback ===
class SagaOrchestrator {
  constructor() {
    this.compensations = [];
    this.completedSteps = [];
  }

  async executeStep(name, action, compensation) {
    console.log('[Saga] Executing: ' + name);
    try {
      const result = await action();
      this.completedSteps.push(name);
      this.compensations.unshift({ name, fn: compensation, result });
      console.log('[Saga] ' + name + ' succeeded');
      return result;
    } catch (err) {
      console.log('[Saga] ' + name + ' FAILED: ' + err.message);
      throw err;
    }
  }

  async compensate() {
    console.log('\\n[Saga] === COMPENSATING (Rolling Back) ===');
    for (const comp of this.compensations) {
      try {
        console.log('[Saga] Compensating: ' + comp.name);
        await comp.fn(comp.result);
        console.log('[Saga] ' + comp.name + ' compensated successfully');
      } catch (err) {
        console.log('[Saga] WARNING: Compensation failed for ' + comp.name + ': ' + err.message);
        // In production: log to dead-letter, alert, manual intervention
      }
    }
  }
}

// === Travel Booking Saga ===
async function travelBookingSaga(booking) {
  const saga = new SagaOrchestrator();

  try {
    // Step 1: Reserve Hotel
    const hotel = await saga.executeStep(
      'Reserve Hotel',
      async () => {
        await delay(100);
        return { confirmationId: 'HTL-' + rand(), hotel: booking.hotel };
      },
      async (result) => {
        console.log('  -> Cancelling hotel reservation:', result.confirmationId);
        await delay(50);
      }
    );

    // Step 2: Book Flight
    const flight = await saga.executeStep(
      'Book Flight',
      async () => {
        await delay(100);
        return { ticketId: 'FLT-' + rand(), flight: booking.flight };
      },
      async (result) => {
        console.log('  -> Cancelling flight ticket:', result.ticketId);
        await delay(50);
      }
    );

    // Step 3: Charge Payment (this one fails!)
    const payment = await saga.executeStep(
      'Charge Payment',
      async () => {
        await delay(100);
        if (booking.simulateFailure) {
          throw new Error('Payment gateway timeout');
        }
        return { txId: 'PAY-' + rand() };
      },
      async (result) => {
        console.log('  -> Refunding payment:', result.txId);
        await delay(50);
      }
    );

    // Step 4: Send Confirmation
    await saga.executeStep(
      'Send Confirmation',
      async () => {
        await delay(50);
        console.log('  Email sent to:', booking.email);
        return { sent: true };
      },
      async () => {
        console.log('  -> Sending cancellation email');
      }
    );

    console.log('\\n=== Saga Completed Successfully ===');
    console.log('Hotel:', hotel.confirmationId);
    console.log('Flight:', flight.ticketId);
    console.log('Payment:', payment.txId);

  } catch (err) {
    console.log('\\nSaga failed at step. Initiating compensation...');
    await saga.compensate();
    console.log('\\n=== Saga Rolled Back ===');
    console.log('Completed steps that were compensated:', saga.completedSteps.join(', '));
  }
}

// === Fan-Out / Fan-In Pattern ===
async function fanOutFanIn(items) {
  console.log('\\n\\n=== Fan-Out / Fan-In Pattern ===');
  console.log('Processing', items.length, 'items in parallel...\\n');

  const results = await Promise.all(
    items.map(async (item, i) => {
      const duration = Math.floor(Math.random() * 500) + 100;
      await delay(duration);
      const result = { item, duration, processed: true };
      console.log('Item "' + item + '" processed in ' + duration + 'ms');
      return result;
    })
  );

  console.log('\\nAll', results.length, 'items processed.');
  console.log('Total items:', results.filter(r => r.processed).length);
}

// Helpers
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand() { return Math.random().toString(36).slice(2, 6).toUpperCase(); }

// === Run Demos ===
async function main() {
  console.log('=== SAGA: Successful Booking ===');
  await travelBookingSaga({
    hotel: 'Hilton NYC', flight: 'UA-123',
    email: 'user@example.com', simulateFailure: false
  });

  console.log('\\n\\n=== SAGA: Failed Booking (with compensation) ===');
  await travelBookingSaga({
    hotel: 'Marriott SF', flight: 'DL-456',
    email: 'user@example.com', simulateFailure: true
  });

  await fanOutFanIn(['order-A', 'order-B', 'order-C', 'order-D']);
}

main();`,
    content: `
<h1>Temporal Patterns &amp; Use Cases</h1>
<p>Temporal's programming model naturally supports several distributed systems patterns that are notoriously difficult to implement correctly with traditional approaches. These patterns are battle-tested in production at companies like Uber, Netflix, Snap, Stripe, and Coinbase.</p>

<h2>1. Saga Pattern (Distributed Transactions with Compensation)</h2>
<p>The Saga pattern implements distributed transactions across multiple services by defining <strong>compensating actions</strong> for each step. If any step fails, previously completed steps are rolled back in reverse order.</p>

<pre><code>// TypeScript Temporal Saga Implementation
import { proxyActivities, ApplicationFailure } from '@temporalio/workflow';

const { reserveHotel, cancelHotel,
        bookFlight, cancelFlight,
        chargePayment, refundPayment,
        sendConfirmation, sendCancellation } = proxyActivities({
  startToCloseTimeout: '30s',
  retry: { maximumAttempts: 3 },
});

export async function travelBookingSaga(booking: TravelBooking): Promise&lt;BookingResult&gt; {
  const compensations: Array&lt;() =&gt; Promise&lt;void&gt;&gt; = [];

  try {
    // Step 1: Reserve hotel
    const hotel = await reserveHotel(booking.hotel);
    compensations.unshift(() =&gt; cancelHotel(hotel.confirmationId));

    // Step 2: Book flight
    const flight = await bookFlight(booking.flight);
    compensations.unshift(() =&gt; cancelFlight(flight.ticketId));

    // Step 3: Charge payment
    const payment = await chargePayment({
      amount: hotel.price + flight.price,
      token: booking.paymentToken,
    });
    compensations.unshift(() =&gt; refundPayment(payment.transactionId));

    // Step 4: Send confirmation
    await sendConfirmation(booking.email, { hotel, flight, payment });

    return { status: 'completed', hotel, flight, payment };

  } catch (err) {
    // Compensate in reverse order
    for (const compensate of compensations) {
      try {
        await compensate();
      } catch (compensationErr) {
        // Log but continue compensating other steps
        // In production: alert + manual intervention queue
      }
    }
    await sendCancellation(booking.email, err.message);
    return { status: 'failed', error: err.message };
  }
}</code></pre>

<div class="warning-note"><strong>Saga vs 2PC</strong>: Unlike two-phase commit (2PC), sagas do not hold locks across services. Each step commits immediately, and compensation is used to undo if a later step fails. This means there is a window of inconsistency (between failure and compensation). Design your system to handle this -- for example, mark a hotel reservation as "pending" until the saga completes.</div>

<h3>Saga Design Considerations</h3>
<ul>
  <li><strong>Compensation order matters</strong>: Roll back in reverse order to maintain consistency</li>
  <li><strong>Compensations must be idempotent</strong>: They might be retried if the worker crashes</li>
  <li><strong>Not all steps are compensable</strong>: Sending an email cannot be unsent -- design around this</li>
  <li><strong>Semantic rollback</strong>: Sometimes compensation means "create a reversal" rather than "delete"</li>
  <li><strong>Compensation failures</strong>: Need monitoring, alerting, and manual intervention paths</li>
</ul>

<h2>2. Long-Running Operations</h2>
<p>Temporal excels at operations that take hours, days, or even months to complete.</p>

<pre><code>// Infrastructure provisioning workflow (can take 30+ minutes)
export async function provisionInfraWorkflow(config: InfraConfig): Promise&lt;InfraResult&gt; {
  // Step 1: Create VPC (2-3 minutes)
  const vpc = await createVPC(config.region, config.cidr);

  // Step 2: Create subnets (1-2 minutes each)
  const subnets = await Promise.all(
    config.availabilityZones.map(az =&gt; createSubnet(vpc.id, az))
  );

  // Step 3: Create database cluster (10-15 minutes)
  const dbCluster = await createDatabaseCluster({
    vpcId: vpc.id, subnets: subnets.map(s =&gt; s.id),
    engine: config.dbEngine, instanceClass: config.dbInstanceClass,
  });

  // Step 4: Wait for DB to be available (polling with durable timer)
  while (true) {
    const status = await checkDatabaseStatus(dbCluster.id);
    if (status === 'available') break;
    await sleep('30s'); // Durable timer -- survives restarts
  }

  // Step 5: Run migrations
  await runDatabaseMigrations(dbCluster.endpoint, config.migrationPath);

  // Step 6: Deploy application (5-10 minutes)
  const deployment = await deployApplication(config.appConfig);

  return { vpc, subnets, dbCluster, deployment };
}</code></pre>

<h2>3. Polling Pattern</h2>
<p>An activity that polls an external system until a condition is met, using heartbeating to report progress and enable resumability.</p>

<pre><code>// Activity: poll until resource is ready
export async function pollUntilReady(
  resourceId: string,
  maxWait: number = 600 // seconds
): Promise&lt;ResourceStatus&gt; {
  const startTime = Date.now();

  while (true) {
    const status = await checkResourceStatus(resourceId);
    heartbeat({ lastStatus: status, elapsed: Date.now() - startTime });

    if (status.state === 'READY') return status;
    if (status.state === 'FAILED') {
      throw ApplicationFailure.nonRetryable(
        'Resource creation failed: ' + status.error
      );
    }
    if ((Date.now() - startTime) / 1000 &gt; maxWait) {
      throw ApplicationFailure.nonRetryable('Polling timeout exceeded');
    }

    await new Promise(r =&gt; setTimeout(r, 5000)); // Wait 5s between polls
  }
}

// Alternative: Use workflow-level polling with durable timers
export async function pollingWorkflow(resourceId: string): Promise&lt;void&gt; {
  let iterations = 0;
  while (true) {
    const status = await checkStatus(resourceId);
    if (status.ready) break;

    await sleep('30s'); // Durable timer
    iterations++;

    if (iterations &gt;= 1000) {
      await continueAsNew&lt;typeof pollingWorkflow&gt;(resourceId);
    }
  }
}</code></pre>

<h2>4. Cron / Scheduled Workflows</h2>
<pre><code>// Start a cron workflow
const handle = await client.workflow.start(dailyReportWorkflow, {
  workflowId: 'daily-report',
  taskQueue: 'reporting',
  cronSchedule: '0 9 * * MON-FRI', // 9 AM weekdays
  // OR use the newer Schedule API:
});

// The workflow function runs on each cron tick
export async function dailyReportWorkflow(): Promise&lt;void&gt; {
  const data = await fetchReportData();
  const report = await generateReport(data);
  await sendReport(report);
  // Workflow completes -- Temporal schedules the next run automatically
}

// Newer Schedule API (preferred over cron)
const schedule = await client.schedule.create({
  scheduleId: 'daily-report-schedule',
  spec: {
    intervals: [{ every: '24h', offset: '9h' }], // Every day at 9 AM
    // OR calendars: [{ dayOfWeek: 'MON-FRI', hour: 9 }],
  },
  action: {
    type: 'startWorkflow',
    workflowType: dailyReportWorkflow,
    taskQueue: 'reporting',
  },
  policies: {
    overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous still running
  },
});</code></pre>

<h2>5. Human-in-the-Loop Workflows</h2>
<pre><code>export async function expenseApprovalWorkflow(
  expense: Expense
): Promise&lt;ApprovalResult&gt; {
  // Auto-approve small expenses
  if (expense.amount &lt; 100) {
    await processReimbursement(expense);
    return { status: 'auto-approved' };
  }

  // Notify manager and wait for approval signal
  await notifyManager(expense.managerId, expense);

  let decision: 'approved' | 'rejected' | undefined;
  let notes: string = '';

  setHandler(approveSignal, (approvalNotes: string) =&gt; {
    decision = 'approved';
    notes = approvalNotes;
  });

  setHandler(rejectSignal, (rejectionNotes: string) =&gt; {
    decision = 'rejected';
    notes = rejectionNotes;
  });

  // Wait up to 7 days for a decision
  const gotDecision = await condition(() =&gt; decision !== undefined, '7 days');

  if (!gotDecision) {
    // Escalate to VP if no response in 7 days
    await notifyVP(expense.vpId, expense);
    const escalated = await condition(() =&gt; decision !== undefined, '3 days');
    if (!escalated) {
      return { status: 'expired', notes: 'No response after escalation' };
    }
  }

  if (decision === 'approved') {
    await processReimbursement(expense);
  }

  return { status: decision!, notes };
}</code></pre>

<h2>6. Fan-Out / Fan-In (Parallel Activities)</h2>
<pre><code>export async function batchProcessingWorkflow(
  items: Item[]
): Promise&lt;BatchResult&gt; {
  // Fan-out: process all items in parallel
  const results = await Promise.all(
    items.map(item =&gt; processItem(item))
  );

  // Fan-in: aggregate results
  const succeeded = results.filter(r =&gt; r.success);
  const failed = results.filter(r =&gt; !r.success);

  if (failed.length &gt; 0) {
    await sendFailureReport(failed);
  }

  return {
    total: items.length,
    succeeded: succeeded.length,
    failed: failed.length,
  };
}

// With concurrency control using semaphore pattern
export async function rateLimitedFanOut(items: Item[]): Promise&lt;Result[]&gt; {
  const CONCURRENCY = 10;
  const results: Result[] = [];

  for (let i = 0; i &lt; items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(item =&gt; processItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}</code></pre>

<h2>7. Entity Pattern (Workflow as Entity Lifecycle)</h2>
<p>Use a workflow to represent the entire lifecycle of a domain entity. The workflow runs for the lifetime of the entity and handles all state transitions via signals.</p>

<pre><code>export async function subscriptionWorkflow(
  userId: string, plan: Plan
): Promise&lt;void&gt; {
  let currentPlan = plan;
  let status: 'active' | 'paused' | 'cancelled' = 'active';
  let billingCycleCount = 0;

  // Signal handlers for lifecycle events
  setHandler(changePlanSignal, (newPlan: Plan) =&gt; { currentPlan = newPlan; });
  setHandler(pauseSignal, () =&gt; { status = 'paused'; });
  setHandler(resumeSignal, () =&gt; { status = 'active'; });
  setHandler(cancelSignal, () =&gt; { status = 'cancelled'; });

  // Query handlers
  setHandler(getSubscriptionQuery, () =&gt; ({
    userId, plan: currentPlan, status, billingCycleCount
  }));

  while (status !== 'cancelled') {
    if (status === 'active') {
      await chargeBilling(userId, currentPlan);
      billingCycleCount++;
    }

    await sleep(currentPlan.billingInterval); // '30 days', '1 year', etc.

    // Continue-as-new periodically to keep history manageable
    if (billingCycleCount % 12 === 0 &amp;&amp; billingCycleCount &gt; 0) {
      await continueAsNew&lt;typeof subscriptionWorkflow&gt;(userId, currentPlan);
    }
  }

  // Cancellation cleanup
  await processRefund(userId, currentPlan);
  await sendCancellationEmail(userId);
}</code></pre>

<h2>8. Batch Processing with Workflows</h2>
<pre><code>export async function batchImportWorkflow(
  batchId: string, fileUrl: string
): Promise&lt;BatchImportResult&gt; {
  // Step 1: Download and parse file (activity)
  const records = await downloadAndParse(fileUrl);

  // Step 2: Validate all records (local activity for speed)
  const validated = await validateRecords(records);

  // Step 3: Process in chunks via child workflows
  const CHUNK_SIZE = 100;
  const chunks = chunkArray(validated.valid, CHUNK_SIZE);
  const chunkResults = await Promise.all(
    chunks.map((chunk, i) =&gt;
      executeChild(processChunkWorkflow, {
        workflowId: batchId + '-chunk-' + i,
        args: [chunk],
      })
    )
  );

  // Step 4: Generate summary report
  const totalProcessed = chunkResults.reduce((s, r) =&gt; s + r.processed, 0);
  await generateReport(batchId, {
    total: records.length,
    valid: validated.valid.length,
    invalid: validated.invalid.length,
    processed: totalProcessed,
  });

  return { batchId, totalProcessed };
}</code></pre>

<h2>Real-World Use Cases</h2>
<table>
  <tr><th>Use Case</th><th>Pattern</th><th>Key Features Used</th></tr>
  <tr><td>Payment Processing</td><td>Saga</td><td>Activities with retries, compensation, idempotency keys</td></tr>
  <tr><td>User Onboarding</td><td>Long-running + Signals</td><td>Multi-step, wait for email verification signal, timers for reminders</td></tr>
  <tr><td>CI/CD Pipeline</td><td>Fan-out/fan-in + Child WFs</td><td>Parallel test suites, sequential deployments, approval gates</td></tr>
  <tr><td>Subscription Management</td><td>Entity</td><td>Signals for plan changes, durable timers for billing cycles</td></tr>
  <tr><td>Order Fulfillment</td><td>Saga + Human-in-loop</td><td>Multi-service orchestration, manual review for flagged orders</td></tr>
  <tr><td>Data Pipeline / ETL</td><td>Batch + Polling</td><td>Child workflows for chunks, heartbeating for progress</td></tr>
  <tr><td>Infrastructure Provisioning</td><td>Long-running + Polling</td><td>Activities for API calls, polling for readiness, timers</td></tr>
  <tr><td>Loan Application</td><td>Human-in-loop + Entity</td><td>Multiple approval stages, document upload signals, SLA timers</td></tr>
</table>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement the Saga pattern in Temporal, and how does it differ from a traditional saga with message queues?</div>
  <div class="qa-a">In Temporal, a saga is implemented as a workflow that maintains a stack of compensation functions. Each step is an activity call, and after successful completion, its compensation is pushed onto the stack. If any step fails, the workflow catches the error and executes compensations in reverse order. This is dramatically simpler than a message-queue-based saga, which requires a saga orchestrator service, separate message channels for each step, correlation IDs to track the saga instance, a persistent saga state store, and idempotent consumers. With Temporal, all this infrastructure is replaced by straightforward code -- the workflow IS the orchestrator, the event history IS the state store, and activities handle idempotency. The code reads like sequential business logic with a try/catch block.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Design a human-in-the-loop approval workflow with escalation using Temporal.</div>
  <div class="qa-a">The workflow starts by notifying the approver via an activity (email/Slack). It then uses condition() to wait for an approve/reject signal with a timeout (e.g., 48 hours). If the timeout expires without a decision, the workflow escalates: it sends a notification to the next-level approver and waits again with a shorter timeout. If the escalation also times out, the workflow can auto-reject, auto-approve with risk flags, or escalate further. Throughout this process, query handlers expose the current approval state, pending approver, and time remaining. The beauty of Temporal here is that these multi-day waits use zero compute resources (durable timers), the workflow state survives deployments, and the entire approval history is captured in the event log.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle batch processing of 1 million records using Temporal?</div>
  <div class="qa-a">I would use a hierarchical approach: A parent workflow downloads and partitions the data into chunks (e.g., 1000 records each), then starts child workflows for each chunk using Promise.all with concurrency limits. Each child workflow processes its chunk by calling activities for individual records or small batches. Activities use heartbeating to report progress, enabling resumability if a worker crashes. Continue-as-new is used on child workflows if they process many items. The parent aggregates results from all children and generates a summary report. This approach distributes the event history across many workflows (avoiding history limits), enables parallel processing across workers, and provides visibility into progress at both the batch and chunk level.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Compare the entity pattern with a traditional stateful service backed by a database.</div>
  <div class="qa-a">In the entity pattern, a Temporal workflow represents the entire lifecycle of a domain entity (e.g., a subscription, user account, or order). State transitions happen through signals, current state is exposed through queries, and lifecycle logic (billing cycles, renewals) is encoded in the workflow code. Compared to a traditional stateful service: (1) The state machine is explicit in code, not spread across API handlers. (2) Concurrency is handled automatically -- signals are processed sequentially. (3) Timers are durable and survive restarts. (4) Full audit trail via event history. The tradeoff is latency (~50ms per interaction vs. microseconds for a DB read) and the need for continue-as-new for very long-lived entities. The entity pattern works best for entities with complex lifecycle logic and moderate interaction rates (not sub-millisecond latency requirements).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you implement rate-limited fan-out in Temporal?</div>
  <div class="qa-a">There are several approaches: (1) Batch-based: split work into chunks of N items and process each chunk with Promise.all, waiting for one batch to complete before starting the next. (2) Worker-level: configure maxConcurrentActivityTaskExecutions on the worker to limit concurrent activities. (3) Task queue rate limiting: use the maxTaskQueueActivitiesPerSecond option on the worker to rate-limit activity dispatches from the task queue. (4) For API rate limits specifically: use a single-threaded activity on a dedicated task queue with concurrency=1 and a sleep between calls. (5) For complex scenarios: use a semaphore pattern with a dedicated "rate limiter" workflow that accepts signals and controls the pace. The right approach depends on whether the limit is per-worker, per-queue, or per-external-API.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use cron workflows vs the Schedule API?</div>
  <div class="qa-a">The Schedule API (introduced in Temporal 1.20) is the preferred approach for recurring workflows. It provides: overlap policies (skip, buffer, cancel, allow), backfill capabilities (run missed executions), pause/resume without restarting, jitter to prevent thundering herd, and better visibility in the Web UI. Cron workflows are simpler but have limitations: no overlap policy (if a run takes longer than the interval, runs pile up), no backfill, and the workflow must complete before the next cron tick or the next run is skipped. Use the Schedule API for production workloads. Cron workflows are acceptable for simple, quick-running jobs or when using older Temporal versions that don't support schedules.</div>
</div>
`
  },
  {
    id: 'temporal-scaling',
    title: 'Temporal Scaling & Production',
    category: 'Temporal',
    starterCode: `// Simulating Temporal Scaling & Production Concepts

// === Task Queue Routing ===
class TaskQueueRouter {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
  }

  registerWorker(workerName, taskQueue, capabilities) {
    if (!this.workers.has(taskQueue)) this.workers.set(taskQueue, []);
    this.workers.get(taskQueue).push({ name: workerName, capabilities, load: 0 });
    console.log('Worker "' + workerName + '" registered on queue: ' + taskQueue);
  }

  dispatch(taskQueue, task) {
    const workers = this.workers.get(taskQueue) || [];
    if (workers.length === 0) {
      console.log('[WARN] No workers for queue: ' + taskQueue);
      return;
    }
    // Pick least loaded worker
    workers.sort((a, b) => a.load - b.load);
    const worker = workers[0];
    worker.load++;
    console.log('Dispatched "' + task.type + '" to ' + worker.name + ' (load: ' + worker.load + ')');
    return worker;
  }
}

const router = new TaskQueueRouter();
router.registerWorker('worker-gpu-1', 'ml-inference', { gpu: true });
router.registerWorker('worker-gpu-2', 'ml-inference', { gpu: true });
router.registerWorker('worker-cpu-1', 'general', { gpu: false });
router.registerWorker('worker-cpu-2', 'general', { gpu: false });
router.registerWorker('worker-cpu-3', 'general', { gpu: false });

console.log('\\n--- Dispatching Tasks ---');
router.dispatch('ml-inference', { type: 'ImageClassification' });
router.dispatch('ml-inference', { type: 'TextGeneration' });
router.dispatch('general', { type: 'SendEmail' });
router.dispatch('general', { type: 'ProcessPayment' });
router.dispatch('general', { type: 'UpdateInventory' });

// === Workflow Versioning Simulation ===
console.log('\\n\\n=== Workflow Versioning (Patching) ===');

class VersionedWorkflow {
  constructor() {
    this.patches = new Map();
  }

  patched(patchId, currentVersion) {
    // Simulate Temporal's patching mechanism
    if (!this.patches.has(patchId)) {
      this.patches.set(patchId, currentVersion);
    }
    return this.patches.get(patchId) === currentVersion;
  }

  async execute(orderId) {
    console.log('Processing order:', orderId);

    // Version 1: Original logic
    // Version 2: Added fraud check
    if (this.patched('add-fraud-check', 2)) {
      console.log('[v2] Running fraud check...');
      await delay(100);
      console.log('[v2] Fraud check passed');
    } else {
      console.log('[v1] No fraud check (legacy path)');
    }

    // Version 1: Single notification
    // Version 3: Added SMS notification alongside email
    console.log('Sending email notification...');
    if (this.patched('add-sms-notification', 3)) {
      console.log('[v3] Also sending SMS notification...');
    }

    console.log('Order processed successfully');
  }
}

async function versioningDemo() {
  const legacyWf = new VersionedWorkflow();
  legacyWf.patches.set('add-fraud-check', 1);
  legacyWf.patches.set('add-sms-notification', 1);
  console.log('--- Legacy Workflow (v1) ---');
  await legacyWf.execute('ORD-OLD');

  console.log('');

  const newWf = new VersionedWorkflow();
  console.log('--- New Workflow (latest) ---');
  await newWf.execute('ORD-NEW');
}

// === Performance Metrics Simulation ===
console.log('\\n\\n=== Production Metrics Dashboard ===');

const metrics = {
  'workflow_task_schedule_to_start_latency_p99': '45ms',
  'activity_task_schedule_to_start_latency_p99': '120ms',
  'workflow_task_execution_latency_p99': '15ms',
  'sticky_cache_hit_rate': '94.2%',
  'history_size_avg_events': '142',
  'concurrent_workflow_executions': '12,453',
  'activity_poll_succeed_rate': '89.7%',
  'worker_task_slots_used': '67/100',
};

console.log('');
Object.entries(metrics).forEach(([key, value]) => {
  console.log(key.padEnd(50) + value);
});

// === Common Pitfalls ===
console.log('\\n\\n=== Common Pitfalls Detection ===');

const pitfalls = [
  { name: 'Non-determinism', check: 'Math.random() in workflow', severity: 'CRITICAL' },
  { name: 'Large payloads', check: 'Activity result > 2MB', severity: 'HIGH' },
  { name: 'History explosion', check: '> 10K events without continue-as-new', severity: 'HIGH' },
  { name: 'Missing timeouts', check: 'No startToClose on activity', severity: 'MEDIUM' },
  { name: 'Unbounded retries', check: 'maximumAttempts = 0 without scheduleToClose', severity: 'MEDIUM' },
];

pitfalls.forEach(p => {
  const icon = p.severity === 'CRITICAL' ? '[!!!]' : p.severity === 'HIGH' ? '[!!]' : '[!]';
  console.log(icon + ' ' + p.severity.padEnd(10) + p.name + ': ' + p.check);
});

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

versioningDemo();`,
    content: `
<h1>Temporal Scaling &amp; Production</h1>
<p>Running Temporal in production at scale requires understanding task queues, worker configuration, versioning strategies, monitoring, and common pitfalls. This topic covers everything an SDE3 needs to know to operate Temporal reliably.</p>

<h2>Task Queues</h2>
<p>Task queues are the mechanism for routing work to specific workers. They are dynamically created (no pre-registration needed) and are the primary tool for work isolation and routing.</p>

<pre><code>// Worker registration — each worker polls one or more task queues
const worker = await Worker.create({
  workDir: require.resolve('./workflows'),
  activities,
  taskQueue: 'order-processing',  // This worker handles order workflows
});

// Routing specific activities to specialized workers
const { classifyImage } = proxyActivities({
  taskQueue: 'gpu-workers',      // Route to GPU-equipped machines
  startToCloseTimeout: '5m',
});

const { sendEmail } = proxyActivities({
  taskQueue: 'notification-workers',
  startToCloseTimeout: '10s',
});</code></pre>

<h3>Task Queue Strategies</h3>
<table>
  <tr><th>Strategy</th><th>Description</th><th>Use Case</th></tr>
  <tr><td>Per-service</td><td>One queue per microservice</td><td>Service-level isolation and scaling</td></tr>
  <tr><td>Per-priority</td><td>Separate queues for high/low priority</td><td>Premium vs. free-tier processing</td></tr>
  <tr><td>Per-resource</td><td>Route to workers near specific resources</td><td>GPU workers, region-specific DB access</td></tr>
  <tr><td>Per-tenant</td><td>Isolate tenant workloads</td><td>Multi-tenant SaaS with isolation guarantees</td></tr>
  <tr><td>Sticky</td><td>Route workflow tasks to the same worker</td><td>Avoid replaying full history (performance)</td></tr>
</table>

<h2>Worker Scaling</h2>

<h3>Key Worker Configuration</h3>
<pre><code>const worker = await Worker.create({
  taskQueue: 'my-queue',
  workDir: require.resolve('./workflows'),
  activities,

  // Concurrency limits
  maxConcurrentActivityTaskExecutions: 100,    // Max parallel activities
  maxConcurrentWorkflowTaskExecutions: 40,     // Max parallel workflow tasks
  maxConcurrentLocalActivityExecutions: 100,   // Max parallel local activities

  // Sticky execution (workflow state caching)
  maxCachedWorkflows: 600,                     // Number of workflows cached in memory
  stickyQueueScheduleToStartTimeout: '10s',    // How long to wait for sticky worker

  // Task queue rate limiting
  maxTaskQueueActivitiesPerSecond: 50,         // Rate limit for this worker
  maxActivitiesPerSecond: 200,                 // Global rate limit (all workers)

  // Graceful shutdown
  shutdownGraceTime: '30s',                    // Time to finish in-flight tasks
});</code></pre>

<h3>Sticky Execution</h3>
<p>When a worker completes a workflow task, it caches the workflow's state in memory and registers a "sticky queue" for that workflow. The next workflow task for that workflow is preferentially dispatched to the same worker, avoiding a full history replay.</p>

<pre><code>// Without sticky execution:
// Every workflow task replays the FULL event history
// History: 10,000 events → replays all 10,000 every time

// With sticky execution:
// First task: replays full history, caches state
// Subsequent tasks: applies only NEW events since last task
// History: 10,000 events → replays only the last 5-10 new events

// Cache hit rate should be > 90% in a healthy deployment
// Monitor: temporal_sticky_cache_hit metric</code></pre>

<h3>Worker Scaling Guidelines</h3>
<table>
  <tr><th>Metric</th><th>Target</th><th>Action if Exceeded</th></tr>
  <tr><td>schedule_to_start latency (workflow tasks)</td><td>&lt; 100ms p99</td><td>Add more workers or increase maxConcurrentWorkflowTaskExecutions</td></tr>
  <tr><td>schedule_to_start latency (activity tasks)</td><td>&lt; 200ms p99</td><td>Add more workers or increase maxConcurrentActivityTaskExecutions</td></tr>
  <tr><td>Sticky cache hit rate</td><td>&gt; 90%</td><td>Increase maxCachedWorkflows, add more workers</td></tr>
  <tr><td>Task slot utilization</td><td>60-80%</td><td>&gt; 80%: scale up; &lt; 30%: scale down</td></tr>
  <tr><td>Activity poll success rate</td><td>&gt; 80%</td><td>Low rate means too many idle workers (overprovisioned)</td></tr>
</table>

<h2>Namespace Isolation</h2>
<p>Namespaces provide logical isolation within a Temporal cluster. Each namespace has its own:</p>
<ul>
  <li>Workflow executions and event histories</li>
  <li>Task queues (separate from other namespaces)</li>
  <li>Retention period (how long completed workflows are kept)</li>
  <li>Search attributes</li>
  <li>Rate limits</li>
</ul>
<pre><code>// Register a namespace
tctl namespace register --ns prod-payments \
  --retention 30d \
  --history-archival-state enabled \
  --visibility-archival-state enabled

// Common namespace strategies:
// prod-payments, prod-orders, prod-notifications  (per-domain)
// staging-all, dev-all                            (per-environment)
// tenant-acme, tenant-globex                      (per-tenant)</code></pre>

<h2>Multi-Cluster Replication (Temporal Cloud)</h2>
<p>Temporal Cloud and self-hosted Temporal support multi-cluster replication for disaster recovery:</p>
<ul>
  <li><strong>Active-passive</strong>: One cluster handles all traffic; standby replays events asynchronously</li>
  <li><strong>Active-active</strong>: Both clusters handle traffic; conflict resolution for concurrent updates</li>
  <li><strong>Namespace-level failover</strong>: Failover individual namespaces, not the entire cluster</li>
</ul>

<h2>Versioning Workflows</h2>
<p>Changing workflow code is the most operationally sensitive aspect of Temporal. Because workflows replay event history, changing the command sequence breaks running workflows.</p>

<h3>Strategy 1: Patching API (Recommended)</h3>
<pre><code>import { patched, deprecatePatch } from '@temporalio/workflow';

export async function orderWorkflow(order: Order): Promise&lt;void&gt; {
  // Original step
  await validateOrder(order);

  // Version 2: Added fraud check
  if (patched('add-fraud-check')) {
    // New workflows take this path
    await fraudCheck(order);
  }
  // Old workflows (started before this deploy) skip the fraud check

  await chargePayment(order);
  await shipOrder(order);

  // After all old workflows have completed, clean up:
  // Change patched() to deprecatePatch() to remove the branch
  // Eventually remove the if-block entirely
}</code></pre>

<h3>Strategy 2: Worker Versioning (Build ID based)</h3>
<pre><code>// Assign build IDs to workers
const worker = await Worker.create({
  taskQueue: 'orders',
  buildId: 'v2.3.1',
  useVersioning: true,
  // ...
});

// Update version sets via CLI
temporal task-queue update-build-ids add-new-default \
  --task-queue orders \
  --build-id v2.3.1

// Old workflows continue on old workers (v2.2.0)
// New workflows start on new workers (v2.3.1)</code></pre>

<h3>Strategy 3: Task Queue per Version</h3>
<pre><code>// Simple but requires client coordination
// Old client: starts workflows on 'orders-v1'
// New client: starts workflows on 'orders-v2'
// Run both worker versions simultaneously</code></pre>

<h3>Versioning Comparison</h3>
<table>
  <tr><th>Strategy</th><th>Complexity</th><th>Rollback</th><th>Best For</th></tr>
  <tr><td>Patching API</td><td>Low (in-code)</td><td>Remove patch</td><td>Small, incremental changes</td></tr>
  <tr><td>Worker Versioning</td><td>Medium (infra)</td><td>Redirect build ID</td><td>Major changes, team workflows</td></tr>
  <tr><td>Task Queue per Version</td><td>High (client changes)</td><td>Switch queue</td><td>Breaking changes, multi-team</td></tr>
</table>

<div class="warning-note"><strong>Golden Rule of Versioning</strong>: Never remove or reorder commands (activity calls, timer starts, child workflow starts) in a workflow without using the patching API or worker versioning. Adding new activities between existing ones, changing activity inputs, or modifying timer durations all constitute non-deterministic changes that break running workflows.</div>

<h2>Testing Workflows</h2>
<pre><code>import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';

describe('Order Workflow', () =&gt; {
  let env: TestWorkflowEnvironment;

  beforeAll(async () =&gt; {
    // Time-skipping test server — sleep('30 days') completes instantly
    env = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () =&gt; { await env.teardown(); });

  it('processes order end-to-end', async () =&gt; {
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('./workflows'),
      activities: {
        // Mock activities for testing
        chargePayment: async () =&gt; ({ txId: 'test-tx' }),
        shipOrder: async () =&gt; ({ trackingId: 'test-track' }),
        sendEmail: async () =&gt; {},
      },
    });

    const result = await worker.runUntil(
      env.client.workflow.execute(orderWorkflow, {
        workflowId: 'test-order-1',
        taskQueue: 'test',
        args: [testOrder],
      })
    );

    expect(result.status).toBe('completed');
    expect(result.payment.txId).toBe('test-tx');
  });

  it('handles payment failure with compensation', async () =&gt; {
    const compensated: string[] = [];
    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('./workflows'),
      activities: {
        reserveHotel: async () =&gt; ({ id: 'h1' }),
        cancelHotel: async (id) =&gt; { compensated.push('hotel:' + id); },
        chargePayment: async () =&gt; {
          throw new Error('Payment failed');
        },
      },
    });

    const result = await worker.runUntil(
      env.client.workflow.execute(travelBookingSaga, {
        workflowId: 'test-saga',
        taskQueue: 'test',
        args: [testBooking],
      })
    );

    expect(result.status).toBe('failed');
    expect(compensated).toContain('hotel:h1');
  });
});</code></pre>

<h2>Monitoring &amp; Observability</h2>

<h3>Key Metrics to Monitor</h3>
<table>
  <tr><th>Metric</th><th>What It Tells You</th><th>Alert Threshold</th></tr>
  <tr><td><code>temporal_workflow_task_schedule_to_start_latency</code></td><td>Workers are keeping up with workflow tasks</td><td>p99 &gt; 500ms</td></tr>
  <tr><td><code>temporal_activity_schedule_to_start_latency</code></td><td>Workers are keeping up with activity tasks</td><td>p99 &gt; 5s</td></tr>
  <tr><td><code>temporal_workflow_completed</code></td><td>Workflow completion rate</td><td>Sudden drop</td></tr>
  <tr><td><code>temporal_workflow_failed</code></td><td>Workflow failure rate</td><td>Spike above baseline</td></tr>
  <tr><td><code>temporal_workflow_task_execution_failed</code></td><td>Non-determinism errors</td><td>Any occurrence</td></tr>
  <tr><td><code>temporal_sticky_cache_hit</code></td><td>Sticky execution effectiveness</td><td>Below 80%</td></tr>
  <tr><td><code>temporal_worker_task_slots_available</code></td><td>Worker capacity</td><td>Near 0</td></tr>
</table>

<h3>Web UI and Visibility Queries</h3>
<pre><code>// Temporal Web UI provides:
// - List/search workflow executions
// - View event history
// - Send signals / run queries
// - View task queue pollers

// Visibility queries (Advanced Visibility with Elasticsearch)
// Find all failed order workflows in the last 24 hours
WorkflowType = 'orderWorkflow' AND ExecutionStatus = 'Failed'
  AND StartTime &gt; '2024-01-15T00:00:00Z'

// Find long-running workflows
ExecutionStatus = 'Running' AND StartTime &lt; '2024-01-01T00:00:00Z'

// Custom search attributes
OrderAmount &gt; 10000 AND Region = 'eu-west-1' AND ExecutionStatus = 'Running'</code></pre>

<h2>Performance Tuning</h2>

<h3>History Size Management</h3>
<ul>
  <li><strong>Warning threshold</strong>: 10,240 events (log warning emitted)</li>
  <li><strong>Error threshold</strong>: 51,200 events (workflow terminated)</li>
  <li><strong>Mitigation</strong>: Use continue-as-new before hitting limits</li>
  <li><strong>Reduce events</strong>: Use local activities (1 event vs 3), batch activity calls</li>
</ul>

<h3>Payload Size</h3>
<ul>
  <li><strong>Default max</strong>: 2MB per payload (activity input/result, signal data)</li>
  <li><strong>Best practice</strong>: Pass references (IDs, URLs) instead of large data</li>
  <li><strong>Compression</strong>: Use a custom payload codec for compression/encryption</li>
</ul>

<pre><code>// BAD: passing large data through Temporal
const bigData = await fetchMillionRecords(); // 500MB
await processRecords(bigData); // 500MB in event history!

// GOOD: pass references
const s3Url = await uploadToS3(fetchMillionRecords());
await processRecords(s3Url); // Only a URL in event history</code></pre>

<h2>Temporal Cloud vs Self-Hosted</h2>
<table>
  <tr><th>Aspect</th><th>Temporal Cloud</th><th>Self-Hosted</th></tr>
  <tr><td>Operations</td><td>Fully managed (zero ops)</td><td>You manage servers, DB, monitoring</td></tr>
  <tr><td>Scaling</td><td>Auto-scales</td><td>Manual scaling of all components</td></tr>
  <tr><td>SLA</td><td>99.99% uptime</td><td>Depends on your ops capability</td></tr>
  <tr><td>Multi-region</td><td>Built-in</td><td>Complex to set up</td></tr>
  <tr><td>Cost</td><td>Per-action pricing</td><td>Infrastructure + ops team cost</td></tr>
  <tr><td>Security</td><td>mTLS, encryption, SOC2</td><td>You configure everything</td></tr>
  <tr><td>Advanced Visibility</td><td>Included</td><td>Requires Elasticsearch setup</td></tr>
  <tr><td>Compliance</td><td>SOC2, HIPAA available</td><td>You certify</td></tr>
  <tr><td>Best for</td><td>Most teams, especially &lt; 50 engineers</td><td>Large orgs with dedicated platform teams</td></tr>
</table>

<h2>Common Pitfalls</h2>

<h3>1. Non-Determinism Bugs</h3>
<pre><code>// BUG: Using Date.now() in workflow
const timestamp = Date.now(); // Different on replay!
// FIX: Use workflow.now()

// BUG: Using Math.random() in workflow
const id = Math.random().toString(36); // Different on replay!
// FIX: Use workflow.uuid4()

// BUG: Iterating over object keys (unordered)
for (const key in myObject) { ... } // Order may differ
// FIX: Sort keys first or use Map with defined insertion order

// BUG: Conditional logic based on external state
if (featureFlags.isEnabled('new-flow')) { ... } // Changes between replays
// FIX: Use sideEffect() or pass feature flags as workflow input</code></pre>

<h3>2. Large Payloads</h3>
<pre><code>// BUG: Activity returns entire dataset
return await db.query('SELECT * FROM orders'); // Potentially huge!
// FIX: Return summary, store details externally
return { count: results.length, s3Key: await uploadResults(results) };</code></pre>

<h3>3. History Explosion</h3>
<pre><code>// BUG: Infinite loop without continue-as-new
while (true) {
  await sleep('1m');
  await checkStatus(); // Events grow forever!
}
// FIX: Continue-as-new periodically
let iterations = 0;
while (true) {
  await sleep('1m');
  await checkStatus();
  if (++iterations &gt; 500) await continueAsNew(state);
}</code></pre>

<h3>4. Missing Error Handling</h3>
<pre><code>// BUG: Not distinguishing retryable vs non-retryable errors
throw new Error('Card declined'); // Will be retried!
// FIX: Use ApplicationFailure
throw ApplicationFailure.nonRetryable('Card declined', 'CARD_DECLINED');</code></pre>

<h3>5. Workflow ID Collisions</h3>
<pre><code>// BUG: Using non-unique workflow IDs
await client.workflow.start(orderWf, { workflowId: 'order' }); // Collides!
// FIX: Include entity ID
await client.workflow.start(orderWf, { workflowId: 'order-' + orderId });</code></pre>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How do task queues work in Temporal and how would you use them for multi-tenant isolation?</div>
  <div class="qa-a">Task queues are named endpoints that workers poll for tasks. Workers register on one or more queues, and the Matching Service dispatches tasks from queues to available workers. For multi-tenant isolation, you can create per-tenant task queues (e.g., "orders-tenant-acme", "orders-tenant-globex") with dedicated worker pools for each tenant. This provides: resource isolation (one tenant's load spike doesn't affect others), independent scaling (scale each tenant's workers based on their volume), different hardware profiles (premium tenants on larger instances), and separate rate limits. Combined with namespace isolation for stronger boundaries, this gives you a fully isolated multi-tenant Temporal deployment.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the different workflow versioning strategies and when to use each.</div>
  <div class="qa-a">There are three main strategies: (1) Patching API -- add if(patched('change-id')) branches in workflow code; old workflows take the old path, new workflows take the new path. Best for incremental changes. (2) Worker Build ID Versioning -- assign build IDs to workers and manage version sets via the task queue API. Old workflows are routed to old-version workers, new workflows to new-version workers. Best for major changes when you want infrastructure-level routing. (3) Task queue per version -- route different workflow versions to separate task queues. Most isolated but requires client coordination. Best for breaking changes across teams. The patching API is the most commonly used approach. The key rule is: never change the sequence of commands a workflow produces for the same input without a versioning mechanism.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What metrics would you monitor for a production Temporal deployment, and what do they indicate?</div>
  <div class="qa-a">The critical metrics are: (1) schedule_to_start latency for workflow and activity tasks -- high values indicate workers cannot keep up, need scaling. (2) workflow_task_execution_failed -- any occurrence likely indicates a non-determinism bug in workflow code. (3) workflow_failed rate -- spikes indicate systematic issues (dependency failures, bugs). (4) sticky_cache_hit rate -- below 90% means excessive replay, need more memory/workers. (5) worker_task_slots_available -- near zero means workers are at capacity. (6) persistence latency -- high values indicate database issues. (7) history_size distribution -- large histories need continue-as-new. Set up alerts for anomalies in all of these, with workflow_task_execution_failed as the highest priority (P1) alert since it usually indicates a production-breaking bug.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle a production scenario where a workflow version has a bug and thousands of running workflows are affected?</div>
  <div class="qa-a">First, assess impact: use visibility queries to count affected workflows (WorkflowType and ExecutionStatus = 'Running'). If the bug causes non-determinism errors, those workflows are already stuck -- they need intervention. Steps: (1) Deploy a fix using the patching API so new workflow tasks use corrected logic while maintaining compatibility with existing event histories. (2) For stuck workflows with non-determinism errors, you may need to use the reset API to replay from a point before the buggy command. (3) For workflows in an irrecoverable state, terminate and restart them with the correct input. (4) Use batch operations (tctl batch) to reset or terminate workflows at scale. (5) Postmortem: add replay tests that catch non-determinism, and implement canary deployments for workflow worker updates.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Compare Temporal Cloud vs self-hosted for a startup vs a large enterprise.</div>
  <div class="qa-a">For a startup: Temporal Cloud is almost always the right choice. It eliminates operational overhead (no need to manage Cassandra/PostgreSQL, Elasticsearch, multiple server components), provides built-in multi-region, has per-action pricing that scales with usage, and includes advanced visibility and mTLS out of the box. The engineering team can focus entirely on business logic. For a large enterprise: It depends on the platform team's capability and compliance requirements. Self-hosted makes sense if you need complete data sovereignty, have an existing Kubernetes platform team, need custom persistence configurations, or have specific compliance requirements that Temporal Cloud cannot meet. However, many enterprises still choose Temporal Cloud because the operational burden of running Temporal at scale (managing sharded history service, tuning Cassandra, handling upgrades) is significant. The break-even point is roughly when you have a dedicated platform team of 2-3 engineers who can commit to Temporal operations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is sticky execution and how does it affect worker scaling decisions?</div>
  <div class="qa-a">Sticky execution is an optimization where, after a worker processes a workflow task, it caches the workflow's in-memory state and the Temporal server preferentially routes the next workflow task for that workflow to the same worker. This avoids replaying the full event history on every workflow task. Without sticky execution, a workflow with 10,000 events would replay all 10,000 events on every workflow task; with it, only the new events since the last task are replayed. For scaling: sticky execution means adding too many workers can actually reduce performance if it causes low cache hit rates (workflows spread across too many workers). The maxCachedWorkflows setting controls memory usage per worker. Optimal scaling balances worker count with cache hit rate -- monitor temporal_sticky_cache_hit and aim for above 90%. If scaling out reduces your cache hit rate, consider scaling up (larger workers with bigger caches) instead.</div>
</div>
`
  },
];
