// /c/documents (SC-02…SC-05, решения Кирилла 2026-11-09): список документов — единственный экран этапа
// (отдельных карточек нет), справа на ≥1024 px — панель шагов заявки, на телефоне — она же сверху, свёрнутая.
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, canEditFiles, computeClientTimeline, type ClientTimeline } from '@/entities/application';
import { documentSetQuery } from '@/entities/document';
import { track } from '@/shared/analytics';
import { useStatusPolling, type Application } from '@/shared/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/shared/ui';
import { CabinetAside, CabinetPageHeader, LoadError } from '@/widgets/cabinet-shell';
import { DocumentList } from '@/widgets/document-list';
import { StatusStepBar, StatusTimeline } from '@/widgets/status-timeline';
import { SupportBar } from '@/widgets/support-bar';

type Steps = Extract<ClientTimeline, { hidden: false }>['steps'];

/** Подпись под шкалой: срок — только из данных (D-033), без предупреждения о возможном дозапросе (решение 2026-11-09). */
function ReviewNotes({ app }: { app: Application }) {
  const { t } = useTranslation();
  const reviewing = app.client_status === 'under_review';
  return (
    <>
      {reviewing ? <p className="text-sm">{t('documents.review.nothing_needed')}</p> : null}
      {reviewing && app.review_eta_hours !== undefined ? (
        <p className="text-sm text-muted-foreground">{t('documents.review.eta', { count: app.review_eta_hours })}</p>
      ) : null}
    </>
  );
}

/** Десктоп: все шаги столбиком в третьей колонке. */
function StepsPanel({ steps, app }: { steps: Steps; app: Application }) {
  const { t } = useTranslation();
  return (
    <Card className="sticky top-4 gap-4 rounded-xl">
      <CardHeader>
        <CardTitle>{t('documents.review.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <StatusTimeline steps={steps} orientation="vertical" />
        <ReviewNotes app={app} />
      </CardContent>
    </Card>
  );
}

/** Телефон и планшет: степ-бар сверху — подпись только у текущего шага (решение 2026-11-09). */
function StepsTopPanel({ steps, app }: { steps: Steps; app: Application }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-card-foreground lg:hidden">
      <StatusStepBar steps={steps} />
      <ReviewNotes app={app} />
    </div>
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
    <div className="flex flex-1 flex-col gap-4">
      {/* Заголовок — над обеими колонками: панель шагов справа начинается вровень с первой карточкой. */}
      <CabinetPageHeader>
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{t('documents.title')}</h1>
          <p className="text-sm text-muted-foreground">{editable ? t('documents.subtitle') : t('documents.subtitle_locked')}</p>
        </header>
      </CabinetPageHeader>

      {timeline.hidden ? null : (
        <>
          <StepsTopPanel steps={timeline.steps} app={data} />
          <CabinetAside>
            <StepsPanel steps={timeline.steps} app={data} />
          </CabinetAside>
        </>
      )}

      <DocumentList set={set.data} editable={editable} focusKey={focusKey} />

      {!editable ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">{t('documents.locked.title')}</CardTitle>
            <CardDescription>{t('documents.locked.body')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
