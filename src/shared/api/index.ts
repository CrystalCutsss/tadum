// Публичный API сегмента shared/api: схемы, порты, ошибки, клиент и опрос статусов.
// Адаптеры и фикстуры отсюда не реэкспортируются: они грузятся динамически из client.ts.
export * from './ports/schemas';
export * from './ports/errors';
export * from './ports/ports';
export { configureApi, getApi, withValidation, type ApiConfig } from './client';
export { useStatusPolling, type StatusPollingOptions } from './polling';
export type { MockDocumentEvent, MockDocumentTransition, MockDomain } from './adapters/mock/domain';
export { PERSONA_IDS, type PersonaId } from './fixtures/types';
