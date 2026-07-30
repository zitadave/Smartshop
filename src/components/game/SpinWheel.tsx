import { useState, useEffect, useCallback } from 'react';
import { canSpin, getSpinData, openMysteryBox } from '@/lib/game';
import { RotateCcw, Gift, Sparkles } from 'lucide-react';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';

// Default segments
const DEFAULT_SEGMENTS = [
  { label: '🚚 Free Delivery', color: '#e53e3e', value: 0 },
  { label: '💰 Br 50 Off', color: '#dd6b20', value: 50 },
  { label: '💎 Br 100 Off', color: '#d69e2e', value: 100 },
  { label: '🎯 10% Off', color: '#38a169', value: 10 },
  { label: '🔥 15% Off', color: '#3182ce', value: 15 },
  { label: '⭐ 25% Off', color: '#805ad5', value: 25 },
  { label: '🏆 50 Pts', color: '#ed64a6', value: 50 },
  { label: '👑 100 Pts', color: '#0bc5ea', value: 100 },
  { label: '🔄 Try Again', color: '#a0aec0', value: 0 },
  { label: '🎁 Br 20 Off', color: '#e53e3e', value: 20 },
];

interface SpinWheelProps {
  onWin: (prize: string, value: number) => void;
  segments?: typeof DEFAULT_SEGMENTS;
  adminSettings?: Record<string, any>;
}

// Autonomous Linguistic Segment Parser
export const parsePrizeText = (label: string) => {
  const clean = label.toLowerCase();
  const numMatch = clean.match(/\d+/);
  const parsedValue = numMatch ? parseInt(numMatch[0]) : 0;

  if (clean.includes('pt') || clean.includes('point')) {
    return { type: 'points', value: parsedValue };
  }
  if (clean.includes('free') && clean.includes('del')) {
    return { type: 'free_delivery', value: 80 };
  }
  return { type: 'discount', value: parsedValue };
};

// Platform Protection: Weighted Odds Calculator
export const getWeightedTargetIndex = (segments: any[]): number => {
  const weights = segments.map(seg => {
    const parsed = parsePrizeText(seg.label || '');
    const val = parsed.value || 0;
    
    if (parsed.type === 'free_delivery') return 40; // High odds
    if (val >= 100) return 1;       // High prizes (>= Br 100 or >= 100 Pts): 1 (Extremely Low ~1.5% chance)
    if (val >= 50) return 5;        // Medium prizes: 5 (~7.5% chance)
    if (val > 0) return 15;         // Small prizes: 15 (~22.5% chance)
    return 45;                      // Freebies / Try Again: 45 (Highest odds! ~68.5% chance)
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let randomChoice = Math.random() * totalWeight;

  for (let i = 0; i < segments.length; i++) {
    randomChoice -= weights[i];
    if (randomChoice <= 0) {
      return i;
    }
  }
  return segments.length - 1;
};

export function SpinWheel({ onWin, segments: customSegments, adminSettings }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [available, setAvailable] = useState(canSpin());
  const segments = customSegments || DEFAULT_SEGMENTS;

  // Apply admin customizable settings (distance offset + orientation + font/color)
  const fontSize = adminSettings?.wheelFontSize || 20;
  const fontColor = adminSettings?.wheelFontColor || '#ffffff';
  const showEmoji = adminSettings?.wheelShowEmoji !== false;
  const textRadius = adminSettings?.wheelTextRadius || 55;
  const orientation = adminSettings?.wheelTextOrientation || 'radial';

  const handleSpin = useCallback(() => {
    if (!available || spinning) return;
    setSpinning(true);

    // Save spin data
    const sData = getSpinData();
    const today = new Date().toDateString();
    localStorage.setItem('ss_game_spin', JSON.stringify({
      lastSpin: today,
      spinsToday: sData.lastSpin === today ? sData.spinsToday + 1 : 1,
      totalSpins: (sData.totalSpins || 0) + 1,
    }));

    // Calculate weighted index based on reward sizes (Platform Protection!)
    const target = getWeightedTargetIndex(segments);
    const result = segments[target];

    const segAngle = 360 / segments.length;
    // Increase rotational multiplier to make spin elegant over 16 seconds
    const fullSpins = (15 + Math.floor(Math.random() * 5)) * 360;
    const finalAngle = fullSpins + (360 - target * segAngle - segAngle / 2);
    setRotation(prev => prev + finalAngle);

    // THRILLING SUSPENSE: 16-second spin timeout!
    setTimeout(() => {
      setSpinning(false);
      setAvailable(false);
      
      const prizeLabel = result.label || 'Try Again';
      const parsed = parsePrizeText(prizeLabel);

      if (parsed.type === 'points' && parsed.value > 0) {
        // Automatically add loyalty points
        const curPts = parseInt(localStorage.getItem('ss_loyalty') || '0');
        const newPts = curPts + parsed.value;
        localStorage.setItem('ss_loyalty', String(newPts));
        useStore.setState({ loyaltyPoints: newPts });
        toast(`🎉 Congratulations! You won ${parsed.value} Loyalty Points!`, 'success');
      } else if (parsed.value > 0 || parsed.type === 'free_delivery') {
        // Generate promo shopping coupon
        const discountValue = parsed.type === 'free_delivery' ? 80 : parsed.value;
        const codes = JSON.parse(localStorage.getItem('ss_game_coupons') || '[]');
        const couponCode = 'SPIN-' + Date.now().toString(36).toUpperCase();
        codes.push({
          code: couponCode,
          discount: discountValue,
          source: 'spin',
          claimed: false,
          expiresAt: Date.now() + 7 * 86400000,
        });
        localStorage.setItem('ss_game_coupons', JSON.stringify(codes));
        toast(`🎉 You won a coupon: ${prizeLabel}! Code: ${couponCode}`, 'success');
      } else {
        toast(`🔄 Result: ${prizeLabel}! Try again tomorrow.`, 'info');
      }
      
      onWin(prizeLabel, parsed.value);
    }, 16000); // 16-second gradual slowdown
  }, [available, spinning, onWin, segments]);

  useEffect(() => { setAvailable(canSpin()); }, []);

  const displayLabel = (seg: typeof segments[0]) => {
    if (!showEmoji) return seg.label.replace(/[^\w\s%Br]/gi, '').trim();
    return seg.label.split(' ').slice(1).join(' ') || seg.label;
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full border-[0.5px] border-primary/5" />
        
        {/* NO GAP POINTER REALIGNMENT: shifted translate-y downwards */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1.5 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        </div>

        {/* Dynamic transition-transform sets 16-second ease-out curve */}
        <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-[16000ms] cubic-bezier(0.1, 0.8, 0.2, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}>
          {segments.map((seg, i) => {
            const angle = (360 / segments.length) * i;
            const endAngle = angle + 360 / segments.length;
            const midAngle = (((angle + endAngle) / 2) - 90) * (Math.PI / 180);
            const x1 = 100 + 85 * Math.cos((angle - 90) * (Math.PI / 180));
            const y1 = 100 + 85 * Math.sin((angle - 90) * (Math.PI / 180));
            const x2 = 100 + 85 * Math.cos((endAngle - 90) * (Math.PI / 180));
            const y2 = 100 + 85 * Math.sin((endAngle - 90) * (Math.PI / 180));
            const largeArc = endAngle - angle > 180 ? 1 : 0;
            const path = `M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            // Custom text coordinate offset
            const textX = 100 + textRadius * Math.cos(midAngle);
            const textY = 100 + textRadius * Math.sin(midAngle);

            // Compute dynamic rotation angle based on orientation settings
            let rotateAngle = 0;
            if (orientation === 'radial') {
              rotateAngle = angle + (360 / segments.length / 2);
            } else if (orientation === 'to-center') {
              // Points directly inward toward the center
              rotateAngle = angle + (360 / segments.length / 2) + 90;
            } else if (orientation === 'vertical') {
              rotateAngle = 90;
            } else {
              rotateAngle = 0; // flat horizontal
            }

            return (
              <g key={i}>
                <path d={path} fill={seg.color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle"
                  fill={fontColor} fontSize={fontSize}
                  transform={`rotate(${rotateAngle}, ${textX}, ${textY})`}>
                  {displayLabel(seg).substring(0, 8)}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="5" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        </svg>
      </div>

      <button className={cn(
        'px-10 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-lg',
        available && !spinning
          ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:scale-105 active:scale-95'
          : 'bg-muted text-muted-foreground cursor-not-allowed'
      )} onClick={handleSpin} disabled={!available || spinning}>
        {spinning ? <><RotateCcw size={18} className="animate-spin" /> Spinning...</>
        : available ? <><Gift size={18} /> Spin to Win!</>
        : <><Sparkles size={18} /> Come back tomorrow!</>}
      </button>
    </div>
  );
}

export function StreakBadge({ count }: { count: number }) {
  const days = Math.min(count, 7);
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all',
          i < days ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground/40'
        )}>
          {i < days ? '🔥' : i + 1}
        </div>
      ))}
    </div>
  );
}

export function MysteryBox({ onOpen, boxes = 0, adminSettings }: { onOpen: (prize: string, value: number) => void; boxes?: number; adminSettings?: Record<string, any> }) {
  const [opening, setOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ prize: string; value: number; emoji: string } | null>(null);

  const handleOpen = () => {
    if (boxes <= 0 || opening) return;
    setOpening(true);

    setTimeout(() => {
      // Risk Protection: Highly weighted mystery box odds (Low chance for big wins)
      const prizes = [
        { prize: '10 Loyalty Points', value: 10, emoji: '🏆' },
        { prize: '25 Loyalty Points', value: 25, emoji: '⭐' },
        { prize: 'Br 20 Coupon', value: 20, emoji: '🎁' },
        { prize: 'Br 50 Coupon', value: 50, emoji: '💰' },
        { prize: 'Br 100 Off', value: 100, emoji: '💎' },
        { prize: 'Br 500 Mega Off', value: 500, emoji: '🎊' },
      ];
      
      const maxBoxPrize = adminSettings?.maxBoxPrize || 1000;
      const filteredPrizes = prizes.filter(p => p.value <= maxBoxPrize);

      const weights = [45, 30, 15, 8, 1.8, 0.2].slice(0, filteredPrizes.length);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;

      let chosenPrize = filteredPrizes[0];
      for (let i = 0; i < filteredPrizes.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
          chosenPrize = filteredPrizes[i];
          break;
        }
      }

      setResult(chosenPrize);
      setShowResult(true);
      setOpening(false);
      
      if (chosenPrize.value > 0) {
        onOpen(chosenPrize.prize, chosenPrize.value);
        
        // Save coupon codes for checkout if it's a discount
        if (chosenPrize.prize.includes('Coupon') || chosenPrize.prize.includes('Off')) {
          const codes = JSON.parse(localStorage.getItem('ss_game_coupons') || '[]');
          codes.push({
            code: 'BOX-' + Date.now().toString(36).toUpperCase(),
            discount: chosenPrize.value,
            source: 'mystery_box',
            claimed: false,
            expiresAt: Date.now() + 7 * 86400000,
          });
          localStorage.setItem('ss_game_coupons', JSON.stringify(codes));
        }
        
        toast(`🎉 Mystery Box: ${chosenPrize.emoji} ${chosenPrize.prize}!`, 'success');
      } else {
        toast(chosenPrize.prize, 'info');
      }
    }, 1500);
  };

  return (
    <div className="text-center">
      <div className="relative inline-block cursor-pointer group" onClick={handleOpen}>
        <div className={cn(
          'w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-4xl shadow-xl transition-all',
          opening ? 'animate-wiggle' : 'group-hover:scale-105',
          boxes <= 0 && 'opacity-50 grayscale'
        )}>
          {opening ? '🎲' : '🎁'}
        </div>
        {boxes > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {boxes}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold mt-1.5">
        {boxes > 0 ? `${boxes} Mystery Box${boxes !== 1 ? 'es' : ''} Available` : 'No boxes'}
      </p>
      <p className="text-[9px] text-muted-foreground">Earn boxes from purchases & referrals!</p>

      {/* Box Result Modal */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowResult(false)}>
          <div className="bg-card rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-2">{result.emoji}</div>
            <h3 className="text-base font-bold mb-1">You Won!</h3>
            <p className="text-lg font-extrabold text-primary">{result.prize}</p>
            {result.value > 0 && <p className="text-sm text-muted-foreground mt-1">Value: Br {result.value}</p>}
            <button className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => setShowResult(false)}>
              🎉 Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
