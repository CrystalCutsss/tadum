import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { BorderBeam } from './border-beam';
import { Button } from './button';
import { PulseDot } from './pulse-dot';

// Движение: бегущий фрагмент обводки BorderBeam (2026-11-11), пульсирующая точка PulseDot (2026-11-11),
// отскок (ease-bounce, duration-bounce) и раскрытие по высоте (2026-11-10).
const meta = { title: 'shared/ui/Motion', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Липкая панель отправки в состоянии «всё готово»: широкая карточка, серая обводка, по ней ходит синий блик.
export const BorderBeamTrace: Story = {
  name: 'BorderBeam',
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div data-testid="beam-host" className="relative flex min-h-30 items-center justify-between gap-4 rounded-xl border bg-card p-6 text-card-foreground">
        <p className="text-base font-semibold">
          <T k="documents.submit.ready_title" />
        </p>
        <Button>
          <T k="documents.submit.cta" />
        </Button>
        <BorderBeam />
      </div>
      <div data-testid="beam-off" className="relative rounded-xl border bg-card p-4 text-card-foreground">
        <T k="documents.submit.cta" />
        <BorderBeam active={false} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="beam-host"]')!;
    const beam = host.querySelector<HTMLElement>('[data-slot="border-beam"]')!;
    const edge = beam.querySelector<HTMLElement>('[data-slot="border-beam-edge"]')!;
    const glow = beam.querySelector<HTMLElement>('[data-slot="border-beam-glow"]')!;
    await expect(beam.getAttribute('aria-hidden')).toBe('true');
    const beamStyle = getComputedStyle(beam);
    await expect(beamStyle.position).toBe('absolute');
    await expect(beamStyle.pointerEvents).toBe('none');
    // Слой совпадает с border-box контейнера и наследует его скругление; дуга — толщиной обводки.
    const hostBox = host.getBoundingClientRect();
    const beamBox = beam.getBoundingClientRect();
    await expect(beamBox.width).toBeCloseTo(hostBox.width, 0);
    await expect(beamBox.height).toBeCloseTo(hostBox.height, 0);
    await expect(beamStyle.borderTopLeftRadius).toBe(getComputedStyle(host).borderTopLeftRadius);
    await expect(getComputedStyle(edge).borderTopWidth).toBe(getComputedStyle(host).borderTopWidth);
    // Дуга и свечение — в конической маске от угла --beam-angle.
    await expect(getComputedStyle(edge).maskImage).toContain('conic-gradient');
    await expect(getComputedStyle(glow).maskImage).toContain('conic-gradient');
    // Без prefers-reduced-motion — бесконечный цикл: проход 2 s + пауза 2 s.
    await expect(beamStyle.animationName).toBe('border-beam');
    await expect(beamStyle.animationIterationCount).toBe('infinite');
    await expect(beamStyle.animationDuration).toBe('4s');
    await expect(beamStyle.animationTimingFunction).toBe('linear');
    // Угол обходит полный круг за проход, в паузе блик погашен.
    // Перемотка идущей анимации: вычисленный стиль сразу отражает новое время.
    const [cycle] = beam.getAnimations();
    cycle!.currentTime = 1000;
    await expect(getComputedStyle(beam).getPropertyValue('--beam-angle')).toBe('180deg');
    await expect(getComputedStyle(beam).opacity).toBe('1');
    cycle!.currentTime = 3000;
    await expect(getComputedStyle(beam).opacity).toBe('0');
    // active={false} — блика нет.
    await expect(canvasElement.querySelector('[data-testid="beam-off"] [data-slot="border-beam"]')).toBeNull();
  },
};

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
