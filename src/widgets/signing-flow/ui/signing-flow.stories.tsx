// Сценарий подписания (SC-06): договор SPA (подпись в SADQ по SMS, Кирилл 2026-11-18) и вексель в Nafith — в матрице
// AR/EN × light/dark, axe по четырём панелям; скачивание копии, «давно ждём» и «не получилось» проверяются в play.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { matrix, withRouter } from '../../../../.storybook/decorators';
import { markChecklistOpened, type ChecklistItem, type Limit } from '@/entities/limit';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n } from '@/shared/i18n';
import { sessionStore, setClock } from '@/shared/lib';

import { SigningFlow } from './signing-flow';

const meta = {
  title: 'widgets/SigningFlow',
  ...matrix,
  decorators: [...matrix.decorators, withRouter('/c/documents/sign')],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const lang = el.getAttribute('lang') === 'en' ? 'en' : 'ar';
    const i18n = createI18n(lang);
    return { el, c: within(el), t: (key: ParseKeys, values?: Record<string, unknown>): string => i18n.t(key, values ?? {}) };
  });
}

function eventsLoader() {
  const events: CapturedEvent[] = [];
  const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return { events, restore };
}
type Captured = { events: CapturedEvent[]; restore: () => void };
const propsOf = (events: CapturedEvent[], name: string) => events.filter((e) => e.name === name).map((e) => e.props);

const checklist = (spa: ChecklistItem['status'], pn: ChecklistItem['status']): Pick<Limit, 'checklist'> => ({
  checklist: {
    items: [
      { key: 'spa', status: spa, document_url: '/demo/spa.pdf' },
      { key: 'pn_nafith', status: pn },
    ],
    completed: spa === 'done' && pn === 'done',
  },
});

const FIXED = Date.parse('2026-11-04T09:00:00+03:00');
const HOUR = 3_600_000;

export const BothPending: Story = {
  name: 'Договор ждёт подписи в SADQ: серый бейдж, инструкция без кнопок; вексель — Nafith',
  render: () => <SigningFlow limit={checklist('pending', 'pending')} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      const spa = el.querySelectorAll<HTMLElement>('ol[aria-label] > li')[0]!;
      await expect(c.getByText(t('checklist.spa'))).toBeVisible();
      await expect(c.getByText(t('checklist.pn_nafith'))).toBeVisible();
      await expect(spa).toHaveTextContent(t('signing.spa.status_required'));
      await expect(within(spa).getByText(t('signing.spa.body'))).toBeVisible();
      await expect(within(spa).getByText(t('signing.spa.step_sms'))).toBeVisible();
      await expect(within(spa).getByText(t('signing.spa.step_sign'))).toBeVisible();
      // До подписи у договора кнопок нет (Кирилл 2026-11-18).
      await expect(within(spa).queryAllByRole('link')).toHaveLength(0);
      await expect(within(spa).queryAllByRole('button')).toHaveLength(0);
      const nafith = c.getByRole('link', { name: t('signing.pn.open') });
      await expect(nafith).toHaveAttribute('href', 'https://www.nafith.sa');
      await expect(nafith).toHaveAttribute('target', '_blank');
    }
  },
};

export const SpaDonePnPending: Story = {
  name: 'Договор подписан: зелёный бейдж, «скачайте копию»; вексель ждёт Nafith',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('done', 'pending')} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    const block = (e: Event) => e.preventDefault();
    canvasElement.addEventListener('click', block, true);
    try {
      for (const { el, t } of panels(canvasElement)) {
        const [spa, pn] = el.querySelectorAll<HTMLElement>('ol[aria-label] > li');
        await expect(spa).toHaveTextContent(t('signing.spa.status_signed'));
        await expect(spa).toHaveTextContent(t('signing.spa.signed_body'));
        await expect(within(spa!).queryByText(t('signing.spa.step_sms'))).toBeNull();
        const download = within(spa!).getByRole('link', { name: t('signing.spa.download') });
        await expect(download).toHaveAttribute('href', '/demo/spa.pdf');
        // Кнопка нейтральная, не основная синяя.
        await expect(download).toHaveAttribute('data-variant', 'secondary');
        await expect(pn).toHaveTextContent(t('signing.pn.body'));
      }
      const [first] = panels(canvasElement);
      await userEvent.click(first!.c.getAllByRole('link', { name: first!.t('signing.spa.download') })[0]!);
      await expect(events.map((e) => e.name)).toEqual(['spa_downloaded']);
    } finally {
      canvasElement.removeEventListener('click', block, true);
      restore();
    }
  },
};

export const PnStale: Story = {
  name: 'Вексель: Nafith открыт больше 24 ч назад — подсказка и checklist_item_stale',
  loaders: [
    () => {
      const restore = setClock(() => FIXED);
      markChecklistOpened('pn_nafith', FIXED - 25 * HOUR);
      return { restore, captured: eventsLoader() };
    },
  ],
  render: () => <SigningFlow limit={checklist('done', 'pending')} />,
  play: async ({ canvasElement, loaded }) => {
    const l = loaded as { restore: () => void; captured: Captured };
    try {
      for (const { el, t } of panels(canvasElement)) {
        const pn = el.querySelectorAll<HTMLElement>('ol[aria-label] > li')[1]!;
        await expect(pn).toHaveTextContent(t('checklist.status.in_progress'));
        await expect(within(pn).getByText(t('checklist.stale_hint_pn'))).toBeVisible();
      }
      await expect(propsOf(l.captured.events, 'checklist_item_stale')).toEqual(Array(4).fill({ item: 'pn_nafith', hours: 25 }));
    } finally {
      l.restore();
      l.captured.restore();
      sessionStore.remove('checklist:opened:pn_nafith');
    }
  },
};

export const PnFailed: Story = {
  name: 'Вексель не подтвердился — нейтральный текст и checklist_item_failed_viewed',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('done', 'failed')} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { el, t } of panels(canvasElement)) {
        const pn = el.querySelectorAll<HTMLElement>('ol[aria-label] > li')[1]!;
        await expect(pn).toHaveTextContent(t('checklist.status.failed'));
        await expect(within(pn).getByText(t('checklist.item_failed'))).toBeVisible();
      }
      await expect(propsOf(events, 'checklist_item_failed_viewed')).toEqual(Array(4).fill({ item: 'pn_nafith' }));
    } finally {
      restore();
    }
  },
};
