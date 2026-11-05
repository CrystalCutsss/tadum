import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

// Два проекта: unit (Node) и storybook (истории как тесты в Chromium через Playwright).
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
          environment: 'node',
        },
      },
      {
        resolve: { alias },
        // Tailwind обязателен: без него стили историй (шрифты, rtl:-варианты) не собираются.
        plugins: [tailwindcss(), storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)) })],
        // Заранее оптимизированные зависимости: иначе Vite перезагружает страницу посреди прогона историй.
        optimizeDeps: {
          include: [
            'react',
            'react/jsx-dev-runtime',
            'react-dom/client',
            'radix-ui',
            '@remixicon/react',
            'react-i18next',
            'i18next',
            'cn',
            'sonner',
            'class-variance-authority',
            'input-otp',
            'storybook/test',
          ],
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
