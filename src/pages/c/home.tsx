// /c/home — главная активного клиента (D-098, бриф TD-002). Гард: без активного лимита (и без лимита, отменённого
// после активации) — редирект в «Заявку» без ошибки. Лимит, заявка и компания запрашиваются параллельно (A-047):
// гарду нужен только лимит, остальное (и график платежей, D-102) грузится вместе с ним.
import { createFileRoute, redirect } from '@tanstack/react-router';

import { applicationQuery, companyQuery } from '@/entities/application';
import { hasClientHome, limitQuery } from '@/entities/limit';
import { repaymentScheduleQuery } from '@/entities/repayment';
import { ROUTES } from '@/shared/config';

import { ClientHome } from '../-components/client-home';

export const Route = createFileRoute('/c/home')({
  beforeLoad: async ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(applicationQuery);
    void queryClient.prefetchQuery(companyQuery);
    void queryClient.prefetchQuery(repaymentScheduleQuery);
    // Ошибка лимита — не редирект: экран покажет «Повторить» и поддержку.
    const limit = await queryClient.ensureQueryData(limitQuery).catch(() => undefined);
    if (limit !== undefined && !hasClientHome(limit)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- redirect() TanStack Router бросается по контракту
      throw redirect({ to: ROUTES.clientDocuments, replace: true });
    }
  },
  component: ClientHome,
});
