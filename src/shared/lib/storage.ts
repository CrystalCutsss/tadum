// Единственная точка доступа к localStorage/sessionStorage (D-072).
// Ключи получают префикс `tadum:<BASE_URL>:`: версии на одном домене витрины не видят друг друга.
// Если хранилище недоступно (приватный режим, запрет cookie), данные живут в памяти до перезагрузки.
// О переходе на память сообщает onStorageUnavailable (app отправляет событие `storage_unavailable`).

type StorageKind = 'local' | 'session';

const PREFIX = `tadum:${import.meta.env.BASE_URL}:`;

const memory: Record<StorageKind, Map<string, string>> = {
  local: new Map(),
  session: new Map(),
};

let unavailable = false;
const unavailableListeners = new Set<() => void>();

/** Подписка на «хранилище недоступно, данные в памяти»; срабатывает один раз за загрузку страницы. */
export function onStorageUnavailable(listener: () => void): () => void {
  unavailableListeners.add(listener);
  if (unavailable) listener();
  return () => unavailableListeners.delete(listener);
}

function markUnavailable() {
  if (unavailable) return;
  unavailable = true;
  unavailableListeners.forEach((l) => l());
}

function backend(kind: StorageKind): Storage | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = `${PREFIX}__probe__`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    markUnavailable();
    return null;
  }
}

export interface ScopedStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function scoped(kind: StorageKind): ScopedStorage {
  return {
    get(key) {
      const full = PREFIX + key;
      const store = backend(kind);
      if (!store) return memory[kind].get(full) ?? null;
      try {
        return store.getItem(full);
      } catch {
        return memory[kind].get(full) ?? null;
      }
    },
    set(key, value) {
      const full = PREFIX + key;
      const store = backend(kind);
      try {
        if (store) {
          store.setItem(full, value);
          return;
        }
      } catch {
        // квота или запрет записи — уходим в память
      }
      memory[kind].set(full, value);
    },
    remove(key) {
      const full = PREFIX + key;
      memory[kind].delete(full);
      try {
        backend(kind)?.removeItem(full);
      } catch {
        // нечего удалять
      }
    },
  };
}

/** Постоянное хранилище (тема, язык). PII сюда не пишется. */
export const storage = scoped('local');

/** Хранилище на время вкладки (сессия входа). */
export const sessionStore = scoped('session');

export const storageKeyPrefix = PREFIX;
