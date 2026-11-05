// /c/home против мока (SC-05 §6): under-review / with-eta / overdue, баннер смены статуса, закрытая заявка.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { signedIn, tr } from '../../../.storybook/story-helpers';
import { withRouter } from '../../../.storybook/decorators';
import { now, setClock, storage } from '@/shared/lib';

import { ClientHome } from './client-home';

const meta = {
  title: 'pages/ClientHome',
  component: ClientHome,
  decorators: [withRouter('/c/home')],
  loaders: [
    async () => {
      storage.remove('status:last_seen');
      storage.remove('status:banner_dismissed');
      return { api: await signedIn('client_submitted') };
    },
  ],
} satisfies Meta<typeof ClientHome>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UnderReviewWithEta: Story = {
  name: 'under_review — срок из данных, без элементов загрузки',
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByText(tr('next_step.under_review_eta', { count: 24, hours: 24 }))).toBeVisible());
    await expect(c.getByText(tr('home.documents_summary', { count: 7 }))).toBeVisible();
    await expect(c.queryByRole('button', { name: /upload|ارفع/i })).toBeNull();
    await expect(c.getByRole('link', { name: /WhatsApp|واتساب/ }).getAttribute('href')).toContain('?text=');
  },
};

export const UnderReviewOverdue: Story = {
  name: 'under_review — дольше обычного (A3)',
  loaders: [
    async () => {
      const api = await signedIn('client_submitted');
      // Комплект отправлен 3 ч назад, срок 24 ч: через 30 ч проверка дольше обычного.
      const t = now() + 30 * 3_600_000;
      return { api, restore: setClock(() => t) };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    await waitFor(() => expect(within(canvasElement).getByText(tr('next_step.under_review_longer'))).toBeVisible());
    (loaded as { restore: () => void }).restore();
  },
};

export const StatusChangedBanner: Story = {
  name: 'Баннер «со времени последнего визита» (A6a), закрытие запоминается',
  loaders: [
    async () => {
      storage.set('status:last_seen', 'docs_required');
      storage.remove('status:banner_dismissed');
      return { api: await signedIn('client_submitted') };
    },
  ],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const text = tr('status.changed_banner', { status: tr('status.client.under_review') });
    await waitFor(() => expect(c.getByText(text)).toBeVisible());
    await userEvent.click(c.getByRole('button', { name: tr('status.changed_banner_dismiss') }));
    await waitFor(() => expect(c.queryByText(text)).toBeNull());
    await expect(storage.get('status:banner_dismissed')).toBe('docs_required->under_review');
  },
};

export const Closed: Story = {
  name: 'closed — нейтральная карточка вместо шкалы',
  loaders: [async () => ({ api: await signedIn('client_closed_lost') })],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByText(tr('closed.title'))).toBeVisible());
    await expect(c.queryByRole('list', { name: tr('timeline.title') })).toBeNull();
  },
};

export const MoreDocsRequested: Story = {
  name: 'docs_required — дозапрос',
  loaders: [async () => ({ api: await signedIn('client_more_docs') })],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText(tr('next_step.more_docs_requested', { count: 2 }))).toBeVisible());
  },
};

export const StatusChangedWhileOpen: Story = {
  name: 'Смена статуса при открытом экране (A6, D-035) — без перезагрузки',
  play: async ({ canvasElement, loaded }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByText(tr('next_step.under_review_eta', { count: 24, hours: 24 }))).toBeVisible());
    const { api } = loaded as { api: Awaited<ReturnType<typeof signedIn>> };
    api.demo!.uwApproveApplication({ amount_minor: 15_000_000, currency: 'SAR' });
    // Возврат на вкладку: TanStack Query перезапрашивает данные (refetchOnWindowFocus).
    window.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(c.getByText(tr('next_step.offer_confirmation'))).toBeVisible(), { timeout: 3000 });
    await expect(storage.get('status:last_seen')).toBe('approved');
  },
};
