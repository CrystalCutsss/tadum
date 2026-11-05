// knip (блок 7a, мастер-промпт 7a п.5): неиспользуемые файлы, зависимости и экспорты.
// Исключения — только то, что нужно v1 или инструментам, каждое с причиной.
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/pages/**/*.tsx',
    'scripts/*.mjs',
    'tests/e2e/**/*.ts',
    '.storybook/*.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.stories.tsx',
    // Публичный API среза (FSD, docs/architecture/layers.md): index.ts — контракт среза для следующих версий;
    // модели 5a (права ролей, шкала поставщика, оферта) описаны продуктовыми документами и покрыты тестами.
    'src/{entities,features,widgets}/*/index.ts',
    'src/shared/*/index.ts',
    // Срезы без потребителя в v1 (оферта — v4, приглашённые клиенты — v3): типы из 5a, на них опираются порты.
    'src/entities/{offer,referred-client}/index.ts',
    // shadcn CLI ищет cn() здесь (components.json → aliases.utils).
    'src/shared/lib/utils.ts',
  ],
  project: ['src/**/*.{ts,tsx,css,mdx}', 'scripts/**/*.mjs', 'tests/**/*.ts', '.storybook/**/*.{ts,tsx}'],
};

export default config;
