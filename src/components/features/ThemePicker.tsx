import { useState } from 'react';
import { useStore } from '@/stores/AppStore';
import { cn } from '@/lib/utils';
import { Palette, Check, Monitor, Sun, Moon } from 'lucide-react';
import type { ThemePreset } from '@/types';

const THEMES: { id: ThemePreset; name: string; colors: string[]; icon: string }[] = [
  { id: 'default', name: 'Default', colors: ['#6C63FF', '#8B5CF6', '#4F46E5'], icon: '💎' },
  { id: 'ocean', name: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#0284C7'], icon: '🌊' },
  { id: 'forest', name: 'Forest', colors: ['#10B981', '#34D399', '#059669'], icon: '🌿' },
  { id: 'sunset', name: 'Sunset', colors: ['#F59E0B', '#F97316', '#D97706'], icon: '🌅' },
  { id: 'midnight', name: 'Midnight', colors: ['#6366F1', '#818CF8', '#4338CA'], icon: '🌙' },
  { id: 'rose', name: 'Rose', colors: ['#EC4899', '#F43F5E', '#DB2777'], icon: '🌹' },
];

export default function ThemePicker() {
  const { themePreset, setThemePreset, darkMode, setDarkMode } = useStore();
  const [open, setOpen] = useState(false);

  const applyTheme = (preset: ThemePreset) => {
    setThemePreset(preset);
    const theme = THEMES.find(t => t.id === preset);
    if (theme) {
      document.documentElement.style.setProperty('--primary', theme.colors[0]);
      document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
      document.documentElement.style.setProperty('--accent-color', theme.colors[1]);
      document.documentElement.style.setProperty('--ring', theme.colors[0] + '40');
    }
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Palette size={14} />
        <span>Theme</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-3">
            <div className="text-[10px] font-semibold mb-2 flex items-center gap-1.5">
              <Palette size={12} /> Theme Settings
            </div>

            {/* Theme Presets */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                    themePreset === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                  onClick={() => applyTheme(theme.id)}
                >
                  <div className="flex gap-0.5">
                    {theme.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[8px] font-medium">{theme.icon} {theme.name}</span>
                  {themePreset === theme.id && <Check size={8} className="text-primary" />}
                </button>
              ))}
            </div>

            {/* Dark/Light Toggle */}
            <div className="flex gap-1.5">
              <button
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium border transition-all',
                  !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                )}
                onClick={() => setDarkMode(false)}
              >
                <Sun size={12} /> Light
              </button>
              <button
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium border transition-all',
                  darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                )}
                onClick={() => setDarkMode(true)}
              >
                <Moon size={12} /> Dark
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
