export const javascript = [
  {
    id: 'js-fundamentals',
    title: 'JS Fundamentals',
    category: 'JavaScript',
    starterCode: `// JavaScript Fundamentals: Scope, Hoisting, Closures

// 1. var vs let vs const
console.log('=== var Hoisting ===');
console.log(hoisted); // undefined (not error) - var is hoisted
var hoisted = 'value';

// let/const are hoisted but NOT initialized (Temporal Dead Zone)
// console.log(notReady); // ReferenceError: Cannot access before initialization
let notReady = 'ready now';

// 2. Closures
console.log('\\n=== Closures ===');
function makeCounter(start = 0) {
  let count = start; // private state in closure
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count,
  };
}

const counter = makeCounter(10);
console.log(counter.inc()); // 11
console.log(counter.inc()); // 12
console.log(counter.dec()); // 11
console.log(counter.get()); // 11

// 3. Classic closure bug with var
console.log('\\n=== Closure Bug (var vs let) ===');
const fnsVar = [];
for (var i = 0; i < 3; i++) fnsVar.push(() => i); // all capture same i
console.log('var:', fnsVar.map(f => f())); // [3, 3, 3] ← bug!

const fnsLet = [];
for (let j = 0; j < 3; j++) fnsLet.push(() => j); // each j is new binding
console.log('let:', fnsLet.map(f => f())); // [0, 1, 2] ← correct

// 4. this context
console.log('\\n=== this keyword ===');
const obj = {
  name: 'Node.js',
  regular: function() { return this.name; },   // this = obj
  arrow: () => 'no own this',                   // arrow inherits outer this
};
console.log(obj.regular()); // 'Node.js'
console.log(obj.arrow());   // 'no own this'`,
    content: `
<h1>JavaScript Fundamentals</h1>

<h2>var vs let vs const</h2>
<table>
  <tr><th></th><th>var</th><th>let</th><th>const</th></tr>
  <tr><td>Scope</td><td>Function</td><td>Block</td><td>Block</td></tr>
  <tr><td>Hoisted</td><td>Yes (initialized undefined)</td><td>Yes (TDZ — uninitialized)</td><td>Yes (TDZ)</td></tr>
  <tr><td>Re-declare</td><td>Yes</td><td>No</td><td>No</td></tr>
  <tr><td>Re-assign</td><td>Yes</td><td>Yes</td><td>No (binding, not value)</td></tr>
  <tr><td>Window prop</td><td>Yes (global)</td><td>No</td><td>No</td></tr>
</table>

<h2>Hoisting</h2>
<p>During the compilation phase, variable and function declarations are moved to the top of their scope.</p>
<pre><code>// Functions are fully hoisted
console.log(greet()); // "Hello!" ← works

function greet() { return "Hello!"; }

// var — hoisted and initialized to undefined
console.log(x); // undefined (no error)
var x = 5;

// let/const — hoisted but NOT initialized (Temporal Dead Zone)
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 5;

// Function expressions are NOT hoisted
console.log(sayHi()); // TypeError: sayHi is not a function
var sayHi = function() { return "Hi!"; };</code></pre>

<h2>Closures</h2>
<p>A closure is a function that retains access to its lexical scope even after the outer function has returned. The function "closes over" the variables from its parent scope.</p>
<pre><code>function createMultiplier(factor) {
  // factor is in closure scope
  return (number) => number * factor; // inner fn captures factor
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
// factor is gone from stack but lives on in closure

// Practical: private state (module pattern)
function createBankAccount(initialBalance) {
  let balance = initialBalance; // private

  return {
    deposit: (amount) => { balance += amount; },
    withdraw: (amount) => {
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
    },
    getBalance: () => balance,
  };
}

const account = createBankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
// balance is not directly accessible</code></pre>

<h2>Scope Chain</h2>
<pre><code>const globalVar = 'global';

function outer() {
  const outerVar = 'outer';

  function inner() {
    const innerVar = 'inner';
    // Can access: innerVar, outerVar, globalVar (scope chain lookup)
    console.log(globalVar, outerVar, innerVar);
  }

  inner();
  // Cannot access innerVar here
}

// Scope chain: inner → outer → global → built-ins</code></pre>

<h2>The <code>this</code> Keyword</h2>
<table>
  <tr><th>Context</th><th>this value</th></tr>
  <tr><td>Global (non-strict)</td><td>window / global</td></tr>
  <tr><td>Global (strict mode)</td><td>undefined</td></tr>
  <tr><td>Object method</td><td>The object before the dot</td></tr>
  <tr><td>Arrow function</td><td>Inherits from enclosing scope</td></tr>
  <tr><td>new Constructor()</td><td>The newly created object</td></tr>
  <tr><td>call/apply/bind</td><td>First argument (explicit binding)</td></tr>
  <tr><td>Event handler</td><td>The DOM element</td></tr>
</table>

<pre><code>const person = {
  name: 'Alice',
  greet() {
    console.log(this.name);       // 'Alice' — method call

    const inner = function() {
      console.log(this.name);     // undefined (lost this)
    };
    inner();

    const arrowInner = () => {
      console.log(this.name);     // 'Alice' — arrow inherits this
    };
    arrowInner();
  }
};

// Explicit binding
function greet() { return this.name; }
greet.call({ name: 'Bob' });       // 'Bob'
greet.apply({ name: 'Carol' });    // 'Carol'
const bound = greet.bind({ name: 'Dave' });
bound();                           // 'Dave'</code></pre>

<h2>IIFE (Immediately Invoked Function Expression)</h2>
<pre><code>// Creates its own scope — avoids polluting global scope
(function() {
  const secret = 'hidden';
  console.log(secret); // accessible inside
})();

// console.log(secret); // ReferenceError — not accessible outside

// Arrow IIFE
(() => {
  console.log('IIFE with arrow');
})();</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is a closure and give a practical use case?</div>
  <div class="qa-a">A closure is a function that retains access to its lexical scope even after the outer function returns. The inner function "closes over" the outer variables. Practical uses: (1) Private variables — emulate encapsulation without classes, (2) Factory functions — createMultiplier(2), (3) Memoization — cache results in closure, (4) Event handlers — preserve loop variables with let, (5) Partial application — pre-fill arguments to a function.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the Temporal Dead Zone (TDZ)?</div>
  <div class="qa-a">The period between the start of a block scope and the point where let/const is initialized. Variables exist (are hoisted) but accessing them throws a ReferenceError. This is different from var which is initialized to undefined when hoisted. TDZ enforces the good practice of declaring variables before using them.</div>
</div>`,
  },
  {
    id: 'js-types',
    title: 'Types & Coercion',
    category: 'JavaScript',
    starterCode: `// JavaScript Types & Type Coercion

// Primitive types
console.log('=== Primitives (passed by value) ===');
let a = 42;
let b = a;
b = 100;
console.log(a, b); // 42, 100 — independent copies

// Reference types
console.log('\\n=== Objects (passed by reference) ===');
const obj1 = { x: 1 };
const obj2 = obj1; // same reference
obj2.x = 99;
console.log(obj1.x); // 99 — obj1 was mutated!

// Deep copy
const obj3 = { ...obj1 }; // shallow copy
const obj4 = JSON.parse(JSON.stringify(obj1)); // deep copy

// Type coercion examples
console.log('\\n=== Loose vs Strict Equality ===');
console.log(0 == '0');   // true  (coercion: string→number)
console.log(0 === '0');  // false (no coercion)
console.log(null == undefined);   // true
console.log(null === undefined);  // false
console.log('' == false);         // true (both falsy)
console.log('' === false);        // false

// Falsy values
console.log('\\n=== Falsy Values ===');
const falsyList = [false, 0, '', null, undefined, NaN, 0n];
falsyList.forEach(v => console.log(String(v), '→', Boolean(v)));

// typeof
console.log('\\n=== typeof ===');
console.log(typeof null);       // 'object' ← famous bug
console.log(typeof undefined);  // 'undefined'
console.log(typeof function(){}); // 'function'
console.log(typeof []);         // 'object' (use Array.isArray)`,
    content: `
<h1>Types &amp; Type Coercion</h1>

<h2>Primitive vs Reference Types</h2>
<table>
  <tr><th>Primitives (by value)</th><th>Reference Types (by reference)</th></tr>
  <tr><td>number, string, boolean</td><td>Object, Array, Function</td></tr>
  <tr><td>null, undefined</td><td>Date, RegExp, Map, Set</td></tr>
  <tr><td>Symbol, BigInt</td><td>WeakMap, WeakSet</td></tr>
  <tr><td>Stored on stack</td><td>Stored on heap (variable holds address)</td></tr>
  <tr><td>Copy creates new value</td><td>Copy copies the reference (same object)</td></tr>
</table>

<pre><code>// Value type — independent copies
let x = 5;
let y = x;
y = 10;
console.log(x); // 5 — unchanged

// Reference type — shared object
const arr1 = [1, 2, 3];
const arr2 = arr1;    // same array in memory
arr2.push(4);
console.log(arr1);   // [1, 2, 3, 4] — mutated!

// Shallow copy
const arr3 = [...arr1];
const arr4 = arr1.slice();

// Deep copy (for nested objects)
const deep = JSON.parse(JSON.stringify(obj)); // simple objects only
const deep2 = structuredClone(obj);            // modern, handles more types</code></pre>

<h2>Truthy &amp; Falsy Values</h2>
<pre><code>// Falsy — 8 values total
false, 0, -0, 0n, '', null, undefined, NaN

// Everything else is truthy, including:
[], {}, 'false', '0', function(){}</code></pre>

<h2>Type Coercion Rules</h2>
<pre><code>// Implicit coercion examples
'5' + 3      // '53'  — + with string → concatenation
'5' - 3      // 2     — -, *, / → numeric
true + 1     // 2     — boolean coerced to number
null + 1     // 1     — null → 0
undefined + 1 // NaN  — undefined → NaN

// Equality coercion (==)
0 == false    // true  (false → 0)
'' == false   // true  (both → 0)
null == undefined // true (special rule)
null == 0     // false (null only == undefined)
NaN == NaN    // false (NaN is never equal to anything)

// Always use === to avoid surprises</code></pre>

<h2>typeof and Type Checking</h2>
<pre><code>// typeof returns a string
typeof 42           // 'number'
typeof 'hello'      // 'string'
typeof true         // 'boolean'
typeof undefined    // 'undefined'
typeof Symbol()     // 'symbol'
typeof 42n          // 'bigint'
typeof function(){} // 'function'
typeof {}           // 'object'
typeof []           // 'object' ← use Array.isArray()
typeof null         // 'object' ← famous JS bug (since 1995)

// Better type checking
Array.isArray([])                    // true
obj instanceof Date                  // true
Object.prototype.toString.call(null) // '[object Null]'</code></pre>

<h2>Nullish Coalescing &amp; Optional Chaining</h2>
<pre><code>// ?? — only falls back on null/undefined (not 0 or '')
const name = user.name ?? 'Anonymous'; // '' would NOT fallback
const count = total ?? 0;              // vs: total || 0 triggers on 0

// ?. — safe property access
const city = user?.address?.city;        // undefined (not error) if chain breaks
const len = arr?.length;                 // undefined if arr is null/undefined
obj?.method?.();                         // safely call method if exists
arr?.[0]?.name;                          // safe index access</code></pre>

<h2>Spread &amp; Rest Operators</h2>
<pre><code>// Spread — expand iterable into elements
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]
const merged = { ...obj1, ...obj2, override: 'val' };
Math.max(...arr1);              // same as Math.max(1, 2, 3)

// Rest — collect remaining into array
function sum(...nums) {             // nums is array
  return nums.reduce((a, b) => a + b, 0);
}
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first=1, second=2, rest=[3,4,5]

const { name, age, ...others } = person;
// name, age extracted; others gets remaining properties</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between == and ===?</div>
  <div class="qa-a">== (loose equality) performs type coercion before comparing — it converts operands to the same type first. === (strict equality) compares both value AND type without coercion. Always prefer === to avoid subtle bugs. Exception: null == undefined is the idiomatic check for "neither null nor undefined" when you need it.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between null and undefined?</div>
  <div class="qa-a">undefined means a variable has been declared but not assigned a value — it's the default value for uninitialized variables, missing function arguments, and absent object properties. null is an explicit assignment meaning "intentional absence of value" — you set it yourself. typeof null === 'object' is a historical bug in JavaScript. Use null when you want to explicitly clear a value, and undefined is what you get when something is absent.</div>
</div>`,
  },
  {
    id: 'js-array-methods',
    title: 'Array Methods',
    category: 'JavaScript',
    starterCode: `// Array Methods Mastery
const products = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics', inStock: true },
  { id: 2, name: 'Phone', price: 699, category: 'Electronics', inStock: false },
  { id: 3, name: 'Desk', price: 299, category: 'Furniture', inStock: true },
  { id: 4, name: 'Chair', price: 199, category: 'Furniture', inStock: true },
  { id: 5, name: 'Monitor', price: 449, category: 'Electronics', inStock: true },
];

// map — transform each element
const names = products.map(p => p.name);
console.log('Names:', names);

// filter — keep matching elements
const inStock = products.filter(p => p.inStock);
console.log('In stock:', inStock.map(p => p.name));

// reduce — accumulate into single value
const totalValue = products.reduce((sum, p) => sum + p.price, 0);
console.log('Total value: $' + totalValue);

// find / findIndex — first match
const expensive = products.find(p => p.price > 500);
console.log('First expensive:', expensive?.name);

// some / every
console.log('Any out of stock?', products.some(p => !p.inStock));
console.log('All in stock?', products.every(p => p.inStock));

// flat / flatMap
const nested = [[1, 2], [3, [4, 5]]];
console.log('flat(1):', nested.flat());
console.log('flat(Infinity):', nested.flat(Infinity));

// Chain methods
const result = products
  .filter(p => p.inStock && p.category === 'Electronics')
  .map(p => ({ name: p.name, price: p.price }))
  .sort((a, b) => a.price - b.price);
console.log('\\nCheapest electronics in stock:');
result.forEach(p => console.log(\` \${p.name}: \$\${p.price}\`));`,
    content: `
<h1>Array Methods</h1>

<h2>Transformation Methods</h2>

<h3>map() — transform every element</h3>
<pre><code>// Returns NEW array of same length
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);  // [2, 4, 6, 8, 10]

const users = [{ name: 'Alice' }, { name: 'Bob' }];
const names = users.map(u => u.name);  // ['Alice', 'Bob']
const withId = users.map((u, index) => ({ ...u, id: index + 1 }));</code></pre>

<h3>filter() — keep elements matching condition</h3>
<pre><code>// Returns NEW array (possibly shorter)
const evens = numbers.filter(n => n % 2 === 0);  // [2, 4]
const active = users.filter(u => u.isActive);

// Remove duplicates (not the best way, but demonstrates filter)
const unique = arr.filter((v, i, self) => self.indexOf(v) === i);</code></pre>

<h3>reduce() — fold into single value</h3>
<pre><code>// reduce(callback, initialValue)
// callback(accumulator, currentValue, index, array)
const sum = [1, 2, 3, 4].reduce((acc, n) => acc + n, 0);  // 10
const max = [3, 1, 4, 1, 5].reduce((a, b) => Math.max(a, b));  // 5

// Build object from array
const byId = users.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});

// Group by category
const grouped = products.reduce((groups, p) => {
  (groups[p.category] ??= []).push(p);
  return groups;
}, {});</code></pre>

<h3>flatMap() — map + flatten (1 level)</h3>
<pre><code>const sentences = ['Hello World', 'Foo Bar'];
const words = sentences.flatMap(s => s.split(' '));
// ['Hello', 'World', 'Foo', 'Bar']

// Useful for expanding elements
const orders = [
  { id: 1, items: ['a', 'b'] },
  { id: 2, items: ['c'] },
];
const allItems = orders.flatMap(o => o.items);  // ['a', 'b', 'c']</code></pre>

<h2>Search Methods</h2>
<pre><code>const arr = [10, 20, 30, 20, 40];

// find — first element matching condition
arr.find(n => n > 15);         // 20
arr.find(n => n > 100);        // undefined

// findIndex — index of first match
arr.findIndex(n => n === 30);  // 2
arr.findIndex(n => n > 100);   // -1

// indexOf — first index of value (===)
arr.indexOf(20);               // 1
arr.lastIndexOf(20);           // 3

// includes — boolean check
arr.includes(30);              // true

// some — returns true if ANY element matches
arr.some(n => n > 35);         // true

// every — returns true if ALL elements match
arr.every(n => n > 5);         // true
arr.every(n => n > 15);        // false</code></pre>

<h2>Sorting & Ordering</h2>
<pre><code>const nums = [10, 2, 30, 4];

// ❌ Default sort — converts to strings!
nums.sort();  // [10, 2, 30, 4] → [10, 2, 30, 4]? Actually string sort

// ✅ Numeric sort
nums.sort((a, b) => a - b);          // ascending:  [2, 4, 10, 30]
nums.sort((a, b) => b - a);          // descending: [30, 10, 4, 2]

// Sort objects
users.sort((a, b) => a.name.localeCompare(b.name));  // alphabetical

// reverse — mutates in place!
const reversed = [...arr].reverse();  // non-destructive copy first</code></pre>

<h2>Mutation vs Immutability</h2>
<table>
  <tr><th>Mutates Original</th><th>Returns New Array</th></tr>
  <tr><td>push, pop, shift, unshift</td><td>map, filter, reduce</td></tr>
  <tr><td>sort, reverse</td><td>slice, concat, flat, flatMap</td></tr>
  <tr><td>splice, fill, copyWithin</td><td>spread [...arr]</td></tr>
</table>

<h2>Useful Patterns</h2>
<pre><code>// Remove duplicates
const unique = [...new Set(arr)];

// Chunk array into pages
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size));

// Zip two arrays
const zip = (a, b) => a.map((v, i) => [v, b[i]]);
zip([1,2,3], ['a','b','c']); // [[1,'a'],[2,'b'],[3,'c']]

// Flatten and unique
const uniqueFlat = [...new Set(arr.flat(Infinity))];

// Object to entries and back
const doubled = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 2])
);</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between map() and forEach()?</div>
  <div class="qa-a">map() returns a new array with transformed elements — use it when you need the result. forEach() returns undefined — use it for side effects only (logging, DOM updates, modifying external variables). map() is chainable; forEach() is not. For performance: they're similar, but since forEach has no return value, engines can sometimes optimize it slightly.</div>
</div>

<div class="qa-block">
  <div class="qa-q">Q: How does reduce() work and when to use it?</div>
  <div class="qa-a">reduce(callback, initialValue) iterates through the array calling callback(accumulator, currentValue) each time, where the return value becomes the next accumulator. The final accumulator is the result. Use it for: summing values, building objects from arrays (groupBy, indexBy), flattening arrays, computing complex aggregations. If the operation can be expressed as map+filter, use those for readability. Use reduce for anything that needs to produce a single non-array value from an array.</div>
</div>`,
  },
  {
    id: 'js-es6',
    title: 'ES6+ Features',
    category: 'JavaScript',
    starterCode: `// ES6+ Features Demo

// 1. Destructuring
const { name, age = 25, address: { city } = {} } = {
  name: 'Alice',
  address: { city: 'Mumbai' }
};
console.log(name, age, city);  // Alice 25 Mumbai

// Swap variables
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y); // 2 1

// 2. Template Literals
const template = (user) => \`Hello \${user.name}!
  Age: \${user.age}
  Score: \${user.score > 50 ? 'Pass' : 'Fail'}
\`;
console.log(template({ name: 'Bob', age: 30, score: 75 }));

// 3. Symbol
const sym1 = Symbol('id');
const sym2 = Symbol('id');
console.log(sym1 === sym2); // false — always unique
const KEY = Symbol('key');
const obj = { [KEY]: 'hidden', visible: true };
console.log(Object.keys(obj));    // ['visible'] — Symbol not enumerated

// 4. WeakMap for private data
const _private = new WeakMap();
class Person {
  constructor(name, secret) {
    _private.set(this, { secret });
    this.name = name;
  }
  revealSecret() { return _private.get(this).secret; }
}
const p = new Person('Alice', 'loves coding');
console.log(p.name);          // Alice
console.log(p.secret);        // undefined — truly private
console.log(p.revealSecret()); // 'loves coding'

// 5. Tagged template literals
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] ? \`[\${values[i]}]\` : ''), '');
}
const item = 'Node.js', score = 95;
console.log(highlight\`Learning \${item} score: \${score}\`);`,
    content: `
<h1>ES6+ Features</h1>

<h2>Destructuring</h2>
<pre><code>// Object destructuring
const { name, age, role = 'user' } = user;  // default value
const { name: firstName } = user;            // rename

// Nested destructuring
const { address: { city, zip } } = user;

// Function parameter destructuring
function greet({ name, greeting = 'Hello' }) {
  return \`\${greeting}, \${name}!\`;
}

// Array destructuring
const [first, , third, ...rest] = [1, 2, 3, 4, 5];
// first=1, third=3, rest=[4,5]

// Swap variables
[a, b] = [b, a];</code></pre>

<h2>Template Literals</h2>
<pre><code>// Multi-line strings
const html = \`
  &lt;div class="card"&gt;
    &lt;h2&gt;\${title}&lt;/h2&gt;
    &lt;p&gt;\${description}&lt;/p&gt;
  &lt;/div&gt;
\`;

// Expression interpolation
const price = 100;
const tax = 0.18;
console.log(\`Total: \${(price * (1 + tax)).toFixed(2)}\`);

// Tagged templates (advanced)
function sql(strings, ...values) {
  // sanitize values to prevent SQL injection
  return strings.raw.join('?') + values;
}</code></pre>

<h2>Arrow Functions</h2>
<pre><code>// Syntax forms
const add = (a, b) => a + b;          // implicit return
const square = n => n ** 2;            // single param, no parens needed
const getObj = () => ({ key: 'val' }); // return object (wrap in parens)
const greet = (name) => {
  const msg = \`Hello, \${name}\`;      // block body, explicit return
  return msg;
};

// Arrow functions do NOT have own: this, arguments, super, new.target
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++; // 'this' is timer, not the interval callback
    }, 1000);
  }
};</code></pre>

<h2>Classes</h2>
<pre><code>class Animal {
  #sound; // private field (ES2022)

  constructor(name, sound) {
    this.name = name;    // public
    this.#sound = sound; // private
  }

  speak() {
    return \`\${this.name} says \${this.#sound}\`;
  }

  static create(name, sound) {  // factory method
    return new Animal(name, sound);
  }

  get info() { return \`\${this.name} (\${this.#sound})\`; } // getter
}

class Dog extends Animal {
  constructor(name) {
    super(name, 'woof'); // call parent constructor
    this.tricks = [];
  }

  learn(trick) {
    this.tricks.push(trick);
    return this; // for chaining
  }

  speak() {
    return super.speak() + '!'; // call parent method
  }
}

const dog = new Dog('Rex');
dog.learn('sit').learn('shake');
console.log(dog.speak());     // 'Rex says woof!'
console.log(dog.tricks);      // ['sit', 'shake']</code></pre>

<h2>Symbols</h2>
<pre><code>// Every Symbol is unique
const s1 = Symbol('id');
const s2 = Symbol('id');
s1 === s2; // false — even with same description

// Use as unique object keys
const PRIVATE_KEY = Symbol('key');
const obj = {
  [PRIVATE_KEY]: 'secret',
  public: 'visible'
};
Object.keys(obj);      // ['public'] — Symbol not included
obj[PRIVATE_KEY];      // 'secret' — accessible if you have the Symbol

// Well-known Symbols (customize behavior)
class MyArray {
  [Symbol.iterator]() { /* custom iteration logic */ }
}
class MyClass {
  get [Symbol.toStringTag]() { return 'MyClass'; }
}</code></pre>

<h2>Map &amp; Set</h2>
<pre><code>// Map — key-value pairs, any key type
const map = new Map();
map.set('string', 1);
map.set(42, 'number key');
map.set({ id: 1 }, 'object key');
map.get('string');     // 1
map.has(42);           // true
map.size;              // 3

// vs plain object: Map preserves insertion order,
// allows any key type, has .size, better for frequent add/delete

// Set — unique values only
const set = new Set([1, 2, 2, 3, 3, 3]);
set.size;              // 3 — duplicates removed
set.add(4);
set.has(2);            // true
set.delete(1);

// Remove duplicates from array
const unique = [...new Set(arr)];</code></pre>

<h2>WeakMap &amp; WeakRef</h2>
<pre><code>// WeakMap — keys must be objects, doesn't prevent GC
const cache = new WeakMap();

function process(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = expensiveOperation(obj);
  cache.set(obj, result);  // When obj is GC'd, cache entry auto-removed
  return result;
}</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: When would you use Map over a plain object?</div>
  <div class="qa-a">Use Map when: (1) keys are non-strings (numbers, objects, Symbols), (2) you need to preserve insertion order reliably, (3) you need the size easily (Map.size vs Object.keys().length), (4) frequently adding/deleting entries (Map is optimized for this), (5) you need to iterate over entries easily (Map is directly iterable). Use plain objects for: simple configuration, JSON serialization, prototype method inheritance, known string keys.</div>
</div>`,
  },
  {
    id: 'js-oop',
    title: 'Prototypes & OOP',
    category: 'JavaScript',
    starterCode: `// Prototypes, Classes & Inheritance

// 1. Prototype chain
const animal = {
  breathe() { return \`\${this.name} is breathing\`; }
};

const dog = Object.create(animal); // dog.__proto__ === animal
dog.name = 'Rex';
dog.bark = function() { return 'Woof!'; };

console.log(dog.breathe()); // Found on animal via prototype chain
console.log(dog.bark());    // Found directly on dog

// Check chain
console.log(Object.getPrototypeOf(dog) === animal); // true
console.log('bark' in dog);      // true (own property)
console.log('breathe' in dog);   // true (inherited)
console.log(dog.hasOwnProperty('bark'));     // true
console.log(dog.hasOwnProperty('breathe')); // false

// 2. Class with private fields
class Stack {
  #items = [];
  #maxSize;

  constructor(maxSize = Infinity) {
    this.#maxSize = maxSize;
  }

  push(item) {
    if (this.#items.length >= this.#maxSize) throw new Error('Stack overflow');
    this.#items.push(item);
    return this;
  }

  pop() {
    if (this.isEmpty()) throw new Error('Stack underflow');
    return this.#items.pop();
  }

  peek() { return this.#items.at(-1); }
  isEmpty() { return this.#items.length === 0; }
  get size() { return this.#items.length; }

  [Symbol.iterator]() { return this.#items[Symbol.iterator](); }
}

const stack = new Stack(3);
stack.push(1).push(2).push(3);
console.log('Peek:', stack.peek()); // 3
console.log('Pop:', stack.pop());   // 3
console.log('Size:', stack.size);   // 2
for (const item of stack) console.log('Item:', item);`,
    content: `
<h1>Prototypes &amp; OOP in JavaScript</h1>

<h2>Prototype Chain</h2>
<pre><code>// Every object has a [[Prototype]] link (accessed via __proto__)
// Property lookup: own → prototype → prototype's prototype → ... → null

const obj = { a: 1 };
// obj.__proto__ === Object.prototype
// Object.prototype.__proto__ === null (end of chain)

// Object.prototype methods available on every object:
obj.hasOwnProperty('a');   // true
obj.toString();            // '[object Object]'
obj.valueOf();             // obj itself</code></pre>

<h2>Creating Objects with Prototypes</h2>
<pre><code>// 1. Object.create() — explicit prototype
const vehicleProto = {
  describe() { return \`\${this.brand} \${this.model}\`; }
};

const car = Object.create(vehicleProto);
car.brand = 'Toyota';
car.model = 'Camry';
console.log(car.describe()); // uses prototype method

// 2. Constructor function (pre-ES6)
function Person(name, age) {
  this.name = name; // own properties on instance
  this.age = age;
}
Person.prototype.greet = function() {  // shared on prototype
  return \`Hi, I'm \${this.name}\`;
};

const alice = new Person('Alice', 30);
// new does: create object, set __proto__ = Person.prototype,
//           call Person with this = new object, return object

// 3. Class syntax (ES6) — syntactic sugar over prototypes
class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound\`; }
}</code></pre>

<h2>Inheritance</h2>
<pre><code>class Shape {
  constructor(color = 'black') {
    this.color = color;
  }
  area() { return 0; }
  toString() { return \`\${this.constructor.name}(color=\${this.color})\`; }
}

class Circle extends Shape {
  constructor(radius, color) {
    super(color); // MUST call super before using 'this'
    this.radius = radius;
  }
  area() { return Math.PI * this.radius ** 2; }
  // toString inherited from Shape
}

class Rectangle extends Shape {
  constructor(w, h, color) {
    super(color);
    this.width = w;
    this.height = h;
  }
  area() { return this.width * this.height; } // override
}

const shapes = [new Circle(5), new Rectangle(3, 4, 'blue')];
shapes.forEach(s => console.log(s.toString(), 'area:', s.area().toFixed(2)));

// instanceof checks
console.log(new Circle(1) instanceof Shape);  // true — checks prototype chain</code></pre>

<h2>Mixins — Multiple Behavior Composition</h2>
<pre><code>// JS has single inheritance, but mixins add behaviors
const Serializable = (Base) => class extends Base {
  serialize() { return JSON.stringify(this); }
  static deserialize(json) { return Object.assign(new this(), JSON.parse(json)); }
};

const Validatable = (Base) => class extends Base {
  validate() {
    return Object.keys(this).every(k => this[k] !== null && this[k] !== undefined);
  }
};

class User extends Serializable(Validatable(class {})) {
  constructor(name, email) {
    super();
    this.name = name;
    this.email = email;
  }
}

const user = new User('Alice', 'alice@example.com');
console.log(user.validate());   // true
console.log(user.serialize());  // '{"name":"Alice","email":"alice@example.com"}'</code></pre>

<h2>Private Fields (ES2022)</h2>
<pre><code>class BankAccount {
  #balance;             // private field
  #owner;

  constructor(owner, initial = 0) {
    this.#owner = owner;
    this.#balance = initial;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.#balance += amount;
    return this;
  }

  get balance() { return this.#balance; }    // public getter
  get owner() { return this.#owner; }

  static #validateAmount(amount) {           // private static method
    return amount > 0 && Number.isFinite(amount);
  }
}

const acc = new BankAccount('Alice', 1000);
acc.deposit(500).deposit(200);
console.log(acc.balance); // 1700
// acc.#balance;           // SyntaxError — truly private</code></pre>

<h2>Object Composition vs Inheritance</h2>
<pre><code>// Prefer composition over inheritance for flexible designs
const canFly   = { fly:   () => 'flying' };
const canSwim  = { swim:  () => 'swimming' };
const canRun   = { run:   () => 'running' };

// Compose behaviors with Object.assign or spread
const duck = Object.assign({}, canFly, canSwim, canRun, {
  name: 'Donald',
  quack: () => 'quack!'
});

console.log(duck.fly());   // 'flying'
console.log(duck.swim());  // 'swimming'
console.log(duck.quack()); // 'quack!'</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between prototypal and classical inheritance?</div>
  <div class="qa-a">Classical inheritance (Java, C++) creates a blueprint (class) from which instances are stamped — instances don't share the actual class, they copy from it. JavaScript uses prototypal inheritance — objects directly link to other objects via the [[Prototype]] chain. When you access a property, JS walks up the chain. ES6 class syntax is syntactic sugar over prototype chains, not true classical inheritance. Key difference: JS objects inherit from other objects, not classes. This enables more flexible patterns like mixins and dynamic prototype manipulation.</div>
</div>`,
  },
  {
    id: 'js-advanced',
    title: 'Advanced JS Patterns',
    category: 'JavaScript',
    starterCode: `// Advanced JavaScript Patterns

// 1. Generator Functions
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
const first8 = Array.from({ length: 8 }, () => fib.next().value);
console.log('Fibonacci:', first8);

// 2. Iterators
class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

const range = new Range(0, 10, 2);
console.log('Range:', [...range]); // [0, 2, 4, 6, 8, 10]
for (const n of range) process.stdout?.write?.(n + ' ') || console.log(n);

// 3. Proxy for validation
const createValidator = (target, rules) => new Proxy(target, {
  set(obj, prop, value) {
    if (rules[prop] && !rules[prop](value)) {
      throw new TypeError(\`Invalid value for \${prop}: \${value}\`);
    }
    obj[prop] = value;
    return true;
  }
});

const user = createValidator({}, {
  age: v => Number.isInteger(v) && v >= 0 && v <= 150,
  email: v => /^[^@]+@[^@]+\.[^@]+$/.test(v),
});

user.age = 25;          // ok
user.email = 'a@b.com'; // ok
console.log(user);
try { user.age = -1; } catch(e) { console.log(e.message); }`,
    content: `
<h1>Advanced JavaScript Patterns</h1>

<h2>Generators</h2>
<pre><code>// Generator functions can pause and resume execution
function* counter(start = 0) {
  while (true) {
    const reset = yield start++;  // yield suspends; value can be sent back
    if (reset) start = 0;
  }
}

const gen = counter(10);
console.log(gen.next().value);        // 10
console.log(gen.next().value);        // 11
console.log(gen.next(true).value);    // 0 (reset sent)

// Finite generator
function* range(start, end, step = 1) {
  for (let i = start; i <= end; i += step) yield i;
}
console.log([...range(1, 5)]);  // [1, 2, 3, 4, 5]

// Lazy evaluation — only generates values when needed
function* infiniteStream() {
  let n = 0;
  while (true) yield n++;
}
const stream = infiniteStream();
const first5 = Array.from({ length: 5 }, () => stream.next().value);</code></pre>

<h2>Iterators Protocol</h2>
<pre><code>// An iterable must have Symbol.iterator method returning an iterator
// An iterator must have next() method returning { value, done }

class LinkedList {
  constructor() { this.head = null; }

  add(value) {
    this.head = { value, next: this.head };
    return this;
  }

  [Symbol.iterator]() {
    let current = this.head;
    return {
      next() {
        if (current) {
          const { value } = current;
          current = current.next;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

const list = new LinkedList();
list.add(3).add(2).add(1);
for (const val of list) console.log(val);  // 1, 2, 3
console.log([...list]);   // [1, 2, 3]
const [first] = list;     // destructuring works!</code></pre>

<h2>Proxy &amp; Reflect</h2>
<pre><code>// Proxy intercepts operations on objects
const handler = {
  get(target, prop, receiver) {
    console.log(\`Getting \${prop}\`);
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    console.log(\`Setting \${prop} = \${value}\`);
    return Reflect.set(target, prop, value, receiver);
  },
  has(target, prop) {
    console.log(\`Checking if \${prop} exists\`);
    return Reflect.has(target, prop);
  }
};

const proxied = new Proxy({}, handler);
proxied.name = 'Alice';  // logs: Setting name = Alice
proxied.name;            // logs: Getting name
'name' in proxied;       // logs: Checking if name exists

// Practical: Reactive state (like Vue 3)
function reactive(obj) {
  return new Proxy(obj, {
    set(target, key, value) {
      const old = target[key];
      target[key] = value;
      if (old !== value) notify(key, value); // trigger re-render
      return true;
    }
  });
}</code></pre>

<h2>Memoization</h2>
<pre><code>// Cache function results for same arguments
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log('Cache hit for', key);
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  console.log('Computing for', n);
  return n * n;
});

expensiveCalc(5);  // Computing for 5 → 25
expensiveCalc(5);  // Cache hit → 25
expensiveCalc(6);  // Computing for 6 → 36</code></pre>

<h2>Functional Patterns</h2>
<pre><code>// Currying — transform f(a, b, c) into f(a)(b)(c)
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
};

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);   // 6
add(1, 2)(3);   // 6
add(1)(2, 3);   // 6

// Compose — right-to-left function composition
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe    = (...fns) => x => fns.reduce((v, f) => f(v), x);

const processName = pipe(
  str => str.trim(),
  str => str.toLowerCase(),
  str => str.replace(/\s+/g, '-')
);
processName('  Hello World  ');  // 'hello-world'</code></pre>

<div class="qa-block">
  <div class="qa-q">Q: What is the difference between a generator and an async function?</div>
  <div class="qa-a">Both use a pause/resume mechanism but for different purposes. Generators (function*) yield values lazily and can receive values back via .next(value) — they're for creating iterators and lazy sequences. Async functions (async function) are built on generators + promises — they automatically wrap return values in promises and await unwraps promises. Async/await is syntactic sugar specifically for handling async operations sequentially; generators are more general and can be used for coroutines, lazy evaluation, and infinite sequences.</div>
</div>`,
  },
  {
    id: 'js-interview',
    title: 'JS Interview Q&A',
    category: 'JavaScript',
    starterCode: `// JavaScript Interview Challenges

// 1. Implement debounce
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 2. Implement throttle
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Test debounce
const debouncedLog = debounce((msg) => console.log('Debounced:', msg), 100);
debouncedLog('a');
debouncedLog('b');
debouncedLog('c'); // Only 'c' fires after 100ms

// 3. Deep clone
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}

const original = { a: 1, b: { c: 2, d: [3, 4] } };
const clone = deepClone(original);
clone.b.c = 99;
console.log('Original b.c:', original.b.c); // 2 — unchanged

// 4. Flatten nested array
const flattenDeep = arr =>
  arr.reduce((flat, item) =>
    flat.concat(Array.isArray(item) ? flattenDeep(item) : item), []);

console.log(flattenDeep([1, [2, [3, [4]], 5]])); // [1, 2, 3, 4, 5]

// 5. Check palindrome
const isPalindrome = str => {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
};
console.log(isPalindrome('A man a plan a canal Panama')); // true`,
    content: `
<h1>JavaScript Interview Q&amp;A</h1>

<div class="qa-block"><div class="qa-q">Q: Explain event delegation and why it's useful.</div>
<div class="qa-a">Event delegation attaches a single event listener to a parent element instead of individual listeners to each child. When a child is clicked, the event bubbles up to the parent which handles it. Benefits: (1) Memory efficiency — one listener instead of hundreds, (2) Dynamic elements — works for elements added after the listener is attached, (3) Simpler code. Implementation: check event.target in the parent listener to identify which child triggered it.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is event bubbling and capturing?</div>
<div class="qa-a">Events propagate in three phases: (1) Capture phase — event travels from window down to target, (2) Target phase — event fires on the target element, (3) Bubble phase — event travels from target back up to window. By default, addEventListener uses bubble phase. Pass true as third argument to use capture. stopPropagation() stops bubbling. stopImmediatePropagation() also prevents other listeners on the same element.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is the difference between call, apply, and bind?</div>
<div class="qa-a">All three change what 'this' refers to. call(thisArg, arg1, arg2) — invokes immediately with individual args. apply(thisArg, [arg1, arg2]) — invokes immediately with args as array (remember: apply = Array). bind(thisArg, arg1) — returns a NEW function with this permanently bound (doesn't invoke). Use bind to create partially applied functions or to preserve this for callbacks. bind is useful for event handlers where you need to preserve component context.</div></div>

<div class="qa-block"><div class="qa-q">Q: Explain the difference between shallow and deep copy.</div>
<div class="qa-a">Shallow copy duplicates only the top-level properties — nested objects/arrays still reference the same memory. Deep copy recursively duplicates everything — fully independent. Shallow: Object.assign({}, obj), spread {...obj}, [...arr]. Deep: JSON.parse(JSON.stringify(obj)) — fast but loses functions, Dates, undefined; structuredClone(obj) — modern standard that handles most types; libraries like lodash.cloneDeep — handles edge cases.</div></div>

<div class="qa-block"><div class="qa-q">Q: What is a WeakMap and when would you use it?</div>
<div class="qa-a">WeakMap holds key-value pairs where keys must be objects and holds them weakly — if no other references to the key object exist, it can be garbage collected (and the entry is automatically removed). Use cases: (1) Caching per-object data without preventing GC, (2) Private data for class instances, (3) Storing DOM node metadata without memory leaks, (4) Memoization where you want entries to expire when the input object is no longer referenced.</div></div>

<div class="qa-block"><div class="qa-q">Q: How does JavaScript's event loop differ from multi-threading?</div>
<div class="qa-a">JavaScript runs on a single thread — only one piece of code executes at a time. Multi-threading (Java/Go) runs code truly in parallel on multiple CPU cores. The event loop gives the illusion of concurrency: while waiting for I/O, the thread handles other callbacks. Benefits: no race conditions in JS code, simpler mental model. Limits: CPU-intensive work blocks everything. For true parallelism in JS, use Web Workers (browser) or Worker Threads (Node.js) — each runs in its own thread with no shared memory by default (use SharedArrayBuffer + Atomics for shared state).</div></div>

<div class="qa-block"><div class="qa-q">Q: What are the different ways to create objects in JavaScript?</div>
<div class="qa-a">
(1) Object literal: const obj = { key: 'value' };
(2) new Object(): const obj = new Object();
(3) Constructor function: function Foo() {}; new Foo();
(4) Object.create(proto): creates object with given prototype;
(5) Class syntax: class Foo {}; new Foo();
(6) Factory function: function create() { return { ... }; } — no new needed, supports composition over inheritance.
Object.create(null) creates an object with NO prototype — useful for pure hash maps.
</div></div>

<div class="qa-block"><div class="qa-q">Q: What is Promise.allSettled vs Promise.all?</div>
<div class="qa-a">Promise.all rejects immediately if ANY promise rejects (fail-fast). Promise.allSettled waits for ALL promises to settle (fulfilled or rejected) and returns an array of {status, value/reason} objects — it never rejects. Use Promise.all when all results are required and any failure should abort. Use Promise.allSettled when you need all results regardless of failures (loading multiple independent UI sections, bulk operations where partial success is ok).</div></div>

<h2>Common Coding Questions</h2>

<h3>Implement debounce &amp; throttle</h3>
<pre><code>// Debounce: execute only after N ms of inactivity
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
// Use: search input — wait for user to stop typing

// Throttle: execute at most once per N ms
function throttle(fn, limit) {
  let lastRun = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      return fn.apply(this, args);
    }
  };
}
// Use: scroll handler, resize event — fire at controlled rate</code></pre>

<h3>Check for circular references</h3>
<pre><code>function isCircular(obj) {
  const seen = new WeakSet();
  function check(val) {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return true;
      seen.add(val);
      return Object.values(val).some(check);
    }
    return false;
  }
  return check(obj);
}

const a = { b: {} };
a.b.c = a; // circular!
console.log(isCircular(a)); // true</code></pre>`,
  },
];
