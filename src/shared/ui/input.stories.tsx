import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './input';

const meta = { title: 'shared/ui/Input', component: Input } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { dir: 'auto', 'aria-label': 'company' } };
export const Phone: Story = { args: { dir: 'ltr', inputMode: 'tel', defaultValue: '+966 50 123 4567', 'aria-label': 'phone' } };
export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: '0501', dir: 'ltr', 'aria-label': 'phone' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '+966 50 123 4567', dir: 'ltr', 'aria-label': 'phone' } };
