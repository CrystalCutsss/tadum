// Опрос статусов (D-035, SC-05): по интервалу и при возврате на вкладку; статус — только из данных бэкенда.
import { useQuery, type QueryKey } from '@tanstack/react-query';

import { STATUS_POLL_INTERVAL_MS } from '@/shared/config';

export interface StatusPollingOptions {
  enabled?: boolean;
}

export function useStatusPolling<T>(queryKey: QueryKey, queryFn: () => Promise<T>, options: StatusPollingOptions = {}) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: STATUS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: options.enabled ?? true,
  });
}
