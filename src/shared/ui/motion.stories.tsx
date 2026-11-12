import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';
import { PulseDot } from './pulse-dot';

// Движение: пульсирующая точка PulseDot (2026-11-11), отскок (ease-bounce, duration-bounce) и раскрытие по высоте (2026-11-10).
const meta = { title: 'shared/ui/Motion', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Точка статуса с расходящимся кольцом — в колонке иконки строки документа (центрирует потребитель).
export const PulseDotRejected: Story = {
  name: 'PulseDot',
  render: () => (
    <div className="flex items-center gap-3">
      <div data-testid="dot-box" className="flex size-10 items-center justify-center">
        <PulseDot />
      </div>
      <p className="text-sm text-status-rejected">
        <T k="documents.submit.ready_title" />
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dot = canvasElement.querySelector<HTMLElement>('[data-slot="pulse-dot"]')!;
    const ring = dot.querySelector<HTMLElement>('[data-slot="pulse-dot-ring"]')!;
    await expect(dot.getAttribute('aria-hidden')).toBe('true');
    // Обёртка — размер точки и не обрезает кольцо.
    const box = dot.getBoundingClientRect();
    await expect(box.width).toBe(box.height);
    await expect(getComputedStyle(dot).overflow).toBe('visible');
    const ringStyle = getComputedStyle(ring);
    await expect(ringStyle.position).toBe('absolute');
    await expect(ringStyle.animationName).toBe('pulse-ring');
    await expect(ringStyle.animationDuration).toBe('2.2s');
    await expect(ringStyle.animationIterationCount).toBe('infinite');
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
