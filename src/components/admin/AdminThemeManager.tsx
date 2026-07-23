import { useState, useEffect } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Palette, Check, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from '@/components/Toast';

interface AdminTheme {
  id: string; name: string; icon: any;
  bg: string; card: string; text: string; textMuted: string;
  border: string; sidebar: string; header: string; hover: string;
}

const ADMIN_THEMES: AdminTheme[] = [
  { id: 'light', name: 'Pure Light', icon: Sun,
    bg: '#f8fafc', card: '#ffffff', text: '#0b0f19', textMuted: '#94a3b8',
    border: '#e2e8f0', sidebar: '#ffffff', header: '#ffffff', hover: '#f1f5f9' },
  { id: 'dark', name: 'Midnight', icon: Moon,
    bg: '#0a0e17', card: '#131a2a', text: '#e8ecf1', textMuted: '#64748b',
    border: '#1e293b', sidebar: '#0d111c', header: '#0d111c', hover: '#1a2332' },
  { id: 'ocean', name: 'Deep Ocean', icon: Monitor,
    bg: '#0c1929', card: '#0f2137', text: '#e0f2fe', textMuted: '#7ba3c7',
    border: '#1e3a5f', sidebar: '#0b1a2a', header: '#0b1a2a', hover: '#122a45' },
  { id: 'forest', name: 'Forest', icon: Monitor,
    bg: '#0a1a0e', card: '#0f2415', text: '#dcfce7', textMuted: '#6ba37e',
    border: '#1a3a22', sidebar: '#091a0e', header: '#091a0e', hover: '#112e1a' },
  { id: 'grape', name: 'Grape', icon: Sparkles,
    bg: '#140a1a', card: '#1a0f24', text: '#f3e8ff', textMuted: '#9a7db3',
    border: '#2e1a3a', sidebar: '#120a18', header: '#120a18', hover: '#22163a' },
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

    document.documentElement.setAttribute('data-admin-theme', themeId);

    // Inject CSS variables into a style tag that overrides Tailwind classes
    let styleEl = document.getElementById('admin-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'admin-theme-styles';
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      [data-admin-root] {
        background-color: ${t.bg} !important;
        color: ${t.text} !important;
      }
      [data-admin-sidebar] {
        background-color: ${t.sidebar} !important;
        border-color: ${t.border} !important;
      }
      [data-admin-header] {
        background-color: ${t.header} !important;
        border-color: ${t.border} !important;
      }
      [data-admin-card] {
        background-color: ${t.card} !important;
        border-color: ${t.border} !important;
      }
      [data-admin-card] .text-slate-400,
      [data-admin-card] .text-slate-500,
      [data-admin-card] .text-slate-600 {
        color: ${t.textMuted} !important;
      }
      [data-admin-card] .text-slate-700,
      [data-admin-card] .text-slate-800,
      [data-admin-card] .text-slate-900,
      [data-admin-card] .dark\\:text-slate-200,
      [data-admin-card] .dark\\:text-white {
        color: ${t.text} !important;
      }
      [data-admin-sidebar] .text-slate-400,
      [data-admin-sidebar] .text-slate-500 {
        color: ${t.textMuted} !important;
      }
      [data-admin-sidebar] .hover\\:text-slate-900:hover {
        color: ${t.text} !important;
      }
      [data-admin-sidebar] .bg-gradient-to-r.from-indigo-50 {
        background: ${t.hover} !important;
      }
      body {
        background-color: ${t.bg} !important;
        color: ${t.text} !important;
      }
    `;

    toast(`🎨 Admin theme: ${t.name} applied!`, 'success');
  };

  // Apply on mount
  useEffect(() => { applyAdminTheme(adminTheme); }, []);

  const currentTheme = ADMIN_THEMES.find(t => t.id === adminTheme) || ADMIN_THEMES[0];

  return (
    <div className="space-y-4 animate-fadeUp max-w-full overflow-x-hidden">
      <h2 className="text-lg font-bold flex items-center gap-2"><Palette size={20} className="text-indigo-500" /> Admin Theme Manager</h2>
      <p className="text-[10px] text-slate-500">This changes the <strong>admin panel appearance</strong> only (sidebar, cards, backgrounds). The storefront colors for customers are in the <strong>"Themes"</strong> tab.</p>

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
              )}
              style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
              onClick={() => applyAdminTheme(theme.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-2 rounded-xl', isActive ? 'bg-white/20' : 'bg-white/10')}>
                  <Icon size={18} />
                </div>
                {isActive && <Check size={14} className="text-green-400" />}
              </div>
              <h3 className="text-sm font-bold">{theme.name}</h3>
              <p className="text-[9px] mt-0.5 opacity-70">
                {theme.id === 'light' ? 'Clean, bright interface' : 'Dark, easy on the eyes'}
              </p>
              {/* Preview strip */}
              <div className="mt-2 h-6 rounded-lg flex gap-1 items-center px-2" style={{ background: theme.id === 'light' ? 'white' : 'rgba(0,0,0,0.3)' }}>
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1 h-1 rounded-full" style={{ background: theme.textMuted }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Theme Preview */}
      <div className="rounded-2xl border-2 p-4 transition-all" style={{ background: currentTheme.card, borderColor: currentTheme.border, color: currentTheme.text }}>
        <div className="flex items-center gap-3 mb-3">
          <Palette size={20} />
          <div>
            <div className="text-sm font-bold">{currentTheme.name} — Active</div>
            <div className="text-[9px]" style={{ color: currentTheme.textMuted }}>This theme applies only to the admin panel interface.</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Dashboard', 'Products', 'Orders', 'Settings'].map(label => (
            <div key={label} className="p-2 rounded-lg text-[9px] font-medium text-center"
              style={{ background: currentTheme.id === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)' }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Dark Mode Sync */}
      <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ background: currentTheme.card, borderColor: currentTheme.border, color: currentTheme.text }}>
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-amber-500" />
          <Moon size={16} className="text-indigo-500" />
          <span className="text-xs font-medium">Admin Dark Mode Sync</span>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} className="rounded" />
          Sync with store dark mode
        </label>
        <button className="px-3 py-1 rounded-lg text-[10px] flex items-center gap-1 hover:opacity-80"
          style={{ background: currentTheme.hover, color: currentTheme.text }}
          onClick={() => { applyAdminTheme(adminTheme); toast('🔄 Theme refreshed!', 'info'); }}>
          <RefreshCw size={11} /> Apply
        </button>
      </div>
    </div>
  );
}
