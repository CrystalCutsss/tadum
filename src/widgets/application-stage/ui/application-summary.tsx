// «Лимит одобрен» на экране «Заявка» (решение Кирилла 2026-11-11): только готовая карточка заявки со статусом и переходом
// внутрь; внутри — даты, лимит и загруженные документы. Пары «метка — значение» — как в карточках заявок в бенчмарке.
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { formatDateLong, formatMoney, isLanguage } from '@/shared/i18n';
import { Button, Ltr } from '@/shared/ui';

import { LimitAmount, LimitSurface } from './application-stage-card';

export interface ApplicationFactsProps {
  /** Когда комплект ушёл на проверку. */
  sentAt?: string | undefined;
  limit: Pick<Limit, 'approved' | 'activated_at'>;
}

/** Даты и сумма лимита — список «метка — значение». */
export function ApplicationFacts({ sentAt, limit }: ApplicationFactsProps) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const rows: [string, string][] = [
    ...(sentAt ? [[t('application.summary.sent'), formatDateLong(sentAt, lang)] as [string, string]] : []),
    ...(limit.activated_at ? [[t('application.summary.approved_at'), formatDateLong(limit.activated_at, lang)] as [string, string]] : []),
    [t('application.summary.limit'), formatMoney(limit.approved.amount_minor / 100, lang)],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums">
            <Ltr>{value}</Ltr>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** «Лимит одобрен»: тот же вид, что у карточки лимита на прошлых этапах — заголовок, сумма, две даты и «Открыть заявку». */
export function ApplicationSummaryCard({ sentAt, limit, onOpen }: ApplicationFactsProps & { onOpen: () => void }) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const rows: [string, string][] = [
    ...(limit.activated_at ? [[t('application.summary.approved_at'), formatDateLong(limit.activated_at, lang)] as [string, string]] : []),
    ...(sentAt ? [[t('application.summary.sent'), formatDateLong(sentAt, lang)] as [string, string]] : []),
  ];
  return (
    <LimitSurface>
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t('application.summary.title')}</h2>
        <LimitAmount value={limit.approved} />
      </div>
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-sm text-primary-foreground/75">{label}</dt>
            <dd className="tabular-nums">
              <Ltr>{value}</Ltr>
            </dd>
          </div>
        ))}
      </dl>
      <div>
        <Button type="button" variant="secondary" className="min-h-11" onClick={onOpen}>
          {t('application.summary.open')}
        </Button>
      </div>
    </LimitSurface>
  );
}
