import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { burstConfetti } from '@/lib/confetti';
import { Phone, Shield, ArrowLeft, CheckCircle2, Lock, Sparkles, Send, Store } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const store = useStore();
  const { profile, setProfile } = store;

  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [searchedPhone, setSearchedPhone] = useState('');

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/[^0-9+]/g, '').trim();

    if (cleanPhone.includes('@')) {
      toast('Please enter a valid phone number, not an email address.', 'error');
      return;
    }
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 7) {
      toast('Please enter a valid Ethiopian phone number with at least 7 digits (e.g. 0911234567)', 'error');
      return;
    }

    setLoading(true);
    setVerificationNeeded(false);

    try {
      // 1. Check local registered customers directory first
      let matchedUser: any = null;
      try {
        const regCustomers = JSON.parse(localStorage.getItem('ss_registered_customers') || '[]');
        matchedUser = regCustomers.find((c: any) => {
          if (!c || !c.phone) return false;
          const cDigits = String(c.phone).replace(/[^0-9]/g, '');
          return cDigits.length > 6 && (cDigits.includes(digitsOnly) || digitsOnly.includes(cDigits));
        });
      } catch {}

      // 2. Also check cloud Supabase database via user sync
      let cloudPhone = '';
      try {
        const syncRes = await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone })
        });
        const syncData = await syncRes.json();
        if (syncData && syncData.phone && !String(syncData.phone).includes('@')) {
          cloudPhone = syncData.phone;
        }
      } catch {}

      if (matchedUser || cloudPhone) {
        const resolvedPhone = cloudPhone || matchedUser?.phone || cleanPhone;
        const resolvedName = matchedUser?.name || profile.name || 'Smart Shop Member';

        const updatedProfile = {
          ...profile,
          name: resolvedName === 'Guest' ? 'Smart Shop Member' : resolvedName,
          phone: resolvedPhone,
          registered: true
        };

        setProfile(updatedProfile);
        localStorage.setItem('ss_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('ss_user_phone', resolvedPhone);
        localStorage.setItem('ss_phone_shared', 'true');

        burstConfetti({ count: 50, duration: 3000 });
        toast(`🎉 Welcome back, ${updatedProfile.name}! Your account is synchronized.`, 'success');
        setLoading(false);
        navigate('/profile');
        return;
      }

      // 3. If phone number is not found in database, require 1-time Telegram Bot SIM verification
      setSearchedPhone(cleanPhone);
      setVerificationNeeded(true);
      toast('🔒 This phone number is not verified yet. Please tap below to verify via @SmartShopBot.', 'info');
    } catch (err: any) {
      toast('Error looking up account: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramBotVerify = () => {
    const botUsername = 'SmartShopBot';
    const verifyUrl = `tg://resolve?domain=${botUsername}&start=verify_${searchedPhone.replace(/[^0-9]/g, '')}`;
    window.location.href = verifyUrl;
    setTimeout(() => {
      window.open(`https://t.me/${botUsername}?start=verify_${searchedPhone.replace(/[^0-9]/g, '')}`, '_blank');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-6 animate-fadeIn">
      <div className="max-w-md mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Store size={14} />
            <span>Storefront</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-2.5 mb-7">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            <span>🇪🇹</span>
            <span>Smart Shop Ethiopia Official</span>
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Sign In to Your Account</h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Enter your registered phone number to synchronize your orders, saved delivery addresses, and loyalty rewards across all your devices.
          </p>
        </div>

        {/* Security Feature Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-4 mb-6 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">One Verified Account Policy</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
              To keep your rewards secure and prevent duplicates, every Smart Shop member is uniquely identified by their verified Ethiopian phone number.
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
          <h2 className="text-sm font-extrabold mb-1 text-slate-900 dark:text-white flex items-center gap-2">
            <Phone size={16} className="text-primary" /> Enter Your Phone Number
          </h2>
          <p className="text-[11px] text-muted-foreground mb-5">
            We'll instantly look up your account. No passwords required.
          </p>

          <form onSubmit={handlePhoneSignIn} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Ethiopian Phone Number *
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-muted-foreground">
                  <span>🇪🇹</span>
                  <span>+251 / 09</span>
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhoneInput(val);
                    if (verificationNeeded) setVerificationNeeded(false);
                  }}
                  placeholder="11 234 567"
                  className="w-full pl-24 pr-4 py-4 rounded-2xl border border-border dark:border-slate-700 bg-background text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneInput.trim()}
              className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Looking Up Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Sign In / Look Up Account</span>
                </>
              )}
            </button>
          </form>

          {/* Telegram SIM Verification Alert for New Phones */}
          {verificationNeeded && (
            <div className="mt-6 pt-5 border-t border-border dark:border-slate-800 animate-scaleIn">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Phone Number Not Verified Yet ({searchedPhone})
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      To protect your account and enforce our One Verified Phone Number rule, please tap below to verify via Telegram Bot SIM verification in 1 second.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTelegramBotVerify}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>Verify in @SmartShopBot (1-Click Share Contact)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alternate Telegram 1-Click Deep Link */}
        <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <h3 className="text-xs font-bold">Prefer 1-Click Telegram Sign In?</h3>
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            You can also open our official Telegram Bot directly. Tapping "📞 Share Contact" in Telegram automatically links your phone number and logs you in!
          </p>
          <a
            href="tg://resolve?domain=SmartShopBot&start=auth"
            onClick={() => {
              setTimeout(() => {
                window.open('https://t.me/SmartShopBot?start=auth', '_blank');
              }, 1000);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Send size={14} />
            <span>Open @SmartShopBot on Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
}
