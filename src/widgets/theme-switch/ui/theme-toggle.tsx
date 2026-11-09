// Кнопка темы в шапке кабинета (Кирилл 2026-11-06), как ModeSwitcher на ui.shadcn.com: ghost-кнопка с иконкой,
// по нажатию светлая ↔ тёмная от темы, которая видна сейчас. «Как в системе» — в настройках (ThemeSwitch, D-025).
import { useTranslation } from 'react-i18next';

import { useSwitchTheme } from '@/features/switch-theme';
import { Button, Icon, ThemeToggleIcon } from '@/shared/ui';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { toggle } = useSwitchTheme();
  return (
    <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t('theme.toggle')} title={t('theme.toggle')} onClick={toggle}>
      <Icon icon={ThemeToggleIcon} />
    </Button>
  );
}
