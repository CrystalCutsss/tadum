// Ручной выбор темы — только в настройках (D-025); событие theme_changed (SC-10 §1.5).
import { track } from '@/shared/analytics';
import { useTheme, type ThemeChoice } from '@/shared/lib';

export function useSwitchTheme(): { choice: ThemeChoice; choose: (next: ThemeChoice) => void } {
  const { choice, setChoice } = useTheme();
  return {
    choice,
    choose: (next) => {
      if (next === choice) return;
      setChoice(next);
      track('theme_changed', { to: next });
    },
  };
}
