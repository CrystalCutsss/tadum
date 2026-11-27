// Блок «График платежей» (D-102): просроченный взнос первым, только предстоящие, пусто; панель истории и детали
// взноса. Блок — в матрице AR/EN × light/dark; панель — портал, одна копия (язык и тема из глобалов).
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { tr } from '../../../../.storybook/story-helpers';
import type { Installment, RepaymentSchedule } from '@/entities/repayment';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n } from '@/shared/i18n';
import { now } from '@/shared/lib';

import { RepaymentsCard } from './repayments-card';

const DAY = 86_400_000;
const date = (days: number) => new Date(now() + 3 * 3_600_000 + days * DAY).toISOString().slice(0, 10);
const item = (n: number, days: number, status: Installment['status']): Installment => ({
  id: `i${n}`,
  deal_id: 'deal_1',
  reference: `DEAL-1-${n}`,
  supplier_name: 'Al Noor Trading',
  due_date: date(days),
  amount: { amount_minor: 1_000_000, currency: 'SAR' },
  status,
  ...(status === 'paid' ? { paid_at: new Date(now() + (days - 2) * DAY).toISOString() } : {}),
});
const details = { beneficiary: 'Tadum Trading Company', bank_name: 'Demo Bank', iban: 'SA4420000001234567891234' };
const withOverdue: RepaymentSchedule = { installments: [item(1, -35, 'paid'), item(2, -5, 'overdue'), item(3, 25, 'upcoming'), item(4, 55, 'upcoming')], payment_details: details };
const onlyUpcoming: RepaymentSchedule = { installments: [item(1, 12, 'upcoming'), item(2, 42, 'upcoming'), item(3, 72, 'upcoming')], payment_details: details };
const empty: RepaymentSchedule = { installments: [], payment_details: details };

const meta = { title: 'widgets/RepaymentSchedule', component: RepaymentsCard, args: { schedule: withOverdue, company: 'Marjan Cosmetics' } } satisfies Meta<typeof RepaymentsCard>;
export default meta;
type Story = StoryObj<typeof meta>;

function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const i18n = createI18n(el.getAttribute('lang') === 'en' ? 'en' : 'ar');
    return { el, c: within(el), t: (key: ParseKeys, values?: Record<string, unknown>): string => i18n.t(key, values ?? {}) };
  });
}

export const OverdueFirst: Story = {
  name: 'Срок платежа прошёл — первым, с меткой и «Написать менеджеру»',
  ...matrix,
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByRole('heading', { name: t('repayments.title') })).toBeVisible();
      const badges = c.getAllByText(t('repayments.overdue'));
      await expect(badges[0]).toBeVisible();
      await expect(c.getByRole('link', { name: t('home.manager.cta') }).getAttribute('href')).toContain(encodeURIComponent('DEAL-1-2'));
      // Ближайший крупно и ещё два строкой — оплаченный на главной не показывается.
      await expect(c.getAllByRole('button', { name: new RegExp('10,000') })).toHaveLength(3);
      await expect(c.getByRole('button', { name: t('repayments.history') })).toBeVisible();
    }
  },
};

export const UpcomingOnly: Story = {
  name: 'Только предстоящие — «Ближайший платёж»',
  ...matrix,
  args: { schedule: onlyUpcoming },
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByText(t('repayments.next'))).toBeVisible();
      await expect(c.getByText(t('repayments.due_in_days', { count: 12 }))).toBeVisible();
      await expect(c.queryByText(t('repayments.overdue'))).toBeNull();
    }
  },
};

export const Empty: Story = {
  name: 'Взносов нет — график появится после оплаты поставщику',
  ...matrix,
  args: { schedule: empty },
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByText(t('repayments.empty'))).toBeVisible();
      await expect(c.queryByRole('button', { name: t('repayments.history') })).toBeNull();
    }
  },
};

export const HistoryAndDetails: Story = {
  name: 'История платежей → детали взноса с «Как оплатить», копирование',
  loaders: [
    () => {
      const events: CapturedEvent[] = [];
      return { events, restore: setAnalyticsProviders([{ capture: (e) => events.push(e) }]) };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = loaded as { events: CapturedEvent[]; restore: () => void };
    const body = within(document.body);
    try {
      const history = within(canvasElement).getByRole('button', { name: tr('repayments.history') });
      // На телефоне шторка грузится лениво — кликаем, пока окно не откроется.
      const dialog = await waitFor(
        async () => {
          if (!body.queryByRole('dialog')) await userEvent.click(history);
          return body.getByRole('dialog');
        },
        { timeout: 5000 },
      );
      const d = within(dialog);
      await expect(d.getByRole('heading', { name: tr('repayments.groups.paid') })).toBeVisible();
      await expect(d.getAllByRole('button', { name: new RegExp('10,000') })).toHaveLength(4);
      await userEvent.click(d.getAllByRole('button', { name: new RegExp('10,000') })[0]!);
      await waitFor(() => expect(d.getByRole('heading', { name: tr('repayments.how_to_pay.title') })).toBeVisible());
      await expect(dialog).toHaveTextContent('SA4420000001234567891234');
      await expect(dialog).toHaveTextContent('DEAL-1-2');
      await expect(d.getByRole('button', { name: tr('repayments.details.back') })).toBeVisible();
      const names = events.map((e) => e.name);
      await expect(names).toContain('repayment_history_opened');
      await expect(events.find((e) => e.name === 'repayment_details_opened')?.props).toEqual({ status: 'overdue', source: 'history' });
    } finally {
      restore();
    }
  },
};
