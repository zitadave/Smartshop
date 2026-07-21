import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { CheckoutSteps } from '@/components/ui/CheckoutSteps';
import { burstConfetti, haptic } from '@/lib/confetti';
import { generateReceiptHTML, formatPrice } from '@/lib/utils';
import { CheckCircle, ShoppingBag, FileText, Download, Printer } from 'lucide-react';
import DigitalReceipt from '@/components/features/DigitalReceipt';
import { cn } from '@/lib/utils';

export default function Confirmation() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { orders, profile } = useStore();
  const [showReceipt, setShowReceipt] = useState(false);
  const order = orders.find(o => o.orderNumber === orderNumber);

  useEffect(() => {
    burstConfetti({ count: 60, duration: 4000 });
    haptic('success');
  }, []);

  const handlePrintReceipt = () => {
    if (!order) return;
    const receipt = {
      orderNumber: order.orderNumber,
      date: order.date,
      customerName: order.customer?.name || profile.name || 'Customer',
      customerPhone: order.customer?.phone || profile.phone || '-',
      customerAddress: `${order.customer?.city || ''} ${order.customer?.address || ''}`,
      items: order.items.map(it => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        total: it.price * it.quantity,
      })),
      subtotal: order.subtotal || order.items.reduce((s, it) => s + it.price * it.quantity, 0),
      discount: order.discount || 0,
      total: order.total || order.items.reduce((s, it) => s + it.price * it.quantity, 0),
      paymentMethod: order.paymentMethod || 'Cash on Delivery',
      paymentReference: `PAY-${order.orderNumber}`,
      storeName: 'Smart Shop',
    };
    const html = generateReceiptHTML(receipt);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="px-4 pt-4 pb-10 animate-fadeUp">
      <CheckoutSteps current="confirmation" />

      <div className="text-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-4 animate-scaleIn">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h2 className="text-2xl font-extrabold text-green-600 mb-1">Order Confirmed! 🎉</h2>
        <p className="text-xs text-muted-foreground/60 mb-1">Thank you for your purchase</p>
        <p className="text-sm font-mono text-primary font-bold bg-primary/5 px-4 py-2 rounded-xl inline-block mb-6">
          {orderNumber}
        </p>

        {/* Order Steps */}
        <div className="flex justify-center gap-4 mb-6">
          {[
            { icon: '✅', label: 'Ordered' },
            { icon: '📦', label: 'Processing' },
            { icon: '🚚', label: 'Shipped' },
            { icon: '🏠', label: 'Delivered' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl mb-1 animate-countUp" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>{s.icon}</div>
              <div className="text-[9px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        {order && (
          <div className="bg-card rounded-xl border border-border p-3 mb-4 text-left max-w-xs mx-auto">
            <div className="text-[10px] font-semibold mb-2">🧾 Order Summary</div>
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-[10px] py-1 border-b border-border last:border-0">
                <span className="truncate max-w-[180px]">{it.name} ×{it.quantity}</span>
                <span className="font-medium">{formatPrice(it.price * it.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold mt-2 pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total || order.items.reduce((s, it) => s + it.price * it.quantity, 0))}</span>
            </div>
          </div>
        )}

        {/* Receipt Actions */}
        <div className="flex gap-2 justify-center mb-6">
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold hover:bg-primary/90 transition-colors"
            onClick={handlePrintReceipt}
          >
            <Printer size={12} /> Print Receipt
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-[10px] font-semibold hover:bg-muted transition-colors"
            onClick={() => setShowReceipt(!showReceipt)}
          >
            <FileText size={12} /> Digital Receipt
          </button>
        </div>

        {showReceipt && order && (
          <div className="mb-4">
            <DigitalReceipt orderNumber={order.orderNumber} onClose={() => setShowReceipt(false)} />
          </div>
        )}

        <button
          className="w-full max-w-xs mx-auto py-3.5 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          onClick={() => navigate('/shop')}
        >
          <ShoppingBag size={16} />
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
