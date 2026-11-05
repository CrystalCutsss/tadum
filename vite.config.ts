import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Базовый путь: '/' в dev-сервере и проде, '/p/tadum/vN/' на витрине Proto.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    plugins: [
      // Опции маршрутизатора — в tsr.config.json (их же читает `tsr generate` в typecheck).
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        base,
        scope: base,
        // На витрине манифест лежит за парольным шлюзом Proto: без cookie вернётся HTML шлюза.
        useCredentials: true,
        includeAssets: ['icons/icon.svg'],
        manifest: {
          name: 'Tadum',
          short_name: 'Tadum',
          lang: 'ar',
          dir: 'rtl',
          display: 'standalone',
          start_url: base,
          scope: base,
          // Плейсхолдер; цвета темы приходят с токенами в блоке 4a.
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
        },
      }),
    ],
  };
});
