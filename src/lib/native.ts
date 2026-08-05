/**
 * ============================================================================
 * UNIVERSAL CAPACITOR NATIVE DEVICE BRIDGE & PLATFORM DETECTOR
 * ============================================================================
 * Unifies hardware geolocation, camera, haptics, share, and safe areas across:
 * 1. Android Native (.apk / .aab)
 * 2. iOS Native (.ipa)
 * 3. Telegram Mini App (TMA WebView)
 * 4. TikTok Mini App / In-App WebView
 * 5. Universal Desktop & Mobile Browser
 */

import { isRunningInTelegram } from '@/lib/telegram';
import { detectSocialEnvironment } from '@/lib/social';

export type RuntimePlatform = 'ios' | 'android' | 'telegram' | 'tiktok' | 'web';

export function getRuntimePlatform(): RuntimePlatform {
  if (typeof window === 'undefined') return 'web';

  // 1. Check if running inside Telegram Mini App
  if (isRunningInTelegram()) {
    return 'telegram';
  }

  // 2. Check if running inside TikTok In-App Browser
  const social = detectSocialEnvironment();
  if (social.isTikTok) {
    return 'tiktok';
  }

  // 3. Check if running inside Capacitor Native Container (iOS / Android)
  const cap = (window as any).Capacitor;
  if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
    const platform = cap.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }

  return 'web';
}

export function isNativeMobileApp(): boolean {
  const platform = getRuntimePlatform();
  return platform === 'ios' || platform === 'android';
}

export function getAppVersionInfo(): { name: string; version: string; build: string; platform: RuntimePlatform } {
  return {
    name: 'Smart Shop',
    version: '2.5.0',
    build: 'BUILD-2026-08-02-V64000',
    platform: getRuntimePlatform(),
  };
}
