// /c/home против мока (бриф TD-002 §4): active (client_active), первый визит, first_purchase, отменён после активации,
// загрузка и ошибка. Экран целиком — одна копия (язык и тема из глобалов); блоки в матрице — в историях виджетов.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { signedIn, tr } from '../../../.storybook/story-helpers';
import { withRouter } from '../../../.storybook/decorators';
import { storage } from '@/shared/lib';

import { ClientHome } from './client-home';

const resetFlags = () => {
  for (const id of ['lim_ca', 'lim_cfp']) storage.remove(`home:welcome_dismissed:${id}`);
  storage.remove('home:how_to_buy_collapsed');
  storage.remove('status:last_seen');
  storage.remove('status:banner_dismissed');
};

const meta = {
  title: 'pages/ClientHome',
  component: ClientHome,
  decorators: [withRouter('/c/home')],
  loaders: [
    async () => {
      resetFlags();
      storage.set('home:welcome_dismissed:lim_ca', '1');
      return { api: await signedIn('client_active') };
    },
  ],
} satisfies Meta<typeof ClientHome>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  name: 'client_active — лимит, «Новая покупка», шаги, договор',
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByRole('heading', { name: tr('limit.available') })).toBeVisible());
    await expect(canvasElement).toHaveTextContent('107,500');
    await expect(c.getByRole('button', { name: tr('home.purchase.cta') })).toBeVisible();
    await expect(c.getByRole('heading', { name: tr('how_to_buy.title') })).toBeVisible();
    await expect(c.getAllByRole('link', { name: tr('home.docs_link') })[0]).toHaveAttribute('href', '/c/documents');
    await expect(c.queryByRole('heading', { name: tr('home.welcome.title') })).toBeNull();
    // Шкалы и «следующего шага» на главной нет (D-098).
    await expect(c.queryByRole('list', { name: /timeline|المراحل/i })).toBeNull();
  },
};

export const FirstVisit: Story = {
  name: 'Первый визит — карточка «Что теперь можно» над лимитом',
  loaders: [
    async () => {
      resetFlags();
      return { api: await signedIn('client_active') };
    },
  ],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const welcome = await c.findByRole('heading', { name: tr('home.welcome.title') });
    const limit = c.getByRole('heading', { name: tr('limit.available') });
    await expect(welcome.compareDocumentPosition(limit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  },
};

export const FirstPurchase: Story = {
  name: 'client_first_purchase — тот же экран, суммы 70,000 / 100,000',
  loaders: [
    async () => {
      resetFlags();
      storage.set('home:welcome_dismissed:lim_cfp', '1');
      return { api: await signedIn('client_first_purchase') };
    },
  ],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement).toHaveTextContent('70,000'));
    await expect(canvasElement).toHaveTextContent('100,000');
  },
};

export const CancelledAfterActivation: Story = {
  name: 'Лимит отменён после активации — плашка, без покупки и шагов',
  loaders: [
    async () => {
      resetFlags();
      const api = await signedIn('client_active');
      api.demo!.cancelLimit();
      return { api };
    },
  ],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByText(tr('limit.cancelled'))).toBeVisible());
    await expect(c.queryByRole('button', { name: tr('home.purchase.cta') })).toBeNull();
    await expect(c.queryByRole('heading', { name: tr('how_to_buy.title') })).toBeNull();
    await expect(c.queryByRole('heading', { name: tr('home.welcome.title') })).toBeNull();
  },
};

export const LoadFailed: Story = {
  name: 'Ошибка загрузки — «Повторить» и поддержка',
  loaders: [
    async () => {
      const api = await signedIn('client_active');
      api.demo!.setNetwork('error');
      return { api };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByRole('button', { name: tr('common.retry') })).toBeVisible(), { timeout: 5000 });
    (loaded as { api: { demo?: { setNetwork: (m: 'ok') => void } } }).api.demo!.setNetwork('ok');
  },
};

export const Loading: Story = {
  name: 'Загрузка — скелетон',
  loaders: [
    async () => {
      const api = await signedIn('client_active');
      api.demo!.setNetwork('slow');
      return { api };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    (loaded as { api: { demo?: { setNetwork: (m: 'ok') => void } } }).api.demo!.setNetwork('ok');
  },
};
