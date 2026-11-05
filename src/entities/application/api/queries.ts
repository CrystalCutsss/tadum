// Запросы заявки и компании через ApplicationPort (TanStack Query — единственный слой данных).
import { queryOptions } from '@tanstack/react-query';

import { getApi } from '@/shared/api';

export const applicationQuery = queryOptions({
  queryKey: ['application', 'current'],
  queryFn: async () => (await getApi()).application.getCurrent(),
});

export const companyQuery = queryOptions({
  queryKey: ['application', 'company'],
  queryFn: async () => (await getApi()).application.getCompany(),
  staleTime: 5 * 60_000,
});
