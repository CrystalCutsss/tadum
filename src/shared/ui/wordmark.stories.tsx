import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';

import { Wordmark } from './wordmark';

const meta = { title: 'shared/ui/Wordmark', component: Wordmark } satisfies Meta<typeof Wordmark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { className: 'text-3xl' } };

/** Логотип сайдбара (решение Кирилла 2026-11-06): «tadum.» строчными, Geist bold, точка primary (в тёмной теме — muted-foreground). */
export const Dot: Story = {
  ...matrix,
  args: { variant: 'dot' },
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector<HTMLElement>('[data-variant="dot"]')!;
    const word = mark.firstElementChild as HTMLElement;
    // Доступный текст — «Tadum», строчные только визуально; точка скрыта от скринридера.
    await expect(word.textContent).toBe('Tadum');
    await expect(getComputedStyle(word).textTransform).toBe('lowercase');
    await expect(getComputedStyle(mark).fontWeight).toBe('700');
    await expect(mark.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
  },
};
