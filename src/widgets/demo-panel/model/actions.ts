// Демо-действия персоны (01-statuses.md §10, SP-03 §7): параметры подставляются из текущих данных мока.
// Действия «от имени» UW, Sales и Odoo — их интерфейса в портале нет (01-roles.md §7).
import type { Api, DemoActions } from '@/shared/api';
import type { Family } from '@/shared/config';

type DemoActionId = Exclude<keyof DemoActions, 'setNetwork' | 'setPersona'>;

export interface DemoActionSpec {
  id: DemoActionId;
  family: Family | 'any';
  run: (api: Api) => Promise<void> | void;
}

const sar = (amount: number) => ({ amount_minor: amount * 100, currency: 'SAR' as const });

async function clientSet(api: Api) {
  const app = await api.application.getCurrent();
  return api.documents.getSet({ kind: 'application', id: app.id });
}

async function firstReceived(api: Api): Promise<string> {
  const doc = (await clientSet(api)).documents.find((d) => d.status === 'received');
  if (!doc) throw new Error('no_received_document');
  return doc.id;
}

let lastDealId: string | null = null;

export const DEMO_ACTIONS: readonly DemoActionSpec[] = [
  { id: 'submitDocumentSet', family: 'client', run: (api) => api.demo!.submitDocumentSet() },
  { id: 'uwApproveDocument', family: 'client', run: async (api) => api.demo!.uwApproveDocument(await firstReceived(api)) },
  { id: 'uwRejectDocument', family: 'client', run: async (api) => api.demo!.uwRejectDocument(await firstReceived(api), 'reject.bs.period') },
  { id: 'uwRequestMoreDocs', family: 'client', run: (api) => api.demo!.uwRequestMoreDocs(['bs', 'vat_sales']) },
  { id: 'uwApproveApplication', family: 'client', run: (api) => api.demo!.uwApproveApplication(sar(150_000)) },
  { id: 'salesConfirmOffer', family: 'client', run: (api) => api.demo!.salesConfirmOffer() },
  {
    id: 'externalSign',
    family: 'client',
    run: async (api) => {
      const item = (await api.limit.getChecklist()).items.find((i) => i.status !== 'done');
      if (!item) throw new Error('checklist_done');
      api.demo!.externalSign(item.key);
    },
  },
  {
    id: 'createDeal',
    family: 'client',
    run: (api) => {
      lastDealId = api.demo!.createDeal(sar(10_000), 'sup_ext_01');
    },
  },
  {
    id: 'payDeal',
    family: 'client',
    run: (api) => {
      if (!lastDealId) throw new Error('no_deal');
      api.demo!.payDeal(lastDealId);
      lastDealId = null;
    },
  },
  { id: 'cancelLimit', family: 'client', run: (api) => api.demo!.cancelLimit() },
  { id: 'uwReject', family: 'client', run: (api) => api.demo!.uwReject() },
  { id: 'salesLose', family: 'client', run: (api) => api.demo!.salesLose() },
  { id: 'createApplication', family: 'client', run: (api) => api.demo!.createApplication() },
  { id: 'uwApproveSupplierSet', family: 'supplier', run: (api) => api.demo!.uwApproveSupplierSet() },
  { id: 'uwRejectSupplierDocument', family: 'supplier', run: (api) => api.demo!.uwRejectSupplierDocument('sup_iban_letter', 'reject.iban.unreadable') },
  { id: 'odooRequireDocument', family: 'supplier', run: (api) => api.demo!.odooRequireDocument('sup_cr') },
  { id: 'expireSession', family: 'any', run: (api) => api.demo!.expireSession() },
];
