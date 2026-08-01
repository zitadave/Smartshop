import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { ChevronRight, Palette, Sun, Moon, Wallet, Phone, AtSign, Calendar, Store, LogOut, HelpCircle, Bell, TrendingDown, Trophy } from 'lucide-react';
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

  // Read localStorage data
  var ls: any = {};
  try { ls = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
  var lsPhone = localStorage.getItem('ss_user_phone') || '';
  
  var tgId = profile.telegramId || ls.telegramId || '';
  var tgUser = profile.telegramUsername || ls.telegramUsername || '';
  var displayPhone = profile.phone || ls.phone || lsPhone || '';
  var displayName = profile.name || ls.name || 'Guest';
  var displayJoined = profile.joinedAt || ls.joinedAt || '';
  var initials = displayName.substring(0, 2).toUpperCase() || '?';
  var ordCount = orders.length + preOrders.length;
  var cartCount = cart.reduce(function(s, i) { return s + i.qty; }, 0);

  // ===== VENDOR STATUS =====
  var [vendorStatus, setVendorStatus] = useState('loading');
  
  // ===== DRIVER STATUS =====
  var [driverStatus, setDriverStatus] = useState('none');

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
    setEditPhone(displayPhone);
    setShowEdit(true);
  }

  function saveEdit() {
    if (editName.trim()) {
      var newProfile = { ...profile, name: editName.trim() };
      store.setProfile(newProfile);
      var lsP = {};
      try { lsP = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      lsP.name = editName.trim();
      localStorage.setItem('ss_profile', JSON.stringify(lsP));
    }
    if (editPhone.trim()) {
      store.setProfile({ ...profile, phone: editPhone.trim() });
      localStorage.setItem('ss_user_phone', editPhone.trim());
      var lsP2 = {};
      try { lsP2 = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      lsP2.phone = editPhone.trim();
      localStorage.setItem('ss_profile', JSON.stringify(lsP2));
    }
    setShowEdit(false);
    toast('✅ Profile updated!', 'success');
  }

  var engagementItems: any[] = [
    { icon: '🏆', label: 'Loyalty & Rewards', desc: 'Earn points & rewards', onClick: function() { navigate('/loyalty'); } },
  ];

  if (vendorStatus === 'loading') {
    // Still checking - show nothing special
    engagementItems.push({ icon: '📝', label: 'Become a Vendor', desc: 'Start selling products', onClick: function() { navigate('/vendor-register'); } });
  } else if (vendorStatus === 'approved') {
    engagementItems.push({ icon: '🏪', label: 'Vendor Dashboard', desc: 'Manage your store', onClick: function() { navigate('/vendor'); } });
  } else if (vendorStatus === 'pending') {
    engagementItems.push({ icon: '⏳', label: 'Application Pending', desc: 'Under review by admin', onClick: function() { toast('Your application is being reviewed.', 'info'); } });
  } else {
    engagementItems.push({ icon: '📝', label: 'Become a Vendor', desc: 'Start selling products', onClick: function() { navigate('/vendor-register'); } });
  }

  // Driver Status menu item (ONLY visible to APPROVED drivers - including users who are both an approved vendor and an approved driver!)
  if (driverStatus === 'approved') {
    engagementItems.push({ icon: '🏍️', label: 'Smart Express', desc: 'Driver dashboard & active jobs', onClick: function() { navigate('/driver'); } });
  }

  engagementItems.push(
    { icon: '📉', label: 'Price Alerts', badge: store.priceAlerts.length, desc: 'Track price drops', onClick: function() { navigate('/price-alerts'); } },
    { icon: '🔔', label: 'Notifications', badge: notifications.length, desc: notifications.length + ' unread', onClick: function() { navigate('/notifications'); } },
    { icon: '❓', label: 'Help & Support', desc: 'Get assistance', onClick: function() { navigate('/help'); } },
  );

  return (
    <div className="pb-4">
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
                {tgUser && <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full"><AtSign size={10} /> @{tgUser}</span>}
                {tgId && <span className="font-mono text-[8px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">ID: {tgId}</span>}
                {vendorStatus === 'approved' && <span className="bg-emerald-400/30 px-2 py-0.5 rounded-full text-[9px]">🏪 Vendor</span>}
              </div>
              <p className="text-[9px] text-white/60 mt-1.5 flex items-center gap-1">
                <Calendar size={9} /> Joined {displayJoined ? new Date(displayJoined).toLocaleDateString() : 'Today'}
              </p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all flex-shrink-0" onClick={openEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          {vendorStatus === 'approved' && (
            <div className="mt-3 bg-emerald-400/20 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-emerald-400/20">
              <Store size={14} />
              <span className="text-[10px] font-medium">Vendor account active</span>
              <button className="ml-auto text-[9px] bg-white/20 px-2.5 py-1 rounded-lg font-semibold hover:bg-white/30 transition-all" onClick={function() { navigate('/vendor'); }}>
                Dashboard →
              </button>
            </div>
          )}
          {vendorStatus === 'pending' && (
            <div className="mt-3 bg-amber-400/20 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-amber-400/20">
              <span className="text-[10px]">⏳</span>
              <span className="text-[10px] font-medium">Application pending - admin will review shortly</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/orders'); }}>
          <div className="text-lg font-bold text-primary">{ordCount}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Orders</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/wishlist'); }}>
          <div className="text-lg font-bold text-primary">{wishlist.length}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Wishlist</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={function() { navigate('/cart'); }}>
          <div className="text-lg font-bold text-primary">{cartCount}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Cart</div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="mx-3 mt-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 transition-all" onClick={function() { setShowWallet(true); }}>
          <div className="flex items-center justify-between">
            <div>
              <Wallet size={18} className="mb-1 opacity-80" />
              <div className="text-lg font-extrabold">Br {walletBalance.toLocaleString()}</div>
              <div className="text-[8px] opacity-70">Wallet Balance</div>
            </div>
            <div className="text-right opacity-60">
              <div className="text-2xl">💰</div>
              <div className="text-[7px] uppercase tracking-wider mt-1">Tap to view</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="mx-3 mt-3 space-y-2">
        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Account</div>
        <MenuItem icon="🛡️" label="Admin Control Panel" desc="Manage marketplace & promotions" onClick={function() { navigate('/admin-panel'); }} />
        <MenuItem icon="✏️" label="Edit Profile" desc="Update your personal info" onClick={function() { openEdit(); }} />
        <MenuItem icon="📍" label="Saved Addresses" badge={savedAddresses.length} desc={savedAddresses.length + ' addresses'} onClick={function() { navigate('/addresses'); }} />

        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4 mb-1">Shopping</div>
        <MenuItem icon="📸" label="AI Photo Studio" desc="AI-powered product photo enhancement" onClick={function() { navigate('/photo-studio'); }} />
        <MenuItem icon="📦" label="My Orders" badge={ordCount} desc={ordCount + ' total orders'} onClick={function() { navigate('/orders'); }} />
        <MenuItem icon="🗓" label="Subscriptions" desc="Daily, weekly & monthly delivery plans" onClick={function() { navigate('/subscriptions'); }} />
        <MenuItem icon="🤝" label="Group Buys" desc="My active group shopping deals" onClick={function() { navigate('/my-group-deals'); }} />
        <MenuItem icon="❤️" label="Wishlist" badge={wishlist.length} desc={wishlist.length + ' items'} onClick={function() { navigate('/wishlist'); }} />
        <MenuItem icon="🎁" label="Gift Cards" desc="Redeem & send gifts" onClick={function() { navigate('/gift-cards'); }} />
        <MenuItem icon="🤝" label="Affiliate Program" desc="Earn commissions" onClick={function() { navigate('/affiliate'); }} />

        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4 mb-1">Engagement</div>
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
      <div className="mx-3 mt-4 mb-6">
        <div className="flex items-center gap-3 px-3 py-3 bg-card rounded-xl border border-border cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-all" onClick={function() { setShowLogout(true); }}>
          <LogOut size={16} className="text-destructive" />
          <span className="text-xs font-medium text-destructive flex-1">Logout</span>
          <ChevronRight size={14} className="text-destructive/50" />
        </div>
      </div>

      <p className="text-center text-[9px] text-muted-foreground pb-4">🏪 Smart Shop</p>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowEdit(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-bounce-in" onClick={function(e) { e.stopPropagation(); }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md">{initials}</div>
              <h3 className="text-base font-bold mt-2">Edit Profile</h3>
            </div>
            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input className="w-full mt-1 p-3 border border-input rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" value={editName} onChange={function(e) { setEditName(e.target.value); }} placeholder="Your name" /></div>
              <div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input className="w-full mt-1 p-3 border border-input rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" value={editPhone} onChange={function(e) { setEditPhone(e.target.value); }} placeholder="09XXXXXXXX" /></div>
              {tgId && <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Telegram ID</span><span className="font-mono font-semibold">{tgId}</span></div>
                {tgUser && <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Username</span><span className="font-semibold">@{tgUser}</span></div>}
              </div>}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={saveEdit}>💾 Save</button>
              <button className="px-5 py-3 border border-border rounded-xl text-xs" onClick={function() { setShowEdit(false); }}>Cancel</button>
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
              <h3 className="text-sm font-bold">Wallet</h3>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">Br {walletBalance.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Available balance</p>
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={function() { setShowWallet(false); }}>Done</button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={function() { setShowLogout(false); }}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={function(e) { e.stopPropagation(); }}>
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
