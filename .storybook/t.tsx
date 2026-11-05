// Текст историй — из словарей i18n, чтобы истории показывали и AR, и EN.
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

export function T({ k }: { k: ParseKeys }) {
  const { t } = useTranslation();
  return <>{t(k)}</>;
}
