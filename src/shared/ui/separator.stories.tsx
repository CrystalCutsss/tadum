import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Separator } from './separator';

const meta = { title: 'shared/ui/Separator', component: Separator } satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-sm space-y-3">
      <T k="nav.home" />
      <Separator />
      <T k="nav.documents" />
    </div>
  ),
};
export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3">
      <T k="nav.home" />
      <Separator orientation="vertical" />
      <T k="nav.help" />
    </div>
  ),
};
