import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice, cn } from '@/lib/utils';
import { ReceiptButton } from '@/components/features/DigitalReceipt';
import { OrderProgressBar } from '@/components/features/OrderTrackingMap';
import { FileText, MapPin, RotateCcw } from 'lucide-react';

export default function Orders() {
  const navigate = useNavigate();
  const { orders, language, preOrders } = useStore();

  const statusIcons: Record<string, string> = { confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🏠', completed: '✅', cancelled: '❌', returned: '🔄', 'pre-order': '🚀' };
  const statusLabels: Record<string, string> = { confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', returned: 'Returned', 'pre-order': 'Pre-Order' };

  const allOrders = [...orders, ...preOrders.map(po => ({
    orderNumber: po.orderNumber,
    status: po.status || 'pre-order' as const,
    items: [{ name: po.productName || 'Pre-Order', quantity: 1, price: po.deposit || 0, total: po.deposit || 0 }],
    total: po.deposit || 0,
    subtotal: po.deposit || 0,
    discount: 0,
    paymentMethod: 'Deposit',
    customer: { name: '', phone: '', city: '', address: '' },
    date: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '',
    createdAt: po.createdAt || '',
    isPreOrder: true,
  }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">📦 {t('orders', language)} ({allOrders.length})</h2>
      {allOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl opacity-40 mb-3">📦</div>
          <h3 className="text-sm font-semibold text-muted-foreground">{t('noOrders', language)}</h3>
          <button className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold" onClick={() => navigate('/shop')}>
            🛍️ {t('shop', language)}
          </button>
        </div>
      ) : (
        allOrders.map(o => {
          const total = o.total || o.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const activeIdx = o.status === 'completed' ? 4 : o.status === 'shipped' ? 3 : o.status === 'delivered' ? 3 : o.status === 'processing' ? 2 : o.status === 'confirmed' ? 1 : 0;
          const isPreOrder = (o as any).isPreOrder;
          return (
            <div key={o.orderNumber} className="bg-card rounded-xl border border-border p-3 mb-2 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/orders/${o.orderNumber}`)}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-primary font-mono">{o.orderNumber}</span>
                <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold', 
                  isPreOrder ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                  o.status === 'confirmed' || o.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400')}>
                  {statusIcons[o.status] || '✅'} {statusLabels[o.status] || o.status}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{o.date}</span>
                <span className="font-bold text-sm text-foreground">{formatPrice(total)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {o.items.slice(0, 2).map(it => `${it.name} ×${it.quantity}`).join(', ')}
                {o.items.length > 2 && ` +${o.items.length - 2} more`}
              </div>
              {/* Progress bar */}
              <OrderProgressBar status={o.status} />
              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <ReceiptButton orderNumber={o.orderNumber} compact />
                <button className="text-[9px] text-primary font-semibold flex items-center gap-0.5" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderNumber}`); }}>
                  <MapPin size={10} /> Track
                </button>
                {(o.status === 'delivered' || o.status === 'completed') && (
                  <button className="text-[9px] text-orange-600 font-semibold flex items-center gap-0.5" onClick={(e) => { e.stopPropagation(); navigate('/returns'); }}>
                    <RotateCcw size={10} /> Return
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
