import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi, ordersApi, analyticsApi, vendorsApi, settingsApi, reviewsApi, preOrdersApi, broadcastApi, trackingApi, receiptsApi, flashDealsApi } from '@/lib/api';
import { formatPrice, cn, generateId, formatCountdown, isFlashDealActive } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import {
  LayoutDashboard, Package, ShoppingCart, Store, Settings as SettingsIcon,
  TrendingUp, Users, MessageSquare, BarChart3, Shield, LogOut, Menu, X,
  Bell, Rocket, Tags, Scale, Calendar, ClipboardList, ChevronRight,
  Camera, Megaphone, Clock, Globe, Palette, MapPin, FileText, Zap
} from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings';

const NAV_ITEMS: { id: Tab; icon: any; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
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

export default function AdminLayout() {
  const [tab, setTab] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center px-3 z-50 gap-2 shadow-lg">
        <button className="lg:hidden p-1.5" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="text-base">🏪</span>
        <div>
          <span className="text-sm font-bold">Admin Panel</span>
          <span className="text-[8px] opacity-60 block -mt-0.5">Smart Shop Management</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{tab}</span>
        </div>
      </header>

      <aside className={`fixed top-12 left-0 bottom-0 w-56 bg-card border-r border-border z-40 transition-transform duration-200 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
        <div className="py-2 px-1.5 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all', tab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')} onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted" onClick={() => window.location.href = '/'}>
            <LogOut size={14} /> Back to Shop
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="lg:ml-56 pt-12 min-h-screen">
        <div className="p-3 max-w-6xl mx-auto">
          {tab === 'overview' && <Overview />}
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
          {tab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Overview() {
  const [data, setData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const store = useStore();

  useEffect(() => {
    analyticsApi.get().then(d => d?.analytics && setData(d.analytics)).catch(() => {});
    productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {});
  }, []);

  const lowStock = products.filter(p => p.stockCount <= 5 && p.stockCount > 0);
  const top = data.topProducts || [];
  const flashDealsCount = Object.keys(store.settings.flashSales || {}).length;
  const broadcastCount = (store.settings.broadcastMessages || []).length;
  const activeFlashDeals = Object.entries(store.settings.flashSales || {}).filter(([_, d]) => isFlashDealActive(d as any)).length;

  const stats = [
    { label: 'Products', val: data.totalProducts || 0, sub: `${data.totalSold || 0} sold`, color: 'text-blue-600' },
    { label: 'Revenue', val: `Br ${(data.totalRevenue || 0).toLocaleString()}`, sub: `${data.totalOrders || 0} orders`, color: 'text-green-600' },
    { label: 'Pending', val: data.pendingOrders || 0, sub: `${data.shippedOrders || 0} shipped`, color: 'text-orange-600' },
    { label: 'Low Stock', val: lowStock.length, sub: 'items', color: 'text-red-600' },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📊 Dashboard</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className={cn('text-xl font-extrabold mt-0.5', s.color)}>{s.val}</div>
            <div className="text-[9px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Feature Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-card rounded-xl border border-border p-2.5 text-center">
          <Zap size={14} className="text-orange-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold">{activeFlashDeals}</div>
          <div className="text-[8px] text-muted-foreground">Flash Deals</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-2.5 text-center">
          <Megaphone size={14} className="text-blue-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold">{broadcastCount}</div>
          <div className="text-[8px] text-muted-foreground">Broadcasts</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-2.5 text-center">
          <Camera size={14} className="text-green-500 mx-auto mb-0.5" />
          <div className="text-xs font-bold">{store.photoReviews.length}</div>
          <div className="text-[8px] text-muted-foreground">Reviews</div>
        </div>
      </div>

      {/* Low Stock */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">⚠️ Low Stock</h3>
        {lowStock.length === 0 ? <p className="text-xs text-muted-foreground">All stocked</p> : (
          lowStock.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
              <img src={p.image} className="w-8 h-8 rounded object-cover" />
              <span className="flex-1">{p.nameEn}</span>
              <span className="text-orange-600 font-semibold">{p.stockCount} left</span>
            </div>
          ))
        )}
      </div>

      {/* Top Products */}
      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-xs font-semibold mb-2">🏆 Top Selling</h3>
        {top.length === 0 ? <p className="text-xs text-muted-foreground">No data</p> : (
          top.slice(0, 5).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
              <span className="text-green-600 font-bold w-5">{i + 1}.</span>
              <span className="flex-1">{p.name}</span>
              <span className="text-muted-foreground">{p.sold} sold</span>
              <span className="font-semibold">Br {p.revenue?.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== PRODUCTS ====================
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<any>(null);

  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);

  const filtered = products.filter(p =>
    !search || p.nameEn?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVisibility = async (id: number, visible: boolean) => {
    await productsApi.update(id, { visible: !visible });
    setProducts(products.map(p => p.id === id ? { ...p, visible: !visible } : p));
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await productsApi.delete(id);
    setProducts(products.filter(p => p.id !== id));
  };

  const togglePreOrder = async (id: number) => {
    const p = products.find(x => x.id === id);
    await productsApi.update(id, { isPreOrder: !p?.isPreOrder });
    setProducts(products.map(x => x.id === id ? { ...x, isPreOrder: !x.isPreOrder } : x));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">📦 Products ({products.length})</h2>
      </div>
      <input className="w-full p-2.5 border border-input rounded-lg text-xs bg-card mb-3" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-1.5">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-2.5 flex items-center gap-2.5">
            <img src={p.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{p.nameEn}</div>
              <div className="text-[10px] text-muted-foreground">
                Br {p.price?.toLocaleString()} · {p.category} · Stock: {p.stockCount}
                {p.visible === false && <span className="text-orange-500 ml-1">· Hidden</span>}
                {p.isPreOrder && <span className="text-blue-500 ml-1">· Pre-Order</span>}
              </div>
            </div>
            <button className={cn('px-2 py-1 rounded text-[9px] font-semibold', p.isPreOrder ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground')} onClick={() => togglePreOrder(p.id)}>
              {p.isPreOrder ? 'Pre-Order' : 'Regular'}
            </button>
            <button className={cn('px-2 py-1 rounded text-[9px] font-semibold', p.visible !== false ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')} onClick={() => toggleVisibility(p.id, p.visible)}>
              {p.visible !== false ? 'Visible' : 'Hidden'}
            </button>
            <button className="px-2 py-1 rounded text-[9px] bg-muted text-muted-foreground" onClick={() => setEditProduct(p)}>✏️</button>
            <button className="px-2 py-1 rounded text-[9px] bg-red-50 text-red-600" onClick={() => deleteProduct(p.id)}>🗑️</button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No products found</p>}
    </div>
  );
}

// ==================== ORDERS ====================
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    ordersApi.list().then(d => setOrders(d?.orders || [])).catch(() => {});
    try { const local = JSON.parse(localStorage.getItem('ss_orders') || '[]'); setOrders(prev => [...local, ...prev].slice(0, 50)); } catch {}
  }, []);

  const updateStatus = async (orderNumber: string, status: string) => {
    await ordersApi.updateStatus(orderNumber, status);
    setOrders(orders.map(o => o.orderNumber === orderNumber ? { ...o, status } : o));
  };

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📋 Orders ({orders.length})</h2>
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(s => (
          <button key={s} className={cn('px-2.5 py-1.5 rounded-lg text-[9px] font-medium whitespace-nowrap', statusFilter === s ? 'bg-primary text-white' : 'bg-card border border-border hover:bg-muted')} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filtered.map(o => (
          <div key={o.orderNumber} className="bg-card rounded-xl border border-border p-2.5">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold font-mono text-primary">{o.orderNumber}</span>
              <select className="text-[9px] bg-card border border-input rounded px-1 py-0.5" value={o.status} onChange={e => updateStatus(o.orderNumber, e.target.value)}>
                {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="text-[9px] text-muted-foreground">
              {o.date} · {o.customer?.name} · {o.paymentMethod} · <span className="font-semibold">{formatPrice(o.total || 0)}</span>
            </div>
            <div className="text-[8px] text-muted-foreground mt-0.5">
              {o.items?.map((it: any) => `${it.name} x${it.quantity}`).join(', ')}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No orders</p>}
    </div>
  );
}

// ==================== VENDORS ====================
function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => { vendorsApi.list().then(d => setVendors(d?.vendors || [])).catch(() => {}); }, []);

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🏪 Vendors ({vendors.length})</h2>
      <div className="space-y-1.5">
        {vendors.map(v => (
          <div key={v.id} className="bg-card rounded-xl border border-border p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{v.name?.charAt(0) || '?'}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold">{v.name || v.businessName || v.storeName}</div>
              <div className="text-[9px] text-muted-foreground">{v.email || v.phone || 'No contact'} · Commission: {v.commission || 10}%</div>
            </div>
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold', v.approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
              {v.approved ? 'Approved' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
      {vendors.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No vendors</p>}
    </div>
  );
}

// ==================== MARKETPLACE ====================
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
    <div>
      <h2 className="text-base font-bold mb-3">🚀 Marketplace</h2>

      {/* Flash Sales */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">⚡ Flash Sales</h3>
        <div className="space-y-1.5 mb-2">
          {Object.entries(settings.flashSales || {}).map(([pid, d]: any) => {
            const p = products.find(x => x.id === Number(pid));
            const active = isFlashDealActive(d);
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <span>{active ? '⚡' : '⏰'}</span>
                <span className="flex-1">{p?.nameEn || `#${pid}`}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded', active ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground')}>
                  {active ? formatCountdown(d.end) : 'Ended'}
                </span>
                <button className="text-red-500 text-[9px]" onClick={() => { const fs = { ...settings.flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <select className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="fs-prod">
            <option value="">Select product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <input type="datetime-local" className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="fs-end" />
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => {
            const pid = (document.getElementById('fs-prod') as HTMLSelectElement)?.value;
            const end = (document.getElementById('fs-end') as HTMLInputElement)?.value;
            if (!pid || !end) return alert('Select product and end time');
            const flash = { ...(settings.flashSales || {}), [pid]: { end: new Date(end).getTime(), startedAt: Date.now(), discount: 20, maxQty: 50 } };
            saveSetting('flashSales', flash);
          }}>+ Add</button>
        </div>
      </div>

      {/* Sponsored */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">💼 Sponsored Products</h3>
        <div className="space-y-1.5">
          {(settings.sponsoredProducts || []).map((pid: number) => {
            const p = products.find(x => x.id === pid);
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <span>💼</span>
                <span className="flex-1">{p?.nameEn || `#${pid}`}</span>
                <button className="text-red-500 text-[9px]" onClick={() => saveSetting('sponsoredProducts', (settings.sponsoredProducts || []).filter((x: number) => x !== pid))}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <select className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" id="sp-prod">
            <option value="">Select product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
          </select>
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => {
            const pid = (document.getElementById('sp-prod') as HTMLSelectElement)?.value;
            if (!pid) return;
            saveSetting('sponsoredProducts', [...(settings.sponsoredProducts || []), Number(pid)]);
          }}>+ Add</button>
        </div>
      </div>
    </div>
  );
}

// ==================== PHOTO REVIEWS ====================
function AdminReviews() {
  const store = useStore();
  const { photoReviews, removePhotoReview, setPhotoReviews } = store;
  const [filter, setFilter] = useState('');

  const filtered = filter ? photoReviews.filter(r => r.productId === Number(filter)) : photoReviews;

  const handleDelete = (id: string) => {
    if (!confirm('Delete this review?')) return;
    removePhotoReview(id);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📸 Photo Reviews ({photoReviews.length})</h2>
      <div className="space-y-1.5">
        {filtered.slice(0, 20).map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{r.userName?.charAt(0)}</div>
                <span className="text-[10px] font-semibold">{r.userName}</span>
                {r.verified && <span className="text-[8px] text-green-600 bg-green-50 px-1 rounded">✓</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-amber-500">{'★'.repeat(r.rating)}</span>
                <button className="text-red-500 text-[9px] p-0.5" onClick={() => handleDelete(r.id)}>🗑️</button>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">{r.text}</p>
            {r.images?.length > 0 && (
              <div className="flex gap-1 mt-1">
                {(typeof r.images === 'string' ? JSON.parse(r.images) : r.images).slice(0, 4).map((img: string, i: number) => (
                  <img key={i} src={img} className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(img, '_blank')} />
                ))}
              </div>
            )}
            <div className="text-[7px] text-muted-foreground mt-1">Product #{r.productId} · {new Date(r.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No reviews yet</p>}
    </div>
  );
}

// ==================== BROADCAST ====================
function AdminBroadcast() {
  const store = useStore();
  const { settings, setSettings, broadcastMessages, setBroadcastMessages } = store;
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'promo' | 'alert' | 'event'>('info');
  const [icon, setIcon] = useState('📢');
  const [link, setLink] = useState('');

  const sendBroadcast = () => {
    if (!title.trim() || !message.trim()) return alert('Title and message required');
    const newMsg = {
      id: generateId(),
      title: title.trim(),
      message: message.trim(),
      icon,
      type,
      link: link.trim() || undefined,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    const updated = [...broadcastMessages, newMsg];
    setBroadcastMessages(updated);
    const updatedSettings = { ...settings, broadcastMessages: updated };
    setSettings(updatedSettings as any);
    settingsApi.update(updatedSettings);
    setTitle('');
    setMessage('');
    setLink('');
  };

  const deleteBroadcast = (id: string) => {
    const updated = broadcastMessages.filter(m => m.id !== id);
    setBroadcastMessages(updated);
    const updatedSettings = { ...settings, broadcastMessages: updated };
    setSettings(updatedSettings as any);
    settingsApi.update(updatedSettings);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📢 Broadcast Messages ({broadcastMessages.length})</h2>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">New Broadcast</h3>
        <input className="w-full p-2 border border-input rounded-lg text-xs bg-card mb-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} maxLength={50} />
        <textarea className="w-full p-2 border border-input rounded-lg text-xs bg-card mb-2 resize-none h-20" placeholder="Message (max 200 chars)" value={message} onChange={e => setMessage(e.target.value)} maxLength={200} />
        <div className="flex gap-2 mb-2">
          <select className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="info">ℹ️ Info</option>
            <option value="promo">🎁 Promo</option>
            <option value="alert">⚠️ Alert</option>
            <option value="event">✨ Event</option>
          </select>
          <input className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" placeholder="Icon (📢)" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} />
        </div>
        <input className="w-full p-2 border border-input rounded-lg text-[10px] bg-card mb-2" placeholder="Link (optional)" value={link} onChange={e => setLink(e.target.value)} />
        <button className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all" onClick={sendBroadcast}>
          📢 Send Broadcast
        </button>
      </div>

      <div className="space-y-1.5">
        {broadcastMessages.slice(0, 20).map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{m.icon}</span>
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{m.title}</div>
                <div className="text-[9px] text-muted-foreground">{m.message}</div>
              </div>
              <span className={cn('text-[8px] px-1.5 py-0.5 rounded', 
                m.type === 'promo' ? 'bg-orange-100 text-orange-700' : 
                m.type === 'alert' ? 'bg-red-100 text-red-700' : 
                m.type === 'event' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                {m.type}
              </span>
              <button className="text-red-500 text-[9px]" onClick={() => deleteBroadcast(m.id)}>✕</button>
            </div>
            <div className="text-[7px] text-muted-foreground mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== FLASH DEALS ====================
function AdminFlashDeals() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);

  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  const flashSales = settings.flashSales || {};

  return (
    <div>
      <h2 className="text-base font-bold mb-3">⚡ Flash Deals Management</h2>
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">Active Flash Deals</h3>
        <div className="space-y-1.5">
          {Object.entries(flashSales).map(([pid, d]: any) => {
            const p = products.find(x => x.id === Number(pid));
            const active = isFlashDealActive(d);
            return (
              <div key={pid} className="flex items-center gap-2 py-1.5 text-xs border-b border-border last:border-0">
                <img src={p?.image} className="w-8 h-8 rounded object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">{p?.nameEn || `#${pid}`}</div>
                  <div className={cn('text-[9px]', active ? 'text-green-600' : 'text-muted-foreground')}>
                    {active ? formatCountdown(d.end) : 'Expired'} · Discount: {d.discount || 20}% · Max: {d.maxQty || 50}
                  </div>
                </div>
                <button className="text-red-500 text-[9px]" onClick={() => { const fs = { ...flashSales }; delete fs[pid]; saveSetting('flashSales', fs); }}>✕</button>
              </div>
            );
          })}
        </div>
        {Object.keys(flashSales).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No flash deals</p>}
      </div>

      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-xs font-semibold mb-2">Create Flash Deal</h3>
        <div className="grid grid-cols-2 gap-2">
          <select className="p-2 border border-input rounded-lg text-[10px] bg-card col-span-2" id="fd-prod">
            <option value="">Select product...</option>
            {products.filter(p => p.inStock).map(p => <option key={p.id} value={p.id}>{p.nameEn} - {formatPrice(p.price)}</option>)}
          </select>
          <input type="datetime-local" className="p-2 border border-input rounded-lg text-[10px] bg-card" id="fd-end" />
          <input type="number" className="p-2 border border-input rounded-lg text-[10px] bg-card" id="fd-discount" placeholder="Discount %" defaultValue={20} min={5} max={90} />
          <input type="number" className="p-2 border border-input rounded-lg text-[10px] bg-card" id="fd-qty" placeholder="Max quantity" defaultValue={50} />
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold col-span-2" onClick={() => {
            const pid = (document.getElementById('fd-prod') as HTMLSelectElement)?.value;
            const end = (document.getElementById('fd-end') as HTMLInputElement)?.value;
            const disc = Number((document.getElementById('fd-discount') as HTMLInputElement)?.value) || 20;
            const qty = Number((document.getElementById('fd-qty') as HTMLInputElement)?.value) || 50;
            if (!pid || !end) return alert('Select product and end time');
            const fs = { ...flashSales, [pid]: { end: new Date(end).getTime(), startedAt: Date.now(), discount: disc, maxQty: qty } };
            saveSetting('flashSales', fs);
          }}>+ Create Flash Deal</button>
        </div>
      </div>
    </div>
  );
}

// ==================== PRE-ORDERS ====================
function AdminPreOrders() {
  const store = useStore();
  const { preOrders, settings, setSettings } = store;
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { productsApi.list().then(d => setProducts(d?.products || [])).catch(() => {}); }, []);

  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🚀 Pre-Orders ({preOrders.length})</h2>

      {/* Settings */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">⚙️ Pre-Order Settings</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px]">
            <input type="checkbox" checked={settings.preOrderEnabled !== false} onChange={e => saveSetting('preOrderEnabled', e.target.checked)} className="rounded" />
            Enable Pre-Orders
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">Default Deposit %:</span>
            <input type="number" className="w-20 p-1.5 border border-input rounded text-[10px] bg-card" value={settings.preOrderDefaultDeposit || 30} onChange={e => saveSetting('preOrderDefaultDeposit', Number(e.target.value))} min={5} max={90} />
          </div>
        </div>
      </div>

      {/* Pre-Order List */}
      <div className="space-y-1.5">
        {preOrders.slice(0, 30).map(po => (
          <div key={po.id} className="bg-card rounded-xl border border-border p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-primary">{po.orderNumber}</span>
              <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-semibold">{po.status}</span>
            </div>
            <div className="text-[9px] mt-1">{po.productName} · Deposit: {formatPrice(po.deposit)} · Total: {formatPrice(po.totalPrice)}</div>
            <div className="text-[8px] text-muted-foreground">
              Release: {po.releaseDate ? new Date(po.releaseDate).toLocaleDateString() : 'TBA'} · Created: {po.createdAt ? new Date(po.createdAt).toLocaleString() : ''}
            </div>
          </div>
        ))}
      </div>
      {preOrders.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No pre-orders</p>}
    </div>
  );
}

// ==================== TRACKING ====================
function AdminTracking() {
  const store = useStore();
  const { orders, orderTracking, setOrderTracking, digitalReceipts, setDigitalReceipt } = store;
  const [selectedOrder, setSelectedOrder] = useState('');
  const [carrier, setCarrier] = useState('Ethio Express');
  const [trackingNum, setTrackingNum] = useState('');
  const [status, setStatus] = useState('shipped');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const addTracking = () => {
    if (!selectedOrder) return alert('Select an order');
    const tracking = {
      carrier,
      trackingNumber: trackingNum || `ET-${Date.now().toString(36).toUpperCase()}`,
      status,
      lastUpdate: new Date().toISOString(),
      estimatedDelivery: estimatedDelivery || new Date(Date.now() + 3 * 86400000).toLocaleDateString(),
      coordinates: { lat: 9.03, lng: 38.74 },
      timeline: [
        { label: 'Order Placed', time: new Date().toLocaleString(), completed: true, location: 'Addis Ababa' },
        { label: 'Processing', time: new Date().toLocaleString(), completed: true, location: 'Warehouse' },
        { label: 'In Transit', time: new Date().toLocaleString(), completed: status !== 'pending', location: 'In transit' },
        { label: 'Out for Delivery', time: new Date().toLocaleString(), completed: false, location: '' },
        { label: 'Delivered', time: '', completed: false, location: '' },
      ],
    };
    setOrderTracking(selectedOrder, tracking);
  };

  const generateReceipt = (orderNumber: string) => {
    const url = `receipt-${orderNumber}.html`;
    setDigitalReceipt(orderNumber, url);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">📍 Order Tracking</h2>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">Add Tracking</h3>
        <select className="w-full p-2 border border-input rounded-lg text-[10px] bg-card mb-2" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}>
          <option value="">Select order...</option>
          {orders.map(o => <option key={o.orderNumber} value={o.orderNumber}>{o.orderNumber} - {o.customer?.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="p-2 border border-input rounded-lg text-[10px] bg-card" placeholder="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} />
          <input className="p-2 border border-input rounded-lg text-[10px] bg-card" placeholder="Tracking #" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
          <select className="p-2 border border-input rounded-lg text-[10px] bg-card" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
          <input className="p-2 border border-input rounded-lg text-[10px] bg-card" placeholder="ETA Date" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} />
        </div>
        <button className="w-full py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={addTracking}>+ Add Tracking</button>
      </div>

      {/* Tracked Orders */}
      <div className="space-y-1.5">
        {Object.entries(orderTracking).slice(0, 10).map(([orderNum, t]: any) => (
          <div key={orderNum} className="bg-card rounded-xl border border-border p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-primary">{orderNum}</span>
              <span className="text-[8px] text-muted-foreground">{t.carrier}</span>
            </div>
            <div className="text-[9px] mt-0.5">Tracking: {t.trackingNumber} · Status: {t.status}</div>
            <div className="text-[8px] text-muted-foreground">ETA: {t.estimatedDelivery}</div>
            <button className="mt-1 text-[9px] text-primary font-semibold" onClick={() => generateReceipt(orderNum)}>
              📄 Generate Receipt
            </button>
          </div>
        ))}
      </div>
      {Object.keys(orderTracking).length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No tracking data</p>}
    </div>
  );
}

// ==================== THEMES ====================
function AdminThemes() {
  const store = useStore();
  const { themePreset, setThemePreset, customAccent, setCustomAccent } = store;

  const THEMES = [
    { id: 'default' as const, name: 'Default', colors: ['#6C63FF', '#8B5CF6', '#4F46E5'], icon: '💎' },
    { id: 'ocean' as const, name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#0284C7'], icon: '🌊' },
    { id: 'forest' as const, name: 'Forest', colors: ['#10B981', '#34D399', '#059669'], icon: '🌿' },
    { id: 'sunset' as const, name: 'Sunset', colors: ['#F59E0B', '#F97316', '#D97706'], icon: '🌅' },
    { id: 'midnight' as const, name: 'Midnight', colors: ['#6366F1', '#818CF8', '#4338CA'], icon: '🌙' },
    { id: 'rose' as const, name: 'Rose', colors: ['#EC4899', '#F43F5E', '#DB2777'], icon: '🌹' },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🎨 Theme Management</h2>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">Theme Presets</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(t => (
            <button key={t.id} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all', themePreset === t.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30')} onClick={() => setThemePreset(t.id)}>
              <div className="flex gap-1">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[9px] font-medium">{t.icon} {t.name}</span>
              {themePreset === t.id && <div className="text-[8px] text-primary font-semibold">✓ Active</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-xs font-semibold mb-2">Custom Accent Color</h3>
        <div className="flex items-center gap-3">
          <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border border-border" value={customAccent} onChange={e => setCustomAccent(e.target.value)} />
          <div className="flex-1">
            <div className="text-[10px] font-medium">Accent Color</div>
            <div className="text-[8px] text-muted-foreground">{customAccent}</div>
          </div>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-semibold" onClick={() => {
            document.documentElement.style.setProperty('--accent-color', customAccent);
            document.documentElement.style.setProperty('--primary', customAccent);
          }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ==================== COUPONS ====================
function AdminCoupons() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);

  const coupons = settings.coupons || [];
  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  const saveCoupon = () => {
    if (!code) return;
    const newCoupons = [...coupons, { code: code.toUpperCase(), discount, used: 0, active: true, createdAt: new Date().toISOString() }];
    saveSetting('coupons', newCoupons);
    setCode('');
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">🏷️ Coupons ({coupons.length})</h2>
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">New Coupon</h3>
        <div className="flex gap-2">
          <input className="flex-1 p-2 border border-input rounded-lg text-xs bg-card uppercase" placeholder="CODE" value={code} onChange={e => setCode(e.target.value)} />
          <input className="w-16 p-2 border border-input rounded-lg text-xs bg-card text-center" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={saveCoupon}>+</button>
        </div>
      </div>
      <div className="space-y-1.5">
        {coupons.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 bg-card rounded-xl border border-border p-2.5 text-xs">
            <span>🏷️</span>
            <span className="font-bold text-primary font-mono">{c.code}</span>
            <span className="text-muted-foreground">{c.discount}%</span>
            <span className="text-muted-foreground text-[9px]">Used: {c.used || 0}</span>
            <span className={cn('ml-auto px-1.5 py-0.5 rounded text-[9px]', c.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>{c.active !== false ? 'Active' : 'Inactive'}</span>
            <button className="text-red-500 text-[9px]" onClick={() => saveSetting('coupons', coupons.filter((_: any, j: number) => j !== i))}>🗑️</button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No coupons</p>}
      </div>
    </div>
  );
}

// ==================== SETTINGS ====================
function AdminSettings() {
  const store = useStore();
  const { settings, setSettings } = store;
  const [commission, setCommission] = useState(settings.vendorCommission || 10);
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 50);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThreshold || 1000);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(settings.priceAlertEnabled !== false);

  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated as any);
    settingsApi.update(updated);
  };

  const saveAll = () => {
    saveSetting('vendorCommission', commission);
    saveSetting('deliveryFee', deliveryFee);
    saveSetting('freeDeliveryThreshold', freeThreshold);
    saveSetting('priceAlertEnabled', priceAlertEnabled);
  };

  return (
    <div>
      <h2 className="text-base font-bold mb-3">⚙️ Settings</h2>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">💰 Commission & Fees</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-32">Vendor Commission %:</span>
            <input type="number" className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" value={commission} onChange={e => setCommission(Number(e.target.value))} min={0} max={50} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-32">Delivery Fee (Br):</span>
            <input type="number" className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} min={0} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-32">Free Delivery Over Br:</span>
            <input type="number" className="flex-1 p-2 border border-input rounded-lg text-[10px] bg-card" value={freeThreshold} onChange={e => setFreeThreshold(Number(e.target.value))} min={0} />
          </div>
          <button className="w-full py-2 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={saveAll}>💾 Save Settings</button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">🔔 Price Alerts</h3>
        <label className="flex items-center gap-2 text-[10px]">
          <input type="checkbox" checked={priceAlertEnabled} onChange={e => { setPriceAlertEnabled(e.target.checked); saveSetting('priceAlertEnabled', e.target.checked); }} className="rounded" />
          Enable Price Drop Alerts
        </label>
        <p className="text-[8px] text-muted-foreground mt-1">Users can track product prices and get notified on drops</p>
      </div>
    </div>
  );
}
