/**
 * Smart Shop — Customer Returns Portal
 * 
 * Customers can view order history and initiate returns/refunds.
 * Supports photo upload, reason selection, and status tracking.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, cn, generateId } from '@/lib/utils';
import {
  getReturnRequests, createReturnRequest, RETURN_REASONS, RETURN_STATUS_CONFIG,
  type ReturnReason,
} from '@/lib/returns';
import {
  ChevronLeft, Package, Upload, Camera, X, CheckCircle,
  AlertTriangle, MessageSquare, ArrowRight, Star,
} from 'lucide-react';
import { toast } from '@/components/Toast';

export default function ReturnsPortal() {
  const navigate = useNavigate();
  const { orders, profile } = useStore();
  const [step, setStep] = useState<'select' | 'reason' | 'confirm' | 'done'>('select');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createdId = useRef('');

  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').slice(0, 10);
  const existingReturns = getReturnRequests();
  const openReturns = existingReturns.filter(r => !['refunded', 'closed', 'rejected'].includes(r.status));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).slice(0, 3).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages(prev => [...prev, ev.target?.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  const submitReturn = () => {
    if (!selectedItem || !reason || !description.trim()) return;
    setSubmitting(true);

    const req = createReturnRequest({
      orderNumber: selectedOrder.orderNumber,
      productId: selectedItem.id,
      productName: selectedItem.name,
      productImage: selectedItem.image || '',
      price: selectedItem.price,
      quantity: selectedItem.quantity,
      reason: reason as ReturnReason,
      reasonText: RETURN_REASONS.find(r => r.id === reason)?.label || reason,
      description: description.trim(),
      images,
      refundAmount: selectedItem.price * selectedItem.quantity,
      refundMethod: selectedOrder.paymentMethod || 'Telebirr',
      resolution: '',
      adminNote: '',
      customerName: profile.name || 'Customer',
      customerPhone: profile.phone || '',
      customerEmail: '',
    });
    createdId.current = req.id;
    setStep('done');
    setSubmitting(false);
    toast('✅ Return request submitted! We\'ll review within 24 hours.', 'success');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto animate-fadeUp">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => step === 'select' ? navigate(-1) : setStep('select')} className="p-1 hover:bg-muted rounded-lg"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">🔄 Returns & Refunds</h2>
        {openReturns.length > 0 && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{openReturns.length} active</span>}
      </div>

      {/* Active Returns */}
      {step === 'select' && openReturns.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Active Return Requests</h3>
          <div className="space-y-1.5">
            {openReturns.map(r => {
              const cfg = RETURN_STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2.5 mb-1">
                    <img src={r.productImage} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{r.productName}</div>
                      <div className="text-[9px] text-muted-foreground">{r.orderNumber}</div>
                    </div>
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', cfg?.bg, cfg?.color)}>{cfg?.icon} {cfg?.label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground ml-12">{RETURN_REASONS.find(re => re.id === r.reason)?.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Select Order */}
      {step === 'select' && (
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Select an order to return</h3>
          {pastOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={40} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No eligible orders</p>
              <p className="text-[9px] text-muted-foreground/60">Only delivered orders can be returned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastOrders.map(order => (
                <div key={order.orderNumber} className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:border-primary transition-all" onClick={() => { setSelectedOrder(order); setStep('reason'); }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono text-primary">{order.orderNumber}</span>
                    <span className="text-[8px] text-muted-foreground">{order.date}</span>
                  </div>
                  <div className="flex gap-2">
                    {order.items.slice(0, 2).map((it: any, i: number) => (
                      <span key={i} className="text-[9px] bg-muted px-2 py-0.5 rounded">{it.name} ×{it.quantity}</span>
                    ))}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{formatPrice(order.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Item & Reason */}
      {step === 'reason' && selectedOrder && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold">Select Item to Return</h3>
          <div className="space-y-1.5">
            {selectedOrder.items.map((item: any, i: number) => (
              <div key={i} className={cn('bg-card rounded-xl border p-3 cursor-pointer transition-all', selectedItem?.id === item.id ? 'border-primary bg-primary/5' : 'border-border')} onClick={() => setSelectedItem(item)}>
                <div className="flex items-center gap-2.5">
                  <div className="text-base">{selectedItem?.id === item.id ? '✅' : '📦'}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{item.name}</div>
                    <div className="text-[9px] text-muted-foreground">{formatPrice(item.price)} × {item.quantity}</div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          {selectedItem && (
            <>
              <h3 className="text-xs font-semibold mt-2">Reason for Return</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {RETURN_REASONS.map(r => (
                  <button key={r.id} className={cn('flex items-center gap-1.5 p-2.5 rounded-xl border text-[10px] text-left transition-all', reason === r.id ? 'border-primary bg-primary/5' : 'border-border')} onClick={() => setReason(r.id)}>
                    <span>{r.icon}</span>
                    <span className="leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-semibold mb-1">Description</h3>
                <textarea className="w-full p-2.5 border border-input rounded-xl text-xs bg-card resize-none h-20" placeholder="Tell us more about the issue..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {/* Images */}
              <div>
                <h3 className="text-xs font-semibold mb-1">Photos (optional)</h3>
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative"><img src={img} className="w-16 h-16 rounded-lg object-cover border" /><button className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>✕</button></div>
                  ))}
                  <button className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary" onClick={() => fileRef.current?.click()}><Camera size={18} /></button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50" onClick={() => setStep('confirm')} disabled={!reason || !description.trim()}>
                Continue to Review →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold">Review Return Request</h3>
          <div className="bg-card rounded-xl border border-border p-3 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selectedItem?.name}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Refund Amount</span><span className="font-bold text-green-600">{formatPrice((selectedItem?.price || 0) * (selectedItem?.quantity || 1))}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reason</span><span className="font-semibold">{RETURN_REASONS.find(r => r.id === reason)?.label}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Refund Method</span><span className="font-semibold">{selectedOrder?.paymentMethod || 'Telebirr'}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Images</span><span className="font-semibold">{images.length} uploaded</span></div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-[9px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            <span>Returns are reviewed within 24 hours. You'll be notified via Telegram when the status changes.</span>
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-sm font-bold disabled:opacity-50" onClick={submitReturn} disabled={submitting}>
            {submitting ? 'Submitting...' : '✅ Submit Return Request'}
          </button>
          <button className="w-full py-2 border border-border rounded-xl text-xs" onClick={() => setStep('reason')}>← Go Back</button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-green-500" /></div>
          <h2 className="text-lg font-bold mb-1">Return Submitted! 🎉</h2>
          <p className="text-xs text-muted-foreground mb-4">We'll review your request and get back to you within 24 hours.</p>
          <div className="bg-card rounded-xl border border-border p-3 mb-4 text-left text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Request ID</span><span className="font-mono font-bold text-primary">{createdId.current.substring(0, 12)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-semibold">{selectedItem?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Refund</span><span className="font-bold text-green-600">{formatPrice((selectedItem?.price || 0) * (selectedItem?.quantity || 1))}</span></div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold" onClick={() => { setStep('select'); setSelectedItem(null); setReason(''); setDescription(''); setImages([]); }}>Submit Another</button>
            <button className="flex-1 py-3 border border-border rounded-xl text-xs" onClick={() => navigate('/orders')}>View Orders</button>
          </div>
        </div>
      )}
    </div>
  );
}
