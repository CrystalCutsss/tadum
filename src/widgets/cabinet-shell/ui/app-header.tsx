// Шапка контентной области (решение Кирилла 2026-11-06): кнопка скрытия/раскрытия сайдбара, заголовок страницы
// в виде хлебных крошек — только когда есть вложенные страницы (решение Кирилла 2026-11-09: один уровень не показываем), в конце строки (end) в RTL и LTR — переключатель языка (ghost)
// и через разделитель — кнопка темы светлая ↔ тёмная, как на ui.shadcn.com (Кирилл 2026-11-06, уточняет D-025).
import { Link } from '@tanstack/react-router';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Separator, SidebarTrigger } from '@/shared/ui';

import type { Crumb } from '../model/nav';

export interface AppHeaderProps {
  crumbs: readonly Crumb[];
  languageSwitch: ReactNode;
  themeToggle: ReactNode;
}

export function AppHeader({ crumbs, languageSwitch, themeToggle }: AppHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b px-2 md:px-4">
      <SidebarTrigger aria-label={t('nav.toggle_sidebar')} className="min-h-11 min-w-11" />
      {crumbs.length > 1 ? (
        <>
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
          {/* Кнопка 44 px с иконкой 16 px: от иконки до разделителя 14 + 8 px — тот же отступ (ms-3.5 + gap-2) от разделителя до заголовка. */}
          <Breadcrumb aria-label={t('nav.breadcrumb')} className="ms-3.5 min-w-0 flex-1">
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <Fragment key={c.labelKey}>
                  {i > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem className="min-w-0">
                    {c.to && i < crumbs.length - 1 ? (
                      <BreadcrumbLink asChild>
                        <Link to={c.to} activeOptions={{ exact: true, includeSearch: true }}>{t(c.labelKey)}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="truncate font-medium">{t(c.labelKey)}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </>
      ) : null}
      {/* Разделитель — как между кнопкой сайдбара и заголовком. */}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        {languageSwitch}
        <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
        {themeToggle}
      </div>
    </header>
  );
}
