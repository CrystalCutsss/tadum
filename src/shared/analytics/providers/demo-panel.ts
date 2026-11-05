// DemoPanelProvider — лента событий для демо-панели витрины (D-059): последние события в памяти вкладки.
import type { AnalyticsProvider, CapturedEvent } from './types';

const LIMIT = 200;

export interface DemoFeedEntry extends CapturedEvent {
  seq: number;
}

let entries: DemoFeedEntry[] = [];
let seq = 0;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

/** Хранилище ленты; форма подходит для useSyncExternalStore. */
export const demoFeed = {
  getSnapshot: (): readonly DemoFeedEntry[] => entries,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  clear(): void {
    entries = [];
    notify();
  },
};

export const demoPanelProvider: AnalyticsProvider = {
  capture(event) {
    entries = [{ ...event, seq: ++seq }, ...entries].slice(0, LIMIT);
    notify();
  },
};
