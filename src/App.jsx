import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Playground from './components/Playground';
import TopicPage from './pages/TopicPage';
import styles from './App.module.css';

function AppLayout() {
  const lastTopic = localStorage.getItem('njip_last_topic') ?? 'overview';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<Navigate to={`/topic/${lastTopic}`} replace />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="*" element={<Navigate to="/topic/overview" replace />} />
        </Routes>
      </main>
      <Playground />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
