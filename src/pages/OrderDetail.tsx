import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice } from '@/lib/utils';
import DigitalReceipt from '@/components/features/DigitalReceipt';
import OrderTrackingMap from '@/components/features/OrderTrackingMap';
import { PreOrderStatusBadge } from '@/components/features/PreOrderBadge';
import { ChevronLeft } from 'lucide-react';

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { orders, language, preOrders } = useStore();

  const foundOrder = orders.find(ord => ord.orderNumber === orderNumber);
  const foundPreOrder = preOrders.find(po => po.orderNumber === orderNumber);

  let orderData = foundOrder;
  if (!orderData && foundPreOrder) {
    orderData = {
      orderNumber: foundPreOrder.orderNumber,
      status: foundPreOrder.status || 'pre-order',
      items: [{ name: foundPreOrder.productName || 'Pre-Order', quantity: 1, price: foundPreOrder.deposit || 0, total: foundPreOrder.deposit || 0 }],
      total: foundPreOrder.deposit || 0,
      subtotal: foundPreOrder.deposit || 0,
      discount: 0,
      paymentMethod: 'Deposit',
      customer: { name: '', phone: '', city: '', address: '' },
      date: foundPreOrder.createdAt ? new Date(foundPreOrder.createdAt).toLocaleDateString() : '',
      createdAt: foundPreOrder.createdAt || '',
    } as any;
  }

  if (!orderData) {
    return (
      <div className="text-center py-16">
        <h3 className="text-sm font-semibold">Order not found</h3>
        <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  const total = orderData.total || orderData.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const steps = ['Ordered', 'Processing', 'Shipped', 'Delivered'];
  const activeIdx = orderData.status === 'completed' ? 4 : orderData.status === 'shipped' || orderData.status === 'delivered' ? 3 : orderData.status === 'processing' ? 2 : orderData.status === 'confirmed' ? 1 : 0;
  const isPreOrder = !!(orderData as any).isPreOrder || !!foundPreOrder;

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate('/orders')} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-bold flex-1">📦 {t('orderNumber', language)}</h2>
        {isPreOrder && foundPreOrder?.releaseDate && <PreOrderStatusBadge releaseDate={foundPreOrder.releaseDate} />}
      </div>

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-bold text-primary font-mono">{orderData.orderNumber}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            isPreOrder ? 'bg-blue-100 text-blue-700' :
            orderData.status === 'confirmed' || orderData.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {orderData.status}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">📅 {orderData.date}</div>
        <div className="text-xs mt-1">👤 {orderData.customer?.name} | 📞 {orderData.customer?.phone} | 📍 {orderData.customer?.city}</div>
        <div className="text-xs mt-1">💳 {orderData.paymentMethod}</div>
      </div>

      {!isPreOrder && (
        <div className="mb-3">
          <OrderTrackingMap orderNumber={orderData.orderNumber} />
        </div>
      )}

      {isPreOrder && (
        <div className="bg-card rounded-xl border border-border p-3 mb-3">
          <h3 className="text-xs font-semibold mb-3">🚀 Pre-Order Status</h3>
          <div className="flex gap-2 pb-3 relative">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">🚀</div>
            <div>
              <div className="text-xs font-bold">Pre-Order Placed</div>
              <div className="text-[9px] text-muted-foreground">{foundPreOrder?.createdAt ? new Date(foundPreOrder.createdAt).toLocaleString() : ''}</div>
            </div>
          </div>
          {foundPreOrder?.releaseDate && (
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">📅</div>
              <div>
                <div className="text-xs font-medium">Release Date</div>
                <div className="text-[9px] text-muted-foreground">{new Date(foundPreOrder.releaseDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isPreOrder && (
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
      )}

      <div className="bg-card rounded-xl border border-border p-3 mb-3">
        <h3 className="text-xs font-semibold mb-2">🛍️ Items</h3>
        {orderData.items.map((it: any, i: number) => (
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

      <div className="mb-3">
        <DigitalReceipt orderNumber={orderData.orderNumber} />
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold">
          📄 {t('invoice', language)}
        </button>
        <button className="flex-1 py-2.5 border border-border rounded-lg text-xs" onClick={() => navigate('/orders')}>
          ⬅️ {t('backToOrders', language)}
        </button>
      </div>
    </div>
  );
}
