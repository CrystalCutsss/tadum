// Публичный API сегмента shared/analytics.
export { track, setAnalyticsProviders, providersFor } from './track';
export { setAnalyticsContext, currentContext, type AnalyticsContext } from './context';
export * from './buckets';
export type * from './events';
export { EVENT_VERSIONS } from './events';
export { assertNoPii, PiiViolation } from './pii-guard';
export { demoFeed, type DemoFeedEntry } from './providers/demo-panel';
export type { AnalyticsProvider, CapturedEvent } from './providers/types';
