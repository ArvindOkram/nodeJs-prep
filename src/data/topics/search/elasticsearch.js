export const elasticsearch = [
  {
    id: 'es-architecture',
    title: 'Elasticsearch Architecture',
    category: 'Elasticsearch',
    starterCode: `// Simulating an Inverted Index — the core of Elasticsearch

class InvertedIndex {
  constructor() {
    this.index = new Map();   // term -> Set of docIds
    this.docs = new Map();    // docId -> original document
    this.nextId = 1;
  }

  analyze(text) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'and', 'or', 'of']);
    return text.toLowerCase()
      .replace(/[^a-z0-9\\s]/g, '')
      .split(/\\s+/)
      .filter(t => t.length > 1 && !stopWords.has(t));
  }

  index_doc(doc) {
    const id = this.nextId++;
    this.docs.set(id, { ...doc, _id: id });
    const text = Object.values(doc).join(' ');
    for (const term of this.analyze(text)) {
      if (!this.index.has(term)) this.index.set(term, new Set());
      this.index.get(term).add(id);
    }
    return id;
  }

  search(query, size = 5) {
    const terms = this.analyze(query);
    const scores = new Map();
    for (const term of terms) {
      const docIds = this.index.get(term);
      if (!docIds) continue;
      const idf = Math.log(this.docs.size / docIds.size);
      for (const id of docIds) {
        scores.set(id, (scores.get(id) || 0) + idf);
      }
    }
    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, size)
      .map(([id, score]) => ({
        _id: id,
        _score: Math.round(score * 100) / 100,
        _source: this.docs.get(id)
      }));
  }
}

const idx = new InvertedIndex();
idx.index_doc({ title: 'Elasticsearch Guide', body: 'Full text search engine built on Lucene' });
idx.index_doc({ title: 'Redis Caching', body: 'In-memory data store for caching and messaging' });
idx.index_doc({ title: 'PostgreSQL Indexing', body: 'B-Tree and GIN indexes for database queries' });
idx.index_doc({ title: 'Kafka Streaming', body: 'Distributed event streaming platform' });
idx.index_doc({ title: 'Search Engine Design', body: 'Building search with inverted index and relevance' });

console.log('=== Inverted Index ===');
for (const [term, docIds] of idx.index) {
  if (docIds.size > 1) console.log(term, '->', [...docIds]);
}
console.log('\\n=== Search: "search engine" ===');
console.log(JSON.stringify(idx.search('search engine'), null, 2));
console.log('\\n=== Search: "database index" ===');
console.log(JSON.stringify(idx.search('database index'), null, 2));`,
    content: `
<h1>Elasticsearch Architecture</h1>

<h2>What is Elasticsearch?</h2>
<p>Elasticsearch is a distributed, RESTful search and analytics engine built on <strong>Apache Lucene</strong>. It provides near real-time (NRT) full-text search with horizontal scalability.</p>

<h2>Core Concepts</h2>
<table>
  <tr><th>Concept</th><th>Description</th><th>RDBMS Analogy</th></tr>
  <tr><td><strong>Cluster</strong></td><td>Collection of nodes working together</td><td>Database cluster</td></tr>
  <tr><td><strong>Node</strong></td><td>Single Elasticsearch instance</td><td>Database server</td></tr>
  <tr><td><strong>Index</strong></td><td>Collection of documents</td><td>Table</td></tr>
  <tr><td><strong>Document</strong></td><td>Basic unit of information (JSON)</td><td>Row</td></tr>
  <tr><td><strong>Shard</strong></td><td>Horizontal partition of an index</td><td>Partition</td></tr>
  <tr><td><strong>Replica</strong></td><td>Copy of a shard for HA</td><td>Read replica</td></tr>
</table>

<h2>Node Types</h2>
<pre><code># Master-eligible — manages cluster state
node.roles: [master]

# Data node — stores data, handles CRUD + search
node.roles: [data]

# Ingest node — pre-processes documents
node.roles: [ingest]

# Coordinating only — routes requests, merges results
node.roles: []

# ML node — machine learning
node.roles: [ml]</code></pre>

<div class="warning-note"><strong>Production tip:</strong> Use 3 dedicated master-eligible nodes. Never co-locate master and data roles in large clusters.</div>

<h2>Inverted Index — Core Data Structure</h2>
<pre><code>Documents:
  Doc 1: "The quick brown fox"
  Doc 2: "The quick brown dog"
  Doc 3: "The lazy brown fox"

Inverted Index:
  Term     | Doc IDs   | Positions
  ---------|-----------|----------
  brown    | [1, 2, 3] | [2], [2], [2]
  dog      | [2]       | [3]
  fox      | [1, 3]    | [3], [3]
  lazy     | [3]       | [1]
  quick    | [1, 2]    | [1], [1]</code></pre>

<h3>Lucene Segments</h3>
<ul>
  <li>New docs go to in-memory buffer</li>
  <li>On <strong>refresh</strong> (default 1s), buffer written as new segment</li>
  <li>Segments are <strong>immutable</strong> — deletes are marked, not removed</li>
  <li><strong>Segment merging</strong> combines small segments, purges deletes</li>
</ul>

<h2>Write & Read Paths</h2>
<h3>Write Path</h3>
<pre><code>1. Client → Coordinating node
2. Route to primary shard: hash(_routing) % num_primary_shards
3. Primary shard:
   a. Write to in-memory buffer
   b. Write to translog (WAL for durability)
4. Replicate to replica shards
5. Acknowledge to client once in-sync replicas confirm</code></pre>

<h3>Search Path</h3>
<pre><code>1. Client → Coordinating node
2. Query Phase (scatter):
   - Send query to ALL relevant shards
   - Each shard returns top N doc IDs + scores
3. Fetch Phase (gather):
   - Merge results, identify global top N
   - Fetch actual documents from shards
4. Return to client</code></pre>

<h2>Translog (Write-Ahead Log)</h2>
<pre><code>Purpose: Durability between refreshes
- Every op written to translog before ack
- On crash: replay translog to recover un-refreshed data
- Flush = translog committed to Lucene (on 512MB or explicit)</code></pre>

<h2>Shard Routing</h2>
<pre><code>shard = hash(routing) % number_of_primary_shards

Default routing = document _id
Custom: POST /index/_doc?routing=user_123

CRITICAL: Primary shard count CANNOT be changed after index creation!</code></pre>

<div class="qa-block">
<div class="qa-q">Q: Why is Elasticsearch "near real-time"?</div>
<div class="qa-a">Because of the refresh interval (default 1 second). Documents are written to an in-memory buffer and translog first. They only become searchable when refreshed into a new Lucene segment. This ~1s delay makes it NRT. You can force refresh with <code>POST /index/_refresh</code> but it's expensive at scale.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What happens when a primary shard fails?</div>
<div class="qa-a">The master promotes an in-sync replica to primary. A new replica is allocated on another node. Writes are temporarily paused during promotion. This is why <code>number_of_replicas >= 1</code> is critical for production.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How does ES prevent split-brain?</div>
<div class="qa-a">ES 7+ uses quorum-based master election requiring majority (n/2 + 1) of master-eligible nodes. With 3 master nodes, you need 2 to elect a master, preventing split-brain automatically.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Explain segment merging.</div>
<div class="qa-a">Each refresh creates a new segment. Too many segments slow searches. Segment merging combines small segments into larger ones in the background, also permanently removing deleted documents. The tiered merge policy balances merge frequency vs I/O. Force merge can be used for read-only indices.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How would you size an ES cluster for 10TB of logs per day?</div>
<div class="qa-a">Use time-based indices with ILM. Target 10-50GB per shard (200-1000 shards/day). With 1 replica: 400-2000 total shards. Each node handles ~20 shards per GB of heap. Use hot-warm-cold architecture. Plan 30-50% headroom. Separate master nodes (3), coordinating, and data nodes.</div>
</div>
`
  },
  {
    id: 'es-mappings',
    title: 'Mappings & Analysis',
    category: 'Elasticsearch',
    starterCode: `// Simulating ES Text Analysis Pipeline

class TextAnalyzer {
  constructor(config = {}) {
    this.charFilters = config.charFilters || [];
    this.tokenizer = config.tokenizer || 'standard';
    this.tokenFilters = config.tokenFilters || [];
  }

  applyCharFilters(text) {
    let result = text;
    for (const filter of this.charFilters) {
      if (filter === 'html_strip') result = result.replace(/<[^>]+>/g, ' ');
      if (filter === 'mapping') result = result.replace(/&/g, 'and').replace(/@/g, 'at');
    }
    return result;
  }

  tokenize(text) {
    if (this.tokenizer === 'standard') return text.toLowerCase().match(/[a-z0-9]+/g) || [];
    if (this.tokenizer === 'keyword') return [text];
    if (this.tokenizer === 'whitespace') return text.split(/\\s+/);
    return text.split(/\\s+/);
  }

  applyTokenFilters(tokens) {
    let result = [...tokens];
    for (const filter of this.tokenFilters) {
      if (filter === 'lowercase') result = result.map(t => t.toLowerCase());
      if (filter === 'stop') {
        const stops = new Set(['the','a','an','is','are','was','in','on','to','and','or','of','it']);
        result = result.filter(t => !stops.has(t));
      }
      if (filter === 'stemmer') {
        result = result.map(t => {
          if (t.endsWith('ing')) return t.slice(0, -3);
          if (t.endsWith('ed')) return t.slice(0, -2);
          if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
          return t;
        });
      }
    }
    return result;
  }

  analyze(text) {
    console.log('Input:', JSON.stringify(text));
    const step1 = this.applyCharFilters(text);
    console.log('Char filters:', JSON.stringify(step1));
    const step2 = this.tokenize(step1);
    console.log('Tokenizer (' + this.tokenizer + '):', step2);
    const step3 = this.applyTokenFilters(step2);
    console.log('Token filters:', step3);
    return step3;
  }
}

console.log('=== Standard Analyzer ===');
new TextAnalyzer({ tokenFilters: ['stop'] }).analyze('The Quick Brown Fox is Jumping');

console.log('\\n=== Custom (stemming) ===');
new TextAnalyzer({
  charFilters: ['html_strip'],
  tokenFilters: ['stop', 'stemmer']
}).analyze('<h1>Elasticsearch</h1> is providing distributed searching');

console.log('\\n=== Keyword Analyzer ===');
new TextAnalyzer({ tokenizer: 'keyword' }).analyze('user@example.com');`,
    content: `
<h1>Elasticsearch Mappings & Analysis</h1>

<h2>Mappings Overview</h2>
<p>Mappings define how documents and fields are stored and indexed — the schema of your ES index.</p>

<h2>Dynamic vs Explicit Mapping</h2>
<table>
  <tr><th>Feature</th><th>Dynamic</th><th>Explicit</th></tr>
  <tr><td>Definition</td><td>Auto-detects types</td><td>You define types upfront</td></tr>
  <tr><td>Production</td><td>Risky (mapping explosion)</td><td>Recommended</td></tr>
</table>

<pre><code>PUT /products
{
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "name":     { "type": "text", "analyzer": "english" },
      "sku":      { "type": "keyword" },
      "price":    { "type": "float" },
      "category": { "type": "keyword" },
      "tags":     { "type": "keyword" },
      "created":  { "type": "date" }
    }
  }
}</code></pre>

<h2>Key Field Types</h2>
<table>
  <tr><th>Type</th><th>Use Case</th><th>Indexed As</th></tr>
  <tr><td><strong>text</strong></td><td>Full-text search</td><td>Analyzed → inverted index</td></tr>
  <tr><td><strong>keyword</strong></td><td>Exact values (IDs, status)</td><td>Not analyzed → doc values</td></tr>
  <tr><td><strong>integer/float</strong></td><td>Numbers</td><td>BKD tree</td></tr>
  <tr><td><strong>date</strong></td><td>Timestamps</td><td>Long (epoch) → BKD</td></tr>
  <tr><td><strong>nested</strong></td><td>Arrays of objects</td><td>Hidden separate documents</td></tr>
  <tr><td><strong>object</strong></td><td>JSON objects (flattened)</td><td>Flattened key paths</td></tr>
</table>

<h3>text vs keyword</h3>
<pre><code>// "text" — analyzed for full-text search
"name": { "type": "text" }
// "Elasticsearch Guide" → ["elasticsearch", "guide"]

// "keyword" — exact match only
"status": { "type": "keyword" }
// "In Progress" stored as-is

// Multi-field — BOTH (common pattern!)
"name": {
  "type": "text",
  "fields": { "raw": { "type": "keyword" } }
}
// Search on "name", sort/aggregate on "name.raw"</code></pre>

<h3>Nested vs Object</h3>
<pre><code>// Object flattens arrays: {"people.first": ["John","Alice"], "people.last": ["Smith","White"]}
// Query "John White" INCORRECTLY matches!

// Nested preserves associations — each object is a hidden document
"people": { "type": "nested", "properties": {...} }</code></pre>

<h2>Analysis Pipeline</h2>
<pre><code>Text → [Character Filters] → [Tokenizer] → [Token Filters] → Terms

Character Filters: html_strip, mapping, pattern_replace
Tokenizer: standard, whitespace, keyword, ngram, edge_ngram
Token Filters: lowercase, stop, stemmer, synonym, ngram</code></pre>

<h3>Built-in Analyzers</h3>
<table>
  <tr><th>Analyzer</th><th>"The QUICK Fox"</th></tr>
  <tr><td>standard</td><td>[the, quick, fox]</td></tr>
  <tr><td>whitespace</td><td>[The, QUICK, Fox]</td></tr>
  <tr><td>keyword</td><td>[The QUICK Fox]</td></tr>
  <tr><td>english</td><td>[quick, fox]</td></tr>
</table>

<h3>Custom Analyzer</h3>
<pre><code>PUT /my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "edge_ngram_tokenizer",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "edge_ngram_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2, "max_gram": 10,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  }
}</code></pre>

<div class="warning-note"><strong>Mapping Explosion:</strong> Dynamic mapping with untrusted data can create thousands of fields. Always set <code>dynamic: strict</code> in production.</div>

<div class="qa-block">
<div class="qa-q">Q: Can you change a field's mapping after creation?</div>
<div class="qa-a">No. Existing mappings cannot be changed. You must create a new index with correct mapping and reindex: <code>POST _reindex {"source":{"index":"old"}, "dest":{"index":"new"}}</code>. You can add new fields and multi-fields to existing fields.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How to implement autocomplete?</div>
<div class="qa-a">Use <strong>edge_ngram</strong> tokenizer at index time, standard at search time. Creates prefix tokens ("ela","elas","elast"...). Alternative: Completion Suggester with in-memory FST for faster prefix lookups.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When to use text vs keyword for email field?</div>
<div class="qa-a">Use keyword for exact lookups. Use text if you need partial matching. Best: multi-field with both. keyword for exact + aggregations, text sub-field for search.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What is doc_values?</div>
<div class="qa-a">Column-oriented storage for sorting/aggregations, built at index time. Enabled by default for non-text fields. Disable only for fields you'll never sort or aggregate on.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Nested vs Object — when to use which?</div>
<div class="qa-a">Use <strong>object</strong> when field associations don't matter (simple key-value metadata). Use <strong>nested</strong> when you need to query individual objects in arrays independently. Nested is slower and each nested object counts as a hidden document.</div>
</div>
`
  },
  {
    id: 'es-query-dsl',
    title: 'Query DSL & Scoring',
    category: 'Elasticsearch',
    starterCode: `// Simulating ES Bool Query with BM25 Scoring

class SearchEngine {
  constructor() { this.docs = []; this.index = new Map(); }

  addDoc(doc) {
    const idx = this.docs.length;
    this.docs.push(doc);
    const text = (doc.title + ' ' + doc.body).toLowerCase();
    const words = text.match(/[a-z0-9]+/g) || [];
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    for (const [term, count] of Object.entries(freq)) {
      if (!this.index.has(term)) this.index.set(term, []);
      this.index.get(term).push({ docIdx: idx, tf: count, docLen: words.length });
    }
  }

  bm25(tf, docLen, avgDl, df, N) {
    const k1 = 1.2, b = 0.75;
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    return idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLen / avgDl));
  }

  search(query) {
    const N = this.docs.length;
    const avgDl = this.docs.reduce((s, d) => s + ((d.title+' '+d.body).match(/[a-z0-9]+/gi)||[]).length, 0) / N;
    const scores = new Array(N).fill(0);
    const matched = new Array(N).fill(true);

    if (query.must) for (const c of query.must) {
      const term = c.match.toLowerCase();
      const p = this.index.get(term) || [];
      const set = new Set(p.map(x => x.docIdx));
      for (let i = 0; i < N; i++) if (!set.has(i)) matched[i] = false;
      for (const x of p) scores[x.docIdx] += this.bm25(x.tf, x.docLen, avgDl, p.length, N);
    }
    if (query.should) for (const c of query.should) {
      const term = c.match.toLowerCase();
      const p = this.index.get(term) || [];
      for (const x of p) scores[x.docIdx] += this.bm25(x.tf, x.docLen, avgDl, p.length, N) * 0.5;
    }
    if (query.must_not) for (const c of query.must_not) {
      const p = this.index.get(c.match.toLowerCase()) || [];
      for (const x of p) matched[x.docIdx] = false;
    }
    if (query.filter) for (const c of query.filter) {
      if (c.range) { const [f, cond] = Object.entries(c.range)[0];
        for (let i = 0; i < N; i++) {
          if (cond.gte !== undefined && this.docs[i][f] < cond.gte) matched[i] = false;
          if (cond.lte !== undefined && this.docs[i][f] > cond.lte) matched[i] = false;
        }
      }
    }
    return this.docs.map((d, i) => ({ ...d, _score: Math.round(scores[i]*1000)/1000, _ok: matched[i] }))
      .filter(d => d._ok && d._score > 0).sort((a, b) => b._score - a._score);
  }
}

const engine = new SearchEngine();
engine.addDoc({ title: 'Elasticsearch Performance', body: 'Optimize cluster with shard sizing', price: 49 });
engine.addDoc({ title: 'Redis Caching', body: 'Cache patterns for high performance', price: 29 });
engine.addDoc({ title: 'Database Performance', body: 'Query optimization for better performance', price: 39 });
engine.addDoc({ title: 'ES Cluster Setup', body: 'Configure Elasticsearch cluster nodes', price: 59 });
engine.addDoc({ title: 'Search Architecture', body: 'Building search with Elasticsearch', price: 69 });

console.log('=== must:"performance", should:"elasticsearch", filter: price<=50 ===');
const r1 = engine.search({ must: [{match:'performance'}], should: [{match:'elasticsearch'}], filter: [{range:{price:{lte:50}}}] });
console.log(JSON.stringify(r1.map(r => ({ title: r.title, _score: r._score, price: r.price })), null, 2));

console.log('\\n=== must:"cluster", must_not:"redis" ===');
const r2 = engine.search({ must: [{match:'cluster'}], must_not: [{match:'redis'}] });
console.log(JSON.stringify(r2.map(r => ({ title: r.title, _score: r._score })), null, 2));`,
    content: `
<h1>Elasticsearch Query DSL & Scoring</h1>

<h2>Query Context vs Filter Context</h2>
<table>
  <tr><th>Aspect</th><th>Query Context</th><th>Filter Context</th></tr>
  <tr><td>Question</td><td>"How well does this match?"</td><td>"Does this match?"</td></tr>
  <tr><td>Scoring</td><td>Calculates _score</td><td>No scoring (faster)</td></tr>
  <tr><td>Caching</td><td>Not cached</td><td>Cached in filter cache</td></tr>
  <tr><td>Use for</td><td>Full-text search</td><td>Exact filters, ranges</td></tr>
</table>

<h2>Full-Text Queries</h2>
<pre><code>// match — standard full-text search
{ "match": { "title": "quick brown fox" } }  // OR by default

// match with AND
{ "match": { "title": { "query": "quick fox", "operator": "and" } } }

// multi_match — search multiple fields
{ "multi_match": {
    "query": "elasticsearch guide",
    "fields": ["title^3", "description", "tags^2"],
    "type": "best_fields"
}}

// match_phrase — exact phrase order
{ "match_phrase": { "title": "quick brown" } }
{ "match_phrase": { "title": { "query": "quick fox", "slop": 1 } } }</code></pre>

<h2>Term-Level Queries</h2>
<pre><code>{ "term": { "status": "published" } }       // exact (keyword fields)
{ "terms": { "status": ["published", "draft"] } }
{ "range": { "price": { "gte": 10, "lte": 100 } } }
{ "exists": { "field": "email" } }
{ "prefix": { "title.raw": "Elastic" } }
{ "wildcard": { "email": "*@gmail.com" } }   // expensive!
{ "fuzzy": { "name": { "value": "elastcsearch", "fuzziness": 2 } } }</code></pre>

<h2>Bool Query</h2>
<pre><code>{
  "bool": {
    "must":     [{ "match": { "title": "elasticsearch" } }],  // scored
    "should":   [{ "match": { "tags": "search" } }],          // optional boost
    "must_not": [{ "term": { "status": "deprecated" } }],     // exclude
    "filter":   [{ "range": { "price": { "lte": 100 } } }]   // no scoring, cached
  }
}</code></pre>

<h2>BM25 Scoring</h2>
<pre><code>Score = IDF x TF_normalized

IDF = log(1 + (N - df + 0.5) / (df + 0.5))
  - Rare terms score higher

TF_norm = (tf x (k1+1)) / (tf + k1 x (1-b + b x dl/avgdl))
  - k1=1.2: TF saturation (diminishing returns after ~3 occurrences)
  - b=0.75: shorter docs get a boost</code></pre>

<h2>Pagination</h2>
<pre><code>// from/size (don't use for deep pagination!)
{ "from": 0, "size": 10 }

// search_after (efficient deep pagination)
{ "size": 10, "sort": [{"date":"desc"}, {"_id":"asc"}],
  "search_after": ["2024-01-15", "doc_500"] }

// Point in Time (PIT) — preferred over scroll
POST /index/_pit?keep_alive=5m</code></pre>

<div class="qa-block">
<div class="qa-q">Q: must vs filter — when to use which?</div>
<div class="qa-a">Use <strong>must</strong> for full-text queries needing relevance scoring. Use <strong>filter</strong> for exact conditions where scoring doesn't matter (status, ranges, categories). Filters are faster (cached, skip scoring).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: term vs match query — what's the difference?</div>
<div class="qa-a"><strong>term</strong> searches exact value without analysis — use with keyword fields. <strong>match</strong> analyzes input first — use with text fields. Using term on text field fails because "Quick Brown" doesn't exist as a token (it's stored as ["quick","brown"]).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How to handle typos?</div>
<div class="qa-a">Use <code>match</code> with <code>"fuzziness": "AUTO"</code> (best balance). Alternatives: phonetic analysis, n-grams for partial matching, or Suggest API for "did you mean".</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How to debug why a document doesn't match?</div>
<div class="qa-a">Use <strong>Explain API</strong>: <code>GET /index/_explain/doc_id {"query":{...}}</code>. Also: _analyze API to see tokenization, _validate/query?explain, and check field mapping.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How would you implement "did you mean" suggestions?</div>
<div class="qa-a">Use the <strong>Suggest API</strong> with phrase suggester. It considers the entire phrase using n-gram language models. For prefix autocomplete, use the Completion Suggester with in-memory FST.</div>
</div>
`
  },
  {
    id: 'es-aggregations',
    title: 'Aggregations & Analytics',
    category: 'Elasticsearch',
    starterCode: `// Simulating ES Aggregations

const products = [
  { name: 'Widget Pro', category: 'Electronics', price: 49.99, rating: 4.5, sold: 1200 },
  { name: 'Gadget X', category: 'Electronics', price: 99.99, rating: 4.2, sold: 800 },
  { name: 'Super Cable', category: 'Accessories', price: 12.99, rating: 4.0, sold: 5000 },
  { name: 'Mega Battery', category: 'Electronics', price: 29.99, rating: 3.8, sold: 2000 },
  { name: 'Smart Cover', category: 'Accessories', price: 24.99, rating: 4.1, sold: 3000 },
  { name: 'Cloud Plan', category: 'Services', price: 9.99, rating: 4.7, sold: 10000 },
  { name: 'Dev Toolkit', category: 'Software', price: 199.99, rating: 4.8, sold: 500 },
  { name: 'Monitor Stand', category: 'Accessories', price: 79.99, rating: 4.3, sold: 1500 },
  { name: 'Keyboard Elite', category: 'Electronics', price: 149.99, rating: 4.6, sold: 900 },
  { name: 'Mouse Pro', category: 'Electronics', price: 69.99, rating: 4.4, sold: 1100 },
];

// Terms aggregation
console.log('=== Terms Agg (by category) ===');
const cats = {};
products.forEach(p => {
  if (!cats[p.category]) cats[p.category] = { count: 0, revenue: 0 };
  cats[p.category].count++;
  cats[p.category].revenue += p.price * p.sold;
});
Object.entries(cats).sort((a,b) => b[1].count - a[1].count)
  .forEach(([c, d]) => console.log(c + ':', d.count, 'items, $' + Math.round(d.revenue)));

// Stats aggregation
console.log('\\n=== Stats Agg (price) ===');
const prices = products.map(p => p.price);
console.log({ count: prices.length, min: Math.min(...prices), max: Math.max(...prices),
  avg: Math.round(prices.reduce((s,p) => s+p, 0) / prices.length * 100) / 100 });

// Range aggregation
console.log('\\n=== Range Agg (price tiers) ===');
[{ l: 'Budget (<$25)', lo: 0, hi: 25 }, { l: 'Mid ($25-100)', lo: 25, hi: 100 }, { l: 'Premium ($100+)', lo: 100, hi: Infinity }]
  .forEach(r => {
    const items = products.filter(p => p.price >= r.lo && p.price < r.hi);
    console.log(r.l + ':', items.map(p => p.name).join(', '));
  });

// Nested: category -> avg price + top product
console.log('\\n=== Nested: category + stats + top product ===');
Object.keys(cats).forEach(cat => {
  const items = products.filter(p => p.category === cat);
  const avg = items.reduce((s,p) => s+p.price, 0) / items.length;
  const top = items.sort((a,b) => b.rating - a.rating)[0];
  console.log(cat + ': avg $' + avg.toFixed(2) + ', best: ' + top.name + ' (' + top.rating + ')');
});`,
    content: `
<h1>Elasticsearch Aggregations</h1>

<h2>Three Types</h2>
<table>
  <tr><th>Type</th><th>Purpose</th><th>Examples</th></tr>
  <tr><td><strong>Bucket</strong></td><td>Group documents</td><td>terms, range, date_histogram, nested</td></tr>
  <tr><td><strong>Metric</strong></td><td>Calculate values</td><td>avg, sum, min, max, stats, percentiles, cardinality</td></tr>
  <tr><td><strong>Pipeline</strong></td><td>Aggregate on agg results</td><td>moving_avg, derivative, cumulative_sum</td></tr>
</table>

<h2>Bucket Aggregations</h2>
<pre><code>// Terms (GROUP BY)
{ "aggs": { "by_category": { "terms": { "field": "category", "size": 10 } } } }

// Date histogram
{ "aggs": { "monthly": { "date_histogram": { "field": "date", "calendar_interval": "month" } } } }

// Range
{ "aggs": { "prices": { "range": { "field": "price",
    "ranges": [{"to":25}, {"from":25,"to":100}, {"from":100}] } } } }

// Filters
{ "aggs": { "status": { "filters": { "filters": {
    "active": {"term":{"status":"active"}},
    "pending": {"term":{"status":"pending"}} } } } } }</code></pre>

<h2>Metric Aggregations</h2>
<pre><code>{ "aggs": {
    "price_stats":    { "stats": { "field": "price" } },           // min,max,avg,sum,count
    "unique_cats":    { "cardinality": { "field": "category" } },   // approx distinct
    "price_pcts":     { "percentiles": { "field": "price", "percents": [50,95,99] } }
}}</code></pre>

<h2>Nested Sub-Aggregations</h2>
<pre><code>{ "aggs": {
    "by_category": {
      "terms": { "field": "category" },
      "aggs": {
        "avg_price": { "avg": { "field": "price" } },
        "top_products": { "top_hits": { "size": 3, "sort": [{"rating":"desc"}] } }
      }
    }
}}</code></pre>

<h2>Pipeline Aggregations</h2>
<pre><code>// Moving average of monthly sales
{ "aggs": { "monthly": { "date_histogram": {...}, "aggs": {
    "total": { "sum": { "field": "amount" } },
    "moving_avg": { "moving_fn": { "buckets_path": "total", "window": 3,
      "script": "MovingFunctions.unweightedAvg(values)" } }
}}}}</code></pre>

<h2>Composite Aggregation (Pagination)</h2>
<pre><code>// Paginate through ALL buckets (unlike terms which shows top N)
{ "aggs": { "my_buckets": { "composite": {
    "size": 100,
    "sources": [{ "category": { "terms": { "field": "category" } } }],
    "after": { "category": "last_value" }
}}}}</code></pre>

<div class="qa-block">
<div class="qa-q">Q: How do you paginate through all aggregation buckets?</div>
<div class="qa-a">Use <strong>composite aggregation</strong>. Unlike terms (top N), composite paginates through ALL buckets using after_key. Supports multiple sources for multi-dimensional bucketing.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How accurate is cardinality aggregation?</div>
<div class="qa-a">It uses <strong>HyperLogLog++</strong> — approximate but memory-efficient. Below precision_threshold (default 3000), nearly exact; above, ~1-6% error. For exact counts, use terms aggregation (but impractical at scale).</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How to build a real-time analytics dashboard?</div>
<div class="qa-a">Combine: date_histogram for time-series, terms for top-N, filters for KPIs, percentiles for latency. Set size:0. Use index aliases + ILM. Consider transforms for pre-aggregation of frequently accessed metrics.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Why avoid high-cardinality terms aggregations?</div>
<div class="qa-a">Terms agg builds priority queue on coordinating node. Millions of unique values = memory spikes, high network traffic, inaccurate shard approximations. Use composite for pagination, or ClickHouse for this use case.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: Sub-aggregations vs pipeline aggregations?</div>
<div class="qa-a"><strong>Sub-aggs</strong> run within each bucket on original documents (avg price per category). <strong>Pipeline aggs</strong> compute on other aggregation results (moving avg of monthly sums). Pipeline uses buckets_path to reference sibling results.</div>
</div>
`
  },
  {
    id: 'es-scaling',
    title: 'Scaling & Production',
    category: 'Elasticsearch',
    starterCode: `// Simulating ES ILM & Hot-Warm-Cold Architecture

class ESCluster {
  constructor(nodes) {
    this.nodes = nodes.map((type, i) => ({
      id: 'node-' + (i+1), type, shards: [], diskGB: 0
    }));
    this.indices = [];
  }

  route(routing, numShards) {
    let hash = 0;
    for (let i = 0; i < routing.length; i++) hash = ((hash << 5) - hash + routing.charCodeAt(i)) | 0;
    return Math.abs(hash) % numShards;
  }

  createIndex(name, sizeGB, shards = 3, replicas = 1) {
    const tier = this.nodes.filter(n => n.type === 'hot');
    const total = shards * (1 + replicas);
    for (let i = 0; i < total; i++) {
      const node = tier[i % tier.length];
      node.shards.push({ index: name, shard: i % shards, primary: i < shards });
      node.diskGB += sizeGB / shards;
    }
    this.indices.push({ name, sizeGB, tier: 'hot', shards, age: 0 });
  }

  applyILM(indexName, targetTier) {
    const targetNodes = this.nodes.filter(n => n.type === targetTier);
    if (!targetNodes.length) return;
    this.nodes.forEach(n => {
      const moving = n.shards.filter(s => s.index === indexName);
      n.shards = n.shards.filter(s => s.index !== indexName);
      n.diskGB -= moving.length * 10;
      moving.forEach((s, i) => {
        const target = targetNodes[i % targetNodes.length];
        target.shards.push(s);
        target.diskGB += 10;
      });
    });
    const idx = this.indices.find(i => i.name === indexName);
    if (idx) idx.tier = targetTier;
  }

  status() {
    console.log('=== Cluster Status ===');
    this.nodes.forEach(n => console.log(
      n.id + ' [' + n.type + ']: ' + n.shards.length + ' shards, ' + Math.round(n.diskGB) + 'GB'
    ));
    console.log('\\nIndices:');
    this.indices.forEach(i => console.log('  ' + i.name + ': ' + i.sizeGB + 'GB [' + i.tier + ']'));
  }
}

const cluster = new ESCluster(['hot','hot','hot','warm','warm','cold']);

cluster.createIndex('logs-2024-01', 50);
cluster.createIndex('logs-2024-02', 45);
cluster.createIndex('logs-2024-03', 55);

console.log('After creating 3 monthly log indices:');
cluster.status();

console.log('\\n--- ILM: Move Jan to warm ---');
cluster.applyILM('logs-2024-01', 'warm');
cluster.status();

console.log('\\n--- ILM: Move Jan to cold ---');
cluster.applyILM('logs-2024-01', 'cold');
cluster.status();

console.log('\\n=== Document Routing ===');
['user_123', 'user_456', 'order_001'].forEach(id =>
  console.log(id + ' -> shard ' + cluster.route(id, 3)));`,
    content: `
<h1>Elasticsearch Scaling & Production</h1>

<h2>Shard Sizing</h2>
<table>
  <tr><th>Guideline</th><th>Value</th><th>Reason</th></tr>
  <tr><td>Shard size</td><td>10-50GB</td><td>Too small = overhead, too large = slow recovery</td></tr>
  <tr><td>Shards per node</td><td>~20 per GB heap</td><td>Metadata overhead</td></tr>
  <tr><td>Total cluster shards</td><td>&lt; 10,000</td><td>Cluster state grows linearly</td></tr>
</table>

<div class="warning-note"><strong>Over-sharding</strong> is the #1 scaling mistake. More shards ≠ faster search if data is small.</div>

<h2>Index Lifecycle Management (ILM)</h2>
<pre><code>Hot → Warm → Cold → Frozen → Delete

PUT _ilm/policy/logs_policy
{
  "policy": { "phases": {
    "hot":  { "actions": { "rollover": { "max_size":"50gb", "max_age":"1d" } } },
    "warm": { "min_age":"7d", "actions": { "shrink":{"number_of_shards":1}, "forcemerge":{"max_num_segments":1} } },
    "cold": { "min_age":"30d", "actions": { "freeze":{} } },
    "delete": { "min_age":"90d", "actions": { "delete":{} } }
  }}
}</code></pre>

<h3>Hot-Warm-Cold Architecture</h3>
<pre><code>Hot:    Fast SSDs, active writes, recent data (0-7d)
Warm:   Standard SSDs/HDDs, read-only, merged (7-30d)
Cold:   Cheap HDDs, rarely searched (30-90d)
Frozen: Searchable snapshots on S3/GCS (90d+, loaded on-demand)</code></pre>

<h2>Search Optimization</h2>
<pre><code>1. Routing: PUT /orders/_doc/123?routing=user_456  (query 1 shard vs all)
2. Source filtering: { "_source": ["title","price"] }
3. Preference: ?preference=user_session_123 (cache efficiency)
4. Profile API: { "profile": true, "query": {...} }
5. Slow log: "index.search.slowlog.threshold.query.warn": "10s"</code></pre>

<h2>Indexing Performance</h2>
<pre><code>// ALWAYS use Bulk API for multiple docs
POST /_bulk
{"index":{"_index":"products","_id":"1"}}
{"name":"Widget","price":9.99}

Tips: 5-15MB per bulk, disable replicas during bulk,
increase refresh_interval, use multiple worker threads</code></pre>

<h2>Monitoring</h2>
<pre><code>GET _cluster/health          // green/yellow/red
GET _cat/nodes?v             // node stats
GET _cat/indices?v&s=store.size:desc
GET _cat/shards?v            // shard allocation
GET _nodes/hot_threads       // CPU debugging</code></pre>

<h2>Backup: Snapshots</h2>
<pre><code>PUT _snapshot/backup { "type":"s3", "settings":{"bucket":"my-backups"} }
PUT _snapshot/backup/snap_01 { "indices":"logs-*" }
POST _snapshot/backup/snap_01/_restore

// SLM: automate daily snapshots
PUT _slm/policy/daily { "schedule":"0 0 2 * * ?", "repository":"backup",
  "retention": { "expire_after":"30d", "min_count":5 } }</code></pre>

<h2>Common Production Problems</h2>
<table>
  <tr><th>Problem</th><th>Solution</th></tr>
  <tr><td>Mapping explosion</td><td>dynamic:strict, total_fields.limit</td></tr>
  <tr><td>Fielddata OOM</td><td>Don't aggregate text fields, use keyword</td></tr>
  <tr><td>Too many shards</td><td>ILM with shrink, fewer shards per index</td></tr>
  <tr><td>Slow queries</td><td>Filter context, slow log, profile API</td></tr>
  <tr><td>Yellow health</td><td>Check disk space, node availability</td></tr>
</table>

<h2>ES vs Alternatives</h2>
<table>
  <tr><th></th><th>Elasticsearch</th><th>OpenSearch</th><th>Meilisearch</th><th>Typesense</th></tr>
  <tr><td>License</td><td>SSPL</td><td>Apache 2.0</td><td>MIT</td><td>GPL-3</td></tr>
  <tr><td>Best for</td><td>General purpose</td><td>AWS</td><td>Simple search</td><td>Instant search</td></tr>
  <tr><td>Complexity</td><td>High</td><td>High</td><td>Low</td><td>Low</td></tr>
  <tr><td>Scale</td><td>PB+</td><td>PB+</td><td>GB-TB</td><td>GB-TB</td></tr>
</table>

<div class="qa-block">
<div class="qa-q">Q: How to determine shard count for an index?</div>
<div class="qa-a">Target 10-50GB per shard. For 200GB index: 4-20 shards. Consider query parallelism, write throughput, recovery time. For time-series, use rollover at size thresholds.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What is hot-warm-cold architecture?</div>
<div class="qa-a">Tiered storage: hot (SSDs, active writes), warm (cheaper, read-only), cold (cheapest, rare access). Data moves through tiers via ILM based on age. Optimizes cost for time-series data.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: How to migrate a large ES cluster with zero downtime?</div>
<div class="qa-a">Options: (1) Reindex API with aliases — create new index, reindex, swap alias. (2) CCR — replicate to new cluster, switch clients. (3) Rolling upgrade — disable allocation, upgrade node by node. Always use index aliases so clients never reference index names directly.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: When to choose ES over a traditional database?</div>
<div class="qa-a">Choose ES for: full-text search with relevance, complex text analysis, real-time analytics, log analytics. Don't use for: primary data store (no ACID), simple key-value (use Redis), relational joins (use PostgreSQL). ES works best as a secondary store synced from source of truth.</div>
</div>

<div class="qa-block">
<div class="qa-q">Q: What are searchable snapshots?</div>
<div class="qa-a">ES 7.12+ feature: search data in S3/GCS without restoring to disk. Frozen tier uses this. Data loaded on-demand with local caching. Dramatically cheaper for archives. Tradeoff: first-query latency is higher.</div>
</div>
`
  },
];
