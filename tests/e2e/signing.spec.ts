// Этапы «Решение», «Подписание», «Лимит одобрен» на экране «Заявка» (A-063): демо-подпись в новой вкладке,
// подхват статуса при возврате, подробности заявки с крошками, отменённый лимит, папка документов, WhatsApp.
import type { Page } from '@playwright/test';

import { asPersona, expect, test, tr, type Lang } from './fixtures';

const LANG: Lang = 'en';
const ITEMS = ['spa_sadq', 'pn_company_nafith', 'pn_owner_nafith'] as const;

/** Открыть «Заявку» персоны и дождаться данных (заголовок экрана и без скелетонов). */
async function openApplication(page: Page, persona: string, lang: Lang = LANG) {
  await asPersona(page, persona, lang, '/c/documents');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
}

const steps = (page: Page, lang: Lang = LANG) => page.getByRole('list', { name: tr(lang, 'checklist.title') });
const step = (page: Page, key: (typeof ITEMS)[number], lang: Lang = LANG) =>
  steps(page, lang).getByRole('listitem').filter({ hasText: tr(lang, `checklist.${key}`) });

test('@smoke client_approved_unsigned: «Открыть» → «Подписать» × 3 → «Лимит одобрен» → подробности и крошки', async ({ page, context }) => {
  await openApplication(page, 'client_approved_unsigned');
  await expect(steps(page).getByRole('link', { name: tr(LANG, 'checklist.open') })).toHaveCount(3);

  for (const key of ITEMS) {
    const row = step(page, key);
    const [popup] = await Promise.all([context.waitForEvent('page'), row.getByRole('link', { name: tr(LANG, 'checklist.open') }).click()]);
    await popup.waitForLoadState();
    await expect(popup).toHaveURL(new RegExp(`/demo/sign\\?item=${key}$`));
    await popup.getByRole('button', { name: tr(LANG, 'demo_sign.sign') }).click();
    await expect(popup.getByRole('status')).toHaveText(tr(LANG, 'demo_sign.signed'));
    await popup.close();

    // Возврат на вкладку Tadum: опрос по фокусу (D-035) подхватывает подпись.
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
    if (key !== 'pn_owner_nafith') await expect(row).toContainText(tr(LANG, 'checklist.status.done'));
  }

  // Все три подписаны: «Лимит одобрен», шагов подписания и шкалы нет.
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.summary.title') })).toBeVisible();
  await expect(steps(page)).toHaveCount(0);

  await page.getByRole('button', { name: tr(LANG, 'application.summary.open') }).click();
  await expect(page).toHaveURL(/[?&]view=details/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'application.details.title') })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: tr(LANG, 'nav.breadcrumb') });
  await expect(crumbs.locator('[data-slot="breadcrumb-page"]')).toHaveText(tr(LANG, 'application.details.title'));
  await crumbs.getByRole('link', { name: tr(LANG, 'nav.application'), exact: true }).click();
  await expect(page).not.toHaveURL(/view=details/);
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.summary.title') })).toBeVisible();
});

test('подробности заявки: aria-current="page" — только у текущей крошки, не у ссылки «Заявка»', async ({ page }) => {
  await asPersona(page, 'client_active', LANG, '/c/documents');
  await page.getByRole('button', { name: tr(LANG, 'application.summary.open') }).click();
  await expect(page).toHaveURL(/[?&]view=details/);
  const crumbs = page.getByRole('navigation', { name: tr(LANG, 'nav.breadcrumb') });
  await expect(crumbs.getByRole('link', { name: tr(LANG, 'nav.application'), exact: true })).not.toHaveAttribute('aria-current', 'page');
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(tr(LANG, 'application.details.title'));
});

test('client_offer_pending: текущий шаг шкалы — «Решение», подписи неактивны', async ({ page }) => {
  await openApplication(page, 'client_offer_pending');
  // Шкала: на компьютере — вертикальная с подписями, на телефоне — степ-бар (подпись у сегмента — для скринридера).
  const current = page.getByRole('list', { name: tr(LANG, 'timeline.title') }).locator('li[aria-current="step"]').filter({ visible: true });
  await expect(current).toHaveCount(1);
  await expect(current).toContainText(tr(LANG, 'timeline.client.decision'));
  await expect(steps(page).getByText(tr(LANG, 'checklist.status.locked'))).toHaveCount(3);
  await expect(steps(page).getByRole('link')).toHaveCount(0);
});

test('client_signing_partial: вексель компании — «ждём подтверждения», у векселя владельца — «Открыть»', async ({ page }) => {
  await openApplication(page, 'client_signing_partial');
  await expect(step(page, 'spa_sadq')).toContainText(tr(LANG, 'checklist.status.done'));
  await expect(step(page, 'pn_company_nafith')).toContainText(tr(LANG, 'checklist.status.in_progress'));
  await expect(step(page, 'pn_company_nafith').getByRole('link')).toHaveCount(0);
  await expect(step(page, 'pn_owner_nafith').getByRole('link', { name: tr(LANG, 'checklist.open') })).toBeVisible();
});

test('client_limit_cancelled: «Подать новую заявку» ведёт на лендинг', async ({ page }) => {
  await openApplication(page, 'client_limit_cancelled');
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.cancelled.title') })).toBeVisible();
  // Лендинг — VITE_LANDING_URL или https://tadum.sa по умолчанию.
  await expect(page.getByRole('link', { name: tr(LANG, 'application.cancelled.apply') })).toHaveAttribute('href', /^https:\/\/[^/]*tadum/);
  await expect(steps(page)).toHaveCount(0);
});

test('папка документов открывает панель со списком документов без статусов', async ({ page }) => {
  await openApplication(page, 'client_approved_unsigned');
  await page.getByRole('button', { name: new RegExp(tr(LANG, 'application.folder.title')) }).filter({ visible: true }).click();
  const panel = page.getByRole('dialog', { name: tr(LANG, 'application.folder.title') });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(tr(LANG, 'document.aoa.title'), { exact: true })).toBeVisible();
  await expect(panel.getByText(tr(LANG, 'document.bs.title'), { exact: true })).toBeVisible();
  // Архив: ни статусов, ни бейджей.
  await expect(panel.locator('[data-slot="status-badge"], [data-slot="badge"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test.describe('встроенный браузер WhatsApp', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 WhatsApp/2.24.1' });

  test('«Открыть» показывает «Скопировать ссылку» вместо перехода', async ({ page, context }) => {
    await openApplication(page, 'client_approved_unsigned');
    let opened = false;
    context.on('page', () => (opened = true));
    const row = step(page, 'spa_sadq');
    await row.getByRole('link', { name: tr(LANG, 'checklist.open') }).click();
    await expect(row.getByRole('button', { name: tr(LANG, 'common.copy_link') })).toBeVisible();
    await expect(row.getByText(tr(LANG, 'common.open_in_browser'))).toBeVisible();
    await expect(page).toHaveURL(/\/c\/documents/);
    expect(opened).toBe(false);
  });
});
