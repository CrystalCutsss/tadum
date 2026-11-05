// Помощники для рукописных фикстур: даты от «сейчас», деньги в SAR, документы и файлы.

import { toDate } from '@/shared/lib';
import type { Document, DocumentSet, DocumentStatus, FileAsset, Money, PortalKey, PrevalidationResult } from '../ports/schemas';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface Offset {
  days?: number;
  hours?: number;
  minutes?: number;
}

/** ISO-время: `now` минус смещение (в прошлое). */
export const ago = (now: number, o: Offset): string =>
  toDate(now - (o.days ?? 0) * DAY - (o.hours ?? 0) * HOUR - (o.minutes ?? 0) * MINUTE).toISOString();

/** ISO-время: `now` плюс смещение (в будущее). */
export const ahead = (now: number, o: Offset): string =>
  toDate(now + (o.days ?? 0) * DAY + (o.hours ?? 0) * HOUR + (o.minutes ?? 0) * MINUTE).toISOString();

/** Сумма в SAR (кратна 500) → халалы. */
export const sar = (amount: number): Money => ({ amount_minor: amount * 100, currency: 'SAR' });

export const ZERO: Money = sar(0);

/** Телефон из тестового диапазона +966 50 000 0XXX. */
export const phone = (n: number): string => `+9665000${String(n).padStart(5, '0')}`;

/** Базовый пакет клиента (01-entities.md §3). Обязательность задаёт Odoo; в фикстурах все обязательны. */
export const CLIENT_BASE_KEYS: readonly PortalKey[] = ['bs', 'national_id', 'vat', 'vat_sales', 'ch_owner', 'ch_company', 'aoa'];

export interface FileSpec {
  id: string;
  name: string;
  sha256: string;
  uploaded_at: string;
  mime?: FileAsset['mime'];
  size_bytes?: number;
  prevalidation?: PrevalidationResult;
}

export const file = (f: FileSpec): FileAsset => ({
  id: f.id,
  name: f.name,
  mime: f.mime ?? 'application/pdf',
  size_bytes: f.size_bytes ?? 524_288,
  sha256: f.sha256,
  uploaded_at: f.uploaded_at,
  download_url: `/mock-files/${f.id}`,
  prevalidation: f.prevalidation ?? { state: 'passed', rule_keys: [] },
});

export interface DocSpec {
  status: DocumentStatus;
  updated_at: string;
  required?: boolean;
  files?: FileAsset[];
  reject_reason_key?: string;
  reject_reason_text?: Document['reject_reason_text'];
  rejected_file_hashes?: string[];
}

export const document = (setId: string, key: PortalKey, d: DocSpec): Document => ({
  id: `${setId}_${key}`,
  set_id: setId,
  portal_key: key,
  status: d.status,
  required: d.required ?? true,
  ...(d.reject_reason_key ? { reject_reason_key: d.reject_reason_key } : {}),
  ...(d.reject_reason_text ? { reject_reason_text: d.reject_reason_text } : {}),
  rejected_file_hashes: d.rejected_file_hashes ?? [],
  files: d.files ?? [],
  hint: { title_key: `document.${key}.title`, hint_key: `document.${key}.hint` },
  updated_at: d.updated_at,
});

/** Документ с одним загруженным файлом. */
export const uploaded = (setId: string, key: PortalKey, status: DocumentStatus, at: string, extra: Partial<DocSpec> & { prevalidation?: PrevalidationResult } = {}): Document =>
  document(setId, key, {
    status,
    updated_at: at,
    files: [
      file({
        id: `${setId}_${key}_f1`,
        name: `${key}.pdf`,
        sha256: `sha_${setId}_${key}_1`,
        uploaded_at: at,
        ...(extra.prevalidation ? { prevalidation: extra.prevalidation } : {}),
      }),
    ],
    ...extra,
  });

export const documentSet = (s: Omit<DocumentSet, 'locked'> & { locked?: boolean }): DocumentSet => ({
  ...s,
  locked: s.locked ?? s.status !== 'draft',
});

export const checklist = (spa: 'pending' | 'in_progress' | 'done' | 'failed', pnCompany: typeof spa, pnOwner: typeof spa) => ({
  items: [
    { key: 'spa_sadq' as const, status: spa, external_url: 'https://sadq.sa/' },
    { key: 'pn_company_nafith' as const, status: pnCompany, external_url: 'https://nafith.sa/' },
    { key: 'pn_owner_nafith' as const, status: pnOwner, external_url: 'https://nafith.sa/' },
  ],
  completed: spa === 'done' && pnCompany === 'done' && pnOwner === 'done',
});

/** Ссылка «Подать заявку» для закрытой заявки (VITE_LANDING_URL). */
export const landingUrl = (): string => import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';
