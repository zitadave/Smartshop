import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ===== TELEGRAM INIT =====
(function initTelegram() {
  try {
    var tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    
    tg.ready();
    tg.expand();
    
    // Save Telegram user info (always available)
    var user = tg.initDataUnsafe?.user;
    if (user) {
      var profile = {};
      try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      var changed = false;
      if (user.id && !profile.telegramId) { profile.telegramId = user.id; changed = true; }
      if (user.username && !profile.telegramUsername) { profile.telegramUsername = user.username; changed = true; }
      if (user.first_name && !profile.name) { profile.name = user.first_name; changed = true; }
      if (!profile.joinedAt) { profile.joinedAt = new Date().toISOString(); changed = true; }
      if (!profile.registered) { profile.registered = true; changed = true; }
      // Check if phone number is available in initData
      if (user.phone_number && !profile.phone) { profile.phone = user.phone_number; changed = true; }
      if (changed) {
        localStorage.setItem('ss_profile', JSON.stringify(profile));
        if (user.phone_number) localStorage.setItem('ss_phone_shared', 'true');
      }
      document.documentElement.setAttribute('data-tg-user', (user.first_name || ''));
    }
    
    // Request contact if phone not available
    if (user && !user.phone_number && !localStorage.getItem('ss_phone_shared')) {
      try {
        tg.MainButton.setText('📱 Share Contact');
        tg.MainButton.setBgColor('#10b981');
        tg.MainButton.setTextColor('#ffffff');
        tg.MainButton.show();
        tg.MainButton.onClick(function() {
          tg.requestContact(function(success) {
            if (success) {
              var newPhone = tg.initDataUnsafe?.user?.phone_number || '';
              if (newPhone) {
                var p = {};
                try { p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
                p.phone = newPhone;
                localStorage.setItem('ss_profile', JSON.stringify(p));
                localStorage.setItem('ss_user_phone', newPhone);
                localStorage.setItem('ss_phone_shared', 'true');
                tg.MainButton.hide();
                window.location.reload();
              }
            }
          });
        });
      } catch(e) {}
    }
    
    // Preconnect
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
    
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
