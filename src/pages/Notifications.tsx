import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { Bell, ChevronLeft, Trash2, Check } from 'lucide-react';
import { toast } from '@/components/Toast';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, clearNotifications } = useStore();
  const [selectedNotifs, setSelectedNotifs] = useState<number[]>([]);

  const toggleSelect = (idx: number) => {
    setSelectedNotifs(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleClear = () => {
    clearNotifications();
    toast('✅ Notifications cleared', 'success');
    navigate(-1);
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">🔔 Notifications</h2>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{notifications.length}</span>
        {notifications.length > 0 && (
          <button className="ml-auto text-[10px] text-destructive font-semibold px-2 py-1 hover:bg-destructive/10 rounded-lg transition-colors" onClick={handleClear}>
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-sm font-semibold text-muted-foreground">No notifications</h3>
          <p className="text-[10px] text-muted-foreground/60 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n, i) => (
            <div
              key={i}
              className={cn(
                'bg-card rounded-xl border border-border p-3 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-all',
                selectedNotifs.includes(i) && 'border-primary bg-primary/5'
              )}
              onClick={() => toggleSelect(i)}
            >
              <span className="text-lg flex-shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{n.text}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{n.time}</p>
              </div>
              {selectedNotifs.includes(i) && (
                <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
