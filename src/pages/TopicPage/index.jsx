import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { topicsById } from '../../data/topics';
import { useAppContext } from '../../context/AppContext';
import styles from './TopicPage.module.css';

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { progress, playground } = useAppContext();

  const topic = topicsById[topicId];

  // Mark topic visited and remember last location
  useEffect(() => {
    if (topic) {
      progress.markVisited(topicId);
      localStorage.setItem('njip_last_topic', topicId);
    }
  }, [topicId, topic, progress]);

  if (!topic) {
    return (
      <div className={styles.notFound}>
        <h2>Topic not found</h2>
        <p>Topic "<strong>{topicId}</strong>" doesn't exist.</p>
        <button onClick={() => navigate('/topic/overview')}>Go to Overview</button>
      </div>
    );
  }

  return (
    <article className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.category}>{topic.category}</span>
        <button
          className={styles.tryBtn}
          onClick={() => playground.loadCode(topic.starterCode)}
          title="Load this topic's code into the playground"
        >
          ⌨ Try in Playground
        </button>
      </div>

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: topic.content }}
      />
    </article>
  );
}
