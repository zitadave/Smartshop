import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Save Telegram data immediately - this runs BEFORE React renders
(function initTelegram() {
  try {
    var tg = window.Telegram?.WebApp;
    if (!tg) return;
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
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
