// Контекст роутера: гарды в beforeLoad читают сессию через тот же QueryClient, что и экраны.
import type { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
}
