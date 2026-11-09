// Нижняя панель отправки (бенчмарк № 02: одна кнопка внизу; D-029: без диалога). Закреплена внизу колонки
// контента, на телефоне учитывает safe-area. Пока не всё загружено — кнопка неактивна, подпись говорит сколько осталось.
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { canSubmitDocumentSet } from '@/entities/application';
import { documentsProgress } from '@/entities/document';
import type { DocumentSet } from '@/shared/api';
import { useOnline } from '@/shared/lib';
import { Button, Spinner, toast } from '@/shared/ui';

import { submitErrorKey, useSubmitDocuments } from '../model/use-submit-documents';

export function SubmitBar({ set, uploading }: { set: DocumentSet; uploading: boolean }) {
  const { t } = useTranslation();
  const online = useOnline();
  const submit = useSubmitDocuments(set);
  const { requiredRemaining } = documentsProgress(set);
  const hasRejected = set.documents.some((d) => d.status === 'rejected');
  const ready = canSubmitDocumentSet(set) && !uploading;

  const hint = !online
    ? t('common.offline_actions_disabled')
    : hasRejected
      ? t('documents.submit.hint_rejected')
      : requiredRemaining > 0
        ? t('documents.submit.hint_remaining', { count: requiredRemaining })
        : t('documents.submit.hint_locks');

  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-safe-bottom md:flex-row md:items-center md:justify-between">
      <p id="submit-hint" className="text-sm text-muted-foreground" aria-live="polite">
        {hint}
      </p>
      <Button
        type="button"
        className="min-h-11 w-full md:w-auto"
        disabled={!ready || !online || submit.isPending}
        aria-describedby="submit-hint"
        onClick={() =>
          submit.mutate(undefined, {
            onSuccess: () => toast(t('documents.submit.done')),
            onError: (error) => toast(t(submitErrorKey(error) as ParseKeys)),
          })
        }
      >
        {submit.isPending ? <Spinner aria-label={t('documents.submit.sending')} /> : null}
        {t('documents.submit.cta')}
      </Button>
    </div>
  );
}
