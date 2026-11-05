// Интерфейс провайдера аналитики (04-metrics-and-events.md §2.5): код событий от провайдера не зависит.
import type { AnalyticsContext } from '../context';

export interface CapturedEvent {
  name: string;
  props: Readonly<Record<string, unknown>>;
  context: AnalyticsContext;
}

export interface AnalyticsProvider {
  capture(event: CapturedEvent): void;
}
