// Временная заглушка аналитики (блок 3): типизированный no-op.
// Реальная реализация со словарём событий, провайдерами и PII-guard — в блоке 5c.

export interface TrackEvents {
  language_changed: { to: 'ar' | 'en'; source: 'switch' | 'url' };
}

export function track<E extends keyof TrackEvents>(event: E, props: TrackEvents[E]): void {
  void event;
  void props;
}
