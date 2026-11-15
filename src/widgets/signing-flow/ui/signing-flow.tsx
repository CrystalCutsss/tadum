// Сценарий подписания (SC-06, D-083): два шага в фиксированном порядке — договор SPA и вексель в Nafith.
// Шаг — карточка в стиле документа (иконка в сером квадрате, название, пояснение, статус справа). У SPA — «Скачать
// договор» и «Отправить подписанный в WhatsApp»; после нажатия WhatsApp — локальная отметка и «ждём подтверждения»,
// пока команда не проверит скан (D-035: статус только из данных, отметка — не подтверждение). У векселя — инструкция
// текстом, без ссылок и логотипов Nafith. В демо витрины у шага — ссылка на демо-страницу подтверждения.
import { RiCheckLine, RiDownloadLine, RiErrorWarningLine, RiFileShield2Line, RiFileTextLine, RiTimeLine, RiWhatsappLine, type RemixiconComponentType } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { checklistItemView, checklistOpenedAt, markChecklistOpened, type ChecklistItem, type ChecklistItemView, type Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
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

/** Демо витрины: мок и демо-режим (не прод-сборка) — у шага ссылка на демо-страницу подтверждения. */
const demoConfirm = import.meta.env.VITE_DEMO_PANEL !== '0' && (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock';

export interface SigningFlowProps {
  limit: Pick<Limit, 'checklist'>;
  /** Время последнего ответа сервера по лимиту (TanStack Query dataUpdatedAt). */
  limitUpdatedAt: number;
  /** Название компании — в готовый текст WhatsApp (в аналитику не уходит). */
  company: string;
}

export function SigningFlow({ limit, limitUpdatedAt, company }: SigningFlowProps) {
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
          index={0}
          view={checklistItemView(spa, checklistOpenedAt('spa'), limitUpdatedAt, now)}
          staleHours={staleHours(checklistOpenedAt('spa'), now)}
          body={t('signing.spa.body')}
          actions={
            <>
              {spa.document_url ? (
                <Button asChild variant="secondary" className="min-h-11">
                  <a href={spa.document_url} download onClick={() => track('spa_downloaded', {})}>
                    <Icon icon={RiDownloadLine} data-icon="inline-start" />
                    {t('signing.spa.download')}
                  </a>
                </Button>
              ) : null}
              <Button asChild className="min-h-11">
                <a
                  href={supportWhatsappUrl(t('support.prefill.signed_spa', { company }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markChecklistOpened('spa', clockNow());
                    track('spa_whatsapp_clicked', {});
                    setTick((n) => n + 1);
                  }}
                >
                  <Icon icon={RiWhatsappLine} data-icon="inline-start" />
                  {t('signing.spa.send')}
                </a>
              </Button>
            </>
          }
        />
      ) : null}
      {pn ? (
        <SigningStep
          item={pn}
          index={1}
          view={checklistItemView(pn, null, limitUpdatedAt, now)}
          staleHours={0}
          body={t('signing.pn.body')}
          note={
            <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {t('signing.pn.not_received')}
            </a>
          }
        />
      ) : null}
    </ol>
  );
}

const staleHours = (at: number | null, now: number) => (at === null ? 0 : Math.floor((now - at) / 3_600_000));

function SigningStep({
  item,
  index,
  view,
  staleHours: hours,
  body,
  actions,
  note,
}: {
  item: ChecklistItem;
  index: number;
  view: ChecklistItemView;
  staleHours: number;
  body: string;
  actions?: ReactNode;
  note?: ReactNode;
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
      ? supportLink(t('checklist.stale_hint'))
      : view === 'failed'
        ? supportLink(t('checklist.item_failed'))
        : done
          ? null
          : (note ?? null);

  return (
    <li className="flex list-none flex-col rounded-xl bg-secondary">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
        <Item className="flex-nowrap items-center rounded-none border-0 p-0">
          <ItemMedia variant="icon" className="hidden size-10 self-center rounded-lg bg-muted sm:flex">
            <Icon icon={ICON[item.key]} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-1">
            <ItemTitle className="flex-wrap text-base font-semibold">
              <span className="text-muted-foreground">{t('signing.step', { n: index + 1 })}</span>
              {t(`checklist.${item.key}`)}
            </ItemTitle>
            {done ? null : <ItemDescription className="line-clamp-none">{body}</ItemDescription>}
          </ItemContent>
          {view === 'pending' ? null : (
            <div className="ms-auto shrink-0 self-start">
              <StatusPill view={view} />
            </div>
          )}
        </Item>
        {/* Действия — пока шаг не подтверждён; после «отправлено» их можно повторить (новый скан). */}
        {actions && !done && view !== 'failed' ? <div className="flex flex-wrap gap-2 sm:ps-13.5">{actions}</div> : null}
      </div>
      {tray || (demoConfirm && !done) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4">
          {tray ? <p className="text-sm text-secondary-foreground/75">{tray}</p> : <span />}
          {demoConfirm && !done ? (
            <Link to="/demo/sign" search={{ item: item.key }} className="text-sm text-secondary-foreground/75 underline underline-offset-4">
              {t('demo_sign.confirm')}
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
