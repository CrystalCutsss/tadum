import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiFileTextLine } from '@remixicon/react';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { Icon } from './icon/icon';

const meta = { title: 'shared/ui/Empty', component: Empty, ...matrix } satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon icon={RiFileTextLine} />
        </EmptyMedia>
        <EmptyTitle>
          <T k="nav.documents" />
        </EmptyTitle>
        <EmptyDescription>
          <T k="next_step.under_review" />
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <T k="next_step.cta.documents" />
        </Button>
      </EmptyContent>
    </Empty>
  ),
};
