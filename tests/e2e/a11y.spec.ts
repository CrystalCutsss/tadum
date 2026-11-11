// axe на каждом экране v1 в AR и EN, light и dark (мастер-промпт 6d п.3; WCAG 2.2 AA).
import { expect, expectNoA11yViolations, setColorTheme, test } from './fixtures';
import { SCREENS } from './screens';

for (const screen of SCREENS) {
  for (const lang of ['ar', 'en'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`axe: ${screen.id} · ${lang} · ${theme}`, async ({ page }) => {
        await setColorTheme(page, theme);
        await screen.open(page, lang);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/);
        // Подсказка dual (Popover) — часть экрана при первом входе; проверяется вместе с ним.
        await expectNoA11yViolations(page);
      });
    }
  }
}
