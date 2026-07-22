import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { settingsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Palette, Check, Sparkles } from 'lucide-react';
import { toast } from '@/components/Toast';

const ADMIN_THEMES = [
  { id: 'light', name: 'Pure Light', icon: Sun, gradient: 'from-amber-50 to-white', border: 'border-amber-200', text: 'text-amber-700' },
  { id: 'dark', name: 'Midnight', icon: Moon, gradient: 'from-slate-900 to-slate-800', border: 'border-slate-600', text: 'text-slate-300' },
  { id: 'ocean', name: 'Deep Ocean', icon: Monitor, gradient: 'from-blue-900 to-slate-900', border: 'border-blue-700', text: 'text-blue-300' },
  { id: 'forest', name: 'Forest', icon: Monitor, gradient: 'from-emerald-900 to-slate-900', border: 'border-emerald-700', text: 'text-emerald-300' },
  { id: 'grape', name: 'Grape', icon: Sparkles, gradient: 'from-purple-900 to-slate-900', border: 'border-purple-700', text: 'text-purple-300' },
];

export default function AdminThemeManager() {
  const { darkMode, setDarkMode } = useStore();
  const [adminTheme, setAdminTheme] = useState(() => localStorage.getItem('ss_admin_theme') || 'light');

  const applyAdminTheme = (themeId: string) => {
    localStorage.setItem('ss_admin_theme', themeId);
    setAdminTheme(themeId);
    const root = document.querySelector('.admin-panel-root') as HTMLElement || document.documentElement;
    
    // Remove all theme classes
    ADMIN_THEMES.forEach(t => root.classList.remove(`admin-${t.id}`));
    root.classList.add(`admin-${themeId}`);

    // Apply CSS variables
    if (themeId === 'light') {
      root.style.setProperty('--admin-bg', '#f8fafc');
      root.style.setProperty('--admin-card', '#ffffff');
      root.style.setProperty('--admin-text', '#0b0f19');
      root.style.setProperty('--admin-border', '#e2e8f0');
    } else if (themeId === 'dark') {
      root.style.setProperty('--admin-bg', '#0a0e17');
      root.style.setProperty('--admin-card', '#131a2a');
      root.style.setProperty('--admin-text', '#e8ecf1');
      root.style.setProperty('--admin-border', '#1e293b');
    } else if (themeId === 'ocean') {
      root.style.setProperty('--admin-bg', '#0c1929');
      root.style.setProperty('--admin-card', '#0f2137');
      root.style.setProperty('--admin-text', '#e0f2fe');
      root.style.setProperty('--admin-border', '#1e3a5f');
    } else if (themeId === 'forest') {
      root.style.setProperty('--admin-bg', '#0a1a0e');
      root.style.setProperty('--admin-card', '#0f2415');
      root.style.setProperty('--admin-text', '#dcfce7');
      root.style.setProperty('--admin-border', '#1a3a22');
    } else if (themeId === 'grape') {
      root.style.setProperty('--admin-bg', '#140a1a');
      root.style.setProperty('--admin-card', '#1a0f24');
      root.style.setProperty('--admin-text', '#f3e8ff');
      root.style.setProperty('--admin-border', '#2e1a3a');
    }
    toast(`🎨 Theme: ${ADMIN_THEMES.find(t => t.id === themeId)?.name}`, 'success');
  };

  // Apply on mount
  useEffect(() => { applyAdminTheme(adminTheme); }, []);

  const currentTheme = ADMIN_THEMES.find(t => t.id === adminTheme) || ADMIN_THEMES[0];

  return (
    <div className="space-y-4 animate-fadeUp">
      <h2 className="text-lg font-bold flex items-center gap-2"><Palette size={20} className="text-indigo-500" /> Admin Theme Manager</h2>
      <p className="text-[10px] text-slate-500">Choose a dedicated theme for the admin panel — separate from the customer-facing store theme.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ADMIN_THEMES.map(theme => {
          const Icon = theme.icon;
          const isActive = adminTheme === theme.id;
          return (
            <button
              key={theme.id}
              className={cn(
                'relative rounded-2xl border-2 p-4 text-left transition-all hover:shadow-xl hover:-translate-y-0.5',
                isActive ? 'ring-2 ring-primary shadow-lg' : '',
                theme.border
              )}
              style={{ background: theme.gradient.split(' ')[0] }}
              onClick={() => applyAdminTheme(theme.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-2 rounded-xl', isActive ? 'bg-white/20' : 'bg-white/10')}>
                  <Icon size={18} className={theme.text} />
                </div>
                {isActive && <Check size={14} className="text-green-400" />}
              </div>
              <h3 className={cn('text-sm font-bold', theme.text)}>{theme.name}</h3>
              <p className={cn('text-[9px] mt-0.5 opacity-70', theme.text)}>
                {theme.id === 'light' ? 'Clean, bright interface' : 'Easy on the eyes, reduces glare'}
              </p>
              {/* Preview strip */}
              <div className={cn('mt-2 h-6 rounded-lg flex gap-1 items-center px-2', theme.id === 'light' ? 'bg-white' : 'bg-black/30')}>
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1 h-1 rounded-full bg-muted/50" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className={cn('rounded-2xl border p-4 transition-all', currentTheme.border)} style={{ background: currentTheme.gradient.split(' ')[0] }}>
        <div className={cn('flex items-center gap-3 mb-3', currentTheme.text)}>
          <Palette size={20} />
          <div>
            <div className="text-sm font-bold">{currentTheme.name} — Active</div>
            <div className="text-[9px] opacity-70">This theme applies only to the admin panel</div>
          </div>
        </div>
        <div className={cn('grid grid-cols-4 gap-2', currentTheme.text)}>
          {['Dashboard', 'Products', 'Orders', 'Settings'].map(label => (
            <div key={label} className={cn('p-2 rounded-lg text-[9px] font-medium text-center', currentTheme.id === 'light' ? 'bg-white/80 text-slate-700' : 'bg-black/20')}>
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
      </div>
    </div>
  );
}
