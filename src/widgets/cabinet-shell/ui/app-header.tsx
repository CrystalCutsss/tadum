// Шапка контентной области (решение Кирилла 2026-11-06): кнопка скрытия/раскрытия сайдбара, заголовок страницы
// в виде хлебных крошек (пока один уровень), переключатель языка (ghost) — прижат к концу строки (end) в RTL и LTR.
// Переключателя темы в шапке нет (D-025).
import { Link } from '@tanstack/react-router';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Separator, SidebarTrigger } from '@/shared/ui';

import type { Crumb } from '../model/nav';

export interface AppHeaderProps {
  crumbs: readonly Crumb[];
  languageSwitch: ReactNode;
}

export function AppHeader({ crumbs, languageSwitch }: AppHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b px-2 md:px-4">
      <SidebarTrigger aria-label={t('nav.toggle_sidebar')} className="min-h-11 min-w-11" />
      <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
      <Breadcrumb aria-label={t('nav.breadcrumb')} className="min-w-0 flex-1">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <Fragment key={c.labelKey}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {c.to && i < crumbs.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link to={c.to}>{t(c.labelKey)}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate font-medium">{t(c.labelKey)}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto shrink-0">{languageSwitch}</div>
    </header>
  );
}
