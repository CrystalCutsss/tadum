// Пункты бокового меню и заголовки страниц кабинета.
// Решение Кирилла 2026-11-06: в основном меню только «Home» и «Documents», без вложенных страниц, у обеих ролей;
// «Помощь и настройки» открываются из меню аккаунта. У поставщика /s/documents — заглушка до v3.
// У клиента пункт называется «Application» (решение Кирилла 2026-11-10), маршрут прежний.
// Иконка «Документы» в меню — простая, без строк текста (решение Кирилла 2026-11-09); в карточках документов — подробная.
import { RiFileLine, RiHomeLine, type RemixiconComponentType } from '@remixicon/react';

import { ROUTES, type Family } from '@/shared/config';

type NavLabelKey = 'nav.home' | 'nav.documents' | 'nav.application';

export interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  icon: RemixiconComponentType;
}

export const NAV: Readonly<Record<Family, readonly NavItem[]>> = {
  client: [
    { to: ROUTES.clientHome, labelKey: 'nav.home', icon: RiHomeLine },
    { to: ROUTES.clientDocuments, labelKey: 'nav.application', icon: RiFileLine },
  ],
  supplier: [
    { to: ROUTES.supplierHome, labelKey: 'nav.home', icon: RiHomeLine },
    { to: ROUTES.supplierDocuments, labelKey: 'nav.documents', icon: RiFileLine },
  ],
};

/** Крошка шапки: последняя — текущая страница; предыдущие (на будущее) — ссылки. */
export interface Crumb {
  labelKey: NavLabelKey | 'help.title';
  to?: string;
}

const HELP: Readonly<Record<Family, string>> = { client: ROUTES.clientHelp, supplier: ROUTES.supplierHelp };

/**
 * Хлебные крошки по пути. Один уровень — заголовок страницы (в шапке не показывается); вложенные экраны добавляют
 * родителя со ссылкой; кнопки «Назад» на вложенных экранах нет, только крошки (решение Кирилла 2026-11-11).
 */
export function crumbsFor(family: Family, pathname: string): Crumb[] {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === HELP[family]) return [{ labelKey: 'help.title' }];
  const item = NAV[family].find((n) => path === n.to || path.startsWith(`${n.to}/`));
  return item ? [{ labelKey: item.labelKey }] : [];
}

/** Ссылка на экран «Помощь и настройки» семьи. */
export const settingsOf = (family: Family): string => HELP[family];
