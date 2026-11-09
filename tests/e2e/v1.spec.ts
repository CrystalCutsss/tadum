// Сценарии v1 (мастер-промпт 6d п.2): вход, персоны, роли dual, поставщик, неизвестный номер, истечение сессии.
// @smoke — входят в test:e2e:smoke (android-chrome, в verify).
import type { Page } from '@playwright/test';

import { asPersona, enterCode, expect, openAccountMenu, openSidebar, signIn, test, tr } from './fixtures';

// /c/home до проработки разделов показывает заглушку (Кирилл 2026-11-06, A-055): персона проверяется по названию
// компании в аккаунте сайдбара, шкала и «следующий шаг» — в историях ClientHome и unit-тестах.
const stub = (lang: 'ar' | 'en') => ({ name: tr(lang, 'stub.coming_soon.title') });
const account = (page: Page, lang: 'ar' | 'en') => page.getByRole('button', { name: new RegExp(tr(lang, 'nav.account')) });

test('@smoke client_new → вход (0000) → /c/home: заглушка и компания в аккаунте', async ({ page }) => {
  await signIn(page, 'ar', '500000001');
  await expect(page).toHaveURL(/\/c\/home$/);
  await expect(page.getByRole('heading', stub('ar'))).toBeVisible();
  await openSidebar(page, 'ar');
  await expect(account(page, 'ar')).toContainText('رمال الشرق للتجارة');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

const personas = [
  { id: 'client_submitted', company: 'Danah Medical Supplies' },
  { id: 'client_approved_unsigned', company: 'Barq Logistics' },
  { id: 'client_closed_rejected', company: 'Wadi Hanifa Contracting' },
] as const;

for (const p of personas) {
  test(`@smoke ?persona=${p.id} открывает кабинет этой компании`, async ({ page }) => {
    await asPersona(page, p.id);
    await expect(page).toHaveURL(/\/c\/home/);
    await expect(page.getByRole('heading', stub('en'))).toBeVisible();
    await openSidebar(page, 'en');
    await expect(account(page, 'en')).toContainText(p.company);
  });
}

test('@smoke dual_active → /c/home → переключатель → /s/home без потери языка и темы', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await asPersona(page, 'dual_active', 'en');
  await expect(page).toHaveURL(/\/c\/home/);
  // Переключение ролей — в меню аккаунта внизу сайдбара; подсказка dual показывается один раз — закрываем.
  await openAccountMenu(page, 'en', { dismissHint: true });
  await page.getByRole('menuitemradio', { name: tr('en', 'role.supplier') }).click();
  await expect(page).toHaveURL(/\/s\/home/);
  // Регрессия: после смены роли аккаунт не показывает номер, пока грузится название (название второй роли уже загружено).
  const acc = account(page, 'en');
  if (await acc.isVisible()) expect(await acc.textContent()).not.toContain('+966');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page).toHaveURL(/\/s\/home/);
});

test('?persona= через дефис (меню просмотрщика Proto) открывает ту же персону', async ({ page }) => {
  await asPersona(page, 'client-submitted');
  await expect(page).toHaveURL(/\/c\/home/);
  await openSidebar(page, 'en');
  await expect(account(page, 'en')).toContainText('Danah Medical Supplies');
});

test('@smoke supplier_active → /s/home', async ({ page }) => {
  await asPersona(page, 'supplier_active');
  await expect(page).toHaveURL(/\/s\/home/);
  // Название поставщика — в аккаунте внизу сайдбара (решение Кирилла 2026-11-06).
  await openSidebar(page, 'en');
  await expect(account(page, 'en')).toContainText('Bayt Al Khayr Wholesale');
});

test('@smoke unknown_phone → /not-found без сессии', async ({ page }) => {
  await signIn(page, 'en', '500000014');
  await expect(page).toHaveURL(/\/not-found$/);
  await expect(page.getByRole('heading', { name: tr('en', 'auth.not_found.title') })).toBeVisible();
  await page.goto('/c/home');
  await expect(page).toHaveURL(/\/login/);
});

test('@smoke истёкшая сессия → /session-expired → вход → возврат на /c/home', async ({ page }) => {
  await asPersona(page, 'client_active');
  await expect(page).toHaveURL(/\/c\/home/);
  // Демо-панели нет (Кирилл 2026-11-06): истекаем сессию прямо в состоянии мока и перезагружаем страницу.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.endsWith(':mock:active'));
    if (!key) throw new Error('no mock state');
    const state = JSON.parse(localStorage.getItem(key)!) as { session: { expired: boolean } };
    state.session.expired = true;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/session-expired$/);
  await page.getByRole('link', { name: tr('en', 'auth.expired.login') }).click();
  await expect(page).toHaveURL(/\/login$/);
  // returnTo хранится в sessionStorage (SC-01 §7) — после входа открывается исходный маршрут.
  await page.getByRole('main').getByRole('textbox').fill('500000007');
  await page.getByRole('button', { name: tr('en', 'auth.phone.submit') }).click();
  await enterCode(page, 'en');
  await expect(page).toHaveURL(/\/c\/home$/);
});

test('A14: диплинк /c/documents?lang=en без сессии → /login → после входа /c/documents', async ({ page }) => {
  await page.goto('/c/documents?lang=en');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('main').getByRole('textbox').fill('500000001');
  await page.getByRole('button', { name: tr('en', 'auth.phone.submit') }).click();
  await enterCode(page, 'en');
  await expect(page).toHaveURL(/\/c\/documents$/);
});

test('SC-10: выход и «Назад» не показывают данные', async ({ page }) => {
  await asPersona(page, 'client_active', 'en');
  await expect(page).toHaveURL(/\/c\/home/);
  await openAccountMenu(page, 'en');
  await page.getByRole('menuitem', { name: tr('en', 'nav.settings') }).click();
  await expect(page).toHaveURL(/\/c\/help/);
  await page.getByRole('main').getByRole('button', { name: tr('en', 'help.logout') }).click();
  await page.getByRole('dialog').getByRole('button', { name: tr('en', 'help.logout') }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
});

test('@smoke client_active: компания в аккаунте, без dual — без переключателя ролей', async ({ page }) => {
  await asPersona(page, 'client_active');
  await openAccountMenu(page, 'en');
  await expect(account(page, 'en')).toContainText('Ufuq Office Furniture');
  await expect(page.getByRole('menuitemradio')).toHaveCount(0);
});
