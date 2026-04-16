export const lld = [
  // ─────────────────────────────────────────────
  //  SOLID PRINCIPLES
  // ─────────────────────────────────────────────
  {
    id: 'solid-overview',
    title: 'SOLID Principles Overview',
    category: 'SOLID',
    starterCode: `// SOLID Principles — Quick Demo
// Each principle demonstrated with a simple example

// === S — Single Responsibility ===
// Each class does ONE thing
class UserValidator {
  validate(data) {
    if (!data.email) throw new Error('Email required');
    if (!data.name) throw new Error('Name required');
    return true;
  }
}

class UserRepository {
  save(user) {
    console.log('Saved user:', user.name);
  }
}

// === O — Open/Closed ===
// Add new behavior by adding classes, not modifying
class EmailNotifier {
  send(msg) { console.log('Email:', msg); }
}
class SMSNotifier {
  send(msg) { console.log('SMS:', msg); }
}

function notifyAll(notifiers, msg) {
  notifiers.forEach(n => n.send(msg));
}

// === D — Dependency Inversion ===
// High-level module depends on abstraction (notifiers), not concrete impl
const validator = new UserValidator();
const repo = new UserRepository();
const notifiers = [new EmailNotifier(), new SMSNotifier()];

const user = { name: 'Arvind', email: 'arvind@example.com' };
validator.validate(user);
repo.save(user);
notifyAll(notifiers, 'Welcome ' + user.name);
console.log('\\nAll SOLID principles working together!');`,
    content: `
<h1>SOLID Principles Overview</h1>
<p>SOLID is a set of five design principles introduced by Robert C. Martin that make software designs more <strong>understandable, flexible, and maintainable</strong>. These are essential for SDE-2/SDE-3 interviews — you will be asked to apply them in LLD rounds.</p>

<h2>What SOLID Stands For</h2>
<table>
  <tr><th>Letter</th><th>Principle</th><th>Core Idea</th><th>Real-World Analogy</th></tr>
  <tr><td><strong>S</strong></td><td>Single Responsibility</td><td>A class should have only one reason to change</td><td>A chef cooks, a waiter serves — they don't swap roles</td></tr>
  <tr><td><strong>O</strong></td><td>Open/Closed</td><td>Open for extension, closed for modification</td><td>USB ports — plug in new devices without rewiring the motherboard</td></tr>
  <tr><td><strong>L</strong></td><td>Liskov Substitution</td><td>Subtypes must be substitutable for base types</td><td>Any ATM card works in any ATM — they all follow the same interface</td></tr>
  <tr><td><strong>I</strong></td><td>Interface Segregation</td><td>Don't force clients to depend on methods they don't use</td><td>A TV remote shouldn't have washing machine buttons</td></tr>
  <tr><td><strong>D</strong></td><td>Dependency Inversion</td><td>Depend on abstractions, not concretions</td><td>Wall sockets accept any plug shape — the socket doesn't care what device it is</td></tr>
</table>

<h2>Why SOLID Matters</h2>
<ul>
  <li><strong>Maintainability</strong> — changing one feature doesn't break another</li>
  <li><strong>Testability</strong> — individual components can be unit tested in isolation</li>
  <li><strong>Extensibility</strong> — new features can be added without touching existing code</li>
  <li><strong>Team Scalability</strong> — multiple developers can work on different parts without conflicts</li>
</ul>

<h2>How NestJS Encourages SOLID</h2>
<p>NestJS is architected around SOLID from the ground up:</p>
<table>
  <tr><th>Principle</th><th>NestJS Feature</th></tr>
  <tr><td>SRP</td><td>Controllers handle HTTP, Services handle business logic, Repositories handle data</td></tr>
  <tr><td>OCP</td><td>Guards, Interceptors, Pipes — extend behavior without modifying controllers</td></tr>
  <tr><td>LSP</td><td>Custom providers can replace default implementations (e.g., custom Logger)</td></tr>
  <tr><td>ISP</td><td>Separate interfaces: <code>CanActivate</code>, <code>NestInterceptor</code>, <code>PipeTransform</code></td></tr>
  <tr><td>DIP</td><td>Built-in DI container — inject abstractions via constructor, swap implementations</td></tr>
</table>

<pre><code>// NestJS module following all SOLID principles
@Module({
  controllers: [UserController],    // SRP: only handles HTTP
  providers: [
    UserService,                     // SRP: only business logic
    {
      provide: 'IUserRepository',    // DIP: abstraction token
      useClass: PostgresUserRepo,    // Swap to MongoUserRepo without changing service
    },
    {
      provide: 'INotifier',          // OCP: add new notifiers without changing service
      useClass: EmailNotifier,
    },
  ],
})
export class UserModule {}</code></pre>

<h2>SOLID in Interviews</h2>
<p>In SDE-2/SDE-3 LLD rounds, interviewers evaluate whether you naturally apply SOLID. They won't always ask "What is SRP?" — instead they'll watch if your class design naturally follows these principles.</p>

<div class="qa-block">
  <div class="qa-q">Q: Which SOLID principle is most important?</div>
  <div class="qa-a"><strong>SRP and DIP</strong> are arguably the most impactful. SRP keeps classes small and focused. DIP (with dependency injection) makes code testable and swappable. In practice, if you nail these two, the others often follow naturally. In NestJS projects, DIP is enforced by the framework's DI container.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can you over-apply SOLID?</div>
  <div class="qa-a">Yes. Over-engineering with too many abstractions violates KISS. For example, creating an interface for a class that will only ever have one implementation adds unnecessary complexity. Apply SOLID when you see code smells (god classes, tight coupling) or when you anticipate future extension. The goal is pragmatic design, not dogmatic adherence.</div>
</div>

<div class="warning-note">In interviews, don't just name the principles — demonstrate them in your class diagrams. When designing any system, start by identifying responsibilities (SRP) and injection points (DIP).</div>
`,
  },
  {
    id: 'solid-srp',
    title: 'Single Responsibility Principle',
    category: 'SOLID',
    starterCode: `// SRP: Single Responsibility Principle
// Bad: God class doing everything
class UserManagerBad {
  validateEmail(email) {
    return email.includes('@');
  }
  hashPassword(pw) {
    return 'hashed_' + pw;
  }
  saveToDb(user) {
    console.log('DB: INSERT user', user.name);
  }
  sendWelcomeEmail(user) {
    console.log('Email: Welcome', user.name);
  }
  formatResponse(user) {
    return { id: 1, name: user.name };
  }
}

console.log('=== BAD: God class ===');
const bad = new UserManagerBad();
const email = 'arvind@test.com';
console.log('Valid email?', bad.validateEmail(email));

// Good: Each class has ONE responsibility
class UserValidator {
  validate(data) {
    if (!data.email || !data.email.includes('@'))
      throw new Error('Invalid email');
    if (!data.name) throw new Error('Name required');
    return true;
  }
}

class PasswordHasher {
  hash(password) { return 'hashed_' + password; }
}

class UserRepository {
  save(user) {
    console.log('DB: INSERT user', user.name);
    return { id: 1, ...user };
  }
}

class EmailService {
  sendWelcome(user) {
    console.log('Email: Welcome', user.name);
  }
}

// Orchestrator (like a NestJS service)
class UserService {
  constructor(validator, hasher, repo, email) {
    this.validator = validator;
    this.hasher = hasher;
    this.repo = repo;
    this.email = email;
  }

  createUser(data) {
    this.validator.validate(data);
    const user = {
      name: data.name,
      email: data.email,
      password: this.hasher.hash(data.password),
    };
    const saved = this.repo.save(user);
    this.email.sendWelcome(saved);
    return saved;
  }
}

console.log('\\n=== GOOD: SRP applied ===');
const service = new UserService(
  new UserValidator(),
  new PasswordHasher(),
  new UserRepository(),
  new EmailService()
);
service.createUser({
  name: 'Arvind',
  email: 'arvind@test.com',
  password: 'secret123'
});`,
    content: `
<h1>Single Responsibility Principle (SRP)</h1>
<p><em>"A class should have only one reason to change."</em> — Robert C. Martin</p>
<p>SRP means every class or module should be responsible for exactly <strong>one part of the functionality</strong>. If a class has two responsibilities, changes to one can break the other.</p>

<h2>Bad Example: God Class</h2>
<p>This is a common anti-pattern, especially in early-stage startups where speed trumps design:</p>
<pre><code>// BAD — This class has 5 reasons to change
class UserManager {
  // 1. Validation logic
  validateEmail(email: string): boolean { ... }
  validatePhone(phone: string): boolean { ... }

  // 2. Password handling
  hashPassword(pw: string): string { ... }

  // 3. Database operations
  saveToDb(user: User): Promise&lt;User&gt; { ... }
  findById(id: string): Promise&lt;User&gt; { ... }

  // 4. Email sending
  sendWelcomeEmail(user: User): Promise&lt;void&gt; { ... }

  // 5. HTTP response formatting
  formatResponse(user: User): UserDTO { ... }
}</code></pre>
<p>Problems: changing the email provider requires touching <code>UserManager</code>. Changing the DB schema also requires touching <code>UserManager</code>. Testing any one concern requires instantiating the whole class.</p>

<h2>Good Example: NestJS-Style Separation</h2>
<pre><code>// GOOD — Each class has ONE reason to change

// Handles input validation only
@Injectable()
class UserValidator {
  validate(dto: CreateUserDto): void {
    if (!dto.email) throw new BadRequestException('Email required');
  }
}

// Handles data persistence only
@Injectable()
class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository&lt;User&gt;) {}
  save(user: Partial&lt;User&gt;): Promise&lt;User&gt; { return this.repo.save(user); }
  findById(id: string): Promise&lt;User&gt; { return this.repo.findOne(id); }
}

// Handles email sending only
@Injectable()
class EmailService {
  async sendWelcome(user: User): Promise&lt;void&gt; { ... }
}

// Orchestrates — but delegates to specialists
@Injectable()
class UserService {
  constructor(
    private validator: UserValidator,
    private repo: UserRepository,
    private emailService: EmailService,
  ) {}

  async createUser(dto: CreateUserDto): Promise&lt;User&gt; {
    this.validator.validate(dto);
    const user = await this.repo.save(dto);
    await this.emailService.sendWelcome(user);
    return user;
  }
}

// Handles HTTP only
@Controller('users')
class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}</code></pre>

<h2>SRP Applied to Different Levels</h2>
<table>
  <tr><th>Level</th><th>SRP Means</th><th>Example</th></tr>
  <tr><td>Function</td><td>Does one thing</td><td><code>validateEmail()</code> only validates, doesn't save</td></tr>
  <tr><td>Class</td><td>One reason to change</td><td><code>UserRepository</code> only handles DB ops</td></tr>
  <tr><td>Module</td><td>One bounded context</td><td><code>AuthModule</code> only handles authentication</td></tr>
  <tr><td>Microservice</td><td>One business domain</td><td>User Service, Payment Service, Notification Service</td></tr>
</table>

<h2>Identifying SRP Violations</h2>
<ul>
  <li>Class name contains <strong>"And"</strong> or <strong>"Manager"</strong> or <strong>"Handler"</strong> with too many methods</li>
  <li>Class imports from many unrelated modules (DB + HTTP + Email + Queue)</li>
  <li>When you change one feature, tests for a different feature break</li>
  <li>The class file is 500+ lines long</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: How does SRP apply to microservices?</div>
  <div class="qa-a">SRP at the microservice level means each service owns a <strong>single bounded context</strong>. A User Service handles registration, profiles, and authentication — all within the "user" domain. But it should NOT handle payments or notifications. This is exactly the Domain-Driven Design (DDD) approach: one microservice per aggregate root. At companies running NestJS microservices with Kafka, each service has its own database (database-per-service pattern) and communicates via Kafka events — enforcing SRP at the system level.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Doesn't SRP lead to too many small classes?</div>
  <div class="qa-a">Yes, but that's a feature, not a bug. Many small, focused classes are easier to understand, test, and modify than a few large god classes. NestJS encourages this naturally — you'll have Controllers, Services, Repositories, Guards, Pipes, and Interceptors. Each is small and focused. The DI container wires them together so you don't have to manage the complexity manually.</div>
</div>

<div class="warning-note">In an interview, if your LLD has a class with more than 5–7 public methods, the interviewer will likely ask: "Can we break this down?" Always start with SRP and split responsibilities.</div>
`,
  },
  {
    id: 'solid-ocp',
    title: 'Open/Closed Principle',
    category: 'SOLID',
    starterCode: `// OCP: Open/Closed Principle
// Open for extension, closed for modification

// === BAD: Adding a new payment type requires modifying this function ===
function processPaymentBad(type, amount) {
  if (type === 'credit_card') {
    console.log('Processing credit card: $' + amount);
  } else if (type === 'paypal') {
    console.log('Processing PayPal: $' + amount);
  } else if (type === 'upi') {
    console.log('Processing UPI: ₹' + amount);
  }
  // Every new type = modify this function = OCP violation!
}

console.log('=== BAD: switch/if-else chain ===');
processPaymentBad('credit_card', 100);
processPaymentBad('upi', 500);

// === GOOD: Strategy Pattern — extend by adding new classes ===
class CreditCardProcessor {
  supports(type) { return type === 'credit_card'; }
  process(amount) {
    console.log('Credit Card charged: $' + amount);
    return { success: true, method: 'credit_card' };
  }
}

class PayPalProcessor {
  supports(type) { return type === 'paypal'; }
  process(amount) {
    console.log('PayPal transfer: $' + amount);
    return { success: true, method: 'paypal' };
  }
}

class UPIProcessor {
  supports(type) { return type === 'upi'; }
  process(amount) {
    console.log('UPI payment: ₹' + amount);
    return { success: true, method: 'upi' };
  }
}

// Adding Crypto? Just add a new class — ZERO modification to PaymentService!
class CryptoProcessor {
  supports(type) { return type === 'crypto'; }
  process(amount) {
    console.log('Crypto transfer: ₿' + (amount / 60000).toFixed(6));
    return { success: true, method: 'crypto' };
  }
}

class PaymentService {
  constructor(processors) {
    this.processors = processors;
  }
  pay(type, amount) {
    const processor = this.processors.find(p => p.supports(type));
    if (!processor) throw new Error('Unsupported: ' + type);
    return processor.process(amount);
  }
}

console.log('\\n=== GOOD: Strategy Pattern (OCP) ===');
const service = new PaymentService([
  new CreditCardProcessor(),
  new PayPalProcessor(),
  new UPIProcessor(),
  new CryptoProcessor(), // New! No existing code modified
]);

service.pay('credit_card', 100);
service.pay('upi', 500);
service.pay('crypto', 60000);`,
    content: `
<h1>Open/Closed Principle (OCP)</h1>
<p><em>"Software entities should be open for extension, but closed for modification."</em></p>
<p>You should be able to add new behavior <strong>without changing existing, tested code</strong>. This is typically achieved through <strong>abstraction and polymorphism</strong> — Strategy pattern, plugin architecture, or inheritance.</p>

<h2>Bad Example: The Switch/If-Else Graveyard</h2>
<pre><code>// BAD — Every new payment type modifies this function
class PaymentService {
  processPayment(type: string, amount: number) {
    switch (type) {
      case 'credit_card':
        // 20 lines of credit card logic
        break;
      case 'paypal':
        // 20 lines of PayPal logic
        break;
      case 'upi':
        // 20 lines of UPI logic
        break;
      // Adding 'crypto'? You MUST modify this file
      // What if you break credit_card while adding crypto?
    }
  }
}</code></pre>

<h2>Good Example: Strategy Pattern</h2>
<pre><code>// GOOD — Each processor is a separate class
interface PaymentProcessor {
  supports(type: string): boolean;
  process(amount: number): Promise&lt;PaymentResult&gt;;
}

@Injectable()
class CreditCardProcessor implements PaymentProcessor {
  supports(type: string) { return type === 'credit_card'; }
  async process(amount: number) { /* Stripe API call */ }
}

@Injectable()
class UPIProcessor implements PaymentProcessor {
  supports(type: string) { return type === 'upi'; }
  async process(amount: number) { /* Razorpay API call */ }
}

// To add crypto: create CryptoProcessor, register in module — DONE.
// Zero changes to PaymentService.

@Injectable()
class PaymentService {
  constructor(
    @Inject('PAYMENT_PROCESSORS')
    private processors: PaymentProcessor[],
  ) {}

  async pay(type: string, amount: number) {
    const processor = this.processors.find(p => p.supports(type));
    if (!processor) throw new BadRequestException('Unsupported');
    return processor.process(amount);
  }
}</code></pre>

<h2>Real Example: Notification Channels</h2>
<pre><code>interface NotificationChannel {
  send(userId: string, message: string): Promise&lt;void&gt;;
}

class EmailChannel implements NotificationChannel { ... }
class SMSChannel implements NotificationChannel { ... }
class PushChannel implements NotificationChannel { ... }
class WhatsAppChannel implements NotificationChannel { ... } // NEW — no existing code changed

@Injectable()
class NotificationService {
  constructor(
    @Inject('CHANNELS') private channels: NotificationChannel[],
  ) {}

  async notifyAll(userId: string, msg: string) {
    await Promise.all(this.channels.map(ch => ch.send(userId, msg)));
  }
}</code></pre>

<h2>OCP in NestJS Architecture</h2>
<table>
  <tr><th>Feature</th><th>How It Achieves OCP</th></tr>
  <tr><td>Guards</td><td>Add new auth strategies without changing controllers</td></tr>
  <tr><td>Interceptors</td><td>Add logging, caching, transforms without modifying handlers</td></tr>
  <tr><td>Pipes</td><td>Add validation/transformation without touching business logic</td></tr>
  <tr><td>Custom Decorators</td><td>Add metadata-driven behavior without modifying the decorated class</td></tr>
  <tr><td>Modules</td><td>Register new providers without modifying existing ones</td></tr>
</table>

<h2>Common OCP Patterns</h2>
<table>
  <tr><th>Pattern</th><th>Use When</th><th>Example</th></tr>
  <tr><td>Strategy</td><td>Multiple algorithms, same interface</td><td>Payment processors, auth strategies</td></tr>
  <tr><td>Plugin/Registry</td><td>Dynamically discovered implementations</td><td>Webpack plugins, ESLint rules</td></tr>
  <tr><td>Template Method</td><td>Common skeleton with varying steps</td><td>Report generators (PDF, CSV, Excel)</td></tr>
  <tr><td>Decorator</td><td>Add behavior to existing objects</td><td>NestJS @UseGuards, @UseInterceptors</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How do you identify an OCP violation?</div>
  <div class="qa-a">Look for <strong>switch statements or if-else chains</strong> that grow when you add new types. If adding a new feature means modifying existing, tested code — that's an OCP violation. Another sign: a single function/class that imports many unrelated dependencies because it handles all variants internally. The fix is almost always to extract an interface and use polymorphism.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Isn't OCP impractical? Don't you always modify code?</div>
  <div class="qa-a">OCP doesn't mean you never modify anything — it means <strong>core logic</strong> stays stable while <strong>extensions</strong> are added. You'll still modify code for bug fixes or requirement changes. But for adding new variants (new payment type, new notification channel), you should be able to add a new class and register it, without changing existing classes. The key is identifying the <strong>axis of change</strong> — what varies? Extract that into a strategy.</div>
</div>

<div class="warning-note">In LLD interviews, if you find yourself writing a switch/case for types of vehicles, payment methods, or notification channels — stop and refactor to Strategy pattern. Interviewers specifically look for this.</div>
`,
  },
  {
    id: 'solid-lsp',
    title: 'Liskov Substitution Principle',
    category: 'SOLID',
    starterCode: `// LSP: Liskov Substitution Principle
// Subtypes must be usable wherever the base type is expected

// === BAD: Classic Rectangle/Square violation ===
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  setWidth(w) { this.width = w; }
  setHeight(h) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w) { this.width = w; this.height = w; } // Violates LSP!
  setHeight(h) { this.width = h; this.height = h; } // Violates LSP!
}

function testArea(rect) {
  rect.setWidth(5);
  rect.setHeight(4);
  const expected = 20; // 5 * 4
  const actual = rect.area();
  console.log('Expected: 20, Got:', actual, actual === 20 ? '✓' : '✗ LSP VIOLATED!');
}

console.log('=== BAD: LSP Violation ===');
testArea(new Rectangle(0, 0)); // Works: 20
testArea(new Square(0, 0));    // Fails: 16 (both set to 4)

// === GOOD: Proper abstraction ===
class Shape {
  area() { throw new Error('Must implement'); }
}

class GoodRectangle extends Shape {
  constructor(w, h) { super(); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

class GoodSquare extends Shape {
  constructor(side) { super(); this.side = side; }
  area() { return this.side * this.side; }
}

function printArea(shape) {
  console.log('Area:', shape.area());
}

console.log('\\n=== GOOD: LSP respected ===');
printArea(new GoodRectangle(5, 4)); // 20
printArea(new GoodSquare(5));        // 25
// Both are Shapes — substitutable, no surprises`,
    content: `
<h1>Liskov Substitution Principle (LSP)</h1>
<p><em>"Objects of a superclass should be replaceable with objects of a subclass without breaking the program."</em></p>
<p>If <code>S</code> is a subtype of <code>T</code>, then objects of type <code>T</code> can be replaced with objects of type <code>S</code> without altering the correctness of the program. In simpler terms: <strong>a subclass should behave exactly like its parent in the contexts where the parent is used</strong>.</p>

<h2>Classic Violation: Rectangle/Square</h2>
<pre><code>class Rectangle {
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area(): number { return this.width * this.height; }
}

class Square extends Rectangle {
  // Overriding to maintain invariant — but breaks LSP!
  setWidth(w: number) { this.width = w; this.height = w; }
  setHeight(h: number) { this.width = h; this.height = h; }
}

function doubleWidth(rect: Rectangle) {
  const originalHeight = rect.height;
  rect.setWidth(rect.width * 2);
  // Assumption: height unchanged — WRONG for Square!
  assert(rect.area() === rect.width * originalHeight); // FAILS
}</code></pre>

<h2>LSP in Backend Context: Database Adapters</h2>
<pre><code>// GOOD LSP — any adapter can replace another
interface IUserRepository {
  findById(id: string): Promise&lt;User | null&gt;;
  save(user: User): Promise&lt;User&gt;;
  delete(id: string): Promise&lt;void&gt;;
}

class PostgresUserRepo implements IUserRepository {
  async findById(id: string) { /* SQL query */ }
  async save(user: User) { /* INSERT/UPDATE */ }
  async delete(id: string) { /* DELETE */ }
}

class MongoUserRepo implements IUserRepository {
  async findById(id: string) { /* db.collection.findOne */ }
  async save(user: User) { /* insertOne/updateOne */ }
  async delete(id: string) { /* deleteOne */ }
}

// UserService works with ANY implementation — LSP satisfied
class UserService {
  constructor(private repo: IUserRepository) {}
  // Doesn't matter if repo is Postgres or Mongo
}</code></pre>

<h2>Common LSP Violations</h2>
<table>
  <tr><th>Violation</th><th>Why It Breaks LSP</th><th>Fix</th></tr>
  <tr><td>Subclass throws unexpected exception</td><td>Callers don't expect it</td><td>Only throw exceptions the parent contract allows</td></tr>
  <tr><td>Subclass returns different type</td><td>Callers rely on return type</td><td>Return same type or subtype (covariance)</td></tr>
  <tr><td>Subclass has stricter preconditions</td><td>"I only accept positive numbers" when parent accepts all</td><td>Preconditions can be equal or weaker</td></tr>
  <tr><td>Subclass has weaker postconditions</td><td>Doesn't guarantee what parent promised</td><td>Postconditions can be equal or stronger</td></tr>
  <tr><td>Subclass modifies state parent wouldn't</td><td>Square changing height when width is set</td><td>Don't override with incompatible behavior</td></tr>
</table>

<h2>LSP Rules Summary</h2>
<ul>
  <li><strong>Preconditions</strong> cannot be strengthened in a subtype</li>
  <li><strong>Postconditions</strong> cannot be weakened in a subtype</li>
  <li><strong>Invariants</strong> of the supertype must be preserved</li>
  <li><strong>No new exceptions</strong> that the supertype doesn't throw</li>
</ul>

<h2>Real-World Example: Cache Providers</h2>
<pre><code>interface ICacheProvider {
  get(key: string): Promise&lt;string | null&gt;;
  set(key: string, value: string, ttl?: number): Promise&lt;void&gt;;
  del(key: string): Promise&lt;void&gt;;
}

// Redis cache — full implementation
class RedisCacheProvider implements ICacheProvider { ... }

// In-memory cache — for local dev/testing
class InMemoryCacheProvider implements ICacheProvider { ... }

// BAD LSP violation:
class ReadOnlyCacheProvider implements ICacheProvider {
  async set() { throw new Error('Read only!'); } // VIOLATES LSP!
  async del() { throw new Error('Read only!'); } // VIOLATES LSP!
}
// Fix: Don't extend ICacheProvider; create IReadableCache instead</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How does LSP relate to TypeScript interfaces?</div>
  <div class="qa-a">TypeScript interfaces enforce <strong>structural contracts</strong> — any class implementing an interface must have all the specified methods with correct signatures. This provides compile-time LSP checking. However, LSP goes beyond type signatures — it also requires <strong>behavioral compatibility</strong>. TypeScript can't check that a subclass's <code>save()</code> actually persists data instead of silently doing nothing. That's where tests and code reviews come in. Use interfaces to define contracts, and integration tests to verify behavior.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Give a real scenario where LSP matters in microservices.</div>
  <div class="qa-a">Consider a notification microservice that sends messages via different providers (SendGrid, SES, Mailgun). All implement the same interface. If you swap from SendGrid to SES, the service should work identically — same input, same behavior. If SES silently drops emails over 10MB while SendGrid handles them, that's an LSP violation. The fix: document size limits in the interface contract and handle them consistently across all implementations.</div>
</div>

<div class="warning-note">LSP is often tested indirectly in interviews. When the interviewer says "now support a new vehicle type" in parking lot design, they're checking if your Vehicle hierarchy respects LSP — can Motorcycle be used wherever Vehicle is used?</div>
`,
  },
  {
    id: 'solid-isp',
    title: 'Interface Segregation Principle',
    category: 'SOLID',
    starterCode: `// ISP: Interface Segregation Principle
// Don't force classes to implement methods they don't need

// === BAD: Fat interface ===
class FullRepository {
  findById(id) { console.log('Find', id); }
  findAll() { console.log('Find all'); }
  save(entity) { console.log('Save', entity); }
  update(id, data) { console.log('Update', id); }
  delete(id) { console.log('Delete', id); }
  search(query) { console.log('Search', query); }
  aggregate(pipeline) { console.log('Aggregate', pipeline); }
  bulkInsert(items) { console.log('Bulk insert', items.length, 'items'); }
}

// A read-only reporting service is FORCED to have write methods
class ReportRepository extends FullRepository {
  save() { throw new Error('Reports are read-only!'); }
  update() { throw new Error('Reports are read-only!'); }
  delete() { throw new Error('Reports are read-only!'); }
  bulkInsert() { throw new Error('Reports are read-only!'); }
}

console.log('=== BAD: Fat interface ===');
const reportRepo = new ReportRepository();
reportRepo.findAll();
try { reportRepo.save('x'); } catch (e) { console.log('Error:', e.message); }

// === GOOD: Segregated interfaces ===
// In JS we compose with mixins/composition

class ReadableRepo {
  constructor(name) { this.name = name; }
  findById(id) { console.log(this.name + ': Find', id); }
  findAll() { console.log(this.name + ': Find all'); }
}

class WritableRepo {
  constructor(name) { this.name = name; }
  save(entity) { console.log(this.name + ': Save', entity); }
  update(id, data) { console.log(this.name + ': Update', id); }
  delete(id) { console.log(this.name + ': Delete', id); }
}

class SearchableRepo {
  constructor(name) { this.name = name; }
  search(query) { console.log(this.name + ': Search', query); }
}

// Full CRUD composes all three
class UserRepo {
  constructor() {
    this.reader = new ReadableRepo('UserRepo');
    this.writer = new WritableRepo('UserRepo');
    this.searcher = new SearchableRepo('UserRepo');
  }
  findById(id) { return this.reader.findById(id); }
  findAll() { return this.reader.findAll(); }
  save(e) { return this.writer.save(e); }
  search(q) { return this.searcher.search(q); }
}

// Read-only repo only uses ReadableRepo — no dummy methods!
class GoodReportRepo {
  constructor() {
    this.reader = new ReadableRepo('ReportRepo');
    this.searcher = new SearchableRepo('ReportRepo');
  }
  findAll() { return this.reader.findAll(); }
  search(q) { return this.searcher.search(q); }
}

console.log('\\n=== GOOD: Segregated interfaces ===');
const userRepo = new UserRepo();
userRepo.findAll();
userRepo.save({ name: 'Arvind' });

const goodReport = new GoodReportRepo();
goodReport.findAll();
goodReport.search('monthly');
console.log('No dummy methods needed!');`,
    content: `
<h1>Interface Segregation Principle (ISP)</h1>
<p><em>"No client should be forced to depend on methods it does not use."</em></p>
<p>Instead of one large interface, create <strong>multiple small, specific interfaces</strong>. Classes implement only the interfaces they actually need.</p>

<h2>Bad Example: Fat Interface</h2>
<pre><code>// BAD — One massive interface
interface IRepository&lt;T&gt; {
  findById(id: string): Promise&lt;T&gt;;
  findAll(): Promise&lt;T[]&gt;;
  save(entity: T): Promise&lt;T&gt;;
  update(id: string, data: Partial&lt;T&gt;): Promise&lt;T&gt;;
  delete(id: string): Promise&lt;void&gt;;
  search(query: string): Promise&lt;T[]&gt;;
  aggregate(pipeline: any[]): Promise&lt;any&gt;;
  bulkInsert(items: T[]): Promise&lt;void&gt;;
  softDelete(id: string): Promise&lt;void&gt;;
  restore(id: string): Promise&lt;void&gt;;
  count(): Promise&lt;number&gt;;
}

// A read-only analytics service is forced to implement write methods
class AnalyticsRepo implements IRepository&lt;AnalyticsEvent&gt; {
  save() { throw new Error('Read only!'); }        // Useless
  update() { throw new Error('Read only!'); }      // Useless
  delete() { throw new Error('Read only!'); }      // Useless
  // ... 4 more throw statements
}</code></pre>

<h2>Good Example: Segregated Interfaces</h2>
<pre><code>// GOOD — Small, focused interfaces
interface IReadable&lt;T&gt; {
  findById(id: string): Promise&lt;T | null&gt;;
  findAll(filter?: Partial&lt;T&gt;): Promise&lt;T[]&gt;;
}

interface IWritable&lt;T&gt; {
  save(entity: T): Promise&lt;T&gt;;
  update(id: string, data: Partial&lt;T&gt;): Promise&lt;T&gt;;
  delete(id: string): Promise&lt;void&gt;;
}

interface ISearchable&lt;T&gt; {
  search(query: string): Promise&lt;T[]&gt;;
  aggregate(pipeline: any[]): Promise&lt;any&gt;;
}

interface IBulkOperations&lt;T&gt; {
  bulkInsert(items: T[]): Promise&lt;void&gt;;
  bulkDelete(ids: string[]): Promise&lt;void&gt;;
}

// Full CRUD repo
class UserRepository implements IReadable&lt;User&gt;, IWritable&lt;User&gt;, ISearchable&lt;User&gt; {
  // Only implements what it needs
}

// Read-only analytics
class AnalyticsRepository implements IReadable&lt;Event&gt;, ISearchable&lt;Event&gt; {
  // No write methods — clean!
}

// Batch importer
class DataImporter implements IBulkOperations&lt;Record&gt; {
  // Only bulk operations
}</code></pre>

<h2>NestJS Example: Guards and Interceptors</h2>
<p>NestJS follows ISP by having separate, focused interfaces:</p>
<pre><code>// Each interface has ONE method — maximum ISP

interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise&lt;boolean&gt;;
}

interface NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable&lt;any&gt;;
}

interface PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any;
}

interface ExceptionFilter {
  catch(exception: any, host: ArgumentHost): void;
}

// You implement ONLY what you need
@Injectable()
class JwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) { /* JWT check */ }
  // NOT forced to implement intercept, transform, or catch
}</code></pre>

<h2>ISP Applied to Service Interfaces</h2>
<table>
  <tr><th>Fat Interface (Bad)</th><th>Segregated (Good)</th></tr>
  <tr><td><code>IUserService</code> with 20 methods</td><td><code>IUserAuth</code>, <code>IUserProfile</code>, <code>IUserAdmin</code></td></tr>
  <tr><td><code>IPaymentGateway</code> with charge + refund + subscribe + webhook + report</td><td><code>IChargeable</code>, <code>IRefundable</code>, <code>ISubscribable</code>, <code>IWebhookReceiver</code></td></tr>
  <tr><td><code>INotifier</code> with email + SMS + push + Slack + WhatsApp</td><td>Each channel implements <code>IMessageSender { send() }</code></td></tr>
</table>

<h2>How to Identify ISP Violations</h2>
<ul>
  <li>Methods that throw <code>NotImplementedError</code></li>
  <li>Empty method implementations (no-ops)</li>
  <li>A class that uses only 3 out of 10 methods from an interface</li>
  <li>Tests that require mocking 15 methods when you only test 2</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: How does ISP relate to microservice API design?</div>
  <div class="qa-a">ISP applies to API contracts too. Instead of one monolithic API endpoint that returns everything (<code>GET /user?include=profile,orders,reviews,settings,logs</code>), design focused endpoints: <code>GET /user/profile</code>, <code>GET /user/orders</code>. This is especially important for GraphQL vs REST — GraphQL naturally supports ISP by letting clients request only the fields they need. In Kafka, ISP means having specific event topics (<code>user.created</code>, <code>user.updated</code>) rather than one generic <code>user.event</code> topic.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What's the relationship between ISP and SRP?</div>
  <div class="qa-a">They're complementary. SRP is about <strong>implementations</strong> (a class should have one responsibility). ISP is about <strong>interfaces/contracts</strong> (a consumer should only see methods it needs). A class might correctly have 10 methods (one responsibility like CRUD), but expose them through multiple small interfaces so that consumers only depend on what they use.</div>
</div>

<div class="warning-note">In LLD interviews, when you define interfaces, keep them to 2-4 methods max. If an interface has 8+ methods, split it. The interviewer will appreciate clean, focused contracts.</div>
`,
  },
  {
    id: 'solid-dip',
    title: 'Dependency Inversion Principle',
    category: 'SOLID',
    starterCode: `// DIP: Dependency Inversion Principle
// High-level modules should not depend on low-level modules.
// Both should depend on abstractions.

// === BAD: Direct dependency on concretions ===
class MySQLDatabase {
  query(sql) { console.log('MySQL:', sql); return [{ id: 1 }]; }
}

class BadUserService {
  constructor() {
    // Directly creating dependency — tight coupling!
    this.db = new MySQLDatabase();
  }
  getUser(id) {
    return this.db.query('SELECT * FROM users WHERE id=' + id);
  }
}

console.log('=== BAD: Tight coupling ===');
const badService = new BadUserService();
badService.getUser(1);
console.log('Cannot swap to Postgres without modifying UserService!');

// === GOOD: Depend on abstractions (DIP + DI) ===
// "Interface" (contract) — any DB must implement these
class PostgresDB {
  query(sql) { console.log('PostgreSQL:', sql); return [{ id: 1 }]; }
}

class MongoDB {
  query(filter) { console.log('MongoDB:', JSON.stringify(filter)); return [{ id: 1 }]; }
}

class InMemoryDB {
  constructor() { this.data = [{ id: 1, name: 'Arvind' }]; }
  query(filter) {
    console.log('InMemory: searching...');
    return this.data;
  }
}

class GoodUserService {
  // Dependency is INJECTED — not created internally
  constructor(db) {
    this.db = db;
  }
  getUser(id) {
    return this.db.query({ id });
  }
}

console.log('\\n=== GOOD: DIP with injection ===');

// Production: use Postgres
const prodService = new GoodUserService(new PostgresDB());
prodService.getUser(1);

// Testing: use InMemory (no real DB needed!)
const testService = new GoodUserService(new InMemoryDB());
testService.getUser(1);

// Swap to Mongo: ZERO changes to UserService
const mongoService = new GoodUserService(new MongoDB());
mongoService.getUser(1);

console.log('\\nSame UserService, 3 different databases!');
console.log('This is the power of DIP + Dependency Injection.');`,
    content: `
<h1>Dependency Inversion Principle (DIP)</h1>
<p><em>"High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions."</em></p>
<p>This is the most impactful SOLID principle for backend engineering. Combined with <strong>Dependency Injection (DI)</strong>, it makes code testable, swappable, and decoupled.</p>

<h2>Bad Example: Direct Dependencies</h2>
<pre><code>// BAD — High-level UserService depends on low-level MySQLDatabase
class UserService {
  private db: MySQLDatabase;

  constructor() {
    this.db = new MySQLDatabase(); // TIGHT COUPLING
  }

  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}
// Problems:
// 1. Cannot test without a real MySQL database
// 2. Cannot swap to Postgres without modifying UserService
// 3. Cannot mock for unit tests</code></pre>

<h2>Good Example: Constructor Injection</h2>
<pre><code>// GOOD — Both depend on abstraction
interface IUserRepository {
  findById(id: string): Promise&lt;User | null&gt;;
  save(user: User): Promise&lt;User&gt;;
}

@Injectable()
class PostgresUserRepository implements IUserRepository {
  constructor(@InjectRepository(User) private repo: Repository&lt;User&gt;) {}
  findById(id: string) { return this.repo.findOne({ where: { id } }); }
  save(user: User) { return this.repo.save(user); }
}

@Injectable()
class UserService {
  // Depends on ABSTRACTION (interface), not concrete Postgres
  constructor(
    @Inject('IUserRepository') private repo: IUserRepository,
  ) {}

  async getUser(id: string) {
    return this.repo.findById(id);
  }
}

// NestJS module wires it up
@Module({
  providers: [
    UserService,
    { provide: 'IUserRepository', useClass: PostgresUserRepository },
  ],
})</code></pre>

<h2>NestJS DI Container — How It Works</h2>
<pre><code>// 1. NestJS scans @Module providers
// 2. Creates a DI container (IoC container)
// 3. When UserService is needed, it:
//    a. Looks at constructor params
//    b. Resolves each dependency from the container
//    c. Injects them automatically

// The container handles the entire lifecycle:
@Injectable({ scope: Scope.DEFAULT })   // Singleton (one instance)
@Injectable({ scope: Scope.REQUEST })    // New instance per request
@Injectable({ scope: Scope.TRANSIENT })  // New instance every injection</code></pre>

<h2>DIP Enables Testability</h2>
<pre><code>// Unit test — mock the repository
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked&lt;IUserRepository&gt;;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    // Inject mock — possible ONLY because of DIP
    service = new UserService(mockRepo);
  });

  it('should return user by id', async () => {
    const user = { id: '1', name: 'Arvind' };
    mockRepo.findById.mockResolvedValue(user);

    const result = await service.getUser('1');

    expect(result).toEqual(user);
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });
});</code></pre>

<h2>DI Patterns Comparison</h2>
<table>
  <tr><th>Pattern</th><th>How</th><th>Pros</th><th>Cons</th></tr>
  <tr><td>Constructor Injection</td><td>Pass deps via constructor</td><td>Explicit, testable, immutable</td><td>Long constructors</td></tr>
  <tr><td>Property Injection</td><td>Set deps after creation</td><td>Optional deps</td><td>Can be null, mutable</td></tr>
  <tr><td>Service Locator</td><td>Ask container for deps</td><td>Flexible</td><td>Hidden deps, hard to test</td></tr>
</table>

<h2>Real-World DIP: Swapping Implementations</h2>
<table>
  <tr><th>Abstraction</th><th>Dev</th><th>Staging</th><th>Production</th></tr>
  <tr><td>ICacheProvider</td><td>InMemoryCache</td><td>RedisCache</td><td>RedisCluster</td></tr>
  <tr><td>IEmailSender</td><td>ConsoleLogger</td><td>Mailhog</td><td>SendGrid</td></tr>
  <tr><td>IFileStorage</td><td>LocalFileSystem</td><td>MinIO</td><td>S3</td></tr>
  <tr><td>IMessageBroker</td><td>InMemoryQueue</td><td>Local Kafka</td><td>Confluent Kafka</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How does NestJS implement DIP?</div>
  <div class="qa-a">NestJS has a built-in <strong>IoC (Inversion of Control) container</strong>. You declare providers in modules using tokens (class references or string tokens). The container resolves dependency graphs automatically. For DIP, you use <strong>custom providers</strong>: <code>{ provide: 'IUserRepo', useClass: PostgresUserRepo }</code>. This decouples the consumer (UserService) from the implementation (PostgresUserRepo). To swap DBs, change <code>useClass</code> in the module — no service code changes. NestJS also supports <code>useFactory</code> for dynamic provider creation based on config.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What's the difference between DIP and DI?</div>
  <div class="qa-a"><strong>DIP is the principle</strong> — depend on abstractions, not concretions. <strong>DI is the technique</strong> — injecting dependencies from outside rather than creating them inside. You can follow DIP without a DI framework (just pass deps via constructor manually). A DI container (like NestJS's) automates the wiring. DI is one way to achieve DIP, but not the only way — the Factory pattern can also achieve DIP.</div>
</div>

<div class="warning-note">DIP is the most commonly tested SOLID principle in backend interviews. When designing any system, always ask: "Can I swap this component without modifying the consumer?" If yes, you've achieved DIP.</div>
`,
  },

  // ─────────────────────────────────────────────
  //  DESIGN PATTERNS
  // ─────────────────────────────────────────────
  {
    id: 'dp-overview',
    title: 'Design Patterns Overview',
    category: 'Design Patterns',
    starterCode: `// Design Patterns Quick Reference
// Demonstrating all three categories

// === CREATIONAL: How objects are created ===
class DatabaseConnection {
  static instance = null;
  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
      console.log('Created new DB connection');
    }
    return DatabaseConnection.instance;
  }
}

// === STRUCTURAL: How objects are composed ===
class PaymentGateway {
  charge(amount) { console.log('Gateway: charged $' + amount); }
}

class PaymentAdapter {
  constructor(gateway) { this.gateway = gateway; }
  processPayment(amountInCents) {
    // Adapts cents to dollars
    this.gateway.charge(amountInCents / 100);
  }
}

// === BEHAVIORAL: How objects communicate ===
class EventBus {
  constructor() { this.listeners = {}; }
  on(event, fn) {
    (this.listeners[event] = this.listeners[event] || []).push(fn);
  }
  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }
}

// Demo all three
console.log('=== Creational: Singleton ===');
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log('Same instance?', db1 === db2);

console.log('\\n=== Structural: Adapter ===');
const adapter = new PaymentAdapter(new PaymentGateway());
adapter.processPayment(4999); // 49.99 dollars

console.log('\\n=== Behavioral: Observer ===');
const bus = new EventBus();
bus.on('order.placed', (order) => console.log('Inventory: reserve items for order', order.id));
bus.on('order.placed', (order) => console.log('Email: confirmation for order', order.id));
bus.on('order.placed', (order) => console.log('Analytics: track order', order.id));
bus.emit('order.placed', { id: 'ORD-001', total: 49.99 });`,
    content: `
<h1>Design Patterns Overview</h1>
<p>Design patterns are <strong>reusable solutions to common software design problems</strong>. They were formalized by the Gang of Four (GoF) in 1994. In interviews, you'll be expected to recognize when to apply them and implement them in your LLD solutions.</p>

<h2>Three Categories</h2>
<table>
  <tr><th>Category</th><th>Purpose</th><th>Key Patterns</th></tr>
  <tr><td><strong>Creational</strong></td><td>Object creation mechanisms</td><td>Singleton, Factory, Builder, Prototype</td></tr>
  <tr><td><strong>Structural</strong></td><td>Object composition and relationships</td><td>Adapter, Decorator, Facade, Proxy</td></tr>
  <tr><td><strong>Behavioral</strong></td><td>Object interaction and communication</td><td>Observer, Strategy, Chain of Responsibility, Template Method</td></tr>
</table>

<h2>Most Important Patterns for Interviews</h2>
<p>You don't need all 23 GoF patterns. These are the ones that come up repeatedly in SDE-2/SDE-3 interviews:</p>
<table>
  <tr><th>Pattern</th><th>Category</th><th>When to Use</th><th>Real-World Example</th></tr>
  <tr><td><strong>Singleton</strong></td><td>Creational</td><td>Global shared resource</td><td>DB connection pool, Logger, Config</td></tr>
  <tr><td><strong>Factory</strong></td><td>Creational</td><td>Create objects without exposing creation logic</td><td>Notification sender (Email/SMS/Push)</td></tr>
  <tr><td><strong>Builder</strong></td><td>Creational</td><td>Complex object with many optional params</td><td>Query builder, HTTP request builder</td></tr>
  <tr><td><strong>Strategy</strong></td><td>Behavioral</td><td>Swap algorithms at runtime</td><td>Payment processors, auth strategies</td></tr>
  <tr><td><strong>Observer</strong></td><td>Behavioral</td><td>Event-driven communication</td><td>EventEmitter, Kafka consumers, webhooks</td></tr>
  <tr><td><strong>Adapter</strong></td><td>Structural</td><td>Make incompatible interfaces work together</td><td>Payment gateway adapter, API wrapper</td></tr>
  <tr><td><strong>Decorator</strong></td><td>Structural</td><td>Add behavior without modifying class</td><td>NestJS decorators, logging wrappers</td></tr>
</table>

<h2>Pattern Selection Guide</h2>
<pre><code>Need to...                          → Use
─────────────────────────────────────────────────────
Create one shared instance          → Singleton
Create objects by type              → Factory Method
Build complex objects step by step  → Builder
Swap algorithms at runtime          → Strategy
React to events/changes             → Observer
Make old API work with new code     → Adapter
Add behavior dynamically            → Decorator
Simplify complex subsystem          → Facade
Control access to an object         → Proxy
Define skeleton, vary steps         → Template Method</code></pre>

<h2>Patterns in Node.js / NestJS</h2>
<table>
  <tr><th>NestJS Feature</th><th>Pattern Used</th></tr>
  <tr><td><code>@Injectable()</code> default scope</td><td>Singleton</td></tr>
  <tr><td>Custom providers with <code>useFactory</code></td><td>Factory</td></tr>
  <tr><td>Guards (<code>CanActivate</code>)</td><td>Strategy</td></tr>
  <tr><td>Interceptors</td><td>Chain of Responsibility + Decorator</td></tr>
  <tr><td>Pipes</td><td>Chain of Responsibility</td></tr>
  <tr><td>Middleware</td><td>Chain of Responsibility</td></tr>
  <tr><td>EventEmitter module</td><td>Observer</td></tr>
  <tr><td>Custom decorators</td><td>Decorator</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How do you decide which pattern to use in an LLD interview?</div>
  <div class="qa-a">Start with the <strong>problem, not the pattern</strong>. Identify the axis of change — what varies? If you have multiple algorithms/strategies (payment methods, sort algorithms) → Strategy. If you need to notify multiple systems of an event → Observer. If object creation is complex → Factory or Builder. Don't force patterns; let them emerge from requirements. In interviews, name the pattern when you use it so the interviewer knows you're applying it deliberately.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Which patterns should I know for an SDE-2 interview?</div>
  <div class="qa-a">At minimum: <strong>Singleton, Factory, Strategy, Observer, Builder, Adapter</strong>. These cover 90% of LLD interview scenarios. Know them well enough to implement from scratch and explain trade-offs. For SDE-3, also know: Decorator, Proxy, Chain of Responsibility, and Template Method. The key isn't memorizing all patterns — it's recognizing the problem shape and applying the right one.</div>
</div>

<div class="warning-note">In LLD interviews, the interviewer doesn't expect you to name every pattern — they expect your design to naturally use them. If your parking lot system uses a Factory for vehicle creation and Strategy for pricing, that's excellent even if you never say the word "pattern."</div>
`,
  },
  {
    id: 'dp-singleton',
    title: 'Singleton Pattern',
    category: 'Design Patterns',
    starterCode: `// Singleton Pattern — Multiple Implementations

// === 1. Class-based Singleton ===
class Logger {
  static instance = null;

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
      console.log('Logger instance created');
    }
    return Logger.instance;
  }

  constructor() {
    this.logs = [];
  }

  log(message) {
    const entry = new Date().toISOString().split('T')[1].slice(0,8) + ' ' + message;
    this.logs.push(entry);
    console.log('[LOG]', entry);
  }

  getLogs() { return this.logs; }
}

// === 2. Module-based Singleton (Node.js default) ===
// In Node.js, modules are cached after first require()
// So exporting an instance IS a singleton:
// export const config = new Config(); // singleton by default

// === 3. Closure-based Singleton ===
const createConnectionPool = (() => {
  let pool = null;
  return (config) => {
    if (!pool) {
      pool = {
        config,
        connections: [],
        getConnection() {
          console.log('Getting connection from pool (max:', config.max, ')');
          return { id: Math.random().toString(36).slice(2, 8) };
        }
      };
      console.log('Connection pool created with config:', JSON.stringify(config));
    }
    return pool;
  };
})();

// Demo
console.log('=== Class-based Singleton ===');
const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();
logger1.log('Server started');
logger2.log('Request received');
console.log('Same instance?', logger1 === logger2);
console.log('All logs:', logger1.getLogs());

console.log('\\n=== Closure-based Singleton ===');
const pool1 = createConnectionPool({ max: 10, host: 'localhost' });
const pool2 = createConnectionPool({ max: 20, host: 'remote' }); // Config ignored!
console.log('Same pool?', pool1 === pool2);
pool1.getConnection();
pool2.getConnection();`,
    content: `
<h1>Singleton Pattern</h1>
<p>Ensures a class has <strong>only one instance</strong> and provides a global point of access to it. This is the simplest and most commonly used creational pattern.</p>

<h2>When to Use Singleton</h2>
<ul>
  <li><strong>Database connection pool</strong> — one pool shared across the app</li>
  <li><strong>Logger</strong> — single logging instance</li>
  <li><strong>Configuration</strong> — loaded once, used everywhere</li>
  <li><strong>Cache</strong> — one shared cache instance</li>
  <li><strong>Thread pool / Worker pool</strong></li>
</ul>

<h2>Implementation 1: Class-Based (TypeScript)</h2>
<pre><code>class DatabasePool {
  private static instance: DatabasePool;
  private connections: Connection[] = [];

  private constructor(private config: PoolConfig) {
    // Private constructor prevents direct instantiation
    this.initializePool();
  }

  static getInstance(config?: PoolConfig): DatabasePool {
    if (!DatabasePool.instance) {
      if (!config) throw new Error('Config required for first init');
      DatabasePool.instance = new DatabasePool(config);
    }
    return DatabasePool.instance;
  }

  async getConnection(): Promise&lt;Connection&gt; {
    // Return available connection from pool
  }
}</code></pre>

<h2>Implementation 2: Module-Based (Node.js)</h2>
<pre><code>// config.ts — Node.js caches modules after first import
// This IS a singleton by default

class Config {
  private data: Record&lt;string, any&gt;;

  constructor() {
    this.data = {
      dbHost: process.env.DB_HOST || 'localhost',
      dbPort: parseInt(process.env.DB_PORT || '5432'),
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    };
  }

  get(key: string) { return this.data[key]; }
}

// Everyone who imports this gets the SAME instance
export const config = new Config();</code></pre>

<h2>NestJS Default Scope IS Singleton</h2>
<pre><code>// NestJS providers are SINGLETON by default
@Injectable() // scope: Scope.DEFAULT (singleton)
class UserService {
  private cache = new Map();

  // This map is shared across ALL requests
  // because UserService is a singleton
}

// Other scopes available:
@Injectable({ scope: Scope.REQUEST })   // New instance per HTTP request
@Injectable({ scope: Scope.TRANSIENT }) // New instance per injection</code></pre>

<h2>Thread Safety in Node.js</h2>
<p>Node.js is <strong>single-threaded</strong> (for JS execution), so you don't need locks or synchronization for singletons — unlike Java or C++. However:</p>
<table>
  <tr><th>Concern</th><th>Java/C++</th><th>Node.js</th></tr>
  <tr><td>Thread safety</td><td>Need synchronized/lock</td><td>Not needed (single thread)</td></tr>
  <tr><td>Double-checked locking</td><td>Required</td><td>Not needed</td></tr>
  <tr><td>Worker threads</td><td>Shared memory</td><td>Separate V8 isolates — each worker has its own singleton</td></tr>
  <tr><td>Cluster mode</td><td>N/A</td><td>Each process has its own singleton — use Redis for shared state</td></tr>
</table>

<div class="warning-note">With Node.js cluster mode (PM2) or Kubernetes pods, each process has its own singleton instance. For truly shared state, use Redis or a database — not in-memory singletons.</div>

<h2>Singleton in Testing — The Problem</h2>
<pre><code>// Problem: singleton carries state between tests
const cache = CacheService.getInstance();
cache.set('user:1', { name: 'Test' });

// Next test sees this cached data! Tests are coupled.

// Solution 1: Reset method
class CacheService {
  static resetInstance() { CacheService.instance = null; }
}

// Solution 2: DI (better) — inject, don't use singleton directly
class UserService {
  constructor(private cache: ICacheService) {} // Mockable!
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Why is Singleton sometimes called an anti-pattern?</div>
  <div class="qa-a">Singleton becomes an anti-pattern when it's <strong>overused or misused</strong>. Problems: (1) <strong>Hidden dependencies</strong> — calling <code>Database.getInstance()</code> anywhere hides the dependency, making code hard to trace and test. (2) <strong>Global state</strong> — essentially a global variable, which makes tests order-dependent. (3) <strong>Tight coupling</strong> — every consumer is coupled to the singleton class. The solution: use a DI container (like NestJS) that manages singleton lifecycle. You get singleton behavior without the anti-pattern — dependencies are explicit, injected, and mockable.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does NestJS handle singleton scope with async operations?</div>
  <div class="qa-a">NestJS creates providers lazily during module initialization. For async setup (like DB connections), use <code>useFactory</code> with async: <code>{ provide: 'DB', useFactory: async () => await createConnection(config) }</code>. The container awaits the factory and caches the result. All subsequent injections get the same resolved instance. This is why NestJS module initialization is async (<code>app = await NestFactory.create()</code>).</div>
</div>
`,
  },
  {
    id: 'dp-factory',
    title: 'Factory Pattern',
    category: 'Design Patterns',
    starterCode: `// Factory Pattern — Creating objects without exposing creation logic

// === Simple Factory ===
class EmailNotifier {
  send(to, msg) { console.log('Email to ' + to + ': ' + msg); }
}
class SMSNotifier {
  send(to, msg) { console.log('SMS to ' + to + ': ' + msg); }
}
class PushNotifier {
  send(to, msg) { console.log('Push to ' + to + ': ' + msg); }
}
class SlackNotifier {
  send(to, msg) { console.log('Slack #' + to + ': ' + msg); }
}

class NotifierFactory {
  static create(type) {
    const notifiers = {
      email: EmailNotifier,
      sms: SMSNotifier,
      push: PushNotifier,
      slack: SlackNotifier,
    };
    const Notifier = notifiers[type];
    if (!Notifier) throw new Error('Unknown notifier: ' + type);
    return new Notifier();
  }
}

console.log('=== Simple Factory ===');
const emailer = NotifierFactory.create('email');
emailer.send('arvind@test.com', 'Welcome!');

const sms = NotifierFactory.create('sms');
sms.send('+91-9999999999', 'Your OTP is 1234');

// === Factory with Registry (extensible) ===
class NotifierRegistry {
  constructor() { this.registry = new Map(); }

  register(type, factory) {
    this.registry.set(type, factory);
    console.log('Registered notifier: ' + type);
  }

  create(type) {
    const factory = this.registry.get(type);
    if (!factory) throw new Error('Unknown: ' + type);
    return factory();
  }
}

console.log('\\n=== Registry-based Factory ===');
const registry = new NotifierRegistry();
registry.register('email', () => new EmailNotifier());
registry.register('sms', () => new SMSNotifier());
registry.register('slack', () => new SlackNotifier());

// Third-party can register their own!
registry.register('whatsapp', () => ({
  send(to, msg) { console.log('WhatsApp to ' + to + ': ' + msg); }
}));

const wa = registry.create('whatsapp');
wa.send('+91-9999999999', 'Hello from WhatsApp!');

// === Abstract Factory ===
function createDBAdapter(dbType) {
  const adapters = {
    postgres: {
      connect() { console.log('Connected to PostgreSQL'); },
      query(sql) { console.log('PG Query:', sql); return []; },
    },
    mongo: {
      connect() { console.log('Connected to MongoDB'); },
      query(filter) { console.log('Mongo Find:', JSON.stringify(filter)); return []; },
    },
  };
  return adapters[dbType] || (() => { throw new Error('Unknown DB'); })();
}

console.log('\\n=== Abstract Factory: DB Adapter ===');
const db = createDBAdapter('postgres');
db.connect();
db.query('SELECT * FROM users');`,
    content: `
<h1>Factory Pattern</h1>
<p>The Factory pattern <strong>encapsulates object creation logic</strong>, letting you create objects without exposing the instantiation details. There are three variants: Simple Factory, Factory Method, and Abstract Factory.</p>

<h2>Three Variants</h2>
<table>
  <tr><th>Variant</th><th>Description</th><th>Use Case</th></tr>
  <tr><td><strong>Simple Factory</strong></td><td>A single function/method that creates objects</td><td>Creating notification senders by type</td></tr>
  <tr><td><strong>Factory Method</strong></td><td>Subclasses decide which class to instantiate</td><td>Framework code that lets subclasses customize creation</td></tr>
  <tr><td><strong>Abstract Factory</strong></td><td>Creates families of related objects</td><td>Creating UI elements for different themes, DB adapters for different engines</td></tr>
</table>

<h2>Simple Factory: Notification Senders</h2>
<pre><code>interface NotificationSender {
  send(to: string, message: string): Promise&lt;void&gt;;
}

class EmailSender implements NotificationSender {
  async send(to: string, message: string) {
    await sendGrid.send({ to, body: message });
  }
}

class SMSSender implements NotificationSender {
  async send(to: string, message: string) {
    await twilio.messages.create({ to, body: message });
  }
}

class PushSender implements NotificationSender {
  async send(to: string, message: string) {
    await firebase.messaging().sendToDevice(to, { body: message });
  }
}

class NotificationFactory {
  static create(channel: 'email' | 'sms' | 'push'): NotificationSender {
    switch (channel) {
      case 'email': return new EmailSender();
      case 'sms':   return new SMSSender();
      case 'push':  return new PushSender();
      default: throw new Error(\`Unknown channel: \${channel}\`);
    }
  }
}</code></pre>

<h2>Factory with NestJS: Dynamic Providers</h2>
<pre><code>// NestJS useFactory for dynamic creation
@Module({
  providers: [
    {
      provide: 'DB_CONNECTION',
      useFactory: async (config: ConfigService) => {
        const dbType = config.get('DB_TYPE');
        switch (dbType) {
          case 'postgres':
            return new PostgresConnection(config.get('PG_URL'));
          case 'mysql':
            return new MySQLConnection(config.get('MYSQL_URL'));
          default:
            throw new Error('Unsupported DB');
        }
      },
      inject: [ConfigService],
    },
  ],
})</code></pre>

<h2>Registry-Based Factory (Extensible)</h2>
<pre><code>// Most flexible — supports runtime registration
@Injectable()
class NotificationRegistry {
  private senders = new Map&lt;string, () => NotificationSender&gt;();

  register(channel: string, factory: () => NotificationSender) {
    this.senders.set(channel, factory);
  }

  create(channel: string): NotificationSender {
    const factory = this.senders.get(channel);
    if (!factory) throw new Error(\`No sender for: \${channel}\`);
    return factory();
  }
}

// At startup, register all senders
registry.register('email', () => new EmailSender(sendGridConfig));
registry.register('sms', () => new SMSSender(twilioConfig));
// Third-party plugin can register their own sender!</code></pre>

<h2>Abstract Factory: Database Adapters</h2>
<pre><code>interface DatabaseAdapter {
  connect(): Promise&lt;void&gt;;
  query&lt;T&gt;(statement: string, params?: any[]): Promise&lt;T[]&gt;;
  close(): Promise&lt;void&gt;;
}

interface CacheAdapter {
  get(key: string): Promise&lt;string | null&gt;;
  set(key: string, value: string, ttl?: number): Promise&lt;void&gt;;
}

// Abstract Factory creates a family of related objects
interface InfraFactory {
  createDatabase(): DatabaseAdapter;
  createCache(): CacheAdapter;
}

class ProductionInfra implements InfraFactory {
  createDatabase() { return new PostgresAdapter(); }
  createCache() { return new RedisAdapter(); }
}

class TestingInfra implements InfraFactory {
  createDatabase() { return new SQLiteAdapter(); }
  createCache() { return new InMemoryCacheAdapter(); }
}</code></pre>

<h2>Factory vs Other Patterns</h2>
<table>
  <tr><th>Pattern</th><th>Purpose</th><th>Example</th></tr>
  <tr><td><strong>Factory</strong></td><td>Creates the right object type</td><td>"Give me a notifier for SMS"</td></tr>
  <tr><td><strong>Strategy</strong></td><td>Swaps behavior/algorithm at runtime</td><td>"Use LRU eviction for this cache"</td></tr>
  <tr><td><strong>Builder</strong></td><td>Constructs complex objects step by step</td><td>"Build a query with joins, where, order"</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: When would you use Factory over Strategy?</div>
  <div class="qa-a">Use <strong>Factory</strong> when the decision is <strong>which object to create</strong> — the type matters. Use <strong>Strategy</strong> when you have <strong>one type of object but want to swap its behavior</strong>. Example: Factory creates the right DB adapter (Postgres vs Mongo) based on config. Strategy swaps the caching algorithm (LRU vs LFU) on the same cache object. In practice, they often work together — a Factory creates the right Strategy implementation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Factory pattern help in testing?</div>
  <div class="qa-a">Instead of <code>new PostgresRepo()</code> scattered throughout your code, a factory centralizes creation. In tests, you swap the factory to return mock/stub implementations. With NestJS, the module's provider config IS your factory — swap <code>useClass: PostgresRepo</code> to <code>useClass: InMemoryRepo</code> in test modules. This is Factory + DIP working together.</div>
</div>

<div class="warning-note">In LLD interviews, use Factory whenever you need to create different types of a base entity — Vehicle types in parking lot, different payment methods, notification channels. Say "I'll use a Factory here" — it signals strong design thinking.</div>
`,
  },
  {
    id: 'dp-strategy',
    title: 'Strategy Pattern',
    category: 'Design Patterns',
    starterCode: `// Strategy Pattern — Swap algorithms at runtime

// === Caching Strategies ===
class LRUStrategy {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return null;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val); // Move to end (most recent)
    return val;
  }
  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
      console.log('  LRU evicted:', oldest);
    }
    this.cache.set(key, value);
  }
  name() { return 'LRU'; }
}

class FIFOStrategy {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  get(key) { return this.cache.get(key) || null; }
  set(key, value) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const first = this.cache.keys().next().value;
      this.cache.delete(first);
      console.log('  FIFO evicted:', first);
    }
    this.cache.set(key, value);
  }
  name() { return 'FIFO'; }
}

// CacheService delegates to strategy — doesn't know which one
class CacheService {
  constructor(strategy) {
    this.strategy = strategy;
    console.log('Cache using', strategy.name(), 'strategy');
  }
  get(key) { return this.strategy.get(key); }
  set(key, value) { this.strategy.set(key, value); }
  // Can swap strategy at runtime!
  setStrategy(strategy) {
    this.strategy = strategy;
    console.log('Switched to', strategy.name());
  }
}

// Demo
console.log('=== LRU Strategy ===');
const cache = new CacheService(new LRUStrategy(3));
cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
cache.get('a');      // Access 'a' — now most recent
cache.set('d', 4);   // Evicts 'b' (least recently used)

console.log('\\n=== Switch to FIFO at runtime ===');
cache.setStrategy(new FIFOStrategy(3));
cache.set('x', 10);
cache.set('y', 20);
cache.set('z', 30);
cache.set('w', 40);  // Evicts 'x' (first in)

// === Auth Strategy Example ===
class JwtStrategy {
  validate(request) {
    const token = request.headers.authorization;
    console.log('JWT: validating token', token);
    return { userId: '123', method: 'jwt' };
  }
}

class ApiKeyStrategy {
  validate(request) {
    const key = request.headers['x-api-key'];
    console.log('API Key: validating', key);
    return { userId: '456', method: 'api-key' };
  }
}

console.log('\\n=== Auth Strategy ===');
const jwtAuth = new JwtStrategy();
const apiAuth = new ApiKeyStrategy();

jwtAuth.validate({ headers: { authorization: 'Bearer eyJ...' } });
apiAuth.validate({ headers: { 'x-api-key': 'sk-abc123' } });`,
    content: `
<h1>Strategy Pattern</h1>
<p>The Strategy pattern defines a <strong>family of algorithms, encapsulates each one, and makes them interchangeable</strong>. The client delegates to a strategy object rather than implementing the algorithm directly.</p>

<h2>When to Use Strategy</h2>
<ul>
  <li>Multiple algorithms for the same task (sorting, caching, auth)</li>
  <li>You want to swap behavior at runtime without if-else chains</li>
  <li>Different clients need different algorithms</li>
  <li>You want to isolate algorithm logic for independent testing</li>
</ul>

<h2>Real Example 1: Caching Strategies</h2>
<pre><code>interface CacheStrategy&lt;K, V&gt; {
  get(key: K): V | null;
  set(key: K, value: V): void;
  evict(): void;
}

class LRUCacheStrategy&lt;K, V&gt; implements CacheStrategy&lt;K, V&gt; {
  private cache = new Map&lt;K, V&gt;();
  constructor(private maxSize: number) {}

  get(key: K): V | null {
    if (!this.cache.has(key)) return null;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val); // Move to most recently used
    return val;
  }

  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) this.evict();
    this.cache.set(key, value);
  }

  evict() {
    const oldest = this.cache.keys().next().value;
    this.cache.delete(oldest);
  }
}

class LFUCacheStrategy&lt;K, V&gt; implements CacheStrategy&lt;K, V&gt; {
  private cache = new Map&lt;K, { value: V; freq: number }&gt;();
  // ... frequency-based eviction
}

class TTLCacheStrategy&lt;K, V&gt; implements CacheStrategy&lt;K, V&gt; {
  private cache = new Map&lt;K, { value: V; expiresAt: number }&gt;();
  // ... time-based eviction
}

@Injectable()
class CacheService {
  constructor(@Inject('CACHE_STRATEGY') private strategy: CacheStrategy) {}
  // Delegates entirely to strategy — doesn't know LRU from LFU
}</code></pre>

<h2>Real Example 2: Authentication Strategies</h2>
<pre><code>interface AuthStrategy {
  validate(request: Request): Promise&lt;AuthPayload | null&gt;;
}

class JwtStrategy implements AuthStrategy {
  async validate(req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return jwt.verify(token, secret);
  }
}

class ApiKeyStrategy implements AuthStrategy {
  async validate(req: Request) {
    const key = req.headers['x-api-key'];
    return this.apiKeyRepo.findByKey(key);
  }
}

class OAuth2Strategy implements AuthStrategy {
  async validate(req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.oauthProvider.introspect(token);
  }
}

// NestJS Guard using Strategy
@Injectable()
class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_STRATEGIES') private strategies: AuthStrategy[],
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    for (const strategy of this.strategies) {
      const result = await strategy.validate(req);
      if (result) { req.user = result; return true; }
    }
    throw new UnauthorizedException();
  }
}</code></pre>

<h2>NestJS Guards as Strategy Pattern</h2>
<p>NestJS Guards are essentially Strategy pattern implementations:</p>
<pre><code>// Each guard implements the same interface (CanActivate)
// but with different validation logic
@UseGuards(JwtAuthGuard)     // Strategy 1: JWT
@UseGuards(ApiKeyGuard)      // Strategy 2: API Key
@UseGuards(RolesGuard)       // Strategy 3: Role-based

// Passport.js is literally called "passport-strategy"
// Each auth method (local, google, github) is a Strategy</code></pre>

<h2>Comparison Table</h2>
<table>
  <tr><th>Pattern</th><th>Intent</th><th>When to Use</th></tr>
  <tr><td><strong>Strategy</strong></td><td>Swap algorithms, same interface</td><td>Multiple ways to do the same thing</td></tr>
  <tr><td><strong>Factory</strong></td><td>Create the right object type</td><td>Different object types needed</td></tr>
  <tr><td><strong>Template Method</strong></td><td>Fixed skeleton, varying steps</td><td>Common workflow, different details</td></tr>
  <tr><td><strong>State</strong></td><td>Change behavior based on state</td><td>Object behaves differently in different states</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How does Strategy differ from simple if/else or switch?</div>
  <div class="qa-a">An if/else chain puts all algorithm logic in one place — violating OCP. With Strategy, each algorithm is a <strong>separate class</strong> that can be (1) tested independently, (2) added without modifying existing code, (3) swapped at runtime. The Strategy pattern also enables <strong>dependency injection</strong> — you can inject different strategies for different environments (Redis cache in prod, in-memory in tests).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can you swap strategies at runtime?</div>
  <div class="qa-a">Yes, that's a key advantage. Example: a rate limiter could use Token Bucket during normal load and switch to Sliding Window during traffic spikes. The context class holds a reference to the current strategy and can replace it. In NestJS, you'd use <code>Scope.REQUEST</code> or a factory that decides the strategy per request based on headers, user tier, or config flags.</div>
</div>

<div class="warning-note">In LLD interviews, whenever you find yourself writing a switch statement on "type" — stop and consider Strategy pattern. It's the most common pattern interviewers expect to see in payment systems, notification systems, and authentication flows.</div>
`,
  },
  {
    id: 'dp-observer',
    title: 'Observer Pattern',
    category: 'Design Patterns',
    starterCode: `// Observer Pattern — Event-driven communication

// === Simple EventEmitter implementation ===
class EventEmitter {
  constructor() { this.listeners = {}; }

  on(event, callback) {
    (this.listeners[event] = this.listeners[event] || []).push(callback);
    return this; // Allow chaining
  }

  off(event, callback) {
    this.listeners[event] = (this.listeners[event] || [])
      .filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    console.log('Event:', event);
    (this.listeners[event] || []).forEach(cb => cb(...args));
  }
}

// === Order System using Observer ===
class OrderService extends EventEmitter {
  placeOrder(order) {
    console.log('\\nOrder placed:', order.id, '- $' + order.total);
    this.emit('order.placed', order);
  }

  cancelOrder(orderId) {
    console.log('\\nOrder cancelled:', orderId);
    this.emit('order.cancelled', { orderId });
  }
}

// Subscribers (observers) — each handles its own concern
class InventoryService {
  onOrderPlaced(order) {
    console.log('  Inventory: Reserved items for', order.id);
  }
  onOrderCancelled({ orderId }) {
    console.log('  Inventory: Released items for', orderId);
  }
}

class EmailService {
  onOrderPlaced(order) {
    console.log('  Email: Confirmation sent for', order.id);
  }
}

class AnalyticsService {
  onOrderPlaced(order) {
    console.log('  Analytics: Tracked order', order.id, '($' + order.total + ')');
  }
}

class LoyaltyService {
  onOrderPlaced(order) {
    const points = Math.floor(order.total);
    console.log('  Loyalty: Added', points, 'points for', order.id);
  }
}

// Wire up observers
const orderService = new OrderService();
const inventory = new InventoryService();
const email = new EmailService();
const analytics = new AnalyticsService();
const loyalty = new LoyaltyService();

orderService.on('order.placed', (o) => inventory.onOrderPlaced(o));
orderService.on('order.placed', (o) => email.onOrderPlaced(o));
orderService.on('order.placed', (o) => analytics.onOrderPlaced(o));
orderService.on('order.placed', (o) => loyalty.onOrderPlaced(o));
orderService.on('order.cancelled', (o) => inventory.onOrderCancelled(o));

// Place an order — all observers notified automatically!
orderService.placeOrder({ id: 'ORD-001', total: 149.99, items: ['Laptop Stand'] });
orderService.placeOrder({ id: 'ORD-002', total: 29.99, items: ['Mouse Pad'] });
orderService.cancelOrder('ORD-002');`,
    content: `
<h1>Observer Pattern</h1>
<p>The Observer pattern defines a <strong>one-to-many dependency</strong> between objects: when one object (the subject/publisher) changes state, all its dependents (observers/subscribers) are notified automatically.</p>

<h2>Core Concept</h2>
<pre><code>Publisher (Subject)           Observers (Subscribers)
┌──────────────┐
│  OrderService │──notify──→  InventoryService
│              │──notify──→  EmailService
│  emit('order │──notify──→  AnalyticsService
│    .placed') │──notify──→  LoyaltyService
└──────────────┘</code></pre>

<h2>Node.js EventEmitter — Built-in Observer</h2>
<pre><code>import { EventEmitter } from 'events';

class OrderService extends EventEmitter {
  async placeOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.save(dto);

    // Emit event — all observers notified
    this.emit('order.placed', order);
    this.emit('order.total.updated', order.total);

    return order;
  }
}

// Register observers
const orderService = new OrderService();
orderService.on('order.placed', (order) => inventoryService.reserve(order));
orderService.on('order.placed', (order) => emailService.sendConfirmation(order));
orderService.on('order.placed', (order) => analyticsService.track(order));</code></pre>

<h2>NestJS Event-Based Approach</h2>
<pre><code>// Using @nestjs/event-emitter (built on eventemitter2)
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
class OrderService {
  constructor(private eventEmitter: EventEmitter2) {}

  async placeOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.save(dto);
    this.eventEmitter.emit('order.placed', new OrderPlacedEvent(order));
    return order;
  }
}

// Listeners in separate files — clean SRP
@Injectable()
class InventoryListener {
  @OnEvent('order.placed')
  handleOrderPlaced(event: OrderPlacedEvent) {
    // Reserve inventory
  }
}

@Injectable()
class EmailListener {
  @OnEvent('order.placed')
  handleOrderPlaced(event: OrderPlacedEvent) {
    // Send confirmation email
  }
}</code></pre>

<h2>Kafka Consumer Groups as Distributed Observer</h2>
<pre><code>// Kafka takes Observer to distributed systems level
// Producer (Publisher)
await this.kafka.emit('order-events', {
  key: order.id,
  value: JSON.stringify({ type: 'ORDER_PLACED', data: order }),
});

// Consumer Group 1: Inventory Service (separate microservice)
@MessagePattern('order-events')
handleOrder(event: OrderEvent) {
  if (event.type === 'ORDER_PLACED') this.reserveInventory(event.data);
}

// Consumer Group 2: Analytics Service (separate microservice)
// Each consumer group gets its own copy of every message</code></pre>

<h2>Observer vs Pub/Sub</h2>
<table>
  <tr><th>Aspect</th><th>Observer</th><th>Pub/Sub</th></tr>
  <tr><td>Coupling</td><td>Subject knows observers directly</td><td>Publisher doesn't know subscribers</td></tr>
  <tr><td>Mediator</td><td>No — direct notification</td><td>Yes — message broker (Kafka, Redis)</td></tr>
  <tr><td>Scope</td><td>Same process</td><td>Cross-process, cross-service</td></tr>
  <tr><td>Node.js example</td><td>EventEmitter</td><td>Kafka, Redis Pub/Sub, RabbitMQ</td></tr>
  <tr><td>Delivery</td><td>Synchronous (by default)</td><td>Asynchronous</td></tr>
</table>

<h2>Gotchas</h2>
<ul>
  <li><strong>Memory leaks</strong> — forgetting to remove listeners. Use <code>removeListener</code> or <code>once()</code></li>
  <li><strong>Error handling</strong> — one failing observer shouldn't break others. Wrap in try/catch</li>
  <li><strong>Ordering</strong> — observers are called in registration order, but don't rely on it</li>
  <li><strong>Async observers</strong> — <code>emit()</code> doesn't await async listeners by default</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: How does Observer differ from Pub/Sub?</div>
  <div class="qa-a">Observer is a <strong>tight coupling</strong> pattern — the subject maintains a direct list of observers and notifies them. Pub/Sub adds a <strong>message broker</strong> as an intermediary — publishers send messages to topics, subscribers listen to topics, neither knows about the other. In Node.js, <code>EventEmitter</code> is Observer (direct). Kafka, Redis Pub/Sub, and RabbitMQ are Pub/Sub (brokered). Use Observer within a single service, Pub/Sub across microservices.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle a failing observer?</div>
  <div class="qa-a">In Node.js EventEmitter, if one listener throws, subsequent listeners don't execute. Solutions: (1) Wrap each listener in try/catch. (2) Use <code>@nestjs/event-emitter</code> which handles errors per listener. (3) For critical operations (payment → inventory), use a <strong>transactional outbox pattern</strong> instead of in-process events — write events to a DB table, then process them asynchronously with retry logic. This is especially important in microservices with Kafka.</div>
</div>

<div class="warning-note">In LLD interviews, use Observer when you hear "when X happens, Y and Z should also happen." Order placed → notify inventory + email + analytics is the classic example. Name it explicitly: "I'll use the Observer pattern here with an event emitter."</div>
`,
  },
  {
    id: 'dp-builder',
    title: 'Builder Pattern',
    category: 'Design Patterns',
    starterCode: `// Builder Pattern — Complex object construction with fluent API

// === Query Builder ===
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._select = ['*'];
    this._where = [];
    this._joins = [];
    this._orderBy = null;
    this._limit = null;
    this._offset = null;
  }

  select(...columns) {
    this._select = columns;
    return this; // Enable chaining
  }

  where(condition, value) {
    this._where.push({ condition, value });
    return this;
  }

  join(table, on) {
    this._joins.push({ table, on });
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this._orderBy = { column, direction };
    return this;
  }

  limit(n) { this._limit = n; return this; }
  offset(n) { this._offset = n; return this; }

  build() {
    let sql = 'SELECT ' + this._select.join(', ');
    sql += ' FROM ' + this.table;
    this._joins.forEach(j => {
      sql += ' JOIN ' + j.table + ' ON ' + j.on;
    });
    if (this._where.length) {
      sql += ' WHERE ' + this._where.map(w => w.condition).join(' AND ');
    }
    if (this._orderBy) {
      sql += ' ORDER BY ' + this._orderBy.column + ' ' + this._orderBy.direction;
    }
    if (this._limit) sql += ' LIMIT ' + this._limit;
    if (this._offset) sql += ' OFFSET ' + this._offset;
    return sql;
  }
}

// Usage — fluent, readable API
const query = new QueryBuilder('users')
  .select('u.id', 'u.name', 'u.email', 'o.total')
  .join('orders o', 'o.user_id = u.id')
  .where('u.active = true')
  .where('o.total > 100')
  .orderBy('o.total', 'DESC')
  .limit(10)
  .offset(20)
  .build();

console.log('Generated SQL:');
console.log(query);

// === API Response Builder ===
class ApiResponseBuilder {
  constructor() {
    this._status = 200;
    this._data = null;
    this._meta = {};
    this._errors = [];
  }

  status(code) { this._status = code; return this; }
  data(d) { this._data = d; return this; }
  meta(key, value) { this._meta[key] = value; return this; }
  error(msg) { this._errors.push(msg); return this; }

  build() {
    const response = { status: this._status };
    if (this._data) response.data = this._data;
    if (Object.keys(this._meta).length) response.meta = this._meta;
    if (this._errors.length) response.errors = this._errors;
    return response;
  }
}

console.log('\\n--- API Response ---');
const success = new ApiResponseBuilder()
  .status(200)
  .data({ users: [{ id: 1, name: 'Arvind' }] })
  .meta('page', 1)
  .meta('total', 42)
  .meta('perPage', 10)
  .build();

console.log(JSON.stringify(success, null, 2));

const error = new ApiResponseBuilder()
  .status(400)
  .error('Email is required')
  .error('Password must be 8+ characters')
  .build();

console.log(JSON.stringify(error, null, 2));`,
    content: `
<h1>Builder Pattern</h1>
<p>The Builder pattern <strong>separates the construction of a complex object from its representation</strong>. It's especially useful when an object has many optional parameters or when the construction process involves multiple steps.</p>

<h2>When to Use Builder</h2>
<ul>
  <li>Object has many constructor parameters (5+), most optional</li>
  <li>Object construction involves multiple steps</li>
  <li>You want a fluent API (method chaining)</li>
  <li>Same construction process should create different representations</li>
</ul>

<h2>Real Example 1: PostgreSQL Query Builder</h2>
<pre><code>class QueryBuilder {
  private table: string;
  private selectCols: string[] = ['*'];
  private whereClauses: string[] = [];
  private params: any[] = [];
  private joinClauses: string[] = [];
  private orderByClause?: string;
  private limitVal?: number;
  private offsetVal?: number;

  constructor(table: string) { this.table = table; }

  select(...cols: string[]): this {
    this.selectCols = cols;
    return this;
  }

  where(clause: string, ...params: any[]): this {
    this.whereClauses.push(clause);
    this.params.push(...params);
    return this;
  }

  join(table: string, on: string): this {
    this.joinClauses.push(\`JOIN \${table} ON \${on}\`);
    return this;
  }

  orderBy(col: string, dir: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause = \`\${col} \${dir}\`;
    return this;
  }

  limit(n: number): this { this.limitVal = n; return this; }
  offset(n: number): this { this.offsetVal = n; return this; }

  build(): { sql: string; params: any[] } {
    let sql = \`SELECT \${this.selectCols.join(', ')} FROM \${this.table}\`;
    // ... assemble query
    return { sql, params: this.params };
  }
}

// Clean, readable usage
const { sql, params } = new QueryBuilder('orders')
  .select('o.id', 'o.total', 'u.name')
  .join('users u', 'u.id = o.user_id')
  .where('o.status = $1', 'completed')
  .where('o.total > $2', 100)
  .orderBy('o.created_at', 'DESC')
  .limit(20)
  .build();</code></pre>

<h2>Real Example 2: API Response Builder</h2>
<pre><code>class ApiResponse&lt;T&gt; {
  status: number;
  data?: T;
  meta?: Record&lt;string, any&gt;;
  errors?: string[];

  static builder&lt;T&gt;() { return new ApiResponseBuilder&lt;T&gt;(); }
}

class ApiResponseBuilder&lt;T&gt; {
  private response: Partial&lt;ApiResponse&lt;T&gt;&gt; = {};

  status(code: number): this { this.response.status = code; return this; }
  data(data: T): this { this.response.data = data; return this; }
  meta(key: string, value: any): this {
    this.response.meta = { ...this.response.meta, [key]: value };
    return this;
  }
  error(msg: string): this {
    this.response.errors = [...(this.response.errors || []), msg];
    return this;
  }

  build(): ApiResponse&lt;T&gt; {
    return this.response as ApiResponse&lt;T&gt;;
  }
}

// Usage in NestJS controller
@Get()
async findAll(@Query() query: PaginationDto) {
  const [users, total] = await this.userService.findAll(query);
  return ApiResponse.builder()
    .status(200)
    .data(users)
    .meta('page', query.page)
    .meta('total', total)
    .meta('perPage', query.limit)
    .build();
}</code></pre>

<h2>Builder vs Other Patterns</h2>
<table>
  <tr><th>Pattern</th><th>Creates</th><th>How</th></tr>
  <tr><td><strong>Builder</strong></td><td>One complex object step by step</td><td>Fluent API with multiple configuration methods</td></tr>
  <tr><td><strong>Factory</strong></td><td>One of several types</td><td>Single method call, type determined by parameter</td></tr>
  <tr><td><strong>Constructor</strong></td><td>Object in one call</td><td>All parameters at once — gets unwieldy with 10+ params</td></tr>
</table>

<h2>Builder with Validation</h2>
<pre><code>class EmailBuilder {
  private email: Partial&lt;Email&gt; = {};

  to(address: string): this { this.email.to = address; return this; }
  subject(s: string): this { this.email.subject = s; return this; }
  body(b: string): this { this.email.body = b; return this; }
  cc(addresses: string[]): this { this.email.cc = addresses; return this; }
  attachment(file: Buffer): this { this.email.attachment = file; return this; }

  build(): Email {
    // Validate required fields
    if (!this.email.to) throw new Error('Recipient required');
    if (!this.email.subject) throw new Error('Subject required');
    if (!this.email.body) throw new Error('Body required');
    return this.email as Email;
  }
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: When should you use Builder instead of just a constructor with an options object?</div>
  <div class="qa-a">Use an <strong>options object</strong> (<code>new User({ name, email, age? })</code>) when you have a few optional params and no construction logic. Use <strong>Builder</strong> when: (1) construction has <strong>multiple steps</strong> that depend on each other, (2) you need <strong>validation at build time</strong>, (3) you want a <strong>fluent, readable API</strong> for complex objects, (4) the same builder process should create different representations. In TypeScript, options objects with default values often suffice — Builder shines when construction is procedural (query building, document assembly).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Name a real-world Builder you've used.</div>
  <div class="qa-a">TypeORM's <code>QueryBuilder</code> is a classic: <code>repo.createQueryBuilder('user').where('user.active = :active', { active: true }).leftJoinAndSelect('user.orders', 'order').orderBy('order.date', 'DESC').take(10).getMany()</code>. Knex.js query builder, Elasticsearch's body builder, and even Joi schema builder (<code>Joi.string().email().required()</code>) all use this pattern. The fluent API makes complex configurations readable.</div>
</div>

<div class="warning-note">In LLD interviews, use Builder when your object has 5+ fields and especially when some are optional. The interviewer will appreciate clean construction code over a 15-parameter constructor.</div>
`,
  },
  {
    id: 'dp-decorator-adapter',
    title: 'Decorator & Adapter Patterns',
    category: 'Design Patterns',
    starterCode: `// Decorator & Adapter Patterns

// === DECORATOR: Add behavior without modifying the class ===

// Base logging service
class LoggerService {
  log(message) {
    console.log('[LOG]', message);
  }
}

// Decorator: adds timestamp
class TimestampLogger {
  constructor(logger) {
    this.logger = logger;
  }
  log(message) {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    this.logger.log('[' + time + '] ' + message);
  }
}

// Decorator: adds JSON formatting
class JsonLogger {
  constructor(logger) {
    this.logger = logger;
  }
  log(message) {
    this.logger.log(JSON.stringify({ msg: message, level: 'info' }));
  }
}

console.log('=== Decorator Pattern ===');
let logger = new LoggerService();
logger.log('Basic log');

logger = new TimestampLogger(logger);
logger.log('With timestamp');

logger = new JsonLogger(new TimestampLogger(new LoggerService()));
logger.log('Stacked decorators');

// === ADAPTER: Make incompatible interfaces work together ===

// Old Payment Gateway (third-party, can't modify)
class StripeGateway {
  createCharge(amountCents, currency, cardToken) {
    console.log('Stripe: charged', amountCents, 'cents (' + currency + ')');
    return { id: 'ch_stripe_123', status: 'succeeded' };
  }
}

// Another Gateway with different API
class RazorpayGateway {
  createPayment(amountPaise, options) {
    console.log('Razorpay: charged', amountPaise, 'paise');
    return { payment_id: 'pay_rzp_456', status: 'captured' };
  }
}

// Our unified interface (what our code expects)
// Adapter for Stripe
class StripeAdapter {
  constructor() { this.gateway = new StripeGateway(); }

  charge(amount, currency, paymentMethod) {
    const amountCents = Math.round(amount * 100);
    const result = this.gateway.createCharge(amountCents, currency, paymentMethod);
    return { transactionId: result.id, success: result.status === 'succeeded' };
  }
}

// Adapter for Razorpay
class RazorpayAdapter {
  constructor() { this.gateway = new RazorpayGateway(); }

  charge(amount, currency, paymentMethod) {
    const amountPaise = Math.round(amount * 100);
    const result = this.gateway.createPayment(amountPaise, { currency, method: paymentMethod });
    return { transactionId: result.payment_id, success: result.status === 'captured' };
  }
}

console.log('\\n=== Adapter Pattern ===');
// Our code works with any adapter — same interface
function processOrder(paymentAdapter, amount) {
  const result = paymentAdapter.charge(amount, 'INR', 'card_token');
  console.log('Result:', JSON.stringify(result));
}

processOrder(new StripeAdapter(), 499.00);
processOrder(new RazorpayAdapter(), 499.00);
console.log('\\nSame interface, different gateways!');`,
    content: `
<h1>Decorator & Adapter Patterns</h1>
<p>Two structural patterns that solve different problems: <strong>Decorator</strong> adds behavior to objects, while <strong>Adapter</strong> makes incompatible interfaces work together.</p>

<h2>Decorator Pattern</h2>
<p><em>Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing.</em></p>

<h3>NestJS Decorators</h3>
<p>NestJS uses TypeScript decorators extensively — they're a core part of the framework:</p>
<pre><code>// Built-in decorators
@Controller('users')      // Class decorator
@Injectable()             // Marks class for DI
@UseGuards(AuthGuard)     // Method decorator — adds auth check

class UserController {
  @Get(':id')             // Method decorator — route mapping
  @UseInterceptors(CacheInterceptor)  // Adds caching behavior
  async findOne(
    @Param('id') id: string,    // Parameter decorator
    @Query('fields') fields: string,
  ) { ... }
}

// Custom decorator
function Log(): MethodDecorator {
  return (target, key, descriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args) {
      console.log(\`Calling \${String(key)} with\`, args);
      const result = original.apply(this, args);
      console.log(\`\${String(key)} returned\`, result);
      return result;
    };
  };
}

class OrderService {
  @Log()
  processOrder(orderId: string) { /* ... */ }
}</code></pre>

<h3>Decorator as Wrapper (Classic GoF)</h3>
<pre><code>// Base interface
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) { console.log(message); }
}

// Decorator: adds timestamp
class TimestampDecorator implements Logger {
  constructor(private wrapped: Logger) {}
  log(message: string) {
    this.wrapped.log(\`[\${new Date().toISOString()}] \${message}\`);
  }
}

// Decorator: adds log level
class LevelDecorator implements Logger {
  constructor(private wrapped: Logger, private level: string) {}
  log(message: string) {
    this.wrapped.log(\`[\${this.level}] \${message}\`);
  }
}

// Stack decorators — each adds behavior
const logger = new TimestampDecorator(
  new LevelDecorator(
    new ConsoleLogger(),
    'INFO'
  )
);
logger.log('User created');
// Output: [2024-01-15T10:30:00.000Z] [INFO] User created</code></pre>

<h2>Adapter Pattern</h2>
<p><em>Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise due to incompatible interfaces.</em></p>

<h3>Real Example: Payment Gateway Adapter</h3>
<pre><code>// Our unified interface
interface PaymentGateway {
  charge(amount: number, currency: string, method: PaymentMethod): Promise&lt;PaymentResult&gt;;
  refund(transactionId: string, amount: number): Promise&lt;RefundResult&gt;;
}

// Stripe has its own API
class StripeAdapter implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async charge(amount: number, currency: string, method: PaymentMethod) {
    // Adapt our interface to Stripe's API
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      payment_method: method.token,
      confirm: true,
    });
    return {
      transactionId: intent.id,
      success: intent.status === 'succeeded',
    };
  }

  async refund(transactionId: string, amount: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount * 100),
    });
    return { refundId: refund.id, success: true };
  }
}

// Razorpay has a completely different API
class RazorpayAdapter implements PaymentGateway {
  async charge(amount: number, currency: string, method: PaymentMethod) {
    // Adapt to Razorpay's API (uses paise, different method names)
    const payment = await this.razorpay.payments.create({
      amount: Math.round(amount * 100), // Paise
      currency,
      method: method.type,
    });
    return {
      transactionId: payment.id,
      success: payment.status === 'captured',
    };
  }
}

// Our code is gateway-agnostic
@Injectable()
class PaymentService {
  constructor(@Inject('PAYMENT_GATEWAY') private gateway: PaymentGateway) {}

  async processOrder(order: Order) {
    return this.gateway.charge(order.total, 'INR', order.paymentMethod);
  }
}</code></pre>

<h3>Real Example: Message Broker Adapter</h3>
<pre><code>// Unified interface for message brokers
interface IMessageBroker {
  publish(topic: string, message: any): Promise&lt;void&gt;;
  subscribe(topic: string, handler: (msg: any) => void): Promise&lt;void&gt;;
}

class KafkaAdapter implements IMessageBroker {
  async publish(topic: string, message: any) {
    await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
  }
  async subscribe(topic: string, handler: (msg: any) => void) {
    await this.consumer.subscribe({ topic });
    await this.consumer.run({ eachMessage: async ({ message }) => handler(JSON.parse(message.value.toString())) });
  }
}

class RedisAdapter implements IMessageBroker {
  async publish(topic: string, message: any) {
    await this.redis.publish(topic, JSON.stringify(message));
  }
  async subscribe(topic: string, handler: (msg: any) => void) {
    await this.subscriber.subscribe(topic);
    this.subscriber.on('message', (ch, msg) => { if (ch === topic) handler(JSON.parse(msg)); });
  }
}</code></pre>

<h2>Decorator vs Adapter</h2>
<table>
  <tr><th>Aspect</th><th>Decorator</th><th>Adapter</th></tr>
  <tr><td>Purpose</td><td>Add behavior</td><td>Convert interfaces</td></tr>
  <tr><td>Interface</td><td>Same as wrapped object</td><td>Different from adaptee</td></tr>
  <tr><td>Composition</td><td>Can stack multiple</td><td>Usually one layer</td></tr>
  <tr><td>Example</td><td>Add logging to any service</td><td>Wrap Stripe API as our PaymentGateway</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: When would you use Adapter in a real project?</div>
  <div class="qa-a">Anytime you integrate with <strong>third-party APIs</strong> that you don't control. Payment gateways (Stripe, Razorpay, PayPal), email providers (SendGrid, SES, Mailgun), SMS providers (Twilio, MSG91), cloud storage (S3, GCS, Azure Blob). The adapter wraps the third-party SDK behind your unified interface. When the vendor changes their API or you switch vendors, only the adapter changes — not your business logic.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How are TypeScript decorators different from the GoF Decorator pattern?</div>
  <div class="qa-a">TypeScript/ES decorators are a <strong>language feature</strong> that uses <code>@</code> syntax to modify classes, methods, or properties at definition time. The GoF Decorator is a <strong>design pattern</strong> where you wrap objects to add behavior at runtime. NestJS uses both: <code>@Injectable()</code> is a TS decorator that adds metadata, while Interceptors act as GoF decorators wrapping handler execution. They share the concept of "adding behavior without modifying the original" but operate at different levels.</div>
</div>

<div class="warning-note">In LLD interviews, use Adapter whenever you integrate external systems. Say: "I'll put an adapter around the external API so our system depends on our interface, not theirs." This shows you understand decoupling and testability.</div>
`,
  },

  // ─────────────────────────────────────────────
  //  LLD PROBLEMS
  // ─────────────────────────────────────────────
  {
    id: 'lld-parking-lot',
    title: 'LLD: Parking Lot System',
    category: 'LLD Problems',
    starterCode: `// LLD: Parking Lot System
// Full implementation with classes and logic

// Enums
const VehicleType = { MOTORCYCLE: 'MOTORCYCLE', CAR: 'CAR', TRUCK: 'TRUCK' };
const SpotSize = { SMALL: 'SMALL', MEDIUM: 'MEDIUM', LARGE: 'LARGE' };

// Vehicle classes
class Vehicle {
  constructor(licensePlate, type, size) {
    this.licensePlate = licensePlate;
    this.type = type;
    this.size = size;
  }
}

class Motorcycle extends Vehicle {
  constructor(plate) { super(plate, VehicleType.MOTORCYCLE, SpotSize.SMALL); }
}

class Car extends Vehicle {
  constructor(plate) { super(plate, VehicleType.CAR, SpotSize.MEDIUM); }
}

class Truck extends Vehicle {
  constructor(plate) { super(plate, VehicleType.TRUCK, SpotSize.LARGE); }
}

// Parking Spot
class ParkingSpot {
  constructor(id, size, level) {
    this.id = id;
    this.size = size;
    this.level = level;
    this.vehicle = null;
  }
  isAvailable() { return this.vehicle === null; }
  canFit(vehicle) {
    const sizeOrder = { SMALL: 1, MEDIUM: 2, LARGE: 3 };
    return this.isAvailable() && sizeOrder[this.size] >= sizeOrder[vehicle.size];
  }
  park(vehicle) {
    if (!this.canFit(vehicle)) throw new Error('Cannot park here');
    this.vehicle = vehicle;
  }
  unpark() { this.vehicle = null; }
}

// Ticket
class Ticket {
  constructor(vehicle, spot) {
    this.id = 'TKT-' + Date.now().toString(36).toUpperCase();
    this.vehicle = vehicle;
    this.spot = spot;
    this.entryTime = new Date();
    this.exitTime = null;
  }
  calculateFee(rates) {
    this.exitTime = new Date();
    const hours = Math.ceil((this.exitTime - this.entryTime) / 3600000) || 1;
    return hours * (rates[this.vehicle.type] || 10);
  }
}

// Parking Level
class ParkingLevel {
  constructor(levelNum, smallSpots, mediumSpots, largeSpots) {
    this.level = levelNum;
    this.spots = [];
    let id = 0;
    for (let i = 0; i < smallSpots; i++) this.spots.push(new ParkingSpot('L' + levelNum + '-S' + (++id), SpotSize.SMALL, levelNum));
    for (let i = 0; i < mediumSpots; i++) this.spots.push(new ParkingSpot('L' + levelNum + '-M' + (++id), SpotSize.MEDIUM, levelNum));
    for (let i = 0; i < largeSpots; i++) this.spots.push(new ParkingSpot('L' + levelNum + '-L' + (++id), SpotSize.LARGE, levelNum));
  }
  findSpot(vehicle) {
    return this.spots.find(s => s.canFit(vehicle));
  }
  available() {
    return this.spots.filter(s => s.isAvailable()).length;
  }
}

// Parking Lot (main class)
class ParkingLot {
  constructor(name) {
    this.name = name;
    this.levels = [];
    this.tickets = new Map();
    this.rates = { MOTORCYCLE: 10, CAR: 20, TRUCK: 40 };
  }

  addLevel(smallSpots, mediumSpots, largeSpots) {
    const level = new ParkingLevel(this.levels.length + 1, smallSpots, mediumSpots, largeSpots);
    this.levels.push(level);
  }

  parkVehicle(vehicle) {
    for (const level of this.levels) {
      const spot = level.findSpot(vehicle);
      if (spot) {
        spot.park(vehicle);
        const ticket = new Ticket(vehicle, spot);
        this.tickets.set(vehicle.licensePlate, ticket);
        console.log('Parked ' + vehicle.type + ' [' + vehicle.licensePlate + '] at spot ' + spot.id);
        return ticket;
      }
    }
    console.log('No spot available for ' + vehicle.type + ' [' + vehicle.licensePlate + ']');
    return null;
  }

  unparkVehicle(licensePlate) {
    const ticket = this.tickets.get(licensePlate);
    if (!ticket) { console.log('Ticket not found'); return null; }
    const fee = ticket.calculateFee(this.rates);
    ticket.spot.unpark();
    this.tickets.delete(licensePlate);
    console.log('Unparked [' + licensePlate + '] — Fee: $' + fee);
    return fee;
  }

  status() {
    console.log('\\n--- ' + this.name + ' Status ---');
    this.levels.forEach(l => {
      console.log('Level ' + l.level + ': ' + l.available() + '/' + l.spots.length + ' available');
    });
  }
}

// === Demo ===
const lot = new ParkingLot('City Center Parking');
lot.addLevel(2, 3, 1);  // Level 1: 2 small, 3 medium, 1 large
lot.addLevel(1, 2, 1);  // Level 2: 1 small, 2 medium, 1 large

lot.status();

console.log('');
lot.parkVehicle(new Car('KA-01-1234'));
lot.parkVehicle(new Motorcycle('KA-02-5678'));
lot.parkVehicle(new Truck('KA-03-9012'));
lot.parkVehicle(new Car('KA-04-3456'));
lot.parkVehicle(new Car('KA-05-7890'));

lot.status();

console.log('');
lot.unparkVehicle('KA-01-1234');
lot.unparkVehicle('KA-03-9012');

lot.status();`,
    content: `
<h1>LLD: Parking Lot System</h1>
<p>The parking lot is the <strong>most common LLD interview question</strong>. It tests your ability to identify entities, relationships, and design clean object-oriented code.</p>

<h2>Step 1: Requirements Gathering</h2>
<p>Always start by clarifying requirements with the interviewer:</p>
<ul>
  <li>Multiple levels with different spot sizes (Small, Medium, Large)</li>
  <li>Different vehicle types (Motorcycle, Car, Truck)</li>
  <li>Entry/exit with ticket generation</li>
  <li>Pricing based on vehicle type and duration</li>
  <li>Spot assignment strategy (first available)</li>
  <li>Check availability per level</li>
</ul>

<h2>Step 2: Identify Classes</h2>
<pre><code>┌─────────────┐     ┌──────────┐     ┌──────────────┐
│  ParkingLot  │────▶│  Level   │────▶│  ParkingSpot  │
└─────────────┘     └──────────┘     └──────────────┘
       │                                     │
       │ issues                              │ holds
       ▼                                     ▼
┌──────────┐                          ┌──────────┐
│  Ticket   │◀────────────────────────│  Vehicle  │
└──────────┘                          └──────────┘
                                           ▲
                              ┌────────────┼────────────┐
                              │            │            │
                         Motorcycle       Car         Truck</code></pre>

<h2>Step 3: Core Classes (TypeScript)</h2>
<pre><code>enum VehicleType { MOTORCYCLE = 'MOTORCYCLE', CAR = 'CAR', TRUCK = 'TRUCK' }
enum SpotSize { SMALL = 'SMALL', MEDIUM = 'MEDIUM', LARGE = 'LARGE' }

abstract class Vehicle {
  constructor(
    public licensePlate: string,
    public type: VehicleType,
    public size: SpotSize,
  ) {}
}

class Motorcycle extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.MOTORCYCLE, SpotSize.SMALL); }
}

class Car extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.CAR, SpotSize.MEDIUM); }
}

class Truck extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.TRUCK, SpotSize.LARGE); }
}

class ParkingSpot {
  private vehicle: Vehicle | null = null;

  constructor(
    public id: string,
    public size: SpotSize,
    public level: number,
  ) {}

  isAvailable(): boolean { return this.vehicle === null; }

  canFit(vehicle: Vehicle): boolean {
    const order = { SMALL: 1, MEDIUM: 2, LARGE: 3 };
    return this.isAvailable() && order[this.size] >= order[vehicle.size];
  }

  park(vehicle: Vehicle): void { this.vehicle = vehicle; }
  unpark(): Vehicle | null {
    const v = this.vehicle;
    this.vehicle = null;
    return v;
  }
}</code></pre>

<h2>Step 4: Ticket & Pricing</h2>
<pre><code>interface PricingStrategy {
  calculate(vehicle: Vehicle, hours: number): number;
}

class HourlyPricing implements PricingStrategy {
  private rates = { MOTORCYCLE: 10, CAR: 20, TRUCK: 40 };

  calculate(vehicle: Vehicle, hours: number): number {
    return hours * this.rates[vehicle.type];
  }
}

class Ticket {
  public id: string;
  public entryTime: Date;
  public exitTime?: Date;

  constructor(public vehicle: Vehicle, public spot: ParkingSpot) {
    this.id = \`TKT-\${Date.now()}\`;
    this.entryTime = new Date();
  }

  close(pricing: PricingStrategy): number {
    this.exitTime = new Date();
    const hours = Math.ceil((this.exitTime.getTime() - this.entryTime.getTime()) / 3600000);
    return pricing.calculate(this.vehicle, Math.max(hours, 1));
  }
}</code></pre>

<h2>Step 5: ParkingLot (Orchestrator)</h2>
<pre><code>class ParkingLot {
  private levels: ParkingLevel[] = [];
  private activeTickets = new Map&lt;string, Ticket&gt;();
  private pricing: PricingStrategy = new HourlyPricing();

  addLevel(small: number, medium: number, large: number) {
    this.levels.push(new ParkingLevel(this.levels.length + 1, small, medium, large));
  }

  parkVehicle(vehicle: Vehicle): Ticket | null {
    for (const level of this.levels) {
      const spot = level.findAvailableSpot(vehicle);
      if (spot) {
        spot.park(vehicle);
        const ticket = new Ticket(vehicle, spot);
        this.activeTickets.set(vehicle.licensePlate, ticket);
        return ticket;
      }
    }
    return null; // No spot available
  }

  unparkVehicle(licensePlate: string): number {
    const ticket = this.activeTickets.get(licensePlate);
    if (!ticket) throw new Error('No active ticket');
    const fee = ticket.close(this.pricing);
    ticket.spot.unpark();
    this.activeTickets.delete(licensePlate);
    return fee;
  }
}</code></pre>

<h2>Key Design Decisions</h2>
<table>
  <tr><th>Decision</th><th>Choice</th><th>Trade-off</th></tr>
  <tr><td>Spot assignment</td><td>First available (scan levels)</td><td>Simple but not optimal. Could use closest-to-entrance strategy</td></tr>
  <tr><td>Pricing</td><td>Strategy pattern</td><td>Can swap hourly/flat/dynamic pricing without changing ParkingLot</td></tr>
  <tr><td>Vehicle hierarchy</td><td>Inheritance</td><td>Clean LSP — any Vehicle works in parkVehicle()</td></tr>
  <tr><td>Ticket lookup</td><td>Map by license plate</td><td>O(1) lookup. Could also use ticket ID</td></tr>
  <tr><td>Concurrency</td><td>Not handled in basic LLD</td><td>In production: lock spot before parking, use DB transactions</td></tr>
</table>

<h2>Follow-Up Extensions</h2>
<ul>
  <li><strong>Multiple entry/exit gates</strong> — concurrency control, gate assignment</li>
  <li><strong>Reserved/VIP spots</strong> — add SpotType enum, filter in assignment</li>
  <li><strong>Electric vehicle charging</strong> — subclass of ParkingSpot with charger</li>
  <li><strong>Dynamic pricing</strong> — surge pricing when occupancy &gt; 80%</li>
  <li><strong>Real-time availability display</strong> — Observer pattern for UI updates</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: How would you handle concurrent parking requests?</div>
  <div class="qa-a">In a distributed system, use <strong>optimistic locking</strong> or <strong>Redis distributed locks</strong>. When a vehicle requests parking: (1) Find an available spot. (2) Try to acquire a lock on that spot (Redis <code>SET spot:123 locked NX EX 30</code>). (3) If lock acquired, assign the spot. (4) If not, retry with next spot. In a monolith with a DB, use <code>SELECT FOR UPDATE</code> on the spot row within a transaction. The key insight: never assign a spot without locking it first.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What design patterns did you use?</div>
  <div class="qa-a"><strong>Strategy</strong> for pricing (hourly, flat, dynamic). <strong>Factory</strong> for creating vehicles by type. <strong>Inheritance</strong> for the Vehicle hierarchy (respects LSP). <strong>Singleton</strong> for the ParkingLot itself (one per system). The design also follows <strong>SRP</strong> — ParkingSpot handles spot logic, Ticket handles billing, ParkingLot orchestrates.</div>
</div>

<div class="warning-note">Interview tip: Start with requirements, then draw the class diagram, then implement top-down. Don't jump into code immediately. Spend 5 minutes on design, 15 on implementation, 5 on extensions.</div>
`,
  },
  {
    id: 'lld-lru-cache',
    title: 'LLD: LRU Cache',
    category: 'LLD Problems',
    starterCode: `// LLD: LRU Cache — O(1) get and put
// Implementation: HashMap + Doubly Linked List

class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> Node

    // Sentinel nodes (dummy head/tail)
    this.head = new Node(null, null);
    this.tail = new Node(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Remove node from its current position
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // Insert node right after head (most recently used)
  _insertAfterHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;

    const node = this.map.get(key);
    // Move to front (most recently used)
    this._remove(node);
    this._insertAfterHead(node);
    return node.value;
  }

  put(key, value) {
    // If key exists, update and move to front
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._remove(node);
      this._insertAfterHead(node);
      return;
    }

    // Evict LRU if at capacity
    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev; // Node before tail = least recently used
      this._remove(lru);
      this.map.delete(lru.key);
      console.log('  Evicted:', lru.key);
    }

    // Insert new node
    const node = new Node(key, value);
    this._insertAfterHead(node);
    this.map.set(key, node);
  }

  display() {
    const items = [];
    let current = this.head.next;
    while (current !== this.tail) {
      items.push(current.key + ':' + current.value);
      current = current.next;
    }
    console.log('  Cache [MRU -> LRU]:', items.join(' -> '));
  }
}

// === Demo ===
console.log('=== LRU Cache (capacity: 3) ===');
const cache = new LRUCache(3);

cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);
cache.display();

console.log('\\nGet b:', cache.get('b'));  // Moves 'b' to front
cache.display();

console.log('\\nPut d (evicts LRU):');
cache.put('d', 4);  // Evicts 'a' (least recently used)
cache.display();

console.log('\\nGet a:', cache.get('a'));  // -1 (evicted)

console.log('\\nPut e (evicts LRU):');
cache.put('e', 5);  // Evicts 'c'
cache.display();

console.log('\\nUpdate b to 20:');
cache.put('b', 20);
cache.display();

// Verify O(1) operations
console.log('\\n=== Complexity ===');
console.log('get():  O(1) — HashMap lookup + linked list move');
console.log('put():  O(1) — HashMap insert + linked list insert/evict');
console.log('space:  O(capacity) — HashMap + linked list nodes');`,
    content: `
<h1>LLD: LRU Cache</h1>
<p>LRU (Least Recently Used) cache is one of the most popular LLD interview questions. The challenge: implement <code>get()</code> and <code>put()</code> in <strong>O(1) time complexity</strong>.</p>

<h2>Requirements</h2>
<ul>
  <li><code>get(key)</code> — return value if key exists, -1 otherwise. Mark as recently used.</li>
  <li><code>put(key, value)</code> — insert or update. If at capacity, evict the least recently used item.</li>
  <li>Both operations must be <strong>O(1)</strong></li>
</ul>

<h2>Data Structure: HashMap + Doubly Linked List</h2>
<pre><code>Why this combination?
- HashMap: O(1) key lookup
- Doubly Linked List: O(1) insert/delete at any position

   HashMap                   Doubly Linked List
┌──────────┐
│ key: 'a' │──────▶    HEAD ⟷ [a:1] ⟷ [b:2] ⟷ [c:3] ⟷ TAIL
│ key: 'b' │──────▶           (MRU)                (LRU)
│ key: 'c' │──────▶
└──────────┘

get('b'):  Map.get('b') → node → remove from list → insert at head
put('d'):  Map.size >= cap → remove tail.prev → Map.delete → create node → insert at head</code></pre>

<h2>Full Implementation (TypeScript)</h2>
<pre><code>class DLLNode {
  key: string;
  value: number;
  prev: DLLNode | null = null;
  next: DLLNode | null = null;
  constructor(key: string, value: number) {
    this.key = key;
    this.value = value;
  }
}

class LRUCache {
  private capacity: number;
  private map: Map&lt;string, DLLNode&gt; = new Map();
  private head: DLLNode; // sentinel
  private tail: DLLNode; // sentinel

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new DLLNode('', 0);
    this.tail = new DLLNode('', 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private remove(node: DLLNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private insertAfterHead(node: DLLNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  get(key: string): number {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key)!;
    this.remove(node);
    this.insertAfterHead(node);
    return node.value;
  }

  put(key: string, value: number): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      node.value = value;
      this.remove(node);
      this.insertAfterHead(node);
      return;
    }

    if (this.map.size >= this.capacity) {
      const lru = this.tail.prev!;
      this.remove(lru);
      this.map.delete(lru.key);
    }

    const node = new DLLNode(key, value);
    this.map.set(key, node);
    this.insertAfterHead(node);
  }
}</code></pre>

<h2>Complexity Analysis</h2>
<table>
  <tr><th>Operation</th><th>Time</th><th>Why</th></tr>
  <tr><td><code>get(key)</code></td><td>O(1)</td><td>Map lookup O(1) + DLL remove/insert O(1)</td></tr>
  <tr><td><code>put(key, value)</code></td><td>O(1)</td><td>Map lookup O(1) + DLL remove/insert O(1) + eviction O(1)</td></tr>
  <tr><td>Space</td><td>O(capacity)</td><td>Map entries + DLL nodes</td></tr>
</table>

<h2>Why Sentinel Nodes?</h2>
<p>Sentinel (dummy) head and tail nodes eliminate edge cases:</p>
<ul>
  <li>No null checks when removing the first or last real node</li>
  <li>LRU node is always <code>tail.prev</code> (never null)</li>
  <li>MRU position is always <code>head.next</code> (never null)</li>
  <li>Simplifies code significantly — no special cases for empty list</li>
</ul>

<h2>Redis Eviction Policies</h2>
<table>
  <tr><th>Policy</th><th>Algorithm</th><th>Use Case</th></tr>
  <tr><td><code>allkeys-lru</code></td><td>Evict least recently used key</td><td>General caching</td></tr>
  <tr><td><code>allkeys-lfu</code></td><td>Evict least frequently used key</td><td>Popular items should stay</td></tr>
  <tr><td><code>volatile-lru</code></td><td>LRU among keys with TTL set</td><td>Mixed cache + persistent data</td></tr>
  <tr><td><code>volatile-ttl</code></td><td>Evict shortest TTL first</td><td>Time-sensitive data</td></tr>
  <tr><td><code>noeviction</code></td><td>Return error when full</td><td>Critical data, no loss allowed</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How does Redis implement LRU internally?</div>
  <div class="qa-a">Redis uses <strong>approximate LRU</strong>, not exact LRU. Maintaining a true doubly-linked list for millions of keys is too expensive (memory overhead per node). Instead, Redis: (1) Stores a 24-bit timestamp on each key (last access time). (2) On eviction, samples N random keys (default 5). (3) Evicts the key with the oldest timestamp from the sample. This is O(1) per eviction and uses only 3 extra bytes per key (vs 2 pointers for DLL). With sample size 10, Redis's approximate LRU is nearly indistinguishable from true LRU.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you extend this for a distributed LRU cache?</div>
  <div class="qa-a">For distributed LRU: (1) Use <strong>consistent hashing</strong> to distribute keys across cache nodes. (2) Each node runs its own LRU eviction locally. (3) Use Redis Cluster which handles this natively — each shard manages its own keyspace with LRU eviction. (4) For multi-level caching: L1 = in-process LRU (small, fast), L2 = Redis (large, shared). On L1 miss, check L2. On L2 miss, query DB and populate both levels.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What about thread safety?</div>
  <div class="qa-a">In Node.js (single-threaded), no locking needed. In multi-threaded languages: use a <strong>ReentrantReadWriteLock</strong> — multiple concurrent reads, exclusive writes. Alternatively, use a ConcurrentHashMap with a synchronized linked list. For high-throughput scenarios, consider <strong>lock-striping</strong> (partition the cache, lock per partition) — this is how Java's ConcurrentHashMap works internally.</div>
</div>

<div class="warning-note">In the interview, implement the DLL manually — don't use a library. The interviewer wants to see you handle pointer manipulation correctly. Practice the remove/insert operations until they're second nature.</div>
`,
  },
  {
    id: 'lld-rate-limiter',
    title: 'LLD: Rate Limiter',
    category: 'LLD Problems',
    starterCode: `// LLD: Rate Limiter — Token Bucket Implementation

class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;       // Max tokens
    this.tokens = capacity;         // Current tokens
    this.refillRate = refillRate;   // Tokens added per second
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  allow() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  status() {
    return Math.floor(this.tokens) + '/' + this.capacity + ' tokens';
  }
}

// === Sliding Window Counter ===
class SlidingWindowCounter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = []; // timestamps
  }

  allow() {
    const now = Date.now();
    // Remove expired timestamps
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  status() {
    return this.requests.length + '/' + this.maxRequests + ' in window';
  }
}

// === Per-User Rate Limiter ===
class RateLimiter {
  constructor(strategy, createBucket) {
    this.strategy = strategy;
    this.createBucket = createBucket;
    this.buckets = new Map();
  }

  isAllowed(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, this.createBucket());
    }
    const bucket = this.buckets.get(userId);
    const allowed = bucket.allow();
    return { allowed, status: bucket.status() };
  }
}

// === Demo ===
console.log('=== Token Bucket (5 tokens, refill 2/sec) ===');
const tb = new TokenBucket(5, 2);

for (let i = 1; i <= 7; i++) {
  const allowed = tb.allow();
  console.log('Request ' + i + ':', allowed ? 'ALLOWED' : 'DENIED', '(' + tb.status() + ')');
}

console.log('\\n=== Sliding Window (3 req per 2 sec) ===');
const sw = new SlidingWindowCounter(2000, 3);
for (let i = 1; i <= 5; i++) {
  const allowed = sw.allow();
  console.log('Request ' + i + ':', allowed ? 'ALLOWED' : 'DENIED', '(' + sw.status() + ')');
}

console.log('\\n=== Per-User Rate Limiter ===');
const limiter = new RateLimiter('token-bucket', () => new TokenBucket(3, 1));

['user-A', 'user-A', 'user-A', 'user-A', 'user-B', 'user-B'].forEach(uid => {
  const { allowed, status } = limiter.isAllowed(uid);
  console.log(uid + ':', allowed ? 'ALLOWED' : 'DENIED', '(' + status + ')');
});`,
    content: `
<h1>LLD: Rate Limiter</h1>
<p>Rate limiting is essential for protecting APIs from abuse. This is a common LLD/system design interview question that tests algorithm knowledge, distributed systems understanding, and practical implementation skills.</p>

<h2>Requirements</h2>
<ul>
  <li>Limit requests per user/IP within a time window</li>
  <li>Support different rate limits for different API tiers (free, pro, enterprise)</li>
  <li>Return appropriate HTTP 429 response when limit exceeded</li>
  <li>Work in a distributed system (multiple API servers)</li>
  <li>Low latency — rate limit check should be fast</li>
</ul>

<h2>Rate Limiting Algorithms</h2>

<h3>1. Token Bucket</h3>
<pre><code>// Bucket holds tokens, each request consumes one token
// Tokens refill at a fixed rate
// Allows bursts up to bucket capacity

class TokenBucket {
  capacity: number;      // Max burst size
  tokens: number;        // Current tokens
  refillRate: number;    // Tokens per second
  lastRefill: number;    // Last refill timestamp

  allow(): boolean {
    this.refill(); // Add tokens based on elapsed time
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }
}
// Used by: AWS API Gateway, Stripe</code></pre>

<h3>2. Sliding Window Log</h3>
<pre><code>// Store timestamp of each request
// Count requests within the window
// Exact but memory-intensive

class SlidingWindowLog {
  allow(userId: string): boolean {
    const now = Date.now();
    // Remove timestamps outside window
    this.logs[userId] = this.logs[userId].filter(t => now - t < this.windowMs);
    if (this.logs[userId].length < this.maxRequests) {
      this.logs[userId].push(now);
      return true;
    }
    return false;
  }
}
// Pro: Exact count. Con: Stores every timestamp</code></pre>

<h3>3. Fixed Window Counter</h3>
<pre><code>// Divide time into fixed windows (e.g., each minute)
// Count requests per window
// Simple but has boundary problem

// Window: [0:00-1:00] limit 10
// 0:59 → 10 requests (allowed)
// 1:01 → 10 requests (allowed)
// User made 20 requests in 2 seconds! (boundary issue)</code></pre>

<h3>4. Sliding Window Counter</h3>
<pre><code>// Combines fixed window + sliding window
// Weighted average of current and previous window

// Previous window count: 8 (weight: 40% of window remaining)
// Current window count: 3
// Effective count: 8 * 0.4 + 3 = 6.2
// Limit: 10 → Allowed</code></pre>

<h2>Algorithm Comparison</h2>
<table>
  <tr><th>Algorithm</th><th>Memory</th><th>Accuracy</th><th>Burst Handling</th><th>Used By</th></tr>
  <tr><td>Token Bucket</td><td>O(1)</td><td>Approximate</td><td>Allows bursts</td><td>AWS, Stripe</td></tr>
  <tr><td>Sliding Window Log</td><td>O(n)</td><td>Exact</td><td>No bursts</td><td>Small-scale APIs</td></tr>
  <tr><td>Fixed Window</td><td>O(1)</td><td>Boundary issues</td><td>2x burst at edges</td><td>Simple use cases</td></tr>
  <tr><td>Sliding Window Counter</td><td>O(1)</td><td>~99.7% accurate</td><td>Smooth</td><td>Cloudflare</td></tr>
  <tr><td>Leaky Bucket</td><td>O(1)</td><td>Exact rate</td><td>No bursts (smooth)</td><td>Network traffic shaping</td></tr>
</table>

<h2>Distributed Rate Limiting with Redis</h2>
<pre><code>// Token Bucket with Redis (atomic operations)
class RedisRateLimiter {
  async isAllowed(userId: string): Promise&lt;boolean&gt; {
    const key = \`rate:\${userId}\`;
    const now = Date.now();

    // Lua script for atomic token bucket
    const script = \`
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      local elapsed = (now - lastRefill) / 1000
      tokens = math.min(capacity, tokens + elapsed * refillRate)

      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 60)
        return 1
      end
      return 0
    \`;

    const result = await this.redis.eval(script, 1, key, 10, 2, now);
    return result === 1;
  }
}

// Simpler: Fixed Window with Redis INCR
async isAllowed(userId: string): Promise&lt;boolean&gt; {
  const window = Math.floor(Date.now() / 60000); // per minute
  const key = \`rate:\${userId}:\${window}\`;
  const count = await this.redis.incr(key);
  if (count === 1) await this.redis.expire(key, 60);
  return count <= this.limit;
}</code></pre>

<h2>NestJS ThrottlerGuard</h2>
<pre><code>// Built-in rate limiting with @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Time window in seconds
      limit: 10,    // Max requests per window
    }),
  ],
})

// Per-route override
@Throttle(5, 30)  // 5 requests per 30 seconds
@Post('login')
async login() { ... }

// Skip rate limiting
@SkipThrottle()
@Get('health')
healthCheck() { ... }</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How would you implement rate limiting in a distributed system?</div>
  <div class="qa-a">Use <strong>Redis</strong> as a centralized counter. All API servers check the same Redis key. Two approaches: (1) <strong>Redis INCR + EXPIRE</strong> — simple fixed-window counter. Atomic, fast, but has boundary issues. (2) <strong>Redis Lua script</strong> — implement token bucket or sliding window atomically. The Lua script runs on the Redis server, ensuring atomicity without network roundtrips between check and update. For ultra-low latency, use <strong>local + global</strong>: local in-memory counter syncs with Redis periodically (eventually consistent but faster).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens when Redis is down?</div>
  <div class="qa-a">Three strategies: (1) <strong>Fail open</strong> — allow all requests (unsafe but available). (2) <strong>Fail closed</strong> — deny all requests (safe but causes downtime). (3) <strong>Local fallback</strong> — fall back to in-memory rate limiter per server. The right choice depends on the use case. For payment APIs, fail closed. For content APIs, fail open with local rate limiting. Always have a circuit breaker around the Redis call.</div>
</div>

<div class="warning-note">In interviews, start with the simplest algorithm (Fixed Window with Redis INCR), then discuss trade-offs and upgrade to Sliding Window or Token Bucket if the interviewer asks. Always mention the distributed case — rate limiting in a single server is trivial.</div>
`,
  },
  {
    id: 'lld-pub-sub',
    title: 'LLD: Pub/Sub System',
    category: 'LLD Problems',
    starterCode: `// LLD: Pub/Sub System — In-memory implementation

class Topic {
  constructor(name) {
    this.name = name;
    this.subscribers = new Map(); // subscriberId -> callback
    this.messages = []; // message history
  }

  addSubscriber(id, callback) {
    this.subscribers.set(id, callback);
    console.log('  [' + this.name + '] Subscriber added: ' + id);
  }

  removeSubscriber(id) {
    this.subscribers.delete(id);
    console.log('  [' + this.name + '] Subscriber removed: ' + id);
  }

  publish(message) {
    this.messages.push(message);
    console.log('  [' + this.name + '] Published: ' + JSON.stringify(message.data));
    this.subscribers.forEach((callback, subId) => {
      try {
        callback(message);
      } catch (e) {
        console.log('  [' + this.name + '] Error delivering to ' + subId + ': ' + e.message);
      }
    });
    return this.subscribers.size;
  }
}

class Message {
  constructor(data, metadata = {}) {
    this.id = 'msg-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    this.data = data;
    this.timestamp = new Date();
    this.metadata = metadata;
  }
}

class PubSubBroker {
  constructor() {
    this.topics = new Map();
  }

  createTopic(name) {
    if (!this.topics.has(name)) {
      this.topics.set(name, new Topic(name));
      console.log('Topic created: ' + name);
    }
    return this.topics.get(name);
  }

  publish(topicName, data, metadata) {
    const topic = this.topics.get(topicName);
    if (!topic) {
      console.log('Topic not found: ' + topicName);
      return 0;
    }
    const message = new Message(data, metadata);
    return topic.publish(message);
  }

  subscribe(topicName, subscriberId, callback) {
    let topic = this.topics.get(topicName);
    if (!topic) topic = this.createTopic(topicName);
    topic.addSubscriber(subscriberId, callback);
  }

  unsubscribe(topicName, subscriberId) {
    const topic = this.topics.get(topicName);
    if (topic) topic.removeSubscriber(subscriberId);
  }

  listTopics() {
    console.log('\\nTopics:', [...this.topics.keys()].join(', '));
  }
}

// === Demo: E-commerce Event System ===
const broker = new PubSubBroker();

// Create topics
broker.createTopic('order.placed');
broker.createTopic('order.shipped');
broker.createTopic('payment.received');

// Subscribe services
broker.subscribe('order.placed', 'inventory-service', (msg) => {
  console.log('    Inventory: Reserved items for order ' + msg.data.orderId);
});

broker.subscribe('order.placed', 'email-service', (msg) => {
  console.log('    Email: Confirmation sent to ' + msg.data.customer);
});

broker.subscribe('order.placed', 'analytics-service', (msg) => {
  console.log('    Analytics: Tracked order $' + msg.data.total);
});

broker.subscribe('payment.received', 'accounting-service', (msg) => {
  console.log('    Accounting: Recorded payment of $' + msg.data.amount);
});

// Publish events
console.log('\\n--- Publishing Events ---');
broker.publish('order.placed', {
  orderId: 'ORD-001',
  customer: 'arvind@example.com',
  total: 149.99,
  items: ['Keyboard', 'Mouse'],
});

console.log('');
broker.publish('payment.received', {
  orderId: 'ORD-001',
  amount: 149.99,
  method: 'UPI',
});

broker.listTopics();`,
    content: `
<h1>LLD: Pub/Sub System</h1>
<p>Pub/Sub (Publish/Subscribe) is a messaging pattern where senders (publishers) don't send messages to specific receivers — instead, they publish to <strong>topics</strong>, and subscribers receive messages from topics they're interested in.</p>

<h2>Requirements</h2>
<ul>
  <li>Publishers publish messages to named topics</li>
  <li>Subscribers subscribe to topics and receive all messages</li>
  <li>Multiple subscribers can listen to the same topic</li>
  <li>Messages should have ordering within a topic</li>
  <li>Handle subscriber failures gracefully</li>
  <li>Support at-least-once delivery guarantee</li>
</ul>

<h2>Core Classes</h2>
<pre><code>class Message {
  id: string;
  data: any;
  timestamp: Date;
  metadata: Record&lt;string, string&gt;;
}

class Topic {
  name: string;
  subscribers: Map&lt;string, Subscriber&gt;;
  messages: Message[];  // message log

  publish(message: Message): void {
    this.messages.push(message);
    this.subscribers.forEach(sub => sub.onMessage(message));
  }
}

interface Subscriber {
  id: string;
  onMessage(message: Message): void;
}

class PubSubBroker {
  topics: Map&lt;string, Topic&gt;;

  createTopic(name: string): Topic;
  publish(topicName: string, data: any): void;
  subscribe(topicName: string, subscriber: Subscriber): void;
  unsubscribe(topicName: string, subscriberId: string): void;
}</code></pre>

<h2>Kafka Pub/Sub at Scale</h2>
<pre><code>// Kafka Topic Structure
Topic: "order-events"
├── Partition 0:  [msg1, msg4, msg7, ...]
├── Partition 1:  [msg2, msg5, msg8, ...]
└── Partition 2:  [msg3, msg6, msg9, ...]

// Consumer Group: "inventory-service"
//   Consumer A → Partition 0
//   Consumer B → Partition 1, 2
// Each message goes to exactly ONE consumer in the group

// Consumer Group: "email-service"
//   Consumer C → Partition 0, 1, 2
// Same messages, independently consumed</code></pre>

<h3>Kafka Key Concepts</h3>
<table>
  <tr><th>Concept</th><th>Description</th></tr>
  <tr><td><strong>Topic</strong></td><td>Named log of messages (like a category)</td></tr>
  <tr><td><strong>Partition</strong></td><td>Ordered, immutable sequence within a topic</td></tr>
  <tr><td><strong>Consumer Group</strong></td><td>Set of consumers that collectively consume a topic (each partition → one consumer)</td></tr>
  <tr><td><strong>Offset</strong></td><td>Position of a message within a partition (like an array index)</td></tr>
  <tr><td><strong>Retention</strong></td><td>Messages are stored for a configurable time (not deleted on consumption)</td></tr>
</table>

<h2>Redis Pub/Sub vs Redis Streams</h2>
<table>
  <tr><th>Feature</th><th>Redis Pub/Sub</th><th>Redis Streams</th></tr>
  <tr><td>Persistence</td><td>Fire-and-forget (no storage)</td><td>Messages persisted on disk</td></tr>
  <tr><td>Consumer groups</td><td>No</td><td>Yes (like Kafka)</td></tr>
  <tr><td>Replay</td><td>Cannot replay missed messages</td><td>Can read from any position</td></tr>
  <tr><td>Acknowledgment</td><td>No</td><td>Yes (XACK)</td></tr>
  <tr><td>Use case</td><td>Real-time notifications</td><td>Event sourcing, reliable messaging</td></tr>
</table>

<h2>Broker Comparison</h2>
<table>
  <tr><th>Feature</th><th>Kafka</th><th>RabbitMQ</th><th>Redis Pub/Sub</th></tr>
  <tr><td>Throughput</td><td>Very high (millions/sec)</td><td>High (tens of thousands/sec)</td><td>Very high (low latency)</td></tr>
  <tr><td>Ordering</td><td>Per partition</td><td>Per queue</td><td>Per channel</td></tr>
  <tr><td>Delivery</td><td>At-least-once</td><td>At-least-once / exactly-once</td><td>At-most-once</td></tr>
  <tr><td>Retention</td><td>Configurable (days/forever)</td><td>Until consumed</td><td>No retention</td></tr>
  <tr><td>Consumer groups</td><td>Yes</td><td>Yes (competing consumers)</td><td>No (use Streams)</td></tr>
  <tr><td>Best for</td><td>Event streaming, logs</td><td>Task queues, RPC</td><td>Real-time, simple</td></tr>
</table>

<h2>RabbitMQ Exchange Types</h2>
<pre><code>// Direct Exchange — route by exact routing key
exchange.publish('order.created', message);
queue.bind(exchange, 'order.created'); // Only gets order.created

// Fanout Exchange — broadcast to all bound queues
exchange.publish(message); // ALL queues get it (like Pub/Sub)

// Topic Exchange — pattern matching on routing key
queue1.bind(exchange, 'order.*');      // order.created, order.shipped
queue2.bind(exchange, '*.created');    // order.created, user.created
queue3.bind(exchange, 'order.#');      // order.created, order.payment.received</code></pre>

<h2>Delivery Guarantees</h2>
<table>
  <tr><th>Guarantee</th><th>Description</th><th>Implementation</th></tr>
  <tr><td>At-most-once</td><td>Message may be lost, never duplicated</td><td>Fire and forget (Redis Pub/Sub)</td></tr>
  <tr><td>At-least-once</td><td>Message never lost, may be duplicated</td><td>Ack after processing (Kafka, RabbitMQ)</td></tr>
  <tr><td>Exactly-once</td><td>Never lost, never duplicated</td><td>Idempotent processing + transactional commits</td></tr>
</table>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle message ordering?</div>
  <div class="qa-a">In <strong>Kafka</strong>: messages within a single partition are strictly ordered. Use the entity ID as the partition key (e.g., <code>orderId</code>) to ensure all events for the same order go to the same partition and are processed in order. In <strong>RabbitMQ</strong>: messages within a single queue are ordered, but if you have multiple consumers, order is only guaranteed per consumer. For strict global ordering, use a single partition/queue — but this limits throughput. The trade-off is always <strong>ordering vs parallelism</strong>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you choose Kafka over RabbitMQ?</div>
  <div class="qa-a"><strong>Kafka</strong>: event streaming, event sourcing, log aggregation, high throughput (millions/sec), messages need to be replayed, long retention. <strong>RabbitMQ</strong>: task queues, RPC patterns, complex routing (topic/header exchanges), messages should be deleted after processing, lower throughput is acceptable. Rule of thumb: if you're streaming events between microservices (order events, user events), use Kafka. If you're distributing tasks to workers (send email, process image), use RabbitMQ.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you handle duplicate messages?</div>
  <div class="qa-a">Make consumers <strong>idempotent</strong>. Strategies: (1) Store processed message IDs in a DB/Redis set and check before processing. (2) Use database upserts (INSERT ON CONFLICT UPDATE) instead of inserts. (3) Design operations to be naturally idempotent (e.g., "set balance to X" instead of "add Y to balance"). (4) Kafka supports exactly-once semantics with transactional producers and consumer offsets committed in the same transaction.</div>
</div>

<div class="warning-note">In interviews, always discuss delivery guarantees and ordering. These are the two dimensions that separate a junior answer from a senior one. Also mention the trade-off: stronger guarantees = lower throughput.</div>
`,
  },
  {
    id: 'lld-clean-code',
    title: 'Clean Code & DRY/KISS/YAGNI',
    category: 'LLD Problems',
    starterCode: `// Clean Code Principles in Practice

// === DRY: Don't Repeat Yourself ===
// BAD: Logic duplicated
function getUserDisplayBad(user) {
  if (user.firstName && user.lastName) {
    return user.firstName + ' ' + user.lastName;
  }
  return user.email;
}

function getOrderOwnerBad(order) {
  if (order.user.firstName && order.user.lastName) {
    return order.user.firstName + ' ' + order.user.lastName;
  }
  return order.user.email;
}

// GOOD: Extract reusable function
function getDisplayName(user) {
  return (user.firstName && user.lastName)
    ? user.firstName + ' ' + user.lastName
    : user.email;
}

console.log('=== DRY ===');
console.log(getDisplayName({ firstName: 'Arvind', lastName: 'Okram', email: 'a@b.com' }));
console.log(getDisplayName({ email: 'anon@example.com' }));

// === KISS: Keep It Simple ===
// BAD: Over-engineered
class AbstractNotificationStrategyFactoryProvider {
  createStrategy() { throw new Error('Override me'); }
}

// GOOD: Simple and direct
function sendNotification(channel, message) {
  const senders = {
    email: (msg) => console.log('Email:', msg),
    sms: (msg) => console.log('SMS:', msg),
    push: (msg) => console.log('Push:', msg),
  };
  const send = senders[channel];
  if (!send) throw new Error('Unknown channel: ' + channel);
  send(message);
}

console.log('\\n=== KISS ===');
sendNotification('email', 'Your order shipped!');
sendNotification('sms', 'OTP: 1234');

// === YAGNI: You Ain't Gonna Need It ===
// BAD: Building features "just in case"
class UserServiceBad {
  getUser() { console.log('Get user'); }
  // "We might need these someday..."
  getUserWithFriends() { console.log('Not needed yet'); }
  getUserWithRecommendations() { console.log('Not needed yet'); }
  getUserActivityGraph() { console.log('Not needed yet'); }
  getUserSocialScore() { console.log('Not needed yet'); }
}

// GOOD: Only what's needed NOW
class UserServiceGood {
  getUser(id) {
    console.log('Get user:', id);
    return { id, name: 'Arvind' };
  }
}

console.log('\\n=== YAGNI ===');
const svc = new UserServiceGood();
svc.getUser('123');

// === Clean Code: Meaningful Names ===
// BAD
const d = 7; // what is d??
const lst = [1, 2, 3]; // lst of what?
function proc(x) { return x * 2; } // proc what?

// GOOD
const maxRetryDays = 7;
const activeUserIds = [1, 2, 3];
function doublePrice(price) { return price * 2; }

console.log('\\n=== Meaningful Names ===');
console.log('Max retry days:', maxRetryDays);
console.log('Active users:', activeUserIds);
console.log('Doubled price:', doublePrice(49.99));

// === Small Functions ===
// Each function does ONE thing
function validateOrder(order) {
  if (!order.items.length) throw new Error('Empty order');
  if (!order.address) throw new Error('No address');
  return true;
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function applyDiscount(total, discountPercent) {
  return total * (1 - discountPercent / 100);
}

function processOrder(order) {
  validateOrder(order);
  const total = calculateTotal(order.items);
  const final = applyDiscount(total, order.discount || 0);
  console.log('Order total: $' + final.toFixed(2));
  return final;
}

console.log('\\n=== Small Functions ===');
processOrder({
  items: [
    { name: 'Keyboard', price: 49.99, qty: 1 },
    { name: 'Mouse', price: 29.99, qty: 2 },
  ],
  address: '123 Main St',
  discount: 10,
});`,
    content: `
<h1>Clean Code & DRY/KISS/YAGNI</h1>
<p>These principles guide everyday coding decisions. In LLD interviews, clean code separates good designs from great ones. Interviewers notice naming, function size, and unnecessary complexity.</p>

<h2>DRY: Don't Repeat Yourself</h2>
<p><em>"Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."</em></p>

<h3>Bad: Duplicated Validation</h3>
<pre><code>// BAD — Same validation in controller AND service
@Controller('users')
class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    if (!dto.email) throw new BadRequestException('Email required');
    if (!dto.email.includes('@')) throw new BadRequestException('Invalid email');
    return this.userService.create(dto);
  }
}

@Injectable()
class UserService {
  create(dto: CreateUserDto) {
    // Same validation AGAIN!
    if (!dto.email) throw new Error('Email required');
    if (!dto.email.includes('@')) throw new Error('Invalid email');
    // ...
  }
}</code></pre>

<h3>Good: Single Source of Validation</h3>
<pre><code>// GOOD — class-validator DTO (validate once via Pipe)
class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;
}

// NestJS ValidationPipe handles it globally — DRY!
app.useGlobalPipes(new ValidationPipe({ transform: true }));</code></pre>

<h3>DRY in Practice</h3>
<table>
  <tr><th>DRY Violation</th><th>Fix</th></tr>
  <tr><td>Same SQL query in 5 places</td><td>Extract to repository method</td></tr>
  <tr><td>Same error handling in every controller</td><td>Global exception filter</td></tr>
  <tr><td>Same auth check in every route</td><td>Guard / middleware</td></tr>
  <tr><td>Same response formatting</td><td>Interceptor / base response class</td></tr>
  <tr><td>Same config values hardcoded</td><td>ConfigService / env variables</td></tr>
</table>

<h2>KISS: Keep It Simple, Stupid</h2>
<p><em>"The simplest solution that works is usually the best."</em></p>

<h3>Over-Engineering Examples</h3>
<pre><code>// BAD: AbstractStrategyFactoryProviderManager for a TODO app
// BAD: Event sourcing + CQRS for a blog with 10 users
// BAD: Microservices architecture for an MVP

// GOOD: Start simple, refactor when complexity demands it
// - Monolith first, split when needed
// - Direct function calls first, events when coupling hurts
// - SQL queries first, ORM when mapping gets complex</code></pre>

<h3>When KISS Is Violated</h3>
<ul>
  <li>Using a design pattern where a simple function would suffice</li>
  <li>Creating abstractions before you have 2+ implementations</li>
  <li>Building a "framework" instead of solving the problem</li>
  <li>Premature optimization ("but what if we have 10M users?")</li>
</ul>

<h2>YAGNI: You Ain't Gonna Need It</h2>
<p><em>"Don't build features until you actually need them."</em></p>

<pre><code>// BAD — Building for hypothetical future needs
class UserService {
  findById(id: string) { ... }
  findByEmail(email: string) { ... }
  findByPhone(phone: string) { ... }         // Nobody asked for phone lookup
  findBySSN(ssn: string) { ... }             // Definitely not needed
  findByFingerprint(fp: string) { ... }      // ???
  findByFacialRecognition(img: Buffer) { ... } // Please stop
}

// GOOD — Build what you need NOW
class UserService {
  findById(id: string) { ... }
  findByEmail(email: string) { ... }
  // Add more when there's an actual requirement
}</code></pre>

<h2>Clean Code Principles</h2>

<h3>1. Meaningful Names</h3>
<pre><code>// BAD
const d = new Date();
const u = await getU(id);
function proc(x) { ... }

// GOOD
const createdAt = new Date();
const user = await getUserById(id);
function calculateOrderTotal(order) { ... }</code></pre>

<h3>2. Small Functions (One Level of Abstraction)</h3>
<pre><code>// BAD — Mixed levels of abstraction
async function processOrder(dto) {
  // Validation (low level)
  if (!dto.items.length) throw new Error('Empty');
  // Business logic (high level)
  const total = dto.items.reduce((s, i) => s + i.price, 0);
  // DB operations (low level)
  const result = await pool.query('INSERT INTO orders...', [total]);
  // Email (external service)
  await sendgrid.send({ to: dto.email, subject: 'Order confirmed' });
}

// GOOD — Each function at one level
async function processOrder(dto: CreateOrderDto) {
  validateOrder(dto);
  const order = calculateOrder(dto);
  const saved = await saveOrder(order);
  await notifyOrderPlaced(saved);
  return saved;
}</code></pre>

<h3>3. Avoid Code Smells</h3>
<table>
  <tr><th>Smell</th><th>Sign</th><th>Fix</th></tr>
  <tr><td>Long method</td><td>&gt; 20 lines</td><td>Extract methods</td></tr>
  <tr><td>Long parameter list</td><td>&gt; 3 params</td><td>Use options object or Builder</td></tr>
  <tr><td>God class</td><td>&gt; 300 lines, many responsibilities</td><td>Split by SRP</td></tr>
  <tr><td>Magic numbers</td><td><code>if (status === 3)</code></td><td>Use named constants or enums</td></tr>
  <tr><td>Deep nesting</td><td>3+ levels of if/for</td><td>Early returns, extract functions</td></tr>
  <tr><td>Comments explaining "what"</td><td><code>// increment i by 1</code></td><td>Self-documenting names</td></tr>
</table>

<h2>Dependency Injection Deep Dive (NestJS)</h2>
<pre><code>// NestJS DI Container manages the entire object graph

// 1. Register providers in module
@Module({
  providers: [
    UserService,                                    // Class provider
    { provide: 'CONFIG', useValue: { port: 3000 }}, // Value provider
    { provide: 'DB', useFactory: async (config) =>  // Factory provider
        createConnection(config), inject: [ConfigService] },
    { provide: UserRepo, useClass: PgUserRepo },    // Alias provider
  ],
})

// 2. NestJS resolves dependency graph automatically
// UserController → UserService → UserRepo → DatabaseConnection
// All resolved, instantiated, and injected by the container

// 3. Scopes control lifecycle
@Injectable({ scope: Scope.DEFAULT })   // Singleton (one per app)
@Injectable({ scope: Scope.REQUEST })   // One per HTTP request
@Injectable({ scope: Scope.TRANSIENT }) // New instance every injection

// 4. Testing: override providers
const module = await Test.createTestingModule({
  providers: [
    UserService,
    { provide: UserRepo, useClass: MockUserRepo }, // Swap for tests
  ],
}).compile();</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How do you balance DRY with readability?</div>
  <div class="qa-a">DRY is about <strong>knowledge duplication</strong>, not code duplication. Two pieces of code that look the same but serve different purposes (e.g., user validation vs product validation) should NOT be combined — they'll evolve independently. The <strong>Rule of Three</strong>: tolerate duplication twice. On the third occurrence, extract. Over-DRYing creates tight coupling where unrelated things share code. Ask: "If I change this for one use case, do ALL use cases benefit?" If not, it's incidental duplication — leave it.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you decide between KISS and proper architecture?</div>
  <div class="qa-a">Use the <strong>scale of the problem</strong> as your guide. Solo project / MVP? Keep it simple — monolith, direct calls, minimal abstractions. Growing team / product? Add patterns as pain points emerge. 50+ engineers? Invest in architecture (microservices, event-driven, CQRS) because the coordination cost of a monolith exceeds the complexity cost of distributed systems. The mistake is applying enterprise patterns to a 3-person startup, or keeping startup patterns at 100 engineers. Let complexity grow organically with real needs (YAGNI).</div>
</div>

<div class="warning-note">In LLD interviews, clean code is evaluated indirectly. If your variable names are clear, functions are small, and classes follow SRP, the interviewer forms a positive impression before you even explain your design. Write code as if the next person to read it is a sleep-deprived on-call engineer at 3 AM.</div>
`,
  },
];
