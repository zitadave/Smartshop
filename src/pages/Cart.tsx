import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { ShoppingCart, Trash2, Minus, Plus, Store } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, language, removeFromCart, updateCartQty, clearCart, getCartTotal } = useStore();
  const total = getCartTotal();

  // Group by vendor
  const vendorGroups: Record<string, typeof cart> = {};
  cart.forEach(item => {
    const v = item.vendorName || 'Smart Shop';
    if (!vendorGroups[v]) vendorGroups[v] = [];
    vendorGroups[v].push(item);
  });

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="text-5xl opacity-40 mb-3">🛒</div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t('cartEmpty', language)}</h3>
        <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90" onClick={() => navigate('/shop')}>
          🛍️ {t('shop', language)}
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">🛒 {t('cart', language)} ({cart.length})</h2>

      {Object.entries(vendorGroups).map(([vendor, items]) => (
        <div key={vendor} className="mb-3">
          <div className="flex items-center gap-1.5 px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
            <Store size={12} /> {vendor} ({items.length})
          </div>
          {items.map(item => (
            <div key={item.id} className="flex gap-3 p-3 bg-card rounded-xl border border-border mb-2 shadow-sm">
              <img src={item.image} alt={item.nameEn} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold cursor-pointer line-clamp-1" onClick={() => navigate(`/product/${item.id}`)}>{item.name}</div>
                <div className="text-sm font-bold text-primary mt-0.5">{formatPrice(item.price)}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-semibold border border-border" onClick={() => updateCartQty(item.id, item.qty - 1)} disabled={item.qty <= 1}>
                      <Minus size={12} />
                    </button>
                    <span className="min-w-[20px] text-center font-semibold text-xs">{item.qty}</span>
                    <button className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-semibold border border-border" onClick={() => updateCartQty(item.id, item.qty + 1)} disabled={item.qty >= item.maxQty}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-xs font-bold">{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-destructive p-1 self-start" onClick={() => removeFromCart(item.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex justify-between py-1 text-xs text-muted-foreground">
          <span>{t('total', language)}</span>
          <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
        </div>
        <button className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-sm font-semibold shadow hover:shadow-md active:scale-98 transition-all" onClick={() => navigate('/checkout')}>
          ✅ {t('proceedCheckout', language)}
        </button>
        <button className="w-full mt-2 py-2.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors" onClick={clearCart}>
          🗑️ {t('clearAll', language)}
        </button>
      </div>
    </div>
  );
}
