import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';

export default function TelegramSetup() {
  const { setProfile } = useStore();
  const [step, setStep] = useState<'detect' | 'form' | 'done'>('detect');
  const [tgId, setTgId] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  // Try once more to detect Telegram with retries
  useEffect(function() {
    var cancelled = false;
    var attempts = 0;
    function check() {
      if (cancelled) return;
      try {
        var tg = window.Telegram?.WebApp;
        if (tg && tg.initDataUnsafe?.user) {
          var user = tg.initDataUnsafe.user;
          tg.ready();
          tg.expand();
          var profile = {
            telegramId: String(user.id || ''),
            telegramUsername: user.username || '',
            name: user.first_name || 'User',
            phone: '',
            joinedAt: new Date().toISOString(),
            registered: true
          };
          localStorage.setItem('ss_profile', JSON.stringify(profile));
          setProfile(profile);
          setStep('done');
          
          // Fetch phone
          fetch('/api/user/contact?telegram_id=' + profile.telegramId)
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (d && d.phone) {
                profile.phone = d.phone;
                localStorage.setItem('ss_profile', JSON.stringify(profile));
                localStorage.setItem('ss_user_phone', d.phone);
                setProfile(profile);
              }
            }).catch(function() {});
          return;
        }
      } catch(e) {}
      attempts++;
      if (attempts < 15) setTimeout(check, 200);
      else setStep('form');
    }
    check();
    return function() { cancelled = true; };
  }, []);

  function handleSave() {
    if (!tgId.trim()) {
      toast('Telegram ID is required', 'error');
      return;
    }
    var profile = {
      telegramId: tgId.trim(),
      telegramUsername: username.trim() || '',
      name: name.trim() || 'User ' + tgId.trim(),
      phone: phone.trim() || '',
      joinedAt: new Date().toISOString(),
      registered: true
    };
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    localStorage.setItem('ss_user_phone', phone.trim());
    if (phone.trim()) localStorage.setItem('ss_phone_shared', 'true');
    setProfile(profile);
    setStep('done');
    toast('✅ Setup complete!', 'success');
  }

  if (step === 'detect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/70">Connecting to Telegram...</p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">📱</div>
          <h1 className="text-lg font-bold text-slate-900">Connect to Smart Shop</h1>
          <p className="text-[10px] text-slate-500 mt-1">
            To use the app, please enter your Telegram details.
            You can find your Telegram ID by messaging @userinfobot.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Telegram ID *</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm bg-white" 
              placeholder="e.g. 123456789" value={tgId} onChange={function(e) { setTgId(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm bg-white" 
              placeholder="e.g. 251912345678" value={phone} onChange={function(e) { setPhone(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Telegram Username</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm bg-white" 
              placeholder="e.g. @username" value={username} onChange={function(e) { setUsername(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm bg-white" 
              placeholder="e.g. John Doe" value={name} onChange={function(e) { setName(e.target.value); }} />
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all mt-2"
            onClick={handleSave}>
            Save & Continue
          </button>

          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-[9px] text-blue-700 leading-relaxed">
            <strong>💡 Need help?</strong><br />
            1. Message <strong>@userinfobot</strong> on Telegram<br />
            2. It will reply with your Telegram ID<br />
            3. Enter that ID above
          </div>
        </div>
      </div>
    </div>
  );
}
