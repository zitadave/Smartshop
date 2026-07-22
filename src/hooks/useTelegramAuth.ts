/**
 * Smart Shop — Telegram Authentication Hook
 * 
 * Provides Telegram auth lifecycle with proper error handling,
 * session persistence, and automatic re-authentication.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTelegramUser, getTelegramInitData, telegramReady, isRunningInTelegram, hapticFeedback } from '@/lib/telegram';
import { useStore } from '@/stores/AppStore';
import type { Language } from '@/types';
import { toast } from '@/components/Toast';

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  /** Telegram user ID (permanent) */
  telegramId: number;
  /** First name from Telegram */
  firstName: string;
  /** Last name from Telegram (optional) */
  lastName?: string;
  /** Telegram username (optional) */
  username?: string;
  /** Language code from Telegram */
  languageCode?: string;
  /** Avatar URL from Telegram */
  photoUrl?: string;
  /** Phone number (shared via bot, optional) */
  phone?: string;
  /** Full name provided during checkout */
  fullName?: string;
  /** Delivery city */
  city?: string;
  /** Delivery address */
  address?: string;
  /** Whether the user has completed their profile */
  profileComplete: boolean;
  /** When the user first authenticated */
  firstSeen: string;
  /** When the user last authenticated */
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

const AUTH_STORAGE_KEY = 'ss_telegram_auth';
const AUTH_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================
// Helper: persist auth to localStorage
// ============================================================

function persistAuth(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      user,
      cachedAt: Date.now(),
    }));
  } catch {
    // Storage quota exceeded — degrade gracefully
  }
}

function loadCachedAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check if cache is still fresh
    if (Date.now() - parsed.cachedAt > AUTH_CACHE_DURATION) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed.user;
  } catch {
    return null;
  }
}

function clearCachedAuth(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================
// Auth API calls
// ============================================================

async function authenticateWithTelegram(initData: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.user as AuthUser;
}

async function registerPhoneWithBackend(telegramId: number, phone: string): Promise<void> {
  const response = await fetch('/api/auth/telegram/register-phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, phone }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Phone registration failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}

// ============================================================
// The Hook
// ============================================================

export function useTelegramAuth() {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    error: null,
  });

  const { setProfile, setLanguage } = useStore();
  const initialized = useRef(false);

  /**
   * Send Telegram data to our API for verification + user creation
   */
  const login = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const initData = getTelegramInitData();
      if (!initData) {
        throw new Error('No Telegram init data available');
      }

      const user = await authenticateWithTelegram(initData);

      // Auto-detect language from Telegram
      if (user.languageCode && ['am', 'en', 'om', 'ti', 'so'].includes(user.languageCode)) {
        setLanguage(user.languageCode as Language);
      }

      // Update Zustand store
      setProfile({
        name: user.fullName || user.firstName,
        phone: user.phone || '',
        email: '',
        registered: true,
        joinedAt: user.firstSeen,
        avatar: user.photoUrl,
      });

      // Persist to localStorage
      persistAuth(user);

      setState({
        status: user.phone ? 'authenticated' : 'pending_phone',
        user,
        error: null,
      });

      hapticFeedback('notification', 'success');
      return user;
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setState({ status: 'error', user: null, error: message });
      return null;
    }
  }, [setProfile, setLanguage]);

  /**
   * Register phone number (called after user shares contact via bot)
   */
  const registerPhone = useCallback(async (phone: string) => {
    if (!state.user) return;

    try {
      await registerPhoneWithBackend(state.user.telegramId, phone);

      const updatedUser: AuthUser = { ...state.user, phone };
      persistAuth(updatedUser);

      setState({ status: 'authenticated', user: updatedUser, error: null });

      setProfile({
        name: state.user.fullName || state.user.firstName,
        phone,
        email: '',
        registered: true,
        joinedAt: state.user.firstSeen,
        avatar: state.user.photoUrl,
      });

      hapticFeedback('notification', 'success');
      toast('✅ Phone verified! Welcome to Smart Shop!', 'success');
    } catch (err: any) {
      toast('❌ Failed to register phone: ' + (err.message || 'Unknown error'), 'error');
    }
  }, [state.user, setProfile]);

  /**
   * Complete profile with delivery info
   */
  const completeProfile = useCallback(async (fullName: string, city: string, address: string) => {
    if (!state.user) return;

    const updatedUser: AuthUser = {
      ...state.user,
      fullName,
      city,
      address,
      profileComplete: true,
    };

    persistAuth(updatedUser);
    setState({ status: 'authenticated', user: updatedUser, error: null });

    setProfile({
      name: fullName,
      phone: state.user.phone || '',
      email: '',
      registered: true,
      joinedAt: state.user.firstSeen,
      avatar: state.user.photoUrl,
    });

    // Save address to store
    useStore.getState().addAddress({ label: 'Home', city, address, phone: state.user.phone });
  }, [state.user, setProfile]);

  /**
   * Logout — clear local session
   */
  const logout = useCallback(() => {
    clearCachedAuth();
    setState({ status: 'unauthenticated', user: null, error: null });
    setProfile({ name: '', phone: '', email: '', registered: false, joinedAt: '' });
    toast('Logged out', 'info');
  }, [setProfile]);

  // ============================================================
  // Initialize auth on mount
  // ============================================================

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      // Notify Telegram we're ready
      telegramReady();

      // 1. Try cached auth first (instant UI)
      const cached = loadCachedAuth();
      if (cached) {
        setState({
          status: cached.phone ? 'authenticated' : 'pending_phone',
          user: cached,
          error: null,
        });
      }

      // 2. If running in Telegram, verify with server
      if (isRunningInTelegram()) {
        await login();
      } else if (!cached) {
        // Not in Telegram and no cached session
        setState({ status: 'unauthenticated', user: null, error: null });
      }
    };

    init();
  }, [login]);

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
