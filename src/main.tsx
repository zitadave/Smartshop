import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(function initTelegram() {
  try {
    var tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    
    var user = tg.initDataUnsafe?.user;
    if (!user) return;
    
    // Save all available Telegram user data
    var profile = {};
    try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    var changed = false;
    if (user.id) { profile.telegramId = user.id; changed = true; }
    if (user.username) { profile.telegramUsername = user.username; changed = true; }
    if (user.first_name && !profile.name) { profile.name = user.first_name; changed = true; }
    if (!profile.joinedAt) { profile.joinedAt = new Date().toISOString(); changed = true; }
    if (!profile.registered) { profile.registered = true; changed = true; }
    if (user.phone_number && !profile.phone) { 
      profile.phone = user.phone_number; 
      localStorage.setItem('ss_phone_shared', 'true');
      changed = true; 
    }
    // Save Telegram raw data for later use
    localStorage.setItem('ss_tg_raw', JSON.stringify(user));
    if (changed) localStorage.setItem('ss_profile', JSON.stringify(profile));
    
    document.documentElement.setAttribute('data-tg-user', (user.first_name || ''));
    
    // Preconnect to API
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
