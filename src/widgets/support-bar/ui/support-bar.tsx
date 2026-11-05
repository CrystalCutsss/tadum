// SupportBar (01-cabinet-structure.md §2): WhatsApp с готовым текстом на языке интерфейса и e-mail.
// В событие — только канал и статус/контекст; текст сообщения и название компании в аналитику не уходят.
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import type { ClientStatus, SupplierStatus } from '@/shared/api';
import { Button } from '@/shared/ui';

const WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP ?? '966579768881';
const EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? 'info@tadum.sa';

export type SupportPrefill = 'under_review' | 'closed' | 'quotation';

export interface SupportBarProps {
  /** Готовый текст WhatsApp (SC-05, SC-07, SC-08); {company} — название компании клиента. */
  prefill?: { key: SupportPrefill; company: string };
  status?: ClientStatus | SupplierStatus;
  context?: 'closed' | 'under_review' | 'auth' | 'error';
}

export function SupportBar({ prefill, status, context }: SupportBarProps) {
  const { t } = useTranslation();
  const text = prefill ? t(`support.prefill.${prefill.key}`, { company: prefill.company }) : '';
  const href = `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const props = { ...(status ? { status } : {}), ...(context ? { context } : {}) };
  return (
    <aside className="flex flex-col gap-2 rounded-lg border p-4" aria-label={t('support.cta.question')}>
      <p className="text-sm font-medium">{t('support.cta.question')}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-h-11">
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => track('support_contact_clicked', { channel: 'whatsapp', ...props })}>
            {t('support.whatsapp')}
          </a>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <a href={`mailto:${EMAIL}`} onClick={() => track('support_contact_clicked', { channel: 'email', ...props })}>
            {t('support.email')}
          </a>
        </Button>
      </div>
    </aside>
  );
}
