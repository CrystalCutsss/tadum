// HttpAdapter-каркас: каждый метод каждого порта (кроме статического оффера) — NotImplementedError(port, method).
import { describe, expect, it } from 'vitest';

import { NotImplementedError } from '../../ports/errors';
import { RESPONSE_SCHEMAS, type Ports } from '../../ports/ports';
import { createHttpApi } from '.';

const api = createHttpApi();
const calls = (Object.keys(RESPONSE_SCHEMAS) as (keyof Ports)[])
  .filter((port) => port !== 'offer')
  .flatMap((port) => Object.keys(RESPONSE_SCHEMAS[port]).map((method) => [port, method] as const));

describe('HttpAdapter — каркас', () => {
  it.each(calls)('%s.%s → NotImplementedError', async (port, method) => {
    const fn = (api[port] as unknown as Record<string, () => Promise<unknown>>)[method]!;
    await expect(fn()).rejects.toEqual(expect.objectContaining({ port, method }));
    await expect(fn()).rejects.toBeInstanceOf(NotImplementedError);
  });
  it('оффер — статический JSON (D-041), демо-действий нет', async () => {
    expect(await api.offer.get()).toEqual({ terms: { ar: '', en: '' }, materials: [] });
    expect(api.demo).toBeNull();
  });
});
