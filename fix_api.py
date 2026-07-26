#!/usr/bin/env python3
"""Fix all API issues found during audit."""

import re

with open('api/index.ts', 'r') as f:
    content = f.read()

changes = []

# 1. Fix AdminBotManager config endpoint - add POST /api/admin-bot/config
# Find the bot-config section and add POST support
changes.append({
    'pattern': r"(if \(path === '/api/bot-config' && method === 'PUT')",
    'replacement': r"if (path === '/api/admin-bot/config' && method === 'POST') {\n      var { data: exRow } = await supabase.from('settings').select('*').single();\n      var newData = { ...(exRow?.data || {}),\n        admin_bot_token: req.body.botToken,\n        admin_chat_id: req.body.chatId,\n      };\n      if (exRow) { await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', exRow.id); }\n      else { await supabase.from('settings').insert({ data: newData }); }\n      return res.json({ success: true });\n    }\n    \1"
})

# 2. Add missing endpoint: POST /api/affiliates
changes.append({
    'pattern': r"(if \(path === '/api/affiliates/with-products' && method === 'GET')",
    'replacement': r"if (path === '/api/affiliates' && method === 'POST') {\n      var { data, error } = await supabase.from('affiliates').insert(req.body).select().single();\n      if (error) return res.status(400).json({ error: error.message });\n      return res.json({ success: true, affiliate: data });\n    }\n    if (path.startsWith('/api/affiliates/') && method === 'PUT') {\n      var aid = parseInt(path.split('/').pop() || '0');\n      var { error } = await supabase.from('affiliates').update(req.body).eq('id', aid);\n      if (error) return res.status(400).json({ error: error.message });\n      return res.json({ success: true });\n    }\n    \1"
})

# 3. Add DELETE /api/reviews/:id
changes.append({
    'pattern': r"(if \(method === 'POST'\) \{ var \{ data \} = await supabase.from\('reviews'\).insert\(req\.body\).select\(\).single\(\); return res.json\(\{ success: true, review: data \}\); \}\))",
    'replacement': r"\1\n      if (method === 'DELETE') { var rid = parseInt(path.split('/').pop() || '0'); await supabase.from('reviews').delete().eq('id', rid); return res.json({ success: true }); }"
})

# 4. Add POST /api/pre-orders/:id/cancel
changes.append({
    'pattern': r"(if \(path\.startsWith\('/api/pre-orders'\))",
    'replacement': r"if (path === '/api/pre-orders/cancel' && method === 'POST') {\n      var { id } = req.body || {};\n      if (!id) return res.status(400).json({ error: 'id required' });\n      var { error } = await supabase.from('pre_orders').update({ status: 'cancelled' }).eq('id', id);\n      if (error) return res.status(400).json({ error: error.message });\n      return res.json({ success: true });\n    }\n    \1"
})

# 5. Add flash-deals CRUD endpoints
changes.append({
    'pattern': r"(if \(path === '/api/flash-deals' && method === 'GET')",
    'replacement': r"if (path === '/api/flash-deals' && method === 'POST') {\n      var fs = req.body || {};\n      var { data: fRow } = await supabase.from('settings').select('*').single();\n      var curData = fRow?.data || {};\n      var flashSales = { ...(curData.flashSales || {}) };\n      var dealId = Date.now();\n      flashSales[dealId] = { productId: fs.productId, endTime: fs.endTime || Date.now() + 86400000, discount: fs.discount || 0, maxQuantity: fs.maxQuantity || 100 };\n      curData.flashSales = flashSales;\n      await supabase.from('settings').update({ data: curData }).eq('id', fRow.id);\n      return res.json({ success: true, deal: { id: dealId, ...flashSales[dealId] } });\n    }\n    if (path.startsWith('/api/flash-deals/') && method === 'PUT') {\n      var did = parseInt(path.split('/').pop() || '0');\n      var { data: fuRow } = await supabase.from('settings').select('*').single();\n      var fuData = fuRow?.data || {};\n      var fuSales = { ...(fuData.flashSales || {}) };\n      if (fuSales[did]) { fuSales[did] = { ...fuSales[did], ...req.body }; fuData.flashSales = fuSales; await supabase.from('settings').update({ data: fuData }).eq('id', fuRow.id); }\n      return res.json({ success: true });\n    }\n    if (path.startsWith('/api/flash-deals/') && method === 'DELETE') {\n      var ddid = parseInt(path.split('/').pop() || '0');\n      var { data: fdRow } = await supabase.from('settings').select('*').single();\n      var fdData = fdRow?.data || {};\n      var fdSales = { ...(fdData.flashSales || {}) };\n      delete fdSales[ddid];\n      fdData.flashSales = fdSales;\n      await supabase.from('settings').update({ data: fdData }).eq('id', fdRow.id);\n      return res.json({ success: true });\n    }\n    \1"
})

# 6. Add POST /api/receipts/:id (generate)
changes.append({
    'pattern': r"(if \(path\.startsWith\('/api/receipts/'\) && method === 'GET')",
    'replacement': r"if (path.startsWith('/api/receipts/') && method === 'POST') {\n      var on = path.replace('/api/receipts/', '');\n      var receiptUrl = 'https://smartshop-steel.vercel.app/receipt/' + on;\n      return res.json({ success: true, receiptUrl: receiptUrl });\n    }\n    \1"
})

# 7. Add POST /api/orders/:id/cancel
changes.append({
    'pattern': r"(if \(method === 'PATCH' && path.includes\('/status'\))",
    'replacement': r"if (method === 'POST' && path.includes('/cancel')) { var on = path.split('/')[3]; await supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', on); return res.json({ success: true }); }\n      \1"
})

# 8. Add GET /api/vendors/:id (single vendor)
changes.append({
    'pattern': r"(if \(method === 'GET' && \(path === '/api/vendors' \|\| path === '/api/'\)\) \{)",
    'replacement': r"if (method === 'GET' && path.startsWith('/api/vendors/') && path !== '/api/vendors/applications' && path !== '/api/vendors/check-status' && path !== '/api/vendors/approve') {\n        var vid = parseInt(path.split('/').pop() || '0');\n        var vendors = await getVendors();\n        var found = vendors.find(function(v) { return v.id == vid || v.id === String(vid); });\n        return res.json({ vendor: found || null });\n      }\n      \1"
})

for change in changes:
    pattern = change['pattern']
    replacement = change['replacement']
    new_content, count = re.subn(pattern, replacement, content, count=1)
    if count > 0:
        content = new_content
        print(f"✅ Applied: {pattern[:60]}...")
    else:
        print(f"❌ NOT FOUND: {pattern[:60]}...")

with open('api/index.ts', 'w') as f:
    f.write(content)

print("\nDone! File updated.")
