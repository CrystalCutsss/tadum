// Текущее время для таймеров интерфейса (обратный отсчёт OTP, блокировки). Источник — clock.now().
import { useEffect, useState } from 'react';

import { now } from './clock';

/** Перерисовка раз в `intervalMs`; null — без тика (таймер не нужен). */
export function useNow(intervalMs: number | null = 1000): number {
  const [value, setValue] = useState(now);
  useEffect(() => {
    if (intervalMs === null) return undefined;
    const id = setInterval(() => setValue(now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return value;
}
