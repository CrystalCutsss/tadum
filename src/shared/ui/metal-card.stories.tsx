import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { expect } from 'storybook/test';

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
    // Сам корень — статичная обёртка без фона и трансформации; металл и кольцо — в ::before / ::after.
    await expect(getComputedStyle(card).transform).toBe('none');
    await expect(getComputedStyle(card, '::before').backgroundImage).toContain('linear-gradient');
    await expect(getComputedStyle(card, '::after').backgroundImage).toContain('linear-gradient');
    // Без указателя наклона нет: исходные значения @property.
    await expect(getComputedStyle(card).getPropertyValue('--metal-rx').trim()).toBe('0');
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
