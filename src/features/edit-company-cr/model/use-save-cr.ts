// Сохранение номера CR компании (решение Кирилла 2026-11-10): без него комплект не отправить.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { companyQuery } from '@/entities/application';
import { getApi } from '@/shared/api';

export function useSaveCr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crNumber: string) => (await getApi()).application.setCrNumber(crNumber),
    onSuccess: (company) => queryClient.setQueryData(companyQuery.queryKey, company),
  });
}
