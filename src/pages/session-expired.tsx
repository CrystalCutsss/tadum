// /session-expired — auth.expired (SC-01 A11, SC-10): «Войти» ведёт на /login, returnTo сохранён.
import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { authMemory } from '@/entities/session';
import { track } from '@/shared/analytics';
import { screenIdFor } from '@/shared/config';
import { Button } from '@/shared/ui';

import { AuthLayout } from './-components/auth-layout';

function SessionExpiredPage() {
  const { t } = useTranslation();
  useEffect(() => {
    const last = screenIdFor(authMemory.returnTo()?.split(/[?#]/)[0] ?? '') ?? 'client.home';
    track('session_expired', { last_screen_id: last });
  }, []);
  return (
    <AuthLayout title={t('auth.expired.title')} subtitle={t('auth.expired.body')}>
      <Button asChild>
        <Link to="/login">{t('auth.expired.login')}</Link>
      </Button>
    </AuthLayout>
  );
}

export const Route = createFileRoute('/session-expired')({ component: SessionExpiredPage });
