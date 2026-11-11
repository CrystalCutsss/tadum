// Карточка документа (решения Кирилла 2026-11-09/10): отдельного экрана нет — всё здесь, без сворачивания.
// Основная карточка: название, описание и справа статус либо «Загрузить»; под описанием — замечание ко всему документу.
// Нижняя серая панель: загруженные файлы (белые карточки, у файла с замечанием — точка с пульсом и текст), под ними ошибки загрузки,
// затем «Добавить файл», видео, пример и ссылки на сервисы. Перетаскивания нет — загрузка только кнопкой.
// В документе несколько файлов, до MAX_FILES_PER_DOCUMENT; тот же файл не загружается — окно-предупреждение.
import { RiAddLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { documentRowMode, hasDocumentIssue, rejectReason } from '@/entities/document';
import { SameFileDialog, SourcePicker, useDocumentUpload, type UploadSource } from '@/features/upload-document';
import { MAX_FILES_PER_DOCUMENT, type Document } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
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
  PulseDot,
  StatusBadge,
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
  /** Архив принятых документов: без бейджа статуса и без видео, примера и ссылок на сервисы. */
  archive?: boolean;
  onUploadingChange?: (portalKey: string, uploading: boolean) => void;
}

export function DocumentRow({ doc, editable, highlighted = false, archive = false, onUploadingChange }: DocumentRowProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const online = useOnline();
  const [picker, setPicker] = useState<{ replaceFileId?: string } | null>(null);
  const [sameFiles, setSameFiles] = useState<string[]>([]);
  const upload = useDocumentUpload(doc, {
    onSameFile: (names) => setSameFiles(names),
    onTooMany: (max) => toast(t('upload.error.files_limit', { max: formatNumber(max) }), { position: 'top-center' }),
  });
  const mode = documentRowMode(doc, editable);
  const title: string = t(doc.hint.title_key as ParseKeys);
  const hint: string = t(doc.hint.hint_key as ParseKeys);
  // Замечание ко всему документу: причина с сервера; «Нужен новый файл» без причины и без замечаний к файлам — общий текст.
  const blockIssue = hasDocumentIssue(doc) || (doc.status === 'rejected' && !doc.files.some((f) => f.issue));
  const reason = blockIssue ? rejectReason(doc, lang) : null;
  const reasonText = reason ? (reason.kind === 'text' ? reason.text : String(t(reason.key as ParseKeys))) : null;
  const reasonId = `reason-${doc.id}`;
  // Готовые задачи исчезают: файл уже пришёл в doc.files после обновления комплекта.
  const tasks = upload.tasks.filter((task) => task.state !== 'done');

  const pick = (files: File[], source: UploadSource) => void upload.start(files, source, picker?.replaceFileId);
  const action = mode === 'upload' || mode === 'reupload';
  const busy = upload.busy;
  useEffect(() => onUploadingChange?.(doc.portal_key, busy), [busy, doc.portal_key, onUploadingChange]);

  const warnings = doc.files.flatMap((file) =>
    file.prevalidation.state === 'warning' && file.prevalidation.rule_keys[0] ? [{ id: file.id, key: file.prevalidation.rule_keys[0] }] : [],
  );
  const messages = tasks.filter((task) => task.state === 'failed' || task.state === 'cancelled');
  const activeTasks = tasks.filter((task) => task.state !== 'failed' && task.state !== 'cancelled');
  const hasNotices = warnings.length > 0 || messages.length > 0;
  const hasFiles = doc.files.length > 0 || activeTasks.length > 0;
  // Догрузить ещё файл, когда кнопки «Загрузить» в карточке нет (документ уже загружен).
  const canAddMore = editable && !action && doc.files.length + activeTasks.length < MAX_FILES_PER_DOCUMENT;

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
            {/* Есть замечание к документу или к его файлу — иконка документа оранжевая (Кирилл 2026-11-11). */}
            <ItemMedia variant="icon" className={cn('hidden sm:flex', (reasonText || doc.files.some((f) => f.issue)) && 'text-status-rejected')}>
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
              {action || archive ? null : (
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
              ) : archive ? null : (
                <span className="hidden sm:inline-flex">
                  <StatusBadge kind="document" status={doc.status} />
                </span>
              )}
            </ItemActions>
          </Item>
          {/* Замечание ко всему документу (решения Кирилла 2026-11-10/11): оранжевая точка с пульсом и оранжевый текст;
              точка — в колонке иконки документа, по центру первой строки, текст — в колонке названия. */}
          {reasonText ? (
            <Item id={reasonId} className="flex-nowrap items-start rounded-none border-0 p-0 text-status-rejected">
              <span className="flex h-5 w-4 shrink-0 items-center justify-center">
                <PulseDot />
              </span>
              <ItemContent className="min-w-0">
                <ItemDescription className="line-clamp-none text-status-rejected">{reasonText}</ItemDescription>
              </ItemContent>
            </Item>
          ) : null}
        </div>

        {/* Отступ до кнопок сверху равен нижнему отступу панели (решение Кирилла 2026-11-10). */}
        <div className="flex flex-col gap-3 p-3 empty:hidden md:gap-4 md:p-4">
          {hasFiles || hasNotices ? (
            <div className="flex flex-col gap-2">
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
              {/* Ошибки загрузки и предупреждения проверки — под файлами, в том же виде, что и файл (решение 2026-11-10). */}
              {hasNotices ? (
                <ul className="flex flex-col gap-2">
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
            </div>
          ) : null}
          {archive ? null : (
            <DocumentResources
              doc={doc}
              title={title}
              leading={
                canAddMore ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 hover:bg-card dark:hover:bg-card"
                    disabled={!online || upload.busy}
                    onClick={() => setPicker({})}
                  >
                    <Icon icon={RiAddLine} data-icon="inline-start" className="size-3.5" />
                    {t('documents.row.add_file')}
                  </Button>
                ) : null
              }
            />
          )}
        </div>
      </div>

      <SourcePicker open={picker !== null} onOpenChange={(next) => !next && setPicker(null)} title={title} hint={hint} multiple={!picker?.replaceFileId} onPick={pick} />
      <SameFileDialog names={sameFiles} onClose={() => setSameFiles([])} onPickOther={() => setPicker({})} />
    </li>
  );
}
