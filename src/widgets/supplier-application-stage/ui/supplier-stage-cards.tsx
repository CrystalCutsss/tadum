// Этапы экрана «Заявка» поставщика после отправки документов (D-087–D-090; бриф TD-001 §2–§3, §7).
// «Вы партнёр Tadum» — карточка с реферальной ссылкой вместо карточки лимита (D-089, вариант A бенчмарка Mobbin):
// заголовок с галочкой, поле со ссылкой, WhatsApp и QR; «Как это работает» — отдельным блоком (Кирилл 2026-11-24).
// Lost и Declined — нейтральная карточка как «Лимит не активен» у клиента: текст без причины; «Связаться с нами» — только у Declined.
import { RiCheckLine, RiWhatsappLine } from '@remixicon/react';
import { useTranslation } from 'react-i18next';

import { ReferralActions } from '@/features/share-referral';
import { supportWhatsappUrl } from '@/shared/config';
import { Button, Icon } from '@/shared/ui';

const HOW_STEPS = ['supplier.partner.how_step1', 'supplier.partner.how_step2', 'supplier.partner.how_step3'] as const;

const CARD = 'rounded-xl border bg-card p-4 text-card-foreground md:p-6';

/** Галочка в зелёном скруглённом квадрате 40 px — как иконки в блоках документов. */
function StatusCheckIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-status-approved-muted text-status-approved">
      <Icon icon={RiCheckLine} />
    </span>
  );
}

export interface ReferralHeroCardProps {
  url: string;
  slug: string;
  supplierName: string;
}

export function ReferralHeroCard({ url, slug, supplierName }: ReferralHeroCardProps) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="partner-title" className={`flex flex-col gap-5 ${CARD}`}>
      <header className="flex items-center gap-3">
        {/* Иконка — как на «Остался договор»: галочка в зелёном скруглённом квадрате (Кирилл 2026-11-24). */}
        <StatusCheckIcon />
        <div className="flex flex-col gap-1">
          <h2 id="partner-title" className="text-lg font-semibold">
            {t('supplier.partner.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('supplier.partner.subtitle')}</p>
        </div>
      </header>
      <ReferralActions url={url} slug={slug} supplierName={supplierName} source="referral" />
    </section>
  );
}

/** «Как это работает» — три шага с номерами, отдельный блок под карточкой ссылки. */
export function HowItWorksCard() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="how-title" className={`flex flex-col gap-3 ${CARD}`}>
      <h2 id="how-title" className="text-base font-medium">
        {t('supplier.partner.how_title')}
      </h2>
      <ol className="flex flex-col gap-3">
        {HOW_STEPS.map((key, i) => (
          <li key={key} className="flex items-center gap-3 text-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-medium tabular-nums text-secondary-foreground">
              {i + 1}
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Need Contract (D-090): документы приняты, остался договор — менеджер свяжется; без CTA.
 * Иконка — как в блоках документов: скруглённый квадрат 40 px, галочка, зелёные цвета «принято» (Кирилл 2026-11-24).
 */
export function ContractPendingCard() {
  const { t } = useTranslation();
  return (
    <section aria-live="polite" className="flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <StatusCheckIcon />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('supplier.contract.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('supplier.contract.body')}</p>
      </div>
    </section>
  );
}

/**
 * Declined или Lost (D-088): нейтральная карточка без причины, как отменённый лимит у клиента.
 * «Связаться с нами» — только у Declined: у Lost кнопки нет (Кирилл 2026-11-25).
 */
export function SupplierInactiveCard({ kind }: { kind: 'declined' | 'paused' }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t(`supplier.${kind}.title`)}</h2>
        <p className="text-sm text-muted-foreground">{t(`supplier.${kind}.body`)}</p>
      </div>
      {kind === 'declined' ? (
        <Button asChild className="min-h-11">
          <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer">
            <Icon icon={RiWhatsappLine} data-icon="inline-start" />
            {t('supplier.contact_us')}
          </a>
        </Button>
      ) : null}
    </section>
  );
}
