import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, ordersApi, analyticsApi, vendorsApi, settingsApi } from '@/lib/api';
import { formatPrice, cn, generateId, formatCountdown, isFlashDealActive, formatTimeRemaining } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Settings as SettingsIcon,
  TrendingUp, Users, MessageSquare, BarChart3, Shield, LogOut, Menu, X,
  Bell, Rocket, Tags, Scale, Calendar, ClipboardList, ChevronRight,
  Camera, Megaphone, Clock, Globe, Palette, MapPin, FileText, Zap,
  Search, Plus, Edit3, Trash2, Eye, EyeOff, Check, Loader, ChevronDown,
  DollarSign, Star, Activity, AlertTriangle, Sun, Moon, Gift, CreditCard
} from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings';

// =============================================
// PREMIUM ADMIN PANEL — Smart Shop Management
// =============================================

export default function AdminLayout() {
  const [tab, setTab] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const NAV_ITEMS: { id: Tab; icon: any; label: string; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'vendors', icon: Store, label: 'Vendors' },
    { id: 'marketplace', icon: Rocket, label: 'Marketplace' },
    { id: 'reviews', icon: Camera, label: 'Reviews' },
    { id: 'broadcast', icon: Megaphone, label: 'Broadcast' },
    { id: 'flashdeals', icon: Zap, label: 'Flash Deals' },
    { id: 'preorders', icon: Clock, label: 'Pre-Orders' },
    { id: 'tracking', icon: MapPin, label: 'Tracking' },
    { id: 'themes', icon: Palette, label: 'Themes' },
    { id: 'coupons', icon: Tags, label: 'Coupons' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const TabContent = useMemo(() => {
    switch (tab) {
      case 'overview': return <Overview />;
      case 'products': return <AdminProducts />;
      case 'orders': return <AdminOrders />;
      case 'vendors': return <AdminVendors />;
      case 'marketplace': return <AdminMarketplace />;
      case 'reviews': return <AdminReviews />;
      case 'broadcast': return <AdminBroadcast />;
      case 'flashdeals': return <AdminFlashDeals />;
      case 'preorders': return <AdminPreOrders />;
      case 'tracking': return <AdminTracking />;
      case 'themes': return <AdminThemes />;
      case 'coupons': return <AdminCoupons />;
      case 'settings': return <AdminSettings />;
      default: return <Overview />;
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Premium Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-3">
          <button className="xl:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
              <Rocket size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Admin Panel</h1>
              <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-medium">Smart Shop Management</p>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              placeholder="Search products, orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" onClick={() => window.open('/', '_blank')}>
              <Eye size={16} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <Activity size={12} className="text-indigo-500" />
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 capitalize">{tab}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Sidebar */}
      <aside className={`fixed top-14 left-0 bottom-0 w-60 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 overflow-y-auto`}>
        <div className="py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button key={item.id}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                )}
                onClick={() => { setTab(item.id); setMenuOpen(false); }}
              >
                <div className={cn('p-1.5 rounded-lg transition-all', isActive ? 'bg-indigo-500/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800')}>
                  <Icon size={15} className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')} />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight size={12} className={cn('opacity-0 -ml-2 transition-all', isActive && 'opacity-100 ml-0')} />
              </button>
            );
          })}
        </div>

        {/* Bottom quick actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            <LogOut size={14} />
            <span>Back to Store</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && <div className="fixed inset-0 bg-black/40 z-30 xl:hidden backdrop-blur-sm" onClick={() => setMenuOpen(false)} />}

      {/* Main Content Area */}
      <main className="xl:ml-60 pt-14 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fadeUp">
          {TabContent}
        </div>
      </main>
    </div>
  );
}

// =============================================
// 1. OVERVIEW — Premium Dashboard
// =============================================
function Overview() {
  const [data, setData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [animate, setAnimate] = useState(false);
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setAnimate(true);
    analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
  }, []);

  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);
  const outOfStock = products.filter(p => !p.inStock);
  const totalRevenue = data.totalRevenue || 1234567;
  const totalOrders = data.totalOrders || 456;
  const totalProducts = data.totalProducts || products.length;

  const stats = [
    { label: 'Total Products', val: totalProducts, sub: `${data.totalSold || 234} sold`, icon: Package, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Revenue', val: `Br ${totalRevenue.toLocaleString()}`, sub: `${totalOrders} orders`, icon: DollarSign, color: 'green', gradient: 'from-emerald-500 to-green-600' },
    { label: 'Active Orders', val: data.pendingOrders || 12, sub: `${data.shippedOrders || 8} shipping`, icon: ShoppingCart, color: 'orange', gradient: 'from-orange-500 to-amber-600' },
    { label: 'Low Stock Items', val: lowStock.length, sub: `${outOfStock.length} out of stock`, icon: AlertTriangle, color: 'red', gradient: 'from-red-500 to-rose-600' },
  ];

  // Mini sparkline data (simulated)
  const sparkData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  const maxSpark = Math.max(...sparkData);

  return (
    <div className={`space-y-5 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            👋 Welcome back, Admin
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Here's what's happening with your store today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[9px] bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            All Systems Normal
          </span>
        </div>
      </div>

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn('p-2.5 rounded-xl bg-gradient-to-br', s.gradient, 'shadow-lg')}>
                  <Icon size={16} className="text-white" />
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((_, j) => (
                    <div key={j} className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" style={{ opacity: animate ? 1 : 0, transitionDelay: `${i * 100 + j * 100}ms` }} />
                  ))}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {s.val}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.sub}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">{s.label}</div>

              {/* Sparkline mini chart */}
              <div className="absolute bottom-0 right-0 opacity-10">
                <svg width="80" height="30" viewBox="0 0 80 30" className="text-slate-900 dark:text-white">
                  <path d={sparkData.map((v, j) => `${j === 0 ? 'M' : 'L'}${(j / sparkData.length) * 80} ${30 - (v / maxSpark) * 25}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Low Stock Alert
            </h3>
            <span className="text-[9px] text-slate-400 font-medium">{lowStock.length} products</span>
          </div>
          <div className="p-1">
            {lowStock.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <Check size={24} className="mx-auto mb-2 text-green-500" />
                All products are well-stocked!
              </div>
            ) : (
              lowStock.slice(0, 5).map((p, i) => (
                <div key={p.id} className={cn('flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  i < lowStock.length - 1 && 'border-b border-slate-100 dark:border-slate-800'
                )}>
                  <img src={p.image} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{p.nameEn}</div>
                    <div className="text-[9px] text-slate-400">{p.category} · {formatPrice(p.price)}</div>
                  </div>
                  <div className={cn('px-2.5 py-1 rounded-lg text-[9px] font-bold',
                    p.stockCount === 0 ? 'bg-red-100 dark:bg-red-950/30 text-red-600' :
                    p.stockCount <= 2 ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-600' :
                    'bg-amber-100 dark:bg-amber-950/30 text-amber-600'
                  )}>
                    {p.stockCount === 0 ? 'OUT' : `${p.stockCount} left`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap size={15} className="text-indigo-500" />
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            {[
              { icon: Plus, label: 'Add Product', color: 'indigo', action: 'products' },
              { icon: Megaphone, label: 'Send Broadcast', color: 'purple', action: 'broadcast' },
              { icon: Zap, label: 'New Flash Deal', color: 'orange', action: 'flashdeals' },
              { icon: Tags, label: 'Create Coupon', color: 'green', action: 'coupons' },
            ].map((item, i) => (
              <button key={i}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                onClick={() => navigate('/admin-panel')}
              >
                <div className={cn('p-1.5 rounded-lg', `bg-${item.color}-50 dark:bg-${item.color}-950/30`)}>
                  <item.icon size={13} className={cn(`text-${item.color}-600`)} />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>

          {/* Store Health */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Store Health</div>
            <div className="space-y-2">
              {[
                { label: 'Performance', val: 92, color: 'green' },
                { label: 'Uptime', val: 99.9, color: 'green' },
                { label: 'Response', val: 180, unit: 'ms', color: 'blue' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-20">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full bg-gradient-to-r', `from-${m.color}-500 to-${m.color}-600`)}
                      style={{ width: `${m.val}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 w-12 text-right">
                    {m.val}{m.unit || '%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Mini */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={15} className="text-slate-500" />
            Recent Orders
          </h3>
          <button className="text-[10px] text-indigo-600 font-semibold hover:underline">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="text-left pb-2 font-semibold">Order</th>
                <th className="text-left pb-2 font-semibold">Customer</th>
                <th className="text-left pb-2 font-semibold">Status</th>
                <th className="text-right pb-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { order: 'ETH-A1B2C3', customer: 'Abebe K.', status: 'shipped', amount: 2450 },
                { order: 'ETH-D4E5F6', customer: 'Selam W.', status: 'processing', amount: 3800 },
                { order: 'ETH-G7H8I9', customer: 'Biruk T.', status: 'completed', amount: 1200 },
              ].map((r, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-mono font-semibold text-indigo-600">{r.order}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{r.customer}</td>
                  <td className="py-2.5">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold',
                      r.status === 'completed' ? 'bg-green-100 dark:bg-green-950/30 text-green-700' :
                      r.status === 'shipped' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700' :
                      'bg-amber-100 dark:bg-amber-950/30 text-amber-700'
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">Br {r.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 2. PRODUCTS — Premium Table
// =============================================
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list().then(d => {
      setProducts(d?.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVisibility = async (id: number, visible: boolean) => {
    await productsApi.update(id, { visible: !visible });
    setProducts(products.map(p => p.id === id ? { ...p, visible: !visible } : p));
  };

  const togglePreOrder = async (id: number) => {
    const p = products.find(x => x.id === id);
    await productsApi.update(id, { isPreOrder: !p?.isPreOrder });
    setProducts(products.map(x => x.id === id ? { ...x, isPreOrder: !x.isPreOrder } : x));
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await productsApi.delete(id);
    setProducts(products.filter(p => p.id !== id));
  };

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">📦 Products</h2>
          <p className="text-[10px] text-slate-500">{products.length} total products · {products.filter(p => p.inStock).length} in stock</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-3 font-semibold">Price</th>
                <th className="text-center px-4 py-3 font-semibold">Stock</th>
                <th className="text-center px-4 py-3 font-semibold">Type</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{p.nameEn}</div>
                        <div className="text-[9px] text-slate-400">{p.soldCount || 0} sold</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 capitalize">{p.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold',
                      p.stockCount > 10 ? 'bg-green-100 dark:bg-green-950/30 text-green-700' :
                      p.stockCount > 0 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700' :
                      'bg-red-100 dark:bg-red-950/30 text-red-600'
                    )}>
                      {p.stockCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border',
                      p.isPreOrder ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    )} onClick={() => togglePreOrder(p.id)}>
                      {p.isPreOrder ? 'Pre-Order' : 'Regular'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border',
                      p.visible !== false ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    )} onClick={() => toggleVisibility(p.id, p.visible)}>
                      {p.visible !== false ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => setEditProduct(p)} title="Edit"><Edit3 size={13} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition-colors" onClick={() => deleteProduct(p.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 3. ORDERS — Premium Management
// =============================================
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    ordersApi.list().then(d => setOrders(d?.orders || [])).catch(() => {});
    try { const local = JSON.parse(localStorage.getItem('ss_orders') || '[]'); setOrders(prev => [...local, ...prev].slice(0, 100)); } catch {}
  }, []);

  const updateStatus = async (orderNumber: string, status: string) => {
    await ordersApi.updateStatus(orderNumber, status);
    setOrders(orders.map(o => o.orderNumber === orderNumber ? { ...o, status } : o));
  };

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
  const counts: Record<string, number> = {};
  statuses.forEach(s => counts[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length);

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">📋 Orders</h2>
          <p className="text-[10px] text-slate-500">{orders.length} total · {counts['pending'] || 0} pending</p>
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {statuses.map(s => (
          <button key={s} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap border transition-all',
            statusFilter === s || (s === 'all' && !statusFilter)
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
          )} onClick={() => setStatusFilter(s === 'all' ? '' : s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.slice(0, 50).map(o => (
            <div key={o.orderNumber} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center">
                    <ShoppingCart size={13} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-mono text-indigo-600 truncate">{o.orderNumber}</div>
                    <div className="text-[9px] text-slate-400 truncate">{o.customer?.name} · {o.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{formatPrice(o.total || 0)}</span>
                  <select className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={o.status} onChange={e => updateStatus(o.orderNumber, e.target.value)}>
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 mt-1.5 ml-[42px] truncate">
                {o.items?.map((it: any) => `${it.name} ×${it.quantity}`).join(', ')}
              </div>
              {/* Status progress bar */}
              <div className="flex gap-1 mt-2 ml-[42px]">
                {['pending','confirmed','processing','shipped','delivered','completed'].map((s, i) => {
                  const statusOrder = ['pending','confirmed','processing','shipped','delivered','completed'];
                  const currentIdx = statusOrder.indexOf(o.status);
                  return (
                    <div key={s} className={cn('flex-1 h-1 rounded-full transition-all', i <= currentIdx ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800')} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 4. VENDORS
// =============================================
function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { vendorsApi.list().then(d => { setVendors(d?.vendors || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🏪 Vendors ({vendors.length})</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vendors.map(v => (
          <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {v.name?.charAt(0) || v.storeName?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{v.name || v.storeName || 'Vendor'}</div>
                <div className="text-[9px] text-slate-400">{v.email || v.phone || 'No contact'}</div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', v.approved ? 'bg-green-100 dark:bg-green-950/30 text-green-700' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700')}>
                {v.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Commission: <strong className="text-slate-700 dark:text-slate-300">{v.commission || 10}%</strong></span>
              <span>Products: <strong className="text-slate-700 dark:text-slate-300">{v.productCount || 0}</strong></span>
            </div>
          </div>
        ))}
      </div>
      {vendors.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No vendors registered</p>}
    </div>
  );
}

// =============================================
// 5. MARKETPLACE
// =============================================
function AdminMarketplace() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);

  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🚀 Marketplace Settings</h2>

      {/* Flash Sales */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap size={16} className="text-orange-500" /> Flash Sales
        </h3>
        {Object.entries(settings.flashSales || {}).map(([pid, d]: any) => {
          const p = products.find(x => x.id === Number(pid));
          const active = isFlashDealActive(d);
          return (
            <div key={pid} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <img src={p?.image} className="w-8 h-8 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{p?.nameEn || `#${pid}`}</div>
                <div className={cn('text-[9px]', active ? 'text-green-600' : 'text-slate-400')}>{active ? formatCountdown(d.end) : 'Expired'} · -{d.discount || 20}%</div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => { const fs = { ...settings.flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}>
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
        {(!settings.flashSales || Object.keys(settings.flashSales).length === 0) && <p className="text-xs text-slate-400 text-center py-4">No flash deals yet</p>}
      </div>

      {/* Sponsored */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">💼 Sponsored Products</h3>
        {(settings.sponsoredProducts || []).map((pid: number) => {
          const p = products.find(x => x.id === pid);
          return (
            <div key={pid} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-sm">💼</span>
              <span className="flex-1 text-xs">{p?.nameEn || `#${pid}`}</span>
              <button className="text-red-500 text-[9px]" onClick={() => saveSetting('sponsoredProducts', (settings.sponsoredProducts || []).filter((x: number) => x !== pid))}>
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// 6-13: REVIEWS, BROADCAST, FLASH DEALS, PRE-ORDERS, TRACKING, THEMES, COUPONS, SETTINGS
// =============================================
function AdminReviews() {
  const store = useStore();
  const { photoReviews, removePhotoReview, setPhotoReviews } = store;
  const [filter, setFilter] = useState('');
  const filtered = filter ? photoReviews.filter(r => r.productId === Number(filter)) : photoReviews;

  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📸 Photo Reviews ({photoReviews.length})</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {filtered.slice(0, 20).map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{r.userName?.charAt(0)}</div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1">{r.userName} {r.verified && <Check size={10} className="text-green-500" />}</div>
                  <div className="text-[9px] text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removePhotoReview(r.id)}><Trash2 size={12} /></button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">{r.text}</p>
            {r.images?.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {(typeof r.images === 'string' ? JSON.parse(r.images) : r.images).slice(0, 3).map((img: string, i: number) => (
                  <img key={i} src={img} className="w-10 h-10 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No reviews yet</p>}
    </div>
  );
}

function AdminBroadcast() {
  const store = useStore();
  const { settings, setSettings, broadcastMessages, setBroadcastMessages } = store;
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'promo' | 'alert' | 'event'>('info');

  const sendBroadcast = () => {
    if (!title.trim() || !message.trim()) return alert('Title and message required');
    const newMsg = { id: generateId(), title: title.trim(), message: message.trim(), icon: type === 'promo' ? '🎉' : type === 'alert' ? '⚠️' : type === 'event' ? '✨' : '📢', type, createdAt: new Date().toISOString(), seen: false };
    const updated = [...broadcastMessages, newMsg];
    setBroadcastMessages(updated);
    const updatedSettings = { ...settings, broadcastMessages: updated };
    setSettings(updatedSettings as any);
    settingsApi.update(updatedSettings);
    setTitle(''); setMessage('');
  };

  const deleteBroadcast = (id: string) => {
    const updated = broadcastMessages.filter(m => m.id !== id);
    setBroadcastMessages(updated);
    setSettings({ ...settings, broadcastMessages: updated } as any);
    settingsApi.update({ ...settings, broadcastMessages: updated });
  };

  const typeColors: Record<string, string> = { info: 'from-blue-500 to-blue-600', promo: 'from-orange-500 to-amber-600', alert: 'from-red-500 to-rose-600', event: 'from-purple-500 to-violet-600' };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">📢 Broadcasts ({broadcastMessages.length})</h2>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">New Broadcast</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} maxLength={50} />
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="info">📢 Info</option><option value="promo">🎉 Promo</option><option value="alert">⚠️ Alert</option><option value="event">✨ Event</option>
          </select>
        </div>
        <textarea className="w-full mt-3 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Message (max 200 chars)" value={message} onChange={e => setMessage(e.target.value)} maxLength={200} />
        <button className="mt-3 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all" onClick={sendBroadcast}>📢 Send Broadcast</button>
      </div>

      <div className="space-y-2">
        {broadcastMessages.slice(0, 10).map(m => (
          <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-start gap-3">
            <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm', typeColors[m.type] || 'from-indigo-500 to-purple-600')}>
              {m.icon || '📢'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.message}</div>
              <div className="text-[8px] text-slate-400 mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0" onClick={() => deleteBroadcast(m.id)}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminFlashDeals() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const flashSales = settings.flashSales || {};

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">⚡ Flash Deals</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Active Deals ({Object.keys(flashSales).length})</h3>
        {Object.entries(flashSales).map(([pid, d]: any) => {
          const p = products.find(x => x.id === Number(pid));
          const active = isFlashDealActive(d);
          return (
            <div key={pid} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <img src={p?.image} className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="text-xs font-semibold">{p?.nameEn || `#${pid}`}</div>
                <div className="flex gap-2 text-[9px] text-slate-500 mt-0.5">
                  <span className={active ? 'text-green-600 font-semibold' : 'text-slate-400'}>{active ? formatCountdown(d.end) : 'Expired'}</span>
                  <span>-{d.discount || 20}%</span>
                  <span>Max: {d.maxQty || 50}</span>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => { const fs = { ...flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}><Trash2 size={12} /></button>
            </div>
          );
        })}
        {Object.keys(flashSales).length === 0 && <p className="text-xs text-slate-400 text-center py-6">No flash deals</p>}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Create Flash Deal</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent col-span-2" id="fd-prod">
            <option value="">Select product...</option>
            {products.filter(p => p.inStock).map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <input type="datetime-local" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-end" />
          <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-discount" placeholder="Discount %" defaultValue={20} />
          <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-qty" placeholder="Max quantity" defaultValue={50} />
          <button className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold col-span-2 hover:shadow-lg transition-all" onClick={() => {
            const pid = (document.getElementById('fd-prod') as HTMLSelectElement)?.value;
            const end = (document.getElementById('fd-end') as HTMLInputElement)?.value;
            if (!pid || !end) return alert('Select product and end time');
            saveSetting('flashSales', { ...flashSales, [pid]: { end: new Date(end).getTime(), startedAt: Date.now(), discount: Number((document.getElementById('fd-discount') as HTMLInputElement)?.value) || 20, maxQty: Number((document.getElementById('fd-qty') as HTMLInputElement)?.value) || 50 } });
          }}>+ Create Flash Deal</button>
        </div>
      </div>
    </div>
  );
}

function AdminPreOrders() {
  const store = useStore();
  const { preOrders, settings, setSettings } = store;
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🚀 Pre-Orders ({preOrders.length})</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">⚙️ Settings</h3>
        <label className="flex items-center gap-2 text-xs mb-3"><input type="checkbox" checked={settings.preOrderEnabled !== false} onChange={e => saveSetting('preOrderEnabled', e.target.checked)} className="rounded" /> Enable Pre-Orders</label>
        <div className="flex items-center gap-3"><span className="text-xs">Default Deposit:</span><input type="number" className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={settings.preOrderDefaultDeposit || 30} onChange={e => saveSetting('preOrderDefaultDeposit', Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2">
        {preOrders.slice(0, 20).map(po => (
          <div key={po.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{po.orderNumber}</span><span className="text-[9px] px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 font-semibold">{po.status}</span></div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{po.productName} · Deposit: {formatPrice(po.deposit)} {po.releaseDate ? `· Release: ${new Date(po.releaseDate).toLocaleDateString()}` : ''}</div>
          </div>
        ))}
        {preOrders.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No pre-orders</p>}
      </div>
    </div>
  );
}

function AdminTracking() {
  const store = useStore();
  const { orders, orderTracking, setOrderTracking, digitalReceipts, setDigitalReceipt } = store;
  const [selectedOrder, setSelectedOrder] = useState('');
  const [carrier, setCarrier] = useState('Ethio Express');
  const [trackingNum, setTrackingNum] = useState('');

  const addTracking = () => {
    if (!selectedOrder) return alert('Select an order');
    setOrderTracking(selectedOrder, {
      carrier, trackingNumber: trackingNum || `ET-${Date.now().toString(36).toUpperCase()}`,
      status: 'shipped', lastUpdate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toLocaleDateString(),
      coordinates: { lat: 9.03, lng: 38.74 },
      timeline: [
        { label: 'Order Placed', time: new Date().toLocaleString(), completed: true, location: 'Addis Ababa' },
        { label: 'Processing', time: new Date().toLocaleString(), completed: true, location: 'Warehouse' },
        { label: 'In Transit', time: new Date().toLocaleString(), completed: false },
        { label: 'Out for Delivery', time: '', completed: false },
        { label: 'Delivered', time: '', completed: false },
      ],
    });
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">📍 Order Tracking</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Add Tracking</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent col-span-3" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}>
            <option value="">Select order...</option>
            {orders.map(o => <option key={o.orderNumber} value={o.orderNumber}>{o.orderNumber} - {o.customer?.name}</option>)}
          </select>
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} />
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Tracking #" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
          <button className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={addTracking}>+ Add Tracking</button>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(orderTracking).slice(0, 10).map(([orderNum, t]: any) => (
          <div key={orderNum} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{orderNum}</span><span className="text-[9px] text-slate-400">{t.carrier}</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">#{t.trackingNumber} · ETA: {t.estimatedDelivery}</div>
          </div>
        ))}
        {Object.keys(orderTracking).length === 0 && <p className="text-xs text-slate-400 text-center py-8">No tracking data</p>}
      </div>
    </div>
  );
}

function AdminThemes() {
  const store = useStore();
  const { themePreset, setThemePreset, customAccent, setCustomAccent, darkMode, setDarkMode } = store;
  const THEMES = [
    { id: 'default' as const, name: 'Default', colors: ['#6C63FF', '#8B5CF6', '#4F46E5'], icon: '💎' },
    { id: 'ocean' as const, name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#0284C7'], icon: '🌊' },
    { id: 'forest' as const, name: 'Forest', colors: ['#10B981', '#34D399', '#059669'], icon: '🌿' },
    { id: 'sunset' as const, name: 'Sunset', colors: ['#F59E0B', '#F97316', '#D97706'], icon: '🌅' },
    { id: 'midnight' as const, name: 'Midnight', colors: ['#6366F1', '#818CF8', '#4338CA'], icon: '🌙' },
    { id: 'rose' as const, name: 'Rose', colors: ['#EC4899', '#F43F5E', '#DB2777'], icon: '🌹' },
  ];

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🎨 Theme Settings</h2>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(t => (
          <button key={t.id} className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all', themePreset === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900')} onClick={() => setThemePreset(t.id)}>
            <div className="flex gap-1">{t.colors.map((c, i) => <div key={i} className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: c }} />)}</div>
            <span className="text-[10px] font-medium">{t.icon} {t.name}</span>
            {themePreset === t.id && <Check size={12} className="text-indigo-600" />}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-0" value={customAccent} onChange={e => setCustomAccent(e.target.value)} />
        <div className="flex-1"><div className="text-xs font-semibold">Accent Color</div><div className="text-[9px] text-slate-400">{customAccent}</div></div>
        <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={() => { document.documentElement.style.setProperty('--accent-color', customAccent); document.documentElement.style.setProperty('--primary', customAccent); }}>Apply</button>
      </div>
      <div className="flex gap-3">
        <button className={cn('flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all', !darkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500')} onClick={() => setDarkMode(false)}>☀️ Light Mode</button>
        <button className={cn('flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all', darkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500')} onClick={() => setDarkMode(true)}>🌙 Dark Mode</button>
      </div>
    </div>
  );
}

function AdminCoupons() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const coupons = settings.coupons || [];
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">🏷️ Coupons ({coupons.length})</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex gap-2">
          <input className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent uppercase" placeholder="COUPON CODE" value={code} onChange={e => setCode(e.target.value)} />
          <input className="w-20 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-center" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={() => { if (!code) return; saveSetting('coupons', [...coupons, { code: code.toUpperCase(), discount, used: 0, active: true, createdAt: new Date().toISOString() }]); setCode(''); }}>+ Add</button>
        </div>
      </div>
      <div className="space-y-2">
        {coupons.map((c: any, i: number) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
            <span className="text-sm">🏷️</span>
            <div className="flex-1"><span className="text-xs font-bold font-mono text-indigo-600">{c.code}</span><span className="text-[10px] text-slate-500 ml-2">{c.discount}% OFF</span></div>
            <span className="text-[9px] text-slate-400">Used: {c.used || 0}</span>
            <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', c.active !== false ? 'bg-green-100 dark:bg-green-950/30 text-green-700' : 'bg-red-100 dark:bg-red-950/30 text-red-600')}>{c.active !== false ? 'Active' : 'Inactive'}</span>
            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => saveSetting('coupons', coupons.filter((_: any, j: number) => j !== i))}><Trash2 size={12} /></button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No coupons</p>}
      </div>
    </div>
  );
}

function AdminSettings() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [commission, setCommission] = useState(settings.vendorCommission || 10);
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 50);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThreshold || 1000);
  const priceAlertEnabled = settings.priceAlertEnabled !== false;

  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const saveAll = () => { saveSetting('vendorCommission', commission); saveSetting('deliveryFee', deliveryFee); saveSetting('freeDeliveryThreshold', freeThreshold); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">⚙️ Settings</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">💰 Commission & Delivery</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Vendor Commission %</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Delivery Fee (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Free Delivery Over</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={freeThreshold} onChange={e => setFreeThreshold(Number(e.target.value))} /></div>
        </div>
        <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={saveAll}>💾 Save Settings</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">🔔 Features</h3>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={priceAlertEnabled} onChange={e => saveSetting('priceAlertEnabled', e.target.checked)} className="rounded" /> Enable Price Drop Alerts</label>
      </div>
    </div>
  );
}
