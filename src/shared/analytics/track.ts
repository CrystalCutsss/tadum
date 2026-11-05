// track(): типизированное событие словаря + общий контекст §2.2 → провайдеры (VITE_ANALYTICS).
// Имя — только литерал из EventName (ESLint); свойства проверяются типом и, в dev, PII-guard.
import { currentContext } from './context';
import type { EventName, EventProps } from './events';
import { assertNoPii } from './pii-guard';
import { consoleProvider } from './providers/console';
import { demoPanelProvider } from './providers/demo-panel';
import { posthogProvider } from './providers/posthog';
import type { AnalyticsProvider } from './providers/types';

type ProviderMode = 'console' | 'demo' | 'posthog';

/** На витрине — только лента демо-панели и консоль; боевой провайдер — только в проде (D-059). */
export function providersFor(mode: ProviderMode | undefined): AnalyticsProvider[] {
  switch (mode) {
    case 'posthog':
      return [posthogProvider];
    case 'demo':
      return [demoPanelProvider, consoleProvider];
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
