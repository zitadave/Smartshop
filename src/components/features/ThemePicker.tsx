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
        className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[9px] font-medium transition-colors w-full"
        onClick={() => setOpen(!open)}
      >
        <Palette size={10} />
        <span className="truncate">{THEMES.find(t => t.id === themePreset)?.name || 'Theme'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Opens to the RIGHT (left-aligned) but since theme is on the right side of grid, we use right-0 to open toward currency */}
          <div className="absolute right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 p-2 w-52">
            <div className="text-[8px] font-semibold mb-1.5 text-muted-foreground">🎨 Theme</div>
            {/* 2 columns */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={cn(
                    'flex items-center gap-1 p-1.5 rounded-lg border transition-all',
                    themePreset === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                  onClick={() => applyTheme(theme.id)}
                >
                  <div className="flex gap-px flex-shrink-0">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[7px] truncate flex-1">{theme.icon} {theme.name}</span>
                  {themePreset === theme.id && <Check size={6} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex gap-1 border-t border-border pt-1.5">
              <button className={cn('flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg text-[8px] font-medium border transition-all', !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border')}
                onClick={() => setDarkMode(false)}><Sun size={8} /> L</button>
              <button className={cn('flex-1 flex items-center justify-center gap-0.5 py-1 rounded-lg text-[8px] font-medium border transition-all', darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border')}
                onClick={() => setDarkMode(true)}><Moon size={8} /> D</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
