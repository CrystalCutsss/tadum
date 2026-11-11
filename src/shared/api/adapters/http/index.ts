// HttpAdapter — каркас для команды разработки: те же сигнатуры, что у портов, каждый метод бросает
// NotImplementedError(port, method). Контракт эндпоинтов — docs/05-backend-contract.md (`pnpm contract:md`).
// Условия поставщика — статический JSON и после подключения бэкенда (D-041).
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars -- каркас: параметры документируют сигнатуры, тела появятся с API */
import { NotImplementedError } from '../../ports/errors';
import type {
  Api,
  ApplicationPort,
  AuthPort,
  DocumentSetOwner,
  DocumentsPort,
  LimitPort,
  ReferredClientsPort,
  ReferredClientsQuery,
  SupplierPort,
  UploadFile,
  UploadOptions,
} from '../../ports/ports';
import { loadOfferContent } from '../static/offer';

const todo = (port: string, method: string): never => {
  throw new NotImplementedError(port, method);
};

const auth: AuthPort = {
  async requestOtp(_phone: string) {
    return todo('auth', 'requestOtp');
  },
  async verifyOtp(_phone: string, _code: string) {
    return todo('auth', 'verifyOtp');
  },
  async getSession() {
    return todo('auth', 'getSession');
  },
  async logout() {
    return todo('auth', 'logout');
  },
};

const application: ApplicationPort = {
  async getCurrent() {
    return todo('application', 'getCurrent');
  },
  async getCompany() {
    return todo('application', 'getCompany');
  },
  async setCrNumber(_crNumber: string) {
    return todo('application', 'setCrNumber');
  },
  async createApplication() {
    return todo('application', 'createApplication');
  },
};

const documents: DocumentsPort = {
  async getSet(_owner: DocumentSetOwner) {
    return todo('documents', 'getSet');
  },
  async upload(_documentId: string, _file: UploadFile, _options?: UploadOptions) {
    return todo('documents', 'upload');
  },
  async replace(_documentId: string, _fileId: string, _file: UploadFile, _options?: UploadOptions) {
    return todo('documents', 'replace');
  },
  async delete(_documentId: string, _fileId: string) {
    return todo('documents', 'delete');
  },
  async submit(_setId: string) {
    return todo('documents', 'submit');
  },
  async download(_fileId: string) {
    return todo('documents', 'download');
  },
};

const limit: LimitPort = {
  async get() {
    return todo('limit', 'get');
  },
  async getChecklist() {
    return todo('limit', 'getChecklist');
  },
};

const supplier: SupplierPort = {
  async get() {
    return todo('supplier', 'get');
  },
  async getCounters() {
    return todo('supplier', 'getCounters');
  },
};

const referredClients: ReferredClientsPort = {
  async list(_query?: ReferredClientsQuery) {
    return todo('referredClients', 'list');
  },
};

export function createHttpApi(): Api {
  return {
    auth,
    application,
    documents,
    limit,
    supplier,
    referredClients,
    offer: { get: () => Promise.resolve(loadOfferContent()) },
    demo: null,
  };
}
