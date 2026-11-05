// Скриншоты (D-074): 360/768/1280 × ar/en × light/dark — артефакты (tests/screenshots/, в .gitignore), не эталоны.
// Визуальная регрессия toHaveScreenshot — только с эталонами из docker-образа Playwright (не здесь).
import { test } from './fixtures';
import { SCREENS } from './screens';

const VIEWPORTS = [
  { name: '360', width: 360, height: 780 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

test.describe('@screenshot', () => {
  test.skip(({ isMobile, browserName }) => isMobile || browserName !== 'chromium', 'скриншоты снимает один проект (desktop-chrome); размеры задаются явно');
  for (const screen of SCREENS) {
    for (const lang of ['ar', 'en'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        test(`${screen.id} · ${lang} · ${theme}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: theme });
          for (const vp of VIEWPORTS) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await screen.open(page, lang);
            await page.screenshot({ path: `tests/screenshots/${screen.id}/${vp.name}-${lang}-${theme}.png`, fullPage: true });
          }
        });
      }
    }
  }
});
