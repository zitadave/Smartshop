import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice } from '@/lib/utils';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, language, toggleWishlist } = useStore();

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">❤️ {t('wishlist', language)} ({wishlist.length})</h2>
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl opacity-40 mb-3">♡</div>
          <h3 className="text-sm font-semibold text-muted-foreground">{t('wishlistEmpty', language)}</h3>
        </div>
      ) : (
        wishlist.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border mb-2 cursor-pointer hover:shadow-sm transition-all" onClick={() => navigate(`/product/${p.id}`)}>
            <img src={p.image} alt={p.nameEn} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold line-clamp-1">{p.name}</div>
              <div className="text-[10px] text-muted-foreground">{p.nameEn}</div>
              <div className="text-sm font-bold text-primary mt-0.5">{formatPrice(p.price)}</div>
            </div>
            <button className="text-destructive text-lg p-2" onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}
