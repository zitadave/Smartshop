import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, Globe, X } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguageMeta, type LanguageMeta, t } from '@/i18n/translations';
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
        onClick={() => setOpen(true)}
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
        <ChevronDown size={14} className="text-muted-foreground transition-transform duration-200" />
      </button>

      {/* Modal Dialog / Bottom-Sheet — Fixed z-[200] above all navigation bars */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl w-full max-w-sm p-5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{t('language', language)}</h3>
                  <p className="text-[10px] text-muted-foreground">5 Supported Languages</p>
                </div>
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            {/* Language Options List — Never covered by bottom nav */}
            <div className="space-y-2 overflow-y-auto py-1 pr-1 max-h-[55vh] scrollbar-thin">
              {SUPPORTED_LANGUAGES.map(l => {
                const isActive = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group cursor-pointer',
                      isActive
                        ? 'bg-primary/10 border-primary/50 text-primary font-bold shadow-sm'
                        : 'bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5 text-foreground'
                    )}
                    onClick={() => handleSelect(l)}
                  >
                    <span className="text-xl flex-shrink-0">{l.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs group-hover:text-primary transition-colors">{l.nativeName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{l.subtitle}</div>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              className="w-full mt-3 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              {t('cancelBtn', language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
