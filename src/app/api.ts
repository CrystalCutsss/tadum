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
import { setAnalyticsContext } from '@/shared/analytics';
import { PERSONA_IDS, configureApi, demoPersona, getApi, type MockDomain } from '@/shared/api';

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
 * Параметр остаётся в адресе (ссылку можно отправить коллеге, 01-cabinet-structure.md §8); персона сбрасывается
 * к фикстуре только при смене — перезагрузка той же ссылки состояние не теряет. Демо включено, пока
 * VITE_DEMO_PANEL не равен 0 (прод).
 */
async function applyPersonaFromUrl(): Promise<void> {
  const persona = new URL(window.location.href).searchParams.get(PERSONA_PARAM);
  if (!persona || !(PERSONA_IDS as readonly string[]).includes(persona)) return;
  setAnalyticsContext({ persona });
  if (demoPersona.get() === persona) return;
  const api = await getApi();
  api.demo?.setPersona(persona);
  demoPersona.set(persona);
}

export function initApi(): void {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock';
  configureApi({ mode, domain: mockDomain, landingUrl });
  if (mode === 'mock' && import.meta.env.VITE_DEMO_PANEL !== '0') void applyPersonaFromUrl();
}
