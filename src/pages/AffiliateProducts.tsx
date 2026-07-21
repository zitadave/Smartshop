import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { ChevronLeft, Share2, Copy, Star, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/Toast';

/** Affiliate: each product has its OWN unique link. Commission ONLY on sale of that specific product. */
export default function AffiliateProducts() {
  const navigate = useNavigate();
  const { products, settings, addNotification, addLoyaltyPoints } = useStore();

  // Generate a unique per-user affiliate code from profile name
  const [userCode] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      return p.name ? p.name.substring(0, 4).toUpperCase() : 'AFF' + generateId().substring(0, 4).toUpperCase();
    } catch { return 'AFF' + generateId().substring(0, 4).toUpperCase(); }
  });

  // Per-product stats persisted separately
  const [productStats, setProductStats] = useState<Record<number, { clicks: number; sales: number; commission: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('ss_affiliate_product_stats') || '{}'); }
    catch { return {}; }
  });

  const [totalStats, setTotalStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_affiliate_totals') || '{"clicks":0,"sales":0,"commission":0}'); }
    catch { return { clicks: 0, sales: 0, commission: 0 }; }
  });

  const commissionPercent = (settings as any)?.affiliateCommission || 10;

  // Save stats
  const saveStats = (pid: number, newProdStats: any, newTotals: any) => {
    localStorage.setItem('ss_affiliate_product_stats', JSON.stringify(newProdStats));
    localStorage.setItem('ss_affiliate_totals', JSON.stringify(newTotals));
  };

  const copyProductLink = (product: any) => {
    const link = `https://moonlit-kheer-826ac2.netlify.app/product/${product.id}?ref=${userCode}`;
    navigator.clipboard.writeText(link);
    // Update stats
    const prod = productStats[product.id] || { clicks: 0, sales: 0, commission: 0 };
    const newProdStats = { ...productStats, [product.id]: { ...prod, clicks: prod.clicks + 1 } };
    const newTotals = { ...totalStats, clicks: totalStats.clicks + 1 };
    setProductStats(newProdStats);
    setTotalStats(newTotals);
    saveStats(product.id, newProdStats, newTotals);
    toast(`📋 ${product.nameEn} link copied! Earn ${commissionPercent}% if it sells!`, 'success');
  };

  const shareProduct = async (product: any) => {
    const link = `https://moonlit-kheer-826ac2.netlify.app/product/${product.id}?ref=${userCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.nameEn, text: `Check out ${product.nameEn} on Smart Shop!`, url: link });
      } catch {}
    } else {
      copyProductLink(product);
    }
  };

  // Simulate a sale for a specific product
  const simulateSale = (product: any) => {
    const commission = Math.round(product.price * (commissionPercent / 100));
    const prod = productStats[product.id] || { clicks: 0, sales: 0, commission: 0 };
    const newProdStats = { ...productStats, [product.id]: { ...prod, sales: prod.sales + 1, commission: prod.commission + commission } };
    const newTotals = { ...totalStats, sales: totalStats.sales + 1, commission: totalStats.commission + commission };
    setProductStats(newProdStats);
    setTotalStats(newTotals);
    saveStats(product.id, newProdStats, newTotals);
    addLoyaltyPoints(Math.round(commission / 10));
    addNotification('💰', `🎉 You earned Br ${commission} commission from ${product.nameEn} sale!`);
    toast(`🎉 Br ${commission} earned from ${product.nameEn} referral sale!`, 'success');
  };

  const topProducts = products.filter(p => p.inStock && p.rating >= 3).slice(0, 12);

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="text-base font-bold">🤝 Affiliate Program</h2>
          <p className="text-[9px] text-muted-foreground">Your code: <strong className="text-primary">{userCode}</strong> · Earn {commissionPercent}% per sale</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: '📤', label: 'Clicks', val: totalStats.clicks, color: 'text-blue-600' },
          { icon: '🛒', label: 'Sales', val: totalStats.sales, color: 'text-green-600' },
          { icon: '💰', label: 'Commission', val: `Br ${totalStats.commission}`, color: 'text-emerald-600' },
          { icon: '📊', label: 'Conversion', val: totalStats.clicks > 0 ? `${Math.round((totalStats.sales / totalStats.clicks) * 100)}%` : '0%', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-2 text-center">
            <div className="text-sm">{s.icon}</div>
            <div className={cn('text-xs font-extrabold mt-0.5', s.color)}>{s.val}</div>
            <div className="text-[7px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white mb-4 shadow-lg">
        <h3 className="text-xs font-bold mb-1">How it Works</h3>
        <ul className="text-[9px] opacity-90 space-y-1 mt-2">
          <li>1️⃣ Tap any product below to copy its <strong>unique link</strong></li>
          <li>2️⃣ Share that link with friends & followers</li>
          <li>3️⃣ You earn <strong>{commissionPercent}% commission</strong> when <strong>that specific product sells</strong></li>
        </ul>
        <p className="text-[8px] opacity-60 mt-2">⚠️ Commission only on purchases of the shared product through your link</p>
      </div>

      {/* Per-Product Affiliate Links */}
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <TrendingUp size={12} /> Products — Tap to get unique affiliate link
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {topProducts.map(p => {
          const stat = productStats[p.id];
          return (
            <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
              <img src={p.image} className="w-full h-20 object-cover cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
              <div className="p-2">
                <div className="text-[9px] font-semibold truncate">{p.nameEn}</div>
                <div className="text-[9px] text-primary font-bold mt-0.5">{formatPrice(p.price)}</div>
                <div className="text-[7px] text-muted-foreground">
                  Earn ~Br {Math.round(p.price * commissionPercent / 100)}/sale
                  {stat && stat.clicks > 0 && <span> · {stat.clicks} clicks</span>}
                  {stat && stat.sales > 0 && <span className="text-green-600"> · {stat.sales} sold!</span>}
                </div>
                <div className="flex gap-1 mt-1.5">
                  <button className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[8px] font-semibold flex items-center justify-center gap-0.5"
                    onClick={() => copyProductLink(p)}>
                    <Copy size={9} /> Copy Link
                  </button>
                  <button className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors" onClick={() => shareProduct(p)}>
                    <Share2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo simulate */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-3 mt-4 mb-4">
        <p className="text-[9px] text-amber-700 dark:text-amber-400">📢 Demo: Pick a product to simulate its sale (earns commission!)</p>
        <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none">
          {topProducts.slice(0, 4).map(p => (
            <button key={p.id} className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[8px] font-bold hover:bg-amber-600 whitespace-nowrap transition-colors flex items-center gap-1"
              onClick={() => simulateSale(p)}>
              <ShoppingCart size={8} /> {p.nameEn.substring(0, 12)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
