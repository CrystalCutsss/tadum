// Панель графика платежей (D-102): «История платежей» — все взносы группами (срок прошёл, предстоящие, оплаченные)
// и детали взноса с кнопкой «Как оплатить» — точкой входа в WhatsApp (D-104, способ оплаты не прорабатывается). На компьютере — боковая панель, на телефоне —
// шторка снизу, как «Открыть заявку» (D-082).
import { RiArrowLeftSLine, RiWhatsappLine } from '@remixicon/react';
import { useTranslation } from 'react-i18next';

import { groupSchedule, type Installment, type RepaymentSchedule } from '@/entities/repayment';
import { track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
import { useIsMobile } from '@/shared/lib';
import {
  Button,
  Icon,
  Ltr,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SideDrawer,
} from '@/shared/ui';

import { InstallmentRow, MoneyText, OverdueBadge, useDueText, useMoneyAndDate } from './parts';

export type PanelView = { view: 'history' } | { view: 'details'; id: string; from: 'home' | 'history' };

export interface RepaymentPanelProps {
  schedule: RepaymentSchedule;
  company: string;
  view: PanelView | null;
  onViewChange: (view: PanelView | null) => void;
}

export function RepaymentPanel({ schedule, company, view, onViewChange }: RepaymentPanelProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const open = view !== null;
  const item = view?.view === 'details' ? schedule.installments.find((i) => i.id === view.id) : undefined;
  const title = item ? t('repayments.details.title') : t('repayments.history');
  const openDetails = (i: Installment) => {
    track('repayment_details_opened', { status: i.status, source: 'history' });
    onViewChange({ view: 'details', id: i.id, from: 'history' });
  };
  const body = item ? (
    <Details
      item={item}
      company={company}
      onBack={view?.view === 'details' && view.from === 'history' ? () => onViewChange({ view: 'history' }) : undefined}
    />
  ) : (
    <History schedule={schedule} onOpen={openDetails} />
  );
  const onOpenChange = (next: boolean) => {
    if (!next) onViewChange(null);
  };

  if (isMobile) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent size="tall" closeLabel={t('common.close')} aria-describedby={undefined}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>{body}</ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }
  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={title} closeLabel={t('common.close')}>
      {body}
    </SideDrawer>
  );
}

function History({ schedule, onOpen }: { schedule: RepaymentSchedule; onOpen: (i: Installment) => void }) {
  const { t } = useTranslation();
  const groups = groupSchedule(schedule.installments);
  const sections = [
    ['overdue', t('repayments.groups.overdue'), groups.overdue],
    ['upcoming', t('repayments.groups.upcoming'), groups.upcoming],
    ['paid', t('repayments.groups.paid'), groups.paid],
  ] as const;
  if (schedule.installments.length === 0) return <p className="text-sm text-muted-foreground">{t('repayments.history_empty')}</p>;
  return (
    <div className="flex flex-col gap-6">
      {sections.map(([key, label, items]) =>
        items.length > 0 ? (
          <section key={key} aria-label={label} className="flex flex-col gap-1">
            <h3 className={key === 'overdue' ? 'text-sm font-semibold text-status-rejected' : 'text-sm font-semibold text-muted-foreground'}>{label}</h3>
            <ul className="flex flex-col">
              {items.map((i) => (
                <InstallmentRow key={i.id} item={i} onOpen={() => onOpen(i)} />
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

function Details({ item, company, onBack }: { item: Installment; company: string; onBack: (() => void) | undefined }) {
  const { t } = useTranslation();
  const { money, date } = useMoneyAndDate();
  const due = useDueText();
  const overdue = item.status === 'overdue';
  const paid = item.status === 'paid';

  return (
    <div className="flex flex-col gap-6">
      {onBack ? (
        <Button type="button" variant="ghost" className="-ms-2 min-h-11 self-start px-2" onClick={onBack}>
          <Icon icon={RiArrowLeftSLine} data-icon="inline-start" />
          {t('repayments.details.back')}
        </Button>
      ) : null}
      <div className="flex flex-col gap-2">
        {overdue ? <OverdueBadge className="self-start" /> : null}
        <p className="text-3xl font-medium tabular-nums">
          <MoneyText value={money(item)} />
        </p>
        <p className="text-sm text-muted-foreground">
          {paid && item.paid_at ? t('repayments.paid_on', { date: date(item.paid_at) }) : due(item)}
        </p>
      </div>
      <dl className="flex flex-col gap-3 text-sm">
        <Row label={t('repayments.details.due_date')}>
          <bdi>{date(item.due_date)}</bdi>
        </Row>
        <Row label={t('repayments.details.supplier')}>
          <bdi>{item.supplier_name}</bdi>
        </Row>
        <Row label={t('repayments.details.reference')}>
          <Ltr>{item.reference}</Ltr>
        </Row>
      </dl>
      {overdue ? (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-status-rejected-muted p-4 text-sm">
          <p>{t('repayments.overdue_hint')}</p>
          <Button asChild variant="outline" className="min-h-11">
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
        </div>
      ) : null}
      {/* «Как оплатить» — только точка входа (D-104): способ оплаты не прорабатывается, кнопка ведёт в WhatsApp Tadum. */}
      {item.status === 'paid' ? null : (
        <Button asChild className="min-h-11 w-full sm:w-auto sm:self-start">
          <a
            href={supportWhatsappUrl(t('support.prefill.repayment_pay', { reference: item.reference, company }))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('repayment_pay_clicked', { status: item.status === 'overdue' ? 'overdue' : 'upcoming' })}
          >
            <Icon icon={RiWhatsappLine} data-icon="inline-start" />
            {t('repayments.how_to_pay.cta')}
          </a>
        </Button>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
