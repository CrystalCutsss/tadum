// Файлы документа: загруженные (с предупреждением предвалидации) и загружающиеся сейчас
// (в очереди → загрузка % → «Проверяем файл…» → ошибка с понятным текстом). Имена файлов — в bdi (латиница в арабском).
import { RiCloseLine, RiErrorWarningLine, RiFileLine } from '@remixicon/react';
import { cn } from 'cn';
import type { ParseKeys, TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FileActions } from '@/features/manage-document-file';
import type { FileTask } from '@/features/upload-document';
import type { Document, FileAsset } from '@/shared/api';
import { formatFileSize, formatNumber } from '@/shared/i18n';
import { Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, Progress, Spinner } from '@/shared/ui';

// Иконка файла — в сером квадрате по центру строки, иконка документа как в сайдбаре (решение Кирилла 2026-11-10).
const FILE_MEDIA =
  'size-10 rounded-lg bg-muted group-has-data-[slot=item-description]/item:translate-y-0 group-has-data-[slot=item-description]/item:self-center';

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
  const { t } = useTranslation();
  // Предупреждение предвалидации показывается в основной карточке документа (решение 2026-11-10).
  return (
    <Item size="sm" className="flex-nowrap items-center border-0 bg-card">
      <ItemMedia variant="icon" className={FILE_MEDIA}>
        <Icon icon={RiFileLine} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <bdi className="truncate">{file.name}</bdi>
        </ItemTitle>
        {doc.status === 'rejected' ? (
          // SC-03: старый файл остаётся видимым с пометкой, без «галочки».
          <ItemDescription>{t('documents.file.previous', { size: formatFileSize(file.size_bytes, t) })}</ItemDescription>
        ) : (
          // Только размер, без «Uploaded» и галочки (решение Кирилла 2026-11-10).
          <ItemDescription>{formatFileSize(file.size_bytes, t)}</ItemDescription>
        )}
      </ItemContent>
      <ItemActions>
        <FileActions documentId={doc.id} portalKey={doc.portal_key} status={doc.status} file={file} editable={editable} onReplace={onReplace} />
      </ItemActions>
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
 * Ошибка в нижней панели карточки: под загруженным файлом, в том же виде, что и файл — иконка в квадрате
 * по центру строки (решение Кирилла 2026-11-10). Тона — «нужно внимание» (status-rejected), не destructive.
 */
export function ErrorNotice({ id, title, text, action }: { id?: string; title?: ReactNode; text: ReactNode; action?: ReactNode }) {
  return (
    <Item id={id} size="sm" className="flex-nowrap items-center border-0 bg-status-rejected-muted text-status-rejected">
      <ItemMedia variant="icon" className={cn(FILE_MEDIA, 'bg-card')}>
        <Icon icon={RiErrorWarningLine} />
      </ItemMedia>
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
        <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 text-status-rejected" aria-label={t('upload.dismiss', { name: task.name })} onClick={onDismiss}>
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
    <Item size="sm" className="flex-nowrap items-center border-0 bg-card" aria-live="polite">
      <ItemMedia variant="icon" className={FILE_MEDIA}>
        {task.state === 'validating' ? <Spinner aria-label={t('upload.state.validating')} /> : <Icon icon={task.state === 'failed' ? RiErrorWarningLine : RiFileLine} />}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <bdi className="truncate">{task.name}</bdi>
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
