import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { Combobox, type ComboboxOption, type ComboboxProps } from './combobox';

// Поле с подсказками (2026-11-25): паттерн WAI-ARIA combobox, свободный текст разрешён.
// Подсказки — литералы городов (в AR-панелях — по-арабски); выбор подставляет label.
const CITIES: Record<'ar' | 'en', ComboboxOption[]> = {
  en: [
    { value: 'riyadh', label: 'Riyadh' },
    { value: 'jeddah', label: 'Jeddah' },
    { value: 'dammam', label: 'Dammam' },
    { value: 'makkah', label: 'Makkah' },
    { value: 'madinah', label: 'Madinah' },
    { value: 'khobar', label: 'Khobar' },
  ],
  ar: [
    { value: 'riyadh', label: 'الرياض' },
    { value: 'jeddah', label: 'جدة' },
    { value: 'dammam', label: 'الدمام' },
    { value: 'makkah', label: 'مكة المكرمة' },
    { value: 'madinah', label: 'المدينة المنورة' },
    { value: 'khobar', label: 'الخبر' },
  ],
};

type DemoProps = Partial<Omit<ComboboxProps, 'options'>> & { initial?: string };

/** Контролируемое поле: value в состоянии, подсказки — по языку панели матрицы. */
function Demo({ initial = '', onValueChange, ...props }: DemoProps) {
  const { i18n } = useTranslation();
  const [value, setValue] = useState(initial);
  return (
    <div className="max-w-sm">
      <Combobox
        aria-label="city"
        {...props}
        options={CITIES[i18n.language === 'ar' ? 'ar' : 'en']}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onValueChange?.(v);
        }}
      />
    </div>
  );
}

const meta = {
  title: 'shared/ui/Combobox',
  component: Combobox,
  ...matrix,
  args: { value: '', options: CITIES.en, onValueChange: fn() },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

const panel = (root: HTMLElement, combo = 'en light') => root.querySelector<HTMLElement>(`[data-matrix="${combo}"]`)!;
const inputOf = (root: HTMLElement, combo?: string) => panel(root, combo).querySelector<HTMLInputElement>('[role="combobox"]')!;
// Список — в портале (document.body), вне панели.
const listbox = () => document.body.querySelector<HTMLElement>('[role="listbox"]');
const optionLabels = () => [...(listbox()?.querySelectorAll('[role="option"]') ?? [])].map((o) => o.textContent);

export const Empty: Story = {
  render: (args) => <Demo onValueChange={args.onValueChange} />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    // Поле как Input size="lg": 48 px — цель касания ≥ 44.
    await expect(input.getBoundingClientRect().height).toBe(48);
    // Шеврон стоит на стороне end: в LTR справа, в RTL слева; не зеркалится.
    const chevron = (combo: string) => panel(canvasElement, combo).querySelector('[data-slot="combobox-chevron"]')!;
    const field = (combo: string) => inputOf(canvasElement, combo).getBoundingClientRect();
    await expect(chevron('en light').getBoundingClientRect().left).toBeGreaterThan(field('en light').left + field('en light').width / 2);
    await expect(chevron('ar light').getBoundingClientRect().right).toBeLessThan(field('ar light').left + field('ar light').width / 2);
    await expect(chevron('ar light')).toHaveAttribute('data-mirrored', 'false');
  },
};

export const WithValue: Story = { render: () => <Demo initial="Riyadh" /> };

/** Открытый список: стрелка вниз в EN-панели открывает все подсказки, активен первый пункт. */
export const Open: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await userEvent.click(input);
    await waitFor(() => expect(listbox()).not.toBeNull());
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toHaveAttribute('aria-controls', listbox()!.id);
    await expect(optionLabels()).toHaveLength(6);
    // Фокус не уходит в список, ширина списка — по полю.
    await expect(document.activeElement).toBe(input);
    // offsetWidth, а не getBoundingClientRect: на входе список ещё масштабируется (zoom-in-95).
    await expect(listbox()!.offsetWidth).toBe(input.offsetWidth);
    // Пункты — цель касания ≥ 44 px.
    for (const o of listbox()!.querySelectorAll('[role="option"]')) await expect((o as HTMLElement).offsetHeight).toBeGreaterThanOrEqual(44);
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-activedescendant', listbox()!.querySelector('[role="option"]')!.id);
  },
};

/** Фильтр без совпадений: список не показывается, введённый текст остаётся. */
export const NoMatches: Story = {
  render: (args) => <Demo onValueChange={args.onValueChange} />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    await userEvent.type(input, 'zzz');
    await expect(input).toHaveValue('zzz');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).not.toHaveAttribute('aria-controls');
    await waitFor(() => expect(listbox()).toBeNull());
    await expect(args.onValueChange).toHaveBeenLastCalledWith('zzz');
  },
};

/** Свой текст: подсказки видны, но Escape закрывает список, а значение остаётся тем, что ввели. */
export const CustomText: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await userEvent.type(input, 'Kho');
    await waitFor(() => expect(optionLabels()).toEqual(['Khobar']));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(input).toHaveValue('Kho');
    // Enter без активного пункта значение не меняет.
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('Kho');
  },
};

/** Клавиатура: ввод фильтрует без учёта регистра, стрелки двигают активный пункт, Enter ставит label. */
export const Keyboard: Story = {
  render: (args) => <Demo onValueChange={args.onValueChange} />,
  play: async ({ canvasElement, args }) => {
    const input = inputOf(canvasElement);
    await userEvent.type(input, 'DA');
    await waitFor(() => expect(optionLabels()).toEqual(['Jeddah', 'Dammam']));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const options = listbox()!.querySelectorAll('[role="option"]');
    await expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id);
    await expect(options[1]).toHaveAttribute('aria-selected', 'true');
    // Вниз с последнего — на первый, вверх с первого — на последний.
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await userEvent.keyboard('{ArrowUp}{Enter}');
    await expect(input).toHaveValue('Dammam');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('Dammam');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(document.activeElement).toBe(input);
  },
};

/** Клавиатура в RTL: арабские подсказки, тот же порядок клавиш. */
export const KeyboardArabic: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement, 'ar light');
    await userEvent.type(input, 'المدينة');
    await waitFor(() => expect(optionLabels()).toEqual(['المدينة المنورة']));
    await expect(listbox()).toHaveAttribute('dir', 'rtl');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(input).toHaveValue('المدينة المنورة');
  },
};

/** Клик: по полю открывается список, клик по пункту ставит label и закрывает список, фокус остаётся в поле. */
export const Click: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await userEvent.click(input);
    const list = await within(document.body).findByRole('listbox');
    await userEvent.click(within(list).getByRole('option', { name: 'Makkah' }));
    await expect(input).toHaveValue('Makkah');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(document.activeElement).toBe(input);
  },
};

export const Invalid: Story = {
  render: () => <Demo initial="Riy" aria-invalid />,
  play: async ({ canvasElement }) => {
    await expect(inputOf(canvasElement)).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  render: () => <Demo initial="Riyadh" disabled />,
  play: async ({ canvasElement }) => {
    const input = inputOf(canvasElement);
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};
