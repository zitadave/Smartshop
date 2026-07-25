import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Save Telegram data immediately - this runs BEFORE React renders
(function initTelegram() {
  try {
    var tg = window.Telegram?.WebApp;
    if (!tg) {
      // Not running in Telegram Mini App - check if we have cached data
      // User might be testing from browser
      console.log('Not in Telegram WebView');
      return;
    }
    tg.ready();
    tg.expand();
    
    var user = tg.initDataUnsafe?.user;
    if (!user) return;
    
    var tgId = String(user.id || '');
    
    var profile = {};
    try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    
    profile.telegramId = tgId;
    if (user.username) profile.telegramUsername = user.username;
    if (user.first_name) profile.name = profile.name || user.first_name;
    if (!profile.joinedAt) profile.joinedAt = new Date().toISOString();
    if (!profile.registered) profile.registered = true;
    
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    
    // Fetch phone from API
    fetch('/api/user/contact?telegram_id=' + tgId)
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
    
    // Sync user data to server
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: tgId, username: user.username || '', first_name: user.first_name || '' })
    }).catch(function() {});
    
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
