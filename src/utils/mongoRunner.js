/**
 * Simulated MongoDB query engine for browser-based practice.
 * Supports: find, findOne, aggregate (basic), insertOne, updateOne, deleteOne, countDocuments
 */

const SEED_DATA = {
  users: [
    { _id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 32, city: 'San Francisco', department: 'Engineering', salary: 130000, skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'], joinedAt: '2019-03-15' },
    { _id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 28, city: 'New York', department: 'Engineering', salary: 120000, skills: ['Python', 'Django', 'PostgreSQL'], joinedAt: '2020-06-01' },
    { _id: 3, name: 'Carol Williams', email: 'carol@example.com', age: 35, city: 'Austin', department: 'Marketing', salary: 95000, skills: ['SEO', 'Analytics', 'Content'], joinedAt: '2021-01-10' },
    { _id: 4, name: 'David Brown', email: 'david@example.com', age: 40, city: 'Chicago', department: 'Engineering', salary: 150000, skills: ['Java', 'Kafka', 'Kubernetes', 'AWS'], joinedAt: '2018-09-20' },
    { _id: 5, name: 'Eve Davis', email: 'eve@example.com', age: 26, city: 'San Francisco', department: 'Sales', salary: 88000, skills: ['Negotiation', 'CRM', 'Salesforce'], joinedAt: '2022-02-14' },
    { _id: 6, name: 'Frank Miller', email: 'frank@example.com', age: 45, city: 'New York', department: 'Engineering', salary: 160000, skills: ['Go', 'Rust', 'Distributed Systems', 'Kafka'], joinedAt: '2017-05-22' },
    { _id: 7, name: 'Grace Wilson', email: 'grace@example.com', age: 30, city: 'London', department: 'Design', salary: 105000, skills: ['Figma', 'UI/UX', 'CSS', 'React'], joinedAt: '2021-07-05' },
    { _id: 8, name: 'Henry Taylor', email: 'henry@example.com', age: 38, city: 'Berlin', department: 'DevOps', salary: 135000, skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS'], joinedAt: '2019-11-30' },
    { _id: 9, name: 'Ivy Anderson', email: 'ivy@example.com', age: 29, city: 'San Francisco', department: 'Engineering', salary: 125000, skills: ['TypeScript', 'React', 'GraphQL', 'Node.js'], joinedAt: '2020-08-12' },
    { _id: 10, name: 'Jack Thomas', email: 'jack@example.com', age: 33, city: 'Tokyo', department: 'Product', salary: 140000, skills: ['Product Strategy', 'Agile', 'Data Analysis'], joinedAt: '2019-04-18' },
  ],
  orders: [
    { _id: 1, userId: 1, items: [{ productId: 1, name: 'Widget Pro', qty: 2, price: 49.99 }, { productId: 3, name: 'Super Cable', qty: 5, price: 12.99 }], total: 164.93, status: 'delivered', createdAt: '2023-01-15' },
    { _id: 2, userId: 2, items: [{ productId: 2, name: 'Gadget X', qty: 1, price: 99.99 }], total: 99.99, status: 'delivered', createdAt: '2023-02-10' },
    { _id: 3, userId: 1, items: [{ productId: 7, name: 'Dev Toolkit', qty: 1, price: 199.99 }], total: 199.99, status: 'shipped', createdAt: '2023-03-05' },
    { _id: 4, userId: 4, items: [{ productId: 9, name: 'Keyboard Elite', qty: 1, price: 149.99 }, { productId: 10, name: 'Mouse Precision', qty: 1, price: 69.99 }], total: 219.98, status: 'delivered', createdAt: '2023-03-15' },
    { _id: 5, userId: 3, items: [{ productId: 5, name: 'Smart Cover', qty: 3, price: 24.99 }], total: 74.97, status: 'processing', createdAt: '2023-04-01' },
    { _id: 6, userId: 5, items: [{ productId: 6, name: 'Cloud Storage Plan', qty: 12, price: 9.99 }], total: 119.88, status: 'delivered', createdAt: '2023-04-20' },
    { _id: 7, userId: 6, items: [{ productId: 1, name: 'Widget Pro', qty: 10, price: 49.99 }], total: 499.90, status: 'shipped', createdAt: '2023-05-10' },
    { _id: 8, userId: 2, items: [{ productId: 4, name: 'Mega Battery', qty: 5, price: 29.99 }, { productId: 3, name: 'Super Cable', qty: 10, price: 12.99 }], total: 279.85, status: 'processing', createdAt: '2023-06-01' },
    { _id: 9, userId: 7, items: [{ productId: 8, name: 'Monitor Stand', qty: 2, price: 79.99 }], total: 159.98, status: 'delivered', createdAt: '2023-06-15' },
    { _id: 10, userId: 9, items: [{ productId: 7, name: 'Dev Toolkit', qty: 1, price: 199.99 }, { productId: 9, name: 'Keyboard Elite', qty: 1, price: 149.99 }], total: 349.98, status: 'shipped', createdAt: '2023-07-01' },
  ],
  products: [
    { _id: 1, name: 'Widget Pro', category: 'Electronics', price: 49.99, stock: 150, tags: ['gadget', 'popular', 'sale'], rating: 4.5 },
    { _id: 2, name: 'Gadget X', category: 'Electronics', price: 99.99, stock: 75, tags: ['premium', 'new'], rating: 4.2 },
    { _id: 3, name: 'Super Cable', category: 'Accessories', price: 12.99, stock: 500, tags: ['essential', 'popular'], rating: 4.0 },
    { _id: 4, name: 'Mega Battery', category: 'Electronics', price: 29.99, stock: 200, tags: ['essential', 'power'], rating: 3.8 },
    { _id: 5, name: 'Smart Cover', category: 'Accessories', price: 24.99, stock: 300, tags: ['protection', 'sale'], rating: 4.1 },
    { _id: 6, name: 'Cloud Storage Plan', category: 'Services', price: 9.99, stock: 9999, tags: ['digital', 'subscription'], rating: 4.7 },
    { _id: 7, name: 'Dev Toolkit', category: 'Software', price: 199.99, stock: 50, tags: ['premium', 'developer'], rating: 4.8 },
    { _id: 8, name: 'Monitor Stand', category: 'Accessories', price: 79.99, stock: 120, tags: ['ergonomic', 'popular'], rating: 4.3 },
    { _id: 9, name: 'Keyboard Elite', category: 'Electronics', price: 149.99, stock: 85, tags: ['premium', 'popular', 'mechanical'], rating: 4.6 },
    { _id: 10, name: 'Mouse Precision', category: 'Electronics', price: 69.99, stock: 110, tags: ['ergonomic', 'wireless'], rating: 4.4 },
  ],
};

// Deep clone to allow mutations without losing original data
let collections = {};

function resetCollections() {
  collections = JSON.parse(JSON.stringify(SEED_DATA));
}
resetCollections();

// ─── Query matching engine ───

function matchValue(docVal, queryVal) {
  if (queryVal === null || queryVal === undefined) return docVal === queryVal;
  if (typeof queryVal === 'object' && !Array.isArray(queryVal)) {
    return matchOperators(docVal, queryVal);
  }
  // Array field matching: if docVal is array, check if it contains queryVal
  if (Array.isArray(docVal)) return docVal.includes(queryVal);
  return docVal === queryVal;
}

function matchOperators(docVal, ops) {
  for (const [op, val] of Object.entries(ops)) {
    switch (op) {
      case '$gt':    if (!(docVal > val)) return false; break;
      case '$gte':   if (!(docVal >= val)) return false; break;
      case '$lt':    if (!(docVal < val)) return false; break;
      case '$lte':   if (!(docVal <= val)) return false; break;
      case '$ne':    if (docVal === val) return false; break;
      case '$in':    if (!val.includes(docVal) && !(Array.isArray(docVal) && docVal.some(v => val.includes(v)))) return false; break;
      case '$nin':   if (val.includes(docVal) || (Array.isArray(docVal) && docVal.some(v => val.includes(v)))) return false; break;
      case '$exists': if ((val && docVal === undefined) || (!val && docVal !== undefined)) return false; break;
      case '$regex': {
        const re = new RegExp(val, ops.$options || '');
        if (!re.test(String(docVal))) return false;
        break;
      }
      case '$options': break; // handled by $regex
      case '$size':  if (!Array.isArray(docVal) || docVal.length !== val) return false; break;
      case '$all':   if (!Array.isArray(docVal) || !val.every(v => docVal.includes(v))) return false; break;
      case '$elemMatch': {
        if (!Array.isArray(docVal)) return false;
        if (!docVal.some(el => matchDocument(el, val))) return false;
        break;
      }
      default: return false;
    }
  }
  return true;
}

function getNestedValue(doc, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], doc);
}

function matchDocument(doc, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$and') {
      if (!val.every(q => matchDocument(doc, q))) return false;
    } else if (key === '$or') {
      if (!val.some(q => matchDocument(doc, q))) return false;
    } else if (key === '$nor') {
      if (val.some(q => matchDocument(doc, q))) return false;
    } else if (key === '$not') {
      if (matchDocument(doc, val)) return false;
    } else {
      const docVal = getNestedValue(doc, key);
      if (!matchValue(docVal, val)) return false;
    }
  }
  return true;
}

function applyProjection(doc, projection) {
  if (!projection || Object.keys(projection).length === 0) return doc;
  const include = Object.values(projection).some(v => v === 1);
  if (include) {
    const result = { _id: doc._id };
    for (const [key, val] of Object.entries(projection)) {
      if (val === 1) result[key] = doc[key];
      if (key === '_id' && val === 0) delete result._id;
    }
    return result;
  }
  const result = { ...doc };
  for (const [key, val] of Object.entries(projection)) {
    if (val === 0) delete result[key];
  }
  return result;
}

function sortDocs(docs, sortSpec) {
  if (!sortSpec) return docs;
  return [...docs].sort((a, b) => {
    for (const [key, dir] of Object.entries(sortSpec)) {
      const aVal = getNestedValue(a, key);
      const bVal = getNestedValue(b, key);
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
    }
    return 0;
  });
}

// ─── Aggregation pipeline ───

function runAggregate(docs, pipeline) {
  let result = [...docs];
  for (const stage of pipeline) {
    const [op, val] = Object.entries(stage)[0];
    switch (op) {
      case '$match':
        result = result.filter(d => matchDocument(d, val));
        break;
      case '$project':
        result = result.map(d => applyProjection(d, val));
        break;
      case '$sort':
        result = sortDocs(result, val);
        break;
      case '$limit':
        result = result.slice(0, val);
        break;
      case '$skip':
        result = result.slice(val);
        break;
      case '$count':
        result = [{ [val]: result.length }];
        break;
      case '$unwind': {
        const field = typeof val === 'string' ? val.replace('$', '') : val.path.replace('$', '');
        const newResult = [];
        for (const doc of result) {
          const arr = getNestedValue(doc, field);
          if (Array.isArray(arr) && arr.length > 0) {
            for (const item of arr) {
              newResult.push({ ...doc, [field]: item });
            }
          } else if (typeof val === 'object' && val.preserveNullAndEmptyArrays) {
            newResult.push({ ...doc, [field]: null });
          }
        }
        result = newResult;
        break;
      }
      case '$group': {
        const groups = new Map();
        for (const doc of result) {
          let groupKey;
          if (val._id === null) {
            groupKey = '__all__';
          } else if (typeof val._id === 'string' && val._id.startsWith('$')) {
            groupKey = String(getNestedValue(doc, val._id.slice(1)));
          } else if (typeof val._id === 'object') {
            const keyObj = {};
            for (const [k, v] of Object.entries(val._id)) {
              keyObj[k] = typeof v === 'string' && v.startsWith('$') ? getNestedValue(doc, v.slice(1)) : v;
            }
            groupKey = JSON.stringify(keyObj);
          } else {
            groupKey = String(val._id);
          }
          if (!groups.has(groupKey)) groups.set(groupKey, []);
          groups.get(groupKey).push(doc);
        }
        result = [];
        for (const [key, docs] of groups.entries()) {
          const grouped = { _id: key === '__all__' ? null : (key.startsWith('{') ? JSON.parse(key) : key) };
          for (const [field, acc] of Object.entries(val)) {
            if (field === '_id') continue;
            if (typeof acc === 'object') {
              const [accOp, accField] = Object.entries(acc)[0];
              const values = accField && typeof accField === 'string' && accField.startsWith('$')
                ? docs.map(d => getNestedValue(d, accField.slice(1)))
                : docs.map(() => accField);
              switch (accOp) {
                case '$sum':
                  grouped[field] = typeof accField === 'number'
                    ? docs.length * accField
                    : values.reduce((s, v) => s + (Number(v) || 0), 0);
                  break;
                case '$avg':
                  grouped[field] = values.reduce((s, v) => s + (Number(v) || 0), 0) / values.length;
                  grouped[field] = Math.round(grouped[field] * 100) / 100;
                  break;
                case '$min': grouped[field] = Math.min(...values.filter(v => v != null)); break;
                case '$max': grouped[field] = Math.max(...values.filter(v => v != null)); break;
                case '$first': grouped[field] = values[0]; break;
                case '$last': grouped[field] = values[values.length - 1]; break;
                case '$push': grouped[field] = values; break;
                case '$addToSet': grouped[field] = [...new Set(values)]; break;
                case '$count': grouped[field] = docs.length; break;
              }
            }
          }
          result.push(grouped);
        }
        break;
      }
      case '$lookup': {
        const { from, localField, foreignField, as: asField } = val;
        const foreignColl = collections[from] || [];
        result = result.map(doc => {
          const localVal = getNestedValue(doc, localField);
          const matches = foreignColl.filter(fd => {
            const fVal = getNestedValue(fd, foreignField);
            return fVal === localVal;
          });
          return { ...doc, [asField]: matches };
        });
        break;
      }
      case '$addFields': {
        result = result.map(doc => {
          const newDoc = { ...doc };
          for (const [field, expr] of Object.entries(val)) {
            if (typeof expr === 'string' && expr.startsWith('$')) {
              newDoc[field] = getNestedValue(doc, expr.slice(1));
            } else {
              newDoc[field] = expr;
            }
          }
          return newDoc;
        });
        break;
      }
      default:
        throw new Error(`Unsupported aggregation stage: ${op}`);
    }
  }
  return result;
}

// ─── Collection proxy ───

function createCollectionProxy(name) {
  const getColl = () => collections[name] || [];
  const setColl = (data) => { collections[name] = data; };

  return {
    find(query = {}, projection = null) {
      let docs = getColl().filter(d => matchDocument(d, query));
      return {
        _docs: docs,
        _projection: projection,
        sort(s) { this._sort = s; return this; },
        limit(n) { this._limit = n; return this; },
        skip(n) { this._skip = n; return this; },
        toArray() {
          let result = this._docs;
          if (this._sort) result = sortDocs(result, this._sort);
          if (this._skip) result = result.slice(this._skip);
          if (this._limit) result = result.slice(0, this._limit);
          if (this._projection) result = result.map(d => applyProjection(d, this._projection));
          return result;
        },
        // Auto-resolve for display
        [Symbol.toPrimitive]() { return JSON.stringify(this.toArray(), null, 2); },
      };
    },
    findOne(query = {}, projection = null) {
      const doc = getColl().find(d => matchDocument(d, query));
      return doc ? applyProjection(doc, projection) : null;
    },
    aggregate(pipeline) {
      return runAggregate(getColl(), pipeline);
    },
    countDocuments(query = {}) {
      return getColl().filter(d => matchDocument(d, query)).length;
    },
    distinct(field, query = {}) {
      const docs = query ? getColl().filter(d => matchDocument(d, query)) : getColl();
      return [...new Set(docs.map(d => getNestedValue(d, field)).filter(v => v !== undefined))];
    },
    insertOne(doc) {
      const coll = getColl();
      if (!doc._id) doc._id = coll.length > 0 ? Math.max(...coll.map(d => d._id)) + 1 : 1;
      coll.push(doc);
      setColl(coll);
      return { acknowledged: true, insertedId: doc._id };
    },
    insertMany(docs) {
      const coll = getColl();
      let maxId = coll.length > 0 ? Math.max(...coll.map(d => d._id)) : 0;
      const ids = [];
      for (const doc of docs) {
        if (!doc._id) doc._id = ++maxId;
        ids.push(doc._id);
        coll.push(doc);
      }
      setColl(coll);
      return { acknowledged: true, insertedIds: ids };
    },
    updateOne(query, update) {
      const coll = getColl();
      const idx = coll.findIndex(d => matchDocument(d, query));
      if (idx === -1) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update.$set) Object.assign(coll[idx], update.$set);
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) coll[idx][k] = (coll[idx][k] || 0) + v;
      }
      if (update.$unset) {
        for (const k of Object.keys(update.$unset)) delete coll[idx][k];
      }
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          if (!Array.isArray(coll[idx][k])) coll[idx][k] = [];
          coll[idx][k].push(v);
        }
      }
      if (update.$pull) {
        for (const [k, v] of Object.entries(update.$pull)) {
          if (Array.isArray(coll[idx][k])) coll[idx][k] = coll[idx][k].filter(x => x !== v);
        }
      }
      setColl(coll);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    updateMany(query, update) {
      const coll = getColl();
      let count = 0;
      coll.forEach((doc, idx) => {
        if (!matchDocument(doc, query)) return;
        count++;
        if (update.$set) Object.assign(coll[idx], update.$set);
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) coll[idx][k] = (coll[idx][k] || 0) + v;
        }
      });
      setColl(coll);
      return { acknowledged: true, matchedCount: count, modifiedCount: count };
    },
    deleteOne(query) {
      const coll = getColl();
      const idx = coll.findIndex(d => matchDocument(d, query));
      if (idx === -1) return { acknowledged: true, deletedCount: 0 };
      coll.splice(idx, 1);
      setColl(coll);
      return { acknowledged: true, deletedCount: 1 };
    },
    deleteMany(query) {
      const coll = getColl();
      const before = coll.length;
      const filtered = coll.filter(d => !matchDocument(d, query));
      setColl(filtered);
      return { acknowledged: true, deletedCount: before - filtered.length };
    },
  };
}

/**
 * Execute MongoDB-style queries in the browser.
 * The code has access to `db.users`, `db.orders`, `db.products`.
 * Returns { logs: [], error, duration }
 */
export function runMongo(code) {
  const logs = [];
  const startTime = performance.now();

  const _log = console.log;
  const _error = console.error;
  const _warn = console.warn;
  const _info = console.info;

  const capture = (type) => (...args) => {
    logs.push({
      type,
      text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '),
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  console.log = capture('log');
  console.error = capture('error');
  console.warn = capture('warn');
  console.info = capture('info');

  let error = null;

  try {
    // Create db proxy that returns collection proxies
    const db = new Proxy({}, {
      get(_, collName) {
        return createCollectionProxy(collName);
      },
    });

    // Wrap code so results auto-print and db is available
    const wrappedCode = `
      const __result = (function(db) {
        // Helper to auto-resolve find cursors
        function __resolve(val) {
          if (val && typeof val === 'object' && val.toArray) return val.toArray();
          return val;
        }
        ${code.replace(/;\s*$/gm, '')}
      })(db);
      if (__result !== undefined) {
        const resolved = (__result && typeof __result === 'object' && __result.toArray)
          ? __result.toArray() : __result;
        console.log(typeof resolved === 'object' ? JSON.stringify(resolved, null, 2) : String(resolved));
      }
    `;

    // eslint-disable-next-line no-eval
    const evalFn = new Function('db', 'console', wrappedCode);
    evalFn(db, console);
  } catch (e) {
    error = e.message;
  } finally {
    console.log = _log;
    console.error = _error;
    console.warn = _warn;
    console.info = _info;
  }

  const duration = (performance.now() - startTime).toFixed(2);
  return { logs, error, duration };
}

/** Reset all collections to seed data */
export function resetMongoDb() {
  resetCollections();
}
