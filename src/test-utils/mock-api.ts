// Мок для тестов: те же бизнес-правила entities, что внедряет app/api.ts, без задержек.
import { landingUrl, mockDomain } from '@/app/api';
import { createMockApi } from '@/shared/api/adapters/mock';
import { withValidation, type Api } from '@/shared/api';

export { landingUrl, mockDomain };

/** Фиксированное время тестов (D-073): 2026-11-04 09:00 Asia/Riyadh. */
export const TEST_NOW = '2026-11-04T09:00:00+03:00';

export function testApi(): Api {
  return withValidation(createMockApi({ domain: mockDomain, landingUrl, latency: false }));
}
