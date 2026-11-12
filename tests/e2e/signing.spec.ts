// Этапы «Решение», «Подписание», «Лимит одобрен» на экране «Заявка» (A-063): демо-подпись в той же вкладке,
// подробности заявки в выдвижной панели, отменённый лимит, папка документов, WhatsApp.
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

test('@smoke client_approved_unsigned: «Открыть» → «Подписать» × 3 в той же вкладке → «Лимит одобрен» → подробности в панели', async ({ page }) => {
  await openApplication(page, 'client_approved_unsigned');
  await expect(steps(page).getByRole('link', { name: tr(LANG, 'checklist.open') })).toHaveCount(3);

  for (const key of ITEMS) {
    // Демо-подпись — в той же вкладке: в новой у просмотрщика Proto нет сессии мока, «Назад» вела на вход (баг 2026-11-11).
    await step(page, key).getByRole('link', { name: tr(LANG, 'checklist.open') }).click();
    await expect(page).toHaveURL(new RegExp(`/demo/sign\\?item=${key}$`));
    await page.getByRole('button', { name: tr(LANG, 'demo_sign.sign') }).click();
    await expect(page.getByRole('status')).toHaveText(tr(LANG, 'demo_sign.signed'));
    await page.getByRole('link', { name: tr(LANG, 'demo_sign.back') }).click();
    await expect(page).toHaveURL(/\/c\/documents/);
    if (key !== 'pn_owner_nafith') await expect(step(page, key)).toContainText(tr(LANG, 'checklist.status.done'));
  }

  // Все три подписаны: «Лимит одобрен», шагов подписания и шкалы нет.
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.summary.title') })).toBeVisible();
  await expect(steps(page)).toHaveCount(0);

  // «Open application» — выдвижная панель с датами, лимитом и документами, без перехода на страницу (Кирилл 2026-11-11).
  await page.getByRole('button', { name: tr(LANG, 'application.summary.open') }).click();
  const panel = page.getByRole('dialog', { name: tr(LANG, 'application.details.title') });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(tr(LANG, 'application.summary.limit'), { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/c\/documents$/);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
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

  // Внешние ссылки Sadq / Nafith во встроенном браузере заменяются на «Скопировать ссылку» (история
  // ChecklistLinkButton/InAppBrowser); демо-страница — внутри прототипа и открывается сразу, в той же вкладке.
  test('демо-подпись открывается в той же вкладке, без «Скопировать ссылку»', async ({ page, context }) => {
    await openApplication(page, 'client_approved_unsigned');
    let opened = false;
    context.on('page', () => (opened = true));
    await step(page, 'spa_sadq').getByRole('link', { name: tr(LANG, 'checklist.open') }).click();
    await expect(page).toHaveURL(/\/demo\/sign\?item=spa_sadq$/);
    expect(opened).toBe(false);
  });
});
