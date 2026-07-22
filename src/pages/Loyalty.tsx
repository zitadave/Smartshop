import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { SpinWheel, StreakBadge, MysteryBox } from '@/components/game/SpinWheel';
import { checkStreak, claimStreakReward, getStreak, getSpinData } from '@/lib/game';
import { toast } from '@/components/Toast';
import { Gift, Flame, Sparkles, Trophy, ArrowLeft, Coins } from 'lucide-react';

export default function Loyalty() {
  const navigate = useNavigate();
  const store = useStore();
  const { loyaltyPoints, addToWallet, addNotification, settings } = store;
  const streak = checkStreak();
  const spinData = getSpinData();
  const [streakClaimed, setStreakClaimed] = useState(getStreak().claimed);
  const [showConversion, setShowConversion] = useState(false);
  const [convertAmount, setConvertAmount] = useState(100);
  const [mysteryBoxes, setMysteryBoxes] = useState(3);

  const gameSettings = (settings as any)?.gameSettings || {};
  const segments = (settings as any)?.wheelSegments || null;
  const minConversion = gameSettings?.minPointsForCash || 100;
  const conversionRate = gameSettings?.pointsToCashRate || 0.5;

  const getTier = (pts: number) =>
    pts >= 500 ? { name: 'Gold', icon: '🥇', next: null, color: 'from-amber-500 to-orange-600' } :
    pts >= 200 ? { name: 'Silver', icon: '🥈', next: { need: 500 - pts, label: 'Gold' }, color: 'from-slate-400 to-slate-500' } :
    { name: 'Bronze', icon: '🥉', next: { need: 200 - pts, label: 'Silver' }, color: 'from-amber-700 to-amber-800' };
  const tier = getTier(loyaltyPoints);

  const handleWin = (prize: string, value: number) => {
    if (prize.includes('Loyalty') || prize.includes('Pts')) {
      const newPts = loyaltyPoints + value;
      localStorage.setItem('ss_loyalty', String(newPts));
      useStore.setState({ loyaltyPoints: newPts });
    }
  };

  const handleMysteryWin = (prize: string, value: number) => {
    const newPts = loyaltyPoints + value;
    localStorage.setItem('ss_loyalty', String(newPts));
    useStore.setState({ loyaltyPoints: newPts });
  };

  const handleClaimStreak = () => {
    const bonus = claimStreakReward();
    if (bonus > 0) {
      const newPts = loyaltyPoints + bonus;
      localStorage.setItem('ss_loyalty', String(newPts));
      useStore.setState({ loyaltyPoints: newPts });
      setStreakClaimed(true);
      toast(`🔥 Streak reward: ${bonus} points!`, 'success');
    } else {
      toast('Already claimed today!', 'info');
    }
  };

  const handleConvertPoints = () => {
    if (loyaltyPoints < minConversion) { toast(`Need at least ${minConversion} points`, 'error'); return; }
    if (convertAmount < minConversion) { toast(`Minimum ${minConversion} points`, 'error'); return; }
    if (convertAmount > loyaltyPoints) { toast('Not enough points', 'error'); return; }
    const cashValue = Math.round(convertAmount * conversionRate);
    if (confirm(`Convert ${convertAmount} points → Br ${cashValue}?`)) {
      const newPoints = loyaltyPoints - convertAmount;
      localStorage.setItem('ss_loyalty', String(newPoints));
      useStore.setState({ loyaltyPoints: newPoints });
      addToWallet(cashValue);
      addNotification('💰', `Converted ${convertAmount} points to Br ${cashValue}!`);
      toast(`💰 Converted! Br ${cashValue} in your wallet!`, 'success');
      setShowConversion(false);
    }
  };

  return (
    <div className="pb-8 animate-fadeUp">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-gradient-to-b from-primary/5 to-transparent backdrop-blur-xl px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Loyalty & Rewards</h2>
              <p className="text-[9px] text-muted-foreground/60">Play, earn, convert to cash</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 mt-3">
        {/* Balance Card */}
        <div className="p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] opacity-80">Your Balance</p>
              <div className="text-2xl font-extrabold">{loyaltyPoints} pts</div>
              <p className="text-[9px] opacity-70 mt-0.5">≈ Br {Math.round(loyaltyPoints * conversionRate)}</p>
            </div>
            <button className="px-4 py-2 bg-white/20 rounded-xl text-[10px] font-bold hover:bg-white/30 transition-colors" onClick={() => setShowConversion(true)}>
              <Coins size={14} className="inline mr-1" />Convert
            </button>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }} />
          </div>
          <p className="text-[8px] opacity-60 mt-1">500 pts → Gold Tier</p>
        </div>

        {/* Tier Card */}
        <div className={cn('bg-gradient-to-r rounded-2xl p-4 text-white shadow-md', tier.color)}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.icon}</span>
            <div>
              <div className="text-lg font-extrabold">{tier.name} Tier</div>
              <div className="text-[10px] opacity-80">{tier.next ? `${tier.next.need} pts to ${tier.next.label}` : '🏆 Max tier — you\'re a legend!'}</div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"><Flame size={16} className="text-white" /></div>
              <div><h3 className="text-sm font-bold">Daily Streak</h3><p className="text-[9px] text-muted-foreground/60">Visit daily for bonus points</p></div>
            </div>
            <div className="text-right"><div className="text-lg font-extrabold text-orange-500">{streak.count}</div><div className="text-[8px] text-muted-foreground/60">days</div></div>
          </div>
          <StreakBadge count={streak.count} />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" /><span className="text-[10px] text-muted-foreground">Reward: <strong className="text-amber-600">{streak.bonus} pts</strong></span></div>
            <button className={cn('px-4 py-1.5 rounded-xl text-[10px] font-bold', streakClaimed ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:scale-105 active:scale-95')} onClick={handleClaimStreak} disabled={streakClaimed}>{streakClaimed ? '✅ Claimed' : '🔥 Claim'}</button>
          </div>
        </div>

        {/* Spin to Win */}
        <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Gift size={16} className="text-white" /></div>
            <div><h3 className="text-sm font-bold">Spin to Win</h3><p className="text-[9px] text-muted-foreground/60">{spinData.totalSpins || 0} spins so far</p></div>
          </div>
          <SpinWheel onWin={handleWin} segments={segments} adminSettings={gameSettings} />
        </div>

        {/* Mystery Box */}
        <div className="p-4 bg-card rounded-2xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center"><Gift size={16} className="text-white" /></div>
            <div><h3 className="text-sm font-bold">Mystery Boxes</h3><p className="text-[9px] text-muted-foreground/60">Open boxes for exclusive prizes!</p></div>
          </div>
          <MysteryBox onOpen={handleMysteryWin} boxes={mysteryBoxes} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🎡', label: 'Total Spins', val: `${spinData.totalSpins || 0}` },
            { icon: '🔥', label: 'Streak Days', val: `${streak.count}` },
            { icon: '🏆', label: 'Prizes Won', val: `${spinData.totalSpins || 0}` },
            { icon: '⭐', label: 'Points', val: `${loyaltyPoints}` },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 border border-border/60 text-center">
              <div className="text-lg">{s.icon}</div>
              <div className="text-lg font-extrabold text-primary mt-1">{s.val}</div>
              <div className="text-[9px] text-muted-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Points Conversion Modal */}
      {showConversion && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowConversion(false)}>
          <div className="bg-card rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <Coins size={32} className="mx-auto text-amber-500 mb-1" />
              <h3 className="text-sm font-bold">Convert Points to Cash</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Exchange your loyalty points for real cash in your wallet!</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 mb-3 text-xs">
              <div className="flex justify-between mb-1"><span>Your Points</span><span className="font-bold">{loyaltyPoints}</span></div>
              <div className="flex justify-between mb-1"><span>Rate</span><span className="font-bold">{minConversion} pts = Br {Math.round(minConversion * conversionRate)}</span></div>
            </div>
            <div className="mb-3">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Points to Convert</label>
              <input type="number" className="w-full p-3 border border-input rounded-xl text-sm bg-card mt-1" value={convertAmount} onChange={e => setConvertAmount(Math.max(minConversion, Number(e.target.value)))} min={minConversion} max={loyaltyPoints} />
              <p className="text-[9px] text-green-600 mt-1">You'll receive: <strong>Br {Math.round(convertAmount * conversionRate)}</strong></p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold" onClick={handleConvertPoints} disabled={loyaltyPoints < minConversion}>Convert to Cash</button>
              <button className="px-4 py-3 border border-border rounded-xl text-xs" onClick={() => setShowConversion(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
