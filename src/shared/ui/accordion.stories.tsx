import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta = { title: 'shared/ui/Accordion', component: Accordion } satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: 'single' },
  render: () => (
    <Accordion type="single" collapsible defaultValue="a" className="max-w-sm">
      <AccordionItem value="a">
        <AccordionTrigger>
          <T k="nav.documents" />
        </AccordionTrigger>
        <AccordionContent>
          <T k="common.offline_actions_disabled" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>
          <T k="nav.help" />
        </AccordionTrigger>
        <AccordionContent>
          <T k="support.cta.question" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
