// Помощники для рукописных фикстур: даты от «сейчас», деньги в SAR, документы и файлы.

import { toDate } from '@/shared/lib';
import type { Deal, Document, DocumentSet, DocumentStatus, FileAsset, Installment, Money, PaymentDetails, PortalKey, PrevalidationResult } from '../ports/schemas';

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

/** Дата `YYYY-MM-DD` по Эр-Рияду (UTC+3) для момента `ms`. */
export const riyadhDate = (ms: number): string => toDate(ms + 3 * HOUR).toISOString().slice(0, 10);

/** Реквизиты Tadum для оплаты взносов в демо (A-081: способ оплаты — допущение, реквизиты вымышленные). */
export const DEMO_PAYMENT_DETAILS: PaymentDetails = {
  beneficiary: 'Tadum Trading Company',
  bank_name: 'Demo Bank',
  iban: 'SA4420000001234567891234',
};

/**
 * Взносы по сделке (D-102): `count` помесячных взносов (каждые 30 дней от оплаты поставщику), последний забирает
 * остаток от деления. Статус — по дате и числу уже оплаченных: оплачены первые `paid`, прошедшие без оплаты — overdue.
 */
export function installmentsFor(
  deal: Pick<Deal, 'id' | 'amount' | 'paid_at'>,
  supplierName: string,
  now: number,
  { count = 3, paid = 0 }: { count?: number; paid?: number } = {},
): Installment[] {
  const start = deal.paid_at ? toDate(deal.paid_at).getTime() : now;
  const part = Math.floor(deal.amount.amount_minor / count);
  return Array.from({ length: count }, (_, i) => {
    const due = start + (i + 1) * 30 * DAY;
    const amount = i === count - 1 ? deal.amount.amount_minor - part * (count - 1) : part;
    const isPaid = i < paid;
    return {
      id: `${deal.id}_i${i + 1}`,
      deal_id: deal.id,
      reference: `${deal.id.toUpperCase().replace(/_/g, '-')}-${i + 1}`,
      supplier_name: supplierName,
      due_date: riyadhDate(due),
      amount: { amount_minor: amount, currency: 'SAR' as const },
      status: isPaid ? ('paid' as const) : due < now ? ('overdue' as const) : ('upcoming' as const),
      ...(isPaid ? { paid_at: toDate(due - 2 * DAY).toISOString() } : {}),
    };
  });
}

/** Телефон из тестового диапазона +966 50 000 0XXX. */
export const phone = (n: number): string => `+9665000${String(n).padStart(5, '0')}`;

/** Базовый пакет клиента (01-entities.md §3). Обязательность задаёт Odoo; в фикстурах все обязательны. */
export const CLIENT_BASE_KEYS: readonly PortalKey[] = ['bs', 'national_id', 'vat', 'vat_sales', 'ch_owner', 'ch_company', 'aoa'];

interface FileSpec {
  id: string;
  name: string;
  sha256: string;
  uploaded_at: string;
  mime?: FileAsset['mime'];
  size_bytes?: number;
  prevalidation?: PrevalidationResult;
  issue?: FileAsset['issue'];
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
  ...(f.issue ? { issue: f.issue } : {}),
});

export interface DocSpec {
  status: DocumentStatus;
  updated_at: string;
  required?: boolean;
  files?: FileAsset[];
  reject_reason_key?: string;
  reject_reason_text?: Document['reject_reason_text'];
  reason_kind?: Document['reason_kind'];
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
  ...(d.reason_kind ? { reason_kind: d.reason_kind } : {}),
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

/** PDF подписанных копий в моке — заглушки «demo» (D-083, D-085); с бэкендом приходят копии из Sadq и Nafith. */
const demoUrl = (name: 'spa' | 'pn'): string => `${import.meta.env.BASE_URL}demo/${name}.pdf`;

/** Чек-лист подписания: договор SPA в Sadq и вексель в Nafith, оба по ссылке из SMS от менеджера (D-085). */
export const checklist = (spa: 'pending' | 'in_progress' | 'done' | 'failed', pn: typeof spa) => ({
  items: [
    { key: 'spa' as const, status: spa, document_url: demoUrl('spa') },
    { key: 'pn_nafith' as const, status: pn, document_url: demoUrl('pn') },
  ],
  completed: spa === 'done' && pn === 'done',
});

/** Ссылка «Подать заявку» для закрытой заявки (VITE_LANDING_URL). */
export const landingUrl = (): string => import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';
