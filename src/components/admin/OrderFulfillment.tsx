/**
 * Smart Shop — Order Fulfillment Management
 * 
 * Complete order lifecycle: confirmation → vendor routing → delivery → completion
 * Features: status transitions, vendor tracking, delivery partner assignment, fulfillment timeline
 */

import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import {
  getFulfillments, saveFulfillments, getFulfillment, upsertFulfillment,
  createFulfillment, transitionFulfillment, assignVendorStatus,
  assignDeliveryPartner, getValidNextStatuses, getOrderStatusNotification,
  FULFILLMENT_STATUSES, canTransitionTo,
  type OrderFulfillment, type FulfillmentStatus, type FulfillmentEvent,
} from '@/lib/orderFulfillment';
import {
  Package, ShoppingCart, Truck, Store, CheckCircle, Clock, AlertTriangle,
  ChevronRight, Filter, Search, MapPin, Phone, User, Calendar, ArrowRight,
  XCircle, Eye, RefreshCw, MessageSquare, Ban, DollarSign, Archive,
} from 'lucide-react';
import { toast } from '@/components/Toast';

export default function OrderFulfillment() {
  const [orders, setOrders] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<OrderFulfillment[]>(getFulfillments());
  const [selected, setSelected] = useState<OrderFulfillment | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then(d => {
      setOrders(d?.orders || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Merge orders with fulfillments — create fulfillments for unmatched orders
  useEffect(() => {
    const updated = [...fulfillments];
    orders.forEach(order => {
      if (!updated.find(f => f.orderNumber === order.orderNumber)) {
        updated.unshift(createFulfillment({
          orderNumber: order.orderNumber,
          items: (order.items || []).map((it: any) => ({
            id: it.id || 0, name: it.name || 'Item',
            quantity: it.quantity || 1, price: it.price || 0,
            vendorId: it.vendorId, vendorName: it.vendorName,
          })),
          total: order.total || 0,
          customer: order.customer || { name: '', phone: '', city: '' },
          createdAt: order.createdAt || new Date().toISOString(),
        }));
      }
    });
    saveFulfillments(updated);
    setFulfillments(updated);
  }, [orders]);

  const updateFulfillment = (updated: OrderFulfillment) => {
    upsertFulfillment(updated);
    setFulfillments(getFulfillments());
    setSelected(updated);
  };

  const handleTransition = (status: FulfillmentStatus, note?: string) => {
    if (!selected) return;
    const updated = transitionFulfillment(selected, status, 'admin', note);
    updateFulfillment(updated);
    const notif = getOrderStatusNotification(status, selected.orderNumber);
    if (notif) useStore.getState().addNotification(notif.icon, notif.message);
    toast(`✅ Order ${updated.orderNumber}: ${FULFILLMENT_STATUSES[status].label}`, 'success');
  };

  const handleAssignDelivery = (partner?: string) => {
    if (!selected) return;
    const updated = assignDeliveryPartner(selected, partner);
    updateFulfillment(updated);
    toast(`🚚 Assigned ${updated.delivery.partner} to order ${updated.orderNumber}`, 'success');
  };

  const handleAssignVendorStatus = (vendorId: number, status: string) => {
    if (!selected) return;
    const updated = assignVendorStatus(selected, vendorId, status as any);
    updateFulfillment(updated);
    toast('✅ Vendor status updated', 'success');
  };

  const filtered = fulfillments.filter(f => {
    if (filter !== 'all' && f.status !== filter) return false;
    if (search && !f.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = fulfillments.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pendingVendor = fulfillments.filter(f => f.status === 'awaiting_vendor').length;
  const needsDelivery = fulfillments.filter(f => f.status === 'in_transit' && !f.delivery).length;

  if (loading) return <div className="text-center py-12"><RefreshCw size={24} className="animate-spin mx-auto text-indigo-500" /></div>;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Package size={20} className="text-indigo-500" /> Order Fulfillment</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{fulfillments.length} orders · {pendingVendor} pending vendors · {needsDelivery} need delivery</p>
        </div>
      </div>

      {/* Alert Banner */}
      {(pendingVendor > 0 || needsDelivery > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-3 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} />
          <span className="font-semibold">Action needed:</span>
          {pendingVendor > 0 && <span>{pendingVendor} order(s) awaiting vendor confirmation · </span>}
          {needsDelivery > 0 && <span>{needsDelivery} order(s) need delivery partner assignment</span>}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        {['all', 'confirmed', 'awaiting_vendor', 'in_transit', 'out_for_delivery', 'delivered'].map(s => (
          <button key={s} className={cn('px-2.5 py-1.5 rounded-xl text-[9px] font-medium border transition-all text-center', filter === s ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700')} onClick={() => setFilter(s)}>
            <div className="text-xs">{FULFILLMENT_STATUSES[s as FulfillmentStatus]?.icon || '📋'}</div>
            <div className="capitalize">{s.replace(/_/g, ' ')}</div>
            <div className="font-bold">{statusCounts[s] || 0}</div>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900" placeholder="Search by order number..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order List */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {filtered.map(f => {
            const cfg = FULFILLMENT_STATUSES[f.status];
            return (
              <div key={f.orderNumber} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-3 cursor-pointer transition-all hover:shadow-md', selected?.orderNumber === f.orderNumber ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-800')} onClick={() => setSelected(f)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono text-indigo-600">{f.orderNumber}</span>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', cfg?.bg, cfg?.color)}>{cfg?.icon} {cfg?.label}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                  <User size={9} /> {f.vendors.map(v => v.vendorName).join(', ')}
                </div>
                {f.delivery && (
                  <div className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Truck size={8} /> {f.delivery.partner} · {f.delivery.driverName}
                  </div>
                )}
                <div className="flex gap-0.5 mt-1">
                  {f.events.slice(-3).map(e => (
                    <div key={e.id} className={cn('text-[7px] px-1 py-0.5 rounded font-medium', FULFILLMENT_STATUSES[e.status]?.bg, FULFILLMENT_STATUSES[e.status]?.color)}>
                      {e.label.substring(0, 12)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No orders found</p>}
        </div>

        {/* Order Detail Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-indigo-600">{selected.orderNumber}</h3>
                <span className={cn('text-[9px] px-2 py-0.5 rounded-lg font-semibold', FULFILLMENT_STATUSES[selected.status]?.bg, FULFILLMENT_STATUSES[selected.status]?.color)}>
                  {FULFILLMENT_STATUSES[selected.status]?.icon} {FULFILLMENT_STATUSES[selected.status]?.label}
                </span>
              </div>

              {/* Status Transitions */}
              <div>
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Update Status</h4>
                <div className="flex gap-1 flex-wrap">
                  {getValidNextStatuses(selected.status).map(s => (
                    <button key={s.id} className={cn('px-2.5 py-1.5 rounded-lg text-[9px] font-semibold border transition-all', s.color, 'border-current hover:shadow-sm')} onClick={() => handleTransition(s.id)}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                  {getValidNextStatuses(selected.status).length === 0 && (
                    <span className="text-[9px] text-slate-400 italic">No further transitions — order is final</span>
                  )}
                </div>
              </div>

              {/* Vendor Status */}
              {selected.vendors.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vendors ({selected.vendors.length})</h4>
                  <div className="space-y-1">
                    {selected.vendors.map(v => (
                      <div key={v.vendorId} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                        <Store size={12} className="text-indigo-500" />
                        <span className="flex-1 font-medium">{v.vendorName}</span>
                        <select className="text-[9px] bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5" value={v.status} onChange={e => handleAssignVendorStatus(v.vendorId, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="preparing">Preparing</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                        </select>
                        <span className="text-[9px] text-slate-400">{v.items.length} items · {formatPrice(v.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery */}
              <div>
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Delivery</h4>
                {selected.delivery ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1.5"><Truck size={12} className="text-emerald-500" /><span className="font-semibold">{selected.delivery.partner}</span></div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><User size={10} /> {selected.delivery.driverName} · {selected.delivery.driverPhone}</div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><MapPin size={10} /> Tracking: {selected.delivery.trackingNumber}</div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><Calendar size={10} /> ETA: {selected.delivery.estimatedDelivery ? new Date(selected.delivery.estimatedDelivery).toLocaleDateString() : 'N/A'}</div>
                  </div>
                ) : (
                  <button className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[9px] font-bold" onClick={() => handleAssignDelivery()}>
                    <Truck size={11} className="inline mr-1" /> Assign Delivery Partner
                  </button>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Timeline ({selected.events.length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selected.events.slice().reverse().map(e => (
                    <div key={e.id} className="flex items-start gap-2 py-1">
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0', FULFILLMENT_STATUSES[e.status]?.bg, FULFILLMENT_STATUSES[e.status]?.color)}>
                        {FULFILLMENT_STATUSES[e.status]?.icon || '•'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium">{e.label}</div>
                        <div className="text-[8px] text-slate-400">
                          {new Date(e.timestamp).toLocaleString()} · {e.actor}
                          {e.note && <span> · {e.note}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</h4>
                <div className="flex gap-1">
                  <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" placeholder="Add note..." id={`note-${selected.orderNumber}`} onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const input = document.getElementById(`note-${selected.orderNumber}`) as HTMLInputElement;
                      if (input?.value.trim()) {
                        const updated = { ...selected, notes: [...selected.notes, `${new Date().toLocaleString()}: ${input.value.trim()}`] };
                        updateFulfillment(updated);
                        input.value = '';
                      }
                    }
                  }} />
                </div>
                {selected.notes.length > 0 && (
                  <div className="mt-1 space-y-0.5 max-h-16 overflow-y-auto">
                    {selected.notes.map((n, i) => (
                      <p key={i} className="text-[8px] text-slate-400">{n}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              <Package size={32} className="mx-auto mb-2 text-slate-300" />
              Select an order to manage fulfillment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
