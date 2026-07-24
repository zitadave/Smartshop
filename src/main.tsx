import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ===== TELEGRAM INIT — Must run before React renders =====
(function initTelegram() {
  try {
    var tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#f8fafc');
    
    // Save Telegram user info immediately (always available)
    var user = tg.initDataUnsafe?.user;
    if (user) {
      var profile = {};
      try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      profile.telegramId = user.id || profile.telegramId;
      profile.telegramUsername = user.username || profile.telegramUsername;
      profile.name = user.first_name || profile.name;
      if (!profile.joinedAt) profile.joinedAt = new Date().toISOString();
      if (!profile.registered) profile.registered = true;
      localStorage.setItem('ss_profile', JSON.stringify(profile));
      document.documentElement.setAttribute('data-tg-user', (user.first_name || ''));
    }
    
    // Request phone number - proper Telegram WebApp API
    if (user && !localStorage.getItem('ss_phone_shared')) {
      tg.MainButton.setText('📱 Share Contact');
      tg.MainButton.setBgColor('#10b981');
      tg.MainButton.setTextColor('#ffffff');
      tg.MainButton.show();
      tg.MainButton.onClick(function() {
        tg.requestContact(function(success) {
          if (success) {
            var phone = tg.initDataUnsafe?.user?.phone_number;
            if (phone) {
              var p = {};
              try { p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
              p.phone = phone;
              localStorage.setItem('ss_profile', JSON.stringify(p));
              localStorage.setItem('ss_user_phone', phone);
              localStorage.setItem('ss_phone_shared', 'true');
              tg.MainButton.hide();
              window.location.reload();
            }
          }
        });
      });
    }
    
    // Preconnect to API
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
    
  } catch(e) { console.log('TG init error:', e); }
})();

createRoot(document.getElementById('root')!).render(<App />);
