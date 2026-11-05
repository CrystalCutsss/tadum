// `/`: нет сессии → /login; есть → home активной роли; dual при первом входе → /c/home (D-020).
import { createFileRoute } from '@tanstack/react-router';

import { decideRoot, familyMemory, loadSessionState } from '@/entities/session';

import { enforce } from './-guard';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    enforce(decideRoot(await loadSessionState(context.queryClient), familyMemory.last()));
  },
});
