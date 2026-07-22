import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Globe } from 'lucide-react';

const CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
];

export default function CurrencySelector() {
  const { currency, setCurrency, currencyRates } = useStore();
  const [open, setOpen] = useState(false);

  const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const [rates, setRates] = useState(currencyRates);

  useEffect(() => {
    const interval = setInterval(() => {
      const simulated = {
        ETB: 1,
        USD: 0.019 + (Math.random() - 0.5) * 0.001,
        EUR: 0.017 + (Math.random() - 0.5) * 0.001,
        GBP: 0.015 + (Math.random() - 0.5) * 0.0008,
        KES: 2.45 + (Math.random() - 0.5) * 0.02,
      };
      setRates(simulated);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors ml-auto"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base">{current.flag}</span>
        <ChevronDown size={10} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border">
              <div className="text-[9px] font-semibold flex items-center gap-1">
                <Globe size={10} /> Currency
              </div>
            </div>
            {CURRENCIES.map(c => {
              const rate = rates[c.code] || 1;
              return (
                <button
                  key={c.code}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors',
                    currency === c.code && 'bg-primary/5'
                  )}
                  onClick={() => { setCurrency(c.code as any); setOpen(false); }}
                >
                  <span>{c.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[10px]">{c.code}</div>
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground">
                    {rate === 1 ? '' : rate.toFixed(4)}
                  </div>
                  {currency === c.code && <Check size={12} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function ConvertedPrice({ price, className }: { price: number; className?: string }) {
  const { currency, currencyRates } = useStore();
  const rate = currencyRates[currency] || 1;
  const symbols: Record<string, string> = { ETB: 'Br', USD: '$', EUR: '€', GBP: '£', KES: 'KSh' };
  const sym = symbols[currency] || 'Br';
  const converted = price * rate;
  return (
    <span className={className}>
      {currency === 'ETB' ? `${sym} ${Math.round(converted).toLocaleString()}` : `${sym}${converted.toFixed(2)}`}
    </span>
  );
}
