// Сценарий подписания (SC-06, D-083): два шага в фиксированном порядке — договор SPA и вексель в Nafith.
// Шаг — карточка в стиле документа (иконка в сером квадрате, название, пояснение, статус справа). Договор SPA
// (Кирилл 2026-11-18): два статуса бейджем — «Нужна подпись» (серый) и «Подписан» (зелёный). До подписи кнопок нет —
// инструкция: менеджер прислал SMS со ссылкой на SADQ, два шага. После подписи — «подписан, скачайте копию» и
// нейтральная кнопка скачивания. Статус только из данных (D-035), автоперехода в демо нет — состояния показывают
// персоны (Кирилл 2026-11-18). У векселя — «Open Nafith» и ожидание.
import { RiCheckLine, RiDownloadLine, RiErrorWarningLine, RiExternalLinkLine, RiFileShield2Line, RiFileTextLine, RiTimeLine, type RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { checklistItemView, checklistOpenedAt, markChecklistOpened, type ChecklistItem, type ChecklistItemView, type Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { NAFITH_URL, supportWhatsappUrl } from '@/shared/config';
import { now as clockNow, useNow } from '@/shared/lib';
import { Button, Icon, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

type Tone = 'received' | 'approved' | 'neutral';
const TONE: Record<Tone, string> = {
  received: 'bg-status-received-muted text-status-received',
  approved: 'bg-status-approved-muted text-status-approved',
  neutral: 'bg-muted text-foreground',
};
const META: Record<Exclude<ChecklistItemView, 'pending'>, { tone: Tone; icon: RemixiconComponentType; label: 'done' | 'failed' | 'in_progress' }> = {
  in_progress: { tone: 'received', icon: RiTimeLine, label: 'in_progress' },
  stale: { tone: 'received', icon: RiTimeLine, label: 'in_progress' },
  done: { tone: 'approved', icon: RiCheckLine, label: 'done' },
  failed: { tone: 'neutral', icon: RiErrorWarningLine, label: 'failed' },
};

function StatusPill({ view }: { view: Exclude<ChecklistItemView, 'pending'> }) {
  const { t } = useTranslation();
  const { tone, icon, label } = META[view];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap', TONE[tone])}>
      <Icon icon={icon} className="size-4" />
      {t(`checklist.status.${label}`)}
    </span>
  );
}

const ICON: Record<ChecklistItem['key'], RemixiconComponentType> = { spa: RiFileTextLine, pn_nafith: RiFileShield2Line };

export interface SigningFlowProps {
  limit: Pick<Limit, 'checklist'>;
}

export function SigningFlow({ limit }: SigningFlowProps) {
  const { t } = useTranslation();
  const now = useNow(60_000);
  // Нажатие WhatsApp пишет отметку в sessionStorage — перерисовываем шаг сразу.
  const [, setTick] = useState(0);
  const spa = limit.checklist.items.find((i) => i.key === 'spa');
  const pn = limit.checklist.items.find((i) => i.key === 'pn_nafith');

  return (
    <ol className="flex flex-col gap-4" aria-label={t('signing.title')}>
      {spa ? (
        <SigningStep
          item={spa}
          view={spa.status === 'done' || spa.status === 'failed' ? spa.status : 'pending'}
          staleHours={0}
          pill={spa.status === 'failed' ? undefined : <SpaBadge signed={spa.status === 'done'} />}
          showBodyWhenDone
          body={t(spa.status === 'done' ? 'signing.spa.signed_body' : 'signing.spa.body')}
          extra={
            spa.status === 'done' ? undefined : (
              <ol className="mt-2 flex flex-col gap-3 text-sm">
                {(['step_sms', 'step_sign'] as const).map((key, i) => (
                  <li key={key} className="flex items-start gap-3 leading-6">
                    {/* Номер шага в сером круге (Кирилл 2026-11-18). */}
                    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    {t(`signing.spa.${key}`)}
                  </li>
                ))}
              </ol>
            )
          }
          actions={
            spa.status === 'done' && spa.document_url ? (
              <Button asChild variant="secondary" className="min-h-11">
                <a href={spa.document_url} download onClick={() => track('spa_downloaded', {})}>
                  <Icon icon={RiDownloadLine} data-icon="inline-start" />
                  {t('signing.spa.download')}
                </a>
              </Button>
            ) : undefined
          }
          actionsWhenDone
        />
      ) : null}
      {pn ? (
        <SigningStep
          item={pn}
          view={checklistItemView(pn, checklistOpenedAt('pn_nafith'), 0, now)}
          staleHours={staleHours(checklistOpenedAt('pn_nafith'), now)}
          body={t('signing.pn.body')}
          actions={
            <Button asChild className="min-h-11">
              <a
                href={NAFITH_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  markChecklistOpened('pn_nafith', clockNow());
                  setTick((n) => n + 1);
                }}
              >
                {t('signing.pn.open')}
                <Icon icon={RiExternalLinkLine} data-icon="inline-end" />
              </a>
            </Button>
          }
        />
      ) : null}
    </ol>
  );
}

/** Статус договора бейджем без иконки: «Нужна подпись» — серый, «Подписан» — зелёный (Кирилл 2026-11-18). */
function SpaBadge({ signed }: { signed: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap', TONE[signed ? 'approved' : 'neutral'])}>
      {t(signed ? 'signing.spa.status_signed' : 'signing.spa.status_required')}
    </span>
  );
}

const staleHours = (at: number | null, now: number) => (at === null ? 0 : Math.floor((now - at) / 3_600_000));

function SigningStep({
  item,
  view,
  staleHours: hours,
  body,
  extra,
  actions,
  pill,
  showBodyWhenDone = false,
  actionsWhenDone = false,
}: {
  item: ChecklistItem;
  view: ChecklistItemView;
  staleHours: number;
  body: string;
  /** Под пояснением — шаги инструкции (договор SPA до подписи). */
  extra?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  /** Свой бейдж статуса вместо общего (договор SPA). */
  pill?: ReactNode | undefined;
  showBodyWhenDone?: boolean;
  actionsWhenDone?: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (view === 'failed') track('checklist_item_failed_viewed', { item: item.key });
    if (view === 'stale') track('checklist_item_stale', { item: item.key, hours });
    // Один раз на показ состояния.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const done = view === 'done';
  // «Не получилось» и «давно ждём» ведут в поддержку (SC-06 A3, A4): текст — ссылкой на WhatsApp.
  const supportLink = (text: string) => (
    <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
      {text}
    </a>
  );
  const tray =
    view === 'stale'
      ? supportLink(t(item.key === 'spa' ? 'checklist.stale_hint' : 'checklist.stale_hint_pn'))
      : view === 'failed'
        ? supportLink(t('checklist.item_failed'))
        : null;

  return (
    <li className="flex list-none flex-col rounded-xl bg-secondary">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
        {/* Бейдж — в строке заголовка, пояснение и шаги под ней на всю ширину (Кирилл 2026-11-18). */}
        <Item className="flex-nowrap items-start rounded-none border-0 p-0">
          <ItemMedia variant="icon" className="hidden size-10 self-start rounded-lg bg-muted sm:flex">
            <Icon icon={ICON[item.key]} />
          </ItemMedia>
          {/* Отступ под заголовком больше только у договора (свой бейдж); у векселя — прежний (Кирилл 2026-11-18). */}
          <ItemContent className={cn('min-w-0', pill === undefined ? 'gap-1' : 'gap-2')}>
            <div className="flex min-h-6 items-start justify-between gap-3">
              <ItemTitle className="flex-wrap text-base font-semibold">{t(`checklist.${item.key}`)}</ItemTitle>
              {pill !== undefined || view !== 'pending' ? (
                <div className="shrink-0">{pill ?? (view === 'pending' ? null : <StatusPill view={view} />)}</div>
              ) : null}
            </div>
            {done && !showBodyWhenDone ? null : <ItemDescription className="line-clamp-none">{body}</ItemDescription>}
            {extra}
          </ItemContent>
        </Item>
        {/* Действия — пока шаг не подтверждён; после «отправлено» их можно повторить (новый скан). */}
        {actions && (!done || actionsWhenDone) && view !== 'failed' ? <div className="flex flex-wrap gap-2 sm:ps-13.5">{actions}</div> : null}
      </div>
      {tray ? <p className="px-3 py-2 text-sm text-secondary-foreground/75 md:px-4">{tray}</p> : null}
    </li>
  );
}
