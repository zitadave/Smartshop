import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
      
      // Request contact sharing for new users - no reload
      if (tg.initDataUnsafe?.user?.id && !localStorage.getItem('ss_contact_shared')) {
        try {
          tg.MainButton.text = '📱 Share Contact';
          tg.MainButton.show();
          tg.MainButton.onClick = function() {
            tg.requestContact(function(contact) {
              if (contact && contact.phone_number) {
                localStorage.setItem('ss_contact_shared', 'true');
                localStorage.setItem('ss_user_phone', contact.phone_number);
                tg.MainButton.hide();
              }
            }, function() {});
          };
        } catch(ex) {}
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
