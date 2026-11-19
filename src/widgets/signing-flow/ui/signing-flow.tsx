// Сценарий подписания (SC-06, D-083, D-085): два документа в фиксированном порядке — договор SPA (Sadq) и вексель
// (Nafith). Оба подписываются по ссылке из SMS от менеджера, вне портала; интерфейс у них одинаковый (Кирилл 2026-11-19).
// Документ — карточка (иконка в сером квадрате, название, бейдж статуса в строке заголовка). Два статуса бейджем без
// иконок: «Нужна подпись» (серый) и «Подписан» (зелёный). До подписи кнопок нет — пояснение «менеджер прислал SMS
// со ссылкой» на всю ширину и два шага с номерами в серых кругах. После подписи — «подписан, можно скачать копию»
// и нейтральная кнопка «Скачать». Статус только из данных (D-035); `failed` — нейтральный текст и путь в поддержку.
// Скачивание векселя событием не отмечается: в словаре событий есть только `spa_downloaded` (04-metrics).
import { RiErrorWarningLine, RiDownloadLine, RiFileShield2Line, RiFileTextLine, type RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { ChecklistItem, Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
import { Button, Icon, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

const ICON: Record<ChecklistItem['key'], RemixiconComponentType> = {
  spa: RiFileTextLine,
  pn_nafith: RiFileShield2Line,
};
/** Префикс текстов документа: договор — `signing.spa.*`, вексель — `signing.pn.*`. */
const TEXTS: Record<ChecklistItem['key'], 'spa' | 'pn'> = { spa: 'spa', pn_nafith: 'pn' };
/** Шаги инструкции до подписи: открыть ссылку из SMS, подписать. */
const STEPS = ['step_sms', 'step_sign'] as const;

export interface SigningFlowProps {
  limit: Pick<Limit, 'checklist'>;
}

export function SigningFlow({ limit }: SigningFlowProps) {
  const { t } = useTranslation();
  // Порядок фиксирован (SPA → вексель), выполнять можно в любом порядке.
  const items = (['spa', 'pn_nafith'] as const).flatMap((key) => limit.checklist.items.filter((i) => i.key === key));
  return (
    <ol className="flex flex-col gap-4" aria-label={t('signing.title')}>
      {items.map((item) => (
        <SigningStep key={item.key} item={item} />
      ))}
    </ol>
  );
}

/** Статус документа бейджем без иконки: «Нужна подпись» — серый, «Подписан» — зелёный (Кирилл 2026-11-18). */
function StatusBadge({ status }: { status: ChecklistItem['status'] }) {
  const { t } = useTranslation();
  const tone = status === 'done' ? 'bg-status-approved-muted text-status-approved' : 'bg-muted text-foreground';
  const label = status === 'done' ? 'signing.status_signed' : status === 'failed' ? 'checklist.status.failed' : 'signing.status_required';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap', tone)}>
      {status === 'failed' ? <Icon icon={RiErrorWarningLine} className="size-4" /> : null}
      {t(label)}
    </span>
  );
}

function SigningStep({ item }: { item: ChecklistItem }) {
  const { t } = useTranslation();
  const signed = item.status === 'done';
  const failed = item.status === 'failed';
  const doc = TEXTS[item.key];

  useEffect(() => {
    if (failed) track('checklist_item_failed_viewed', { item: item.key });
    // Один раз на показ состояния.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  return (
    <li className="flex list-none flex-col rounded-xl bg-secondary">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
        {/* Бейдж — в строке заголовка, пояснение и шаги под ней на всю ширину (Кирилл 2026-11-18). */}
        <Item className="flex-nowrap items-start rounded-none border-0 p-0">
          <ItemMedia variant="icon" className="hidden size-10 self-start rounded-lg bg-muted sm:flex">
            <Icon icon={ICON[item.key]} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-2">
            <div className="flex min-h-6 items-start justify-between gap-3">
              <ItemTitle className="flex-wrap text-base font-semibold">{t(`checklist.${item.key}`)}</ItemTitle>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
            <ItemDescription className="line-clamp-none">{t(signed ? `signing.${doc}.signed_body` : `signing.${doc}.body`)}</ItemDescription>
            {signed || failed ? null : (
              <ol className="mt-2 flex flex-col gap-3 text-sm">
                {STEPS.map((key, i) => (
                  <li key={key} className="flex items-start gap-3 leading-6">
                    {/* Номер шага в сером круге, выровнен по верху текста (Кирилл 2026-11-18). */}
                    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    {t(`signing.${doc}.${key}`)}
                  </li>
                ))}
              </ol>
            )}
          </ItemContent>
        </Item>
        {signed && item.document_url ? (
          <div className="flex flex-wrap gap-2 sm:ps-13.5">
            <Button asChild variant="secondary" className="min-h-11">
              <a href={item.document_url} download onClick={item.key === 'spa' ? () => track('spa_downloaded', {}) : undefined}>
                <Icon icon={RiDownloadLine} data-icon="inline-start" />
                {t('signing.download')}
              </a>
            </Button>
          </div>
        ) : null}
      </div>
      {failed ? (
        <p className="px-3 py-2 text-sm text-secondary-foreground/75 md:px-4">
          <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {t('checklist.item_failed')}
          </a>
        </p>
      ) : null}
    </li>
  );
}
