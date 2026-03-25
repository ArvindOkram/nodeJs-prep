import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_ICONS } from '../../utils/constants';
import styles from './Sidebar.module.css';

export default function CategoryGroup({ category, topics, visited }) {
  const [open, setOpen] = useState(true);
  const doneCount = topics.filter((t) => visited.includes(t.id)).length;

  return (
    <div className={styles.categoryGroup}>
      <button
        className={styles.categoryHeader}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.categoryIcon}>{CATEGORY_ICONS[category] ?? '📁'}</span>
        <span className={styles.categoryName}>{category}</span>
        <span className={styles.categoryCount}>{doneCount}/{topics.length}</span>
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <ul className={styles.topicList}>
          {topics.map((topic) => (
            <li key={topic.id}>
              <NavLink
                to={`/topic/${topic.id}`}
                className={({ isActive }) =>
                  [styles.topicLink, isActive ? styles.active : ''].join(' ')
                }
              >
                <span className={styles.visitedDot}>
                  {visited.includes(topic.id) ? '✓' : '○'}
                </span>
                {topic.title}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
