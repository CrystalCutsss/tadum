// auth.phone (SC-01): normal, ввод и вставка номера, A1, A2, A9, A10, A13 — play-тесты против MockAdapter.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { freshMock, tr } from '../../../../.storybook/story-helpers';
import { loginFlow } from '@/entities/session';
import { getApi } from '@/shared/api';
import { now, setClock } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { PhoneForm } from './phone-form';

const PHONE = '+966500000001';

const meta = {
  title: 'features/request-otp/PhoneForm',
  component: PhoneForm,
  args: { onRequested: fn(), supportSlot: <Button variant="outline">support</Button> },
  loaders: [async () => ({ api: await freshMock() })],
} satisfies Meta<typeof PhoneForm>;
export default meta;
type Story = StoryObj<typeof meta>;

const field = (el: HTMLElement) => within(el).getByRole('textbox');
const submit = (el: HTMLElement) => within(el).getByRole('button', { name: tr('auth.phone.submit') });

export const Normal: Story = {
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement)).toHaveAttribute('inputmode', 'tel');
    await expect(field(canvasElement)).toHaveAttribute('dir', 'ltr');
    await expect(submit(canvasElement)).toBeDisabled();
  },
};

export const RequestsCode: Story = {
  name: 'Ввод номера → код запрошен',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(field(canvasElement), '500000001');
    await expect(field(canvasElement)).toHaveValue('50 000 0001');
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(args.onRequested).toHaveBeenCalledTimes(1));
    await expect(loginFlow.get()?.phone).toBe(PHONE);
  },
};

export const PastedNumber: Story = {
  name: 'Вставка с +966, дефисами и ведущим 0',
  play: async ({ canvasElement }) => {
    await userEvent.click(field(canvasElement));
    await userEvent.paste('+966 050-000-0001');
    await expect(field(canvasElement)).toHaveValue('50 000 0001');
    await expect(submit(canvasElement)).toBeEnabled();
  },
};

export const InvalidFormat: Story = {
  name: 'A1 · номер не в формате KSA',
  play: async ({ canvasElement }) => {
    await userEvent.type(field(canvasElement), '41');
    await expect(within(canvasElement).getByText(tr('auth.phone.invalid_format'))).toBeVisible();
    await expect(field(canvasElement)).toHaveAttribute('aria-invalid', 'true');
    await expect(submit(canvasElement)).toBeDisabled();
  },
};

export const RateLimited: Story = {
  name: 'A2 · слишком много запросов',
  loaders: [
    async () => {
      const api = await freshMock();
      let t = now() - 3 * 40_000;
      const restore = setClock(() => t);
      for (let i = 0; i < 3; i++) {
        await api.auth.requestOtp(PHONE);
        t += 40_000;
      }
      restore();
      return { api };
    },
  ],
  play: async ({ canvasElement, args }) => {
    await userEvent.type(field(canvasElement), '500000001');
    await userEvent.click(submit(canvasElement));
    // Первый из трёх запросов был 2 минуты назад: до конца окна в 10 минут — 8 минут.
    await waitFor(() => expect(within(canvasElement).getByText(tr('auth.phone.too_many_requests', { count: 8, minutes: 8 }))).toBeVisible());
    await expect(submit(canvasElement)).toBeDisabled();
    await expect(args.onRequested).not.toHaveBeenCalled();
  },
};

export const Offline: Story = {
  name: 'A9 · нет сети → «Повторить»',
  play: async ({ canvasElement, args }) => {
    const api = await getApi();
    api.demo!.setNetwork('offline');
    await userEvent.type(field(canvasElement), '500000001');
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(within(canvasElement).getByText(tr('common.offline_retry'))).toBeVisible());
    // Введённое сохраняется.
    await expect(field(canvasElement)).toHaveValue('50 000 0001');
    api.demo!.setNetwork('ok');
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('common.retry') }));
    await waitFor(() => expect(args.onRequested).toHaveBeenCalledTimes(1));
  },
};

export const ServerError: Story = {
  name: 'A10 · ошибка сервера + поддержка',
  play: async ({ canvasElement }) => {
    const api = await getApi();
    api.demo!.setNetwork('error');
    await userEvent.type(field(canvasElement), '500000001');
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(within(canvasElement).getByText(tr('common.server_error_retry'))).toBeVisible());
    await expect(within(canvasElement).getByRole('button', { name: 'support' })).toBeVisible();
    api.demo!.setNetwork('ok');
  },
};

export const PrefilledAfterChange: Story = {
  name: 'A13 · «Изменить номер» — поле заполнено',
  loaders: [
    async () => {
      const api = await freshMock();
      loginFlow.start({ phone: PHONE, challenge: await api.auth.requestOtp(PHONE) });
      loginFlow.changePhone();
      return { api };
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement)).toHaveValue('50 000 0001');
    await expect(submit(canvasElement)).toBeEnabled();
  },
};
