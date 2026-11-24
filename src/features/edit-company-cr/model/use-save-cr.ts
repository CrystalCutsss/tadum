// Сохранение номера CR компании (решение Кирилла 2026-11-10): без него комплект не отправить.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { companyQuery } from '@/entities/application';
import { supplierQuery } from '@/entities/supplier';
import { getApi } from '@/shared/api';

/** Чей номер: компании клиента или поставщика (D-093 — тот же блок CR у поставщика). */
export type CrOwner = 'client' | 'supplier';

export function useSaveCr(owner: CrOwner = 'client') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crNumber: string) => {
      const api = await getApi();
      if (owner === 'supplier') {
        queryClient.setQueryData(supplierQuery.queryKey, await api.supplier.setCrNumber(crNumber));
        return;
      }
      queryClient.setQueryData(companyQuery.queryKey, await api.application.setCrNumber(crNumber));
    },
  });
}
