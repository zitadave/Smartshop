import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { ChevronLeft, Share2, Copy, Star, TrendingUp, DollarSign, ShoppingCart, Award, Sparkles, X, Heart } from 'lucide-react';
import { toast } from '@/components/Toast';
import { haptic } from '@/lib/confetti';

/** Affiliate: each product has its OWN unique link. Commission ONLY on sale of that specific product. */
export default function AffiliateProducts() {
  const navigate = useNavigate();
  const store = useStore();
  const { products, settings, addNotification, addToWallet, loyaltyPoints } = store;

  // Flexi-Payout Preference state
  const [payoutPref, setPayoutPref] = useState<'wallet' | 'points'>(() => {
    try { return (localStorage.getItem('ss_affiliate_pref') as 'wallet' | 'points') || 'wallet'; }
    catch { return 'wallet'; }
  });

  // Share Modal state
  const [shareProductItem, setShareProduct] = useState<any | null>(null);

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
  const pointsToCashRate = (settings as any)?.gameSettings?.pointsToCashRate || 0.5;

  const saveStats = (pid: number, newProdStats: any, newTotals: any) => {
    localStorage.setItem('ss_affiliate_product_stats', JSON.stringify(newProdStats));
    localStorage.setItem('ss_affiliate_totals', JSON.stringify(newTotals));
  };

  const changePayoutPref = (pref: 'wallet' | 'points') => {
    setPayoutPref(pref);
    try { localStorage.setItem('ss_affiliate_pref', pref); } catch {}
    toast(pref === 'points' ? '⚡ Points Booster Activated! +20% Bonus applied.' : '💰 Cash Wallet Activated.', 'success');
    haptic('light');
  };

  const copyProductLink = (product: any) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/product/${product.id}?ref=${userCode}`;
    navigator.clipboard.writeText(link);
    
    // Update stats
    const prod = productStats[product.id] || { clicks: 0, sales: 0, commission: 0 };
    const newProdStats = { ...productStats, [product.id]: { ...prod, clicks: prod.clicks + 1 } };
    const newTotals = { ...totalStats, clicks: totalStats.clicks + 1 };
    setProductStats(newProdStats);
    setTotalStats(newTotals);
    saveStats(product.id, newProdStats, newTotals);
    toast(`📋 Link copied! Earn ${commissionPercent}% if it sells!`, 'success');
    haptic('light');
  };

  const openShareModal = (product: any) => {
    setShareProduct(product);
    haptic('light');
  };

  const handleNativeShare = async (product: any) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/product/${product.id}?ref=${userCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: product.nameEn, 
          text: `Check out ${product.nameEn} on Smart Shop!`, 
          url: link 
        });
        setShareProduct(null);
        haptic('success');
      } catch (err) {
        console.warn('Native share cancelled:', err);
      }
    } else {
      copyProductLink(product);
      setShareProduct(null);
    }
  };

  // Simulate a sale for a specific product
  const simulateSale = (product: any) => {
    const cashCommission = Math.round(product.price * (commissionPercent / 100));
    
    // Points Conversion: 1 Br cash normally equals 2 Pts. Points Booster adds 20% extra!
    const pointsMultiplier = 1 / pointsToCashRate; // e.g. 1 / 0.5 = 2 points per Birr
    const pointsNormal = Math.round(cashCommission * pointsMultiplier);
    const pointsBoosted = Math.round(pointsNormal * 1.20); // 20% bonus!
    
    const prod = productStats[product.id] || { clicks: 0, sales: 0, commission: 0 };
    const earnedVal = payoutPref === 'points' ? pointsBoosted : cashCommission;

    const newProdStats = { 
      ...productStats, 
      [product.id]: { 
        ...prod, 
        sales: prod.sales + 1, 
        commission: prod.commission + cashCommission 
      } 
    };
    const newTotals = { 
      ...totalStats, 
      sales: totalStats.sales + 1, 
      commission: totalStats.commission + cashCommission 
    };

    setProductStats(newProdStats);
    setTotalStats(newTotals);
    saveStats(product.id, newProdStats, newTotals);

    if (payoutPref === 'points') {
      // Award boosted loyalty points
      const curPts = parseInt(localStorage.getItem('ss_loyalty') || '0');
      const newPts = curPts + pointsBoosted;
      localStorage.setItem('ss_loyalty', String(newPts));
      useStore.setState({ loyaltyPoints: newPts });
      
      addNotification('🏆', `🎉 Earned ${pointsBoosted} boosted Pts from ${product.nameEn} affiliate sale!`);
      toast(`🎉 +${pointsBoosted} Loyalty Points added with Booster!`, 'success');
    } else {
      // Award raw Birr cash to wallet
      addToWallet(cashCommission, 'affiliate');
      addNotification('💰', `🎉 Br ${cashCommission} deposited to your wallet from ${product.nameEn} affiliate sale!`);
      toast(`🎉 Br ${cashCommission} deposited to your wallet!`, 'success');
    }
    haptic('success');
  };

  const topProducts = products.filter(p => p.inStock && p.rating >= 3).slice(0, 12);

  return (
    <div className="px-3 pt-3 pb-8 max-w-lg mx-auto animate-fadeUp">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="text-base font-bold">🤝 Affiliate Program</h2>
          <p className="text-[9px] text-muted-foreground">Your code: <strong className="text-primary">{userCode}</strong> · Earn {commissionPercent}% per sale</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: '📤', label: 'Clicks', val: totalStats.clicks, color: 'text-blue-600' },
          { icon: '🛒', label: 'Sales', val: totalStats.sales, color: 'text-green-600' },
          { icon: '💰', label: 'Earnings', val: payoutPref === 'points' ? `${Math.round(totalStats.commission * (1 / pointsToCashRate) * 1.20)} Pts` : `Br ${totalStats.commission}`, color: payoutPref === 'points' ? 'text-amber-500' : 'text-emerald-600' },
          { icon: '📊', label: 'Conversion', val: totalStats.clicks > 0 ? `${Math.round((totalStats.sales / totalStats.clicks) * 100)}%` : '0%', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-2 text-center shadow-sm">
            <div className="text-sm">{s.icon}</div>
            <div className={cn('text-xs font-extrabold mt-0.5', s.color)}>{s.val}</div>
            <div className="text-[7px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Flexi-Payout Preference Card (UNPRECEDENTED) */}
      <div className="bg-card rounded-2xl border border-border/80 p-3.5 mb-4 shadow-sm">
        <h3 className="text-xs font-bold mb-1 flex items-center gap-1.5"><Award size={14} className="text-amber-500 animate-pulse" /> Preferred Earnings Preference</h3>
        <p className="text-[8.5px] text-slate-400">Choose how your sales commissions are paid out. Points Booster adds 20% more value!</p>
        
        <div className="flex gap-2 mt-3 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
          <button 
            onClick={() => changePayoutPref('wallet')}
            className={cn('flex-1 py-2 text-[10px] font-bold rounded-lg transition-all', payoutPref === 'wallet' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400')}
          >
            💰 Cash Wallet (Br)
          </button>
          <button 
            onClick={() => changePayoutPref('points')}
            className={cn('flex-1 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1', payoutPref === 'points' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-slate-400')}
          >
            ⚡ Points Booster (+20%)
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white mb-4 shadow-lg">
        <h3 className="text-xs font-bold mb-1">How it Works</h3>
        <ul className="text-[9px] opacity-95 space-y-1.5 mt-2">
          <li>1️⃣ Tap <strong>Copy Link</strong> to copy your unique referral URL</li>
          <li>2️⃣ Tap the <strong>Share</strong> button to share directly on Telegram & other chats</li>
          <li>3️⃣ Earn commissions on purchases in your chosen payout mode (Br or boosted Points)!</li>
        </ul>
      </div>

      {/* Per-Product Affiliate Links */}
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1">
        <TrendingUp size={12} /> Products Directory
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {topProducts.map(p => {
          const stat = productStats[p.id];
          const rawComm = Math.round(p.price * commissionPercent / 100);
          const pointsComm = Math.round(rawComm * (1 / pointsToCashRate) * 1.20);
          
          return (
            <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
              <img src={p.image} className="w-full h-20 object-cover cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
              <div className="p-2">
                <div className="text-[9px] font-bold truncate text-foreground">{p.nameEn}</div>
                <div className="text-[9px] text-primary font-bold mt-0.5">{formatPrice(p.price)}</div>
                
                <div className="text-[7.5px] text-slate-400 mt-1 min-h-[14px]">
                  {payoutPref === 'points' ? (
                    <span className="text-amber-500 font-semibold">Earn ~{pointsComm} Pts/sale</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Earn ~Br {rawComm}/sale</span>
                  )}
                  {stat && stat.clicks > 0 && <span className="block">{stat.clicks} clicks</span>}
                  {stat && stat.sales > 0 && <span className="text-green-600 block">✓ {stat.sales} sold!</span>}
                </div>
                
                <div className="flex gap-1 mt-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                  <button className="flex-1 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[8.5px] font-bold flex items-center justify-center gap-0.5 shadow-sm active:scale-95 transition-all"
                    onClick={() => copyProductLink(p)}>
                    <Copy size={9} /> Copy Link
                  </button>
                  <button className="p-1.5 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-300 transition-colors active:scale-95" onClick={() => openShareModal(p)}>
                    <Share2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo simulate */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-3 mt-4 mb-4 text-left">
        <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1"><Sparkles size={11} /> Simulate Affiliate Purchases (Demos Sales)</p>
        <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none pb-1">
          {topProducts.slice(0, 4).map(p => (
            <button key={p.id} className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[8px] font-bold hover:bg-amber-600 whitespace-nowrap transition-colors flex items-center gap-1"
              onClick={() => simulateSale(p)}>
              <ShoppingCart size={8} /> Buy {p.nameEn.substring(0, 10)}...
            </button>
          ))}
        </div>
      </div>

      {/* Multiplatform Share Modal Portal */}
      {shareProductItem && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setShareProduct(null)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-scaleIn text-left text-foreground" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h3 className="text-xs font-bold flex items-center gap-1.5"><Share2 size={13} className="text-primary" /> Share Product Link</h3>
              <button className="p-1 hover:bg-muted rounded-full text-slate-400 hover:text-foreground transition-colors" onClick={() => setShareProduct(null)}>
                <X size={14} />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 mb-3">Share your unique affiliate link for <strong>{shareProductItem.nameEn}</strong> directly to social platforms to earn commissions!</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/product/' + shareProductItem.id + '?ref=' + userCode)}&text=${encodeURIComponent('Check out ' + shareProductItem.nameEn + ' on Smart Shop!')}`}
                target="_blank" rel="noreferrer"
                className="p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                onClick={() => setShareProduct(null)}
              >
                ✈️ Telegram
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out ' + shareProductItem.nameEn + ' on Smart Shop! ' + window.location.origin + '/product/' + shareProductItem.id + '?ref=' + userCode)}`}
                target="_blank" rel="noreferrer"
                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                onClick={() => setShareProduct(null)}
              >
                💬 WhatsApp
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/product/' + shareProductItem.id + '?ref=' + userCode)}`}
                target="_blank" rel="noreferrer"
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                onClick={() => setShareProduct(null)}
              >
                👥 Facebook
              </a>
              <button 
                onClick={() => handleNativeShare(shareProductItem)}
                className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
              >
                📱 Native Share
              </button>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-2 border">
              <input 
                className="flex-1 text-[9px] font-mono select-all bg-transparent border-0 outline-none text-slate-500 truncate" 
                readOnly
                value={`${window.location.origin}/product/${shareProductItem.id}?ref=${userCode}`} 
              />
              <button 
                onClick={() => copyProductLink(shareProductItem)}
                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 text-[9px] font-bold flex items-center gap-0.5 whitespace-nowrap"
              >
                <Copy size={10} /> Copy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
