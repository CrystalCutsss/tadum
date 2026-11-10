// Каркас экранов входа по блоку shadcn login-05: по центру экрана колонка max-w-sm,
// логотип (словесный знак Tadum) вверху страницы; заголовок, описание и форма — по центру.
// Внизу страницы по центру — переключатели языка и темы из шапки кабинета (Кирилл 2026-11-10).
import type { ReactNode } from 'react';

import { FieldDescription, Wordmark } from '@/shared/ui';
import { LanguageSwitch } from '@/widgets/language-switch';
import { ThemeToggle } from '@/widgets/theme-switch';

export interface AuthLayoutProps {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 bg-background p-6 md:p-10">
      {/* Логотип кабинета (с точкой) вдвое крупнее — вверху страницы (Кирилл 2026-11-10). */}
      <header className="flex justify-center">
        <Wordmark variant="dot" className="text-5xl" />
      </header>
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        {title ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle ? <FieldDescription className="text-center">{subtitle}</FieldDescription> : null}
          </div>
        ) : null}
        {children}
      </div>
      <footer className="flex items-center justify-center gap-1">
        <LanguageSwitch />
        <ThemeToggle />
      </footer>
    </main>
  );
}
