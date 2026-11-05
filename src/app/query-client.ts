// Единственный QueryClient приложения: его видят провайдер React и гарды маршрутов (контекст роутера).
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
