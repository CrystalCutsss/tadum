// Что показать в панели отправки (решение Кирилла 2026-11-12): сегмент полосы на каждый документ и на поле CR,
// заполняются по очереди от начала строки (поле CR — как ещё один шаг, без своего места), подписи «X из N загружено» и «осталось только поле CR». Оценку оставшегося времени Кирилл убрал 2026-11-17.

import type { DocumentsProgress } from '@/entities/document';

type ProgressCopy =
  /** «X из N загружено» — пока есть незагруженные документы или поля CR нет (приписку про CR Кирилл убрал 2026-11-12). */
  | 'documents'
  /** Документы загружены, осталось только поле CR. */
  | 'cr_only';

export interface SubmitProgress {
  /** Заполнен ли сегмент: заполняются по очереди от начала строки — документы и поле CR вместе (Кирилл 2026-11-12). */
  segments: boolean[];
  copy: ProgressCopy;
}

export function submitProgress(progress: DocumentsProgress, cr: { required: boolean; ready: boolean }): SubmitProgress {
  const remaining = progress.total - progress.uploaded;
  const crMissing = cr.required && !cr.ready;
  const filled = progress.uploaded + (cr.required && cr.ready ? 1 : 0);
  const segments = Array.from({ length: progress.total + (cr.required ? 1 : 0) }, (_, i) => i < filled);
  return {
    segments,
    copy: crMissing && remaining === 0 ? 'cr_only' : 'documents',
  };
}
