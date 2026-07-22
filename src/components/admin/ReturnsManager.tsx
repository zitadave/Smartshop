/**
 * Smart Shop — Returns & Refunds Admin Management
 */

import { useState, useEffect } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { useStore } from '@/stores/AppStore';
import {
  getReturnRequests, updateReturnStatus, saveReturnRequests,
  seedSampleReturns, RETURN_REASONS, RETURN_STATUS_CONFIG,
  type ReturnRequest, type ReturnStatus,
} from '@/lib/returns';
import { Package, Search, Filter, CheckCircle, XCircle, DollarSign, ChevronRight, MessageSquare, Eye, RefreshCw } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function ReturnsManager() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [filter, setFilter] = useState<ReturnStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { seedSampleReturns(); setRequests(getReturnRequests()); }, []);

  const refresh = () => setRequests(getReturnRequests());

  const handleStatus = (id: string, status: ReturnStatus) => {
    const updated = updateReturnStatus(id, status, resolution, adminNote);
    if (updated) {
      setSelected(updated);
      setRequests(getReturnRequests());
      toast(`✅ ${RETURN_STATUS_CONFIG[status].label}`, 'success');
      setResolution('');
      setAdminNote('');
    }
  };

  const filtered = requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.orderNumber.toLowerCase().includes(search.toLowerCase()) && !r.productName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending_review').length;

  return (
    <div className="animate-fadeUp space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Package size={20} className="text-orange-500" /> Returns & Refunds</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">{requests.length} requests · {pendingCount} pending review</p>
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {(['all', 'pending_review', 'approved', 'rejected', 'awaiting_return', 'item_received', 'refunded'] as const).map(s => {
          const count = s === 'all' ? requests.length : requests.filter(r => r.status === s).length;
          return (
            <button key={s} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap border transition-all', filter === s ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700')} onClick={() => setFilter(s)}>
              {RETURN_STATUS_CONFIG[s as ReturnStatus]?.icon || '📋'} {s.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900" placeholder="Search by order or product..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Request List */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {filtered.map(r => {
            const cfg = RETURN_STATUS_CONFIG[r.status];
            const reason = RETURN_REASONS.find(re => re.id === r.reason);
            return (
              <div key={r.id} className={cn('bg-white dark:bg-slate-900 rounded-2xl border p-3 cursor-pointer transition-all hover:shadow-md', selected?.id === r.id ? 'border-indigo-500 ring-1' : 'border-slate-200 dark:border-slate-800')} onClick={() => setSelected(r)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono text-indigo-600">{r.orderNumber}</span>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', cfg?.bg, cfg?.color)}>{cfg?.icon} {cfg?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={r.productImage} className="w-8 h-8 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate">{r.productName}</div>
                    <div className="text-[9px] text-slate-400">{reason?.icon} {reason?.label} · {formatPrice(r.refundAmount)}</div>
                  </div>
                </div>
                <div className="text-[8px] text-slate-400 mt-1">{r.customerName} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No return requests found</p>}
        </div>

        {/* Detail Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-indigo-600">{selected.orderNumber}</h3>
                <span className={cn('text-[9px] px-2 py-0.5 rounded-lg font-semibold', RETURN_STATUS_CONFIG[selected.status]?.bg, RETURN_STATUS_CONFIG[selected.status]?.color)}>
                  {RETURN_STATUS_CONFIG[selected.status]?.icon} {RETURN_STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>

              {/* Product */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 flex items-center gap-2.5">
                <img src={selected.productImage} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <div className="text-xs font-semibold">{selected.productName}</div>
                  <div className="text-[9px] text-slate-400">×{selected.quantity} · {formatPrice(selected.price)} · Total: {formatPrice(selected.refundAmount)}</div>
                </div>
              </div>

              {/* Customer */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2"><span className="text-slate-400">Customer</span><div className="font-semibold">{selected.customerName}</div></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2"><span className="text-slate-400">Phone</span><div className="font-semibold">{selected.customerPhone}</div></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2"><span className="text-slate-400">Reason</span><div className="font-semibold">{RETURN_REASONS.find(r => r.id === selected.reason)?.icon} {RETURN_REASONS.find(r => r.id === selected.reason)?.label}</div></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2"><span className="text-slate-400">Refund via</span><div className="font-semibold">{selected.refundMethod}</div></div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5">
                <div className="text-[9px] text-slate-400 mb-0.5">Description</div>
                <p className="text-[10px]">{selected.description}</p>
              </div>

              {/* Status Actions */}
              <div>
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Actions</h4>
                <div className="flex gap-1 flex-wrap">
                  {selected.status === 'pending_review' && (
                    <>
                      <button className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1" onClick={() => handleStatus(selected.id, 'approved')}><CheckCircle size={10} /> Approve</button>
                      <button className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-bold flex items-center gap-1" onClick={() => handleStatus(selected.id, 'rejected')}><XCircle size={10} /> Reject</button>
                    </>
                  )}
                  {selected.status === 'approved' && <button className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-bold" onClick={() => handleStatus(selected.id, 'awaiting_return')}>📬 Mark Awaiting Return</button>}
                  {selected.status === 'awaiting_return' && <button className="px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-bold" onClick={() => handleStatus(selected.id, 'item_received')}>📦 Item Received</button>}
                  {selected.status === 'item_received' && <button className="px-2.5 py-1.5 bg-purple-500 text-white rounded-lg text-[9px] font-bold" onClick={() => handleStatus(selected.id, 'refund_processed')}>💳 Process Refund</button>}
                  {selected.status === 'refund_processed' && <button className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold" onClick={() => handleStatus(selected.id, 'refunded')}>💰 Mark Refunded</button>}
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <input className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" placeholder="Resolution / note to customer..." value={resolution} onChange={e => setResolution(e.target.value)} />
              </div>
              {selected.adminNote && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 text-[9px]"><span className="font-semibold">Admin Note:</span> {selected.adminNote}</div>
              )}
              {selected.resolvedAt && <div className="text-[8px] text-slate-400">Resolved: {new Date(selected.resolvedAt).toLocaleString()}</div>}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              <Package size={32} className="mx-auto mb-2 text-slate-300" />
              Select a return request to manage
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
