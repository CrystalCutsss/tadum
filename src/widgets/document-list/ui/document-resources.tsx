// Помощь по документу (решение Кирилла 2026-11-12): вместо ряда кнопок «How to get it», «See an example» и ссылок
// на сервисы — одна небольшая кнопка на уровне заголовка и описания карточки. Она открывает окно с табами
// «How to get it» (видео, только на арабском, D-026) и «See an example» (картинка; пример только в PDF — ссылка на файл);
// под табами — ссылки на внешние сервисы, где получить документ. Нет ассетов — кнопки нет (A10).
import type { ParseKeys } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { exampleImageFor, hintFor, sourceLinksFor } from '@/entities/document';
import { track } from '@/shared/analytics';
import type { Document } from '@/shared/api';
import {
  Button,
  Icon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  RiExternalLinkLine,
  RiFileTextLine,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';

/**
 * Плеер Google Drive в iframe: курсор внутри чужого iframe задать нельзя, поэтому до первого нажатия поверх плеера —
 * прозрачная кнопка на всю площадь с курсором pointer (решение Кирилла 2026-11-09). После нажатия кнопка убирается,
 * управление переходит плееру Drive.
 */
function DrivePlayer({ src, title, playLabel }: { src: string; title: string; playLabel: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
      <iframe src={src} title={title} allow="autoplay; fullscreen" allowFullScreen className="size-full border-0" />
      {active ? null : (
        <button type="button" aria-label={playLabel} onClick={() => setActive(true)} className="absolute inset-0 cursor-pointer bg-transparent" />
      )}
    </div>
  );
}

/** Видео из Google Drive открывается их встроенным плеером, свои файлы — тегом video. */
const isDrivePreview = (url: string) => url.startsWith('https://drive.google.com/');

type HelpTab = 'video' | 'example';

/** Есть ли что показать в окне помощи — без этого кнопки в карточке нет. */
export function hasDocumentHelp(doc: Pick<Document, 'portal_key' | 'hint'>): boolean {
  return Boolean(
    exampleImageFor(doc.portal_key) ||
    (doc.hint.example_pdf_url ?? hintFor(doc.portal_key).example_pdf_url) ||
    (doc.hint.video_url?.ar ?? hintFor(doc.portal_key).video_url?.ar) ||
    sourceLinksFor(doc.portal_key).length > 0,
  );
}

export function DocumentHelp({ doc, title }: { doc: Pick<Document, 'portal_key' | 'hint'>; title: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Ассеты из каталога, если бэкенд их не прислал (A-058).
  const image = exampleImageFor(doc.portal_key);
  const examplePdf = doc.hint.example_pdf_url ?? hintFor(doc.portal_key).example_pdf_url;
  const video = doc.hint.video_url?.ar ?? hintFor(doc.portal_key).video_url?.ar;
  const links = sourceLinksFor(doc.portal_key);
  const tabs: HelpTab[] = [...(video ? (['video'] as const) : []), ...(image || examplePdf ? (['example'] as const) : [])];
  const [tab, setTab] = useState<HelpTab>(tabs[0] ?? 'video');
  if (tabs.length === 0 && links.length === 0) return null;

  const select = (next: HelpTab) => {
    setTab(next);
    if (next === 'video')
      track('document_video_opened', {
        owner: 'client',
        portal_key: doc.portal_key,
        lang_video: 'ar',
      });
    else
      track('document_example_opened', {
        owner: 'client',
        portal_key: doc.portal_key,
      });
  };
  const openHelp = () => {
    setOpen(true);
    if (tabs[0]) select(tabs[0]);
  };

  const videoPanel = video ? (
    isDrivePreview(video) ? (
      <DrivePlayer src={video} title={t('documents.resources.video_title')} playLabel={t('documents.resources.play')} />
    ) : (
      <video src={video} controls playsInline className="aspect-video w-full cursor-pointer rounded-lg bg-muted" />
    )
  ) : null;
  const examplePanel = image ? (
    <img src={image} alt={t('documents.resources.example_alt', { title })} className="w-full rounded-lg border bg-muted" />
  ) : examplePdf ? (
    // Пример только в PDF (без картинки) — открываем файл, свой просмотрщик не делаем.
    <Button asChild variant="secondary" className="min-h-11">
      <a href={examplePdf} target="_blank" rel="noopener noreferrer">
        <Icon icon={RiFileTextLine} data-icon="inline-start" />
        {t('documents.resources.example_pdf')}
      </a>
    </Button>
  ) : null;

  return (
    <>
      {/* Размер sm дизайн-системы, как у прежней «How to get it», без иконки (решения Кирилла 2026-11-12). */}
      <Button type="button" variant="secondary" size="sm" className="shrink-0" aria-label={t('documents.resources.open_label', { title })} onClick={openHelp}>
        {t('documents.resources.open')}
      </Button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        {/* Пример — окно почти на всю высоту, чтобы документ помещался (Кирилл 2026-11-09). */}
        <ResponsiveDialogContent closeLabel={t('common.close')} size={tab === 'example' && image ? 'tall' : 'default'} className="md:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t('documents.resources.dialog_description')}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="flex flex-col gap-4">
            {tabs.length > 0 ? (
              <Tabs value={tab} onValueChange={(next) => select(next as HelpTab)} className="gap-3">
                {tabs.length > 1 ? (
                  <TabsList className="w-full">
                    <TabsTrigger value="video">{t('documents.resources.video')}</TabsTrigger>
                    <TabsTrigger value="example">{t('documents.resources.example')}</TabsTrigger>
                  </TabsList>
                ) : null}
                {videoPanel ? <TabsContent value="video">{videoPanel}</TabsContent> : null}
                {examplePanel ? <TabsContent value="example">{examplePanel}</TabsContent> : null}
              </Tabs>
            ) : null}
            {/* Ссылки на сервисы, где получить документ, — в том же окне (решение Кирилла 2026-11-12). */}
            {links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <Button key={link.url} asChild variant="outline" className="min-h-11">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Icon icon={RiExternalLinkLine} data-icon="inline-start" />
                      {t(link.label_key as ParseKeys)}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
