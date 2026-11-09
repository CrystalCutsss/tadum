// Прогресс комплекта и режим строки документа (SC-02, решения Кирилла 2026-11-09: всё в строке списка,
// справа в строке либо статус, либо действие — никогда оба).

import type { Document, DocumentSet } from '@/shared/api';

export interface DocumentsProgress {
  /** Документов со статусом «Загружен» или «Принят». */
  uploaded: number;
  total: number;
  /** Обязательных, которые ещё нужно загрузить (pending или rejected). */
  requiredRemaining: number;
}

const isDone = (d: Pick<Document, 'status'>) => d.status === 'received' || d.status === 'approved';

export function documentsProgress(set: Pick<DocumentSet, 'documents'>): DocumentsProgress {
  return {
    uploaded: set.documents.filter(isDone).length,
    total: set.documents.length,
    requiredRemaining: set.documents.filter((d) => d.required && !isDone(d)).length,
  };
}

/**
 * Что показать справа в строке:
 * - `upload` — кнопка «Загрузить» (документ нужен);
 * - `reupload` — кнопка «Загрузить новый файл» (нужен новый файл);
 * - `status` — бейдж статуса (загружен или принят, файлы — в раскрытой строке);
 * - `readonly` — бейдж статуса, комплект нельзя менять (отправлен).
 */
export type DocumentRowMode = 'upload' | 'reupload' | 'status' | 'readonly';

export function documentRowMode(doc: Pick<Document, 'status'>, editable: boolean): DocumentRowMode {
  if (!editable) return 'readonly';
  if (doc.status === 'pending') return 'upload';
  if (doc.status === 'rejected') return 'reupload';
  return 'status';
}
