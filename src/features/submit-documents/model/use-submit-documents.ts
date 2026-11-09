// «Отправить на проверку» (SC-02, D-029): одним нажатием, без диалога; после отправки комплект заблокирован.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { track } from '@/shared/analytics';
import { DomainError, getApi, type DocumentSet } from '@/shared/api';
import { now, toDate } from '@/shared/lib';

const MINUTE = 60_000;

/** Минуты от первой загрузки файла в комплекте до отправки — для document_set_submitted. */
function minutesFromFirstUpload(set: DocumentSet): number {
  const times = set.documents.flatMap((d) => d.files.map((f) => toDate(f.uploaded_at).getTime()));
  return times.length === 0 ? 0 : Math.max(0, Math.round((now() - Math.min(...times)) / MINUTE));
}

export function useSubmitDocuments(set: DocumentSet | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!set) throw new Error('document set is not loaded');
      return (await getApi()).documents.submit(set.id);
    },
    onSuccess: async () => {
      if (set) {
        track('document_set_submitted', {
          owner: 'client',
          documents_count: set.documents.filter((d) => d.files.length > 0).length,
          optional_uploaded: set.documents.some((d) => !d.required && d.files.length > 0),
          auto: false,
          round: set.round,
          duration_from_first_upload_min: minutesFromFirstUpload(set),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['application'] });
    },
  });
}

/** Ключ текста ошибки отправки. */
export function submitErrorKey(error: unknown): string {
  if (error instanceof DomainError && error.code === 'documents.submit_incomplete') return 'documents.submit.error_incomplete';
  if (error instanceof DomainError && error.code === 'document_set_locked') return 'documents.submit.error_locked';
  return 'documents.submit.error_generic';
}
