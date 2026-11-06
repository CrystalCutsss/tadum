// Ручной выбор темы: «Как в системе / Светлая / Тёмная» — в настройках (D-025), быстрый переключатель
// светлая ↔ тёмная — в шапке кабинета (Кирилл 2026-11-06); событие theme_changed (SC-10 §1.5).
import { track } from '@/shared/analytics';
import { useTheme, type ResolvedTheme, type ThemeChoice } from '@/shared/lib';

export function useSwitchTheme(): {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  choose: (next: ThemeChoice) => void;
  /** Светлая ↔ тёмная от темы, которая видна сейчас (как ModeSwitcher на ui.shadcn.com). */
  toggle: () => void;
} {
  const { choice, resolved, setChoice } = useTheme();
  const choose = (next: ThemeChoice) => {
    if (next === choice) return;
    setChoice(next);
    track('theme_changed', { to: next });
  };
  return { choice, resolved, choose, toggle: () => choose(resolved === 'dark' ? 'light' : 'dark') };
}
