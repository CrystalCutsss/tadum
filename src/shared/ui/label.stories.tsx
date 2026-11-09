import type { Meta, StoryObj } from '@storybook/react-vite';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Input } from './input';
import { Label } from './label';

const meta = { title: 'shared/ui/Label', component: Label, ...matrix } satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Label className="flex-col items-start">
      <T k="auth.phone.label" />
      <Input dir="ltr" inputMode="tel" />
    </Label>
  ),
};
