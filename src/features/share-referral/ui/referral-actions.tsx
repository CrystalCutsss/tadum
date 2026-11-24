// Реферальная ссылка и действия с ней (SP-02 §1, D-089): поле со ссылкой и копированием, «Поделиться в WhatsApp»,
// «QR-код для магазина» (выдвижная панель грузится лениво — библиотека QR не попадает в первый чанк).
import { RiCheckLine, RiFileCopyLine, RiQrCodeLine, RiWhatsappLine } from '@remixicon/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { Button, Icon, Ltr, toast } from '@/shared/ui';

import { copyText, shareLink, shareMessage } from '../model/referral';

const QrPanel = lazy(() => import('./qr-panel'));

/** Подпись «Скопировано» держится 2 с (SP-02 §1). */
const COPIED_FOR = 2000;

export interface ReferralActionsProps {
  url: string;
  slug: string;
  supplierName: string;
  /** Откуда действие — для событий (решение Кирилла 2026-11-24: только home и referral). */
  source: 'home' | 'referral';
}

export function ReferralActions({ url, slug, supplierName, source }: ReferralActionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const linkRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onCopy() {
    if (await copyText(url)) {
      // «Скопировано» — тостом (Кирилл 2026-11-24); иконка на кнопке на 2 с меняется на галочку.
      toast(t('referral.copied'));
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
      track('referral_link_copied', { source, method: 'clipboard' });
      return;
    }
    // SP-02 A1: буфер недоступен — выделяем ссылку и подсказываем скопировать вручную.
    const el = linkRef.current;
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    if (el && selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    toast(t('referral.copy_manual'));
    track('referral_link_copied', { source, method: 'manual' });
  }

  async function onShare() {
    const result = await shareLink(shareMessage(t('referral.share_text', { supplier: supplierName }), url));
    if (result === 'cancelled') track('referral_share_cancelled', { source });
    else track('referral_shared_whatsapp', { source, method: result });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-11 items-center gap-2 rounded-lg border bg-background ps-3 pe-1">
        <span ref={linkRef} className="min-w-0 flex-1 text-sm font-medium wrap-anywhere md:text-base" data-testid="referral-url">
          <Ltr>{url}</Ltr>
        </span>
        <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => void onCopy()} aria-label={copied ? t('referral.copied') : t('referral.copy')}>
          <Icon icon={copied ? RiCheckLine : RiFileCopyLine} />
        </Button>
      </div>
      {/* Телефон — кнопки друг под другом на всю ширину; с md — в строку по ширине текста (Кирилл 2026-11-24). Обе серые. */}
      <div className="flex flex-col gap-2 md:flex-row">
        <Button type="button" variant="secondary" className="min-h-11 md:w-fit" onClick={() => void onShare()}>
          <Icon icon={RiWhatsappLine} />
          {t('referral.share_whatsapp')}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 md:w-fit" onClick={() => setQrOpen(true)}>
          <Icon icon={RiQrCodeLine} />
          {t('supplier.partner.qr_button')}
        </Button>
      </div>
      {qrOpen ? (
        <Suspense fallback={null}>
          <QrPanel url={url} slug={slug} open={qrOpen} onOpenChange={setQrOpen} />
        </Suspense>
      ) : null}
    </div>
  );
}
