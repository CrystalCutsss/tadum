// Публичный API сегмента shared/api: типы и константы контракта, порты, ошибки, клиент, опрос статусов.
// Zod-схемы, валидация, адаптеры и фикстуры отсюда не экспортируются как значения: они грузятся лениво
// (zod и мок — вне первого чанка). Схемы нужны только внутри shared/api и в тестах.
export type * from './ports/schemas';
export * from './ports/constants';
export * from './ports/errors';
export * from './ports/ports';
export { configureApi, getApi, type ApiConfig } from './client';
export { useStatusPolling, type StatusPollingOptions } from './polling';
export type { MockDocumentEvent, MockDocumentTransition, MockDomain } from './adapters/mock/domain';
export { PERSONA_IDS, type PersonaId } from './fixtures/types';
