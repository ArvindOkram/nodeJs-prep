import { fundamentals } from './fundamentals';
import { async } from './async';
import { remaining } from './remaining';
import { javascript } from './javascript';
import { nodejsExtras } from './nodejs-extras';
import { javascriptAdvanced } from './javascript-advanced';
import { nodejsAdvanced } from './nodejs-advanced';
import { postgresql } from './postgresql';
import { mongodb } from './mongodb';
import { kafka } from './kafka';
import { databases } from './databases';
import { redis } from './redis';
import { elasticsearch } from './elasticsearch';

export const topics = [
  ...fundamentals,
  ...nodejsExtras.filter(t => t.category === 'Fundamentals'),
  ...async,
  ...nodejsExtras.filter(t => t.category === 'Async'),
  ...remaining,
  ...nodejsExtras.filter(t => !['Fundamentals', 'Async'].includes(t.category)),
  ...javascript,
  ...javascriptAdvanced,
  ...nodejsAdvanced,
  ...databases,
  ...postgresql,
  ...mongodb,
  ...redis,
  ...kafka,
  ...elasticsearch,
];

/** Quick lookup by id */
export const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));

/** Topics grouped by category, preserving category order */
export const topicsByCategory = topics.reduce((acc, topic) => {
  (acc[topic.category] ??= []).push(topic);
  return acc;
}, {});
