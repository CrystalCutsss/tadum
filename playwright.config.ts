// Playwright (мастер-промпт 6d): три проекта; desktop-safari и desktop-edge — в CI по расписанию (7a).
// Время фиксировано (page.clock в фикстуре), анимации выключены (prefers-reduced-motion: reduce).
// Тесты ходят в собранное приложение (vite preview) — то же, что уйдёт на витрину.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  ...(CI ? { workers: 2 } : {}),
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-safari', use: { ...devices['iPhone 14'] } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // По расписанию в CI (7a): нужны браузеры, которых нет в облачной сессии.
    ...(process.env.PW_SCHEDULED
      ? [
          { name: 'desktop-safari', use: { ...devices['Desktop Safari'] } },
          { name: 'desktop-edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
