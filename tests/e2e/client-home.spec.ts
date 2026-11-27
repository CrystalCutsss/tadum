// TD-002: главная активного клиента (D-098…D-101, SC-07). Время фиксировано фикстурой; ждём состояние, не таймаут.
import type { Page } from '@playwright/test';

import { asPersona, expect, openSidebar, test, tr } from './fixtures';

const limitHeading = (page: Page) => page.getByRole('heading', { name: tr('en', 'limit.available') });
const homeNav = (page: Page) => page.getByRole('navigation', { name: tr('en', 'nav.main') }).getByRole('link', { name: tr('en', 'nav.home') });

/** Перехват window.open: WhatsApp — внешняя ссылка, в тесте только проверяем адрес. */
async function captureWindowOpen(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] };
    w.__opened = [];
    window.open = ((url?: string | URL) => {
      w.__opened.push(String(url));
      return null;
    });
  });
  return () => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
}

test('@smoke client_active → / → /c/home: доступная сумма, одна кнопка покупки, шаги, Home первым в меню', async ({ page }) => {
  await asPersona(page, 'client_active');
  await expect(page).toHaveURL(/\/c\/home/);
  await expect(limitHeading(page)).toBeVisible();
  const limit = page.locator('#limit');
  await expect(limit).toContainText('107,500');
  await expect(limit).toContainText('SAR 150,000');
  await expect(limit).toContainText('SAR 42,500');
  await expect(limit.getByRole('progressbar')).toBeVisible();
  await expect(limit.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: tr('en', 'how_to_buy.title') })).toBeVisible();
  await expect(page.getByRole('heading', { name: tr('en', 'home.welcome.title') })).toBeVisible();
  await openSidebar(page, 'en');
  const items = page.getByRole('navigation', { name: tr('en', 'nav.main') }).getByRole('link');
  await expect(items.first()).toHaveText(tr('en', 'nav.home'));
});

test('@smoke форма покупки: ошибки блокируют отправку, WhatsApp — с компанией, поставщиком и суммой', async ({ page }) => {
  const opened = await captureWindowOpen(page);
  await asPersona(page, 'client_active');
  await page.getByRole('button', { name: tr('en', 'home.purchase.cta') }).click();
  const dialog = page.getByRole('dialog', { name: tr('en', 'home.purchase.title') });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(tr('en', 'home.purchase.amount_hint', { amount: 'SAR 107,500' }));
  const amount = dialog.getByRole('textbox', { name: tr('en', 'home.purchase.amount') });
  const supplier = dialog.getByRole('textbox', { name: tr('en', 'home.purchase.supplier') });
  const submit = dialog.getByRole('button', { name: tr('en', 'home.purchase.submit') });

  // Фокус — в форме; Enter в пустой форме показывает обе ошибки и ведёт в поле суммы (WCAG 3.3.1).
  await expect(amount).toBeFocused();
  await amount.press('Enter');
  await expect(dialog.getByText(tr('en', 'home.purchase.amount_error'))).toBeVisible();
  await expect(dialog.getByText(tr('en', 'home.purchase.supplier_error'))).toBeVisible();
  await expect(amount).toBeFocused();
  await amount.fill('200000');
  await expect(dialog.getByText(tr('en', 'home.purchase.amount_over', { amount: 'SAR 107,500' }))).toBeVisible();
  await expect(submit).toHaveAttribute('aria-disabled', 'true');
  await supplier.fill('A');
  await supplier.blur();
  await expect(dialog.getByText(tr('en', 'home.purchase.supplier_error'))).toBeVisible();

  await amount.fill('25000');
  await supplier.fill('Al Noor Trading');
  await expect(submit).toHaveAttribute('aria-disabled', 'false');
  await submit.click();
  await expect(dialog).toBeHidden();
  // Фокус возвращается на «Новая покупка».
  await expect(page.getByRole('button', { name: tr('en', 'home.purchase.cta') })).toBeFocused();
  const urls = await opened();
  expect(urls).toHaveLength(1);
  const url = new URL(urls[0]!);
  expect(url.origin + url.pathname).toBe('https://wa.me/966579768881');
  expect(url.searchParams.get('text')).toBe(
    tr('en', 'support.prefill.purchase_request', { company: 'Ufuq Office Furniture', supplier: 'Al Noor Trading', amount: 'SAR 25,000' }),
  );
});

test('блок шагов: «Скрыть» запоминается после перезагрузки; карточка первого визита не возвращается', async ({ page }) => {
  await asPersona(page, 'client_active');
  await page.getByRole('button', { name: tr('en', 'home.welcome.dismiss') }).click();
  await expect(page.getByRole('heading', { name: tr('en', 'home.welcome.title') })).toHaveCount(0);
  await page.getByRole('button', { name: tr('en', 'how_to_buy.hide'), exact: true }).click();
  const show = page.getByRole('button', { name: tr('en', 'how_to_buy.show') });
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await expect(limitHeading(page)).toBeVisible();
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: tr('en', 'home.welcome.title') })).toHaveCount(0);
  // Ссылка на блок раскрывает его.
  await page.goto('/c/home#how-to-buy');
  await expect(page.getByRole('button', { name: tr('en', 'how_to_buy.hide'), exact: true })).toBeVisible();
  await expect(page.locator('#how-to-buy li')).toHaveCount(3);
});

test('client_first_purchase: тот же экран, суммы 70,000 из 100,000; «Договор и документы» → «Заявка»', async ({ page }) => {
  await asPersona(page, 'client_first_purchase');
  await expect(page).toHaveURL(/\/c\/home/);
  await expect(page.locator('#limit')).toContainText('70,000');
  await expect(page.locator('#limit')).toContainText('SAR 100,000');
  await page.getByRole('link', { name: tr('en', 'home.docs_link') }).first().click();
  await expect(page).toHaveURL(/\/c\/documents$/);
});

test('лимит, отменённый до активации (client_limit_cancelled), — главной нет', async ({ page }) => {
  await asPersona(page, 'client_limit_cancelled');
  await expect(page).toHaveURL(/\/c\/documents/);
  await openSidebar(page, 'en');
  await expect(homeNav(page)).toHaveCount(0);
});

test('@smoke D-102: график платежей — срок прошёл виден на Home; история в панели; детали с «Как оплатить»', async ({ page }) => {
  await asPersona(page, 'client_first_purchase');
  const block = page.locator('#repayments');
  await expect(block.getByRole('heading', { name: tr('en', 'repayments.title') })).toBeVisible();
  // Просроченный взнос — первым и с меткой, при нём «Написать менеджеру».
  await expect(block.getByText(tr('en', 'repayments.overdue')).first()).toBeVisible();
  await expect(block.getByRole('link', { name: tr('en', 'home.manager.cta') })).toHaveAttribute('href', /wa\.me/);
  // На главной — три взноса (без оплаченного).
  await expect(block.getByRole('button', { name: /10,000/ })).toHaveCount(3);
  await block.getByRole('button', { name: tr('en', 'repayments.history') }).click();
  const panel = page.getByRole('dialog', { name: tr('en', 'repayments.history') });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: tr('en', 'repayments.groups.paid') })).toBeVisible();
  await expect(panel.getByRole('button', { name: /10,000/ })).toHaveCount(4);
  await panel.getByRole('button', { name: /10,000/ }).nth(1).click();
  const details = page.getByRole('dialog', { name: tr('en', 'repayments.details.title') });
  await expect(details.getByRole('heading', { name: tr('en', 'repayments.how_to_pay.title') })).toBeVisible();
  await expect(details).toContainText('SA4420000001234567891234');
  await details.getByRole('button', { name: tr('en', 'repayments.details.back') }).click();
  await expect(page.getByRole('dialog', { name: tr('en', 'repayments.history') })).toBeVisible();
});
