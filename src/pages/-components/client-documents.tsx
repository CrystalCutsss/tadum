// /c/documents (SC-02…SC-05, решения Кирилла 2026-11-09): список документов — единственный экран этапа
// (отдельных карточек нет), справа на ≥1024 px — панель шагов заявки, на телефоне — она же сверху, свёрнутая.
import { RiArrowDownSLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, canEditFiles, computeClientTimeline, CLIENT_TIMELINE_STEPS, type ClientTimeline } from '@/entities/application';
import { documentSetQuery } from '@/entities/document';
import { track } from '@/shared/analytics';
import { useStatusPolling, type Application, type DocumentSet } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Collapsible, CollapsibleContent, CollapsibleTrigger, Icon, Skeleton } from '@/shared/ui';
import { CabinetAside, LoadError } from '@/widgets/cabinet-shell';
import { DocumentList } from '@/widgets/document-list';
import { StatusTimeline } from '@/widgets/status-timeline';
import { SupportBar } from '@/widgets/support-bar';

type Steps = Extract<ClientTimeline, { hidden: false }>['steps'];

/** Подпись под шкалой: срок — только из данных (D-033), предупреждение о дозапросе — со второго раунда (2026-11-09). */
function ReviewNotes({ app, set }: { app: Application; set: DocumentSet }) {
  const { t } = useTranslation();
  const reviewing = app.client_status === 'under_review';
  return (
    <>
      {reviewing ? <p className="text-sm">{t('documents.review.nothing_needed')}</p> : null}
      {reviewing && app.review_eta_hours !== undefined ? (
        <p className="text-sm text-muted-foreground">{t('documents.review.eta', { count: app.review_eta_hours })}</p>
      ) : null}
      {set.round > 1 ? <p className="text-sm text-muted-foreground">{t('documents.review.may_ask_more')}</p> : null}
    </>
  );
}

/** Десктоп: все шаги столбиком в третьей колонке. */
function StepsPanel({ steps, app, set }: { steps: Steps; app: Application; set: DocumentSet }) {
  const { t } = useTranslation();
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t('documents.review.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <StatusTimeline steps={steps} orientation="vertical" />
        <ReviewNotes app={app} set={set} />
      </CardContent>
    </Card>
  );
}

/** Телефон и планшет: сверху, свёрнуто до «Шаг N из 5: …», раскрывается во все шаги. */
function StepsTopPanel({ steps, app, set }: { steps: Steps; app: Application; set: DocumentSet }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const index = CLIENT_TIMELINE_STEPS.findIndex((s) => steps[s] === 'current');
  const current = CLIENT_TIMELINE_STEPS[index] ?? 'documents';
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-card lg:hidden">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" className="h-auto min-h-11 w-full justify-between gap-2 px-4 py-3 text-start whitespace-normal">
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t('documents.review.step_of', { n: formatNumber(index + 1), total: formatNumber(CLIENT_TIMELINE_STEPS.length) })}</span>
            <span className="font-medium">{t(`timeline.client.${current}`)}</span>
          </span>
          <Icon icon={RiArrowDownSLine} className={cn('transition-transform duration-base ease-standard', open && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 border-t px-4 py-3">
        <StatusTimeline steps={steps} orientation="vertical" />
        <ReviewNotes app={app} set={set} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ClientDocuments({ focusKey }: { focusKey?: string | undefined }) {
  const { t } = useTranslation();
  const app = useStatusPolling(applicationQuery);
  const owner = { kind: 'application' as const, id: app.data?.id ?? '' };
  const set = useQuery({ ...documentSetQuery(owner), enabled: Boolean(app.data) });

  const data = app.data;
  const editable = data && set.data ? canEditFiles(data.permission_state, set.data) : false;

  useEffect(() => {
    if (data && set.data) track('screen_viewed', { screen_id: 'client.documents', locked: !editable, round: set.data.round, ...(focusKey ? { portal_key: focusKey } : {}) });
    // Один просмотр на режим и раунд.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, set.data?.round]);

  if (app.isError || set.isError) {
    return <LoadError onRetry={() => void (app.isError ? app.refetch() : set.refetch())} support={<SupportBar context="error" />} />;
  }
  if (!data || !set.data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const timeline = computeClientTimeline({ client_status: data.client_status, round: set.data.round, limit: null });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t('documents.title')}</h1>
        <p className="text-sm text-muted-foreground">{editable ? t('documents.subtitle') : t('documents.subtitle_locked')}</p>
      </header>

      {timeline.hidden ? null : (
        <>
          <StepsTopPanel steps={timeline.steps} app={data} set={set.data} />
          <CabinetAside>
            <StepsPanel steps={timeline.steps} app={data} set={set.data} />
          </CabinetAside>
        </>
      )}

      <DocumentList set={set.data} editable={editable} focusKey={focusKey} />

      {!editable ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('documents.locked.title')}</CardTitle>
            <CardDescription>{t('documents.locked.body')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
