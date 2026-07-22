/**
 * Smart Shop — Telegram Login Component
 * 
 * Displays Telegram profile card, manages auth states,
 * and handles phone number registration flow.
 */

import { useState, useCallback } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { isRunningInTelegram, hapticFeedback } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { Smartphone, CheckCircle, Loader, AlertTriangle, LogOut, User, ChevronRight } from 'lucide-react';
import { toast } from '@/components/Toast';

// ============================================================
// Main Login Component
// ============================================================

interface TelegramLoginProps {
  /** Show detailed card vs compact badge */
  variant?: 'card' | 'badge' | 'minimal';
  /** Called after successful authentication */
  onAuthenticated?: () => void;
  /** Called when phone is registered */
  onPhoneRegistered?: () => void;
  /** Called when profile is completed */
  onProfileCompleted?: () => void;
}

export default function TelegramLogin({
  variant = 'card',
  onAuthenticated,
  onPhoneRegistered,
  onProfileCompleted,
}: TelegramLoginProps) {
  const { status, user, error, login, registerPhone, completeProfile, logout } = useTelegramAuth();
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTg = isRunningInTelegram();

  // ============================================================
  // Handlers
  // ============================================================

  const handlePhoneSubmit = useCallback(async () => {
    if (!phone.trim() || phone.length < 8) {
      toast('Please enter a valid phone number', 'error');
      return;
    }
    setSubmitting(true);
    await registerPhone(phone.trim());
    setSubmitting(false);
    setShowPhoneInput(false);
    onPhoneRegistered?.();
    hapticFeedback('notification', 'success');
  }, [phone, registerPhone, onPhoneRegistered]);

  const handleProfileSubmit = useCallback(async () => {
    if (!fullName.trim() || !city.trim() || !address.trim()) {
      toast('Please fill in all fields', 'error');
      return;
    }
    setSubmitting(true);
    await completeProfile(fullName.trim(), city.trim(), address.trim());
    setSubmitting(false);
    setShowProfileForm(false);
    onProfileCompleted?.();
    hapticFeedback('notification', 'success');
  }, [fullName, city, address, completeProfile, onProfileCompleted]);

  // ============================================================
  // Badge variant — compact indicator
  // ============================================================

  if (variant === 'badge') {
    if (status === 'loading') {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Loader size={10} className="animate-spin" /> Connecting...
        </div>
      );
    }
    if (status === 'authenticated' && user) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-medium">
          <CheckCircle size={10} />
          {user.firstName} ✓
        </div>
      );
    }
    return null;
  }

  // ============================================================
  // Minimal variant — just icon + status
  // ============================================================

  if (variant === 'minimal') {
    if (status === 'authenticated') {
      return (
        <button className="flex items-center gap-1.5 text-xs text-green-600 font-medium" onClick={logout}>
          <CheckCircle size={12} /> Telegram Connected
        </button>
      );
    }
    if (status === 'loading') {
      return <Loader size={12} className="animate-spin text-muted-foreground" />;
    }
    return (
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-semibold"
        onClick={login}
        disabled={!isTg}
      >
        <Smartphone size={12} /> Connect Telegram
      </button>
    );
  }

  // ============================================================
  // Card variant — full profile display
  // ============================================================

  // Loading State
  if (status === 'loading') {
    return (
      <div className={cn('bg-card rounded-2xl border border-border p-5 text-center')}>
        <div className="w-14 h-14 rounded-full bg-muted animate-pulse mx-auto mb-3" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto mb-2" />
        <div className="h-3 w-48 bg-muted animate-pulse rounded mx-auto" />
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
          <Loader size={14} className="animate-spin" /> Connecting to Telegram...
        </div>
      </div>
    );
  }

  // Error State
  if (status === 'error') {
    return (
      <div className="bg-card rounded-2xl border border-destructive/20 p-5 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={24} className="text-destructive" />
        </div>
        <h3 className="text-sm font-bold mb-1">Connection Error</h3>
        <p className="text-[10px] text-muted-foreground mb-3">{error || 'Could not connect to Telegram'}</p>
        {isTg && (
          <button
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
            onClick={login}
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  // Unauthenticated State (not in Telegram)
  if (status === 'unauthenticated') {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Smartphone size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold mb-1">Open in Telegram</h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          This app works best inside Telegram Messenger.
          Open it via the Smart Shop bot for the full experience.
        </p>
        {!isTg && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 text-[10px] text-amber-700 dark:text-amber-400">
            📱 Open this link in Telegram: <strong>@SmartShopET_bot</strong>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Authenticated State
  // ============================================================

  if (!user) return null;

  const needsPhone = status === 'pending_phone';
  const needsProfile = user && !user.profileComplete && user.phone;

  return (
    <div className="space-y-3">
      {/* Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center text-xl font-bold">
                {(user.fullName || user.firstName).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-card rounded-full flex items-center justify-center">
              <CheckCircle size={10} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate">{user.fullName || user.firstName}</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <span className="text-green-600 font-medium">Telegram ✓</span>
              {user.phone && <><span>·</span><span>📞 {user.phone}</span></>}
            </div>
            {user.username && (
              <p className="text-[9px] text-muted-foreground mt-0.5">@{user.username}</p>
            )}
          </div>

          {/* Logout button */}
          <button
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            onClick={logout}
            title="Disconnect"
          >
            <LogOut size={14} />
          </button>
        </div>

        {needsPhone && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 text-[9px] text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <Smartphone size={12} />
              Share your phone number via the Telegram bot to complete registration
            </div>
            {showPhoneInput ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 border border-input rounded-lg text-xs bg-card"
                  placeholder="+251-91X-XXX-XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                />
                <button
                  className="px-3 py-2 bg-primary text-white rounded-lg text-[10px] font-bold disabled:opacity-50"
                  onClick={handlePhoneSubmit}
                  disabled={submitting || phone.length < 8}
                >
                  {submitting ? <Loader size={12} className="animate-spin" /> : 'Verify'}
                </button>
              </div>
            ) : (
              <button
                className="w-full py-2 bg-primary text-white rounded-xl text-[10px] font-bold"
                onClick={() => setShowPhoneInput(true)}
              >
                Enter Phone Number
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Completion Form */}
      {needsProfile && (
        <div className="bg-card rounded-2xl border border-border p-4 animate-slideUp">
          <h4 className="text-xs font-bold mb-3 flex items-center gap-1.5">
            <User size={14} /> Complete Your Profile
          </h4>
          <div className="space-y-2">
            <input
              className="w-full p-2.5 border border-input rounded-xl text-xs bg-card"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <input
              className="w-full p-2.5 border border-input rounded-xl text-xs bg-card"
              placeholder="City"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <textarea
              className="w-full p-2.5 border border-input rounded-xl text-xs bg-card resize-none h-16"
              placeholder="Delivery Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            <button
              className="w-full py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              onClick={handleProfileSubmit}
              disabled={submitting || !fullName.trim() || !city.trim() || !address.trim()}
            >
              {submitting ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Profile Complete Badge */}
      {user.profileComplete && user.phone && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5 text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle size={12} />
          Profile complete · {user.city} · {user.address}
        </div>
      )}
    </div>
  );
}
