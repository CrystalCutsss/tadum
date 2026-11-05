// Оболочка кабинета (01-cabinet-structure.md §2 — черновик, взят как гипотеза; расхождения — A-040).
// Одна для обеих ролей: меняются пункты навигации и данные. SupportBar — внизу контента каждого экрана.
// Виджеты не импортируют друг друга (FSD): переключатели и SupportBar приходят слотами, собирает их pages/-components/cabinet-layout.
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { companyQuery } from '@/entities/application';
import { familiesOf, sessionQuery } from '@/entities/session';
import { supplierQuery } from '@/entities/supplier';
import type { Family } from '@/shared/config';

import { AppHeader } from './app-header';
import { OfflineBanner, StorageBanner } from './banners';
import { BottomNav, SideNav } from './nav';

export interface CabinetShellProps {
  family: Family;
  children: ReactNode;
  languageSwitch: ReactNode;
  /** Переключатель ролей — показывается только для dual. */
  renderRoleSwitch?: (current: Family) => ReactNode;
  /** SupportBar внизу контента. */
  support?: ReactNode;
}

export function CabinetShell({ family, children, languageSwitch, renderRoleSwitch, support }: CabinetShellProps) {
  const { i18n } = useTranslation();
  const session = useQuery(sessionQuery);
  const company = useQuery({ ...companyQuery, enabled: family === 'client' });
  const supplier = useQuery({ ...supplierQuery, enabled: family === 'supplier' });
  const dual = familiesOf(session.data?.roles ?? []).length > 1;
  const name =
    family === 'client'
      ? (i18n.language === 'ar' ? company.data?.name_ar : undefined) ?? company.data?.name ?? null
      : supplier.data?.name ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AppHeader family={family} contextName={name} languageSwitch={languageSwitch} roleSwitch={dual && renderRoleSwitch ? renderRoleSwitch(family) : null} />
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4">
        <SideNav family={family} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 pt-4 pb-24 xl:pb-8">
          <OfflineBanner />
          <StorageBanner />
          {children}
          {support}
        </main>
      </div>
      <BottomNav family={family} />
    </div>
  );
}
