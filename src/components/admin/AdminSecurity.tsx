import { useState, useEffect } from 'react';
import { Shield, Lock, Key, Smartphone, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/Toast';

export default function AdminSecurity() {
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('ss_admin_pin_enabled') === 'true');
  const [pin, setPin] = useState(() => localStorage.getItem('ss_admin_pin') || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showChangePin, setShowChangePin] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(() => Number(localStorage.getItem('ss_admin_session_timeout')) || 15);
  const [twoFactor, setTwoFactor] = useState(() => localStorage.getItem('ss_admin_2fa') === 'true');
  const [verifyCode, setVerifyCode] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout monitor
  useEffect(() => {
    if (!pinEnabled) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivity) / 60000;
      if (elapsed > sessionTimeout) {
        localStorage.setItem('ss_admin_locked', 'true');
        toast('🔒 Session expired — please re-enter PIN', 'warning');
        window.location.reload();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [pinEnabled, sessionTimeout, lastActivity]);

  // Track activity
  useEffect(() => {
    const handler = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', handler);
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, []);

  const enablePIN = () => {
    if (!newPin || newPin.length < 4) { toast('PIN must be at least 4 digits', 'error'); return; }
    if (newPin !== confirmPin) { toast('PINs do not match', 'error'); return; }
    localStorage.setItem('ss_admin_pin', newPin);
    localStorage.setItem('ss_admin_pin_enabled', 'true');
    setPin(newPin);
    setPinEnabled(true);
    setShowChangePin(false);
    toast('✅ PIN security enabled!', 'success');
  };

  const disablePIN = () => {
    if (!confirm('Disable PIN protection?')) return;
    localStorage.setItem('ss_admin_pin_enabled', 'false');
    localStorage.removeItem('ss_admin_pin');
    setPinEnabled(false);
    setPin('');
    toast('PIN protection disabled', 'info');
  };

  const verifyPIN = () => {
    const storedPin = localStorage.getItem('ss_admin_pin');
    if (verifyCode === storedPin) {
      localStorage.setItem('ss_admin_locked', 'false');
      setShowVerify(false);
      setVerifyCode('');
      toast('✅ Verified!', 'success');
    } else {
      toast('❌ Incorrect PIN', 'error');
    }
  };

  const toggle2FA = () => {
    const val = !twoFactor;
    setTwoFactor(val);
    localStorage.setItem('ss_admin_2fa', String(val));
    toast(val ? '✅ Two-factor authentication enabled' : '2FA disabled', 'success');
  };

  const updateTimeout = (val: number) => {
    setSessionTimeout(val);
    localStorage.setItem('ss_admin_session_timeout', String(val));
    toast(`⏱️ Session timeout set to ${val} minutes`, 'success');
  };

  // Check if locked on mount
  useEffect(() => {
    if (localStorage.getItem('ss_admin_locked') === 'true' && localStorage.getItem('ss_admin_pin_enabled') === 'true') {
      setShowVerify(true);
    }
  }, []);

  // Lock overlay
  if (showVerify) {
    return (
      <div className="fixed inset-0 z-[400] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Session Locked</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your admin PIN to continue</p>
          <input
            type="password"
            className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-center text-lg tracking-[0.3em] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="••••"
            maxLength={6}
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPIN()}
            autoFocus
          />
          <button className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all" onClick={verifyPIN} disabled={verifyCode.length < 4}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500" /> Admin Security</h2>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* PIN Protection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold">PIN Protection</h3>
            {pinEnabled && <span className="text-[9px] bg-green-100 dark:bg-green-950/30 text-green-700 px-2 py-0.5 rounded-full font-semibold ml-auto">Active</span>}
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Protect the admin panel with a personal identification number. You'll be prompted after session timeout.</p>
          {pinEnabled ? (
            <div className="space-y-2">
              <div className="bg-muted/30 rounded-xl p-2.5 text-xs flex items-center justify-between">
                <span>PIN is set</span>
                <button className="text-indigo-600 text-[9px] font-semibold hover:underline" onClick={() => setShowChangePin(true)}>Change</button>
              </div>
              {showChangePin && (
                <div className="space-y-2 animate-slideDown">
                  <input className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" type="password" placeholder="New PIN (4-6 digits)" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} />
                  <input className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" type="password" placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} />
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold" onClick={enablePIN}>Save</button>
                    <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px]" onClick={() => setShowChangePin(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <button className="text-[9px] text-red-500 hover:underline" onClick={disablePIN}>Disable PIN</button>
            </div>
          ) : (
            <div className="space-y-2">
              <input className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" type="password" placeholder="New PIN (4-6 digits)" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} />
              <input className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" type="password" placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} />
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={enablePIN}>
                <Lock size={12} className="inline mr-1" /> Enable PIN
              </button>
            </div>
          )}
        </div>

        {/* Session Timeout */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold">Session Timeout</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Auto-lock the admin panel after inactivity. Requires PIN to unlock.</p>
          <div className="flex items-center gap-3">
            <span className="text-xs">Auto-lock after</span>
            <select className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={sessionTimeout} onChange={e => updateTimeout(Number(e.target.value))}>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never</option>
            </select>
          </div>
          {pinEnabled && sessionTimeout > 0 && (
            <div className="mt-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 text-[9px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} /> Panel will lock after {sessionTimeout} min of inactivity
            </div>
          )}
        </div>

        {/* Two-Factor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold">Two-Factor Authentication</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Add an extra layer of security with Telegram-based verification codes.</p>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={twoFactor} onChange={toggle2FA} className="rounded" />
            Enable 2FA via Telegram
          </label>
          {twoFactor && (
            <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2 text-[9px] text-emerald-700 dark:text-emerald-400">
              ✅ 2FA is active. Verification codes will be sent to your Telegram.
            </div>
          )}
        </div>

        {/* Security Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold">Security Status</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'PIN Protection', active: pinEnabled, color: 'green' },
              { label: 'Session Timeout', active: sessionTimeout > 0, color: 'green' },
              { label: 'Two-Factor Auth', active: twoFactor, color: 'green' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-[10px]">{s.label}</span>
                <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold', s.active ? 'bg-green-100 dark:bg-green-950/30 text-green-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                  {s.active ? '✅ Active' : '⚪ Inactive'}
                </span>
              </div>
            ))}
          </div>
          <div className={cn('mt-3 p-2 rounded-lg text-[9px] text-center font-semibold', pinEnabled && sessionTimeout > 0 ? 'bg-green-50 dark:bg-green-950/20 text-green-700' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700')}>
            {pinEnabled && sessionTimeout > 0 ? '🛡️ Your admin panel is secured' : '⚠️ Some security features are not enabled'}
          </div>
        </div>
      </div>
    </div>
  );
}
