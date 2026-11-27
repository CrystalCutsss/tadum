// Форма новой покупки (D-100, бриф TD-002 §3): портал — одна копия на историю, язык и тема из глобалов тулбара.
// Проверяются три ошибки, блокировка отправки и текст WhatsApp; события — без суммы и поставщика.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { tr } from '../../../../.storybook/story-helpers';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';

import { PurchaseRequest } from './purchase-request';

const sar = (amount: number) => ({ amount_minor: amount * 100, currency: 'SAR' as const });
const limit = { approved: sar(150_000), used: sar(42_500) };

const meta = {
  title: 'features/RequestPurchase',
  component: PurchaseRequest,
  args: { limit, available: sar(107_500), company: 'Ufuq Office Furniture' },
} satisfies Meta<typeof PurchaseRequest>;
export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/**
 * Открыть форму. На телефонной ширине шторка (vaul) грузится лениво: пока модуль не загружен, клик по триггеру
 * ничего не открывает — кликаем повторно, пока окно не появится (как в истории ResponsiveDialog/MobileFocus).
 */
async function openForm(canvasElement: HTMLElement): Promise<HTMLElement> {
  const cta = within(canvasElement).getByRole('button', { name: tr('home.purchase.cta') });
  return waitFor(
    async () => {
      if (!body().queryByRole('dialog')) await userEvent.click(cta);
      return body().getByRole('dialog');
    },
    { timeout: 5000 },
  );
}

export const Closed: Story = { name: 'Кнопка «Новая покупка»' };

export const Errors: Story = {
  name: 'Ошибки: пустая сумма, больше доступной, короткое имя поставщика',
  play: async ({ canvasElement }) => {
    const d = within(await openForm(canvasElement));
    await expect(d.getByText(/107,500/, { selector: '[data-slot=field-description]' })).toBeVisible();
    const amount = d.getByLabelText(tr('home.purchase.amount'));
    const supplier = d.getByLabelText(tr('home.purchase.supplier'));
    const submit = d.getByRole('button', { name: tr('home.purchase.submit') });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');

    // Пустая сумма — после ухода из поля.
    await userEvent.click(amount);
    await userEvent.tab();
    await expect(d.getByText(tr('home.purchase.amount_error'))).toBeVisible();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');

    // Больше доступной — сразу, отправка недоступна.
    await userEvent.type(amount, '200000');
    await expect(d.getByText(/107,500/, { selector: '[data-slot=field-error]' })).toBeVisible();
    await expect(submit).toHaveAttribute('aria-disabled', 'true');

    // Короткое имя поставщика.
    await userEvent.type(supplier, 'A');
    await userEvent.tab();
    await expect(d.getByText(tr('home.purchase.supplier_short'))).toBeVisible();
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
  },
};

export const SubmitOpensWhatsapp: Story = {
  name: 'Отправка: WhatsApp с текстом, форма закрывается, события без суммы',
  loaders: [
    () => {
      const events: CapturedEvent[] = [];
      const restoreAnalytics = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
      const opened: string[] = [];
      const spy = (url?: string | URL) => {
        opened.push(String(url));
        return null;
      };
      const descriptor = Object.getOwnPropertyDescriptor(window, 'open');
      Object.defineProperty(window, 'open', { configurable: true, writable: true, value: spy });
      const restore = () => {
        if (descriptor) Object.defineProperty(window, 'open', descriptor);
        restoreAnalytics();
      };
      return { events, opened, restore };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    const { events, opened, restore } = loaded as { events: CapturedEvent[]; opened: string[]; restore: () => void };
    try {
      const d = within(await openForm(canvasElement));
      await userEvent.type(d.getByLabelText(tr('home.purchase.amount')), '25000');
      await userEvent.type(d.getByLabelText(tr('home.purchase.supplier')), 'Al Noor Trading');
      await userEvent.click(d.getByRole('button', { name: tr('home.purchase.submit') }));
      await waitFor(() => expect(body().queryByRole('dialog')).toBeNull());
      await expect(opened).toHaveLength(1);
      const text = new URL(opened[0]!).searchParams.get('text') ?? '';
      await expect(text).toContain('Ufuq Office Furniture');
      await expect(text).toContain('Al Noor Trading');
      await expect(text).toContain('25,000');
      const names = events.map((e) => e.name);
      await expect(names).toEqual(['purchase_request_opened', 'purchase_request_whatsapp_opened']);
      await expect(events[1]!.props).toEqual({ amount_bucket: '<50k', used_share_bucket: '26-50' });
    } finally {
      restore();
    }
  },
};
