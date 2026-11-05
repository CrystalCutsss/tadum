import { createFileRoute } from '@tanstack/react-router';

// Временная заглушка: редирект по роли и вход появляются в блоке 6a.
// Пользовательских строк нет до подключения i18n (блок 3).
export const Route = createFileRoute('/')({
  component: () => <main className="min-h-dvh" />,
});
