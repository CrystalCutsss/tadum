// Публичный API сущности supplier.
export type * from './model/types';
export { deriveSupplierStatus, isSupplierPartner } from './model/status';
export { supplierApplicationStage, type SupplierApplicationStage } from './model/stage';
export {
  SUPPLIER_PERMISSIONS,
  supplierCan,
  type SupplierPermission,
  type SupplierPermissionContext,
  type SupplierRule,
} from './model/permissions';
export { supplierNextStep, type SupplierNextStepInput } from './model/next-step';
export {
  SUPPLIER_TIMELINE_STEPS,
  computeSupplierTimeline,
  type SupplierTimelineStep,
  type SupplierTimelineStepState,
} from './model/timeline';
export { supplierQuery } from './api/queries';
export {
  cityError,
  emailError,
  industryError,
  isSupplierProfileComplete,
  PROFILE_TEXT_MAX,
  type CityError,
  type EmailError,
  type ProfileTextError,
  type SupplierProfileValues,
} from './model/profile';
