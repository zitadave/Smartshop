import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const illustrations: Record<string, string> = {
  '🛒': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <circle cx="100" cy="100" r="80" fill="#f1f5f9"/>
    <circle cx="100" cy="100" r="60" fill="#e2e8f0"/>
    <text x="100" y="115" text-anchor="middle" font-size="50">🛒</text>
  </svg>`,
  '♡': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <circle cx="100" cy="100" r="80" fill="#fef2f2"/>
    <circle cx="100" cy="100" r="60" fill="#fee2e2"/>
    <text x="100" y="115" text-anchor="middle" font-size="50">♡</text>
  </svg>`,
  '📦': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect x="40" y="40" width="120" height="120" rx="20" fill="#f0fdf4"/>
    <rect x="55" y="55" width="90" height="90" rx="12" fill="#dcfce7"/>
    <text x="100" y="115" text-anchor="middle" font-size="50">📦</text>
  </svg>`,
  '🔍': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <circle cx="100" cy="100" r="80" fill="#f0f5ff"/>
    <circle cx="100" cy="100" r="60" fill="#dbeafe"/>
    <text x="100" y="115" text-anchor="middle" font-size="45">🔍</text>
  </svg>`,
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const svg = illustrations[icon] || '';

  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-6', className)}>
      <div className="w-40 h-40 mb-4" dangerouslySetInnerHTML={{ __html: svg }} />
      <h3 className="text-base font-bold text-foreground/80 mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/60 mb-6 text-center max-w-xs">{description}</p>}
      {action && (
        <button
          className="px-7 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
