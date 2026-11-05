// Шапка: логотип → home, название компании или поставщика, RoleSwitch (dual), LanguageSwitch, меню (помощь, выход).
// Переключателя темы в шапке нет (D-025).
import { RiMenuLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LogoutDialog } from '@/features/logout';
import { ROUTES, homeOf, type Family } from '@/shared/config';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Wordmark,
} from '@/shared/ui';

export interface AppHeaderProps {
  family: Family;
  /** Название активного контекста: компания клиента или поставщик (01-cabinet-structure.md §4). */
  contextName: string | null;
  languageSwitch: ReactNode;
  /** null — не dual. */
  roleSwitch: ReactNode;
}

export function AppHeader({ family, contextName, languageSwitch, roleSwitch }: AppHeaderProps) {
  const { t } = useTranslation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <Link to={homeOf(family)} className="shrink-0">
          <Wordmark />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{contextName}</p>
        {roleSwitch}
        {languageSwitch}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t('nav.more')}>
              <Icon icon={RiMenuLine} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={family === 'client' ? ROUTES.clientHelp : ROUTES.supplierHelp}>{t('nav.help')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setLogoutOpen(true)}>{t('help.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </header>
  );
}
