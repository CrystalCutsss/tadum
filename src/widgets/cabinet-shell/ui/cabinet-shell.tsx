// Оболочка кабинета (решение Кирилла 2026-11-06; основа — сетка shadcn sidebar-08): сайдбар на сером фоне,
// контент — в контейнере с обводкой (SidebarInset), на всю ширину. Внутри контента — сетка из трёх колонок,
// которая на узких экранах складывается в одну; текущий контент экранов занимает 2 колонки из 3 (третья — под будущие блоки).
// Сайдбар скрывается кнопкой в шапке, контент растягивается; состояние хранится через shared/lib/storage (D-072).
// Одна оболочка для обеих ролей: меняются пункты меню и данные. Виджеты не импортируют друг друга (FSD):
// переключатели языка и темы и блок помощи приходят слотами, собирает их pages/-components/cabinet-layout.
import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { companyQuery } from '@/entities/application';
import { familiesOf, sessionQuery } from '@/entities/session';
import { roleHint } from '@/features/switch-role';
import { supplierQuery } from '@/entities/supplier';
import type { Family } from '@/shared/config';
import { formatNationalInput, nationalDigits, storage } from '@/shared/lib';
import { SidebarInset, SidebarProvider } from '@/shared/ui';

import { crumbsFor } from '../model/nav';
import { AsideSlotContext } from './cabinet-aside';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { OfflineBanner, StorageBanner } from './banners';
import { NavAccount } from './nav-account';

const SIDEBAR_KEY = 'sidebar:open';

export interface CabinetShellProps {
  family: Family;
  children: ReactNode;
  languageSwitch: ReactNode;
  /** Кнопка темы в шапке, после разделителя. */
  themeToggle: ReactNode;
  /** Блок помощи внизу сайдбара. */
  support?: ReactNode;
}

/** Номер для показа: +966 5X XXX XXXX. */
const displayPhone = (phone: string) => `+966 ${formatNationalInput(nationalDigits(phone))}`;

export function CabinetShell({ family, children, languageSwitch, themeToggle, support }: CabinetShellProps) {
  const { i18n } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useQuery(sessionQuery);
  const families = familiesOf(session.data?.roles ?? []);
  // dual: названия обеих ролей грузятся сразу, чтобы после переключения роли аккаунт не мигал.
  const company = useQuery({ ...companyQuery, enabled: family === 'client' || families.includes('client') });
  const supplier = useQuery({ ...supplierQuery, enabled: family === 'supplier' || families.includes('supplier') });
  const [open, setOpen] = useState(() => storage.get(SIDEBAR_KEY) !== '0');
  const [aside, setAside] = useState<HTMLElement | null>(null);
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const slots = useMemo(() => ({ aside, header }), [aside, header]);
  // «Уже видел подсказку dual» читается один раз за монтирование оболочки.
  const [hintPending, setHintPending] = useState(() => !roleHint.seen());

  const dual = families.length > 1;
  const contextName =
    family === 'client'
      ? (i18n.language === 'ar' ? company.data?.name_ar : undefined) ?? company.data?.name ?? null
      : supplier.data?.name ?? null;
  // Пока название грузится — плейсхолдер; номер — только если название получить не удалось (A-055).
  const nameLoading = (family === 'client' ? company : supplier).isPending;
  const phone = session.data?.phone ? displayPhone(session.data.phone) : null;

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        storage.set(SIDEBAR_KEY, next ? '1' : '0');
      }}
    >
      <AppSidebar
        family={family}
        support={support}
        account={<NavAccount family={family} name={contextName} nameLoading={nameLoading} phone={phone} dual={dual} hint={{ pending: hintPending, dismiss: () => setHintPending(false) }} />}
      />
      <SidebarInset className="min-w-0 text-foreground">
        <AppHeader crumbs={crumbsFor(family, pathname)} languageSwitch={languageSwitch} themeToggle={themeToggle} />
        <div className="grid flex-1 grid-cols-1 content-start gap-4 p-4 pb-safe-bottom lg:grid-cols-3">
          {/* Заголовок экрана (CabinetPageHeader) — на всю ширину; пустой не занимает места. */}
          <div ref={setHeader} className="min-w-0 empty:hidden lg:col-span-3" />
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
            <OfflineBanner />
            <StorageBanner />
            <AsideSlotContext.Provider value={slots}>{children}</AsideSlotContext.Provider>
          </div>
          {/* Третья колонка (≥1024 px): блоки экрана через CabinetAside. Пустая — не занимает места. */}
          <div ref={setAside} className="hidden min-w-0 flex-col gap-4 lg:flex" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
