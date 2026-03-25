import { fundamentals } from './fundamentals';
import { async } from './async';
import { remaining } from './remaining';
import { javascript } from './javascript';
import { nodejsExtras } from './nodejs-extras';

export const topics = [...fundamentals, ...nodejsExtras.filter(t => t.category === 'Fundamentals'), ...async, ...nodejsExtras.filter(t => t.category === 'Async'), ...remaining, ...nodejsExtras.filter(t => !['Fundamentals', 'Async'].includes(t.category)), ...javascript];

/** Quick lookup by id */
export const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));

/** Topics grouped by category, preserving category order */
export const topicsByCategory = topics.reduce((acc, topic) => {
  (acc[topic.category] ??= []).push(topic);
  return acc;
}, {});
