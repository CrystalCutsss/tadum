// Плавающая панель отправки (решения Кирилла 2026-11-09): карточка шириной со строки документов, закреплена
// внизу колонки контента. Слева — «Загружено X из N» и прогресс, справа — «Отправить на проверку», по центру блока.
// Кнопка всегда активна: если что-то не загружено или не прошло проверку, нажатие показывает тост сверху,
// подсвечивает эти документы и прокручивает к верхнему из них (onBlocked). D-029: без диалога.
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { canSubmitDocumentSet } from '@/entities/application';
import { documentsProgress } from '@/entities/document';
import type { DocumentSet } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
import { useOnline } from '@/shared/lib';
import { Button, Progress, Spinner, toast } from '@/shared/ui';

import { submitErrorKey, useSubmitDocuments } from '../model/use-submit-documents';

/** Документы, которые мешают отправке: обязательные «Нужен» и «Нужен новый файл». */
export function blockingDocuments(set: Pick<DocumentSet, 'documents'>): string[] {
  return set.documents.filter((d) => d.status === 'rejected' || (d.required && d.status === 'pending')).map((d) => d.portal_key);
}

export interface SubmitBarProps {
  set: DocumentSet;
  uploading: boolean;
  /** Отправить пока нельзя: какие документы подсветить. */
  onBlocked: (portalKeys: string[]) => void;
}

export function SubmitBar({ set, uploading, onBlocked }: SubmitBarProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const submit = useSubmitDocuments(set);
  const progress = documentsProgress(set);
  const ready = canSubmitDocumentSet(set);
  const label = t('documents.progress', { uploaded: formatNumber(progress.uploaded), total: formatNumber(progress.total) });

  const onSend = () => {
    if (!online) {
      toast(t('common.offline_actions_disabled'), { position: 'top-center' });
      return;
    }
    if (uploading) {
      toast(t('documents.submit.wait_uploads'), { position: 'top-center' });
      return;
    }
    if (!ready) {
      const blocking = blockingDocuments(set);
      toast(t('documents.submit.blocked', { count: blocking.length }), { position: 'top-center' });
      onBlocked(blocking);
      return;
    }
    submit.mutate(undefined, {
      onSuccess: () => toast(t('documents.submit.done'), { position: 'top-center' }),
      onError: (error) => toast(t(submitErrorKey(error) as ParseKeys), { position: 'top-center' }),
    });
  };

  return (
    <div className="sticky bottom-4 z-10 mt-auto flex items-center gap-4 rounded-xl border bg-card p-3 text-card-foreground shadow-md md:p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p id="submit-progress" className="text-sm font-medium" aria-live="polite">
          {label}
        </p>
        <Progress value={progress.total === 0 ? 0 : (progress.uploaded / progress.total) * 100} aria-labelledby="submit-progress" />
        {ready ? <p className="text-xs text-muted-foreground">{t('documents.submit.hint_locks')}</p> : null}
      </div>
      <Button type="button" className="min-h-11 shrink-0" aria-busy={submit.isPending} onClick={onSend}>
        {submit.isPending ? <Spinner aria-label={t('documents.submit.sending')} /> : null}
        {t('documents.submit.cta')}
      </Button>
    </div>
  );
}
