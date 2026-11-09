import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta = { title: 'shared/ui/Collapsible', component: Collapsible, ...matrix } satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  render: () => (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="self-start">
          <T k="nav.more" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-sm text-muted-foreground">
        <T k="next_step.under_review" />
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const panel = within(canvasElement.querySelector<HTMLElement>('[data-matrix="ar light"]')!);
    const trigger = panel.getByRole('button');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};
