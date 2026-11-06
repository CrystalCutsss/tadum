// Общие фикстуры e2e: фиксированное время (D-073), тексты из словарей, вход, axe.
import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

import ar from '../../src/shared/i18n/locales/ar.json' with { type: 'json' };
import en from '../../src/shared/i18n/locales/en.json' with { type: 'json' };

/** 2026-11-04 09:00 Asia/Riyadh — то же время, что в unit-тестах. */
export const TEST_NOW = '2026-11-04T09:00:00+03:00';

export type Lang = 'ar' | 'en';
const DICT = { ar, en } as const;

/** Текст ключа i18n (плейсхолдеры `{name}` подставляются из values; формы множественного числа — по count). */
export function tr(lang: Lang, key: string, values: Record<string, string | number> = {}): string {
  const lookup = (k: string): unknown => k.split('.').reduce<unknown>((o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined), DICT[lang]);
  let raw = lookup(key);
  if (typeof raw !== 'string' && typeof values.count === 'number') {
    const form = new Intl.PluralRules(lang).select(values.count);
    raw = lookup(`${key}_${form}`) ?? lookup(`${key}_other`);
  }
  if (typeof raw !== 'string') throw new Error(`нет ключа ${key} (${lang})`);
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

export const test = base.extend<{ fixedClock: void }>({
  fixedClock: [
    async ({ page }, use) => {
      await page.clock.install({ time: TEST_NOW });
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/** Вход по номеру персоны: +966 50 000 0XXX, код мока 0000 (5b). */
export async function signIn(page: Page, lang: Lang, nationalDigits: string) {
  await page.goto(`/login?lang=${lang}`);
  await page.getByRole('main').getByRole('textbox').fill(nationalDigits);
  await page.getByRole('button', { name: tr(lang, 'auth.phone.submit') }).click();
  await expect(page).toHaveURL(/\/login\/code$/);
  await enterCode(page, lang);
}

/** Ввести код мока. Экран кода — ленивый чанк: адрес меняется раньше, чем он отрисован, поэтому ждём заголовок. */
export async function enterCode(page: Page, lang: Lang) {
  await page.getByRole('heading', { name: tr(lang, 'auth.otp.title') }).waitFor();
  await page.getByRole('main').getByRole('textbox').fill('0000');
}

/** Открыть приложение под персоной (?persona=, демо-режим). */
export async function asPersona(page: Page, persona: string, lang: Lang = 'en', path = '/') {
  await page.goto(`${path}?persona=${persona}&lang=${lang}`);
}

/** Сайдбар: на телефоне — шторка по кнопке в шапке, на десктопе виден сразу (решение Кирилла 2026-11-06). */
export async function openSidebar(page: Page, lang: Lang) {
  const account = page.getByRole('button', { name: new RegExp(tr(lang, 'nav.account')) });
  // Телефон — по ширине окна (брейкпоинт useIsMobile — 768 px), а не по видимости аккаунта: пока данные грузятся,
  // аккаунта ещё нет и на десктопе, а нажатие кнопки там свернуло бы сайдбар.
  const mobile = (page.viewportSize()?.width ?? 0) < 768;
  if (mobile && !(await account.isVisible())) await page.getByRole('button', { name: tr(lang, 'nav.toggle_sidebar') }).click();
  await account.waitFor();
}

/**
 * Открыть меню аккаунта. dismissHint: закрыть подсказку dual, если она есть. Подсказка показывается один раз за всё
 * время, поэтому при повторном открытии экрана в той же вкладке (скриншоты: три ширины подряд) её уже нет.
 */
export async function openAccountMenu(page: Page, lang: Lang, { dismissHint = false } = {}) {
  await openSidebar(page, lang);
  if (dismissHint) {
    const hint = page.getByRole('button', { name: tr(lang, 'role.hint_dismiss') });
    // Подсказка появляется вместе с данными сессии — даём ей короткое время, отсутствие не ошибка.
    if (await hint.waitFor({ timeout: 2_000 }).then(() => true, () => false)) await hint.click();
  }
  await page.getByRole('button', { name: new RegExp(tr(lang, 'nav.account')) }).click();
  await page.getByRole('menu').waitFor();
}

/** axe без нарушений; правила WCAG 2.2 AA (01-nfr-locale-brand.md). */
export async function expectNoA11yViolations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}
