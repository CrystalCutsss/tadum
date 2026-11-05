// Точка доступа к данным: адаптер по VITE_API_MODE. Адаптеры, фикстуры и Zod-валидация ответов
// грузятся динамическим import() — в первый чанк не попадают (D-073, бюджет 200 КБ — D-054).

import type { MockDomain } from './adapters/mock/domain';
import type { Api } from './ports/ports';

export interface ApiConfig {
  mode: 'mock' | 'http';
  /** Бизнес-правила для мока (entities), внедряет app/api.ts. */
  domain: MockDomain;
  landingUrl: string;
  /** false — мок без задержек (тесты). */
  latency?: boolean;
}

let config: ApiConfig | null = null;
let instance: Promise<Api> | null = null;

export function configureApi(next: ApiConfig): void {
  config = next;
  instance = null;
}

async function load(c: ApiConfig): Promise<Api> {
  const { withValidation } = await import('./validation');
  if (c.mode === 'http') {
    const { createHttpApi } = await import('./adapters/http');
    return withValidation(createHttpApi());
  }
  const { createMockApi } = await import('./adapters/mock');
  return withValidation(createMockApi({ domain: c.domain, landingUrl: c.landingUrl, latency: c.latency ?? true }));
}

/** Адаптер портов; загружается при первом обращении. */
export function getApi(): Promise<Api> {
  if (!config) return Promise.reject(new Error('configureApi() must be called before getApi()'));
  instance ??= load(config);
  return instance;
}
