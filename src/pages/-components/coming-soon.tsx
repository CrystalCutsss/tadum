// Заглушка раздела следующей версии (D-067): /c/documents — v2, /s/home и /s/help — v3.
import { useTranslation } from 'react-i18next';

export function ComingSoon() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-2 py-8 text-center">
      <h1 className="text-xl font-semibold">{t('stub.coming_soon.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('stub.coming_soon.body')}</p>
    </section>
  );
}
