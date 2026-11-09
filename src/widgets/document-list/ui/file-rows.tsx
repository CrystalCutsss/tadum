// Файлы документа: загруженные (с предупреждением предвалидации) и загружающиеся сейчас
// (в очереди → загрузка % → «Проверяем файл…» → ошибка с понятным текстом). Имена файлов — в bdi (латиница в арабском).
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from '@remixicon/react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { FileActions } from '@/features/manage-document-file';
import type { FileTask } from '@/features/upload-document';
import type { Document, FileAsset } from '@/shared/api';
import { formatFileSize, formatNumber } from '@/shared/i18n';
import { Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, Progress, RiFileTextLine, Spinner } from '@/shared/ui';

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
  const warning = file.prevalidation.state === 'warning' ? file.prevalidation.rule_keys[0] : undefined;
  return (
    <Item size="sm" variant="muted" className="flex-nowrap">
      <ItemMedia variant="icon">
        <Icon icon={RiFileTextLine} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <bdi className="truncate">{file.name}</bdi>
        </ItemTitle>
        {doc.status === 'rejected' ? (
          // SC-03: старый файл остаётся видимым с пометкой, без «галочки».
          <ItemDescription>{t('documents.file.previous', { size: formatFileSize(file.size_bytes, t) })}</ItemDescription>
        ) : (
          <ItemDescription className="flex items-center gap-1">
            <Icon icon={RiCheckLine} className="size-4 text-status-received" />
            {t('documents.file.uploaded', { size: formatFileSize(file.size_bytes, t) })}
          </ItemDescription>
        )}
        {warning ? (
          <p className="flex items-start gap-1 text-sm text-status-rejected">
            <Icon icon={RiErrorWarningLine} className="mt-0.5 size-4 shrink-0" />
            {t(warning as ParseKeys)}
          </p>
        ) : null}
      </ItemContent>
      <ItemActions>
        <FileActions documentId={doc.id} portalKey={doc.portal_key} status={doc.status} file={file} editable={editable} onReplace={onReplace} />
      </ItemActions>
    </Item>
  );
}

export function UploadTaskRow({ task, onCancel, onDismiss }: { task: FileTask; onCancel: () => void; onDismiss: () => void }) {
  const { t } = useTranslation();
  const active = task.state === 'queued' || task.state === 'uploading' || task.state === 'validating';
  const status =
    task.state === 'queued'
      ? t('upload.state.queued')
      : task.state === 'uploading'
        ? t('upload.state.uploading', { percent: formatNumber(task.percent) })
        : task.state === 'validating'
          ? t('upload.state.validating')
          : task.state === 'cancelled'
            ? t('upload.state.cancelled')
            : task.messageKey
              ? t(task.messageKey as ParseKeys, task.messageValues ?? {})
              : t('upload.error.server');
  return (
    <Item size="sm" variant="outline" className="flex-nowrap" aria-live="polite">
      <ItemMedia variant="icon">
        {task.state === 'validating' ? <Spinner aria-label={t('upload.state.validating')} /> : <Icon icon={task.state === 'failed' ? RiErrorWarningLine : RiFileTextLine} />}
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
