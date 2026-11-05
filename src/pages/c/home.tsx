// /c/home — заглушка v1: экран появится в своём блоке (D-067; главная клиента — 6c, помощь — 6b).
import { createFileRoute } from '@tanstack/react-router';

import { ComingSoon } from '../-components/coming-soon';

export const Route = createFileRoute('/c/home')({ component: ComingSoon });
