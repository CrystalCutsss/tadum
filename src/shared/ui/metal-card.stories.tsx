import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { expect, waitFor } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { formatMoney, type Language } from '../i18n';
import { Ltr } from './ltr';
import { MetalCard } from './metal-card';

const meta = { title: 'shared/ui/MetalCard', component: MetalCard, ...matrix } satisfies Meta<typeof MetalCard>;
export default meta;
type Story = StoryObj<typeof meta>;

function Amount() {
  const { i18n } = useTranslation();
  return <Ltr>{formatMoney(150000, i18n.language as Language)}</Ltr>;
}

/** Образец: подпись «Лимит», крупная сумма, строка текста. Весь текст — --primary-foreground без прозрачности. */
export const Limit: Story = {
  render: () => (
    <MetalCard className="max-w-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          <T k="application.limit_label" />
        </p>
        <p className="text-3xl font-semibold">
          <Amount />
        </p>
        <p className="text-sm">
          <T k="application.signing.info" />
        </p>
      </div>
    </MetalCard>
  ),
  play: async ({ canvasElement }) => {
    const cards = canvasElement.querySelectorAll<HTMLElement>('[data-slot="metal-card"]');
    await expect(cards).toHaveLength(4);
    const card = cards[0]!;
    // Сам корень — статичная обёртка без трансформации; поверхность — canvas WebGL, кольцо — ::after.
    await expect(getComputedStyle(card).transform).toBe('none');
    await expect(card.querySelector('canvas[data-slot="metal-card-gl"]')).not.toBeNull();
    await expect(getComputedStyle(card, '::after').backgroundImage).toContain('linear-gradient');
    if (document.createElement('canvas').getContext('webgl2')) {
      // Шейдер грузится лениво; после первого кадра CSS-фон поверхности снят.
      await waitFor(() => expect(card.dataset.gl).toBe('on'));
      await expect(getComputedStyle(card, '::before').backgroundImage).toBe('none');
    } else {
      // Без WebGL2 — запасные CSS-слои.
      await expect(getComputedStyle(card, '::before').backgroundImage).toContain('linear-gradient');
    }
    // Без указателя наклона нет: исходные значения @property.
    await expect(getComputedStyle(card).getPropertyValue('--metal-rx').trim()).toBe('0');
    // Кольцо — 1px в обеих темах (панели матрицы: ar/en light, затем ar/en dark).
    await expect(getComputedStyle(card, '::after').paddingTop).toBe('1px');
    await expect(getComputedStyle(cards[2]!, '::after').paddingTop).toBe('1px');
  },
};

/**
 * Наведение мышью у верхнего правого угла (play отправляет pointermove): блик идёт за указателем, карточка
 * целиком (поверхность и содержимое) поворачивается пружиной, угол под указателем выходит к зрителю.
 * При reduced-motion и на сенсорных экранах наклона нет — статичный кадр.
 */
export const Tilted: Story = {
  render: () => (
    <MetalCard className="max-w-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          <T k="application.limit_label" />
        </p>
        <p className="text-3xl font-semibold">
          <Amount />
        </p>
        <p className="text-sm">
          <T k="application.signing.info" />
        </p>
      </div>
    </MetalCard>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="metal-card"]')!;
    const content = card.lastElementChild as HTMLElement;
    const rect = card.getBoundingClientRect();
    const at = { clientX: rect.left + rect.width * 0.9, clientY: rect.top + rect.height * 0.1, pointerType: 'mouse', bubbles: true };
    // Обработчики ставит ленивый модуль — событие повторяется, пока он не загрузится.
    const hover = () => {
      card.dispatchEvent(new PointerEvent('pointerenter', at));
      card.dispatchEvent(new PointerEvent('pointermove', at));
    };
    hover();
    // Корень не трансформируется никогда; наклон — у поверхности и содержимого, только мышь без reduce.
    await expect(getComputedStyle(card).transform).toBe('none');
    const tilts = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
    if (tilts) {
      // Угол под указателем (справа сверху) выходит к зрителю: rx > 0, ry < 0.
      await waitFor(() => {
        hover();
        return expect(Number(card.style.getPropertyValue('--metal-rx'))).toBeGreaterThan(0.5);
      });
      await expect(Number(card.style.getPropertyValue('--metal-ry'))).toBeLessThan(-0.5);
      await expect(getComputedStyle(card, '::before').transform).not.toBe('none');
      await expect(getComputedStyle(content).transform).not.toBe('none');
      await expect(getComputedStyle(content).backfaceVisibility).toBe('hidden');
    } else {
      await expect(getComputedStyle(content).transform).toBe('none');
    }
  },
};

/** Корень другим тегом и свой отступ. */
export const AsSection: Story = {
  render: () => (
    <MetalCard as="section" className="max-w-sm p-4">
      <p className="text-sm">
        <T k="application.signing.info" />
      </p>
    </MetalCard>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('section[data-slot="metal-card"]')).not.toBeNull();
  },
};

/** Вертикальная карточка ≈ 1:1.2 рядом с другим блоком: высоту задаёт соседний блок, карточку растягивает CSS-сетка. */
export const Tall: Story = {
  render: () => (
    <div className="grid max-w-xl grid-cols-2 items-stretch gap-4">
      <MetalCard className="flex flex-col justify-between">
        <p className="text-sm font-medium">
          <T k="application.limit_label" />
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-semibold">
            <Amount />
          </p>
          <p className="text-sm">
            <T k="application.signing.info" />
          </p>
        </div>
      </MetalCard>
      <div className="aspect-5/6 self-start rounded-2xl border bg-card p-6 text-sm text-card-foreground">
        <T k="application.signing.info" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="metal-card"]')!;
    const rect = card.getBoundingClientRect();
    await expect(rect.height).toBeGreaterThan(rect.width);
  },
};
