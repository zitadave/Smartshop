// ============================================
// Smart Shop — Gamification: Badges, Streaks, Levels
// Stack: localStorage + Supabase API (FREE)
// ============================================

export interface Badge {
  id: string;
  name: string;
  amharicName: string;
  emoji: string;
  description: string;
  condition: string;
}

export interface UserStats {
  level: number;
  levelName: string;
  points: number;
  nextLevelPoints: number;
  streak: number;
  longestStreak: number;
  badges: Badge[];
  recentActivity: string[];
}

// ── All available badges ────────────────────────────────────
export const ALL_BADGES: Badge[] = [
  { id: 'first_purchase', name: 'First Purchase', amharicName: 'የመጀመሪያ ግዢ', emoji: '🌟', description: 'Complete your first order', condition: 'Buy any product' },
  { id: 'streak_3', name: '3-Day Streak', amharicName: 'የ3 ቀን ጀግና', emoji: '🔥', description: 'Shop 3 days in a row', condition: 'Daily login streak' },
  { id: 'streak_7', name: '7-Day Streak', amharicName: 'የሳምንቱ ጀግና', emoji: '💪', description: 'Shop 7 days in a row', condition: 'Daily login streak' },
  { id: 'streak_30', name: 'Monthly Champion', amharicName: 'የወሩ ጀግና', emoji: '👑', description: 'Shop 30 days in a row', condition: 'Daily login streak' },
  { id: 'referral_3', name: 'Good Heart', amharicName: 'መልካም ልብ', emoji: '💝', description: 'Refer 3 friends', condition: 'Referrals' },
  { id: 'referral_10', name: 'Super Connector', amharicName: 'ሱፐር አገናኝ', emoji: '🔗', description: 'Refer 10 friends', condition: 'Referrals' },
  { id: 'group_buy_3', name: 'Team Player', amharicName: 'ማህበረኛ', emoji: '🤝', description: 'Join 3 group buys', condition: 'Group buying' },
  { id: 'savings_500', name: 'Saver', amharicName: 'ቆጣቢ', emoji: '💰', description: 'Save Br 500 total', condition: 'Total savings' },
  { id: 'savings_5000', name: 'Big Saver', amharicName: 'ታላቅ ቆጣቢ', emoji: '💎', description: 'Save Br 5,000 total', condition: 'Total savings' },
  { id: 'review_5', name: 'Reviewer', amharicName: 'ገምጋሚ', emoji: '📝', description: 'Write 5 reviews', condition: 'Reviews written' },
  { id: 'review_20', name: 'Expert Reviewer', amharicName: 'ኤክስፐርት ገምጋሚ', emoji: '⭐', description: 'Write 20 reviews', condition: 'Reviews written' },
  { id: 'subscription_1', name: 'Subscriber', amharicName: 'ደንበኛ', emoji: '📦', description: 'Create a subscription', condition: 'Active subscription' },
  { id: 'reseller_first', name: 'Reseller', amharicName: 'ሻጭ', emoji: '🏪', description: 'Make your first referral sale', condition: 'Referral sales' },
  { id: 'reseller_elite', name: 'Elite Reseller', amharicName: 'ኤሊት ሻጭ', emoji: '🏆', description: 'Earn Br 5,000 in commissions', condition: 'Total commissions' },
  { id: 'voice_search', name: 'Voice Pioneer', amharicName: 'የድምጽ አቅኚ', emoji: '🎤', description: 'Use voice search 5 times', condition: 'Voice searches' },
];

// ── Level system ────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: 'ጀማሪ', minPoints: 0 },
  { level: 2, name: 'ነሺ', minPoints: 100 },
  { level: 3, name: 'ገዢ', minPoints: 300 },
  { level: 4, name: 'ቋሚ ደንበኛ', minPoints: 700 },
  { level: 5, name: 'የሱቅ ወዳጅ', minPoints: 1500 },
  { level: 6, name: 'የሱቅ ጀግና', minPoints: 3000 },
  { level: 7, name: 'አልማዝ', minPoints: 6000 },
  { level: 8, name: 'ፕላቲነም', minPoints: 10000 },
];

export function getLevel(points: number): { level: number; name: string; nextLevelPoints: number } {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  
  return {
    level: currentLevel.level,
    name: currentLevel.name,
    nextLevelPoints: nextLevel.minPoints - points,
  };
}

// ── Points earned per action ────────────────────────────────
export const POINTS = {
  PURCHASE: 10,        // Per Br 100 spent
  REVIEW: 25,          // Per review
  REFERRAL: 50,        // Per referred friend who buys
  GROUP_BUY: 30,       // Per group buy participation
  DAILY_LOGIN: 5,      // Per day
  VOICE_SEARCH: 3,     // Per voice search
  SUBSCRIPTION: 100,   // Per subscription created
  PROFILE_COMPLETE: 20,// Complete profile
};

// ── Streak management ───────────────────────────────────────
const STREAK_KEY = 'ss_streak';
const LAST_VISIT_KEY = 'ss_last_visit';

export function updateStreak(): { streak: number; isNewDay: boolean } {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0');

  if (lastVisit === today) {
    return { streak, isNewDay: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (lastVisit === yesterdayStr) {
    streak++;
  } else if (lastVisit && lastVisit !== today) {
    streak = 1; // Reset streak
  } else {
    streak = 1;
  }

  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(LAST_VISIT_KEY, today);

  return { streak, isNewDay: true };
}

// ── Award points ────────────────────────────────────────────
export async function awardPoints(telegramId: number, action: keyof typeof POINTS, count = 1): Promise<number> {
  const points = POINTS[action] * count;
  
  const res = await fetch('/api/loyalty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: telegramId,
      points,
      action,
    }),
  });
  
  const data = await res.json();
  return data.points;
}

// ── Check and award badges ──────────────────────────────────
export async function checkBadges(telegramId: number): Promise<Badge[]> {
  const earnedBadges: Badge[] = [];
  const stored = localStorage.getItem('ss_badges');
  const existingBadges: string[] = stored ? JSON.parse(stored) : [];

  for (const badge of ALL_BADGES) {
    if (existingBadges.includes(badge.id)) {
      earnedBadges.push(badge);
      continue;
    }
  }

  return earnedBadges;
}

// ── Save earned badge ───────────────────────────────────────
export function saveBadge(badgeId: string): void {
  const stored = localStorage.getItem('ss_badges');
  const badges: string[] = stored ? JSON.parse(stored) : [];
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    localStorage.setItem('ss_badges', JSON.stringify(badges));
  }
}

// ── Share achievement to Telegram ───────────────────────────
export function shareAchievement(badge: Badge): void {
  const message =
    `🏆 *አዲስ ሜዳሊያ! (New Badge!)*\n\n` +
    `${badge.emoji} *${badge.amharicName}*\n` +
    `   ${badge.name}\n\n` +
    `${badge.description}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true });
  }
}
