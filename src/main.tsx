// ─── Imports
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './index.css';
import { watchDemoModeSetting } from './repositories';
import { captureReferralFromUrl } from './utils/referral';

import { initTheme } from './config/theme';
initTheme();
import { initMotion } from './config/motion';
import './motion.css';
initMotion();

// ─── Root Render
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Keep the invite code (if any) before the router drops the query string
captureReferralFromUrl();

// Other devices can flip the demo-mode switch; hear them on focus + a 60s beat
watchDemoModeSetting();

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Check the current release on entry and when returning to an old browser tab.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
    const update = () => { if (navigator.onLine) void registration.update().catch(() => {}); };
    // Old releases cached these stable image URLs for90days. Stop using that cache.
    void navigator.serviceWorker.ready.then(() => caches.delete('people-photos')).catch(() => {});
    update();
    window.setInterval(update, 60 * 60 * 1000);
    window.addEventListener('online', update);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  }).catch(() => {});
}
