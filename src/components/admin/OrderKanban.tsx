import { useState, useCallback, useRef } from 'react';
import { ShoppingCart, Clock, CheckCircle, Truck, XCircle, ChevronRight, GripVertical } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { ordersApi } from '@/lib/api';

interface Order {
  orderNumber: string;
  status: string;
  total?: number;
  customer?: { name: string; phone: string };
  date?: string;
  items?: any[];
}

const COLUMNS = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'processing', label: 'Processing', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800' },
];

export default function OrderKanban({ orders, onUpdate }: { orders: Order[]; onUpdate: () => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleDragStart = (orderNumber: string) => setDragging(orderNumber);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  const handleDrop = async (orderNumber: string, newStatus: string) => {
    setDragging(null);
    setDragOver(null);
    setUpdating(orderNumber);
    try {
      await ordersApi.updateStatus(orderNumber, newStatus);
      onUpdate();
    } catch {}
    setUpdating(null);
  };

  const grouped = COLUMNS.map(col => ({
    ...col,
    orders: orders.filter(o => o.status === col.id || (col.id === 'pending' && !o.status)),
  }));

  const total = orders.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[900px]" style={{ minHeight: '400px' }}>
        {grouped.map(col => {
          const Icon = col.icon;
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              className={cn(
                'flex-1 rounded-2xl border p-2.5 transition-all',
                col.bg, col.border,
                isOver && 'ring-2 ring-primary shadow-lg scale-[1.01]'
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => {
                e.preventDefault();
                const orderNumber = e.dataTransfer.getData('text/plain');
                if (orderNumber) handleDrop(orderNumber, col.id);
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className={col.color} />
                  <span className="text-xs font-bold">{col.label}</span>
                </div>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold', col.color, 'bg-white/50 dark:bg-slate-900/50')}>
                  {col.orders.length}
                </span>
              </div>

              {/* Orders */}
              <div className="space-y-1.5 min-h-[60px]">
                {col.orders.length === 0 && (
                  <div className="text-center py-6 text-[9px] text-muted-foreground/40 italic">
                    No orders
                  </div>
                )}
                {col.orders.map(order => (
                  <div
                    key={order.orderNumber}
                    className={cn(
                      'bg-card rounded-xl border border-border/60 p-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group',
                      dragging === order.orderNumber && 'opacity-50 scale-95 shadow-lg',
                      updating === order.orderNumber && 'animate-pulse'
                    )}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', order.orderNumber);
                      handleDragStart(order.orderNumber);
                    }}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <GripVertical size={10} className="text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors cursor-grab" />
                        <span className="text-[9px] font-bold font-mono text-primary truncate max-w-[100px]">{order.orderNumber}</span>
                      </div>
                      {order.total && (
                        <span className="text-[10px] font-bold">{formatPrice(order.total)}</span>
                      )}
                    </div>
                    <div className="text-[8px] text-muted-foreground ml-4">
                      {order.customer?.name || 'Anonymous'} · {order.date || ''}
                    </div>
                    <div className="text-[8px] text-muted-foreground ml-4 truncate">
                      {order.items?.slice(0, 2).map((it: any) => it.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drop zone hint */}
              <div className={cn(
                'mt-1 rounded-xl border-2 border-dashed border-transparent text-center py-1 text-[8px] text-muted-foreground/20 transition-all',
                isOver && 'border-primary/30 text-primary/30 bg-primary/5'
              )}>
                Drop here
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
