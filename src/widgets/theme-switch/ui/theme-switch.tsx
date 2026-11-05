// Выбор темы в настройках (D-025): «Как в системе» · «Светлая» · «Тёмная» — кнопки с подписями.
import { useTranslation } from 'react-i18next';

import { useSwitchTheme } from '@/features/switch-theme';
import type { ThemeChoice } from '@/shared/lib';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui';

const CHOICES = ['system', 'light', 'dark'] as const satisfies readonly ThemeChoice[];

export function ThemeSwitch({ labelledBy }: { labelledBy?: string }) {
  const { t } = useTranslation();
  const { choice, choose } = useSwitchTheme();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={choice}
      onValueChange={(v) => {
        if (v) choose(v as ThemeChoice);
      }}
      aria-labelledby={labelledBy}
    >
      {CHOICES.map((c) => (
        <ToggleGroupItem key={c} value={c} className="min-h-11">
          {t(`theme.${c}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
