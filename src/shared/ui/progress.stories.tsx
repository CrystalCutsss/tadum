import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { Progress } from './progress';

const meta = { title: 'shared/ui/Progress', component: Progress, ...matrix } satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { value: 0, 'aria-label': 'progress' } };

/** Заливка — от начала строки: в AR (dir=rtl) прижата к правому краю, в EN — к левому. */
export const Partial: Story = {
  args: { value: 30, 'aria-label': 'progress' },
  play: async ({ canvasElement }) => {
    const rects = (combo: string) => {
      const root = canvasElement.querySelector(`[data-matrix="${combo}"] [data-slot="progress"]`)!;
      const fill = root.querySelector('[data-slot="progress-indicator"]')!;
      return { root: root.getBoundingClientRect(), fill: fill.getBoundingClientRect() };
    };
    const ar = rects('ar light');
    // RTL: видимая часть — от left индикатора до правого края дорожки, 30 % ширины.
    await expect(Math.abs(ar.fill.left - (ar.root.left + ar.root.width * 0.7))).toBeLessThan(1);
    await expect(ar.fill.left).toBeGreaterThan(ar.root.left + ar.root.width / 2);
    const en = rects('en light');
    // LTR: видимая часть — от левого края дорожки до right индикатора.
    await expect(Math.abs(en.fill.right - (en.root.left + en.root.width * 0.3))).toBeLessThan(1);
    await expect(en.fill.right).toBeLessThan(en.root.left + en.root.width / 2);
  },
};

export const Full: Story = { args: { value: 100, 'aria-label': 'progress' } };
