// /c/documents/sign — сценарий подписания (SC-06, D-083). Маршрут вне раскладки /c/documents (суффикс `_`):
// у «Заявки» нет дочерних экранов, экран подписания — самостоятельный, вложен только по адресу и крошкам.
import { createFileRoute } from '@tanstack/react-router';

import { applicationQuery, companyQuery } from '@/entities/application';
import { limitQuery } from '@/entities/limit';

import { ClientSigning } from '../-components/client-signing';

export const Route = createFileRoute('/c/documents_/sign')({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(applicationQuery);
    void queryClient.prefetchQuery(limitQuery);
    void queryClient.prefetchQuery(companyQuery);
  },
  component: ClientSigning,
});
