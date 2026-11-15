// Этапы «Решение», «Подписание», «Лимит одобрен» (A-063, D-083): кнопка подписания в карточке лимита, экран подписания
// из двух шагов (SPA и вексель), демо-подтверждение в той же вкладке, подробности заявки в панели, отменённый лимит, папка.
import type { Page } from '@playwright/test';

import { asPersona, expect, test, tr, type Lang } from './fixtures';

const LANG: Lang = 'en';
const ITEMS = ['spa', 'pn_nafith'] as const;

/** Открыть «Заявку» персоны и дождаться данных (заголовок экрана и без скелетонов). */
async function openApplication(page: Page, persona: string, lang: Lang = LANG) {
  await asPersona(page, persona, lang, '/c/documents');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
}

const steps = (page: Page, lang: Lang = LANG) => page.getByRole('list', { name: tr(lang, 'signing.title') });
const step = (page: Page, key: (typeof ITEMS)[number], lang: Lang = LANG) =>
  steps(page, lang).getByRole('listitem').filter({ hasText: tr(lang, `checklist.${key}`) });
const signCta = (page: Page, lang: Lang = LANG) => page.getByRole('link', { name: tr(lang, 'signing.cta') });

test('@smoke client_approved_unsigned: «Sign documents» → экран подписания → подтверждение двух шагов → «Лимит одобрен» → подробности в панели', async ({ page }) => {
  await openApplication(page, 'client_approved_unsigned');
  // Блока шагов на «Заявке» нет (D-083) — только кнопка в карточке лимита и прогресс.
  await expect(steps(page)).toHaveCount(0);
  await expect(page.getByText(tr(LANG, 'signing.progress', { done: '0', total: '2' }))).toBeVisible();
  await signCta(page).click();
  await expect(page).toHaveURL(/\/c\/documents\/sign$/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'signing.title') })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: tr(LANG, 'nav.breadcrumb') });
  await expect(crumbs.getByRole('link', { name: tr(LANG, 'nav.application'), exact: true })).toBeVisible();
  await expect(step(page, 'spa').getByRole('link', { name: tr(LANG, 'signing.spa.download') })).toHaveAttribute('href', /demo\/spa\.pdf$/);

  for (const key of ITEMS) {
    // Демо: «подтверждение» команды (SPA) или Nafith (вексель) — на демо-странице в той же вкладке, «Назад» — к подписанию.
    await step(page, key).getByRole('link', { name: tr(LANG, 'demo_sign.confirm') }).click();
    await expect(page).toHaveURL(new RegExp(`/demo/sign\\?item=${key}$`));
    await page.getByRole('button', { name: tr(LANG, 'demo_sign.sign') }).click();
    await expect(page.getByRole('status')).toHaveText(tr(LANG, 'demo_sign.signed'));
    await page.getByRole('link', { name: tr(LANG, 'demo_sign.back') }).click();
    await expect(page).toHaveURL(/\/c\/documents\/sign$/);
    if (key === 'spa') await expect(step(page, 'spa')).toContainText(tr(LANG, 'checklist.status.done'));
  }

  // Оба шага готовы: экран подписания говорит «Лимит одобрен», путь — назад к заявке.
  await expect(page.getByText(tr(LANG, 'signing.done')).first()).toBeVisible();
  await page.getByRole('link', { name: tr(LANG, 'signing.back') }).click();
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.summary.title') })).toBeVisible();

  // «Open application» — выдвижная панель с датами, лимитом и документами (Кирилл 2026-11-11).
  await page.getByRole('button', { name: tr(LANG, 'application.summary.open') }).click();
  const panel = page.getByRole('dialog', { name: tr(LANG, 'application.details.title') });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(tr(LANG, 'application.summary.limit'), { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('client_offer_pending: текущий шаг шкалы — «Решение», подписей и кнопки подписания нет (D-083)', async ({ page }) => {
  await openApplication(page, 'client_offer_pending');
  // Шкала: на компьютере — вертикальная с подписями, на телефоне — степ-бар (подпись у сегмента — для скринридера).
  const current = page.getByRole('list', { name: tr(LANG, 'timeline.title') }).locator('li[aria-current="step"]').filter({ visible: true });
  await expect(current).toHaveCount(1);
  await expect(current).toContainText(tr(LANG, 'timeline.client.decision'));
  await expect(signCta(page)).toHaveCount(0);
  await expect(steps(page)).toHaveCount(0);
});

test('client_offer_pending: экран подписания до согласования условий ведёт на «Заявку» (SC-06 A6)', async ({ page }) => {
  await asPersona(page, 'client_offer_pending', LANG, '/c/documents/sign');
  await expect(page).toHaveURL(/\/c\/documents(\?.*)?$/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'documents.title') })).toBeVisible();
});

test('client_signing_partial: «1 из 2», SPA готов, вексель ждёт Nafith', async ({ page }) => {
  await openApplication(page, 'client_signing_partial');
  await expect(page.getByText(tr(LANG, 'signing.progress', { done: '1', total: '2' }))).toBeVisible();
  await signCta(page).click();
  await expect(step(page, 'spa')).toContainText(tr(LANG, 'checklist.status.done'));
  await expect(step(page, 'spa').getByRole('link', { name: tr(LANG, 'signing.spa.send') })).toHaveCount(0);
  await expect(step(page, 'pn_nafith')).toContainText(tr(LANG, 'signing.pn.body'));
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
