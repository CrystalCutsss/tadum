// Экран «Contact name и Business name» нового клиента (A-074): normal, ошибки полей, запрос кода, A9, A10 — play-тесты
// против MockAdapter.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { freshMock, tr } from '../../../../.storybook/story-helpers';
import { loginFlow } from '@/entities/session';
import { getApi } from '@/shared/api';
import { Button } from '@/shared/ui';

import { ContactDetailsForm } from './contact-details-form';

const meta = {
  title: 'features/request-otp/ContactDetailsForm',
  component: ContactDetailsForm,
  args: {
    phone: '+966500000001',
    onRequested: fn(),
    onChangePhone: fn(),
    supportSlot: <Button variant="outline">support</Button>,
  },
  loaders: [async () => ({ api: await freshMock() })],
} satisfies Meta<typeof ContactDetailsForm>;
export default meta;
type Story = StoryObj<typeof meta>;

const contact = (el: HTMLElement) => within(el).getByRole('textbox', { name: tr('auth.details.contact_name') });
const business = (el: HTMLElement) => within(el).getByRole('textbox', { name: tr('auth.details.business_name') });
const submit = (el: HTMLElement) => within(el).getByRole('button', { name: tr('auth.phone.submit') });

export const Normal: Story = {
  play: async ({ canvasElement }) => {
    await expect(contact(canvasElement)).toBeRequired();
    await expect(contact(canvasElement)).toHaveAttribute('autocomplete', 'name');
    await expect(business(canvasElement)).toHaveAttribute('autocomplete', 'organization');
    await expect(joinSupplier(canvasElement)).not.toBeChecked();
    await expect(within(canvasElement).getByText(tr('auth.details.join_supplier_hint'))).toBeVisible();
    await expect(submit(canvasElement)).toBeDisabled();
  },
};

export const FieldErrors: Story = {
  name: 'Проверка ввода · пустое, один знак, цифры в имени',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(contact(canvasElement));
    await userEvent.tab();
    await expect(await within(canvasElement).findByText(tr('auth.details.contact_name_required'))).toBeVisible();
    await userEvent.type(contact(canvasElement), 'Ahmed 2');
    await expect(within(canvasElement).getByText(tr('auth.details.contact_name_letters'))).toBeVisible();
    await expect(contact(canvasElement)).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(business(canvasElement), 'R');
    await userEvent.tab();
    await expect(within(canvasElement).getByText(tr('auth.details.too_short', { min: 2 }))).toBeVisible();
    await expect(submit(canvasElement)).toBeDisabled();
    await expect(args.onRequested).not.toHaveBeenCalled();
  },
};

export const RequestsCode: Story = {
  name: 'Имя и компания → код запрошен',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(contact(canvasElement), 'أحمد الحربي');
    await userEvent.type(business(canvasElement), 'Rimal Al Sharq');
    await expect(submit(canvasElement)).toBeEnabled();
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(args.onRequested).toHaveBeenCalledTimes(1));
  },
};

export const Offline: Story = {
  name: 'A9 · нет сети → «Повторить», введённое сохраняется',
  play: async ({ canvasElement, args }) => {
    const api = await getApi();
    api.demo!.setNetwork('offline');
    await userEvent.type(contact(canvasElement), 'Ahmed');
    await userEvent.type(business(canvasElement), 'Rimal');
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(within(canvasElement).getByText(tr('common.offline_retry'))).toBeVisible());
    await expect(contact(canvasElement)).toHaveValue('Ahmed');
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
    await userEvent.type(contact(canvasElement), 'Ahmed');
    await userEvent.type(business(canvasElement), 'Rimal');
    await userEvent.click(submit(canvasElement));
    await waitFor(() => expect(within(canvasElement).getByText(tr('common.server_error_retry'))).toBeVisible());
    await expect(within(canvasElement).getByRole('button', { name: 'support' })).toBeVisible();
    api.demo!.setNetwork('ok');
  },
};

const joinSupplier = (el: HTMLElement) => within(el).getByRole('checkbox', { name: tr('auth.details.join_supplier') });

export const ChangePhone: Story = {
  name: '«Изменить номер» → назад к номеру, введённое и чекбокс сохранены',
  play: async ({ canvasElement, args }) => {
    await userEvent.type(contact(canvasElement), 'Ahmed');
    await userEvent.type(business(canvasElement), 'Rim');
    await expect(joinSupplier(canvasElement)).not.toBeChecked();
    // Клик по пояснению в карточке тоже отмечает чекбокс.
    await userEvent.click(within(canvasElement).getByText(tr('auth.details.join_supplier_hint')));
    await expect(joinSupplier(canvasElement)).toBeChecked();
    await userEvent.click(within(canvasElement).getByRole('button', { name: tr('auth.otp.change_phone') }));
    await expect(args.onChangePhone).toHaveBeenCalledTimes(1);
    // Кирилл 2026-11-25: данные второго шага не теряются, даже если форма ещё не отправлена.
    await expect(loginFlow.details()).toEqual({ contactName: 'Ahmed', businessName: 'Rim', joinAsSupplier: true });
  },
};

export const Prefilled: Story = {
  name: 'Возврат на экран → поля заполнены сохранённым',
  // Декоратор, а не загрузчик: загрузчики идут параллельно, и freshMock из meta сбросил бы сохранённое.
  decorators: [
    (Story) => {
      if (!loginFlow.details()) loginFlow.saveDetails({ contactName: 'Ahmed Al-Harbi', businessName: 'Rimal Al Sharq', joinAsSupplier: true });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(contact(canvasElement)).toHaveValue('Ahmed Al-Harbi');
    await expect(business(canvasElement)).toHaveValue('Rimal Al Sharq');
    await expect(joinSupplier(canvasElement)).toBeChecked();
    await expect(submit(canvasElement)).toBeEnabled();
  },
};
