import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiMoonLine } from '@remixicon/react';

import { T } from '../../../.storybook/t';
import { Icon } from './icon/icon';
import { Toggle } from './toggle';

const meta = { title: 'shared/ui/Toggle', component: Toggle } satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle aria-label="dark">
        <Icon icon={RiMoonLine} />
        <T k="theme.dark" />
      </Toggle>
      <Toggle variant="outline" defaultPressed aria-label="dark">
        <Icon icon={RiMoonLine} />
        <T k="theme.dark" />
      </Toggle>
    </div>
  ),
};
