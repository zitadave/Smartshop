with open('src/pages/admin/AdminPanel.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
imports = "\nimport OrderFulfillment from '@/components/admin/OrderFulfillment';"
content = content.replace("import ActivityLog from '@/components/admin/ActivityLog';", "import ActivityLog from '@/components/admin/ActivityLog';" + imports)

# 2. Update Tab type
old_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' | 'adminTheme' | 'bulkProducts' | 'analytics' | 'forecast' | 'activity' | 'security' | 'telegram';"
new_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' | 'adminTheme' | 'bulkProducts' | 'analytics' | 'forecast' | 'activity' | 'security' | 'telegram' | 'fulfillment';"
content = content.replace(old_tab, new_tab)

# 3. Add nav item
nav = "\n    { id: 'fulfillment', icon: ShoppingCart, label: 'Fulfillment' },"
content = content.replace("    { id: 'telegram', icon: Bell, label: 'Telegram Bot' },", nav)

# 4. Add render
renders = "\n          {tab === 'fulfillment' && <OrderFulfillment />}"
content = content.replace("          {tab === 'telegram' && <TelegramNotifications />}", renders)

with open('src/pages/admin/AdminPanel.tsx', 'w') as f:
    f.write(content)
print('Fulfillment wired!')
