import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Badge } from './badge';

const meta = { title: 'shared/ui/Badge', component: Badge } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const).map((v) => (
        <Badge key={v} variant={v}>
          <T k="nav.documents" />
        </Badge>
      ))}
    </div>
  ),
};
