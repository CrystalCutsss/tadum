import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { SpeechBubble } from './speech-bubble';

const meta = { title: 'shared/ui/SpeechBubble', component: SpeechBubble, ...matrix } satisfies Meta<typeof SpeechBubble>;
export default meta;
type Story = StoryObj<typeof meta>;

// Хвостик у начала строки: в AR — справа, в EN — слева (логическое inset-inline-start).
export const Attention: Story = {
  args: { id: 'bubble-hint', children: <T k="document.rejected.generic" /> },
  render: (args) => (
    <div className="pt-2">
      <SpeechBubble {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const panel of canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')) {
      const bubble = panel.querySelector<HTMLElement>('[data-slot="speech-bubble"]')!;
      const tail = bubble.querySelector<HTMLElement>('[data-slot="speech-bubble-tail"]')!;
      await expect(tail).toHaveAttribute('aria-hidden', 'true');
      const b = bubble.getBoundingClientRect();
      const t = tail.getBoundingClientRect();
      const centre = t.left + t.width / 2;
      // Хвостик выступает над верхней гранью и стоит ближе к начальной стороне.
      await expect(t.top).toBeLessThan(b.top);
      if (panel.dir === 'rtl') await expect(b.right - centre).toBeLessThan(b.width / 2);
      else await expect(centre - b.left).toBeLessThan(b.width / 2);
    }
  },
};

export const CustomTailOffset: Story = {
  args: { tailOffset: 'calc(var(--spacing) * 12)', children: <T k="document.status.rejected" /> },
  render: (args) => (
    <div className="pt-2">
      <SpeechBubble {...args} className="w-fit" />
    </div>
  ),
};
