// Единственный источник текущего времени. Демо-режим (блок 5b) подменяет его, чтобы «перематывать» сценарии.

type NowFn = () => number;

let nowFn: NowFn = () => Date.now();

/** Текущее время, мс с эпохи. */
export function now(): number {
  return nowFn();
}

/** Текущее время как Date. */
export function nowDate(): Date {
  return new Date(nowFn());
}

/** Подменить источник времени (демо-панель, тесты). Возвращает функцию отката. */
export function setClock(fn: NowFn): () => void {
  const previous = nowFn;
  nowFn = fn;
  return () => {
    nowFn = previous;
  };
}
