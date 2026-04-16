export const STORAGE_KEYS = {
  VISITED_TOPICS: 'njip_visited_topics',
  PLAYGROUND_OPEN: 'njip_playground_open',
  PLAYGROUND_CODE: 'njip_playground_code',
  LAST_TOPIC: 'njip_last_topic',
  SIDEBAR_COLLAPSED_CATEGORIES: 'njip_collapsed_cats',
};

export const CATEGORY_ORDER = [
  'JavaScript',
  'Fundamentals',
  'Async',
  'Modules',
  'Core',
  'Scaling',
  'Advanced',
  'Web',
  'Security',
  'DevOps',
  'Quality',
  'Databases',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'ClickHouse',
  'Kafka',
  'Temporal',
  'Elasticsearch',
  'Interview',
];

/** Sections group categories under visual headers in the sidebar */
export const SECTIONS = [
  {
    name: 'Languages',
    icon: '✨',
    categories: ['JavaScript'],
  },
  {
    name: 'Node.js',
    icon: '⬡',
    categories: ['Fundamentals', 'Async', 'Modules', 'Core', 'Scaling', 'Advanced'],
  },
  {
    name: 'Backend',
    icon: '🌐',
    categories: ['Web', 'Security', 'DevOps', 'Quality'],
  },
  {
    name: 'Databases',
    icon: '🗄️',
    categories: ['Databases', 'PostgreSQL', 'MongoDB', 'Redis', 'ClickHouse'],
  },
  {
    name: 'Messaging & Workflows',
    icon: '📡',
    categories: ['Kafka', 'Temporal'],
  },
  {
    name: 'Search & Analytics',
    icon: '🔍',
    categories: ['Elasticsearch'],
  },
  {
    name: 'Interview Prep',
    icon: '🎯',
    categories: ['Interview'],
  },
];

export const CATEGORY_ICONS = {
  JavaScript: '✨',
  Fundamentals: '⚡',
  Async: '🔄',
  Modules: '📦',
  Core: '🔧',
  Scaling: '📈',
  Web: '🌐',
  Security: '🔒',
  DevOps: '⚙️',
  Quality: '✅',
  Advanced: '🚀',
  Interview: '🎯',
  Databases: '🗄️',
  PostgreSQL: '🐘',
  MongoDB: '🍃',
  Redis: '⚡',
  Kafka: '📡',
  Elasticsearch: '🔍',
  ClickHouse: '🏠',
  Temporal: '⏱️',
};

export const DEFAULT_CODE = `// Welcome to the JS Playground!
// Write any JavaScript here and click Run (or Ctrl+Enter)

const greet = (name) => \`Hello, \${name}!\`;
console.log(greet('Node.js Developer'));

// Try the event loop execution order:
console.log('1 - sync');
setTimeout(() => console.log('4 - setTimeout'), 0);
Promise.resolve().then(() => console.log('3 - Promise'));
console.log('2 - sync end');
${'\n'.repeat(18)}`;

export const BLANK_CODE = '\n'.repeat(29);
