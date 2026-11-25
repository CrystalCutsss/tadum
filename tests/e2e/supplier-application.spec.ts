// Экран «Заявка» поставщика (бриф TD-001; SP-02, SP-03; D-087–D-091): вход ведёт на /s/documents, ссылки нет до
// одобрения документов; «Остался договор»; «Вы партнёр Tadum» — копирование ссылки и QR; Declined и Lost.
import type { Page } from '@playwright/test';

import { asPersona, expect, signIn, test, tr, type Lang } from './fixtures';

const LANG: Lang = 'en';

async function openApplication(page: Page, persona: string, lang: Lang = LANG) {
  await asPersona(page, persona, lang, '/s/documents');
  await expect(page.getByRole('heading', { level: 1, name: tr(lang, 'documents.title') })).toBeVisible();
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
}

const shareButton = (page: Page, lang: Lang = LANG) => page.getByRole('button', { name: tr(lang, 'referral.share_whatsapp') });

test('@smoke supplier_new: вход по коду → экран «Заявка», документы, ссылки нет (D-087)', async ({ page }) => {
  await signIn(page, LANG, '500000011');
  await expect(page).toHaveURL(/\/s\/documents$/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'documents.title') })).toBeVisible();
  await expect(page.getByRole('list', { name: tr(LANG, 'documents.list_label') })).toBeVisible();
  await expect(page.getByText(tr(LANG, 'document.sup_vat.title')).first()).toBeVisible();
  await expect(shareButton(page)).toHaveCount(0);
});

test('supplier_new: блок «About your business» — 4 поля с проверкой, подсказки списка, значения сохраняются (A-075)', async ({ page }) => {
  await openApplication(page, 'supplier_new');
  const block = page.getByRole('region', { name: tr(LANG, 'supplier.profile.title') });
  await expect(block.getByText(tr(LANG, 'supplier.profile.hint'))).toBeVisible();
  const field = (key: string) => block.getByLabel(tr(LANG, key), { exact: true });
  // Проверка: неполный CR, email без домена, город с цифрами.
  await field('supplier.profile.cr_label').fill('12345');
  await field('supplier.profile.email_label').fill('orders@zahrat');
  await field('supplier.profile.email_label').blur();
  await expect(block.getByText(tr(LANG, 'supplier.profile.error.cr_length'))).toBeVisible();
  await expect(block.getByText(tr(LANG, 'supplier.profile.error.email_invalid'))).toBeVisible();
  await field('supplier.profile.city_label').fill('Riyadh 2');
  await field('supplier.profile.city_label').blur();
  await expect(block.getByText(tr(LANG, 'supplier.profile.error.city_letters'))).toBeVisible();
  // Верные значения; отрасль и город — из подсказок списка.
  await field('supplier.profile.cr_label').fill('1010123456');
  await field('supplier.profile.email_label').fill('orders@zahrat.example');
  await field('supplier.profile.industry_label').fill('stat');
  await page.getByRole('option', { name: tr(LANG, 'supplier.profile.industry.options.office') }).click();
  await field('supplier.profile.city_label').fill('riy');
  await page.getByRole('option', { name: tr(LANG, 'supplier.profile.city.options.riyadh') }).click();
  await field('supplier.profile.city_label').blur();
  await expect(block.getByRole('alert')).toHaveCount(0);
  await expect(block.locator('[aria-invalid="true"]')).toHaveCount(0);
  // Блок готов, когда все четыре поля сохранены: в панели отправки закрашен его сегмент (документов ещё нет).
  await expect(page.getByText(/^1 of \d+ done$/)).toBeVisible();
  // Значения сохранены в мок: после перезагрузки они на месте.
  await page.reload();
  await expect(field('supplier.profile.city_label')).toHaveValue(tr(LANG, 'supplier.profile.city.options.riyadh'));
  await expect(field('supplier.profile.cr_label')).toHaveValue('1010123456');
  await expect(field('supplier.profile.email_label')).toHaveValue('orders@zahrat.example');
  await expect(field('supplier.profile.industry_label')).toHaveValue(tr(LANG, 'supplier.profile.industry.options.office'));
});

test('supplier_review: документы на проверке, файлы не меняются, ссылки нет; срок проверки не показан (D-091)', async ({ page }) => {
  await openApplication(page, 'supplier_review');
  await expect(page.getByText(tr(LANG, 'documents.locked.title'))).toBeVisible();
  await expect(shareButton(page)).toHaveCount(0);
  await expect(page.getByText(/usually takes up to/i)).toHaveCount(0);
});

test('supplier_contract: «Остался договор» без кнопок и ссылки (D-090)', async ({ page }) => {
  await openApplication(page, 'supplier_contract');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.contract.title') })).toBeVisible();
  await expect(shareButton(page)).toHaveCount(0);
});

test('@smoke supplier_partner: «Вы партнёр Tadum» — ссылка копируется, QR скачивается PNG (D-089)', async ({ page, context, browserName }) => {
  await openApplication(page, 'supplier_partner');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.partner.title') })).toBeVisible();
  await expect(page.getByTestId('referral-url')).toHaveText('https://tadum.sa/s/zahrat-al-madina');
  await expect(shareButton(page)).toBeVisible();

  // Копирование: в Chromium — с проверкой буфера.
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: tr(LANG, 'referral.copy') }).click();
  if (browserName === 'chromium') {
    // «Скопировано» — тостом (D-092).
    await expect(page.getByText(tr(LANG, 'referral.copied'), { exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://tadum.sa/s/zahrat-al-madina');
  }

  // QR — в панели; скачивание — PNG с именем tadum-{slug}-qr.png.
  await page.getByRole('button', { name: tr(LANG, 'supplier.partner.qr_button') }).click();
  const panel = page.getByRole('dialog', { name: tr(LANG, 'referral.qr_title') });
  await expect(panel.getByRole('img', { name: tr(LANG, 'referral.qr_alt', { url: 'https://tadum.sa/s/zahrat-al-madina' }) })).toBeVisible();
  const download = page.waitForEvent('download');
  await panel.getByRole('link', { name: tr(LANG, 'referral.qr_download') }).click();
  expect((await download).suggestedFilename()).toBe('tadum-zahrat-al-madina-qr.png');
  await page.keyboard.press('Escape');

  // D-092: «Как это работает» — отдельный блок; шкала остаётся, у «Партнёр» — «Active»; кнопки «Документы» нет.
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.partner.how_title') })).toBeVisible();
  await expect(page.getByText(tr(LANG, 'timeline.supplier.partner_active'), { exact: true }).first()).toBeAttached();
  await expect(page.getByRole('button', { name: tr(LANG, 'nav.documents'), exact: true })).toHaveCount(0);
});

test('supplier_declined: нейтральный экран без причины и без документов', async ({ page }) => {
  await openApplication(page, 'supplier_declined');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.declined.title') })).toBeVisible();
  await expect(page.getByRole('list', { name: tr(LANG, 'documents.list_label') })).toHaveCount(0);
  await expect(shareButton(page)).toHaveCount(0);
});

test('supplier_lost: карточка «Работа приостановлена» без «Contact us», шаг «Не активен», ссылки нет (D-092, Кирилл 2026-11-25)', async ({ page }) => {
  await openApplication(page, 'supplier_lost');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.paused.title') })).toBeVisible();
  await expect(page.getByText(tr(LANG, 'timeline.supplier.inactive'), { exact: true }).first()).toBeAttached();
  await expect(page.getByText(tr(LANG, 'supplier.paused.body'), { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: tr(LANG, 'supplier.contact_us') })).toHaveCount(0);
  await expect(shareButton(page)).toHaveCount(0);
});

test('supplier_partner в AR: ссылка в LTR-изоляции', async ({ page }) => {
  await openApplication(page, 'supplier_partner', 'ar');
  await expect(page.getByTestId('referral-url').locator('bdi[dir="ltr"]')).toHaveText('https://tadum.sa/s/zahrat-al-madina');
});
