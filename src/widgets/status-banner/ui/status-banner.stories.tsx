// Баннер смены статуса (D-034, SC-05 A6a) для каждого client_status × AR/EN × light/dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';

import { StatusBanner } from './status-banner';

const meta = { title: 'widgets/StatusBanner', component: StatusBanner, args: { onDismiss: fn() }, ...matrix } satisfies Meta<typeof StatusBanner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DocsRequired: Story = { args: { to: 'docs_required' } };
export const UnderReview: Story = { args: { to: 'under_review' } };
export const Approved: Story = {
  args: { to: 'approved' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getAllByRole('button')[0]!);
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};
export const FirstPurchase: Story = { args: { to: 'first_purchase' } };
export const Closed: Story = { args: { to: 'closed' } };
