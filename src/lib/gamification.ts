// ============================================
// Smart Shop — Enhanced Gamification
// Free: localStorage + Supabase API
// ============================================

// ── Badges ───────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  nameAm: string;
  emoji: string;
  description: string;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  streakDays: number;
  reviewsWritten: number;
  referralsMade: number;
  groupBuysJoined: number;
  totalSaved: number;
  subscriptionCount: number;
}

export const BADGES: Badge[] = [
  {
    id: 'first_purchase', name: 'First Purchase', nameAm: 'የመጀመሪያ ግዢ',
    emoji: '🌟', description: 'Complete your first purchase',
    condition: (s) => s.totalOrders >= 1,
  },
  {
    id: 'streak_7', name: '7-Day Streak', nameAm: '7 ቀን ጀግና',
    emoji: '🔥', description: 'Shop 7 days in a row',
    condition: (s) => s.streakDays >= 7,
  },
  {
    id: 'streak_30', name: 'Monthly Champion', nameAm: 'የወሩ ጀግና',
    emoji: '💪', description: 'Shop 30 days in a row',
    condition: (s) => s.streakDays >= 30,
  },
  {
    id: 'referral_5', name: 'Good Heart', nameAm: 'መልካም ልብ',
    emoji: '💝', description: 'Refer 5 friends to Smart Shop',
    condition: (s) => s.referralsMade >= 5,
  },
  {
    id: 'group_buy_3', name: 'Group Buyer', nameAm: 'ማህበረኛ',
    emoji: '🤝', description: 'Join 3 group buys',
    condition: (s) => s.groupBuysJoined >= 3,
  },
  {
    id: 'savings_500', name: 'Saver', nameAm: 'ቆጣቢ',
    emoji: '💰', description: 'Save Br 500 total through deals',
    condition: (s) => s.totalSaved >= 500,
  },
  {
    id: 'review_10', name: 'Reviewer', nameAm: 'ገምጋሚ',
    emoji: '📝', description: 'Write 10 product reviews',
    condition: (s) => s.reviewsWritten >= 10,
  },
  {
    id: 'big_spender', name: 'VIP', nameAm: 'እንግዳ',
    emoji: '👑', description: 'Spend Br 10,000 total',
    condition: (s) => s.totalSpent >= 10000,
  },
  {
    id: 'subscriber', name: 'Subscriber', nameAm: 'ደንበኛ',
    emoji: '📦', description: 'Start a subscription',
    condition: (s) => s.subscriptionCount >= 1,
  },
  {
    id: 'voice_searcher', name: 'Voice User', nameAm: 'ድምጽ',
    emoji: '🎤', description: 'Use voice search once',
    condition: (s) => true, // Awarded on first use
  },
];

const STREAK_KEY = 'ss_streak';
const LAST_VISIT_KEY = 'ss_last_visit';
const BADGES_KEY = 'ss_earned_badges';

/**
 * Track daily visit for streak counting
 */
export function trackDailyVisit(): number {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0');

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastVisit === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1;
    }

    localStorage.setItem(STREAK_KEY, String(streak));
    localStorage.setItem(LAST_VISIT_KEY, today);
  }

  return streak;
}

/**
 * Mark a badge as earned
 */
export function earnBadge(badgeId: string): void {
  const earned = getEarnedBadges();
  if (!earned.includes(badgeId)) {
    earned.push(badgeId);
    localStorage.setItem(BADGES_KEY, JSON.stringify(earned));
  }
}

/**
 * Get all earned badge IDs
 */
export function getEarnedBadges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BADGES_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Check which new badges a user has earned
 */
export function checkNewBadges(stats: UserStats): Badge[] {
  const earned = getEarnedBadges();
  return BADGES.filter(badge =>
    !earned.includes(badge.id) && badge.condition(stats)
  );
}

/**
 * Get spinner prizes (extends existing game.ts)
 */
export function getSpinnerPrizes(): Array<{ prize: string; value: number; emoji: string; weight: number }> {
  return [
    { prize: 'Free Delivery', value: 0, emoji: '🚚', weight: 20 },
    { prize: 'Br 50 Off', value: 50, emoji: '💰', weight: 15 },
    { prize: 'Br 100 Off', value: 100, emoji: '💎', weight: 10 },
    { prize: '10% Discount', value: 10, emoji: '🎯', weight: 15 },
    { prize: '15% Discount', value: 15, emoji: '🔥', weight: 10 },
    { prize: '25% Discount', value: 25, emoji: '⭐', weight: 5 },
    { prize: '50 Loyalty Points', value: 50, emoji: '🏆', weight: 15 },
    { prize: '100 Loyalty Points', value: 100, emoji: '👑', weight: 5 },
    { prize: 'Try Again', value: 0, emoji: '🔄', weight: 5 },
  ];
}

/**
 * Spin the wheel with weighted random selection
 */
export function spinWheel(): { prize: string; value: number; emoji: string } {
  const prizes = getSpinnerPrizes();
  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const prize of prizes) {
    random -= prize.weight;
    if (random <= 0) return prize;
  }

  return prizes[0];
}

/**
 * Get next badge to unlock (for progress display)
 */
export function getNextBadge(stats: UserStats): Badge | null {
  const earned = getEarnedBadges();
  for (const badge of BADGES) {
    if (!earned.includes(badge.id) && !badge.condition(stats)) {
      return badge;
    }
  }
  return null;
}

/**
 * Calculate level based on badges earned
 */
export function calculateLevel(earnedBadges: number): { level: number; progress: number } {
  const level = Math.floor(earnedBadges / 2) + 1;
  const progress = (earnedBadges % 2) / 2;
  return { level, progress };
}
