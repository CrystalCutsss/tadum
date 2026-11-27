// Общие части графика платежей (D-102): сумма, дата и срок взноса, метка «Срок платежа прошёл», строка списка.
import { RiArrowRightSLine, RiErrorWarningLine } from '@remixicon/react';
import { cn } from 'cn';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { daysUntil, type Installment } from '@/entities/repayment';
import { formatDateLong, formatMoney, isLanguage } from '@/shared/i18n';
import { useNow } from '@/shared/lib';
import { Icon, Ltr } from '@/shared/ui';

const MINUTE = 60_000;
const NBSP = '\u00a0';

/** Сумма с валютой: от направления строки изолируется только число — в AR «10,000 ر.س», как у карточки лимита. */
export function MoneyText({ value }: { value: string }) {
  return (
    <>
      {value.split(NBSP).map((part, i) => (
        <Fragment key={part}>
          {i > 0 ? NBSP : null}
          {/\d/.test(part) ? <Ltr>{part}</Ltr> : part}
        </Fragment>
      ))}
    </>
  );
}

export function useMoneyAndDate() {
  const { i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  return {
    money: (i: Pick<Installment, 'amount'>) => formatMoney(i.amount.amount_minor / 100, lang, { cents: true }),
    date: (iso: string) => formatDateLong(iso, lang),
  };
}

/** Срок словами: «через 25 дней», «сегодня», «5 дней назад» (для просроченного). */
export function useDueText() {
  const { t } = useTranslation();
  const now = useNow(MINUTE);
  return (i: Pick<Installment, 'due_date'>) => {
    const days = daysUntil(i.due_date, now);
    if (days === 0) return t('repayments.due_today');
    return days > 0 ? t('repayments.due_in_days', { count: days }) : t('repayments.overdue_days', { count: -days });
  };
}

/** Метка просроченного взноса: нейтрально-предупреждающий цвет и иконка, без красного (D-102). */
export function OverdueBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-status-rejected-muted px-2.5 py-1 text-xs font-medium text-status-rejected', className)}>
      <Icon icon={RiErrorWarningLine} className="size-4" />
      {t('repayments.overdue')}
    </span>
  );
}

/** Строка взноса: дата и срок, поставщик, сумма; нажатие открывает детали. */
export function InstallmentRow({ item, onOpen }: { item: Installment; onOpen: () => void }) {
  const { t } = useTranslation();
  const { money, date } = useMoneyAndDate();
  const due = useDueText();
  const overdue = item.status === 'overdue';
  const paid = item.status === 'paid';
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-start outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">
            <bdi>{date(item.due_date)}</bdi>
          </span>
          <span className={cn('truncate text-xs', overdue ? 'text-status-rejected' : 'text-muted-foreground')}>
            {paid && item.paid_at ? t('repayments.paid_on', { date: date(item.paid_at) }) : overdue ? t('repayments.overdue') : due(item)}
            {' · '}
            <bdi>{item.supplier_name}</bdi>
          </span>
        </span>
        <span className="text-sm font-medium tabular-nums">
          <MoneyText value={money(item)} />
        </span>
        <Icon icon={RiArrowRightSLine} className="size-5 text-muted-foreground" />
      </button>
    </li>
  );
}
