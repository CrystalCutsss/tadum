// Связь с поддержкой из экранов входа (SC-01 A8, A10). Полный SupportBar — в блоке 6b.
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui';

const whatsapp = `https://wa.me/${import.meta.env.VITE_SUPPORT_WHATSAPP ?? ''}`;

export function SupportLink({ context, variant = 'ghost' }: { context: 'auth' | 'error'; variant?: 'ghost' | 'outline' }) {
  const { t } = useTranslation();
  return (
    <Button asChild variant={variant}>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => track('support_contact_clicked', { channel: 'whatsapp', context })}>
        {t('auth.not_found.support')}
      </a>
    </Button>
  );
}
