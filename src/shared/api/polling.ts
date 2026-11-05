// Опрос статусов (D-035, SC-05): по интервалу и при возврате на вкладку; статус — только из данных бэкенда.
import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

import { STATUS_POLL_INTERVAL_MS } from '@/shared/config';

export type StatusPollingOptions<TData, TKey extends QueryKey> = UseQueryOptions<TData, Error, TData, TKey>;

export function useStatusPolling<TData, TKey extends QueryKey>(options: StatusPollingOptions<TData, TKey>) {
  return useQuery({
    ...options,
    refetchInterval: STATUS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
