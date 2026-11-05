// Оболочка кабинета (черновик §2 как гипотеза): шапка single/dual, навигация, баннеры, ошибка загрузки.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { signedIn, tr } from '../../../../.storybook/story-helpers';
import { matrix, withRouter } from '../../../../.storybook/decorators';
import { Button } from '@/shared/ui';

import { AppHeader } from './app-header';
import { OfflineBanner, StorageBanner } from './banners';
import { CabinetShell } from './cabinet-shell';
import { LoadError } from './load-error';

const slots = { languageSwitch: <Button variant="ghost">EN</Button> };

const meta = {
  title: 'widgets/CabinetShell',
  component: CabinetShell,
  args: { family: 'client', children: <p>…</p>, ...slots },
  decorators: [withRouter('/c/home')],
  loaders: [async () => ({ api: await signedIn('client_active') })],
} satisfies Meta<typeof CabinetShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Client: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText('أفق للأثاث المكتبي')).toBeVisible());
    // Нижняя навигация: Главная · Документы · Помощь.
    await expect(within(canvasElement).getAllByRole('link', { name: tr('nav.documents') }).length).toBeGreaterThan(0);
  },
};

export const Supplier: Story = {
  args: { family: 'supplier' },
  decorators: [withRouter('/s/home')],
  loaders: [async () => ({ api: await signedIn('supplier_active') })],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText('Bayt Al Khayr Wholesale')).toBeVisible());
  },
};

export const Dual: Story = {
  name: 'dual — переключатель ролей в шапке',
  args: { renderRoleSwitch: (current) => <Button variant="outline">{current}</Button> },
  loaders: [async () => ({ api: await signedIn('dual_active') })],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByRole('button', { name: 'client' })).toBeVisible());
  },
};

export const LogoutFromMenu: Story = {
  name: 'Меню → «Выйти» — диалог подтверждения',
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('nav.more') }));
    await userEvent.click(await body.findByRole('menuitem', { name: tr('help.logout') }));
    await waitFor(() => expect(body.getByRole('dialog')).toHaveTextContent(tr('help.logout_confirm')));
    await userEvent.click(body.getByRole('button', { name: tr('common.cancel') }));
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

export const HeaderMatrix: StoryObj<typeof AppHeader> = {
  name: 'Шапка × AR/EN × light/dark',
  ...matrix,
  render: () => (
    <div className="flex flex-col gap-2">
      <AppHeader family="client" contextName="Ufuq Office Furniture" languageSwitch={slots.languageSwitch} roleSwitch={null} />
      <AppHeader family="client" contextName="Jood Home Appliances" languageSwitch={slots.languageSwitch} roleSwitch={<Button variant="outline">client | supplier</Button>} />
    </div>
  ),
};

export const Banners: StoryObj<typeof OfflineBanner> = {
  name: 'Офлайн и хранилище × AR/EN × light/dark',
  ...matrix,
  render: () => (
    <div className="flex flex-col gap-2">
      <OfflineBanner forceOffline />
      <StorageBanner force />
    </div>
  ),
};

export const LoadErrorCard: StoryObj<typeof LoadError> = {
  name: 'Ошибка загрузки × AR/EN × light/dark',
  ...matrix,
  render: () => <LoadError onRetry={() => undefined} support={<Button variant="outline">support</Button>} />,
};
