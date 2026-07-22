import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { User, Package, Heart, ShoppingCart, Gift, LogOut, Moon, Sun, ChevronRight, Store, CreditCard, Palette, Globe, TrendingDown, Bell, HelpCircle, Wallet, Trophy, Flame, Sparkles, Coins, ArrowLeft, RotateCcw } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import { ActivePriceAlerts } from '@/components/features/PriceDropAlert';
import { SpinWheel, StreakBadge, MysteryBox } from '@/components/game/SpinWheel';
import { checkStreak, claimStreakReward, getStreak, getSpinData } from '@/lib/game';
import { toast } from '@/components/Toast';

const LANGUAGES = [
  { code: 'am' as const, label: '🇪🇹 አማርኛ' },
  { code: 'en' as const, label: '🇬🇧 English' },
  { code: 'om' as const, label: '🌍 Afaan Oromoo' },
  { code: 'ti' as const, label: '🇪🇹 ትግርኛ' },
  { code: 'so' as const, label: '🇸🇴 Soomaali' },
];

export default function Profile() {
  const navigate = useNavigate();
  const store = useStore();
  const { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, followedVendors, loyaltyPoints, savedPayments, preOrders, notifications, savedAddresses, walletBalance, addToWallet, addNotification, settings } = store;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [showWallet, setShowWallet] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [convertAmount, setConvertAmount] = useState(100);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [mysteryBoxes, setMysteryBoxes] = useState(3);

  // Loyalty/Game data
  const streak = checkStreak();
  const spinData = getSpinData();
  const [streakClaimed, setStreakClaimed] = useState(getStreak().claimed);
  const gameSettings = (settings as any)?.gameSettings || {};
  const segments = (settings as any)?.wheelSegments || null;
  const minConversion = gameSettings?.minPointsForCash || 100;
  const conversionRate = gameSettings?.pointsToCashRate || 0.5;

  const initials = profile.name ? profile.name.substring(0, 2).toUpperCase() : '?';
  const ordCount = orders.length + preOrders.length;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const followedVendorNames = followedVendors.map(id => {
    for (const p of store.products) { if (p.vendorId === id) return { id, name: p.vendorName || 'Shop' }; }
    return { id, name: `Shop #${id}` };
  }).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

  const getTier = (pts: number) => 
    pts >= 500 ? { name: 'Gold', icon: '🥇', next: null, color: 'from-amber-500 to-orange-600' } :
    pts >= 200 ? { name: 'Silver', icon: '🥈', next: { need: 500 - pts, label: 'Gold' }, color: 'from-slate-400 to-slate-500' } :
    { name: 'Bronze', icon: '🥉', next: { need: 200 - pts, label: 'Silver' }, color: 'from-amber-700 to-amber-800' };
  const tier = getTier(loyaltyPoints);

  const saveProfile = () => {
    if (editName.trim()) store.updateProfileName(editName.trim());
    if (editPhone.trim()) store.updateProfilePhone(editPhone.trim());
    setShowEditProfile(false);
    toast('✅ Profile updated!', 'success');
  };

  const handleWin = (prize: string, value: number) => {
    if (prize.includes('Loyalty') || prize.includes('Pts')) {
      addLoyaltyPoints(value);
    }
  };

  const handleMysteryWin = (prize: string, value: number) => {
    addLoyaltyPoints(value);
  };

  const handleClaimStreak = () => {
    const bonus = claimStreakReward();
    if (bonus > 0) {
      addLoyaltyPoints(bonus);
      setStreakClaimed(true);
      toast(`🔥 Streak reward: ${bonus} points!`, 'success');
    } else {
      toast('Already claimed today!', 'info');
    }
  };

  const handleConvertPoints = () => {
    if (loyaltyPoints < minConversion) { toast(`Need at least ${minConversion} points`, 'error'); return; }
    if (convertAmount < minConversion) { toast(`Minimum ${minConversion} points`, 'error'); return; }
    if (convertAmount > loyaltyPoints) { toast('Not enough points', 'error'); return; }
    const cashValue = Math.round(convertAmount * conversionRate);
    if (confirm(`Convert ${convertAmount} points \u2192 Br ${cashValue}?`)) {
      const newPoints = loyaltyPoints - convertAmount;
      localStorage.setItem('ss_loyalty', String(newPoints));
      useStore.setState({ loyaltyPoints: newPoints });
      store.addToWallet(cashValue);
      addNotification('\uD83D\uDCB0', `Converted ${convertAmount} points to Br ${cashValue}!`);
      toast(`\uD83D\uDCB0 Converted! Br ${cashValue} in your wallet!`, 'success');
      setShowConversion(false);
    }
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: '\u270F\uFE0F', label: 'Edit Profile', onClick: () => setShowEditProfile(true) },
        { icon: '\uD83D\uDCCD', label: 'Saved Addresses', badge: savedAddresses.length, onClick: () => navigate('/addresses') },
        { icon: '\uD83D\uDCB3', label: 'Payment Methods', badge: savedPayments.length, onClick: () => navigate('/payment-methods') },
      ]
    },
    {
      title: 'Shopping',
      items: [
        { icon: '\uD83D\uDCE6', label: 'My Orders', badge: ordCount, onClick: () => navigate('/orders') },
        { icon: '\u2764\uFE0F', label: 'Wishlist', badge: wishlist.length, onClick: () => navigate('/wishlist') },
        { icon: '\uD83C\uDF81', label: 'Gift Cards', badge: store.giftCards.length, onClick: () => navigate('/gift-cards') },
        { icon: '\uD83E\uDD1D', label: 'Affiliate Program', onClick: () => navigate('/affiliate') },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { icon: '\uD83C\uDFC6', label: 'Loyalty & Rewards', onClick: () => setShowLoyalty(true) },
        { icon: '\uD83C\uDFEA', label: 'Vendor Dashboard', onClick: () => navigate('/vendor') },
        { icon: '\uD83D\uDCC9', label: 'Price Alerts', badge: store.priceAlerts.length, onClick: () => navigate('/price-alerts') },
        { icon: '\uD83D\uDD14', label: 'Notifications', badge: notifications.length, onClick: () => navigate('/notifications') },
        { icon: '\u2753', label: 'Help & Support', onClick: () => navigate('/help') },
      ]
    },
  ];

  return (
    <div className="pb-4">
      {/* Avatar */}
      <div className="text-center py-6 bg-card border-b border-border">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md cursor-pointer" onClick={() => setShowEditProfile(true)}>
          {initials}
        </div>
        <h2 className="text-base font-bold mt-2">{profile.name || 'Guest'}</h2>
        {profile.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {profile.phone}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">📅 Joined {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Today'}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 p-3 bg-card mx-3 mt-3 rounded-xl border border-border">
        {[
          { val: ordCount, label: 'Orders', onClick: () => navigate('/orders') },
          { val: wishlist.length, label: 'Wishlist', onClick: () => navigate('/wishlist') },
          { val: cartCount, label: 'Cart', onClick: () => navigate('/cart') },
        ].map((s, i) => (
          <div key={i} className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={s.onClick}>
            <div className="text-lg font-bold text-primary">{s.val}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Wallet + Loyalty */}
      <div className="mx-3 mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 text-white cursor-pointer hover:shadow-xl transition-all" onClick={() => setShowWallet(true)}>
          <Wallet size={18} className="mb-1 opacity-80" />
          <div className="text-lg font-extrabold">Br {walletBalance.toLocaleString()}</div>
          <div className="text-[8px] opacity-70">Wallet Balance</div>
        </div>
        <div className={cn('bg-gradient-to-r rounded-xl p-3 text-white cursor-pointer hover:shadow-xl transition-all', tier.color)} onClick={() => setShowLoyalty(true)}>
          <span className="text-xl">{tier.icon}</span>
          <div className="text-lg font-extrabold">{loyaltyPoints}</div>
          <div className="text-[8px] opacity-70">{tier.name} · {tier.next ? `${tier.next.need} pts to ${tier.next.label}` : 'Max tier!'}</div>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowWallet(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Wallet size={32} className="mx-auto text-emerald-500 mb-1" />
              <h3 className="text-sm font-bold">Wallet</h3>
              <p className="text-3xl font-extrabold text-primary mt-1">Br {walletBalance.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-xs mb-3">
              <p>💡 Earn points via purchases, streaks & the spin wheel. Convert them to cash below!</p>
            </div>
            <button className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => { setShowWallet(false); setShowLoyalty(true); }}>
              Go to Loyalty & Rewards
            </button>
          </div>
        </div>
      )}

      {/* Price Alerts */}
      <div className="mx-3 mt-3"><ActivePriceAlerts /></div>

      {/* Followed Shops */}
      {followedVendorNames.length > 0 && (
        <div className="mx-3 mt-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">🏪 Followed Shops</div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {followedVendorNames.map(v => (
              <span key={v.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-full text-[10px] cursor-pointer hover:border-primary" onClick={() => navigate(`/store/${v.id}`)}>
                🏪 {v.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Menu Sections */}
      {sections.map((section, si) => (
        <div key={si} className="mx-3 mt-3">
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{section.title}</div>
          <div className="space-y-1">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-primary hover:shadow-sm transition-all" onClick={item.onClick}>
                <span className="text-base w-6 text-center">{item.icon}</span>
                <span className="text-xs font-medium flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{item.badge}</span>
                )}
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Currency + Theme Side by Side */}
      <div className="mx-3 mt-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-2"><Globe size={14} className="text-primary" /><span className="text-[10px] font-medium">Currency</span></div>
            <CurrencySelector />
          </div>
          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-2"><Palette size={14} className="text-primary" /><span className="text-[10px] font-medium">Theme</span></div>
            <ThemePicker />
            <div className="flex gap-1 mt-2">
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all relative overflow-hidden', !darkMode ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={() => setDarkMode(false)}>
                <span className="relative z-10 flex items-center justify-center gap-1"><Sun size={10} /> Light</span>
              </button>
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all relative overflow-hidden', darkMode ? 'bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={() => setDarkMode(true)}>
                <span className="relative z-10 flex items-center justify-center gap-1"><Moon size={10} /> Dark</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2.5 mb-2"><span className="text-base">🌐</span><span className="text-xs font-medium">{t('language', language)}</span></div>
          <select className="w-full p-2 border border-input rounded-lg text-xs bg-card" value={language} onChange={e => setLanguage(e.target.value as any)}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-3 mt-3 mb-6">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => { if (confirm('Logout?')) { store.setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' }); } }}>
          <span className="text-base w-6 text-center text-destructive">🚪</span>
          <span className="text-xs font-medium flex-1 text-destructive">{t('logout', language)}</span>
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground pb-4">🏪 Smart Shop v3.0</p>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowEditProfile(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-lg font-bold mx-auto shadow-md">{initials}</div>
              <h3 className="text-sm font-bold mt-2">Edit Profile</h3>
            </div>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Name</label><input className="w-full p-3 border border-input rounded-xl text-sm bg-card mt-1" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" /></div>
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</label><input className="w-full p-3 border border-input rounded-xl text-sm bg-card mt-1" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="09XXXXXXXX" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={saveProfile}>💾 Save</button>
              <button className="px-4 py-3 border border-border rounded-xl text-xs" onClick={() => setShowEditProfile(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LOYALTY & REWARDS MODAL — embedded inline, no separate page */}
      {showLoyalty && (
        <div className="fixed inset-0 bg-black/60 z-[200] overflow-y-auto" onClick={() => setShowLoyalty(false)}>
          <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[75vh] overflow-y-auto shadow-2xl animate-slideUp pb-20">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-card border-b border-border/40 px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <button className="p-1 -ml-1 rounded-xl hover:bg-muted transition-colors" onClick={() => setShowLoyalty(false)}><ArrowLeft size={18} /></button>
                  <Trophy size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold">Loyalty & Rewards</h3>
                </div>
              </div>

              <div className="px-4 space-y-3 mt-3">
                {/* Balance */}
                <div className="p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] opacity-80">Your Balance</p>
                      <div className="text-2xl font-extrabold">{loyaltyPoints} pts</div>
                      <p className="text-[9px] opacity-70 mt-0.5">≈ Br {Math.round(loyaltyPoints * conversionRate)}</p>
                    </div>
                    <button className="px-4 py-2 bg-white/20 rounded-xl text-[10px] font-bold hover:bg-white/30 transition-colors" onClick={() => setShowConversion(true)}>
                      <Coins size={14} className="inline mr-1" />Convert
                    </button>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full" style={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }} />
                  </div>
                  <p className="text-[8px] opacity-60 mt-1">500 pts → Gold Tier</p>
                </div>

                {/* Streak */}
                <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"><Flame size={16} className="text-white" /></div>
                      <div><h4 className="text-sm font-bold">Daily Streak</h4><p className="text-[9px] text-muted-foreground/60">Visit daily for bonus points</p></div>
                    </div>
                    <div className="text-right"><div className="text-lg font-extrabold text-orange-500">{streak.count}</div><div className="text-[8px] text-muted-foreground/60">days</div></div>
                  </div>
                  <StreakBadge count={streak.count} />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" /><span className="text-[10px] text-muted-foreground">Reward: <strong className="text-amber-600">{streak.bonus} pts</strong></span></div>
                    <button className={cn('px-4 py-1.5 rounded-xl text-[10px] font-bold', streakClaimed ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:scale-105 active:scale-95')} onClick={handleClaimStreak} disabled={streakClaimed}>{streakClaimed ? '✅ Claimed' : '🔥 Claim'}</button>
                  </div>
                </div>

                {/* Spin */}
                <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Gift size={16} className="text-white" /></div>
                    <div><h4 className="text-sm font-bold">Spin to Win</h4><p className="text-[9px] text-muted-foreground/60">{spinData.totalSpins || 0} spins so far</p></div>
                  </div>
                  <SpinWheel onWin={handleWin} segments={segments} adminSettings={gameSettings} />
                </div>

                {/* Mystery Box */}
                <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center"><Gift size={16} className="text-white" /></div>
                    <div><h4 className="text-sm font-bold">Mystery Boxes</h4><p className="text-[9px] text-muted-foreground/60">Open boxes for exclusive prizes!</p></div>
                  </div>
                  <MysteryBox onOpen={handleMysteryWin} boxes={mysteryBoxes} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🎡', label: 'Total Spins', val: `${spinData.totalSpins || 0}` },
                    { icon: '🔥', label: 'Streak Days', val: `${streak.count}` },
                    { icon: '🏆', label: 'Prizes Won', val: `${spinData.totalSpins || 0}` },
                    { icon: '⭐', label: 'Points Earned', val: `${loyaltyPoints}` },
                  ].map((s, i) => (
                    <div key={i} className="bg-card rounded-2xl p-3 border border-border/60 text-center">
                      <div className="text-lg">{s.icon}</div>
                      <div className="text-lg font-extrabold text-primary mt-1">{s.val}</div>
                      <div className="text-[9px] text-muted-foreground/60">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Points Conversion Modal */}
      {showConversion && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4" onClick={() => setShowConversion(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-center mb-4">Convert Points to Cash</h3>
            <div className="bg-muted/50 rounded-xl p-3 mb-3 text-xs">
              <div className="flex justify-between mb-1"><span>Your Points</span><span className="font-bold">{loyaltyPoints}</span></div>
              <div className="flex justify-between mb-1"><span>Rate</span><span className="font-bold">{minConversion} pts = Br {Math.round(minConversion * conversionRate)}</span></div>
            </div>
            <div className="mb-3">
              <input type="number" className="w-full p-3 border border-input rounded-xl text-sm bg-card" value={convertAmount} onChange={e => setConvertAmount(Math.max(minConversion, Number(e.target.value)))} min={minConversion} max={loyaltyPoints} />
              <p className="text-[9px] text-green-600 mt-1">You'll receive: <strong>Br {Math.round(convertAmount * conversionRate)}</strong> → Wallet</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold" onClick={handleConvertPoints} disabled={loyaltyPoints < minConversion}>Convert to Cash</button>
              <button className="px-4 py-3 border border-border rounded-xl text-xs" onClick={() => setShowConversion(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
