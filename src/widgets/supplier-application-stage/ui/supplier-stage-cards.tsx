// Этапы экрана «Заявка» поставщика после отправки документов (D-087–D-090; бриф TD-001 §2–§3, §7).
// «Вы партнёр Tadum» — карточка с реферальной ссылкой вместо карточки лимита (D-089, вариант A бенчмарка Mobbin):
// заголовок с галочкой, поле со ссылкой, WhatsApp, QR, ниже «Как это работает» в три шага и переход к документам.
import { RiArrowRightSLine, RiCheckboxCircleFill, RiFileTextLine, RiInformationLine, RiPauseCircleLine, RiWhatsappLine } from '@remixicon/react';
import { useTranslation } from 'react-i18next';

import { ReferralActions } from '@/features/share-referral';
import { supportWhatsappUrl } from '@/shared/config';
import { Button, Icon, Separator } from '@/shared/ui';

const HOW_STEPS = ['supplier.partner.how_step1', 'supplier.partner.how_step2', 'supplier.partner.how_step3'] as const;

export interface ReferralHeroCardProps {
  url: string;
  slug: string;
  supplierName: string;
  /** Комплект документов только для чтения — в выдвижной панели (как D-082). */
  onOpenDocuments: () => void;
}

export function ReferralHeroCard({ url, slug, supplierName, onOpenDocuments }: ReferralHeroCardProps) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="partner-title" className="flex flex-col gap-5 rounded-xl border bg-card p-4 text-card-foreground md:p-6">
      <header className="flex items-start gap-3">
        <Icon icon={RiCheckboxCircleFill} className="mt-0.5 size-6 shrink-0 text-status-done" />
        <div className="flex flex-col gap-1">
          <h2 id="partner-title" className="text-lg font-semibold">
            {t('supplier.partner.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('supplier.partner.subtitle')}</p>
        </div>
      </header>
      <ReferralActions url={url} slug={slug} supplierName={supplierName} source="referral" />
      <Separator />
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-medium">{t('supplier.partner.how_title')}</h3>
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
      </div>
      <Button type="button" variant="ghost" className="min-h-11 justify-between px-2" onClick={onOpenDocuments}>
        <span className="flex items-center gap-2">
          <Icon icon={RiFileTextLine} />
          {t('supplier.partner.documents_link')}
        </span>
        <Icon icon={RiArrowRightSLine} />
      </Button>
    </section>
  );
}

/** Need Contract (D-090): документы приняты, остался договор — менеджер свяжется; без CTA. */
export function ContractPendingCard() {
  const { t } = useTranslation();
  return (
    <section aria-live="polite" className="flex items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon icon={RiInformationLine} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('supplier.contract.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('supplier.contract.body')}</p>
      </div>
    </section>
  );
}

/** Declined: нейтральный экран без причины, только связь с поддержкой (требования поставщика, D-088). */
export function SupplierClosedCard() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('supplier.declined.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('supplier.declined.body')}</p>
      </div>
      <Button asChild className="min-h-11">
        <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer">
          <Icon icon={RiWhatsappLine} data-icon="inline-start" />
          {t('supplier.contact_us')}
        </a>
      </Button>
    </section>
  );
}

/** Lost (D-088): кабинет только для чтения, «Работа приостановлена, свяжитесь с нами». */
export function PausedBanner() {
  const { t } = useTranslation();
  return (
    <section role="status" className="flex flex-col items-start gap-3 rounded-xl border bg-secondary p-4 text-secondary-foreground sm:flex-row sm:items-center">
      <Icon icon={RiPauseCircleLine} className="size-6 shrink-0" />
      <div className="flex flex-1 flex-col gap-0.5">
        <h2 className="text-base font-semibold">{t('supplier.paused.title')}</h2>
        <p className="text-sm">{t('supplier.paused.body')}</p>
      </div>
      <Button asChild variant="outline" className="min-h-11">
        <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer">
          <Icon icon={RiWhatsappLine} data-icon="inline-start" />
          {t('supplier.contact_us')}
        </a>
      </Button>
    </section>
  );
}
