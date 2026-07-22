import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  prevValue?: number;
}

interface LiveChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradient?: boolean;
  showLabels?: boolean;
  className?: string;
  animate?: boolean;
}

export default function LiveChart({
  data,
  height = 120,
  color = '#6C63FF',
  gradient = true,
  showLabels = true,
  className,
  animate = true,
}: LiveChartProps) {
  const [animated, setAnimated] = useState(!animate);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate, data]);

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 100 / data.length;

  // Calculate trend
  const trend = data.length >= 2 ? data[data.length - 1].value - data[data.length - 2].value : 0;
  const trendUp = trend >= 0;

  // Sparkline path
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.value - min) / range) * 80 - 10,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L 100 100 L 0 100 Z`;

  return (
    <div className={cn('relative', className)}>
      {/* Chart SVG */}
      <svg viewBox={`0 0 100 100`} className="w-full" style={{ height: `${height}px` }} preserveAspectRatio="none">
        {/* Gradient fill */}
        {gradient && (
          <defs>
            <linearGradient id={`chart-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
        )}

        {/* Area */}
        {gradient && (
          <path
            d={areaD}
            fill={`url(#chart-grad-${color})`}
            className={cn('transition-opacity', animated ? 'opacity-100' : 'opacity-0')}
            style={{ transitionDuration: '0.8s' }}
          />
        )}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-all', animated ? 'opacity-100' : 'opacity-0')}
          style={{
            strokeDasharray: animated ? 'none' : '1000',
            strokeDashoffset: animated ? '0' : '1000',
            transitionDuration: '1s',
          }}
        />

        {/* Dots on hover */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hovered === i ? 3 : 0}
            fill={color}
            stroke="white"
            strokeWidth="1"
            className="transition-all duration-200 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-1">
          {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1).map((d, i) => (
            <span key={i} className="text-[7px] text-muted-foreground/40">{d.label}</span>
          ))}
        </div>
      )}

      {/* Trend indicator */}
      {data.length >= 2 && (
        <div className={cn('flex items-center gap-1 text-[9px] font-semibold mt-1', trendUp ? 'text-green-600' : 'text-red-500')}>
          {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{trendUp ? '+' : ''}{trend.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

/** Mini stat card with sparkline */
export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  data,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  trend?: { value: number; up: boolean };
  data?: DataPoint[];
  color?: string;
  onClick?: () => void;
}) {
  const Icon = icon;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg', color || 'from-indigo-500 to-purple-600')}>
          <Icon size={16} className="text-white" />
        </div>
        {trend && (
          <span className={cn('text-[9px] font-semibold flex items-center gap-0.5', trend.up ? 'text-green-600' : 'text-red-500')}>
            {trend.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{sub || label}</div>

      {data && data.length > 0 && (
        <div className="mt-2">
          <LiveChart data={data} height={40} color={color ? color.split(' ')[0] : '#6C63FF'} gradient={false} showLabels={false} />
        </div>
      )}
    </div>
  );
}
