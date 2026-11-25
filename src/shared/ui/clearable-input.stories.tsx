import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { ClearableInput, type ClearableInputProps } from './clearable-input';

// Поле с крестиком очистки (2026-11-25): CR и email в блоке «About your business».
type DemoProps = Partial<Omit<ClearableInputProps, 'value' | 'onClear'>> & {
  initial?: string;
  onClear?: () => void;
};

/** Контролируемое поле: onClear сбрасывает value в состоянии. */
function Demo({ initial = '', onClear, ...props }: DemoProps) {
  const [value, setValue] = useState(initial);
  return (
    <div className="max-w-sm">
      <ClearableInput
        size="lg"
        dir="ltr"
        aria-label="email"
        clearLabel="clear"
        {...props}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onClear={() => {
          setValue('');
          onClear?.();
        }}
      />
    </div>
  );
}

const meta = {
  title: 'shared/ui/ClearableInput',
  component: ClearableInput,
  ...matrix,
  args: { clearLabel: 'clear', onClear: fn() },
} satisfies Meta<typeof ClearableInput>;
export default meta;
type Story = StoryObj<typeof meta>;

const panel = (root: HTMLElement, combo = 'en light') => root.querySelector<HTMLElement>(`[data-matrix="${combo}"]`)!;
const inputOf = (root: HTMLElement, combo?: string) => panel(root, combo).querySelector<HTMLInputElement>('[data-slot="input"]')!;
const clearOf = (root: HTMLElement, combo?: string) => panel(root, combo).querySelector<HTMLElement>('[data-slot="clear-button"]');

/** Пустое поле — крестика нет; появляется с первым символом. */
export const Empty: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await expect(clearOf(canvasElement)).toBeNull();
    await userEvent.type(inputOf(canvasElement), 'a');
    await expect(clearOf(canvasElement)).not.toBeNull();
  },
};

/** С текстом: крестик очищает поле, фокус возвращается в поле, крестик пропадает. */
export const WithValue: Story = {
  render: (args) => <Demo initial="owner@example.sa" onClear={args.onClear} />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    const clear = clearOf(canvasElement)!;
    await expect(clear).toHaveAttribute('type', 'button');
    await expect(clear).toHaveAccessibleName('clear');
    // Зона касания ≥ 44 px: size-8 + псевдоэлемент after:-inset-1.5.
    await expect(clear.offsetWidth - 2 * parseFloat(getComputedStyle(clear, '::after').left)).toBeGreaterThanOrEqual(44);
    await userEvent.click(clear);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(input).toHaveValue('');
    await expect(document.activeElement).toBe(input);
    await expect(clearOf(canvasElement)).toBeNull();
  },
};

/** Поле dir="ltr" в RTL-интерфейсе: крестик — на стороне end самого поля (справа). */
export const LtrFieldInArabic: Story = {
  render: () => <Demo initial="1010123456" aria-label="cr" inputMode="numeric" />,
  play: async ({ canvasElement }) => {
    for (const combo of ['ar light', 'en light']) {
      const field = inputOf(canvasElement, combo).getBoundingClientRect();
      const clear = clearOf(canvasElement, combo)!.getBoundingClientRect();
      await expect(clear.left).toBeGreaterThan(field.left + field.width / 2);
    }
  },
};

/** Поле dir="rtl" — крестик слева (end в RTL). */
export const ArabicText: Story = {
  render: () => <Demo dir="rtl" initial="مؤسسة النور" aria-label="company" />,
  play: async ({ canvasElement }) => {
    const field = inputOf(canvasElement, 'ar light').getBoundingClientRect();
    const clear = clearOf(canvasElement, 'ar light')!.getBoundingClientRect();
    await expect(clear.right).toBeLessThan(field.left + field.width / 2);
  },
};

/** Неконтролируемое поле: крестик следит за вводом сам и очищает DOM-значение. */
export const Uncontrolled: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <ClearableInput size="lg" dir="ltr" aria-label="email" clearLabel="clear" defaultValue="a@b.sa" onClear={args.onClear} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    await userEvent.click(clearOf(canvasElement)!);
    await expect(inputOf(canvasElement)).toHaveValue('');
    await expect(args.onClear).toHaveBeenCalled();
    await expect(clearOf(canvasElement)).toBeNull();
  },
};

export const ReadOnly: Story = {
  render: () => <Demo initial="1010123456" readOnly />,
  play: async ({ canvasElement }) => {
    await expect(clearOf(canvasElement)).toBeNull();
  },
};

export const Disabled: Story = {
  render: () => <Demo initial="1010123456" disabled />,
  play: async ({ canvasElement }) => {
    await expect(clearOf(canvasElement)).toBeNull();
  },
};
