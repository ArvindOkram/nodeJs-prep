import { createContext, useContext } from 'react';
import { useProgress } from '../hooks/useProgress';
import { usePlayground } from '../hooks/usePlayground';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTheme } from '../hooks/useTheme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const progress = useProgress();
  const playground = usePlayground();
  const bookmarks = useBookmarks();
  const themeCtx = useTheme();

  return (
    <AppContext.Provider value={{ progress, playground, bookmarks, themeCtx }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
