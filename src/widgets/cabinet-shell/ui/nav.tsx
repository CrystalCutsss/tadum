// Нижняя навигация (< 1280 px, safe-area) и боковая (≥ 1280 px) — одни и те же пункты; цели ≥ 44 px.
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { Family } from '@/shared/config';
import { Icon } from '@/shared/ui';

import { NAV } from '../model/nav';

const item = 'flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground data-[status=active]:font-medium data-[status=active]:text-foreground';

export function BottomNav({ family }: { family: Family }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.main')} className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-safe-bottom xl:hidden">
      <ul className="mx-auto flex max-w-md justify-around">
        {NAV[family].map((n) => (
          <li key={n.to}>
            <Link to={n.to} className={`${item} flex-col justify-center gap-0.5 py-1 text-xs`}>
              <Icon icon={n.icon} />
              {t(n.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SideNav({ family }: { family: Family }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.main')} className="hidden w-56 shrink-0 xl:block">
      <ul className="sticky top-16 flex flex-col gap-1 py-4">
        {NAV[family].map((n) => (
          <li key={n.to}>
            <Link to={n.to} className={item}>
              <Icon icon={n.icon} />
              {t(n.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
