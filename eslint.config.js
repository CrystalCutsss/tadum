// Конфигурация ESLint (flat). Границы слоёв FSD-lite описаны в docs/architecture/layers.md.
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import i18next from 'eslint-plugin-i18next';
import reactHooks from 'eslint-plugin-react-hooks';
import rtlFriendly from 'eslint-plugin-rtl-friendly';
import storybook from 'eslint-plugin-storybook';
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
// Наборы запретов no-restricted-syntax.
const DATE = [
  { selector: "NewExpression[callee.name='Date']", message: 'Время — только через @/shared/lib (clock.ts).' },
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'Время — только через @/shared/lib (clock.ts).' },
];
const INTL = [
  { selector: "Identifier[name='Intl']", message: 'Форматирование — только через @/shared/i18n (format.ts, D-071).' },
  { selector: "CallExpression[callee.property.name=/^toLocale/]", message: 'Форматирование — только через @/shared/i18n (format.ts, D-071).' },
];
// Сырые значения в классах и style (01-nfr-locale-brand.md §3.3): hex, rgb()/hsl()/oklch(), px, мс,
// произвольные значения Tailwind [..]. Значения — только из токенов (tokens.css).
const RAW_CLASS = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(|\d+px\b|\d+ms\b|\[/;
const RAW_STYLE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(|\d+(?:px|ms)\b/;
const RAW = [
  {
    selector: `JSXAttribute[name.name='className'] Literal[value=${RAW_CLASS}]`,
    message: 'Сырое значение в className: только токены (классы Tailwind на токенах), без hex/px/мс и [..].',
  },
  {
    selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${RAW_CLASS}]`,
    message: 'Сырое значение в className: только токены (классы Tailwind на токенах), без hex/px/мс и [..].',
  },
  {
    selector: `JSXAttribute[name.name='style'] Property > Literal[value=${RAW_STYLE}]`,
    message: 'Сырое значение в style: цвета, px и мс — только через токены (var(--…)).',
  },
  {
    selector: "JSXAttribute[name.name='style'] Property > Literal[value>0]",
    message: 'Число в style трактуется как px: используйте токены (var(--…)).',
  },
];
// Компоненты shadcn, которые записал CLI по пресету: их классы — часть пресета, запрет сырых значений к ним не применяется.
const SHADCN_GENERATED = [
  'accordion', 'alert', 'badge', 'button', 'card', 'dialog', 'dropdown-menu', 'input', 'input-otp', 'popover',
  'progress', 'separator', 'sheet', 'skeleton', 'sonner', 'table', 'tabs', 'toggle', 'toggle-group', 'tooltip',
].map((name) => `src/shared/ui/${name}.tsx`);

// Аналитика: имя события — только литерал из EventName (04-metrics-and-events.md §4).
const TRACK = [
  {
    selector: "CallExpression[callee.name='track'][arguments.0.type!='Literal']",
    message: 'track(): имя события — строковый литерал из словаря (04-metrics-and-events.md §3).',
  },
];

const ODOO = [
  { selector: "Identifier[name='odoo_stage'], Literal[value='odoo_stage']", message: 'odoo_stage не используется в widgets/ и pages/ — только клиентский статус (01-roles.md §6).' },
];

const target = (type) => ({ element: { type, ...(ENTRY[type] ? { fileInternalPath: ENTRY[type] } : {}) } });

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'storybook-static',
      '!.storybook',
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
    files: ['*.config.{js,ts}', 'eslint.config.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    // CommonJS-конфиги инструментов (size-limit, lighthouse) — require() здесь штатный.
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  reactHooks.configs.flat.recommended,
  ...storybook.configs['flat/recommended'],

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
  // no-restricted-syntax: правило одно, поэтому наборы селекторов собираются по группам файлов
  // (в flat config последний подходящий блок перекрывает предыдущие).
  { files: ['src/**/*.{ts,tsx}'], rules: { 'no-restricted-syntax': ['error', ...DATE, ...INTL, ...RAW, ...TRACK] } },
  { files: SHADCN_GENERATED, rules: { 'no-restricted-syntax': ['error', ...DATE, ...INTL, ...TRACK] } },
  { files: ['src/shared/i18n/**/*.{ts,tsx}'], rules: { 'no-restricted-syntax': ['error', ...DATE, ...RAW, ...TRACK] } },
  { files: ['src/shared/lib/clock.ts'], rules: { 'no-restricted-syntax': ['error', ...INTL, ...TRACK] } },
  // odoo_stage не доходит до виджетов и страниц (01-roles.md §6).
  {
    files: ['src/widgets/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...DATE, ...INTL, ...ODOO, ...RAW, ...TRACK] },
  },
  // Тесты могут создавать даты напрямую.
  { files: ['src/**/*.test.{ts,tsx}'], rules: { 'no-restricted-syntax': ['error', ...INTL, ...TRACK] } },

  // --- Тексты и направление (01-nfr-locale-brand.md §1.2, §1.4) ---
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.test.tsx', 'src/**/*.stories.tsx'],
    plugins: { i18next },
    rules: {
      // Ни одной пользовательской строки в JSX: тексты, aria-label, title, placeholder — только ключи i18n.
      'i18next/no-literal-string': ['error', { mode: 'jsx-only', 'jsx-attributes': { include: ['^(aria-label|aria-description|title|placeholder|alt|label)$'] } }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'rtl-friendly': rtlFriendly },
    rules: {
      // Только логические классы: ms-/me-/ps-/pe-/start-/end-/text-start…; физические ml-/mr-/left-/text-left… запрещены.
      'rtl-friendly/no-physical-properties': 'error',
    },
  },
  // Фикстуры персон — рукописные; faker допустим только в scripts/gen-fixtures.ts (D-073).
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@faker-js/*'], message: 'faker — только в scripts/gen-fixtures.ts (D-073).' }] }],
    },
  },
);
