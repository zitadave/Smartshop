import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { t } from '@/i18n/translations';
import { formatPrice } from '@/lib/utils';
import DigitalReceipt from '@/components/features/DigitalReceipt';
import OrderTrackingMap from '@/components/features/OrderTrackingMap';
import { PreOrderStatusBadge } from '@/components/features/PreOrderBadge';
import { ChevronLeft } from 'lucide-react';
import { toast } from '@/components/Toast';
import { createPortal } from 'react-dom';

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { orders, language, preOrders } = useStore();

  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/delivery/tracking/${orderNumber}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.delivery) {
          setDeliveryData(d.delivery);
        }
      })
      .catch(err => console.error('Failed to load tracking data:', err));
  }, [orderNumber]);

  const handleConfirmReceipt = () => {
    if (!deliveryData || !pinInput.trim()) return;
    setVerifying(true);
    fetch('/api/delivery/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: deliveryData.id, pin: pinInput.trim() })
    })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`Server error (${r.status}): ${text}`);
        }
        return r.json();
      })
      .then(d => {
        setVerifying(false);
        if (d && d.verified) {
          toast('🎉 Delivery confirmed successfully! Thank you.', 'success');
          setShowPinModal(false);
          // Reload page to refresh statuses
          window.location.reload();
        } else {
          toast('❌ Incorrect verification PIN. Please check and try again.', 'error');
        }
      })
      .catch(err => {
        setVerifying(false);
        toast('Error: ' + err.message, 'error');
      });
  };

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

      {deliveryData && !deliveryData.pin_verified_at && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-3 space-y-3 animate-scaleIn text-left">
          <div className="flex justify-between items-center gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">🔑 Delivery Completion PIN</div>
              <div className="text-2xl font-black text-foreground mt-1.5 tracking-widest">{deliveryData.delivery_pin}</div>
            </div>
            <button 
              onClick={() => {
                setPinInput('');
                setShowPinModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all"
            >
              ✅ Confirm Receipt
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal">
            Give this unique 4-digit PIN to your delivery driver, or tap <strong>Confirm Receipt</strong> to enter it yourself once you have safely received the product.
          </p>
        </div>
      )}

      {deliveryData && deliveryData.pin_verified_at && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 mb-3 text-left">
          <span className="text-base flex-shrink-0">📦</span>
          <div>
            <div className="font-bold">Delivery Receipt Confirmed!</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">You have securely confirmed receipt of this order via PIN authorization.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
          📄 {t('invoice', language)}
        </button>
        <button className="flex-1 py-2.5 border border-border rounded-lg text-xs bg-card" onClick={() => navigate('/orders')}>
          ⬅️ {t('backToOrders', language)}
        </button>
      </div>

      {/* Customer Confirmation Modal */}
      {showPinModal && deliveryData && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowPinModal(false)}>
          <div className="bg-background border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center animate-scaleIn" onClick={e => e.stopPropagation()}>
            <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center font-bold text-muted-foreground hover:text-foreground text-sm" onClick={() => setShowPinModal(false)}>✕</button>
            
            <div className="text-center mb-5 border-b border-border/80 pb-3">
              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">Order Receipt</span>
              <h3 className="text-sm font-black mt-2 text-foreground">Confirm Received</h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">Enter your unique 4-digit verification PIN to confirm you have safely received all items in this order.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[8px] text-muted-foreground font-extrabold uppercase block mb-1">Your Verification PIN</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={pinInput} 
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234" 
                  className="w-full p-3 border border-border rounded-xl text-center text-lg bg-card text-foreground outline-none focus:border-primary transition-colors font-black tracking-[1em] pl-[1.2em]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  className="flex-1 py-3 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/40" 
                  onClick={() => setShowPinModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1"
                  onClick={handleConfirmReceipt}
                  disabled={verifying || pinInput.length < 4}
                >
                  {verifying ? (
                    <>
                      <span className="w-3 h-3 border border-t-white border-r-transparent rounded-full animate-spin flex-shrink-0" /> Verifying...
                    </>
                  ) : (
                    <>
                      Confirm Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
