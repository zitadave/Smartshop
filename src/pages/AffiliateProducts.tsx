import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
import { ChevronLeft, Share2, Copy, Star, TrendingUp } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function AffiliateProducts() {
  const navigate = useNavigate();
  const { products, language } = useStore();

  // Top products selected for affiliate program
  const affiliateProducts = products
    .filter(p => p.inStock && p.rating >= 4)
    .slice(0, 12);

  const copyAffiliateLink = (productName: string, productId: number) => {
    const link = `https://moonlit-kheer-826ac2.netlify.app/product/${productId}?ref=AFF${productId}`;
    navigator.clipboard.writeText(link);
    toast(`🔗 Affiliate link copied for ${productName}!`, 'success');
  };

  const shareProduct = (product: any) => {
    if (navigator.share) {
      navigator.share({
        title: product.nameEn,
        text: `Check out ${product.nameEn} on Smart Shop! Price: ${formatPrice(product.price)}`,
        url: `https://moonlit-kheer-826ac2.netlify.app/product/${product.id}?ref=AFF${product.id}`,
      }).catch(() => {});
    } else {
      copyAffiliateLink(product.nameEn, product.id);
    }
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="text-base font-bold">🤝 Affiliate Program</h2>
          <p className="text-[9px] text-muted-foreground">Earn commission by sharing products</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: '📤', label: 'Links Shared', val: '12' },
          { icon: '👆', label: 'Clicks', val: '45' },
          { icon: '💰', label: 'Earned', val: 'Br 230' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-2.5 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-sm font-bold text-primary">{s.val}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <TrendingUp size={12} /> Products to Promote
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {affiliateProducts.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
            <img src={p.image} className="w-full h-24 object-cover cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
            <div className="p-2">
              <div className="text-[10px] font-semibold truncate">{p.nameEn}</div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                <Star size={9} className="text-amber-500 fill-amber-500" />
                {p.rating || 0} · {p.soldCount || 0} sold
              </div>
              <div className="text-xs font-bold text-primary mt-0.5">{formatPrice(p.price)}</div>
              <div className="flex gap-1 mt-1.5">
                <button className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[8px] font-semibold flex items-center justify-center gap-0.5"
                  onClick={() => copyAffiliateLink(p.nameEn, p.id)}>
                  <Copy size={9} /> Copy Link
                </button>
                <button className="p-1.5 rounded-lg border border-border" onClick={() => shareProduct(p)}>
                  <Share2 size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {affiliateProducts.length === 0 && (
        <div className="text-center py-12">
          <Share2 size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No products available for affiliate promotion</p>
        </div>
      )}
    </div>
  );
}
