// Сценарии v1 (мастер-промпт 6d п.2): вход, персоны, роли dual, поставщик, неизвестный номер, истечение сессии.
// @smoke — входят в test:e2e:smoke (android-chrome, в verify).
import { asPersona, enterCode, expect, openAccountMenu, signIn, test, tr } from './fixtures';

const timeline = (lang: 'ar' | 'en') => ({ name: tr(lang, 'timeline.title') });

test('@smoke client_new → вход (0000) → /c/home со шкалой на шаге 1', async ({ page }) => {
  await signIn(page, 'ar', '500000001');
  await expect(page).toHaveURL(/\/c\/home$/);
  const current = page.getByRole('list', timeline('ar')).locator('li[aria-current="step"]');
  await expect(current).toHaveCount(1);
  await expect(current).toContainText(tr('ar', 'timeline.client.documents'));
  await expect(page.getByText(tr('ar', 'next_step.upload_documents', { count: 7 }))).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

const personas = [
  { id: 'client_submitted', step: 'timeline.client.review', text: () => tr('en', 'next_step.under_review_eta', { count: 24, hours: 24 }) },
  { id: 'client_approved_unsigned', step: 'timeline.client.signing', text: () => tr('en', 'next_step.sign_documents') },
] as const;

for (const p of personas) {
  test(`@smoke ?persona=${p.id} меняет шкалу и карточку`, async ({ page }) => {
    await asPersona(page, p.id);
    await expect(page).toHaveURL(/\/c\/home/);
    await expect(page.getByRole('list', timeline('en')).locator('li[aria-current="step"]')).toContainText(tr('en', p.step));
    await expect(page.getByText(p.text())).toBeVisible();
  });
}

test('@smoke ?persona=client_closed_rejected — нейтральная карточка вместо шкалы', async ({ page }) => {
  await asPersona(page, 'client_closed_rejected');
  await expect(page.getByText(tr('en', 'closed.title'))).toBeVisible();
  await expect(page.getByRole('list', timeline('en'))).toHaveCount(0);
});

test('@smoke dual_active → /c/home → переключатель → /s/home без потери языка и темы', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await asPersona(page, 'dual_active', 'en');
  await expect(page).toHaveURL(/\/c\/home/);
  // Переключение ролей — в меню аккаунта внизу сайдбара; подсказка dual показывается один раз — закрываем.
  await openAccountMenu(page, 'en', { dismissHint: true });
  await page.getByRole('menuitemradio', { name: tr('en', 'role.supplier') }).click();
  await expect(page).toHaveURL(/\/s\/home/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page).toHaveURL(/\/s\/home/);
});

test('?persona= через дефис (меню просмотрщика Proto) открывает ту же персону', async ({ page }) => {
  await asPersona(page, 'client-submitted');
  await expect(page).toHaveURL(/\/c\/home/);
  await expect(page.getByRole('list', timeline('en')).locator('li[aria-current="step"]')).toContainText(tr('en', 'timeline.client.review'));
});

test('@smoke supplier_active → /s/home', async ({ page }) => {
  await asPersona(page, 'supplier_active');
  await expect(page).toHaveURL(/\/s\/home/);
  // Название поставщика — в заголовке меню аккаунта (сайдбар, решение Кирилла 2026-11-06).
  await openAccountMenu(page, 'en');
  await expect(page.getByRole('menu').getByText('Bayt Al Khayr Wholesale')).toBeVisible();
});

test('@smoke unknown_phone → /not-found без сессии', async ({ page }) => {
  await signIn(page, 'en', '500000014');
  await expect(page).toHaveURL(/\/not-found$/);
  await expect(page.getByRole('heading', { name: tr('en', 'auth.not_found.title') })).toBeVisible();
  await page.goto('/c/home');
  await expect(page).toHaveURL(/\/login/);
});

test('@smoke expireSession() → /session-expired → вход → возврат на /c/home', async ({ page }) => {
  await asPersona(page, 'client_active');
  await expect(page).toHaveURL(/\/c\/home/);
  await page.getByRole('button', { name: tr('en', 'demo.open') }).click();
  await page.getByRole('button', { name: 'expireSession' }).click();
  await expect(page).toHaveURL(/\/session-expired$/);
  // Шторка демо-панели живёт в корне и переживает переход — закрываем и ждём, пока она исчезнет.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
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

test('@smoke client_active: шкала сразу на «Лимит активен», без промежуточного «Подписания»', async ({ page }) => {
  await asPersona(page, 'client_active');
  const list = page.getByRole('list', timeline('en'));
  await list.waitFor();
  // Первое же появление шкалы — уже с данными лимита (мок отвечает с задержкой 300–800 мс).
  const first = await list.locator('li[aria-current="step"]').textContent();
  expect(first).toContain(tr('en', 'timeline.client.limit_active'));
});
