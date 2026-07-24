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

// ===== CLEAR OLD USER DATA — Force re-registration =====
(function() {
  var resetKey = 'ss_reset_v2';
  if (localStorage.getItem(resetKey) !== 'done') {
    // Clear old profile and vendor data so users re-register
    localStorage.removeItem('ss_profile');
    localStorage.removeItem('ss_vendor_status');
    localStorage.removeItem('ss_vendor_applications');
    localStorage.removeItem('ss_telegram_auth');
    localStorage.removeItem('ss_orders');
    localStorage.removeItem('ss_cart');
    localStorage.setItem(resetKey, 'done');
    window.location.reload(true);
  }
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
      
      // Request contact sharing for new users
      if (tg.initDataUnsafe?.user?.id && !localStorage.getItem('ss_contact_shared')) {
        tg.MainButton.text = '📱 Share Contact';
        tg.MainButton.show();
        var origClick = tg.MainButton.onClick;
        tg.MainButton.onClick = function() {
          tg.requestContact(function(contact) {
            if (contact && contact.phone_number) {
              localStorage.setItem('ss_contact_shared', 'true');
              tg.MainButton.hide();
              window.location.reload();
            }
          }, function() {});
        };
      }
    }
  } catch {}
})();

// Check if user just shared their contact - save it
(function checkContact() {
  try {
    var tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user?.id) {
      var userId = tg.initDataUnsafe.user.id;
      var profile = localStorage.getItem('ss_profile');
      if (profile) {
        var p = JSON.parse(profile);
        if (!p.telegramId) {
          p.telegramId = userId;
          p.registered = true;
          p.joinedAt = new Date().toISOString();
          localStorage.setItem('ss_profile', JSON.stringify(p));
          localStorage.setItem('ss_contact_shared', 'true');
        }
      }
    }
  } catch(e) {}
})();

// Register Service Worker for PWA
// SERVICE WORKER REMOVED — Vercel handles caching natively
// No stale cache issues, instant updates on every deploy

createRoot(document.getElementById('root')!).render(<App />);
