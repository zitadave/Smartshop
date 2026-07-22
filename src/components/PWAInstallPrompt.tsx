import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 3 seconds
      setTimeout(() => {
        if (!dismissed && !installed) setShow(true);
      }, 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for installed
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed, installed]);

  // Check for standalone mode on iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone && !dismissed && !installed) {
      setTimeout(() => setShow(true), 5000);
    }
  }, [dismissed, installed]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS: show instructions
      alert('Tap the Share button in Safari, then scroll down and tap "Add to Home Screen".');
      setShow(false);
      return;
    }
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (installed || !show) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-slideUp">
      <div className="bg-card rounded-2xl border border-border shadow-xl p-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
          <Smartphone size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold">Install Smart Shop</h4>
          <p className="text-[9px] text-muted-foreground mt-0.5">Add to your home screen for the best experience</p>
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors"
              onClick={handleInstall}
            >
              <Download size={11} /> Install
            </button>
            <button
              className="px-3 py-1.5 border border-border rounded-lg text-[9px] font-medium hover:bg-muted transition-colors"
              onClick={() => { setShow(false); setDismissed(true); }}
            >
              Not now
            </button>
          </div>
        </div>
        <button className="p-1 hover:bg-muted rounded-lg transition-colors" onClick={() => { setShow(false); setDismissed(true); }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
