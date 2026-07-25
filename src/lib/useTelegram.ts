import { useState, useEffect } from 'react';

export function useTelegram() {
  var [detected, setDetected] = useState(false);
  var [user, setUser] = useState(null);
  var [phone, setPhone] = useState('');

  useEffect(function() {
    var tries = 0;
    var cancelled = false;

    function check() {
      if (cancelled) return;
      try {
        var tg = window.Telegram?.WebApp;
        if (tg && tg.initDataUnsafe) {
          var u = tg.initDataUnsafe.user;
          if (u) {
            tg.ready();
            tg.expand();
            var profile = {
              telegramId: String(u.id || ''),
              telegramUsername: u.username || '',
              name: u.first_name || '',
              phone: ''
            };
            localStorage.setItem('ss_profile', JSON.stringify(profile));
            localStorage.setItem('ss_tg_detected', 'true');
            setDetected(true);
            setUser(profile);
            
            // Fetch phone
            fetch('/api/user/contact?telegram_id=' + profile.telegramId)
              .then(function(r) { return r.json(); })
              .then(function(d) {
                if (d && d.phone) {
                  profile.phone = d.phone;
                  localStorage.setItem('ss_profile', JSON.stringify(profile));
                  localStorage.setItem('ss_user_phone', d.phone);
                  setPhone(d.phone);
                  setUser({...profile});
                }
              }).catch(function() {});
            return;
          }
        }
      } catch(e) {}
      tries++;
      if (tries < 40) setTimeout(check, 100);
    }
    
    check();
    return function() { cancelled = true; };
  }, []);

  // Also read from localStorage in case another component set it
  useEffect(function() {
    try {
      var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      if (p.telegramId && !detected) {
        setDetected(true);
        setUser(p);
        setPhone(p.phone || localStorage.getItem('ss_user_phone') || '');
      }
    } catch(e) {}
  }, []);

  return { detected, user, phone };
}
