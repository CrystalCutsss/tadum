import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta = { title: 'shared/ui/Popover', component: Popover } satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <T k="nav.help" />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="help">
        <T k="support.cta.question" />
      </PopoverContent>
    </Popover>
  ),
};
