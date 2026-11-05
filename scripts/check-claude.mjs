// check:claude (блок 8a): слой Claude Code в порядке — CLAUDE.md < 200 строк, у агентов и скиллов валидный
// фронтматтер (формат — code.claude.com/docs: sub-agents, skills), правила с корректным `paths:`,
// субагенты, на которых ссылаются скиллы, существуют.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'yaml';

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!m) return { data: null, body: text };
  try {
    return { data: parse(m[1]) ?? {}, body: m[2] };
  } catch (e) {
    fail(file, `фронтматтер не YAML: ${e.message}`);
    return { data: {}, body: m[2] };
  }
}

const AGENT_KEYS = new Set(['name', 'description', 'tools', 'disallowedTools', 'model', 'permissionMode', 'maxTurns', 'skills', 'mcpServers', 'hooks', 'memory', 'background', 'effort', 'isolation', 'color', 'initialPrompt']);
const SKILL_KEYS = new Set(['name', 'description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools', 'model', 'effort', 'context', 'agent', 'hooks', 'paths']);
const CYRILLIC = /[а-яё]/i;

const claudeMd = readFileSync('CLAUDE.md', 'utf8').split('\n').length;
if (claudeMd >= 200) fail('CLAUDE.md', `${claudeMd} строк, нужно < 200`);

const agentsDir = '.claude/agents';
const agents = new Set();
for (const f of readdirSync(agentsDir).filter((n) => n.endsWith('.md'))) {
  const file = join(agentsDir, f);
  const { data, body } = frontmatter(file);
  if (!data) { fail(file, 'нет фронтматтера'); continue; }
  for (const k of Object.keys(data)) if (!AGENT_KEYS.has(k)) fail(file, `неизвестный ключ «${k}» (Claude Code его молча игнорирует)`);
  if (data.name !== f.replace(/\.md$/, '')) fail(file, `name «${data.name}» не совпадает с именем файла`);
  if (typeof data.description !== 'string' || data.description.length < 20) fail(file, 'нет внятного description');
  if (data.memory && !['user', 'project', 'local'].includes(data.memory)) fail(file, `memory «${data.memory}» — допустимо user|project|local`);
  if (!CYRILLIC.test(body)) fail(file, 'текст агента должен быть на русском (D-062)');
  agents.add(data.name);
}

const skillsDir = '.claude/skills';
for (const dir of readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const file = join(skillsDir, dir.name, 'SKILL.md');
  if (!existsSync(file)) { fail(join(skillsDir, dir.name), 'нет SKILL.md'); continue; }
  const { data, body } = frontmatter(file);
  if (!data) { fail(file, 'нет фронтматтера'); continue; }
  for (const k of Object.keys(data)) if (!SKILL_KEYS.has(k)) fail(file, `неизвестный ключ «${k}»`);
  if (data.name && data.name !== dir.name) fail(file, `name «${data.name}» не совпадает с папкой`);
  if (typeof data.description !== 'string' || data.description.length < 20) fail(file, 'нет внятного description');
  if (data.description && data.description.length > 1024) fail(file, 'description длиннее 1024 символов');
  if (!CYRILLIC.test(body)) fail(file, 'текст скилла должен быть на русском (D-062)');
  for (const [, ref] of body.matchAll(/субагент[уа]? `([a-z0-9-]+)`/g)) if (!agents.has(ref)) fail(file, `ссылается на несуществующего субагента «${ref}»`);
}

const rulesDir = '.claude/rules';
for (const f of readdirSync(rulesDir).filter((n) => n.endsWith('.md'))) {
  const file = join(rulesDir, f);
  const { data } = frontmatter(file);
  if (data && data.paths !== undefined && !(Array.isArray(data.paths) && data.paths.every((p) => typeof p === 'string'))) fail(file, '`paths` — список строк-шаблонов');
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(`check:claude: CLAUDE.md ${claudeMd} строк; агентов ${agents.size}, скиллов ${readdirSync(skillsDir).length}, правил ${readdirSync(rulesDir).length} — в порядке`);
