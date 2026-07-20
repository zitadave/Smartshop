import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice } from '@/lib/utils';

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { orders, language } = useStore();
  const o = orders.find(o => o.orderNumber === orderNumber);

  if (!o) return <div className="text-center py-16"><h3>Order not found</h3></div>;

  const total = o.total || o.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const steps = ['Ordered', 'Processing', 'Shipped', 'Delivered'];
  const activeIdx = o.status === 'completed' ? 4 : o.status === 'shipped' || o.status === 'delivered' ? 3 : o.status === 'processing' ? 2 : o.status === 'confirmed' ? 1 : 0;

  const generateInvoice = () => {
    let inv = `=================================\n   SMART SHOP INVOICE\n=================================\nOrder: ${o.orderNumber}\nDate: ${o.date}\nStatus: ${o.status}\n\nCustomer: ${o.customer?.name || ''}\nPhone: ${o.customer?.phone || ''}\nAddress: ${o.customer?.city || ''}\n\n--- Items ---\n`;
    o.items.forEach(it => { inv += `${it.name} x${it.quantity} = Br ${(it.price * it.quantity).toLocaleString()}\n`; });
    inv += `\nTOTAL: Br ${total.toLocaleString()}\nPayment: ${o.paymentMethod}\n=================================\nThank you for shopping with Smart Shop!`;
    navigator.clipboard.writeText(inv).then(() => alert('Invoice copied!'));
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">📦 {t('orderNumber', language)}</h2>
      
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-bold text-primary font-mono">{o.orderNumber}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${o.status === 'confirmed' || o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {o.status}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">📅 {o.date}</div>
        <div className="text-xs mt-1">👤 {o.customer?.name} | 📞 {o.customer?.phone} | 📍 {o.customer?.city}</div>
        <div className="text-xs mt-1">💳 {o.paymentMethod}</div>
      </div>

      {/* Tracking */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-3">🚚 Tracking</h3>
        {steps.map((s, i) => {
          const done = i < activeIdx;
          const cur = i === activeIdx - 1;
          return (
            <div key={i} className="flex gap-2.5 pb-3 relative last:pb-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${done ? 'bg-green-100 text-green-600' : cur ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'}`}>
                {done ? '✅' : cur ? '⏳' : '◻️'}
              </div>
              <div>
                <div className={`text-xs ${cur ? 'font-bold' : 'font-medium'}`}>{s}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Items */}
      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">🛍️ Items</h3>
        {o.items.map((it, i) => (
          <div key={i} className="flex justify-between py-1 text-xs border-b border-border last:border-0">
            <span>{it.name} × {it.quantity}</span>
            <span className="font-semibold">{formatPrice(it.price * it.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-1 font-bold text-sm border-t border-border">
          <span>{t('total', language)}</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold" onClick={generateInvoice}>
          📄 Invoice
        </button>
        <button className="flex-1 py-2.5 border border-border rounded-lg text-xs" onClick={() => navigate('/orders')}>
          ⬅️ {t('backToOrders', language)}
        </button>
      </div>
    </div>
  );
}
