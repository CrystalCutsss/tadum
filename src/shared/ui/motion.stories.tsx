import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';

// Токены движения 2026-11-10: свечение-волна (animate-glow-wave, shadow-glow-primary) и отскок (ease-bounce, duration-bounce).
const meta = { title: 'shared/ui/Motion', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const GlowWave: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-2">
      <Button className="animate-glow-wave">
        <T k="documents.submit.cta" />
      </Button>
      <Button variant="outline" className="shadow-glow-primary">
        <T k="documents.row.upload" />
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLElement>('.animate-glow-wave')!;
    const style = getComputedStyle(button);
    // Без prefers-reduced-motion — бесконечная анимация glow-wave.
    await expect(style.animationName).toBe('glow-wave');
    await expect(style.animationIterationCount).toBe('infinite');
  },
};

export const Bounce: Story = {
  render: () => (
    <Button variant="secondary" className="transition-transform duration-bounce ease-bounce hover:scale-105">
      <T k="documents.row.upload" />
    </Button>
  ),
};

// Раскрытие по высоте: grid-rows-collapsed ↔ grid-rows-expanded, transition-grid-rows + duration-bounce ease-bounce.
export const HeightReveal: Story = {
  render: () => (
    <div className="space-y-2">
      <div data-testid="collapsed" className="grid grid-rows-collapsed transition-grid-rows duration-bounce ease-bounce">
        <div className="min-h-0 overflow-hidden">
          <T k="documents.submit.cta" />
        </div>
      </div>
      <div data-testid="expanded" className="grid grid-rows-expanded transition-grid-rows duration-bounce ease-bounce">
        <div className="min-h-0 overflow-hidden">
          <T k="documents.submit.cta" />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const collapsed = canvasElement.querySelector<HTMLElement>('[data-testid="collapsed"]')!;
    const expanded = canvasElement.querySelector<HTMLElement>('[data-testid="expanded"]')!;
    await expect(collapsed.getBoundingClientRect().height).toBe(0);
    await expect(expanded.getBoundingClientRect().height).toBeGreaterThan(0);
    const style = getComputedStyle(expanded);
    await expect(style.transitionProperty).toBe('grid-template-rows');
    await expect(style.transitionDuration).toBe('0.48s');
    await expect(style.transitionTimingFunction).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
  },
};
