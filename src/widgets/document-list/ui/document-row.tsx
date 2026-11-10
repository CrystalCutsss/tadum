// Карточка документа (решения Кирилла 2026-11-09/10): отдельного экрана нет — всё здесь, без сворачивания.
// Основная карточка: название, описание и справа статус либо «Загрузить».
// Нижняя серая панель: загруженный файл (белая карточка), под ним ошибки, затем видео и пример слева, ссылки на сервисы справа.
// Перетаскивания нет — загрузка только кнопкой в карточке.
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { documentRowMode, rejectReason } from '@/entities/document';
import { SourcePicker, useDocumentUpload, type UploadSource } from '@/features/upload-document';
import type { Document } from '@/shared/api';
import { useOnline } from '@/shared/lib';
import {
  Badge,
  Button,
  Icon,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  StatusBadge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
  RiFileTextLine,
} from '@/shared/ui';

import { DocumentResources } from './document-resources';
import { ErrorNotice, UploadTaskMessage, UploadTaskRow, UploadedFileRow } from './file-rows';

export interface DocumentRowProps {
  doc: Document;
  /** Комплект можно менять (не отправлен). */
  editable: boolean;
  /** Подсветка после попытки отправить с незагруженными документами (решение 2026-11-09). */
  highlighted?: boolean;
  onUploadingChange?: (portalKey: string, uploading: boolean) => void;
}

export function DocumentRow({ doc, editable, highlighted = false, onUploadingChange }: DocumentRowProps) {
  const { t, i18n } = useTranslation();
  const online = useOnline();
  const [picker, setPicker] = useState<{ replaceFileId?: string } | null>(null);
  const upload = useDocumentUpload(doc);
  const mode = documentRowMode(doc, editable);
  const title: string = t(doc.hint.title_key as ParseKeys);
  const hint: string = t(doc.hint.hint_key as ParseKeys);
  const reason = doc.status === 'rejected' ? rejectReason(doc, i18n.language === 'ar' ? 'ar' : 'en') : null;
  const reasonText = reason ? (reason.kind === 'text' ? reason.text : String(t(reason.key as ParseKeys))) : null;
  const reasonId = `reason-${doc.id}`;
  // Готовые задачи исчезают: файл уже пришёл в doc.files после обновления комплекта.
  const tasks = upload.tasks.filter((task) => task.state !== 'done');

  // Один файл на документ (решение Кирилла 2026-11-09): несколько сразу — тост; уже есть файл — спросить про замену.
  const [confirmReplace, setConfirmReplace] = useState<{ file: File; source: UploadSource } | null>(null);
  const accept = (files: File[], source: UploadSource, replaceFileId?: string) => {
    const [file] = files;
    if (!file) return;
    if (files.length > 1) {
      toast(t('upload.error.one_file'), { position: 'top-center' });
      return;
    }
    const existing = doc.files[0];
    if (!replaceFileId && existing) {
      setConfirmReplace({ file, source });
      return;
    }
    upload.start([file], source, replaceFileId);
  };
  const pick = (files: File[], source: UploadSource) => accept(files, source, picker?.replaceFileId);
  const action = mode === 'upload' || mode === 'reupload';
  const busy = upload.busy;
  useEffect(() => onUploadingChange?.(doc.portal_key, busy), [busy, doc.portal_key, onUploadingChange]);

  const warnings = doc.files.flatMap((file) =>
    file.prevalidation.state === 'warning' && file.prevalidation.rule_keys[0] ? [{ id: file.id, key: file.prevalidation.rule_keys[0] }] : [],
  );
  const messages = tasks.filter((task) => task.state === 'failed' || task.state === 'cancelled');
  const activeTasks = tasks.filter((task) => task.state !== 'failed' && task.state !== 'cancelled');
  const hasNotices = Boolean(reasonText) || warnings.length > 0 || messages.length > 0;
  const hasFiles = doc.files.length > 0 || activeTasks.length > 0;

  return (
    <li id={`doc-${doc.portal_key}`} className="list-none scroll-mt-4">
      {/* Нижняя панель (решение Кирилла 2026-11-10): серый контейнер без обводки и отступов вокруг карточки,
          скругления те же, что у карточки; в нём — загруженные файлы, видео, пример и ссылки на сервисы. */}
      <div className="flex flex-col rounded-xl bg-secondary">
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground transition-shadow duration-base ease-standard md:p-4',
            highlighted && 'border-primary ring-2 ring-primary/30',
          )}
        >
          {/* Кнопка — по центру блока «заголовок + описание», у правого края (решение 2026-11-10). */}
          <Item className="flex-nowrap items-center rounded-none border-0 p-0">
            <ItemMedia variant="icon" className="hidden sm:flex">
              <Icon icon={RiFileTextLine} />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-1">
              <ItemTitle className="flex-wrap">
                {title}
                {!doc.required ? (
                  <Badge variant="secondary" className="font-normal">
                    {t('document.optional')}
                  </Badge>
                ) : null}
              </ItemTitle>
              <ItemDescription className="line-clamp-none">{hint}</ItemDescription>
              {action ? null : (
                <div className="mt-1 sm:hidden">
                  <StatusBadge kind="document" status={doc.status} />
                </div>
              )}
            </ItemContent>
            <ItemActions className="ms-auto shrink-0">
              {action ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  disabled={!online || upload.busy}
                  aria-describedby={reasonText ? reasonId : undefined}
                  onClick={() => setPicker({})}
                >
                  {mode === 'reupload' ? t('documents.row.reupload') : t('documents.row.upload')}
                </Button>
              ) : (
                <span className="hidden sm:inline-flex">
                  <StatusBadge kind="document" status={doc.status} />
                </span>
              )}
            </ItemActions>
          </Item>
        </div>

        <div className="flex flex-col gap-2 p-3 empty:hidden md:p-4">
          {hasFiles ? (
            <ul className="flex flex-col gap-2" aria-label={t('documents.row.files', { title })}>
              {doc.files.map((file) => (
                <li key={file.id}>
                  <UploadedFileRow doc={doc} file={file} editable={editable} onReplace={() => setPicker({ replaceFileId: file.id })} />
                </li>
              ))}
              {activeTasks.map((task) => (
                <li key={task.key}>
                  <UploadTaskRow task={task} onCancel={() => upload.cancel(task.key)} onDismiss={() => upload.dismiss(task.key)} />
                </li>
              ))}
            </ul>
          ) : null}
          {/* Ошибки и «нужен новый файл» — под загруженным файлом, в том же виде, что и файл (решение 2026-11-10). */}
          {hasNotices ? (
            <ul className="flex flex-col gap-2">
              {reasonText ? (
                <li>
                  <ErrorNotice id={reasonId} title={t('documents.row.reason_title')} text={reasonText} />
                </li>
              ) : null}
              {warnings.map((warning) => (
                <li key={warning.id}>
                  <ErrorNotice text={t(warning.key as ParseKeys)} />
                </li>
              ))}
              {messages.map((task) => (
                <li key={task.key}>
                  <UploadTaskMessage task={task} onDismiss={() => upload.dismiss(task.key)} />
                </li>
              ))}
            </ul>
          ) : null}
          <DocumentResources doc={doc} title={title} />
        </div>
      </div>

      <SourcePicker
        open={picker !== null}
        onOpenChange={(next) => !next && setPicker(null)}
        title={title}
        hint={hint}
        multiple={false}
        onPick={pick}
      />

      <AlertDialog open={confirmReplace !== null} onOpenChange={(next) => !next && setConfirmReplace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.file.replace_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('documents.file.replace_body', { name: doc.files[0]?.name ?? '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const pending = confirmReplace;
                const existing = doc.files[0];
                setConfirmReplace(null);
                if (pending && existing) {
                  upload.start([pending.file], pending.source, existing.id);
                }
              }}
            >
              {t('documents.file.replace_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
