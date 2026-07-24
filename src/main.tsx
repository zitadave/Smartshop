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
    if (!user) {
      createRoot(document.getElementById('root')!).render(<App />);
      return;
    }
    
    var tgId = user.id || '';
    var phoneFromTelegram = user.phone_number || '';
    
    // ===== 1. Save Telegram data to localStorage =====
    var profile = {};
    try { profile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    var changed = false;
    if (tgId) { profile.telegramId = tgId; changed = true; }
    if (user.username) { profile.telegramUsername = user.username; changed = true; }
    if (user.first_name && !profile.name) { profile.name = user.first_name; changed = true; }
    if (!profile.joinedAt) { profile.joinedAt = new Date().toISOString(); changed = true; }
    if (!profile.registered) { profile.registered = true; changed = true; }
    
    // Phone from Telegram initData
    if (phoneFromTelegram) { 
      profile.phone = phoneFromTelegram;
      localStorage.setItem('ss_user_phone', phoneFromTelegram);
      localStorage.setItem('ss_phone_shared', 'true');
      changed = true; 
    }
    if (changed) localStorage.setItem('ss_profile', JSON.stringify(profile));
    
    // ===== 2. Try to sync with server =====
    var syncDone = localStorage.getItem('ss_sync_' + tgId);
    
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: tgId,
        username: user.username || '',
        first_name: user.first_name || '',
        phone: phoneFromTelegram || profile.phone || ''
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      if (data && data.success) {
        // Save synced data to localStorage
        if (data.phone) {
          var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
          p.phone = data.phone;
          localStorage.setItem('ss_profile', JSON.stringify(p));
          localStorage.setItem('ss_user_phone', data.phone);
          localStorage.setItem('ss_phone_shared', 'true');
        }
        if (data.vendor_status) {
          localStorage.setItem('ss_vendor_status', data.vendor_status);
        }
        if (data.vendor_id) {
          localStorage.setItem('ss_vendor_app_id', String(data.vendor_id));
        }
        localStorage.setItem('ss_sync_' + tgId, 'done');
        
        // Reload if we got new data
        if (data.phone && !phoneFromTelegram && !profile.phone) {
          window.location.reload();
        }
      }
    }).catch(function() {});
    
    // ===== 3. Check if phone is available, block if not =====
    var hasPhone = phoneFromTelegram || profile.phone || localStorage.getItem('ss_phone_shared');
    
    if (!hasPhone) {
      // Try API one more time
      if (tgId) {
        fetch('/api/user/contact?telegram_id=' + tgId).then(function(r) { return r.json(); }).then(function(resp) {
          if (resp && resp.phone) {
            var p2 = JSON.parse(localStorage.getItem('ss_profile') || '{}');
            p2.phone = resp.phone;
            localStorage.setItem('ss_profile', JSON.stringify(p2));
            localStorage.setItem('ss_user_phone', resp.phone);
            localStorage.setItem('ss_phone_shared', 'true');
            window.location.reload();
          }
        }).catch(function() {});
      }
      
      // Block screen
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
    
    // Preconnect
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = window.location.origin;
    document.head.appendChild(link);
  } catch(e) {}
})();

createRoot(document.getElementById('root')!).render(<App />);
