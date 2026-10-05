import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

// SPA redirect recovery for GitHub Pages (and any static host without rewrites):
// the 404.html stored the originally-requested path in sessionStorage. We replace
// the history entry so React Router initializes with the right route.
function restoreRedirect(): void {
  try {
    const target = sessionStorage.getItem('pm:redirect');
    if (!target) return;
    sessionStorage.removeItem('pm:redirect');
    window.history.replaceState(null, '', target);
  } catch {
    /* sessionStorage may be disabled — silently ignore */
  }
}
restoreRedirect();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);