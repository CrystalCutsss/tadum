// Исполнение решений гардов (entities/session): redirect TanStack Router. returnTo — в sessionStore, не в URL.
import { redirect } from '@tanstack/react-router';

import { authMemory, type GuardDecision } from '@/entities/session';

/** Внутренний путь с query → параметры навигации. */
export function routeOf(path: string): { to: string; search: Record<string, string> } {
  const [pathname = '/', query = ''] = path.split('?');
  return { to: pathname, search: Object.fromEntries(new URLSearchParams(query.split('#')[0])) };
}

export function enforce(decision: GuardDecision): void {
  if (decision.kind === 'allow') return;
  if (decision.returnTo) authMemory.setReturnTo(decision.returnTo);
  const { to, search } = routeOf(decision.to);
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- redirect() TanStack Router бросается по контракту
  throw redirect({ to: to as '/', search: search as never, replace: true });
}
