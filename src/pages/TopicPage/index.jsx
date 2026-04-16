import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsById } from '../../data/topics';
import { useAppContext } from '../../context/AppContext';
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
        btn.textContent = '✓ Copied!';
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

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { progress, playground, bookmarks, themeCtx } = useAppContext();
  const contentRef = useRef(null);

  const topic = topicsById[topicId];

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

  if (!topic) {
    return (
      <div className={styles.notFound}>
        <h2>Topic not found</h2>
        <p>Topic "<strong>{topicId}</strong>" doesn't exist.</p>
        <button onClick={() => navigate('/topic/overview')}>Go to Overview</button>
      </div>
    );
  }

  const readTime = getReadingTime(topic.content);
  const isBookmarked = bookmarks.isBookmarked(topic.id);

  return (
    <article className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.themeToggle}
            onClick={themeCtx.toggle}
            title={`Switch to ${themeCtx.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {themeCtx.theme === 'dark' ? '☀ Light' : '☽ Dark'}
          </button>
          <span className={styles.category}>{topic.category}</span>
          <span className={styles.readTime}>⏱ {readTime} min read</span>
        </div>
        <div className={styles.topBarRight}>
          <button
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={() => bookmarks.toggle(topic.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button
            className={styles.tryBtn}
            onClick={() => playground.loadCode(topic.starterCode, topic.editorMode || 'javascript')}
            title="Load this topic's code into the playground"
          >
            {topic.editorMode === 'sql' ? '🐘 Try SQL' : topic.editorMode === 'mongodb' ? '🍃 Try MongoDB' : '⌨ Try in Playground'}
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: topic.content }}
      />
    </article>
  );
}
