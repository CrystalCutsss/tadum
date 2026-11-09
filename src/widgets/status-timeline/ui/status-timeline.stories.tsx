// StatusTimeline для каждого client_status (01-cabinet-structure.md §5) × AR/EN × light/dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { computeClientTimeline, type ClientTimelineInput } from '@/entities/application';

import { StatusTimeline } from './status-timeline';

const done = { status: 'active' as const, checklist: { completed: true, items: [] } };
const ready = { status: 'ready' as const, checklist: { completed: false, items: [] } };

const steps = (input: ClientTimelineInput) => {
  const t = computeClientTimeline(input);
  if (t.hidden) throw new Error('closed: шкала скрыта');
  return t.steps;
};

const meta = { title: 'widgets/StatusTimeline', component: StatusTimeline, ...matrix } satisfies Meta<typeof StatusTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DocsRequired: Story = { args: { steps: steps({ client_status: 'docs_required', round: 1, limit: null }) } };
export const MoreDocsRequested: Story = {
  name: 'docs_required, дозапрос (Проверка — текущий шаг)',
  args: { steps: steps({ client_status: 'docs_required', round: 2, limit: null }) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('li[aria-current="step"]').length).toBe(4);
    await expect(within(canvasElement).queryAllByText(/A few more documents needed|نحتاج بضعة مستندات إضافية/).length).toBe(0);
  },
};
export const UnderReview: Story = {
  args: { steps: steps({ client_status: 'under_review', round: 1, limit: null }) },
  play: async ({ canvasElement }) => {
    // Текущий шаг — «Проверка», с aria-current.
    const current = canvasElement.querySelectorAll('li[aria-current="step"]');
    await expect(current).toHaveLength(4);
  },
};
export const ApprovedSigning: Story = { name: 'approved, до подписания', args: { steps: steps({ client_status: 'approved', round: 1, limit: ready }) } };
export const ApprovedActive: Story = { name: 'approved, лимит active', args: { steps: steps({ client_status: 'approved', round: 1, limit: done }) } };
export const FirstPurchase: Story = { args: { steps: steps({ client_status: 'first_purchase', round: 1, limit: done }) } };
