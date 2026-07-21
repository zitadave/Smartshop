import { cn } from '@/lib/utils';
import { ShoppingCart, MapPin, CreditCard, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 'cart', icon: ShoppingCart, label: 'Cart' },
  { id: 'delivery', icon: MapPin, label: 'Delivery' },
  { id: 'payment', icon: CreditCard, label: 'Payment' },
  { id: 'confirmation', icon: CheckCircle, label: 'Confirmed' },
];

interface CheckoutStepsProps {
  current: 'cart' | 'delivery' | 'payment' | 'confirmation';
  className?: string;
}

export function CheckoutSteps({ current, className }: CheckoutStepsProps) {
  const currentIdx = STEPS.findIndex(s => s.id === current);

  return (
    <div className={cn('flex items-center gap-0 px-4 py-4', className)}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300',
                isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' :
                'bg-muted text-muted-foreground'
              )}>
                {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <span className={cn(
                'text-[9px] font-semibold transition-colors',
                isDone ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground/60'
              )}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                'flex-1 h-[2px] mx-2 rounded transition-colors duration-300',
                i < currentIdx ? 'bg-green-500' : 'bg-muted'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
