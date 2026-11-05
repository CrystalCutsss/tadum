import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusBadge } from './status-badge';

const meta = { title: 'shared/ui/StatusBadge', component: StatusBadge } satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DocumentStatuses: Story = {
  args: { kind: 'document', status: 'pending' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['pending', 'received', 'rejected', 'approved'] as const).map((s) => (
        <StatusBadge key={s} kind="document" status={s} />
      ))}
    </div>
  ),
};
export const SupplierViewStatuses: Story = {
  args: { kind: 'supplier_view', status: 'applied' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['applied', 'collecting_docs', 'under_review', 'approved', 'first_purchase', 'closed'] as const).map((s) => (
        <StatusBadge key={s} kind="supplier_view" status={s} />
      ))}
    </div>
  ),
};
