// Связь с поддержкой из экранов входа (SC-01 A8, A10). Полный SupportBar — в блоке 6b.
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui';

const whatsapp = `https://wa.me/${import.meta.env.VITE_SUPPORT_WHATSAPP ?? ''}`;

export function SupportLink({ context }: { context: 'auth' | 'error' }) {
  const { t } = useTranslation();
  return (
    // Серая кнопка без обводки той же высоты, что основные кнопки экранов входа (Кирилл 2026-11-11).
    <Button asChild variant="secondary" size="lg" className="h-12 w-full text-base">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => track('support_contact_clicked', { channel: 'whatsapp', context })}>
        {t('auth.not_found.support')}
      </a>
    </Button>
  );
}
