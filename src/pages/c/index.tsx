import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/c/')({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- redirect() TanStack Router бросается по контракту
    throw redirect({ to: '/c/home', replace: true });
  },
});
