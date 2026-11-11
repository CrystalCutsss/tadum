// /demo/sign?item=<ключ пункта> — демо-страница подписи у партнёра (решение Кирилла 2026-11-11, A-063). Демо-панели
// нет (A-057), а настоящих Sadq и Nafith у мока нет: ссылка «Открыть» в чек-листе ведёт сюда, «Подписать» выполняет
// демо-действие externalSign — как будто партнёр подтвердил подпись. Экран заявки во вкладке, откуда открыли ссылку,
// подхватит статус при возврате (опрос по фокусу, D-035). Без логотипов и имитации интерфейса партнёров.
// В режиме бэкенда (api.demo нет) и в прод-сборке страница говорит, что шаг недоступен.
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { CHECKLIST_KEYS, getApi, type ChecklistKey } from '@/shared/api';
import { Badge, Button } from '@/shared/ui';

import { AuthLayout } from '../-components/auth-layout';

const TITLE_KEY = {
  spa_sadq: 'checklist.spa_sadq',
  pn_company_nafith: 'checklist.pn_company_nafith',
  pn_owner_nafith: 'checklist.pn_owner_nafith',
} as const;

interface SignSearch {
  item?: ChecklistKey;
}

const demoEnabled = import.meta.env.VITE_DEMO_PANEL !== '0';

function DemoSignPage() {
  const { t } = useTranslation();
  const { item }: SignSearch = Route.useSearch();
  const sign = useMutation({
    mutationFn: async (key: ChecklistKey) => {
      const api = await getApi();
      if (!api.demo) throw new Error('demo_unavailable');
      api.demo.externalSign(key);
    },
  });

  const back = (
    <Button asChild size="lg" variant="secondary" className="h-12 w-full text-base">
      <Link to="/c/documents">{t('demo_sign.back')}</Link>
    </Button>
  );

  if (!demoEnabled || !item) {
    return <AuthLayout title={t('demo_sign.unknown')}>{back}</AuthLayout>;
  }

  return (
    <AuthLayout title={t(TITLE_KEY[item])} subtitle={t('demo_sign.body')}>
      <div className="flex flex-col items-center gap-4">
        <Badge variant="secondary">{t('demo_sign.badge')}</Badge>
        {sign.isSuccess ? (
          <p role="status" className="text-center text-sm font-medium">
            {t('demo_sign.signed')}
          </p>
        ) : (
          <Button type="button" size="lg" className="h-12 w-full text-base" disabled={sign.isPending} onClick={() => sign.mutate(item)}>
            {t('demo_sign.sign')}
          </Button>
        )}
        {sign.isError ? <p className="text-center text-sm text-muted-foreground">{t('demo_sign.unknown')}</p> : null}
        {back}
      </div>
    </AuthLayout>
  );
}

export const Route = createFileRoute('/demo/sign')({
  validateSearch: (search: Record<string, unknown>): SignSearch =>
    (CHECKLIST_KEYS as readonly unknown[]).includes(search.item) ? { item: search.item as ChecklistKey } : {},
  component: DemoSignPage,
});
