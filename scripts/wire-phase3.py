with open('src/pages/admin/AdminPanel.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
imports = "\nimport AdminSecurity from '@/components/admin/AdminSecurity';\nimport TelegramNotifications from '@/components/admin/TelegramNotifications';"
content = content.replace("import ActivityLog from '@/components/admin/ActivityLog';", "import ActivityLog from '@/components/admin/ActivityLog';" + imports)

# 2. Update Tab type
old_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' | 'adminTheme' | 'bulkProducts' | 'analytics' | 'forecast' | 'activity';"
new_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' | 'adminTheme' | 'bulkProducts' | 'analytics' | 'forecast' | 'activity' | 'security' | 'telegram';"
content = content.replace(old_tab, new_tab)

# 3. Add nav items
nav = """
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'telegram', icon: Bell, label: 'Telegram Bot' },
"""
content = content.replace(
    "    { id: 'activity', icon: ClipboardList, label: 'Activity Log' },",
    "    { id: 'activity', icon: ClipboardList, label: 'Activity Log' }," + nav
)

# 4. Add route renders
renders = """
          {tab === 'security' && <AdminSecurity />}
          {tab === 'telegram' && <TelegramNotifications />}
"""
content = content.replace(
    "          {tab === 'activity' && <ActivityLog />}",
    "          {tab === 'activity' && <ActivityLog />}" + renders
)

with open('src/pages/admin/AdminPanel.tsx', 'w') as f:
    f.write(content)
print('Phase 3 wired!')
