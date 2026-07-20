import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// PWA Install Prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install banner
  const banner = document.getElementById('pwa-banner');
  if (banner && !localStorage.getItem('pwa_dismissed')) banner.classList.add('show');
});

(window as any).installPWA = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  }
};

(window as any).dismissPWA = () => {
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.classList.remove('show');
  localStorage.setItem('pwa_dismissed', 'true');
};

// Abandoned cart check
(function() {
  try {
    const cart = JSON.parse(localStorage.getItem('ss_cart') || '[]');
    const lastActive = parseInt(localStorage.getItem('ss_last_active') || '0');
    if (cart.length > 0 && lastActive > 0 && (Date.now() - lastActive) > 3600000) {
      // Notify about abandoned cart
    }
  } catch(e) {}
  // Track activity
  const updateActivity = () => localStorage.setItem('ss_last_active', String(Date.now()));
  ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt => document.addEventListener(evt, updateActivity, { passive: true }));
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
