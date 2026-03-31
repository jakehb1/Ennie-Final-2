import React from 'react';
import { createRoot } from 'react-dom/client';
import EnnieApp from '../ennie_complete.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EnnieApp />
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
