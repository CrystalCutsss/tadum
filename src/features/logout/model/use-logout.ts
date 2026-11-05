// Выход (SC-10 §1.2, A10): сессия, returnTo и кэш данных удаляются; язык и тема сохраняются; → /login.
// Офлайн: локальная сессия удаляется сразу, серверная — при следующем онлайне (в моке — сразу).
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { SESSION_QUERY_KEY, authMemory, loginFlow } from '@/entities/session';
import { track } from '@/shared/analytics';
import { getApi } from '@/shared/api';
import { network } from '@/shared/lib';

/** Ядро выхода без навигации — для хука и тестов. */
export async function performLogout(queryClient: QueryClient): Promise<{ offline: boolean }> {
  const offline = !network.isOnline();
  try {
    await (await getApi()).auth.logout();
  } catch {
    // A10: без сети серверная сессия инвалидируется при следующем онлайне; локально выходим всё равно.
  }
  track('logout', { offline });
  authMemory.clearReturnTo();
  loginFlow.finish();
  // «Назад» после выхода не покажет данные: кэш очищен, гарды снова спросят сессию.
  queryClient.clear();
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
  return { offline };
}

export function useLogout(): { logout: () => Promise<void>; pending: boolean } {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  return {
    pending,
    logout: async () => {
      setPending(true);
      await performLogout(queryClient);
      setPending(false);
      await navigate({ to: '/login', replace: true });
    },
  };
}
