import type { Meta, StoryObj } from '@storybook/react-vite';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Field, FieldDescription, FieldError, FieldLabel } from './field';
import { Input } from './input';

const meta = { title: 'shared/ui/Field', component: Field, ...matrix } satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Поле с подписью, описанием и ошибкой; label связан с input вложенностью — без id, которые повторились бы в панелях матрицы. */
export const WithError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel>
        <T k="auth.phone.label" />
        <Input dir="ltr" inputMode="tel" aria-invalid />
      </FieldLabel>
      <FieldDescription>
        <T k="auth.phone.subtitle" />
      </FieldDescription>
      <FieldError>
        <T k="auth.phone.invalid_format" />
      </FieldError>
    </Field>
  ),
};
