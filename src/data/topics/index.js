// Languages
import { javascript } from './languages/javascript';
import { javascriptAdvanced } from './languages/javascript-advanced';

// Node.js
import { fundamentals } from './nodejs/fundamentals';
import { async } from './nodejs/async';
import { remaining } from './nodejs/remaining';
import { nodejsExtras } from './nodejs/nodejs-extras';
import { nodejsAdvanced } from './nodejs/nodejs-advanced';

// Databases
import { databases } from './databases/databases';
import { postgresql } from './databases/postgresql';
import { mongodb } from './databases/mongodb';
import { redis } from './databases/redis';
import { clickhouse } from './databases/clickhouse';

// Messaging & Workflows
import { kafka } from './messaging/kafka';
import { temporal } from './messaging/temporal';

// Search & Analytics
import { elasticsearch } from './search/elasticsearch';

export const topics = [
  // Languages
  ...javascript,
  ...javascriptAdvanced,

  // Node.js
  ...fundamentals,
  ...nodejsExtras.filter(t => t.category === 'Fundamentals'),
  ...async,
  ...nodejsExtras.filter(t => t.category === 'Async'),
  ...remaining,
  ...nodejsExtras.filter(t => !['Fundamentals', 'Async'].includes(t.category)),
  ...nodejsAdvanced,

  // Databases
  ...databases,
  ...postgresql,
  ...mongodb,
  ...redis,
  ...clickhouse,

  // Messaging & Workflows
  ...kafka,
  ...temporal,

  // Search & Analytics
  ...elasticsearch,
];

/** Quick lookup by id */
export const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));

/** Topics grouped by category, preserving category order */
export const topicsByCategory = topics.reduce((acc, topic) => {
  (acc[topic.category] ??= []).push(topic);
  return acc;
}, {});
