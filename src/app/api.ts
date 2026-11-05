// Подключение портов: мок получает бизнес-правила из entities (shared их не импортирует).
import {
  clientNextStep,
  deriveClientStatus,
  derivePermissionState,
  deriveSupplierViewStatus,
} from '@/entities/application';
import { findDocumentType, hintFor, transitionDocument } from '@/entities/document';
import { computeLimitAmounts, computeTurnover, isChecklistCompleted } from '@/entities/limit';
import { initialActiveRole, resolveRoles } from '@/entities/session';
import { deriveSupplierStatus, supplierNextStep } from '@/entities/supplier';
import { PERSONA_IDS, configureApi, getApi, type MockDomain } from '@/shared/api';

export const mockDomain: MockDomain = {
  deriveClientStatus,
  derivePermissionState,
  deriveSupplierViewStatus,
  clientNextStep,
  supplierNextStep,
  deriveSupplierStatus,
  computeLimitAmounts,
  computeTurnover,
  isChecklistCompleted,
  transitionDocument,
  resolveRoles,
  initialActiveRole,
  hintFor,
  prevalidationRules: (key) => findDocumentType(key)?.prevalidation_rules ?? [],
};

export const landingUrl: string = import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';

const PERSONA_PARAM = 'persona';

/**
 * Демо-режим: `?persona=<id>` (01-entities.md §6) выбирает персону мока и сразу входит под ней.
 * Демо включено, пока VITE_DEMO_PANEL не равен 0 (прод). Параметр убирается из адреса, чтобы перезагрузка не сбрасывала состояние персоны.
 */
async function applyPersonaFromUrl(): Promise<void> {
  const url = new URL(window.location.href);
  const persona = url.searchParams.get(PERSONA_PARAM);
  if (!persona || !(PERSONA_IDS as readonly string[]).includes(persona)) return;
  const api = await getApi();
  api.demo?.setPersona(persona);
  url.searchParams.delete(PERSONA_PARAM);
  window.history.replaceState(window.history.state, '', url);
}

export function initApi(): void {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock';
  configureApi({ mode, domain: mockDomain, landingUrl });
  if (mode === 'mock' && import.meta.env.VITE_DEMO_PANEL !== '0') void applyPersonaFromUrl();
}
