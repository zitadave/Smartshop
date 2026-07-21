import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { ShoppingCart, Trash2, Minus, Plus, Store, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/Toast';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, language, removeFromCart, updateCartQty, clearCart, getCartTotal } = useStore();
  const total = getCartTotal();

  const vendorGroups: Record<string, typeof cart> = {};
  cart.forEach(item => {
    const v = item.vendorName || 'Smart Shop';
    if (!vendorGroups[v]) vendorGroups[v] = [];
    vendorGroups[v].push(item);
  });

  if (cart.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title={t('cartEmpty', language) || 'Your cart is empty'}
        description="Looks like you haven't added anything yet. Browse our collection and find something you love!"
        action={{ label: `🛍️ ${t('shop', language)}`, onClick: () => navigate('/shop') }}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto stagger">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold">{t('cart', language)}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{cart.length} items</span>
      </div>

      {/* Vendor Groups */}
      {Object.entries(vendorGroups).map(([vendor, items]) => (
        <div key={vendor} className="mb-4 animate-fadeUp">
          <div className="flex items-center gap-2 px-1 py-2">
            <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <Store size={12} className="text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{vendor}</span>
            <span className="text-[10px] text-muted-foreground/60">({items.length})</span>
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <img src={item.image} alt={item.nameEn}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/product/${item.id}`)}>
                    {item.name}
                  </div>
                  <div className="text-sm font-bold text-primary mt-1">{formatPrice(item.price)}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold hover:bg-card transition-colors"
                        onClick={() => updateCartQty(item.id, item.qty - 1)} disabled={item.qty <= 1}>
                        <Minus size={12} />
                      </button>
                      <span className="min-w-[22px] text-center font-bold text-xs">{item.qty}</span>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold hover:bg-card transition-colors"
                        onClick={() => updateCartQty(item.id, item.qty + 1)} disabled={item.qty >= item.maxQty}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-xs font-bold">{formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-destructive p-1 self-start transition-colors"
                  onClick={() => { removeFromCart(item.id); toast('Item removed', 'info'); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm animate-fadeUp">
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('subtotal', language)}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('delivery', language)}</span>
            <span className="text-green-600 font-medium">{t('free', language)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
            <span>{t('total', language)}</span>
            <span className="text-primary text-lg">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          onClick={() => navigate('/checkout')}
        >
          ✅ {t('proceedCheckout', language)}
          <ChevronRight size={16} />
        </button>
        <button
          className="w-full mt-2 py-2.5 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors"
          onClick={() => { clearCart(); toast('Cart cleared', 'info'); }}
        >
          🗑️ {t('clearAll', language)}
        </button>
      </div>
    </div>
  );
}
