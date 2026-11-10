// Загрузка файлов документа (SC-02, D-028): файлы идут по одному (стабильнее во встроенном браузере WhatsApp),
// у каждого своё состояние queued → uploading % → validating → done | failed. Клиент остаётся в списке.
// Отмена: в порте нет прерывания, поэтому результат отменённой загрузки удаляем, если файл успел сохраниться (A-058).
// Несколько файлов в документе, до MAX_FILES_PER_DOCUMENT (решение Кирилла 2026-11-10). Тот же файл (по SHA-256: уже
// есть в документе или раньше не подошёл) не отправляется — вызывающий показывает окно-предупреждение (onSameFile).
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { track } from '@/shared/analytics';
import { DomainError, getApi, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_DOCUMENT, NetworkError, type Document, type UploadResult } from '@/shared/api';
import { network, now, sha256Hex } from '@/shared/lib';

export type UploadSource = 'camera' | 'gallery' | 'files' | 'unknown';
export type FileTaskState = 'queued' | 'uploading' | 'validating' | 'done' | 'failed' | 'cancelled';

export interface FileTask {
  key: string;
  name: string;
  size: number;
  state: FileTaskState;
  percent: number;
  /** Ключ i18n текста ошибки или предупреждения предвалидации. */
  messageKey?: string;
  messageValues?: Record<string, number>;
  warning?: boolean;
}

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'] as const;
type AnalyticsMime = 'pdf' | 'jpg' | 'png';
const MIME_SHORT: Record<(typeof ACCEPTED)[number], AnalyticsMime> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
type FailReason = 'too_large' | 'unsupported_type' | 'network' | 'offline' | 'server_error' | 'cancelled' | 'same_file_rejected';

const isAccepted = (type: string): type is (typeof ACCEPTED)[number] => (ACCEPTED as readonly string[]).includes(type);

/** Ошибка порта → ключ текста и причина для аналитики. */
export function uploadErrorOf(error: unknown): { key: string; values?: Record<string, number>; reason: FailReason } {
  if (error instanceof DomainError) {
    if (error.code === 'upload.error.too_large') return { key: 'upload.error.too_large', values: { max_mb: error.details.max_mb ?? 10 }, reason: 'too_large' };
    if (error.code === 'upload.error.unsupported_type') return { key: 'upload.error.unsupported_type', reason: 'unsupported_type' };
    if (error.code === 'document.same_file_rejected') return { key: 'upload.error.same_file', reason: 'same_file_rejected' };
    if (error.code === 'document_set_locked') return { key: 'upload.error.locked', reason: 'server_error' };
    if (error.code === 'upload.error.too_many') return { key: 'upload.error.files_limit', values: { max: MAX_FILES_PER_DOCUMENT }, reason: 'server_error' };
  }
  if (!network.isOnline()) return { key: 'upload.error.offline', reason: 'offline' };
  if (error instanceof NetworkError) return { key: 'upload.error.network', reason: 'network' };
  return { key: 'upload.error.server', reason: 'server_error' };
}

interface Job {
  key: string;
  file: File;
  source: UploadSource;
  replaceFileId: string | undefined;
}

let seq = 0;

/** Хэш файла; браузер без crypto.subtle (не https) — проверку пропускаем, её повторит сервер. */
async function hashOf(file: File): Promise<string | null> {
  try {
    return await sha256Hex(await file.arrayBuffer());
  } catch {
    return null;
  }
}

export interface UploadHandlers {
  /** Выбран тот же файл: он не загружается, показать предупреждение. */
  onSameFile?: (names: string[]) => void;
  /** Выбрано больше файлов, чем помещается в документ. */
  onTooMany?: (max: number) => void;
}

export function useDocumentUpload(doc: Pick<Document, 'id' | 'portal_key' | 'status' | 'files' | 'rejected_file_hashes'>, handlers: UploadHandlers = {}) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<FileTask[]>([]);
  const queue = useRef<Job[]>([]);
  const running = useRef(false);
  const cancelled = useRef(new Set<string>());
  // Обработчики из пропсов меняются на каждом рендере — держим последние в ref, колбэки очереди от них не зависят.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const patch = useCallback((key: string, next: Partial<FileTask>) => {
    setTasks((all) => all.map((t) => (t.key === key ? { ...t, ...next } : t)));
  }, []);

  const fail = useCallback(
    (key: string, portal_key: string, reason: FailReason, messageKey: string, messageValues?: Record<string, number>) => {
      patch(key, { state: 'failed', messageKey, ...(messageValues ? { messageValues } : {}) });
      track('document_upload_failed', { owner: 'client', portal_key, reason });
    },
    [patch],
  );

  const runOne = useCallback(
    async (job: Job, fileIndex: number) => {
      const { key, file } = job;
      const portal_key = doc.portal_key;
      // Проверки до отправки: файл не уходит в сеть, если заведомо не подойдёт.
      if (!isAccepted(file.type)) return fail(key, portal_key, 'unsupported_type', 'upload.error.unsupported_type');
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return fail(key, portal_key, 'too_large', 'upload.error.too_large', { max_mb: Math.round(MAX_FILE_SIZE_BYTES / 1_048_576) });
      }
      if (!network.isOnline()) return fail(key, portal_key, 'offline', 'upload.error.offline');

      track('document_upload_started', {
        owner: 'client',
        portal_key,
        size_kb: Math.round(file.size / 1024),
        mime: MIME_SHORT[file.type],
        source: job.source,
      });
      const started = now();
      const api = await getApi();
      const onProgress = (p: { percent: number; state: string }) => {
        if (cancelled.current.has(key)) return;
        if (p.state === 'uploading' || p.state === 'queued') patch(key, { state: 'uploading', percent: p.percent });
        else if (p.state === 'validating') patch(key, { state: 'validating', percent: 100 });
      };
      try {
        const result: UploadResult = job.replaceFileId
          ? await api.documents.replace(doc.id, job.replaceFileId, file, { onProgress })
          : await api.documents.upload(doc.id, file, { onProgress });
        if (cancelled.current.has(key)) {
          // Отменили, а файл успел сохраниться — убираем его, чтобы список совпадал с ожиданием клиента.
          const added = result.document.files.find((f) => !doc.files.some((old) => old.id === f.id));
          if (added) await api.documents.delete(doc.id, added.id).catch(() => undefined);
          track('document_upload_failed', { owner: 'client', portal_key, reason: 'cancelled' });
          return;
        }
        const pv = result.prevalidation;
        if (pv.state === 'failed') {
          const rule = pv.rule_keys[0] ?? 'prevalidation.failed.title';
          track('document_prevalidation_failed', { owner: 'client', portal_key, rule_key: rule });
          patch(key, { state: 'failed', messageKey: rule });
          return;
        }
        if (doc.status === 'rejected') {
          track('rejected_document_reuploaded', { owner: 'client', portal_key, attempt: 1, hours_since_rejection: 0 });
        }
        track('document_upload_succeeded', {
          owner: 'client',
          portal_key,
          prevalidation: pv.state === 'warning' ? 'warning' : 'passed',
          replace: Boolean(job.replaceFileId),
          file_index: fileIndex,
          duration_ms: now() - started,
        });
        patch(key, {
          state: 'done',
          percent: 100,
          ...(pv.state === 'warning' ? { warning: true, messageKey: pv.rule_keys[0] ?? 'prevalidation.warning.generic' } : {}),
        });
      } catch (error) {
        if (cancelled.current.has(key)) return;
        const e = uploadErrorOf(error);
        if (e.reason === 'same_file_rejected' && handlersRef.current.onSameFile) {
          // Сервер узнал тот же файл — то же окно, что и при проверке до отправки.
          track('document_upload_failed', { owner: 'client', portal_key, reason: e.reason });
          setTasks((all) => all.filter((t) => t.key !== key));
          handlersRef.current.onSameFile([file.name]);
          return;
        }
        fail(key, portal_key, e.reason, e.key, e.values);
      } finally {
        await queryClient.invalidateQueries({ queryKey: ['documents'] });
      }
    },
    [doc, fail, patch, queryClient],
  );

  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    let index = doc.files.length;
    while (queue.current.length > 0) {
      const job = queue.current.shift();
      if (!job || cancelled.current.has(job.key)) continue;
      await runOne(job, index);
      index += 1;
    }
    running.current = false;
  }, [doc.files.length, runOne]);

  /** Добавить файлы в очередь. replaceFileId — заменить конкретный файл (только первый из выбранных). */
  const start = useCallback(
    async (files: readonly File[], source: UploadSource, replaceFileId?: string) => {
      let picked = replaceFileId ? files.slice(0, 1) : [...files];
      if (!replaceFileId) {
        const queued = tasks.filter((t) => t.state === 'queued' || t.state === 'uploading' || t.state === 'validating').length;
        const room = Math.max(0, MAX_FILES_PER_DOCUMENT - doc.files.length - queued);
        if (picked.length > room) {
          handlersRef.current.onTooMany?.(MAX_FILES_PER_DOCUMENT);
          picked = picked.slice(0, room);
        }
      }
      // Тот же файл: уже есть в документе (кроме заменяемого), раньше не подошёл или выбран дважды.
      const known = new Set([...doc.rejected_file_hashes, ...doc.files.filter((f) => f.id !== replaceFileId).map((f) => f.sha256)]);
      const same: string[] = [];
      const fresh: File[] = [];
      for (const file of picked) {
        const sha = await hashOf(file);
        if (sha && known.has(sha)) {
          same.push(file.name);
          track('document_upload_failed', { owner: 'client', portal_key: doc.portal_key, reason: 'same_file_rejected' });
          continue;
        }
        if (sha) known.add(sha);
        fresh.push(file);
      }
      if (same.length > 0) handlersRef.current.onSameFile?.(same);
      const jobs = fresh.map((file): Job => ({ key: `u${(seq += 1)}`, file, source, replaceFileId }));
      if (jobs.length === 0) return;
      setTasks((all) => [...all, ...jobs.map((j): FileTask => ({ key: j.key, name: j.file.name, size: j.file.size, state: 'queued', percent: 0 }))]);
      queue.current.push(...jobs);
      void drain();
    },
    [doc.files, doc.portal_key, doc.rejected_file_hashes, drain, tasks],
  );

  const cancel = useCallback(
    (key: string) => {
      cancelled.current.add(key);
      queue.current = queue.current.filter((j) => j.key !== key);
      patch(key, { state: 'cancelled' });
    },
    [patch],
  );

  /** Убрать строку задачи (готовую, отменённую или с ошибкой) из списка. */
  const dismiss = useCallback((key: string) => setTasks((all) => all.filter((t) => t.key !== key)), []);

  const busy = tasks.some((t) => t.state === 'queued' || t.state === 'uploading' || t.state === 'validating');
  return { tasks, start, cancel, dismiss, busy };
}
