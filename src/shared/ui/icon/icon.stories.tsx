import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiArrowRightLine, RiArrowLeftSLine, RiTimeLine, RiPhoneLine, RiCheckLine } from '@remixicon/react';
import { expect } from 'storybook/test';

import { Icon } from './icon';

const meta = { title: 'shared/ui/Icon', component: Icon } satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

const Row = () => (
  <div className="flex items-center gap-4">
    <Icon icon={RiArrowRightLine} data-testid="arrow" />
    <Icon icon={RiArrowLeftSLine} data-testid="chevron" />
    <Icon icon={RiTimeLine} data-testid="clock" />
    <Icon icon={RiPhoneLine} />
    <Icon icon={RiCheckLine} />
  </div>
);

// Проверка блока 4a: в RTL стрелка и шеврон зеркалятся, часы — нет.
export const MirroredInArabic: Story = {
  args: { icon: RiArrowRightLine },
  globals: { locale: 'ar' },
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    const scaleOf = (id: string) => getComputedStyle(canvasElement.querySelector(`[data-testid="${id}"]`)!).scale;
    await expect(document.documentElement.dir).toBe('rtl');
    await expect(scaleOf('arrow')).toBe('-1 1');
    await expect(scaleOf('chevron')).toBe('-1 1');
    await expect(scaleOf('clock')).toBe('none');
  },
};

export const NotMirroredInEnglish: Story = {
  args: { icon: RiArrowRightLine },
  globals: { locale: 'en' },
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    const scaleOf = (id: string) => getComputedStyle(canvasElement.querySelector(`[data-testid="${id}"]`)!).scale;
    await expect(scaleOf('arrow')).toBe('none');
    await expect(scaleOf('clock')).toBe('none');
  },
};
