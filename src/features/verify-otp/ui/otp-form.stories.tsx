// auth.otp (SC-01, разметка login-05, одно поле кода): normal, loading, автоотправка, вставка, A3–A10, A13 — play-тесты против MockAdapter.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { holdAuth, pendingLogin, tr } from '../../../../.storybook/story-helpers';
import type { PendingLogin } from '@/entities/session';
import { getApi } from '@/shared/api';
import { Button } from '@/shared/ui';

import { OtpForm } from './otp-form';

const PHONE = '+966500000001'; // client_new
const UNKNOWN = '+966500000014'; // unknown_phone

const placeholder: PendingLogin = {
  phone: PHONE,
  challenge: { channel: 'sms', length: 4, expires_at: '2100-01-01T00:00:00Z', resend_available_at: '2100-01-01T00:00:00Z', attempts_left: 5 },
};

const meta = {
  title: 'features/verify-otp/OtpForm',
  component: OtpForm,
  args: { pending: placeholder, onVerified: fn(), onUnknown: fn(), onChangePhone: fn(), supportSlot: <Button variant="outline">support</Button> },
  loaders: [async () => ({ pending: await pendingLogin(PHONE, 'client_new') })],
  render: (args, { loaded }) => <OtpForm {...args} pending={(loaded as { pending: PendingLogin }).pending} />,
} satisfies Meta<typeof OtpForm>;
export default meta;
type Story = StoryObj<typeof meta>;

const code = (el: HTMLElement) => within(el).getByRole('textbox');
const resendButton = (el: HTMLElement) => within(el).getByRole('button', { name: new RegExp(tr('auth.otp.resend').slice(0, 8)) });

async function wrong(times: number) {
  const api = await getApi();
  for (let i = 0; i < times; i++) await api.auth.verifyOtp(PHONE, '9999').catch(() => undefined);
}

export const Normal: Story = {
  name: 'Normal · повтор через 40 с (A6)',
  play: async ({ canvasElement }) => {
    await expect(code(canvasElement)).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(code(canvasElement)).toHaveAttribute('inputmode', 'numeric');
    await expect(resendButton(canvasElement)).toBeDisabled();
    await expect(resendButton(canvasElement)).toHaveTextContent(/\d/);
    // Кнопки «Подтвердить» в счастливом пути нет.
    await expect(within(canvasElement).queryByRole('button', { name: tr('auth.otp.confirm') })).toBeNull();
  },
};

export const Loading: Story = {
  name: 'Loading · индикатор проверки, поле заблокировано',
  play: async ({ canvasElement, args }) => {
    const release = await holdAuth('verifyOtp');
    try {
      await userEvent.type(code(canvasElement), '0000');
      await expect(await within(canvasElement).findByRole('status', { name: tr('common.loading') })).toBeVisible();
      await expect(code(canvasElement)).toBeDisabled();
      await expect(code(canvasElement)).toHaveAttribute('aria-busy', 'true');
    } finally {
      release();
    }
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const ResendLoading: Story = {
  name: 'Loading · отправка нового кода',
  loaders: [async () => ({ pending: await pendingLogin(PHONE, 'client_new', 60_000) })],
  play: async ({ canvasElement }) => {
    const release = await holdAuth('requestOtp');
    try {
      await userEvent.click(resendButton(canvasElement));
      await expect(await within(resendButton(canvasElement)).findByRole('status', { name: tr('common.loading') })).toBeVisible();
      await expect(resendButton(canvasElement)).toBeDisabled();
    } finally {
      release();
    }
    await waitFor(() => expect(within(canvasElement).queryByRole('status', { name: tr('common.loading') })).toBeNull());
  },
};

export const AutoSubmit: Story = {
  name: 'Автоотправка после 4-й цифры',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(code(canvasElement), '0000');
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const PastedCode: Story = {
  name: 'Вставка кода целиком (WhatsApp IAB)',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(code(canvasElement));
    await userEvent.paste('0000');
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const ArabicDigits: Story = {
  name: 'Арабско-индийские цифры приводятся к западным',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(code(canvasElement), '٠٠٠٠');
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const PastedWithText: Story = {
  name: 'Вставка с лишними символами — берутся только цифры',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(code(canvasElement));
    await userEvent.paste('Code: 00 00');
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const InvalidCode: Story = {
  name: 'A3 · неверный код — поле очищено, фокус в поле',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(code(canvasElement), '1234');
    await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('auth.otp.invalid_retry')));
    await expect(code(canvasElement)).toHaveValue('');
    await expect(code(canvasElement)).toHaveFocus();
    await expect(args.onVerified).not.toHaveBeenCalled();
  },
};

export const InvalidThirdAttempt: Story = {
  name: 'A3 · после 3-й ошибки — остаток попыток',
  play: async ({ canvasElement }) => {
    await wrong(2);
    await userEvent.type(code(canvasElement), '1234');
    await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('auth.otp.invalid', { count: 2, attempts_left: 2 })));
  },
};

export const Expired: Story = {
  name: 'A4 · код истёк — новый код доступен сразу',
  loaders: [async () => ({ pending: await pendingLogin(PHONE, 'client_new', 6 * 60_000) })],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('auth.otp.expired'));
    await expect(code(canvasElement)).toBeDisabled();
    await expect(resendButton(canvasElement)).toBeEnabled();
  },
};

export const TooManyAttempts: Story = {
  name: 'A5 · 5 ошибок — ввод заблокирован до нового кода',
  play: async ({ canvasElement }) => {
    await wrong(4);
    await userEvent.type(code(canvasElement), '1234');
    await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('auth.otp.too_many_attempts')));
    await expect(code(canvasElement)).toBeDisabled();
    await expect(resendButton(canvasElement)).toBeEnabled();
  },
};

export const ResendReady: Story = {
  name: 'A7 · после 40 с — новый код, таймер заново',
  loaders: [async () => ({ pending: await pendingLogin(PHONE, 'client_new', 60_000) })],
  play: async ({ canvasElement }) => {
    await expect(resendButton(canvasElement)).toBeEnabled();
    await userEvent.click(resendButton(canvasElement));
    await waitFor(() => expect(resendButton(canvasElement)).toBeDisabled());
    await expect(resendButton(canvasElement)).toHaveTextContent(/\d/);
  },
};

export const UnknownNumber: Story = {
  name: 'A8 · номер без заявки → «не найдена»',
  loaders: [async () => ({ pending: await pendingLogin(UNKNOWN, 'unknown_phone') })],
  play: async ({ canvasElement, args }) => {
    await userEvent.type(code(canvasElement), '0000');
    await waitFor(() => expect(args.onUnknown).toHaveBeenCalledTimes(1));
    await expect(args.onVerified).not.toHaveBeenCalled();
  },
};

export const Offline: Story = {
  name: 'A9 · нет сети → «Повторить»',
  play: async ({ canvasElement, args }) => {
    const api = await getApi();
    api.demo!.setNetwork('offline');
    await userEvent.type(code(canvasElement), '0000');
    await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('common.offline_retry')));
    api.demo!.setNetwork('ok');
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('common.retry') }));
    await waitFor(() => expect(args.onVerified).toHaveBeenCalledTimes(1));
  },
};

export const ServerError: Story = {
  name: 'A10 · ошибка сервера + поддержка',
  play: async ({ canvasElement }) => {
    const api = await getApi();
    api.demo!.setNetwork('error');
    await userEvent.type(code(canvasElement), '0000');
    await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveTextContent(tr('common.server_error_retry')));
    await expect(within(canvasElement).getByRole('button', { name: 'support' })).toBeVisible();
    api.demo!.setNetwork('ok');
  },
};

export const ChangeNumber: Story = {
  name: 'A13 · «Изменить номер»',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('auth.otp.change_phone') }));
    await expect(args.onChangePhone).toHaveBeenCalledTimes(1);
  },
};
