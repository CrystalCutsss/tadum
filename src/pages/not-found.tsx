// /not-found — auth.not_found (SC-01 A8, D-067): номер без заявки; сессии нет.
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui';

import { AuthLayout } from './-components/auth-layout';
import { SupportLink } from './-components/support-link';

const landing = import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout title={t('auth.not_found.title')} subtitle={t('auth.not_found.body')}>
      <div className="flex flex-col gap-3">
        <Button asChild>
          <a href={landing} rel="noopener">
            {t('auth.not_found.apply')}
          </a>
        </Button>
        <SupportLink context="auth" variant="outline" />
      </div>
    </AuthLayout>
  );
}

export const Route = createFileRoute('/not-found')({ component: NotFoundPage });
