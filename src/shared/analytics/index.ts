// Публичный API сегмента shared/analytics.
export { track, setAnalyticsProviders, providersFor } from './track';
export { setAnalyticsContext, currentContext, type AnalyticsContext } from './context';
export * from './buckets';
export type * from './events';
export { EVENT_VERSIONS } from './events';
export { assertNoPii, PiiViolation } from './pii-guard';
export type { AnalyticsProvider, CapturedEvent } from './providers/types';
