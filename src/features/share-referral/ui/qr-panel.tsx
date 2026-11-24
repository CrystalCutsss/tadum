// QR-код для магазина (SP-02 §1, A3; D-089): выдвижная панель с картинкой для печати и скачиванием PNG.
// Картинка — тот же PNG, что скачивается: тёмные модули на светлом фоне в обеих темах (SP-02 §3).
// Во встроенном браузере WhatsApp скачивание ненадёжно — вместо кнопки подсказка «удерживайте картинку».
import { RiDownloadLine } from '@remixicon/react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { isInAppBrowser } from '@/shared/lib';
import {
  Button,
  Icon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/shared/ui';

import { qrFileName, qrPngDataUrl } from '../model/referral';

export interface QrPanelProps {
  url: string;
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QrPanel({ url, slug, open, onOpenChange }: QrPanelProps) {
  const { t } = useTranslation();
  const png = useMemo(() => qrPngDataUrl(url), [url]);
  const iab = isInAppBrowser();
  useEffect(() => {
    if (open && iab) track('referral_qr_downloaded', { format: 'png', method: 'long_press_hint' });
  }, [open, iab]);
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent closeLabel={t('common.close')}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('referral.qr_title')}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t('referral.qr_hint')}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="flex flex-col items-center gap-4 pb-2">
            {png ? <img src={png} alt={t('referral.qr_alt', { url })} className="aspect-square w-full max-w-72 rounded-lg object-cover object-top ring-1 ring-border" /> : null}
            {iab ? (
              <p className="text-center text-sm text-muted-foreground" role="note">
                {t('referral.qr_long_press')}
              </p>
            ) : png ? (
              <Button asChild className="min-h-11 w-full sm:w-fit">
                <a href={png} download={qrFileName(slug)} onClick={() => track('referral_qr_downloaded', { format: 'png', method: 'download' })}>
                  <Icon icon={RiDownloadLine} />
                  {t('referral.qr_download')}
                </a>
              </Button>
            ) : null}
          </div>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
