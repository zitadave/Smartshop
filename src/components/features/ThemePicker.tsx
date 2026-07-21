import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import type { ThemePreset } from '@/types';

const THEMES: { id: ThemePreset; name: string; colors: string[]; icon: string }[] = [
  { id: 'default', name: 'Default', colors: ['#6C63FF', '#8B5CF6'], icon: '💎' },
  { id: 'ocean', name: 'Ocean', colors: ['#0EA5E9', '#06B6D4'], icon: '🌊' },
  { id: 'forest', name: 'Forest', colors: ['#10B981', '#34D399'], icon: '🌿' },
  { id: 'sunset', name: 'Sunset', colors: ['#F59E0B', '#F97316'], icon: '🌅' },
  { id: 'midnight', name: 'Midnight', colors: ['#6366F1', '#818CF8'], icon: '🌙' },
  { id: 'rose', name: 'Rose', colors: ['#EC4899', '#F43F5E'], icon: '🌹' },
];

/** Apply theme to the document root */
export function applyThemeToDocument(preset: ThemePreset, accentColor?: string) {
  const theme = THEMES.find(t => t.id === preset) || THEMES[0];
  const root = document.documentElement;
  const primary = accentColor || theme.colors[0];
  const accent = accentColor || theme.colors[1];
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-ring', primary + '40');
  root.style.setProperty('--color-primary-foreground', '#ffffff');
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--primary-hex', primary);
  root.style.setProperty('--accent-hex', accent);
}

export default function ThemePicker() {
  const { themePreset, setThemePreset, darkMode, setDarkMode } = useStore();
  const [open, setOpen] = useState(false);

  const applyTheme = (preset: ThemePreset) => {
    setThemePreset(preset);
    applyThemeToDocument(preset);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-medium transition-colors w-full"
        onClick={() => setOpen(!open)}
      >
        <Palette size={12} />
        <span className="truncate">{THEMES.find(t => t.id === themePreset)?.name || 'Theme'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 p-3 w-64">
            <div className="text-[10px] font-semibold mb-2">🎨 Choose Theme</div>
            {/* Vertical 3 rows x 2 columns */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                    themePreset === theme.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                  onClick={() => applyTheme(theme.id)}
                >
                  <div className="flex gap-1">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[8px] font-medium">{theme.icon} {theme.name}</span>
                  {themePreset === theme.id && <Check size={8} className="text-primary" />}
                </button>
              ))}
            </div>

            {/* Dark/Light */}
            <div className="flex gap-1 border-t border-border pt-2">
              <button className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-medium border transition-all', !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border')}
                onClick={() => setDarkMode(false)}><Sun size={10} /> Light</button>
              <button className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-medium border transition-all', darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border')}
                onClick={() => setDarkMode(true)}><Moon size={10} /> Dark</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
