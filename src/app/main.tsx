import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initApi } from './api';
import { Providers } from './providers';
import '@/styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

initApi();

createRoot(container).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
