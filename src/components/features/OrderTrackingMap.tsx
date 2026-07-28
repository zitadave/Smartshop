import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn } from '@/lib/utils';
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
  const { orders, orderTracking } = useStore();
  const order = orders.find(o => o.orderNumber === orderNumber);
  const [expanded, setExpanded] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [delivery, setDelivery] = useState<any>(null);
  const [loadingLive, setLoadingLive] = useState(true);

  // Poll real-time backend driver coordinates & status
  useEffect(() => {
    if (!orderNumber) return;

    const fetchLiveTracking = () => {
      fetch(`/api/delivery/tracking/${orderNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.delivery) {
            setDelivery(data.delivery);
          }
          setLoadingLive(false);
        })
        .catch(() => {
          setLoadingLive(false);
        });
    };

    fetchLiveTracking();
    const interval = setInterval(fetchLiveTracking, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [orderNumber]);

  // Fallback simulated status loop
  useEffect(() => {
    if (delivery) return; // Use actual db status if available
    const statuses = ['Order received', 'Preparing your order', 'Quality check', 'Handed to courier', 'In transit', 'Arrived at sorting center', 'Out for delivery'];
    let idx = 0;
    const interval = setInterval(() => {
      setLiveStatus(statuses[idx % statuses.length]);
      idx++;
    }, 15000);
    return () => clearInterval(interval);
  }, [delivery]);

  if (!order) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground bg-card rounded-xl border border-border p-4">
        <MapIcon size={24} className="mx-auto mb-1 opacity-40 text-muted-foreground animate-pulse" />
        Order not found
      </div>
    );
  }

  // Dynamic Driver Information
  const hasLiveDriver = !!(delivery?.driver);
  const driverName = delivery?.driver?.full_name_latin || 'Abebe K.';
  const driverPhone = delivery?.driver?.phone || '+251-911-123456';
  const vehicleType = delivery?.driver?.vehicle_type || 'Motorcycle';
  const licensePlate = delivery?.driver?.license_plate || 'AA-1234';

  // Live map coordinates (use real driver coordinates if available, else simulate)
  const driverLat = delivery?.driver?.current_lat || 9.0320 + (Math.sin(Date.now() / 15000) * 0.015);
  const driverLng = delivery?.driver?.current_lng || 38.7469 + (Math.cos(Date.now() / 15000) * 0.015);

  const statusLabels: Record<string, string> = {
    pending: 'Searching for an express driver...',
    assigned: 'Driver assigned, preparing pickup',
    accepted: 'Driver is heading to the store',
    at_vendor: 'Driver is at the store picking up items',
    picked_up: 'Order picked up from vendor',
    in_transit: 'Driver is on their way to you',
    arrived: 'Driver has arrived at your location!',
    delivered: 'Delivered successfully! Thank you.',
    failed: 'Delivery failed',
    cancelled: 'Delivery cancelled'
  };

  const statusText = delivery ? (statusLabels[delivery.status] || delivery.status) : (liveStatus || 'Order in transit');

  // Dynamically map timeline steps based on backend DB status
  const getDynamicTimeline = (): TimelineStep[] => {
    if (!delivery) return DEFAULT_TIMELINE;

    const s = delivery.status;
    const isProcessed = s !== 'pending';
    const isInTransit = ['picked_up', 'in_transit', 'arrived', 'delivered'].includes(s);
    const isOutForDelivery = ['arrived', 'delivered'].includes(s);
    const isDelivered = s === 'delivered';

    const formatTime = (isoString?: string) => {
      if (!isoString) return 'Pending';
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return [
      { label: 'Order Placed', time: formatTime(delivery.created_at || order.createdAt), completed: true, icon: '📋' },
      { label: 'Processing', time: isProcessed ? formatTime(delivery.assigned_at) : 'Pending', completed: isProcessed, icon: '📦' },
      { label: 'In Transit', time: isInTransit ? formatTime(delivery.picked_up_at || delivery.assigned_at) : 'Pending', completed: isInTransit, icon: '🚚' },
      { label: 'Out for Delivery', time: isOutForDelivery ? formatTime(delivery.in_transit_at) : 'Pending', completed: isOutForDelivery, icon: '🚚' },
      { label: 'Delivered', time: isDelivered ? formatTime(delivery.delivered_at) : 'Pending', completed: isDelivered, icon: '🏠' },
    ];
  };

  const timeline = getDynamicTimeline();

  const content = (
    <div className="space-y-3 animate-fadeUp">
      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-xl p-3 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <Truck size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold flex items-center gap-1.5">
              Live Express Delivery
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-ping" />
            </div>
            <div className="text-[10px] opacity-90 mt-0.5 truncate capitalize">{statusText}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[9px] opacity-85">ETA</div>
            <div className="text-xs font-bold">{delivery?.status === 'delivered' ? 'Arrived' : (delivery ? '30 mins' : 'Tomorrow')}</div>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl overflow-hidden h-52 border border-slate-800 shadow-inner">
        {/* Grid lines for map effect */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '25px 20px'
        }} />
        
        {/* Destination marker (Your location) */}
        <div className="absolute bottom-10 right-10 flex flex-col items-center z-10">
          <div className="relative">
            <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping" />
            <div className="w-4.5 h-4.5 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin size={10} className="text-white" />
            </div>
          </div>
          <div className="w-0.5 h-3 bg-red-500/50" />
          <div className="bg-slate-900/90 border border-slate-700 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            📍 Your Location
          </div>
        </div>

        {/* Live Driver marker - animated based on live coords */}
        <div 
          className="absolute flex flex-col items-center z-10 transition-all duration-1000 ease-out"
          style={{
            top: `${30 + (Math.sin(driverLat * 100) * 15)}%`,
            left: `${35 + (Math.cos(driverLng * 100) * 15)}%`,
          }}
        >
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-pulse" />
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <Truck size={12} className="text-white" />
            </div>
          </div>
          <div className="mt-1 bg-indigo-600/95 border border-indigo-400 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            🏍️ Driver: {driverName}
          </div>
        </div>

        {/* Dynamic route line path inside simulated viewport */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 200">
          <path
            d="M 120 70 Q 160 40 240 130"
            fill="none"
            stroke="url(#route-gradient)"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            className="animate-[dash_10s_linear_infinite]"
          />
          <defs>
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Driver overlay card */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-white flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5">
              <Navigation size={11} className="text-indigo-400 animate-pulse" />
              <span className="font-extrabold text-[10px] text-slate-100">{driverName}</span>
              <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold uppercase">{vehicleType}</span>
            </div>
            <div className="text-[8px] text-slate-400 mt-1 flex items-center gap-2">
              <span>Plate: <strong className="text-slate-200">{licensePlate}</strong></span>
              {hasLiveDriver && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
              {hasLiveDriver && <span className="text-[8px] text-emerald-400 font-bold">GPS Linked</span>}
            </div>
          </div>
          {hasLiveDriver && (
            <a 
              href={`tel:${driverPhone}`}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-[0.95]"
            >
              <Phone size={10} /> Call
            </a>
          )}
        </div>
      </div>

      {/* Timeline steps */}
      <div className="bg-card rounded-2xl border border-border p-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Package size={12} className="text-indigo-500" /> Delivery Milestone Status
        </h4>
        <div className="space-y-0 pl-1.5">
          {timeline.map((step, i) => {
            const isCompleted = step.completed;
            const isCurrent = !step.completed && (i === 0 || timeline[i - 1].completed);
            return (
              <div key={i} className="flex gap-3 pb-3 relative last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 border-2',
                    isCompleted && 'bg-emerald-50 border-emerald-400 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800',
                    isCurrent && 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800 animate-pulse',
                    !isCompleted && !isCurrent && 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                  )}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-full mt-1',
                      isCompleted ? 'bg-emerald-400 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-800'
                    )} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className={cn(
                    'text-[10px] font-bold',
                    isCompleted && 'text-emerald-700 dark:text-emerald-400',
                    isCurrent && 'text-indigo-700 dark:text-indigo-400',
                    !isCompleted && !isCurrent && 'text-slate-400 dark:text-slate-600'
                  )}>
                    {step.label}
                  </div>
                  <div className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.time}
                    {step.location && ` · ${step.location}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Delivery Logistics */}
      <div className="bg-card rounded-2xl border border-border p-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Logistic Carrier</div>
            <div className="font-extrabold text-foreground mt-0.5">{delivery ? 'Smartshop Express Fleet' : 'Ethio Express'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Waybill Tracking #</div>
            <div className="font-mono font-extrabold text-foreground mt-0.5">{delivery?.order_number || orderNumber}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Service Zone</div>
            <div className="font-extrabold text-foreground mt-0.5">{order.customer?.city || 'Addis Ababa'}</div>
          </div>
          <div className="text-[9px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Waybill Contact</div>
            <div className="font-extrabold text-foreground mt-0.5">{order.customer?.phone || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-1.5">
            <MapIcon size={14} className="text-indigo-500" /> Express Live Tracking
          </span>
          <span className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full font-bold">
            {delivery ? (statusLabels[delivery.status] || delivery.status) : 'Simulated'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {expanded && <div className="px-3.5 pb-3.5">{content}</div>}
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
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground font-bold">{Math.round(progress)}%</span>
    </div>
  );
}
