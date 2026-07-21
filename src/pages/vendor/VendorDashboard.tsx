import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { Store, Package, ShoppingCart, TrendingUp, Settings, LogOut, Menu, X, BarChart3, Plus, Edit3, Eye, Save, Image, Tag, Ruler, Palette, Box, BarChart2, DollarSign, Star, ClipboardList, Truck, RefreshCw, Camera, Link2, AlertTriangle, Trophy } from 'lucide-react';
import { toast } from '@/components/Toast';

type VendorTab = 'overview' | 'products' | 'orders' | 'analytics' | 'settings';

interface ProductForm {
  nameEn: string;
  name: string;
  price: string;
  originalPrice: string;
  stockCount: string;
  category: string;
  description: string;
  descriptionEn: string;
  brand: string;
  sku: string;
  colors: string[];
  sizes: string[];
  features: string[];
  imageUrl: string;
  localImages: string[];
  badge: string;
}

const CATEGORIES = [
  { value: 'electronics', label: '📱 Tech' },
  { value: 'fashion', label: '👗 Fashion' },
  { value: 'home', label: '🏠 Home' },
  { value: 'beauty', label: '💄 Beauty' },
  { value: 'groceries', label: '🍎 Food' },
  { value: 'books', label: '📚 Books' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'baby', label: '👶 Baby' },
];

const BADGES = [
  { value: '', label: 'None' },
  { value: 'sale', label: '🔥 Sale' },
  { value: 'hot', label: '🔥 Hot' },
  { value: 'new', label: '🆕 New' },
  { value: 'best-seller', label: '🏆 Best Seller' },
  { value: 'popular', label: '⭐ Popular' },
  { value: 'premium', label: '💎 Premium' },
];

export default function VendorDashboard() {
  const [tab, setTab] = useState<VendorTab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const store = useStore();
  const { products } = store;

  const vendorId = 1;
  const vendorProducts = products.filter(p => p.vendorId === vendorId);
  const vendorName = vendorProducts[0]?.vendorName || 'My Store';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto h-full flex items-center px-4 gap-2">
          <button className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">🏪</div>
            <div>
              <div className="text-sm font-bold">{vendorName}</div>
              <div className="text-[7px] text-slate-400 uppercase tracking-widest">Vendor Dashboard</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-[9px] text-slate-400"><Store size={12} className="inline mr-1" />{vendorProducts.length} products</span>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-semibold" onClick={() => navigate('/')}>Back to Store</button>
          </div>
        </div>
      </header>

      <aside className={`fixed top-12 left-0 bottom-0 w-52 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="py-2 px-1.5 space-y-0.5">
          {[
            { id: 'overview' as VendorTab, icon: BarChart3, label: 'Overview' },
            { id: 'products' as VendorTab, icon: Package, label: 'Products' },
            { id: 'orders' as VendorTab, icon: ShoppingCart, label: 'Orders' },
            { id: 'analytics' as VendorTab, icon: TrendingUp, label: 'Analytics' },
            { id: 'settings' as VendorTab, icon: Settings, label: 'Settings' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all', tab === item.id ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => { setTab(item.id); setMenuOpen(false); }}>
                <Icon size={15} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 dark:border-slate-800">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50" onClick={() => { store.setProfile({ name: '', phone: '', registered: false, joinedAt: '' }); navigate('/'); }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <main className="lg:ml-52 pt-12 min-h-screen">
        <div className="p-4 max-w-6xl mx-auto">
          {tab === 'overview' && <VendorOverview products={vendorProducts} />}
          {tab === 'products' && <VendorProducts products={vendorProducts} />}
          {tab === 'orders' && <VendorOrders />}
          {tab === 'analytics' && <VendorAnalytics products={vendorProducts} />}
          {tab === 'settings' && <VendorSettings />}
        </div>
      </main>
    </div>
  );
}

function VendorOverview({ products }: { products: any[] }) {
  const totalSales = products.reduce((s, p) => s + (p.soldCount || 0), 0);
  const totalRevenue = products.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
  const lowStock = products.filter(p => p.stockCount <= 5);
  const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
  const avgRating = products.reduce((s, p) => s + (p.rating || 0), 0) / (products.length || 1);

  return (
    <div className="space-y-4 animate-fadeUp">
      <h2 className="text-lg font-bold">📊 Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Products', val: products.length, icon: '📦', change: '+2 this month' },
          { label: 'Total Sales', val: totalSales, icon: '🛍️', change: '+12% vs last month' },
          { label: 'Revenue', val: `Br ${totalRevenue.toLocaleString()}`, icon: '💰', change: 'Br 0 pending' },
          { label: 'Avg Rating', val: avgRating.toFixed(1), icon: '⭐', change: `${products.length} reviews` },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between">
              <div className="text-lg">{s.icon}</div>
              <span className="text-[8px] text-emerald-600 font-medium">{s.change}</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{s.val}</div>
            <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Low Stock Alert</h3>
            <span className="text-[9px] bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">{lowStock.length}</span>
          </div>
          {lowStock.slice(0, 4).map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-800/20 last:border-0">
              <img src={p.image} className="w-6 h-6 rounded object-cover" />
              <span className="flex-1">{p.nameEn}</span>
              <span className="font-bold">{p.stockCount} left</span>
              <span className="text-[9px] text-amber-500">Restock soon</span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'In Stock', val: products.filter(p => p.inStock && p.stockCount > 5).length, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Low Stock', val: lowStock.length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Out of Stock', val: products.filter(p => !p.inStock || p.stockCount === 0).length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
          { label: 'Total Views', val: totalViews, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-xl p-3', s.bg)}>
            <div className={cn('text-lg font-extrabold', s.color)}>{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2">
          <Truck size={16} />
          <div>
            <div className="text-sm font-bold">Quick Tip</div>
            <div className="text-[10px] opacity-80">Add detailed product descriptions and high-quality images to increase sales by up to 30%!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorProducts({ products }: { products: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [livePreview, setLivePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);

  const defaultForm: ProductForm = {
    nameEn: '', name: '', price: '', originalPrice: '', stockCount: '10',
    category: 'electronics', description: '', descriptionEn: '',
    brand: '', sku: `SKU-${generateId().substring(0, 8).toUpperCase()}`,
    colors: [], sizes: [], features: [],
    imageUrl: '', localImages: [], badge: '',
  };

  const [form, setForm] = useState<ProductForm>(defaultForm);

  // Auto-generate SKU when name changes
  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, nameEn: val, sku: val.trim() ? `SKU-${val.trim().substring(0, 4).toUpperCase()}-${generateId().substring(0, 4).toUpperCase()}` : f.sku }));
  };

  const addColor = () => {
    const c = prompt('Enter color name or hex (e.g. Red or #FF0000):');
    if (c && c.trim()) setForm(f => ({ ...f, colors: [...f.colors, c.trim()] }));
  };

  const addSize = () => {
    const s = prompt('Enter size (e.g. M, XL, 42):');
    if (s && s.trim()) setForm(f => ({ ...f, sizes: [...f.sizes, s.trim()] }));
  };

  const addFeature = () => {
    const f = prompt('Enter product feature:');
    if (f && f.trim()) setForm(fa => ({ ...fa, features: [...fa.features, f.trim()] }));
  };

  const handleLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).slice(0, 5).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, localImages: [...f.localImages, ev.target?.result as string].slice(0, 5) }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) setForm(f => ({ ...f, imageUrl: url.trim() }));
  };

  const productPreview = {
    nameEn: form.nameEn || 'Product Name',
    name: form.name || form.nameEn || 'የምርት ስም',
    price: Number(form.price) || 0,
    originalPrice: Number(form.originalPrice) || null,
    stockCount: Number(form.stockCount) || 0,
    category: form.category,
    badge: form.badge,
    image: form.localImages[0] || form.imageUrl || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=📦',
    colors: form.colors,
    sizes: form.sizes,
    features: form.features,
    brand: form.brand,
  };

  const handleAddProduct = async () => {
    if (!form.nameEn.trim() || !form.price) return alert('Product name and price required');
    setAdding(true);
    try {
      const { productsApi } = await import('@/lib/api');
      const mainImage = form.imageUrl || form.localImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
      await productsApi.create({
        nameEn: form.nameEn.trim(),
        name: form.name.trim() || form.nameEn.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || null,
        stockCount: Number(form.stockCount) || 10,
        category: form.category,
        description: form.description || '',
        descriptionEn: form.descriptionEn || form.description || '',
        brand: form.brand || '',
        sku: form.sku || '',
        colors: form.colors,
        sizes: form.sizes,
        features: form.features,
        image: mainImage,
        images: [...form.localImages, form.imageUrl].filter(Boolean),
        badge: form.badge || '',
        vendorId: 1,
        vendorName: 'My Store',
        inStock: true,
        visible: true,
      });
      toast('✅ Product added to your store!', 'success');
      setShowForm(false);
      setForm(defaultForm);
    } catch {
      toast('Failed to add product', 'error');
    }
    setAdding(false);
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📦 Products ({products.length})</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-primary text-white rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-primary/90 transition-colors"
            onClick={() => setShowForm(!showForm)}>
            <Plus size={12} /> {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4 animate-slideUp">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">New Product</h3>
            <button className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold border transition-all', livePreview ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-200')}
              onClick={() => setLivePreview(!livePreview)}>
              <Eye size={11} className="inline mr-1" />{livePreview ? 'Hide Preview' : 'Live Preview'}
            </button>
          </div>

          {/* Live Preview */}
          {livePreview && (
            <div className="mb-4 p-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">🔮 Product Preview</h4>
              <div className="flex gap-3">
                <img src={productPreview.image} className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{productPreview.nameEn}</div>
                  <div className="text-[9px] text-slate-500">{productPreview.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-emerald-600">{formatPrice(productPreview.price)}</span>
                    {productPreview.originalPrice && <span className="text-[9px] text-slate-400 line-through">{formatPrice(productPreview.originalPrice)}</span>}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {productPreview.colors.map((c, i) => <div key={i} className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.includes('#') ? c : undefined }} title={c} />)}
                    {productPreview.sizes.map((s, i) => <span key={i} className="text-[8px] px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">{s}</span>)}
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Brand: {productPreview.brand || 'N/A'} · Stock: {productPreview.stockCount}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Images */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">📸 Images</label>
              <div className="flex gap-2 flex-wrap">
                {form.localImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                    <button className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]"
                      onClick={() => setForm(f => ({ ...f, localImages: f.localImages.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                ))}
                <button className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={16} />
                </button>
                <button className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors" onClick={handleImageUrl}>
                  <Link2 size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleLocalImage} />
              </div>
            </div>

            {/* Basic Info */}
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Product Name *</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="e.g. Wireless Headphones" value={form.nameEn} onChange={e => handleNameChange(e.target.value)} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Amharic Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="የምርት ስም" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Brand</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="e.g. Samsung, Nike" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>

            {/* Pricing */}
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Price (Br) *</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="1999" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Original Price (Br)</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="2499" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Badge</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                {BADGES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            {/* Inventory */}
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Stock Count</label><input type="number" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="50" value={form.stockCount} onChange={e => setForm(f => ({ ...f, stockCount: e.target.value }))} /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">SKU (Auto-generated)</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-XXXX" /></div>
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
              <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Sizes, Colors, Features */}
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">🎨 Colors</label>
              <div className="flex gap-1 flex-wrap mb-1">
                {form.colors.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px]">
                    {c.includes('#') ? <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c }} /> : null}
                    {c}
                    <button className="text-red-400 hover:text-red-600" onClick={() => setForm(f => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}>✕</button>
                  </span>
                ))}
                <button className="px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-[9px] text-slate-400 hover:border-primary transition-colors" onClick={addColor}>+</button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">📏 Sizes</label>
              <div className="flex gap-1 flex-wrap mb-1">
                {form.sizes.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px]">
                    {s}
                    <button className="text-red-400 hover:text-red-600" onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter((_, j) => j !== i) }))}>✕</button>
                  </span>
                ))}
                <button className="px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-[9px] text-slate-400 hover:border-primary transition-colors" onClick={addSize}>+</button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">✨ Features</label>
              <div className="flex gap-1 flex-wrap mb-1">
                {form.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px]">
                    {f}
                    <button className="text-red-400 hover:text-red-600" onClick={() => setForm(fa => ({ ...fa, features: fa.features.filter((_, j) => j !== i) }))}>✕</button>
                  </span>
                ))}
                <button className="px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-[9px] text-slate-400 hover:border-primary transition-colors" onClick={addFeature}>+</button>
              </div>
            </div>

            {/* Descriptions */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description (English)</label>
              <textarea className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-16" placeholder="Product description in English" value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description (Amharic)</label>
              <textarea className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent resize-none h-16" placeholder="የምርት መግለጫ" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
            onClick={handleAddProduct} disabled={adding || !form.nameEn.trim() || !form.price}>
            {adding ? <><RefreshCw size={12} className="animate-spin" /> Adding...</> : <><Plus size={14} /> Add Product to Store</>}
          </button>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400 mb-1">No products yet</p>
            <p className="text-[9px] text-slate-400">Click "Add Product" to list your first item!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{p.nameEn}</div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                    <span>{formatPrice(p.price)}</span>
                    <span>·</span>
                    <span>{p.soldCount || 0} sold</span>
                    <span>·</span>
                    <span className={cn('font-semibold', p.stockCount > 10 ? 'text-green-600' : p.stockCount > 0 ? 'text-amber-600' : 'text-red-600')}>
                      Stock: {p.stockCount}
                    </span>
                    {p.sku && <span className="font-mono text-slate-400">· {p.sku}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="View"><Eye size={13} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Edit"><Edit3 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorOrders() {
  const store = useStore();
  const { orders } = store;

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">📋 Orders ({orders.length})</h2>
      </div>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-400">No orders yet</p>
          <p className="text-[9px] text-slate-400 mt-1">Orders will appear here when customers purchase your products</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.slice(0, 20).map(o => (
              <div key={o.orderNumber} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-indigo-600">{o.orderNumber}</span>
                  <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-semibold',
                    o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  )}>{o.status}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {o.customer?.name} · {o.date} · {formatPrice(o.total || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VendorAnalytics({ products }: { products: any[] }) {
  const totalRevenue = products.reduce((s, p) => s + (p.soldCount || 0) * p.price, 0);
  const totalSales = products.reduce((s, p) => s + (p.soldCount || 0), 0);
  const avgRating = products.length > 0 ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0';

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">📈 Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', val: `Br ${totalRevenue.toLocaleString()}`, icon: DollarSign, change: '+12%', color: 'text-emerald-600' },
          { label: 'Sales', val: totalSales, icon: ShoppingCart, change: '+8%', color: 'text-blue-600' },
          { label: 'Rating', val: avgRating, icon: Star, change: '★', color: 'text-amber-600' },
          { label: 'Conversion', val: '3.2%', icon: TrendingUp, change: '+0.5%', color: 'text-purple-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start justify-between mb-1">
                <Icon size={16} className="text-slate-400" />
                <span className="text-[9px] text-green-600 font-semibold">{s.change}</span>
              </div>
              <div className={cn('text-lg font-bold mt-1', s.color)}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">📊 Sales Performance</h3>
        <div className="h-32 flex items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:opacity-80" style={{ height: `${h}%` }} />
              <span className="text-[7px] text-slate-400">Day {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Trophy size={14} className="text-amber-500" /> Top Products</h3>
        {products.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5).map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className={cn('font-bold w-5', i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300')}>{i + 1}</span>
            <img src={p.image} className="w-6 h-6 rounded object-cover" />
            <span className="flex-1 truncate">{p.nameEn}</span>
            <span className="text-slate-500">{p.soldCount || 0} sold</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice((p.soldCount || 0) * p.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorSettings() {
  const [storeName, setStoreName] = useState('My Store');
  const [email, setEmail] = useState('vendor@mystore.com');
  const [phone, setPhone] = useState('+251-911-XXXXXX');
  const [bio, setBio] = useState('');

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold">⚙️ Settings</h2>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3">Store Profile</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Name</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Store Bio</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell customers about your store" /></div>
        </div>
        <button className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors" 
          onClick={() => toast('✅ Store settings saved!', 'success')}>
          <Save size={12} className="inline mr-1" /> Save Changes
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><DollarSign size={14} className="text-emerald-500" /> Commission Rate</h3>
          <p className="text-xs text-slate-500">Your current commission rate: <strong className="text-slate-800 dark:text-slate-200">10%</strong></p>
          <p className="text-[9px] text-slate-400 mt-1">Commission is deducted from each sale</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><ClipboardList size={14} className="text-indigo-500" /> Store Status</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-600">Active</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Your store is live and visible to customers</p>
        </div>
      </div>
    </div>
  );
}
