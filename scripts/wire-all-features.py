with open('src/pages/admin/AdminPanel.tsx', 'r') as f:
    content = f.read()

# 1. Add imports (before OrderFulfillment)
imports = """
import SLAMonitor from '@/components/admin/SLAMonitor';
import DriverTracker from '@/components/admin/DriverTracker';
import ReturnsManager from '@/components/admin/ReturnsManager';
import { Activity, Truck as TruckIcon, RotateCcw } from 'lucide-react';
"""
content = content.replace("import OrderFulfillment from '@/components/admin/OrderFulfillment';", "import OrderFulfillment from '@/components/admin/OrderFulfillment';" + imports)

# 2. Update Tab type
old_tab = "'fulfillment'"
new_tab = "'fulfillment' | 'sla' | 'driver' | 'returns'"
content = content.replace(old_tab, new_tab)

# 3. Add nav items before fulfillment
nav = """
    { id: 'sla', icon: Activity, label: 'SLA Monitor' },
    { id: 'driver', icon: TruckIcon, label: 'Driver Tracking' },
    { id: 'returns', icon: RotateCcw, label: 'Returns' },
"""
content = content.replace("    { id: 'fulfillment', icon: ShoppingCart, label: 'Fulfillment' },", nav + "    { id: 'fulfillment', icon: ShoppingCart, label: 'Fulfillment' },")

# 4. Add renders before fulfillment
renders = """
          {tab === 'sla' && <SLAMonitor />}
          {tab === 'driver' && <DriverTracker />}
          {tab === 'returns' && <ReturnsManager />}
"""
content = content.replace("          {tab === 'fulfillment' && <OrderFulfillment />}", renders + "          {tab === 'fulfillment' && <OrderFulfillment />}")

with open('src/pages/admin/AdminPanel.tsx', 'w') as f:
    f.write(content)
print('All 4 features wired!')
