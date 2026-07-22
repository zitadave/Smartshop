/**
 * Smart Shop — Returns & Refunds System
 * 
 * Customer-facing return request portal + admin management.
 * Full lifecycle: request → review → approve/reject → refund.
 */

import { generateId } from './utils';
import type { OrderStatus } from '@/types';

// ============================================================
// Types
// ============================================================

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'size_issue'
  | 'damaged_in_transit'
  | 'changed_mind'
  | 'other';

export type ReturnStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'awaiting_return'
  | 'item_received'
  | 'refund_processed'
  | 'refunded'
  | 'closed';

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  reason: ReturnReason;
  reasonText: string;
  description: string;
  images: string[];
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: string;
  resolution: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

// ============================================================
// Return Reasons
// ============================================================

export const RETURN_REASONS: { id: ReturnReason; label: string; icon: string }[] = [
  { id: 'defective', label: 'Defective / Not Working', icon: '🔧' },
  { id: 'wrong_item', label: 'Wrong Item Received', icon: '📦' },
  { id: 'not_as_described', label: 'Not as Described', icon: '📝' },
  { id: 'size_issue', label: 'Size / Fit Issue', icon: '📏' },
  { id: 'damaged_in_transit', label: 'Damaged During Delivery', icon: '💥' },
  { id: 'changed_mind', label: 'Changed My Mind', icon: '🤷' },
  { id: 'other', label: 'Other Reason', icon: '💬' },
];

export const RETURN_STATUS_CONFIG: Record<ReturnStatus, { label: string; icon: string; color: string; bg: string }> = {
  pending_review:    { label: 'Pending Review',     icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  approved:          { label: 'Approved',            icon: '✅', color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/20' },
  rejected:          { label: 'Rejected',            icon: '❌', color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/20' },
  awaiting_return:   { label: 'Awaiting Return',     icon: '📬', color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/20' },
  item_received:     { label: 'Item Received',       icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
  refund_processed:  { label: 'Refund Processed',    icon: '💳', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  refunded:          { label: 'Refunded',             icon: '💰', color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  closed:            { label: 'Closed',              icon: '🔒', color: 'text-slate-600',  bg: 'bg-slate-100 dark:bg-slate-800' },
};

// ============================================================
// Storage
// ============================================================

const RETURNS_KEY = 'ss_return_requests';

export function getReturnRequests(): ReturnRequest[] {
  try { return JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]'); } catch { return []; }
}

export function getReturnRequest(id: string): ReturnRequest | undefined {
  return getReturnRequests().find(r => r.id === id);
}

export function saveReturnRequests(requests: ReturnRequest[]): void {
  try { localStorage.setItem(RETURNS_KEY, JSON.stringify(requests)); } catch {}
}

export function createReturnRequest(req: Omit<ReturnRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ReturnRequest {
  const request: ReturnRequest = {
    ...req,
    id: generateId(),
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getReturnRequests();
  all.unshift(request);
  saveReturnRequests(all);
  return request;
}

export function updateReturnStatus(id: string, status: ReturnStatus, resolution?: string, adminNote?: string): ReturnRequest | null {
  const all = getReturnRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    status,
    resolution: resolution || all[idx].resolution,
    adminNote: adminNote || all[idx].adminNote,
    updatedAt: new Date().toISOString(),
    ...(status === 'refunded' || status === 'closed' ? { resolvedAt: new Date().toISOString() } : {}),
  };
  saveReturnRequests(all);
  return all[idx];
}

// ============================================================
// Sample data for demo
// ============================================================

export function seedSampleReturns(): void {
  const existing = getReturnRequests();
  if (existing.length > 0) return;

  const samples: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      orderNumber: 'ETH-A1B2C3', productId: 1, productName: 'Wireless Headphones', productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
      price: 2500, quantity: 1, reason: 'defective', reasonText: 'Not charging', description: 'Left earbud stopped working after 2 days.',
      images: [], status: 'pending_review', refundAmount: 2500, refundMethod: 'Telebirr', resolution: '', adminNote: '', customerName: 'Abebe K.', customerPhone: '+251-911-123456', customerEmail: '',
    },
    {
      orderNumber: 'ETH-D4E5F6', productId: 2, productName: 'Running Shoes', productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
      price: 3200, quantity: 1, reason: 'size_issue', reasonText: 'Too small', description: 'Size 42 is actually size 41. Does not fit.',
      images: [], status: 'approved', refundAmount: 3200, refundMethod: 'CBE Birr', resolution: 'Return approved. Please ship back.', adminNote: 'Customer requested size exchange.', customerName: 'Selam W.', customerPhone: '+251-922-654321', customerEmail: '',
    },
  ];

  samples.forEach(s => {
    const request: ReturnRequest = { ...s, id: generateId(), createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() };
    const all = getReturnRequests();
    all.push(request);
    saveReturnRequests(all);
  });
}
