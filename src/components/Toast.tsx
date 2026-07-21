import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
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
    success: <CheckCircle size={16} className="text-green-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    warning: <AlertCircle size={16} className="text-orange-500" />,
    info: <Info size={16} className="text-blue-500" />,
  };

  return (
    <div className="toast-container" style={{ pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <X size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
