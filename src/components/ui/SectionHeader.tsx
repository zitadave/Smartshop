import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: string;
}

export function SectionHeader({ icon, title, subtitle, action, gradient }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-3">
      <div className={`w-8 h-8 rounded-2xl ${gradient || 'bg-gradient-to-br from-primary to-blue-600'} flex items-center justify-center shadow-lg flex-shrink-0`}
        style={gradient ? undefined : { boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
