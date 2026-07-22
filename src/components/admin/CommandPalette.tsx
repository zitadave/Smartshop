import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Package, ShoppingCart, Store, Settings, Users, BarChart3, Plus, Tag, Zap, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: 'overview', label: 'Dashboard', description: 'View store overview and stats', icon: BarChart3, action: () => onNavigate('overview'), keywords: ['dashboard', 'home', 'stats', 'analytics'] },
    { id: 'products', label: 'Products', description: 'Manage all products', icon: Package, action: () => onNavigate('products'), keywords: ['products', 'items', 'inventory', 'goods'] },
    { id: 'add-product', label: 'Add Product', description: 'Create a new product', icon: Plus, action: () => onNavigate('products'), keywords: ['add', 'create', 'new product'] },
    { id: 'orders', label: 'Orders', description: 'View and manage orders', icon: ShoppingCart, action: () => onNavigate('orders'), keywords: ['orders', 'sales', 'purchases'] },
    { id: 'vendors', label: 'Vendors', description: 'Manage vendors and commissions', icon: Store, action: () => onNavigate('vendors'), keywords: ['vendors', 'sellers', 'suppliers', 'commission'] },
    { id: 'marketplace', label: 'Marketplace', description: 'Flash sales, sponsored products', icon: Zap, action: () => onNavigate('marketplace'), keywords: ['marketplace', 'flash', 'sponsored', 'deals'] },
    { id: 'reviews', label: 'Reviews', description: 'Customer photo reviews', icon: Users, action: () => onNavigate('reviews'), keywords: ['reviews', 'ratings', 'feedback'] },
    { id: 'broadcast', label: 'Broadcast', description: 'Send in-app notifications', icon: Smartphone, action: () => onNavigate('broadcast'), keywords: ['broadcast', 'notifications', 'messages', 'announce'] },
    { id: 'flashdeals', label: 'Flash Deals', description: 'Manage time-limited promotions', icon: Zap, action: () => onNavigate('flashdeals'), keywords: ['flash', 'deals', 'promotions', 'limited'] },
    { id: 'preorders', label: 'Pre-Orders', description: 'Manage pre-orders', icon: Package, action: () => onNavigate('preorders'), keywords: ['preorder', 'pre-order', 'preorder'] },
    { id: 'tracking', label: 'Tracking', description: 'Order tracking management', icon: ShoppingCart, action: () => onNavigate('tracking'), keywords: ['tracking', 'ship', 'delivery'] },
    { id: 'themes', label: 'Themes', description: 'Customize look and feel', icon: Settings, action: () => onNavigate('themes'), keywords: ['themes', 'colors', 'appearance', 'skin'] },
    { id: 'coupons', label: 'Coupons', description: 'Discount coupon management', icon: Tag, action: () => onNavigate('coupons'), keywords: ['coupons', 'discount', 'promo', 'codes'] },
    { id: 'settings', label: 'Settings', description: 'General settings & configuration', icon: Settings, action: () => onNavigate('settings'), keywords: ['settings', 'config', 'preferences'] },
  ];

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : commands;

  const handleSelect = (item: CommandItem) => {
    item.action();
    setOpen(false);
    setQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIdx]) { handleSelect(filtered[selectedIdx]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground/60 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
          />
          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No commands found</div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    i === selectedIdx ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  <div className={cn('p-1.5 rounded-lg', i === selectedIdx ? 'bg-primary/10' : 'bg-muted')}>
                    <Icon size={14} className={i === selectedIdx ? 'text-primary' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{item.description}</div>
                  </div>
                  <ArrowRight size={12} className="text-muted-foreground/40 flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30">
          <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Command size={9} />K to open</span>
          <span className="text-[9px] text-muted-foreground">↑↓ to navigate</span>
          <span className="text-[9px] text-muted-foreground">↵ to select</span>
        </div>
      </div>
    </div>
  );
}
