// /c/documents (SC-02…SC-06, решения Кирилла 2026-11-09 и 2026-11-11): экран «Заявка» — список документов
// (отдельных карточек нет), справа на ≥1024 px — панель шагов заявки, на телефоне — она же сверху, свёрнутая.
// После одобрения раскладка та же (A-063): над списком — карточка этапа («Решение», «Подписание»), принятые документы
// свёрнуты; на этапе «Лимит одобрен» — только готовая карточка заявки, а даты, лимит и документы — внутри (?view=details).
import { cn } from 'cn';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, canEditFiles, companyQuery, computeClientTimeline, isValidCr, type ClientTimeline } from '@/entities/application';
import { documentSetQuery } from '@/entities/document';
import { limitQuery, type Limit } from '@/entities/limit';
import { CompanyCrCard } from '@/features/edit-company-cr';
import { track } from '@/shared/analytics';
import { useStatusPolling, type Application, type DocumentSet } from '@/shared/api';
import { useIsMobile } from '@/shared/lib';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SideDrawer,
  Skeleton,
  toast,
} from '@/shared/ui';
import { ApplicationFacts, ApplicationSummaryCard, CancelledLimitCard, DocumentsFolder, LimitCard, SigningSteps } from '@/widgets/application-stage';
import { CabinetAside, CabinetPageHeader, LoadError } from '@/widgets/cabinet-shell';
import { DocumentList } from '@/widgets/document-list';
import { StatusStepBar, StatusTimeline } from '@/widgets/status-timeline';
import { SupportBar } from '@/widgets/support-bar';

/**
 * Панель шагов — фон как у нижней панели карточки документа, secondary (решение Кирилла 2026-11-10).
 * Вторичный текст с контрастом AA: muted-foreground на secondary — 4.2:1, secondary-foreground/65 — 5.3:1.
 */
const PANEL_MUTED = '[&_.text-muted-foreground]:text-secondary-foreground/65';

type Steps = Extract<ClientTimeline, { hidden: false }>['steps'];

/** Подпись под шкалой: срок — только из данных (D-033), без предупреждения о возможном дозапросе и без «от вас ничего не нужно» (решения 2026-11-09). */
function ReviewNotes({ app }: { app: Application }) {
  const { t } = useTranslation();
  const reviewing = app.client_status === 'under_review';
  return (
    <>
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
    // Компактно — в половину колонки, без обводки (2026-11-09); фон как у нижней панели карточки,
    // отступы сверху и снизу 20 px вместо 24 px (2026-11-10).
    <Card className={cn('gap-4 rounded-xl py-5 bg-secondary text-secondary-foreground ring-0', PANEL_MUTED)}>
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
    <div className={cn('flex flex-col gap-2 rounded-xl bg-secondary p-3 text-secondary-foreground lg:hidden', PANEL_MUTED)}>
      <StatusStepBar steps={steps} />
      <ReviewNotes app={app} />
    </div>
  );
}

type Stage = 'documents' | 'decision' | 'signing' | 'cancelled' | 'approved';

/** Этап экрана — только из клиентского статуса и статуса лимита (odoo_stage сюда не доходит). */
function stageOf(app: Application, limit: Limit | null | undefined): Stage {
  if ((app.client_status !== 'approved' && app.client_status !== 'first_purchase') || !limit) return 'documents';
  switch (limit.status) {
    case 'pending':
      return 'decision';
    case 'ready':
      return 'signing';
    case 'active':
      return 'approved';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
  }
}

const SUBTITLE = {
  decision: 'application.subtitle.decision',
  signing: 'application.subtitle.signing',
  cancelled: 'application.subtitle.cancelled',
  approved: 'application.subtitle.approved',
} as const;

/** Смена статуса лимита при открытом экране: тост (D-034). */
function useLimitChangeNotice(limit: Limit | null | undefined) {
  const { t } = useTranslation();
  const prev = useRef<Limit['status'] | null | undefined>(undefined);
  useEffect(() => {
    if (limit === undefined) return;
    const status = limit?.status ?? null;
    if (prev.current !== undefined && prev.current !== status) {
      // limit_activated — после правки 04-metrics-and-events.md: days_since_approved станет необязательным (даты
      // одобрения у лимита нет; решение Кирилла 2026-11-11 — без поля), до этого событие не шлём, чтобы не отправлять 0.
      toast(t('status.updated'));
    }
    prev.current = status;
  }, [limit, t]);
}

/**
 * Принятые документы — в выдвижной панели по клику на папку (Кирилл 2026-11-11): на компьютере — боковой Drawer
 * (SideDrawer) с края экрана по направлению текста, на телефоне — нижняя почти на всю высоту, с прокруткой.
 */
function DocumentsPanel({ set, open, onOpenChange }: { set: DocumentSet; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const title = t('application.folder.title');
  const description = t('application.documents_accepted', { count: set.documents.length });
  const list = <DocumentList set={set} editable={false} crReady onCrMissing={() => undefined} />;
  if (isMobile) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent size="tall" closeLabel={t('common.close')}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>{list}</ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }
  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={title} description={description} closeLabel={t('common.close')}>
      {list}
    </SideDrawer>
  );
}

export interface ClientDocumentsProps {
  focusKey?: string | undefined;
  /** Подробности заявки на этапе «Лимит одобрен» (?view=details). */
  details?: boolean;
  onOpenDetails?: () => void;
}

export function ClientDocuments({ focusKey, details = false, onOpenDetails }: ClientDocumentsProps) {
  const { t } = useTranslation();
  const app = useStatusPolling(applicationQuery);
  const owner = { kind: 'application' as const, id: app.data?.id ?? '' };
  const set = useQuery({ ...documentSetQuery(owner), enabled: Boolean(app.data) });
  const company = useQuery(companyQuery);
  const limit = useStatusPolling(limitQuery);
  // Попытка отправить без номера CR — поле показывает ошибку и получает фокус.
  const [crAttention, setCrAttention] = useState(0);
  const [docsOpen, setDocsOpen] = useState(false);
  useLimitChangeNotice(limit.data);

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
  if (!data || !set.data || limit.isPending) {
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

  // Номер CR — только при первом сборе документов (решение Кирилла 2026-11-10): после проверки (дозапрос, «нужен новый
  // файл» — комплект уже возвращался) и во время проверки блока нет; номер к этому времени уже сохранён.
  const reviewed = set.data.round > 1 || set.data.documents.some((d) => d.rejected_file_hashes.length > 0);
  const crStage = editable && !reviewed;

  const stage = stageOf(data, limit.data);
  const timeline = computeClientTimeline({ client_status: data.client_status, round: set.data.round, limit: limit.data ?? null });
  const sentAt = set.data.submitted_at ?? data.created_at;
  const lim = limit.data;
  const folder = stage === 'decision' || stage === 'signing' || stage === 'cancelled';

  const subtitle =
    stage === 'documents' ? (editable ? t('documents.subtitle') : t('documents.subtitle_locked')) : t(SUBTITLE[stage]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Заголовок — над обеими колонками: панель шагов справа начинается вровень с первой карточкой. */}
      <CabinetPageHeader>
        {/* Заголовок страницы крупнее (Кирилл 2026-11-11): 24 px, отступ до подзаголовка и до контента — пропорционально. */}
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold">{stage === 'approved' && details ? t('application.details.title') : t('documents.title')}</h1>
          <p className="text-base text-muted-foreground">{subtitle}</p>
        </header>
      </CabinetPageHeader>

      {timeline.hidden ? null : (
        <>
          <StepsTopPanel steps={timeline.steps} app={data} />
          <CabinetAside>
            <div className="sticky top-4 flex w-1/2 max-w-full min-w-56 flex-col gap-4">
              <StepsPanel steps={timeline.steps} app={data} />
              {folder ? <DocumentsFolder count={set.data.documents.length} onOpen={() => setDocsOpen(true)} /> : null}
            </div>
          </CabinetAside>
        </>
      )}

      {stage === 'documents' ? (
        <>
          <DocumentList
            set={set.data}
            editable={editable}
            focusKey={focusKey}
            header={crStage ? <CompanyCrCard company={company.data} editable={editable} attention={crAttention} /> : null}
            crReady={!crStage || isValidCr(company.data?.cr_number)}
            onCrMissing={() => setCrAttention((n) => n + 1)}
          />
          {!editable ? (
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">{t('documents.locked.title')}</CardTitle>
                <CardDescription>{t('documents.locked.body')}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </>
      ) : stage === 'approved' && lim ? (
        details ? (
          <>
            <Card className="rounded-xl">
              <CardContent>
                <ApplicationFacts sentAt={sentAt} limit={lim} />
              </CardContent>
            </Card>
            <h2 className="text-base font-semibold">{t('application.details.documents')}</h2>
            <DocumentList set={set.data} editable={false} crReady onCrMissing={() => undefined} />
          </>
        ) : (
          <ApplicationSummaryCard sentAt={sentAt} limit={lim} onOpen={() => onOpenDetails?.()} />
        )
      ) : lim ? (
        <>
          {stage === 'cancelled' ? (
            <CancelledLimitCard />
          ) : (
            <>
              <LimitCard limit={lim} />
              <SigningSteps limit={lim} limitUpdatedAt={limit.dataUpdatedAt} />
            </>
          )}
          {/* Телефон: папка — под шагами подписания; на компьютере она в третьей колонке под шагами заявки. */}
          <DocumentsFolder className="lg:hidden" count={set.data.documents.length} onOpen={() => setDocsOpen(true)} />
          <DocumentsPanel set={set.data} open={docsOpen} onOpenChange={setDocsOpen} />
        </>
      ) : null}
    </div>
  );
}
