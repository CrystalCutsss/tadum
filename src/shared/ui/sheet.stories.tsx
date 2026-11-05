import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

const meta = { title: 'shared/ui/Sheet', component: Sheet } satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Bottom: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button>
          <T k="nav.more" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>
            <T k="nav.more" />
          </SheetTitle>
          <SheetDescription>
            <T k="support.cta.question" />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
