// Публичный API сущности document.
export type * from './model/types';
export { ACCEPTED_MIME, DOCUMENT_CATALOG, catalogIndex, findDocumentType, hintFor, type DocumentType } from './model/catalog';
export { rejectReason, sortDocuments, transitionDocument, type DocumentEvent, type DocumentTransition } from './model/status';
