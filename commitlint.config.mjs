// Conventional Commits (мастер-промпт 7a п.2). Scope — срез (имя папки в src/<слой>/), слой или setup/docs/release/design.
import { readdirSync } from 'node:fs';

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const slices = ['widgets', 'features', 'entities', 'shared'].flatMap((layer) =>
  readdirSync(new URL(`./src/${layer}/`, import.meta.url), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [...new Set([...LAYERS, ...slices, 'setup', 'docs', 'release', 'design', 'deps', 'ci'])]],
  },
};
