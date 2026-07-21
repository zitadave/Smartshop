import { useState, useEffect, useCallback } from 'react';
import { canSpin, spin, getSpinData } from '@/lib/game';
import { RotateCcw, Gift, Sparkles } from 'lucide-react';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';

const SEGMENTS = [
  { label: '🚚 Free Delivery', color: '#e53e3e' },
  { label: '💰 Br 50 Off', color: '#dd6b20' },
  { label: '💎 Br 100 Off', color: '#d69e2e' },
  { label: '🎯 10% Off', color: '#38a169' },
  { label: '🔥 15% Off', color: '#3182ce' },
  { label: '⭐ 25% Off', color: '#805ad5' },
  { label: '🏆 50 Pts', color: '#ed64a6' },
  { label: '👑 100 Pts', color: '#0bc5ea' },
  { label: '🔄 Try Again', color: '#a0aec0' },
  { label: '🎁 Br 20 Off', color: '#e53e3e' },
];

interface SpinWheelProps {
  onWin: (prize: string, value: number) => void;
}

export function SpinWheel({ onWin }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [available, setAvailable] = useState(canSpin());

  const handleSpin = useCallback(() => {
    if (!available || spinning) return;
    setSpinning(true);

    const result = spin();
    const segAngle = 360 / SEGMENTS.length;
    const prizeIndex = SEGMENTS.findIndex(s => s.label.includes(result.prize) || s.label.includes(String(result.value)));
    const target = prizeIndex >= 0 ? prizeIndex : Math.floor(Math.random() * SEGMENTS.length);

    // Spin 3-5 full rotations + land on target
    const fullSpins = (3 + Math.floor(Math.random() * 3)) * 360;
    const finalAngle = fullSpins + (360 - target * segAngle - segAngle / 2);
    setRotation(prev => prev + finalAngle);

    setTimeout(() => {
      setSpinning(false);
      setAvailable(canSpin());
      if (result.prize !== 'Try Again!') {
        onWin(result.prize, result.value);
        toast(`🎉 You won ${result.emoji} ${result.prize}!`, 'success');
      } else {
        toast('🔄 Try again tomorrow!', 'info');
      }
    }, 2500);
  }, [available, spinning, onWin]);

  useEffect(() => {
    setAvailable(canSpin());
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Wheel */}
      <div className="relative w-64 h-64">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-[2500ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}>
          {SEGMENTS.map((seg, i) => {
            const angle = (360 / SEGMENTS.length) * i;
            const endAngle = angle + 360 / SEGMENTS.length;
            const midAngle = ((angle + endAngle) / 2) * (Math.PI / 180);
            const x1 = 100 + 85 * Math.cos((angle - 90) * (Math.PI / 180));
            const y1 = 100 + 85 * Math.sin((angle - 90) * (Math.PI / 180));
            const x2 = 100 + 85 * Math.cos((endAngle - 90) * (Math.PI / 180));
            const y2 = 100 + 85 * Math.sin((endAngle - 90) * (Math.PI / 180));
            const largeArc = endAngle - angle > 180 ? 1 : 0;
            const path = `M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const textX = 100 + 55 * Math.cos(midAngle);
            const textY = 100 + 55 * Math.sin(midAngle);
            return (
              <g key={i}>
                <path d={path} fill={seg.color} stroke="white" strokeWidth="1" />
                <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="20" transform={`rotate(${angle + 360 / SEGMENTS.length / 2}, ${textX}, ${textY})`}>
                  {seg.label.split(' ')[1] || '🎁'}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        </svg>
      </div>

      {/* Button */}
      <button
        className={cn(
          'px-10 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-lg',
          available && !spinning
            ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:scale-105 active:scale-95'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
        onClick={handleSpin}
        disabled={!available || spinning}
      >
        {spinning ? (
          <><RotateCcw size={18} className="animate-spin" /> Spinning...</>
        ) : available ? (
          <><Gift size={18} /> Spin to Win!</>
        ) : (
          <><Sparkles size={18} /> Come back tomorrow!</>
        )}
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
