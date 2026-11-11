import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { CodeSlots, type CodeSlotsProps, type CodeSlotsStatus } from './code-slots';

// Ввод кода ячейками (2026-11-11): механика React Bits «Code Slots», вид — токены пресета.
// Подпись — через aria-labelledby, как в форме OTP; ряд всегда LTR и в арабском интерфейсе.
const meta = {
  title: 'shared/ui/CodeSlots',
  component: CodeSlots,
  ...matrix,
  args: { onChange: fn(), onComplete: fn() },
} satisfies Meta<typeof CodeSlots>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Поле с подписью; outcome — какой статус поставить после ввода всех цифр (как форма после проверки кода). */
function Demo({ outcome, status: initial = 'idle', onChange, onComplete, ...props }: CodeSlotsProps & { outcome?: 'error' | 'success' }) {
  const label = useId();
  const [status, setStatus] = useState<CodeSlotsStatus>(initial);
  return (
    <div className="flex flex-col items-start gap-2">
      <span id={label} className="text-sm font-medium">
        <T k="auth.otp.title" />
      </span>
      <CodeSlots
        {...props}
        aria-labelledby={label}
        status={status}
        onChange={(code) => {
          onChange?.(code);
          if (status === 'error') setStatus('idle');
        }}
        onComplete={(code) => {
          onComplete?.(code);
          if (outcome) setStatus(outcome);
        }}
      />
    </div>
  );
}

const panel = (root: HTMLElement, combo = 'ar light') => root.querySelector<HTMLElement>(`[data-matrix="${combo}"]`)!;
const inputOf = (root: HTMLElement, combo?: string) => panel(root, combo).querySelector<HTMLInputElement>('[data-slot="code-slots"] input')!;
const filled = (root: HTMLElement, combo?: string) =>
  [...panel(root, combo).querySelectorAll('[data-slot="code-slots-cell"]')].map((c) => c.hasAttribute('data-filled'));

export const Empty: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    const row = panel(canvasElement).querySelector('[data-slot="code-slots"]')!;
    await expect(panel(canvasElement).querySelectorAll('[data-slot="code-slots-cell"]')).toHaveLength(4);
    // Код читается слева направо и в RTL; maxLength нет — вставка с лишними символами не обрезается.
    await expect(row).toHaveAttribute('dir', 'ltr');
    await expect(input).toHaveAttribute('dir', 'ltr');
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(input).toHaveAttribute('pattern', '[0-9]*');
    await expect(input).not.toHaveAttribute('maxlength');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveAccessibleName();
    // Квадратная ячейка 56 × 56, зазор 12.
    const [a, b] = [...panel(canvasElement).querySelectorAll('[data-slot="code-slots-cell"]')].map((c) => c.getBoundingClientRect());
    await expect(a!.width).toBe(56);
    await expect(a!.height).toBe(56);
    await expect(b!.left - a!.right).toBe(12);
  },
};

export const Typing: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await expect(panel(canvasElement).querySelector('[data-slot="code-slots-cell"]')).toHaveAttribute('data-active');
    await userEvent.keyboard('1234');
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith('1234');
    await expect(args.onChange).toHaveBeenLastCalledWith('1234');
    await expect(filled(canvasElement)).toEqual([true, true, true, true]);
  },
};

// Backspace назад, Home и стрелки двигают активную ячейку.
export const Keyboard: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(inputOf(canvasElement, 'en dark'));
    await userEvent.keyboard('12');
    await userEvent.keyboard('{Backspace}');
    await expect(args.onChange).toHaveBeenLastCalledWith('1');
    await userEvent.keyboard('{Home}9');
    await expect(args.onChange).toHaveBeenLastCalledWith('9');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{End}{ArrowLeft}');
    await userEvent.keyboard('{Delete}');
    await expect(args.onChange).toHaveBeenLastCalledWith('9');
    await expect(args.onComplete).not.toHaveBeenCalled();
  },
};

export const Paste: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(inputOf(canvasElement));
    await userEvent.paste('Code: 12 34');
    await expect(args.onChange).toHaveBeenLastCalledWith('1234');
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith('1234');
    await expect(filled(canvasElement)).toEqual([true, true, true, true]);
  },
};

// Арабско-индийские цифры с клавиатуры и из буфера приводятся к западным.
export const ArabicDigits: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(inputOf(canvasElement));
    await userEvent.keyboard('٠٠٠٠');
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith('0000');
    await userEvent.click(inputOf(canvasElement, 'en light'));
    await userEvent.paste('۱۲٣٤');
    await expect(args.onChange).toHaveBeenLastCalledWith('1234');
  },
};

// Неверный код: ячейки осушаются справа налево, затем ряд пуст и onChange('').
export const ErrorClears: Story = {
  render: (args) => <Demo {...args} outcome="error" />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    await userEvent.click(input);
    await userEvent.keyboard('1234');
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith('1234');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(''));
    await expect(filled(canvasElement)).toEqual([false, false, false, false]);
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveFocus();
  },
};

// Статичное состояние ошибки для обзора (ячейки уже пусты).
export const Invalid: Story = { render: (args) => <Demo {...args} status="error" /> };

export const Success: Story = {
  render: (args) => <Demo {...args} outcome="success" />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await userEvent.click(input);
    await userEvent.keyboard('1234');
    await expect(panel(canvasElement).querySelector('[data-slot="code-slots"]')).toHaveAttribute('data-status', 'success');
    await expect(input).toHaveAttribute('readonly');
    const wash = panel(canvasElement).querySelector<HTMLElement>('[data-slot="code-slots-wash"]')!;
    await waitFor(() => expect(getComputedStyle(wash).clipPath).toMatch(/^inset\(0(px)? 0(%|px)?/));
    // Ввод после успеха игнорируется.
    await userEvent.keyboard('5');
    await expect(filled(canvasElement)).toEqual([true, true, true, true]);
  },
};

export const SuccessStatic: Story = { name: 'Success (static)', render: (args) => <Demo {...args} defaultValue="1234" status="success" /> };

export const Disabled: Story = {
  render: (args) => <Demo {...args} defaultValue="12" disabled />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    await expect(input).toBeDisabled();
    await expect(filled(canvasElement)).toEqual([true, true, false, false]);
    await userEvent.click(input);
    await userEvent.keyboard('34');
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
