// Единственная точка доступа к localStorage/sessionStorage (D-072).
// Ключи получают префикс `tadum:<BASE_URL>:`: версии на одном домене витрины не видят друг друга.
// Если хранилище недоступно (приватный режим, запрет cookie), данные живут в памяти до перезагрузки.
// TODO(блок 5c): при переходе на память отправлять событие `storage_unavailable`.

type StorageKind = 'local' | 'session';

const PREFIX = `tadum:${import.meta.env.BASE_URL}:`;

const memory: Record<StorageKind, Map<string, string>> = {
  local: new Map(),
  session: new Map(),
};

function backend(kind: StorageKind): Storage | null {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = `${PREFIX}__probe__`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
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
