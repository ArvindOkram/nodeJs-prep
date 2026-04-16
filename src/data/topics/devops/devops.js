export const devops = [
  {
    id: 'docker-fundamentals',
    title: 'Docker Fundamentals for Backend Engineers',
    category: 'Docker',
    starterCode: `// Docker Concepts Simulation — Layer Caching & Multi-Stage Builds
// ================================================================

// Simulate Docker layer caching behavior
class DockerImageBuilder {
  constructor() {
    this.layers = [];
    this.cache = new Map();
  }

  addLayer(instruction, content) {
    const hash = this.hashContent(instruction + content);
    if (this.cache.has(hash)) {
      console.log(\`  CACHED  -> \${instruction}\`);
      this.layers.push({ instruction, hash, cached: true });
    } else {
      console.log(\`  BUILD   -> \${instruction}\`);
      this.cache.set(hash, true);
      this.layers.push({ instruction, hash, cached: false });
    }
  }

  hashContent(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) & 0x7fffffff;
    }
    return h.toString(16);
  }

  getSize() {
    return this.layers.filter(l => !l.cached).length;
  }
}

// === Build 1: Initial build (no cache) ===
console.log('=== Build 1: Initial Build (no cache) ===');
const builder = new DockerImageBuilder();
builder.addLayer('FROM node:20-alpine', 'base-image');
builder.addLayer('WORKDIR /app', 'workdir');
builder.addLayer('COPY package*.json ./', 'package-lock-v1');
builder.addLayer('RUN npm ci --production', 'deps-v1');
builder.addLayer('COPY . .', 'source-code-v1');
builder.addLayer('RUN npm run build', 'build-v1');
console.log(\`Layers built from scratch: \${builder.getSize()}\`);

// === Build 2: Only source code changed (deps same) ===
console.log('\\n=== Build 2: Source Code Changed (deps unchanged) ===');
builder.addLayer('FROM node:20-alpine', 'base-image');
builder.addLayer('WORKDIR /app', 'workdir');
builder.addLayer('COPY package*.json ./', 'package-lock-v1');  // same
builder.addLayer('RUN npm ci --production', 'deps-v1');         // cached!
builder.addLayer('COPY . .', 'source-code-v2');                 // changed
builder.addLayer('RUN npm run build', 'build-v2');
const rebuilt = builder.layers.filter(l => !l.cached).length;
console.log(\`Only \${rebuilt - builder.getSize()} layers needed rebuild\`);

// === Multi-stage build size comparison ===
console.log('\\n=== Multi-Stage Build Comparison ===');

const singleStage = {
  baseImage: 950,    // node:20 full
  devDeps: 200,      // typescript, eslint, etc.
  prodDeps: 50,
  buildArtifacts: 30,
  sourceCode: 10,
  total: 0,
};
singleStage.total = Object.values(singleStage).reduce((a, b) => a + b, 0);

const multiStage = {
  baseImage: 180,    // node:20-alpine
  prodDeps: 50,
  buildArtifacts: 30,
  total: 0,
};
multiStage.total = Object.values(multiStage).reduce((a, b) => a + b, 0);

console.log(\`Single-stage image: ~\${singleStage.total}MB\`);
console.log(\`Multi-stage image:  ~\${multiStage.total}MB\`);
console.log(\`Size reduction:     \${((1 - multiStage.total / singleStage.total) * 100).toFixed(0)}%\`);

// === Docker Compose service dependency simulation ===
console.log('\\n=== Docker Compose Service Startup Order ===');
const services = [
  { name: 'postgres', dependsOn: [], startTime: 3000 },
  { name: 'redis', dependsOn: [], startTime: 1000 },
  { name: 'kafka', dependsOn: [], startTime: 5000 },
  { name: 'app', dependsOn: ['postgres', 'redis', 'kafka'], startTime: 2000 },
];

function resolveStartupOrder(services) {
  const resolved = [];
  const seen = new Set();
  function resolve(name) {
    if (seen.has(name)) return;
    const svc = services.find(s => s.name === name);
    svc.dependsOn.forEach(dep => resolve(dep));
    seen.add(name);
    resolved.push(name);
  }
  services.forEach(s => resolve(s.name));
  return resolved;
}

const order = resolveStartupOrder(services);
console.log('Startup order:', order.join(' -> '));
console.log('Total startup time (sequential):', services.reduce((a, s) => a + s.startTime, 0) + 'ms');
const parallelTime = Math.max(...services.filter(s => s.dependsOn.length === 0).map(s => s.startTime));
console.log('Parallel infra startup:', parallelTime + 'ms + app 2000ms = ' + (parallelTime + 2000) + 'ms');`,
    content: `
<h1>Docker Fundamentals for Backend Engineers</h1>
<p>Docker is the foundation of modern backend deployment. As an SDE-2/SDE-3, you're expected to not just use Docker, but to <strong>optimize images, design multi-service architectures, and debug container networking issues</strong>. This section covers everything from basics to production-grade practices.</p>

<h2>Core Concepts</h2>
<pre><code>┌──────────────────────────────────────────────────┐
│                  Docker Engine                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Container A │  │ Container B │  │ Container C │  │
│  │  (Node.js)  │  │ (Postgres)  │  │  (Redis)    │  │
│  │  PID 1: node│  │ PID 1: pg   │  │ PID 1: redis│  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │
│        │               │               │          │
│  ┌─────┴───────────────┴───────────────┴──────┐   │
│  │          Docker Network (bridge)            │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │         Host Kernel (shared)                │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘</code></pre>

<ul>
  <li><strong>Image</strong> — Immutable, layered filesystem template. Built from a Dockerfile.</li>
  <li><strong>Container</strong> — Running instance of an image with its own PID namespace, network, and filesystem.</li>
  <li><strong>Layer</strong> — Each Dockerfile instruction creates a read-only layer. Layers are cached and shared across images.</li>
  <li><strong>Registry</strong> — Image storage (Docker Hub, ECR, GCR). Push/pull images here.</li>
</ul>

<h2>Multi-Stage Builds for Node.js</h2>
<p>Multi-stage builds are <strong>critical</strong> for production Node.js images. They let you use a full Node image for building but ship only the runtime.</p>
<pre><code># Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 appgroup &amp;&amp; \\
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]</code></pre>

<h2>Docker Compose for Local Development</h2>
<p>A typical Node.js backend stack with PostgreSQL, Redis, and Kafka:</p>
<pre><code>version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app              # bind mount for hot-reload
      - /app/node_modules   # anonymous volume to preserve
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379

  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data    # named volume
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_KRAFT_MODE: "true"

volumes:
  pgdata:      # named volume — persists across restarts</code></pre>

<h2>Docker Networking</h2>
<table>
  <tr><th>Network Mode</th><th>Description</th><th>Use Case</th></tr>
  <tr><td><strong>bridge</strong> (default)</td><td>Isolated network, containers communicate by service name</td><td>Local dev, Docker Compose</td></tr>
  <tr><td><strong>host</strong></td><td>Container shares host network stack directly</td><td>Performance-critical, no port mapping needed</td></tr>
  <tr><td><strong>overlay</strong></td><td>Multi-host networking across Docker Swarm nodes</td><td>Swarm/multi-host orchestration</td></tr>
  <tr><td><strong>none</strong></td><td>No network access</td><td>Security-isolated batch jobs</td></tr>
</table>

<h2>Docker Volumes</h2>
<table>
  <tr><th>Type</th><th>Syntax</th><th>Persistence</th><th>Use Case</th></tr>
  <tr><td><strong>Named Volume</strong></td><td><code>pgdata:/var/lib/pg/data</code></td><td>Survives container removal</td><td>Database data, persistent state</td></tr>
  <tr><td><strong>Bind Mount</strong></td><td><code>./src:/app/src</code></td><td>Host filesystem</td><td>Development hot-reload</td></tr>
  <tr><td><strong>tmpfs</strong></td><td><code>tmpfs: /tmp</code></td><td>In-memory only</td><td>Secrets, temp files</td></tr>
</table>

<h2>Best Practices for Node.js Dockerfiles</h2>
<ol>
  <li><strong>Use alpine/slim base images</strong> — <code>node:20-alpine</code> is ~180MB vs ~950MB for <code>node:20</code></li>
  <li><strong>Run as non-root user</strong> — <code>USER appuser</code> after creating the user</li>
  <li><strong>Use .dockerignore</strong> — Exclude <code>node_modules</code>, <code>.git</code>, <code>.env</code>, <code>dist</code></li>
  <li><strong>Layer caching</strong> — COPY <code>package*.json</code> and run <code>npm ci</code> BEFORE copying source code</li>
  <li><strong>Health checks</strong> — Add <code>HEALTHCHECK</code> for orchestrator readiness</li>
  <li><strong>Use npm ci</strong> — Deterministic installs from lockfile, faster than <code>npm install</code></li>
  <li><strong>Pin versions</strong> — <code>node:20.11.0-alpine</code> not <code>node:latest</code></li>
  <li><strong>Minimize layers</strong> — Chain RUN commands with <code>&amp;&amp;</code></li>
</ol>

<h2>Docker Security Basics</h2>
<ul>
  <li>Never run containers as root in production</li>
  <li>Scan images for vulnerabilities: <code>docker scout cves</code>, Trivy, Snyk</li>
  <li>Use read-only filesystem where possible: <code>--read-only</code></li>
  <li>Don't store secrets in images — use Docker secrets or env injection at runtime</li>
  <li>Keep base images updated to patch CVEs</li>
</ul>

<div class="warning-note"><strong>Interview Tip:</strong> When asked about Docker optimization, always mention multi-stage builds, layer caching order, alpine images, and non-root users. These are the top 4 things interviewers look for.</div>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you optimize a Docker image for production?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I follow a multi-layered optimization approach:
    <ol>
      <li><strong>Multi-stage builds</strong> — Build in a full image, copy only artifacts to a slim runtime image</li>
      <li><strong>Alpine base</strong> — Use <code>node:20-alpine</code> (~180MB vs ~950MB)</li>
      <li><strong>Layer caching</strong> — Copy <code>package*.json</code> first, then <code>npm ci --production</code>, then source code. This way dependency installation is cached when only code changes</li>
      <li><strong>Production deps only</strong> — <code>npm ci --production</code> or prune devDependencies</li>
      <li><strong>Non-root user</strong> — Create and switch to a non-root user</li>
      <li><strong>.dockerignore</strong> — Exclude <code>node_modules</code>, <code>.git</code>, test files</li>
    </ol>
    This typically reduces image size from ~1.2GB to ~200MB and improves security.
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain Docker layer caching and how it affects build time.</div>
  <div class="qa-a">
    <strong>Answer:</strong> Each Dockerfile instruction creates a layer. Docker caches layers and reuses them if the instruction and its context haven't changed. <strong>Critically, if any layer changes, all subsequent layers are invalidated.</strong>
    <br><br>
    This is why we copy <code>package*.json</code> and install dependencies BEFORE copying source code. If only application code changes, the expensive <code>npm ci</code> layer stays cached. A bad Dockerfile that does <code>COPY . .</code> before <code>npm install</code> rebuilds dependencies on every code change, turning a 5-second build into a 60-second build.
    <br><br>
    Layer ordering matters: put least-frequently-changing layers first (base image, system deps, npm deps) and most-frequently-changing layers last (source code, build step).
  </div>
</div>
`
  },
  {
    id: 'container-orchestration',
    title: 'Container Orchestration: ECS & Kubernetes',
    category: 'Docker',
    starterCode: `// Container Orchestration Concepts — Simulating ECS & K8s Patterns
// ================================================================

// Simulate a container orchestrator (simplified ECS/K8s)
class Orchestrator {
  constructor(name) {
    this.name = name;
    this.services = new Map();
    this.instances = [];
    console.log(\`[\${name}] Orchestrator initialized\`);
  }

  registerService(name, config) {
    this.services.set(name, {
      ...config,
      running: [],
      desired: config.replicas,
    });
    console.log(\`[\${this.name}] Service "\${name}" registered (desired: \${config.replicas} replicas)\`);
  }

  reconcile() {
    console.log(\`\\n[\${this.name}] === Reconciliation Loop ===\`);
    for (const [name, svc] of this.services) {
      const running = svc.running.length;
      const desired = svc.desired;
      if (running < desired) {
        const toStart = desired - running;
        console.log(\`  \${name}: \${running}/\${desired} running -> starting \${toStart} instances\`);
        for (let i = 0; i < toStart; i++) {
          const id = name + '-' + (running + i);
          svc.running.push({ id, status: 'running', health: 'healthy', cpu: Math.random() * 100 | 0 });
        }
      } else if (running > desired) {
        const toStop = running - desired;
        console.log(\`  \${name}: \${running}/\${desired} running -> stopping \${toStop} instances\`);
        svc.running.splice(0, toStop);
      } else {
        console.log(\`  \${name}: \${running}/\${desired} running -> OK\`);
      }
    }
  }

  scale(serviceName, replicas) {
    const svc = this.services.get(serviceName);
    console.log(\`\\n[\${this.name}] Scaling "\${serviceName}" from \${svc.desired} to \${replicas}\`);
    svc.desired = replicas;
    this.reconcile();
  }

  rollingUpdate(serviceName) {
    const svc = this.services.get(serviceName);
    console.log(\`\\n[\${this.name}] Rolling update for "\${serviceName}"\`);
    const total = svc.running.length;
    for (let i = 0; i < total; i++) {
      const old = svc.running[i];
      console.log(\`  Step \${i + 1}: Draining \${old.id} -> Starting \${serviceName}-v2-\${i}\`);
      svc.running[i] = { id: serviceName + '-v2-' + i, status: 'running', health: 'healthy', cpu: 0 };
    }
    console.log(\`  Rolling update complete: \${total} instances replaced with zero downtime\`);
  }

  healthCheck() {
    console.log(\`\\n[\${this.name}] === Health Check ===\`);
    for (const [name, svc] of this.services) {
      const healthy = svc.running.filter(i => i.health === 'healthy').length;
      const total = svc.running.length;
      console.log(\`  \${name}: \${healthy}/\${total} healthy\`);
    }
  }

  simulateAutoScale(serviceName, metric, threshold) {
    const svc = this.services.get(serviceName);
    const avgCpu = svc.running.reduce((a, i) => a + i.cpu, 0) / svc.running.length;
    console.log(\`\\n[\${this.name}] AutoScale check for "\${serviceName}"\`);
    console.log(\`  Avg CPU: \${avgCpu.toFixed(0)}%, Threshold: \${threshold}%\`);
    if (avgCpu > threshold) {
      const newDesired = Math.min(svc.desired + 2, 10);
      console.log(\`  CPU above threshold! Scaling from \${svc.desired} to \${newDesired}\`);
      this.scale(serviceName, newDesired);
    } else {
      console.log(\`  CPU within limits, no scaling needed\`);
    }
  }
}

// --- Demo: ECS-like orchestration ---
const ecs = new Orchestrator('ECS');
ecs.registerService('api-server', { replicas: 3, cpu: 256, memory: 512 });
ecs.registerService('worker', { replicas: 2, cpu: 512, memory: 1024 });

ecs.reconcile();
ecs.healthCheck();

// Simulate scaling event
ecs.scale('api-server', 5);
ecs.healthCheck();

// Simulate rolling update
ecs.rollingUpdate('api-server');

// Simulate auto-scaling
ecs.simulateAutoScale('worker', 'cpu', 50);`,
    content: `
<h1>Container Orchestration: ECS &amp; Kubernetes</h1>
<p>Once you're running Docker in production, you need <strong>orchestration</strong> — automated deployment, scaling, health management, and networking of containers. For SDE-2/SDE-3 interviews, you need to understand both AWS ECS (commonly used) and Kubernetes (industry standard).</p>

<h2>Why Orchestration Matters</h2>
<pre><code>Without Orchestration:              With Orchestration:
┌──────────────────────┐           ┌──────────────────────────┐
│ Manual SSH into box   │           │ Declarative config       │
│ docker run ...        │           │ "I want 5 replicas"      │
│ Manual health checks  │           │ Auto-healing             │
│ Manual scaling        │           │ Auto-scaling             │
│ No rolling updates    │           │ Zero-downtime deploys    │
│ Single point of fail  │           │ Multi-AZ, self-healing   │
└──────────────────────┘           └──────────────────────────┘</code></pre>

<h2>AWS ECS (Elastic Container Service)</h2>
<p>ECS is AWS's native container orchestration service. Key concepts:</p>
<ul>
  <li><strong>Task Definition</strong> — Blueprint: image, CPU/memory, ports, env vars, IAM role. Like a Dockerfile for orchestration.</li>
  <li><strong>Task</strong> — A running instance of a task definition (one or more containers).</li>
  <li><strong>Service</strong> — Maintains desired count of tasks, handles load balancing and rolling updates.</li>
  <li><strong>Cluster</strong> — Logical grouping of tasks/services.</li>
</ul>

<h3>Fargate vs EC2 Launch Type</h3>
<table>
  <tr><th>Aspect</th><th>Fargate</th><th>EC2</th></tr>
  <tr><td><strong>Infrastructure</strong></td><td>Serverless — AWS manages hosts</td><td>You manage EC2 instances</td></tr>
  <tr><td><strong>Pricing</strong></td><td>Per vCPU/memory per second</td><td>Pay for EC2 instances (even if idle)</td></tr>
  <tr><td><strong>Scaling</strong></td><td>Instant (no host provisioning)</td><td>Need to scale ASG + tasks</td></tr>
  <tr><td><strong>Control</strong></td><td>Less (no SSH, no host access)</td><td>Full host access, GPU support</td></tr>
  <tr><td><strong>Best For</strong></td><td>Most workloads, microservices</td><td>GPU, large batch, cost optimization</td></tr>
</table>

<h2>Kubernetes Basics</h2>
<pre><code>┌─────────────────── K8s Cluster ───────────────────┐
│  Control Plane                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │API Server│ │Scheduler │ │Controller│           │
│  └──────────┘ └──────────┘ │ Manager  │           │
│                             └──────────┘           │
│  Worker Nodes                                       │
│  ┌─────────────────┐  ┌─────────────────┐         │
│  │ Node 1           │  │ Node 2           │         │
│  │ ┌─────┐ ┌─────┐ │  │ ┌─────┐ ┌─────┐ │         │
│  │ │Pod A│ │Pod B│ │  │ │Pod C│ │Pod D│ │         │
│  │ └─────┘ └─────┘ │  │ └─────┘ └─────┘ │         │
│  │    kubelet       │  │    kubelet       │         │
│  └─────────────────┘  └─────────────────┘         │
└────────────────────────────────────────────────────┘</code></pre>
<ul>
  <li><strong>Pod</strong> — Smallest deployable unit. One or more containers sharing network/storage.</li>
  <li><strong>Deployment</strong> — Manages ReplicaSets, handles rolling updates and rollbacks.</li>
  <li><strong>Service</strong> — Stable network endpoint for a set of pods (ClusterIP, NodePort, LoadBalancer).</li>
  <li><strong>Ingress</strong> — HTTP routing, SSL termination, path-based routing.</li>
</ul>

<h2>ECS vs EKS vs Fargate</h2>
<table>
  <tr><th>Feature</th><th>ECS + Fargate</th><th>ECS + EC2</th><th>EKS</th></tr>
  <tr><td>Complexity</td><td>Low</td><td>Medium</td><td>High</td></tr>
  <tr><td>Portability</td><td>AWS only</td><td>AWS only</td><td>Multi-cloud (K8s)</td></tr>
  <tr><td>Ecosystem</td><td>AWS native</td><td>AWS native</td><td>Huge K8s ecosystem</td></tr>
  <tr><td>Cost (small)</td><td>Higher per unit</td><td>Lower (reserved)</td><td>Higher (control plane fee)</td></tr>
  <tr><td>Learning Curve</td><td>Easy</td><td>Medium</td><td>Steep</td></tr>
  <tr><td>Best For</td><td>Startups, small teams</td><td>Cost-sensitive at scale</td><td>Large orgs, multi-cloud</td></tr>
</table>

<h2>Auto-Scaling Strategies</h2>
<ul>
  <li><strong>Target Tracking</strong> — Maintain a target metric value (e.g., average CPU at 60%). Simplest and most common.</li>
  <li><strong>Step Scaling</strong> — Add/remove specific number of tasks based on metric thresholds (e.g., if CPU &gt; 80%, add 3 tasks).</li>
  <li><strong>Scheduled Scaling</strong> — Scale at specific times (e.g., scale up before peak hours).</li>
</ul>

<h2>Rolling Updates &amp; Blue/Green Deployments</h2>
<pre><code>Rolling Update:
  Time 0: [v1] [v1] [v1] [v1]
  Time 1: [v2] [v1] [v1] [v1]   ← replace one at a time
  Time 2: [v2] [v2] [v1] [v1]
  Time 3: [v2] [v2] [v2] [v1]
  Time 4: [v2] [v2] [v2] [v2]

Blue/Green Deployment:
  ┌─────────┐     ┌─────────┐
  │ Blue    │ ALB │ Green   │
  │ (v1)    │────▶│ (v2)    │  ← ALB switches all traffic instantly
  │ running │     │ tested  │
  └─────────┘     └─────────┘</code></pre>

<h2>Health Checks: Liveness, Readiness, Startup</h2>
<table>
  <tr><th>Probe</th><th>Purpose</th><th>Failure Action</th></tr>
  <tr><td><strong>Liveness</strong></td><td>Is the container alive?</td><td>Restart container</td></tr>
  <tr><td><strong>Readiness</strong></td><td>Can it accept traffic?</td><td>Remove from load balancer</td></tr>
  <tr><td><strong>Startup</strong></td><td>Has it finished initializing?</td><td>Don't check liveness yet</td></tr>
</table>

<div class="warning-note"><strong>Key Insight:</strong> A common mistake is using only liveness probes. If your Node.js app takes 30 seconds to warm up caches, without a startup probe, the liveness check kills it before it's ready.</div>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: When would you use ECS Fargate vs EKS?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I'd use <strong>ECS Fargate</strong> when the team is small, fully on AWS, and wants minimal operational overhead. Fargate is serverless — no EC2 instances to manage, patch, or scale. It's ideal for microservices, APIs, and event-driven workloads.
    <br><br>
    I'd choose <strong>EKS</strong> when: (1) multi-cloud portability is needed, (2) the team has Kubernetes expertise, (3) we need the rich K8s ecosystem (Helm, Istio, ArgoCD), or (4) we're running complex stateful workloads.
    <br><br>
    At Habuild, for example, ECS Fargate would be the right choice — we're AWS-native, and the simplicity lets a small team move fast without a dedicated platform team.
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle zero-downtime deployments?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I use a combination of strategies:
    <ol>
      <li><strong>Rolling updates</strong> with <code>minimumHealthyPercent: 100</code> and <code>maximumPercent: 200</code> — ECS launches new tasks before draining old ones</li>
      <li><strong>Health checks</strong> — ALB health checks ensure new tasks are healthy before receiving traffic</li>
      <li><strong>Connection draining</strong> — Set deregistration delay (e.g., 30s) so in-flight requests complete</li>
      <li><strong>Graceful shutdown</strong> — Handle SIGTERM in Node.js: stop accepting new requests, finish ongoing ones, close DB connections, then exit</li>
      <li><strong>Database migrations</strong> — Run as a separate task before deployment, ensure backward compatibility</li>
    </ol>
    For critical services, I prefer <strong>blue/green deployments</strong> — run the new version alongside the old, validate with smoke tests, then switch the ALB target group. Instant rollback if something fails.
  </div>
</div>
`
  },
  {
    id: 'cicd-strategies',
    title: 'CI/CD & Deployment Strategies',
    category: 'CI/CD',
    starterCode: `// CI/CD Pipeline Simulation & Deployment Strategies
// =================================================

// Simulate a CI/CD pipeline
class Pipeline {
  constructor(name) {
    this.name = name;
    this.stages = [];
    this.status = 'pending';
    this.startTime = Date.now();
  }

  addStage(name, fn) {
    this.stages.push({ name, fn, status: 'pending', duration: 0 });
    return this;
  }

  async run() {
    console.log(\`\\n=== Pipeline: \${this.name} ===\`);
    this.status = 'running';

    for (const stage of this.stages) {
      const start = Date.now();
      console.log(\`  ▶ \${stage.name}...\`);
      try {
        const result = stage.fn();
        stage.status = 'passed';
        stage.duration = Date.now() - start;
        console.log(\`  ✓ \${stage.name} passed (\${stage.duration}ms)\`);
        if (result) console.log(\`    \${result}\`);
      } catch (err) {
        stage.status = 'failed';
        stage.duration = Date.now() - start;
        console.log(\`  ✗ \${stage.name} FAILED: \${err.message}\`);
        this.status = 'failed';
        return this;
      }
    }
    this.status = 'passed';
    const totalTime = Date.now() - this.startTime;
    console.log(\`\\n=== Pipeline \${this.status.toUpperCase()} (total: \${totalTime}ms) ===\`);
    return this;
  }
}

// Simulate pipeline stages
const lint = () => {
  const files = ['src/app.js', 'src/routes.js', 'src/models.js'];
  return \`Linted \${files.length} files — 0 errors, 2 warnings\`;
};

const test = () => {
  const results = { total: 142, passed: 142, failed: 0, coverage: 87.3 };
  if (results.failed > 0) throw new Error(\`\${results.failed} tests failed\`);
  return \`\${results.passed}/\${results.total} tests passed, coverage: \${results.coverage}%\`;
};

const build = () => {
  return 'Docker image built: api-server:a1b2c3d (245MB)';
};

const securityScan = () => {
  const vulns = { critical: 0, high: 0, medium: 2, low: 5 };
  if (vulns.critical > 0) throw new Error(\`\${vulns.critical} critical vulnerabilities found\`);
  return \`Scan complete: \${vulns.medium} medium, \${vulns.low} low vulnerabilities\`;
};

const deploy = () => {
  return 'Deployed to staging: https://staging.api.example.com';
};

// Run the pipeline
const pipeline = new Pipeline('main-branch-deploy');
pipeline
  .addStage('Lint', lint)
  .addStage('Unit Tests', test)
  .addStage('Security Scan', securityScan)
  .addStage('Build Docker Image', build)
  .addStage('Deploy to Staging', deploy)
  .run();

// === Deployment Strategy Comparison ===
console.log('\\n=== Deployment Strategy Simulation ===');

function simulateRollingUpdate(instances, newVersion) {
  console.log('\\nRolling Update:');
  const state = [...instances];
  for (let i = 0; i < state.length; i++) {
    state[i] = newVersion;
    console.log(\`  Step \${i + 1}: [\${state.join(', ')}]\`);
  }
}

function simulateBlueGreen(instances, newVersion) {
  console.log('\\nBlue/Green Deployment:');
  console.log(\`  Blue (current):  [\${instances.join(', ')}]\`);
  const green = instances.map(() => newVersion);
  console.log(\`  Green (new):     [\${green.join(', ')}]\`);
  console.log('  Health check on Green... OK');
  console.log(\`  Switch traffic -> Green: [\${green.join(', ')}]\`);
  console.log('  Blue kept as rollback for 30 min');
}

function simulateCanary(instances, newVersion) {
  console.log('\\nCanary Deployment:');
  const state = [...instances];
  state[0] = newVersion + ' (canary)';
  console.log(\`  Step 1 (10% traffic): [\${state.join(', ')}]\`);
  console.log('  Monitoring canary for 5 min... Error rate 0.1% (OK)');
  state[1] = newVersion;
  console.log(\`  Step 2 (50% traffic): [\${state.join(', ')}]\`);
  console.log('  Monitoring... Latency p99 within SLO (OK)');
  for (let i = 2; i < state.length; i++) state[i] = newVersion;
  console.log(\`  Step 3 (100% traffic): [\${state.join(', ')}]\`);
}

const current = ['v1.2', 'v1.2', 'v1.2', 'v1.2'];
simulateRollingUpdate([...current], 'v1.3');
simulateBlueGreen([...current], 'v1.3');
simulateCanary([...current], 'v1.3');`,
    content: `
<h1>CI/CD &amp; Deployment Strategies</h1>
<p>CI/CD is the backbone of modern software delivery. As an SDE-2/SDE-3, you're expected to <strong>design pipelines, choose deployment strategies, and handle rollback scenarios</strong>. This goes beyond writing YAML — it's about understanding trade-offs and risk management.</p>

<h2>CI vs CD vs CD</h2>
<table>
  <tr><th>Term</th><th>Full Name</th><th>What It Does</th></tr>
  <tr><td><strong>CI</strong></td><td>Continuous Integration</td><td>Merge code frequently, run automated tests on every push</td></tr>
  <tr><td><strong>CD</strong></td><td>Continuous Delivery</td><td>Code is always in a deployable state, manual approval to deploy</td></tr>
  <tr><td><strong>CD</strong></td><td>Continuous Deployment</td><td>Every commit that passes tests is automatically deployed to production</td></tr>
</table>

<h2>GitHub Actions Workflow</h2>
<p>A production-grade pipeline for a Node.js service:</p>
<pre><code>name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build-and-push:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ secrets.AWS_ROLE_ARN }}
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          docker build -t $ECR_REPO:\${{ github.sha }} .
          docker push $ECR_REPO:\${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service \\
            --cluster staging \\
            --service api-server \\
            --force-new-deployment

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.example.com
    steps:
      - name: Deploy to ECS Production
        run: |
          aws ecs update-service \\
            --cluster production \\
            --service api-server \\
            --force-new-deployment</code></pre>

<h2>Pipeline Stages</h2>
<pre><code>┌───────┐   ┌──────┐   ┌────────────┐   ┌───────┐   ┌─────────┐   ┌────────┐
│ Lint  │──▶│ Test │──▶│ Security   │──▶│ Build │──▶│ Deploy  │──▶│ Deploy │
│       │   │      │   │ Scan       │   │ Image │   │ Staging │   │ Prod   │
└───────┘   └──────┘   └────────────┘   └───────┘   └─────────┘   └────────┘
  ESLint     Jest/       Trivy/Snyk      Docker      Auto          Manual
  Prettier   Vitest                       Push       deploy        approval</code></pre>

<h2>Deployment Strategies Comparison</h2>
<table>
  <tr><th>Strategy</th><th>Downtime</th><th>Rollback Speed</th><th>Risk</th><th>Cost</th><th>Best For</th></tr>
  <tr><td><strong>Rolling Update</strong></td><td>Zero</td><td>Slow (re-deploy)</td><td>Medium</td><td>Low</td><td>Standard deployments</td></tr>
  <tr><td><strong>Blue/Green</strong></td><td>Zero</td><td>Instant (switch back)</td><td>Low</td><td>High (2x infra)</td><td>Critical services</td></tr>
  <tr><td><strong>Canary</strong></td><td>Zero</td><td>Fast (route away)</td><td>Lowest</td><td>Medium</td><td>High-traffic services</td></tr>
  <tr><td><strong>A/B Testing</strong></td><td>Zero</td><td>Fast</td><td>Low</td><td>Medium</td><td>Feature experimentation</td></tr>
  <tr><td><strong>Feature Flags</strong></td><td>Zero</td><td>Instant (toggle off)</td><td>Lowest</td><td>Low</td><td>Gradual rollouts</td></tr>
</table>

<h2>Rollback Strategies</h2>
<ul>
  <li><strong>Instant rollback (Blue/Green)</strong> — Switch ALB back to the old target group. Takes seconds.</li>
  <li><strong>Re-deploy previous version</strong> — Point ECS task definition back to the previous image tag.</li>
  <li><strong>Feature flag toggle</strong> — Disable the feature remotely without deploying. Fastest possible.</li>
  <li><strong>Database rollback challenge</strong> — Schema migrations are hard to rollback. Use <strong>expand-contract pattern</strong>: add new columns first, migrate data, then remove old columns in a later release.</li>
</ul>

<h2>GitFlow vs Trunk-Based Development</h2>
<table>
  <tr><th>Aspect</th><th>GitFlow</th><th>Trunk-Based</th></tr>
  <tr><td>Branch lifetime</td><td>Long-lived feature branches</td><td>Short-lived (&lt;1 day) branches</td></tr>
  <tr><td>Merge frequency</td><td>Periodic (end of sprint)</td><td>Multiple times per day</td></tr>
  <tr><td>Conflict risk</td><td>High (long branches diverge)</td><td>Low (frequent merges)</td></tr>
  <tr><td>Release process</td><td>Release branches, hotfix branches</td><td>Every commit is releasable</td></tr>
  <tr><td>CI/CD fit</td><td>Harder (many branches)</td><td>Natural fit</td></tr>
  <tr><td>Best for</td><td>Versioned software, mobile apps</td><td>SaaS, web services, microservices</td></tr>
</table>

<h2>Infrastructure as Code</h2>
<ul>
  <li><strong>Terraform</strong> — Multi-cloud IaC. Declarative HCL syntax. State management with S3 + DynamoDB locking.</li>
  <li><strong>CloudFormation</strong> — AWS-native IaC. YAML/JSON templates. Free, tightly integrated.</li>
  <li><strong>CDK (AWS)</strong> — Write infrastructure in TypeScript/Python. Generates CloudFormation under the hood.</li>
</ul>

<div class="warning-note"><strong>Interview Insight:</strong> Interviewers at SDE-2/SDE-3 level care more about deployment strategy trade-offs than YAML syntax. Know WHEN to use canary vs blue/green, and always discuss rollback plans.</div>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement a canary deployment?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I'd implement canary deployments in stages:
    <ol>
      <li><strong>Deploy canary</strong> — Deploy the new version to a small subset (e.g., 1 out of 10 tasks)</li>
      <li><strong>Weighted routing</strong> — Use ALB weighted target groups or Route 53 weighted routing to send 5-10% of traffic to the canary</li>
      <li><strong>Monitor key metrics</strong> — Watch error rate, latency p99, and business metrics for 5-15 minutes</li>
      <li><strong>Automated rollback</strong> — If error rate exceeds threshold, CloudWatch alarm triggers automatic rollback</li>
      <li><strong>Progressive promotion</strong> — If metrics are healthy, increase traffic: 10% → 25% → 50% → 100%</li>
    </ol>
    On AWS ECS, I'd use CodeDeploy with the <code>CodeDeployDefault.ECSCanary10Percent5Minutes</code> config — it routes 10% of traffic to the new version for 5 minutes before completing the deployment.
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle database migrations during blue/green deployments?</div>
  <div class="qa-a">
    <strong>Answer:</strong> This is one of the hardest parts of blue/green. The key principle is <strong>backward-compatible migrations</strong>:
    <ol>
      <li><strong>Expand phase</strong> — Add new columns/tables without removing old ones. Both v1 (blue) and v2 (green) can work with the schema.</li>
      <li><strong>Migrate</strong> — Deploy green (v2) which writes to both old and new columns. Backfill existing data.</li>
      <li><strong>Contract phase</strong> — Once blue is decommissioned, a LATER deployment removes the old columns.</li>
    </ol>
    Never rename or delete columns in the same deploy as a blue/green switch. If the green deployment fails and you rollback to blue, it would break because the old code expects the old schema.
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens when a deployment fails? Describe your rollback process.</div>
  <div class="qa-a">
    <strong>Answer:</strong> My rollback process has both automated and manual layers:
    <br><br>
    <strong>Automated:</strong> ECS deployment circuit breaker is enabled — if new tasks fail health checks repeatedly, ECS automatically rolls back to the last stable task definition. CloudWatch alarms on error rate &gt; 5% trigger SNS notifications.
    <br><br>
    <strong>Manual process:</strong> (1) Identify the issue from logs/traces in Grafana/DataDog, (2) If it's code-related, re-deploy the previous Docker image tag — it's immutable in ECR, (3) If it's config-related, update the parameter store and force new deployment, (4) If it's a database migration issue, this is harder — we may need to deploy a hotfix that handles both old and new schema.
    <br><br>
    <strong>Prevention:</strong> Feature flags (LaunchDarkly/Unleash) let us disable new features without rolling back the deployment. This is the fastest "rollback" — milliseconds, no deployment needed.
  </div>
</div>
`
  },
  {
    id: 'observability-slos',
    title: 'SLOs, SLIs & SLAs',
    category: 'Observability',
    starterCode: `// SLO, SLI & Error Budget Calculator
// ===================================

class SLOTracker {
  constructor(serviceName, sloTarget) {
    this.serviceName = serviceName;
    this.sloTarget = sloTarget; // e.g., 99.9
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.latencies = [];
  }

  recordRequest(success, latencyMs) {
    this.totalRequests++;
    if (success) this.successfulRequests++;
    this.latencies.push(latencyMs);
  }

  getAvailability() {
    return (this.successfulRequests / this.totalRequests) * 100;
  }

  getErrorBudget() {
    const allowedFailureRate = (100 - this.sloTarget) / 100;
    const totalAllowedFailures = Math.floor(this.totalRequests * allowedFailureRate);
    const actualFailures = this.totalRequests - this.successfulRequests;
    const remaining = totalAllowedFailures - actualFailures;
    return {
      totalBudget: totalAllowedFailures,
      consumed: actualFailures,
      remaining: remaining,
      percentRemaining: totalAllowedFailures > 0 ? ((remaining / totalAllowedFailures) * 100).toFixed(1) : 0,
    };
  }

  getLatencyPercentiles() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p = (pct) => sorted[Math.floor(sorted.length * pct / 100)] || 0;
    return { p50: p(50), p90: p(90), p95: p(95), p99: p(99) };
  }

  report() {
    const avail = this.getAvailability();
    const budget = this.getErrorBudget();
    const latency = this.getLatencyPercentiles();
    const status = avail >= this.sloTarget ? 'MEETING SLO' : 'BREACHING SLO';

    console.log(\`\\n=== \${this.serviceName} SLO Report ===\`);
    console.log(\`SLO Target: \${this.sloTarget}% availability\`);
    console.log(\`Current:    \${avail.toFixed(3)}% (\${status})\`);
    console.log(\`Requests:   \${this.totalRequests} total, \${this.successfulRequests} successful\`);
    console.log(\`\\nError Budget:\`);
    console.log(\`  Total:     \${budget.totalBudget} allowed failures\`);
    console.log(\`  Consumed:  \${budget.consumed}\`);
    console.log(\`  Remaining: \${budget.remaining} (\${budget.percentRemaining}%)\`);
    console.log(\`\\nLatency Percentiles:\`);
    console.log(\`  p50: \${latency.p50}ms  p90: \${latency.p90}ms  p95: \${latency.p95}ms  p99: \${latency.p99}ms\`);

    return { avail, budget, latency, status };
  }
}

// Simulate a month of traffic for a messaging API
const msgApi = new SLOTracker('WhatsApp Broadcasting API', 99.9);

// Simulate 100,000 requests with realistic patterns
for (let i = 0; i < 100000; i++) {
  // 99.92% success rate (slightly above SLO)
  const success = Math.random() < 0.9992;
  // Log-normal latency distribution
  const baseLatency = Math.exp(Math.random() * 2 + 2); // ~7ms to ~400ms
  const spike = Math.random() < 0.01 ? Math.random() * 2000 : 0; // 1% chance of spike
  const latency = Math.round(baseLatency + spike);
  msgApi.recordRequest(success, latency);
}

const result = msgApi.report();

// === The Four Golden Signals ===
console.log('\\n=== The Four Golden Signals ===');
const goldenSignals = {
  latency: { p50: result.latency.p50, p99: result.latency.p99, unit: 'ms' },
  traffic: { rps: 1157, unit: 'req/sec' },
  errors: { rate: ((1 - result.avail / 100) * 100).toFixed(3), unit: '%' },
  saturation: { cpu: 67, memory: 72, connections: 450, maxConnections: 1000 },
};

for (const [signal, data] of Object.entries(goldenSignals)) {
  console.log(\`  \${signal}: \${JSON.stringify(data)}\`);
}

// === RED vs USE Methods ===
console.log('\\n=== RED Method (Request-focused) ===');
console.log('  Rate:     1,157 req/sec');
console.log('  Errors:   ' + goldenSignals.errors.rate + '%');
console.log('  Duration: p50=' + result.latency.p50 + 'ms, p99=' + result.latency.p99 + 'ms');

console.log('\\n=== USE Method (Resource-focused) ===');
console.log('  Utilization: CPU 67%, Memory 72%');
console.log('  Saturation:  Connection pool 450/1000 (45%)');
console.log('  Errors:      0 OOM kills, 2 connection timeouts');

// === Error Budget Decision ===
console.log('\\n=== Error Budget Decision Framework ===');
if (parseFloat(result.budget.percentRemaining) > 50) {
  console.log('Budget > 50% remaining -> Ship new features aggressively');
} else if (parseFloat(result.budget.percentRemaining) > 20) {
  console.log('Budget 20-50% remaining -> Ship carefully, increase testing');
} else if (parseFloat(result.budget.percentRemaining) > 0) {
  console.log('Budget < 20% remaining -> Freeze features, focus on reliability');
} else {
  console.log('Budget EXHAUSTED -> Full feature freeze, all hands on reliability');
}`,
    content: `
<h1>SLOs, SLIs &amp; SLAs</h1>
<p>Understanding SLOs, SLIs, and SLAs is fundamental for any backend engineer at the SDE-2/SDE-3 level. This isn't just monitoring — it's about <strong>making data-driven decisions about reliability vs. velocity</strong>. Google's SRE practices have made this a standard interview topic.</p>

<h2>The Reliability Triangle</h2>
<pre><code>                    SLA (Contract)
                   ┌──────────────┐
                   │ "99.9% uptime│
                   │  or credits" │
                   └──────┬───────┘
                          │ backed by
                   ┌──────┴───────┐
                   │  SLO (Target) │
                   │ "99.95% avail│
                   │  internally" │
                   └──────┬───────┘
                          │ measured by
                   ┌──────┴───────┐
                   │  SLI (Metric) │
                   │ "success_req /│
                   │  total_req"  │
                   └──────────────┘</code></pre>

<h2>SLI — Service Level Indicator</h2>
<p>An SLI is a <strong>quantitative measure</strong> of a specific aspect of service quality. It's the raw metric.</p>
<table>
  <tr><th>SLI Type</th><th>Formula</th><th>Example</th></tr>
  <tr><td><strong>Availability</strong></td><td>successful requests / total requests</td><td>99.95%</td></tr>
  <tr><td><strong>Latency</strong></td><td>requests &lt; threshold / total requests</td><td>95% of requests &lt; 200ms</td></tr>
  <tr><td><strong>Error Rate</strong></td><td>error requests / total requests</td><td>0.05%</td></tr>
  <tr><td><strong>Throughput</strong></td><td>requests per second</td><td>5,000 rps</td></tr>
  <tr><td><strong>Freshness</strong></td><td>time since last successful data update</td><td>&lt; 5 minutes</td></tr>
</table>

<h2>SLO — Service Level Objective</h2>
<p>An SLO is a <strong>target value for an SLI</strong>, usually expressed as a percentage over a time window.</p>
<ul>
  <li><code>99.9% of requests should return successfully in a 30-day window</code></li>
  <li><code>95% of API calls should complete in under 200ms</code></li>
  <li><code>99.99% availability for the payment processing service</code></li>
</ul>

<h2>SLA — Service Level Agreement</h2>
<p>An SLA is a <strong>contractual commitment</strong> with consequences (usually financial) for not meeting it. SLAs should always be <strong>less ambitious than SLOs</strong> to provide a buffer.</p>

<h2>Comparison Table</h2>
<table>
  <tr><th>Aspect</th><th>SLI</th><th>SLO</th><th>SLA</th></tr>
  <tr><td><strong>What</strong></td><td>Metric / measurement</td><td>Internal target</td><td>External contract</td></tr>
  <tr><td><strong>Who sets it</strong></td><td>Engineering</td><td>Engineering + Product</td><td>Business + Legal</td></tr>
  <tr><td><strong>Consequence</strong></td><td>None (it's data)</td><td>Prioritize reliability work</td><td>Financial penalties, credits</td></tr>
  <tr><td><strong>Example</strong></td><td>Availability: 99.95%</td><td>Target: 99.9%</td><td>Guarantee: 99.5% or refund</td></tr>
  <tr><td><strong>Typical buffer</strong></td><td>—</td><td>Stricter than SLA</td><td>Looser than SLO</td></tr>
</table>

<h2>Error Budgets</h2>
<p>If your SLO is 99.9% availability, your <strong>error budget</strong> is 0.1%. In a 30-day month with 1M requests, you can afford <strong>1,000 failures</strong>.</p>
<pre><code>Error Budget = 1 - SLO target

SLO: 99.9%  →  Error budget: 0.1%  →  43.8 min/month downtime
SLO: 99.95% →  Error budget: 0.05% →  21.9 min/month downtime
SLO: 99.99% →  Error budget: 0.01% →  4.3 min/month downtime</code></pre>

<p><strong>Error budget policy:</strong></p>
<ul>
  <li><strong>&gt;50% remaining</strong> — Ship features aggressively, take risks</li>
  <li><strong>20-50% remaining</strong> — Ship carefully, increase test coverage</li>
  <li><strong>&lt;20% remaining</strong> — Slow down releases, prioritize stability</li>
  <li><strong>Exhausted</strong> — Feature freeze. All engineering effort goes to reliability.</li>
</ul>

<h2>The Four Golden Signals</h2>
<p>From Google's SRE book — the four signals every service should monitor:</p>
<table>
  <tr><th>Signal</th><th>What to Measure</th><th>Alert When</th></tr>
  <tr><td><strong>Latency</strong></td><td>Time to serve a request (success vs error)</td><td>p99 &gt; 500ms</td></tr>
  <tr><td><strong>Traffic</strong></td><td>Requests per second</td><td>Sudden drop &gt; 50%</td></tr>
  <tr><td><strong>Errors</strong></td><td>Rate of failed requests (5xx, timeouts)</td><td>Error rate &gt; 1%</td></tr>
  <tr><td><strong>Saturation</strong></td><td>How full your resources are (CPU, memory, connections)</td><td>CPU &gt; 80%, memory &gt; 85%</td></tr>
</table>

<h2>RED Method vs USE Method</h2>
<table>
  <tr><th>Method</th><th>Focus</th><th>Metrics</th><th>Best For</th></tr>
  <tr><td><strong>RED</strong></td><td>Request-driven services</td><td>Rate, Errors, Duration</td><td>APIs, microservices</td></tr>
  <tr><td><strong>USE</strong></td><td>Resource utilization</td><td>Utilization, Saturation, Errors</td><td>Infrastructure, databases</td></tr>
</table>

<h2>Common SLIs for Backend Services</h2>
<ul>
  <li><strong>API Latency</strong> — p50 (median experience), p95 (most users), p99 (tail latency, worst 1%)</li>
  <li><strong>Error Rate</strong> — 5xx / total responses. Exclude client errors (4xx) from availability SLIs.</li>
  <li><strong>Availability</strong> — Usually measured as (1 - error_rate) over a rolling window.</li>
  <li><strong>Throughput</strong> — Requests per second. Important for capacity planning.</li>
</ul>

<h2>Real Example: SLOs for a Messaging System</h2>
<p>For a WhatsApp broadcasting system processing 5M+ events (like at Habuild):</p>
<table>
  <tr><th>SLI</th><th>SLO Target</th><th>Rationale</th></tr>
  <tr><td>Message delivery success rate</td><td>99.9%</td><td>Business critical — failed messages lose revenue</td></tr>
  <tr><td>API response latency (p99)</td><td>&lt; 500ms</td><td>Broadcasting API must be responsive</td></tr>
  <tr><td>Message processing latency (p95)</td><td>&lt; 30 seconds</td><td>Messages should be delivered promptly</td></tr>
  <tr><td>System availability</td><td>99.95%</td><td>~22 min downtime/month allowed</td></tr>
  <tr><td>Webhook delivery success rate</td><td>99.5%</td><td>Retry mechanism covers the gap</td></tr>
</table>

<div class="warning-note"><strong>Interview Tip:</strong> When asked "how would you set SLOs?" — never say "100%." That's impossible and would mean zero deployments. Start with what users actually expect, measure current performance, and set a target slightly above current with room for iteration.</div>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you set SLOs for a WhatsApp broadcasting system?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I'd approach this in stages:
    <ol>
      <li><strong>Identify critical user journeys</strong> — Message sending, template submission, webhook delivery, analytics dashboard load</li>
      <li><strong>Measure current baseline</strong> — Instrument with OpenTelemetry/DataDog for 2-4 weeks to understand current performance</li>
      <li><strong>Set initial SLOs slightly above baseline</strong> — If current availability is 99.8%, set SLO at 99.9%. Don't aim for 99.99% on day one.</li>
      <li><strong>Differentiate by criticality</strong> — Message delivery (99.9%) gets a stricter SLO than analytics (99.5%)</li>
      <li><strong>Define error budget policy</strong> — What happens when budget runs low? Feature freeze? Extra testing requirements?</li>
      <li><strong>Iterate quarterly</strong> — Review SLOs with product and adjust based on user expectations and business needs</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What's the difference between SLO and SLA?</div>
  <div class="qa-a">
    <strong>Answer:</strong> An <strong>SLO</strong> is an internal engineering target — "we aim for 99.95% availability." An <strong>SLA</strong> is an external contractual commitment — "we guarantee 99.9% availability or we issue service credits."
    <br><br>
    The SLO should always be stricter than the SLA. If your SLA promises 99.9%, your SLO should be 99.95%. This gives you a buffer — you get warned (SLO breach) before you start owing money (SLA breach).
    <br><br>
    Not all services need SLAs (internal tools often don't), but every production service should have SLOs to guide engineering priorities.
  </div>
</div>
`
  },
  {
    id: 'distributed-tracing',
    title: 'Distributed Tracing & Logging',
    category: 'Observability',
    starterCode: `// Distributed Tracing & Structured Logging Simulation
// ===================================================

// Simulate OpenTelemetry-style distributed tracing
class Span {
  constructor(traceId, spanId, parentSpanId, operationName, serviceName) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
    this.operationName = operationName;
    this.serviceName = serviceName;
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'OK';
    this.attributes = {};
    this.events = [];
  }

  setAttribute(key, value) { this.attributes[key] = value; }
  addEvent(name, attrs) { this.events.push({ name, attrs, timestamp: Date.now() }); }

  end(status) {
    this.endTime = Date.now();
    this.status = status || 'OK';
  }

  duration() { return this.endTime - this.startTime; }
}

class Tracer {
  constructor() {
    this.spans = [];
  }

  generateId() {
    return Math.random().toString(16).slice(2, 18);
  }

  startTrace(operationName, serviceName) {
    const traceId = this.generateId();
    const span = new Span(traceId, this.generateId(), null, operationName, serviceName);
    this.spans.push(span);
    return span;
  }

  startChildSpan(parentSpan, operationName, serviceName) {
    const span = new Span(
      parentSpan.traceId,
      this.generateId(),
      parentSpan.spanId,
      operationName,
      serviceName || parentSpan.serviceName
    );
    this.spans.push(span);
    return span;
  }

  printTrace(traceId) {
    const traceSpans = this.spans
      .filter(s => s.traceId === traceId)
      .sort((a, b) => a.startTime - b.startTime);

    console.log(\`\\n=== Trace: \${traceId} ===\`);
    console.log(\`Total spans: \${traceSpans.length}\`);

    for (const span of traceSpans) {
      const indent = span.parentSpanId ? '  └─ ' : '';
      const dur = span.duration();
      const attrs = Object.keys(span.attributes).length > 0
        ? ' ' + JSON.stringify(span.attributes)
        : '';
      console.log(
        \`\${indent}[\${span.serviceName}] \${span.operationName} (\${dur}ms) [\${span.status}]\${attrs}\`
      );
    }
  }
}

// === Simulate a request across 5 microservices ===
const tracer = new Tracer();

console.log('=== Simulating Request Across 5 Microservices ===');
console.log('POST /api/broadcast — Send WhatsApp message to 10K users\\n');

// Service 1: API Gateway
const gatewaySpan = tracer.startTrace('POST /api/broadcast', 'api-gateway');
gatewaySpan.setAttribute('http.method', 'POST');
gatewaySpan.setAttribute('http.url', '/api/broadcast');
gatewaySpan.setAttribute('user.id', 'user-123');

// Service 2: Broadcast Service
const broadcastSpan = tracer.startChildSpan(gatewaySpan, 'createBroadcast', 'broadcast-service');
broadcastSpan.setAttribute('broadcast.recipients', 10000);
broadcastSpan.setAttribute('broadcast.template', 'order_confirmation');

// Service 3: User Service (lookup recipients)
const userSpan = tracer.startChildSpan(broadcastSpan, 'getRecipients', 'user-service');
userSpan.setAttribute('db.system', 'postgresql');
userSpan.setAttribute('db.operation', 'SELECT');
userSpan.setAttribute('db.rows_returned', 10000);
userSpan.end();

// Service 4: Queue Service (enqueue messages)
const queueSpan = tracer.startChildSpan(broadcastSpan, 'enqueueMessages', 'queue-service');
queueSpan.setAttribute('messaging.system', 'kafka');
queueSpan.setAttribute('messaging.topic', 'whatsapp-outbound');
queueSpan.setAttribute('messaging.batch_size', 10000);
queueSpan.addEvent('batch_produced', { partitions: 6 });
queueSpan.end();

broadcastSpan.end();

// Service 5: Notification Worker (async, processes from queue)
const workerSpan = tracer.startChildSpan(gatewaySpan, 'processMessages', 'notification-worker');
workerSpan.setAttribute('worker.batch_size', 100);
workerSpan.setAttribute('worker.whatsapp_api_calls', 100);
workerSpan.addEvent('batch_sent', { success: 98, failed: 2 });
workerSpan.end();

gatewaySpan.end();

// Print the full trace
tracer.printTrace(gatewaySpan.traceId);

// === Structured Logging ===
console.log('\\n=== Structured Logging Example ===');

class StructuredLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.defaultContext = { service: serviceName, env: 'production' };
  }

  log(level, message, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.defaultContext,
      ...context,
    };
    console.log(JSON.stringify(entry));
  }

  info(msg, ctx) { this.log('INFO', msg, ctx); }
  warn(msg, ctx) { this.log('WARN', msg, ctx); }
  error(msg, ctx) { this.log('ERROR', msg, ctx); }

  // Create child logger with request context (correlation ID)
  child(context) {
    const child = new StructuredLogger(this.serviceName);
    child.defaultContext = { ...this.defaultContext, ...context };
    return child;
  }
}

const logger = new StructuredLogger('broadcast-service');
const reqLogger = logger.child({
  traceId: gatewaySpan.traceId,
  requestId: 'req-abc-123',
  userId: 'user-123',
});

reqLogger.info('Broadcast request received', { recipients: 10000 });
reqLogger.info('Recipients fetched from DB', { count: 10000, durationMs: 145 });
reqLogger.info('Messages enqueued to Kafka', { topic: 'whatsapp-outbound', count: 10000 });
reqLogger.warn('2 messages failed WhatsApp API', { failedNumbers: ['+91xxx', '+91yyy'] });
reqLogger.error('Rate limit hit on WhatsApp API', { retryAfter: 30, endpoint: '/v1/messages' });`,
    content: `
<h1>Distributed Tracing &amp; Logging</h1>
<p>In a microservices architecture, a single user request can touch 5-10 services. Without distributed tracing and structured logging, debugging production issues becomes nearly impossible. This is a <strong>must-know topic for SDE-2/SDE-3 interviews</strong>, especially at companies running microservices.</p>

<h2>Why Distributed Tracing Matters</h2>
<pre><code>User Request: POST /api/send-broadcast
    │
    ▼
┌──────────┐   ┌────────────┐   ┌─────────────┐   ┌──────────┐   ┌──────────────┐
│API Gateway│──▶│ Broadcast  │──▶│ User Service│──▶│  Kafka   │──▶│ Notification │
│           │   │ Service    │   │ (fetch users)│  │ Producer │   │   Worker     │
│ traceId:  │   │            │   │              │  │          │   │              │
│ abc-123   │   │ traceId:   │   │ traceId:     │  │ traceId: │   │ traceId:     │
│           │   │ abc-123    │   │ abc-123      │  │ abc-123  │   │ abc-123      │
└──────────┘   └────────────┘   └─────────────┘   └──────────┘   └──────────────┘
                    │                                                    │
                    │         Same traceId propagated everywhere         │
                    └───────────────────────────────────────────────────┘</code></pre>

<h2>OpenTelemetry: The Standard</h2>
<p>OpenTelemetry (OTel) is the CNCF standard for observability. It provides a vendor-neutral API for:</p>
<ul>
  <li><strong>Traces</strong> — End-to-end request flow across services</li>
  <li><strong>Spans</strong> — Individual operations within a trace (e.g., DB query, HTTP call)</li>
  <li><strong>Context Propagation</strong> — Passing traceId/spanId across service boundaries via HTTP headers (<code>traceparent</code>)</li>
  <li><strong>Metrics</strong> — Counters, histograms, gauges</li>
</ul>

<h3>Key Concepts</h3>
<table>
  <tr><th>Concept</th><th>Description</th><th>Example</th></tr>
  <tr><td><strong>Trace</strong></td><td>Complete journey of a request</td><td>User sends broadcast → all services involved</td></tr>
  <tr><td><strong>Span</strong></td><td>Single operation in a trace</td><td>PostgreSQL query, Kafka produce, HTTP call</td></tr>
  <tr><td><strong>SpanContext</strong></td><td>traceId + spanId + flags</td><td>Propagated via <code>traceparent</code> header</td></tr>
  <tr><td><strong>Baggage</strong></td><td>Key-value pairs propagated across services</td><td>userId, tenantId for multi-tenant systems</td></tr>
</table>

<h2>Correlation IDs / Request IDs</h2>
<p>Even without full tracing, <strong>correlation IDs</strong> are essential. Generate a unique ID at the API gateway and pass it through every service via headers:</p>
<pre><code>// Middleware to extract or generate correlation ID
function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-request-id']
    || req.headers['x-correlation-id']
    || crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-request-id', correlationId);

  // Attach to all logs in this request context
  req.log = logger.child({ correlationId, userId: req.user?.id });
  next();
}

// When calling another service, propagate the ID
async function callUserService(correlationId) {
  return fetch('http://user-service/api/users', {
    headers: { 'x-correlation-id': correlationId }
  });
}</code></pre>

<h2>Tracing &amp; APM Tools</h2>
<table>
  <tr><th>Tool</th><th>Type</th><th>Pros</th><th>Cons</th></tr>
  <tr><td><strong>Signoz</strong></td><td>Open-source, self-hosted</td><td>Full OTel support, no vendor lock-in, cost-effective</td><td>Operational overhead to self-host</td></tr>
  <tr><td><strong>DataDog APM</strong></td><td>SaaS</td><td>Excellent UX, auto-instrumentation, full stack</td><td>Expensive at scale</td></tr>
  <tr><td><strong>Jaeger</strong></td><td>Open-source</td><td>CNCF graduated, battle-tested</td><td>Traces only, no metrics/logs</td></tr>
  <tr><td><strong>AWS X-Ray</strong></td><td>AWS managed</td><td>Native AWS integration</td><td>AWS-only, limited</td></tr>
  <tr><td><strong>Grafana Tempo</strong></td><td>Open-source</td><td>Integrates with Grafana stack</td><td>Requires Grafana expertise</td></tr>
</table>

<h2>Structured Logging</h2>
<p>Structured logging means emitting logs as <strong>JSON objects</strong> instead of free-text strings. This makes logs queryable, filterable, and correlatable.</p>
<pre><code>// BAD: Unstructured log
console.log('User 123 sent broadcast to 10000 recipients in 2.3s');

// GOOD: Structured log
logger.info('Broadcast sent', {
  userId: '123',
  recipients: 10000,
  durationMs: 2300,
  traceId: 'abc-123',
  template: 'order_confirmation'
});

// Output:
// {"timestamp":"2024-01-15T10:30:00Z","level":"INFO",
//  "message":"Broadcast sent","service":"broadcast-service",
//  "userId":"123","recipients":10000,"durationMs":2300,
//  "traceId":"abc-123","template":"order_confirmation"}</code></pre>

<h2>Log Aggregation: ELK vs Grafana Loki</h2>
<table>
  <tr><th>Aspect</th><th>ELK (Elasticsearch)</th><th>Grafana Loki</th></tr>
  <tr><td>Indexing</td><td>Full-text index (expensive)</td><td>Label-based index only (cheap)</td></tr>
  <tr><td>Storage cost</td><td>High</td><td>Low (stores compressed log lines)</td></tr>
  <tr><td>Query power</td><td>Very powerful (Lucene)</td><td>LogQL (label + regex)</td></tr>
  <tr><td>Scale</td><td>Complex to scale</td><td>Easy horizontal scaling</td></tr>
  <tr><td>Best for</td><td>Full-text search, analytics</td><td>Cost-effective log aggregation</td></tr>
</table>

<h2>Trace Context Propagation Across Kafka</h2>
<p>Propagating trace context through async message queues like Kafka requires special handling:</p>
<pre><code>// Producer: Inject trace context into Kafka message headers
async function produceMessage(topic, message) {
  const span = tracer.startSpan('kafka.produce');
  const headers = {};

  // Inject W3C traceparent header into message headers
  propagator.inject(context.active(), headers);

  await producer.send({
    topic,
    messages: [{
      value: JSON.stringify(message),
      headers: {
        traceparent: headers.traceparent,
        tracestate: headers.tracestate,
      }
    }]
  });
  span.end();
}

// Consumer: Extract trace context from Kafka message headers
async function consumeMessage(message) {
  const parentContext = propagator.extract(
    ROOT_CONTEXT,
    message.headers
  );

  // Create a new span linked to the producer's trace
  const span = tracer.startSpan('kafka.consume', {}, parentContext);
  // ... process message
  span.end();
}</code></pre>

<h2>Node.js Instrumentation with OpenTelemetry</h2>
<pre><code>// tracing.js — Initialize BEFORE importing app code
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://signoz:4318/v1/traces',  // or DataDog agent
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instruments: HTTP, Express, pg, redis, kafka, etc.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});
sdk.start();

// Run: node --require ./tracing.js app.js</code></pre>

<div class="warning-note"><strong>Critical:</strong> OpenTelemetry SDK MUST be initialized before any other imports. Use <code>--require ./tracing.js</code> flag or import it as the very first line. If Express is imported before OTel, HTTP spans won't be captured.</div>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How would you trace a request across 5 microservices?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I'd implement distributed tracing using OpenTelemetry:
    <ol>
      <li><strong>Instrument each service</strong> — Add OTel SDK with auto-instrumentation for HTTP, databases, and Kafka</li>
      <li><strong>Context propagation</strong> — OTel automatically injects <code>traceparent</code> headers into outgoing HTTP calls. For Kafka, I'd inject trace context into message headers.</li>
      <li><strong>Collect traces</strong> — Export spans to Signoz or DataDog via OTLP protocol</li>
      <li><strong>Correlate</strong> — All spans from the same request share a traceId, creating a visual waterfall showing the complete request flow</li>
      <li><strong>Add custom attributes</strong> — Enrich spans with business context: userId, orderId, broadcastId</li>
    </ol>
    In my experience at Habuild, we use Signoz for tracing and DataDog for APM. The traceId lets us jump from a Grafana alert → DataDog trace → specific service logs in seconds.
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle logging in a high-throughput system?</div>
  <div class="qa-a">
    <strong>Answer:</strong> For a system processing millions of events:
    <ul>
      <li><strong>Structured JSON logging</strong> — Always use structured logs (pino or winston with JSON transport). Never <code>console.log</code> in production.</li>
      <li><strong>Log levels</strong> — Use appropriate levels. In production, set to INFO. DEBUG only for troubleshooting specific services.</li>
      <li><strong>Sampling</strong> — For high-throughput paths, log every Nth request or use probabilistic sampling (e.g., 10% of requests at DEBUG level).</li>
      <li><strong>Async logging</strong> — Use pino (fastest Node.js logger) with async transport to avoid blocking the event loop.</li>
      <li><strong>Correlation IDs</strong> — Every log line includes traceId/requestId for correlation across services.</li>
      <li><strong>Central aggregation</strong> — Ship logs to Grafana Loki (cost-effective) or ELK for querying.</li>
      <li><strong>Retention policy</strong> — Keep hot logs for 7 days, warm for 30 days, cold archive for 90 days.</li>
    </ul>
  </div>
</div>
`
  },
  {
    id: 'alerting-oncall',
    title: 'Alerting Strategies & Incident Response',
    category: 'Observability',
    starterCode: `// Alerting & Incident Response Simulation
// ========================================

// Simulate an alerting system
class AlertManager {
  constructor() {
    this.rules = [];
    this.alerts = [];
    this.silences = new Set();
  }

  addRule(name, condition, severity, runbookUrl) {
    this.rules.push({ name, condition, severity, runbookUrl });
  }

  silence(ruleName, duration) {
    this.silences.add(ruleName);
    console.log(\`  Silenced "\${ruleName}" for \${duration}\`);
  }

  evaluate(metrics) {
    console.log('=== Alert Evaluation ===');
    for (const rule of this.rules) {
      if (this.silences.has(rule.name)) {
        console.log(\`  [SILENCED] \${rule.name}\`);
        continue;
      }

      const triggered = rule.condition(metrics);
      if (triggered) {
        const alert = {
          name: rule.name,
          severity: rule.severity,
          timestamp: new Date().toISOString(),
          runbook: rule.runbookUrl,
          metrics: { ...metrics },
        };
        this.alerts.push(alert);
        console.log(\`  [FIRING] \${rule.severity.toUpperCase()}: \${rule.name}\`);
        console.log(\`           Runbook: \${rule.runbookUrl}\`);
      } else {
        console.log(\`  [OK]     \${rule.name}\`);
      }
    }
  }

  getActiveAlerts() { return this.alerts.filter(a => !a.resolved); }
}

// Define alerting rules
const alertManager = new AlertManager();

alertManager.addRule(
  'HighErrorRate',
  (m) => m.errorRate > 1.0,
  'critical',
  'https://runbooks.example.com/high-error-rate'
);

alertManager.addRule(
  'HighP99Latency',
  (m) => m.p99Latency > 500,
  'warning',
  'https://runbooks.example.com/high-latency'
);

alertManager.addRule(
  'EventLoopLag',
  (m) => m.eventLoopLag > 100,
  'warning',
  'https://runbooks.example.com/event-loop-lag'
);

alertManager.addRule(
  'HeapMemoryHigh',
  (m) => m.heapUsedPercent > 85,
  'critical',
  'https://runbooks.example.com/heap-memory'
);

alertManager.addRule(
  'KafkaConsumerLag',
  (m) => m.kafkaLag > 10000,
  'warning',
  'https://runbooks.example.com/kafka-consumer-lag'
);

alertManager.addRule(
  'DiskUsageHigh',
  (m) => m.diskUsedPercent > 90,
  'critical',
  'https://runbooks.example.com/disk-usage'
);

// === Simulate healthy system ===
console.log('\\n--- Scenario 1: Healthy System ---');
alertManager.evaluate({
  errorRate: 0.05,
  p99Latency: 120,
  eventLoopLag: 15,
  heapUsedPercent: 62,
  kafkaLag: 50,
  diskUsedPercent: 45,
});

// === Simulate degraded system ===
console.log('\\n--- Scenario 2: System Under Stress ---');
alertManager.evaluate({
  errorRate: 2.5,
  p99Latency: 850,
  eventLoopLag: 250,
  heapUsedPercent: 91,
  kafkaLag: 50000,
  diskUsedPercent: 72,
});

// === Incident Response Simulation ===
console.log('\\n=== Incident Response Timeline ===');

class IncidentTracker {
  constructor(title, severity) {
    this.title = title;
    this.severity = severity;
    this.timeline = [];
    this.status = 'detected';
    this.startTime = Date.now();
    this.addEvent('DETECTED', \`Alert fired: \${title}\`);
  }

  addEvent(phase, description) {
    this.timeline.push({
      phase,
      time: new Date().toISOString(),
      elapsed: Date.now() - this.startTime + 'ms',
      description,
    });
  }

  triage(assignee) {
    this.status = 'triaging';
    this.addEvent('TRIAGE', \`Assigned to \${assignee}. Assessing impact.\`);
  }

  mitigate(action) {
    this.status = 'mitigating';
    this.addEvent('MITIGATE', action);
  }

  resolve(rootCause) {
    this.status = 'resolved';
    this.addEvent('RESOLVED', \`Root cause: \${rootCause}\`);
  }

  postmortem(findings) {
    this.addEvent('POSTMORTEM', findings);
  }

  printTimeline() {
    console.log(\`\\nIncident: \${this.title} [Severity: \${this.severity}]\`);
    console.log('Timeline:');
    for (const event of this.timeline) {
      console.log(\`  [\${event.phase}] \${event.description}\`);
    }
  }
}

const incident = new IncidentTracker('API Error Rate Spike to 2.5%', 'SEV-1');
incident.triage('Arvind (on-call)');
incident.addEvent('INVESTIGATE', 'Checked Grafana dashboard — error spike correlates with deployment at 14:32');
incident.addEvent('INVESTIGATE', 'DataDog traces show 500s from user-service DB connection pool exhaustion');
incident.mitigate('Rolled back deployment from v2.3.1 to v2.3.0 via ECS');
incident.addEvent('MONITOR', 'Error rate dropping: 2.5% -> 0.8% -> 0.1%');
incident.resolve('New query in v2.3.1 caused N+1 problem, exhausting connection pool');
incident.postmortem('Action items: (1) Add connection pool monitoring alert, (2) Add load testing for new DB queries, (3) Review query patterns in PR checklist');
incident.printTimeline();

// === Node.js Metrics to Monitor ===
console.log('\\n=== Key Node.js Metrics ===');
const nodeMetrics = {
  eventLoopLag: '15ms (healthy < 100ms)',
  heapUsed: '125MB / 512MB (24%)',
  heapTotal: '512MB',
  rss: '310MB',
  activeHandles: 42,
  activeRequests: 8,
  gcPauses: '12ms avg (last 5 min)',
  openFileDescriptors: 156,
  cpuUsage: '23% user, 4% system',
};

for (const [metric, value] of Object.entries(nodeMetrics)) {
  console.log(\`  \${metric}: \${value}\`);
}`,
    content: `
<h1>Alerting Strategies &amp; Incident Response</h1>
<p>Alerting is the bridge between observability and action. Poor alerting leads to alert fatigue — teams ignore pages, and real incidents get missed. Good alerting is <strong>symptom-based, actionable, and prioritized</strong>. As an SDE-2/SDE-3, you're expected to design alerting strategies and lead incident response.</p>

<h2>Alerting Anti-Patterns</h2>
<table>
  <tr><th>Anti-Pattern</th><th>Problem</th><th>Solution</th></tr>
  <tr><td><strong>Alert fatigue</strong></td><td>Too many alerts, team ignores them</td><td>Reduce to actionable alerts only</td></tr>
  <tr><td><strong>Cause-based alerts</strong></td><td>Alert on CPU spike instead of user impact</td><td>Alert on symptoms (error rate, latency)</td></tr>
  <tr><td><strong>No runbook</strong></td><td>On-call doesn't know what to do</td><td>Every alert links to a runbook</td></tr>
  <tr><td><strong>Missing severity</strong></td><td>Everything is "critical"</td><td>P1/P2/P3 classification</td></tr>
  <tr><td><strong>No grouping</strong></td><td>100 alerts for 1 incident</td><td>Group related alerts, deduplicate</td></tr>
  <tr><td><strong>Stale alerts</strong></td><td>Alerts for decommissioned services</td><td>Quarterly alert review</td></tr>
</table>

<h2>Good Alerting Principles</h2>
<ol>
  <li><strong>Symptom-based, not cause-based</strong> — Alert on "error rate &gt; 1%" not "CPU &gt; 80%." Users don't care about CPU; they care about errors.</li>
  <li><strong>Actionable</strong> — If you can't take action on an alert, delete it. Every alert should have a clear response.</li>
  <li><strong>Linked to runbooks</strong> — Every alert has a URL to a runbook with diagnosis steps and mitigation actions.</li>
  <li><strong>Severity-classified</strong> — P1 (pages on-call immediately), P2 (investigate within 1 hour), P3 (investigate next business day).</li>
  <li><strong>Proper thresholds</strong> — Use burn-rate alerts for SLOs. Don't alert on momentary spikes — use sustained conditions (e.g., error rate &gt; 1% for 5 minutes).</li>
</ol>

<h2>Alerting with Grafana</h2>
<p>Grafana is a powerful alerting platform that integrates with Prometheus, Loki, and other data sources:</p>
<pre><code>Grafana Alerting Flow:
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ Data Source  │────▶│ Alert Rule   │────▶│ Contact Point │
│ (Prometheus, │     │ (Condition + │     │ (Slack, PD,   │
│  Loki, etc.) │     │  threshold)  │     │  OpsGenie)    │
└─────────────┘     └──────┬───────┘     └───────────────┘
                           │
                    ┌──────┴───────┐
                    │ Notification │
                    │   Policy     │
                    │ (routing,    │
                    │  grouping,   │
                    │  silencing)  │
                    └──────────────┘</code></pre>

<h3>Example Alert Rules for a Node.js API</h3>
<pre><code># High Error Rate (Critical)
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m])
        / rate(http_requests_total[5m]) > 0.01
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Error rate above 1% for 5 minutes"
    runbook: "https://runbooks.internal/high-error-rate"

# High Latency (Warning)
- alert: HighP99Latency
  expr: histogram_quantile(0.99,
        rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 10m
  labels:
    severity: warning

# Event Loop Lag (Warning)
- alert: EventLoopLag
  expr: nodejs_eventloop_lag_seconds > 0.1
  for: 5m
  labels:
    severity: warning</code></pre>

<h2>PagerDuty / OpsGenie Integration</h2>
<ul>
  <li><strong>Escalation policies</strong> — If on-call doesn't acknowledge in 5 min, escalate to next person</li>
  <li><strong>Schedules</strong> — Weekly rotation, follow-the-sun for global teams</li>
  <li><strong>Severity mapping</strong> — Critical alerts → page immediately. Warning → Slack notification.</li>
  <li><strong>Auto-resolve</strong> — When the alert condition clears, auto-resolve the incident</li>
</ul>

<h2>Runbooks</h2>
<p>A runbook should include:</p>
<ul>
  <li><strong>Alert description</strong> — What does this alert mean?</li>
  <li><strong>Impact</strong> — What is the user-facing impact?</li>
  <li><strong>Diagnosis steps</strong> — Which dashboards to check, which logs to query</li>
  <li><strong>Mitigation steps</strong> — How to stop the bleeding (rollback, scale up, restart)</li>
  <li><strong>Root cause investigation</strong> — How to find the underlying cause</li>
  <li><strong>Escalation</strong> — When and who to escalate to</li>
</ul>

<h2>Incident Response Process</h2>
<pre><code>┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐
│ DETECT   │──▶│ TRIAGE   │──▶│ MITIGATE │──▶│ RESOLVE  │──▶│ POSTMORTEM│
│          │   │          │   │          │   │          │   │           │
│ Alert    │   │ Severity │   │ Stop the │   │ Fix root │   │ Blameless │
│ fires    │   │ assessment│  │ bleeding │   │ cause    │   │ review    │
│          │   │ Assign   │   │ Rollback │   │ Deploy   │   │ Action    │
│          │   │ IC       │   │ Scale up │   │ fix      │   │ items     │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └───────────┘
  ~0 min        ~5 min         ~15 min        ~1-4 hrs       ~1-3 days</code></pre>

<h3>Incident Severity Levels</h3>
<table>
  <tr><th>Severity</th><th>Criteria</th><th>Response Time</th><th>Example</th></tr>
  <tr><td><strong>SEV-1</strong></td><td>Complete service outage or data loss</td><td>Immediate, page on-call</td><td>API returning 500 for all users</td></tr>
  <tr><td><strong>SEV-2</strong></td><td>Major degradation affecting many users</td><td>Within 30 minutes</td><td>50% of messages failing delivery</td></tr>
  <tr><td><strong>SEV-3</strong></td><td>Minor degradation, workaround exists</td><td>Within 4 hours</td><td>Dashboard loading slowly</td></tr>
  <tr><td><strong>SEV-4</strong></td><td>Cosmetic or minor issue</td><td>Next business day</td><td>Non-critical metric gap</td></tr>
</table>

<h2>Blameless Postmortems</h2>
<p>After every SEV-1/SEV-2 incident, conduct a <strong>blameless postmortem</strong>:</p>
<ul>
  <li><strong>What happened?</strong> — Timeline of events</li>
  <li><strong>What was the impact?</strong> — Users affected, duration, revenue impact</li>
  <li><strong>What was the root cause?</strong> — Technical deep-dive</li>
  <li><strong>What went well?</strong> — Detection time, response speed</li>
  <li><strong>What didn't go well?</strong> — Gaps in monitoring, slow response</li>
  <li><strong>Action items</strong> — Concrete, assigned, with deadlines. "Improve monitoring" is not an action item. "Add alert for DB connection pool exhaustion by Feb 15 (owner: Arvind)" is.</li>
</ul>

<div class="warning-note"><strong>Key principle:</strong> Blameless doesn't mean "no accountability." It means we focus on the SYSTEM that allowed the failure, not the person who pushed the button. Ask "why did the system allow this?" not "who did this?"</div>

<h2>Key Metrics to Monitor for Node.js Apps</h2>
<table>
  <tr><th>Metric</th><th>Why It Matters</th><th>Alert Threshold</th></tr>
  <tr><td><strong>Event Loop Lag</strong></td><td>High lag means CPU-bound work blocking the loop</td><td>&gt; 100ms for 5 min</td></tr>
  <tr><td><strong>Heap Memory Usage</strong></td><td>Memory leaks cause OOM crashes</td><td>&gt; 85% of heap limit</td></tr>
  <tr><td><strong>Active Handles</strong></td><td>Open sockets, timers — leak detection</td><td>Steadily increasing trend</td></tr>
  <tr><td><strong>Active Requests</strong></td><td>In-flight async operations</td><td>Unusual spike</td></tr>
  <tr><td><strong>GC Pauses</strong></td><td>Long GC pauses cause latency spikes</td><td>&gt; 100ms p99</td></tr>
  <tr><td><strong>Open File Descriptors</strong></td><td>FD exhaustion crashes the process</td><td>&gt; 80% of ulimit</td></tr>
  <tr><td><strong>RSS (Resident Set Size)</strong></td><td>Total memory consumed by the process</td><td>&gt; 80% of container limit</td></tr>
</table>

<h2>Dashboard Design: Grafana for Backend Services</h2>
<pre><code>Recommended Grafana Dashboard Layout:
┌────────────────────────────────────────────────────────┐
│ Row 1: SLO Overview                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐ │
│ │ Availability│ │ Error Budget│ │ SLO Burn Rate      │ │
│ │  99.95%     │ │  67% left   │ │ [graph over time]  │ │
│ └─────────────┘ └─────────────┘ └────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Row 2: Golden Signals                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Traffic  │ │ Errors   │ │ Latency  │ │Saturation│  │
│ │ (RPS)    │ │ (rate)   │ │ (p50/99) │ │ (CPU/Mem)│  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├────────────────────────────────────────────────────────┤
│ Row 3: Node.js Runtime                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │Event Loop│ │ Heap     │ │ GC Pauses│ │ Active   │  │
│ │ Lag      │ │ Memory   │ │          │ │ Handles  │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├────────────────────────────────────────────────────────┤
│ Row 4: Infrastructure                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Kafka Lag│ │ DB Conns │ │ Redis Hit│ │ Disk I/O │  │
│ │          │ │ Pool     │ │ Rate     │ │          │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────────────────────────────────────────┘</code></pre>

<h2>On-Call Best Practices</h2>
<ul>
  <li><strong>Rotation</strong> — Weekly rotations with a primary and secondary on-call</li>
  <li><strong>Handoff</strong> — Written handoff document with active issues and context</li>
  <li><strong>Compensation</strong> — On-call should be compensated or have comp time</li>
  <li><strong>Reduce toil</strong> — If the same alert fires repeatedly, fix the root cause or automate the response</li>
  <li><strong>War room</strong> — For SEV-1, open a dedicated Slack channel / video call immediately</li>
  <li><strong>Communication</strong> — Post status updates every 30 minutes during active incidents</li>
</ul>

<h2>Interview Q&amp;A</h2>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle a production incident?</div>
  <div class="qa-a">
    <strong>Answer:</strong> I follow a structured incident response process:
    <ol>
      <li><strong>Detect</strong> — Alert fires in Grafana, routes to PagerDuty/Slack</li>
      <li><strong>Acknowledge</strong> — I acknowledge the page within 5 minutes, open a war room Slack channel for SEV-1</li>
      <li><strong>Triage</strong> — Check Grafana dashboards for the Four Golden Signals. Is it latency? Errors? Is it affecting all users or a subset?</li>
      <li><strong>Investigate</strong> — Use DataDog/Signoz traces to find the failing service. Check recent deployments — correlate error spike with deploy timestamp.</li>
      <li><strong>Mitigate</strong> — Stop the bleeding first. Rollback the deployment, scale up, toggle feature flag off. Fix root cause later.</li>
      <li><strong>Communicate</strong> — Post updates every 30 minutes to the incident channel and stakeholders</li>
      <li><strong>Resolve</strong> — Once mitigated, deploy a proper fix. Monitor for 30+ minutes.</li>
      <li><strong>Postmortem</strong> — Within 3 days, write a blameless postmortem with timeline, root cause, and concrete action items.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What metrics would you alert on for a real-time messaging system?</div>
  <div class="qa-a">
    <strong>Answer:</strong> For a system like Habuild's WhatsApp broadcasting:
    <br><br>
    <strong>Critical (page immediately):</strong>
    <ul>
      <li>Message delivery failure rate &gt; 2% for 5 minutes</li>
      <li>API error rate (5xx) &gt; 1% for 5 minutes</li>
      <li>Kafka consumer lag &gt; 50,000 messages (processing stalled)</li>
      <li>Zero messages processed in last 5 minutes (consumer dead)</li>
    </ul>
    <strong>Warning (Slack notification):</strong>
    <ul>
      <li>API p99 latency &gt; 500ms for 10 minutes</li>
      <li>Event loop lag &gt; 100ms</li>
      <li>Heap memory &gt; 80%</li>
      <li>WhatsApp API rate limit warnings</li>
      <li>DB connection pool utilization &gt; 80%</li>
    </ul>
    <strong>Key principle:</strong> I alert on symptoms (message delivery failures) rather than causes (CPU usage). A symptom-based alert directly tells you users are affected.
  </div>
</div>
`
  },
];
