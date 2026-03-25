import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { topicsByCategory } from '../../data/topics';
import { CATEGORY_ORDER } from '../../utils/constants';
import CategoryGroup from './CategoryGroup';
import SearchBar from './SearchBar';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { progress } = useAppContext();
  const [query, setQuery] = useState('');

  const filteredByCategory = useMemo(() => {
    if (!query.trim()) return topicsByCategory;

    const q = query.toLowerCase();
    const filtered = {};
    Object.entries(topicsByCategory).forEach(([cat, topics]) => {
      const matches = topics.filter((t) => t.title.toLowerCase().includes(q));
      if (matches.length) filtered[cat] = matches;
    });
    return filtered;
  }, [query]);

  const orderedCategories = CATEGORY_ORDER.filter(
    (cat) => filteredByCategory[cat]
  );

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
        {orderedCategories.length === 0 ? (
          <p className={styles.noResults}>No topics match "{query}"</p>
        ) : (
          orderedCategories.map((cat) => (
            <CategoryGroup
              key={cat}
              category={cat}
              topics={filteredByCategory[cat]}
              visited={progress.visited}
            />
          ))
        )}
      </nav>
    </aside>
  );
}
