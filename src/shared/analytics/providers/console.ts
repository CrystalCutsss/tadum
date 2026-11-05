// ConsoleProvider — разработка и витрина (D-059): событие в консоль браузера.
import type { AnalyticsProvider } from './types';

export const consoleProvider: AnalyticsProvider = {
  capture({ name, props, context }) {
    console.info(`[analytics] ${name}`, props, context);
  },
};
