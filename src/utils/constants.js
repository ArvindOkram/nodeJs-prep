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
  'Web',
  'Security',
  'DevOps',
  'Quality',
  'Advanced',
  'Interview',
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
`;
