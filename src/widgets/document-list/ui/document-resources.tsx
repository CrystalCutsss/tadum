// Помощь по документу в раскрытой строке (решения Кирилла 2026-11-09): видео (только на арабском, D-026),
// ссылки на сервисы, где получить документ, и пример — картинкой в модальном окне с крестиком (без просмотрщика PDF).
// Нет ассетов — блок не показывается (A10).
import { RiFileLine } from '@remixicon/react';
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
  RiPlayCircleLine,
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

export function DocumentResources({ doc, title }: { doc: Pick<Document, 'portal_key' | 'hint'>; title: string }) {
  const { t } = useTranslation();
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
          {t('documents.resources.video')}
        </Button>
      ) : null}
      {image ? (
        <Button type="button" variant="secondary" size="sm" className="min-h-11" onClick={openExample}>
          <Icon icon={RiFileLine} />
          {t('documents.resources.example')}
        </Button>
      ) : examplePdf ? (
        // Пример только в PDF (без картинки) — открываем файл, свой просмотрщик не делаем.
        <Button asChild variant="secondary" size="sm" className="min-h-11">
          <a href={examplePdf} target="_blank" rel="noopener noreferrer" onClick={() => track('document_example_opened', { owner: 'client', portal_key: doc.portal_key })}>
            <Icon icon={RiFileLine} />
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
        {/* Пример — окно почти на всю высоту, чтобы документ помещался (Кирилл 2026-11-09); видео — обычный размер. */}
        <ResponsiveDialogContent closeLabel={t('common.close')} size={view === 'example' ? 'tall' : 'default'} className="md:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {view === 'video' ? t('documents.resources.video_title') : t('documents.resources.example_title')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          {view === 'video' && video ? (
            <div className="px-4 pb-4 md:p-0">
              {isDrivePreview(video) ? (
                <DrivePlayer src={video} title={t('documents.resources.video_title')} playLabel={t('documents.resources.play')} />
              ) : (
                <video src={video} controls playsInline className="aspect-video w-full cursor-pointer rounded-lg bg-muted" />
              )}
            </div>
          ) : null}
          {view === 'example' && image ? (
            <ResponsiveDialogBody>
              <img src={image} alt={t('documents.resources.example_alt', { title })} className="w-full rounded-lg border bg-muted" />
            </ResponsiveDialogBody>
          ) : null}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
