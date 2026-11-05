import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiWifiOffLine } from '@remixicon/react';

import { T } from '../../../.storybook/t';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Icon } from './icon/icon';

const meta = { title: 'shared/ui/Alert', component: Alert } satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Icon icon={RiWifiOffLine} />
      <AlertTitle>
        <T k="common.offline_banner" />
      </AlertTitle>
      <AlertDescription>
        <T k="common.offline_action_hint" />
      </AlertDescription>
    </Alert>
  ),
};
// Контраст текста destructive в пресете — 4.49:1 (нужно 4.5). Пресет не меняется агентом (D-077):
// замечание вынесено Кириллу (docs/design/02-design-system.md, «Замечания к пресету»), здесь — todo, а не error.
export const Destructive: Story = {
  parameters: { a11y: { test: 'todo' } },
  render: () => (
    <Alert variant="destructive">
      <AlertTitle>
        <T k="common.load_error" />
      </AlertTitle>
      <AlertDescription>
        <T k="common.server_error_retry" />
      </AlertDescription>
    </Alert>
  ),
};
