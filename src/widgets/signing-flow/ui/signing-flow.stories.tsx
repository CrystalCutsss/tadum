// Сценарий подписания (SC-06, D-083): два шага — договор SPA и вексель в Nafith — в матрице AR/EN × light/dark,
// axe по четырём панелям; события скачивания, WhatsApp, «давно ждём» и «не получилось» проверяются в play.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { matrix, withRouter } from '../../../../.storybook/decorators';
import { markChecklistOpened, type ChecklistItem, type Limit } from '@/entities/limit';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n } from '@/shared/i18n';
import { now, sessionStore, setClock } from '@/shared/lib';

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
  name: 'Оба шага к выполнению: скачать, WhatsApp, инструкция Nafith',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('pending', 'pending')} limitUpdatedAt={now()} company="Ufuq Office Furniture" />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    // Переходы по ссылкам в тесте не нужны — события проверяем, навигацию гасим.
    const block = (e: Event) => e.preventDefault();
    canvasElement.addEventListener('click', block, true);
    try {
      for (const { c, t } of panels(canvasElement)) {
        await expect(c.getByText(t('checklist.spa'))).toBeVisible();
        await expect(c.getByText(t('checklist.pn_nafith'))).toBeVisible();
        await expect(c.getByRole('link', { name: t('signing.spa.download') })).toHaveAttribute('href', '/demo/spa.pdf');
        const send = c.getByRole('link', { name: t('signing.spa.send') });
        await expect(send.getAttribute('href')).toContain('https://wa.me/');
        await expect(send).toHaveAttribute('target', '_blank');
        await expect(c.getByText(t('signing.pn.body'))).toBeVisible();
      }
      const [first] = panels(canvasElement);
      await userEvent.click(first!.c.getByRole('link', { name: first!.t('signing.spa.download') }));
      await userEvent.click(first!.c.getByRole('link', { name: first!.t('signing.spa.send') }));
      await expect(events.map((e) => e.name)).toEqual(['spa_downloaded', 'spa_whatsapp_clicked']);
      // После нажатия WhatsApp шаг SPA — «ждём подтверждения».
      await expect(first!.el.querySelectorAll('li')[0]).toHaveTextContent(first!.t('checklist.status.in_progress'));
    } finally {
      canvasElement.removeEventListener('click', block, true);
      restore();
      sessionStore.remove('checklist:opened:spa');
    }
  },
};

export const SpaDonePnPending: Story = {
  name: 'SPA подтверждён, вексель ждёт Nafith',
  render: () => <SigningFlow limit={checklist('done', 'pending')} limitUpdatedAt={now()} company="Ufuq Office Furniture" />,
  play: async ({ canvasElement }) => {
    for (const { el, t } of panels(canvasElement)) {
      const [spa, pn] = el.querySelectorAll('li');
      await expect(spa).toHaveTextContent(t('checklist.status.done'));
      await expect(within(spa!).queryByRole('link', { name: t('signing.spa.send') })).toBeNull();
      await expect(pn).toHaveTextContent(t('signing.pn.not_received'));
    }
  },
};

export const SpaStale: Story = {
  name: 'SPA отправлен больше 24 ч назад — подсказка и checklist_item_stale',
  loaders: [
    () => {
      const restore = setClock(() => FIXED);
      markChecklistOpened('spa', FIXED - 25 * HOUR);
      return { restore, captured: eventsLoader() };
    },
  ],
  render: () => <SigningFlow limit={checklist('pending', 'pending')} limitUpdatedAt={FIXED - 26 * HOUR} company="Ufuq Office Furniture" />,
  play: async ({ canvasElement, loaded }) => {
    const l = loaded as { restore: () => void; captured: Captured };
    try {
      for (const { el, t } of panels(canvasElement)) {
        const spa = el.querySelectorAll('li')[0]!;
        await expect(spa).toHaveTextContent(t('checklist.status.in_progress'));
        await expect(within(spa).getByText(t('checklist.stale_hint'))).toBeVisible();
      }
      await expect(propsOf(l.captured.events, 'checklist_item_stale')).toEqual(Array(4).fill({ item: 'spa', hours: 25 }));
    } finally {
      l.restore();
      l.captured.restore();
      sessionStore.remove('checklist:opened:spa');
    }
  },
};

export const PnFailed: Story = {
  name: 'Вексель не подтвердился — нейтральный текст и checklist_item_failed_viewed',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('done', 'failed')} limitUpdatedAt={now()} company="Ufuq Office Furniture" />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { el, t } of panels(canvasElement)) {
        const pn = el.querySelectorAll('li')[1]!;
        await expect(pn).toHaveTextContent(t('checklist.status.failed'));
        await expect(within(pn).getByText(t('checklist.item_failed'))).toBeVisible();
      }
      await expect(propsOf(events, 'checklist_item_failed_viewed')).toEqual(Array(4).fill({ item: 'pn_nafith' }));
    } finally {
      restore();
    }
  },
};
