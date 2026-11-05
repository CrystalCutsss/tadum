// lint:gitlab-ci (мастер-промпт 7a п.4): .gitlab-ci.yml против JSON-схемы GitLab CI из каталога SchemaStore.
// Схема лежит в репозитории (scripts/schemas/gitlab-ci.json), чтобы проверка не зависела от сети;
// обновление: URL из каталога SchemaStore — см. scripts/schemas/README.md. Проверка через API GitLab — после переноса.
import { readFileSync } from 'node:fs';

import Ajv from 'ajv';
import { parse } from 'yaml';

const file = process.argv[2] ?? '.gitlab-ci.yml';
const schema = JSON.parse(readFileSync(new URL('./schemas/gitlab-ci.json', import.meta.url), 'utf8'));
// strict: false — в схеме есть нестандартные ключи (markdownDescription) для редакторов; форматы (uri, regex) не проверяем.
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const validate = ajv.compile(schema);
const doc = parse(readFileSync(file, 'utf8'), { merge: true });

if (!validate(doc)) {
  for (const e of validate.errors ?? []) console.error(`${file}${e.instancePath || '/'}: ${e.message}`);
  process.exit(1);
}
console.log(`lint:gitlab-ci: ${file} соответствует схеме GitLab CI`);
