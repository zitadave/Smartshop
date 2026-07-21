/**
 * Gamification Engine — Streaks, Spin-to-Win, Loyalty
 */

const STORAGE_PREFIX = 'ss_game_';

interface SpinResult {
  prize: string;
  value: number;
  emoji: string;
}

const SPIN_PRIZES: SpinResult[] = [
  { prize: 'Free Delivery', value: 0, emoji: '🚚' },
  { prize: 'Br 50 Off', value: 50, emoji: '💰' },
  { prize: 'Br 100 Off', value: 100, emoji: '💎' },
  { prize: '10% Discount', value: 10, emoji: '🎯' },
  { prize: '15% Discount', value: 15, emoji: '🔥' },
  { prize: '25% Discount', value: 25, emoji: '⭐' },
  { prize: '50 Loyalty Points', value: 50, emoji: '🏆' },
  { prize: '100 Loyalty Points', value: 100, emoji: '👑' },
  { prize: 'Try Again!', value: 0, emoji: '🔄' },
  { prize: 'Br 20 Off', value: 20, emoji: '🎁' },
];

function get(key: string): any {
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || 'null'); } catch { return null; }
}
function set(key: string, val: any) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
}

// ===== STREAKS =====
export interface StreakData {
  count: number;
  lastVisit: string;
  claimed: boolean;
}

export function getStreak(): StreakData {
  return get('streak') || { count: 0, lastVisit: '', claimed: false };
}

export function checkStreak(): { count: number; bonus: number; isNew: boolean } {
  const today = new Date().toDateString();
  const streak = getStreak();

  if (streak.lastVisit === today) {
    return { count: streak.count, bonus: streak.count >= 7 ? 100 : streak.count >= 3 ? 30 : 0, isNew: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const isConsecutive = streak.lastVisit === yesterday;
  const newCount = isConsecutive ? streak.count + 1 : 1;

  set('streak', { count: newCount, lastVisit: today, claimed: false });

  const bonus = newCount >= 7 ? 100 : newCount >= 3 ? 30 : newCount >= 1 ? 10 : 0;
  return { count: newCount, bonus, isNew: true };
}

export function claimStreakReward(): number {
  const streak = getStreak();
  if (streak.claimed) return 0;
  const bonus = streak.count >= 7 ? 100 : streak.count >= 3 ? 30 : streak.count >= 1 ? 10 : 0;
  set('streak', { ...streak, claimed: true });
  return bonus;
}

// ===== SPIN TO WIN =====
export interface SpinData {
  lastSpin: string;
  spinsToday: number;
  totalSpins: number;
}

export function getSpinData(): SpinData {
  return get('spin') || { lastSpin: '', spinsToday: 0, totalSpins: 0 };
}

export function canSpin(): boolean {
  const spin = getSpinData();
  const today = new Date().toDateString();
  if (spin.lastSpin !== today) return true;
  return spin.spinsToday < 1;
}

export function spin(): SpinResult {
  const spin = getSpinData();
  const today = new Date().toDateString();

  const newSpin: SpinData = {
    lastSpin: today,
    spinsToday: spin.lastSpin === today ? spin.spinsToday + 1 : 1,
    totalSpins: (spin.totalSpins || 0) + 1,
  };
  set('spin', newSpin);

  // Weighted random — higher chance for smaller prizes
  const weights = [15, 12, 8, 12, 8, 5, 15, 5, 10, 10];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SPIN_PRIZES.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      const result = SPIN_PRIZES[i];
      // Save the prize code
      const codes: any[] = get('coupons') || [];
      if (result.value > 0) {
        codes.push({
          code: 'SPIN-' + Date.now().toString(36).toUpperCase(),
          discount: result.value,
          source: 'spin',
          claimed: false,
          expiresAt: Date.now() + 7 * 86400000,
        });
        set('coupons', codes);
      }
      return result;
    }
  }
  return SPIN_PRIZES[0];
}

// ===== MYSTERY BOX =====
export function openMysteryBox(): SpinResult {
  const boxes: number = get('boxes') || 0;
  if (boxes <= 0) return { prize: 'No boxes available', value: 0, emoji: '😅' };
  set('boxes', boxes - 1);

  const prizes: SpinResult[] = [
    { prize: 'Br 200 Off', value: 200, emoji: '🎉' },
    { prize: 'Br 500 Off', value: 500, emoji: '🎊' },
    { prize: '30% Discount', value: 30, emoji: '🔥' },
    { prize: '200 Loyalty Points', value: 200, emoji: '👑' },
    { prize: 'Free Product (Br 1000)', value: 1000, emoji: '🎁' },
  ];

  return prizes[Math.floor(Math.random() * prizes.length)];
}

// ===== COUPON MANAGEMENT =====
export function getCoupons(): any[] {
  return get('coupons') || [];
}

export function applyCoupon(code: string): { success: boolean; message: string } {
  const coupons = getCoupons();
  const coupon = coupons.find((c: any) => c.code === code && !c.claimed && c.expiresAt > Date.now());
  if (!coupon) return { success: false, message: 'Invalid or expired coupon code' };

  coupon.claimed = true;
  set('coupons', coupons);
  return { success: true, message: `✅ Coupon applied! You saved Br ${coupon.discount}` };
}
