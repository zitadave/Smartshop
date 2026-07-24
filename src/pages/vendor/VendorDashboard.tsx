import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { productsApi, ordersApi } from '@/lib/api';
import {
  Store, Package, ShoppingCart, TrendingUp, Settings, LogOut, Menu, X,
  BarChart3, Plus, Edit3, Eye, Save, Tag, DollarSign, Star, ClipboardList,
  Truck, RefreshCw, Camera, Link2, AlertTriangle, Trophy, Download,
  Users, Wallet, Filter, Search, Calendar, ArrowUp, ArrowDown, TrendingDown,
  CheckCircle, Clock, Image, Trash2, Bell, ChevronRight, Activity,
  Globe, MapPin, Phone, Mail, Upload, Printer, FileText, Shield,
  Layers, Sparkles, Target, Zap, Gift, Percent, Box, RotateCcw,
  Heart, Share2, ChevronDown, MessageCircle, Video, ExternalLink
} from 'lucide-react';
import { toast } from '@/components/Toast';
import ProductStudio from '@/components/admin/ProductStudio';

type VendorTab = 'dashboard' | 'products' | 'storefront' | 'analytics' | 'orders' | 'reviews' | 'inventory' | 'payouts' | 'promotions' | 'settings';

export default function VendorDashboard() {
  const [tab, setTab] = useState<VendorTab>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const store = useStore();
  const { products, orders } = store;
  const vendorId = 1;
  const vendorProducts = products.filter(p => p.vendorId === vendorId || !p.vendorId);
  const vendorName = vendorProducts[0]?.vendorName || 'My Store';

  const stats = useMemo(() => {
    const sold = vendorProducts.reduce((s, p) => s + (p.soldCount || 0), 0);
    const revenue = vendorProducts.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
    const lowStock = vendorProducts.filter(p => p.stockCount <= 5);
    const outOfStock = vendorProducts.filter(p => !p.inStock || p.stockCount === 0);
    const avgRating = vendorProducts.length > 0
      ? (vendorProducts.reduce((s, p) => s + (p.rating || 0), 0) / vendorProducts.length).toFixed(1) : '0';
    const totalViews = vendorProducts.reduce((s, p) => s + (p.views || p.soldCount * 5 || Math.round(Math.random() * 100 + 20)), 0);
    const conversion = sold > 0 ? Math.min(99, Math.round((sold / Math.max(totalViews, 1)) * 100)) : 0;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const totalReviews = vendorProducts.reduce((s, p) => s + (p.reviews?.length || 0), 0);
    return { sold, revenue, lowStock, outOfStock, avgRating, totalViews, conversion, productCount: vendorProducts.length, pendingOrders, totalReviews };
  }, [vendorProducts, orders]);

  const [revenueHistory] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      value: Math.round(5000 + Math.random() * 45000 + i * 3000),
    }))
  );

  const [showStudio, setShowStudio] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const openStudio = (product?: any) => { setEditingProduct(product || null); setShowStudio(true); };
  const loadProducts = useCallback(() => {
    productsApi.list().then(d => { if (d?.products) store.setProducts(d.products); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {showStudio && (
        <ProductStudio editProduct={editingProduct} onClose={() => { setShowStudio(false); setEditingProduct(null); }}
          onSaved={() => { loadProducts(); setShowStudio(false); setEditingProduct(null); }} />
      )}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-2">
          <button className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 text-sm">🏪</div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{vendorName}</div>
              <div className="text-[7px] text-slate-400 uppercase tracking-widest font-medium">Vendor Dashboard</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-[9px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {stats.productCount} products
            </span>
            <button className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[10px] font-bold items-center gap-1 hover:shadow-lg transition-all"
              onClick={() => openStudio()}><Plus size={12} /> Add Product</button>
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => navigate('/profile')}>
              <LogOut size={15} className="text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-14 left-0 bottom-0 w-56 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {([
            { id: 'dashboard' as VendorTab, icon: Activity, label: 'Dashboard', badge: stats.pendingOrders },
            { id: 'products' as VendorTab, icon: Package, label: 'Products', badge: stats.outOfStock.length },
            { id: 'storefront' as VendorTab, icon: Store, label: 'Storefront' },
            { id: 'analytics' as VendorTab, icon: TrendingUp, label: 'Analytics' },
            { id: 'orders' as VendorTab, icon: ShoppingCart, label: 'Orders', badge: stats.pendingOrders },
            { id: 'reviews' as VendorTab, icon: Star, label: 'Reviews', badge: stats.totalReviews },
            { id: 'inventory' as VendorTab, icon: Box, label: 'Inventory', badge: stats.lowStock.length },
            { id: 'promotions' as VendorTab, icon: Gift, label: 'Promotions' },
            { id: 'payouts' as VendorTab, icon: Wallet, label: 'Payouts' },
            { id: 'settings' as VendorTab, icon: Settings, label: 'Settings' },
          ] as const).map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button key={item.id} className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group',
                isActive ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              )} onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                <Icon size={15} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={10} className="text-emerald-500" />}
                {item.badge > 0 && (
                  <span className={cn('px-1.5 py-0.5 rounded-full text-[8px] font-bold',
                    item.id === 'inventory' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  )}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => navigate('/profile')}>
            <LogOut size={14} /> Back to Store
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" onClick={() => setMenuOpen(false)} />}

      <main className="lg:ml-56 pt-14 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fadeUp">
          {tab === 'dashboard' && <VendorDashboardView products={vendorProducts} stats={stats} revenueHistory={revenueHistory} onOpenStudio={openStudio} />}
          {tab === 'products' && <VendorProductsView products={vendorProducts} onOpenStudio={openStudio} />}
          {tab === 'storefront' && <VendorStorefrontView vendorName={vendorName} />}
          {tab === 'analytics' && <VendorAnalyticsView products={vendorProducts} stats={stats} revenueHistory={revenueHistory} />}
          {tab === 'orders' && <VendorOrdersView orders={orders} />}
          {tab === 'reviews' && <VendorReviewsView products={vendorProducts} />}
          {tab === 'inventory' && <VendorInventoryView products={vendorProducts} />}
          {tab === 'promotions' && <VendorPromotionsView />}
          {tab === 'payouts' && <VendorPayoutsView stats={stats} />}
          {tab === 'settings' && <VendorSettingsView vendorName={vendorName} />}
        </div>
      </main>
    </div>
  );
}
// ===== DASHBOARD =====
function VendorDashboardView({ products, stats, revenueHistory, onOpenStudio }: { products: any[]; stats: any; revenueHistory: any[]; onOpenStudio: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">📊 Dashboard</h2>
          <p className="text-[10px] text-slate-500">Your store at a glance</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-lg transition-all" onClick={onOpenStudio}><Plus size={13} /> New Product</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', val: stats.productCount, icon: Package, color: 'from-blue-500 to-blue-600', sub: stats.sold + ' sold total', change: '+12%' },
          { label: 'Revenue', val: 'Br ' + stats.revenue.toLocaleString(), icon: DollarSign, color: 'from-emerald-500 to-green-600', sub: stats.sold + ' items sold', change: '+18%' },
          { label: 'Avg Rating', val: stats.avgRating, icon: Star, color: 'from-amber-500 to-orange-600', sub: stats.totalReviews + ' reviews', change: stats.avgRating > '4' ? '+5%' : '+2%' },
          { label: 'Conversion Rate', val: stats.conversion + '%', icon: TrendingUp, color: 'from-purple-500 to-violet-600', sub: stats.totalViews + ' views', change: '+8%' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
              <div className="flex items-start justify-between">
                <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg', s.color)}><Icon size={16} className="text-white" /></div>
                <span className="text-[9px] text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">{s.change}</span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.sub}</div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5 font-semibold">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">📈 Revenue Trend</h3>
          <span className="text-[9px] text-emerald-600 font-semibold">+18% vs last year</span>
        </div>
        <div className="h-32 flex items-end gap-1.5">
          {revenueHistory.map((d, i) => {
            const max = Math.max(...revenueHistory.map(r => r.value));
            const h = (d.value / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute -top-5 text-[7px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-slate-800 px-1 rounded shadow-sm z-10">Br {d.value.toLocaleString()}</div>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 group-hover:opacity-80 transition-all cursor-pointer" style={{ height: h + '%', minHeight: h > 0 ? '4px' : '0' }} />
                <span className="text-[7px] text-slate-400 mt-0.5">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
            <AlertTriangle size={15} className="text-amber-500" /> Low Stock ({stats.lowStock.length})
          </h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">✅ All products well stocked!</p>
          ) : (
            <div className="space-y-1.5">
              {stats.lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate text-slate-800 dark:text-slate-200">{p.nameEn}</div>
                    <div className="text-[8px] text-slate-400">{formatPrice(p.price)}</div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-lg text-[8px] font-bold', p.stockCount === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                    {p.stockCount === 0 ? 'OUT' : p.stockCount + ' left'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
            <Zap size={15} className="text-indigo-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Plus, label: 'Add Product', color: 'from-emerald-500 to-green-600', onClick: onOpenStudio },
              { icon: Package, label: 'Manage Stock', color: 'from-blue-500 to-blue-600', onClick: () => {} },
              { icon: TrendingUp, label: 'View Sales', color: 'from-purple-500 to-violet-600', onClick: () => {} },
              { icon: Download, label: 'Export Data', color: 'from-amber-500 to-orange-600', onClick: () => toast('📊 Export coming soon!', 'info') },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-all text-xs font-medium text-slate-700 dark:text-slate-300" onClick={item.onClick}>
                  <div className={cn('p-1.5 rounded-lg bg-gradient-to-br', item.color)}><Icon size={13} className="text-white" /></div>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== PRODUCTS =====
function VendorProductsView({ products, onOpenStudio }: { products: any[]; onOpenStudio: (product?: any) => void }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'sold'>('name');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  const filtered = products.filter(p => {
    if (search && !p.nameEn?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === 'in-stock') return p.stockCount > 5;
    if (filterStatus === 'low-stock') return p.stockCount > 0 && p.stockCount <= 5;
    if (filterStatus === 'out-of-stock') return !p.inStock || p.stockCount === 0;
    return true;
  }).sort((a, b) => sortBy === 'price' ? a.price - b.price : sortBy === 'stock' ? a.stockCount - b.stockCount : sortBy === 'sold' ? (b.soldCount || 0) - (a.soldCount || 0) : a.nameEn?.localeCompare(b.nameEn));

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">📦 Products ({products.length})</h2>
          <p className="text-[10px] text-slate-500">{products.filter(p => p.inStock !== false).length} active · {products.filter(p => !p.inStock || p.stockCount === 0).length} out of stock</p>
        </div>
        <button className="px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg transition-all" onClick={() => onOpenStudio()}><Plus size={12} /> Studio Pro</button>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="name">Name</option><option value="price">Price</option><option value="stock">Stock</option><option value="sold">Sold</option>
        </select>
        <select className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="all">All</option><option value="in-stock">In Stock</option><option value="low-stock">Low Stock</option><option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No products found</p>
          <p className="text-[10px] text-slate-400 mt-1">Add your first product to start selling</p>
          <button className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold" onClick={() => onOpenStudio()}><Plus size={12} className="inline mr-1" /> Add Product</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative aspect-square bg-slate-50 dark:bg-slate-800">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 flex gap-1">
                  {p.badge && <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white">{p.badge}</span>}
                  {p.stockCount <= 5 && p.stockCount > 0 && <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-amber-500 text-white">{p.stockCount} left</span>}
                  {p.stockCount === 0 && <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-red-500 text-white">Out of Stock</span>}
                </div>
                {p.visible !== false && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white" onClick={async () => { await productsApi.update(p.id, { visible: !p.visible }); toast('✅ Updated!', 'success'); }} title="Hide"><Eye size={12} /></button>
                    <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white" onClick={() => onOpenStudio(p)} title="Edit"><Edit3 size={12} /></button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{p.nameEn}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 capitalize">{p.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-emerald-600">{formatPrice(p.price)}</div>
                    {p.originalPrice && <div className="text-[8px] text-slate-400 line-through">{formatPrice(p.originalPrice)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[8px] text-slate-400">
                  <span className={cn('flex items-center gap-0.5', p.stockCount > 10 ? 'text-green-600' : 'text-amber-600')}><Box size={10} /> {p.stockCount} in stock</span>
                  <span>·</span>
                  <span>{p.soldCount || 0} sold</span>
                  <span>·</span>
                  <span className="text-amber-500">{'★'.repeat(Math.round(p.rating || 0))}{'☆'.repeat(5 - Math.round(p.rating || 0))}</span>
                </div>
                {p.sku && <div className="text-[7px] text-slate-400 font-mono mt-1">SKU: {p.sku}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== STOREFRONT =====
function VendorStorefrontView({ vendorName }: { vendorName: string }) {
  const [data, setData] = useState({
    name: vendorName, tagline: 'Quality Products, Best Prices',
    description: 'Welcome to our store! We offer quality products at affordable prices with fast delivery across Ethiopia.',
    email: 'vendor@mystore.com', phone: '+251-911-XXXXXX',
    address: 'Addis Ababa, Ethiopia', website: '',
    facebook: '', instagram: '', twitter: '', youtube: '',
    banner: '', logo: '',
  });
  const save = () => { localStorage.setItem('ss_vendor_store', JSON.stringify(data)); toast('✅ Storefront saved!', 'success'); };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🏪 Storefront</h2>
      <p className="text-[10px] text-slate-500">Customize how your store appears to customers</p>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className={cn('h-32 bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center', data.banner && 'bg-none')}
          style={data.banner ? { backgroundImage: 'url(' + data.banner + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          {!data.banner && <Camera size={24} className="text-white/50" />}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4 -mt-12">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-slate-800 flex-shrink-0">
              {data.logo ? <img src={data.logo} className="w-full h-full rounded-xl object-cover" /> : '🏪'}
            </div>
            <div className="pt-8">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{data.name}</h3>
              <p className="text-[9px] text-slate-400">{data.tagline}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.name} onChange={e => setData(s => ({ ...s, name: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tagline</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.tagline} onChange={e => setData(s => ({ ...s, tagline: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description</label><textarea className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-16 text-slate-800 dark:text-slate-200" value={data.description} onChange={e => setData(s => ({ ...s, description: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider"><Mail size={10} className="inline" /> Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.email} onChange={e => setData(s => ({ ...s, email: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider"><Phone size={10} className="inline" /> Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.phone} onChange={e => setData(s => ({ ...s, phone: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider"><MapPin size={10} className="inline" /> Address</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.address} onChange={e => setData(s => ({ ...s, address: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider"><Globe size={10} className="inline" /> Website</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={data.website} onChange={e => setData(s => ({ ...s, website: e.target.value }))} /></div>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 mt-4 mb-2 flex items-center gap-2"><Share2 size={12} /> Social Links</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {[{ icon: Globe, label: "facebook", color: "text-blue-600", placeholder: "Facebook URL" }, { icon: Camera, label: "instagram", color: "text-pink-600", placeholder: "Instagram URL" }, { icon: MessageCircle, label: "twitter", color: "text-sky-500", placeholder: "Twitter URL" }, { icon: Video, label: "youtube", color: "text-red-600", placeholder: "YouTube URL" }].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <Icon size={14} className={s.color} />
                  <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent text-slate-800 dark:text-slate-200" placeholder={s.placeholder} value={(data as any)[s.label]} onChange={e => setData(d => ({ ...d, [s.label]: e.target.value }))} />
                </div>
              );
            })}
          </div>
          <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={save}><Save size={13} className="inline mr-1" /> Save Storefront</button>
        </div>
      </div>
    </div>
  );
}

// ===== ANALYTICS =====
function VendorAnalyticsView({ products, stats, revenueHistory }: { products: any[]; stats: any; revenueHistory: any[] }) {
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);
  const maxSold = topProducts[0]?.soldCount || 1;
  const catData = useMemo(() => {
    const cats: Record<string, { count: number; revenue: number }> = {};
    products.forEach(p => {
      const cat = p.category || 'other';
      if (!cats[cat]) cats[cat] = { count: 0, revenue: 0 };
      cats[cat].count++;
      cats[cat].revenue += (p.soldCount || 0) * p.price;
    });
    return Object.entries(cats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [products]);
  const totalCatRevenue = catData.reduce((s, [, c]) => s + c.revenue, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">📈 Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', val: 'Br ' + stats.revenue.toLocaleString(), icon: DollarSign, change: '+15%', color: 'text-emerald-600' },
          { label: 'Items Sold', val: stats.sold, icon: ShoppingCart, change: '+8%', color: 'text-blue-600' },
          { label: 'Avg Order', val: formatPrice(stats.sold > 0 ? Math.round(stats.revenue / stats.sold) : 0), icon: Tag, change: '+3%', color: 'text-amber-600' },
          { label: 'Conversion', val: stats.conversion + '%', icon: TrendingUp, change: '+2.1%', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
            <div className="flex items-start justify-between mb-1">
              <s.icon size={16} className="text-slate-400" />
              <span className="text-[9px] text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">{s.change}</span>
            </div>
            <div className={cn('text-lg font-bold mt-1 text-slate-900 dark:text-white', s.color)}>{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Revenue Over Time</h3>
          <div className="h-28 flex items-end gap-1">
            {revenueHistory.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:opacity-80 transition-all cursor-pointer"
                  style={{ height: (d.value / Math.max(...revenueHistory.map(r => r.value))) * 100 + '%', minHeight: d.value > 0 ? '4px' : '0' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">📊 Category Breakdown</h3>
          <div className="space-y-2">
            {catData.map(([cat, d]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-[10px] font-medium capitalize w-20 text-slate-700 dark:text-slate-300">{cat}</span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: (d.revenue / Math.max(totalCatRevenue, 1)) * 100 + '%' }} />
                </div>
                <span className="text-[9px] text-slate-500 w-16 text-right">{formatPrice(d.revenue)}</span>
                <span className="text-[8px] text-slate-400 w-8 text-right">{d.count}</span>
              </div>
            ))}
            {catData.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data yet</p>}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><Trophy size={14} className="text-amber-500" /> Top Selling Products</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold', i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400')}>{i + 1}</span>
              <img src={p.image} className="w-8 h-8 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate text-slate-800 dark:text-slate-200">{p.nameEn}</div>
                <div className="text-[8px] text-slate-400">{p.soldCount || 0} sold · {formatPrice(p.price)}</div>
              </div>
              <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: ((p.soldCount || 0) / Math.max(maxSold, 1)) * 100 + '%' }} />
              </div>
              <span className="text-[9px] font-semibold text-emerald-600 w-16 text-right">{formatPrice((p.soldCount || 0) * p.price)}</span>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No sales data yet</p>}
        </div>
      </div>
    </div>
  );
}

// ===== ORDERS =====
function VendorOrdersView({ orders }: { orders: any[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">📋 Orders ({orders.length})</h2>
          <p className="text-[10px] text-slate-500">{orders.filter(o => o.status === 'pending').length} pending · {orders.filter(o => o.status === 'shipped').length} shipped</p>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-medium whitespace-nowrap border transition-all flex-shrink-0',
              statusFilter === s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
            )} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <ShoppingCart size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No orders found</p>
          <p className="text-[10px] text-slate-400 mt-1">Orders appear when customers purchase your products</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map(o => (
            <div key={o.orderNumber} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', o.status === 'completed' ? 'bg-green-100' : o.status === 'shipped' ? 'bg-blue-100' : 'bg-amber-100')}>
                    <ShoppingCart size={15} className={cn(o.status === 'completed' ? 'text-green-600' : o.status === 'shipped' ? 'text-blue-600' : 'text-amber-600')} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-mono text-indigo-600 truncate">{o.orderNumber}</div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5"><span>{o.customer?.name || 'Guest'}</span><span>·</span><span>{o.date}</span></div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatPrice(o.total || 0)}</div>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded-lg font-semibold', o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : o.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>{o.status}</span>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 mt-2 ml-12 truncate">{o.items?.map((it: any) => it.name + ' ×' + it.quantity).join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== REVIEWS =====
function VendorReviewsView({ products }: { products: any[] }) {
  const allReviews = useMemo(() => {
    const r: any[] = [];
    products.forEach(p => { if (p.reviews?.length) p.reviews.forEach((rev: any) => r.push({ ...rev, productName: p.nameEn, productImage: p.image })); });
    return r.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [products]);
  const avgRating = products.length > 0 ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0';

  return (
    <div className="animate-fadeUp space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">⭐ Reviews ({allReviews.length})</h2><p className="text-[10px] text-slate-500">What customers are saying about your products</p></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{avgRating}</div>
            <div className="text-amber-500 text-sm">{'★'.repeat(5)}</div>
            <div className="text-[9px] text-slate-400">{allReviews.length} reviews</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = allReviews.filter(r => Math.round(r.rating) === star).length;
              const pct = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[9px]">
                  <span className="text-amber-500 w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: pct + '%' }} /></div>
                  <span className="text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {allReviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <Star size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No reviews yet</p>
          <p className="text-[10px] text-slate-400 mt-1">Reviews appear when customers rate your products</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allReviews.slice(0, 20).map((r, i) => (
            <div key={r.id || i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{r.userName?.charAt(0) || '?'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.userName || 'Anonymous'}</span>
                    <span className="text-[9px] text-amber-500">{'★'.repeat(r.rating || 5)}</span>
                    <span className="text-[8px] text-slate-400">{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                    {r.verified && <span className="text-[8px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-semibold">Verified</span>}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{r.text || r.comment || 'Great product!'}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[8px] text-slate-400">
                    <img src={r.productImage} className="w-5 h-5 rounded object-cover" />
                    <span>{r.productName}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== INVENTORY =====
function VendorInventoryView({ products }: { products: any[] }) {
  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);
  const outOfStock = products.filter(p => !p.inStock || p.stockCount === 0);
  const wellStocked = products.filter(p => p.stockCount > 5);

  return (
    <div className="animate-fadeUp space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">📦 Inventory</h2><p className="text-[10px] text-slate-500">{wellStocked.length} well stocked · {lowStock.length} low · {outOfStock.length} out of stock</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Well Stocked', count: wellStocked.length, text: 'text-emerald-600' },
          { label: 'Low Stock', count: lowStock.length, text: 'text-amber-600' },
          { label: 'Out of Stock', count: outOfStock.length, text: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <div className={cn('text-2xl font-extrabold', s.text)}>{s.count}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-4">
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-3"><AlertTriangle size={15} /> Low Stock Alert — {lowStock.length} products need restocking</h3>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 rounded-xl p-3">
                <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 truncate">{p.nameEn}</div>
                  <div className="text-[8px] text-amber-600">SKU: {p.sku || 'N/A'} · {formatPrice(p.price)}</div>
                </div>
                <span className="font-bold text-amber-700 text-lg">{p.stockCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800"><h3 className="text-sm font-bold text-slate-900 dark:text-white">All Products ({products.length})</h3></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate text-slate-800 dark:text-slate-200">{p.nameEn}</div>
                <div className="text-[8px] text-slate-400">SKU: {p.sku || 'N/A'} · {p.soldCount || 0} sold</div>
              </div>
              <div className={cn('px-2 py-1 rounded-lg text-[9px] font-bold text-center min-w-[40px]', p.stockCount > 10 ? 'bg-green-100 text-green-700' : p.stockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>{p.stockCount}</div>
              <div className="w-20"><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', p.stockCount > 10 ? 'bg-green-500' : p.stockCount > 0 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: Math.min(100, (p.stockCount / 50) * 100) + '%' }} /></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== PAYOUTS =====
function VendorPayoutsView({ stats }: { stats: any }) {
  const [payouts, setPayouts] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('ss_vendor_payouts') || '[]'); } catch { return []; } });
  const totalEarned = stats.revenue;
  const commission = Math.round(totalEarned * 0.1);
  const netEarned = totalEarned - commission;
  const paidOut = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = netEarned - paidOut;
  const requestPayout = () => {
    const p = { id: generateId(), amount: Math.max(0, pending), status: 'pending', requestedAt: new Date().toISOString(), method: 'Telebirr' };
    const updated = [p, ...payouts];
    localStorage.setItem('ss_vendor_payouts', JSON.stringify(updated));
    setPayouts(updated);
    toast('✅ Payout requested!', 'success');
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Wallet size={20} className="text-emerald-500" /> Payouts</h2><p className="text-[10px] text-slate-500">Track your earnings and request withdrawals</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', val: formatPrice(totalEarned), icon: DollarSign, color: 'from-blue-500 to-blue-600' },
          { label: 'Platform Fee (10%)', val: formatPrice(commission), icon: TrendingDown, color: 'from-amber-500 to-orange-600' },
          { label: 'Net Earnings', val: formatPrice(netEarned), icon: Wallet, color: 'from-emerald-500 to-green-600' },
          { label: 'Available', val: formatPrice(Math.max(0, pending)), icon: Clock, color: 'from-purple-500 to-violet-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
              <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}><Icon size={16} className="text-white" /></div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Request Withdrawal</h3>
            <p className="text-xs text-slate-500 mt-0.5">Available: <strong className="text-emerald-600 text-sm">{formatPrice(Math.max(0, pending))}</strong><span className="text-slate-400 mx-2">·</span>Paid out: <strong>{formatPrice(paidOut)}</strong></p>
            <p className="text-[9px] text-slate-400 mt-0.5">Withdrawals processed via Telebirr within 1-3 business days</p>
          </div>
          <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5" onClick={requestPayout} disabled={pending <= 0}><Wallet size={14} /> Request Payout</button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Payout History ({payouts.length})</h3></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {payouts.length === 0 ? <p className="text-center py-6 text-xs text-slate-400">No payout history yet</p> : payouts.slice(0, 15).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', p.status === 'paid' ? 'bg-green-100' : 'bg-amber-100')}>
                {p.status === 'paid' ? <CheckCircle size={15} className="text-green-600" /> : <Clock size={15} className="text-amber-600" />}
              </div>
              <div className="flex-1"><div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{formatPrice(p.amount)}</div><div className="text-[8px] text-slate-400">{new Date(p.requestedAt).toLocaleDateString()} · {p.method}</div></div>
              <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{p.status === 'paid' ? 'Paid' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== SETTINGS =====
// ===== PROMOTIONS =====
function VendorPromotionsView() {
  const [tab, setTab] = useState<"request" | "active" | "slots">("request");
  const store = useStore();
  const { products } = store;
  const vendorProducts = products.filter(p => p.vendorId === 1 || !p.vendorId);
  const [promos, setPromos] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("ss_promotions_data") || "{\"requests\":[]}").requests || []; }
    catch { return []; }
  });
  const vendorPromos = promos.filter(p => p.vendorId === 1);
  const [slots, setSlots] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("ss_promotions_data") || "{\"slots\":[]}").slots || []; }
    catch { return []; }
  });
  // Modal state for promotion request
  const [showModal, setShowModal] = useState(false);
  const [reqType, setReqType] = useState<"discount" | "flashdeal" | "bogo">("discount");
  const [selProduct, setSelProduct] = useState("");
  const [selDiscount, setSelDiscount] = useState("20");

  const openRequestModal = (type: "discount" | "flashdeal" | "bogo") => {
    setReqType(type);
    setSelProduct("");
    setSelDiscount("20");
    setShowModal(true);
  };

  const submitRequest = () => {
    if (!selProduct) { toast("❌ Please select a product", "error"); return; }
    const product = vendorProducts.find(p => String(p.id) === selProduct);
    if (!product) { toast("❌ Product not found", "error"); return; }
    const pct = Number(selDiscount);
    if (pct <= 0 || pct > 100) { toast("❌ Invalid discount percentage", "error"); return; }
    const start = new Date();
    const end = new Date(Date.now() + 7 * 86400000);
    const req = {
      id: "req-" + Date.now(), vendorId: 1, vendorName: "My Store",
      productId: product.id, productName: product.nameEn,
      type: reqType, discountPercent: pct, originalPrice: product.price,
      startDate: start.toISOString(), endDate: end.toISOString(),
      status: "pending", submittedAt: new Date().toISOString(),
    };
    const updated = [...promos, req];
    const allData = { requests: updated, priceFloors: [], slots };
    localStorage.setItem("ss_promotions_data", JSON.stringify(allData));
    setPromos(updated);
    setShowModal(false);
    toast("✅ Promotion request submitted! Admin will review.", "success");
  };

  const buySlot = (slot: any) => {
    if (!confirm("Purchase " + slot.name + " for Br " + slot.price + "?")) return;
    const req = {
      id: "slot-req-" + Date.now(), vendorId: 1, vendorName: "My Store",
      productId: 0, productName: "Featured Slot: " + slot.name,
      type: "discount", discountPercent: 0, originalPrice: 0,
      startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "pending", submittedAt: new Date().toISOString(),
      featuredSlot: true, slotFee: slot.price,
    };
    const updated = [...promos, req];
    const allData = { requests: updated, priceFloors: [], slots };
    localStorage.setItem("ss_promotions_data", JSON.stringify(allData));
    setPromos(updated);
    toast("✅ Slot purchase request submitted!", "success");
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">🎯 Promotions</h2>
      <p className="text-[10px] text-slate-500">Create promotions to boost your sales. Commission is always on original price.</p></div>

      <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 w-fit">
        {[["request","✍️ Request"],["active","✅ Active"],["slots","💎 Slots"]].map(([t, l]) => (
          <button key={t} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all", tab === t ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500")}
            onClick={() => setTab(t as any)}>{l}</button>
        ))}
      </div>

      {tab === "request" && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { type: "discount" as const, title: "🏷️ Discount Sale", desc: "Offer % off on a product. Runs for 7 days.", color: "from-blue-500 to-blue-600" },
            { type: "flashdeal" as const, title: "⚡ Flash Deal", desc: "Time-limited deep discount. Creates urgency!", color: "from-orange-500 to-red-500" },
            { type: "bogo" as const, title: "🎁 Buy One Get One", desc: "Buy one, get one free or at a discount.", color: "from-purple-500 to-violet-600" },
          ].map(s => (
            <button key={s.type} className={cn("bg-gradient-to-br rounded-2xl p-4 text-white text-left hover:shadow-lg transition-all", s.color)}
              onClick={() => openRequestModal(s.type)}>
              <div className="text-lg font-bold mb-1">{s.title}</div>
              <p className="text-[9px] opacity-80">{s.desc}</p>
              <div className="mt-2 text-[8px] opacity-60">Commission based on original price</div>
            </button>
          ))}
        </div>
      )}

      {tab === "active" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Promotions ({vendorPromos.length})</h3></div>
          {vendorPromos.length === 0 ? <p className="text-center py-8 text-xs text-slate-400">No promotions yet. Create one above!</p> :
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...vendorPromos].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map((p, i) => (
                <div key={p.id || i} className="p-3 flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs",
                    p.type === "flashdeal" ? "bg-orange-500" : p.type === "bogo" ? "bg-purple-500" : "bg-blue-500")}>{p.type === "bogo" ? "🎁" : p.type === "flashdeal" ? "⚡" : "🏷️"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate text-slate-800 dark:text-slate-200">{p.productName}</div>
                    <div className="text-[8px] text-slate-400">-{p.discountPercent}% · Original: {formatPrice(p.originalPrice)}</div>
                  </div>
                  <span className={cn("text-[9px] px-2 py-0.5 rounded font-semibold",
                    p.status === "approved" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")}>{p.status}</span>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {tab === "slots" && (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-500">Purchase featured promotion slots for extra visibility across the marketplace.</p>
          {slots.filter(s => s.active).map(slot => (
            <div key={slot.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><DollarSign size={18} className="text-purple-600" /></div>
                  <div><h4 className="text-xs font-bold text-slate-900 dark:text-white">{slot.name}</h4><p className="text-[9px] text-slate-400">{slot.duration}</p></div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-lg font-bold text-emerald-600">Br {slot.price.toLocaleString()}</div>
                  <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg text-[9px] font-bold hover:shadow-md"
                    onClick={() => buySlot(slot)}>Purchase</button>
                </div>
              </div>
            </div>
          ))}
          {slots.filter(s => s.active).length === 0 && <p className="text-center py-6 text-xs text-slate-400">No slots available right now</p>}
        </div>
      )}
      {/* Promotion Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {reqType === 'discount' ? '🏷️ Discount Sale' : reqType === 'flashdeal' ? '⚡ Flash Deal' : '🎁 BOGO'} — Select Product
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Product</label>
                <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={selProduct} onChange={e => setSelProduct(e.target.value)}>
                  <option value="">Select a product...</option>
                  {vendorProducts.map(p => (
                    <option key={p.id} value={String(p.id)}>{p.nameEn} — {formatPrice(p.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Discount %</label>
                <input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" min={1} max={100} value={selDiscount} onChange={e => setSelDiscount(e.target.value)} />
              </div>
              {selProduct && (() => {
                const prod = vendorProducts.find(p => String(p.id) === selProduct);
                if (!prod) return null;
                const salePrice = Math.round(prod.price * (1 - Number(selDiscount) / 100));
                const commission = Math.round(prod.price * 0.1);
                return (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-[9px]"><span className="text-slate-500">Original price</span><span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(prod.price)}</span></div>
                    <div className="flex justify-between text-[9px]"><span className="text-slate-500">Sale price</span><span className="font-semibold text-emerald-600">{formatPrice(salePrice)}</span></div>
                    <div className="flex justify-between text-[9px]"><span className="text-slate-500">Your commission (10% of original)</span><span className="font-semibold text-blue-600">{formatPrice(commission)}</span></div>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-50" onClick={submitRequest} disabled={!selProduct || !selDiscount}>Submit Request</button>
              <button className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function VendorSettingsView({ vendorName }: { vendorName: string }) {
  const [name, setName] = useState(vendorName);
  const [email, setEmail] = useState('vendor@mystore.com');
  const [phone, setPhone] = useState('+251-911-XXXXXX');
  const [bio, setBio] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoRestock, setAutoRestock] = useState(false);

  return (
    <div className="animate-fadeUp space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">⚙️ Settings</h2><p className="text-[10px] text-slate-500">Manage your account and preferences</p></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Store Profile</h3>
          <div className="space-y-3">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-200" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Bio</label><textarea className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-16 text-slate-800 dark:text-slate-200" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell customers about your store" /></div>
            <button className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={() => { const s = {name,email,phone,bio,notifications,autoRestock}; localStorage.setItem('ss_vendor_settings', JSON.stringify(s)); toast('✅ Settings saved!', 'success'); }}><Save size={12} className="inline mr-1" /> Save Changes</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><Bell size={14} className="text-blue-500" /> Notifications</h3>
            <label className="flex items-center gap-2 text-xs mb-2 text-slate-700 dark:text-slate-300"><input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="rounded" /> Email for new orders</label>
            <label className="flex items-center gap-2 text-xs mb-2 text-slate-700 dark:text-slate-300"><input type="checkbox" checked={autoRestock} onChange={e => setAutoRestock(e.target.checked)} className="rounded" /> Auto-restock alerts</label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><input type="checkbox" defaultChecked className="rounded" /> Low stock warnings</label>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-900 dark:text-white"><Percent size={14} className="text-emerald-500" /> Commission</h3>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Platform fee per sale</span><span className="text-lg font-bold text-emerald-600">10%</span></div>
            <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2.5 text-[9px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle size={10} /> Your store is active and visible</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-4 overflow-x-hidden">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-red-600"><AlertTriangle size={14} /> Danger Zone</h3>
            <p className="text-[9px] text-slate-500 mb-3">Temporarily disable your store from appearing in search results</p>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-[10px] font-semibold hover:bg-red-50 transition-colors" onClick={() => toast('⚠️ Store visibility toggled', 'warning')}><EyeOff size={12} className="inline mr-1" /> Pause Storefront</button>
          </div>
        </div>
      </div>
    </div>
  );
}
