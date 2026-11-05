import { Outlet, createRootRoute } from '@tanstack/react-router';

// Корневой маршрут; оболочка кабинета появляется в блоке 6b.
export const Route = createRootRoute({
  component: () => <Outlet />,
});
