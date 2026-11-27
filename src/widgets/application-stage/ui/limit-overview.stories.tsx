// Блок #limit главной активного клиента (бриф TD-002 §3, §4): обычное состояние, «ещё не использован», «выбран
// полностью», ошибка данных, отменён после активации, офлайн, крайняя сумма на 360 px — в матрице AR/EN × light/dark.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n, formatPercent } from '@/shared/i18n';
import { now } from '@/shared/lib';

import { LimitOverview, type LimitOverviewProps } from './limit-overview';

const meta = { title: 'widgets/ApplicationStage/LimitOverview', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sar = (amount: number) => ({ amount_minor: amount * 100, currency: 'SAR' as const });
const limit = (approved: number, used: number, status: 'active' | 'cancelled' = 'active'): LimitOverviewProps['limit'] => ({
  status,
  approved: sar(approved),
  used: sar(used),
  available: sar(Math.max(approved - used, 0)),
});
const render = (props: Partial<LimitOverviewProps> & Pick<LimitOverviewProps, 'limit'>) => (
  <LimitOverview company="Ufuq Office Furniture" updatedAt={now() - 5 * 60_000} {...props} />
);

function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const lang: 'ar' | 'en' = el.getAttribute('lang') === 'en' ? 'en' : 'ar';
    const i18n = createI18n(lang);
    return { el, lang, c: within(el), t: (key: ParseKeys, values?: Record<string, unknown>): string => i18n.t(key, values ?? {}) };
  });
}
function eventsLoader() {
  const events: CapturedEvent[] = [];
  const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return { events, restore };
}
type Captured = { events: CapturedEvent[]; restore: () => void };
const names = (events: CapturedEvent[], name: string) => events.filter((e) => e.name === name);

export const Active: Story = {
  name: 'active — доступно 107,500, 28 % использовано, «Новая покупка»',
  render: () => render({ limit: limit(150_000, 42_500) }),
  play: async ({ canvasElement }) => {
    for (const { el, c, t, lang } of panels(canvasElement)) {
      await expect(c.getByRole('heading', { name: t('limit.available') })).toBeVisible();
      await expect(el).toHaveTextContent('107,500');
      await expect(el).toHaveTextContent('150,000');
      await expect(el).toHaveTextContent('42,500');
      await expect(c.getByRole('progressbar')).toHaveAttribute('aria-label', t('limit.used_share', { percent: formatPercent(28, lang) }));
      // toHaveTextContent сводит неразрывный пробел к обычному в тексте, но не в ожидании.
      await expect(el).toHaveTextContent(t('limit.used_share', { percent: formatPercent(28, lang) }).replace(/\u00a0/g, ' '));
      await expect(c.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String((42_500 / 150_000) * 100));
      await expect(c.getByText(t('limit.updated_at', { time: t('relative.minutes_ago', { count: 5 }) }))).toBeVisible();
      // Под суммой одна главная кнопка.
      await expect(c.getAllByRole('button')).toHaveLength(1);
      await expect(c.getByRole('button', { name: t('home.purchase.cta') })).toBeVisible();
    }
  },
};

export const NotUsedYet: Story = {
  name: 'used = 0 — полоса пустая, «ещё не использован»',
  render: () => render({ limit: limit(100_000, 0) }),
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByText(t('limit.not_used_yet'))).toBeVisible();
      await expect(c.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    }
  },
};

export const FullyUsed: Story = {
  name: 'available = 0 — 100 %, подсказка и «Написать менеджеру» вместо покупки',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => render({ limit: limit(100_000, 100_000) }),
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { c, t } of panels(canvasElement)) {
        await expect(c.getByText(t('limit.fully_used'))).toBeVisible();
        await expect(c.getByText(t('limit.fully_used_hint'))).toBeVisible();
        await expect(c.queryByRole('button', { name: t('home.purchase.cta') })).toBeNull();
        const manager = c.getByRole('link', { name: t('home.manager.cta') });
        await expect(decodeURIComponent(manager.getAttribute('href') ?? '')).toContain(t('support.prefill.limit_full', { company: 'Ufuq Office Furniture' }));
      }
      await expect(names(events, 'limit_fully_used_viewed')).toHaveLength(4);
    } finally {
      restore();
    }
  },
};

export const UsedExceedsApproved: Story = {
  name: 'used > approved — доступно 0, 100 %, экран не падает (A3)',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => render({ limit: { status: 'active', approved: sar(100_000), used: sar(120_000), available: sar(5_000) } }),
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { el, c } of panels(canvasElement)) {
        await expect(c.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
        await expect(el.querySelector('section')).toHaveTextContent(/(^|\D)0(\D|$)/);
      }
      await expect(names(events, 'data_inconsistency').map((e) => e.props)).toEqual(Array(4).fill({ kind: 'used_exceeds_approved' }));
    } finally {
      restore();
    }
  },
};

export const CancelledAfterActivation: Story = {
  name: 'cancelled после активации — плашка и «Связаться с нами», покупки нет (A4)',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => render({ limit: limit(120_000, 20_000, 'cancelled') }),
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { c, t } of panels(canvasElement)) {
        await expect(c.getByText(t('limit.cancelled'))).toBeVisible();
        await expect(c.getByRole('link', { name: t('application.cancelled.contact') }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
        await expect(c.queryByRole('button', { name: t('home.purchase.cta') })).toBeNull();
      }
      await expect(names(events, 'limit_cancelled_viewed')).toHaveLength(4);
    } finally {
      restore();
    }
  },
};

export const Offline: Story = {
  name: 'офлайн — суммы из кэша с подписью времени',
  render: () => render({ limit: limit(150_000, 42_500), forceOffline: true }),
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByText(t('common.cached_at', { time: t('relative.minutes_ago', { count: 5 }) }))).toBeVisible();
    }
  },
};

export const ExtremeAmount360: Story = {
  name: 'сумма ≥ 10,000,000 на 360 px — разделители, без «M», без переноса',
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  render: () => <div className="w-90 max-w-full">{render({ limit: limit(25_000_000, 12_345_678) })}</div>,
  play: async ({ canvasElement }) => {
    for (const { el } of panels(canvasElement)) {
      await expect(el).toHaveTextContent('12,654,322');
      await expect(el).not.toHaveTextContent(/\dM\b/);
      const card = el.querySelector<HTMLElement>('section')!;
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
  },
};
