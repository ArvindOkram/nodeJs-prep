import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_ICONS } from '../../utils/constants';
import styles from './Sidebar.module.css';

export default function CategoryGroup({ category, topics, visited, bookmarks }) {
  const [open, setOpen] = useState(true);
  const listRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState('none');
  const doneCount = topics.filter((t) => visited.includes(t.id)).length;

  // Measure content height for smooth collapse animation
  const updateMaxHeight = useCallback(() => {
    if (listRef.current) {
      setMaxHeight(`${listRef.current.scrollHeight}px`);
    }
  }, []);

  useEffect(() => {
    updateMaxHeight();
  }, [topics.length, updateMaxHeight]);

  // Recalculate on open to handle dynamic content
  useEffect(() => {
    if (open) {
      // Small delay to allow DOM to render, then measure
      const timer = setTimeout(updateMaxHeight, 10);
      return () => clearTimeout(timer);
    }
  }, [open, updateMaxHeight]);

  return (
    <div className={styles.categoryGroup}>
      <button
        className={styles.categoryHeader}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.categoryIcon}>{CATEGORY_ICONS[category] ?? '\uD83D\uDCC1'}</span>
        <span className={styles.categoryName}>{category}</span>
        <span className={`${styles.categoryCount} ${doneCount > 0 ? styles.categoryCountDone : ''}`}>
          {doneCount}/{topics.length}
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : styles.chevronClosed}`}>
          &#9662;
        </span>
      </button>

      <div
        ref={listRef}
        className={`${styles.topicListWrapper} ${open ? styles.topicListExpanded : styles.topicListCollapsed}`}
        style={{ maxHeight: open ? maxHeight : undefined }}
      >
        <ul className={styles.topicList}>
          {topics.map((topic) => (
            <li key={topic.id} className={styles.topicItem}>
              <NavLink
                to={`/topic/${topic.id}`}
                className={({ isActive }) =>
                  [styles.topicLink, isActive ? styles.active : ''].join(' ')
                }
              >
                <span className={styles.visitedDot}>
                  {visited.includes(topic.id) ? (
                    <svg className={styles.visitedCheck} viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                      <path d="M5 8.5L7 10.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={styles.unvisitedCircle} />
                  )}
                </span>
                {topic.title}
              </NavLink>
              <button
                className={`${styles.starBtn} ${bookmarks.isBookmarked(topic.id) ? styles.starred : ''}`}
                onClick={(e) => { e.preventDefault(); bookmarks.toggle(topic.id); }}
                title={bookmarks.isBookmarked(topic.id) ? 'Remove bookmark' : 'Bookmark'}
              >
                {bookmarks.isBookmarked(topic.id) ? '\u2605' : '\u2606'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
