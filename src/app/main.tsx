import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { track } from '@/shared/analytics';
import { onStorageUnavailable } from '@/shared/lib';

import { initApi } from './api';
import { Providers } from './providers';
import '@/styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

onStorageUnavailable(() => track('storage_unavailable', {}));
// Первая отрисовка — после применения ?persona= (без параметра — сразу).
void initApi().finally(() =>
  createRoot(container).render(
  <StrictMode>
    <Providers />
    </StrictMode>,
  ),
);
