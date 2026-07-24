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
    
    // Save Telegram user data
    if (user) {
      var profile = {};
      try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      var changed = false;
      if (user.id) { profile.telegramId = user.id; changed = true; }
      if (user.username) { profile.telegramUsername = user.username; changed = true; }
      if (user.first_name && !profile.name) { profile.name = user.first_name; changed = true; }
      if (!profile.joinedAt) { profile.joinedAt = new Date().toISOString(); changed = true; }
      if (!profile.registered) { profile.registered = true; changed = true; }
      if (user.phone_number) { 
        profile.phone = user.phone_number; 
        localStorage.setItem('ss_phone_shared', 'true');
        changed = true; 
      }
      if (changed) localStorage.setItem('ss_profile', JSON.stringify(profile));
      
      // Check if we have phone - if not, try API, then block
      var hasPhone = profile.phone || user.phone_number || localStorage.getItem('ss_phone_shared');
      
      if (!hasPhone) {
        // Try fetching from API
        var tgId = user.id || '';
        if (tgId) {
          fetch('/api/user/contact?telegram_id=' + tgId).then(function(r) { return r.json(); }).then(function(resp) {
            if (resp && resp.phone) {
              var p2 = JSON.parse(localStorage.getItem('ss_profile') || '{}');
              p2.phone = resp.phone;
              localStorage.setItem('ss_profile', JSON.stringify(p2));
              localStorage.setItem('ss_phone_shared', 'true');
              window.location.reload();
            }
          }).catch(function() {});
        }
        
        // Show block screen immediately - don't render React app
        var root = document.getElementById('root');
        if (root) {
          root.innerHTML = 
            '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px;text-align:center;background:#0f172a;color:#e2e8f0;font-family:-apple-system,system-ui,sans-serif">' +
            '<div style="font-size:48px;margin-bottom:16px">📱</div>' +
            '<h1 style="font-size:18px;font-weight:bold;margin-bottom:8px">Contact Required</h1>' +
            '<p style="font-size:12px;color:#94a3b8;margin-bottom:24px">Go to @smart_shopping_et_bot and tap "Share Contact" first.</p>' +
            '<div style="background:#1e293b;border-radius:12px;padding:14px;font-size:11px;color:#94a3b8;max-width:280px;text-align:left;line-height:1.8">' +
            '1. Go to @smart_shopping_et_bot<br>' +
            '2. Send /start<br>' +
            '3. Tap "📱 Share Contact"<br>' +
            '4. Tap "🚀 Open Smart Shop"' +
            '</div>' +
            '<button onclick="window.Telegram.WebApp.close()" style="margin-top:24px;padding:12px 32px;background:#10b981;color:white;border:none;border-radius:12px;font-size:13px;font-weight:bold;cursor:pointer">Close</button>' +
            '</div>';
        }
        return; // ❌ PREVENT React from rendering
      }
    }
    
    // Preconnect
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
