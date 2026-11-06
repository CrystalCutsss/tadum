// SupportBar (01-cabinet-structure.md §2): WhatsApp с готовым текстом на языке интерфейса и e-mail; SupportCard — тот же блок для сайдбара.
// В событие — только канал и статус/контекст; текст сообщения и название компании в аналитику не уходят.
import { RiWhatsappFill } from '@remixicon/react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import type { ClientStatus, SupplierStatus } from '@/shared/api';
import { Button, Card, CardContent, Icon } from '@/shared/ui';

const WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP ?? '966579768881';
const EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? 'info@tadum.sa';

export type SupportPrefill = 'under_review' | 'closed' | 'quotation';

export interface SupportBarProps {
  /** Готовый текст WhatsApp (SC-05, SC-07, SC-08); {company} — название компании клиента. */
  prefill?: { key: SupportPrefill; company: string };
  status?: ClientStatus | SupplierStatus;
  context?: 'closed' | 'under_review' | 'auth' | 'error';
}

/** Ссылки и обработчики каналов поддержки: одна логика для SupportBar и SupportCard. */
function useSupportLinks({ prefill, status, context }: SupportBarProps) {
  const { t } = useTranslation();
  const text = prefill ? t(`support.prefill.${prefill.key}`, { company: prefill.company }) : '';
  const props = { ...(status ? { status } : {}), ...(context ? { context } : {}) };
  return {
    whatsapp: {
      href: `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
      onClick: () => track('support_contact_clicked', { channel: 'whatsapp', ...props }),
    },
    email: { href: `mailto:${EMAIL}`, onClick: () => track('support_contact_clicked', { channel: 'email', ...props }) },
  };
}

export function SupportBar(props: SupportBarProps) {
  const { t } = useTranslation();
  const links = useSupportLinks(props);
  return (
    <aside className="flex flex-col gap-2 rounded-lg border p-4" aria-label={t('support.cta.question')}>
      <p className="text-sm font-medium">{t('support.cta.question')}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-h-11">
          <a href={links.whatsapp.href} target="_blank" rel="noopener noreferrer" onClick={links.whatsapp.onClick}>
            {t('support.whatsapp')}
          </a>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <a href={links.email.href} onClick={links.email.onClick}>
            {t('support.email')}
          </a>
        </Button>
      </div>
    </aside>
  );
}

/** Блок помощи в нижней части сайдбара (решения Кирилла 2026-11-06): Card, заголовок и серый подзаголовок, WhatsApp в фирменном цвете и «Email». */
export function SupportCard(props: SupportBarProps) {
  const { t } = useTranslation();
  const links = useSupportLinks(props);
  return (
    <Card size="sm" role="complementary" aria-label={t('support.cta.question')}>
      <CardContent className="flex flex-col gap-3">
        <p className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t('support.cta.title')}</span>
          <span className="text-xs text-muted-foreground">{t('support.cta.subtitle')}</span>
        </p>
        <div className="flex flex-col gap-2">
          {/* Скругление меньше пилюли пресета (Кирилл 2026-11-06): rounded-lg = --radius. */}
          <Button asChild variant="whatsapp" className="min-h-11 rounded-lg">
            <a href={links.whatsapp.href} target="_blank" rel="noopener noreferrer" onClick={links.whatsapp.onClick}>
              <Icon icon={RiWhatsappFill} />
              {t('support.whatsapp')}
            </a>
          </Button>
          <Button asChild variant="secondary" className="min-h-11 rounded-lg">
            <a href={links.email.href} onClick={links.email.onClick}>
              {t('support.email')}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
