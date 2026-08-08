import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { burstConfetti } from '@/lib/confetti';
import { Send } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const store = useStore();
  const { profile, setProfile } = store;

  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [searchedPhone, setSearchedPhone] = useState('');
  const botUsername = (store.settings as any)?.botUsername || (store.settings as any)?.telegramBotUsername || 'smart_shopping_et_bot';

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/[^0-9+]/g, '').trim();

    if (cleanPhone.includes('@')) {
      toast('Please enter a valid phone number, not an email address.', 'error');
      return;
    }
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 7) {
      toast('Please enter at least 7 digits (e.g. 0911234567)', 'error');
      return;
    }

    setLoading(true);
    setVerificationNeeded(false);

    try {
      let matchedUser: any = null;
      try {
        const regCustomers = JSON.parse(localStorage.getItem('ss_registered_customers') || '[]');
        matchedUser = regCustomers.find((c: any) => {
          if (!c || !c.phone) return false;
          const cDigits = String(c.phone).replace(/[^0-9]/g, '');
          return cDigits.length > 6 && (cDigits.includes(digitsOnly) || digitsOnly.includes(cDigits));
        });
      } catch {}

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
        toast(`🎉 Welcome back, ${updatedProfile.name}!`, 'success');
        setLoading(false);
        navigate(-1);
        return;
      }

      setSearchedPhone(cleanPhone);
      setVerificationNeeded(true);
      toast('🔒 Phone number not verified yet. Tap below to verify in Telegram.', 'info');
    } catch (err: any) {
      toast('Error looking up account: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramDeepLink = () => {
    const deepUrl = `tg://resolve?domain=${botUsername}&start=auth`;
    window.location.href = deepUrl;
    setTimeout(() => {
      window.open(`https://t.me/${botUsername}?start=auth`, '_blank');
    }, 1000);
  };

  const handleTelegramBotVerify = () => {
    const verifyUrl = `tg://resolve?domain=${botUsername}&start=verify_${searchedPhone.replace(/[^0-9]/g, '')}`;
    window.location.href = verifyUrl;
    setTimeout(() => {
      window.open(`https://t.me/${botUsername}?start=verify_${searchedPhone.replace(/[^0-9]/g, '')}`, '_blank');
    }, 1000);
  };

  const isKnownUser = profile.name && profile.name !== 'Guest';

  return (
    <div className="w-full h-[calc(100vh-7.5rem)] overflow-hidden flex flex-col justify-start items-center pt-6 px-4 select-none animate-fadeIn">
      {/* ONE SINGLE CLEAN CARD — COMPACT TOP SPACING WITH BOTTOM NAVBAR VISIBLE */}
      <div className="max-w-sm w-full bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-7 shadow-2xl text-center space-y-5">
        {/* Top Icon & Greeting */}
        <div className="space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl shadow-inner mb-2">
            🏪
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            {isKnownUser ? `Welcome back, ${profile.name}! 👋` : 'Welcome to Smart Shop'}
          </h1>
          <p className="text-xs text-muted-foreground">
            Please enter your phone number
          </p>
        </div>

        {/* Form: Phone Input & Sign In Button */}
        <form onSubmit={handlePhoneSignIn} className="space-y-3.5">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1 text-xs font-bold text-muted-foreground select-none">
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
              className="w-full pl-24 pr-4 py-3.5 rounded-2xl border border-border dark:border-slate-700 bg-background text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-left"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phoneInput.trim()}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-extrabold text-xs tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>🚀 Sign In / Continue</span>
            )}
          </button>
        </form>

        {/* Minimalist Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border/60"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-muted-foreground/60">or</span>
          <div className="flex-grow border-t border-border/60"></div>
        </div>

        {/* Telegram Deep-Link Button */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleTelegramDeepLink}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send size={15} />
            <span>Continue with Telegram</span>
          </button>
          <p className="text-[10px] text-muted-foreground/60">
            1-tap verification via @{botUsername}
          </p>
        </div>

        {/* Inline Telegram Verification Prompt (Only shown if number not found) */}
        {verificationNeeded && (
          <div className="pt-3 border-t border-border/40 animate-scaleIn">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Phone {searchedPhone} not verified yet
              </p>
              <button
                type="button"
                onClick={handleTelegramBotVerify}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                <span>Tap to Verify in Telegram Bot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
