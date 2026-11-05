import { defineConfig } from 'i18next-cli';

// Извлечение ключей из кода (i18next-cli заменил устаревший i18next-parser).
// `pnpm lint:i18n` запускает `extract --ci --dry-run`: падает, если код использует ключ, которого нет в ar.json/en.json.
// Неиспользуемые ключи не удаляются: тексты пишутся по сценариям раньше экранов.
export default defineConfig({
  locales: ['ar', 'en'],
  extract: {
    input: ['src/**/*.{ts,tsx}'],
    ignore: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.tsx', 'src/app/routeTree.gen.ts'],
    output: 'src/shared/i18n/locales/{{language}}.json',
    defaultNS: false,
    keySeparator: '.',
    nsSeparator: false,
    pluralSeparator: '_',
    primaryLanguage: 'ar',
    secondaryLanguages: ['en'],
    removeUnusedKeys: false,
    sort: true,
    indentation: 2,
    interpolationPrefix: '{',
    interpolationSuffix: '}',
    defaultValue: '',
  },
});
