import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const meta = { title: 'shared/ui/Tooltip', component: Tooltip } satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <div className="p-10">
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">
            <T k="common.copy_link" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <T k="common.offline_action_hint" />
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
