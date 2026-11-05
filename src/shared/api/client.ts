// Точка доступа к данным: адаптер по VITE_API_MODE. MockAdapter с фикстурами и HttpAdapter
// грузятся динамическим import() — в первый чанк не попадают. Все ответы проходят Zod-валидацию.

import type { z } from 'zod';

import type { MockDomain } from './adapters/mock/domain';
import { ServerError } from './ports/errors';
import { RESPONSE_SCHEMAS, type Api } from './ports/ports';

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

type AnyMethod = (...args: unknown[]) => Promise<unknown>;

function validatePort<P>(port: P, schemas: Record<string, z.ZodType>): P {
  const source = port as unknown as Record<string, AnyMethod>;
  const wrapped = Object.fromEntries(
    Object.entries(schemas).map(([method, schema]) => [
      method,
      async (...args: unknown[]) => {
        const fn = source[method];
        if (!fn) throw new ServerError(`missing method ${method}`);
        const parsed = schema.safeParse(await fn(...args));
        if (!parsed.success) throw new ServerError('invalid_response');
        return parsed.data;
      },
    ]),
  );
  return wrapped as unknown as P;
}

export function withValidation(api: Api): Api {
  return {
    auth: validatePort(api.auth, RESPONSE_SCHEMAS.auth),
    application: validatePort(api.application, RESPONSE_SCHEMAS.application),
    documents: validatePort(api.documents, RESPONSE_SCHEMAS.documents),
    limit: validatePort(api.limit, RESPONSE_SCHEMAS.limit),
    supplier: validatePort(api.supplier, RESPONSE_SCHEMAS.supplier),
    referredClients: validatePort(api.referredClients, RESPONSE_SCHEMAS.referredClients),
    offer: validatePort(api.offer, RESPONSE_SCHEMAS.offer),
    demo: api.demo,
  };
}

async function load(c: ApiConfig): Promise<Api> {
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
