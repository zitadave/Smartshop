import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Profile from '@/pages/Profile';
import Checkout from '@/pages/Checkout';
import Confirmation from '@/pages/Confirmation';
import GiftCards from '@/pages/GiftCards';
import Compare from '@/pages/Compare';
import Tracking from '@/pages/Tracking';
import AdminRedirect from '@/pages/AdminRedirect';
import AdminPanel from '@/pages/admin/AdminPanel';

export default function App() {
  const { darkMode, setProducts, setSettings } = useStore();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    // Load initial data
    fetch('/api/products').then(r => r.json()).then(d => {
      if (d?.products) setProducts(d.products);
    }).catch(() => {});

    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d?.settings) setSettings(d.settings);
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderNumber" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation/:orderNumber" element={<Confirmation />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/admin" element={<AdminRedirect />} />
        </Route>
        <Route path="/admin-panel/*" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
