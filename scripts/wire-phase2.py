#!/usr/bin/env python3
with open('src/pages/admin/AdminPanel.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
imports = """
import AdminThemeManager from '@/components/admin/AdminThemeManager';
import BulkProductManager from '@/components/admin/BulkProductManager';
import ProductAnalytics from '@/components/admin/ProductAnalytics';
import InventoryForecast from '@/components/admin/InventoryForecast';
import ActivityLog from '@/components/admin/ActivityLog';
import { Upload, BarChart3 as ChartIcon, ClipboardList as Clipboard } from 'lucide-react';
"""
content = content.replace(
    "import DatabaseBackup from '@/components/admin/DatabaseBackup';",
    "import DatabaseBackup from '@/components/admin/DatabaseBackup';" + imports
)

# 2. Update Tab type
old_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup';"
new_tab = "type Tab = 'overview' | 'products' | 'orders' | 'vendors' | 'marketplace' | 'reviews' | 'broadcast' | 'flashdeals' | 'preorders' | 'tracking' | 'themes' | 'coupons' | 'settings' | 'alerts' | 'abandoned' | 'roles' | 'backup' | 'adminTheme' | 'bulkProducts' | 'analytics' | 'forecast' | 'activity';"
content = content.replace(old_tab, new_tab)

# 3. Remove duplicate imports of BarChart3 and ClipboardList from the import block
# The actual imports are already there from the original, we just need to add Upload
content = content.replace(
    "FileText, Zap,",
    "FileText, Zap, Upload,"
)

# 4. Add nav items
nav = """
    { id: 'adminTheme', icon: Palette, label: 'Admin Theme' },
    { id: 'bulkProducts', icon: Upload, label: 'Bulk Import' },
    { id: 'analytics', icon: BarChart3, label: 'Product Analytics' },
    { id: 'forecast', icon: Clock, label: 'Forecast' },
    { id: 'activity', icon: ClipboardList, label: 'Activity Log' },
"""
content = content.replace(
    "    { id: 'backup', icon: Database, label: 'Backup' },",
    "    { id: 'backup', icon: Database, label: 'Backup' }," + nav
)

# 5. Add tab renders
renders = """
          {tab === 'adminTheme' && <AdminThemeManager />}
          {tab === 'bulkProducts' && <BulkProductManager />}
          {tab === 'analytics' && <ProductAnalytics />}
          {tab === 'forecast' && <InventoryForecast />}
          {tab === 'activity' && <ActivityLog />}
"""
content = content.replace(
    "          {tab === 'settings' && <AdminSettings />}",
    renders + "          {tab === 'settings' && <AdminSettings />}"
)

with open('src/pages/admin/AdminPanel.tsx', 'w') as f:
    f.write(content)
print('Done!')
