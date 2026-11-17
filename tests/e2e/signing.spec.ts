// Этапы «Решение», «Подписание», «Лимит одобрен» (A-063, D-083): кнопка подписания в карточке лимита, экран подписания
// из двух шагов (SPA и вексель), демо-подтверждения шагов, подробности заявки в панели, отменённый лимит, папка.
import type { Page } from '@playwright/test';

import { asPersona, expect, test, tr, type Lang } from './fixtures';

const LANG: Lang = 'en';
type ItemKey = 'spa' | 'pn_nafith';

/** Открыть «Заявку» персоны и дождаться данных (заголовок экрана и без скелетонов). */
async function openApplication(page: Page, persona: string, lang: Lang = LANG) {
  await asPersona(page, persona, lang, '/c/documents');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
}

const steps = (page: Page, lang: Lang = LANG) => page.getByRole('list', { name: tr(lang, 'signing.title') });
const step = (page: Page, key: ItemKey, lang: Lang = LANG) =>
  steps(page, lang).getByRole('listitem').filter({ hasText: tr(lang, `checklist.${key}`) });
const signCta = (page: Page, lang: Lang = LANG) => page.getByRole('link', { name: tr(lang, 'signing.cta') });

test('@smoke client_approved_unsigned: «Sign documents» → экран подписания → «Send signed copy» → договор подтверждён → «Open Nafith» → вексель ждёт', async ({ page, context }) => {
  // WhatsApp открывается в новой вкладке — наружу не ходим.
  await context.route('https://wa.me/**', (route) => route.abort());
  await openApplication(page, 'client_approved_unsigned');
  // Блока шагов на «Заявке» нет (D-083) — только кнопка в карточке лимита.
  await expect(steps(page)).toHaveCount(0);
  await signCta(page).click();
  await expect(page).toHaveURL(/\/c\/documents\/sign$/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'signing.title') })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: tr(LANG, 'nav.breadcrumb') });
  await expect(crumbs.getByRole('link', { name: tr(LANG, 'nav.application'), exact: true })).toBeVisible();
  await expect(step(page, 'spa').getByRole('link', { name: tr(LANG, 'signing.spa.download') })).toHaveAttribute('href', /demo\/spa\.pdf$/);

  // «Send signed copy» → WhatsApp в новой вкладке; шаг SPA — «ждём подтверждения».
  const [wa] = await Promise.all([context.waitForEvent('page'), step(page, 'spa').getByRole('link', { name: tr(LANG, 'signing.spa.send') }).click()]);
  await wa.close();
  await expect(step(page, 'spa')).toContainText(tr(LANG, 'checklist.status.in_progress'));
  // Демо витрины (A-066): «команда» подтверждает договор; вексель сам не подтверждается (Кирилл 2026-11-15).
  await expect(step(page, 'spa')).toContainText(tr(LANG, 'checklist.status.done'), { timeout: 10_000 });
  await context.route('https://www.nafith.sa/**', (route) => route.abort());
  const [nafith] = await Promise.all([context.waitForEvent('page'), step(page, 'pn_nafith').getByRole('link', { name: tr(LANG, 'signing.pn.open') }).click()]);
  await nafith.close();
  await expect(step(page, 'pn_nafith')).toContainText(tr(LANG, 'checklist.status.in_progress'));
});

test('client_active: «Open application» — выдвижная панель с датами, лимитом и документами', async ({ page }) => {
  await openApplication(page, 'client_active');
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

test('client_signing_partial: SPA готов, вексель ждёт Nafith', async ({ page }) => {
  await openApplication(page, 'client_signing_partial');
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

test('«Решение» и «Подписание»: папки документов нет, карточка лимита «одобренный, ещё не активен» (D-084)', async ({ page }) => {
  for (const persona of ['client_offer_pending', 'client_approved_unsigned'] as const) {
    await openApplication(page, persona);
    await expect(page.getByRole('heading', { name: tr(LANG, 'application.limit_label_approved') })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(tr(LANG, 'application.folder.title')) })).toHaveCount(0);
  }
  await expect(page.getByText(tr(LANG, 'application.signing.info'))).toBeVisible();
});
