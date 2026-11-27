// Боковое меню кабинета (решение Кирилла 2026-11-06, основа — shadcn sidebar-08, variant="inset").
// Сверху вниз: словесный знак → основное меню (Home, Documents, без вложенных) → внизу: блок помощи и аккаунт.
// На телефоне — шторка по кнопке в шапке, как в shadcn; переход на другой экран закрывает шторку.
// Активный пункт выделяется только фоном; начертание пунктов — medium, как у названия компании и «Have a question?» (Кирилл 2026-11-06).
import { useQuery } from '@tanstack/react-query';
import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { hasClientHome, limitQuery } from '@/entities/limit';
import type { Family } from '@/shared/config';
import {
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  Wordmark,
} from '@/shared/ui';

import { navFor } from '../model/nav';

export interface AppSidebarProps {
  family: Family;
  /** Блок помощи (SupportCard) — над аккаунтом. */
  support?: ReactNode;
  account: ReactNode;
}

export function AppSidebar({ family, support, account }: AppSidebarProps) {
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Любой переход (меню, логотип, «Настройки», смена роли) закрывает шторку на телефоне.
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);
  // «Home» клиента — по лимиту из кэша (D-098): опрос на «Заявке» обновляет его, пункт появляется без перезагрузки.
  const limit = useQuery({ ...limitQuery, enabled: family === 'client' });
  const items = navFor(family, { clientHome: hasClientHome(limit.data) });

  return (
    <Sidebar variant="inset" mobileTitle={t('nav.mobile_title')} mobileDescription={t('nav.mobile_description')}>
      <SidebarHeader>
        <Link to={items[0]?.to ?? '/'} className="flex min-h-11 items-center self-start rounded-md px-2">
          <Wordmark variant="dot" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label={t('nav.main')}>
              <SidebarMenu>
                {items.map((n) => (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={pathname === n.to || pathname.startsWith(`${n.to}/`)} className="min-h-11 font-medium">
                      <Link to={n.to}>
                        <Icon icon={n.icon} />
                        <span>{t(n.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3">
        {support}
        {account}
      </SidebarFooter>
    </Sidebar>
  );
}
