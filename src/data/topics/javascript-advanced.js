export const javascriptAdvanced = [
  {
    id: 'prototypes',
    title: 'Prototypes & Inheritance',
    category: 'JavaScript',
    starterCode: `// ── PROTOTYPE CHAIN ──────────────────────────────
console.log('=== Prototype Chain ===');

const animal = {
  type: 'Animal',
  speak() { return this.type + ' makes a sound'; }
};

const dog = Object.create(animal);
dog.type = 'Dog';
dog.bark = function() { return 'Woof!'; };

console.log(dog.speak());  // Dog makes a sound (inherited)
console.log(dog.bark());   // Woof! (own method)
console.log(Object.getPrototypeOf(dog) === animal); // true

// ── __proto__ vs .prototype ─────────────────────
console.log('\\n=== __proto__ vs .prototype ===');
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return 'Hi, ' + this.name; };

const p = new Person('Alice');
console.log(p.__proto__ === Person.prototype); // true
console.log(Person.prototype.constructor === Person); // true
console.log(p.greet()); // Hi, Alice

// ── Class syntax (sugar over prototypes) ────────
console.log('\\n=== ES6 Class ===');
class Shape {
  constructor(name) { this.name = name; }
  area() { return 0; }
}

class Circle extends Shape {
  constructor(r) {
    super('Circle');
    this.radius = r;
  }
  area() { return Math.PI * this.radius ** 2; }
}

const c = new Circle(5);
console.log(c.area().toFixed(2));
console.log(c instanceof Shape); // true
console.log(c instanceof Circle); // true

// ── Mixins / Composition ────────────────────────
console.log('\\n=== Mixins ===');
const Serializable = (Base) => class extends Base {
  toJSON() { return JSON.stringify(this); }
};
const Loggable = (Base) => class extends Base {
  log() { console.log('Log:', this.name); }
};

class Widget extends Loggable(Serializable(Shape)) {}
const w = new Widget('btn');
w.log(); // Log: btn

// ── Symbol.hasInstance ──────────────────────────
console.log('\\n=== Symbol.hasInstance ===');
class Even {
  static [Symbol.hasInstance](num) {
    return typeof num === 'number' && num % 2 === 0;
  }
}
console.log(2 instanceof Even);  // true
console.log(3 instanceof Even);  // false

// ── Property lookup order ───────────────────────
console.log('\\n=== Property Lookup Order ===');
const base = { x: 1 };
const child = Object.create(base);
child.y = 2;
console.log(child.x, child.y); // 1 2 (x from prototype)
child.x = 10;
console.log(child.x, base.x); // 10 1 (shadowing, not mutation)
`,
    content: `
<h1>Prototypes & Inheritance</h1>
<p>JavaScript uses <strong>prototypal inheritance</strong> rather than classical class-based inheritance. Every object has an internal <code>[[Prototype]]</code> link to another object, forming a <strong>prototype chain</strong>. Understanding this deeply is critical for SDE3-level interviews.</p>

<h2>The Prototype Chain</h2>
<p>When you access a property on an object, JavaScript performs a <strong>prototype chain lookup</strong>:</p>
<ol>
  <li>Check the object's own properties</li>
  <li>Check <code>[[Prototype]]</code> (i.e., <code>__proto__</code>)</li>
  <li>Continue up the chain until <code>null</code> is reached</li>
</ol>

<pre><code>const animal = { eats: true };
const rabbit = Object.create(animal);
rabbit.jumps = true;

console.log(rabbit.jumps); // true  — own property
console.log(rabbit.eats);  // true  — inherited from animal
console.log(rabbit.toString); // function — inherited from Object.prototype

// The chain: rabbit -> animal -> Object.prototype -> null</code></pre>

<h2><code>__proto__</code> vs <code>.prototype</code></h2>
<table>
  <tr><th>Concept</th><th>What it is</th><th>Who has it</th></tr>
  <tr><td><code>__proto__</code></td><td>Reference to the object's actual prototype (accessor for [[Prototype]])</td><td>Every object</td></tr>
  <tr><td><code>.prototype</code></td><td>Object that becomes <code>__proto__</code> of instances created with <code>new</code></td><td>Only functions (constructors)</td></tr>
  <tr><td><code>Object.getPrototypeOf(obj)</code></td><td>Standard way to read [[Prototype]] (preferred over <code>__proto__</code>)</td><td>Standard API</td></tr>
  <tr><td><code>Object.setPrototypeOf(obj, proto)</code></td><td>Set [[Prototype]] (slow — avoid in hot paths)</td><td>Standard API</td></tr>
</table>

<pre><code>function Foo() {}
const f = new Foo();

// These are all true:
f.__proto__ === Foo.prototype
Foo.prototype.constructor === Foo
Object.getPrototypeOf(f) === Foo.prototype

// Prototype chain of the constructor itself:
Foo.__proto__ === Function.prototype
Function.prototype.__proto__ === Object.prototype
Object.prototype.__proto__ === null</code></pre>

<h2>Object.create() Deep Dive</h2>
<pre><code>// Object.create(proto, propertyDescriptors)
const base = {
  init(name) { this.name = name; return this; },
  greet() { return 'Hello, ' + this.name; }
};

const user = Object.create(base).init('Alice');
console.log(user.greet()); // Hello, Alice

// Creating truly empty object (no prototype):
const dict = Object.create(null);
dict.key = 'value';
console.log(dict.toString); // undefined — no Object.prototype methods!
// Useful for hash maps with no collision with inherited properties</code></pre>

<h2>Class Syntax vs Prototypal Inheritance</h2>
<p>ES6 <code>class</code> is syntactic sugar over constructor functions and prototypes:</p>
<pre><code>// ES6 Class
class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + ' speaks'; }
  static create(name) { return new Animal(name); }
}

// Equivalent pre-ES6:
function AnimalOld(name) { this.name = name; }
AnimalOld.prototype.speak = function() { return this.name + ' speaks'; };
AnimalOld.create = function(name) { return new AnimalOld(name); };

// Under the hood, class methods go on .prototype:
console.log(typeof Animal); // 'function'
console.log(Animal.prototype.speak); // [Function: speak]</code></pre>

<h3>Key Differences</h3>
<table>
  <tr><th>Feature</th><th>class</th><th>Constructor function</th></tr>
  <tr><td>Hoisted?</td><td>No (TDZ applies)</td><td>Yes (function declarations)</td></tr>
  <tr><td>Callable without <code>new</code>?</td><td>No (TypeError)</td><td>Yes (but no new instance)</td></tr>
  <tr><td>Methods enumerable?</td><td>No</td><td>Yes (if added to .prototype)</td></tr>
  <tr><td>Strict mode?</td><td>Always strict</td><td>Depends on context</td></tr>
  <tr><td>super keyword?</td><td>Yes</td><td>No (use .call/.apply)</td></tr>
</table>

<h2>Mixins and Composition</h2>
<p>JavaScript doesn't support multiple inheritance, but <strong>mixins</strong> provide a clean pattern:</p>
<pre><code>// Mixin pattern with class expressions
const Serializable = (Base) => class extends Base {
  serialize() { return JSON.stringify(this); }
  static deserialize(json) { return Object.assign(new this(), JSON.parse(json)); }
};

const EventEmitter = (Base) => class extends Base {
  _handlers = {};
  on(event, fn) { (this._handlers[event] ??= []).push(fn); }
  emit(event, ...args) { (this._handlers[event] ?? []).forEach(fn => fn(...args)); }
};

class BaseModel {
  constructor(data) { Object.assign(this, data); }
}

// Compose multiple mixins:
class User extends EventEmitter(Serializable(BaseModel)) {
  constructor(data) {
    super(data);
    this.on('save', () => console.log('User saved:', this.name));
  }
}

const u = new User({ name: 'Alice', age: 30 });
u.emit('save');
console.log(u.serialize()); // {"name":"Alice","age":30,...}</code></pre>

<h3>Composition over Inheritance</h3>
<pre><code>// Prefer composition: objects that HAVE behaviors, not ARE behaviors
const canFly = (state) => ({
  fly: () => console.log(state.name + ' is flying')
});
const canSwim = (state) => ({
  swim: () => console.log(state.name + ' is swimming')
});

function createDuck(name) {
  const state = { name };
  return { ...state, ...canFly(state), ...canSwim(state) };
}

const duck = createDuck('Donald');
duck.fly();  // Donald is flying
duck.swim(); // Donald is swimming</code></pre>

<h2>instanceof and Symbol.hasInstance</h2>
<pre><code>// instanceof walks the prototype chain
class A {}
class B extends A {}
const b = new B();

b instanceof B; // true
b instanceof A; // true
b instanceof Object; // true

// Custom instanceof behavior:
class ValidString {
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'string' && instance.length > 0;
  }
}
console.log('' instanceof ValidString);    // false
console.log('hello' instanceof ValidString); // true
console.log(42 instanceof ValidString);    // false</code></pre>

<h2>Edge Cases & Gotchas</h2>
<pre><code>// 1. Property shadowing
const parent = { x: 1 };
const child = Object.create(parent);
child.x = 2;
console.log(child.x, parent.x); // 2, 1 — shadowed, not mutated

// 2. hasOwnProperty check
for (let key in child) {
  if (child.hasOwnProperty(key)) {
    console.log('Own:', key);  // 'x'
  }
}

// 3. Object.keys() vs for...in
console.log(Object.keys(child));       // ['x'] — own enumerable only
// for...in iterates own + inherited enumerable

// 4. Changing prototype after creation (slow!)
const obj = {};
Object.setPrototypeOf(obj, { hello: 'world' });
// V8 deoptimizes: avoid in performance-sensitive code

// 5. Prototype pollution attack
const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}');
// Object.assign({}, malicious) — isAdmin leaks to all objects!
// Defense: use Object.create(null) or Map</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between <code>__proto__</code> and <code>.prototype</code>?</div>
  <div class="qa-a"><code>__proto__</code> is the actual prototype link on every object (accessor for the internal [[Prototype]] slot). <code>.prototype</code> is a property on constructor functions that becomes the <code>__proto__</code> of instances created with <code>new</code>. For example, <code>new Foo().__proto__ === Foo.prototype</code>. Use <code>Object.getPrototypeOf()</code> instead of <code>__proto__</code> in production code.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does <code>instanceof</code> work internally?</div>
  <div class="qa-a"><code>a instanceof B</code> walks up <code>a</code>'s prototype chain checking if any <code>__proto__</code> equals <code>B.prototype</code>. You can customize this with <code>Symbol.hasInstance</code>. A cross-realm issue exists: an Array created in an iframe won't pass <code>instanceof Array</code> in the parent frame because <code>Array.prototype</code> differs between realms. Use <code>Array.isArray()</code> instead.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why prefer composition over inheritance?</div>
  <div class="qa-a">Deep inheritance hierarchies are fragile (changes to a base class ripple down), inflexible (can't inherit from multiple classes), and tightly coupled. Composition lets you combine small, focused behaviors freely. The "favor composition over inheritance" principle from GoF Design Patterns applies strongly in JS, where factory functions + object spread make composition trivially easy.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is prototype pollution and how do you prevent it?</div>
  <div class="qa-a">Prototype pollution occurs when an attacker injects properties into <code>Object.prototype</code> (e.g., via <code>__proto__</code> in JSON input), affecting all objects. Prevention: (1) use <code>Object.create(null)</code> for dictionaries, (2) freeze <code>Object.prototype</code>, (3) validate/sanitize input to reject <code>__proto__</code>, <code>constructor</code>, <code>prototype</code> keys, (4) use <code>Map</code> instead of plain objects for untrusted data.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if you call a class constructor without <code>new</code>?</div>
  <div class="qa-a">You get a <code>TypeError: Class constructor X cannot be invoked without 'new'</code>. This is enforced by the spec. With pre-ES6 constructor functions, calling without <code>new</code> would execute the function normally, and <code>this</code> would refer to the global object (or <code>undefined</code> in strict mode), leading to bugs. Classes prevent this footgun.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Explain the full prototype chain of a function.</div>
  <div class="qa-a"><code>function foo() {}</code> — <code>foo.__proto__</code> is <code>Function.prototype</code>, <code>Function.prototype.__proto__</code> is <code>Object.prototype</code>, <code>Object.prototype.__proto__</code> is <code>null</code>. Additionally, <code>foo.prototype</code> exists (for instances), and <code>foo.prototype.__proto__</code> is <code>Object.prototype</code>. The constructor <code>Function</code> itself: <code>Function.__proto__ === Function.prototype</code> (circular, by spec).</div>
</div>
`
  },
  {
    id: 'generators',
    title: 'Generators & Iterators',
    category: 'JavaScript',
    starterCode: `// ── ITERATOR PROTOCOL ────────────────────────────
console.log('=== Custom Iterator ===');
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { done: true };
      }
    };
  }
};

console.log([...range]); // [1, 2, 3, 4, 5]
for (const n of range) process.stdout; // works with for...of

// ── GENERATOR BASICS ────────────────────────────
console.log('\\n=== Generator Function ===');
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
const first10 = [];
for (let i = 0; i < 10; i++) first10.push(fib.next().value);
console.log('Fibonacci:', first10);

// ── TWO-WAY COMMUNICATION ───────────────────────
console.log('\\n=== Generator two-way ===');
function* accumulator() {
  let total = 0;
  while (true) {
    const value = yield total;
    if (value === null) return total; // return terminates
    total += value;
  }
}

const acc = accumulator();
console.log(acc.next());     // { value: 0, done: false }
console.log(acc.next(10));   // { value: 10, done: false }
console.log(acc.next(20));   // { value: 30, done: false }
console.log(acc.next(null)); // { value: 30, done: true }

// ── yield* DELEGATION ───────────────────────────
console.log('\\n=== yield* Delegation ===');
function* inner() {
  yield 'a';
  yield 'b';
  return 'inner done';
}
function* outer() {
  const result = yield* inner(); // delegates
  console.log('inner returned:', result);
  yield 'c';
}
console.log([...outer()]); // ['a', 'b', 'c']

// ── LAZY EVALUATION ─────────────────────────────
console.log('\\n=== Lazy Pipeline ===');
function* map(iterable, fn) {
  for (const item of iterable) yield fn(item);
}
function* filter(iterable, pred) {
  for (const item of iterable) if (pred(item)) yield item;
}
function* take(iterable, n) {
  let i = 0;
  for (const item of iterable) {
    if (i++ >= n) return;
    yield item;
  }
}

function* naturals() {
  let n = 1;
  while (true) yield n++;
}

// Lazy: only computes what's needed
const result = [...take(
  filter(
    map(naturals(), x => x * x),
    x => x % 2 !== 0
  ),
  5
)];
console.log('First 5 odd squares:', result);

// ── STATE MACHINE ───────────────────────────────
console.log('\\n=== State Machine ===');
function* trafficLight() {
  while (true) {
    yield 'GREEN';
    yield 'YELLOW';
    yield 'RED';
  }
}
const light = trafficLight();
for (let i = 0; i < 7; i++) console.log(light.next().value);
`,
    content: `
<h1>Generators & Iterators</h1>
<p>Generators and iterators are foundational to understanding lazy evaluation, async iteration, and many advanced patterns in JavaScript. SDE3 candidates should deeply understand the <strong>Iterator protocol</strong>, <strong>generator control flow</strong>, and practical applications.</p>

<h2>The Iterator Protocol</h2>
<p>An object is <strong>iterable</strong> if it implements <code>[Symbol.iterator]()</code> returning an <strong>iterator</strong> — an object with a <code>next()</code> method that returns <code>{ value, done }</code>.</p>

<pre><code>// What uses iterables:
// for...of, spread (...), destructuring, Array.from(),
// Promise.all(), Map/Set constructors, yield*

const iterable = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        return i < 3 ? { value: i++, done: false } : { done: true };
      },
      // Optional: called when iteration breaks early
      return() {
        console.log('Cleanup!');
        return { done: true };
      }
    };
  }
};

for (const v of iterable) {
  if (v === 1) break; // triggers return()
}</code></pre>

<h3>Built-in Iterables</h3>
<table>
  <tr><th>Type</th><th>Iterates over</th></tr>
  <tr><td>String</td><td>Unicode code points (handles emoji correctly)</td></tr>
  <tr><td>Array</td><td>Elements (values)</td></tr>
  <tr><td>Map</td><td>[key, value] pairs</td></tr>
  <tr><td>Set</td><td>Values</td></tr>
  <tr><td>TypedArray</td><td>Elements</td></tr>
  <tr><td>arguments</td><td>Argument values</td></tr>
  <tr><td>NodeList</td><td>DOM nodes</td></tr>
</table>

<h2>Generator Functions</h2>
<p>Declared with <code>function*</code>, generators return a <strong>Generator object</strong> that is both an iterator and an iterable.</p>

<pre><code>function* gen() {
  console.log('Before first yield');
  yield 1;
  console.log('Before second yield');
  yield 2;
  console.log('After last yield');
  return 3; // done: true, value: 3
}

const g = gen();
// Nothing executes yet! Generator is lazy.
g.next(); // Runs to first yield → { value: 1, done: false }
g.next(); // Runs to second yield → { value: 2, done: false }
g.next(); // Runs to end → { value: 3, done: true }
g.next(); // → { value: undefined, done: true }

// NOTE: return value (3) is NOT included in for...of or spread!
console.log([...gen()]); // [1, 2] — no 3!</code></pre>

<h2>Two-Way Communication</h2>
<p>Values can be sent INTO a generator via <code>next(value)</code>. The value becomes the result of the <code>yield</code> expression.</p>

<pre><code>function* conversation() {
  const name = yield 'What is your name?';
  const age = yield 'How old are you, ' + name + '?';
  return name + ' is ' + age;
}

const chat = conversation();
console.log(chat.next());          // { value: 'What is your name?', done: false }
console.log(chat.next('Alice'));   // { value: 'How old are you, Alice?', done: false }
console.log(chat.next(30));        // { value: 'Alice is 30', done: true }
// First next() value is always ignored (no yield to receive it)</code></pre>

<h3>generator.throw() and generator.return()</h3>
<pre><code>function* safe() {
  try {
    const val = yield 'waiting';
    console.log('Got:', val);
  } catch (e) {
    console.log('Caught:', e.message);
  } finally {
    console.log('Cleanup');
  }
}

const s = safe();
s.next();             // { value: 'waiting', done: false }
s.throw(new Error('Boom')); // Caught: Boom, Cleanup
// The error is thrown AT the yield point

const s2 = safe();
s2.next();
s2.return('forced');  // Cleanup (finally runs), { value: 'forced', done: true }</code></pre>

<h2>yield* Delegation</h2>
<p><code>yield*</code> delegates to another iterable or generator, forwarding <code>next()</code>/<code>throw()</code>/<code>return()</code>.</p>
<pre><code>function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      yield* flatten(item); // recursive delegation
    } else {
      yield item;
    }
  }
}

console.log([...flatten([1, [2, [3, 4]], 5])]); // [1, 2, 3, 4, 5]

// yield* returns the return value of the delegated generator
function* inner() { yield 'a'; return 'DONE'; }
function* outer() {
  const result = yield* inner();
  console.log(result); // 'DONE'
}</code></pre>

<h2>Async Generators</h2>
<pre><code>async function* fetchPages(url) {
  let page = 1;
  while (true) {
    const res = await fetch(url + '?page=' + page);
    const data = await res.json();
    if (data.length === 0) return;
    yield data;
    page++;
  }
}

// Consumed with for await...of
async function processAll() {
  for await (const page of fetchPages('/api/items')) {
    page.forEach(item => console.log(item));
  }
}</code></pre>

<h2>Practical Patterns</h2>

<h3>Lazy Evaluation Pipeline</h3>
<pre><code>function* map(iter, fn) { for (const x of iter) yield fn(x); }
function* filter(iter, fn) { for (const x of iter) if (fn(x)) yield x; }
function* take(iter, n) { let i = 0; for (const x of iter) { if (i++ >= n) return; yield x; } }

function* range(start = 0, end = Infinity) {
  for (let i = start; i < end; i++) yield i;
}

// Process millions of items lazily — O(1) memory!
const result = [...take(filter(map(range(1), x => x * x), x => x % 3 === 0), 5)];
// [9, 36, 81, 144, 225]</code></pre>

<h3>State Machine</h3>
<pre><code>function* httpRequestState() {
  while (true) {
    yield 'IDLE';
    yield 'PENDING';
    const success = yield 'AWAITING_RESULT';
    if (success) {
      yield 'SUCCESS';
    } else {
      yield 'ERROR';
      yield 'RETRYING';
    }
  }
}

const req = httpRequestState();
req.next(); // IDLE
req.next(); // PENDING
req.next(); // AWAITING_RESULT
req.next(true); // SUCCESS</code></pre>

<h3>Coroutine / Cooperative Multitasking</h3>
<pre><code>function run(genFn) {
  const gen = genFn();
  function step(value) {
    const result = gen.next(value);
    if (result.done) return Promise.resolve(result.value);
    return Promise.resolve(result.value).then(step);
  }
  return step();
}

// This is essentially how async/await works under the hood!
run(function* () {
  const data = yield fetch('/api').then(r => r.json());
  console.log(data);
});</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between an iterable and an iterator?</div>
  <div class="qa-a">An <strong>iterable</strong> is an object with a <code>[Symbol.iterator]</code> method that returns an <strong>iterator</strong>. An iterator has a <code>next()</code> method returning <code>{ value, done }</code>. A generator object is both: it has <code>[Symbol.iterator]</code> (returns itself) and <code>next()</code>. Arrays are iterable but not iterators — calling <code>[Symbol.iterator]()</code> on an array gives you an iterator.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why doesn't <code>[...gen()]</code> include the <code>return</code> value?</div>
  <div class="qa-a">Spread, <code>for...of</code>, destructuring, and <code>Array.from()</code> all stop when <code>done: true</code> and discard the value. The return value is only accessible via <code>.next()</code> directly. <code>yield*</code> does capture the return value of the delegated generator though.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do generators enable lazy evaluation?</div>
  <div class="qa-a">Generators are <strong>pull-based</strong>: they only compute the next value when <code>.next()</code> is called. This means you can represent infinite sequences and process them with <code>take()</code>, <code>filter()</code>, etc., without ever materializing the entire sequence in memory. Each <code>yield</code> suspends execution until more data is requested.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How is <code>async/await</code> related to generators?</div>
  <div class="qa-a"><code>async/await</code> was inspired by generator-based coroutines. Before <code>async/await</code> existed, libraries like <code>co</code> used generators + Promises: <code>yield promise</code> instead of <code>await promise</code>. The runner auto-called <code>.next(resolvedValue)</code>. Internally, <code>async</code> functions are implemented similarly by engines — they're generators that auto-advance on promise resolution.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What happens if you <code>throw()</code> into a generator with no try/catch?</div>
  <div class="qa-a">The generator terminates immediately. The <code>throw()</code> call returns <code>{ done: true, value: undefined }</code> and the error propagates to the caller. If there is a <code>finally</code> block, it still runs. Subsequent <code>.next()</code> calls always return <code>{ done: true, value: undefined }</code>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When would you use an async generator in production?</div>
  <div class="qa-a">Common use cases: (1) paginating API results — <code>yield</code> each page, consumer processes with <code>for await...of</code>; (2) streaming large files line-by-line; (3) real-time event streams (WebSocket messages, Server-Sent Events); (4) database cursor iteration. They combine the laziness of generators with async data fetching.</div>
</div>
`
  },
  {
    id: 'proxy-reflect',
    title: 'Proxy & Reflect',
    category: 'JavaScript',
    starterCode: `// ── BASIC PROXY ─────────────────────────────────
console.log('=== Proxy Basics ===');
const user = { name: 'Alice', age: 30, _password: 'secret' };

const handler = {
  get(target, prop, receiver) {
    if (prop.startsWith('_')) {
      throw new Error('Access denied: ' + prop);
    }
    console.log('GET', prop);
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    if (prop === 'age' && typeof value !== 'number') {
      throw new TypeError('Age must be a number');
    }
    console.log('SET', prop, '=', value);
    return Reflect.set(target, prop, value, receiver);
  },
  has(target, prop) {
    if (prop.startsWith('_')) return false;
    return Reflect.has(target, prop);
  }
};

const proxy = new Proxy(user, handler);
console.log(proxy.name);  // GET name → Alice
proxy.age = 31;           // SET age = 31
console.log('age' in proxy);      // true
console.log('_password' in proxy); // false (hidden!)

try { proxy._password; } catch(e) { console.log(e.message); }
try { proxy.age = 'old'; } catch(e) { console.log(e.message); }

// ── NEGATIVE ARRAY INDEXING ─────────────────────
console.log('\\n=== Negative Array Index ===');
function negativeArray(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const index = Number(prop);
      if (!isNaN(index) && index < 0) {
        prop = String(target.length + index);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

const arr = negativeArray([10, 20, 30, 40, 50]);
console.log(arr[-1]); // 50
console.log(arr[-2]); // 40
console.log(arr[0]);  // 10

// ── OBSERVABLE OBJECT ───────────────────────────
console.log('\\n=== Observable ===');
function observable(target) {
  const listeners = new Map();
  const proxy = new Proxy(target, {
    set(obj, prop, value) {
      const old = obj[prop];
      obj[prop] = value;
      if (listeners.has(prop)) {
        listeners.get(prop).forEach(fn => fn(value, old));
      }
      return true;
    }
  });
  proxy.on = (prop, fn) => {
    if (!listeners.has(prop)) listeners.set(prop, []);
    listeners.get(prop).push(fn);
  };
  return proxy;
}

const state = observable({ count: 0, name: 'test' });
state.on('count', (newVal, oldVal) => {
  console.log('count changed:', oldVal, '->', newVal);
});
state.count = 1;  // count changed: 0 -> 1
state.count = 5;  // count changed: 1 -> 5

// ── REVOCABLE PROXY ─────────────────────────────
console.log('\\n=== Revocable Proxy ===');
const { proxy: revProxy, revoke } = Proxy.revocable({ data: 42 }, {});
console.log(revProxy.data); // 42
revoke();
try { revProxy.data; } catch(e) { console.log(e.message); }

// ── VALIDATION SCHEMA ───────────────────────────
console.log('\\n=== Schema Validation ===');
function createValidator(schema) {
  return new Proxy({}, {
    set(target, prop, value) {
      if (prop in schema) {
        const { type, min, max } = schema[prop];
        if (typeof value !== type) throw new TypeError(prop + ' must be ' + type);
        if (min !== undefined && value < min) throw new RangeError(prop + ' min: ' + min);
        if (max !== undefined && value > max) throw new RangeError(prop + ' max: ' + max);
      }
      target[prop] = value;
      return true;
    }
  });
}

const person = createValidator({
  age: { type: 'number', min: 0, max: 150 },
  name: { type: 'string' }
});

person.name = 'Bob';
person.age = 25;
console.log(person.name, person.age);
try { person.age = -5; } catch(e) { console.log(e.message); }
`,
    content: `
<h1>Proxy & Reflect</h1>
<p><code>Proxy</code> allows you to intercept and customize fundamental operations on objects (property lookup, assignment, enumeration, function invocation, etc.). <code>Reflect</code> provides default implementations of those operations. Together they enable powerful metaprogramming patterns.</p>

<h2>Proxy Traps Overview</h2>
<table>
  <tr><th>Trap</th><th>Triggered by</th><th>Reflect method</th></tr>
  <tr><td><code>get(target, prop, receiver)</code></td><td>Property read</td><td><code>Reflect.get()</code></td></tr>
  <tr><td><code>set(target, prop, value, receiver)</code></td><td>Property write</td><td><code>Reflect.set()</code></td></tr>
  <tr><td><code>has(target, prop)</code></td><td><code>in</code> operator</td><td><code>Reflect.has()</code></td></tr>
  <tr><td><code>deleteProperty(target, prop)</code></td><td><code>delete</code> operator</td><td><code>Reflect.deleteProperty()</code></td></tr>
  <tr><td><code>apply(target, thisArg, args)</code></td><td>Function call</td><td><code>Reflect.apply()</code></td></tr>
  <tr><td><code>construct(target, args, newTarget)</code></td><td><code>new</code> operator</td><td><code>Reflect.construct()</code></td></tr>
  <tr><td><code>getPrototypeOf(target)</code></td><td><code>Object.getPrototypeOf()</code></td><td><code>Reflect.getPrototypeOf()</code></td></tr>
  <tr><td><code>setPrototypeOf(target, proto)</code></td><td><code>Object.setPrototypeOf()</code></td><td><code>Reflect.setPrototypeOf()</code></td></tr>
  <tr><td><code>ownKeys(target)</code></td><td><code>Object.keys()</code>, <code>for...in</code></td><td><code>Reflect.ownKeys()</code></td></tr>
  <tr><td><code>defineProperty(target, prop, desc)</code></td><td><code>Object.defineProperty()</code></td><td><code>Reflect.defineProperty()</code></td></tr>
  <tr><td><code>getOwnPropertyDescriptor(target, prop)</code></td><td><code>Object.getOwnPropertyDescriptor()</code></td><td><code>Reflect.getOwnPropertyDescriptor()</code></td></tr>
  <tr><td><code>isExtensible(target)</code></td><td><code>Object.isExtensible()</code></td><td><code>Reflect.isExtensible()</code></td></tr>
  <tr><td><code>preventExtensions(target)</code></td><td><code>Object.preventExtensions()</code></td><td><code>Reflect.preventExtensions()</code></td></tr>
</table>

<h2>Why Reflect?</h2>
<p><code>Reflect</code> provides the default behavior for each trap. Always use <code>Reflect.xxx()</code> instead of direct operations inside traps to:</p>
<ul>
  <li>Maintain correct <code>receiver</code> (important for inherited getters/setters)</li>
  <li>Return boolean success/failure instead of throwing</li>
  <li>Keep code consistent and forward-compatible</li>
</ul>

<pre><code>// BAD: direct property access in trap
get(target, prop) {
  return target[prop]; // Breaks if target has getters using 'this'
}

// GOOD: use Reflect
get(target, prop, receiver) {
  return Reflect.get(target, prop, receiver); // Correct 'this' in getters
}</code></pre>

<h2>Practical Use Cases</h2>

<h3>1. Validation Layer</h3>
<pre><code>function validated(target, rules) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const rule = rules[prop];
      if (rule && !rule.validate(value)) {
        throw new Error(rule.message || prop + ' validation failed');
      }
      return Reflect.set(obj, prop, value);
    }
  });
}

const user = validated({}, {
  email: {
    validate: v => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v),
    message: 'Invalid email'
  },
  age: {
    validate: v => Number.isInteger(v) && v >= 0 && v <= 150,
    message: 'Age must be 0-150'
  }
});

user.email = 'a@b.com'; // OK
user.age = 25; // OK
// user.email = 'invalid'; // throws!</code></pre>

<h3>2. Logging / Tracing</h3>
<pre><code>function traced(obj, label = '') {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return function (...args) {
          console.log(label + '.' + prop + '(' + args.join(', ') + ')');
          const result = Reflect.apply(value, this, args);
          console.log('  → ' + result);
          return result;
        };
      }
      console.log(label + '.' + prop + ' → ' + value);
      return value;
    }
  });
}

const math = traced(Math, 'Math');
math.max(1, 5, 3); // Math.max(1, 5, 3) → 5</code></pre>

<h3>3. Reactive System (Vue 3 Simplified)</h3>
<pre><code>let activeEffect = null;

function reactive(target) {
  const deps = new Map(); // prop → Set of effects

  return new Proxy(target, {
    get(obj, prop) {
      if (activeEffect) {
        if (!deps.has(prop)) deps.set(prop, new Set());
        deps.get(prop).add(activeEffect);
      }
      return Reflect.get(obj, prop);
    },
    set(obj, prop, value) {
      Reflect.set(obj, prop, value);
      if (deps.has(prop)) {
        deps.get(prop).forEach(effect => effect());
      }
      return true;
    }
  });
}

function effect(fn) {
  activeEffect = fn;
  fn(); // Run once to collect dependencies
  activeEffect = null;
}

const state = reactive({ count: 0 });
effect(() => console.log('Count is:', state.count)); // Count is: 0
state.count = 1; // Count is: 1  (auto re-runs!)
state.count = 2; // Count is: 2</code></pre>

<h3>4. Negative Array Indexing</h3>
<pre><code>function negativeIndex(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const idx = Number(prop);
      if (Number.isInteger(idx) && idx < 0) {
        prop = String(target.length + idx);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

const arr = negativeIndex([1, 2, 3, 4, 5]);
arr[-1]; // 5
arr[-3]; // 3</code></pre>

<h3>5. Default Values / Auto-Vivification</h3>
<pre><code>function autoVivify() {
  return new Proxy({}, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] = autoVivify();
      }
      return target[prop];
    }
  });
}

const config = autoVivify();
config.database.host.port = 5432;
// No errors! Intermediate objects created automatically</code></pre>

<h2>Revocable Proxies</h2>
<pre><code>// Useful for granting temporary access
function grantAccess(resource, timeout) {
  const { proxy, revoke } = Proxy.revocable(resource, {});
  setTimeout(() => {
    revoke();
    console.log('Access revoked');
  }, timeout);
  return proxy;
}

const secret = grantAccess({ key: 'abc123' }, 5000);
secret.key; // 'abc123'
// After 5 seconds:
// secret.key → TypeError: Cannot perform 'get' on a proxy that has been revoked</code></pre>

<h2>Proxy Invariants (Constraints)</h2>
<p>Proxies must respect certain invariants enforced by the engine:</p>
<ul>
  <li><code>get</code> must return the property value if it's non-configurable, non-writable</li>
  <li><code>set</code> cannot return true for non-configurable, non-writable properties</li>
  <li><code>has</code> cannot hide non-configurable own properties</li>
  <li><code>ownKeys</code> must include all non-configurable own properties</li>
  <li><code>isExtensible</code> must match the target's actual extensibility</li>
</ul>

<pre><code>const frozen = Object.freeze({ x: 1 });
const p = new Proxy(frozen, {
  get() { return 42; } // THROWS! Must return 1 for frozen property
});</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between Proxy and Object.defineProperty?</div>
  <div class="qa-a"><code>Object.defineProperty</code> works on individual properties and can only define getters/setters. <code>Proxy</code> wraps the entire object and intercepts 13+ operations including property access, <code>in</code> operator, <code>delete</code>, function calls, and <code>new</code>. Proxies can intercept operations on properties that don't exist yet. Vue 2 used <code>defineProperty</code> (couldn't detect new properties or array index changes). Vue 3 switched to <code>Proxy</code> to fix these limitations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why should you use <code>Reflect</code> inside proxy traps?</div>
  <div class="qa-a"><code>Reflect</code> methods maintain the correct <code>receiver</code> context, which is critical for inherited getters/setters. They also return booleans for success/failure (instead of throwing), match 1:1 with proxy traps, and provide a cleaner API than the equivalent <code>Object</code> methods. Using <code>Reflect.get(target, prop, receiver)</code> ensures that if the property is a getter, <code>this</code> inside it refers to the proxy (not the raw target).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can you proxy a function? What traps apply?</div>
  <div class="qa-a">Yes. Functions are objects, so all traps apply. Additionally, the <code>apply</code> trap intercepts function calls, and the <code>construct</code> trap intercepts <code>new</code>. This enables powerful patterns like memoization, argument validation, and AOP (aspect-oriented programming): <code>new Proxy(fn, { apply(target, thisArg, args) { /* wrap */ } })</code>.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are proxy invariants and why do they exist?</div>
  <div class="qa-a">Proxy invariants are consistency rules the engine enforces. For example, if the target has a non-configurable, non-writable property <code>x: 1</code>, the <code>get</code> trap must return <code>1</code> — you can't lie about it. These exist to maintain the integrity of the object model and prevent proxies from breaking fundamental assumptions that the engine and other code rely on (e.g., <code>Object.freeze</code> contracts).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a revocable proxy and when would you use it?</div>
  <div class="qa-a"><code>Proxy.revocable(target, handler)</code> returns <code>{ proxy, revoke }</code>. Calling <code>revoke()</code> permanently disables the proxy — any operation throws <code>TypeError</code>. Use cases: (1) granting temporary access to sensitive objects, (2) ensuring references become invalid after a session ends, (3) preventing memory leaks by cutting off access to large objects. Once revoked, GC can collect the target if no other references exist.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does Vue 3's reactivity system use Proxy?</div>
  <div class="qa-a">Vue 3's <code>reactive()</code> wraps objects in a Proxy. The <code>get</code> trap tracks which effects (computed properties, watchers, render functions) depend on which properties. The <code>set</code> trap triggers those effects when properties change. Unlike Vue 2's <code>Object.defineProperty</code> approach, this automatically handles new property additions, deletions, array index mutations, and <code>Map</code>/<code>Set</code> operations without special APIs like <code>Vue.set()</code>.</div>
</div>
`
  },
  {
    id: 'weak-references',
    title: 'WeakMap, WeakSet & WeakRef',
    category: 'JavaScript',
    starterCode: `// ── WEAKMAP VS MAP ───────────────────────────────
console.log('=== WeakMap vs Map ===');

// Map: keys can be anything, holds strong references
const map = new Map();
let objKey = { id: 1 };
map.set(objKey, 'data');
console.log('Map size:', map.size); // 1
// Even if objKey = null, the Map still holds the object!

// WeakMap: keys must be objects, holds WEAK references
const weakMap = new WeakMap();
let obj1 = { id: 1 };
let obj2 = { id: 2 };
weakMap.set(obj1, 'metadata for obj1');
weakMap.set(obj2, 'metadata for obj2');
console.log(weakMap.has(obj1)); // true
console.log(weakMap.get(obj1)); // 'metadata for obj1'
// When obj1 = null, the entry is eventually GC'd

// ── PRIVATE DATA PATTERN ────────────────────────
console.log('\\n=== Private Data with WeakMap ===');
const _private = new WeakMap();

class User {
  constructor(name, password) {
    _private.set(this, { password, loginAttempts: 0 });
    this.name = name;
  }

  checkPassword(pwd) {
    const priv = _private.get(this);
    priv.loginAttempts++;
    return priv.password === pwd;
  }

  getLoginAttempts() {
    return _private.get(this).loginAttempts;
  }
}

const user = new User('Alice', 'secret123');
console.log(user.name); // Alice
console.log(user.password); // undefined (truly private!)
console.log(user.checkPassword('wrong')); // false
console.log(user.checkPassword('secret123')); // true
console.log(user.getLoginAttempts()); // 2
// When user is GC'd, private data is also GC'd!

// ── WEAKSET ─────────────────────────────────────
console.log('\\n=== WeakSet: Tagging Objects ===');
const visited = new WeakSet();

function processNode(node) {
  if (visited.has(node)) {
    console.log('Already visited:', node.name);
    return;
  }
  visited.add(node);
  console.log('Processing:', node.name);
}

const nodeA = { name: 'A' };
const nodeB = { name: 'B' };
processNode(nodeA); // Processing: A
processNode(nodeB); // Processing: B
processNode(nodeA); // Already visited: A

// ── WEAKREF ─────────────────────────────────────
console.log('\\n=== WeakRef ===');
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value) {
    this.cache.set(key, new WeakRef(value));
  }

  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      // Object was GC'd
      this.cache.delete(key);
      return undefined;
    }
    return value;
  }
}

const cache = new Cache();
let bigData = { data: new Array(1000).fill('x') };
cache.set('big', bigData);
console.log('Cache hit:', cache.get('big') !== undefined); // true
// If bigData = null and GC runs, cache.get('big') → undefined

// ── FINALIZATION REGISTRY ───────────────────────
console.log('\\n=== FinalizationRegistry ===');
const registry = new FinalizationRegistry((heldValue) => {
  console.log('Object was GC\\'d! Cleanup:', heldValue);
});

let resource = { connection: 'db://localhost' };
registry.register(resource, 'DB connection cleanup');
// When resource is GC'd, callback fires with 'DB connection cleanup'
console.log('Resource registered for finalization');

// ── COMPARISON TABLE (logged) ───────────────────
console.log('\\n=== Quick Comparison ===');
console.log('Map:     strong keys, iterable, .size, any key type');
console.log('WeakMap: weak keys, NOT iterable, no .size, object keys only');
console.log('Set:     strong values, iterable, .size');
console.log('WeakSet: weak values, NOT iterable, no .size, object values only');
`,
    content: `
<h1>WeakMap, WeakSet & WeakRef</h1>
<p>Weak collections hold references that don't prevent garbage collection. Understanding them is essential for memory management, caching strategies, and private data patterns in JavaScript.</p>

<h2>WeakMap vs Map</h2>
<table>
  <tr><th>Feature</th><th>Map</th><th>WeakMap</th></tr>
  <tr><td>Key types</td><td>Any value</td><td>Objects and non-registered symbols only</td></tr>
  <tr><td>GC behavior</td><td>Strong reference — prevents GC of keys</td><td>Weak reference — allows GC when no other refs</td></tr>
  <tr><td>Iterable?</td><td>Yes (<code>for...of</code>, <code>.keys()</code>, <code>.values()</code>)</td><td>No (not iterable)</td></tr>
  <tr><td><code>.size</code></td><td>Yes</td><td>No</td></tr>
  <tr><td><code>.clear()</code></td><td>Yes</td><td>No</td></tr>
  <tr><td>Methods</td><td><code>get, set, has, delete, keys, values, entries, forEach</code></td><td><code>get, set, has, delete</code> only</td></tr>
  <tr><td>Use case</td><td>General key-value store</td><td>Metadata for objects you don't own</td></tr>
</table>

<pre><code>// Memory leak with Map:
const cache = new Map();
function process(obj) {
  // obj stays in memory as long as cache exists!
  cache.set(obj, computeExpensive(obj));
}

// Fixed with WeakMap:
const cache = new WeakMap();
function process(obj) {
  if (!cache.has(obj)) cache.set(obj, computeExpensive(obj));
  return cache.get(obj);
  // When obj is no longer referenced elsewhere, entry is GC'd
}</code></pre>

<h2>Private Data Pattern with WeakMap</h2>
<p>Before the <code>#private</code> class field syntax, WeakMap was the best way to implement truly private instance data:</p>
<pre><code>const _internals = new WeakMap();

class Connection {
  constructor(url, token) {
    _internals.set(this, {
      url,
      token,
      retries: 0,
      connected: false
    });
  }

  connect() {
    const priv = _internals.get(this);
    priv.connected = true;
    console.log('Connected to ' + priv.url);
  }

  get isConnected() {
    return _internals.get(this).connected;
  }

  // When instance is GC'd, private data is also GC'd automatically
}

const conn = new Connection('wss://api.example.com', 'secret-token');
console.log(conn.token);       // undefined — truly private!
console.log(Object.keys(conn)); // [] — nothing enumerable</code></pre>

<h3>WeakMap vs #private fields</h3>
<table>
  <tr><th>Feature</th><th>WeakMap pattern</th><th><code>#private</code> fields</th></tr>
  <tr><td>Truly private?</td><td>Yes</td><td>Yes</td></tr>
  <tr><td>Performance</td><td>Slight overhead (map lookup)</td><td>Native, fast</td></tr>
  <tr><td>Works outside class?</td><td>Yes (factory functions)</td><td>No (class only)</td></tr>
  <tr><td>Subclass access?</td><td>Possible (if WeakMap is shared)</td><td>No (hard private)</td></tr>
  <tr><td>Polyfillable?</td><td>Yes</td><td>Not perfectly</td></tr>
</table>

<h2>WeakSet</h2>
<p>A Set where values are held weakly. Values must be objects. Primary use: <strong>tagging objects</strong> without preventing GC.</p>

<pre><code>// Use case 1: Tracking visited nodes (cycle detection)
const visited = new WeakSet();

function deepClone(obj) {
  if (visited.has(obj)) return '[Circular]';
  if (typeof obj !== 'object' || obj === null) return obj;

  visited.add(obj);
  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

// Use case 2: Branding / type checking
const validTokens = new WeakSet();

class Token {
  constructor(value) {
    this.value = value;
    validTokens.add(this);
  }

  static isValid(token) {
    return validTokens.has(token);
  }
}

const t = new Token('abc');
Token.isValid(t);               // true
Token.isValid({ value: 'abc' }); // false — not branded</code></pre>

<h2>WeakRef</h2>
<p><code>WeakRef</code> holds a weak reference to a target object. Call <code>.deref()</code> to get the object (or <code>undefined</code> if GC'd).</p>

<pre><code>let heavyObject = { data: new ArrayBuffer(10_000_000) }; // 10MB
const ref = new WeakRef(heavyObject);

// Later:
const obj = ref.deref();
if (obj) {
  console.log('Still alive, size:', obj.data.byteLength);
} else {
  console.log('Object was garbage collected');
}

// IMPORTANT: Don't deref() twice in same turn — cache the result!
// BAD:
if (ref.deref()) {
  use(ref.deref()); // Could be undefined if GC ran between calls!
}
// GOOD:
const target = ref.deref();
if (target) {
  use(target);
}</code></pre>

<h3>Caching with WeakRef</h3>
<pre><code>class SmartCache {
  #cache = new Map();
  #finalizer = new FinalizationRegistry(key => {
    // Only delete if the current ref is still dead
    const ref = this.#cache.get(key);
    if (ref && !ref.deref()) {
      this.#cache.delete(key);
      console.log('Cache entry cleaned:', key);
    }
  });

  set(key, value) {
    const existing = this.#cache.get(key);
    if (existing) {
      const obj = existing.deref();
      if (obj) this.#finalizer.unregister(obj);
    }
    this.#cache.set(key, new WeakRef(value));
    this.#finalizer.register(value, key, value);
  }

  get(key) {
    const ref = this.#cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (!value) {
      this.#cache.delete(key);
      return undefined;
    }
    return value;
  }
}</code></pre>

<h2>FinalizationRegistry</h2>
<p>Allows you to register a callback that fires when a registered object is garbage collected.</p>

<pre><code>const registry = new FinalizationRegistry((heldValue) => {
  console.log('Cleaning up:', heldValue);
  // e.g., close file handle, release native resource
});

function createResource() {
  const resource = { handle: openNativeHandle() };
  // heldValue is passed to callback, unregisterToken allows unregistration
  registry.register(resource, 'handle-42', resource);
  return resource;
}

// To prevent cleanup if manually disposing:
function dispose(resource) {
  closeNativeHandle(resource.handle);
  registry.unregister(resource); // Cancel finalization
}</code></pre>

<h3>Important Caveats</h3>
<ul>
  <li>Callback timing is <strong>non-deterministic</strong> — may never fire if process exits first</li>
  <li>Don't rely on it for critical cleanup — it's a safety net, not a primary mechanism</li>
  <li>Callback runs in a separate microtask — no guaranteed ordering</li>
  <li>Avoid resurrecting objects in the callback (re-assigning to a reachable variable)</li>
</ul>

<div class="qa-block">
  <div class="qa-q">Q: When should you use WeakMap over Map?</div>
  <div class="qa-a">Use WeakMap when you're associating metadata with objects you don't own or control the lifecycle of — DOM nodes, third-party objects, class instances. If the object is garbage collected, the metadata is too. Use Map when you need iteration, <code>.size</code>, or when keys are primitives. Common WeakMap use cases: private instance data, memoization caches, DOM element metadata, framework internals (React fiber nodes, Vue reactivity tracking).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why can't WeakMap keys be primitives?</div>
  <div class="qa-a">Primitives are not garbage collected — they're values, not reference types with identity. GC tracks reachability of objects via references. A primitive like <code>42</code> or <code>"hello"</code> has no reference to become "unreachable." Since the entire point of WeakMap is allowing GC of keys, primitive keys would never be collected, making them just a Map with fewer features. Note: non-registered Symbols (unique symbols) can be WeakMap keys since ES2023.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does WeakRef differ from WeakMap?</div>
  <div class="qa-a">WeakMap stores key-value pairs where the key is weakly held. WeakRef holds a single weak reference to an object — you call <code>.deref()</code> to get it back (or <code>undefined</code> if collected). WeakRef gives you direct access to check if an object still exists, which WeakMap doesn't. WeakRef is useful for caches where you want to store a reference by a string key but allow the value to be GC'd. The TC39 committee warns: avoid WeakRef unless truly necessary, as GC behavior varies across engines.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What memory leaks does WeakMap prevent?</div>
  <div class="qa-a">Classic example: caching computed results for DOM nodes. With a regular Map, removing a DOM node from the document doesn't free memory because the Map still holds a reference. With WeakMap, once the DOM node has no other references, both the node and cached data are eligible for GC. Similarly, event listener metadata, validation state for form elements, and per-instance private data all benefit from WeakMap's automatic cleanup.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Is it safe to rely on FinalizationRegistry for resource cleanup?</div>
  <div class="qa-a">No. The spec explicitly says finalization callbacks may be delayed indefinitely or never called at all (e.g., program exits). Use FinalizationRegistry as a <strong>safety net</strong>, not the primary mechanism. Always provide explicit <code>dispose()</code>/<code>close()</code> methods. The TC39 proposal calls this pattern "Mark-and-Cleanup" — explicit cleanup as primary, finalization as backup. The new <code>Symbol.dispose</code> / <code>using</code> declaration (ES2024) is the preferred approach for deterministic cleanup.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can you iterate over a WeakMap or WeakSet?</div>
  <div class="qa-a">No. They are not iterable and have no <code>.size</code>, <code>.keys()</code>, <code>.values()</code>, <code>.entries()</code>, or <code>.forEach()</code> methods. This is by design: since entries can be GC'd at any time, the contents are non-deterministic. Exposing iteration would create observable differences based on GC timing, making behavior unpredictable across engines. If you need iteration, use Map/Set and manage lifecycle manually.</div>
</div>
`
  },
  {
    id: 'event-loop-advanced',
    title: 'Event Loop & Microtasks Deep Dive',
    category: 'JavaScript',
    starterCode: `// ── PUZZLE 1: Basic Order ────────────────────────
console.log('=== Puzzle 1: Basic Order ===');
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
// Sync first, then microtask (Promise), then macrotask (setTimeout)

// ── PUZZLE 2: Nested Microtasks ─────────────────
console.log('\\n=== Puzzle 2: Nested Microtasks ===');
setTimeout(() => console.log('timeout 1'), 0);
Promise.resolve()
  .then(() => {
    console.log('promise 1');
    Promise.resolve().then(() => console.log('promise 2'));
  })
  .then(() => console.log('promise 3'));
setTimeout(() => console.log('timeout 2'), 0);
console.log('sync');
// Output: sync, promise 1, promise 2, promise 3, timeout 1, timeout 2

// ── PUZZLE 3: Mixed Timers ──────────────────────
console.log('\\n=== Puzzle 3: Mixed ===');
setTimeout(() => {
  console.log('T1');
  Promise.resolve().then(() => console.log('P1'));
}, 0);
setTimeout(() => {
  console.log('T2');
  Promise.resolve().then(() => console.log('P2'));
}, 0);
Promise.resolve().then(() => {
  console.log('P3');
  setTimeout(() => console.log('T3'), 0);
});
// Output: P3, T1, P1, T2, P2, T3

// ── PUZZLE 4: queueMicrotask ────────────────────
console.log('\\n=== Puzzle 4: queueMicrotask ===');
queueMicrotask(() => console.log('micro 1'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('micro 2'));
console.log('sync');
// Output: sync, micro 1, promise, micro 2

// ── PUZZLE 5: Promise Constructor ───────────────
console.log('\\n=== Puzzle 5: Promise Constructor ===');
const p = new Promise((resolve) => {
  console.log('constructor');
  resolve('done');
  console.log('after resolve');
});
p.then(val => console.log(val));
console.log('end');
// Output: constructor, after resolve, end, done

// ── PUZZLE 6: async/await ───────────────────────
console.log('\\n=== Puzzle 6: async/await ===');
async function foo() {
  console.log('foo start');
  await Promise.resolve();
  console.log('foo after await');
}
console.log('before foo');
foo();
console.log('after foo');
// Output: before foo, foo start, after foo, foo after await

// ── PUZZLE 7: Starvation ────────────────────────
console.log('\\n=== Puzzle 7: Microtask Starvation ===');
// WARNING: This demonstrates starvation — the setTimeout never runs
// because microtasks keep queueing more microtasks
let count = 0;
setTimeout(() => console.log('timeout will run after microtasks'), 0);

function scheduleMicro() {
  count++;
  if (count <= 5) {
    console.log('microtask', count);
    queueMicrotask(scheduleMicro);
  } else {
    console.log('microtask queue done, timeout can run now');
  }
}
queueMicrotask(scheduleMicro);

// ── PUZZLE 8: then() chaining ───────────────────
console.log('\\n=== Puzzle 8: Chaining ===');
Promise.resolve()
  .then(() => {
    console.log('then 1');
    return Promise.resolve('inner');
  })
  .then((val) => {
    console.log('then 2:', val);
  });

Promise.resolve()
  .then(() => console.log('then A'))
  .then(() => console.log('then B'));

// In modern V8: then A, then 1, then B, then 2: inner
// (returning a Promise from .then adds extra microtask ticks)
`,
    content: `
<h1>Event Loop & Microtasks Deep Dive</h1>
<p>This topic covers the <strong>browser event loop model</strong> at an SDE3 depth. The event loop is the most commonly tested JavaScript concept in senior interviews, particularly execution order puzzles.</p>

<h2>Event Loop Architecture</h2>
<pre><code>┌─────────────────────────────┐
│        Call Stack            │  ← Synchronous code executes here
│  (one frame at a time)       │
└─────────────┬───────────────┘
              │ (when empty)
              ▼
┌─────────────────────────────┐
│    Microtask Queue           │  ← Drained COMPLETELY before any macrotask
│  Promise.then, queueMicro,  │
│  MutationObserver, await     │
└─────────────┬───────────────┘
              │ (when empty)
              ▼
┌─────────────────────────────┐
│    Macrotask Queue(s)        │  ← ONE macrotask per loop iteration
│  setTimeout, setInterval,    │
│  setImmediate, I/O, UI       │
└─────────────────────────────┘</code></pre>

<h2>Microtask vs Macrotask</h2>
<table>
  <tr><th>Microtasks</th><th>Macrotasks</th></tr>
  <tr><td><code>Promise.then/catch/finally</code></td><td><code>setTimeout</code></td></tr>
  <tr><td><code>queueMicrotask()</code></td><td><code>setInterval</code></td></tr>
  <tr><td><code>MutationObserver</code></td><td><code>setImmediate</code> (Node.js)</td></tr>
  <tr><td><code>await</code> (continuation after)</td><td>I/O callbacks</td></tr>
  <tr><td><code>process.nextTick()</code> (Node.js — even higher priority)</td><td><code>requestAnimationFrame</code> (browser)</td></tr>
</table>

<h3>Key Rule</h3>
<p><strong>After each macrotask (and after the initial script), the entire microtask queue is drained before the next macrotask runs.</strong> Microtasks added during microtask processing are also processed in the same cycle.</p>

<h2>Execution Order Algorithm</h2>
<ol>
  <li>Execute synchronous code (call stack)</li>
  <li>Call stack empty → drain the <strong>entire</strong> microtask queue</li>
  <li>If any microtask schedules more microtasks, process those too</li>
  <li>Render/paint (if needed, browser only)</li>
  <li>Pick ONE macrotask from the queue, execute it</li>
  <li>Go to step 2</li>
</ol>

<h2>queueMicrotask() vs Promise.resolve().then()</h2>
<pre><code>// Both schedule microtasks, but:
queueMicrotask(() => console.log('queueMicrotask'));
Promise.resolve().then(() => console.log('Promise.then'));

// They interleave in scheduling order (both are microtasks)
// queueMicrotask is slightly more efficient (no Promise allocation)
// Use queueMicrotask when you don't need Promise chaining</code></pre>

<h2>requestAnimationFrame Timing</h2>
<pre><code>// rAF runs BEFORE the next repaint, AFTER microtasks,
// but its position relative to macrotasks varies:
//
// Browser event loop iteration:
// 1. Macrotask
// 2. Microtasks (all)
// 3. rAF callbacks (if repaint scheduled)
// 4. Style/Layout/Paint
// 5. requestIdleCallback (if idle time)

console.log('sync');
requestAnimationFrame(() => console.log('rAF'));
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('microtask'));
// Output: sync, microtask, rAF (usually), timeout
// Note: rAF vs timeout order is not strictly guaranteed</code></pre>

<h2>Execution Order Puzzles</h2>

<h3>Puzzle 1: Basics</h3>
<pre><code>console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// Output: 1, 4, 3, 2
// Reason: Sync (1, 4) → microtask (3) → macrotask (2)</code></pre>

<h3>Puzzle 2: Nested Microtasks</h3>
<pre><code>setTimeout(() => console.log('T1'), 0);

Promise.resolve()
  .then(() => {
    console.log('P1');
    Promise.resolve().then(() => console.log('P2'));
  })
  .then(() => console.log('P3'));

setTimeout(() => console.log('T2'), 0);
console.log('sync');

// Output: sync, P1, P2, P3, T1, T2
// P2 runs before P3 because P2 was queued in the same
// microtask cycle, while P3 is queued after P1's .then chain resolves</code></pre>

<h3>Puzzle 3: Interleaved Timers and Microtasks</h3>
<pre><code>setTimeout(() => {
  console.log('T1');
  Promise.resolve().then(() => console.log('P1'));
}, 0);

setTimeout(() => {
  console.log('T2');
  Promise.resolve().then(() => console.log('P2'));
}, 0);

// Output: T1, P1, T2, P2
// After each macrotask (T1, T2), the microtask queue is drained</code></pre>

<h3>Puzzle 4: Promise Constructor is Synchronous</h3>
<pre><code>console.log('A');
const p = new Promise(resolve => {
  console.log('B');
  resolve();
  console.log('C'); // Still runs! resolve() doesn't return/break
});
p.then(() => console.log('D'));
console.log('E');

// Output: A, B, C, E, D
// Promise constructor executor runs synchronously
// resolve() is sync but .then() callback is always a microtask</code></pre>

<h3>Puzzle 5: async/await Desugaring</h3>
<pre><code>async function a() {
  console.log('a1');
  await b();
  console.log('a2'); // This is a microtask (continuation after await)
}

async function b() {
  console.log('b1');
}

console.log('start');
a();
console.log('end');

// Output: start, a1, b1, end, a2
// Equivalent to:
// a() { log('a1'); return b().then(() => log('a2')); }</code></pre>

<h3>Puzzle 6: Multiple awaits</h3>
<pre><code>async function foo() {
  console.log('foo 1');
  await 0;
  console.log('foo 2');
  await 0;
  console.log('foo 3');
}

async function bar() {
  console.log('bar 1');
  await 0;
  console.log('bar 2');
  await 0;
  console.log('bar 3');
}

foo();
bar();
console.log('sync');

// Output: foo 1, bar 1, sync, foo 2, bar 2, foo 3, bar 3
// Each await yields to the microtask queue, interleaving execution</code></pre>

<h3>Puzzle 7: Returning Promise from .then()</h3>
<pre><code>Promise.resolve()
  .then(() => {
    console.log('A');
    return Promise.resolve('inner'); // Extra microtask ticks!
  })
  .then(val => console.log('B:', val));

Promise.resolve()
  .then(() => console.log('C'))
  .then(() => console.log('D'));

// Output (modern V8): C, A, D, B: inner
// Returning a Promise from .then() adds ~2 extra microtask ticks
// This is a well-known interview gotcha</code></pre>

<h3>Puzzle 8: Microtask Starvation</h3>
<pre><code>// Microtasks can starve macrotasks!
function recurse() {
  Promise.resolve().then(recurse); // Infinite microtasks
}
setTimeout(() => console.log('I never run'), 0);
recurse();
// The setTimeout NEVER fires because microtasks keep queuing

// Same problem with queueMicrotask:
function bad() { queueMicrotask(bad); }
// This blocks the event loop entirely!</code></pre>

<h3>Puzzle 9: process.nextTick vs Promise (Node.js)</h3>
<pre><code>// In Node.js, process.nextTick has HIGHER priority than Promise microtasks
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// Output: nextTick, promise
// nextTick queue is drained before the promise microtask queue</code></pre>

<h3>Puzzle 10: Complex Mixed</h3>
<pre><code>console.log('1');

setTimeout(() => {
  console.log('2');
  new Promise(resolve => {
    console.log('3');
    resolve();
  }).then(() => console.log('4'));
});

new Promise(resolve => {
  console.log('5');
  resolve();
}).then(() => {
  console.log('6');
}).then(() => {
  console.log('7');
});

setTimeout(() => console.log('8'));

console.log('9');

// Output: 1, 5, 9, 6, 7, 2, 3, 4, 8
// Sync: 1, 5 (constructor), 9
// Microtasks: 6, then 7
// Macrotask 1: 2, 3 (sync in constructor), then microtask 4
// Macrotask 2: 8</code></pre>

<h2>MutationObserver as Microtask</h2>
<pre><code>// MutationObserver callbacks are microtasks (in browsers)
const observer = new MutationObserver(() => {
  console.log('mutation observed'); // microtask
});

const div = document.createElement('div');
observer.observe(div, { attributes: true });

console.log('before mutation');
div.setAttribute('data-x', '1'); // Schedules microtask
console.log('after mutation');

// Output: before mutation, after mutation, mutation observed</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between microtasks and macrotasks?</div>
  <div class="qa-a">Macrotasks (setTimeout, setInterval, I/O) are processed one at a time per event loop iteration. Microtasks (Promise.then, queueMicrotask, MutationObserver) are processed entirely — the whole queue is drained after each macrotask and after the initial script. Microtasks added during microtask processing are also processed in the same drain cycle. This means microtasks always run before the next macrotask.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Can microtasks starve the macrotask queue?</div>
  <div class="qa-a">Yes. If a microtask continuously schedules new microtasks, the microtask queue never empties, and no macrotask (including setTimeout, UI rendering, I/O) can execute. This is a real risk with recursive <code>queueMicrotask()</code> or <code>Promise.resolve().then()</code> loops. To avoid starvation, break recursive processing into macrotasks (setTimeout) if long-running.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why does returning a Promise from <code>.then()</code> delay the next <code>.then()</code>?</div>
  <div class="qa-a">When <code>.then()</code> returns a thenable (Promise), the engine must resolve it by calling its <code>.then()</code> method, which takes extra microtask ticks. The spec wraps it in <code>PromiseResolveThenableJob</code>, which itself is a microtask. In V8, returning <code>Promise.resolve(x)</code> from <code>.then()</code> costs ~2 extra microtask ticks compared to returning a plain value. This is a common interview trick to test deep event loop understanding.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does <code>await</code> work under the hood with respect to the event loop?</div>
  <div class="qa-a"><code>await expr</code> evaluates <code>expr</code> synchronously, wraps it in <code>Promise.resolve(expr)</code>, then suspends the async function. The continuation (code after await) is scheduled as a microtask via the promise's <code>.then()</code>. This means code after <code>await</code> runs in the next microtask checkpoint, not synchronously. Multiple async functions interleave at each <code>await</code> point, similar to cooperative multitasking.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the order of: setTimeout vs setImmediate vs process.nextTick in Node.js?</div>
  <div class="qa-a">Priority (highest first): <code>process.nextTick</code> > <code>Promise microtasks</code> > <code>setImmediate</code> (check phase) ≈ <code>setTimeout(0)</code> (timers phase). The order of setTimeout(0) vs setImmediate depends on execution context: inside an I/O callback, setImmediate always fires first. Outside I/O, the order is non-deterministic due to timer resolution. <code>process.nextTick</code> always runs before any other microtask or macrotask in the current phase.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: When does <code>requestAnimationFrame</code> fire relative to the event loop?</div>
  <div class="qa-a">rAF fires once per frame, after microtasks are drained and before the browser paints. The sequence is: macrotask → microtasks → rAF callbacks → style calculation → layout → paint → requestIdleCallback (if idle). rAF runs at ~60fps (16.67ms intervals). It's NOT a macrotask or microtask — it's part of the rendering pipeline. In background tabs, rAF is typically throttled to 0-10fps.</div>
</div>
`
  },
  {
    id: 'functional-js',
    title: 'Functional Programming in JS',
    category: 'JavaScript',
    starterCode: `// ── PURE FUNCTIONS ──────────────────────────────
console.log('=== Pure Functions ===');
// Pure: same input → same output, no side effects
const add = (a, b) => a + b;
console.log(add(2, 3)); // Always 5

// Impure: depends on external state
let tax = 0.1;
const addTax = (price) => price * (1 + tax); // depends on 'tax'
console.log(addTax(100)); // 110, but could change!

// ── IMMUTABILITY ────────────────────────────────
console.log('\\n=== Immutability ===');
const user = { name: 'Alice', scores: [90, 85] };

// BAD: mutation
// user.scores.push(95);

// GOOD: create new objects
const updated = {
  ...user,
  scores: [...user.scores, 95]
};
console.log('Original:', user.scores);   // [90, 85]
console.log('Updated:', updated.scores); // [90, 85, 95]

// ── CURRYING ────────────────────────────────────
console.log('\\n=== Currying ===');
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
};

const multiply = curry((a, b, c) => a * b * c);
console.log(multiply(2)(3)(4));    // 24
console.log(multiply(2, 3)(4));    // 24
console.log(multiply(2)(3, 4));    // 24

const double = multiply(2)(1);
console.log(double(5)); // 10
console.log(double(7)); // 14

// ── PARTIAL APPLICATION ─────────────────────────
console.log('\\n=== Partial Application ===');
const partial = (fn, ...presetArgs) =>
  (...laterArgs) => fn(...presetArgs, ...laterArgs);

const greet = (greeting, name) => greeting + ', ' + name + '!';
const hello = partial(greet, 'Hello');
const hey = partial(greet, 'Hey');
console.log(hello('Alice')); // Hello, Alice!
console.log(hey('Bob'));     // Hey, Bob!

// ── COMPOSITION ─────────────────────────────────
console.log('\\n=== Function Composition ===');
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const split = (sep) => (s) => s.split(sep);

const processInput = pipe(trim, lower, split(' '));
console.log(processInput('  Hello World  ')); // ['hello', 'world']

// compose goes right-to-left (mathematical style)
const process2 = compose(split(' '), lower, trim);
console.log(process2('  Foo Bar  ')); // ['foo', 'bar']

// ── HIGHER-ORDER FUNCTIONS ──────────────────────
console.log('\\n=== Higher-Order Functions ===');
const withLogging = (fn) => (...args) => {
  console.log('Calling with:', args);
  const result = fn(...args);
  console.log('Result:', result);
  return result;
};

const loggedAdd = withLogging(add);
loggedAdd(3, 4);

// ── TRANSDUCERS (simplified) ────────────────────
console.log('\\n=== Transducers ===');
// Transducers compose transformations without intermediate arrays
const mapT = (fn) => (reducer) => (acc, val) => reducer(acc, fn(val));
const filterT = (pred) => (reducer) => (acc, val) =>
  pred(val) ? reducer(acc, val) : acc;

const append = (arr, val) => [...arr, val];
const xform = compose(
  filterT(x => x % 2 !== 0),
  mapT(x => x * x)
);

const result = [1, 2, 3, 4, 5].reduce(xform(append), []);
console.log('Transduced:', result); // [1, 9, 25]
`,
    content: `
<h1>Functional Programming in JS</h1>
<p>Functional programming (FP) is a paradigm centered on <strong>pure functions</strong>, <strong>immutability</strong>, and <strong>composition</strong>. JavaScript supports FP through first-class functions, closures, and built-in methods like <code>map</code>, <code>filter</code>, <code>reduce</code>. Senior engineers should understand when and how to apply FP effectively.</p>

<h2>Core Principles</h2>

<h3>1. Pure Functions</h3>
<p>A function is pure if: (a) same inputs always produce the same output, (b) no side effects.</p>
<pre><code>// Pure
const add = (a, b) => a + b;
const toUpper = (str) => str.toUpperCase();
const area = (r) => Math.PI * r * r;

// Impure (side effects)
let count = 0;
const increment = () => ++count; // Modifies external state
const log = (msg) => console.log(msg); // I/O side effect
const now = () => Date.now(); // Non-deterministic

// Impure → Pure: dependency injection
const getTimestamp = (dateFn = Date.now) => dateFn(); // Testable!</code></pre>

<h3>2. Immutability</h3>
<pre><code>// Object immutability patterns
const user = Object.freeze({ name: 'Alice', address: { city: 'NYC' } });
// user.name = 'Bob'; // TypeError in strict mode (silent fail otherwise)
// NOTE: Object.freeze is SHALLOW — user.address.city is still mutable!

// Deep immutability with structuredClone + freeze:
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
      deepFreeze(obj[key]);
    }
  });
  return obj;
}

// Immutable update patterns:
const state = { users: [{ id: 1, name: 'A' }], count: 1 };

// Update nested property:
const newState = {
  ...state,
  users: state.users.map(u =>
    u.id === 1 ? { ...u, name: 'B' } : u
  ),
  count: state.count + 1
};
// Or use structuredClone for deep clone:
const clone = structuredClone(state);</code></pre>

<h3>3. First-Class & Higher-Order Functions</h3>
<pre><code>// Functions as values
const strategies = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
};
const calculate = (strategy, a, b) => strategies[strategy](a, b);

// Higher-order: takes or returns functions
const once = (fn) => {
  let called = false, result;
  return (...args) => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
};

const init = once(() => console.log('initialized'));
init(); // 'initialized'
init(); // (nothing)

// Memoize
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
};

const slowFib = (n) => n <= 1 ? n : slowFib(n - 1) + slowFib(n - 2);
const fib = memoize(slowFib); // Now O(n) instead of O(2^n)</code></pre>

<h2>Currying & Partial Application</h2>
<table>
  <tr><th>Concept</th><th>Definition</th><th>Example</th></tr>
  <tr><td>Currying</td><td>Transform <code>f(a,b,c)</code> into <code>f(a)(b)(c)</code></td><td><code>curry(add)(1)(2)</code></td></tr>
  <tr><td>Partial Application</td><td>Fix some arguments, return function for rest</td><td><code>add.bind(null, 1)</code></td></tr>
</table>

<pre><code>// Generic curry implementation
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...args2) {
      return curried.apply(this, [...args, ...args2]);
    };
  };
}

const curriedFetch = curry((baseUrl, endpoint, params) =>
  fetch(baseUrl + endpoint + '?' + new URLSearchParams(params))
);

// Create specialized versions:
const apiCall = curriedFetch('https://api.example.com');
const getUsers = apiCall('/users');
// getUsers({ page: 1 }) → fetch('https://api.example.com/users?page=1')

// Partial application with placeholder (advanced):
const _ = Symbol('placeholder');
function partialWithPlaceholders(fn, ...preArgs) {
  return (...laterArgs) => {
    const args = preArgs.map(a => a === _ ? laterArgs.shift() : a);
    return fn(...args, ...laterArgs);
  };
}
const div = (a, b) => a / b;
const divBy2 = partialWithPlaceholders(div, _, 2);
console.log(divBy2(10)); // 5</code></pre>

<h2>Function Composition</h2>
<pre><code>// pipe: left-to-right (data-flow style)
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

// compose: right-to-left (mathematical style)
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

// Async pipe:
const asyncPipe = (...fns) => (input) =>
  fns.reduce((chain, fn) => chain.then(fn), Promise.resolve(input));

// Real-world example: data processing pipeline
const processUser = pipe(
  (user) => ({ ...user, name: user.name.trim() }),
  (user) => ({ ...user, email: user.email.toLowerCase() }),
  (user) => ({ ...user, createdAt: new Date().toISOString() }),
  (user) => { validate(user); return user; },
);

// Point-free style (tacit programming)
const getNames = (users) => users.map(u => u.name);
// vs point-free:
const prop = (key) => (obj) => obj[key];
const getNames2 = (users) => users.map(prop('name'));</code></pre>

<h2>Monads (Simplified)</h2>
<p>A monad is a design pattern: a wrapper type with <code>of</code> (unit) and <code>flatMap</code> (chain/bind) that obeys associativity and identity laws.</p>

<pre><code>// Promise IS a monad:
// of → Promise.resolve(value)
// flatMap → .then(fn) where fn returns a Promise

// Maybe monad for null safety:
class Maybe {
  constructor(value) { this._value = value; }
  static of(value) { return new Maybe(value); }

  isNothing() { return this._value == null; }

  map(fn) {
    return this.isNothing() ? this : Maybe.of(fn(this._value));
  }

  flatMap(fn) {
    return this.isNothing() ? this : fn(this._value);
  }

  getOrElse(defaultVal) {
    return this.isNothing() ? defaultVal : this._value;
  }
}

// Safe nested property access:
const getStreet = (user) =>
  Maybe.of(user)
    .map(u => u.address)
    .map(a => a.street)
    .getOrElse('Unknown');

getStreet({ address: { street: '123 Main' } }); // '123 Main'
getStreet({ address: {} }); // 'Unknown'
getStreet(null); // 'Unknown'</code></pre>

<h2>Transducers</h2>
<p>Transducers compose transformations without creating intermediate arrays. They separate the "what" (transform) from the "how" (reduce).</p>
<pre><code>// Without transducers: 3 intermediate arrays!
[1,2,3,4,5]
  .filter(x => x % 2 !== 0)   // [1, 3, 5]
  .map(x => x * x)            // [1, 9, 25]
  .map(x => x + 1);           // [2, 10, 26]

// Transducer building blocks:
const mapT = (f) => (step) => (acc, x) => step(acc, f(x));
const filterT = (pred) => (step) => (acc, x) => pred(x) ? step(acc, x) : acc;

// Compose transducers (note: compose, not pipe!)
const xform = compose(
  filterT(x => x % 2 !== 0),
  mapT(x => x * x),
  mapT(x => x + 1)
);

// Apply to different collection types:
const arrayAppend = (arr, x) => { arr.push(x); return arr; };
const result = [1,2,3,4,5].reduce(xform(arrayAppend), []);
// [2, 10, 26] — single pass, no intermediate arrays!</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What makes a function pure and why does it matter?</div>
  <div class="qa-a">A pure function: (1) always returns the same output for the same input (referential transparency), (2) produces no side effects (no mutations, I/O, or state changes). Benefits: easy to test (no mocking needed), easy to reason about, safe to memoize, safe to parallelize, enables time-travel debugging (Redux). In practice, side effects are pushed to the edges of the system (ports & adapters pattern).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between currying and partial application?</div>
  <div class="qa-a">Currying transforms a function of N arguments into N nested unary functions: <code>f(a,b,c) → f(a)(b)(c)</code>. Each call returns a new function until all arguments are supplied. Partial application fixes some arguments upfront and returns a function taking the remaining: <code>partial(f, a) → f'(b, c)</code>. Currying is a specific form of partial application where you always fix one argument at a time. In JS, <code>bind</code> does partial application, while a curry utility enables currying.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How is <code>pipe</code> different from <code>compose</code>?</div>
  <div class="qa-a"><code>pipe(f, g, h)(x)</code> applies left-to-right: <code>h(g(f(x)))</code>. <code>compose(f, g, h)(x)</code> applies right-to-left: <code>f(g(h(x)))</code>. Pipe follows data flow order (easier to read for most developers). Compose follows mathematical convention. Both are implemented with reduce/reduceRight. Choose based on team preference — pipe is more common in JS (RxJS, Ramda's pipe).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is a monad in practical terms?</div>
  <div class="qa-a">A monad is a wrapper type with two operations: <code>of</code> (wrap a value) and <code>flatMap</code>/<code>chain</code> (transform the wrapped value, returning a new monad). It must satisfy three laws: left identity, right identity, associativity. In JS, Promise is the most common monad: <code>Promise.resolve(x)</code> is <code>of</code>, and <code>.then(fn)</code> acts as <code>flatMap</code> when fn returns a Promise. Optional/Maybe, Either, IO, and Array are other monads. They enable composable error handling and side-effect management.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What are transducers and when would you use them?</div>
  <div class="qa-a">Transducers are composable transformation functions that are independent of the input/output collection type. They eliminate intermediate arrays when chaining map/filter/reduce. Use them when processing large datasets where creating intermediate arrays is costly, or when you want to reuse the same transformation logic across arrays, streams, observables, or any reducible type. Libraries like Ramda and transducers-js provide production implementations.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is point-free style and what are its trade-offs?</div>
  <div class="qa-a">Point-free (tacit) style defines functions without explicitly referencing their arguments: <code>const getNames = users => users.map(u => u.name)</code> becomes <code>const getNames = map(prop('name'))</code>. Pros: concise, composable, emphasizes data flow. Cons: can be hard to read, difficult to debug (no place to set breakpoints), TypeScript inference may struggle, and it's easy to create subtle bugs with multi-argument functions. Use it judiciously — clarity trumps cleverness.</div>
</div>
`
  },
  {
    id: 'advanced-async',
    title: 'Advanced Async Patterns',
    category: 'JavaScript',
    starterCode: `// ── PROMISE COMBINATORS ─────────────────────────
console.log('=== Promise Combinators ===');

const delay = (ms, val) => new Promise(res => setTimeout(() => res(val), ms));
const fail = (ms, msg) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));

// Promise.all — all must succeed
Promise.all([delay(100, 'a'), delay(200, 'b')])
  .then(r => console.log('all:', r)); // ['a', 'b']

// Promise.allSettled — all settle (no short-circuit)
Promise.allSettled([delay(100, 'ok'), fail(50, 'err')])
  .then(r => console.log('allSettled:', r.map(x => x.status)));
// ['fulfilled', 'rejected']

// Promise.race — first to settle wins
Promise.race([delay(100, 'slow'), delay(50, 'fast')])
  .then(r => console.log('race:', r)); // 'fast'

// Promise.any — first to FULFILL wins (ignores rejections)
Promise.any([fail(50, 'e1'), delay(100, 'ok'), fail(30, 'e2')])
  .then(r => console.log('any:', r)); // 'ok'

// ── ABORT CONTROLLER ────────────────────────────
setTimeout(() => {
  console.log('\\n=== AbortController ===');
  const controller = new AbortController();
  const { signal } = controller;

  // Abort after timeout
  const timeoutId = setTimeout(() => controller.abort(), 100);

  function fetchWithAbort(url, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
      // Simulate fetch
      setTimeout(() => {
        clearTimeout(timeoutId);
        resolve('data from ' + url);
      }, 200);
    });
  }

  fetchWithAbort('/api', signal)
    .then(console.log)
    .catch(e => console.log('Caught:', e.message));
}, 500);

// ── RETRY WITH BACKOFF ──────────────────────────
setTimeout(() => {
  console.log('\\n=== Retry with Backoff ===');
  let attempt = 0;

  function unreliable() {
    attempt++;
    if (attempt < 3) throw new Error('Fail #' + attempt);
    return 'Success on attempt ' + attempt;
  }

  async function retry(fn, maxRetries = 3, baseDelay = 100) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === maxRetries) throw err;
        const delay = baseDelay * Math.pow(2, i);
        console.log('Retry', i + 1, 'after', delay + 'ms');
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  retry(() => Promise.resolve().then(unreliable))
    .then(r => console.log(r))
    .catch(e => console.log('Final error:', e.message));
}, 1200);

// ── DEBOUNCE & THROTTLE ─────────────────────────
setTimeout(() => {
  console.log('\\n=== Debounce & Throttle ===');

  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  const debouncedLog = debounce((msg) => console.log('Debounced:', msg), 100);
  debouncedLog('a'); debouncedLog('b'); debouncedLog('c'); // Only 'c' logs

  const throttledLog = throttle((msg) => console.log('Throttled:', msg), 200);
  throttledLog('1'); throttledLog('2'); throttledLog('3'); // Only '1' logs
}, 2500);

// ── CONCURRENCY LIMIT ───────────────────────────
setTimeout(() => {
  console.log('\\n=== Concurrency Limit ===');

  async function mapWithConcurrency(items, fn, concurrency) {
    const results = [];
    let i = 0;
    async function worker() {
      while (i < items.length) {
        const index = i++;
        results[index] = await fn(items[index]);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
  }

  const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
  mapWithConcurrency(
    urls,
    async (url) => {
      console.log('Fetching:', url);
      await new Promise(r => setTimeout(r, 50));
      return url + ':done';
    },
    2 // Max 2 concurrent
  ).then(r => console.log('Results:', r));
}, 3500);
`,
    content: `
<h1>Advanced Async Patterns</h1>
<p>Beyond basic async/await, senior engineers need to master <strong>promise combinators</strong>, <strong>cancellation</strong>, <strong>retry strategies</strong>, <strong>rate limiting</strong>, and <strong>concurrency control</strong>. These patterns appear in every production codebase and are heavily tested in SDE3 interviews.</p>

<h2>Promise Combinators</h2>
<table>
  <tr><th>Method</th><th>Resolves when</th><th>Rejects when</th><th>Use case</th></tr>
  <tr><td><code>Promise.all</code></td><td>All fulfill</td><td>Any rejects (fast-fail)</td><td>Parallel tasks, all required</td></tr>
  <tr><td><code>Promise.allSettled</code></td><td>All settle (fulfill or reject)</td><td>Never rejects</td><td>Batch operations, need all results</td></tr>
  <tr><td><code>Promise.race</code></td><td>First settles</td><td>First settles (if rejected)</td><td>Timeout, fastest response</td></tr>
  <tr><td><code>Promise.any</code></td><td>First fulfills</td><td>All reject (AggregateError)</td><td>Fastest success, fallback servers</td></tr>
</table>

<pre><code>// Pattern: Timeout with Promise.race
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout after ' + ms + 'ms')), ms)
  );
  return Promise.race([promise, timeout]);
}

// Pattern: Fastest mirror
async function fetchFromMirrors(url, mirrors) {
  return Promise.any(
    mirrors.map(mirror => fetch(mirror + url))
  );
}

// Pattern: Graceful batch processing
async function batchProcess(items, fn) {
  const results = await Promise.allSettled(items.map(fn));
  const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
  return { succeeded, failed };
}</code></pre>

<h2>Cancellation with AbortController</h2>
<pre><code>// AbortController is the standard cancellation mechanism
const controller = new AbortController();
const { signal } = controller;

// Works with fetch natively:
fetch('/api/data', { signal })
  .catch(err => {
    if (err.name === 'AbortError') console.log('Request cancelled');
  });

// Cancel after timeout:
setTimeout(() => controller.abort(), 5000);

// Create cancelable async operations:
async function cancelableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

// Composing abort signals (AbortSignal.any — newer API):
const userCancel = new AbortController();
const timeout = AbortSignal.timeout(5000);
// const combined = AbortSignal.any([userCancel.signal, timeout]);

// Making any async function cancelable:
function makeCancelable(asyncFn) {
  return function (...args) {
    const controller = new AbortController();
    const promise = asyncFn(...args, controller.signal);
    return { promise, cancel: () => controller.abort() };
  };
}</code></pre>

<h2>Retry with Exponential Backoff</h2>
<pre><code>async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true,
    retryOn = () => true, // predicate on error
    signal = null,        // AbortSignal
    onRetry = null,       // callback(error, attempt)
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError') throw error;
      if (attempt === maxRetries || !retryOn(error)) throw error;

      let delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
      if (jitter) delay *= 0.5 + Math.random(); // Decorrelated jitter

      onRetry?.(error, attempt + 1, delay);
      await cancelableDelay(delay, signal);
    }
  }
  throw lastError;
}

// Usage:
await retry(
  () => fetch('https://api.example.com/data').then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }),
  {
    maxRetries: 5,
    retryOn: (err) => !err.message.includes('401'), // Don't retry auth errors
    onRetry: (err, n, delay) => console.log('Retry #' + n + ' in ' + delay + 'ms'),
  }
);</code></pre>

<h2>Debounce & Throttle</h2>
<pre><code>// Debounce: wait until calls stop, then execute
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timer, lastArgs, lastThis;

  function invoke() {
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    if (leading && !timer) invoke();

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (trailing && lastArgs) invoke();
    }, delay);
  }

  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  debounced.flush = () => { if (timer) { clearTimeout(timer); invoke(); timer = null; } };
  return debounced;
}

// Throttle: execute at most once per interval
function throttle(fn, limit, { leading = true, trailing = true } = {}) {
  let timer, lastArgs, lastThis;

  function invoke() {
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }

  return function (...args) {
    lastArgs = args;
    lastThis = this;

    if (!timer) {
      if (leading) invoke();
      timer = setTimeout(() => {
        timer = null;
        if (trailing && lastArgs) invoke();
      }, limit);
    }
  };
}

// Promise-based debounce (returns a promise):
function debounceAsync(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    return new Promise(resolve => {
      timer = setTimeout(() => resolve(fn.apply(this, args)), delay);
    });
  };
}</code></pre>

<h2>Concurrency Control</h2>
<pre><code>// Limit parallel promise execution
class PromisePool {
  #queue = [];
  #active = 0;

  constructor(concurrency) {
    this.concurrency = concurrency;
  }

  async add(fn) {
    if (this.#active >= this.concurrency) {
      await new Promise(resolve => this.#queue.push(resolve));
    }
    this.#active++;
    try {
      return await fn();
    } finally {
      this.#active--;
      if (this.#queue.length > 0) {
        this.#queue.shift()(); // Release next waiting task
      }
    }
  }
}

// Usage:
const pool = new PromisePool(3); // Max 3 concurrent
const urls = Array.from({ length: 20 }, (_, i) => '/api/item/' + i);

const results = await Promise.all(
  urls.map(url => pool.add(() => fetch(url).then(r => r.json())))
);

// Simpler: mapWithConcurrency
async function mapWithConcurrency(items, fn, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}</code></pre>

<h2>Async Iterator Patterns</h2>
<pre><code>// Async iterator for paginated API
async function* paginate(url, pageSize = 10) {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(url + '?page=' + page + '&size=' + pageSize);
    const data = await res.json();
    yield* data.items;
    hasMore = data.items.length === pageSize;
    page++;
  }
}

for await (const item of paginate('/api/users')) {
  console.log(item);
}

// Convert callback-based events to async iterable:
function eventIterator(emitter, eventName) {
  const queue = [];
  let resolve;

  emitter.on(eventName, (data) => {
    if (resolve) {
      resolve({ value: data, done: false });
      resolve = null;
    } else {
      queue.push(data);
    }
  });

  return {
    [Symbol.asyncIterator]() { return this; },
    next() {
      if (queue.length > 0) {
        return Promise.resolve({ value: queue.shift(), done: false });
      }
      return new Promise(r => { resolve = r; });
    }
  };
}</code></pre>

<h2>Advanced Pattern: Semaphore</h2>
<pre><code>class Semaphore {
  #permits;
  #waiting = [];

  constructor(permits) { this.#permits = permits; }

  async acquire() {
    if (this.#permits > 0) {
      this.#permits--;
      return;
    }
    await new Promise(resolve => this.#waiting.push(resolve));
  }

  release() {
    if (this.#waiting.length > 0) {
      this.#waiting.shift()();
    } else {
      this.#permits++;
    }
  }

  async use(fn) {
    await this.acquire();
    try { return await fn(); }
    finally { this.release(); }
  }
}

const sem = new Semaphore(2);
await Promise.all(
  tasks.map(task => sem.use(() => processTask(task)))
);</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between <code>Promise.all</code> and <code>Promise.allSettled</code>?</div>
  <div class="qa-a"><code>Promise.all</code> short-circuits on the first rejection — if any promise rejects, the entire result rejects and you lose access to successful results. <code>Promise.allSettled</code> waits for ALL promises to settle (fulfill or reject) and returns an array of <code>{ status, value/reason }</code> objects. Use <code>allSettled</code> for batch operations where partial success is acceptable (e.g., sending notifications to multiple users, health checks on multiple services).</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does AbortController work and why is it preferred over custom cancellation?</div>
  <div class="qa-a">AbortController provides a standard cancellation API. It creates a <code>signal</code> object that can be passed to fetch, addEventListener, and custom async operations. Calling <code>controller.abort()</code> sets <code>signal.aborted = true</code> and dispatches an 'abort' event. It's preferred because: (1) it's the web standard, (2) fetch supports it natively, (3) signals are composable (<code>AbortSignal.any()</code>, <code>AbortSignal.timeout()</code>), (4) one controller can cancel multiple operations simultaneously.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: Why add jitter to exponential backoff?</div>
  <div class="qa-a">Without jitter, many clients failing simultaneously will retry at the exact same intervals, creating "thundering herd" — synchronized retry storms that overwhelm the server repeatedly. Jitter randomizes the delay so retries spread out over time. Full jitter: <code>random(0, baseDelay * 2^attempt)</code>. Decorrelated jitter: <code>min(maxDelay, random(baseDelay, lastDelay * 3))</code>. AWS recommends decorrelated jitter as the most effective strategy.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How do you implement concurrency limiting for async operations?</div>
  <div class="qa-a">Create a pool/semaphore pattern: maintain a count of active operations. When the limit is reached, new tasks wait via a promise that resolves when a slot opens. Implementation: use a queue of resolve functions; when a task completes, shift the queue to release the next waiting task. This prevents memory/connection exhaustion when processing large batches. Libraries like p-limit, p-queue implement this robustly with priority, timeout, and error handling.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between debounce and throttle?</div>
  <div class="qa-a">Debounce delays execution until calls stop for a specified period — it resets the timer on each call. Use for: search input, window resize, form validation. Throttle ensures a function runs at most once per interval — it ignores calls during the cooldown. Use for: scroll handlers, mousemove, rate-limiting API calls. Both support leading (execute immediately) and trailing (execute after delay) options. Leading debounce + trailing throttle covers most use cases.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How would you convert a callback-based API to async iterators?</div>
  <div class="qa-a">Create an adapter with a buffer queue and a pending promise. When an event fires, if a consumer is waiting (has called <code>next()</code>), resolve its promise immediately; otherwise, buffer the value. When <code>next()</code> is called, if the buffer has data, return it immediately; otherwise, return a pending promise. This creates backpressure naturally — the producer and consumer proceed at the pace of the slower one. Remember to handle cleanup (observer.return()) to unsubscribe from the event source.</div>
</div>
`
  },
];
