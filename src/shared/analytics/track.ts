// track(): типизированное событие словаря + общий контекст §2.2 → провайдеры (VITE_ANALYTICS).
// Имя — только литерал из EventName (ESLint); свойства проверяются типом и, в dev, PII-guard.
import { currentContext } from './context';
import type { EventName, EventProps } from './events';
import { assertNoPii } from './pii-guard';
import { consoleProvider } from './providers/console';
import { posthogProvider } from './providers/posthog';
import type { AnalyticsProvider } from './providers/types';

type ProviderMode = 'console' | 'posthog';

/** На витрине и локально — консоль; боевой провайдер — только в проде (D-059). Демо-панели с лентой событий нет (Кирилл 2026-11-06). */
export function providersFor(mode: ProviderMode | undefined): AnalyticsProvider[] {
  switch (mode) {
    case 'posthog':
      return [posthogProvider];
    case 'console':
    default:
      return [consoleProvider];
  }
}

let providers: AnalyticsProvider[] = providersFor(import.meta.env.VITE_ANALYTICS);

/** Подменить провайдеров (тесты). Возвращает функцию отката. */
export function setAnalyticsProviders(next: AnalyticsProvider[]): () => void {
  const previous = providers;
  providers = next;
  return () => {
    providers = previous;
  };
}

export function track<N extends EventName>(name: N, props: EventProps<N>): void {
  const record = props as Readonly<Record<string, unknown>>;
  if (import.meta.env.DEV) assertNoPii(name, record);
  const event = { name, props: record, context: currentContext() };
  for (const p of providers) {
    try {
      p.capture(event);
    } catch {
      // аналитика никогда не ломает интерфейс
    }
  }
}
