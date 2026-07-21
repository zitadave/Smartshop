import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
import { Bell, BellOff, TrendingDown, Loader, Check } from 'lucide-react';

interface PriceDropAlertProps {
  productId: number;
  currentPrice: number;
  productName: string;
  className?: string;
}

export default function PriceDropAlert({ productId, currentPrice, productName, className }: PriceDropAlertProps) {
  const { priceAlerts, togglePriceAlert, hasPriceAlert, addNotification, products } = useStore();
  const isActive = hasPriceAlert(productId);
  const [checking, setChecking] = useState(false);

  const alert = priceAlerts.find(a => a.id === productId);

  // Background price checker
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const product = products.find(p => p.id === productId);
      if (product && product.price < (alert?.price || currentPrice)) {
        addNotification('📉', `Price dropped for ${productName}! Now ${formatPrice(product.price)}`);
        // Auto-deactivate after drop notification
        togglePriceAlert(productId, currentPrice, productName);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isActive, productId, currentPrice, productName]);

  const handleToggle = () => {
    togglePriceAlert(productId, currentPrice, productName);
    if (!isActive) {
      addNotification('🔔', `Price alert set for ${productName} at ${formatPrice(currentPrice)}`);
    }
  };

  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold transition-all',
        isActive
          ? 'bg-destructive/10 text-destructive border border-destructive/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent',
        className
      )}
      onClick={handleToggle}
    >
      {isActive ? <BellOff size={12} /> : <TrendingDown size={12} />}
      {isActive ? 'Alert Active' : 'Track Price'}
    </button>
  );
}

/** Price alert list for the profile page */
export function ActivePriceAlerts() {
  const { priceAlerts, products, togglePriceAlert } = useStore();
  const activeAlerts = priceAlerts.filter(a => a.active !== false);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <TrendingDown size={14} className="text-primary" /> Active Price Alerts ({activeAlerts.length})
      </h3>
      <div className="space-y-1.5">
        {activeAlerts.map(alert => {
          const product = products.find(p => p.id === alert.id);
          return (
            <div key={alert.id} className="flex items-center gap-2 py-1.5 text-[10px] border-b border-border last:border-0">
              <img
                src={product?.image || 'https://placehold.co/40x40'}
                className="w-8 h-8 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{alert.name}</div>
                <div className="text-muted-foreground">
                  Target: {formatPrice(alert.price)}
                  {product && product.price < alert.price && (
                    <span className="text-green-600 ml-1">↓ Br {(alert.price - product.price).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                className="text-destructive text-[9px] px-2 py-1 rounded hover:bg-destructive/10"
                onClick={() => togglePriceAlert(alert.id, alert.price, alert.name)}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
