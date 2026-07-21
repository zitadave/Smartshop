import { useState } from 'react';
import { SpinWheel, StreakBadge } from '@/components/game/SpinWheel';
import { checkStreak, claimStreakReward, getStreak, getSpinData } from '@/lib/game';
import { AnimatedEmoji } from '@/components/ui/AnimatedEmoji';
import { Gift, Flame, Sparkles, Trophy, ArrowLeft, RotateCcw, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';

export default function GameCenter() {
  const navigate = useNavigate();
  const { addLoyaltyPoints } = useStore();
  const streak = checkStreak();
  const spinData = getSpinData();
  const [streakClaimed, setStreakClaimed] = useState(getStreak().claimed);

  const handleWin = (prize: string, value: number) => {
    if (prize.includes('Loyalty') || prize.includes('Pts')) {
      addLoyaltyPoints(value);
    }
  };

  const handleClaimStreak = () => {
    const bonus = claimStreakReward();
    if (bonus > 0) {
      addLoyaltyPoints(bonus);
      setStreakClaimed(true);
      toast(`🔥 Streak reward: ${bonus} points!`, 'success');
    } else {
      toast('Already claimed today!', 'info');
    }
  };

  return (
    <div className="pb-8 animate-fadeUp">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-gradient-to-b from-primary/5 to-transparent backdrop-blur-xl px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3 mb-2">
          <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Game Center</h2>
              <p className="text-[9px] text-muted-foreground/60">Play, earn rewards, save more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Section */}
      <div className="mx-4 mt-3 p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Daily Streak</h3>
              <p className="text-[9px] text-muted-foreground/60">Visit daily for bonus points</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-orange-500">{streak.count}</div>
            <div className="text-[8px] text-muted-foreground/60">days</div>
          </div>
        </div>

        <StreakBadge count={streak.count} />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] text-muted-foreground">Reward: <strong className="text-amber-600">{streak.bonus} pts</strong></span>
          </div>
          <button
            className={cn(
              'px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all',
              streakClaimed ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:scale-105 active:scale-95'
            )}
            onClick={handleClaimStreak}
            disabled={streakClaimed}
          >
            {streakClaimed ? '✅ Claimed' : '🔥 Claim'}
          </button>
        </div>
      </div>

      {/* Spin to Win */}
      <div className="mx-4 mt-3 p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Spin to Win</h3>
            <p className="text-[9px] text-muted-foreground/60">{spinData.totalSpins || 0} spins so far</p>
          </div>
        </div>
        <SpinWheel onWin={handleWin} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-3">
        {[
          { icon: '🎡', label: 'Total Spins', val: `${spinData.totalSpins || 0}` },
          { icon: '🔥', label: 'Streak Days', val: `${streak.count}` },
          { icon: '🏆', label: 'Prizes Won', val: `${spinData.totalSpins || 0}` },
          { icon: '⭐', label: 'Points Earned', val: 'Coming Soon' },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-2xl p-3 border border-border/60 text-center">
            <AnimatedEmoji emoji={s.icon} animation="float" size="lg" />
            <div className="text-lg font-extrabold text-primary mt-1">{s.val}</div>
            <div className="text-[9px] text-muted-foreground/60">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mystery Box teaser */}
      <div className="mx-4 mt-3 p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl border border-amber-200/30 dark:border-amber-800/30">
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-wiggle">🎁</div>
          <div>
            <h3 className="text-sm font-bold">Mystery Boxes</h3>
            <p className="text-[10px] text-muted-foreground/60">Coming soon — earn boxes from purchases and referrals!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
