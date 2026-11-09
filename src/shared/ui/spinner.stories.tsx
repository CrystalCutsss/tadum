import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { Spinner } from './spinner';

const meta = { title: 'shared/ui/Spinner', component: Spinner, ...matrix } satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': 'loading' },
  play: async ({ canvasElement }) => {
    const status = canvasElement.querySelector('[data-slot="spinner"]')!;
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-label', 'loading');
    await expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};
