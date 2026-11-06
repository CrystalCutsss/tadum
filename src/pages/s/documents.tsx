// /s/documents — заглушка до v3 (01-cabinet-structure.md §1): пункт «Документы» в меню поставщика есть уже сейчас (решение Кирилла 2026-11-06).
import { createFileRoute } from '@tanstack/react-router';

import { ComingSoon } from '../-components/coming-soon';

export const Route = createFileRoute('/s/documents')({ component: ComingSoon });
