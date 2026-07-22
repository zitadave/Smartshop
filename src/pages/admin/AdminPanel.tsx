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
  DollarSign, Star, Activity, AlertTriangle, Sun, Moon, Gift, CreditCard,
  Gamepad2, Coins, Smartphone, ExternalLink, Command, Columns, List, Database
} from 'lucide-react';
import CommandPalette from '@/components/admin/CommandPalette';
import LiveChart, { StatCard } from '@/components/admin/LiveChart';
import OrderKanban from '@/components/admin/OrderKanban';
import PayoutSystem from '@/components/admin/PayoutSystem';
import CouponAnalytics from '@/components/admin/CouponAnalytics';
import SmartAlerts from '@/components/admin/SmartAlerts';
import AbandonedCartRecovery from '@/components/admin/AbandonedCarts';
import AdminRoles from '@/components/admin/AdminRoles';
import DatabaseBackup from '@/components/admin/DatabaseBackup';

type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup';

export default function AdminLayout() {
  const [tab, setTab] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

  const handleCmdNavigate = (t: string) => {
    setTab(t as Tab);
    setCmdOpen(false);
  };

  const NAV_ITEMS: { id: Tab; icon: any; label: string }[] = [
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
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'abandoned', icon: ShoppingCart, label: 'Cart Recovery' },
    { id: 'roles', icon: Shield, label: 'Admin Roles' },
    { id: 'backup', icon: Database, label: 'Backup' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Command Palette */}
      <CommandPalette onNavigate={handleCmdNavigate} />

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
          <div className="ml-auto flex items-center gap-2">
            {/* Cmd+K Button */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] font-medium"
              onClick={() => setCmdOpen(true)}>
              <Command size={12} />
              <span>Search</span>
              <span className="text-[8px] text-slate-400 ml-1 font-mono">⌘K</span>
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500" onClick={() => window.open('/', '_blank')}><Eye size={16} /></button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
              <Activity size={12} className="text-indigo-500" />
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 capitalize">{tab}</span>
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed top-14 left-0 bottom-0 w-60 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 overflow-y-auto`}>
        <div className="py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button key={item.id} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group',
                isActive ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              )} onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                <div className={cn('p-1.5 rounded-lg transition-all', isActive ? 'bg-indigo-500/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800')}>
                  <Icon size={15} className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')} />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight size={12} className={cn('opacity-0 -ml-2 transition-all', isActive && 'opacity-100 ml-0')} />
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => window.location.href = '/'}>
            <LogOut size={14} /> <span>Back to Store</span>
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/40 z-30 xl:hidden backdrop-blur-sm" onClick={() => setMenuOpen(false)} />}

      <main className="xl:ml-60 pt-14 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fadeUp">
          {tab === 'overview' && <Overview onNavigate={handleCmdNavigate} />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'vendors' && <AdminVendors />}
          {tab === 'marketplace' && <AdminMarketplace />}
          {tab === 'reviews' && <AdminReviews />}
          {tab === 'broadcast' && <AdminBroadcast />}
          {tab === 'flashdeals' && <AdminFlashDeals />}
          {tab === 'preorders' && <AdminPreOrders />}
          {tab === 'tracking' && <AdminTracking />}
          {tab === 'themes' && <AdminThemes />}
          {tab === 'coupons' && <AdminCoupons />}
          {tab === 'alerts' && <SmartAlerts />}
          {tab === 'abandoned' && <AbandonedCartRecovery />}
          {tab === 'roles' && <AdminRoles />}
          {tab === 'backup' && <DatabaseBackup />}
          {tab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// =============================================
// 1. OVERVIEW
// =============================================
function Overview({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [revenueHistory] = useState(() =>
    Array.from({length: 12}, (_, i) => ({
      label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      value: Math.round(50000 + Math.random() * 150000 + i * 20000),
    }))
  );
  const store = useStore();
  const navigate = useNavigate();
  const goto = (tab: string) => onNavigate ? onNavigate(tab) : navigate('/admin-panel');

  useEffect(() => {
    analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
    const interval = setInterval(() => {
      analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);

  // Generate sparkline data for each stat
  const generateSpark = (base: number) => Array.from({length: 8}, (_, i) => ({ label: `${i+1}h`, value: Math.round(base * (0.7 + Math.random() * 0.6)) }));

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">👋 Welcome back, Admin</h2>
          <p className="text-xs text-slate-500 mt-0.5">Here's what's happening with your store today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-green-600 font-semibold">Live</span>
        </div>
      </div>

      {/* Stat Cards with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Products"
          value={products.length}
          sub={`${data.totalSold || 0} sold`}
          icon={Package}
          color="from-blue-500 to-blue-600"
          trend={{ value: 12, up: true }}
          data={generateSpark(products.length || 18)}
          onClick={() => goto('products')}
        />
        <StatCard
          label="Revenue"
          value={`Br ${(data.totalRevenue || 0).toLocaleString()}`}
          sub={`${data.totalOrders || 0} orders`}
          icon={DollarSign}
          color="from-emerald-500 to-green-600"
          trend={{ value: 8, up: true }}
          data={revenueHistory}
        />
        <StatCard
          label="Active Orders"
          value={data.pendingOrders || 0}
          sub={`${data.shippedOrders || 0} in transit`}
          icon={ShoppingCart}
          color="from-orange-500 to-amber-600"
          trend={{ value: 3, up: false }}
          data={generateSpark(12)}
          onClick={() => goto('orders')}
        />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          sub={`${products.filter(p => !p.inStock).length} out of stock`}
          icon={AlertTriangle}
          color="from-red-500 to-rose-600"
          trend={{ value: lowStock.length > 0 ? 15 : 0, up: lowStock.length > 0 }}
          data={generateSpark(lowStock.length || 3)}
          onClick={() => goto('products')}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">📈 Revenue Trend (12 months)</h3>
          <span className="text-[9px] text-green-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} /> +18% vs last year
          </span>
        </div>
        <LiveChart data={revenueHistory} height={100} color="#6C63FF" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Low Stock */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500" /> Low Stock Alert ({lowStock.length})</h3>
          {lowStock.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">All stocked!</p> : lowStock.slice(0, 5).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <img src={p.image} className="w-9 h-9 rounded-lg object-cover" />
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{p.nameEn}</div><div className="text-[9px] text-slate-400">{formatPrice(p.price)}</div></div>
              <div className={cn('px-2 py-0.5 rounded-lg text-[9px] font-bold', p.stockCount === 0 ? 'bg-red-100 text-red-600' : p.stockCount <= 2 ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600')}>{p.stockCount === 0 ? 'OUT' : `${p.stockCount} left`}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap size={15} className="text-indigo-500" /> Quick Actions</h3>
          <div className="space-y-1.5">
            {[
              { icon: Package, label: 'Manage Products', onClick: () => goto('products') },
              { icon: Megaphone, label: 'Send Broadcast', onClick: () => goto('broadcast') },
              { icon: Zap, label: 'New Flash Deal', onClick: () => goto('flashdeals') },
              { icon: Tags, label: 'Create Coupon', onClick: () => goto('coupons') },
              { icon: DollarSign, label: 'Vendor Payouts', onClick: () => goto('vendors') },
              { icon: Store, label: 'Vendor Dashboard', onClick: () => window.open('/vendor', '_blank') },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" onClick={item.onClick}>
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30"><Icon size={13} className="text-indigo-600" /></div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { productsApi.list().then(d => { setProducts(d?.products || []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const filtered = products.filter(p => !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()));
  const toggleVisibility = async (id: number, v: boolean) => { await productsApi.update(id, { visible: !v }); setProducts(products.map(p => p.id === id ? { ...p, visible: !v } : p)); };
  const togglePreOrder = async (id: number) => { const p = products.find(x => x.id === id); await productsApi.update(id, { isPreOrder: !p?.isPreOrder }); setProducts(products.map(x => x.id === id ? { ...x, isPreOrder: !x.isPreOrder } : x)); };
  const deleteProduct = async (id: number) => { if (!confirm('Delete?')) return; await productsApi.delete(id); setProducts(products.filter(p => p.id !== id)); };
  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-lg font-bold">📦 Products ({products.length})</h2><p className="text-[10px] text-slate-500">{products.filter(p => p.inStock).length} in stock</p></div>
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider"><th className="text-left px-4 py-3 font-semibold">Product</th><th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th><th className="text-right px-4 py-3 font-semibold">Price</th><th className="text-center px-4 py-3 font-semibold">Stock</th><th className="text-center px-4 py-3 font-semibold">Type</th><th className="text-center px-4 py-3 font-semibold">Status</th><th className="text-right px-4 py-3 font-semibold">Actions</th></tr></thead>
          <tbody>{filtered.map(p => (
            <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-3"><div className="flex items-center gap-2.5"><img src={p.image} className="w-9 h-9 rounded-lg object-cover" /><div className="min-w-0"><div className="text-xs font-semibold truncate max-w-[160px]">{p.nameEn}</div><div className="text-[9px] text-slate-400">{p.soldCount || 0} sold</div></div></div></td>
              <td className="px-4 py-3 hidden md:table-cell text-slate-500 capitalize">{p.category}</td>
              <td className="px-4 py-3 text-right font-bold">{formatPrice(p.price)}</td>
              <td className="px-4 py-3 text-center"><span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', p.stockCount > 10 ? 'bg-green-100 text-green-700' : p.stockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>{p.stockCount}</span></td>
              <td className="px-4 py-3 text-center"><button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border', p.isPreOrder ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200')} onClick={() => togglePreOrder(p.id)}>{p.isPreOrder ? 'Pre-Order' : 'Regular'}</button></td>
              <td className="px-4 py-3 text-center"><button className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold border', p.visible !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200')} onClick={() => toggleVisibility(p.id, p.visible)}>{p.visible !== false ? 'Visible' : 'Hidden'}</button></td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 size={13} /></button><button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => deleteProduct(p.id)}><Trash2 size={13} /></button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState('');
  const fetchOrders = () => {
    ordersApi.list().then(d => setOrders(d?.orders || [])).catch(() => {});
    try { const l = JSON.parse(localStorage.getItem('ss_orders') || '[]'); setOrders(prev => [...l, ...prev].slice(0, 100)); } catch {}
  };
  useEffect(fetchOrders, []);
  const updateStatus = async (n: string, s: string) => { await ordersApi.updateStatus(n, s); setOrders(orders.map(o => o.orderNumber === n ? { ...o, status: s } : o)); };
  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📋 Orders ({orders.length})</h2>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setViewMode('kanban')}>
            <Columns size={12} /> Kanban
          </button>
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setViewMode('list')}>
            <List size={12} /> List
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {statuses.map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button key={s} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap border transition-all flex-shrink-0',
              viewMode === 'kanban' ? 'hidden' : '',
              (statusFilter === s || (s === 'all' && !statusFilter)) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
            )} onClick={() => setStatusFilter(s === 'all' ? '' : s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <OrderKanban orders={orders} onUpdate={fetchOrders} />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 50).map(o => (
              <div key={o.orderNumber} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center"><ShoppingCart size={13} className="text-indigo-600" /></div>
                    <div className="min-w-0"><div className="text-xs font-bold font-mono text-indigo-600 truncate">{o.orderNumber}</div><div className="text-[9px] text-slate-400 truncate">{o.customer?.name} · {o.date}</div></div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold">{formatPrice(o.total || 0)}</span>
                    <select className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1" value={o.status} onChange={e => updateStatus(o.orderNumber, e.target.value)}>
                      {['pending','confirmed','processing','shipped','delivered','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 mt-1.5 ml-[42px] truncate">{o.items?.map((it: any) => `${it.name} ×${it.quantity}`).join(', ')}</div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No orders found</p>}
        </div>
      )}
    </div>
  );
}

function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [commission, setCommission] = useState(10);
  const [approved, setApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendorView, setVendorView] = useState<'vendors' | 'payouts'>('vendors');
  useEffect(() => { vendorsApi.list().then(d => { setVendors(d?.vendors || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const updateVendor = async (id: number) => {
    await vendorsApi.update(id, { commission, approved });
    setVendors(vendors.map(v => v.id === id ? { ...v, commission, approved } : v));
    setSelectedVendor(null);
  };

  if (loading) return <div className="text-center py-12"><Loader size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">🏪 Vendors ({vendors.length})</h2>
        {/* Payouts toggle */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all', vendorView === 'vendors' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setVendorView('vendors')}>
            Vendors
          </button>
          <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all', vendorView === 'payouts' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setVendorView('payouts')}>
            <DollarSign size={11} className="inline" /> Payouts
          </button>
        </div>
      </div>

      {vendorView === 'payouts' ? (
        <PayoutSystem />
      ) : (
        <>
          {selectedVendor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-slideUp">
              <h3 className="text-sm font-bold mb-3">Edit: {selectedVendor.name || selectedVendor.storeName}</h3>
              <div className="space-y-3">
                <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Commission %</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="rounded" /> Approved Vendor</label>
                <div className="flex gap-2"><button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => updateVendor(selectedVendor.id)}>💾 Save</button><button className="px-4 py-2 border rounded-xl text-xs" onClick={() => setSelectedVendor(null)}>Cancel</button></div>
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendors.map(v => (
              <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{v.name?.charAt(0) || v.storeName?.charAt(0) || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{v.name || v.storeName || 'Vendor'}</div>
                    <div className="text-[9px] text-slate-400">{v.email || v.phone || 'No contact'}</div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold', v.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{v.approved ? 'Approved' : 'Pending'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Commission: <strong>{v.commission || 10}%</strong></span>
                  <button className="text-indigo-600 text-[9px] font-semibold hover:underline" onClick={() => { setSelectedVendor(v); setCommission(v.commission || 10); setApproved(v.approved !== false); }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
          {vendors.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No vendors</p>}
        </>
      )}
    </div>
  );
}

function AdminMarketplace() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">🚀 Marketplace</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap size={16} className="text-orange-500" /> Flash Sales</h3>
        {Object.entries(settings.flashSales || {}).map(([pid, d]: any) => {
          const p = products.find(x => x.id === Number(pid));
          const active = isFlashDealActive(d);
          return <div key={pid} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <img src={p?.image} className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{p?.nameEn || `#${pid}`}</div><div className={cn('text-[9px]', active ? 'text-green-600' : 'text-slate-400')}>{active ? formatCountdown(d.end) : 'Expired'} · -{d.discount || 20}%</div></div>
            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => { const fs = { ...settings.flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}><Trash2 size={12} /></button>
          </div>;
        })}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">💼 Sponsored</h3>
        {(settings.sponsoredProducts || []).map((pid: number) => {
          const p = products.find(x => x.id === pid);
          return <div key={pid} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"><span>💼</span><span className="flex-1 text-xs">{p?.nameEn || `#${pid}`}</span><button className="text-red-500 text-[9px]" onClick={() => saveSetting('sponsoredProducts', (settings.sponsoredProducts || []).filter((x: number) => x !== pid))}><Trash2 size={12} /></button></div>;
        })}
      </div>
    </div>
  );
}

function AdminReviews() {
  const store = useStore();
  const { photoReviews, removePhotoReview } = store;
  return (
    <div className="animate-fadeUp">
      <h2 className="text-lg font-bold mb-4">📸 Reviews ({photoReviews.length})</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {photoReviews.slice(0, 20).map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{r.userName?.charAt(0)}</div>
                <div><div className="text-xs font-semibold flex items-center gap-1">{r.userName} {r.verified && <Check size={10} className="text-green-500" />}</div><div className="text-[9px] text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div></div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removePhotoReview(r.id)}><Trash2 size={12} /></button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">{r.text}</p>
            {r.images?.length > 0 && <div className="flex gap-1 mt-1.5">{(typeof r.images === 'string' ? JSON.parse(r.images) : r.images).slice(0, 3).map((img: string, i: number) => <img key={i} src={img} className="w-10 h-10 rounded-lg object-cover" />)}</div>}
          </div>
        ))}
      </div>
      {photoReviews.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No reviews</p>}
    </div>
  );
}

function AdminBroadcast() {
  const store = useStore();
  const { settings, setSettings, broadcastMessages, setBroadcastMessages } = store;
  const [title, setTitle] = useState(''); const [message, setMessage] = useState(''); const [type, setType] = useState<'info' | 'promo' | 'alert' | 'event'>('info');
  const sendBroadcast = () => {
    if (!title.trim() || !message.trim()) return alert('Title and message required');
    const newMsg = { id: generateId(), title: title.trim(), message: message.trim(), icon: type === 'promo' ? '🎉' : type === 'alert' ? '⚠️' : type === 'event' ? '✨' : '📢', type, createdAt: new Date().toISOString(), seen: false };
    const updated = [...broadcastMessages, newMsg]; setBroadcastMessages(updated); setSettings({ ...settings, broadcastMessages: updated } as any); settingsApi.update({ ...settings, broadcastMessages: updated }); setTitle(''); setMessage('');
  };
  const deleteBroadcast = (id: string) => { const updated = broadcastMessages.filter(m => m.id !== id); setBroadcastMessages(updated); setSettings({ ...settings, broadcastMessages: updated } as any); settingsApi.update({ ...settings, broadcastMessages: updated }); };
  const typeColors: Record<string, string> = { info: 'from-blue-500 to-blue-600', promo: 'from-orange-500 to-amber-600', alert: 'from-red-500 to-rose-600', event: 'from-purple-500 to-violet-600' };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">📢 Broadcasts ({broadcastMessages.length})</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">New Broadcast</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} maxLength={50} />
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={type} onChange={e => setType(e.target.value as any)}><option value="info">📢 Info</option><option value="promo">🎉 Promo</option><option value="alert">⚠️ Alert</option><option value="event">✨ Event</option></select>
        </div>
        <textarea className="w-full mt-3 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-20" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} maxLength={200} />
        <button className="mt-3 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={sendBroadcast}>📢 Send Broadcast</button>
      </div>
      <div className="space-y-2">{broadcastMessages.slice(0, 10).map(m => (
        <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm', typeColors[m.type])}>{m.icon || '📢'}</div>
          <div className="flex-1 min-w-0"><div className="text-xs font-bold">{m.title}</div><div className="text-[10px] text-slate-500 mt-0.5">{m.message}</div></div>
          <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => deleteBroadcast(m.id)}><Trash2 size={12} /></button>
        </div>
      ))}</div>
    </div>
  );
}

function AdminFlashDeals() {
  const store = useStore(); const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  const flashSales = settings.flashSales || {};
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">⚡ Flash Deals</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Active Deals ({Object.keys(flashSales).length})</h3>
        {Object.entries(flashSales).map(([pid, d]: any) => {
          const p = products.find(x => x.id === Number(pid)); const active = isFlashDealActive(d);
          return <div key={pid} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <img src={p?.image} className="w-10 h-10 rounded-xl object-cover" />
            <div className="flex-1"><div className="text-xs font-semibold">{p?.nameEn || `#${pid}`}</div><div className="flex gap-2 text-[9px] text-slate-500 mt-0.5"><span className={active ? 'text-green-600 font-semibold' : 'text-slate-400'}>{active ? formatCountdown(d.end) : 'Expired'}</span><span>-{d.discount || 20}%</span><span>Max: {d.maxQty || 50}</span></div></div>
            <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => { const fs = { ...flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}><Trash2 size={12} /></button>
          </div>;
        })}
        {Object.keys(flashSales).length === 0 && <p className="text-xs text-slate-400 text-center py-6">No flash deals</p>}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Create Flash Deal</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent col-span-2" id="fd-prod"><option value="">Select product...</option>{products.filter(p => p.inStock).map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}</select>
          <input type="datetime-local" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-end" />
          <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-discount" placeholder="Discount %" defaultValue={20} />
          <input type="number" className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" id="fd-qty" placeholder="Max qty" defaultValue={50} />
          <button className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold col-span-2" onClick={() => {
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
  const store = useStore(); const { preOrders, settings, setSettings } = store;
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">🚀 Pre-Orders ({preOrders.length})</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">⚙️ Settings</h3>
        <label className="flex items-center gap-2 text-xs mb-3"><input type="checkbox" checked={settings.preOrderEnabled !== false} onChange={e => saveSetting('preOrderEnabled', e.target.checked)} className="rounded" /> Enable Pre-Orders</label>
        <div className="flex items-center gap-3"><span className="text-xs">Default Deposit:</span><input type="number" className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={settings.preOrderDefaultDeposit || 30} onChange={e => saveSetting('preOrderDefaultDeposit', Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2">{preOrders.slice(0, 20).map(po => (
        <div key={po.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{po.orderNumber}</span><span className="text-[9px] px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 font-semibold">{po.status}</span></div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{po.productName} · Deposit: {formatPrice(po.deposit)} {po.releaseDate ? `· Release: ${new Date(po.releaseDate).toLocaleDateString()}` : ''}</div>
        </div>
      ))}{preOrders.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No pre-orders</p>}</div>
    </div>
  );
}

function AdminTracking() {
  const store = useStore(); const { orders, orderTracking, setOrderTracking, setDigitalReceipt } = store;
  const [selectedOrder, setSelectedOrder] = useState(''); const [carrier, setCarrier] = useState('Ethio Express'); const [trackingNum, setTrackingNum] = useState('');
  const addTracking = () => { if (!selectedOrder) return alert('Select order'); setOrderTracking(selectedOrder, { carrier, trackingNumber: trackingNum || `ET-${Date.now().toString(36).toUpperCase()}`, status: 'shipped', lastUpdate: new Date().toISOString(), estimatedDelivery: new Date(Date.now() + 3 * 86400000).toLocaleDateString(), coordinates: { lat: 9.03, lng: 38.74 }, timeline: [{ label: 'Order Placed', time: new Date().toLocaleString(), completed: true, location: 'Addis Ababa' }, { label: 'Processing', time: new Date().toLocaleString(), completed: true, location: 'Warehouse' }, { label: 'In Transit', time: '', completed: false }, { label: 'Out for Delivery', time: '', completed: false }, { label: 'Delivered', time: '', completed: false }] }); };
  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">📍 Order Tracking</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Add Tracking</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <select className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent col-span-3" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}><option value="">Select order...</option>{orders.map(o => <option key={o.orderNumber} value={o.orderNumber}>{o.orderNumber} - {o.customer?.name}</option>)}</select>
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} />
          <input className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Tracking #" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
          <button className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={addTracking}>+ Add Tracking</button>
        </div>
      </div>
      <div className="space-y-2">{Object.entries(orderTracking).slice(0, 10).map(([on, t]: any) => (
        <div key={on} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold font-mono text-indigo-600">{on}</span><span className="text-[9px] text-slate-400">{t.carrier}</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">#{t.trackingNumber} · ETA: {t.estimatedDelivery}</div>
        </div>
      ))}{Object.keys(orderTracking).length === 0 && <p className="text-xs text-slate-400 text-center py-8">No tracking</p>}</div>
    </div>
  );
}

function AdminThemes() {
  const store = useStore(); const { themePreset, setThemePreset, customAccent, setCustomAccent, darkMode, setDarkMode } = store;
  const THEMES = [
    { id: 'default' as const, name: 'Default', colors: ['#6C63FF', '#8B5CF6', '#4F46E5'], icon: '💎' },
    { id: 'ocean' as const, name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#0284C7'], icon: '🌊' },
    { id: 'forest' as const, name: 'Forest', colors: ['#10B981', '#34D399', '#059669'], icon: '🌿' },
    { id: 'sunset' as const, name: 'Sunset', colors: ['#F59E0B', '#F97316', '#D97706'], icon: '🌅' },
    { id: 'midnight' as const, name: 'Midnight', colors: ['#6366F1', '#818CF8', '#4338CA'], icon: '🌙' },
    { id: 'rose' as const, name: 'Rose', colors: ['#EC4899', '#F43F5E', '#DB2777'], icon: '🌹' },
  ];

  const applyTheme = (preset: typeof THEMES[0]['id']) => {
    setThemePreset(preset);
    const t = THEMES.find(x => x.id === preset);
    if (t) {
      document.documentElement.style.setProperty('--primary', t.colors[0]);
      document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
      document.documentElement.style.setProperty('--accent-color', t.colors[1]);
      document.documentElement.style.setProperty('--ring', t.colors[0] + '40');
    }
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">🎨 Theme Settings</h2>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(t => (
          <button key={t.id} className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all', themePreset === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-white dark:bg-slate-900')} onClick={() => applyTheme(t.id)}>
            <div className="flex gap-1">{t.colors.map((c, i) => <div key={i} className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: c }} />)}</div>
            <span className="text-[10px] font-medium">{t.icon} {t.name}</span>
            {themePreset === t.id && <Check size={12} className="text-indigo-600" />}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-0" value={customAccent} onChange={e => setCustomAccent(e.target.value)} />
        <div className="flex-1"><div className="text-xs font-semibold">Accent Color</div><div className="text-[9px] text-slate-400">{customAccent}</div></div>
        <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={() => { document.documentElement.style.setProperty('--accent-color', customAccent); }}>Apply</button>
      </div>
      <div className="flex gap-3">
        <button className={cn('flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all', !darkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500')} onClick={() => setDarkMode(false)}>☀️ Light</button>
        <button className={cn('flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all', darkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500')} onClick={() => setDarkMode(true)}>🌙 Dark</button>
      </div>
    </div>
  );
}

// =============================================
// GAME SETTINGS — Admin controls wheel, streak, mystery box, points
// =============================================
function AdminCoupons() {
  return <CouponAnalytics />;
}

function AdminSettings() {
  const store = useStore(); const { settings, setSettings } = store;
  const [commission, setCommission] = useState(settings.vendorCommission || 10);
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 50);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThreshold || 1000);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(settings.priceAlertEnabled !== false);
  const saveSetting = (key: string, val: any) => { const updated = { ...settings, [key]: val }; setSettings(updated as any); settingsApi.update(updated); };

  const gameSettings = (settings as any)?.gameSettings || {};
  const wheelSegments = (settings as any)?.wheelSegments || [];

  const updateGameSetting = (key: string, val: any) => { saveSetting('gameSettings', { ...gameSettings, [key]: val }); };
  const updateWheelSegment = (idx: number, field: string, val: any) => {
    const updated = [...wheelSegments];
    updated[idx] = { ...updated[idx], [field]: val };
    saveSetting('wheelSegments', updated);
  };
  const addWheelSegment = () => { saveSetting('wheelSegments', [...wheelSegments, { label: '🎁 New Prize', color: '#6366F1', value: 50 }]); };
  const removeWheelSegment = (idx: number) => { if (wheelSegments.length > 2) saveSetting('wheelSegments', wheelSegments.filter((_: any, i: number) => i !== idx)); };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><SettingsIcon size={20} /> Settings</h2>

      {/* Commission & Delivery */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">💰 Commission & Delivery</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Vendor Commission %</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={commission} onChange={e => setCommission(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Delivery Fee (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Free Delivery Over</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={freeThreshold} onChange={e => setFreeThreshold(Number(e.target.value))} /></div>
        </div>
        <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold" onClick={() => { saveSetting('vendorCommission', commission); saveSetting('deliveryFee', deliveryFee); saveSetting('freeDeliveryThreshold', freeThreshold); }}>💾 Save Settings</button>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">🔔 Features</h3>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={priceAlertEnabled} onChange={e => { setPriceAlertEnabled(e.target.checked); saveSetting('priceAlertEnabled', e.target.checked); }} className="rounded" /> Enable Price Drop Alerts</label>
        <label className="flex items-center gap-2 text-xs mt-2"><input type="checkbox" checked={settings.affiliateEnabled !== false} onChange={e => saveSetting('affiliateEnabled', e.target.checked)} className="rounded" /> Enable Affiliate Program</label>
        <div className="mt-2 flex items-center gap-3"><span className="text-xs">Affiliate Commission %:</span><input type="number" className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={settings.affiliateCommission || 10} onChange={e => saveSetting('affiliateCommission', Number(e.target.value))} /></div>
      </div>

      {/* Game & Loyalty Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Gamepad2 size={16} /> Game & Loyalty Settings</h3>
        
        {/* Points Conversion */}
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Min Points for Cash</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.minPointsForCash || 100} onChange={e => updateGameSetting('minPointsForCash', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate (pts→Br)</label><input type="number" step="0.1" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.pointsToCashRate || 0.5} onChange={e => updateGameSetting('pointsToCashRate', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Daily Spins</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.spinsPerDay || 1} onChange={e => updateGameSetting('spinsPerDay', Number(e.target.value))} /></div>
        </div>

        {/* Wheel Font Settings */}
        <div className="grid sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Wheel Font Size</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={gameSettings.wheelFontSize || 20} onChange={e => updateGameSetting('wheelFontSize', Number(e.target.value))} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Wheel Font Color</label><input type="color" className="w-full mt-1 h-9 rounded-lg cursor-pointer border-0" value={gameSettings.wheelFontColor || '#ffffff'} onChange={e => updateGameSetting('wheelFontColor', e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Show Emoji</label><label className="flex items-center gap-2 text-xs mt-2"><input type="checkbox" checked={gameSettings.wheelShowEmoji !== false} onChange={e => updateGameSetting('wheelShowEmoji', e.target.checked)} className="rounded" /> Show emoji on wheel</label></div>
        </div>

        {/* Wheel Segments */}
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Wheel Segments ({wheelSegments.length || 10})</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(wheelSegments.length > 0 ? wheelSegments : [
            { label: '🚚 Free Delivery', color: '#e53e3e', value: 0 },
            { label: '💰 Br 50 Off', color: '#dd6b20', value: 50 },
            { label: '💎 Br 100 Off', color: '#d69e2e', value: 100 },
            { label: '🎯 10% Off', color: '#38a169', value: 10 },
            { label: '🔥 15% Off', color: '#3182ce', value: 15 },
            { label: '⭐ 25% Off', color: '#805ad5', value: 25 },
            { label: '🏆 50 Pts', color: '#ed64a6', value: 50 },
            { label: '👑 100 Pts', color: '#0bc5ea', value: 100 },
            { label: '🔄 Try Again', color: '#a0aec0', value: 0 },
            { label: '🎁 Br 20 Off', color: '#e53e3e', value: 20 },
          ]).map((seg: any, i: number) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-[9px] font-bold text-slate-400 w-5">{i + 1}</span>
              <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={seg.label} onChange={e => updateWheelSegment(i, 'label', e.target.value)} />
              <input type="color" className="w-7 h-7 rounded-lg cursor-pointer border-0" value={seg.color} onChange={e => updateWheelSegment(i, 'color', e.target.value)} />
              <input type="number" className="w-16 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" value={seg.value} onChange={e => updateWheelSegment(i, 'value', Number(e.target.value))} />
              <button className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeWheelSegment(i)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
        <button className="mt-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-[10px] text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all w-full" onClick={addWheelSegment}>+ Add Segment</button>
      </div>

      {/* Streak & Mystery Box */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🔥 Streak</h3>
          <div className="space-y-3">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Streak Days</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.streakDays || 7} onChange={e => updateGameSetting('streakDays', Number(e.target.value))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Daily Bonus Points</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.streakBonus || 10} onChange={e => updateGameSetting('streakBonus', Number(e.target.value))} /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🎁 Mystery Box</h3>
          <div className="space-y-3">
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Boxes per Purchase</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.boxesPerPurchase || 1} onChange={e => updateGameSetting('boxesPerPurchase', Number(e.target.value))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Max Prize (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={gameSettings.maxBoxPrize || 1000} onChange={e => updateGameSetting('maxBoxPrize', Number(e.target.value))} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
