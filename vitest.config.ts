import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

// Unit-тесты (Node). Проект историй Storybook добавляется в блоке 4a.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    environment: 'node',
  },
});
