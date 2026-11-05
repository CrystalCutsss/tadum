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
  // На экране помощи контакты — отдельный раздел; второй SupportBar внизу не нужен.
  const onHelp = useRouterState({ select: (s) => s.location.pathname.endsWith('/help') });
  return (
    <CabinetShell
      family={family}
      languageSwitch={<LanguageSwitch />}
      renderRoleSwitch={(current) => <RoleSwitch current={current} />}
      support={support && !onHelp ? <SupportBar /> : null}
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
