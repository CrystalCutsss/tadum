// Каркас экранов входа по блоку shadcn login-05: по центру экрана колонка max-w-sm,
// шапка — логотип (словесный знак Tadum), заголовок и описание по центру, ниже — содержимое.
// Шапка с языком и SupportBar — в блоке 6b.
import type { ReactNode } from 'react';

import { FieldDescription, Wordmark } from '@/shared/ui';

export interface AuthLayoutProps {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Wordmark className="text-2xl" />
          {title ? <h1 className="text-xl font-bold">{title}</h1> : null}
          {subtitle ? <FieldDescription className="text-center">{subtitle}</FieldDescription> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
