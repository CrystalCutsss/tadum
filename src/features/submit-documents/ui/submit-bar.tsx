// Отступ снизу = нижний отступ контента: 16 px на телефоне, 24 px (16 + поле контейнера inset) с md — панель
// не сдвигается, когда длина списка меняется (решение 2026-11-09).
// Плавающая панель отправки (решения Кирилла 2026-11-09): карточка шириной со строки документов, закреплена
// внизу колонки контента. Слева — «Загружено X из N» и прогресс, справа — «Отправить на проверку», по центру блока.
// Кнопка всегда активна: если что-то не загружено или не прошло проверку, нажатие показывает тост сверху,
// подсвечивает эти документы и прокручивает к верхнему из них (onBlocked). D-029: без диалога.
// Полоса — по сегменту на документ и на поле CR, рядом — примерное оставшееся время; подпись говорит, что осталось
// и про поле CR (решение Кирилла 2026-11-12).
// Всё загружено и номер CR введён (решения Кирилла 2026-11-10/12): панель с лёгким bounce вырастает по высоте, над
// прогрессом появляется текст «всё готово — отправьте», панель перекрашивается в активный синий (текст белый и светлый,
// кнопка белая), над кнопкой появляется папка, в которую падают документы (SubmitFolder). Половина папки выступает над
// панелью — отступ от последней карточки документа растёт. Удалили файл — всё возвращается к обычному виду.
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { canSubmitDocumentSet } from '@/entities/application';
import { documentsProgress } from '@/entities/document';
import type { DocumentSet } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
import { useOnline } from '@/shared/lib';
import { cn } from 'cn';

import { Button, SegmentedProgress, Spinner, toast } from '@/shared/ui';

import { submitProgress } from '../model/submit-progress';
import { submitErrorKey, useSubmitDocuments } from '../model/use-submit-documents';
import { SubmitFolder } from './submit-folder';

/** Документы, которые мешают отправке: обязательные «Нужен» и «Нужен новый файл». */
export function blockingDocuments(set: Pick<DocumentSet, 'documents'>): string[] {
  return set.documents.filter((d) => d.status === 'rejected' || (d.required && d.status === 'pending')).map((d) => d.portal_key);
}

export interface SubmitBarProps {
  set: DocumentSet;
  uploading: boolean;
  /** Номер CR компании сохранён и подходит. */
  crReady: boolean;
  /** Поле CR есть на экране — у него свой сегмент полосы. */
  crRequired?: boolean;
  /** Отправить пока нельзя: какие документы подсветить. */
  onBlocked: (portalKeys: string[]) => void;
  /** Нет номера CR: показать ошибку у поля и перейти к нему. */
  onCrMissing: () => void;
}

export function SubmitBar({ set, uploading, crReady, crRequired = false, onBlocked, onCrMissing }: SubmitBarProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const submit = useSubmitDocuments(set);
  const progress = documentsProgress(set);
  const documentsReady = canSubmitDocumentSet(set);
  const ready = documentsReady && crReady;
  const state = submitProgress(progress, {
    required: crRequired,
    ready: crReady,
  });
  const counts = {
    uploaded: formatNumber(progress.uploaded),
    total: formatNumber(progress.total),
  };
  const label =
    state.copy === 'cr_only'
      ? t('documents.progress_cr_only')
      : t('documents.progress', counts);
  const timeLeft =
    state.minutesLeft > 0
      ? t('documents.time_left', {
          count: state.minutesLeft,
          minutes: formatNumber(state.minutesLeft),
        })
      : null;

  const onSend = () => {
    if (!online) {
      toast(t('common.offline_actions_disabled'), { position: 'top-center' });
      return;
    }
    if (uploading) {
      toast(t('documents.submit.wait_uploads'), { position: 'top-center' });
      return;
    }
    if (documentsReady && !crReady) {
      toast(t('cr.missing'), { position: 'top-center' });
      onCrMissing();
      return;
    }
    if (!ready) {
      const blocking = blockingDocuments(set);
      toast(t('documents.submit.blocked', { count: blocking.length }), {
        position: 'top-center',
      });
      onBlocked(blocking);
      return;
    }
    submit.mutate(undefined, {
      onSuccess: () => toast(t('documents.submit.done'), { position: 'top-center' }),
      onError: (error) =>
        toast(t(submitErrorKey(error) as ParseKeys), {
          position: 'top-center',
        }),
    });
  };

  return (
    <>
      {/* Половина папки выступает над панелью: отступ до последней карточки растёт вместе с ней. */}
      <div aria-hidden="true" className={cn('shrink-0 transition-all duration-bounce ease-bounce', ready ? 'h-12' : 'h-0')} />
      <div
        data-ready={ready}
        className={cn(
          'sticky bottom-4 z-10 mt-auto flex items-stretch gap-4 rounded-xl border p-3 shadow-md transition-colors duration-slow ease-standard md:bottom-6 md:p-4',
          ready ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-card-foreground',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Высота текста растёт от нуля с лёгким перелётом (ease-bounce) и так же схлопывается. */}
          <div
            className={cn('grid transition-grid-rows duration-bounce ease-bounce', ready ? 'grid-rows-expanded' : 'grid-rows-collapsed')}
            aria-hidden={!ready}
          >
            <div className="min-h-0 overflow-hidden">
              <div className={cn('flex flex-col gap-1 pb-3 transition-opacity duration-slow ease-standard md:pb-4', ready ? 'opacity-100' : 'opacity-0')}>
                <p className="text-base font-semibold">{t('documents.submit.ready_title')}</p>
                <p className="text-sm text-primary-foreground/80">{t('documents.submit.ready_body')}</p>
              </div>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {ready ? `${t('documents.submit.ready_title')}. ${t('documents.submit.ready_body')}` : ''}
          </p>
          <div className="flex flex-col gap-2">
            {/* Заголовок панели — тем же кеглем, что у карточек документов (16 px полужирный). */}
            {/* Время — сразу слева от «X из N загружено» (Кирилл 2026-11-12; в RTL — справа, у начала строки). */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {timeLeft ? <p className="text-sm text-muted-foreground">{timeLeft}</p> : null}
              <p id="submit-progress" className="text-base font-semibold" aria-live="polite">
                {label}
              </p>
            </div>
            <SegmentedProgress segments={state.segments} tone={ready ? 'inverse' : 'default'} aria-labelledby="submit-progress" />
          </div>
        </div>
        {/* Колонка кнопки — на всю высоту панели: папка встаёт над кнопкой, наполовину выше верхнего края панели. */}
        <div className="relative flex shrink-0 items-end">
          {ready ? (
            <div className="absolute inset-x-0 -top-15 flex justify-center md:-top-16">
              <SubmitFolder />
            </div>
          ) : null}
          <Button
            type="button"
            className={cn('min-h-11 shrink-0', ready && 'bg-primary-foreground text-primary hover:bg-primary-foreground/90')}
            aria-busy={submit.isPending}
            onClick={onSend}
          >
            {submit.isPending ? <Spinner aria-label={t('documents.submit.sending')} /> : null}
            {t('documents.submit.cta')}
          </Button>
        </div>
      </div>
    </>
  );
}
