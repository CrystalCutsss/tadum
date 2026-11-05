// Каркас экранов входа: логотип, заголовок, содержимое. Шапка с языком и SupportBar — в блоке 6b.
import type { ReactNode } from 'react';

import { Wordmark } from '@/shared/ui';

export function AuthLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-4 py-10">
      <Wordmark />
      {title ? (
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </main>
  );
}
