/**
 * ============================================================================
 * SOCIAL COMMERCE & IN-APP WEBVIEW ENGINE (TikTok, Telegram, Instagram, Web)
 * ============================================================================
 * Provides:
 * 1. O(1) platform detection (TikTok In-App Browser, Telegram WebApp, IG/FB WebView).
 * 2. Safe-area layout classes for top/bottom navigation bars in social apps.
 * 3. Creator / Affiliate campaign deep-link parsing and secure attribution storage.
 * 4. Multi-platform social Pixel & Event Telemetry (TikTok ttq, Meta fbq).
 * 5. Input sanitization & security guards against XSS / WebView injection.
 */

import { isRunningInTelegram } from '@/lib/telegram';

export type SocialPlatform = 'telegram' | 'tiktok' | 'instagram' | 'facebook' | 'web';

export interface SocialEnvironmentMeta {
  platform: SocialPlatform;
  isSocialWebView: boolean;
  isTikTok: boolean;
  isTelegram: boolean;
  isInstagram: boolean;
  creatorRef: string | null;
  utmSource: string | null;
  safeAreaTopClass: string;
  safeAreaBottomClass: string;
}

/**
 * Validates alphanumeric referral codes (2-32 chars, letters/numbers/underscores/hyphens only)
 * Prevents XSS or injection via URL query strings.
 */
function sanitizeReferralCode(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (/^[a-zA-Z0-9_-]{2,32}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Sanitizes user input string against HTML tags and script injection.
 * Enforces maximum string length.
 */
export function sanitizeInputString(str: string | null | undefined, maxLength = 200): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>"'`=/]/g, '')  // Remove special syntax chars
    .trim()
    .slice(0, maxLength);
}

/**
 * O(1) regex-based detection of social app WebViews and referral URL params.
 * Safely persists creator referral attribution to localStorage.
 */
export function detectSocialEnvironment(): SocialEnvironmentMeta {
  if (typeof window === 'undefined') {
    return {
      platform: 'web',
      isSocialWebView: false,
      isTikTok: false,
      isTelegram: false,
      isInstagram: false,
      creatorRef: null,
      utmSource: null,
      safeAreaTopClass: '',
      safeAreaBottomClass: '',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isTg = isRunningInTelegram();
  const isTikTok = /bytedance|tiktok|musical_ly|bytelocale/i.test(ua);
  const isInstagram = /instagram|fban|fbav/i.test(ua);

  let platform: SocialPlatform = 'web';
  if (isTikTok) platform = 'tiktok';
  else if (isTg) platform = 'telegram';
  else if (isInstagram) platform = 'instagram';

  const isSocialWebView = isTikTok || isTg || isInstagram;

  // Parse URL search parameters safely
  let creatorRef: string | null = null;
  let utmSource: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const rawRef = params.get('ref') || params.get('creator') || params.get('affiliate_id');
    const rawSource = params.get('utm_source') || params.get('source');

    creatorRef = sanitizeReferralCode(rawRef);
    if (rawSource) {
      utmSource = sanitizeInputString(rawSource, 30).toLowerCase();
    }

    // Persist verified creator attribution
    if (creatorRef) {
      localStorage.setItem('ss_creator_ref', creatorRef);
      if (utmSource || platform !== 'web') {
        localStorage.setItem('ss_creator_source', utmSource || platform);
      }
    } else {
      creatorRef = sanitizeReferralCode(localStorage.getItem('ss_creator_ref'));
    }
  } catch {
    // URLSearchParams fallback
  }

  return {
    platform,
    isSocialWebView,
    isTikTok,
    isTelegram: isTg,
    isInstagram,
    creatorRef,
    utmSource,
    // Safe area spacing for TikTok and Instagram top/bottom UI bars
    safeAreaTopClass: isTikTok ? 'pt-1 sm:pt-0' : '',
    safeAreaBottomClass: isTikTok ? 'pb-2 sm:pb-0' : '',
  };
}

/**
 * Retrieve saved creator attribution code and social source for order checkout tagging.
 */
export function getCreatorReferral(): { code: string | null; source: SocialPlatform | string } {
  if (typeof window === 'undefined') return { code: null, source: 'web' };
  try {
    const code = sanitizeReferralCode(localStorage.getItem('ss_creator_ref'));
    const source = localStorage.getItem('ss_creator_source') || 'web';
    return { code, source };
  } catch {
    return { code: null, source: 'web' };
  }
}

/**
 * Multi-Platform Social Commerce Telemetry Engine.
 * Safely dispatches non-blocking events to TikTok Pixel (ttq) and Meta Pixel (fbq).
 */
export function trackSocialEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'CompletePayment' | 'JoinGroupBuy',
  payload: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. TikTok Pixel SDK (window.ttq)
    const ttq = (window as any).ttq;
    if (ttq && typeof ttq.track === 'function') {
      const ttEventMap: Record<string, string> = {
        PageView: 'PageView',
        ViewContent: 'ViewContent',
        AddToCart: 'AddToCart',
        InitiateCheckout: 'InitiateCheckout',
        CompletePayment: 'CompletePayment',
        JoinGroupBuy: 'ClickButton',
      };
      ttq.track(ttEventMap[eventName] || eventName, {
        content_type: 'product',
        ...payload,
      });
    }

    // 2. Meta / Instagram Pixel SDK (window.fbq)
    const fbq = (window as any).fbq;
    if (fbq && typeof fbq === 'function') {
      fbq('track', eventName, payload);
    }
  } catch {
    // Telemetry errors must never impact customer UX
  }
}
