import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { productsApi, settingsApi } from '@/lib/api';
import { initSentry } from '@/lib/sentry';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { getSampleBroadcasts, getSampleFlashDeals } from '@/lib/seed';
import { isRunningInTelegram } from '@/lib/telegram';
import Layout from '@/components/Layout';
import ToastContainer from '@/components/Toast';
import { toast } from '@/components/Toast';

const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Orders = lazy(() => import('@/pages/Orders'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const VendorRegister = lazy(() => import('@/pages/VendorRegister'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const GiftCards = lazy(() => import('@/pages/GiftCards'));
const Compare = lazy(() => import('@/pages/Compare'));
const Tracking = lazy(() => import('@/pages/Tracking'));
const AdminRedirect = lazy(() => import('@/pages/AdminRedirect'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));
const Storefront = lazy(() => import('@/pages/Storefront'));
const SavedAddresses = lazy(() => import('@/pages/SavedAddresses'));
const PaymentMethods = lazy(() => import('@/pages/PaymentMethods'));
const HelpSupport = lazy(() => import('@/pages/HelpSupport'));
const AffiliateProducts = lazy(() => import('@/pages/AffiliateProducts'));
const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const PriceAlerts = lazy(() => import('@/pages/PriceAlerts'));
const Loyalty = lazy(() => import('@/pages/Loyalty'));
const Returns = lazy(() => import('@/pages/Returns'));

const TG = isRunningInTelegram();

function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    var tg = window.Telegram?.WebApp;
    if (!tg) return;
    if (location.pathname === '/') tg.BackButton.hide();
    else { tg.BackButton.show(); tg.BackButton.onClick(function() { navigate(-1); }); }
    return function() { try { tg.BackButton.offClick(function() {}); } catch(e) {} };
  }, [location.pathname, navigate]);
  return null;
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
      <p className="text-xs text-muted-foreground mt-3">Loading...</p>
    </div>
  </div>
);

function applySavedTheme() {
  try {
    var dark = JSON.parse(localStorage.getItem('ss_dark') || 'false');
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
}

// =-=-=-=-=-=-= SETUP SCREEN (when Telegram not detected) =-=-=-=-=-=-=
function SetupScreen() {
  var { setProfile } = useStore();
  var [tgId, setTgId] = useState('');
  var [phone, setPhone] = useState('');
  var [username, setUsername] = useState('');
  var [name, setName] = useState('');
  var [checking, setChecking] = useState(true);

  // Poll localStorage for up to 5 seconds hoping Telegram detection kicks in
  useEffect(function() {
    var count = 0;
    function poll() {
      try {
        var p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
        if (p.telegramId) {
          setProfile(p);
          return;
        }
      } catch(e) {}
      count++;
      if (count < 25) setTimeout(poll, 200);
      else setChecking(false);
    }
    poll();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/70">Detecting Telegram...</p>
        </div>
      </div>
    );
  }

  function save() {
    if (!tgId.trim()) { toast('Telegram ID is required', 'error'); return; }
    var profile = {
      telegramId: tgId.trim(),
      telegramUsername: username.trim() || '',
      name: name.trim() || 'User ' + tgId.trim(),
      phone: phone.trim() || '',
      joinedAt: new Date().toISOString(),
      registered: true
    };
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    if (phone.trim()) {
      localStorage.setItem('ss_user_phone', phone.trim());
      localStorage.setItem('ss_phone_shared', 'true');
    }
    setProfile(profile);
    // Save to API
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: tgId.trim(), phone: phone.trim(), username: username.trim() || '', first_name: name.trim() || '' })
    }).catch(function() {});
    toast('✅ Welcome to Smart Shop!', 'success');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🏪</div>
          <h1 className="text-lg font-bold text-slate-900">Welcome to Smart Shop</h1>
          <p className="text-[10px] text-slate-500 mt-1">
            Enter your Telegram details to get started.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Telegram ID *</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" 
              placeholder="e.g. 123456789" value={tgId} onChange={function(e) { setTgId(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" 
              placeholder="e.g. 251912345678" value={phone} onChange={function(e) { setPhone(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" 
              placeholder="@username" value={username} onChange={function(e) { setUsername(e.target.value); }} />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" 
              placeholder="Your name" value={name} onChange={function(e) { setName(e.target.value); }} />
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
            onClick={save}>
            Save & Continue
          </button>
          <p className="text-center text-[8px] text-slate-400 mt-2">
            💡 Find your Telegram ID by messaging <strong>@userinfobot</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// =-=-=-=-=-=-= MAIN APP =-=-=-=-=-=-=
export default function App() {
  var { darkMode, setProducts, setSettings, settings, products, setProfile, profile } = useStore();
  var [ready, setReady] = useState(function() {
    try { var p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); return !!p.telegramId; } catch(e) { return false; }
  }());

  useEffect(function() { initSentry(); initAnalytics(); }, []);
  useEffect(function() { applySavedTheme(); }, []);
  useEffect(function() {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Re-read profile from localStorage whenever profile.telegramId changes
  useEffect(function() {
    try {
      var stored = localStorage.getItem('ss_profile');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed.telegramId) {
          setProfile(parsed);
          setReady(true);
        }
      }
    } catch(e) {}
  }, []);

  // Watch for profile changes
  useEffect(function() {
    if (profile.telegramId) { setReady(true); }
  }, [profile.telegramId]);

  // Fetch phone from API
  useEffect(function() {
    if (!ready) return;
    setTimeout(function() {
      try {
        var stored = localStorage.getItem('ss_profile');
        if (!stored) return;
        var parsed = JSON.parse(stored);
        var tgId = parsed.telegramId || '';
        var existingPhone = parsed.phone || localStorage.getItem('ss_user_phone') || '';
        if (tgId && !existingPhone) {
          fetch('/api/user/contact?telegram_id=' + tgId)
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (d && d.phone) {
                parsed.phone = d.phone;
                localStorage.setItem('ss_profile', JSON.stringify(parsed));
                localStorage.setItem('ss_user_phone', d.phone);
                setProfile(parsed);
              }
            }).catch(function() {});
        } else if (existingPhone && !parsed.phone) {
          parsed.phone = existingPhone;
          localStorage.setItem('ss_profile', JSON.stringify(parsed));
          setProfile(parsed);
        }
      } catch(e) {}
    }, 500);
  }, [ready]);

  useEffect(function() {
    productsApi.list().then(function(d) {
      if (d?.products) { setProducts(d.products); trackEvent('page_view', { page: 'home', products: d.products.length }); }
    }).catch(function() {});
    settingsApi.get().then(function(d) {
      if (d?.settings) {
        var s = d.settings;
        if (!s.broadcastMessages || s.broadcastMessages.length === 0) s.broadcastMessages = getSampleBroadcasts();
        setSettings(s);
      }
    }).catch(function() {});
  }, []);

  if (!ready) {
    return (
      <>
        <ToastContainer />
        <SetupScreen />
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        {TG && <TelegramBackButton />}
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
            <Route path="/shop" element={<Suspense fallback={<PageLoader />}><Shop /></Suspense>} />
            <Route path="/product/:id" element={<Suspense fallback={<PageLoader />}><ProductDetail /></Suspense>} />
            <Route path="/cart" element={<Suspense fallback={<PageLoader />}><Cart /></Suspense>} />
            <Route path="/wishlist" element={<Suspense fallback={<PageLoader />}><Wishlist /></Suspense>} />
            <Route path="/orders" element={<Suspense fallback={<PageLoader />}><Orders /></Suspense>} />
            <Route path="/orders/:orderNumber" element={<Suspense fallback={<PageLoader />}><OrderDetail /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
            <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><Checkout /></Suspense>} />
            <Route path="/confirmation/:orderNumber" element={<Suspense fallback={<PageLoader />}><Confirmation /></Suspense>} />
            <Route path="/gift-cards" element={<Suspense fallback={<PageLoader />}><GiftCards /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<PageLoader />}><Compare /></Suspense>} />
            <Route path="/vendor-register" element={<Suspense fallback={<PageLoader />}><VendorRegister /></Suspense>} />
            <Route path="/tracking" element={<Suspense fallback={<PageLoader />}><Tracking /></Suspense>} />
            <Route path="/store/:vendorId" element={<Suspense fallback={<PageLoader />}><Storefront /></Suspense>} />
            <Route path="/addresses" element={<Suspense fallback={<PageLoader />}><SavedAddresses /></Suspense>} />
            <Route path="/payment-methods" element={<Suspense fallback={<PageLoader />}><PaymentMethods /></Suspense>} />
            <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpSupport /></Suspense>} />
            <Route path="/affiliate" element={<Suspense fallback={<PageLoader />}><AffiliateProducts /></Suspense>} />
            <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><Notifications /></Suspense>} />
            <Route path="/price-alerts" element={<Suspense fallback={<PageLoader />}><PriceAlerts /></Suspense>} />
            <Route path="/loyalty" element={<Suspense fallback={<PageLoader />}><Loyalty /></Suspense>} />
            <Route path="/returns" element={<Suspense fallback={<PageLoader />}><Returns /></Suspense>} />
          </Route>
          <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminRedirect /></Suspense>} />
          <Route path="/admin-panel/*" element={<Suspense fallback={<PageLoader />}><AdminPanel /></Suspense>} />
          <Route path="/vendor/*" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
