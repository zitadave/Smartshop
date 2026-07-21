import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
import OrderTrackingMap from '@/components/features/OrderTrackingMap';
import { MapPin, Search, Package, Truck } from 'lucide-react';

export default function Tracking() {
  const { orders, orderTracking, setOrderTracking } = useStore();
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const tracked = Object.keys(orderTracking);
    const recent = orders
      .filter(o => tracked.includes(o.orderNumber) || o.status === 'shipped' || o.status === 'processing')
      .slice(0, 5);
    setRecentOrders(recent);
  }, [orders, orderTracking]);

  const lookup = () => {
    const order = orders.find(o => 
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search)
    );
    if (order) {
      setFound(order);
    } else {
      setFound({ error: true });
    }
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={18} className="text-primary" />
        <h2 className="text-base font-bold">Order Tracking</h2>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2.5 border border-input rounded-lg text-xs bg-card"
            placeholder="🔍 Search by order number or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
          />
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold" onClick={lookup}>
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Found Order */}
      {found && !found.error && (
        <div className="mb-3">
          <OrderTrackingMap orderNumber={found.orderNumber} />
        </div>
      )}

      {found?.error && (
        <div className="bg-card rounded-xl border border-border p-4 text-center mb-3">
          <Package size={24} className="mx-auto mb-1 opacity-40 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Order not found. Check your order number.</p>
        </div>
      )}

      {/* Recent Orders with Tracking */}
      {recentOrders.length > 0 && !found && (
        <div className="mb-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Deliveries</h3>
          <div className="space-y-1.5">
            {recentOrders.map(o => (
              <div key={o.orderNumber} className="bg-card rounded-xl border border-border p-2.5 cursor-pointer hover:shadow-md transition-all" onClick={() => setFound(o)}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold font-mono text-primary truncate">{o.orderNumber}</div>
                    <div className="text-[8px] text-muted-foreground truncate">{o.customer?.name} · {formatPrice(o.total || 0)}</div>
                  </div>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold',
                    o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {o.status === 'shipped' ? '🚚 Shipped' : o.status === 'processing' ? '📦 Processing' : o.status}
                  </span>
                </div>
                <div className="mt-1 flex gap-1">
                  {['✅', '📦', '🚚', '🏠'].map((ic, i) => (
                    <div key={i} className={cn('flex-1 h-1 rounded',
                      i <= (o.status === 'shipped' ? 2 : o.status === 'processing' ? 1 : 0) ? 'bg-green-500' : 'bg-muted'
                    )} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Orders */}
      {!found && (
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Track with Tracking Number</h3>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Truck size={32} className="mx-auto mb-2 opacity-30 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Enter your order number or phone number above to track your delivery in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
