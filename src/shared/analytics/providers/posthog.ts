// PostHog — боевой провайдер-кандидат (D-011). Заглушка без SDK до решения SFL-895: события не отправляются.
// При подключении: без PII, анонимизация IP, без session replay (D-055); только в проде (D-059).
import type { AnalyticsProvider } from './types';

export const posthogProvider: AnalyticsProvider = {
  capture() {
    // SDK не подключён (SFL-895).
  },
};
