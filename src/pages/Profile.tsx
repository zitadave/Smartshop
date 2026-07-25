import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { User, Package, Heart, ShoppingCart, Gift, LogOut, Moon, Sun, ChevronRight, Store, Palette, TrendingDown, Bell, HelpCircle, Wallet, Smartphone, CheckCircle } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import LanguageSelector from '@/components/features/LanguageSelector';
import { ActivePriceAlerts } from '@/components/features/PriceDropAlert';
import TelegramLogin from '@/components/auth/TelegramLogin';
import { toast } from '@/components/Toast';



export default function Profile() {
  const navigate = useNavigate();
  const store = useStore();
  const { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, followedVendors, loyaltyPoints, savedPayments, preOrders, notifications, savedAddresses, walletBalance, walletHistory, isTelegramVerified, telegramId, settings } = store;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  // Read initial values from localStorage directly (avoid hoisting issues)
  const [editName, setEditName] = useState(function() {
    try { var p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); return p.name || ''; } catch(e) { return ''; }
  }());
  const [editPhone, setEditPhone] = useState(function() {
    try { var p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); return p.phone || localStorage.getItem('ss_user_phone') || ''; } catch(e) { return ''; }
  }());

  // LIVE data from localStorage - re-reads on every render via state
  const [liveTgId, setLiveTgId] = useState('');
  const [liveTgUser, setLiveTgUser] = useState('');
  const [livePhone, setLivePhone] = useState('');
  const [liveName, setLiveName] = useState('');
  const [liveJoined, setLiveJoined] = useState('');

  // Poll localStorage every 500ms for 10 seconds to catch the async phone fetch
  useEffect(function() {
    function readFromLS() {
      try {
        var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
        var phone = localStorage.getItem('ss_user_phone') || '';
        setLiveTgId(p.telegramId || '');
        setLiveTgUser(p.telegramUsername || '');
        setLivePhone(phone || p.phone || '');
        setLiveName(p.name || 'Guest');
        setLiveJoined(p.joinedAt || '');
      } catch(e) {}
    }
    // Read immediately
    readFromLS();
    // Then poll 5 times
    var count = 0;
    var interval = setInterval(function() {
      count++;
      readFromLS();
      if (count >= 10) clearInterval(interval); // stop after ~5s
    }, 500);
    return function() { clearInterval(interval); };
  }, []);

  // Use the live state - fallback to store, then to empty
  var displayTelegramId = liveTgId || profile.telegramId || '';
  var displayTelegramUsername = liveTgUser || profile.telegramUsername || '';
  var displayPhone = livePhone || profile.phone || '';
  var displayName = liveName || profile.name || 'Guest';
  var displayJoinedAt = liveJoined || profile.joinedAt || '';

  const initials = displayName.substring(0, 2).toUpperCase() || '?';
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

  // Clear old pending data to allow fresh start
  try {
    var oldStatus = localStorage.getItem('ss_vendor_status');
    if (oldStatus === 'pending') {
      // Clear old pending requests - user can re-apply
      localStorage.removeItem('ss_vendor_applications');
      localStorage.removeItem('ss_vendor_app_id');
      localStorage.removeItem('ss_vendor_status');
    }
  } catch(e) {}
  
  var initialVS = 'none';
  try { initialVS = localStorage.getItem('ss_vendor_status') || 'none'; } catch(e) {}
  const [vendorStatus, setVendorStatus] = useState(initialVS);
  
  // Check API for approved status via sync - also re-read from localStorage
  // because main.tsx IIFE may have updated it after the store initialized
  useEffect(function() {
    // Re-read profile from localStorage to ensure we have latest data
    var localProfile = {};
    try { localProfile = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    var tid = localProfile.telegramId || profile.telegramId || '';
    var phone = localProfile.phone || profile.phone || localStorage.getItem('ss_user_phone') || '';
    var payload = {};
    if (tid) payload.telegram_id = tid;
    if (phone) payload.phone = phone;
    if (tid || phone) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (d && d.vendor_status) {
          if (d.vendor_status === 'approved' && localStorage.getItem('ss_vendor_status') !== 'approved') {
            localStorage.setItem('ss_vendor_status', 'approved');
            window.location.reload();
            return;
          }
          localStorage.setItem('ss_vendor_status', d.vendor_status);
          setVendorStatus(d.vendor_status);
          if (d.vendor_id) localStorage.setItem('ss_vendor_app_id', String(d.vendor_id));
        }
      }).catch(function() {});
    }
    // Also check applications endpoint as backup
    var appId = localStorage.getItem('ss_vendor_app_id') || '';
    if (appId && appId !== 'undefined') {
      fetch('/api/vendors/applications').then(function(r) { return r.json(); }).then(function(d) {
        if (d && d.applications) {
          for (var i = 0; i < d.applications.length; i++) {
            if (String(d.applications[i].id) === appId && d.applications[i].status === 'approved') {
              localStorage.setItem('ss_vendor_status', 'approved');
              window.location.reload();
              return;
            }
          }
        }
      }).catch(function() {});
    }
  }, [profile.telegramId, profile.phone]);
  
  const applyAsVendor = function() {
    if (vendorStatus === 'pending') { toast('Already applied! Admin will review.', 'info'); return; }
    if (vendorStatus === 'approved') { toast('You are already a vendor!', 'info'); return; }
    localStorage.setItem('ss_vendor_status', 'pending');
    var apps = [];
    try { apps = JSON.parse(localStorage.getItem('ss_vendor_applications') || '[]'); } catch(e) {}
    apps.push({ id: Date.now(), name: profile.name || '', phone: profile.phone || '', telegramId: telegramId || '', appliedAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem('ss_vendor_applications', JSON.stringify(apps));
    toast('Application submitted! Admin will review.', 'success');
    window.location.reload();
  };
  
  const saveProfile = () => {
    if (editName.trim()) store.updateProfileName(editName.trim());
    if (editPhone.trim()) store.updateProfilePhone(editPhone.trim());
    setShowEditProfile(false);
    toast('✅ Profile updated!', 'success');
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: '✏️', label: 'Edit Profile', onClick: () => setShowEditProfile(true) },
        { icon: '📍', label: 'Saved Addresses', badge: savedAddresses.length, onClick: () => navigate('/addresses') },
        { icon: '💳', label: 'Payment Methods', badge: savedPayments.length, onClick: () => navigate('/payment-methods') },
      ]
    },
    {
      title: 'Shopping',
      items: [
        { icon: '📦', label: 'My Orders', badge: ordCount, onClick: () => navigate('/orders') },
        { icon: '❤️', label: 'Wishlist', badge: wishlist.length, onClick: () => navigate('/wishlist') },
        { icon: '🎁', label: 'Gift Cards', badge: store.giftCards.length, onClick: () => navigate('/gift-cards') },
        { icon: '🤝', label: 'Affiliate Program', onClick: () => navigate('/affiliate') },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { icon: '🏆', label: 'Loyalty & Rewards', onClick: () => navigate('/loyalty') },
        ...(vendorStatus === 'approved' && settings.marketplaceMode !== false ? [{ icon: '🏪', label: 'Vendor Dashboard', onClick: () => navigate('/vendor') }] : []),
        ...(vendorStatus === 'none' ? [{ icon: '📝', label: 'Become a Vendor', onClick: function() { navigate('/vendor-register'); } }] : []),
        ...(vendorStatus === 'pending' ? [{ icon: '⏳', label: 'Application Pending', onClick: function() { toast('Your application is being reviewed.', 'info'); } }] : []),
        { icon: '📉', label: 'Price Alerts', badge: store.priceAlerts.length, onClick: () => navigate('/price-alerts') },
        { icon: '🔔', label: 'Notifications', badge: notifications.length, onClick: () => navigate('/notifications') },
        { icon: '❓', label: 'Help & Support', onClick: () => navigate('/help') },
      ]
    },
  ];

  return (
    <div className="pb-4">
      <p className="text-center text-[9px] text-muted-foreground pb-4">🏪 Smart Shop v3.1</p>

      {/* Avatar */}
      <div className="text-center py-6 bg-card border-b border-border">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md cursor-pointer" onClick={() => setShowEditProfile(true)}>
          {initials}
        </div>
        <h2 className="text-base font-bold mt-2">{displayName}</h2>
        <div className="flex flex-col items-center gap-0.5 mt-1">
          {displayPhone && <p className="text-[10px] text-muted-foreground">📞 {displayPhone}</p>}
          {displayTelegramUsername && <p className="text-[10px] text-muted-foreground">@ {displayTelegramUsername}</p>}
          {displayTelegramId && <p className="text-[8px] text-muted-foreground/50 font-mono">ID: {displayTelegramId}</p>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">📅 Joined {displayJoinedAt ? new Date(displayJoinedAt).toLocaleDateString() : 'Today'}</p>
      </div>

      {/* Telegram Connect */}
      <div className="mx-3 mt-3">
        <TelegramLogin variant="card" />
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
        <div className={cn('bg-gradient-to-r rounded-xl p-3 text-white cursor-pointer hover:shadow-xl transition-all', tier.color)} onClick={() => navigate('/loyalty')}>
          <span className="text-xl">{tier.icon}</span>
          <div className="text-lg font-extrabold">{loyaltyPoints}</div>
          <div className="text-[8px] opacity-70">{tier.name} · {tier.next ? `${tier.next.need} pts to ${tier.next.label}` : 'Max tier!'}</div>
        </div>
      </div>

      {/* Wallet Modal — unified earnings breakdown */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowWallet(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-3">
              <Wallet size={28} className="mx-auto text-emerald-500 mb-1" />
              <h3 className="text-sm font-bold">Wallet</h3>
              <p className="text-2xl font-extrabold text-primary mt-0.5">Br {walletBalance.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground">Available balance</p>
            </div>

            {/* Breakdown */}
            <div className="bg-muted/30 rounded-xl p-3 mb-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">🎡 Loyalty conversions</span>
                <span className="font-semibold">Br {walletHistory.filter(e => e.source === 'conversion').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">🤝 Affiliate commissions</span>
                <span className="font-semibold text-emerald-600">Br {walletHistory.filter(e => e.source === 'affiliate').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">Br {walletBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Recent activity */}
            {walletHistory.length > 0 && (
              <div className="mb-3">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recent Activity</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {walletHistory.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                      <span className="flex items-center gap-1">
                        {h.source === 'conversion' ? '🔄' : h.source === 'affiliate' ? '🤝' : '💳'}
                        <span className="text-muted-foreground capitalize">{h.source}</span>
                      </span>
                      <span className="font-semibold text-emerald-600">+Br {h.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-2.5 text-[10px] text-muted-foreground mb-3">
              💡 <strong>Affiliate earnings</strong> go directly to your wallet. <strong>Loyalty points</strong> can be converted to cash in Loyalty & Rewards.
            </div>

            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => { setShowWallet(false); navigate('/loyalty'); }}>
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
          {/* Currency — icon only, to the right */}
          <div className="bg-card rounded-xl border border-border p-3 flex items-center justify-end">
            <CurrencySelector />
          </div>
          {/* Theme — 2 columns, opens to the left */}
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
          <LanguageSelector />
        </div>
      </div>

      {/* Logout */}
      <div className="mx-3 mt-3 mb-6">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setShowLogout(true)}>
          <span className="text-base w-6 text-center text-destructive">🚪</span>
          <span className="text-xs font-medium flex-1 text-destructive">{t('logout', language)}</span>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowLogout(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🚪</div>
              <h3 className="text-sm font-bold">Logout</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-destructive text-white rounded-xl text-xs font-bold" onClick={function() { store.setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' }); setShowLogout(false); }}>
                Yes, Logout
              </button>
              <button className="flex-1 py-3 border border-border rounded-xl text-xs" onClick={function() { setShowLogout(false); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


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
              {displayTelegramId && <div className="bg-muted/30 rounded-xl p-2.5 text-[9px] text-muted-foreground">
                <div className="flex items-center justify-between"><span>Telegram ID</span><span className="font-mono font-semibold">{profile.telegramId}</span></div>
                {displayTelegramUsername && <div className="flex items-center justify-between mt-1"><span>Username</span><span className="font-semibold">@{displayTelegramUsername}</span></div>}
              </div>}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={saveProfile}>💾 Save</button>
              <button className="px-4 py-3 border border-border rounded-xl text-xs" onClick={() => setShowEditProfile(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
