import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info, ShoppingCart, Heart } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'cart' | 'wish';
}

let _toastId = 0;
let _addToast: ((msg: string, type: ToastItem['type']) => void) | null = null;

export function toast(message: string, type: ToastItem['type'] = 'success') {
  if (_addToast) _addToast(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastItem['type']) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    warning: <AlertCircle size={18} className="text-orange-500" />,
    info: <Info size={18} className="text-blue-500" />,
    cart: <ShoppingCart size={18} className="text-primary" />,
    wish: <Heart size={18} className="text-red-500" />,
  };

  return (
    <div className="toast-container" style={{ pointerEvents: 'none' }}>
      {toasts.map((t, i) => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : 'success'}`}
          onClick={() => remove(t.id)}
          style={{
            pointerEvents: 'auto', cursor: 'pointer',
            animation: `fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both`,
            zIndex: 99999 - i,
          }}>
          {icons[t.type] || icons.info}
          <span style={{ flex: 1 }}>{t.message}</span>
          <X size={14} style={{ opacity: 0.3, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
