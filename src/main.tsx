import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ===== CACHE BUSTER — Force reload if old code is cached =====
(function() {
  var VERSION = 'v8';
  try {
    var cached = localStorage.getItem('ss_app_version');
    if (cached && cached !== VERSION) {
      localStorage.setItem('ss_app_version', VERSION);
      window.location.reload(true);
      return;
    }
    localStorage.setItem('ss_app_version', VERSION);
  } catch(e) {}
})();

// ===== TELEGRAM INIT — Must run before React renders =====
// This ensures Telegram knows we're ready immediately
(function initTelegram() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // Notify Telegram we're ready (expands the Mini App)
      tg.ready();
      tg.expand();
      
      // Set header color to match our app
      tg.setHeaderColor('#f8fafc');
      
      // Pre-load cached auth data from localStorage for instant profile display
      const cached = localStorage.getItem('ss_telegram_auth');
      if (cached) {
        // Just mark it exists — the hook will pick it up
        document.documentElement.setAttribute('data-tg-auth', 'cached');
      }
      
      // Preconnect to our API for faster auth
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = window.location.origin;
      document.head.appendChild(link);
    }
  } catch {}
})();

// Register Service Worker for PWA
// SERVICE WORKER REMOVED — Vercel handles caching natively
// No stale cache issues, instant updates on every deploy

createRoot(document.getElementById('root')!).render(<App />);
