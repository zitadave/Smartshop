import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Palette, Check, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from '@/components/Toast';

const ADMIN_THEMES = [
  { id: 'light', name: 'Pure Light', icon: Sun, gradient: 'from-amber-50 to-white', border: 'border-amber-200', text: 'text-amber-700', bg: '#f8fafc', card: '#ffffff', textC: '#0b0f19', borderC: '#e2e8f0' },
  { id: 'dark', name: 'Midnight', icon: Moon, gradient: 'from-slate-900 to-slate-800', border: 'border-slate-600', text: 'text-slate-300', bg: '#0a0e17', card: '#131a2a', textC: '#e8ecf1', borderC: '#1e293b' },
  { id: 'ocean', name: 'Deep Ocean', icon: Monitor, gradient: 'from-blue-900 to-slate-900', border: 'border-blue-700', text: 'text-blue-300', bg: '#0c1929', card: '#0f2137', textC: '#e0f2fe', borderC: '#1e3a5f' },
  { id: 'forest', name: 'Forest', icon: Monitor, gradient: 'from-emerald-900 to-slate-900', border: 'border-emerald-700', text: 'text-emerald-300', bg: '#0a1a0e', card: '#0f2415', textC: '#dcfce7', borderC: '#1a3a22' },
  { id: 'grape', name: 'Grape', icon: Sparkles, gradient: 'from-purple-900 to-slate-900', border: 'border-purple-700', text: 'text-purple-300', bg: '#140a1a', card: '#1a0f24', textC: '#f3e8ff', borderC: '#2e1a3a' },
];

export default function AdminThemeManager() {
  const { darkMode, setDarkMode } = useStore();
  const [adminTheme, setAdminTheme] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_admin_theme') || '"light"'); } catch { return 'light'; }
  });

  const applyAdminTheme = (themeId: string) => {
    localStorage.setItem('ss_admin_theme', JSON.stringify(themeId));
    setAdminTheme(themeId);
    const t = ADMIN_THEMES.find(x => x.id === themeId);
    if (!t) return;

    // Apply CSS variables to admin panel root
    const root = document.querySelector('.admin-panel-root') as HTMLElement || document.querySelector('main') || document.documentElement;
    root.style.setProperty('--admin-bg', t.bg);
    root.style.setProperty('--admin-card', t.card);
    root.style.setProperty('--admin-text', t.textC);
    root.style.setProperty('--admin-border', t.borderC);
    root.style.setProperty('background', t.bg);

    // Also set on body for full coverage
    document.body.style.background = t.bg;
    document.body.style.color = t.textC;

    toast(`🎨 Admin theme: ${t.name} applied!`, 'success');
  };

  // Apply on mount
  useEffect(() => { applyAdminTheme(adminTheme); }, []);

  const currentTheme = ADMIN_THEMES.find(t => t.id === adminTheme) || ADMIN_THEMES[0];

  return (
    <div className="space-y-4 animate-fadeUp max-w-full overflow-x-hidden">
      <h2 className="text-lg font-bold flex items-center gap-2"><Palette size={20} className="text-indigo-500" /> Admin Theme Manager</h2>
      <p className="text-[10px] text-slate-500">Choose a dedicated theme for the admin panel — separate from the customer-facing store theme ("Themes" tab). The store theme changes colors for your customers; this changes the admin panel appearance only.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ADMIN_THEMES.map(theme => {
          const Icon = theme.icon;
          const isActive = adminTheme === theme.id;
          return (
            <button
              key={theme.id}
              className={cn(
                'relative rounded-2xl border-2 p-4 text-left transition-all hover:shadow-xl hover:-translate-y-0.5',
                isActive ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02]' : '',
                theme.border
              )}
              style={{ background: theme.bg, color: theme.textC }}
              onClick={() => applyAdminTheme(theme.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-2 rounded-xl', isActive ? 'bg-white/20' : 'bg-white/10')}>
                  <Icon size={18} className={theme.text} />
                </div>
                {isActive && <Check size={14} className="text-green-400" />}
              </div>
              <h3 className="text-sm font-bold">{theme.name}</h3>
              <p className="text-[9px] mt-0.5 opacity-70">
                {theme.id === 'light' ? 'Clean, bright interface' : 'Easy on the eyes, reduces glare'}
              </p>
              {/* Preview */}
              <div className="mt-2 h-6 rounded-lg flex gap-1 items-center px-2" style={{ background: theme.id === 'light' ? 'white' : 'rgba(0,0,0,0.3)' }}>
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1 h-1 rounded-full" style={{ background: theme.textC + '40' }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview Card */}
      <div className="rounded-2xl border-2 p-4 transition-all" style={{ background: currentTheme.card, borderColor: currentTheme.borderC, color: currentTheme.textC }}>
        <div className="flex items-center gap-3 mb-3">
          <Palette size={20} />
          <div>
            <div className="text-sm font-bold">{currentTheme.name} — Active</div>
            <div className="text-[9px] opacity-70">This theme applies only to the admin panel. Store colors are managed in the "Themes" tab.</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Dashboard', 'Products', 'Orders', 'Settings'].map(label => (
            <div key={label} className="p-2 rounded-lg text-[9px] font-medium text-center" style={{ background: currentTheme.id === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)' }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Quick toggle */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-amber-500" />
          <Moon size={16} className="text-indigo-500" />
          <span className="text-xs font-medium">Admin Dark Mode Sync</span>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} className="rounded" />
          Sync with store dark mode
        </label>
        <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] flex items-center gap-1 hover:bg-slate-200" onClick={() => { applyAdminTheme(adminTheme); toast('🔄 Theme refreshed!', 'info'); }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>
    </div>
  );
}
