// Помощь по документу в раскрытой строке (решения Кирилла 2026-11-09): видео (только на арабском, D-026),
// ссылки на сервисы, где получить документ, и пример — картинкой в модальном окне с крестиком (без просмотрщика PDF).
// Нет ассетов — блок не показывается (A10).
import { RiExternalLinkLine, RiFileSearchLine, RiPlayCircleLine } from '@remixicon/react';
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
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/shared/ui';

/** Видео из Google Drive открывается их встроенным плеером, свои файлы — тегом video. */
const isDrivePreview = (url: string) => url.startsWith('https://drive.google.com/');

export function DocumentResources({ doc, title }: { doc: Pick<Document, 'portal_key' | 'hint'>; title: string }) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'example' | 'video' | null>(null);
  // Ассеты из каталога, если бэкенд их не прислал (A-058).
  const image = exampleImageFor(doc.portal_key);
  const examplePdf = doc.hint.example_pdf_url ?? hintFor(doc.portal_key).example_pdf_url;
  const video = doc.hint.video_url?.ar ?? hintFor(doc.portal_key).video_url?.ar;
  const links = sourceLinksFor(doc.portal_key);
  if (!image && !examplePdf && !video && links.length === 0) return null;

  const openExample = () => {
    track('document_example_opened', { owner: 'client', portal_key: doc.portal_key });
    setView('example');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {video ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11"
          onClick={() => {
            track('document_video_opened', { owner: 'client', portal_key: doc.portal_key, lang_video: 'ar' });
            setView('video');
          }}
        >
          <Icon icon={RiPlayCircleLine} />
          {i18n.language === 'ar' ? t('documents.resources.video') : t('documents.resources.video_ar')}
        </Button>
      ) : null}
      {image ? (
        <Button type="button" variant="secondary" size="sm" className="min-h-11" onClick={openExample}>
          <Icon icon={RiFileSearchLine} />
          {t('documents.resources.example')}
        </Button>
      ) : examplePdf ? (
        // Пример только в PDF (без картинки) — открываем файл, свой просмотрщик не делаем.
        <Button asChild variant="secondary" size="sm" className="min-h-11">
          <a href={examplePdf} target="_blank" rel="noopener noreferrer" onClick={() => track('document_example_opened', { owner: 'client', portal_key: doc.portal_key })}>
            <Icon icon={RiFileSearchLine} />
            {t('documents.resources.example')}
          </a>
        </Button>
      ) : null}
      {links.map((link) => (
        <Button key={link.url} asChild variant="secondary" size="sm" className="min-h-11">
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <Icon icon={RiExternalLinkLine} />
            {t(link.label_key as ParseKeys)}
          </a>
        </Button>
      ))}

      <ResponsiveDialog open={view !== null} onOpenChange={(open) => !open && setView(null)}>
        <ResponsiveDialogContent closeLabel={t('common.close')} className="md:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {view === 'video' ? t('documents.resources.video_title') : t('documents.resources.example_title')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="px-4 pb-4 md:p-0">
            {view === 'video' && video ? (
              isDrivePreview(video) ? (
                <iframe
                  src={video}
                  title={t('documents.resources.video_title')}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="aspect-video w-full rounded-lg border-0 bg-muted"
                />
              ) : (
                <video src={video} controls playsInline className="aspect-video w-full rounded-lg bg-muted" />
              )
            ) : null}
            {view === 'example' && image ? (
              <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted md:max-h-160">
                <img src={image} alt={t('documents.resources.example_alt', { title })} className="w-full" />
              </div>
            ) : null}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
