import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../utils/constants';
import { topics } from '../data/topics';

/**
 * Tracks which topics the user has visited.
 * Returns visited set, a function to mark a topic visited, and a progress %.
 */
export function useProgress() {
  const [visited, setVisited] = useLocalStorage(
    STORAGE_KEYS.VISITED_TOPICS,
    []
  );

  const markVisited = useCallback(
    (topicId) => {
      setVisited((prev) =>
        prev.includes(topicId) ? prev : [...prev, topicId]
      );
    },
    [setVisited]
  );

  const percentage = Math.round((visited.length / topics.length) * 100);

  return { visited, markVisited, percentage };
}
