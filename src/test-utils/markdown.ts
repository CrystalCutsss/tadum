// Разбор таблиц и блоков кода из продуктовых документов (docs/product/*.md) для тестов.
// Тесты генерируются из таблиц документов, а не переписываются руками по выборке (мастер-промпт, блок 5a).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../docs/product/', import.meta.url));

export function readProductDoc(relPath: string): string {
  return readFileSync(`${ROOT}${relPath}`, 'utf8');
}

/** Текст раздела: от заголовка, начинающегося с `headingStart`, до следующего заголовка того же или более высокого уровня. */
export function section(md: string, headingStart: string): string {
  const lines = md.split('\n');
  // Строки внутри ``` — не заголовки (там бывают комментарии вида «# → код: …»).
  let fenced = false;
  const isHeading = lines.map((l) => {
    if (l.trimStart().startsWith('```')) fenced = !fenced;
    return !fenced && /^#{1,6} /.test(l);
  });
  const start = lines.findIndex((l, i) => isHeading[i] && l.replace(/^#+ /, '').startsWith(headingStart));
  if (start === -1) throw new Error(`раздел не найден: ${headingStart}`);
  const level = (lines[start]?.match(/^#+/)?.[0] ?? '#').length;
  const end = lines.findIndex((l, i) => i > start && isHeading[i] && (l.match(/^#+/)?.[0].length ?? 7) <= level);
  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

/** Очистка ячейки: без `code`, **жирного** и пробелов по краям. */
export const cleanCell = (cell: string): string => cell.replace(/`/g, '').replace(/\*\*/g, '').trim();

export interface MdTable {
  header: string[];
  rows: string[][];
}

/** Все таблицы в тексте. Разделитель `|---|` пропускается; `\|` внутри ячейки не считается границей. */
export function tables(text: string): MdTable[] {
  const result: MdTable[] = [];
  let current: string[][] = [];
  const flush = () => {
    if (current.length >= 2) {
      const [header, , ...rows] = current;
      result.push({ header: header ?? [], rows });
    }
    current = [];
  };
  for (const line of text.split('\n')) {
    if (line.trim().startsWith('|')) {
      const cells = line
        .trim()
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((c) => cleanCell(c.replace(/\\\|/g, '|')));
      current.push(cells);
    } else {
      flush();
    }
  }
  flush();
  return result;
}

/** Первая таблица, у которой заголовок начинается с указанных колонок. */
export function tableWithHeader(text: string, ...firstColumns: string[]): MdTable {
  const t = tables(text).find((tb) => firstColumns.every((c, i) => tb.header[i] === c));
  if (!t) throw new Error(`таблица не найдена: ${firstColumns.join(' | ')}`);
  return t;
}

/** Содержимое первого блока ```yaml в тексте. */
export function yamlBlock(text: string): string {
  const m = text.match(/```yaml\n([\s\S]*?)```/);
  if (!m?.[1]) throw new Error('блок yaml не найден');
  return m[1];
}
