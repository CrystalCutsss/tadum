// /c/home — главная клиента (SC-05 для home, 01-cabinet-structure.md §5–6).
import { createFileRoute } from '@tanstack/react-router';

import { ClientHome } from '../-components/client-home';

export const Route = createFileRoute('/c/home')({ component: ClientHome });
