import { createContext, useContext } from 'react';
import { useProgress } from '../hooks/useProgress';
import { usePlayground } from '../hooks/usePlayground';

const AppContext = createContext(null);

/**
 * Global app state provider.
 * Keeps progress tracking and playground state available everywhere.
 */
export function AppProvider({ children }) {
  const progress = useProgress();
  const playground = usePlayground();

  return (
    <AppContext.Provider value={{ progress, playground }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
