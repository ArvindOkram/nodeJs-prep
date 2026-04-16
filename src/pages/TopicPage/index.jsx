import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { topicsById, topics } from '../../data/topics';
import { useAppContext } from '../../context/AppContext';
import { CATEGORY_ICONS } from '../../utils/constants';
import styles from './TopicPage.module.css';

function getReadingTime(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').length;
  return Math.max(1, Math.round(words / 200));
}

function addCopyButtons(container) {
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return; // already added
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')?.innerText ?? pre.innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    pre.appendChild(btn);
  });
}

function getAdjacentTopics(currentId) {
  const idx = topics.findIndex((t) => t.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? topics[idx - 1] : null,
    next: idx < topics.length - 1 ? topics[idx + 1] : null,
  };
}

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { progress, playground, bookmarks } = useAppContext();
  const contentRef = useRef(null);
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fadeKey, setFadeKey] = useState(topicId);

  const topic = topicsById[topicId];
  const { prev, next } = getAdjacentTopics(topicId);

  // Trigger fade animation on topic change
  useEffect(() => {
    setFadeKey(topicId);
  }, [topicId]);

  useEffect(() => {
    if (topic) {
      progress.markVisited(topicId);
      localStorage.setItem('njip_last_topic', topicId);

      // Auto-switch playground to the right editor mode for DB topics
      const mode = topic.editorMode || 'javascript';
      if (mode !== 'javascript' && playground.editorMode !== mode) {
        playground.loadCode(topic.starterCode, mode);
      } else if (mode === 'javascript' && playground.editorMode !== 'javascript') {
        playground.setEditorMode('javascript');
      }
    }
  }, [topicId, topic, progress, playground]);

  // Inject copy buttons after content renders
  useEffect(() => {
    if (contentRef.current) addCopyButtons(contentRef.current);
  }, [topicId]);

  // Scroll progress tracking
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Find the scrollable parent (main element in layout)
    const scrollable = el.closest('main') || el.parentElement;
    if (!scrollable) return;
    const scrollTop = scrollable.scrollTop;
    const scrollHeight = scrollable.scrollHeight - scrollable.clientHeight;
    if (scrollHeight > 0) {
      setScrollProgress(Math.min((scrollTop / scrollHeight) * 100, 100));
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.closest('main') || el.parentElement;
    if (!scrollable) return;
    scrollable.addEventListener('scroll', handleScroll, { passive: true });
    // Reset on topic change
    setScrollProgress(0);
    return () => scrollable.removeEventListener('scroll', handleScroll);
  }, [topicId, handleScroll]);

  if (!topic) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>404</div>
        <h2>Topic not found</h2>
        <p>Topic "<strong>{topicId}</strong>" doesn't exist.</p>
        <button onClick={() => navigate('/topic/overview')}>Go to Overview</button>
      </div>
    );
  }

  const readTime = getReadingTime(topic.content);
  const isBookmarked = bookmarks.isBookmarked(topic.id);
  const categoryIcon = CATEGORY_ICONS[topic.category] || '';

  return (
    <article className={styles.page} ref={scrollRef} key={fadeKey}>
      {/* Reading progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.category}>
            {categoryIcon && <span className={styles.categoryIcon}>{categoryIcon}</span>}
            {topic.category}
          </span>
          <span className={styles.readTime}>
            <svg className={styles.clockIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {readTime} min read
          </span>
        </div>
        <div className={styles.topBarRight}>
          <button
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={() => bookmarks.toggle(topic.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
          >
            <svg className={styles.starIcon} viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={styles.tryBtn}
            onClick={() => playground.loadCode(topic.starterCode, topic.editorMode || 'javascript')}
            title="Load this topic's code into the playground"
          >
            <svg className={styles.playIcon} viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
            {topic.editorMode === 'sql' ? 'Try SQL' : topic.editorMode === 'mongodb' ? 'Try MongoDB' : 'Try in Playground'}
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: topic.content }}
      />

      {/* Prev / Next Navigation */}
      {(prev || next) && (
        <nav className={styles.navCards}>
          {prev ? (
            <Link to={`/topic/${prev.id}`} className={styles.navCard}>
              <span className={styles.navLabel}>
                <svg className={styles.navArrow} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 12L6 8l4-4" />
                </svg>
                Previous
              </span>
              <span className={styles.navTitle}>{prev.title}</span>
              <span className={styles.navCategory}>{prev.category}</span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link to={`/topic/${next.id}`} className={`${styles.navCard} ${styles.navCardNext}`}>
              <span className={styles.navLabel}>
                Next
                <svg className={styles.navArrow} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12l4-4-4-4" />
                </svg>
              </span>
              <span className={styles.navTitle}>{next.title}</span>
              <span className={styles.navCategory}>{next.category}</span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}
    </article>
  );
}
