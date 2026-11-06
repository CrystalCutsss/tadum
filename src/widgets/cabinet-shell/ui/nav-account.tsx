// Аккаунт внизу сайдбара (решения Кирилла 2026-11-06): без аватара — название компании клиента или поставщика,
// под ним текущая роль. Меню по примеру shadcn Dropdown Menu «Complex» (без шорткатов, радиусы пресета): группа «Account»
// со сменой роли Client / Supplier сверху вниз (только dual), разделитель, группа «Настройки» и выход с подтверждением.
// Подсказка dual «у вас есть и кабинет поставщика» — один раз: на десктопе поповером у кнопки аккаунта, на телефоне — блоком в шторке.
import { RiExpandUpDownLine, RiLogoutBoxRLine, RiSettings3Line, RiStore2Line, RiUser3Line } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LogoutDialog } from '@/features/logout';
import { roleHint, useSwitchRole } from '@/features/switch-role';
import { track } from '@/shared/analytics';
import type { Family } from '@/shared/config';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Ltr,
  Popover,
  PopoverAnchor,
  PopoverContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  useSidebar,
} from '@/shared/ui';

import { settingsOf } from '../model/nav';

export interface NavAccountProps {
  family: Family;
  /** Название компании клиента или поставщика; null после загрузки — показываем номер. */
  name: string | null;
  /** Название ещё грузится — вместо номера плейсхолдер, чтобы номер не мелькал перед названием. */
  nameLoading: boolean;
  phone: string | null;
  dual: boolean;
  /** Подсказка dual: состояние живёт в оболочке, потому что шторка на телефоне перемонтирует меню. */
  hint: { pending: boolean; dismiss: () => void };
}

export function NavAccount({ family, name, nameLoading, phone, dual, hint }: NavAccountProps) {
  const { t, i18n } = useTranslation();
  const { isMobile, openMobile } = useSidebar();
  const switchRole = useSwitchRole(family);
  const [logoutOpen, setLogoutOpen] = useState(false);
  // На телефоне кнопка аккаунта видна только в открытой шторке — подсказка ждёт её открытия.
  const hintVisible = dual && hint.pending && (!isMobile || openMobile);

  useEffect(() => {
    // Подсказка показывается один раз за всё время: флаг ставится при первом показе (шторка может перемонтировать меню).
    if (!hintVisible || roleHint.seen()) return;
    track('role_hint_shown', {});
    roleHint.markSeen();
  }, [hintVisible]);

  const dismissHint = () => {
    hint.dismiss();
    track('role_hint_dismissed', {});
  };

  const role = t(family === 'client' ? 'role.client' : 'role.supplier');
  // На десктопе меню открывается вбок от сайдбара — в сторону контента (end), на телефоне — вверх.
  const side = isMobile ? 'top' : i18n.dir() === 'rtl' ? 'left' : 'right';

  const hintBody = (
    <>
      <p className="text-sm">{t('role.hint_supplier')}</p>
      <Button size="sm" className="self-end" onClick={dismissHint}>
        {t('role.hint_dismiss')}
      </Button>
    </>
  );

  return (
    <SidebarMenu>
      {/* На телефоне сайдбар — модальная шторка: поповер вне неё недоступен, поэтому подсказка — блоком над аккаунтом. */}
      {isMobile && hintVisible ? (
        <li role="status" className="flex flex-col gap-3 rounded-lg border bg-popover p-3 text-popover-foreground">
          {hintBody}
        </li>
      ) : null}
      <SidebarMenuItem>
        <Popover open={hintVisible && !isMobile} onOpenChange={(open) => (open ? undefined : dismissHint())}>
          {/* Немодальное меню: модальное оставляло aria-hidden и «зависший» диалог выхода после закрытия (истории CabinetShell). */}
          <DropdownMenu modal={false}>
            <PopoverAnchor asChild>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground">
                  {/* Доступное имя: «Аккаунт» + видимые название и роль (видимый текст должен входить в имя). */}
                  <span className="sr-only">{t('nav.account')}</span>
                  <div className="grid min-w-0 flex-1 text-start leading-tight">
                    {name ? (
                      <span className="truncate text-sm font-medium">{name}</span>
                    ) : nameLoading ? (
                      <Skeleton className="h-4 w-28" />
                    ) : (
                      <span className="truncate text-sm font-medium">{phone ? <Ltr>{phone}</Ltr> : null}</span>
                    )}
                    <span className="truncate text-xs">{role}</span>
                  </div>
                  <Icon icon={RiExpandUpDownLine} className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </PopoverAnchor>
            <DropdownMenuContent className="min-w-44" side={side} align="end" sideOffset={4}>
              {dual ? (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t('nav.account')}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={family}
                      onValueChange={(v) => {
                        if (v === 'client' || v === 'supplier') switchRole(v);
                      }}
                    >
                      <DropdownMenuRadioItem value="client">
                        <Icon icon={RiUser3Line} className="size-4" />
                        {t('role.client')}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="supplier">
                        <Icon icon={RiStore2Line} className="size-4" />
                        {t('role.supplier')}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to={settingsOf(family)}>
                    <Icon icon={RiSettings3Line} className="size-4" />
                    {t('nav.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}>
                  <Icon icon={RiLogoutBoxRLine} className="size-4" />
                  {t('help.logout')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <PopoverContent side={side} aria-label={t('role.hint_supplier')} className="flex flex-col gap-3">
            {hintBody}
          </PopoverContent>
        </Popover>
        <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
