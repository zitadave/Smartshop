with open('src/pages/admin/AdminPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "    { id: 'fulfillment', icon: ShoppingCart, label: 'Fulfillment' },",
    "    { id: 'telegram', icon: Bell, label: 'Telegram Bot' },\n    { id: 'fulfillment', icon: ShoppingCart, label: 'Fulfillment' },"
)

content = content.replace(
    "          {tab === 'fulfillment' && <OrderFulfillment />}",
    "          {tab === 'telegram' && <TelegramNotifications />}\n          {tab === 'fulfillment' && <OrderFulfillment />}"
)

with open('src/pages/admin/AdminPanel.tsx', 'w') as f:
    f.write(content)
print('Fixed!')
