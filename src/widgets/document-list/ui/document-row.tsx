// Строка документа (решения Кирилла 2026-11-09): отдельной карточки нет — всё здесь.
// Свёрнуто: название, короткое описание, справа либо статус, либо действие (бенчмарк № 03), «Загрузить» — прямо
// из строки (№ 02). Для «Нужен новый файл» — причина в 1–3 строки под описанием (SC-03).
// Раскрыто: причина полностью, видео, ссылки «где получить», пример, зона загрузки, файлы.
import { RiArrowDownSLine, RiErrorWarningLine, RiFileTextLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { documentRowMode, rejectReason } from '@/entities/document';
import { SourcePicker, UploadDropzone, useDocumentUpload, type UploadSource } from '@/features/upload-document';
import type { Document } from '@/shared/api';
import { useOnline } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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
} from '@/shared/ui';

import { DocumentResources } from './document-resources';
import { UploadTaskRow, UploadedFileRow } from './file-rows';

export interface DocumentRowProps {
  doc: Document;
  /** Комплект можно менять (не отправлен). */
  editable: boolean;
  defaultOpen?: boolean;
  /** Подсветка после попытки отправить с незагруженными документами (решение 2026-11-09). */
  highlighted?: boolean;
  onUploadingChange?: (portalKey: string, uploading: boolean) => void;
}

export function DocumentRow({ doc, editable, defaultOpen = false, highlighted = false, onUploadingChange }: DocumentRowProps) {
  const { t, i18n } = useTranslation();
  const online = useOnline();
  const [open, setOpen] = useState(defaultOpen);
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
    setOpen(true);
  };
  const pick = (files: File[], source: UploadSource) => accept(files, source, picker?.replaceFileId);
  const action = mode === 'upload' || mode === 'reupload';
  const busy = upload.busy;
  useEffect(() => onUploadingChange?.(doc.portal_key, busy), [busy, doc.portal_key, onUploadingChange]);

  return (
    <li id={`doc-${doc.portal_key}`} className="list-none scroll-mt-4">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn(
          'rounded-xl border bg-card text-card-foreground transition-shadow duration-base ease-standard',
          highlighted && 'border-primary ring-2 ring-primary/30',
        )}
      >
        {/* Кнопка и шеврон — по центру блока «заголовок + описание» (решение 2026-11-09). */}
        <Item className="flex-nowrap items-center rounded-xl border-0 p-3 md:p-4">
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
          <ItemActions className="shrink-0">
            {action ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={!online || upload.busy}
                aria-describedby={reasonText ? `${reasonId}-short` : undefined}
                onClick={() => setPicker({})}
              >
                {mode === 'reupload' ? t('documents.row.reupload') : t('documents.row.upload')}
              </Button>
            ) : (
              <span className="hidden sm:inline-flex">
                <StatusBadge kind="document" status={doc.status} />
              </span>
            )}
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 aria-expanded:bg-transparent hover:aria-expanded:bg-muted dark:hover:aria-expanded:bg-muted/50" aria-label={open ? t('documents.row.collapse', { title }) : t('documents.row.expand', { title })}>
                <Icon icon={RiArrowDownSLine} className={cn('transition-transform duration-base ease-standard', open && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
        </Item>
        {reasonText && !open ? (
          // SC-03: причина в 1–3 строки прямо в свёрнутой строке.
          <p id={`${reasonId}-short`} className="-mt-1 flex items-start gap-1 px-3 pb-3 text-sm text-status-rejected md:px-4 md:pb-4">
            <Icon icon={RiErrorWarningLine} className="mt-0.5 size-4 shrink-0" />
            <span className="line-clamp-3">{reasonText}</span>
          </p>
        ) : null}

        <CollapsibleContent className="flex flex-col gap-4 border-t p-3 md:p-4">
          {reasonText ? (
            <Alert id={reasonId} className="border-status-rejected/30 bg-status-rejected-muted text-status-rejected">
              <Icon icon={RiErrorWarningLine} />
              <AlertTitle>{t('documents.row.reason_title')}</AlertTitle>
              <AlertDescription className="text-status-rejected">{reasonText}</AlertDescription>
            </Alert>
          ) : null}

          <DocumentResources doc={doc} title={title} />

          {doc.files.length > 0 || tasks.length > 0 ? (
            <ul className="flex flex-col gap-2" aria-label={t('documents.row.files', { title })}>
              {doc.files.map((file) => (
                <li key={file.id}>
                  <UploadedFileRow doc={doc} file={file} editable={editable} onReplace={() => setPicker({ replaceFileId: file.id })} />
                </li>
              ))}
              {tasks.map((task) => (
                <li key={task.key}>
                  <UploadTaskRow task={task} onCancel={() => upload.cancel(task.key)} onDismiss={() => upload.dismiss(task.key)} />
                </li>
              ))}
            </ul>
          ) : null}
          {editable ? (
            <UploadDropzone
              disabled={!online}
              disabledHint={t('common.offline_actions_disabled')}
              onChoose={() => setPicker({})}
              onDropFiles={(files) => accept(files, 'files')}
            />
          ) : null}

        </CollapsibleContent>
      </Collapsible>

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
                  setOpen(true);
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
