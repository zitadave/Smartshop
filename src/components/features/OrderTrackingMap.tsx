import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, formatTimeRemaining } from '@/lib/utils';
import { MapPin, Truck, Package, CheckCircle, Clock, Navigation, Phone, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderTrackingMapProps {
  orderNumber: string;
  compact?: boolean;
}

interface TimelineStep {
  label: string;
  time: string;
  completed: boolean;
  location?: string;
  icon: string;
}

const DEFAULT_TIMELINE: TimelineStep[] = [
  { label: 'Order Placed', time: 'Today, 10:30 AM', completed: true, icon: '📋' },
  { label: 'Processing', time: 'Today, 2:15 PM', completed: true, icon: '📦' },
  { label: 'In Transit', time: 'Tomorrow, 8:00 AM', completed: false, icon: '🚚' },
  { label: 'Out for Delivery', time: 'Tomorrow, 2:00 PM', completed: false, icon: '🚚' },
  { label: 'Delivered', time: 'Tomorrow, 6:00 PM', completed: false, icon: '🏠' },
];

export default function OrderTrackingMap({ orderNumber, compact }: OrderTrackingMapProps) {
  const { orders, orderTracking, setOrderTracking } = useStore();
  const order = orders.find(o => o.orderNumber === orderNumber);
  const [expanded, setExpanded] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');

  const tracking = orderTracking[orderNumber];
  const timeline = tracking?.timeline || DEFAULT_TIMELINE;
  const completedSteps = timeline.filter((t: { completed: boolean }) => t.completed).length;
  const progress = (completedSteps / timeline.length) * 100;

  // Simulate live tracking updates
  useEffect(() => {
    if (!order) return;
    const statuses = ['Order received', 'Preparing your order', 'Quality check', 'Handed to courier', 'In transit', 'Arrived at sorting center', 'Out for delivery'];
    let idx = 0;
    const interval = setInterval(() => {
      setLiveStatus(statuses[idx % statuses.length]);
      idx++;
    }, 15000);
    return () => clearInterval(interval);
  }, [order]);

  // Simulated driver location (Addis Ababa area)
  const driverLat = 9.03 + Math.random() * 0.02;
  const driverLng = 38.74 + Math.random() * 0.02;
  const destinationLat = 9.01;
  const destinationLng = 38.76;

  if (!order) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        <MapIcon size={24} className="mx-auto mb-1 opacity-40" />
        Order not found
      </div>
    );
  }

  const content = (
    <div className="space-y-3">
      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Truck size={16} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold flex items-center gap-1.5">
              Live Tracking
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            </div>
            <div className="text-[10px] opacity-90 mt-0.5">{liveStatus || 'Order in transit'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-80">ETA</div>
            <div className="text-xs font-bold">{tracking?.estimatedDelivery || 'Tomorrow'}</div>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden h-44">
        {/* Grid lines for map effect */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
        
        {/* Destination marker */}
        <div className="absolute bottom-6 right-6 flex flex-col items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          <div className="w-0.5 h-4 bg-red-500/50" />
          <div className="bg-white/90 text-[7px] font-bold px-1.5 py-0.5 rounded text-gray-800 whitespace-nowrap">
            📍 Your Location
          </div>
        </div>

        {/* Driver marker - animated */}
        <div className="absolute top-1/3 left-1/3 flex flex-col items-center animate-float">
          <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <Truck size={10} className="text-white" />
          </div>
          <div className="mt-0.5 bg-blue-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
            🚚 Driver
          </div>
        </div>

        {/* Route line (curved) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 180">
          <path
            d="M 100 60 Q 150 30 220 120"
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <circle cx="100" cy="60" r="3" fill="#3B82F6" />
          <circle cx="220" cy="120" r="3" fill="#EF4444" />
        </svg>

        {/* Driver info overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-[9px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Navigation size={10} className="text-blue-400" />
            <span className="font-semibold">Driver: Abebe K.</span>
          </div>
          <div className="text-[8px] opacity-70">Estimated arrival in ~30 min</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border p-3">
        <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1.5">
          <Package size={12} /> Order Progress
        </h4>
        <div className="space-y-0">
          {timeline.map((step: { label: string; time: string; completed: boolean; location?: string; icon: string }, i: number) => {
            const isCompleted = step.completed;
            const isCurrent = !step.completed && (i === 0 || timeline[i - 1].completed);
            return (
              <div key={i} className="flex gap-2.5 pb-2.5 relative last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 border',
                    isCompleted && 'bg-green-100 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-700',
                    isCurrent && 'bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 animate-pulse',
                    !isCompleted && !isCurrent && 'bg-muted border-border text-muted-foreground'
                  )}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-full mt-0.5',
                      isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-muted'
                    )} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className={cn(
                    'text-[10px]',
                    isCompleted && 'text-green-700 dark:text-green-400 font-medium',
                    isCurrent && 'font-bold text-blue-700 dark:text-blue-400',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}>
                    {step.label}
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    {step.time}
                    {step.location && ` · ${step.location}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-card rounded-xl border border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-[9px]">
            <div className="text-muted-foreground">Carrier</div>
            <div className="font-semibold">{tracking?.carrier || 'Ethio Express'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-muted-foreground">Tracking #</div>
            <div className="font-semibold font-mono">{tracking?.trackingNumber || 'ET-EX-2024-001'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-muted-foreground">Delivery Address</div>
            <div className="font-semibold truncate">{order.customer?.city || 'Addis Ababa'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-muted-foreground">Contact</div>
            <div className="font-semibold">{order.customer?.phone || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3 text-xs font-semibold"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-1.5">
            <MapIcon size={14} className="text-primary" /> Live Tracking
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {tracking?.status || 'In Transit'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {expanded && <div className="px-3 pb-3">{content}</div>}
      </div>
    );
  }

  return content;
}

/** Simple progress bar for order tracking */
export function OrderProgressBar({ status }: { status: string }) {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
  const currentIdx = steps.indexOf(status);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / steps.length) * 100 : 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground">{Math.round(progress)}%</span>
    </div>
  );
}
