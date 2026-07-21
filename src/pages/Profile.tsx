import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { User, Package, Heart, ShoppingCart, Gift, LogOut, Moon, Sun, ChevronRight, Store, CreditCard, Palette, Globe, TrendingDown, Bell, Megaphone, MapPin, HelpCircle, Share2, Gamepad2 } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import { ActivePriceAlerts } from '@/components/features/PriceDropAlert';
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
  const { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, followedVendors, loyaltyPoints, savedPayments, preOrders, notifications, savedAddresses } = store;
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);

  const initials = profile.name ? profile.name.substring(0, 2).toUpperCase() : '?';
  const ordCount = orders.length + preOrders.length;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const followedVendorNames = followedVendors.map(id => {
    for (const p of store.products) { if (p.vendorId === id) return { id, name: p.vendorName || 'Shop' }; }
    return { id, name: `Shop #${id}` };
  }).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

  const tier = loyaltyPoints >= 500 ? { name: 'Gold', icon: '🥇' } : loyaltyPoints >= 200 ? { name: 'Silver', icon: '🥈' } : { name: 'Bronze', icon: '🥉' };
  const nextTier = loyaltyPoints < 200 ? { need: 200 - loyaltyPoints } : loyaltyPoints < 500 ? { need: 500 - loyaltyPoints } : null;

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
        { icon: '🎡', label: 'Game Center', onClick: () => navigate('/game') },
        { icon: '🏪', label: 'Vendor Dashboard', onClick: () => navigate('/vendor') },
        { icon: '📉', label: 'Price Alerts', badge: store.priceAlerts.length, onClick: () => {} },
        { icon: '🔔', label: 'Notifications', badge: notifications.length, onClick: () => store.clearNotifications() },
        { icon: '❓', label: 'Help & Support', onClick: () => navigate('/help') },
      ]
    },
  ];

  return (
    <div className="pb-4">
      {/* Avatar & Profile */}
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

      {/* Loyalty Card - Navigate to Game Center */}
      <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white flex items-center gap-3 cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/game')}>
        <span className="text-2xl">{tier.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-sm">{loyaltyPoints} pts</div>
          <div className="text-[10px] opacity-80">{tier.name} Tier</div>
          <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: nextTier ? `${Math.min(100, (loyaltyPoints / (loyaltyPoints + (nextTier?.need || 1))) * 100)}%` : '100%' }}></div>
          </div>
          <p className="text-[8px] opacity-60 mt-0.5">🎮 Tap to visit Game Center & convert points</p>
        </div>
        <ChevronRight size={16} />
      </div>

      {/* Price Alerts Section */}
      <div className="mx-3 mt-3">
        <ActivePriceAlerts />
      </div>

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

      {/* Sections */}
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

      {/* Currency + Theme + Language */}
      <div className="mx-3 mt-3">
        <div className="bg-card rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <Globe size={16} className="text-primary" />
            <span className="text-xs font-medium">Currency</span>
          </div>
          <CurrencySelector />
        </div>
        <div className="bg-card rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-base">🌐</span>
            <span className="text-xs font-medium">{t('language', language)}</span>
          </div>
          <select className="w-full p-2 border border-input rounded-lg text-xs bg-card" value={language} onChange={e => setLanguage(e.target.value as any)}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <Palette size={16} className="text-primary" />
            <span className="text-xs font-medium">Theme</span>
          </div>
          <div className="flex gap-2 mb-2"><ThemePicker /></div>
          <div className="flex gap-2">
            <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-medium border transition-all', !darkMode ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')} onClick={() => setDarkMode(false)}>☀️ {t('light', language)}</button>
            <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-medium border transition-all', darkMode ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')} onClick={() => setDarkMode(true)}>🌙 {t('dark', language)}</button>
          </div>
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
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                <input className="w-full p-3 border border-input rounded-xl text-sm bg-card mt-1" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
                <input className="w-full p-3 border border-input rounded-xl text-sm bg-card mt-1" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="09XXXXXXXX" />
              </div>
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
