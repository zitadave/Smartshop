/**
 * Smart Shop — Telegram Mini App SDK
 * Type-safe wrapper around Telegram WebApp APIs
 * 
 * @see https://core.telegram.org/bots/webapps
 */

// ============================================================
// Types
// ============================================================

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  /** Whether the user allows bot to message them */
  allows_write_to_pm?: boolean;
}

export interface TelegramChat {
  id: number;
  type: 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  auth_date: number;
  hash: string;
  user?: TelegramUser;
  chat?: TelegramChat;
  chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;

  // Methods
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  SettingsButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string) => void;
}

// ============================================================
// Global declaration
// ============================================================

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ============================================================
// Singleton SDK instance
// ============================================================

let _webApp: TelegramWebApp | null = null;

/**
 * Get the Telegram WebApp instance.
 * Returns null if running outside Telegram.
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  if (_webApp) return _webApp;

  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe) {
      _webApp = tg;
      return tg;
    }
  } catch {
    // Silently fail — running outside Telegram
  }
  return null;
}

/**
 * Check if the app is running inside Telegram
 */
export function isRunningInTelegram(): boolean {
  return getTelegramWebApp() !== null;
}

/**
 * Get the Telegram user data from initDataUnsafe
 */
export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Get the raw initData string (needed for server-side HMAC verification)
 */
export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
}

/**
 * Notify Telegram that the Mini App is ready
 * Should be called once the app has rendered
 */
export function telegramReady(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

/**
 * Set the Telegram Main Button configuration
 */
export function setMainButton(params: {
  text: string;
  color?: string;
  textColor?: string;
  visible?: boolean;
  active?: boolean;
  onClick?: () => void;
}): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  const btn = tg.MainButton;
  btn.setText(params.text);

  if (params.color) btn.color = params.color;
  if (params.textColor) btn.textColor = params.textColor;
  if (params.visible) btn.show();
  if (params.active === false) btn.disable();
  if (params.onClick) btn.onClick(params.onClick);
}

/**
 * Show a confirm dialog in Telegram style
 */
export function showTelegramConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      resolve(window.confirm(message));
      return;
    }
    tg.showConfirm(message, (confirmed) => resolve(confirmed));
  });
}

/**
 * Show an alert in Telegram style
 */
export function showTelegramAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      alert(message);
      resolve();
      return;
    }
    tg.showAlert(message, () => resolve());
  });
}

/**
 * Get current theme colors from Telegram
 */
export function getTelegramTheme() {
  const tg = getTelegramWebApp();
  if (!tg) return null;
  return {
    scheme: tg.colorScheme,
    ...tg.themeParams,
  };
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection',
  style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning'
): void {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  switch (type) {
    case 'impact':
      tg.HapticFeedback.impactOccurred((style as any) || 'medium');
      break;
    case 'notification':
      tg.HapticFeedback.notificationOccurred((style as any) || 'success');
      break;
    case 'selection':
      tg.HapticFeedback.selectionChanged();
      break;
  }
}

/**
 * Open a link — uses Telegram's internal browser inside Mini App
 */
export function openTelegramLink(url: string): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Verify Telegram WebApp initData HMAC signature
 * This should be done server-side (in api/index.ts)
 * 
 * @param initData - The raw initData string from Telegram
 * @param botToken - Your Telegram bot token
 * @returns Whether the initData is valid
 */
export async function verifyTelegramInitData(
  initData: string,
  botToken: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
    
    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash') || '';
    params.delete('hash');
    
    // Sort keys alphabetically and create data check string
    const sorted = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    
    const secretKey2 = await crypto.subtle.importKey(
      'raw',
      secret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const computedHash = await crypto.subtle.sign('HMAC', secretKey2, encoder.encode(sorted));
    const computedHashHex = Array.from(new Uint8Array(computedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedHashHex === hash;
  } catch {
    return false;
  }
}
