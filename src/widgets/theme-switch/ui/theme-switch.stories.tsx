// ThemeSwitch — только в настройках (D-025): выбор применяется сразу и сохраняется; событие theme_changed.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { tr } from '../../../../.storybook/story-helpers';
import { withTheme } from '../../../../.storybook/decorators';
import { storage } from '@/shared/lib';

import { ThemeSwitch } from './theme-switch';

const meta = {
  title: 'widgets/ThemeSwitch',
  component: ThemeSwitch,
  decorators: [withTheme],
  loaders: [
    () => {
      storage.set('theme', 'system');
      return {};
    },
  ],
} satisfies Meta<typeof ThemeSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const System: Story = {};

export const ChooseDark: Story = {
  name: 'Выбор «Тёмная» — сразу и с сохранением',
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: tr('theme.dark') }));
    await expect(document.documentElement).toHaveClass('dark');
    await expect(storage.get('theme')).toBe('dark');
    await userEvent.click(within(canvasElement).getByRole('radio', { name: tr('theme.light') }));
    await expect(document.documentElement).not.toHaveClass('dark');
    storage.set('theme', 'system');
  },
};
