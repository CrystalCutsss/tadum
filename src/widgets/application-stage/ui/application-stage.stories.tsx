// Этапы экрана «Заявка» после одобрения (A-063): карточка лимита (на «Подписании» — с кнопкой, D-083), лимит отменён, «Лимит одобрен»,
// подробности заявки и папка документов — каждое состояние в матрице AR/EN × light/dark, axe по всем четырём панелям.
// MetalCard в историях может рисоваться без WebGL (CSS-запасной вариант) — это ожидаемо.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { createI18n } from '@/shared/i18n';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';

import { CancelledLimitCard, LimitCard } from './application-stage-card';
import { ApplicationFacts, ApplicationSummaryCard } from './application-summary';
import { DocumentsFolder } from './documents-folder';

const meta = { title: 'widgets/ApplicationStage', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Панели матрицы с переводом на языке панели (у каждой свой язык, а не язык <html>). */
function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const lang = (el.getAttribute('lang') === 'en' ? 'en' : 'ar');
    const i18n = createI18n(lang);
    return { el, c: within(el), t: (key: ParseKeys, values?: Record<string, unknown>): string => i18n.t(key, values ?? {}) };
  });
}

/** События, отправленные при показе (до первой отрисовки — из loader); restore — в конце play. */
function eventsLoader() {
  const events: CapturedEvent[] = [];
  const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return { events, restore };
}
type Captured = { events: CapturedEvent[]; restore: () => void };
const propsOf = (events: CapturedEvent[], name: string) => events.filter((e) => e.name === name).map((e) => e.props);

const sar = (amount: number) => ({ amount_minor: amount * 100, currency: 'SAR' as const });

// ---------- Карточка лимита ----------

export const LimitPendingWithAmount: Story = {
  name: 'LimitCard — pending, сумма есть («Решение»)',
  render: () => <LimitCard limit={{ status: 'pending', approved: sar(180_000) }} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      await expect(el).toHaveTextContent('180,000');
      await expect(c.getByText(t('application.limit_label'))).toBeVisible();
      await expect(c.getByText(t('application.decision.body'))).toBeVisible();
      await expect(c.queryByText(t('application.decision.no_amount'))).toBeNull();
    }
  },
};

export const LimitPendingNoAmount: Story = {
  name: 'LimitCard — pending, суммы ещё нет',
  render: () => <LimitCard limit={{ status: 'pending', approved: sar(0) }} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      await expect(c.getByText(t('application.decision.no_amount'))).toBeVisible();
      await expect(el).not.toHaveTextContent(/\d/);
    }
  },
};

export const LimitReady: Story = {
  name: 'LimitCard — ready («Подписание»): только сумма и кнопка подписания',
  render: () => <LimitCard limit={{ status: 'ready', approved: sar(250_000) }} action={<button type="button">Sign</button>} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      await expect(el).toHaveTextContent('250,000');
      // На «Подписании» пояснения нет, только кнопка сценария (Кирилл 2026-11-15).
      await expect(c.queryByText(t('application.decision.body'))).toBeNull();
      await expect(c.getByRole('button')).toBeVisible();
    }
  },
};

export const LimitExtremeAmount360: Story = {
  name: 'LimitCard — крайняя сумма 12,500,000 на 360 px',
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  render: () => (
    <div className="w-90 max-w-full">
      <LimitCard limit={{ status: 'ready', approved: sar(12_500_000) }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { el } of panels(canvasElement)) {
      await expect(el).toHaveTextContent('12,500,000');
      const card = el.querySelector<HTMLElement>('section')!;
      // Сумма не вылезает за карточку и не даёт горизонтальной прокрутки.
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
  },
};

// ---------- Лимит отменён ----------

export const Cancelled: Story = {
  name: 'CancelledLimitCard — «Подать новую заявку» на лендинг',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <CancelledLimitCard applyUrl="https://tadum.sa" />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { c, t } of panels(canvasElement)) {
        await expect(c.getByRole('heading', { name: t('application.cancelled.title') })).toBeVisible();
        await expect(c.getByRole('link', { name: t('application.cancelled.apply') })).toHaveAttribute('href', 'https://tadum.sa');
      }
      await expect(propsOf(events, 'limit_cancelled_viewed')).toEqual(Array(4).fill({}));
    } finally {
      restore();
    }
  },
};

// ---------- «Лимит одобрен» и подробности ----------

const approvedLimit = { approved: sar(250_000), activated_at: '2026-11-03T10:00:00+03:00' };
const onOpenSummary = fn();

export const Summary: Story = {
  name: 'ApplicationSummaryCard — «Лимит одобрен», «Открыть заявку»',
  render: () => <ApplicationSummaryCard sentAt="2026-10-29T12:00:00+03:00" limit={approvedLimit} onOpen={onOpenSummary} />,
  play: async ({ canvasElement }) => {
    onOpenSummary.mockClear();
    const all = panels(canvasElement);
    for (const { el, c, t } of all) {
      await expect(c.getByRole('heading', { name: t('application.summary.title') })).toBeVisible();
      await expect(el).toHaveTextContent('250,000');
      await expect(c.getByText(t('application.summary.approved_at'))).toBeVisible();
      await expect(c.getByText(t('application.summary.sent'))).toBeVisible();
    }
    const first = all[0]!;
    await userEvent.click(first.c.getByRole('button', { name: first.t('application.summary.open') }));
    await expect(onOpenSummary).toHaveBeenCalledTimes(1);
  },
};

export const Facts: Story = {
  name: 'ApplicationFacts — даты и сумма (панель подробностей)',
  render: () => <ApplicationFacts sentAt="2026-10-29T12:00:00+03:00" limit={approvedLimit} />,
  play: async ({ canvasElement }) => {
    for (const { el, t } of panels(canvasElement)) {
      const terms = Array.from(el.querySelectorAll('dt')).map((d) => d.textContent);
      await expect(terms).toEqual([t('application.summary.sent'), t('application.summary.approved_at'), t('application.summary.limit')]);
      await expect(el.querySelectorAll('dd')[2]).toHaveTextContent('250,000');
    }
  },
};

// ---------- Папка документов ----------

const onOpenFolder = fn();

export const Folder: Story = {
  name: 'DocumentsFolder — покой; наведение и клик открывают панель',
  render: () => <DocumentsFolder count={7} onOpen={onOpenFolder} className="max-w-sm" />,
  play: async ({ canvasElement }) => {
    onOpenFolder.mockClear();
    const all = panels(canvasElement);
    for (const { c, t } of all) {
      await expect(c.getByRole('button', { name: `${t('application.folder.title')} ${t('application.documents_accepted', { count: 7 })}` })).toBeVisible();
    }
    const button = all[0]!.c.getByRole('button');
    await userEvent.hover(button);
    await userEvent.click(button);
    await waitFor(() => expect(onOpenFolder).toHaveBeenCalledTimes(1));
  },
};
