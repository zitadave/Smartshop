import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { isRunningInTelegram } from '@/lib/telegram';
import { Shield, Lock, Sparkles, ArrowRight, Store } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: string;
}

export default function AuthGuard({ children, title, description, icon }: AuthGuardProps) {
  const navigate = useNavigate();
  const { profile } = useStore();

  const storedPhone = profile?.phone || localStorage.getItem('ss_user_phone') || '';
  const hasPhone = Boolean(
    storedPhone &&
    !storedPhone.includes('@') &&
    storedPhone.replace(/[^0-9]/g, '').length >= 7
  );

  if (hasPhone) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 animate-fadeIn">
      <div className="max-w-md w-full bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl shadow-inner">
          {icon || '🔒'}
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <Shield size={12} />
            <span>Phone Number Required</span>
          </span>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            {title ? `Sign in to access ${title}` : 'Sign In Required'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {description ||
              'Please enter your verified phone number to access member features and synchronize across all your devices.'}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-extrabold text-xs shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>🔑 Enter Phone Number / Sign In</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="w-full py-3.5 bg-muted/60 hover:bg-muted text-foreground rounded-2xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Store size={15} />
            <span>← Continue Browsing Storefront</span>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border/40">
          No password required · Instant SIM & Telegram verification
        </p>
      </div>
    </div>
  );
}
