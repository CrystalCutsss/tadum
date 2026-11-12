// Отступ снизу = нижний отступ контента: 16 px на телефоне, 24 px (16 + поле контейнера inset) с md — панель
// не сдвигается, когда длина списка меняется (решение 2026-11-09).
// Плавающая панель отправки (решения Кирилла 2026-11-09): карточка шириной со строки документов, закреплена
// внизу колонки контента. Слева — «Загружено X из N» и прогресс, справа — «Отправить на проверку», по центру блока.
// Кнопка всегда активна: если что-то не загружено или не прошло проверку, нажатие показывает тост сверху,
// подсвечивает эти документы и прокручивает к верхнему из них (onBlocked). D-029: без диалога.
// Полоса — по сегменту на документ и на поле CR, рядом — примерное оставшееся время; подпись говорит, что осталось
// и про поле CR (решение Кирилла 2026-11-12).
// Всё загружено и номер CR введён (решения Кирилла 2026-11-10/12): панель не меняет высоту и не сдвигается — вместо
// «X из N загружено» появляется «всё готово» с пояснением, панель перекрашивается в активный синий (текст белый и светлый,
// кнопка белая). Папку с анимацией убрали (Кирилл 2026-11-12) — код сохранён в docs/assets/submit-folder/.
// Удалили файл — всё возвращается к обычному виду.
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
  const label = state.copy === 'cr_only' ? t('documents.progress_cr_only') : t('documents.progress', counts);
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
    <div
      data-ready={ready}
      className={cn(
        'sticky bottom-4 z-10 mt-auto flex flex-col gap-5 rounded-xl border p-3 shadow-md transition-colors duration-slow ease-standard sm:flex-row sm:items-stretch sm:gap-4 md:bottom-6 md:p-4',
        ready ? 'border-transparent bg-metal-deep text-primary-foreground' : 'bg-card text-card-foreground',
      )}
    >
      {/* Содержимое прижато к низу: нижний край полосы прогресса совпадает с нижним краем кнопки (Кирилл 2026-11-12). */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 max-sm:items-center max-sm:gap-4 max-sm:text-center sm:justify-end">
        <p className="sr-only" aria-live="polite">
          {ready ? `${t('documents.submit.ready_title')}. ${t('documents.submit.ready_body')}` : ''}
        </p>
        {/* Оба состояния текста — в одной ячейке сетки, прижаты к низу (Кирилл 2026-11-12): при смене состояния панель
              и полоса прогресса не сдвигаются, а нижняя строка пояснения «всё готово» встаёт на место строки
              «X из N загружено · примерно N мин». Высота панели — по большему из двух состояний. */}
        <div className="grid w-full items-end *:col-start-1 *:row-start-1">
          {/* Время — сразу справа от «X из N загружено» (в RTL — слева, после подписи); нижние края строк совпадают. */}
          <div
            aria-hidden={ready}
            className={cn(
              'flex flex-wrap items-end gap-x-2 gap-y-0.5 transition-opacity duration-slow ease-standard max-sm:justify-center',
              ready ? 'invisible opacity-0' : 'opacity-100',
            )}
          >
            {/* Заголовок панели — тем же кеглем, что у карточек документов (16 px полужирный). */}
            <p id="submit-progress" className="text-base font-semibold">
              {label}
            </p>
            {timeLeft ? <p className="text-sm text-muted-foreground">{timeLeft}</p> : null}
          </div>
          {/* Всё готово: вместо «7 из 7 загружено» — крупный заголовок и пояснение (на всех размерах). */}
          <div
            aria-hidden={!ready}
            className={cn('flex flex-col gap-1 transition-opacity duration-slow ease-standard', ready ? 'opacity-100' : 'invisible opacity-0')}
          >
            <p className="text-xl font-semibold">{t('documents.submit.ready_title')}</p>
            <p className="text-sm text-primary-foreground/80">{t('documents.submit.ready_body')}</p>
          </div>
        </div>
        {/* Сегменты ниже, чем у компонента по умолчанию (Кирилл 2026-11-12: «ещё немного уменьши»). */}
        <SegmentedProgress className="*:h-1.5" segments={state.segments} tone={ready ? 'inverse' : 'default'} aria-labelledby="submit-progress" />
      </div>
      {/* С 640 px колонка кнопки — на всю высоту панели, кнопка прижата к низу. */}
      <div className="relative flex shrink-0 flex-col sm:flex-row sm:items-end">
        <Button
          type="button"
          // Серая по умолчанию, белая на синей панели «всё готово» (Кирилл 2026-11-12); на телефоне — на всю ширину и крупнее.
          variant={ready ? 'default' : 'secondary'}
          className={cn(
            'min-h-11 w-full shrink-0 max-sm:min-h-12 max-sm:text-base sm:w-auto',
            ready && 'bg-primary-inverse text-primary-inverse-foreground transition-opacity hover:bg-primary-inverse hover:opacity-85',
          )}
          aria-busy={submit.isPending}
          onClick={onSend}
        >
          {submit.isPending ? <Spinner aria-label={t('documents.submit.sending')} /> : null}
          {t('documents.submit.cta')}
        </Button>
      </div>
    </div>
  );
}
