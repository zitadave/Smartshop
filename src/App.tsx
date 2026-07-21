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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
      <p className="text-xs text-muted-foreground mt-3">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const { darkMode, setProducts, setSettings, settings, setBroadcastMessages, setFlashDeals, setPhotoReviews, products } = useStore();

  useEffect(() => {
    initSentry();
    initAnalytics();
    registerSW();
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

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
        // Seed sample broadcast messages if none exist
        if (!s.broadcastMessages || s.broadcastMessages.length === 0) {
          const broadcasts = getSampleBroadcasts();
          s.broadcastMessages = broadcasts;
        }
        setSettings(s);
      }
    }).catch(() => {});
  }, []);

  // Seed flash deals once products are loaded and no flash deals exist
  useEffect(() => {
    if (products.length > 0) {
      const hasFlashDeals = settings.flashSales && Object.keys(settings.flashSales).length > 0;
      if (!hasFlashDeals) {
        const productIds = products.slice(0, 5).map(p => p.id);
        const deals = getSampleFlashDeals(productIds);
        const updatedSettings = { ...settings, flashSales: deals };
        setSettings(updatedSettings);
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
        </Route>
        <Route path="/admin-panel/*" element={<Suspense fallback={<PageLoader />}><AdminPanel /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
