import styles from './Sidebar.module.css';

export default function SearchBar({ value, onChange }) {
  return (
    <div className={styles.searchWrap}>
      <span className={styles.searchIcon}>🔍</span>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search topics…"
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
          ×
        </button>
      )}
    </div>
  );
}
