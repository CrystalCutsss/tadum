// Заглушка раздела (D-067): /c/documents — v2, /s/home и /s/documents — v3; /c/home — до проработки разделов (Кирилл 2026-11-06).
// Текст выровнен по началу строки контейнера (слева в LTR, справа в RTL).
import { useTranslation } from 'react-i18next';

export function ComingSoon() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-2 text-start">
      <h1 className="text-xl font-semibold">{t('stub.coming_soon.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('stub.coming_soon.body')}</p>
    </section>
  );
}
