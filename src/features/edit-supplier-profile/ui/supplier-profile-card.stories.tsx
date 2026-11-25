// Блок «About your business» поставщика (A-075): пустой, заполненный, ошибки после попытки отправить, только чтение,
// подсказки списка и сохранение — play-тесты против MockAdapter (персона supplier_new).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { tr } from '../../../../.storybook/story-helpers';
import { getApi } from '@/shared/api';

import { SupplierProfileCard } from './supplier-profile-card';

const FILLED = { cr_number: '1010123456', email: 'orders@zahrat.example', industry: 'Office supplies', city: 'Riyadh' };

const meta = {
  title: 'features/edit-supplier-profile/SupplierProfileCard',
  component: SupplierProfileCard,
  args: { supplier: {}, editable: true, onReadyChange: fn() },
  loaders: [
    async () => {
      const api = await getApi();
      api.demo!.setNetwork('ok');
      api.demo!.setPersona('supplier_new');
      return { api };
    },
  ],
} satisfies Meta<typeof SupplierProfileCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const field = (el: HTMLElement, key: Parameters<typeof tr>[0]) => within(el).getByLabelText(tr(key), { exact: true });

export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getByRole('heading', { name: tr('supplier.profile.title') })).toBeVisible();
    await expect(field(canvasElement, 'supplier.profile.cr_label')).toHaveValue('');
    await expect(field(canvasElement, 'supplier.profile.email_label')).toHaveAttribute('type', 'email');
    await expect(field(canvasElement, 'supplier.profile.city_label')).toHaveAttribute('role', 'combobox');
    await expect(args.onReadyChange).toHaveBeenLastCalledWith(false);
  },
};

export const Filled: Story = {
  name: 'Заполнен и сохранён — блок готов',
  args: { supplier: FILLED },
  play: async ({ args }) => {
    await expect(args.onReadyChange).toHaveBeenLastCalledWith(true);
  },
};

export const Attention: Story = {
  name: 'Попытка отправить без данных — ошибки во всех полях',
  args: { attention: 1 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.cr_required'))).toBeVisible();
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.email_required'))).toBeVisible();
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.industry_required'))).toBeVisible();
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.city_required'))).toBeVisible();
    await waitFor(() => expect(field(canvasElement, 'supplier.profile.cr_label')).toHaveFocus());
  },
};

export const ReadOnly: Story = {
  name: 'После отправки — только чтение',
  args: { supplier: FILLED, editable: false },
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement, 'supplier.profile.email_label')).toHaveAttribute('readonly');
  },
};

export const FillAndSave: Story = {
  name: 'Ввод, проверка, подсказка списка → сохранено в порт',
  play: async ({ canvasElement }) => {
    await userEvent.type(field(canvasElement, 'supplier.profile.email_label'), 'orders@zahrat');
    await userEvent.tab();
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.email_invalid'))).toBeVisible();
    await userEvent.type(field(canvasElement, 'supplier.profile.email_label'), '.example');
    // Начало названия на языке истории: список фильтруется по вхождению.
    const riyadh = tr('supplier.profile.city.options.riyadh');
    await userEvent.type(field(canvasElement, 'supplier.profile.city_label'), riyadh.slice(0, 3));
    await userEvent.click(await within(document.body).findByRole('option', { name: riyadh }));
    await userEvent.tab();
    const api = await getApi();
    await waitFor(async () =>
      expect(await api.supplier.get()).toMatchObject({ email: 'orders@zahrat.example', city: riyadh }),
    );
  },
};

export const ClearButtons: Story = {
  name: 'Крестик очистки — с первого символа, очищает поле; подпись поля не кликабельна',
  play: async ({ canvasElement }) => {
    const clear = () => within(canvasElement).queryAllByRole('button', { name: tr('common.clear') });
    await expect(clear()).toHaveLength(0);
    const email = field(canvasElement, 'supplier.profile.email_label');
    await userEvent.type(email, 'o');
    await expect(clear()).toHaveLength(1);
    await userEvent.click(clear()[0]!);
    await expect(email).toHaveValue('');
    await expect(email).toHaveFocus();
    // После очистки ошибка не показывается, пока не ушли из поля (Кирилл 2026-11-25) — даже после попытки отправить.
    await userEvent.type(email, 'bad');
    await userEvent.tab();
    await expect(within(canvasElement).getByText(tr('supplier.profile.error.email_invalid'))).toBeVisible();
    await userEvent.click(clear()[0]!);
    await expect(email).toHaveFocus();
    await expect(within(canvasElement).queryByText(tr('supplier.profile.error.email_invalid'))).toBeNull();
    await expect(within(canvasElement).queryByText(tr('supplier.profile.error.email_required'))).toBeNull();
    await expect(email).toHaveAttribute('aria-invalid', 'false');
    // Подпись — не <label>: клик по ней не переносит фокус в поле.
    await userEvent.click(within(canvasElement).getByText(tr('supplier.profile.city_label'), { exact: true }));
    await expect(field(canvasElement, 'supplier.profile.city_label')).not.toHaveFocus();
  },
};
