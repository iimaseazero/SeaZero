'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Provides a `theme` value ('dark' | 'light') and a `toggleTheme` function.
 * Persists preference to localStorage and applies a `data-theme` attribute
 * on `<html>` so CSS can swap variables via `:root[data-theme="light"]`.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // The inline script in the root layout has already set data-theme before
  // paint. This only syncs React's copy so the toggle shows the right icon;
  // it must not re-apply the attribute or it would fight the script.
  useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied === 'light') setTheme('light');
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sz-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
