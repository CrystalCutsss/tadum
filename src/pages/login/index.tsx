// /login — auth.phone (SC-01). ?returnTo= принимает только внутренние пути; ?src=landing — вход с лендинга (D-039).
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PhoneForm } from '@/features/request-otp';
import { authMemory, decideAuthScreen, familyMemory, loadSessionState } from '@/entities/session';
import { setAnalyticsContext } from '@/shared/analytics';
import { isInAppBrowser } from '@/shared/lib';

import { AuthLayout } from '../-components/auth-layout';
import { SupportLink } from '../-components/support-link';
import { enforce } from '../-guard';

interface LoginSearch {
  returnTo?: string;
  src?: string;
}

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <AuthLayout title={t('auth.phone.title')} subtitle={t('auth.phone.subtitle')}>
      <PhoneForm onRequested={() => void navigate({ to: '/login/code' })} supportSlot={<SupportLink context="error" variant="outline" />} />
    </AuthLayout>
  );
}

export const Route = createFileRoute('/login/')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    ...(typeof search.returnTo === 'string' ? { returnTo: search.returnTo } : {}),
    ...(typeof search.src === 'string' ? { src: search.src } : {}),
  }),
  beforeLoad: async ({ context, search }) => {
    if (search.returnTo) authMemory.setReturnTo(search.returnTo);
    authMemory.setSource(search.src, isInAppBrowser());
    setAnalyticsContext({ role: 'anon' });
    enforce(decideAuthScreen(await loadSessionState(context.queryClient), familyMemory.last()));
  },
  component: LoginPage,
});
