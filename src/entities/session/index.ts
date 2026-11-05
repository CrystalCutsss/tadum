// Публичный API сущности session.
export type * from './model/types';
export {
  initialActiveRole,
  isClientRole,
  resolveRoles,
  roleFamily,
  routePrefix,
  sessionKind,
  type LeadMatch,
  type RoleLookups,
  type SessionKind,
} from './model/roles';
