// «Лимит одобрен» на экране «Заявка» (решение Кирилла 2026-11-11): только готовая карточка заявки со статусом и переходом
// внутрь; внутри — даты, лимит и загруженные документы. Пары «метка — значение» — как в карточках заявок в бенчмарке.
import { RiCheckboxCircleLine } from '@remixicon/react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { formatDateLong, formatMoney, isLanguage } from '@/shared/i18n';
import { Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, Ltr } from '@/shared/ui';

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

function StatusPill() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-status-approved-muted px-2.5 py-0.5 text-sm font-medium whitespace-nowrap text-status-approved">
      <Icon icon={RiCheckboxCircleLine} className="size-4" />
      {t('application.summary.status')}
    </span>
  );
}

/** Готовая карточка заявки: статус, даты, лимит и «Открыть заявку». */
export function ApplicationSummaryCard({ sentAt, limit, onOpen }: ApplicationFactsProps & { onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col rounded-xl bg-secondary">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
        <Item className="flex-nowrap items-start rounded-none border-0 p-0">
          <ItemMedia variant="icon" className="hidden sm:flex">
            <Icon icon={RiCheckboxCircleLine} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-1">
            <ItemTitle className="text-base">
              <h2>{t('application.summary.title')}</h2>
            </ItemTitle>
            <ItemDescription className="line-clamp-none">{t('application.summary.no_action')}</ItemDescription>
          </ItemContent>
          <ItemActions className="ms-auto shrink-0">
            <StatusPill />
          </ItemActions>
        </Item>
      </div>
      <div className="flex flex-col gap-4 p-3 md:p-4">
        <ApplicationFacts sentAt={sentAt} limit={limit} />
        <div>
          <Button type="button" variant="default" className="min-h-11" onClick={onOpen}>
            {t('application.summary.open')}
          </Button>
        </div>
      </div>
    </section>
  );
}
