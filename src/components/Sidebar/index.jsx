import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { topicsByCategory, topicsById } from '../../data/topics';
import { CATEGORY_ORDER, CATEGORY_ICONS } from '../../utils/constants';
import CategoryGroup from './CategoryGroup';
import SearchBar from './SearchBar';
import styles from './Sidebar.module.css';

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

export default function Sidebar() {
  const { progress, bookmarks } = useAppContext();
  const [query, setQuery] = useState('');

  const filteredByCategory = useMemo(() => {
    if (!query.trim()) return topicsByCategory;

    const q = query.toLowerCase();
    const filtered = {};
    Object.entries(topicsByCategory).forEach(([cat, topics]) => {
      const matches = topics.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          stripHtml(t.content).includes(q)
      );
      if (matches.length) filtered[cat] = matches;
    });
    return filtered;
  }, [query]);

  const orderedCategories = CATEGORY_ORDER.filter((cat) => filteredByCategory[cat]);

  const bookmarkedTopics = bookmarks.bookmarks
    .map((id) => topicsById[id])
    .filter(Boolean);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoDot}>⬡</span>
          <span className={styles.logoText}>Node.js Prep</span>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {progress.percentage}% complete
          </span>
        </div>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      <nav className={styles.nav}>
        {/* Bookmarks section */}
        {!query && bookmarkedTopics.length > 0 && (
          <div className={styles.categoryGroup}>
            <div className={styles.categoryHeader} style={{ cursor: 'default' }}>
              <span className={styles.categoryIcon}>★</span>
              <span className={styles.categoryName}>Bookmarks</span>
              <span className={styles.categoryCount}>{bookmarkedTopics.length}</span>
            </div>
            <ul className={styles.topicList}>
              {bookmarkedTopics.map((topic) => (
                <li key={topic.id}>
                  <NavLink
                    to={`/topic/${topic.id}`}
                    className={({ isActive }) =>
                      [styles.topicLink, isActive ? styles.active : ''].join(' ')
                    }
                  >
                    <span className={styles.visitedDot}>
                      {progress.visited.includes(topic.id) ? '✓' : '○'}
                    </span>
                    {topic.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {orderedCategories.length === 0 ? (
          <p className={styles.noResults}>No topics match "{query}"</p>
        ) : (
          orderedCategories.map((cat) => (
            <CategoryGroup
              key={cat}
              category={cat}
              topics={filteredByCategory[cat]}
              visited={progress.visited}
              bookmarks={bookmarks}
            />
          ))
        )}
      </nav>
    </aside>
  );
}
