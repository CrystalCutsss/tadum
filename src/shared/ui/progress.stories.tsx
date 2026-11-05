import type { Meta, StoryObj } from '@storybook/react-vite';

import { Progress } from './progress';

const meta = { title: 'shared/ui/Progress', component: Progress } satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { value: 0, 'aria-label': 'progress' } };
export const Partial: Story = { args: { value: 28, 'aria-label': 'progress' } };
export const Full: Story = { args: { value: 100, 'aria-label': 'progress' } };
