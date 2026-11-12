// Файлы документа: загруженные (с замечанием проверяющего — точка с пульсом и текст под файлом) и загружающиеся сейчас
// (в очереди → загрузка % → «Проверяем файл…» → ошибка с понятным текстом). Имена файлов — в bdi (латиница в арабском).
import { RiCloseLine } from '@remixicon/react';
import { cn } from 'cn';
import type { ParseKeys, TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FileActions } from '@/features/manage-document-file';
import type { FileTask } from '@/features/upload-document';
import type { Document, FileAsset } from '@/shared/api';
import { formatFileSize, formatNumber } from '@/shared/i18n';
import { fileIssueReason } from '@/entities/document';
import { Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle, Progress, PulseDot, Spinner } from '@/shared/ui';

// Строка таблицы файлов (Кирилл 2026-11-12): без иконки и без своего фона — белый контейнер и разделители даёт список.
const ROW = 'rounded-none border-0';

export function UploadedFileRow({
  doc,
  file,
  editable,
  onReplace,
}: {
  doc: Pick<Document, 'id' | 'portal_key' | 'status'>;
  file: FileAsset;
  editable: boolean;
  onReplace: () => void;
}) {
  const { t, i18n } = useTranslation();
  const issue = file.issue;
  const reason = issue ? fileIssueReason(issue, i18n.language === 'ar' ? 'ar' : 'en') : null;
  const reasonText = reason ? (reason.kind === 'text' ? reason.text : String(t(reason.key as ParseKeys))) : null;
  const reasonId = `issue-${file.id}`;
  // Замечание к файлу (решение Кирилла 2026-11-11): как у всего документа — оранжевая точка с пульсом и оранжевый текст
  // под строкой файла; иконки у файлов нет (2026-11-12).
  return (
    <Item size="sm" className={cn(ROW, 'items-center', reasonText ? 'flex-wrap' : 'flex-nowrap')} aria-describedby={reasonText ? reasonId : undefined}>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <bdi className="truncate">{file.name}</bdi>
        </ItemTitle>
        {/* Только размер файла, без подписей статуса (решения Кирилла 2026-11-10). */}
        <ItemDescription>{formatFileSize(file.size_bytes, t)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <FileActions documentId={doc.id} portalKey={doc.portal_key} status={doc.status} file={file} editable={editable} onReplace={onReplace} />
      </ItemActions>
      {reasonText ? (
        <ItemFooter id={reasonId} className="items-start justify-start gap-2 text-sm text-status-rejected">
          {/* Точка — по центру первой строки текста, у левого края имени файла. */}
          <span className="flex h-5 shrink-0 items-center">
            <PulseDot />
          </span>
          <span className="min-w-0">{reasonText}</span>
        </ItemFooter>
      ) : null}
    </Item>
  );
}

function taskStatus(task: FileTask, t: TFunction): string {
  return task.state === 'queued'
    ? t('upload.state.queued')
    : task.state === 'uploading'
      ? t('upload.state.uploading', { percent: formatNumber(task.percent) })
      : task.state === 'validating'
        ? t('upload.state.validating')
        : task.state === 'cancelled'
          ? t('upload.state.cancelled')
          : task.messageKey
            ? String(t(task.messageKey as ParseKeys, task.messageValues ?? {}))
            : t('upload.error.server');
}

/**
 * Ошибка в нижней панели карточки: строкой таблицы файлов, под загруженными файлами; без иконки, как файл
 * (Кирилл 2026-11-12), — оранжевая точка с пульсом и текст. Тона — «нужно внимание» (status-rejected), не destructive.
 */
export function ErrorNotice({ id, title, text, action }: { id?: string; title?: ReactNode; text: ReactNode; action?: ReactNode }) {
  return (
    <Item id={id} size="sm" className={cn(ROW, 'flex-nowrap items-center gap-2 text-status-rejected')}>
      <span className="flex h-5 shrink-0 items-center self-start">
        <PulseDot />
      </span>
      <ItemContent className="min-w-0">
        {title ? <ItemTitle>{title}</ItemTitle> : null}
        <ItemDescription className="line-clamp-none text-status-rejected">{text}</ItemDescription>
      </ItemContent>
      {action ? <ItemActions>{action}</ItemActions> : null}
    </Item>
  );
}

/** Ошибка или отмена загрузки — то же сообщение, с кнопкой «скрыть». */
export function UploadTaskMessage({ task, onDismiss }: { task: FileTask; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <ErrorNotice
      title={<bdi className="truncate">{task.name}</bdi>}
      text={taskStatus(task, t)}
      action={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 text-status-rejected"
          aria-label={t('upload.dismiss', { name: task.name })}
          onClick={onDismiss}
        >
          <Icon icon={RiCloseLine} />
        </Button>
      }
    />
  );
}

export function UploadTaskRow({ task, onCancel, onDismiss }: { task: FileTask; onCancel: () => void; onDismiss: () => void }) {
  const { t } = useTranslation();
  const active = task.state === 'queued' || task.state === 'uploading' || task.state === 'validating';
  const status = taskStatus(task, t);
  return (
    <Item size="sm" className={cn(ROW, 'flex-nowrap items-center')} aria-live="polite">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <bdi className="truncate">{task.name}</bdi>
          {task.state === 'validating' ? <Spinner aria-label={t('upload.state.validating')} /> : null}
        </ItemTitle>
        <ItemDescription className={task.state === 'failed' ? 'text-status-rejected' : undefined}>{status}</ItemDescription>
        {task.state === 'uploading' || task.state === 'queued' ? (
          <Progress value={task.percent} className="h-1.5" aria-label={t('upload.state.progress_label', { name: task.name })} />
        ) : null}
      </ItemContent>
      <ItemActions>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label={active ? t('upload.cancel', { name: task.name }) : t('upload.dismiss', { name: task.name })}
          onClick={active ? onCancel : onDismiss}
        >
          <Icon icon={RiCloseLine} />
        </Button>
      </ItemActions>
    </Item>
  );
}
