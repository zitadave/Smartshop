import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Try to detect Telegram WebApp with retries
(function initTelegram() {
  var profile = {};
  try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}

  function tryDetect(attempt) {
    try {
      var tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        var user = tg.initDataUnsafe.user;
        tg.ready();
        tg.expand();
        
        profile.telegramId = String(user.id || '');
        if (user.username) profile.telegramUsername = user.username;
        if (user.first_name && !profile.name) profile.name = user.first_name;
        if (user.last_name && profile.name) profile.name = profile.name + ' ' + user.last_name;
        if (!profile.joinedAt) profile.joinedAt = new Date().toISOString();
        profile.registered = true;
        
        localStorage.setItem('ss_profile', JSON.stringify(profile));
        
        // Fetch phone async
        fetch('/api/user/contact?telegram_id=' + profile.telegramId)
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d && d.phone) {
              profile.phone = d.phone;
              localStorage.setItem('ss_profile', JSON.stringify(profile));
              localStorage.setItem('ss_user_phone', d.phone);
              localStorage.setItem('ss_phone_shared', 'true');
            }
          })
          .catch(function() {});
        
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: profile.telegramId, username: user.username || '', first_name: user.first_name || '' })
        }).catch(function() {});
        
        return true;
      }
    } catch(e) {}
    
    if (attempt < 10) {
      setTimeout(function() { tryDetect(attempt + 1); }, 300);
    }
    return false;
  }
  
  tryDetect(0);
})();

createRoot(document.getElementById('root')!).render(<App />);
