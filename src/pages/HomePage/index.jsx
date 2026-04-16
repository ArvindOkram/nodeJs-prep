import { Link } from 'react-router-dom';
import { topics, topicsByCategory } from '../../data/topics';
import { SECTIONS, STORAGE_KEYS } from '../../utils/constants';
import { useAppContext } from '../../context/AppContext';
import styles from './HomePage.module.css';

const SECTION_DESCRIPTIONS = {
  'Languages': 'JavaScript fundamentals to advanced patterns',
  'Node.js': 'Core concepts, async patterns & scaling',
  'Backend': 'Web frameworks, security & DevOps',
  'Databases': 'PostgreSQL, MongoDB, Redis & more',
  'Messaging & Workflows': 'Kafka & Temporal deep dives',
  'Search & Analytics': 'Elasticsearch mastery',
  'Interview Prep': 'Tips, patterns & common questions',
};

function getFirstTopicInSection(section) {
  for (const cat of section.categories) {
    const catTopics = topicsByCategory[cat];
    if (catTopics && catTopics.length > 0) {
      return catTopics[0].id;
    }
  }
  return 'overview';
}

function getTopicCountForSection(section) {
  return section.categories.reduce((sum, cat) => {
    return sum + (topicsByCategory[cat]?.length ?? 0);
  }, 0);
}

export default function HomePage() {
  const { progress } = useAppContext();
  const lastTopic = localStorage.getItem(STORAGE_KEYS.LAST_TOPIC);
  const hasProgress = progress.visited.length > 0;

  const startLink = hasProgress && lastTopic
    ? `/topic/${lastTopic}`
    : `/topic/${topics[0]?.id ?? 'overview'}`;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <h1 className={styles.title}>
          Master Your Next<br />
          <span className={styles.titleGradient}>Interview</span>
        </h1>
        <p className={styles.subtitle}>
          Interactive preparation for Node.js, JavaScript, Databases & more
        </p>
        <div className={styles.ctas}>
          <Link to={startLink} className={styles.ctaPrimary}>
            Start Learning
          </Link>
          {hasProgress && lastTopic && (
            <Link to={`/topic/${lastTopic}`} className={styles.ctaSecondary}>
              Continue where you left off
              <span className={styles.arrow}>&rarr;</span>
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>&#128218;</span>
          <span className={styles.statNumber}>{topics.length}+</span>
          <span className={styles.statLabel}>Topics</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>&#128193;</span>
          <span className={styles.statNumber}>{SECTIONS.length}</span>
          <span className={styles.statLabel}>Sections</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>&#9000;</span>
          <span className={styles.statNumber}>3</span>
          <span className={styles.statLabel}>Editors</span>
        </div>
        {hasProgress && (
          <div className={`${styles.statCard} ${styles.statCardProgress}`}>
            <span className={styles.statIcon}>&#127942;</span>
            <span className={styles.statNumber}>{progress.percentage}%</span>
            <span className={styles.statLabel}>Complete</span>
          </div>
        )}
      </section>

      {/* Sections Grid */}
      <section className={styles.sectionsArea}>
        <h2 className={styles.sectionHeading}>Explore Topics</h2>
        <div className={styles.sectionsGrid}>
          {SECTIONS.map((section, i) => {
            const firstTopic = getFirstTopicInSection(section);
            const topicCount = getTopicCountForSection(section);
            return (
              <Link
                key={section.name}
                to={`/topic/${firstTopic}`}
                className={styles.sectionCard}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className={styles.sectionCardInner}>
                  <span className={styles.sectionIcon}>{section.icon}</span>
                  <div className={styles.sectionInfo}>
                    <h3 className={styles.sectionName}>{section.name}</h3>
                    <p className={styles.sectionDesc}>
                      {SECTION_DESCRIPTIONS[section.name]}
                    </p>
                    <span className={styles.sectionMeta}>
                      {topicCount} topic{topicCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={`${styles.featureIconWrap} ${styles.featureIconBlue}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>Live Code Editor</h3>
          <p className={styles.featureDesc}>
            Write and run JavaScript, SQL, and MongoDB queries right in your browser
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={`${styles.featureIconWrap} ${styles.featureIconGreen}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>Track Progress</h3>
          <p className={styles.featureDesc}>
            Mark topics as visited and bookmark your favorites
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={`${styles.featureIconWrap} ${styles.featureIconWarm}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h3 className={styles.featureTitle}>Rich Content</h3>
          <p className={styles.featureDesc}>
            Detailed explanations with code examples, tables, and Q&A blocks
          </p>
        </div>
      </section>
    </div>
  );
}
