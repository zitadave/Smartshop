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
    
    var tgId = String(user.id || '');
    var phoneFromTg = user.phone_number || '';
    
    // Step 1: Load existing profile from localStorage
    var profile = {};
    try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    
    // Step 2: Always save/update Telegram info
    profile.telegramId = tgId;
    if (user.username) profile.telegramUsername = user.username;
    if (user.first_name && !profile.name) profile.name = user.first_name;
    if (!profile.joinedAt) profile.joinedAt = new Date().toISOString();
    if (!profile.registered) profile.registered = true;
    
    // Step 3: Get phone number - priority: initData > localStorage > API sync
    var finalPhone = phoneFromTg || profile.phone || '';
    
    if (!finalPhone) {
      // Try fetching from API synchronously (blocking XHR)
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/user/contact?telegram_id=' + tgId, false); // false = synchronous
        xhr.send();
        if (xhr.status === 200) {
          var resp = JSON.parse(xhr.responseText);
          if (resp && resp.phone) finalPhone = resp.phone;
        }
      } catch(e) {}
      // Also try sync endpoint
      if (!finalPhone) {
        try {
          var xhr2 = new XMLHttpRequest();
          xhr2.open('POST', '/api/user/sync', false);
          xhr2.setRequestHeader('Content-Type', 'application/json');
          xhr2.send(JSON.stringify({ telegram_id: tgId }));
          if (xhr2.status === 200) {
            var syncResp = JSON.parse(xhr2.responseText);
            if (syncResp && syncResp.phone) finalPhone = syncResp.phone;
          }
        } catch(e) {}
      }
    }
    
    // Step 4: Save phone to profile
    if (finalPhone) {
      profile.phone = finalPhone;
      localStorage.setItem('ss_user_phone', finalPhone);
      localStorage.setItem('ss_phone_shared', 'true');
    }
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    
    // Step 5: Block if no phone
    if (!finalPhone) {
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
      return;
    }
    
    // Step 6: Async sync to update vendor status (doesn't block)
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: tgId, phone: finalPhone, username: user.username || '', first_name: user.first_name || '' })
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d && d.phone && d.phone !== finalPhone) {
        profile.phone = d.phone;
        localStorage.setItem('ss_profile', JSON.stringify(profile));
        localStorage.setItem('ss_user_phone', d.phone);
      }
    }).catch(function() {});
    
    // Preconnect
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
    
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
