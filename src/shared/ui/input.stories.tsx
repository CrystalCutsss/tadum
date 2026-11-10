import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { Input } from './input';

const meta = { title: 'shared/ui/Input', component: Input, ...matrix } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { dir: 'auto', 'aria-label': 'company' } };
export const Phone: Story = { args: { dir: 'ltr', inputMode: 'tel', defaultValue: '+966 50 123 4567', 'aria-label': 'phone' } };
export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: '0501', dir: 'ltr', 'aria-label': 'phone' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '+966 50 123 4567', dir: 'ltr', 'aria-label': 'phone' } };

// Размер lg — 48 px (h-12), отступ px-4 и кегль text-base на всех ширинах.
export const Large: Story = {
  args: { size: 'lg', dir: 'ltr', inputMode: 'tel', defaultValue: '+966 50 123 4567', 'aria-label': 'phone' },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
    await expect(input).toHaveAttribute('data-size', 'lg');
    await expect(input.getBoundingClientRect().height).toBe(48);
  },
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Input aria-label="default" dir="auto" />
      <Input size="lg" aria-label="large" dir="auto" />
    </div>
  ),
};
