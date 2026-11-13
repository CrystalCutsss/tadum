import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { SegmentedProgress } from './segmented-progress';

const meta = {
  title: 'shared/ui/SegmentedProgress',
  component: SegmentedProgress,
  ...matrix,
} satisfies Meta<typeof SegmentedProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

const partial = [true, true, false, false, false] as const;

/** Два из пяти: заполнены первые сегменты — у начала строки (в AR справа, в EN слева). */
export const Partial: Story = {
  args: { segments: partial, 'aria-label': 'progress', 'aria-valuetext': '2 / 5' },
  play: async ({ canvasElement }) => {
    const bar = (combo: string) => canvasElement.querySelector<HTMLElement>(`[data-matrix="${combo}"] [data-slot="segmented-progress"]`)!;
    const en = bar('en light');
    await expect(en.getAttribute('role')).toBe('progressbar');
    await expect(en.getAttribute('aria-valuemin')).toBe('0');
    await expect(en.getAttribute('aria-valuemax')).toBe('5');
    await expect(en.getAttribute('aria-valuenow')).toBe('2');
    const first = (root: HTMLElement) => root.querySelector('[data-slot="segmented-progress-segment"]')!.getBoundingClientRect();
    const last = (root: HTMLElement) => [...root.querySelectorAll('[data-slot="segmented-progress-segment"]')].at(-1)!.getBoundingClientRect();
    // LTR: первый сегмент слева; RTL: справа.
    await expect(first(en).left).toBeLessThan(last(en).left);
    const ar = bar('ar light');
    await expect(first(ar).left).toBeGreaterThan(last(ar).left);
    const segment = en.querySelector<HTMLElement>('[data-slot="segmented-progress-segment"]')!;
    await expect(getComputedStyle(segment).transitionDuration).toBe('0.32s');
  },
};

export const Empty: Story = { args: { segments: [false, false, false, false], 'aria-label': 'progress' } };

export const Full: Story = { args: { segments: [true, true, true, true], 'aria-label': 'progress' } };

/** На синей панели отправки (bg-primary): пустые — primary-foreground/25, заполненные — primary-foreground. */
export const Inverse: Story = {
  args: { segments: [true, true, true, false], tone: 'inverse', 'aria-label': 'progress' },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <Story />
      </div>
    ),
  ],
};

/** Токены папки-анимации над кнопкой отправки: задняя стенка, передняя стенка, листы — на панели и на фоне страницы. */
export const FolderTokens: Story = {
  args: { segments: [true, false], 'aria-label': 'progress' },
  render: () => (
    <div className="flex flex-col gap-3">
      {['bg-primary', 'bg-background'].map((surface) => (
        <div key={surface} className={`flex gap-2 rounded-xl p-4 ${surface}`}>
          <span aria-hidden="true" className="size-8 rounded-md bg-folder-back" />
          <span aria-hidden="true" className="size-8 rounded-md bg-folder-front" />
          <span aria-hidden="true" className="size-8 rounded-md bg-folder-paper" />
        </div>
      ))}
    </div>
  ),
};
