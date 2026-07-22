import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'am', label: '🇪🇹 አማርኛ' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'om', label: '🌍 Afaan Oromoo' },
  { code: 'ti', label: '🇪🇹 ትግርኛ' },
  { code: 'so', label: '🇸🇴 Soomaali' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useStore();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[1];

  return (
    <div className="relative">
      <button
        className="w-full flex items-center justify-between gap-2 p-2.5 border border-input rounded-lg text-xs bg-card hover:border-primary/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{current.label}</span>
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted transition-colors text-left',
                  language === l.code && 'bg-primary/5 font-semibold'
                )}
                onClick={() => { setLanguage(l.code); setOpen(false); }}
              >
                <span className="flex-1">{l.label}</span>
                {language === l.code && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
