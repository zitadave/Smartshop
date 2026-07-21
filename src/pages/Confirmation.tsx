import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckoutSteps } from '@/components/ui/CheckoutSteps';
import { burstConfetti, haptic } from '@/lib/confetti';
import { CheckCircle, ShoppingBag } from 'lucide-react';

export default function Confirmation() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    burstConfetti({ count: 60, duration: 4000 });
    haptic('success');
  }, []);

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
        <div className="flex justify-center gap-4 mb-8">
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
