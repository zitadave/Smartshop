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
          <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 p-2.5 w-56">
            {/* Horizontal scrollable theme swatches - no grid to avoid overflow */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all flex-shrink-0 w-14',
                    themePreset === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                  onClick={() => applyTheme(theme.id)}
                >
                  <div className="flex gap-0.5">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[7px] font-medium truncate w-full text-center">{theme.icon}</span>
                  {themePreset === theme.id && <Check size={6} className="text-primary" />}
                </button>
              ))}
            </div>

            {/* Dark/Light */}
            <div className="flex gap-1">
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
