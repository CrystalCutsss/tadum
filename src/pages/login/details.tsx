// /login/details — «Contact name и Business name» нового клиента (Кирилл 2026-11-25, A-074): номер → этот экран → код.
// Гард: номер введён на прошлом шаге в этой вкладке (номер — только в памяти), иначе — к номеру.
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { ContactDetailsForm } from '@/features/request-otp';
import { decideAuthScreen, familyMemory, loadSessionState, loginFlow } from '@/entities/session';

import { AuthLayout } from '../-components/auth-layout';
import { SupportLink } from '../-components/support-link';
import { enforce } from '../-guard';

function DetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phone = loginFlow.enteredPhone();
  if (!phone) return null;
  return (
    <AuthLayout title={t('auth.details.title')} subtitle={t('auth.details.subtitle')}>
      <ContactDetailsForm
        phone={phone}
        onRequested={() => void navigate({ to: '/login/code' })}
        onChangePhone={() => {
          loginFlow.changePhone();
          void navigate({ to: '/login' });
        }}
        supportSlot={<SupportLink context="error" />}
      />
    </AuthLayout>
  );
}

export const Route = createFileRoute('/login/details')({
  beforeLoad: async ({ context }) => {
    enforce(decideAuthScreen(await loadSessionState(context.queryClient), familyMemory.last()));
    if (!loginFlow.enteredPhone()) enforce({ kind: 'redirect', to: '/login' });
  },
  component: DetailsPage,
});
