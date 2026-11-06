// Оболочка кабинета (решение Кирилла 2026-11-06): сайдбар sidebar-08 (inset), шапка с крошками, сетка 3 колонки.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { signedIn, tr } from '../../../../.storybook/story-helpers';
import { matrix, withRouter } from '../../../../.storybook/decorators';
import { Button, SidebarProvider } from '@/shared/ui';

import { AppHeader } from './app-header';
import { OfflineBanner, StorageBanner } from './banners';
import { CabinetShell } from './cabinet-shell';
import { LoadError } from './load-error';

const slots = { languageSwitch: <Button variant="ghost">EN</Button>, themeToggle: <Button variant="ghost">theme</Button>, support: <Button variant="outline">support</Button> };

const meta = {
  title: 'widgets/CabinetShell',
  component: CabinetShell,
  args: { family: 'client', children: <p>…</p>, ...slots },
  decorators: [withRouter('/c/home')],
  loaders: [async () => ({ api: await signedIn('client_active') })],
  parameters: { layout: 'fullscreen' },
  // Сайдбар виден на десктопе; на mobile360 (по умолчанию) он закрытая шторка.
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
} satisfies Meta<typeof CabinetShell>;
export default meta;
type Story = StoryObj<typeof meta>;

const account = (canvasElement: HTMLElement) => within(canvasElement).findByRole('button', { name: new RegExp(tr('nav.account')) });

export const Client: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Основное меню: Home и Documents, текущая страница — в крошках шапки.
    const nav = await canvas.findByRole('navigation', { name: tr('nav.main') });
    await expect(within(nav).getByRole('link', { name: tr('nav.home') })).toHaveAttribute('data-active', 'true');
    await expect(within(nav).getByRole('link', { name: tr('nav.documents') })).toBeVisible();
    await expect(within(canvas.getByRole('navigation', { name: tr('nav.breadcrumb') })).getByText(tr('nav.home'))).toBeVisible();
    // Аккаунт: название компании (по-арабски в ar, A-055) и роль подстрочником.
    await waitFor(async () => expect(await account(canvasElement)).toHaveTextContent(/أفق للأثاث المكتبي|Ufuq Office Furniture/));
    await expect(await account(canvasElement)).toHaveTextContent(tr('role.client'));
  },
};

export const Supplier: Story = {
  args: { family: 'supplier' },
  decorators: [withRouter('/s/documents')],
  loaders: [async () => ({ api: await signedIn('supplier_active') })],
  play: async ({ canvasElement }) => {
    const nav = await within(canvasElement).findByRole('navigation', { name: tr('nav.main') });
    await expect(within(nav).getByRole('link', { name: tr('nav.documents') })).toHaveAttribute('data-active', 'true');
    await expect(await account(canvasElement)).toHaveTextContent(tr('role.supplier'));
  },
};

export const DualAccountMenu: Story = {
  name: 'dual — переключение ролей в меню аккаунта',
  loaders: [async () => ({ api: await signedIn('dual_active') })],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Подсказка dual показывается один раз — закрываем.
    const dismiss = await body.findByRole('button', { name: tr('role.hint_dismiss') });
    await userEvent.click(dismiss);
    await userEvent.click(await account(canvasElement));
    await expect(await body.findByRole('menuitemradio', { name: tr('role.client') })).toHaveAttribute('aria-checked', 'true');
    // Меню появляется с анимацией (в начале прозрачность 0) — видимость ждём, а не проверяем сразу.
    await waitFor(() => expect(body.getByRole('menuitemradio', { name: tr('role.supplier') })).toBeVisible());
    await waitFor(() => expect(body.getByRole('menuitem', { name: tr('nav.settings') })).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
  },
};

export const LogoutFromMenu: Story = {
  name: 'Аккаунт → «Выйти» — диалог подтверждения',
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await account(canvasElement));
    // Не dual — переключателя ролей нет.
    await waitFor(() => expect(body.getByRole('menuitem', { name: tr('help.logout') })).toBeVisible());
    await expect(body.queryByRole('menuitemradio')).toBeNull();
    await userEvent.click(body.getByRole('menuitem', { name: tr('help.logout') }));
    await waitFor(() => expect(body.getByRole('dialog')).toHaveTextContent(tr('help.logout_confirm')));
    await userEvent.click(body.getByRole('button', { name: tr('common.cancel') }));
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

export const CollapseSidebar: Story = {
  name: 'Кнопка в шапке скрывает и возвращает сайдбар',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button', { name: tr('nav.toggle_sidebar') });
    const state = () => canvasElement.querySelector('[data-slot="sidebar"][data-state]')?.getAttribute('data-state');
    await waitFor(() => expect(state()).toBe('expanded'));
    await userEvent.click(trigger);
    await waitFor(() => expect(state()).toBe('collapsed'));
    await userEvent.click(trigger);
    await waitFor(() => expect(state()).toBe('expanded'));
  },
};

export const MobileSheet: Story = {
  name: 'Телефон — меню в шторке по кнопке',
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await within(canvasElement).findByRole('button', { name: tr('nav.toggle_sidebar') }));
    const sheet = await body.findByRole('dialog', { name: tr('nav.mobile_title') });
    // Шторка выезжает с анимацией — ждём, пока пункты станут видны.
    await waitFor(() => expect(within(sheet).getByRole('link', { name: tr('nav.documents') })).toBeVisible());
    await waitFor(() => expect(within(sheet).getByRole('button', { name: new RegExp(tr('nav.account')) })).toBeVisible());
    await userEvent.keyboard('{Escape}');
  },
};

export const HeaderMatrix: StoryObj<typeof AppHeader> = {
  name: 'Шапка × AR/EN × light/dark',
  ...matrix,
  render: () => (
    <SidebarProvider className="min-h-0">
      <div className="flex w-full flex-col gap-2">
        <AppHeader crumbs={[{ labelKey: 'nav.home' }]} languageSwitch={slots.languageSwitch} themeToggle={slots.themeToggle} />
        <AppHeader crumbs={[{ labelKey: 'nav.documents', to: '/c/documents' }, { labelKey: 'help.title' }]} languageSwitch={slots.languageSwitch} themeToggle={slots.themeToggle} />
      </div>
    </SidebarProvider>
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
