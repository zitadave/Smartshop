import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageMeta, type LanguageMeta } from '@/i18n/translations';
import { toast } from '@/components/Toast';

export default function LanguageSelector() {
  const { language, setLanguage } = useStore();
  const [open, setOpen] = useState(false);

  const current = getLanguageMeta(language);

  const handleSelect = (l: LanguageMeta) => {
    setLanguage(l.code);
    setOpen(false);
    toast(`🌐 ${l.nativeName} selected!`, 'success');
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 p-2.5 border border-input rounded-xl text-xs bg-card hover:border-primary/50 hover:shadow-sm transition-all active:scale-[0.99]"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{current.flag}</span>
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs leading-tight">{current.nativeName}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{current.subtitle}</span>
          </div>
        </div>
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/80 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-border/40 mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              <Globe size={12} className="text-primary" />
              <span>Select Language (5 Supported)</span>
            </div>
            {SUPPORTED_LANGUAGES.map(l => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-primary/5 transition-colors text-left group',
                    isActive && 'bg-primary/10 font-bold text-primary'
                  )}
                  onClick={() => handleSelect(l)}
                >
                  <span className="text-base flex-shrink-0">{l.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{l.nativeName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{l.subtitle}</div>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check size={12} className="text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
