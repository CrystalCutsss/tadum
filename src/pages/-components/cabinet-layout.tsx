// Сборка оболочки кабинета: виджеты не импортируют друг друга, поэтому переключатели и SupportBar
// подставляются здесь, на уровне pages.
import { useRouter, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import type { Family } from '@/shared/config';
import { CabinetShell, LoadError } from '@/widgets/cabinet-shell';
import { LanguageSwitch } from '@/widgets/language-switch';
import { RoleSwitch } from '@/widgets/role-switch';
import { SupportBar } from '@/widgets/support-bar';

export function CabinetLayout({ family, children, support = true }: { family: Family; children: ReactNode; support?: boolean }) {
  // Помощь и главная клиента показывают свой SupportBar (раздел контактов, готовый текст по статусу).
  const ownSupport = useRouterState({ select: (s) => s.location.pathname.endsWith('/help') || s.location.pathname === '/c/home' });
  return (
    <CabinetShell
      family={family}
      languageSwitch={<LanguageSwitch />}
      renderRoleSwitch={(current) => <RoleSwitch current={current} />}
      support={support && !ownSupport ? <SupportBar /> : null}
    >
      {children}
    </CabinetShell>
  );
}

export function CabinetRouteError({ family }: { family: Family }) {
  const router = useRouter();
  return (
    <CabinetLayout family={family} support={false}>
      <LoadError onRetry={() => void router.invalidate()} support={<SupportBar context="error" />} />
    </CabinetLayout>
  );
}
