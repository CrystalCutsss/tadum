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
    await expect(page.getByRole('button', { name: tr(LANG, 'referral.copied') })).toBeVisible();
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

  // Документы — только чтение, в выдвижной панели.
  await page.getByRole('button', { name: tr(LANG, 'supplier.partner.documents_link') }).click();
  await expect(page.getByRole('dialog', { name: tr(LANG, 'supplier.partner.documents_link') })).toBeVisible();
});

test('supplier_declined: нейтральный экран без причины и без документов', async ({ page }) => {
  await openApplication(page, 'supplier_declined');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.declined.title') })).toBeVisible();
  await expect(page.getByRole('list', { name: tr(LANG, 'documents.list_label') })).toHaveCount(0);
  await expect(shareButton(page)).toHaveCount(0);
});

test('supplier_lost: баннер «Работа приостановлена», документы только для чтения, ссылки нет', async ({ page }) => {
  await openApplication(page, 'supplier_lost');
  await expect(page.getByRole('heading', { name: tr(LANG, 'supplier.paused.title') })).toBeVisible();
  await expect(page.getByRole('list', { name: tr(LANG, 'documents.list_label') })).toBeVisible();
  await expect(shareButton(page)).toHaveCount(0);
});

test('supplier_partner в AR: ссылка в LTR-изоляции', async ({ page }) => {
  await openApplication(page, 'supplier_partner', 'ar');
  await expect(page.getByTestId('referral-url').locator('bdi[dir="ltr"]')).toHaveText('https://tadum.sa/s/zahrat-al-madina');
});
