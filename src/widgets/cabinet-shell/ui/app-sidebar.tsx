// Боковое меню кабинета (решение Кирилла 2026-11-06, основа — shadcn sidebar-08, variant="inset").
// Сверху вниз: словесный знак → основное меню (Dashboard, Documents, без вложенных) → внизу: блок помощи и аккаунт.
// На телефоне — шторка по кнопке в шапке, как в shadcn; переход на другой экран закрывает шторку.
import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { homeOf, type Family } from '@/shared/config';
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

import { NAV } from '../model/nav';

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

  return (
    <Sidebar variant="inset" mobileTitle={t('nav.mobile_title')} mobileDescription={t('nav.mobile_description')}>
      <SidebarHeader>
        <Link to={homeOf(family)} className="flex min-h-11 items-center self-start rounded-md px-2">
          <Wordmark variant="dot" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label={t('nav.main')}>
              <SidebarMenu>
                {NAV[family].map((n) => (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={pathname === n.to || pathname.startsWith(`${n.to}/`)} className="min-h-11">
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
