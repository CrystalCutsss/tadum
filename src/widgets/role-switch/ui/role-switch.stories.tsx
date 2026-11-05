// RoleSwitch для dual (SP-01): «Клиент | Поставщик», подсказка один раз.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { tr } from '../../../../.storybook/story-helpers';
import { withRouter } from '../../../../.storybook/decorators';
import { familyMemory } from '@/entities/session';
import { storage } from '@/shared/lib';

import { RoleSwitch } from './role-switch';

const hint = (seen: boolean) => () => {
  if (seen) storage.set('role:hint_seen', '1');
  else storage.remove('role:hint_seen');
  return {};
};

const meta = {
  title: 'widgets/RoleSwitch',
  component: RoleSwitch,
  args: { current: 'client' },
  decorators: [withRouter('/c/home')],
  loaders: [hint(true)],
} satisfies Meta<typeof RoleSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Client: Story = {};
export const Supplier: Story = { args: { current: 'supplier' } };
export const ClientEn: Story = { globals: { locale: 'en' } };
export const SupplierDark: Story = { args: { current: 'supplier' }, globals: { theme: 'dark' } };

export const FirstTimeHint: Story = {
  name: 'Подсказка при первом входе dual',
  loaders: [hint(false)],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByText(tr('role.hint_supplier'))).toBeVisible());
    await userEvent.click(body.getByRole('button', { name: tr('role.hint_dismiss') }));
    await waitFor(() => expect(body.queryByText(tr('role.hint_supplier'))).toBeNull());
    await expect(storage.get('role:hint_seen')).toBe('1');
  },
};

export const Switches: Story = {
  name: 'Переключение на поставщика',
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: tr('role.supplier') }));
    await expect(familyMemory.last()).toBe('supplier');
  },
};
