/**
 * Smart Shop — Order Fulfillment Engine
 * 
 * Professional order lifecycle management with:
 * - Status pipeline with valid transitions
 * - Vendor routing based on product ownership
 * - Fulfillment timeline tracking
 * - Delivery partner integration
 * - In-app + Telegram notifications
 */

import { generateId } from '@/lib/utils';
import type { OrderStatus } from '@/types';

// ============================================================
// Types
// ============================================================

export type FulfillmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'awaiting_vendor'
  | 'vendor_accepted'
  | 'vendor_shipped'
  | 'quality_check'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface FulfillmentEvent {
  id: string;
  status: FulfillmentStatus;
  label: string;
  timestamp: string;
  actor: 'system' | 'customer' | 'vendor' | 'admin' | 'delivery';
  note?: string;
}

export interface DeliveryAssignment {
  partner: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  estimatedPickup?: string;
  estimatedDelivery?: string;
  vehicleType?: string;
}

export interface VendorFulfillment {
  vendorId: number;
  vendorName: string;
  status: 'pending' | 'accepted' | 'preparing' | 'shipped' | 'completed';
  items: { id: number; name: string; quantity: number; price: number }[];
  subtotal: number;
}

export interface OrderFulfillment {
  orderNumber: string;
  status: FulfillmentStatus;
  events: FulfillmentEvent[];
  vendors: VendorFulfillment[];
  delivery: DeliveryAssignment | null;
  notes: string[];
  priority: 'normal' | 'high' | 'urgent';
  slaBreach?: boolean;
  estimatedCompletion?: string;
}

// ============================================================
// Status Configuration
// ============================================================

interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  bg: string;
  next: FulfillmentStatus[];
  requiresNote?: boolean;
}

export const FULFILLMENT_STATUSES: Record<FulfillmentStatus, StatusConfig> = {
  pending_payment:      { label: 'Pending Payment',  icon: '⏳', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/20',        next: ['confirmed', 'cancelled'] },
  confirmed:            { label: 'Confirmed',         icon: '✅', color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/20',          next: ['processing', 'awaiting_vendor', 'cancelled'] },
  processing:           { label: 'Processing',        icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20',      next: ['awaiting_vendor', 'quality_check', 'cancelled'] },
  awaiting_vendor:      { label: 'Awaiting Vendor',   icon: '🏪', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20',     next: ['vendor_accepted', 'cancelled'] },
  vendor_accepted:      { label: 'Vendor Accepted',   icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20',   next: ['vendor_shipped', 'cancelled'] },
  vendor_shipped:       { label: 'Vendor Shipped',    icon: '📤', color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/20',          next: ['quality_check'] },
  quality_check:        { label: 'Quality Check',     icon: '🔍', color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-950/20',          next: ['in_transit', 'returned'] },
  in_transit:           { label: 'In Transit',         icon: '🚚', color: 'text-sky-600',    bg: 'bg-sky-50 dark:bg-sky-950/20',            next: ['out_for_delivery'] },
  out_for_delivery:     { label: 'Out for Delivery',  icon: '🚛', color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950/20',      next: ['delivered'] },
  delivered:            { label: 'Delivered',          icon: '🏠', color: 'text-green-600',   bg: 'bg-green-50 dark:bg-green-950/20',        next: ['completed'] },
  completed:            { label: 'Completed',          icon: '🎉', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20',    next: [] },
  cancelled:            { label: 'Cancelled',          icon: '❌', color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/20',            next: [] },
  returned:             { label: 'Returned',           icon: '🔄', color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/20',          next: ['refunded'] },
  refunded:             { label: 'Refunded',           icon: '💰', color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-950/20',           next: [] },
};

// ============================================================
// Valid transition check
// ============================================================

export function canTransitionTo(current: FulfillmentStatus, next: FulfillmentStatus): boolean {
  const config = FULFILLMENT_STATUSES[current];
  if (!config) return false;
  return config.next.includes(next);
}

export function getValidNextStatuses(current: FulfillmentStatus): { id: FulfillmentStatus; label: string; icon: string; color: string }[] {
  const config = FULFILLMENT_STATUSES[current];
  if (!config) return [];
  return config.next.map(id => ({
    id,
    label: FULFILLMENT_STATUSES[id].label,
    icon: FULFILLMENT_STATUSES[id].icon,
    color: FULFILLMENT_STATUSES[id].color,
  }));
}

// ============================================================
// Create initial fulfillment record
// ============================================================

export function createFulfillment(order: {
  orderNumber: string;
  items: { id: number; name: string; quantity: number; price: number; vendorId?: number; vendorName?: string }[];
  total: number;
  customer: { name: string; phone: string; city: string };
  createdAt: string;
}): OrderFulfillment {
  // Group items by vendor
  const vendorMap = new Map<number, VendorFulfillment>();
  order.items.forEach(item => {
    const vid = item.vendorId || 1;
    const vname = item.vendorName || 'Smart Shop';
    if (!vendorMap.has(vid)) {
      vendorMap.set(vid, {
        vendorId: vid,
        vendorName: vname,
        status: 'pending',
        items: [],
        subtotal: 0,
      });
    }
    const vf = vendorMap.get(vid)!;
    vf.items.push({ id: item.id, name: item.name, quantity: item.quantity, price: item.price });
    vf.subtotal += item.price * item.quantity;
  });

  return {
    orderNumber: order.orderNumber,
    status: 'confirmed',
    events: [{
      id: generateId(),
      status: 'confirmed',
      label: 'Order Placed',
      timestamp: order.createdAt || new Date().toISOString(),
      actor: 'customer',
      note: `Order placed by ${order.customer.name}`,
    }],
    vendors: Array.from(vendorMap.values()),
    delivery: null,
    notes: [],
    priority: order.total > 5000 ? 'high' : order.total > 20000 ? 'urgent' : 'normal',
    estimatedCompletion: new Date(Date.now() + 5 * 86400000).toISOString(),
  };
}

// ============================================================
// Transition order to a new status
// ============================================================

export function transitionFulfillment(
  fulfillment: OrderFulfillment,
  newStatus: FulfillmentStatus,
  actor: FulfillmentEvent['actor'],
  note?: string
): OrderFulfillment {
  if (!canTransitionTo(fulfillment.status, newStatus)) {
    console.warn(`Invalid transition: ${fulfillment.status} → ${newStatus}`);
    return fulfillment;
  }

  const event: FulfillmentEvent = {
    id: generateId(),
    status: newStatus,
    label: FULFILLMENT_STATUSES[newStatus].label,
    timestamp: new Date().toISOString(),
    actor,
    note,
  };

  return {
    ...fulfillment,
    status: newStatus,
    events: [...fulfillment.events, event],
  };
}

// ============================================================
// Vendor routing
// ============================================================

export function assignVendorStatus(
  fulfillment: OrderFulfillment,
  vendorId: number,
  status: VendorFulfillment['status']
): OrderFulfillment {
  return {
    ...fulfillment,
    vendors: fulfillment.vendors.map(v =>
      v.vendorId === vendorId ? { ...v, status } : v
    ),
  };
}

// ============================================================
// Delivery partner assignment
// ============================================================

const DELIVERY_PARTNERS = [
  { name: 'Ethio Express', vehicle: 'Motorcycle', coverage: 'Addis Ababa' },
  { name: 'Sheba Delivery', vehicle: 'Van', coverage: 'Addis Ababa, Bahir Dar' },
  { name: 'Lomi Logistics', vehicle: 'Truck', coverage: 'All Regions' },
  { name: 'Express Courier ET', vehicle: 'Motorcycle', coverage: 'Addis Ababa, Adama' },
];

export function assignDeliveryPartner(
  fulfillment: OrderFulfillment,
  partnerName?: string
): OrderFulfillment & { delivery: DeliveryAssignment } {
  const partner = partnerName
    ? DELIVERY_PARTNERS.find(p => p.name === partnerName)
    : DELIVERY_PARTNERS[Math.floor(Math.random() * DELIVERY_PARTNERS.length)];

  if (!partner) return fulfillment as any;

  const assignment: DeliveryAssignment = {
    partner: partner.name,
    driverName: ['Abebe K.', 'Selam W.', 'Biruk T.', 'Hanna M.'][Math.floor(Math.random() * 4)],
    driverPhone: ['+251-911-123456', '+251-922-654321', '+251-933-789012', '+251-944-567890'][Math.floor(Math.random() * 4)],
    trackingNumber: `ET-${generateId().substring(0, 8).toUpperCase()}`,
    estimatedPickup: new Date(Date.now() + 2 * 3600000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
    vehicleType: partner.vehicle,
  };

  return {
    ...fulfillment,
    delivery: assignment,
    events: [...fulfillment.events, {
      id: generateId(),
      status: fulfillment.status,
      label: `Assigned to ${partner.name}`,
      timestamp: new Date().toISOString(),
      actor: 'admin' as const,
      note: `Delivery partner: ${partner.name}, Driver: ${assignment.driverName}`,
    }],
  };
}

// ============================================================
// Storage helpers (localStorage + API sync)
// ============================================================

const STORAGE_KEY = 'ss_fulfillments';

export function getFulfillments(): OrderFulfillment[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function saveFulfillments(fulfillments: OrderFulfillment[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fulfillments)); } catch {}
}

export function getFulfillment(orderNumber: string): OrderFulfillment | undefined {
  return getFulfillments().find(f => f.orderNumber === orderNumber);
}

export function upsertFulfillment(fulfillment: OrderFulfillment): void {
  const all = getFulfillments();
  const idx = all.findIndex(f => f.orderNumber === fulfillment.orderNumber);
  if (idx >= 0) {
    all[idx] = fulfillment;
  } else {
    all.unshift(fulfillment);
  }
  saveFulfillments(all);
}

// ============================================================
// Notification helpers
// ============================================================

export function getOrderStatusNotification(
  status: FulfillmentStatus,
  orderNumber: string
): { icon: string; title: string; message: string } | null {
  switch (status) {
    case 'confirmed':
      return { icon: '✅', title: 'Order Confirmed', message: `Order ${orderNumber} has been confirmed and is being processed.` };
    case 'processing':
      return { icon: '📦', title: 'Processing', message: `Order ${orderNumber} is now being prepared.` };
    case 'awaiting_vendor':
      return { icon: '🏪', title: 'Vendor Notified', message: `The vendor has been notified about order ${orderNumber}.` };
    case 'vendor_accepted':
      return { icon: '✅', title: 'Vendor Accepted', message: `Vendor has accepted order ${orderNumber} and is preparing it.` };
    case 'vendor_shipped':
      return { icon: '📤', title: 'Shipped by Vendor', message: `Vendor has shipped the items for order ${orderNumber}.` };
    case 'in_transit':
      return { icon: '🚚', title: 'In Transit', message: `Order ${orderNumber} is on its way to you!` };
    case 'out_for_delivery':
      return { icon: '🚛', title: 'Out for Delivery', message: `Your order ${orderNumber} is out for delivery today!` };
    case 'delivered':
      return { icon: '🏠', title: 'Delivered!', message: `Order ${orderNumber} has been delivered. Enjoy! 🎉` };
    case 'cancelled':
      return { icon: '❌', title: 'Order Cancelled', message: `Order ${orderNumber} has been cancelled.` };
    default:
      return null;
  }
}
