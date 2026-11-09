// Каталог типов документов (01-entities.md §3). Каталог открыт: новый portal_key приходит без правок UI —
// нужен только ключ i18n. Обязательность и состав комплекта всегда приходят из DocumentSet, не отсюда.
// Пути к примерам и видео (Assets/) подключаются вместе с экраном документов (A-027).

import { MAX_FILE_SIZE_BYTES, type DocumentHint, type PortalKey } from '@/shared/api';

export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export interface DocumentType {
  portal_key: PortalKey;
  audience: 'client' | 'supplier';
  title_key: string;
  hint_key: string;
  example_pdf_url?: string;
  /** Картинка-пример для просмотра в модальном окне (без просмотрщика PDF, решение 2026-11-09). */
  example_image_url?: string;
  video_url?: { ar?: string; en?: string };
  accepted_mime: typeof ACCEPTED_MIME;
  max_size_bytes: number;
  prevalidation_rules: string[];
  /** Где получить документ (решение Кирилла 2026-11-09): официальные сервисы. Пусто — адрес не проверен (A-058). */
  source_links: readonly SourceLink[];
}

/** Ссылка на сторонний сервис: подпись — ключ i18n, адрес — только официальный и проверенный. */
export interface SourceLink {
  label_key: string;
  url: string;
}

// Проверенные официальные адреса (2026-11-09): ZATCA — сертификат и декларации VAT; Molim — приложение SIMAH
// для отчёта владельца; SIMAT — коммерческие отчёты SIMAH. Банк, удостоверение и устав — без ссылки (A-058).
const ZATCA: SourceLink = { label_key: 'document.source.zatca', url: 'https://zatca.gov.sa' };
const MOLIM: SourceLink = { label_key: 'document.source.molim', url: 'https://apps.apple.com/sa/app/molim/id919072738' };
// Демо-ассеты (A-058, решения Кирилла 2026-11-09): одна картинка-пример и одно видео на все документы с ассетами,
// пока нет файлов upload-портала (В16). Видео — встроенный плеер Google Drive (`/preview`), файл «Arabic ID.mp4»
// из Drive Tadum: скачать его в репозиторий коннектором нельзя (ограничение размера), смотреть — по ссылке.
const EXAMPLE_IMAGE = `${import.meta.env.BASE_URL}examples/document-example.webp`;
const VIDEO_AR = { ar: 'https://drive.google.com/file/d/180yyGSeVxN-LIx97vriUXmycyoqKN6_5/preview' };
const SIMAT: SourceLink = { label_key: 'document.source.simah', url: 'https://www.simah.com/en/products/pages/simat.aspx' };

const entry = (
  portal_key: PortalKey,
  audience: DocumentType['audience'],
  prevalidation_rules: string[] = [],
  source_links: readonly SourceLink[] = [],
): DocumentType => ({
  portal_key,
  audience,
  title_key: `document.${portal_key}.title`,
  hint_key: `document.${portal_key}.hint`,
  accepted_mime: ACCEPTED_MIME,
  max_size_bytes: MAX_FILE_SIZE_BYTES,
  prevalidation_rules,
  source_links,
  // У устава и всех документов поставщика нет примера и видео (D-017, D-026).
  ...(audience === 'client' && portal_key !== 'aoa' ? { example_image_url: EXAMPLE_IMAGE, video_url: VIDEO_AR } : {}),
});

/** Порядок — порядок каталога (используется при сортировке внутри группы статуса). */
export const DOCUMENT_CATALOG: readonly DocumentType[] = [
  entry('bs', 'client', ['prevalidation.bs.period_too_short', 'prevalidation.bs.owner_mismatch']),
  entry('national_id', 'client'),
  entry('vat', 'client', [], [ZATCA]),
  entry('vat_sales', 'client', [], [ZATCA]),
  entry('ch_owner', 'client', [], [MOLIM]),
  entry('ch_company', 'client', [], [SIMAT]),
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
  // Неизвестный ключ — только шаблон ключей i18n, без примеров и видео (ассеты есть лишь у известных документов).
  const t = findDocumentType(key);
  if (!t) return { title_key: `document.${key}.title`, hint_key: `document.${key}.hint` };
  return {
    title_key: t.title_key,
    hint_key: t.hint_key,
    ...(t.example_pdf_url ? { example_pdf_url: t.example_pdf_url } : {}),
    ...(t.video_url ? { video_url: t.video_url } : {}),
  };
}

/** Ссылки «где получить» для документа; неизвестный ключ — без ссылок. */
export function sourceLinksFor(key: PortalKey): readonly SourceLink[] {
  return findDocumentType(key)?.source_links ?? [];
}

/** Картинка-пример документа для модального окна; нет — undefined. */
export function exampleImageFor(key: PortalKey): string | undefined {
  return findDocumentType(key)?.example_image_url;
}

export function catalogIndex(key: PortalKey): number {
  const i = DOCUMENT_CATALOG.findIndex((t) => t.portal_key === key);
  return i === -1 ? DOCUMENT_CATALOG.length : i;
}
