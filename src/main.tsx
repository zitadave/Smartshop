import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Save Telegram data immediately - DON'T block, DON'T use sync XHR
(function initTelegram() {
  try {
    var tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    
    var user = tg.initDataUnsafe?.user;
    if (!user) return;
    
    var tgId = String(user.id || '');
    
    // Load existing profile
    var profile = {};
    try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    
    // Always save Telegram info
    profile.telegramId = tgId;
    if (user.username) profile.telegramUsername = user.username;
    if (user.first_name) profile.name = profile.name || user.first_name;
    if (!profile.joinedAt) profile.joinedAt = new Date().toISOString();
    if (!profile.registered) profile.registered = true;
    
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    
    // Try to fetch phone from API (async - doesn't block rendering)
    fetch('/api/user/contact?telegram_id=' + tgId)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.phone) {
          var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
          p.phone = d.phone;
          localStorage.setItem('ss_profile', JSON.stringify(p));
          localStorage.setItem('ss_user_phone', d.phone);
          localStorage.setItem('ss_phone_shared', 'true');
        } else {
          // Try sync endpoint as backup
          return fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: tgId })
          }).then(function(r) { return r.json(); }).then(function(d2) {
            if (d2 && d2.phone) {
              var p2 = JSON.parse(localStorage.getItem('ss_profile') || '{}');
              p2.phone = d2.phone;
              localStorage.setItem('ss_profile', JSON.stringify(p2));
              localStorage.setItem('ss_user_phone', d2.phone);
              localStorage.setItem('ss_phone_shared', 'true');
            }
          });
        }
      })
      .catch(function() {});
    
    // Async sync to update server with user data
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: tgId, username: user.username || '', first_name: user.first_name || '' })
    }).catch(function() {});
    
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
