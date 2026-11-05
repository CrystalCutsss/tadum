// Каталог типов документов (01-entities.md §3). Каталог открыт: новый portal_key приходит без правок UI —
// нужен только ключ i18n. Обязательность и состав комплекта всегда приходят из DocumentSet, не отсюда.
// Пути к примерам и видео (Assets/) подключаются в блоке 5b вместе с фикстурами.

import { MAX_FILE_SIZE_BYTES, type DocumentHint, type PortalKey } from '@/shared/api';

export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export interface DocumentType {
  portal_key: PortalKey;
  audience: 'client' | 'supplier';
  title_key: string;
  hint_key: string;
  example_pdf_url?: string;
  video_url?: { ar?: string; en?: string };
  accepted_mime: typeof ACCEPTED_MIME;
  max_size_bytes: number;
  prevalidation_rules: string[];
}

const entry = (portal_key: PortalKey, audience: DocumentType['audience'], prevalidation_rules: string[] = []): DocumentType => ({
  portal_key,
  audience,
  title_key: `document.${portal_key}.title`,
  hint_key: `document.${portal_key}.hint`,
  accepted_mime: ACCEPTED_MIME,
  max_size_bytes: MAX_FILE_SIZE_BYTES,
  prevalidation_rules,
});

/** Порядок — порядок каталога (используется при сортировке внутри группы статуса). */
export const DOCUMENT_CATALOG: readonly DocumentType[] = [
  entry('bs', 'client', ['prevalidation.bs.period_too_short', 'prevalidation.bs.owner_mismatch']),
  entry('national_id', 'client'),
  entry('vat', 'client'),
  entry('vat_sales', 'client'),
  entry('ch_owner', 'client'),
  entry('ch_company', 'client'),
  entry('aoa', 'client'),
  entry('sup_vat', 'supplier'),
  entry('sup_iban_letter', 'supplier'),
  entry('sup_national_address', 'supplier'),
  entry('sup_cr', 'supplier'),
];

export function findDocumentType(key: PortalKey): DocumentType | undefined {
  return DOCUMENT_CATALOG.find((t) => t.portal_key === key);
}

/** Неизвестный ключ всё равно отображается: подсказка по шаблону ключей i18n. */
export function hintFor(key: PortalKey): DocumentHint {
  const t = findDocumentType(key) ?? entry(key, 'client');
  return {
    title_key: t.title_key,
    hint_key: t.hint_key,
    ...(t.example_pdf_url ? { example_pdf_url: t.example_pdf_url } : {}),
    ...(t.video_url ? { video_url: t.video_url } : {}),
  };
}

export function catalogIndex(key: PortalKey): number {
  const i = DOCUMENT_CATALOG.findIndex((t) => t.portal_key === key);
  return i === -1 ? DOCUMENT_CATALOG.length : i;
}
