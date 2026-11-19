// Этапы «Решение», «Подписание», «Лимит одобрен» (A-063, D-083): кнопка подписания в карточке лимита, экран подписания
// из двух документов (SPA в Sadq и вексель в Nafith, D-085), подробности заявки в панели, отменённый лимит, папка.
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

test('@smoke client_approved_unsigned: «Sign documents» → экран подписания → оба документа ждут подписи по SMS, без кнопок и автоперехода', async ({ page }) => {
  await openApplication(page, 'client_approved_unsigned');
  // Блока шагов на «Заявке» нет (D-083) — только кнопка в карточке лимита.
  await expect(steps(page)).toHaveCount(0);
  await signCta(page).click();
  await expect(page).toHaveURL(/\/c\/documents\/sign$/);
  await expect(page.getByRole('heading', { level: 1, name: tr(LANG, 'signing.title') })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: tr(LANG, 'nav.breadcrumb') });
  await expect(crumbs.getByRole('link', { name: tr(LANG, 'nav.application'), exact: true })).toBeVisible();
  await expect(page.getByText(tr(LANG, 'signing.subtitle'), { exact: true })).toBeVisible();

  // До подписи у обоих документов серый бейдж и инструкция про SMS, кнопок нет (Кирилл 2026-11-18, 2026-11-19).
  for (const [key, doc] of [
    ['spa', 'spa'],
    ['pn_nafith', 'pn'],
  ] as const) {
    await expect(step(page, key)).toContainText(tr(LANG, 'signing.status_required'));
    await expect(step(page, key)).toContainText(tr(LANG, `signing.${doc}.step_sms`));
    await expect(step(page, key).getByRole('link')).toHaveCount(0);
  }
  // Автоперехода нет: документы так и ждут подписи.
  await page.waitForTimeout(1_000);
  await expect(step(page, 'spa')).toContainText(tr(LANG, 'signing.status_required'));
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

test('client_signing_partial: договор подписан, вексель ждёт подписи', async ({ page }) => {
  await openApplication(page, 'client_signing_partial');
  await signCta(page).click();
  await expect(step(page, 'spa')).toContainText(tr(LANG, 'signing.status_signed'));
  await expect(step(page, 'spa').getByRole('link', { name: tr(LANG, 'signing.download') })).toBeVisible();
  await expect(page.getByText(tr(LANG, 'signing.subtitle_signed'))).toBeVisible();
  await expect(step(page, 'pn_nafith')).toContainText(tr(LANG, 'signing.status_required'));
  await expect(step(page, 'pn_nafith')).toContainText(tr(LANG, 'signing.pn.body'));
});

test('client_limit_cancelled: «Contact us» ведёт в WhatsApp, последний шаг шкалы — «Limit not active» (Кирилл 2026-11-19)', async ({ page }) => {
  await openApplication(page, 'client_limit_cancelled');
  await expect(page.getByRole('heading', { name: tr(LANG, 'application.cancelled.title') })).toBeVisible();
  await expect(page.getByRole('link', { name: tr(LANG, 'application.cancelled.contact') })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  const current = page.getByRole('list', { name: tr(LANG, 'timeline.title') }).locator('li[aria-current="step"]').filter({ visible: true });
  await expect(current).toHaveCount(1);
  await expect(current).toContainText(tr(LANG, 'timeline.client.limit_inactive'));
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
