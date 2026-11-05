import type { Meta, StoryObj } from '@storybook/react-vite';

import { Wordmark } from './wordmark';

const meta = { title: 'shared/ui/Wordmark', component: Wordmark } satisfies Meta<typeof Wordmark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { className: 'text-3xl' } };
