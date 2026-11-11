// Подключение портов: мок получает бизнес-правила из entities (shared их не импортирует).
import {
  clientNextStep,
  deriveClientStatus,
  derivePermissionState,
  deriveSupplierViewStatus,
} from '@/entities/application';
import { findDocumentType, hintFor, isSameFile, settleDocumentStatus, transitionDocument } from '@/entities/document';
import { computeLimitAmounts, computeTurnover, isChecklistCompleted } from '@/entities/limit';
import { initialActiveRole, resolveRoles } from '@/entities/session';
import { deriveSupplierStatus, supplierNextStep } from '@/entities/supplier';
import { setAnalyticsContext } from '@/shared/analytics';
import { PERSONA_IDS, configureApi, demoPersona, getApi, personaFromParam, type MockDomain } from '@/shared/api';

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
  settleDocumentStatus,
  isSameFile,
  resolveRoles,
  initialActiveRole,
  hintFor,
  prevalidationRules: (key) => findDocumentType(key)?.prevalidation_rules ?? [],
};

export const landingUrl: string = import.meta.env.VITE_LANDING_URL ?? 'https://tadum.sa';

/**
 * Демо-режим: `?persona=<id>` (01-entities.md §6) выбирает персону мока и сразу входит под ней.
 * Параметр остаётся в адресе (ссылку можно отправить коллеге, 01-cabinet-structure.md §8); персона сбрасывается
 * к фикстуре только при смене — перезагрузка той же ссылки состояние не теряет. Демо включено, пока
 * VITE_DEMO_PANEL не равен 0 (прод); литерал `get('persona')` — маркер `check:demo-excluded`.
 */
async function applyPersonaFromUrl(): Promise<void> {
  const persona = personaFromParam(new URL(window.location.href).searchParams.get('persona'));
  if (!persona || !(PERSONA_IDS as readonly string[]).includes(persona)) return;
  setAnalyticsContext({ persona });
  const api = await getApi();
  // Та же персона уже выбрана — состояние не трогаем (перезагрузка ссылки не теряет загрузки). Но если сохранённое
  // состояние мока сброшено (новая версия схемы, 2026-11-11) и сессии нет — входим заново, иначе ссылка ведёт на /login.
  // Истёкшая сессия бросает ошибку — её оставляем: экран «Сессия истекла» (SC-10).
  if (demoPersona.get() === persona && (await api.auth.getSession().catch(() => 'expired' as const)) !== null) return;
  api.demo?.setPersona(persona);
  demoPersona.set(persona);
}

/** Готово, когда персона из ?persona= применена: гарды маршрутов спрашивают сессию уже у неё. */
export async function initApi(): Promise<void> {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock';
  configureApi({ mode, domain: mockDomain, landingUrl });
  if (mode === 'mock' && import.meta.env.VITE_DEMO_PANEL !== '0') await applyPersonaFromUrl();
}
