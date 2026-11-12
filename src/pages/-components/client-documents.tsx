// /c/documents (SC-02…SC-06, решения Кирилла 2026-11-09 и 2026-11-11): экран «Заявка» — список документов
// (отдельных карточек нет), справа на ≥1024 px — панель шагов заявки, на телефоне — она же сверху, свёрнутая.
// После одобрения раскладка та же (A-063): над списком — карточка этапа («Решение», «Подписание»), принятые документы
// свёрнуты в папку; на этапе «Лимит одобрен» — только готовая карточка, подробности заявки — в выдвижной панели.
import { cn } from 'cn';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, applicationStage, canEditFiles, companyQuery, computeClientTimeline, isValidCr, type ClientTimeline } from '@/entities/application';
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
import { ApplicationFacts, ApplicationSummaryCard, CancelledLimitCard, DocumentsFolder, LimitCard, SigningSteps, trackLimitTransition } from '@/widgets/application-stage';
import { CabinetAside, CabinetPageHeader, LoadError } from '@/widgets/cabinet-shell';
import { DocumentList } from '@/widgets/document-list';
import { StatusStepBar, StatusTimeline } from '@/widgets/status-timeline';
import { SupportBar } from '@/widgets/support-bar';

/**
 * Панель шагов — фон как у нижней панели карточки документа, secondary (решение Кирилла 2026-11-10).
 * Вторичный текст с контрастом AA: muted-foreground на secondary — 4.2:1, secondary-foreground/65 — 5.3:1.
 */
/** Лендинг «Подать заявку» (как в SC-08). */
const landingUrl: string = import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';

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

const SUBTITLE = {
  decision: 'application.subtitle.decision',
  signing: 'application.subtitle.signing',
  cancelled: 'application.subtitle.cancelled',
} as const;

/** Смена статуса лимита при открытом экране: тост (D-034). */
function useLimitChangeNotice(limit: Limit | null | undefined) {
  const { t } = useTranslation();
  const prev = useRef<Limit['status'] | null | undefined>(undefined);
  useEffect(() => {
    if (limit === undefined) return;
    const status = limit?.status ?? null;
    if (prev.current !== undefined && prev.current !== status) {
      trackLimitTransition(prev.current, limit);
      toast(t('status.updated'));
    }
    prev.current = status;
  }, [limit, t]);
}

/**
 * Принятые документы — в выдвижной панели по клику на папку (Кирилл 2026-11-11): на компьютере — боковой Drawer
 * (SideDrawer) с края экрана по направлению текста, на телефоне — нижняя почти на всю высоту, с прокруткой.
 */
function DocumentsPanel({
  set,
  open,
  onOpenChange,
  facts,
}: {
  set: DocumentSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** «Лимит одобрен»: та же панель — подробности заявки (даты и лимит над документами; Кирилл 2026-11-11). */
  facts?: ReactNode;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const title = facts ? t('application.details.title') : t('application.folder.title');
  const description = t('application.documents_accepted', { count: set.documents.length });
  const list = (
    <div className="flex flex-col gap-6">
      {facts}
      <DocumentList set={set} editable={false} archive crReady onCrMissing={() => undefined} />
    </div>
  );
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
}

export function ClientDocuments({ focusKey }: ClientDocumentsProps) {
  const { t } = useTranslation();
  const app = useStatusPolling(applicationQuery);
  const owner = { kind: 'application' as const, id: app.data?.id ?? '' };
  const set = useQuery({ ...documentSetQuery(owner), enabled: Boolean(app.data) });
  const company = useQuery(companyQuery);
  const limit = useStatusPolling(limitQuery);
  // Попытка отправить без номера CR — поле показывает ошибку и получает фокус.
  const [crAttention, setCrAttention] = useState(0);
  const [docsOpen, setDocsOpen] = useState(false);
  // Высота блока Steps (третья колонка, ≥1024 px) — карточка лимита и папка той же высоты (Кирилл 2026-11-11).
  const [stepsHeight, setStepsHeight] = useState(0);
  const stepsRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setStepsHeight(Math.round(entry?.borderBoxSize[0]?.blockSize ?? 0)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useLimitChangeNotice(limit.data);

  const data = app.data;
  const editable = data && set.data ? canEditFiles(data.permission_state, set.data) : false;

  useEffect(() => {
    if (data && set.data) track('screen_viewed', { screen_id: 'client.documents', locked: !editable, round: set.data.round, ...(focusKey ? { portal_key: focusKey } : {}) });
    // Один просмотр на режим и раунд.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, set.data?.round]);

  // Лимит не загрузился у одобренной заявки — иначе экран молча показал бы этап «Документы».
  const limitFailed = limit.isError && (app.data?.client_status === 'approved' || app.data?.client_status === 'first_purchase');
  if (app.isError || set.isError || limitFailed) {
    const retry = app.isError ? app.refetch : set.isError ? set.refetch : limit.refetch;
    return <LoadError onRetry={() => void retry()} support={<SupportBar context="error" />} />;
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

  const stage = applicationStage(data.client_status, limit.data);
  const timeline = computeClientTimeline({ client_status: data.client_status, round: set.data.round, limit: limit.data ?? null });
  const sentAt = set.data.submitted_at ?? data.created_at;
  const lim = limit.data;

  // «Лимит одобрен» — без подзаголовка (Кирилл 2026-11-11): статус уже в карточке.
  const subtitle =
    stage === 'documents' ? (editable ? t('documents.subtitle') : t('documents.subtitle_locked')) : stage === 'approved' ? null : t(SUBTITLE[stage]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Заголовок — над обеими колонками: панель шагов справа начинается вровень с первой карточкой. */}
      <CabinetPageHeader>
        {/* Заголовок страницы крупнее (Кирилл 2026-11-11): 24 px, отступ до подзаголовка и до контента — пропорционально. */}
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold">{t('documents.title')}</h1>
          {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
        </header>
      </CabinetPageHeader>

      {/* «Лимит одобрен» — шкала шагов не нужна, путь пройден (Кирилл 2026-11-11). */}
      {timeline.hidden || stage === 'approved' ? null : (
        <>
          <StepsTopPanel steps={timeline.steps} app={data} />
          <CabinetAside>
            <div className="sticky top-4 flex w-1/2 max-w-full min-w-56 flex-col gap-4">
              <div ref={stepsRef}>
                <StepsPanel steps={timeline.steps} app={data} />
              </div>
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
            crRequired={crStage}
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
        <>
          <ApplicationSummaryCard sentAt={sentAt} limit={lim} onOpen={() => setDocsOpen(true)} />
          <DocumentsPanel set={set.data} open={docsOpen} onOpenChange={setDocsOpen} facts={<ApplicationFacts sentAt={sentAt} limit={lim} />} />
        </>
      ) : lim ? (
        <>
          {/* Карточка лимита — вертикальная, справа — папка документов той же высоты (Кирилл 2026-11-11);
              на телефоне папка — под шагами подписания. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={stepsHeight > 0 ? { minHeight: stepsHeight } : undefined}>
            {stage === 'cancelled' ? <CancelledLimitCard applyUrl={landingUrl} /> : <LimitCard limit={lim} />}
            <DocumentsFolder className="hidden sm:flex" count={set.data.documents.length} onOpen={() => setDocsOpen(true)} />
          </div>
          {stage === 'cancelled' ? null : (
            /* Отступ от карточек до заголовка подписей больше обычного (Кирилл 2026-11-11). */
            <SigningSteps className="mt-8" limit={lim} limitUpdatedAt={limit.dataUpdatedAt} />
          )}
          <DocumentsFolder className="sm:hidden" count={set.data.documents.length} onOpen={() => setDocsOpen(true)} />
          <DocumentsPanel set={set.data} open={docsOpen} onOpenChange={setDocsOpen} />
        </>
      ) : null}
    </div>
  );
}
