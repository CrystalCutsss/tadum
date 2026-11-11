// Этапы экрана «Заявка» после одобрения (A-063): карточка лимита, шаги подписания, лимит отменён, «Лимит одобрен»,
// подробности заявки и папка документов — каждое состояние в матрице AR/EN × light/dark, axe по всем четырём панелям.
// MetalCard в историях может рисоваться без WebGL (CSS-запасной вариант) — это ожидаемо.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import type { ChecklistItem, Limit } from '@/entities/limit';
import { markChecklistOpened } from '@/entities/limit';
import { createI18n } from '@/shared/i18n';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { now, setClock } from '@/shared/lib';

import { CancelledLimitCard, LimitCard, SigningSteps } from './application-stage-card';
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
const url = (key: ChecklistItem['key']) => `/demo/sign?item=${key}`;
const items = (spa: ChecklistItem['status'], company: ChecklistItem['status'], owner: ChecklistItem['status']): ChecklistItem[] => [
  { key: 'spa_sadq', status: spa, external_url: url('spa_sadq') },
  { key: 'pn_company_nafith', status: company, external_url: url('pn_company_nafith') },
  { key: 'pn_owner_nafith', status: owner, external_url: url('pn_owner_nafith') },
];
const limit = (status: Limit['status'], checklist: ChecklistItem[]): Pick<Limit, 'status' | 'checklist'> => ({
  status,
  checklist: { items: checklist, completed: checklist.every((i) => i.status === 'done') },
});

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
  name: 'LimitCard — ready («Подписание»)',
  render: () => <LimitCard limit={{ status: 'ready', approved: sar(250_000) }} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      await expect(el).toHaveTextContent('250,000');
      await expect(c.getByText(t('application.signing.info'))).toBeVisible();
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

// ---------- Шаги подписания ----------

export const SigningLocked: Story = {
  name: 'SigningSteps — заблокированы (лимит pending)',
  render: () => <SigningSteps limit={limit('pending', items('pending', 'pending', 'pending'))} limitUpdatedAt={now()} />,
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getAllByText(t('checklist.status.locked'))).toHaveLength(3);
      await expect(c.getByText(t('checklist.locked_hint'))).toBeVisible();
      await expect(c.queryAllByRole('link')).toHaveLength(0);
    }
  },
};

export const SigningAllPending: Story = {
  name: 'SigningSteps — все три к выполнению',
  render: () => <SigningSteps limit={limit('ready', items('pending', 'pending', 'pending'))} limitUpdatedAt={now()} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      const links = c.getAllByRole('link', { name: t('checklist.open') });
      await expect(links).toHaveLength(3);
      for (const link of links) {
        await expect(link.getAttribute('href')).toContain('/demo/sign?item=');
        await expect(link).toHaveAttribute('target', '_blank');
      }
      // Акцент — на первом незавершённом пункте.
      const current = el.querySelectorAll('[aria-current="step"]');
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveTextContent(t('checklist.spa_sadq'));
    }
  },
};

export const SigningPartial: Story = {
  name: 'SigningSteps — done / in_progress / pending',
  render: () => <SigningSteps limit={limit('ready', items('done', 'in_progress', 'pending'))} limitUpdatedAt={now()} />,
  play: async ({ canvasElement }) => {
    for (const { el, c, t } of panels(canvasElement)) {
      const rows = el.querySelectorAll('li');
      await expect(rows[0]).toHaveTextContent(t('checklist.status.done'));
      await expect(rows[1]).toHaveTextContent(t('checklist.status.in_progress'));
      await expect(within(rows[2]!).getByRole('link', { name: t('checklist.open') })).toBeVisible();
      await expect(c.getAllByRole('link')).toHaveLength(1);
      await expect(el.querySelector('[aria-current="step"]')).toHaveTextContent(t('checklist.pn_company_nafith'));
    }
  },
};

/** Фиксированное время: 2026-11-04 09:00 Эр-Рияд (как в e2e и unit). */
const FIXED = Date.parse('2026-11-04T09:00:00+03:00');
const HOUR = 3_600_000;

export const SigningStale: Story = {
  name: 'SigningSteps — ждём подтверждения больше 24 ч',
  loaders: [
    () => {
      const restore = setClock(() => FIXED);
      // Ссылку открыли 25 ч назад, после последнего ответа сервера (26 ч назад).
      markChecklistOpened('pn_company_nafith', FIXED - 25 * HOUR);
      return { restore, captured: eventsLoader() };
    },
  ],
  render: () => <SigningSteps limit={limit('ready', items('done', 'in_progress', 'pending'))} limitUpdatedAt={FIXED - 26 * HOUR} />,
  play: async ({ canvasElement, loaded }) => {
    try {
      for (const { el, t } of panels(canvasElement)) {
        const row = el.querySelectorAll('li')[1]!;
        await expect(row).toHaveTextContent(t('checklist.status.in_progress'));
        await expect(within(row).getByText(t('checklist.stale_hint'))).toBeVisible();
      }
      // checklist_item_stale — по разу на панель, часы с момента клика «Открыть».
      const { events } = (loaded as { captured: Captured }).captured;
      await expect(propsOf(events, 'checklist_item_stale')).toEqual(Array(4).fill({ item: 'pn_company_nafith', hours: 25 }));
    } finally {
      (loaded as { restore: () => void; captured: Captured }).restore();
      (loaded as { captured: Captured }).captured.restore();
    }
  },
};

export const SigningFailed: Story = {
  name: 'SigningSteps — шаг не получилось подтвердить',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningSteps limit={limit('ready', items('done', 'failed', 'pending'))} limitUpdatedAt={now()} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { el, t } of panels(canvasElement)) {
        const row = el.querySelectorAll('li')[1]!;
        await expect(row).toHaveTextContent(t('checklist.status.failed'));
        await expect(within(row).getByText(t('checklist.item_failed'))).toBeVisible();
        await expect(within(row).queryByRole('link')).toBeNull();
      }
      await expect(propsOf(events, 'checklist_item_failed_viewed')).toEqual(Array(4).fill({ item: 'pn_company_nafith' }));
    } finally {
      restore();
    }
  },
};

export const SigningNafithWithoutLink: Story = {
  name: 'SigningSteps — у векселя нет ссылки: инструкция Nafith',
  render: () => (
    <SigningSteps
      limit={limit('ready', [
        { key: 'spa_sadq', status: 'done', external_url: url('spa_sadq') },
        { key: 'pn_company_nafith', status: 'pending' },
        { key: 'pn_owner_nafith', status: 'pending' },
      ])}
      limitUpdatedAt={now()}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getAllByText(t('checklist.nafith_instruction'))).toHaveLength(2);
      await expect(c.queryAllByRole('link')).toHaveLength(0);
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
  name: 'ApplicationFacts — даты и сумма (?view=details)',
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
