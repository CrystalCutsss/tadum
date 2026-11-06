// /c/home — главная клиента (SC-05 для home, 01-cabinet-structure.md §5–6).
// Решение Кирилла 2026-11-06: до проработки разделов Home показывает только текст-заглушку, как Documents.
// Экран v1 (ClientHome: шкала, «следующий шаг», сводка документов) сохранён в pages/-components вместе с историями и тестами (A-055).
import { createFileRoute } from '@tanstack/react-router';

import { ComingSoon } from '../-components/coming-soon';

export const Route = createFileRoute('/c/home')({ component: ComingSoon });
