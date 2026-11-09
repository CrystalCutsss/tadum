// Помощь по документу в раскрытой строке (решение Кирилла 2026-11-09): видео (только на арабском, D-026),
// ссылки на сервисы, где получить документ, и пример в модальном окне. Нет ассетов — блок не показывается (A10).
import { RiExternalLinkLine, RiFileSearchLine, RiPlayCircleLine } from '@remixicon/react';
import { useState } from 'react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { hintFor, sourceLinksFor } from '@/entities/document';
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

export function DocumentResources({ doc, title }: { doc: Pick<Document, 'portal_key' | 'hint'>; title: string }) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'example' | 'video' | null>(null);
  // Ассеты из каталога, если бэкенд их не прислал (A-058).
  const catalog = hintFor(doc.portal_key);
  const example = doc.hint.example_pdf_url ?? catalog.example_pdf_url;
  const video = doc.hint.video_url?.ar ?? catalog.video_url?.ar;
  const links = sourceLinksFor(doc.portal_key);
  if (!example && !video && links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {video ? (
        <Button
          type="button"
          variant="outline"
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
      {example ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => {
            track('document_example_opened', { owner: 'client', portal_key: doc.portal_key });
            setView('example');
          }}
        >
          <Icon icon={RiFileSearchLine} />
          {t('documents.resources.example')}
        </Button>
      ) : null}
      {links.map((link) => (
        <Button key={link.url} asChild variant="outline" size="sm" className="min-h-11">
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <Icon icon={RiExternalLinkLine} />
            {t(link.label_key as ParseKeys)}
          </a>
        </Button>
      ))}

      <ResponsiveDialog open={view !== null} onOpenChange={(open) => !open && setView(null)}>
        <ResponsiveDialogContent closeLabel={t('common.close')} className="md:max-w-3xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {view === 'video' ? t('documents.resources.video_title') : t('documents.resources.example_title')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex flex-col gap-3 px-4 pb-4 md:p-0">
            {view === 'video' && video ? (
              <video src={video} controls playsInline className="aspect-video w-full rounded-lg bg-muted" />
            ) : null}
            {view === 'example' && example ? (
              <>
                {/* Встроенный просмотр PDF есть не везде (встроенный браузер WhatsApp) — рядом прямая ссылка. */}
                <object data={example} type="application/pdf" className="aspect-3/4 max-h-svh w-full rounded-lg border bg-muted" aria-label={title}>
                  <p className="p-4 text-sm text-muted-foreground">{t('documents.resources.example_fallback')}</p>
                </object>
                <Button asChild variant="link" className="self-start px-0">
                  <a href={example} target="_blank" rel="noopener noreferrer">
                    {t('documents.resources.example_open')}
                  </a>
                </Button>
              </>
            ) : null}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
