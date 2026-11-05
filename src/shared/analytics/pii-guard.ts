// Dev-проверка свойств событий (04-metrics-and-events.md §2.3, §4): ни телефонов, ни e-mail, ни ссылок,
// ни точных сумм. Срабатывает до провайдера; в проде не подключается.

/** Имена свойств, которые не отправляем никогда. */
const FORBIDDEN_KEYS = new Set([
  'phone',
  'name',
  'company_name',
  'application_id',
  'supplier_id',
  'slug',
  'url',
  'referral_url',
  'amount',
  'limit',
  'file_name',
  'reason_text',
  'returnTo',
  'path',
]);

/** Числа без корзины допустимы только у точных длительностей и размеров (§2.4). */
const UNBUCKETED_NUMBER_KEYS = new Set(['duration_ms', 'size_kb']);

const PII_PATTERNS: readonly RegExp[] = [/\+966/, /@/, /https?:\/\//];

export class PiiViolation extends Error {}

function checkValue(event: string, key: string, value: unknown): void {
  if (typeof value === 'string') {
    if (PII_PATTERNS.some((p) => p.test(value))) throw new PiiViolation(`${event}.${key}: значение похоже на PII`);
  } else if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000 && !UNBUCKETED_NUMBER_KEYS.has(key)) throw new PiiViolation(`${event}.${key}: число > 6 знаков — нужна корзина`);
  } else if (Array.isArray(value)) {
    value.forEach((v) => checkValue(event, key, v));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) checkValue(event, `${key}.${k}`, v);
  }
}

export function assertNoPii(event: string, props: Readonly<Record<string, unknown>>): void {
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.has(key)) throw new PiiViolation(`${event}.${key}: свойство запрещено (§2.3)`);
    checkValue(event, key, value);
  }
}
