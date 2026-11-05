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
