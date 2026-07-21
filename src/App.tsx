import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { productsApi, settingsApi } from '@/lib/api';
import { initSentry } from '@/lib/sentry';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { registerSW } from '@/lib/sw';
import { getSampleBroadcasts, getSampleFlashDeals, getSamplePhotoReviews } from '@/lib/seed';
import Layout from '@/components/Layout';

// ===== CODE SPLITTING — Lazy-load rarely-used pages =====
const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Orders = lazy(() => import('@/pages/Orders'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const GiftCards = lazy(() => import('@/pages/GiftCards'));
const Compare = lazy(() => import('@/pages/Compare'));
const Tracking = lazy(() => import('@/pages/Tracking'));
const AdminRedirect = lazy(() => import('@/pages/AdminRedirect'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));
const GameCenter = lazy(() => import('@/pages/GameCenter'));
const Storefront = lazy(() => import('@/pages/Storefront'));
const SavedAddresses = lazy(() => import('@/pages/SavedAddresses'));
const PaymentMethods = lazy(() => import('@/pages/PaymentMethods'));
const HelpSupport = lazy(() => import('@/pages/HelpSupport'));
const AffiliateProducts = lazy(() => import('@/pages/AffiliateProducts'));
const VendorDashboard = lazy(() => import('@/pages/vendor/VendorDashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
      <p className="text-xs text-muted-foreground mt-3">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const { darkMode, setProducts, setSettings, settings, products } = useStore();

  useEffect(() => {
    initSentry();
    initAnalytics();
    registerSW();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Apply theme preset
  useEffect(() => {
    const preset = localStorage.getItem('ss_theme');
    if (preset) {
      const themes: Record<string, { primary: string; accent: string }> = {
        default: { primary: '#6C63FF', accent: '#8B5CF6' },
        ocean: { primary: '#0EA5E9', accent: '#06B6D4' },
        forest: { primary: '#10B981', accent: '#34D399' },
        sunset: { primary: '#F59E0B', accent: '#F97316' },
        midnight: { primary: '#6366F1', accent: '#818CF8' },
        rose: { primary: '#EC4899', accent: '#F43F5E' },
      };
      const theme = themes[preset as keyof typeof themes];
      if (theme) {
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--primary-color', theme.primary);
      }
    }
    const accent = localStorage.getItem('ss_accent');
    if (accent) {
      document.documentElement.style.setProperty('--accent-color', accent);
    }
  }, []);

  // Load initial data and seed sample content
  useEffect(() => {
    productsApi.list().then(d => {
      if (d?.products) {
        setProducts(d.products);
        trackEvent('page_view', { page: 'home', products: d.products.length });
      }
    }).catch(() => {});
    settingsApi.get().then(d => {
      if (d?.settings) {
        const s = d.settings;
        if (!s.broadcastMessages || s.broadcastMessages.length === 0) {
          s.broadcastMessages = getSampleBroadcasts();
        }
        setSettings(s);
      }
    }).catch(() => {});
  }, []);

  // Seed flash deals once products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const hasFlashDeals = settings.flashSales && Object.keys(settings.flashSales).length > 0;
      if (!hasFlashDeals) {
        const productIds = products.slice(0, 5).map(p => p.id);
        const deals = getSampleFlashDeals(productIds);
        setSettings({ ...settings, flashSales: deals });
      }
    }
  }, [products.length]);

  return (
    <BrowserRouter>
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
          <Route path="/tracking" element={<Suspense fallback={<PageLoader />}><Tracking /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminRedirect /></Suspense>} />
          <Route path="/game" element={<Suspense fallback={<PageLoader />}><GameCenter /></Suspense>} />
          <Route path="/store/:vendorId" element={<Suspense fallback={<PageLoader />}><Storefront /></Suspense>} />
          {/* NEW PAGES */}
          <Route path="/addresses" element={<Suspense fallback={<PageLoader />}><SavedAddresses /></Suspense>} />
          <Route path="/payment-methods" element={<Suspense fallback={<PageLoader />}><PaymentMethods /></Suspense>} />
          <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpSupport /></Suspense>} />
          <Route path="/affiliate" element={<Suspense fallback={<PageLoader />}><AffiliateProducts /></Suspense>} />
        </Route>
        {/* Admin & Vendor pages without Layout */}
        <Route path="/admin-panel/*" element={<Suspense fallback={<PageLoader />}><AdminPanel /></Suspense>} />
        <Route path="/vendor/*" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
