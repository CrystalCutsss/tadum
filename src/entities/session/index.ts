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
export { SESSION_QUERY_KEY, loadSessionState, sessionQuery, type SessionState } from './api/session-query';
export { authMemory, loginFlow, type LoginSource, type PendingLogin } from './model/flow';
export {
  activeFamily,
  decideAuthScreen,
  decideCabinet,
  decideRoot,
  destinationAfterLogin,
  familiesOf,
  familyMemory,
  type GuardDecision,
} from './model/guards';
