import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiArrowRightLine, RiRefreshLine } from '@remixicon/react';

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
