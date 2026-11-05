// Тема: system | light | dark (D-016, D-025). По умолчанию — системная; ручной выбор только в настройках.
// Выбор хранится через storage('theme'); класс .dark на <html>; <meta name="theme-color"> для обеих тем.
// Без вспышки при загрузке: index.html до бандла ставит .dark по тому же ключу хранилища.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { storage } from '@/shared/lib';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

// Цвет строки состояния браузера = --background пресета (tokens.css) в hex: oklch(1 0 0) и oklch(0.148 0.004 228.8).
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#ffffff', dark: '#090b0c' };

function readChoice(): ThemeChoice {
  const v = storage.get(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme, choice: ThemeChoice): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  // При ручном выборе обе мета-строки показывают выбранную тему; при системной — каждая свою.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const forDark = meta.media.includes('dark');
    meta.content = choice === 'system' ? THEME_COLOR[forDark ? 'dark' : 'light'] : THEME_COLOR[resolved];
  }
}

interface ThemeContextValue {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme = choice === 'system' ? system : choice;

  useEffect(() => {
    applyTheme(resolved, choice);
  }, [resolved, choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    storage.set(STORAGE_KEY, next);
    setChoiceState(next);
    // Событие theme_changed отправит фича switch-theme (блок 6b).
  }, []);

  const value = useMemo(() => ({ choice, resolved, setChoice }), [choice, resolved, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme вне ThemeProvider');
  return ctx;
}
