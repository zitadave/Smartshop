import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, generateOrderNumber, cn } from '@/lib/utils';
import { Clock, Calendar, CreditCard, Check, X, Loader, Zap } from 'lucide-react';

interface PreOrderBadgeProps {
  productId: number;
  deposit: number;
  releaseDate: string;
  maxOrders: number;
  currentOrders: number;
  price: number;
  productName: string;
}

export default function PreOrderBadge({
  productId,
  deposit,
  releaseDate,
  maxOrders,
  currentOrders,
  price,
  productName,
}: PreOrderBadgeProps) {
  const [showModal, setShowModal] = useState(false);
  const { addPreOrder, addToCart, addNotification } = useStore();
  const release = new Date(releaseDate);
  const remaining = maxOrders - currentOrders;
  const daysLeft = Math.ceil((release.getTime() - Date.now()) / 86400000);
  const spotsLeft = Math.max(0, remaining);

  return (
    <>
      {/* Pre-Order Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800/30 p-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
            <Clock size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400">Pre-Order Now</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Secure yours before the official release!
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[9px]">
              <span className="flex items-center gap-0.5 text-blue-600">
                <Calendar size={10} /> {release.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-0.5 text-orange-600">
                <Clock size={10} /> {daysLeft}d left
              </span>
              {spotsLeft <= 10 && (
                <span className="text-red-500 font-semibold animate-pulse">
                  Only {spotsLeft} left!
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-muted-foreground">Reserved</span>
                <span className="font-semibold">{currentOrders}/{maxOrders}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentOrders / maxOrders) * 100}%` }}
                />
              </div>
            </div>
            <button
              className="mt-2 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              onClick={() => setShowModal(true)}
            >
              <CreditCard size={12} />
              Pre-Order with {formatPrice(deposit)} Deposit
            </button>
            <p className="text-[8px] text-muted-foreground text-center mt-1">
              Full price: {formatPrice(price)} · Balance due on release
            </p>
          </div>
        </div>
      </div>

      {/* Pre-Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl text-white text-center">
              <div className="text-3xl mb-1">🚀</div>
              <h3 className="text-sm font-bold">Pre-Order Confirmation</h3>
              <p className="text-[10px] opacity-80">{productName}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-bold text-blue-600">{formatPrice(deposit)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Balance on Release</span>
                  <span>{formatPrice(price - deposit)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-bold">{formatPrice(price)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => {
                  addPreOrder({
                    id: Date.now(),
                    productId,
                    productName,
                    deposit,
                    totalPrice: price,
                    releaseDate,
                    orderNumber: generateOrderNumber(),
                    status: 'pre-order',
                    createdAt: new Date().toISOString(),
                  });
                  addNotification('🚀', `Pre-order placed for ${productName}!`);
                  setShowModal(false);
                }}>
                  <Check size={14} className="inline mr-1" />
                  Confirm Pre-Order
                </button>
                <button className="px-4 py-3 border border-border rounded-xl text-xs" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Pre-order status badge for order list */
export function PreOrderStatusBadge({ releaseDate }: { releaseDate: string }) {
  const release = new Date(releaseDate);
  const now = Date.now();
  const isReleased = now >= release.getTime();

  if (isReleased) {
    return <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Released</span>;
  }

  const daysLeft = Math.ceil((release.getTime() - now) / 86400000);
  return (
    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
      <Clock size={8} /> {daysLeft}d until release
    </span>
  );
}
