// Служебные экраны и настройки (SC-10): HelpScreen, auth.expired, system.404 × AR/EN × light/dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { tr } from '../../../.storybook/story-helpers';
import { matrix, withRouter, withTheme } from '../../../.storybook/decorators';

import { HelpScreen } from './help-screen';
import { NotFoundScreen } from './not-found-screen';
import { SessionExpiredScreen } from './session-expired-screen';

const meta = { title: 'pages/Screens', component: HelpScreen, decorators: [withRouter('/c/help'), withTheme] } satisfies Meta<typeof HelpScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Help: Story = { name: 'Помощь и настройки' };
export const HelpMatrix: Story = { name: 'Помощь × AR/EN × light/dark', ...matrix };

export const LogoutConfirm: Story = {
  name: 'Выход — единственный диалог подтверждения',
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('help.logout') }));
    await waitFor(() => expect(body.getByRole('dialog')).toHaveTextContent(tr('help.logout_confirm')));
    await userEvent.click(body.getByRole('button', { name: tr('common.cancel') }));
  },
};

export const SessionExpired: Story = { name: 'auth.expired × AR/EN × light/dark', ...matrix, render: () => <SessionExpiredScreen /> };
export const NotFound: Story = { name: 'system.404 × AR/EN × light/dark', ...matrix, render: () => <NotFoundScreen /> };
