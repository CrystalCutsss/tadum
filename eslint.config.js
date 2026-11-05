// Конфигурация ESLint (flat). Границы слоёв FSD-lite описаны в docs/architecture/layers.md.
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Слои сверху вниз: импорт разрешён только в нижележащие слои (app → pages → widgets → features → entities → shared).
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const below = (layer) => LAYERS.slice(LAYERS.indexOf(layer) + 1);
// Какие файлы элемента видны снаружи (публичный API).
const ENTRY = {
  widgets: 'index.ts',
  features: 'index.ts',
  entities: 'index.ts',
  shared: '{index.ts,utils.ts}',
};
const target = (type) => ({ element: { type, ...(ENTRY[type] ? { fileInternalPath: ENTRY[type] } : {}) } });

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'storybook-static',
      'coverage',
      'node_modules',
      'src/app/routeTree.gen.ts',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  reactHooks.configs.flat.recommended,

  // --- Границы слоёв и публичный API срезов ---
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages' },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['segment'] },
        { type: 'styles', pattern: 'src/styles' },
      ],
    },
    rules: {
      // Импорты внутри одного элемента (среза, сегмента shared, слоя app/pages) плагин не проверяет.
      // Снаружи в срез — только через его index.ts; в shared — index.ts и utils.ts (так импортирует shadcn CLI).
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Запрещённый импорт {{ from.element.types.[0] }} → {{ to.element.types.[0] }}. Порядок слоёв: app → pages → widgets → features → entities → shared; в срез — только через его index.ts; shared/ui не импортирует shared/analytics.',
          policies: [
            ...LAYERS.map((layer) => ({
              from: { element: { type: layer } },
              allow: { to: below(layer).map(target).concat(target('styles')) },
            })),
            // Сегменты shared импортируют друг друга; shared/ui не вызывает аналитику (track — из features/widgets).
            {
              from: { element: { type: 'shared', captured: { segment: '!ui' } } },
              allow: { to: target('shared') },
            },
            {
              from: { element: { type: 'shared', captured: { segment: 'ui' } } },
              allow: { to: { element: { ...target('shared').element, captured: { segment: '!analytics' } } } },
            },
          ],
        },
      ],
    },
  },

  // --- Хранилище и время: только через shared/lib ---
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/lib/storage.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Хранилище — только через @/shared/lib (storage.ts, D-072).' },
        { name: 'sessionStorage', message: 'Хранилище — только через @/shared/lib (storage.ts, D-072).' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: 'Хранилище — только через @/shared/lib (storage.ts).' },
        { object: 'window', property: 'sessionStorage', message: 'Хранилище — только через @/shared/lib (storage.ts).' },
        { object: 'globalThis', property: 'localStorage', message: 'Хранилище — только через @/shared/lib (storage.ts).' },
        { object: 'globalThis', property: 'sessionStorage', message: 'Хранилище — только через @/shared/lib (storage.ts).' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/lib/clock.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'Время — только через @/shared/lib (clock.ts).' },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Время — только через @/shared/lib (clock.ts).',
        },
      ],
    },
  },

  // --- odoo_stage не доходит до виджетов и страниц (01-roles.md §6) ---
  {
    files: ['src/widgets/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'Время — только через @/shared/lib (clock.ts).' },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Время — только через @/shared/lib (clock.ts).',
        },
        {
          selector: "Identifier[name='odoo_stage'], Literal[value='odoo_stage']",
          message: 'odoo_stage не используется в widgets/ и pages/ — только клиентский статус (01-roles.md §6).',
        },
      ],
    },
  },
);
