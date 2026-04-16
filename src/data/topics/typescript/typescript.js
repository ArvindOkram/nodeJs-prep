export const typescript = [
  // ─────────────────────────────────────────────────────────────
  // TypeScript Core
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ts-fundamentals',
    title: 'TypeScript Fundamentals',
    category: 'TypeScript Core',
    starterCode: `// TypeScript Fundamentals — JS Playground Demo
// =============================================

// 1. Type inference in action (JS equivalent)
const name = 'Arvind';      // TS infers: string
const age = 28;              // TS infers: number
const active = true;         // TS infers: boolean
console.log('Inferred types:', typeof name, typeof age, typeof active);

// 2. any vs unknown — the critical difference
function handleAny(val) {
  // With 'any', TS lets you do ANYTHING — no safety
  return val.toUpperCase(); // no error even if val is a number!
}

function handleUnknown(val) {
  // With 'unknown', you MUST narrow before using
  if (typeof val === 'string') {
    return val.toUpperCase(); // safe — narrowed to string
  }
  return String(val);
}

console.log('\\n=== any vs unknown ===');
console.log('handleAny("hello"):', handleAny('hello'));
try { handleAny(42); } catch(e) { console.log('handleAny(42) crashed:', e.message); }
console.log('handleUnknown("hello"):', handleUnknown('hello'));
console.log('handleUnknown(42):', handleUnknown(42));

// 3. Tuples (fixed-length typed arrays)
const httpResult = [200, 'OK', { data: [1,2,3] }];
console.log('\\nTuple-like:', httpResult[0], httpResult[1]);

// 4. Enums simulation
const Direction = Object.freeze({ Up: 'UP', Down: 'DOWN', Left: 'LEFT', Right: 'RIGHT' });
console.log('Enum-like direction:', Direction.Up);

// 5. never type — functions that never return
function throwError(msg) {
  throw new Error(msg); // return type is 'never' in TS
}

try { throwError('Something went wrong'); }
catch(e) { console.log('\\nCaught never-returning fn:', e.message); }

// 6. Type narrowing
function processValue(val) {
  if (typeof val === 'string') return 'String: ' + val.toUpperCase();
  if (typeof val === 'number') return 'Number: ' + (val * 2);
  return 'Other: ' + String(val);
}
console.log('\\n=== Narrowing ===');
console.log(processValue('hello'));
console.log(processValue(21));
console.log(processValue(true));`,
    content: `
<h1>TypeScript Fundamentals</h1>
<p>TypeScript adds a <strong>static type system</strong> on top of JavaScript. For backend developers using NestJS, it is not optional — it is the foundation of everything: dependency injection, decorators, DTOs, and service contracts all rely on TypeScript's type system.</p>

<h2>Why TypeScript in Backend Development?</h2>
<ul>
  <li><strong>Catch bugs at compile time</strong> — null reference errors, wrong argument types, missing properties</li>
  <li><strong>Self-documenting code</strong> — function signatures tell you exactly what goes in and comes out</li>
  <li><strong>IDE intelligence</strong> — autocomplete, refactoring, go-to-definition across your entire codebase</li>
  <li><strong>Safe refactoring</strong> — rename a field and the compiler shows every place that breaks</li>
  <li><strong>Team scaling</strong> — new developers understand APIs without reading implementations</li>
</ul>

<h2>Type Annotations vs Inference</h2>
<pre><code>// Explicit annotation — use when TS can't infer or for function params
function greet(name: string, age: number): string {
  return \`Hello \${name}, age \${age}\`;
}

// Inference — TS figures it out, no annotation needed
const count = 42;              // inferred as number
const users = ['a', 'b'];     // inferred as string[]
const result = greet('A', 25); // inferred as string

// When to annotate explicitly:
// 1. Function parameters (always)
// 2. Complex return types
// 3. Variables initialized later: let x: string;</code></pre>

<h2>Primitives, Arrays, Tuples</h2>
<pre><code>// Primitives
let name: string = 'Arvind';
let age: number = 28;
let active: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;

// Arrays
let ids: number[] = [1, 2, 3];
let names: Array&lt;string&gt; = ['a', 'b']; // generic form

// Tuples — fixed length, fixed types per position
let httpResult: [number, string] = [200, 'OK'];
let config: [string, boolean, number] = ['debug', true, 3];</code></pre>

<h2>any vs unknown vs never vs void</h2>
<table>
  <tr><th>Type</th><th>What it means</th><th>Can assign to</th><th>Must narrow?</th><th>When to use</th></tr>
  <tr><td><code>any</code></td><td>Opt out of type checking entirely</td><td>Everything</td><td>No</td><td>Migration from JS (avoid in new code)</td></tr>
  <tr><td><code>unknown</code></td><td>Could be anything, but safe</td><td>Only unknown/any</td><td>Yes</td><td>External data: API responses, JSON.parse</td></tr>
  <tr><td><code>never</code></td><td>Value that can never exist</td><td>Nothing</td><td>N/A</td><td>Exhaustive checks, functions that throw</td></tr>
  <tr><td><code>void</code></td><td>No return value</td><td>undefined</td><td>No</td><td>Functions that don't return anything</td></tr>
</table>

<pre><code>// any — DANGEROUS: disables all checking
let a: any = 'hello';
a.nonExistentMethod(); // no compile error, runtime crash!

// unknown — SAFE: must narrow before use
let b: unknown = getExternalData();
if (typeof b === 'string') {
  console.log(b.toUpperCase()); // OK — narrowed
}
// b.toUpperCase(); // Compile error! Must narrow first

// never — exhaustive checking
type Shape = 'circle' | 'square';
function area(s: Shape): number {
  switch (s) {
    case 'circle': return 3.14;
    case 'square': return 1;
    default:
      const _exhaustive: never = s; // error if Shape adds new member
      return _exhaustive;
  }
}</code></pre>

<h2>Type Assertions</h2>
<pre><code>// Type assertion with 'as' — tells compiler "trust me"
const input = document.getElementById('name') as HTMLInputElement;

// When to use: you know more than TS (e.g., DOM elements)
// When to AVOID: to silence errors — use type guards instead

// DANGEROUS — hides bugs:
const data = JSON.parse(body) as User; // no runtime check!

// SAFE — validate at runtime:
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}</code></pre>

<h2>tsconfig.json Key Settings</h2>
<pre><code>{
  "compilerOptions": {
    "strict": true,              // enables ALL strict checks
    "target": "ES2022",          // output JS version
    "module": "commonjs",        // or "NodeNext" for ESM
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,         // generate .d.ts files
    "emitDecoratorMetadata": true, // needed for NestJS DI
    "experimentalDecorators": true, // needed for NestJS
    "esModuleInterop": true,
    "paths": {                   // path aliases
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"]
    }
  }
}</code></pre>

<div class="warning-note">In NestJS projects, <code>emitDecoratorMetadata</code> and <code>experimentalDecorators</code> are mandatory. Without them, dependency injection silently fails.</div>

<div class="qa-block">
  <div class="qa-q">Q: What's the difference between <code>any</code> and <code>unknown</code>?</div>
  <div class="qa-a">Both can hold any value, but <code>any</code> disables type checking entirely — you can call methods, access properties, assign it to anything without errors. <code>unknown</code> is the type-safe counterpart: you cannot do anything with an <code>unknown</code> value until you narrow it with typeof, instanceof, or a type guard. In backend code, always use <code>unknown</code> for external data (API payloads, parsed JSON, third-party responses) and narrow with validation.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use <code>never</code>?</div>
  <div class="qa-a">The <code>never</code> type represents values that can never occur. Three main uses: (1) Functions that always throw an error or have infinite loops — their return type is <code>never</code>. (2) Exhaustive switch/if checks — assign to <code>never</code> in the default branch; if a new union member is added, TS will error, forcing you to handle it. (3) Conditional types — filtering out types, e.g., <code>Exclude&lt;T, U&gt;</code> uses <code>never</code> internally to remove types from a union.</div>
</div>
`,
  },
  {
    id: 'ts-interfaces-types',
    title: 'Interfaces vs Types',
    category: 'TypeScript Core',
    starterCode: `// Interfaces vs Types — JS Playground Demo
// ==========================================

// In JavaScript, there's no interface/type at runtime.
// Let's demonstrate the CONCEPTS they represent.

// 1. Object shape (interface/type both do this)
const user = { id: 1, name: 'Arvind', email: 'a@b.com' };
console.log('User:', user);

// 2. Extending shapes (interface extends / type intersection)
const adminBase = { id: 1, name: 'Admin' };
const admin = { ...adminBase, permissions: ['read', 'write', 'delete'] };
console.log('Admin (extended):', admin);

// 3. Declaration merging (interfaces only!)
// In TS, you can declare the same interface twice and they merge.
// This is how libraries extend types (e.g., Express Request)
const mergedConfig = {
  // From "first declaration"
  host: 'localhost',
  port: 3000,
  // From "second declaration" (merged)
  debug: true,
  logLevel: 'verbose',
};
console.log('Merged config:', mergedConfig);

// 4. Union types (only 'type' can do this)
function handleResult(result) {
  if (result.success) {
    console.log('Success:', result.data);
  } else {
    console.log('Error:', result.error);
  }
}
handleResult({ success: true, data: { id: 1 } });
handleResult({ success: false, error: 'Not found' });

// 5. Index signatures
const cache = {};
cache['user:1'] = { name: 'Arvind' };
cache['user:2'] = { name: 'John' };
console.log('\\nCache (index signature):', cache);

// 6. Computed properties with mapped types
const original = { name: 'arvind', role: 'sde2' };
const uppercased = Object.fromEntries(
  Object.entries(original).map(([k, v]) => [k.toUpperCase(), v])
);
console.log('Mapped keys:', uppercased);`,
    content: `
<h1>Interfaces vs Types</h1>
<p>The <code>interface</code> vs <code>type</code> debate is one of the most common TypeScript interview questions. Both can describe object shapes, but they have different capabilities and conventions.</p>

<h2>Basic Syntax</h2>
<pre><code>// Interface — describes an object shape
interface User {
  id: number;
  name: string;
  email: string;
}

// Type alias — can describe anything
type User = {
  id: number;
  name: string;
  email: string;
};</code></pre>

<h2>Extending / Composing</h2>
<pre><code>// Interface: extends keyword
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type: intersection (&amp;)
type Animal = { name: string };
type Dog = Animal &amp; { breed: string };

// Interface can extend type, type can intersect interface
interface Cat extends Animal { indoor: boolean }  // OK
type Bird = Animal &amp; { wingspan: number };         // OK</code></pre>

<h2>Declaration Merging (Interfaces Only)</h2>
<pre><code>// Declaring the same interface name MERGES them
interface Config {
  host: string;
  port: number;
}
interface Config {
  debug: boolean;  // merged into Config
}
// Config now has: host, port, debug

// WHY this matters: libraries use it to extend types
// Express example:
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;    // adds 'user' to every Request
    requestId: string;  // adds 'requestId' to every Request
  }
}

// type CANNOT do this — redeclaring is an error
type Config = { host: string };
type Config = { debug: boolean }; // Error: Duplicate identifier</code></pre>

<h2>What Only <code>type</code> Can Do</h2>
<pre><code>// 1. Union types
type Result = Success | Failure;
type Status = 'active' | 'inactive' | 'banned';

// 2. Mapped types
type Readonly&lt;T&gt; = { readonly [K in keyof T]: T[K] };

// 3. Conditional types
type IsString&lt;T&gt; = T extends string ? true : false;

// 4. Tuple types
type Pair = [string, number];

// 5. Primitive aliases
type ID = string | number;</code></pre>

<h2>Comparison Table</h2>
<table>
  <tr><th>Feature</th><th>interface</th><th>type</th></tr>
  <tr><td>Object shapes</td><td>Yes</td><td>Yes</td></tr>
  <tr><td>Extends / inherit</td><td><code>extends</code></td><td><code>&amp;</code> intersection</td></tr>
  <tr><td>Declaration merging</td><td>Yes</td><td>No</td></tr>
  <tr><td>Union types</td><td>No</td><td>Yes</td></tr>
  <tr><td>Mapped types</td><td>No</td><td>Yes</td></tr>
  <tr><td>Conditional types</td><td>No</td><td>Yes</td></tr>
  <tr><td>Tuples</td><td>Awkward</td><td>Natural</td></tr>
  <tr><td>Computed properties</td><td>No</td><td>Yes (<code>in keyof</code>)</td></tr>
  <tr><td>Implements (class)</td><td>Yes</td><td>Yes</td></tr>
  <tr><td>Performance</td><td>Slightly better (cached)</td><td>Recomputed on use</td></tr>
</table>

<h2>Index Signatures</h2>
<pre><code>// When you don't know exact keys but know value types
interface StringMap {
  [key: string]: string;
}

interface Cache {
  [key: string]: { data: unknown; ttl: number };
}

// With known + dynamic keys
interface UserMap {
  admin: User;           // known key
  [userId: string]: User; // any other string key
}</code></pre>

<h2>NestJS Convention</h2>
<pre><code>// DTOs — use class (not interface/type) because NestJS
// needs runtime metadata for validation decorators
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

// Service contracts — use interface
export interface UserService {
  findById(id: string): Promise&lt;User&gt;;
  create(dto: CreateUserDto): Promise&lt;User&gt;;
}

// Entity shapes — use interface or type
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Response types — use type (often needs unions)
type ApiResponse&lt;T&gt; =
  | { success: true; data: T }
  | { success: false; error: string };</code></pre>

<div class="warning-note">In NestJS, DTOs must be <strong>classes</strong> (not interfaces or types) because decorators like <code>@IsString()</code> and <code>@IsNotEmpty()</code> need runtime reflection metadata. Interfaces are erased at runtime.</div>

<div class="qa-block">
  <div class="qa-q">Q: Should I use <code>interface</code> or <code>type</code>? What's the team convention?</div>
  <div class="qa-a">The practical guideline: use <code>interface</code> for object shapes that might be extended or implemented by classes (DTOs, service contracts, entity definitions). Use <code>type</code> for unions, intersections, mapped types, and anything that is not a plain object shape. In NestJS specifically: classes for DTOs (runtime validation), interfaces for service/repository contracts, types for unions and utility types. The key is consistency — pick a convention and enforce it with ESLint rules (<code>@typescript-eslint/consistent-type-definitions</code>).</div>
</div>
`,
  },
  {
    id: 'ts-enums-literals',
    title: 'Enums, Literals & Const Assertions',
    category: 'TypeScript Core',
    starterCode: `// Enums, Literals & Const Assertions — JS Demo
// ==============================================

// 1. Numeric enum (compiled JS output)
// In TS: enum Direction { Up, Down, Left, Right }
// Compiles to this bidirectional object:
const Direction = { Up: 0, Down: 1, Left: 2, Right: 3 };
Direction[0] = 'Up'; Direction[1] = 'Down';
Direction[2] = 'Left'; Direction[3] = 'Right';
console.log('Numeric enum:', Direction);
console.log('Direction.Up =', Direction.Up);
console.log('Direction[0] =', Direction[0]); // reverse mapping

// 2. String enum (no reverse mapping)
const Status = Object.freeze({
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Banned: 'BANNED',
});
console.log('\\nString enum:', Status);
console.log('Status.Active =', Status.Active);

// 3. const enum — ZERO runtime footprint
// In TS: const enum Color { Red = 'RED', Blue = 'BLUE' }
// const c = Color.Red;
// Compiles to just: const c = 'RED' (inlined!)
console.log('\\nConst enum inlines to just the value: "RED"');

// 4. Union of string literals (popular enum alternative)
// type Status = 'active' | 'inactive' | 'banned';
function handleStatus(status) {
  const validStatuses = ['active', 'inactive', 'banned'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');
  console.log('Handling:', status);
}
handleStatus('active');

// 5. as const (const assertion)
// In TS: const config = { env: 'prod', port: 3000 } as const;
// This makes ALL properties readonly and literal-typed
const config = Object.freeze({ env: 'prod', port: 3000, features: ['auth', 'cache'] });
console.log('\\nas const / frozen object:', config);
// config.env = 'dev'; // Error in both TS (as const) and JS (Object.freeze)

// 6. as const array → readonly tuple
const ROLES = Object.freeze(['admin', 'user', 'guest']);
console.log('Const array:', ROLES);
// ROLES.push('superadmin'); // Error!

// 7. Comparison: which to use?
console.log('\\n=== Comparison ===');
console.log('Regular enum:    runtime object, reverse mapping, tree-shake issues');
console.log('Const enum:      zero runtime, inlined values, can break with isolatedModules');
console.log('Union literal:   zero runtime, best tree-shaking, most popular choice');
console.log('as const object: zero runtime, grouping with namespace, fully typed');`,
    content: `
<h1>Enums, Literals &amp; Const Assertions</h1>
<p>Enums are one of TypeScript's most debated features. While they provide named constants, there are often better alternatives for backend development. Understanding the tradeoffs is critical for interviews.</p>

<h2>Numeric Enums</h2>
<pre><code>enum Direction {
  Up,     // 0
  Down,   // 1
  Left,   // 2
  Right,  // 3
}

// Compiles to a bidirectional object:
// Direction[0] === 'Up'
// Direction['Up'] === 0
const d: Direction = Direction.Up;

// Problem: any number is assignable!
const invalid: Direction = 99; // No error! This is a known TS issue</code></pre>

<h2>String Enums</h2>
<pre><code>enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Banned = 'BANNED',
}

// No reverse mapping (good — smaller output)
// Values are descriptive (great for logging, DB storage)
console.log(Status.Active); // 'ACTIVE'</code></pre>

<h2>Const Enums — Zero Runtime Cost</h2>
<pre><code>const enum Color {
  Red = 'RED',
  Blue = 'BLUE',
  Green = 'GREEN',
}

const c = Color.Red;
// Compiled JS: const c = 'RED';  (inlined, no object!)

// Benefits: zero bundle size, no runtime object
// Caveat: breaks with isolatedModules (needed for SWC/esbuild)
// Caveat: cannot iterate over values at runtime</code></pre>

<h2>Literal Types &amp; Template Literals</h2>
<pre><code>// String literal union — most popular enum alternative
type Status = 'active' | 'inactive' | 'banned';

// Numeric literal
type HttpSuccessCode = 200 | 201 | 204;

// Template literal types — build patterns
type EventName = \`on\${'Click' | 'Hover' | 'Focus'}\`;
// Result: 'onClick' | 'onHover' | 'onFocus'

type CrudAction = \`\${'get' | 'create' | 'update' | 'delete'}User\`;
// Result: 'getUser' | 'createUser' | 'updateUser' | 'deleteUser'</code></pre>

<h2><code>as const</code> Assertions</h2>
<pre><code>// Without as const — types are widened
const config = { env: 'prod', port: 3000 };
// Type: { env: string; port: number }

// With as const — types are narrowed to literals, everything readonly
const config = { env: 'prod', port: 3000 } as const;
// Type: { readonly env: 'prod'; readonly port: 3000 }

// as const arrays become readonly tuples
const ROLES = ['admin', 'user', 'guest'] as const;
// Type: readonly ['admin', 'user', 'guest']

// Extract union type from as const array
type Role = typeof ROLES[number]; // 'admin' | 'user' | 'guest'</code></pre>

<h2>Enum Alternatives: Object as const</h2>
<pre><code>// Instead of enum, use object + as const
const Status = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Banned: 'BANNED',
} as const;

// Extract the value union type
type StatusType = typeof Status[keyof typeof Status];
// 'ACTIVE' | 'INACTIVE' | 'BANNED'

// Use it
function setStatus(status: StatusType) { /* ... */ }
setStatus(Status.Active);   // OK
setStatus('ACTIVE');         // OK
setStatus('INVALID');        // Error!</code></pre>

<h2>Comparison Table</h2>
<table>
  <tr><th>Approach</th><th>Runtime object?</th><th>Tree-shakable?</th><th>isolatedModules?</th><th>Iterable?</th><th>Best for</th></tr>
  <tr><td><code>enum</code></td><td>Yes (IIFE)</td><td>No</td><td>Yes</td><td>Yes</td><td>Legacy code</td></tr>
  <tr><td><code>const enum</code></td><td>No (inlined)</td><td>Yes</td><td>No</td><td>No</td><td>Performance-critical, single-file</td></tr>
  <tr><td>Union literal</td><td>No</td><td>Yes</td><td>Yes</td><td>No</td><td>Simple status/role values</td></tr>
  <tr><td><code>as const</code> object</td><td>Yes (plain obj)</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Namespaced constants, iteration needed</td></tr>
</table>

<div class="warning-note">If your project uses <code>isolatedModules: true</code> (required for SWC, esbuild, and most modern bundlers), <code>const enum</code> will not work. Use union literals or <code>as const</code> objects instead.</div>

<div class="qa-block">
  <div class="qa-q">Q: Why do some teams avoid enums entirely?</div>
  <div class="qa-a">Several reasons: (1) Regular enums compile to IIFEs that are not tree-shakable, adding unnecessary runtime code. (2) Numeric enums allow any number to be assigned, weakening type safety. (3) Const enums break with <code>isolatedModules</code> which is required by SWC, esbuild, and Vite. (4) Enums are a TypeScript-specific construct — they don't exist in JavaScript and may confuse developers coming from JS. The modern alternative is union string literals for simple cases (<code>type Status = 'active' | 'inactive'</code>) or <code>as const</code> objects when you need runtime values and iteration.</div>
</div>
`,
  },
  {
    id: 'ts-type-narrowing',
    title: 'Type Guards & Narrowing',
    category: 'TypeScript Core',
    starterCode: `// Type Guards & Narrowing — JS Playground Demo
// =============================================

// 1. typeof narrowing
function formatValue(val) {
  if (typeof val === 'string') return '"' + val + '"';
  if (typeof val === 'number') return val.toFixed(2);
  if (typeof val === 'boolean') return val ? 'YES' : 'NO';
  return String(val);
}
console.log('=== typeof narrowing ===');
console.log(formatValue('hello'), formatValue(3.14159), formatValue(true));

// 2. instanceof narrowing
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

function handleError(err) {
  if (err instanceof ApiError) {
    console.log('API Error [' + err.statusCode + ']:', err.message);
  } else if (err instanceof Error) {
    console.log('Generic Error:', err.message);
  } else {
    console.log('Unknown error:', err);
  }
}
console.log('\\n=== instanceof narrowing ===');
handleError(new ApiError('Not Found', 404));
handleError(new Error('Something broke'));

// 3. 'in' operator narrowing
function describeShape(shape) {
  if ('radius' in shape) {
    console.log('Circle with radius', shape.radius);
  } else if ('width' in shape) {
    console.log('Rectangle', shape.width, 'x', shape.height);
  }
}
console.log('\\n=== "in" narrowing ===');
describeShape({ radius: 5 });
describeShape({ width: 10, height: 20 });

// 4. Custom type guard (is keyword concept)
function isUser(obj) {
  return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj;
}

const data = [
  { id: 1, name: 'Arvind' },
  { message: 'not a user' },
  { id: 2, name: 'John' },
  null,
];
console.log('\\n=== Custom type guard ===');
console.log('Users:', data.filter(isUser));

// 5. Discriminated unions (tagged unions)
function handleEvent(event) {
  switch (event.type) {
    case 'user.created':
      console.log('New user:', event.userId, event.email);
      break;
    case 'order.placed':
      console.log('Order:', event.orderId, 'amount:', event.amount);
      break;
    case 'payment.failed':
      console.log('Payment failed for order:', event.orderId, 'reason:', event.reason);
      break;
    default:
      console.log('Unknown event:', event.type);
  }
}
console.log('\\n=== Discriminated unions ===');
handleEvent({ type: 'user.created', userId: '123', email: 'a@b.com' });
handleEvent({ type: 'order.placed', orderId: 'O-1', amount: 99.99 });
handleEvent({ type: 'payment.failed', orderId: 'O-1', reason: 'insufficient funds' });

// 6. Exhaustive checking with never
function getStatusLabel(status) {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'banned': return 'Banned';
    default:
      // In TS: const _never: never = status;
      // If a new status is added but not handled, TS errors here
      throw new Error('Unhandled status: ' + status);
  }
}
console.log('\\n=== Exhaustive check ===');
console.log(getStatusLabel('active'));`,
    content: `
<h1>Type Guards &amp; Narrowing</h1>
<p>Type narrowing is how TypeScript goes from a broad type to a more specific one inside a code block. It is <strong>the single most important skill</strong> for writing safe TypeScript — especially when handling API responses, message queues, and external data.</p>

<h2>typeof Narrowing</h2>
<pre><code>function processInput(input: string | number | boolean): string {
  if (typeof input === 'string') {
    return input.toUpperCase();  // TS knows: string
  }
  if (typeof input === 'number') {
    return input.toFixed(2);     // TS knows: number
  }
  return input ? 'yes' : 'no';  // TS knows: boolean
}
// typeof works for: 'string', 'number', 'boolean',
// 'symbol', 'bigint', 'undefined', 'function', 'object'</code></pre>

<h2>instanceof Narrowing</h2>
<pre><code>class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function handleError(err: unknown): void {
  if (err instanceof HttpError) {
    console.log(err.statusCode); // TS knows: HttpError
  } else if (err instanceof Error) {
    console.log(err.message);    // TS knows: Error
  } else {
    console.log('Unknown:', err); // TS knows: unknown
  }
}</code></pre>

<h2><code>in</code> Operator Narrowing</h2>
<pre><code>type Circle = { radius: number };
type Rect = { width: number; height: number };
type Shape = Circle | Rect;

function area(shape: Shape): number {
  if ('radius' in shape) {
    return Math.PI * shape.radius ** 2; // narrowed to Circle
  }
  return shape.width * shape.height;    // narrowed to Rect
}</code></pre>

<h2>Custom Type Guards (<code>is</code> keyword)</h2>
<pre><code>// The 'is' keyword tells TS: if this returns true,
// the parameter is of the specified type
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &amp;&amp;
    data !== null &amp;&amp;
    'id' in data &amp;&amp;
    'name' in data &amp;&amp;
    typeof (data as User).id === 'string'
  );
}

// Now TS narrows automatically:
function handle(input: unknown) {
  if (isUser(input)) {
    console.log(input.name); // TS knows: User
  }
}

// Array filtering with type guards:
const items: unknown[] = getItems();
const users: User[] = items.filter(isUser); // correctly typed!</code></pre>

<h2>Discriminated Unions — The Most Powerful Pattern</h2>
<pre><code>// Every variant has a common literal 'type' field
type Event =
  | { type: 'user.created'; userId: string; email: string }
  | { type: 'order.placed'; orderId: string; amount: number }
  | { type: 'payment.failed'; orderId: string; reason: string };

function handleEvent(event: Event): void {
  switch (event.type) {
    case 'user.created':
      // TS knows: { type: 'user.created'; userId; email }
      sendWelcomeEmail(event.email);
      break;
    case 'order.placed':
      // TS knows: { type: 'order.placed'; orderId; amount }
      processOrder(event.orderId, event.amount);
      break;
    case 'payment.failed':
      notifySupport(event.orderId, event.reason);
      break;
  }
}

// This pattern is EVERYWHERE in backend:
// - Kafka message handlers (different event types)
// - WebSocket message handlers
// - Redux actions
// - State machines</code></pre>

<h2>Exhaustive Checking with <code>never</code></h2>
<pre><code>type Status = 'active' | 'inactive' | 'banned';

function getLabel(status: Status): string {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'banned': return 'Banned';
    default:
      // If someone adds 'suspended' to Status but forgets this switch,
      // TS will error here: Type 'string' is not assignable to 'never'
      const _exhaustive: never = status;
      throw new Error('Unhandled status');
  }
}

// Helper function for exhaustive checks:
function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}</code></pre>

<h2>Assertion Functions</h2>
<pre><code>// Assert functions narrow the type for ALL subsequent code
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new Error('Expected string, got ' + typeof val);
  }
}

function process(input: unknown) {
  assertIsString(input);
  // From here on, TS knows input is string
  console.log(input.toUpperCase());
}</code></pre>

<h2>Real Example: Narrowing API Responses</h2>
<pre><code>type ApiResponse&lt;T&gt; =
  | { success: true; data: T; timestamp: string }
  | { success: false; error: string; code: number };

async function fetchUser(id: string): Promise&lt;User&gt; {
  const res = await fetch('/api/users/' + id);
  const json: ApiResponse&lt;User&gt; = await res.json();

  if (!json.success) {
    // Narrowed to error variant
    throw new HttpError(json.code, json.error);
  }

  // Narrowed to success variant
  return json.data; // TS knows this is User
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How do you safely narrow an <code>unknown</code> API response?</div>
  <div class="qa-a">Three-step approach: (1) Parse the raw data as <code>unknown</code> (never use <code>any</code>). (2) Write a custom type guard with <code>is</code> that checks the shape at runtime — verify all required fields exist and have correct types. (3) Use the type guard in an if-block; inside it, TS narrows to the specific type. For production apps, use a validation library like Zod or class-validator that both validates and narrows in one step. Example: <code>const result = UserSchema.safeParse(data); if (result.success) { /* result.data is User */ }</code></div>
</div>
`,
  },

  // ─────────────────────────────────────────────────────────────
  // TypeScript Advanced
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ts-generics',
    title: 'Generics Deep Dive',
    category: 'TypeScript Advanced',
    starterCode: `// Generics Deep Dive — JS Playground Demo
// ========================================

// 1. Generic function (JS simulation)
function identity(val) { return val; }
console.log('identity(42):', identity(42));
console.log('identity("hello"):', identity('hello'));

// 2. Generic constraints
function getLength(item) {
  // In TS: function getLength<T extends { length: number }>(item: T)
  if (item && typeof item.length === 'number') return item.length;
  throw new Error('No length property');
}
console.log('\\ngetLength("hello"):', getLength('hello'));
console.log('getLength([1,2,3]):', getLength([1, 2, 3]));

// 3. Generic API response wrapper
class ApiResponse {
  constructor(data, error = null) {
    this.data = data;
    this.error = error;
    this.success = !error;
    this.timestamp = new Date().toISOString();
  }

  static ok(data) { return new ApiResponse(data); }
  static fail(error) { return new ApiResponse(null, error); }

  map(fn) {
    if (!this.success) return this;
    return ApiResponse.ok(fn(this.data));
  }
}

const userResponse = ApiResponse.ok({ id: 1, name: 'Arvind' });
console.log('\\n=== ApiResponse<User> ===');
console.log(userResponse);
console.log('Mapped:', userResponse.map(u => u.name));

const errorResponse = ApiResponse.fail('Not Found');
console.log('Error:', errorResponse);
console.log('Mapped error (no-op):', errorResponse.map(u => u.name));

// 4. Generic Repository pattern
class BaseRepository {
  constructor(name) {
    this.name = name;
    this.store = new Map();
    this.nextId = 1;
  }
  create(entity) {
    const id = String(this.nextId++);
    const record = { ...entity, id };
    this.store.set(id, record);
    return record;
  }
  findById(id) { return this.store.get(id) || null; }
  findAll() { return [...this.store.values()]; }
  update(id, partial) {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...partial };
    this.store.set(id, updated);
    return updated;
  }
  delete(id) { return this.store.delete(id); }
}

console.log('\\n=== Generic Repository ===');
const userRepo = new BaseRepository('users');
userRepo.create({ name: 'Arvind', email: 'a@b.com' });
userRepo.create({ name: 'John', email: 'j@b.com' });
console.log('All users:', userRepo.findAll());
console.log('Find id 1:', userRepo.findById('1'));
userRepo.update('1', { name: 'Arvind Okram' });
console.log('Updated:', userRepo.findById('1'));

// 5. Conditional type simulation
function unwrapPromise(val) {
  // In TS: type Unwrap<T> = T extends Promise<infer U> ? U : T;
  if (val instanceof Promise) return 'Would unwrap the Promise value';
  return val;
}
console.log('\\nUnwrap non-promise:', unwrapPromise(42));`,
    content: `
<h1>Generics Deep Dive</h1>
<p>Generics are the backbone of reusable, type-safe code in TypeScript. Every NestJS repository, every API response wrapper, every service contract uses generics. Mastering them is non-negotiable for an SDE-2.</p>

<h2>Generic Functions</h2>
<pre><code>// Basic generic — T is a type parameter
function identity&lt;T&gt;(value: T): T {
  return value;
}
const num = identity(42);       // T inferred as number
const str = identity('hello');  // T inferred as string

// Multiple generics
function merge&lt;T, U&gt;(a: T, b: U): T &amp; U {
  return { ...a, ...b };
}
const merged = merge({ name: 'Arvind' }, { role: 'SDE-2' });
// Type: { name: string } &amp; { role: string }</code></pre>

<h2>Generic Constraints with <code>extends</code></h2>
<pre><code>// Constrain T to types that have a length property
function getLength&lt;T extends { length: number }&gt;(item: T): number {
  return item.length;
}
getLength('hello');    // OK — string has .length
getLength([1, 2, 3]); // OK — array has .length
getLength(42);         // Error — number has no .length

// Constrain to keys of an object
function getProperty&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { name: 'Arvind', age: 28 };
getProperty(user, 'name'); // OK, returns string
getProperty(user, 'foo');  // Error — 'foo' not in keyof User</code></pre>

<h2>Default Generic Parameters</h2>
<pre><code>// Default type when caller doesn't specify
interface ApiResponse&lt;T = unknown&gt; {
  data: T;
  status: number;
  timestamp: string;
}

const res1: ApiResponse&lt;User&gt; = { ... };   // T = User
const res2: ApiResponse = { ... };           // T = unknown (default)</code></pre>

<h2>Generic API Response Wrapper</h2>
<pre><code>// This pattern is used in every backend project
type ApiResponse&lt;T&gt; =
  | { success: true; data: T; meta?: PaginationMeta }
  | { success: false; error: string; code: number };

// Usage in controller/service
async function getUser(id: string): Promise&lt;ApiResponse&lt;User&gt;&gt; {
  const user = await userService.findById(id);
  if (!user) {
    return { success: false, error: 'User not found', code: 404 };
  }
  return { success: true, data: user };
}

// Callers get full type safety:
const response = await getUser('123');
if (response.success) {
  console.log(response.data.name); // TS knows data is User
}</code></pre>

<h2>Generic Repository Pattern (NestJS)</h2>
<pre><code>// Base repository — works with any entity
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

abstract class BaseRepository&lt;T extends BaseEntity&gt; {
  constructor(
    protected readonly repo: Repository&lt;T&gt;,
  ) {}

  async findById(id: string): Promise&lt;T | null&gt; {
    return this.repo.findOne({ where: { id } as any });
  }

  async findAll(options?: FindManyOptions&lt;T&gt;): Promise&lt;T[]&gt; {
    return this.repo.find(options);
  }

  async create(data: DeepPartial&lt;T&gt;): Promise&lt;T&gt; {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: DeepPartial&lt;T&gt;): Promise&lt;T | null&gt; {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise&lt;boolean&gt; {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) &gt; 0;
  }
}

// Concrete repository
class UserRepository extends BaseRepository&lt;UserEntity&gt; {
  async findByEmail(email: string): Promise&lt;UserEntity | null&gt; {
    return this.repo.findOne({ where: { email } });
  }
}</code></pre>

<h2>Conditional Types &amp; <code>infer</code></h2>
<pre><code>// Conditional type: T extends U ? X : Y
type IsString&lt;T&gt; = T extends string ? true : false;
type A = IsString&lt;'hello'&gt;;  // true
type B = IsString&lt;42&gt;;       // false

// infer — extract a type from inside another type
type UnwrapPromise&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;
type X = UnwrapPromise&lt;Promise&lt;string&gt;&gt;;  // string
type Y = UnwrapPromise&lt;number&gt;;            // number

// Extract return type of a function
type ReturnOf&lt;T&gt; = T extends (...args: any[]) =&gt; infer R ? R : never;
type R = ReturnOf&lt;() =&gt; string&gt;; // string

// Extract array element type
type ElementOf&lt;T&gt; = T extends (infer E)[] ? E : never;
type E = ElementOf&lt;string[]&gt;; // string</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Write a generic type that makes all properties optional recursively (DeepPartial).</div>
  <div class="qa-a"><pre><code>type DeepPartial&lt;T&gt; = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array&lt;infer U&gt;
      ? Array&lt;DeepPartial&lt;U&gt;&gt;
      : DeepPartial&lt;T[K]&gt;
    : T[K];
};

// Usage:
interface Config {
  db: { host: string; port: number; ssl: { enabled: boolean; cert: string } };
  cache: { ttl: number };
}
type PartialConfig = DeepPartial&lt;Config&gt;;
// { db?: { host?: string; port?: number; ssl?: { enabled?: boolean; cert?: string } }; cache?: { ttl?: number } }</code></pre></div>
</div>
`,
  },
  {
    id: 'ts-utility-types',
    title: 'Utility Types Mastery',
    category: 'TypeScript Advanced',
    starterCode: `// Utility Types Mastery — JS Playground Demo
// ============================================

// Setup: a User object we'll transform
const user = { id: '1', name: 'Arvind', email: 'a@b.com', role: 'sde2', age: 28 };
console.log('Original user:', user);

// 1. Partial — make all fields optional (for updates)
function updateUser(id, partial) {
  // In TS: function updateUser(id: string, partial: Partial<User>)
  console.log('Updating user', id, 'with:', partial);
  return { ...user, ...partial };
}
console.log('\\n=== Partial ===');
console.log(updateUser('1', { name: 'Arvind Okram' }));

// 2. Pick — select only certain fields
function pickFields(obj, keys) {
  // In TS: type UserPreview = Pick<User, 'name' | 'email'>
  return Object.fromEntries(keys.map(k => [k, obj[k]]));
}
console.log('\\n=== Pick ===');
console.log('Pick name, email:', pickFields(user, ['name', 'email']));

// 3. Omit — exclude certain fields
function omitFields(obj, keys) {
  // In TS: type SafeUser = Omit<User, 'password' | 'ssn'>
  const result = { ...obj };
  keys.forEach(k => delete result[k]);
  return result;
}
console.log('\\n=== Omit ===');
console.log('Omit id, role:', omitFields(user, ['id', 'role']));

// 4. Record — typed key-value map
console.log('\\n=== Record ===');
const statusLabels = { active: 'Active User', inactive: 'Deactivated', banned: 'Banned' };
// In TS: Record<Status, string>
console.log('Status labels:', statusLabels);

// 5. Readonly — prevent mutation
console.log('\\n=== Readonly ===');
const frozenUser = Object.freeze({ ...user });
try { frozenUser.name = 'Changed'; } catch(e) { console.log('Cannot mutate:', e.message); }
console.log('Still:', frozenUser.name);

// 6. ReturnType / Parameters simulation
function greet(name, age) { return name + ' is ' + age; }
console.log('\\n=== ReturnType / Parameters ===');
console.log('Return type of greet:', typeof greet('A', 1));
console.log('greet.length (param count):', greet.length);

// 7. Composing utility types
// Partial<Pick<User, 'name' | 'email'>> = optional name and email only
function optionalUpdate(data) {
  // data: { name?: string; email?: string }
  console.log('Optional update:', data);
}
console.log('\\n=== Composed types ===');
optionalUpdate({ name: 'NewName' });
optionalUpdate({ email: 'new@email.com' });
optionalUpdate({});

// 8. Awaited — unwrap Promise types
async function fetchData() { return { id: 1, value: 'data' }; }
fetchData().then(result => {
  // In TS: type Result = Awaited<ReturnType<typeof fetchData>>
  console.log('\\n=== Awaited ===');
  console.log('Unwrapped promise result:', result);
});`,
    content: `
<h1>Utility Types Mastery</h1>
<p>TypeScript ships with powerful built-in utility types that transform existing types. In backend development, you use these constantly for DTOs, API responses, repository methods, and config objects.</p>

<h2>Reference Table</h2>
<table>
  <tr><th>Utility Type</th><th>What it does</th><th>Common use case</th></tr>
  <tr><td><code>Partial&lt;T&gt;</code></td><td>All properties optional</td><td>Update DTOs, patch endpoints</td></tr>
  <tr><td><code>Required&lt;T&gt;</code></td><td>All properties required</td><td>Ensure config is complete</td></tr>
  <tr><td><code>Readonly&lt;T&gt;</code></td><td>All properties readonly</td><td>Immutable configs, frozen state</td></tr>
  <tr><td><code>Pick&lt;T, K&gt;</code></td><td>Select specific properties</td><td>API response subsets</td></tr>
  <tr><td><code>Omit&lt;T, K&gt;</code></td><td>Remove specific properties</td><td>Strip sensitive fields (password)</td></tr>
  <tr><td><code>Record&lt;K, V&gt;</code></td><td>Object with typed keys/values</td><td>Lookup maps, dictionaries</td></tr>
  <tr><td><code>Extract&lt;T, U&gt;</code></td><td>Keep union members matching U</td><td>Filter event types</td></tr>
  <tr><td><code>Exclude&lt;T, U&gt;</code></td><td>Remove union members matching U</td><td>Remove null/undefined from union</td></tr>
  <tr><td><code>NonNullable&lt;T&gt;</code></td><td>Remove null &amp; undefined</td><td>Guaranteed non-null values</td></tr>
  <tr><td><code>ReturnType&lt;T&gt;</code></td><td>Extract function return type</td><td>Infer service method returns</td></tr>
  <tr><td><code>Parameters&lt;T&gt;</code></td><td>Extract function param types</td><td>Forwarding function arguments</td></tr>
  <tr><td><code>Awaited&lt;T&gt;</code></td><td>Unwrap Promise type</td><td>Get resolved type of async functions</td></tr>
</table>

<h2>Practical Examples</h2>
<pre><code>interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Update DTO — all fields optional
type UpdateUserDto = Partial&lt;Pick&lt;User, 'name' | 'email' | 'role'&gt;&gt;;
// { name?: string; email?: string; role?: 'admin' | 'user' }

// API response — no password
type SafeUser = Omit&lt;User, 'password'&gt;;

// User list item — just key fields
type UserListItem = Pick&lt;User, 'id' | 'name' | 'role'&gt;;

// Status map
type StatusMap = Record&lt;User['role'], string[]&gt;;
// { admin: string[]; user: string[] }</code></pre>

<h2>Composing Utility Types</h2>
<pre><code>// Optional name and email only
type OptionalContact = Partial&lt;Pick&lt;User, 'name' | 'email'&gt;&gt;;

// Everything required except id (for creation)
type CreateUser = Required&lt;Omit&lt;User, 'id' | 'createdAt'&gt;&gt;;

// Readonly safe user (for caching)
type CachedUser = Readonly&lt;Omit&lt;User, 'password'&gt;&gt;;</code></pre>

<h2>Custom Utility Types</h2>
<pre><code>// DeepPartial — recursively make everything optional
type DeepPartial&lt;T&gt; = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial&lt;T[K]&gt;
    : T[K];
};

// DeepReadonly — recursively make everything readonly
type DeepReadonly&lt;T&gt; = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly&lt;T[K]&gt;
    : T[K];
};

// Nullable — make all properties nullable
type Nullable&lt;T&gt; = {
  [K in keyof T]: T[K] | null;
};

// PickByType — pick properties of a specific type
type PickByType&lt;T, V&gt; = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type StringFields = PickByType&lt;User, string&gt;;
// { id: string; name: string; email: string; password: string }</code></pre>

<h2>Mapped Types with Key Remapping</h2>
<pre><code>// Getters for all properties
type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K];
};
type UserGetters = Getters&lt;User&gt;;
// { getName: () => string; getEmail: () => string; ... }

// Remove readonly
type Mutable&lt;T&gt; = {
  -readonly [K in keyof T]: T[K];
};</code></pre>

<h2>Template Literal Types</h2>
<pre><code>// Build typed route patterns
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiVersion = 'v1' | 'v2';
type Resource = 'users' | 'orders' | 'products';

type ApiRoute = \`/api/\${ApiVersion}/\${Resource}\`;
// '/api/v1/users' | '/api/v1/orders' | ... (12 combinations)

// Event names
type DomainEvent = \`\${'user' | 'order'}.\${'created' | 'updated' | 'deleted'}\`;
// 'user.created' | 'user.updated' | ... (6 combinations)</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: Implement a <code>DeepReadonly</code> type.</div>
  <div class="qa-a"><pre><code>type DeepReadonly&lt;T&gt; = T extends Function
  ? T  // don't make functions readonly
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly&lt;T[K]&gt; }
    : T; // primitives are already immutable

// Test:
interface Config {
  db: { host: string; credentials: { user: string; pass: string } };
  features: string[];
}
type FrozenConfig = DeepReadonly&lt;Config&gt;;
// All nested properties are readonly — db.host, db.credentials.user, etc.
// features is readonly string[] — cannot push/pop</code></pre></div>
</div>
`,
  },
  {
    id: 'ts-mapped-conditional',
    title: 'Mapped & Conditional Types',
    category: 'TypeScript Advanced',
    starterCode: `// Mapped & Conditional Types — JS Playground Demo
// ================================================

// 1. Mapped type concept: transform every property
const user = { name: 'Arvind', email: 'a@b.com', age: 28 };

// Make all properties "getter" functions (simulating mapped type)
function createGetters(obj) {
  const getters = {};
  for (const [key, value] of Object.entries(obj)) {
    const capitalizedKey = 'get' + key.charAt(0).toUpperCase() + key.slice(1);
    getters[capitalizedKey] = () => value;
  }
  return getters;
}
const userGetters = createGetters(user);
console.log('=== Mapped Types (Getters) ===');
console.log('getName():', userGetters.getName());
console.log('getEmail():', userGetters.getEmail());
console.log('getAge():', userGetters.getAge());

// 2. Conditional type concept: different behavior based on type
function processValue(val) {
  if (typeof val === 'string') return val.toUpperCase();
  if (typeof val === 'number') return val * 2;
  if (Array.isArray(val)) return val.length;
  return val;
}
console.log('\\n=== Conditional Types ===');
console.log('string:', processValue('hello'));
console.log('number:', processValue(21));
console.log('array:', processValue([1,2,3]));

// 3. Distributive behavior with arrays (unions)
const mixed = ['hello', 42, true, [1,2], 'world', 7];
const processed = mixed.map(processValue);
console.log('Distributed over union:', processed);

// 4. Key remapping — transform property names
function remapKeys(obj, transform) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [transform(k), v])
  );
}
console.log('\\n=== Key Remapping ===');
console.log('UPPERCASED:', remapKeys(user, k => k.toUpperCase()));
console.log('prefixed:', remapKeys(user, k => 'user_' + k));

// 5. Building a typed event emitter
class TypedEventEmitter {
  constructor() { this.listeners = {}; }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return this;
  }

  emit(event, data) {
    const handlers = this.listeners[event] || [];
    handlers.forEach(h => h(data));
  }
}

console.log('\\n=== Typed Event Emitter ===');
const emitter = new TypedEventEmitter();
emitter.on('user.created', (data) => console.log('User created:', data));
emitter.on('order.placed', (data) => console.log('Order placed:', data));
emitter.emit('user.created', { id: 1, name: 'Arvind' });
emitter.emit('order.placed', { orderId: 'O-1', total: 99.99 });

// 6. Make all methods async (mapped type concept)
function makeAsync(obj) {
  const asyncObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'function') {
      asyncObj[key] = async (...args) => value(...args);
    } else {
      asyncObj[key] = value;
    }
  }
  return asyncObj;
}
const syncService = {
  getName: () => 'Arvind',
  getAge: () => 28,
  title: 'SDE-2',
};
const asyncService = makeAsync(syncService);
console.log('\\n=== Asyncified Service ===');
Promise.all([asyncService.getName(), asyncService.getAge()])
  .then(([name, age]) => console.log('Async results:', name, age));`,
    content: `
<h1>Mapped &amp; Conditional Types</h1>
<p>Mapped and conditional types are the <strong>meta-programming layer</strong> of TypeScript. They let you create new types by transforming existing ones — essential for building type-safe libraries, APIs, and framework abstractions.</p>

<h2>Mapped Types Basics</h2>
<pre><code>// Transform every property of T
type Readonly&lt;T&gt; = {
  readonly [K in keyof T]: T[K];
};

type Optional&lt;T&gt; = {
  [K in keyof T]?: T[K];
};

// Make all properties nullable
type Nullable&lt;T&gt; = {
  [K in keyof T]: T[K] | null;
};

interface User {
  name: string;
  email: string;
  age: number;
}

type ReadonlyUser = Readonly&lt;User&gt;;
// { readonly name: string; readonly email: string; readonly age: number }</code></pre>

<h2>Key Remapping with <code>as</code></h2>
<pre><code>// Rename keys during mapping
type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K];
};
type UserGetters = Getters&lt;User&gt;;
// { getName: () => string; getEmail: () => string; getAge: () => number }

// Setters
type Setters&lt;T&gt; = {
  [K in keyof T as \`set\${Capitalize&lt;string &amp; K&gt;}\`]: (value: T[K]) =&gt; void;
};

// Filter keys by value type (remove non-string properties)
type OnlyStrings&lt;T&gt; = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
type StringUser = OnlyStrings&lt;User&gt;;
// { name: string; email: string } — age removed!</code></pre>

<h2>Conditional Types</h2>
<pre><code>// Basic: T extends U ? X : Y
type IsString&lt;T&gt; = T extends string ? 'yes' : 'no';
type A = IsString&lt;'hello'&gt;;  // 'yes'
type B = IsString&lt;42&gt;;       // 'no'

// Flatten nested arrays
type Flatten&lt;T&gt; = T extends Array&lt;infer U&gt; ? U : T;
type X = Flatten&lt;string[]&gt;;   // string
type Y = Flatten&lt;number&gt;;     // number

// Extract function return type
type GetReturn&lt;T&gt; = T extends (...args: any[]) =&gt; infer R ? R : never;
type R = GetReturn&lt;() =&gt; Promise&lt;User&gt;&gt;; // Promise&lt;User&gt;

// Unwrap nested promises
type DeepAwaited&lt;T&gt; = T extends Promise&lt;infer U&gt; ? DeepAwaited&lt;U&gt; : T;
type Z = DeepAwaited&lt;Promise&lt;Promise&lt;string&gt;&gt;&gt;; // string</code></pre>

<h2>Distributive Conditional Types</h2>
<pre><code>// When T is a union, conditional types DISTRIBUTE over each member
type ToArray&lt;T&gt; = T extends any ? T[] : never;
type Distributed = ToArray&lt;string | number&gt;;
// = (string extends any ? string[] : never) | (number extends any ? number[] : never)
// = string[] | number[]   (NOT (string | number)[])

// To PREVENT distribution, wrap in tuple:
type ToArrayNonDist&lt;T&gt; = [T] extends [any] ? T[] : never;
type NonDist = ToArrayNonDist&lt;string | number&gt;;
// = (string | number)[]</code></pre>

<h2>Real Pattern: Make All Methods Async</h2>
<pre><code>// Transform a sync service interface to async
type Asyncify&lt;T&gt; = {
  [K in keyof T]: T[K] extends (...args: infer A) =&gt; infer R
    ? (...args: A) =&gt; Promise&lt;R&gt;
    : T[K];
};

interface SyncUserService {
  findById(id: string): User | null;
  findAll(): User[];
  create(data: CreateUserDto): User;
}

type AsyncUserService = Asyncify&lt;SyncUserService&gt;;
// {
//   findById(id: string): Promise&lt;User | null&gt;;
//   findAll(): Promise&lt;User[]&gt;;
//   create(data: CreateUserDto): Promise&lt;User&gt;;
// }</code></pre>

<h2>Real Pattern: Typed Event Emitter</h2>
<pre><code>// Define event map
interface EventMap {
  'user.created': { userId: string; email: string };
  'order.placed': { orderId: string; total: number };
  'payment.failed': { orderId: string; reason: string };
}

// Typed event emitter using mapped types
class TypedEmitter&lt;Events extends Record&lt;string, any&gt;&gt; {
  private listeners = new Map&lt;string, Function[]&gt;();

  on&lt;K extends keyof Events&gt;(
    event: K,
    handler: (data: Events[K]) =&gt; void
  ): this {
    const handlers = this.listeners.get(event as string) || [];
    handlers.push(handler);
    this.listeners.set(event as string, handlers);
    return this;
  }

  emit&lt;K extends keyof Events&gt;(event: K, data: Events[K]): void {
    const handlers = this.listeners.get(event as string) || [];
    handlers.forEach(h =&gt; h(data));
  }
}

const emitter = new TypedEmitter&lt;EventMap&gt;();
emitter.on('user.created', (data) =&gt; {
  // TS knows: data is { userId: string; email: string }
  console.log(data.email);
});
emitter.emit('order.placed', { orderId: '1', total: 99 }); // OK
emitter.emit('order.placed', { wrong: 'field' }); // Error!</code></pre>

<h2>Real Pattern: Extract Service Method Returns</h2>
<pre><code>// Extract return types from all methods of a class
type MethodReturns&lt;T&gt; = {
  [K in keyof T]: T[K] extends (...args: any[]) =&gt; infer R ? R : never;
};

type UserServiceReturns = MethodReturns&lt;UserService&gt;;
// { findById: Promise&lt;User | null&gt;; findAll: Promise&lt;User[]&gt;; ... }</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What does "distributive conditional type" mean?</div>
  <div class="qa-a">When you write <code>T extends U ? X : Y</code> and T is a <strong>naked type parameter</strong> (not wrapped in a tuple or array), TypeScript distributes the condition over each member of a union separately. So <code>ToArray&lt;string | number&gt;</code> becomes <code>ToArray&lt;string&gt; | ToArray&lt;number&gt;</code> which is <code>string[] | number[]</code>, not <code>(string | number)[]</code>. This is powerful for filtering unions (like <code>Exclude</code> and <code>Extract</code>), but can be surprising. To prevent distribution, wrap in a tuple: <code>[T] extends [U] ? X : Y</code>.</div>
</div>
`,
  },
  {
    id: 'ts-decorators',
    title: 'Decorators & Metadata',
    category: 'TypeScript Advanced',
    starterCode: `// Decorators & Metadata — JS Playground Demo
// ============================================
// Decorators are just functions that modify classes/methods.
// Here we implement them in plain JS to show how they work.

// 1. Class decorator
function Injectable(target) {
  target.__injectable = true;
  console.log('@Injectable applied to:', target.name);
  return target;
}

// 2. Method decorator — logging
function Log(target, propertyKey, descriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args) {
    console.log('[LOG]', propertyKey, 'called with:', args);
    const result = original.apply(this, args);
    console.log('[LOG]', propertyKey, 'returned:', result);
    return result;
  };
  return descriptor;
}

// 3. Retry decorator factory
function Retry(maxRetries = 3) {
  return function(target, propertyKey, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function(...args) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await original.apply(this, args);
        } catch(err) {
          console.log('[RETRY]', propertyKey, 'attempt', attempt, 'failed:', err.message);
          if (attempt === maxRetries) throw err;
        }
      }
    };
    return descriptor;
  };
}

// 4. Roles decorator (stores metadata)
function Roles(...roles) {
  return function(target, propertyKey) {
    if (!target.__roles) target.__roles = {};
    target.__roles[propertyKey] = roles;
    console.log('@Roles(' + roles.join(', ') + ') on', propertyKey);
  };
}

// Apply decorators (manually in JS — TS does this automatically)
class UserService {
  constructor() { this.users = [{ id: '1', name: 'Arvind' }]; }
  findById(id) { return this.users.find(u => u.id === id) || null; }
  deleteUser(id) { return { deleted: true, id }; }
}

// Apply class decorator
Injectable(UserService);

// Apply method decorators
const findDescriptor = Object.getOwnPropertyDescriptor(UserService.prototype, 'findById');
Log(UserService.prototype, 'findById', findDescriptor);
Object.defineProperty(UserService.prototype, 'findById', findDescriptor);

// Apply roles metadata
Roles('admin')(UserService.prototype, 'deleteUser');

console.log('\\n=== Using decorated service ===');
const svc = new UserService();
console.log('Is injectable?', UserService.__injectable);
svc.findById('1');
console.log('Roles for deleteUser:', UserService.prototype.__roles);

// 5. Retry decorator demo
console.log('\\n=== Retry Decorator ===');
let callCount = 0;
class PaymentService {
  async processPayment(amount) {
    callCount++;
    if (callCount < 3) throw new Error('Timeout');
    return { success: true, amount };
  }
}
const retryDescriptor = Object.getOwnPropertyDescriptor(PaymentService.prototype, 'processPayment');
Retry(3)(PaymentService.prototype, 'processPayment', retryDescriptor);
Object.defineProperty(PaymentService.prototype, 'processPayment', retryDescriptor);

const ps = new PaymentService();
ps.processPayment(99.99).then(r => console.log('Payment result:', r));`,
    content: `
<h1>Decorators &amp; Metadata</h1>
<p>Decorators are the foundation of NestJS. Every <code>@Controller</code>, <code>@Injectable</code>, <code>@Get</code>, <code>@Body</code> is a decorator. Understanding how they work under the hood is essential for building custom decorators and debugging DI issues.</p>

<h2>Decorator Types</h2>
<table>
  <tr><th>Type</th><th>Signature</th><th>Applied to</th></tr>
  <tr><td>Class</td><td><code>(constructor: Function) =&gt; void</code></td><td>Class declaration</td></tr>
  <tr><td>Method</td><td><code>(target, propertyKey, descriptor) =&gt; void</code></td><td>Methods</td></tr>
  <tr><td>Property</td><td><code>(target, propertyKey) =&gt; void</code></td><td>Properties</td></tr>
  <tr><td>Parameter</td><td><code>(target, propertyKey, paramIndex) =&gt; void</code></td><td>Method parameters</td></tr>
</table>

<h2>Class Decorator</h2>
<pre><code>// A class decorator receives the constructor function
function Injectable(target: Function) {
  Reflect.defineMetadata('injectable', true, target);
}

@Injectable
class UserService {
  // NestJS knows this class can be injected into other classes
}

// Decorator factory — returns the actual decorator
function Controller(prefix: string) {
  return function(target: Function) {
    Reflect.defineMetadata('path', prefix, target);
  };
}

@Controller('/users')
class UserController {
  // path metadata = '/users'
}</code></pre>

<h2>Method Decorator: @Log</h2>
<pre><code>function Log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    console.log(\`[\${propertyKey}] called with:\`, args);
    const start = Date.now();
    const result = originalMethod.apply(this, args);
    const duration = Date.now() - start;
    console.log(\`[\${propertyKey}] returned in \${duration}ms:\`, result);
    return result;
  };

  return descriptor;
}

class OrderService {
  @Log
  calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, i) =&gt; sum + i.price * i.qty, 0);
  }
}</code></pre>

<h2>Decorator Factory: @Cacheable</h2>
<pre><code>function Cacheable(ttlMs: number = 60000) {
  const cache = new Map&lt;string, { value: any; expiry: number }&gt;();

  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached &amp;&amp; cached.expiry &gt; Date.now()) {
        return cached.value;
      }

      const result = await original.apply(this, args);
      cache.set(key, { value: result, expiry: Date.now() + ttlMs });
      return result;
    };

    return descriptor;
  };
}

class ProductService {
  @Cacheable(30000) // cache for 30 seconds
  async findById(id: string): Promise&lt;Product&gt; {
    return this.repo.findOne(id); // DB call cached
  }
}</code></pre>

<h2>NestJS Custom Decorators</h2>
<pre><code>// Custom @Roles decorator using SetMetadata
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) =&gt; SetMetadata('roles', roles);

// Usage in controller
@Controller('users')
class UserController {
  @Delete(':id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}

// Custom parameter decorator: @CurrentUser
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) =&gt; {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage:
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('name')
getName(@CurrentUser('name') name: string) {
  return name;
}</code></pre>

<h2>@Retry Decorator</h2>
<pre><code>function Retry(maxAttempts: number = 3, delayMs: number = 1000) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      for (let attempt = 1; attempt &lt;= maxAttempts; attempt++) {
        try {
          return await original.apply(this, args);
        } catch (error) {
          if (attempt === maxAttempts) throw error;
          console.warn(
            \`\${propertyKey} attempt \${attempt} failed, retrying in \${delayMs}ms...\`
          );
          await new Promise(r =&gt; setTimeout(r, delayMs * attempt));
        }
      }
    };

    return descriptor;
  };
}

class PaymentGateway {
  @Retry(3, 500)
  async charge(amount: number): Promise&lt;PaymentResult&gt; {
    // Automatically retries up to 3 times on failure
    return this.httpClient.post('/charge', { amount });
  }
}</code></pre>

<h2>Reflect Metadata API</h2>
<pre><code>// NestJS uses reflect-metadata to store type info at runtime
// This is why emitDecoratorMetadata must be true

import 'reflect-metadata';

// How NestJS DI works under the hood:
@Injectable()
class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
  ) {}
}

// TypeScript emits metadata about constructor parameters:
// Reflect.getMetadata('design:paramtypes', UserService)
// => [UserRepository, EmailService]
// NestJS reads this to know what to inject!</code></pre>

<h2>TC39 Stage 3 vs Experimental Decorators</h2>
<table>
  <tr><th>Feature</th><th>Experimental (TS legacy)</th><th>TC39 Stage 3</th></tr>
  <tr><td>tsconfig flag</td><td><code>experimentalDecorators: true</code></td><td>No flag (native JS)</td></tr>
  <tr><td>Parameter decorators</td><td>Supported</td><td>Not supported</td></tr>
  <tr><td>Metadata emission</td><td><code>emitDecoratorMetadata</code></td><td>Not built-in</td></tr>
  <tr><td>NestJS support</td><td>Full support (current)</td><td>Coming (NestJS v11+)</td></tr>
  <tr><td>Decorator return</td><td>Optional</td><td>Must return void or replacement</td></tr>
</table>

<div class="warning-note">NestJS currently requires <strong>experimental decorators</strong>. The TC39 Stage 3 decorators do not support parameter decorators or <code>emitDecoratorMetadata</code>, which NestJS needs for dependency injection.</div>

<div class="qa-block">
  <div class="qa-q">Q: How do NestJS decorators work under the hood?</div>
  <div class="qa-a">NestJS decorators use the <code>reflect-metadata</code> library to store and retrieve metadata at runtime. When you write <code>@Injectable()</code>, it marks the class as injectable. When TypeScript compiles with <code>emitDecoratorMetadata: true</code>, it emits type metadata for constructor parameters via <code>Reflect.getMetadata('design:paramtypes', target)</code>. NestJS reads this metadata during bootstrap to build a dependency graph and knows exactly what to inject into each constructor. Route decorators like <code>@Get('/')</code> store path metadata using <code>Reflect.defineMetadata</code>, which the router reads to map HTTP requests to controller methods.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Create a custom <code>@Retry</code> decorator.</div>
  <div class="qa-a">See the @Retry code above. The key design points: (1) It is a decorator factory that takes configuration (maxAttempts, delayMs). (2) It wraps the original method, catches errors, and retries with exponential backoff. (3) After max attempts, it rethrows the last error. (4) It uses <code>original.apply(this, args)</code> to preserve the correct <code>this</code> context. In production, you would also add jitter to the delay and log to a proper logger.</div>
</div>
`,
  },

  // ─────────────────────────────────────────────────────────────
  // TypeScript Patterns
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ts-backend-patterns',
    title: 'TypeScript Backend Patterns',
    category: 'TypeScript Patterns',
    starterCode: `// TypeScript Backend Patterns — JS Playground Demo
// =================================================

// 1. Result Type (Ok/Err pattern) — no exceptions for expected failures
class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }
  static Ok(value) { return new Result(true, value, null); }
  static Err(error) { return new Result(false, null, error); }

  map(fn) { return this.ok ? Result.Ok(fn(this.value)) : this; }
  unwrap() {
    if (!this.ok) throw new Error('Unwrap on Err: ' + this.error);
    return this.value;
  }
}

console.log('=== Result Type (Ok/Err) ===');
function divide(a, b) {
  if (b === 0) return Result.Err('Division by zero');
  return Result.Ok(a / b);
}
const r1 = divide(10, 3);
console.log('10/3:', r1.ok ? r1.value : r1.error);
const r2 = divide(10, 0);
console.log('10/0:', r2.ok ? r2.value : r2.error);
console.log('Chained:', divide(100, 4).map(v => v * 2).value);

// 2. Discriminated unions for event handling (Kafka-style)
function handleKafkaMessage(message) {
  switch (message.type) {
    case 'USER_CREATED':
      console.log('Create user:', message.payload.userId, message.payload.email);
      break;
    case 'ORDER_PLACED':
      console.log('Process order:', message.payload.orderId, 'total:', message.payload.total);
      break;
    case 'PAYMENT_PROCESSED':
      console.log('Payment for order:', message.payload.orderId, 'status:', message.payload.status);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}
console.log('\\n=== Kafka Message Handler ===');
handleKafkaMessage({ type: 'USER_CREATED', payload: { userId: 'u1', email: 'a@b.com' } });
handleKafkaMessage({ type: 'ORDER_PLACED', payload: { orderId: 'o1', total: 250.00 } });
handleKafkaMessage({ type: 'PAYMENT_PROCESSED', payload: { orderId: 'o1', status: 'success' } });

// 3. Config typing with validation
function loadConfig(env) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter(k => !env[k]);
  if (missing.length > 0) {
    throw new Error('Missing env vars: ' + missing.join(', '));
  }
  return {
    db: { host: env.DB_HOST, port: parseInt(env.DB_PORT), name: env.DB_NAME },
    jwt: { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES || '1h' },
    isProduction: env.NODE_ENV === 'production',
  };
}
console.log('\\n=== Typed Config ===');
const config = loadConfig({
  DB_HOST: 'localhost', DB_PORT: '5432', DB_NAME: 'myapp',
  JWT_SECRET: 'secret123', NODE_ENV: 'development'
});
console.log(config);

// 4. DTO transformation pipeline
function toUserResponse(dbUser) {
  const { password, deletedAt, ...safe } = dbUser;
  return { ...safe, fullName: safe.firstName + ' ' + safe.lastName };
}
console.log('\\n=== Entity -> DTO -> Response ===');
const dbUser = { id: '1', firstName: 'Arvind', lastName: 'Okram', email: 'a@b.com', password: 'hashed', deletedAt: null };
console.log('DB entity:', dbUser);
console.log('API response:', toUserResponse(dbUser));

// 5. Middleware typing
function authMiddleware(req, res, next) {
  const token = req.headers && req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // In TS: req.user = verifyToken(token);
  req.user = { id: 'u1', role: 'admin' };
  next();
}
console.log('\\n=== Typed Middleware ===');
const mockReq = { headers: { authorization: 'Bearer xyz' } };
const mockRes = { status: (c) => ({ json: (d) => console.log(c, d) }) };
authMiddleware(mockReq, mockRes, () => console.log('Next called. req.user:', mockReq.user));`,
    content: `
<h1>TypeScript Backend Patterns</h1>
<p>These are battle-tested patterns for building type-safe backend services with TypeScript and NestJS. They go beyond basic typing — they shape how you design APIs, handle errors, and process data.</p>

<h2>Result Type (Ok/Err Pattern)</h2>
<pre><code>// Instead of throwing exceptions for expected failures,
// return a typed Result that forces callers to handle both cases

type Result&lt;T, E = string&gt; =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper constructors
const Ok = &lt;T&gt;(value: T): Result&lt;T, never&gt; =&gt; ({ ok: true, value });
const Err = &lt;E&gt;(error: E): Result&lt;never, E&gt; =&gt; ({ ok: false, error });

// Service method returns Result instead of throwing
class UserService {
  async createUser(dto: CreateUserDto): Promise&lt;Result&lt;User, UserError&gt;&gt; {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) return Err({ code: 'DUPLICATE_EMAIL', message: 'Email taken' });

    const user = await this.repo.create(dto);
    return Ok(user);
  }
}

// Controller handles both cases — compiler ensures it
const result = await userService.createUser(dto);
if (!result.ok) {
  // TypeScript knows: result.error is UserError
  throw new HttpException(result.error.message, 409);
}
// TypeScript knows: result.value is User
return result.value;</code></pre>

<h2>Typed Error Hierarchy</h2>
<pre><code>// Base error with code for programmatic handling
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  constructor(public readonly entity: string, public readonly id: string) {
    super(\`\${entity} with id \${id} not found\`);
  }
}

class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  constructor(public readonly fields: Record&lt;string, string&gt;) {
    super('Validation failed');
  }
}

// Type-safe error handler
function handleAppError(error: AppError): HttpResponse {
  switch (error.code) {
    case 'NOT_FOUND':
      return { status: 404, body: { error: error.message } };
    case 'VALIDATION_ERROR':
      return { status: 400, body: { error: error.message, fields: (error as ValidationError).fields } };
    default:
      return { status: 500, body: { error: 'Internal server error' } };
  }
}</code></pre>

<h2>Discriminated Unions for Event Handling</h2>
<pre><code>// Type every Kafka message variant
type KafkaMessage =
  | { type: 'USER_CREATED'; payload: { userId: string; email: string } }
  | { type: 'ORDER_PLACED'; payload: { orderId: string; items: OrderItem[]; total: number } }
  | { type: 'PAYMENT_PROCESSED'; payload: { orderId: string; status: 'success' | 'failed' } };

// Handler is exhaustively typed
async function handleMessage(msg: KafkaMessage): Promise&lt;void&gt; {
  switch (msg.type) {
    case 'USER_CREATED':
      // TS knows payload: { userId: string; email: string }
      await sendWelcomeEmail(msg.payload.email);
      break;
    case 'ORDER_PLACED':
      await processOrder(msg.payload.orderId, msg.payload.items);
      break;
    case 'PAYMENT_PROCESSED':
      if (msg.payload.status === 'failed') {
        await notifySupport(msg.payload.orderId);
      }
      break;
    default:
      const _never: never = msg; // compile error if new type added
  }
}</code></pre>

<h2>Typed Environment Config</h2>
<pre><code>// Define the shape of your environment
interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_URL: string;
}

// Validate and parse at startup — fail fast
function loadConfig(): EnvConfig {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_PASSWORD', 'JWT_SECRET'] as const;
  const missing = required.filter(k =&gt; !process.env[k]);
  if (missing.length) {
    throw new Error('Missing required env vars: ' + missing.join(', '));
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '3000'),
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInt(process.env.DB_PORT!),
    DB_NAME: process.env.DB_NAME!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  };
}

// Use the typed config everywhere — no more process.env scattered around
const config = loadConfig();
// config.DB_HOST is string (not string | undefined)</code></pre>

<h2>Entity to DTO Transformation</h2>
<pre><code>// Database entity (all fields)
interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
  deletedAt: Date | null;
}

// API response DTO (no sensitive fields)
type UserResponse = Omit&lt;UserEntity, 'passwordHash' | 'deletedAt'&gt; &amp; {
  fullName: string;
};

// Transform function
function toUserResponse(entity: UserEntity): UserResponse {
  const { passwordHash, deletedAt, ...safe } = entity;
  return {
    ...safe,
    fullName: \`\${entity.firstName} \${entity.lastName}\`,
  };
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How do you type a Kafka message handler for different event types?</div>
  <div class="qa-a">Use a discriminated union with a <code>type</code> field as the discriminant. Define each message variant with its specific payload shape. In the handler, switch on <code>msg.type</code> — TypeScript automatically narrows the payload type in each case branch. Add a <code>default: never</code> check for exhaustiveness. For the consumer, parse the raw message as <code>unknown</code>, validate it with a type guard or Zod schema, then pass the narrowed type to the handler. This ensures every event type is handled and any new types added to the union must be handled (compiler enforces it).</div>
</div>
`,
  },
  {
    id: 'ts-strict-patterns',
    title: 'Strict TypeScript & Safe Coding',
    category: 'TypeScript Patterns',
    starterCode: `// Strict TypeScript & Safe Coding — JS Playground Demo
// ====================================================

// 1. Branded types — prevent mixing IDs
function createUserId(id) { return Object.assign(String(id), { __brand: 'UserId' }); }
function createOrderId(id) { return Object.assign(String(id), { __brand: 'OrderId' }); }

function getUser(userId) {
  if (!userId.__brand || userId.__brand !== 'UserId') {
    throw new Error('Expected UserId, got: ' + (userId.__brand || 'unbranded'));
  }
  return { id: userId.toString(), name: 'Arvind' };
}

console.log('=== Branded Types ===');
const userId = createUserId('u-123');
const orderId = createOrderId('o-456');
console.log('getUser(userId):', getUser(userId));
try { getUser(orderId); } catch(e) { console.log('getUser(orderId):', e.message); }

// 2. Making impossible states impossible
function createState(type, data) {
  return { type, ...data };
}
function renderUI(state) {
  switch (state.type) {
    case 'idle': console.log('Idle — show empty screen'); break;
    case 'loading': console.log('Loading...'); break;
    case 'success': console.log('Data:', state.data); break;
    case 'error': console.log('Error:', state.error); break;
    default: throw new Error('Unknown state: ' + state.type);
  }
}
console.log('\\n=== Impossible States Made Impossible ===');
renderUI(createState('idle', {}));
renderUI(createState('loading', {}));
renderUI(createState('success', { data: [1, 2, 3] }));
renderUI(createState('error', { error: 'Network failure' }));
// Can't have { type: 'loading', data: [...] } in the TS version!

// 3. Exhaustive switch with helper
function assertNever(value) {
  throw new Error('Unhandled value: ' + JSON.stringify(value));
}
function handlePaymentStatus(status) {
  switch (status) {
    case 'pending': return 'Waiting for payment';
    case 'completed': return 'Payment received';
    case 'failed': return 'Payment failed';
    case 'refunded': return 'Payment refunded';
    default: assertNever(status);
  }
}
console.log('\\n=== Exhaustive Switch ===');
console.log(handlePaymentStatus('pending'));
console.log(handlePaymentStatus('completed'));

// 4. Readonly everywhere
const config = Object.freeze({
  maxRetries: 3,
  timeout: 5000,
  endpoints: Object.freeze(['https://api1.com', 'https://api2.com']),
});
console.log('\\n=== Readonly Config ===');
console.log(config);
try { config.maxRetries = 10; } catch(e) { console.log('Cannot mutate:', e.message); }

// 5. Avoid type assertions — use validation
function parseApiResponse(raw) {
  // BAD: const user = raw as User; (no runtime check!)
  // GOOD: validate at runtime
  if (!raw || typeof raw !== 'object') throw new Error('Expected object');
  if (typeof raw.id !== 'string') throw new Error('Missing id');
  if (typeof raw.name !== 'string') throw new Error('Missing name');
  return { id: raw.id, name: raw.name, validated: true };
}
console.log('\\n=== Validate Instead of Assert ===');
console.log(parseApiResponse({ id: '1', name: 'Arvind' }));
try { parseApiResponse({ id: 123 }); } catch(e) { console.log('Validation:', e.message); }`,
    content: `
<h1>Strict TypeScript &amp; Safe Coding</h1>
<p>Writing "strict" TypeScript means going beyond <code>strict: true</code> in tsconfig. It is about coding patterns that eliminate entire classes of bugs — making invalid states unrepresentable, preventing ID mixups, and never lying to the compiler.</p>

<h2>strict Mode Options</h2>
<pre><code>// strict: true enables ALL of these:
{
  "compilerOptions": {
    "strict": true,
    // Individual flags it enables:
    "strictNullChecks": true,        // null/undefined are distinct types
    "noImplicitAny": true,           // must annotate 'any' explicitly
    "strictFunctionTypes": true,     // contravariant function params
    "strictBindCallApply": true,     // type-check bind/call/apply
    "strictPropertyInitialization": true, // class props must be initialized
    "noImplicitThis": true,          // must type 'this'
    "alwaysStrict": true,            // emit 'use strict'

    // Additional strictness (not in strict: true):
    "noUncheckedIndexedAccess": true,  // arr[0] is T | undefined
    "noImplicitReturns": true,         // every path must return
    "noFallthroughCasesInSwitch": true // switch cases must break/return
  }
}</code></pre>
<div class="warning-note"><code>noUncheckedIndexedAccess</code> is NOT included in <code>strict: true</code> but is highly recommended. Without it, <code>arr[0]</code> is typed as <code>T</code> even though it could be <code>undefined</code> at runtime.</div>

<h2>Avoid <code>as</code> Type Assertions</h2>
<pre><code>// BAD — lying to the compiler, no runtime validation
const user = JSON.parse(body) as User;
const el = document.getElementById('app') as HTMLDivElement;

// GOOD — validate at runtime with type guards
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &amp;&amp;
    data !== null &amp;&amp;
    'id' in data &amp;&amp;
    typeof (data as any).id === 'string' &amp;&amp;
    'name' in data &amp;&amp;
    typeof (data as any).name === 'string'
  );
}

const parsed: unknown = JSON.parse(body);
if (!isUser(parsed)) throw new Error('Invalid user data');
// Now parsed is User — validated at runtime

// BETTER — use Zod for validation + narrowing
import { z } from 'zod';
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
type User = z.infer&lt;typeof UserSchema&gt;;
const user = UserSchema.parse(JSON.parse(body)); // throws if invalid</code></pre>

<h2>Branded Types / Nominal Typing</h2>
<pre><code>// Problem: UserId and OrderId are both strings — easy to mix up
function getUser(id: string): User { /* ... */ }
function getOrder(id: string): Order { /* ... */ }
getUser(orderId); // No error! But it is a bug.

// Solution: Branded types
type UserId = string &amp; { readonly __brand: unique symbol };
type OrderId = string &amp; { readonly __brand: unique symbol };

// Constructor functions
function UserId(id: string): UserId { return id as UserId; }
function OrderId(id: string): OrderId { return id as OrderId; }

function getUser(id: UserId): User { /* ... */ }
function getOrder(id: OrderId): Order { /* ... */ }

const userId = UserId('u-123');
const orderId = OrderId('o-456');

getUser(userId);    // OK
getUser(orderId);   // ERROR: OrderId is not assignable to UserId
getUser('raw-str'); // ERROR: string is not assignable to UserId

// Common branded types in backend:
type Email = string &amp; { __brand: 'Email' };
type JWT = string &amp; { __brand: 'JWT' };
type HashedPassword = string &amp; { __brand: 'HashedPassword' };
type Cents = number &amp; { __brand: 'Cents' }; // money in cents, not dollars</code></pre>

<h2>Making Impossible States Impossible</h2>
<pre><code>// BAD — all fields optional, many invalid combinations possible
interface RequestState {
  loading?: boolean;
  data?: User[];
  error?: string;
}
// Can have { loading: true, data: [...], error: 'fail' } — nonsensical!

// GOOD — discriminated union, each state is distinct
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };

// Now it is IMPOSSIBLE to have data during loading
// or an error during success

function render(state: RequestState) {
  switch (state.status) {
    case 'idle': return 'Ready';
    case 'loading': return 'Loading...';
    case 'success': return \`\${state.data.length} users\`; // data guaranteed
    case 'error': return \`Error: \${state.error}\`;       // error guaranteed
  }
}</code></pre>

<h2>Exhaustive Switch Statements</h2>
<pre><code>type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

function getLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending': return 'Awaiting payment';
    case 'completed': return 'Paid';
    case 'failed': return 'Failed';
    case 'refunded': return 'Refunded';
    default:
      // If someone adds 'cancelled' to PaymentStatus,
      // this line will give a compile error
      const _exhaustive: never = status;
      throw new Error('Unhandled: ' + _exhaustive);
  }
}

// Helper utility
function assertNever(value: never): never {
  throw new Error('Unhandled value: ' + JSON.stringify(value));
}</code></pre>

<h2>Readonly Everywhere</h2>
<pre><code>// Immutable config
interface AppConfig {
  readonly db: {
    readonly host: string;
    readonly port: number;
  };
  readonly features: readonly string[];
}

// Readonly arrays
function processItems(items: readonly number[]): number {
  // items.push(1); // Error — readonly
  // items.sort();  // Error — mutates
  return items.reduce((sum, n) =&gt; sum + n, 0); // OK — doesn't mutate
}

// Readonly function params — prevent accidental mutation
function sendNotification(
  users: ReadonlyArray&lt;User&gt;,
  config: Readonly&lt;NotificationConfig&gt;
): void {
  // Cannot modify users or config — safe
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is a branded type and when would you use it?</div>
  <div class="qa-a">A branded type adds a phantom property (usually using intersection with <code>{ __brand: 'TypeName' }</code>) to a primitive type to make it nominally distinct. TypeScript's type system is structural — two types with the same shape are interchangeable. Branded types break this for primitives: <code>UserId</code> and <code>OrderId</code> are both strings at runtime, but TypeScript treats them as incompatible types. Use them for: entity IDs (prevent mixing UserId with OrderId), money (Cents vs Dollars), validated strings (Email, URL, JWT), and any domain concept where mixing values of the same primitive type would be a bug. They cost nothing at runtime — the brand only exists in the type system.</div>
</div>
`,
  },
  {
    id: 'ts-testing-types',
    title: 'Testing & Type-Level Testing',
    category: 'TypeScript Patterns',
    starterCode: `// Testing & Type-Level Testing — JS Playground Demo
// ==================================================

// 1. Using Partial for test fixtures
function createTestUser(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}
console.log('=== Test Fixtures with Partial ===');
console.log('Default:', createTestUser());
console.log('Override:', createTestUser({ name: 'Arvind', role: 'admin' }));

// 2. Mock service
class MockUserRepository {
  constructor() {
    this.users = new Map();
    this.calls = { findById: [], create: [], findAll: [] };
  }
  async findById(id) {
    this.calls.findById.push(id);
    return this.users.get(id) || null;
  }
  async create(data) {
    this.calls.create.push(data);
    const user = { ...data, id: 'generated-id' };
    this.users.set(user.id, user);
    return user;
  }
  async findAll() {
    this.calls.findAll.push('called');
    return [...this.users.values()];
  }

  // Test helpers
  seedUser(user) { this.users.set(user.id, user); }
  getCallCount(method) { return this.calls[method].length; }
}

// 3. Service under test
class UserService {
  constructor(userRepo) { this.userRepo = userRepo; }
  async getUserById(id) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }
  async createUser(data) {
    return this.userRepo.create(data);
  }
}

// 4. Run tests
async function runTests() {
  console.log('\\n=== Testing with Mock Repository ===');

  // Setup
  const mockRepo = new MockUserRepository();
  const service = new UserService(mockRepo);

  // Test: user not found
  try {
    await service.getUserById('nonexistent');
    console.log('FAIL: should have thrown');
  } catch (e) {
    console.log('PASS: getUserById throws for missing user:', e.message);
  }

  // Test: create and retrieve
  const created = await service.createUser({ name: 'Arvind', email: 'a@b.com' });
  console.log('PASS: createUser returns:', created);

  const found = await service.getUserById(created.id);
  console.log('PASS: getUserById returns created user:', found);

  // Verify mock was called correctly
  console.log('\\n=== Mock Call Verification ===');
  console.log('findById called', mockRepo.getCallCount('findById'), 'times');
  console.log('create called', mockRepo.getCallCount('create'), 'times');
  console.log('findById args:', mockRepo.calls.findById);

  // Test: seed data for specific test case
  console.log('\\n=== Seeded Test ===');
  mockRepo.seedUser(createTestUser({ id: 'known-id', name: 'Seeded User' }));
  const seeded = await service.getUserById('known-id');
  console.log('PASS: found seeded user:', seeded.name);
}
runTests();`,
    content: `
<h1>Testing &amp; Type-Level Testing</h1>
<p>TypeScript makes testing both easier (typed mocks catch interface mismatches) and harder (mock setup is more verbose). These patterns streamline testing in NestJS backends.</p>

<h2>Typing Test Fixtures with <code>Partial</code></h2>
<pre><code>// Factory function for test data — override only what matters
function createTestUser(overrides: Partial&lt;User&gt; = {}): User {
  return {
    id: 'test-id-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Tests are clean — only specify relevant fields
const admin = createTestUser({ role: 'admin' });
const specificUser = createTestUser({ id: 'u-123', name: 'Arvind' });

// For nested objects — use DeepPartial
function createTestOrder(overrides: DeepPartial&lt;Order&gt; = {}): Order {
  return merge(defaultOrder, overrides); // deep merge
}</code></pre>

<h2>Typing Jest/Vitest Mocks</h2>
<pre><code>// jest.fn() is generic — pass the function signature
const mockFindById = jest.fn&lt;Promise&lt;User | null&gt;, [string]&gt;();
mockFindById.mockResolvedValue(createTestUser());

// Mock an entire service using jest.Mocked
const mockUserService = {
  findById: jest.fn&lt;Promise&lt;User | null&gt;, [string]&gt;(),
  create: jest.fn&lt;Promise&lt;User&gt;, [CreateUserDto]&gt;(),
  update: jest.fn&lt;Promise&lt;User&gt;, [string, UpdateUserDto]&gt;(),
  delete: jest.fn&lt;Promise&lt;void&gt;, [string]&gt;(),
} satisfies Record&lt;keyof UserService, jest.Mock&gt;;

// Type-safe mock setup
mockUserService.findById.mockResolvedValue(createTestUser());
mockUserService.findById.mockResolvedValue(42); // Error! Not User | null</code></pre>

<h2>NestJS Testing with DI</h2>
<pre><code>// NestJS Test module — override providers with typed mocks
describe('UserController', () =&gt; {
  let controller: UserController;
  let userService: jest.Mocked&lt;UserService&gt;;

  beforeEach(async () =&gt; {
    const mockService: Partial&lt;jest.Mocked&lt;UserService&gt;&gt; = {
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(UserController);
    userService = module.get(UserService);
  });

  it('returns a user by id', async () =&gt; {
    const testUser = createTestUser({ id: 'u-1' });
    userService.findById.mockResolvedValue(testUser);

    const result = await controller.getUser('u-1');

    expect(result).toEqual(testUser);
    expect(userService.findById).toHaveBeenCalledWith('u-1');
  });

  it('throws 404 when user not found', async () =&gt; {
    userService.findById.mockResolvedValue(null);

    await expect(controller.getUser('missing'))
      .rejects.toThrow(NotFoundException);
  });
});</code></pre>

<h2>Testing Repository with Mock</h2>
<pre><code>describe('UserService', () =&gt; {
  let service: UserService;
  let repo: jest.Mocked&lt;UserRepository&gt;;

  beforeEach(async () =&gt; {
    const mockRepo: Partial&lt;jest.Mocked&lt;UserRepository&gt;&gt; = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UserService);
    repo = module.get(UserRepository);
  });

  it('creates user when email is unique', async () =&gt; {
    const dto: CreateUserDto = { name: 'Arvind', email: 'a@b.com' };
    const expectedUser = createTestUser(dto);

    repo.findByEmail.mockResolvedValue(null);     // no duplicate
    repo.create.mockReturnValue(expectedUser);
    repo.save.mockResolvedValue(expectedUser);

    const result = await service.create(dto);

    expect(result).toEqual(expectedUser);
    expect(repo.findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('throws on duplicate email', async () =&gt; {
    repo.findByEmail.mockResolvedValue(createTestUser());

    await expect(service.create({ name: 'A', email: 'existing@b.com' }))
      .rejects.toThrow('Email already exists');
  });
});</code></pre>

<h2>Type-Level Testing with expectType</h2>
<pre><code>// Verify your utility types are correct at compile time
// Using tsd or expect-type library

import { expectTypeOf } from 'expect-type';

// Test that Partial makes everything optional
expectTypeOf&lt;Partial&lt;User&gt;&gt;().toHaveProperty('name');
expectTypeOf&lt;Partial&lt;User&gt;&gt;().toMatchTypeOf&lt;{ name?: string }&gt;();

// Test branded types
type UserId = string &amp; { __brand: 'UserId' };
expectTypeOf&lt;UserId&gt;().toMatchTypeOf&lt;string&gt;();
expectTypeOf&lt;string&gt;().not.toMatchTypeOf&lt;UserId&gt;();

// Test conditional types
type IsArray&lt;T&gt; = T extends any[] ? true : false;
expectTypeOf&lt;IsArray&lt;string[]&gt;&gt;().toEqualTypeOf&lt;true&gt;();
expectTypeOf&lt;IsArray&lt;string&gt;&gt;().toEqualTypeOf&lt;false&gt;();

// Test that ApiResponse discriminates correctly
type SuccessResponse = Extract&lt;ApiResponse&lt;User&gt;, { success: true }&gt;;
expectTypeOf&lt;SuccessResponse&gt;().toHaveProperty('data');
expectTypeOf&lt;SuccessResponse['data']&gt;().toEqualTypeOf&lt;User&gt;();</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How do you mock a typed service in NestJS tests?</div>
  <div class="qa-a">Use NestJS <code>Test.createTestingModule</code> and override the provider with a mock object. Create the mock using <code>jest.Mocked&lt;ServiceType&gt;</code> with <code>jest.fn()</code> for each method. This gives you full type safety — TypeScript ensures your mock implements the same interface as the real service, and mock return values match the expected types. Use <code>Partial&lt;jest.Mocked&lt;T&gt;&gt;</code> when you only need to mock some methods. For the assertions, Jest's <code>toHaveBeenCalledWith</code> won't type-check arguments, so consider wrapping it in a typed helper for critical tests.</div>
</div>
`,
  },
  {
    id: 'ts-migration',
    title: 'JS to TS Migration & Best Practices',
    category: 'TypeScript Patterns',
    starterCode: `// JS to TS Migration & Best Practices — JS Playground Demo
// =========================================================

// 1. Incremental migration: adding types to existing JS
// Before: plain JavaScript
function getUserOrders(userId, options) {
  const defaults = { page: 1, limit: 10, sort: 'date' };
  const opts = { ...defaults, ...options };
  console.log('Fetching orders for user', userId, 'with', opts);
  return {
    items: [
      { id: 'o-1', userId, total: 99.99, date: '2024-01-15' },
      { id: 'o-2', userId, total: 45.00, date: '2024-01-20' },
    ],
    pagination: { page: opts.page, limit: opts.limit, total: 42 },
  };
}
console.log('=== Before Migration ===');
console.log(getUserOrders('u-123', { page: 2 }));

// 2. After migration: same function with TS types (shown in comments)
// interface PaginationOptions {
//   page?: number;
//   limit?: number;
//   sort?: 'date' | 'total' | 'id';
// }
// interface Order {
//   id: string;
//   userId: string;
//   total: number;
//   date: string;
// }
// interface PaginatedResult<T> {
//   items: T[];
//   pagination: { page: number; limit: number; total: number };
// }
// function getUserOrders(userId: string, options?: PaginationOptions): PaginatedResult<Order>

// 3. Module declarations for untyped packages
console.log('\\n=== Declaring types for untyped modules ===');
// When a npm package has no types:
// Create: src/types/legacy-package.d.ts
// declare module 'legacy-package' {
//   export function doSomething(input: string): Promise<Result>;
//   export interface Result { success: boolean; data: unknown; }
// }
console.log('Create .d.ts files for untyped npm packages');

// 4. @ts-expect-error vs @ts-ignore
console.log('\\n=== @ts-expect-error vs @ts-ignore ===');
console.log('@ts-ignore:       Silences ANY error (even if code is fixed later)');
console.log('@ts-expect-error: Silences error BUT warns if no error exists');
console.log('-> Always prefer @ts-expect-error (catches stale suppressions)');

// 5. Path aliases
console.log('\\n=== Path Aliases ===');
const beforeMigration = {
  import1: "import { UserService } from '../../../modules/user/user.service'",
  import2: "import { AuthGuard } from '../../../common/guards/auth.guard'",
};
const afterMigration = {
  import1: "import { UserService } from '@modules/user/user.service'",
  import2: "import { AuthGuard } from '@common/guards/auth.guard'",
};
console.log('Before:', beforeMigration);
console.log('After:', afterMigration);

// 6. Performance tips
console.log('\\n=== TS Compiler Performance ===');
const perfTips = [
  'isolatedModules: true     -> enables parallel file transpilation (SWC/esbuild)',
  'skipLibCheck: true        -> skip checking node_modules .d.ts files',
  'incremental: true         -> cache build info for faster rebuilds',
  'tsBuildInfoFile: ./dist   -> store incremental cache',
  'project references        -> split monorepo into independently compiled units',
];
perfTips.forEach((tip, i) => console.log((i + 1) + '.', tip));

// 7. ESLint recommended rules
console.log('\\n=== Key ESLint Rules ===');
const rules = {
  '@typescript-eslint/no-explicit-any': 'Forbid any (forces unknown + narrowing)',
  '@typescript-eslint/no-non-null-assertion': 'Forbid ! operator',
  '@typescript-eslint/strict-boolean-expressions': 'No truthy checks on non-booleans',
  '@typescript-eslint/consistent-type-imports': 'Use import type {} for types',
  '@typescript-eslint/no-floating-promises': 'Must await or handle promises',
};
Object.entries(rules).forEach(([rule, desc]) => console.log(rule + ': ' + desc));`,
    content: `
<h1>JS to TS Migration &amp; Best Practices</h1>
<p>Migrating a large Node.js codebase to TypeScript is a common real-world task. The key is <strong>incremental adoption</strong> — you should never try to migrate everything at once.</p>

<h2>Incremental Migration Strategy</h2>
<pre><code>// Phase 1: Setup (Day 1)
// - Install: typescript, @types/node, @types/express, etc.
// - Create tsconfig.json with allowJs: true
{
  "compilerOptions": {
    "allowJs": true,        // compile .js files alongside .ts
    "checkJs": false,       // don't type-check .js files yet
    "strict": false,        // start loose, tighten later
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "commonjs",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}

// Phase 2: Rename files (.js -> .ts) starting from leaf modules
// Priority: utils -> models -> services -> controllers -> app.ts

// Phase 3: Enable checkJs to find issues in remaining .js files
// "checkJs": true — adds JSDoc-based checking to .js files

// Phase 4: Enable strict mode one flag at a time
// "strictNullChecks": true   (biggest impact — do this first)
// "noImplicitAny": true      (second biggest)
// "strict": true             (when ready for all checks)</code></pre>

<h2>Declaring Types for Untyped Modules</h2>
<pre><code>// When a npm package has no @types/* package:

// Option 1: Minimal declaration (unblock yourself)
// Create: src/types/legacy-lib.d.ts
declare module 'legacy-lib' {
  export function init(config: Record&lt;string, unknown&gt;): void;
  export function process(input: string): Promise&lt;unknown&gt;;
}

// Option 2: Detailed declaration (better DX)
declare module 'legacy-lib' {
  interface LegacyConfig {
    apiKey: string;
    timeout?: number;
    retries?: number;
  }

  interface ProcessResult {
    success: boolean;
    data: Record&lt;string, unknown&gt;;
    errors?: string[];
  }

  export function init(config: LegacyConfig): void;
  export function process(input: string): Promise&lt;ProcessResult&gt;;
}

// Option 3: Ambient wildcard (last resort)
declare module 'legacy-lib'; // everything is 'any'</code></pre>

<h2><code>@ts-ignore</code> vs <code>@ts-expect-error</code></h2>
<table>
  <tr><th>Directive</th><th>Behavior</th><th>When error is fixed</th><th>Recommendation</th></tr>
  <tr><td><code>@ts-ignore</code></td><td>Suppresses any error on next line</td><td>Stays silent (stale suppression)</td><td>Avoid</td></tr>
  <tr><td><code>@ts-expect-error</code></td><td>Suppresses error on next line</td><td>Warns "unused directive"</td><td>Always prefer this</td></tr>
</table>
<pre><code>// @ts-ignore — BAD: silently stays even after the error is fixed
// @ts-ignore
const x: string = legacyFn(); // if legacyFn is later typed, this stays

// @ts-expect-error — GOOD: warns you to remove it when no longer needed
// @ts-expect-error — legacy function returns unknown, tracked in JIRA-123
const x: string = legacyFn();</code></pre>

<h2>tsconfig Paths &amp; Module Resolution</h2>
<pre><code>// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}

// Before: import hell
import { UserService } from '../../../modules/user/user.service';
import { AuthGuard } from '../../../common/guards/auth.guard';

// After: clean imports
import { UserService } from '@modules/user/user.service';
import { AuthGuard } from '@common/guards/auth.guard';

// IMPORTANT: Also configure the bundler/runtime
// For NestJS (uses ts-node or SWC): add paths to tsconfig
// For Jest: add moduleNameMapper in jest.config.ts
// For SWC: add paths in .swcrc</code></pre>

<h2>Monorepo: Project References</h2>
<pre><code>// Root tsconfig.json
{
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/worker" }
  ]
}

// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,     // required for project references
    "declaration": true,
    "outDir": "./dist"
  }
}

// packages/api/tsconfig.json
{
  "compilerOptions": { "outDir": "./dist" },
  "references": [
    { "path": "../shared" }  // depends on shared
  ]
}

// Build: tsc --build (builds in dependency order, incremental)</code></pre>

<h2>Performance Optimization</h2>
<table>
  <tr><th>Setting</th><th>What it does</th><th>Impact</th></tr>
  <tr><td><code>isolatedModules: true</code></td><td>Each file compiled independently</td><td>Enables SWC/esbuild (10-100x faster)</td></tr>
  <tr><td><code>skipLibCheck: true</code></td><td>Skip checking .d.ts in node_modules</td><td>30-50% faster builds</td></tr>
  <tr><td><code>incremental: true</code></td><td>Cache previous build results</td><td>70% faster rebuilds</td></tr>
  <tr><td>Project references</td><td>Split into independently compiled units</td><td>Only rebuild changed packages</td></tr>
  <tr><td>SWC loader</td><td>Replace ts-loader with SWC</td><td>20x faster transpilation</td></tr>
</table>

<h2>ESLint Rules for TypeScript</h2>
<pre><code>// .eslintrc.js — recommended strict rules
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error', { prefer: 'type-imports' }
    ],
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
  },
};</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: How would you migrate a 100K LOC Node.js project to TypeScript?</div>
  <div class="qa-a">Phased approach over weeks, not a big-bang rewrite: (1) Add TypeScript with <code>allowJs: true, strict: false</code> so existing JS compiles unchanged. (2) Add <code>.d.ts</code> declarations for untyped dependencies. (3) Rename files from <code>.js</code> to <code>.ts</code> starting from leaf modules (utils, models) — these have few imports and catch the most bugs. (4) Enable <code>strictNullChecks</code> first (catches the most real bugs), fix the errors, then enable <code>noImplicitAny</code>. (5) Enable <code>strict: true</code> when most files are migrated. (6) Use <code>@ts-expect-error</code> with JIRA ticket references for complex cases that need more time. (7) Add CI checks: <code>tsc --noEmit</code> on every PR. Track progress with a script that counts remaining <code>.js</code> files and <code>@ts-expect-error</code> directives.</div>
</div>
`,
  },
];
