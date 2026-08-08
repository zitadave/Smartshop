import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { ChevronRight, Palette, Sun, Moon, Wallet, Phone, AtSign, Calendar, Store, LogOut, HelpCircle, Bell, TrendingDown, Trophy, Mail } from 'lucide-react';
import ThemePicker from '@/components/features/ThemePicker';
import CurrencySelector from '@/components/features/CurrencySelector';
import LanguageSelector from '@/components/features/LanguageSelector';
import { toast } from '@/components/Toast';

export default function Profile() {
  var navigate = useNavigate();
  var store = useStore();
  var { profile, language, setLanguage, darkMode, setDarkMode, orders, wishlist, cart, savedPayments, preOrders, notifications, savedAddresses, walletBalance } = store;
  
  var [showEdit, setShowEdit] = useState(false);
  var [showWallet, setShowWallet] = useState(false);
  var [showLogout, setShowLogout] = useState(false);
  var [editName, setEditName] = useState('');
  var [editPhone, setEditPhone] = useState('');
  var [editEmail, setEditEmail] = useState('');

  // Read localStorage data
  var ls: any = {};
  try {
    ls = JSON.parse(localStorage.getItem('ss_profile') || '{}');
    if (ls.phone && String(ls.phone).includes('@')) {
      ls.email = ls.email || String(ls.phone);
      ls.phone = '';
    }
  } catch(e) {}
  var rawLsPhone = localStorage.getItem('ss_user_phone') || '';
  var lsPhone = (rawLsPhone && !rawLsPhone.includes('@')) ? rawLsPhone : '';
  var lsEmail = localStorage.getItem('ss_user_email') || (rawLsPhone && rawLsPhone.includes('@') ? rawLsPhone : '');

  // Get Telegram WebApp user if available
  var tgUserObj = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  var tgId = profile.telegramId || ls.telegramId || String(tgUserObj?.id || '') || '';
  var tgUser = profile.telegramUsername || ls.telegramUsername || tgUserObj?.username || '';
  var tgName = tgUserObj ? [tgUserObj.first_name, tgUserObj.last_name].filter(Boolean).join(' ') : '';

  // Lookup in default Ethiopian customers / ss_registered_customers / orders
  var matchedCustomer: any = null;
  try {
    var defaultCustomers = [
      { id: 'c-1', name: 'Abebe Kebede', phone: '+251-911-234567', telegramId: '336997351', telegramUsername: 'abebe_k' },
      { id: 'c-2', name: 'Selamawit Tessema', phone: '+251-922-889900', telegramId: '109283746', telegramUsername: 'selam_t' },
      { id: 'c-3', name: 'Biruk Dawit', phone: '+251-933-445566', telegramId: '987654321', telegramUsername: 'biruk_d' },
    ];
    var regCustomers = JSON.parse(localStorage.getItem('ss_registered_customers') || '[]');
    var storeOrders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
    var orderCustomers = Array.isArray(storeOrders) ? storeOrders.map((o: any) => o.customer).filter(Boolean) : [];
    var allLookup = [...(Array.isArray(regCustomers) ? regCustomers : []), ...defaultCustomers, ...orderCustomers];

    matchedCustomer = allLookup.find(function(c: any) {
      if (!c) return false;
      var cTgId = String(c.telegramId || c.telegram_id || c.id || '');
      var cPhone = String(c.phone || '').replace(/[^0-9]/g, '');
      var cEmail = String(c.email || '').toLowerCase();
      var checkPhone = String(profile.phone || ls.phone || lsPhone || '').replace(/[^0-9]/g, '');
      var checkEmail = String(profile.email || ls.email || lsEmail || '').toLowerCase();
      if (tgId && cTgId && cTgId === String(tgId)) return true;
      if (checkPhone && checkPhone.length > 6 && cPhone.includes(checkPhone)) return true;
      if (checkEmail && checkEmail.includes('@') && cEmail === checkEmail) return true;
      return false;
    });
  } catch(e) {}

  var rawPhoneCandidate = profile.phone || ls.phone || lsPhone || matchedCustomer?.phone || '';
  var displayPhone = (rawPhoneCandidate && !String(rawPhoneCandidate).includes('@')) ? String(rawPhoneCandidate) : '';
  var displayEmail = profile.email || ls.email || lsEmail || matchedCustomer?.email || '';
  if (!displayEmail && rawPhoneCandidate && String(rawPhoneCandidate).includes('@')) {
    displayEmail = String(rawPhoneCandidate);
  }
  var rawName = profile.name || ls.name || '';
  var displayName = (rawName && rawName !== 'Guest') ? rawName : (tgName || matchedCustomer?.name || (tgUser ? '@' + tgUser : (displayPhone || 'Guest')));
  var displayJoined = profile.joinedAt || ls.joinedAt || matchedCustomer?.joinedAt || '';
  var initials = displayName.substring(0, 2).toUpperCase() || '?';
  var ordCount = orders.length + preOrders.length;
  var cartCount = cart.reduce(function(s, i) { return s + i.qty; }, 0);

  // ===== VENDOR STATUS =====
  var [vendorStatus, setVendorStatus] = useState('loading');
  
  // ===== DRIVER STATUS =====
  var [driverStatus, setDriverStatus] = useState('none');

  useEffect(function() {
    try {
      var badP = localStorage.getItem('ss_user_phone') || '';
      if (badP.includes('@')) {
        localStorage.removeItem('ss_user_phone');
      }
      if (profile.phone && profile.phone.includes('@')) {
        store.setProfile({ ...profile, phone: '' });
      }
    } catch {}
  }, []);

  useEffect(function() {
    if (displayName && displayName !== 'Guest' && (!profile.name || profile.name === 'Guest' || !ls.name || ls.name === 'Guest')) {
      var safePhone = displayPhone || (profile.phone && !profile.phone.includes('@') ? profile.phone : '');
      var safeEmail = displayEmail || (profile.email || (profile.phone && profile.phone.includes('@') ? profile.phone : ''));
      var updated = {
        ...profile,
        name: displayName,
        phone: safePhone,
        email: safeEmail,
        telegramId: tgId || profile.telegramId || '',
        telegramUsername: tgUser || profile.telegramUsername || '',
        registered: true
      };
      store.setProfile(updated);
      try {
        var existing = JSON.parse(localStorage.getItem('ss_profile') || '{}');
        existing.name = displayName;
        if (safePhone) existing.phone = safePhone;
        if (safeEmail) existing.email = safeEmail;
        if (tgId) existing.telegramId = tgId;
        existing.registered = true;
        localStorage.setItem('ss_profile', JSON.stringify(existing));
      } catch(e) {}
    }
  }, [displayName, displayPhone, displayEmail, tgId]);

  // Check vendor status on mount and every 5 seconds
  useEffect(function() {
    var cancelled = false;
    
    function check() {
      if (cancelled) return;
      
      // Read latest from localStorage
      var storedTgId = profile.telegramId || '';
      try { var p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); if (p.telegramId) storedTgId = p.telegramId; } catch(e) {}
      var storedPhone = profile.phone || '';
      try { storedPhone = localStorage.getItem('ss_user_phone') || ''; } catch(e) {}
      
      if (!storedTgId) {
        // No Telegram ID yet - set to 'none'
        if (!cancelled) {
          setVendorStatus('none');
          setDriverStatus('none');
        }
        return;
      }
      
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: storedTgId, phone: storedPhone || '' })
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (cancelled) return;
        if (d && d.vendor_status) {
          var newStatus = d.vendor_status;
          var oldStatus = 'none';
          try { oldStatus = localStorage.getItem('ss_vendor_status') || 'none'; } catch(e) {}
          
          localStorage.setItem('ss_vendor_status', newStatus);
          if (d.vendor_id) localStorage.setItem('ss_vendor_app_id', String(d.vendor_id));
          
          if (newStatus === 'approved' && oldStatus !== 'approved') {
            toast('✅ Vendor approved! Dashboard is now available.', 'success');
          }
          if (newStatus === 'none' && oldStatus === 'approved') {
            localStorage.removeItem('ss_vendor_app_id');
          }
          
          if (!cancelled) setVendorStatus(newStatus);
        } else {
          if (!cancelled) setVendorStatus('none');
        }
      }).catch(function() {
        if (!cancelled) setVendorStatus('none');
      });

      // Check driver status
      fetch('/api/delivery/drivers?telegramId=' + storedTgId)
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (cancelled) return;
          if (d && d.success && d.driver && d.driver.status === 'approved') {
            if (!cancelled) setDriverStatus('approved');
            localStorage.setItem('ss_driver_status', 'approved');
          } else {
            if (!cancelled) setDriverStatus(d?.driver?.status || 'none');
            localStorage.setItem('ss_driver_status', d?.driver?.status || 'none');
          }
        })
        .catch(function() {
          if (!cancelled) setDriverStatus('none');
          localStorage.setItem('ss_driver_status', 'none');
        });
    }
    
    // Initial check immediately
    check();
    // Then check every 5 seconds
    var interval = setInterval(check, 5000);
    return function() { cancelled = true; clearInterval(interval); };
  }, [profile.telegramId]);

  function openEdit() {
    setEditName(displayName === 'Guest' ? '' : displayName);
    setEditPhone(displayPhone && !displayPhone.includes('@') ? displayPhone : '');
    setEditEmail(displayEmail || (displayPhone && displayPhone.includes('@') ? displayPhone : ''));
    setShowEdit(true);
  }

  function saveEdit() {
    var updatedName = editName.trim() || displayName;
    var updatedPhone = editPhone.trim();
    var updatedEmail = editEmail.trim();

    if (updatedPhone.includes('@')) {
      toast('Please enter a valid phone number, not an email address.', 'error');
      return;
    }
    if (updatedName && updatedName.length < 2) {
      toast('Please enter a full name with at least 2 characters.', 'error');
      return;
    }
    if (updatedPhone) {
      var phoneDigits = updatedPhone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 7) {
        toast('Phone number must contain at least 7 digits (e.g. 0911234567).', 'error');
        return;
      }
    }
    if (updatedEmail && (!updatedEmail.includes('@') || !updatedEmail.includes('.'))) {
      toast('Please enter a valid email address (e.g. user@gmail.com).', 'error');
      return;
    }

    var newProfile = {
      ...profile,
      name: updatedName,
      phone: updatedPhone,
      email: updatedEmail,
      telegramId: tgId || profile.telegramId || '',
      telegramUsername: tgUser || profile.telegramUsername || '',
      registered: true
    };

    store.setProfile(newProfile);
    try {
      var lsP = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      lsP.name = updatedName;
      lsP.phone = updatedPhone;
      lsP.email = updatedEmail;
      lsP.registered = true;
      localStorage.setItem('ss_profile', JSON.stringify(lsP));
      localStorage.setItem('ss_user_phone', updatedPhone);
      if (updatedEmail) localStorage.setItem('ss_user_email', updatedEmail);

      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgId || '',
          phone: updatedPhone,
          username: tgUser || '',
          first_name: updatedName
        })
      }).catch(function() {});

      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgId || '',
          name: updatedName,
          phone: updatedPhone,
          email: updatedEmail,
          joinedAt: displayJoined || new Date().toISOString()
        })
      }).catch(function() {});
    } catch(e) {}

    setShowEdit(false);
    toast('✅ Profile saved & synced!', 'success');
  }

  var engagementItems: any[] = [
    { icon: '🏆', label: t('loyaltyRewardsMenu', language), desc: t('loyaltyRewardsMenuDesc', language), onClick: function() { navigate('/loyalty'); } },
  ];

  if (vendorStatus === 'loading') {
    // Still checking - show nothing special
    engagementItems.push({ icon: '📝', label: t('becomeVendor', language), desc: t('becomeVendorDesc', language), onClick: function() { navigate('/vendor-register'); } });
  } else if (vendorStatus === 'approved') {
    engagementItems.push({ icon: '🏪', label: t('vendorDashboard', language), desc: t('vendorDashboardDesc', language), onClick: function() { navigate('/vendor'); } });
  } else if (vendorStatus === 'pending') {
    engagementItems.push({ icon: '⏳', label: t('appPending', language), desc: t('appPendingDesc', language), onClick: function() { toast('Your application is being reviewed.', 'info'); } });
  } else {
    engagementItems.push({ icon: '📝', label: t('becomeVendor', language), desc: t('becomeVendorDesc', language), onClick: function() { navigate('/vendor-register'); } });
  }

  // Driver Status menu item (ONLY visible to APPROVED drivers - including users who are both an approved vendor and an approved driver!)
  if (driverStatus === 'approved') {
    engagementItems.push({ icon: '🏍️', label: t('smartExpress', language), desc: t('smartExpressDesc', language), onClick: function() { navigate('/driver'); } });
  }

  var isAuthorizedAdmin = (function() {
    try {
      var tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      var ls = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      var liveTgId = String(tgUser?.id || profile.telegramId || ls.telegramId || '').trim();
      var phone = String(profile.phone || ls.phone || '').trim();

      // 1. Strict Founder ID Check: ONLY Telegram ID 336997351 is Founder Super Admin
      if (liveTgId === '336997351' || Number(liveTgId) === 336997351) {
        return true;
      }

      // 2. Strict Guest / Customer / Vendor Anti-Spoofing Guard:
      // If the user has no explicit Telegram ID or Phone, never grant admin access
      if (!liveTgId && !phone) {
        return false;
      }

      // 3. Check if exact Telegram ID or Phone matches an active Admin User in RBAC
      var adminUsers = JSON.parse(localStorage.getItem('ss_admin_users') || '[]');
      var cloudAdmins = (store.settings as any).adminUsers || [];
      var allAdmins = [...adminUsers, ...cloudAdmins];
      return allAdmins.some(function(u: any) { 
        if (!u || u.status !== 'active') return false;
        if (liveTgId && Boolean(u.telegramId) && String(u.telegramId).trim() === liveTgId) return true;
        if (phone && Boolean(u.phone) && String(u.phone).trim() === phone) return true;
        return false;
      });
    } catch(e) {
      return false;
    }
  })();

  engagementItems.push(
    { icon: '📉', label: t('priceAlertsMenu', language), badge: store.priceAlerts.length, desc: t('priceAlertsMenuDesc', language), onClick: function() { navigate('/price-alerts'); } },
    { icon: '🔔', label: t('notificationsMenu', language), badge: notifications.length, desc: `${notifications.length} ${t('notificationsMenuDesc', language)}`, onClick: function() { navigate('/notifications'); } },
    { icon: '❓', label: t('helpSupportMenu', language), desc: t('helpSupportMenuDesc', language), onClick: function() { navigate('/help'); } },
  );

  return (
    <div className="pb-4">
      {/* Guest Sign-In & Verification Banner */}
      {(!profile.phone || displayName === 'Guest') && (
        <div className="mx-3 mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              <span>🔑 Sign In & Phone Verification</span>
            </div>
            <p className="text-[10px] text-white/80 mt-0.5">
              Have a verified phone number? Sign in to synchronize your account across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-extrabold shadow-md transition-all"
          >
            Sign In Now →
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="relative mx-3 mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-blue-700 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-lg ring-2 ring-white/30 cursor-pointer hover:scale-105 transition-transform" onClick={openEdit}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{displayName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-white/80">
                {displayPhone && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"><Phone size={10} /> {displayPhone}</span>}
                {displayEmail && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"><Mail size={10} /> {displayEmail}</span>}
                {tgUser && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"><AtSign size={10} /> @{tgUser}</span>}
                {tgId && <span className="font-mono text-[8px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">ID: {tgId}</span>}
                {vendorStatus === 'approved' && <span className="bg-emerald-400/30 px-2 py-0.5 rounded-full text-[9px]">🏪 {t('vendorDashboard', language)}</span>}
              </div>
              <p className="text-[9px] text-white/60 mt-1.5 flex items-center gap-1">
                <Calendar size={9} /> {t('joinedLabel', language)} {displayJoined ? new Date(displayJoined).toLocaleDateString() : t('todayLabel', language)}
              </p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all flex-shrink-0" onClick={openEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          {vendorStatus === 'approved' && (
            <div className="mt-3 bg-emerald-400/20 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-emerald-400/20">
              <Store size={14} />
              <span className="text-[10px] font-medium">{t('vendorAccountActive', language)}</span>
              <button className="ml-auto text-[9px] bg-white/20 px-2.5 py-1 rounded-lg font-semibold hover:bg-white/30 transition-all" onClick={function() { navigate('/vendor'); }}>
                {t('dashboardBtn', language)} →
              </button>
            </div>
          )}
          {vendorStatus === 'pending' && (
            <div className="mt-3 bg-amber-400/20 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-amber-400/20">
              <span className="text-[10px]">⏳</span>
              <span className="text-[10px] font-medium">{t('appPendingBanner', language)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/orders'); }}>
          <div className="text-lg font-bold text-primary">{ordCount}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('ordersStat', language)}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/wishlist'); }}>
          <div className="text-lg font-bold text-primary">{wishlist.length}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('wishlistStat', language)}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/cart'); }}>
          <div className="text-lg font-bold text-primary">{cartCount}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('cartStat', language)}</div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="mx-3 mt-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 transition-all" onClick={function() { setShowWallet(true); }}>
          <div className="flex items-center justify-between">
            <div>
              <Wallet size={18} className="mb-1 opacity-80" />
              <div className="text-lg font-extrabold">Br {walletBalance.toLocaleString()}</div>
              <div className="text-[8px] opacity-70">{t('walletBalance', language)}</div>
            </div>
            <div className="text-right opacity-60">
              <div className="text-2xl">💰</div>
              <div className="text-[7px] uppercase tracking-wider mt-1">{t('tapToView', language)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="mx-3 mt-3 space-y-2">
        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{t('accountSection', language)}</div>
        {isAuthorizedAdmin && (
          <MenuItem icon="🛡️" label={t('adminControlPanel', language)} desc={t('adminControlPanelDesc', language)} onClick={function() { navigate('/admin-panel'); }} />
        )}
        <MenuItem icon="✏️" label={t('editProfile', language)} desc={t('editProfileDesc', language)} onClick={function() { openEdit(); }} />
        <MenuItem icon="📍" label={t('savedAddresses', language)} badge={savedAddresses.length} desc={`${savedAddresses.length} ${t('savedAddressesDesc', language)}`} onClick={function() { navigate('/addresses'); }} />

        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4 mb-1">{t('shoppingSection', language)}</div>
        <MenuItem icon="📸" label={t('aiPhotoStudio', language)} desc={t('aiPhotoStudioDesc', language)} onClick={function() { navigate('/photo-studio'); }} />
        <MenuItem icon="📦" label={t('myOrders', language)} badge={ordCount} desc={`${ordCount} ${t('myOrdersDesc', language)}`} onClick={function() { navigate('/orders'); }} />
        <MenuItem icon="🗓" label={t('subscriptionsMenu', language)} desc={t('subscriptionsMenuDesc', language)} onClick={function() { navigate('/subscriptions'); }} />
        <MenuItem icon="🤝" label={t('groupBuysMenu', language)} desc={t('groupBuysMenuDesc', language)} onClick={function() { navigate('/my-group-deals'); }} />
        <MenuItem icon="❤️" label={t('wishlist', language)} badge={wishlist.length} desc={`${wishlist.length} ${t('wishlistMenuDesc', language)}`} onClick={function() { navigate('/wishlist'); }} />
        <MenuItem icon="🎁" label={t('giftCardsMenu', language)} desc={t('giftCardsMenuDesc', language)} onClick={function() { navigate('/gift-cards'); }} />
        <MenuItem icon="🤝" label={t('affiliateMenu', language)} desc={t('affiliateMenuDesc', language)} onClick={function() { navigate('/affiliate'); }} />

        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4 mb-1">{t('engagementSection', language)}</div>
        {engagementItems.map(function(item, i) {
          return <MenuItem key={i} icon={item.icon} label={item.label} badge={item.badge} desc={item.desc} onClick={item.onClick} />;
        })}
      </div>

      {/* Theme / Language */}
      <div className="mx-3 mt-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-card rounded-xl border border-border p-3 flex items-center justify-end">
            <CurrencySelector />
          </div>
          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-2"><Palette size={14} className="text-primary" /><span className="text-[10px] font-medium">{t('themeLabel', language)}</span></div>
            <ThemePicker />
            <div className="flex gap-1 mt-2">
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold', !darkMode ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={function() { setDarkMode(false); }}><Sun size={10} className="inline mr-1" />{t('light', language)}</button>
              <button className={cn('flex-1 py-1.5 rounded-lg text-[9px] font-semibold', darkMode ? 'bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md' : 'bg-muted text-muted-foreground')} onClick={function() { setDarkMode(true); }}><Moon size={10} className="inline mr-1" />{t('dark', language)}</button>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2.5 mb-2"><span className="text-base">🌐</span><span className="text-xs font-medium">{t('language', language)}</span></div>
          <LanguageSelector />
        </div>
      </div>

      {/* Logout */}
      <div className="mx-3 mt-4 mb-6">
        <div className="flex items-center gap-3 px-3 py-3 bg-card rounded-xl border border-border cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-all" onClick={function() { setShowLogout(true); }}>
          <LogOut size={16} className="text-destructive" />
          <span className="text-xs font-medium text-destructive flex-1">{t('logoutMenu', language)}</span>
          <ChevronRight size={14} className="text-destructive/50" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-4 text-[10px] text-muted-foreground font-semibold">
        {(store.settings as any)?.platformLogo ? (
          <img src={(store.settings as any).platformLogo} alt="Logo" className="w-4 h-4 rounded-md object-cover" />
        ) : (
          <span>🏪</span>
        )}
        <span>{(store.settings as any)?.platformName || 'Smart Shop'}</span>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowEdit(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-bounce-in" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md">{initials}</div>
              <h3 className="text-base font-bold mt-2">{t('editProfileTitle', language)}</h3>
            </div>
            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{t('profileName', language)}</label>
                <input className="w-full mt-1 p-3 border border-input rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" value={editName} onChange={function(e) { setEditName(e.target.value); }} placeholder="Your name" /></div>
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{t('phone', language)}</label>
                <input className="w-full mt-1 p-3 border border-input rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" value={editPhone} onChange={function(e) { setEditPhone(e.target.value); }} placeholder="09XXXXXXXX" /></div>
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Email Address (For Receipts & 4-Digit Security PINs)</label>
                <input type="email" className="w-full mt-1 p-3 border border-input rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" value={editEmail} onChange={function(e) { setEditEmail(e.target.value); }} placeholder="e.g. customer@gmail.com" /></div>
              {tgId && <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Telegram ID</span><span className="font-mono font-semibold">{tgId}</span></div>
                {tgUser && <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Username</span><span className="font-semibold">@{tgUser}</span></div>}
              </div>}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={saveEdit}>💾 {t('saveChanges', language)}</button>
              <button className="px-5 py-3 border border-border rounded-xl text-xs" onClick={function() { setShowEdit(false); }}>{t('cancelBtn', language)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowWallet(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Wallet size={22} className="text-white" />
              </div>
              <h3 className="text-sm font-bold">{t('walletBalance', language)}</h3>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Br {walletBalance.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t('tapToView', language)}</p>
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={function() { setShowWallet(false); }}>{t('doneBtn', language)}</button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={function() { setShowLogout(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scaleIn text-slate-900 dark:text-white" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-3xl mb-3">
                🚪
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Are you sure you want to log out?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                You will be signed out on this device. You can sign back in anytime using your verified phone number.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all"
                onClick={function() {
                  localStorage.removeItem('ss_profile');
                  localStorage.removeItem('ss_user_phone');
                  localStorage.removeItem('ss_user_email');
                  localStorage.removeItem('ss_tg_detected');
                  store.setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' });
                  setShowLogout(false);
                  toast('✅ You have been logged out.', 'info');
                }}
              >
                Yes, Log Out
              </button>
              <button
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all"
                onClick={function() { setShowLogout(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem(props: any) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 bg-card rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-sm transition-all" onClick={props.onClick}>
      <span className="text-lg w-7 text-center">{props.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{props.label}</div>
        {props.desc && <div className="text-[8px] text-muted-foreground mt-0.5">{props.desc}</div>}
      </div>
      {props.badge !== undefined && props.badge > 0 && (
        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{props.badge}</span>
      )}
      <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
    </div>
  );
}
