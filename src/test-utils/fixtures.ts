// Мини-фабрики данных для unit-тестов чистых функций (не фикстуры персон — те в блоке 5b).
import type { Document, DocumentSet, DocumentStatus, Limit, LimitStatus } from '@/shared/api';

const T = '2026-11-04T10:00:00Z';

export function doc(status: DocumentStatus, opts: Partial<Document> = {}): Document {
  const files =
    status === 'pending'
      ? []
      : [
          {
            id: 'f1',
            name: 'file.pdf',
            mime: 'application/pdf' as const,
            size_bytes: 1000,
            sha256: 'h1',
            uploaded_at: T,
            download_url: '/f1',
            prevalidation: { state: 'passed' as const, rule_keys: [] },
          },
        ];
  return {
    id: `doc_${opts.portal_key ?? 'bs'}`,
    set_id: 'set_1',
    portal_key: 'bs',
    status,
    required: true,
    rejected_file_hashes: [],
    files,
    hint: { title_key: 'document.bs.title', hint_key: 'document.bs.hint' },
    updated_at: T,
    ...opts,
  };
}

export function docSet(documents: Document[], opts: Partial<DocumentSet> = {}): DocumentSet {
  return { id: 'set_1', owner: { kind: 'application', id: 'app_1' }, round: 1, status: 'draft', locked: false, documents, ...opts };
}

export function limit(status: LimitStatus, completed: boolean): Pick<Limit, 'status' | 'checklist'> {
  const s = completed ? 'done' : 'pending';
  return {
    status,
    checklist: {
      completed,
      items: [
        { key: 'spa_sadq', status: s },
        { key: 'pn_company_nafith', status: s },
        { key: 'pn_owner_nafith', status: s },
      ],
    },
  };
}
