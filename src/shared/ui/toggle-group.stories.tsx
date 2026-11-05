import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta = { title: 'shared/ui/ToggleGroup', component: ToggleGroup } satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

// Порядок сегментов зеркалится в RTL (§1.2) — переключатель темы в настройках.
export const ThemeSwitch: Story = {
  args: { type: 'single' },
  render: () => (
    <ToggleGroup type="single" defaultValue="system" variant="outline">
      <ToggleGroupItem value="system">
        <T k="theme.system" />
      </ToggleGroupItem>
      <ToggleGroupItem value="light">
        <T k="theme.light" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <T k="theme.dark" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
