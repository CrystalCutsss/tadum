// system.404 (SC-10): нейтральный текст и «На главную»; в аналитику — только хеш пути.
import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { setAnalyticsContext, track } from '@/shared/analytics';
import { pathHash } from '@/shared/lib';
import { Button } from '@/shared/ui';

export function NotFoundScreen() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setAnalyticsContext({ screen_id: 'system.404' });
    track('screen_viewed', { screen_id: 'system.404', path_hash: pathHash(pathname) });
  }, [pathname]);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">{t('notfound.title')}</h1>
      <Button asChild>
        <Link to="/">{t('notfound.home')}</Link>
      </Button>
    </main>
  );
}
