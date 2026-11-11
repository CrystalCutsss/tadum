import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiArrowRightLine, RiRefreshLine, RiWhatsappFill } from '@remixicon/react';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';

import { Icon } from './icon/icon';
import { Button } from './button';

const meta = { title: 'shared/ui/Button', component: Button } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ['default', 'outline', 'secondary', 'ghost', 'link'] as const;
const sizes = ['xs', 'sm', 'default', 'lg'] as const;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => (
        <Button key={v} variant={v}>
          <T k="common.retry" />
        </Button>
      ))}
    </div>
  ),
};
// Вариант destructive в пресете — 4.0:1 (нужно 4.5); замечание — в docs/design/02-design-system.md. Здесь todo (D-077).
export const Destructive: Story = {
  parameters: { a11y: { test: 'todo' } },
  render: () => (
    <Button variant="destructive">
      <T k="common.retry" />
    </Button>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {sizes.map((s) => (
        <Button key={s} size={s}>
          <T k="common.copy_link" />
        </Button>
      ))}
    </div>
  ),
};
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        <T k="common.retry" />
        <Icon icon={RiArrowRightLine} />
      </Button>
      <Button size="icon" aria-label="retry">
        <Icon icon={RiRefreshLine} />
      </Button>
    </div>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Button disabled>
      <T k="common.retry" />
    </Button>
  ),
};
// Принятое исключение, Кирилл 2026-11-06: белый текст кнопки WhatsApp — 3.67:1 на --whatsapp (= --status-done) с 2026-11-11 (было 3.01:1, исходно 1.98:1 на #25D366).
// Отключено только правило axe color-contrast; правила матрицы (landmark) сохранены — массив rules при слиянии parameters заменяется целиком.
const whatsappA11y = {
  ...matrix.parameters,
  a11y: {
    ...matrix.parameters.a11y,
    config: { rules: [...matrix.parameters.a11y.config.rules, { id: 'color-contrast', enabled: false }] },
  },
};

// Кнопка WhatsApp (токены --whatsapp / --whatsapp-foreground, белый текст 3.67:1) — ссылкой через asChild, в матрице AR/EN × light/dark.
export const Whatsapp: Story = {
  ...matrix,
  parameters: whatsappA11y,
  render: () => (
    <Button variant="whatsapp" asChild>
      <a href="https://wa.me/" target="_blank" rel="noreferrer">
        <Icon icon={RiWhatsappFill} />
        <T k="support.whatsapp" />
      </a>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector('a[data-variant="whatsapp"]');
    await expect(link).not.toBeNull();
  },
};
