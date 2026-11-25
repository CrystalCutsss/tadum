import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Checkbox } from './checkbox';
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from './field';

const meta = { title: 'shared/ui/Checkbox', component: Checkbox, ...matrix } satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

// Подпись связана с чекбоксом вложенностью в label — без id, которые повторились бы в панелях матрицы.

export const Default: Story = {
  render: () => (
    <FieldLabel>
      <Checkbox />
      <T k="auth.details.join_supplier" />
    </FieldLabel>
  ),
};

export const Checked: Story = {
  render: () => (
    <FieldLabel>
      <Checkbox defaultChecked />
      <T k="auth.details.join_supplier" />
    </FieldLabel>
  ),
};

// Неактивный элемент освобождён от требования контраста (WCAG 1.4.3), но axe этого не знает: у кнопки он пропускает
// disabled, у подписи чекбокса — нет. Отключено только правило color-contrast; правила матрицы сохранены.
export const Disabled: Story = {
  parameters: {
    ...matrix.parameters,
    a11y: {
      ...matrix.parameters.a11y,
      config: { rules: [...matrix.parameters.a11y.config.rules, { id: 'color-contrast', enabled: false }] },
    },
  },
  render: () => (
    <Field orientation="horizontal" data-disabled="true">
      <FieldLabel>
        <Checkbox disabled />
        <T k="auth.details.join_supplier" />
      </FieldLabel>
    </Field>
  ),
};

/** Карточка (как «Enable notifications» в документации shadcn): вся карточка — label с htmlFor, рамка и скругление
 * от FieldLabel, выбранная выделяется рамкой primary (has-data-checked). useId — id уникальны в каждой панели матрицы.
 * Имя чекбокса — aria-labelledby на заголовок, описание — aria-describedby: подпись карточки обёрнута в
 * div[role=group], и имя через label axe (и часть скринридеров) не вычисляет. */
function SupplierCard({ defaultChecked }: { defaultChecked?: boolean }) {
  const id = useId();
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <Checkbox id={id} defaultChecked={defaultChecked} aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`} />
        <FieldContent>
          <FieldTitle id={`${id}-title`}>
            <T k="auth.details.join_supplier" />
          </FieldTitle>
          <FieldDescription id={`${id}-hint`}>
            <T k="auth.details.join_supplier_hint" />
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

export const Card: Story = {
  render: () => <SupplierCard />,
  play: async ({ canvasElement }) => {
    const [first] = within(canvasElement).getAllByRole('checkbox', { name: /.+/ });
    await expect(first).toHaveAttribute('data-state', 'unchecked');
    // Клик по описанию (не по квадрату) отмечает чекбокс: кликабельна вся карточка.
    const [description] = canvasElement.querySelectorAll('[data-slot=field-description]');
    await userEvent.click(description as HTMLElement);
    await expect(first).toHaveAttribute('data-state', 'checked');
  },
};

export const CardChecked: Story = { render: () => <SupplierCard defaultChecked /> };
