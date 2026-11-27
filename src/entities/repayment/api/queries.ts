// График платежей текущей заявки через RepaymentPort (D-102).
import { queryOptions } from '@tanstack/react-query';

import { getApi, type RepaymentSchedule } from '@/shared/api';

export const repaymentScheduleQuery = queryOptions({
  queryKey: ['repayment', 'schedule'],
  queryFn: async (): Promise<RepaymentSchedule> => (await getApi()).repayment.getSchedule(),
});
