import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { ChevronLeft, Share2, Copy, Star, TrendingUp, DollarSign, Link2, Users } from 'lucide-react';
import { toast } from '@/components/Toast';

/** Affiliate referral system — users earn commission ONLY when someone buys via their link */
export default function AffiliateProducts() {
  const navigate = useNavigate();
  const { products, settings, addNotification, addLoyaltyPoints } = useStore();
  const [referralLink] = useState(() => {
    // Generate unique referral code based on profile or random
    try {
      const profile = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      return `https://moonlit-kheer-826ac2.netlify.app/?ref=${profile.name ? profile.name.substring(0, 4).toUpperCase() : 'SHOP' + Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    } catch {
      return `https://moonlit-kheer-826ac2.netlify.app/?ref=SHOP${generateId().substring(0, 4).toUpperCase()}`;
    }
  });

  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_affiliate_stats') || '{"clicks":0,"sales":0,"commission":0,"conversionRate":0}'); } 
    catch { return { clicks: 0, sales: 0, commission: 0, conversionRate: 0 }; }
  });

  const commissionPercent = (settings as any)?.affiliateCommission || 10;
  const affiliateEnabled = (settings as any)?.affiliateEnabled !== false;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // Track the click
    const newStats = { ...stats, clicks: stats.clicks + 1, conversionRate: stats.sales > 0 ? Math.round((stats.sales / (stats.clicks + 1)) * 100) : 0 };
    localStorage.setItem('ss_affiliate_stats', JSON.stringify(newStats));
    setStats(newStats);
    toast('📋 Referral link copied! You earn commission when someone buys through this link.', 'success');
  };

  const shareReferral = async () => {
    // Just sharing — no commission. Commission only on sale.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Smart Shop - Shop & Save!',
          text: `Shop at Smart Shop Ethiopia! Use my referral link to start shopping: ${referralLink}`,
          url: referralLink,
        });
      } catch {}
    } else {
      copyReferralLink();
    }
  };

  // Simulate a referral sale (for demo purposes)
  const simulateSale = () => {
    const commission = Math.round(Math.random() * 500 * (commissionPercent / 100));
    const newStats = { ...stats, sales: stats.sales + 1, commission: stats.commission + commission, conversionRate: Math.round(((stats.sales + 1) / (stats.clicks || 1)) * 100) };
    localStorage.setItem('ss_affiliate_stats', JSON.stringify(newStats));
    setStats(newStats);
    addLoyaltyPoints(Math.round(commission / 10));
    addNotification('💰', `🎉 You earned Br ${commission} commission from a referral sale!`);
    toast(`🎉 Congratulations! You earned Br ${commission} commission from a referral purchase!`, 'success');
  };

  const topProducts = products.filter(p => p.inStock && p.rating >= 4).slice(0, 10);

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="text-base font-bold">🤝 Affiliate Program</h2>
          <p className="text-[9px] text-muted-foreground">Earn {commissionPercent}% commission on referred sales</p>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white mb-4 shadow-lg">
        <h3 className="text-xs font-bold mb-1">Your Referral Link</h3>
        <p className="text-[9px] opacity-80 mb-2">Share this link — you earn {commissionPercent}% commission when someone buys through it!</p>
        <div className="bg-white/10 rounded-xl p-2.5 text-[10px] font-mono truncate mb-2">{referralLink}</div>
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-white/20 rounded-xl text-[10px] font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-1" onClick={copyReferralLink}>
            <Copy size={12} /> Copy Link
          </button>
          <button className="flex-1 py-2 bg-white/20 rounded-xl text-[10px] font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-1" onClick={shareReferral}>
            <Share2 size={12} /> Share
          </button>
        </div>
        <p className="text-[8px] opacity-60 mt-2">
          ⚠️ Commission is only earned when a purchase is made through your link. Sharing alone does not earn rewards.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { icon: '📤', label: 'Link Clicks', val: stats.clicks, color: 'text-blue-600' },
          { icon: '🛒', label: 'Sales', val: stats.sales, color: 'text-green-600' },
          { icon: '💰', label: 'Commission', val: `Br ${stats.commission}`, color: 'text-emerald-600' },
          { icon: '📊', label: 'Conversion', val: `${stats.conversionRate}%`, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-2 text-center">
            <div className="text-sm">{s.icon}</div>
            <div className={cn('text-xs font-extrabold mt-0.5', s.color)}>{s.val}</div>
            <div className="text-[7px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commission Calculator */}
      <div className="bg-card rounded-xl border border-border p-3 mb-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><DollarSign size={14} className="text-green-500" /> Commission Calculator</h3>
        <p className="text-[9px] text-muted-foreground mb-2">When someone buys through your link, you earn {commissionPercent}% of the sale.</p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">Example:</span>
          <span>Br 1,000 purchase</span>
          <span className="text-green-600 font-bold">= Br {Math.round(1000 * commissionPercent / 100)} commission</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1">Bonus: You also earn {Math.round(commissionPercent / 10)} loyalty points per Br 10 commission!</p>
      </div>

      {/* Demo simulate */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30 p-3 mb-4">
        <p className="text-[9px] text-amber-700 dark:text-amber-400">📢 Demo: Tap to simulate a referral sale (earns commission!)</p>
        <button className="mt-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-bold hover:bg-amber-600 transition-colors" onClick={simulateSale}>
          🎯 Simulate Referral Sale
        </button>
      </div>

      {/* Products you can promote */}
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <TrendingUp size={12} /> Products to Promote
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {topProducts.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
            <img src={p.image} className="w-full h-20 object-cover cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
            <div className="p-2">
              <div className="text-[9px] font-semibold truncate">{p.nameEn}</div>
              <div className="text-[9px] text-primary font-bold mt-0.5">{formatPrice(p.price)}</div>
              <div className="text-[7px] text-muted-foreground mt-0.5">Earn ~Br {Math.round(p.price * commissionPercent / 100)}/sale</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
