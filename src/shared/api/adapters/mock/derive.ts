// Производные поля графа — так, как их вычислил бы бэкенд: client_status, permission_state, next_step,
// суммы лимита, статус и счётчики поставщика, проекция ReferredClient. Вызывается после каждого изменения.

import type { PersonaGraph } from '../../fixtures/types';
import type { ReferredClient, Supplier } from '../../ports/schemas';
import type { MockDomain } from './domain';

export function referredClients(g: PersonaGraph, d: MockDomain): ReferredClient[] {
  const supplier = g.supplier;
  if (!supplier) return [];
  return g.referrals.map((r) => ({
    application_id: r.application_id,
    company_name: r.company_name,
    applied_at: r.applied_at,
    supplier_view_status: d.deriveSupplierViewStatus(r.odoo_stage),
    turnover: d.computeTurnover(
      g.deals.filter((x) => x.application_id === r.application_id),
      supplier.id,
    ),
    updated_at: r.updated_at,
    attribution: r.attribution,
  }));
}

function counters(clients: readonly ReferredClient[]): Supplier['counters'] {
  return {
    referred_total: clients.length,
    under_review: clients.filter((c) => c.supplier_view_status === 'under_review').length,
    approved: clients.filter((c) => c.supplier_view_status === 'approved' || c.supplier_view_status === 'first_purchase').length,
  };
}

export function normalize(g: PersonaGraph, d: MockDomain, landingUrl: string): PersonaGraph {
  const limits = g.limits.map((l) => ({
    ...l,
    ...d.computeLimitAmounts(
      l.approved,
      g.deals.filter((x) => x.application_id === l.application_id),
    ),
    checklist: { ...l.checklist, completed: d.isChecklistCompleted(l.checklist.items) },
  }));

  const applications = g.applications.map((a) => {
    const client_status = d.deriveClientStatus(a.odoo_stage);
    const set = g.document_sets.find((s) => s.id === a.current_document_set_id) ?? null;
    const limit = limits.find((l) => l.id === a.limit_id) ?? null;
    return {
      ...a,
      client_status,
      permission_state: d.derivePermissionState(client_status),
      next_step: d.clientNextStep({ client_status, document_set: set, limit, review_eta_hours: a.review_eta_hours, landing_url: landingUrl }),
    };
  });

  let supplier = g.supplier;
  if (supplier) {
    const id = supplier.current_document_set_id;
    const set = g.document_sets.find((s) => s.id === id) ?? null;
    const supplier_status = d.deriveSupplierStatus(set);
    supplier = {
      ...supplier,
      supplier_status,
      next_step: d.supplierNextStep({ supplier_status, document_set: set }),
      counters: counters(referredClients(g, d)),
    };
  }

  return { ...g, limits, applications, supplier };
}
