// Zod-валидация ответов всех портов (5b.1). Загружается динамически из client.ts вместе с адаптером.
import { z } from 'zod';

import { ServerError } from './ports/errors';
import type { Api, Ports } from './ports/ports';
import {
  DownloadLinkSchema,
  OtpChallengeSchema,
  ReferredClientsPageSchema,
  SupplierCountersSchema,
  UploadResultSchema,
} from './ports/response-schemas';
import {
  ApplicationSchema,
  CompanySchema,
  DocumentSchema,
  DocumentSetSchema,
  LimitSchema,
  OfferContentSchema,
  OnboardingChecklistSchema,
  SessionSchema,
  SupplierSchema,
} from './ports/schemas';

type Schemas<P> = { [K in keyof P]: z.ZodType };

export const RESPONSE_SCHEMAS: { [K in keyof Ports]: Schemas<Ports[K]> } = {
  auth: { requestOtp: OtpChallengeSchema, verifyOtp: SessionSchema, getSession: SessionSchema.nullable(), logout: z.void() },
  application: { getCurrent: ApplicationSchema, getCompany: CompanySchema, setCrNumber: CompanySchema, createApplication: ApplicationSchema },
  documents: {
    getSet: DocumentSetSchema,
    upload: UploadResultSchema,
    replace: UploadResultSchema,
    delete: DocumentSchema,
    submit: DocumentSetSchema,
    download: DownloadLinkSchema,
  },
  limit: { get: LimitSchema, getChecklist: OnboardingChecklistSchema },
  supplier: { get: SupplierSchema, getCounters: SupplierCountersSchema },
  referredClients: { list: ReferredClientsPageSchema },
  offer: { get: OfferContentSchema },
};


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
