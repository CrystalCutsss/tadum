// Карточка документа (решения Кирилла 2026-11-09/10): отдельного экрана нет — всё здесь, без сворачивания.
// Основная карточка (решения Кирилла 2026-11-12): название и описание, справа на их уровне — круглая кнопка помощи
// (окно с видео, примером и ссылками на сервисы) и «Загрузить»; ниже — замечания, по левому краю текста.
// Нижняя серая панель: загруженные файлы одной белой таблицей без иконок (у файла с замечанием — точка с пульсом и текст),
// ошибки загрузки строками той же таблицы. Перетаскивания нет — загрузка только кнопкой.
// В документе несколько файлов, до MAX_FILES_PER_DOCUMENT; тот же файл не загружается — окно-предупреждение.
import { RiFileLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { documentRowMode, hasDocumentIssue, rejectReason } from '@/entities/document';
import { SameFileDialog, SourcePicker, useDocumentUpload, type UploadSource } from '@/features/upload-document';
import { MAX_FILES_PER_DOCUMENT, type Document } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
import { useOnline } from '@/shared/lib';
import { Badge, Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, PulseDot, StatusBadge, toast } from '@/shared/ui';

import { DocumentHelp, hasDocumentHelp } from './document-resources';
import { UploadTaskMessage, UploadTaskRow, UploadedFileRow } from './file-rows';

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
    onTooMany: (max) =>
      toast(t('upload.error.files_limit', { max: formatNumber(max) }), {
        position: 'top-center',
      }),
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
  const hasNotices = messages.length > 0;
  // Замечание к документу и предупреждения проверки (без повторов одного и того же текста) — в общей карточке.
  const issues = [
    ...(reasonText ? [{ id: reasonId, text: reasonText }] : []),
    ...[...new Map(warnings.map((w) => [w.key, { id: `warning-${doc.id}-${w.id}`, text: String(t(w.key as ParseKeys)) }])).values()],
  ];
  const hasFiles = doc.files.length > 0 || activeTasks.length > 0;

  const help = !archive && hasDocumentHelp(doc);
  // Справа — всегда «Загрузить», пока комплект можно менять (решения Кирилла 2026-11-12):
  // название не меняется после загрузки, бейджа «Загружен» в карточке нет; «Добавить файл» в панели больше не нужен.
  // Комплект отправлен — вместо кнопки статус документа (кроме архива принятых).
  const full = doc.files.length + activeTasks.length >= MAX_FILES_PER_DOCUMENT;
  const actionRow = editable ? (
    <Button
      type="button"
      // Синяя по умолчанию; серая — после первой успешной загрузки: документ «Загружен» или «Принят»
      // (Кирилл 2026-11-12). Замечание, предупреждение проверки или «Нужен новый файл» — снова синяя.
      variant={(doc.status === 'received' || doc.status === 'approved') && issues.length === 0 && !doc.files.some((f) => f.issue) ? 'secondary' : 'default'}
      className="min-h-11"
      disabled={!online || upload.busy || full}
      aria-describedby={issues.length > 0 ? issues.map((i) => i.id).join(' ') : undefined}
      onClick={() => setPicker({})}
    >
      {t('documents.row.upload')}
    </Button>
  ) : archive || action ? null : (
    <StatusBadge kind="document" status={doc.status} />
  );
  const hasPanel = hasFiles || hasNotices;

  return (
    <li id={`doc-${doc.portal_key}`} className="list-none scroll-mt-4">
      {/* Нижняя панель (решение Кирилла 2026-11-10): серый контейнер без обводки и отступов вокруг карточки,
          скругления те же, что у карточки; в нём — загруженные файлы одной белой таблицей. */}
      <div className="flex flex-col rounded-xl bg-secondary">
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground transition-shadow duration-base ease-standard md:p-4',
            highlighted && 'border-primary ring-2 ring-primary/30',
          )}
        >
          <Item className="flex-nowrap items-center rounded-none border-0 p-0">
            {/* Иконка документа — синяя на бледно-синей подложке, и на телефоне тоже (Кирилл 2026-11-12); есть замечание к документу или
                к его файлу — квадрат и иконка красные (2026-11-11, цвет — 2026-11-12). */}
            <ItemMedia
              variant="icon"
              className={cn(
                'flex size-10 self-center rounded-lg',
                issues.length > 0 || doc.files.some((f) => f.issue)
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-status-received-muted text-status-received',
              )}
            >
              <Icon icon={RiFileLine} />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-1">
              {/* Заголовок документа крупнее заголовков файлов — блоки в длинном списке не сливаются (Кирилл 2026-11-11). */}
              <ItemTitle className="flex-wrap text-base font-semibold">
                {title}
                {!doc.required ? (
                  <Badge variant="secondary" className="font-normal">
                    {t('document.optional')}
                  </Badge>
                ) : null}
              </ItemTitle>
              <ItemDescription className="line-clamp-none">{hint}</ItemDescription>
            </ItemContent>
            {/* Справа на уровне заголовка: круглая «Help» и «Upload» (или статус после отправки), и на телефоне — Кирилл 2026-11-12. */}
            {help || actionRow ? (
              <ItemActions className="ms-auto shrink-0 gap-2 self-center">
                {help ? <DocumentHelp doc={doc} title={title} /> : null}
                {actionRow}
              </ItemActions>
            ) : null}
          </Item>
          {/* Замечания ко всему документу и предупреждения проверки файла (решения Кирилла 2026-11-10/11/12): в общей карточке,
              под заголовком. Красная точка с пульсом (Кирилл 2026-11-12: как ошибка у поля) — сразу у текста, вся строка — по левому краю заголовка. */}
          {issues.length > 0 ? (
            <ul className="flex flex-col gap-1 ps-13.5">
              {issues.map((issue) => (
                <li key={issue.id} id={issue.id} className="flex items-start gap-2 text-sm text-destructive">
                  <span className="flex h-5 shrink-0 items-center">
                    <PulseDot tone="destructive" />
                  </span>
                  <span className="min-w-0">{issue.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Отступ до файлов сверху равен нижнему отступу панели (решение Кирилла 2026-11-10). */}
        {hasPanel ? (
          <div className="flex flex-col items-start gap-3 p-3 md:p-4">
            {hasFiles || hasNotices ? (
              // Файлы без иконок, все — в одном белом контейнере с разделителями, как таблица (Кирилл 2026-11-12).
              <ul className="flex w-full flex-col divide-y overflow-hidden rounded-lg bg-card" aria-label={t('documents.row.files', { title })}>
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
                {/* Ошибки загрузки — под файлами, строками той же таблицы (решение 2026-11-10). */}
                {messages.map((task) => (
                  <li key={task.key}>
                    <UploadTaskMessage task={task} onDismiss={() => upload.dismiss(task.key)} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <SourcePicker
        open={picker !== null}
        onOpenChange={(next) => !next && setPicker(null)}
        title={title}
        hint={hint}
        multiple={!picker?.replaceFileId}
        onPick={pick}
      />
      <SameFileDialog names={sameFiles} onClose={() => setSameFiles([])} onPickOther={() => setPicker({})} />
    </li>
  );
}
