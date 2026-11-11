// auth.expired (SC-01 A11, SC-10 §1.4): «Войти» ведёт на /login, returnTo сохранён.
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { authMemory } from '@/entities/session';
import { track } from '@/shared/analytics';
import { screenIdFor } from '@/shared/config';
import { Button } from '@/shared/ui';

import { AuthLayout } from './auth-layout';

export function SessionExpiredScreen() {
  const { t } = useTranslation();
  useEffect(() => {
    const last = screenIdFor(authMemory.returnTo()?.split(/[?#]/)[0] ?? '') ?? 'client.home';
    track('session_expired', { last_screen_id: last });
  }, []);
  return (
    <AuthLayout title={t('auth.expired.title')} subtitle={t('auth.expired.body')}>
      <Button asChild size="lg" className="h-12 w-full text-base">
        <Link to="/login">{t('auth.expired.login')}</Link>
      </Button>
    </AuthLayout>
  );
}
