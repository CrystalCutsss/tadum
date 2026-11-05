// Состояние сети для оболочки (SC-10 §1.6): браузер (online/offline) или имитация из демо-панели (setNetwork).
import { useSyncExternalStore } from 'react';

let simulatedOffline = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function browserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export const network = {
  isOnline: (): boolean => browserOnline() && !simulatedOffline,
  /** Демо-панель: setNetwork('offline') показывает те же состояния, что и настоящий офлайн. */
  simulateOffline: (value: boolean): void => {
    simulatedOffline = value;
    notify();
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', listener);
      window.addEventListener('offline', listener);
    }
    return () => {
      listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', listener);
        window.removeEventListener('offline', listener);
      }
    };
  },
};

export function useOnline(): boolean {
  return useSyncExternalStore(network.subscribe, network.isOnline, () => true);
}
