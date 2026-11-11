// Чек-лист подключения лимита (SC-06): три пункта в фиксированном порядке, у каждого — либо кнопка «Открыть», либо
// статус текстом и иконкой (приём № 03 из бенчмарка 2026-11-06: статус или действие, не оба). Вид пункта — как карточка
// документа на экране заявки (Кирилл 2026-11-11): белая карточка с иконкой, названием и пояснением, под ней серая панель —
// только когда есть что сказать (ждём подтверждения, 24 ч, не получилось, инструкция Nafith).
// Акцент — на первом незавершённом пункте. До согласования условий (лимит pending) пункты видны, но неактивны.
import {
  RiCheckLine,
  RiErrorWarningLine,
  RiFileShield2Line,
  RiLockLine,
  RiQuillPenLine,
  RiTimeLine,
  type RemixiconComponentType,
} from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { checklistFocusKey, checklistItemView, checklistOpenedAt, type ChecklistItem, type ChecklistItemView } from '@/entities/limit';
import { ChecklistLinkButton } from '@/features/open-checklist-link';
import { track } from '@/shared/analytics';
import { useNow } from '@/shared/lib';
import { Icon, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

type Tone = 'pending' | 'received' | 'approved' | 'rejected' | 'neutral';
const TONE: Record<Tone, string> = {
  pending: 'bg-status-pending-muted text-status-pending',
  received: 'bg-status-received-muted text-status-received',
  approved: 'bg-status-approved-muted text-status-approved',
  rejected: 'bg-status-rejected-muted text-status-rejected',
  neutral: 'bg-muted text-muted-foreground',
};

type View = ChecklistItemView | 'locked';
const META: Record<Exclude<View, 'pending'>, { tone: Tone; icon: RemixiconComponentType }> = {
  in_progress: { tone: 'received', icon: RiTimeLine },
  stale: { tone: 'received', icon: RiTimeLine },
  done: { tone: 'approved', icon: RiCheckLine },
  failed: { tone: 'neutral', icon: RiErrorWarningLine },
  locked: { tone: 'neutral', icon: RiLockLine },
};

function StatusPill({ view }: { view: Exclude<View, 'pending'> }) {
  const { t } = useTranslation();
  const { tone, icon } = META[view];
  const label =
    view === 'done'
      ? t('checklist.status.done')
      : view === 'failed'
        ? t('checklist.status.failed')
        : view === 'locked'
          ? t('checklist.status.locked')
          : t('checklist.status.in_progress');
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap', TONE[tone])}>
      <Icon icon={icon} className="size-4" />
      {label}
    </span>
  );
}

const ITEM_ICON: Record<ChecklistItem['key'], RemixiconComponentType> = {
  spa_sadq: RiQuillPenLine,
  pn_company_nafith: RiFileShield2Line,
  pn_owner_nafith: RiFileShield2Line,
};

const TITLE_KEY = {
  spa_sadq: 'checklist.spa_sadq',
  pn_company_nafith: 'checklist.pn_company_nafith',
  pn_owner_nafith: 'checklist.pn_owner_nafith',
} as const;
const WHERE_KEY = {
  spa_sadq: 'checklist.where.spa_sadq',
  pn_company_nafith: 'checklist.where.pn_company_nafith',
  pn_owner_nafith: 'checklist.where.pn_owner_nafith',
} as const;

export interface OnboardingChecklistViewProps {
  items: readonly ChecklistItem[];
  /** Лимит ещё pending (условия согласуются): пункты видны, но неактивны. */
  locked?: boolean;
  /** Время последнего ответа сервера по лимиту — локальная отметка «открыто» действует только до него (D-035). */
  dataUpdatedAt: number;
}

export function OnboardingChecklistView({ items, locked = false, dataUpdatedAt }: OnboardingChecklistViewProps) {
  const { t } = useTranslation();
  const now = useNow(60_000);
  // Клик по «Открыть» записывает отметку в sessionStorage — перерисовываем строку сразу.
  const [, setOpenedTick] = useState(0);
  const focus = locked ? null : checklistFocusKey(items);

  return (
    <ol className="flex flex-col gap-3" aria-label={t('checklist.title')}>
      {items.map((item, index) => {
        const view: View = locked ? 'locked' : checklistItemView(item, checklistOpenedAt(item.key), dataUpdatedAt, now);
        const canOpen = !locked && view === 'pending' && item.external_url;
        return (
          <li key={item.key} className="list-none">
            <ChecklistRow
              item={item}
              index={index}
              view={view}
              focused={focus === item.key}
              action={
                canOpen && item.external_url ? (
                  <ChecklistLinkButton
                    item={{ key: item.key, external_url: item.external_url }}
                    position={index + 1}
                    primary={focus === item.key}
                    onOpened={() => setOpenedTick((n) => n + 1)}
                  />
                ) : null
              }
            />
          </li>
        );
      })}
    </ol>
  );
}

function ChecklistRow({
  item,
  index,
  view,
  focused,
  action,
}: {
  item: ChecklistItem;
  index: number;
  view: View;
  focused: boolean;
  action: React.ReactNode;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (view === 'failed') track('checklist_item_failed_viewed', { item: item.key });
    // Один раз на показ состояния.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const note =
    view === 'stale'
      ? t('checklist.stale_hint')
      : view === 'failed'
        ? t('checklist.item_failed')
        : view === 'pending' && !item.external_url
          ? t('checklist.nafith_instruction')
          : null;

  const tray = note !== null;
  return (
    <div className="flex flex-col rounded-xl bg-secondary">
      <div
        className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground md:p-4"
        aria-current={focused ? 'step' : undefined}
      >
        <Item className="flex-nowrap items-center rounded-none border-0 p-0">
          {/* Иконка — в сером квадрате по центру строки, как у загруженных файлов (Кирилл 2026-11-11). */}
          <ItemMedia variant="icon" className="size-10 self-center rounded-lg bg-muted">
            <Icon icon={ITEM_ICON[item.key]} />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-1">
            <ItemTitle className="flex-wrap">
              <span className="sr-only">{`${index + 1}. `}</span>
              {t(TITLE_KEY[item.key])}
            </ItemTitle>
            <ItemDescription className="line-clamp-none">{t(WHERE_KEY[item.key])}</ItemDescription>
          </ItemContent>
          <ItemActions className="ms-auto shrink-0">{action ?? (view === 'pending' ? null : <StatusPill view={view} />)}</ItemActions>
        </Item>
      </div>
      {tray ? (
        <div className="flex flex-col gap-1 px-3 py-2 md:px-4">
          {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
