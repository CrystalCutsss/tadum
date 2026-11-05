// check:docs (мастер-промпт 7b): относительные ссылки в Markdown репозитория ведут на существующие файлы.
// Внешние ссылки (http, mailto) и якоря внутри файла не проверяются.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SKIP = new Set(['node_modules', '.git', 'dist', 'storybook-static', 'test-results', 'playwright-report', '.lighthouseci', '.wrangler']);
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) files.push(p);
  }
})('.');

// [текст](цель) — без картинок-ссылок на внешние ресурсы; код в обратных кавычках вырезаем заранее.
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
let broken = 0;
let checked = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  for (const [, target] of text.matchAll(LINK)) {
    if (/^(?:[a-z]+:|#)/i.test(target)) continue;
    checked++;
    const path = decodeURIComponent(target.split('#')[0]);
    if (!existsSync(join(dirname(file), path))) {
      broken++;
      console.error(`${relative('.', file)}: битая ссылка «${target}»`);
    }
  }
}
if (broken) process.exit(1);
console.log(`check:docs: ${files.length} файлов, ${checked} относительных ссылок — все ведут на существующие файлы`);
