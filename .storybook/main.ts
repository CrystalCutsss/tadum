import type { StorybookConfig } from '@storybook/react-vite';

// Storybook 10 на Vite. Истории — рядом с компонентами (*.stories.tsx).
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // PWA-плагин из vite.config.ts в Storybook не нужен: service worker мешал бы превью.
  viteFinal: (cfg) => ({
    ...cfg,
    plugins: (cfg.plugins ?? []).flat().filter((p) => !(p && typeof p === 'object' && 'name' in p && String(p.name).startsWith('vite-plugin-pwa'))),
  }),
};

export default config;
