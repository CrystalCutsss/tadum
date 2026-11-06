// Сборка оболочки кабинета: виджеты не импортируют друг друга, поэтому переключатели языка и темы и блок помощи
// подставляются здесь, на уровне pages. Блок помощи живёт в сайдбаре на всех экранах кабинета.
import { useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import type { Family } from '@/shared/config';
import { CabinetShell, LoadError } from '@/widgets/cabinet-shell';
import { LanguageSwitch } from '@/widgets/language-switch';
import { SupportBar, SupportCard } from '@/widgets/support-bar';
import { ThemeToggle } from '@/widgets/theme-switch';

export function CabinetLayout({ family, children }: { family: Family; children: ReactNode }) {
  return (
    <CabinetShell family={family} languageSwitch={<LanguageSwitch />} themeToggle={<ThemeToggle />} support={<SupportCard />}>
      {children}
    </CabinetShell>
  );
}

export function CabinetRouteError({ family }: { family: Family }) {
  const router = useRouter();
  return (
    <CabinetLayout family={family}>
      <LoadError onRetry={() => void router.invalidate()} support={<SupportBar context="error" />} />
    </CabinetLayout>
  );
}
