// Блок «График платежей» на главной (D-102; бенчмарк № 133, 136, 188): компактный, акцент на ближайших платежах —
// первый взнос крупно (сумма, срок, поставщик), ещё два строками. Просроченные — всегда первыми, с меткой
// «Срок платежа прошёл» и «Написать менеджеру». «История платежей» — панель со всеми взносами; нажатие на взнос —
// детали с «Как оплатить». Нет взносов — одна строка о том, когда появится график.
import { RiWhatsappLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { groupSchedule, type Installment, type RepaymentSchedule } from '@/entities/repayment';
import { countBucket, track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
import { Button, Icon } from '@/shared/ui';

import { InstallmentRow, MoneyText, OverdueBadge, useDueText, useMoneyAndDate } from './parts';
import { RepaymentPanel, type PanelView } from './repayment-panel';

export interface RepaymentsCardProps {
  schedule: RepaymentSchedule;
  /** Название компании на языке интерфейса — в готовый текст WhatsApp. */
  company: string;
}

export function RepaymentsCard({ schedule, company }: RepaymentsCardProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);
  const [view, setView] = useState<PanelView | null>(null);
  const groups = groupSchedule(schedule.installments);
  const [first, ...rest] = groups.home;
  const hasOverdue = groups.overdue.length > 0;

  // repayments_viewed — один раз, когда блок попал в область видимости.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      track('repayments_viewed', { upcoming_count_bucket: countBucket(groups.upcoming.length), has_overdue: hasOverdue });
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Одно событие на показ блока.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openHistory = () => {
    track('repayment_history_opened', { has_overdue: hasOverdue });
    setView({ view: 'history' });
  };
  const openDetails = (i: Installment) => {
    track('repayment_details_opened', { status: i.status, source: 'home' });
    setView({ view: 'details', id: i.id, from: 'home' });
  };

  return (
    <section ref={ref} id="repayments" aria-labelledby={titleId} className="scroll-mt-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-base font-semibold">
          {t('repayments.title')}
        </h2>
        {schedule.installments.length > 0 ? (
          <Button type="button" variant="ghost" className="-me-2 min-h-11 shrink-0 px-2" onClick={openHistory}>
            {t('repayments.history')}
          </Button>
        ) : null}
      </div>
      {first ? (
        <div className="mt-3 flex flex-col gap-3">
          <Featured item={first} company={company} onOpen={() => openDetails(first)} />
          {rest.length > 0 ? (
            <ul className="flex flex-col">
              {rest.map((i) => (
                <InstallmentRow key={i.id} item={i} onOpen={() => openDetails(i)} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t('repayments.empty')}</p>
      )}
      <RepaymentPanel schedule={schedule} company={company} view={view} onViewChange={setView} />
    </section>
  );
}

/** Ближайший взнос крупно; просроченный — с меткой и «Написать менеджеру». */
function Featured({ item, company, onOpen }: { item: Installment; company: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const { money, date } = useMoneyAndDate();
  const due = useDueText();
  const overdue = item.status === 'overdue';
  return (
    <div className={cn('flex flex-col gap-3 rounded-lg p-3', overdue ? 'bg-status-rejected-muted' : 'bg-secondary')}>
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col items-start gap-1.5 rounded-md text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {overdue ? <OverdueBadge /> : <span className="text-xs font-medium">{t('repayments.next')}</span>}
        <span className="text-2xl font-medium tabular-nums">
          <MoneyText value={money(item)} />
        </span>
        <span className="text-sm">
          <bdi>{date(item.due_date)}</bdi>
          {' · '}
          <span className={overdue ? 'font-medium text-status-rejected' : undefined}>{due(item)}</span>
        </span>
        <span className="text-xs">
          <bdi>{item.supplier_name}</bdi>
        </span>
      </button>
      {overdue ? (
        <Button asChild variant="outline" className="min-h-11 self-start">
          <a
            href={supportWhatsappUrl(t('support.prefill.repayment', { reference: item.reference, company }))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('repayment_overdue_contact_clicked', {})}
          >
            <Icon icon={RiWhatsappLine} data-icon="inline-start" />
            {t('home.manager.cta')}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
