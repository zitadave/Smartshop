import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
import { TrendingDown, ChevronLeft, Trash2, Bell } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function PriceAlerts() {
  const navigate = useNavigate();
  const { priceAlerts, products, togglePriceAlert } = useStore();
  const activeAlerts = priceAlerts.filter(a => a.active !== false);

  const handleRemove = (id: number, price: number, name: string) => {
    togglePriceAlert(id, price, name);
    toast('Price alert removed', 'info');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">📉 Price Alerts</h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{activeAlerts.length}</span>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-sm font-semibold text-muted-foreground">No price alerts</h3>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Go to any product and tap "Track Price" to set an alert</p>
          <button className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => navigate('/shop')}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAlerts.map(alert => {
            const product = products.find(p => p.id === alert.id);
            const dropped = product && product.price < alert.price;
            return (
              <div key={alert.id} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={product?.image || 'https://placehold.co/48x48/e2e8f0/94a3b8?text=📦'}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/product/${alert.id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/product/${alert.id}`)}>
                      {alert.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        Target: <strong className={dropped ? 'text-green-600 line-through' : ''}>{formatPrice(alert.price)}</strong>
                      </span>
                      {product && (
                        <span className="text-[10px] font-bold text-primary">
                          Now: {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    {dropped && (
                      <div className="mt-1 text-[9px] text-green-600 font-semibold flex items-center gap-1">
                        <TrendingDown size={10} /> Price dropped by Br {(alert.price - product!.price).toLocaleString()}!
                      </div>
                    )}
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => handleRemove(alert.id, alert.price, alert.name)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
