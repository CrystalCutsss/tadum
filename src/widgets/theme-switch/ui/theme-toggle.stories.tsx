// ThemeToggle — кнопка темы в шапке (Кирилл 2026-11-06): светлая ↔ тёмная от видимой темы, с сохранением.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { tr } from '../../../../.storybook/story-helpers';
import { withTheme } from '../../../../.storybook/decorators';
import { storage } from '@/shared/lib';

import { ThemeToggle } from './theme-toggle';

const meta = {
  title: 'widgets/ThemeToggle',
  component: ThemeToggle,
  decorators: [withTheme],
  loaders: [
    () => {
      storage.set('theme', 'light');
      return {};
    },
  ],
} satisfies Meta<typeof ThemeToggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Toggle: Story = {
  name: 'Светлая → тёмная → светлая, с сохранением',
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: tr('theme.toggle') });
    await userEvent.click(button);
    await expect(document.documentElement).toHaveClass('dark');
    await expect(storage.get('theme')).toBe('dark');
    await userEvent.click(button);
    await expect(document.documentElement).not.toHaveClass('dark');
    await expect(storage.get('theme')).toBe('light');
    storage.set('theme', 'system');
  },
};
