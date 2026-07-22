/**
 * Smart Shop — Telegram Authentication Hook
 * 
 * Optimized for Telegram Mini App WebView performance.
 * - Syncs auth state instantly from localStorage cache before React renders
 * - Uses Telegram's native MainButton where possible
 * - Minimizes API roundtrips
 */

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { getTelegramUser, getTelegramInitData, isRunningInTelegram, hapticFeedback, setMainButton } from '@/lib/telegram';
import { useStore } from '@/stores/AppStore';
import type { Language } from '@/types';
import { toast } from '@/components/Toast';

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
  phone?: string;
  fullName?: string;
  city?: string;
  address?: string;
  profileComplete: boolean;
  firstSeen: string;
  lastSeen: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'pending_phone' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
}

// ============================================================
// Constants
// ============================================================

const AUTH_KEY = 'ss_telegram_auth';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// ============================================================
// Synchronous localStorage helpers — no async overhead
// ============================================================

function persistAuth(user: AuthUser): void {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify({ user, cachedAt: Date.now() })); } catch {}
}

export function loadCachedAuthSync(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_DURATION) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return parsed.user;
  } catch { return null; }
}

function clearCachedAuth(): void {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
}

// ============================================================
// API calls
// ============================================================

async function authenticateWithTelegram(initData: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Auth failed' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.user;
}

async function registerPhoneWithBackend(telegramId: number, phone: string): Promise<void> {
  const res = await fetch('/api/auth/telegram/register-phone', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, phone }),
  });
  if (!res.ok) throw new Error('Phone registration failed');
}

// ============================================================
// The Hook — optimized for Telegram WebView
// ============================================================

export function useTelegramAuth() {
  // Initialize from cache SYNCHRONOUSLY — no async wait
  const cachedUser = loadCachedAuthSync();
  const initialStatus: AuthStatus = cachedUser
    ? (cachedUser.phone ? 'authenticated' : 'pending_phone')
    : 'loading';

  const [state, setState] = useState<AuthState>({
    status: initialStatus,
    user: cachedUser,
    error: null,
  });

  const { setProfile, setLanguage } = useStore();
  const initialized = useRef(false);
  const isTg = isRunningInTelegram();

  // If we had cached data, immediately update the profile store (no API wait)
  useEffect(() => {
    if (cachedUser) {
      startTransition(() => {
        setProfile({
          name: cachedUser.fullName || cachedUser.firstName,
          phone: cachedUser.phone || '',
          email: '',
          registered: true,
          joinedAt: cachedUser.firstSeen,
          avatar: cachedUser.photoUrl,
        });
      });
    }
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));
    try {
      const initData = getTelegramInitData();
      if (!initData) throw new Error('No init data');

      const user = await authenticateWithTelegram(initData);

      if (user.languageCode && ['am', 'en', 'om', 'ti', 'so'].includes(user.languageCode)) {
        startTransition(() => setLanguage(user.languageCode as Language));
      }

      startTransition(() => {
        setProfile({
          name: user.fullName || user.firstName,
          phone: user.phone || '',
          email: '', registered: true,
          joinedAt: user.firstSeen,
          avatar: user.photoUrl,
        });
      });

      persistAuth(user);
      setState({ status: user.phone ? 'authenticated' : 'pending_phone', user, error: null });
      hapticFeedback('notification', 'success');
      return user;
    } catch (err: any) {
      setState({ status: 'error', user: null, error: err.message || 'Auth failed' });
      return null;
    }
  }, [setProfile, setLanguage]);

  const registerPhone = useCallback(async (phone: string) => {
    if (!state.user) return;
    try {
      await registerPhoneWithBackend(state.user.telegramId, phone);
      const updated = { ...state.user, phone };
      persistAuth(updated);
      setState({ status: 'authenticated', user: updated, error: null });
      setProfile(prev => ({ ...prev, phone }));
      hapticFeedback('notification', 'success');
      toast('✅ Phone verified!', 'success');
    } catch { toast('❌ Phone registration failed', 'error'); }
  }, [state.user, setProfile]);

  const completeProfile = useCallback(async (fullName: string, city: string, address: string) => {
    if (!state.user) return;
    const updated: AuthUser = { ...state.user, fullName, city, address, profileComplete: true };
    persistAuth(updated);
    setState({ status: 'authenticated', user: updated, error: null });
    startTransition(() => {
      setProfile({ name: fullName, phone: state.user!.phone || '', email: '', registered: true, joinedAt: state.user!.firstSeen, avatar: state.user!.photoUrl });
    });
    useStore.getState().addAddress({ label: 'Home', city, address, phone: state.user.phone });
  }, [state.user, setProfile]);

  const logout = useCallback(() => {
    clearCachedAuth();
    setState({ status: 'unauthenticated', user: null, error: null });
    setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' });
  }, [setProfile]);

  // Initialize — verify with server in background only if in Telegram
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (isTg) login();
    else if (!cachedUser) setState({ status: 'unauthenticated', user: null, error: null });
  }, [login, isTg, cachedUser]);

  return {
    ...state,
    login,
    registerPhone,
    completeProfile,
    logout,
    isAuthenticated: state.status === 'authenticated',
    isLoading: state.status === 'loading',
  };
}
