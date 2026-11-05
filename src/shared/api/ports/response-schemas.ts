// Схемы ответов портов, которых нет среди сущностей (01-entities.md). Используются только в лениво
// загружаемых модулях (validation.ts, адаптеры): zod не попадает в первый чанк.
import { z } from 'zod';

import { DateTimeSchema, DocumentSchema, PrevalidationResultSchema, ReferredClientSchema, SupplierSchema } from './schemas';

export const OtpChannelSchema = z.enum(['sms', 'whatsapp']);

export const OtpChallengeSchema = z.object({
  channel: OtpChannelSchema,
  length: z.number().int(),
  expires_at: DateTimeSchema,
  resend_available_at: DateTimeSchema,
  attempts_left: z.number().int().nonnegative(),
});

export const UploadResultSchema = z.object({
  document: DocumentSchema,
  /** `failed` — файл не принят, документ не изменился (SC-02 A3). */
  prevalidation: PrevalidationResultSchema,
});

export const DownloadLinkSchema = z.object({ url: z.string() });

export const SupplierCountersSchema = SupplierSchema.shape.counters;

export const ReferredClientsPageSchema = z.object({
  items: z.array(ReferredClientSchema),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export type OtpChannel = z.infer<typeof OtpChannelSchema>;
export type OtpChallenge = z.infer<typeof OtpChallengeSchema>;
export type UploadResult = z.infer<typeof UploadResultSchema>;
export type DownloadLink = z.infer<typeof DownloadLinkSchema>;
export type SupplierCounters = z.infer<typeof SupplierCountersSchema>;
export type ReferredClientsPage = z.infer<typeof ReferredClientsPageSchema>;
