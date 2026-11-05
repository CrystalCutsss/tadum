// HttpAdapter — каркас: сборка с VITE_API_MODE=http проходит, методы бросают NotImplementedError.
// Контракт эндпоинтов — 05-backend-contract.md (блок 5c). Условия поставщика — статический JSON (D-041).
import { NotImplementedError } from '../../ports/errors';
import { RESPONSE_SCHEMAS, type Api, type Ports } from '../../ports/ports';
import { loadOfferContent } from '../static/offer';

function stubPort<K extends keyof Ports>(port: K): Ports[K] {
  const methods = Object.keys(RESPONSE_SCHEMAS[port]);
  return Object.fromEntries(
    methods.map((m) => [
      m,
      () => Promise.reject(new NotImplementedError(`${port}.${m}`)),
    ]),
  ) as unknown as Ports[K];
}

export function createHttpApi(): Api {
  return {
    auth: stubPort('auth'),
    application: stubPort('application'),
    documents: stubPort('documents'),
    limit: stubPort('limit'),
    supplier: stubPort('supplier'),
    referredClients: stubPort('referredClients'),
    offer: { get: () => Promise.resolve(loadOfferContent()) },
    demo: null,
  };
}
