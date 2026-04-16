import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { topicsByCategory, topicsById } from '../../data/topics';
import { CATEGORY_ORDER, SECTIONS } from '../../utils/constants';
import CategoryGroup from './CategoryGroup';
import SearchBar from './SearchBar';
import styles from './Sidebar.module.css';

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

function ProgressRing({ percentage }) {
  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      className={styles.progressRing}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${percentage}% complete`}
    >
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3a0" />
          <stop offset="100%" stopColor="#6c9fff" />
        </linearGradient>
      </defs>
      <circle
        className={styles.progressRingBg}
        cx={size / 2}
        cy={size / 2}
        r={radius}
      />
      <circle
        className={styles.progressRingFill}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text
        className={styles.progressPercent}
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {percentage}%
      </text>
    </svg>
  );
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

  const totalResults = useMemo(() => {
    return orderedCategories.reduce(
      (sum, cat) => sum + (filteredByCategory[cat]?.length || 0),
      0
    );
  }, [orderedCategories, filteredByCategory]);

  const bookmarkedTopics = bookmarks.bookmarks
    .map((id) => topicsById[id])
    .filter(Boolean);

  // When searching, show flat list; otherwise group by sections
  const isSearching = query.trim().length > 0;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoDot}>&#x2B21;</span>
          <span className={styles.logoText}>Interview Prep</span>
          <ProgressRing percentage={progress.percentage} />
        </div>

        <div className={styles.progressWrap}>
          <span className={styles.progressLabel}>
            {progress.percentage}% complete
          </span>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        resultCount={isSearching ? totalResults : null}
      />

      <nav className={styles.nav}>
        {/* Bookmarks section */}
        {!query && bookmarkedTopics.length > 0 && (
          <div className={styles.categoryGroup}>
            <div className={styles.categoryHeader} style={{ cursor: 'default' }}>
              <span className={styles.categoryIcon}>&#9733;</span>
              <span className={styles.categoryName}>Bookmarks</span>
              <span className={styles.categoryCount}>{bookmarkedTopics.length}</span>
            </div>
            <div className={`${styles.topicListWrapper} ${styles.topicListExpanded}`}>
              <ul className={styles.topicList}>
                {bookmarkedTopics.map((topic) => (
                  <li key={topic.id} className={styles.topicItem}>
                    <NavLink
                      to={`/topic/${topic.id}`}
                      className={({ isActive }) =>
                        [styles.topicLink, isActive ? styles.active : ''].join(' ')
                      }
                    >
                      <span className={styles.visitedDot}>
                        {progress.visited.includes(topic.id) ? (
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {orderedCategories.length === 0 ? (
          <p className={styles.noResults}>No topics match &ldquo;{query}&rdquo;</p>
        ) : isSearching ? (
          // Flat list when searching
          orderedCategories.map((cat) => (
            <CategoryGroup
              key={cat}
              category={cat}
              topics={filteredByCategory[cat]}
              visited={progress.visited}
              bookmarks={bookmarks}
            />
          ))
        ) : (
          // Grouped by sections
          SECTIONS.map((section) => {
            const sectionCats = section.categories.filter(
              (cat) => filteredByCategory[cat]
            );
            if (sectionCats.length === 0) return null;

            return (
              <div key={section.name} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>{section.icon}</span>
                  <span className={styles.sectionName}>{section.name}</span>
                </div>
                {sectionCats.map((cat) => (
                  <CategoryGroup
                    key={cat}
                    category={cat}
                    topics={filteredByCategory[cat]}
                    visited={progress.visited}
                    bookmarks={bookmarks}
                  />
                ))}
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}
