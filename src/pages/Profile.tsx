import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/lib/useTelegram';
import { ChevronRight, Store, Palette, Sun, Moon, Wallet } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import LanguageSelector from '@/components/features/LanguageSelector';
import { ActivePriceAlerts } from '@/components/features/PriceDropAlert';
import TelegramLogin from '@/components/auth/TelegramLogin';
import { toast } from '@/components/Toast';

export default function Profile() {
  var navigate = useNavigate();
  var store = useStore();
  var { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, followedVendors, loyaltyPoints, savedPayments, preOrders, notifications, savedAddresses, walletBalance, walletHistory, settings } = store;
  var tg = useTelegram();
  
  var [showEdit, setShowEdit] = useState(false);
  var [showWallet, setShowWallet] = useState(false);
  var [showLogout, setShowLogout] = useState(false);

  // Read data from store + localStorage + telegram hook
  var ls = {};
  try { ls = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
  var lsPhone = localStorage.getItem('ss_user_phone') || '';
  
  var tgId = profile.telegramId || ls.telegramId || tg.user?.telegramId || '';
  var tgUser = profile.telegramUsername || ls.telegramUsername || tg.user?.telegramUsername || '';
  var displayPhone = profile.phone || ls.phone || lsPhone || tg.phone || tg.user?.phone || '';
  var displayName = profile.name || ls.name || tg.user?.name || 'Guest';
  var displayJoined = profile.joinedAt || ls.joinedAt || '';

  var initials = displayName.substring(0, 2).toUpperCase() || '?';
  var ordCount = orders.length + preOrders.length;
  var cartCount = cart.reduce(function(s, i) { return s + i.qty; }, 0);

  // Inline setup form state
  var [showSetup, setShowSetup] = useState(!tgId && !displayPhone);
  var [inputId, setInputId] = useState('');
  var [inputPhone, setInputPhone] = useState('');
  var [inputName, setInputName] = useState('');

  function saveSetup() {
    if (!inputId.trim()) { toast('Telegram ID is required', 'error'); return; }
    var p = {
      telegramId: inputId.trim(),
      telegramUsername: '',
      name: inputName.trim() || 'User ' + inputId.trim(),
      phone: inputPhone.trim() || '',
      joinedAt: new Date().toISOString(),
      registered: true
    };
    localStorage.setItem('ss_profile', JSON.stringify(p));
    if (inputPhone.trim()) {
      localStorage.setItem('ss_user_phone', inputPhone.trim());
      localStorage.setItem('ss_phone_shared', 'true');
    }
    store.setProfile(p);
    setShowSetup(false);
    toast('✅ Saved!', 'success');
  }

  var sections = [
    {
      title: 'Account',
      items: [
        { icon: '✏️', label: 'Edit Profile', onClick: function() { setShowEdit(true); } },
        { icon: '📍', label: 'Saved Addresses', badge: savedAddresses.length, onClick: function() { navigate('/addresses'); } },
        { icon: '💳', label: 'Payment Methods', badge: savedPayments.length, onClick: function() { navigate('/payment-methods'); } },
      ]
    },
    {
      title: 'Shopping',
      items: [
        { icon: '📦', label: 'My Orders', badge: ordCount, onClick: function() { navigate('/orders'); } },
        { icon: '❤️', label: 'Wishlist', badge: wishlist.length, onClick: function() { navigate('/wishlist'); } },
        { icon: '🎁', label: 'Gift Cards', onClick: function() { navigate('/gift-cards'); } },
        { icon: '🤝', label: 'Affiliate Program', onClick: function() { navigate('/affiliate'); } },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { icon: '🏆', label: 'Loyalty & Rewards', onClick: function() { navigate('/loyalty'); } },
        { icon: '📝', label: 'Become a Vendor', onClick: function() { navigate('/vendor-register'); } },
        { icon: '📉', label: 'Price Alerts', badge: store.priceAlerts.length, onClick: function() { navigate('/price-alerts'); } },
        { icon: '🔔', label: 'Notifications', badge: notifications.length, onClick: function() { navigate('/notifications'); } },
        { icon: '❓', label: 'Help & Support', onClick: function() { navigate('/help'); } },
      ]
    },
  ];

  return (
    <div className="pb-4">
      {/* Avatar / Header */}
      <div className="text-center py-6 bg-card border-b border-border">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md cursor-pointer" onClick={function() { setShowEdit(true); }}>
          {initials}
        </div>
        <h2 className="text-base font-bold mt-2">{displayName}</h2>
        <div className="flex flex-col items-center gap-0.5 mt-1">
          {displayPhone && <p className="text-[10px] text-muted-foreground">📞 {displayPhone}</p>}
          {tgUser && <p className="text-[10px] text-muted-foreground">@ {tgUser}</p>}
          {tgId && <p className="text-[8px] text-muted-foreground/50 font-mono">ID: {tgId}</p>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">📅 Joined {displayJoined ? new Date(displayJoined).toLocaleDateString() : 'Today'}</p>
      </div>

      {/* Inline Setup Form (shown when no Telegram data) */}
      {showSetup && (
        <div className="mx-3 mt-3 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
          <div className="text-center mb-3">
            <div className="text-2xl mb-1">🏪</div>
            <h3 className="text-sm font-bold">Welcome to Smart Shop</h3>
            <p className="text-[9px] text-white/70 mt-1">Enter your details to personalize your experience</p>
          </div>
          <div className="space-y-2">
            <input className="w-full p-2.5 rounded-xl text-sm text-slate-900" placeholder="Telegram ID (from @userinfobot)" value={inputId} onChange={function(e) { setInputId(e.target.value); }} />
            <input className="w-full p-2.5 rounded-xl text-sm text-slate-900" placeholder="Phone (e.g. 251912345678)" value={inputPhone} onChange={function(e) { setInputPhone(e.target.value); }} />
            <input className="w-full p-2.5 rounded-xl text-sm text-slate-900" placeholder="Your name" value={inputName} onChange={function(e) { setInputName(e.target.value); }} />
            <button className="w-full py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold" onClick={saveSetup}>Save & Continue</button>
          </div>
        </div>
      )}

      {/* Telegram Connect */}
      <div className="mx-3 mt-3">
        <TelegramLogin variant="card" />
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 p-3 bg-card mx-3 mt-3 rounded-xl border border-border">
        <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={function() { navigate('/orders'); }}>
          <div className="text-lg font-bold text-primary">{ordCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Orders</div>
        </div>
        <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={function() { navigate('/wishlist'); }}>
          <div className="text-lg font-bold text-primary">{wishlist.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Wishlist</div>
        </div>
        <div className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={function() { navigate('/cart'); }}>
          <div className="text-lg font-bold text-primary">{cartCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Cart</div>
        </div>
      </div>

      {/* Wallet */}
      <div className="mx-3 mt-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 text-white cursor-pointer hover:shadow-xl transition-all" onClick={function() { setShowWallet(true); }}>
          <Wallet size={18} className="mb-1 opacity-80" />
          <div className="text-lg font-extrabold">Br {walletBalance.toLocaleString()}</div>
          <div className="text-[8px] opacity-70">Wallet Balance</div>
        </div>
      </div>

      {/* Menu Sections */}
      {sections.map(function(section, si) {
        return (
          <div key={si} className="mx-3 mt-3">
            <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{section.title}</div>
            <div className="space-y-1">
              {section.items.map(function(item, i) {
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-primary hover:shadow-sm transition-all" onClick={item.onClick}>
                    <span className="text-base w-6 text-center">{item.icon}</span>
                    <span className="text-xs font-medium flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{item.badge}</span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Theme / Language */}
      <div className="mx-3 mt-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-card rounded-xl border border-border p-3 flex items-center justify-end">
            <CurrencySelector />
          </div>
          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-2"><Palette size={14} className="text-primary" /><span className="text-[10px] font-medium">Theme</span></div>
            <ThemePicker />
            <div className="flex gap-1 mt-2">
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold', !darkMode ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={function() { setDarkMode(false); }}><Sun size={10} className="inline mr-1" />Light</button>
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold', darkMode ? 'bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={function() { setDarkMode(true); }}><Moon size={10} className="inline mr-1" />Dark</button>
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
        <div className="flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border cursor-pointer hover:border-destructive/50 transition-colors" onClick={function() { setShowLogout(true); }}>
          <span className="text-base w-6 text-center text-destructive">🚪</span>
          <span className="text-xs font-medium flex-1 text-destructive">Logout</span>
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground pb-4">🏪 Smart Shop</p>

      {/* Modals */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowWallet(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-3">
              <Wallet size={28} className="mx-auto text-emerald-500 mb-1" />
              <h3 className="text-sm font-bold">Wallet</h3>
              <p className="text-2xl font-extrabold text-primary mt-0.5">Br {walletBalance.toLocaleString()}</p>
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={function() { setShowWallet(false); }}>OK</button>
          </div>
        </div>
      )}

      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowLogout(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🚪</div>
              <h3 className="text-sm font-bold">Logout</h3>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-destructive text-white rounded-xl text-xs font-bold" onClick={function() { store.setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' }); setShowLogout(false); }}>Yes</button>
              <button className="flex-1 py-3 border border-border rounded-xl text-xs" onClick={function() { setShowLogout(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
