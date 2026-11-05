// Права клиента — каждая ячейка матрицы 01-roles.md §4 и каждая строка правил 01-statuses.md §9.
import { describe, expect, it } from 'vitest';

import type { PermissionState } from '@/shared/api';
import { doc, docSet } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader, yamlBlock } from '@/test-utils/markdown';

import {
  CLIENT_PERMISSIONS,
  canCreateReapplication,
  canEditFiles,
  canOpenExternalLinks,
  canReuploadRejected,
  canSubmitDocumentSet,
  canViewLimit,
  clientCan,
  type ClientPermission,
} from './permissions';

const STATES: PermissionState[] = ['collecting', 'reviewing', 'active', 'closed'];

const yaml = yamlBlock(section(readProductDoc('01-roles.md'), '4.'));
const cells = [...yaml.matchAll(/^\s+(\w+):\s*\{([^}]*)\}/gm)].flatMap(([, perm, body]) =>
  [...(body ?? '').matchAll(/(\w+):\s*(true|false)/g)].map(([, state, value]) => [perm as string, state as string, value === 'true'] as const),
);

describe('01-roles.md §4 — матрица прав клиента, каждая ячейка', () => {
  it('в документе 14 прав × 4 состояния', () => expect(cells).toHaveLength(14 * 4));
  it('набор прав совпадает с документом', () => {
    expect(Object.keys(CLIENT_PERMISSIONS).sort()).toEqual([...new Set(cells.map((c) => c[0]))].sort());
  });
  it.each(cells)('%s в %s → %s', (perm, state, expected) => {
    expect(clientCan(perm as ClientPermission, state as PermissionState)).toBe(expected);
  });
});

// Каждая строка таблицы §9 → проверка; строка без проверки — ошибка теста.
const draft = docSet([doc('received')]);
const submitted = docSet([doc('received')], { status: 'submitted', locked: true });
const rules: Record<string, () => void> = {
  'Загрузить / заменить / удалить файл': () => {
    expect(canEditFiles('collecting', draft)).toBe(true);
    expect(canEditFiles('collecting', submitted)).toBe(false);
    for (const s of STATES.filter((x) => x !== 'collecting')) expect(canEditFiles(s, draft)).toBe(false);
  },
  'Загрузить заново отклонённый': () => {
    const rejected = doc('rejected', { rejected_file_hashes: ['old'] });
    expect(canReuploadRejected('collecting', draft, rejected, 'new')).toBe(true);
    expect(canReuploadRejected('collecting', draft, rejected, 'old')).toBe(false);
    expect(canReuploadRejected('collecting', draft, doc('received'), 'new')).toBe(false);
    expect(canReuploadRejected('collecting', submitted, rejected, 'new')).toBe(false);
  },
  'Нажать «Отправить»': () => {
    expect(canSubmitDocumentSet(docSet([doc('received'), doc('approved', { portal_key: 'vat' })]))).toBe(true);
    expect(canSubmitDocumentSet(docSet([doc('received'), doc('pending', { portal_key: 'vat' })]))).toBe(false);
    expect(canSubmitDocumentSet(docSet([doc('received'), doc('pending', { portal_key: 'aoa', required: false })]))).toBe(true);
    expect(canSubmitDocumentSet(docSet([doc('received'), doc('rejected', { portal_key: 'vat', required: false })]))).toBe(false);
    expect(canSubmitDocumentSet(submitted)).toBe(false);
  },
  'Видеть блок «Лимит» на главной (D-023)': () => {
    for (const s of STATES) expect(canViewLimit(s)).toBe(s === 'active');
  },
  'Открыть ссылки Sadq / Nafith': () => {
    expect(canOpenExternalLinks({ status: 'ready' })).toBe(true);
    expect(canOpenExternalLinks({ status: 'active' })).toBe(true);
    for (const s of ['pending', 'cancelled', 'rejected'] as const) expect(canOpenExternalLinks({ status: s })).toBe(false);
    expect(canOpenExternalLinks(null)).toBe(false);
  },
  'Скачать свои документы': () => {
    for (const s of STATES) expect(clientCan('download_own_documents', s)).toBe(true);
  },
  'Повторная заявка': () => {
    for (const s of STATES) expect(canCreateReapplication(s)).toBe(s === 'closed');
  },
};

describe('01-statuses.md §9 — правила блокировок, каждая строка', () => {
  const rows = tableWithHeader(section(readProductDoc('01-statuses.md'), '9.'), 'Действие').rows;
  it.each(rows.map((r) => r[0] ?? ''))('%s', (action) => {
    const check = rules[action];
    expect(check, `нет проверки для строки «${action}»`).toBeTypeOf('function');
    check?.();
  });
});
