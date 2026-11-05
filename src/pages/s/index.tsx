import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/s/')({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- redirect() TanStack Router бросается по контракту
    throw redirect({ to: '/s/home', replace: true });
  },
});
