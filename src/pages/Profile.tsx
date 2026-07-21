import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { User, Package, Heart, ShoppingCart, Gift, LogOut, Moon, Sun, ChevronRight, Store, CreditCard, Palette, Globe, TrendingDown, Bell, Megaphone } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import { ActivePriceAlerts } from '@/components/features/PriceDropAlert';

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
  const { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, followedVendors, loyaltyPoints, savedPayments, preOrders, notifications } = store;

  const initials = profile.name ? profile.name.substring(0, 2).toUpperCase() : '?';
  const ordCount = orders.length + preOrders.length;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Get followed vendors info from products
  const followedVendorNames = followedVendors.map(id => {
    for (const p of store.products) { if (p.vendorId === id) return { id, name: p.vendorName || 'Shop' }; }
    return { id, name: `Shop #${id}` };
  }).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

  const tier = loyaltyPoints >= 500 ? { name: 'Gold', icon: '🥇' } : loyaltyPoints >= 200 ? { name: 'Silver', icon: '🥈' } : { name: 'Bronze', icon: '🥉' };
  const nextTier = loyaltyPoints < 200 ? { need: 200 - loyaltyPoints } : loyaltyPoints < 500 ? { need: 500 - loyaltyPoints } : null;

  const menuItems = [
    { icon: '✏️', label: 'Edit Profile', onClick: () => { const n = prompt('Name:', profile.name); if (n && n.trim()) store.updateProfileName(n.trim()); } },
    { icon: '📍', label: 'Saved Addresses', badge: store.savedAddresses.length, onClick: () => navigate('/profile') },
    { icon: '💳', label: 'Payment Methods', badge: savedPayments.length, onClick: () => navigate('/profile') },
    { icon: '🎡', label: 'Game Center', onClick: () => navigate('/game') },
  ];

  const shopItems = [
    { icon: '📦', label: 'My Orders', badge: ordCount, onClick: () => navigate('/orders') },
    { icon: '🚀', label: 'Pre-Orders', badge: preOrders.length, onClick: () => navigate('/orders') },
    { icon: '❤️', label: 'Wishlist', badge: wishlist.length, onClick: () => navigate('/wishlist') },
    { icon: '🎁', label: 'Gift Cards', badge: store.giftCards.length, onClick: () => navigate('/gift-cards') },
    { icon: '📉', label: 'Price Alerts', badge: store.priceAlerts.length, onClick: () => {} },
    { icon: '🔔', label: 'Notifications', badge: notifications.length, onClick: () => navigate('/profile') },
  ];

  const moreItems = [
    { icon: '🏪', label: 'Become a Vendor', onClick: () => navigate('/admin') },
    { icon: '🤝', label: 'Referral', onClick: () => { const c = 'REF-' + (profile.name.substring(0, 3).toUpperCase() || 'USR'); navigator.clipboard.writeText(c); store.addNotification('🤝', 'Referral code copied!'); } },
    { icon: '❓', label: 'Help & Support', onClick: () => {} },
  ];

  return (
    <div className="pb-4">
      {/* Avatar & Profile */}
      <div className="text-center py-6 bg-card border-b border-border">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md">
          {initials}
        </div>
        <h2 className="text-base font-bold mt-2">{profile.name || 'Guest'}</h2>
        {profile.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {profile.phone}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">📅 Joined {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Today'}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 p-3 bg-card mx-3 mt-3 rounded-xl border border-border">
        {[
          { val: ordCount, label: 'Orders' },
          { val: wishlist.length, label: 'Wishlist' },
          { val: cartCount, label: 'Cart' },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-lg font-bold text-primary">{s.val}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Loyalty Card */}
      <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white flex items-center gap-3 cursor-pointer" onClick={() => navigate('/orders')}>
        <span className="text-2xl">{tier.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-sm">{loyaltyPoints} pts</div>
          <div className="text-[10px] opacity-80">{tier.name} Tier</div>
          <div className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: nextTier ? `${Math.min(100, loyaltyPoints / (loyaltyPoints + nextTier.need) * 100)}%` : '100%' }}></div>
          </div>
        </div>
        <ChevronRight size={16} />
      </div>

      {/* Price Alerts */}
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

      {/* Quick Menu */}
      <div className="mx-3 mt-3 space-y-1">
        {menuItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-primary transition-colors" onClick={item.onClick}>
            <span className="text-base w-6 text-center">{item.icon}</span>
            <span className="text-xs font-medium flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{item.badge}</span>
            )}
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Shop Menu */}
      <div className="mx-3 mt-3">
        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">Shopping</div>
        <div className="space-y-1">
          {shopItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-primary transition-colors" onClick={item.onClick}>
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

      {/* Currency Selector */}
      <div className="mx-3 mt-3">
        <div className="bg-card rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <Globe size={16} className="text-primary" />
            <span className="text-xs font-medium">Currency</span>
          </div>
          <CurrencySelector />
        </div>
      </div>

      {/* Theme + Language */}
      <div className="mx-3 mt-3">
        <div className="bg-card rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-base">🌐</span>
            <span className="text-xs font-medium">{t('language', language)}</span>
          </div>
          <select
            className="w-full p-2 border border-input rounded-lg text-xs bg-card"
            value={language}
            onChange={e => setLanguage(e.target.value as any)}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <Palette size={16} className="text-primary" />
            <span className="text-xs font-medium">Theme</span>
          </div>
          <div className="flex gap-2 mb-2">
            <ThemePicker />
          </div>
          <div className="flex gap-2">
            <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-medium border transition-all', !darkMode ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')} onClick={() => setDarkMode(false)}>☀️ {t('light', language)}</button>
            <button className={cn('flex-1 py-2 rounded-lg text-[10px] font-medium border transition-all', darkMode ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border')} onClick={() => setDarkMode(true)}>🌙 {t('dark', language)}</button>
          </div>
        </div>
      </div>

      {/* More Menu */}
      <div className="mx-3 mt-1 space-y-1">
        {moreItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-primary transition-colors" onClick={item.onClick}>
            <span className="text-base w-6 text-center">{item.icon}</span>
            <span className="text-xs font-medium flex-1">{item.label}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-3 mt-3 mb-6">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => { store.setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' }); }}>
          <span className="text-base w-6 text-center text-destructive">🚪</span>
          <span className="text-xs font-medium flex-1 text-destructive">{t('logout', language)}</span>
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground pb-4">🏪 Smart Shop v3.0</p>
    </div>
  );
}
