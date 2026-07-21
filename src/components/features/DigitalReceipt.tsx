import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { generateReceiptHTML, formatPrice, cn } from '@/lib/utils';
import { FileText, Download, Printer, Share2, X, Check, Loader } from 'lucide-react';

interface DigitalReceiptProps {
  orderNumber: string;
  onClose?: () => void;
}

export default function DigitalReceipt({ orderNumber, onClose }: DigitalReceiptProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const { orders, profile } = useStore();
  const order = orders.find(o => o.orderNumber === orderNumber);

  if (!order) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        Order not found
      </div>
    );
  }

  const receiptData = {
    orderNumber: order.orderNumber,
    date: order.date,
    customerName: order.customer?.name || profile.name || 'Customer',
    customerPhone: order.customer?.phone || profile.phone || '-',
    customerAddress: `${order.customer?.city || ''} ${order.customer?.address || ''}`,
    items: order.items.map(it => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      total: it.price * it.quantity,
    })),
    subtotal: order.subtotal || order.items.reduce((s, it) => s + it.price * it.quantity, 0),
    discount: order.discount || 0,
    total: order.total || order.items.reduce((s, it) => s + it.price * it.quantity, 0),
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    paymentReference: `PAY-${order.orderNumber}`,
    storeName: 'Smart Shop',
    storeAddress: 'Addis Ababa, Ethiopia',
  };

  const handlePrint = () => {
    const html = generateReceiptHTML(receiptData);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleDownload = () => {
    const html = generateReceiptHTML(receiptData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Smart Shop Receipt\nOrder: ${orderNumber}\nTotal: ${formatPrice(receiptData.total)}\nDate: ${order.date}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${orderNumber}`,
          text: `Smart Shop Receipt - ${formatPrice(receiptData.total)}`,
        });
      } catch {}
    }
  };

  const total = receiptData.total;
  const items = receiptData.items;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-lg shadow-lg shadow-primary/20">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Digital Receipt</h3>
              <p className="text-[10px] text-muted-foreground font-mono">{orderNumber}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Receipt Preview */}
      {showReceipt ? (
        <div className="p-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-xs font-mono shadow-inner">
            <div className="text-center mb-3 border-b border-dashed border-gray-300 dark:border-gray-700 pb-2">
              <div className="text-lg">🏪</div>
              <div className="font-bold text-sm">SMART SHOP</div>
              <div className="text-[8px] text-gray-500">Digital Receipt</div>
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Order:</span>
                <span className="font-bold">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{order.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span>{receiptData.customerName}</span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-2 mb-2">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="truncate max-w-[180px]">{it.name} ×{it.quantity}</span>
                  <span>Br {it.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>Br {receiptData.subtotal.toLocaleString()}</span>
              </div>
              {receiptData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-Br {receiptData.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-gray-300 dark:border-gray-700 pt-1">
                <span>TOTAL</span>
                <span className="text-primary">Br {total.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center mt-3 text-[8px] text-gray-400 border-t border-dashed border-gray-300 dark:border-gray-700 pt-2">
              Thank you for shopping with Smart Shop!
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center">
          <div className="text-4xl mb-2 opacity-50">🧾</div>
          <h4 className="text-sm font-semibold mb-1">Receipt Ready</h4>
          <p className="text-[11px] text-muted-foreground mb-3">
            Total: <span className="font-bold text-primary">{formatPrice(total)}</span>
          </p>
          <div className="flex justify-center gap-2">
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-semibold flex items-center gap-1"
              onClick={() => setShowReceipt(true)}
            >
              <FileText size={12} /> View
            </button>
            <button
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1"
              onClick={handlePrint}
            >
              <Printer size={12} /> Print
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1"
              onClick={handleDownload}
            >
              <Download size={12} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-3 border-t border-border">
        <button
          className={cn(
            'flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all',
            copied ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
          onClick={handleCopy}
        >
          {copied ? <Check size={12} /> : <FileText size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          className="flex-1 py-2 rounded-lg text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center gap-1"
          onClick={handleShare}
        >
          <Share2 size={12} /> Share
        </button>
      </div>
    </div>
  );
}

/** Mini receipt button for use in order cards */
export function ReceiptButton({ orderNumber, compact }: { orderNumber: string; compact?: boolean }) {
  const [show, setShow] = useState(false);

  if (compact) {
    return (
      <>
        <button
          className="text-[9px] text-primary font-semibold flex items-center gap-0.5"
          onClick={(e) => { e.stopPropagation(); setShow(true); }}
        >
          <FileText size={10} /> Receipt
        </button>
        {show && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center" onClick={() => setShow(false)}>
            <div className="bg-card rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <DigitalReceipt orderNumber={orderNumber} onClose={() => setShow(false)} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold hover:bg-primary/20 transition-colors"
        onClick={() => setShow(true)}
      >
        <FileText size={12} /> Digital Receipt
      </button>
      {show && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <DigitalReceipt orderNumber={orderNumber} onClose={() => setShow(false)} />
          </div>
        </div>
      )}
    </>
  );
}
