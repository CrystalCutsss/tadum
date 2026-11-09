// Шкала клиента — каждая строка таблицы истинности 01-statuses.md §8 (с раскрытием any / ≥2)
// и каждая строка таблицы 01-cabinet-structure.md §5.
import { describe, expect, it } from 'vitest';

import type { ClientStatus, LimitStatus } from '@/shared/api';
import { limit } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { CLIENT_TIMELINE_STEPS, computeClientTimeline } from './timeline';

// Решение Кирилла 2026-11-09 (экран документов): при дозапросе «Документы» пройдены, метка needs_attention —
// на «Проверке». Таблицы 01-statuses.md §8 и 01-cabinet-structure.md §5 в Drive ещё со старой строкой; правку вносит
// Кирилл, после /sync-product-docs это переопределение убрать (A-058).
const MORE_DOCS_ROW = ['done', 'needs_attention', 'upcoming', 'upcoming', 'upcoming'];
const withDecision = (status: string, round: number, states: string[]) => (status.startsWith('docs_required') && round > 1 ? MORE_DOCS_ROW : states);

const ALL_LIMITS: LimitStatus[] = ['pending', 'ready', 'active', 'cancelled', 'rejected'];

const rounds = (cell: string) => (cell === '1' ? [1] : cell === '≥2' ? [2, 3] : [1, 2]);
const limits = (cell: string): (LimitStatus | null)[] =>
  cell === '—' ? [null] : cell === 'any' ? [null, ...ALL_LIMITS] : (cell.split('/').map((s) => s.trim()) as LimitStatus[]);
const checklists = (cell: string) => (cell === 'true' ? [true] : cell === 'false' || cell === '—' ? [false] : [true, false]);

describe('01-statuses.md §8 — таблица истинности, каждая строка и каждая комбинация', () => {
  const rows = tableWithHeader(section(readProductDoc('01-statuses.md'), '8.'), 'client_status').rows;
  it('в таблице 7 строк', () => expect(rows).toHaveLength(7));
  it.each(rows)('%s | round %s | limit %s | checklist %s', (status, round, lim, check, ...states) => {
    for (const r of rounds(round))
      for (const l of limits(lim))
        for (const c of checklists(check)) {
          const out = computeClientTimeline({ client_status: status as ClientStatus, round: r, limit: l ? limit(l, c) : null });
          if (status === 'closed') {
            expect(out.hidden).toBe(true);
            continue;
          }
          const row = withDecision(status, r, states);
          const expected = Object.fromEntries(CLIENT_TIMELINE_STEPS.map((s, i) => [s, row[i]]));
          expect(out, `${status}/${r}/${l}/${c}`).toEqual({ hidden: false, steps: expected });
        }
  });
});

// Ячейка client_status §5 содержит пояснение в скобках — вход для каждой строки задан явно.
const cabinetInputs: Record<string, Parameters<typeof computeClientTimeline>[0]> = {
  'docs_required (первый комплект)': { client_status: 'docs_required', round: 1, limit: null },
  'docs_required (дозапрос, round > 1)': { client_status: 'docs_required', round: 2, limit: null },
  under_review: { client_status: 'under_review', round: 1, limit: null },
  'approved (до подписания)': { client_status: 'approved', round: 1, limit: limit('ready', false) },
  'approved (всё подписано, лимит active)': { client_status: 'approved', round: 1, limit: limit('active', true) },
  first_purchase: { client_status: 'first_purchase', round: 1, limit: limit('active', true) },
  closed: { client_status: 'closed', round: 1, limit: null },
};

describe('01-cabinet-structure.md §5 — состояния шагов, каждая строка', () => {
  const rows = tableWithHeader(section(readProductDoc('01-cabinet-structure.md'), '5.'), 'client_status').rows;
  it.each(rows)('%s', (situation, ...states) => {
    const input = cabinetInputs[situation];
    expect(input, `нет входа для строки «${situation}»`).toBeDefined();
    const out = computeClientTimeline(input!);
    if (situation === 'closed') {
      // «Шкала заменяется нейтральной карточкой «Заявка закрыта»».
      expect(out).toEqual({ hidden: true, steps: null });
      return;
    }
    const row = withDecision(situation, input!.round, states);
    expect(out).toEqual({ hidden: false, steps: Object.fromEntries(CLIENT_TIMELINE_STEPS.map((s, i) => [s, row[i]])) });
  });

  it('шкала не откатывается при дозапросе: «Документы» пройдены, «Проверка» с меткой (D-008, решение 2026-11-09)', () => {
    const out = computeClientTimeline({ client_status: 'docs_required', round: 2, limit: null });
    expect(out.steps?.documents).toBe('done');
    expect(out.steps?.review).toBe('needs_attention');
  });
});
