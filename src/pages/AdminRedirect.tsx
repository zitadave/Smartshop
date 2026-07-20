import { useEffect } from 'react';

export default function AdminRedirect() {
  useEffect(() => {
    // Try new admin panel first, fall back to legacy
    window.location.href = '/admin-panel';
  }, []);
  return <div className="text-center py-20 text-muted-foreground text-sm">Loading admin panel...</div>;
}
