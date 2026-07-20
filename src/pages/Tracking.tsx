import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';

export default function Tracking() {
  const { orders } = useStore();
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<any>(null);

  const lookup = () => {
    const o = orders.find(o => o.orderNumber?.toUpperCase() === search.toUpperCase());
    setFound(o || 'not_found');
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">🚚 Tracking</h2>
      
      <div className="flex gap-2 mb-3">
        <input className="flex-1 p-2.5 border border-input rounded-lg text-xs uppercase font-mono bg-card" placeholder="ETH-XXXXXXXX" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="px-4 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold" onClick={lookup}>🔍 Search</button>
      </div>

      {found === 'not_found' && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🔍</div>
          <h3 className="text-sm font-semibold">Order not found</h3>
        </div>
      )}

      {found && found !== 'not_found' && (
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-center mb-3">
            <h3 className="text-sm font-bold text-primary font-mono">{found.orderNumber}</h3>
          </div>
          {['Order Confirmed', 'Being Prepared', 'On the Way', 'Delivered!'].map((s, i) => {
            const ai = found.status === 'completed' ? 4 : found.status === 'shipped' ? 3 : found.status === 'confirmed' ? 2 : 1;
            const done = i < ai;
            const cur = i === ai - 1;
            return (
              <div key={i} className="flex gap-3 pb-3 relative last:pb-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${done ? 'bg-green-100 text-green-600' : cur ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                  {done ? '✅' : cur ? '⏳' : '◻️'}
                </div>
                <div>
                  <div className={`text-xs ${cur ? 'font-bold' : 'font-medium'}`}>{s}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recentOrders.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold mb-2">🕐 Recent Orders</h3>
          {recentOrders.map(o => (
            <div key={o.orderNumber} className="flex justify-between p-2.5 bg-card rounded-lg border border-border mb-1.5 cursor-pointer" onClick={() => setSearch(o.orderNumber || '')}>
              <div>
                <span className="text-xs font-semibold text-primary font-mono">{o.orderNumber}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">{o.date}</span>
              </div>
              <span className="text-[10px] font-semibold text-green-600">{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
