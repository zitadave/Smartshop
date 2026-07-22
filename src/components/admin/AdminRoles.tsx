import { useState } from 'react';
import { cn, generateId } from '@/lib/utils';
import { Shield, User, Users, Key, Lock, CheckCircle, XCircle, Plus, Trash2, Save, ChevronRight, Eye, Edit3, Settings as SettingsIcon } from 'lucide-react';
import { toast } from '@/components/Toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface AdminUser {
  id: string;
  name: string;
  telegramId: string;
  telegramUsername?: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

const ALL_PERMISSIONS = [
  'view_dashboard', 'manage_products', 'manage_orders', 'manage_vendors', 'manage_marketplace',
  'manage_reviews', 'manage_broadcast', 'manage_flashdeals', 'manage_preorders', 'manage_tracking',
  'manage_themes', 'manage_coupons', 'manage_settings', 'manage_roles', 'view_analytics', 'export_data',
];

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'View Dashboard', manage_products: 'Manage Products', manage_orders: 'Manage Orders',
  manage_vendors: 'Manage Vendors', manage_marketplace: 'Manage Marketplace', manage_reviews: 'Manage Reviews',
  manage_broadcast: 'Send Broadcast', manage_flashdeals: 'Manage Flash Deals', manage_preorders: 'Manage Pre-Orders',
  manage_tracking: 'Manage Tracking', manage_themes: 'Manage Themes', manage_coupons: 'Manage Coupons',
  manage_settings: 'Manage Settings', manage_roles: 'Manage Roles & Admins', view_analytics: 'View Analytics',
  export_data: 'Export Data',
};

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_admin_roles') || '[]'); } catch { return []; }
  });
  const [users, setUsers] = useState<AdminUser[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_admin_users') || '[]'); } catch { return []; }
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);

  const saveRoles = (r: Role[]) => { localStorage.setItem('ss_admin_roles', JSON.stringify(r)); setRoles(r); };
  const saveUsers = (u: AdminUser[]) => { localStorage.setItem('ss_admin_users', JSON.stringify(u)); setUsers(u); };

  // Seed default roles
  if (roles.length === 0) {
    const defaults: Role[] = [
      { id: 'role-1', name: 'Super Admin', description: 'Full access to everything', permissions: ALL_PERMISSIONS, userCount: 1 },
      { id: 'role-2', name: 'Manager', description: 'Can manage products, orders, vendors', permissions: ['view_dashboard', 'manage_products', 'manage_orders', 'manage_vendors', 'view_analytics', 'export_data'], userCount: 0 },
      { id: 'role-3', name: 'Support', description: 'View orders and manage reviews', permissions: ['view_dashboard', 'manage_orders', 'manage_reviews', 'view_analytics'], userCount: 0 },
      { id: 'role-4', name: 'Viewer', description: 'Read-only access', permissions: ['view_dashboard', 'view_analytics'], userCount: 0 },
    ];
    saveRoles(defaults);
  }

  const togglePermission = (perm: string) => {
    if (!editingRole) return;
    const perms = editingRole.permissions.includes(perm)
      ? editingRole.permissions.filter(p => p !== perm)
      : [...editingRole.permissions, perm];
    setEditingRole({ ...editingRole, permissions: perms });
  };

  const saveRole = () => {
    if (!editingRole) return;
    const updated = roles.map(r => r.id === editingRole.id ? editingRole : r);
    saveRoles(updated);
    setEditingRole(null);
    toast('✅ Role saved!', 'success');
  };

  const addUser = () => {
    const name = (document.getElementById('new-user-name') as HTMLInputElement)?.value;
    const telegramId = (document.getElementById('new-user-telegram') as HTMLInputElement)?.value;
    const telegramUsername = (document.getElementById('new-user-username') as HTMLInputElement)?.value;
    const role = (document.getElementById('new-user-role') as HTMLSelectElement)?.value;
    if (!name || !telegramId) { toast('Name and Telegram ID required', 'error'); return; }
    const user: AdminUser = { id: generateId(), name, telegramId, telegramUsername, role, status: 'active', createdAt: new Date().toISOString() };
    saveUsers([...users, user]);
    (document.getElementById('new-user-name') as HTMLInputElement)!.value = '';
    (document.getElementById('new-user-telegram') as HTMLInputElement)!.value = '';
    (document.getElementById('new-user-username') as HTMLInputElement)!.value = '';
    setShowNewUser(false);
    // Increment role count
    const updatedRoles = roles.map(r => r.id === role ? { ...r, userCount: r.userCount + 1 } : r);
    saveRoles(updatedRoles);
    toast('✅ Admin user added!', 'success');
  };

  const toggleUserStatus = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const } : u);
    saveUsers(updated);
    toast('User status updated', 'info');
  };

  const removeUser = (userId: string, roleId: string) => {
    saveUsers(users.filter(u => u.id !== userId));
    const updatedRoles = roles.map(r => r.id === roleId ? { ...r, userCount: Math.max(0, r.userCount - 1) } : r);
    saveRoles(updatedRoles);
    toast('User removed', 'info');
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Shield size={20} className="text-indigo-500" /> Admin Roles & Security</h2>

      {/* Two-column Layout */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Roles Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold">Roles ({roles.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map(role => (
                <div key={role.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">R</div>
                      <div>
                        <div className="text-xs font-bold">{role.name}</div>
                        <div className="text-[9px] text-slate-400">{role.description} · {role.userCount} users</div>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg text-[9px] font-semibold hover:bg-indigo-100 transition-colors" onClick={() => setEditingRole(role)}>
                      <Edit3 size={11} className="inline mr-1" /> Edit
                    </button>
                  </div>
                  {/* Permission pills */}
                  <div className="flex gap-1 flex-wrap mt-1.5 ml-10">
                    {role.permissions.slice(0, 4).map(p => (
                      <span key={p} className="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{PERMISSION_LABELS[p] || p}</span>
                    ))}
                    {role.permissions.length > 4 && <span className="text-[7px] text-slate-400">+{role.permissions.length - 4} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold">Admin Users ({users.length})</h3>
              <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-bold flex items-center gap-1" onClick={() => setShowNewUser(!showNewUser)}>
                <Plus size={11} /> Add Admin
              </button>
            </div>

            {showNewUser && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-slideDown">
                <div className="grid sm:grid-cols-4 gap-2 mb-2">
                  <input id="new-user-name" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent" placeholder="Full name" />
                  <input id="new-user-telegram" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent font-mono" placeholder="Telegram ID (number)" type="number" />
                  <input id="new-user-username" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent font-mono" placeholder="@username (optional)" />
                  <select id="new-user-role" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <button className="px-4 py-1.5 bg-primary text-white rounded-lg text-[9px] font-bold" onClick={addUser}>Add User</button>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{u.name}</div>
                    <div className="text-[9px] text-slate-400">🆔 {u.telegramId}{u.telegramUsername ? ` · @${u.telegramUsername}` : ''} · {roles.find(r => r.id === u.role)?.name || u.role}</div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-lg text-[8px] font-semibold', u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>{u.status}</span>
                  <button className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" onClick={() => toggleUserStatus(u.id)}>
                    {u.status === 'active' ? <Lock size={12} /> : <CheckCircle size={12} />}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeUser(u.id, u.role)}><Trash2 size={12} /></button>
                </div>
              ))}
              {users.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No admin users yet</p>}
            </div>
          </div>
        </div>

        {/* Permission Editor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Lock size={14} /> {editingRole ? `Editing: ${editingRole.name}` : 'Select a role to edit'}</h3>
          {editingRole ? (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Role Name</label>
                <input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={editingRole.name} onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={editingRole.description} onChange={e => setEditingRole({ ...editingRole, description: e.target.value })} />
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Permissions ({editingRole.permissions.length}/{ALL_PERMISSIONS.length})</label>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm} className={cn('flex items-center gap-2 p-1.5 rounded-lg text-[10px] cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50', editingRole.permissions.includes(perm) ? 'bg-indigo-50 dark:bg-indigo-950/20' : '')}>
                      <input type="checkbox" checked={editingRole.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded" />
                      <span>{PERMISSION_LABELS[perm]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-primary text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1" onClick={saveRole}><Save size={12} /> Save</button>
                <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px]" onClick={() => setEditingRole(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              <Shield size={32} className="mx-auto mb-2 text-slate-300" />
              Click "Edit" on any role to configure permissions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
