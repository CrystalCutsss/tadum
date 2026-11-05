// Права клиента (01-roles.md §4) и правила блокировок (01-statuses.md §9).
// Права зависят не от роли (client_contact и client_owner равны), а от состояния прав заявки.

import type { DocumentSet, Limit, PermissionState } from '@/shared/api';

type Matrix = Readonly<Record<PermissionState, boolean>>;

const ALL: Matrix = { collecting: true, reviewing: true, active: true, closed: true };
const COLLECTING: Matrix = { collecting: true, reviewing: false, active: false, closed: false };
const ACTIVE: Matrix = { collecting: false, reviewing: false, active: true, closed: false };
const CLOSED: Matrix = { collecting: false, reviewing: false, active: false, closed: true };

export const CLIENT_PERMISSIONS = {
  view_status_and_next_step: ALL,
  view_documents: ALL,
  upload_or_replace_file: COLLECTING,
  reupload_rejected: COLLECTING,
  delete_uploaded_file: COLLECTING,
  submit_document_set: COLLECTING,
  download_own_documents: ALL,
  view_limit: ACTIVE,
  open_sadq_or_nafith_links: ACTIVE,
  view_how_to_buy: ACTIVE,
  change_language: ALL,
  contact_support: ALL,
  logout: ALL,
  create_reapplication: CLOSED,
} as const satisfies Record<string, Matrix>;

export type ClientPermission = keyof typeof CLIENT_PERMISSIONS;

export function clientCan(permission: ClientPermission, state: PermissionState): boolean {
  return CLIENT_PERMISSIONS[permission][state];
}

type SetLike = Pick<DocumentSet, 'status' | 'locked' | 'documents'>;

/** Загрузить / заменить / удалить файл: collecting и комплект draft (не отправлен). */
export function canEditFiles(state: PermissionState, set: Pick<DocumentSet, 'status' | 'locked'>): boolean {
  return clientCan('upload_or_replace_file', state) && set.status === 'draft' && !set.locked;
}

/** Загрузить заново отклонённый: то же, документ rejected и хэш нового файла не отклоняли раньше (TADUM-536). */
export function canReuploadRejected(
  state: PermissionState,
  set: Pick<DocumentSet, 'status' | 'locked'>,
  document: { status: string; rejected_file_hashes: readonly string[] },
  newFileSha256: string,
): boolean {
  return canEditFiles(state, set) && document.status === 'rejected' && !document.rejected_file_hashes.includes(newFileSha256);
}

/** «Отправить»: комплект draft, все обязательные ∈ {received, approved}, нет rejected. */
export function canSubmitDocumentSet(set: SetLike): boolean {
  if (set.status !== 'draft' || set.locked) return false;
  if (set.documents.some((d) => d.status === 'rejected')) return false;
  return set.documents.filter((d) => d.required).every((d) => d.status === 'received' || d.status === 'approved');
}

/** Блок «Лимит» на главной (D-023). */
export function canViewLimit(state: PermissionState): boolean {
  return clientCan('view_limit', state);
}

/** Ссылки Sadq / Nafith: только когда лимит ready или active. */
export function canOpenExternalLinks(limit: Pick<Limit, 'status'> | null): boolean {
  return limit !== null && (limit.status === 'ready' || limit.status === 'active');
}

/** Повторная заявка — только из closed (D-038). */
export function canCreateReapplication(state: PermissionState): boolean {
  return clientCan('create_reapplication', state);
}
