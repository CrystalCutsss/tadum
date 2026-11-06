// Превью ветки (ADR-003, A-053): сборка и `wrangler preview` — отдельный адрес
// https://<ветка>-tadum.<subdomain>.workers.dev на каждую ветку, прод (main) не меняется.
// Запускает только CI с секретами CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID (D-068, D-069).
//
//   node scripts/deploy-branch.mjs <ветка>            — создать или обновить превью
//   node scripts/deploy-branch.mjs <ветка> --delete   — удалить превью ветки
//
// Адрес пишется в stdout последней строкой, в $GITHUB_OUTPUT (url=…) и в $GITHUB_STEP_SUMMARY, если они заданы.
import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WORKER = 'tadum';
// Метка DNS — не длиннее 63 символов: «<имя>-tadum».
export const MAX_NAME = 63 - WORKER.length - 1;

/** Имя превью из имени ветки: строчные латинские буквы, цифры и дефисы; длинные — с коротким хешем. */
export function previewName(branch) {
  const base = String(branch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) throw new Error(`Пустое имя превью из ветки «${branch}»`);
  if (base.length <= MAX_NAME) return base;
  const hash = createHash('sha256').update(String(branch)).digest('hex').slice(0, 6);
  return `${base.slice(0, MAX_NAME - hash.length - 1).replace(/-+$/, '')}-${hash}`;
}

/** Адрес превью из JSON-вывода `wrangler preview --json`. */
export function previewUrl(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const url = data?.preview?.urls?.[0] ?? data?.preview_urls?.[0];
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('В ответе wrangler preview нет адреса превью');
  }
  return url;
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    // Перехваченный stdout (JSON wrangler с текстом ошибки) — в лог, иначе причина теряется.
    if (res.stdout) process.stderr.write(res.stdout);
    process.exit(res.status ?? 1);
  }
  return res;
}

function main() {
  const [branch, flag] = process.argv.slice(2);
  if (!branch || branch.startsWith('-')) {
    console.error('Использование: node scripts/deploy-branch.mjs <ветка> [--delete]');
    process.exit(2);
  }
  if (branch === 'main') {
    console.error('main выкладывает deploy:preview, а не превью ветки');
    process.exit(2);
  }
  const name = previewName(branch);

  if (flag === '--delete') {
    run('pnpm', ['exec', 'wrangler', 'preview', 'delete', '--name', name, '--skip-confirmation']);
    return;
  }

  run('pnpm', ['build']);
  const res = run('pnpm', ['exec', 'wrangler', 'preview', '--name', name, '--message', `branch ${branch}`, '--json'], {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
  });
  // wrangler может писать предупреждения перед JSON — берём объект с первой «{».
  const out = res.stdout;
  const url = previewUrl(out.slice(out.indexOf('{')));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\nname=${name}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Превью ветки \`${branch}\`\n\n${url}\n`);
  }
  console.log(url);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
