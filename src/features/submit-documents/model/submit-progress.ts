// Что показать в панели отправки (решение Кирилла 2026-11-12): сегмент полосы на каждый документ и на поле CR,
// заполняются по очереди от начала строки (поле CR — как ещё один шаг, без своего места), подпись «X из N загружено» с припиской про поле CR, «осталось только поле CR» и оценку оставшегося времени.
// Оценка времени — допущение A-065: 2 минуты на незагруженный документ и 1 минута на номер CR.

import type { DocumentsProgress } from '@/entities/document';

const MINUTES_PER_DOCUMENT = 2;
const MINUTES_FOR_CR = 1;

type ProgressCopy =
  /** «X из N загружено» — поля CR нет или оно заполнено. */
  | 'documents'
  /** «X из N загружено, и ещё номер CR». */
  | 'documents_and_cr'
  /** Документы загружены, осталось только поле CR. */
  | 'cr_only';

export interface SubmitProgress {
  /** Заполнен ли сегмент: заполняются по очереди от начала строки — документы и поле CR вместе (Кирилл 2026-11-12). */
  segments: boolean[];
  copy: ProgressCopy;
  /** Примерно минут до конца заполнения; 0 — всё готово. */
  minutesLeft: number;
}

export function submitProgress(progress: DocumentsProgress, cr: { required: boolean; ready: boolean }): SubmitProgress {
  const remaining = progress.total - progress.uploaded;
  const crMissing = cr.required && !cr.ready;
  const filled = progress.uploaded + (cr.required && cr.ready ? 1 : 0);
  const segments = Array.from({ length: progress.total + (cr.required ? 1 : 0) }, (_, i) => i < filled);
  return {
    segments,
    copy: crMissing ? (remaining > 0 ? 'documents_and_cr' : 'cr_only') : 'documents',
    minutesLeft: remaining * MINUTES_PER_DOCUMENT + (crMissing ? MINUTES_FOR_CR : 0),
  };
}
