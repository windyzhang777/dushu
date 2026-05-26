import { THEMES, type Theme as _Theme } from '@dushu/shared';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dushu-web-theme';
export type Theme = _Theme | 'system';

const resolveTheme = (theme: Theme): Theme => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export default function useTheme(defaultTheme: Theme = 'system') {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as _Theme;
    return THEMES.includes(saved) ? saved : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = resolveTheme(theme);

    // Remove all theme classes, add the active one
    root.classList.remove(...THEMES);
    root.classList.add(resolved);

    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === 'system') {
      const handleChange = () => {
        root.classList.remove(...THEMES);
        root.classList.add(resolveTheme('system'));
      };

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return { theme, setTheme };
}
