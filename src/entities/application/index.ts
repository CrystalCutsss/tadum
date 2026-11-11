// Публичный API сущности application.
export type * from './model/types';
export { ODOO_STAGE_MAP, isKnownOdooStage, mapOdooStage, type StageMapping } from './model/odoo-stage-map';
export {
  CLIENT_STATUS_TRANSITIONS,
  PERMISSION_STATE_BY_CLIENT_STATUS,
  deriveClientStatus,
  derivePermissionState,
  deriveSupplierViewStatus,
  isAllowedClientTransition,
} from './model/status';
export {
  CLIENT_PERMISSIONS,
  canCreateReapplication,
  canEditFiles,
  canOpenExternalLinks,
  canReuploadRejected,
  canSubmitDocumentSet,
  canViewLimit,
  clientCan,
  type ClientPermission,
} from './model/permissions';
export { clientNextStep, type ClientNextStepInput } from './model/next-step';
export {
  CLIENT_TIMELINE_STEPS,
  computeClientTimeline,
  type ClientTimeline,
  type ClientTimelineInput,
  type ClientTimelineStep,
  type TimelineStepState,
} from './model/timeline';
export { applicationQuery, companyQuery } from './api/queries';
export { statusMemory, statusNoticeOnEnter, transitionKey, type StatusMemory, type StatusNotice } from './model/status-notice';
export { CR_LENGTH, crDigits, crError, isValidCr, type CrError } from './model/cr';
