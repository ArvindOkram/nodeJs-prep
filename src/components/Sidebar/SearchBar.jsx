import styles from './Sidebar.module.css';

export default function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className={styles.searchWrap}>
      <div className={styles.searchInner}>
        <span className={styles.searchIcon}>&#128269;</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search topics..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search topics"
        />
        {value && (
          <button
            className={styles.searchClear}
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
      {resultCount !== null && resultCount !== undefined && (
        <div className={styles.searchMeta}>
          <span className={styles.resultCount}>
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </span>
        </div>
      )}
    </div>
  );
}
