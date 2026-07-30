/* force build */
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { productsApi, settingsApi } from '@/lib/api';
import { initSentry } from '@/lib/sentry';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { getSampleBroadcasts, getSampleFlashDeals } from '@/lib/seed';
import { isRunningInTelegram } from '@/lib/telegram';
import Layout from '@/components/Layout';
import ToastContainer from '@/components/Toast';
import { applyThemeToDocument } from '@/components/features/ThemePicker';

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
const DriverDashboard = lazy(() => import('@/pages/delivery/DriverDashboard'));
const DriverRegister = lazy(() => import('@/pages/delivery/DriverRegister'));
const GroupDealView = lazy(() => import('@/pages/GroupDealView'));
const MyGroupDeals = lazy(() => import('@/pages/MyGroupDeals'));
const PhotoStudio = lazy(() => import('@/pages/PhotoStudio'));
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'));
const SubscriptionShop = lazy(() => import('@/pages/SubscriptionShop'));

const TG = isRunningInTelegram();

function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(function() {
    var tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.BackButton) return;
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
    
    const savedTheme = JSON.parse(localStorage.getItem('ss_theme') || '"default"');
    const savedAccent = JSON.parse(localStorage.getItem('ss_accent') || 'null');
    applyThemeToDocument(savedTheme, savedAccent || undefined);
  } catch(e) {}
}

export default function App() {
  var { darkMode, setProducts, setSettings, settings, products, setProfile } = useStore();

  useEffect(function() { initSentry(); initAnalytics(); }, []);
  useEffect(function() { applySavedTheme(); }, []);
  useEffect(function() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('ss_referrer', ref.trim().toUpperCase());
      console.log(`[REFERRAL] Captured referrer code: ${ref}`);
    }
  }, []);
  useEffect(function() {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Read Telegram data from localStorage (set by index.html script)
  useEffect(function() {
    var tries = 0;
    function read() {
      try {
        var stored = localStorage.getItem('ss_profile');
        if (stored) {
          var parsed = JSON.parse(stored);
          if (parsed.telegramId) {
            setProfile(parsed);
            return;
          }
        }
      } catch(e) {}
      tries++;
      if (tries < 30) setTimeout(read, 100);
    }
    read();
  }, []);

  // Fetch phone from API if we have telegramId but no phone
  useEffect(function() {
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
  }, []);

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

  return (
    <BrowserRouter>
      {TG && <TelegramBackButton />}
      <ToastContainer />
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
          <Route path="/driver" element={<Suspense fallback={<PageLoader />}><DriverDashboard /></Suspense>} />
          <Route path="/driver-register" element={<Suspense fallback={<PageLoader />}><DriverRegister /></Suspense>} />
          <Route path="/group-deal/:token" element={<Suspense fallback={<PageLoader />}><GroupDealView /></Suspense>} />
          <Route path="/my-group-deals" element={<Suspense fallback={<PageLoader />}><MyGroupDeals /></Suspense>} />
          <Route path="/photo-studio" element={<Suspense fallback={<PageLoader />}><PhotoStudio /></Suspense>} />
          <Route path="/subscriptions" element={<Suspense fallback={<PageLoader />}><SubscriptionsPage /></Suspense>} />
          <Route path="/subscription-shop" element={<Suspense fallback={<PageLoader />}><SubscriptionShop /></Suspense>} />
        </Route>
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminRedirect /></Suspense>} />
        <Route path="/admin-panel/*" element={<Suspense fallback={<PageLoader />}><AdminPanel /></Suspense>} />
        <Route path="/vendor/*" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
