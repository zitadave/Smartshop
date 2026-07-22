/** Admin Bot Manager — Fully fixed refresh, demo, and notification queue */
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  getPendingNotifications, clearNotifications, markSent, queueNotification,
  generateNewOrderNotification, generateLowStockNotification, type AdminNotification,
} from '@/lib/adminBot';
import {
  Bot, Settings, Webhook, Send, Activity, Bell,
  CheckCircle, RefreshCw, Trash2,
  MessageSquare, AlertTriangle, ShoppingCart, Package,
} from 'lucide-react';
import { toast } from '@/components/Toast';
import { notifyDemo } from '@/lib/adminNotifier';

export default function AdminBotManager() {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('ss_admin_bot_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('ss_admin_chat_id') || '');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<string>('');
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [sending, setSending] = useState(false);

  const [alertConfig, setAlertConfig] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('ss_admin_bot_alerts') || '{}'); } catch { return {
      new_order: true, low_stock: true, sla_breach: true,
      vendor_pending: true, large_order: false, daily_summary: false,
    }; }
  });

  const refreshNotifs = useCallback(() => {
    const items = getPendingNotifications();
    setNotifications(items);
    toast(`🔄 ${items.length} notifications loaded`, 'info');
  }, []);

  useEffect(() => { refreshNotifs(); }, []);

  const saveAlertConfig = (key: string, val: boolean) => {
    const updated = { ...alertConfig, [key]: val };
    setAlertConfig(updated);
    localStorage.setItem('ss_admin_bot_alerts', JSON.stringify(updated));
  };

  const saveConfig = () => {
    localStorage.setItem('ss_admin_bot_token', botToken);
    localStorage.setItem('ss_admin_chat_id', chatId);
    toast('✅ Bot configuration saved!', 'success');
  };

  const setWebhookFn = async () => {
    if (!botToken) { toast('Set bot token first', 'error'); return; }
    setSettingWebhook(true);
    try {
      const res = await fetch('/api/admin-bot/set-webhook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookStatus('✅ Webhook set: ' + (data.webhookUrl || ''));
        toast('✅ Webhook configured!', 'success');
      } else {
        setWebhookStatus('❌ Failed: ' + (data.description || 'Unknown error'));
        toast('❌ Webhook failed', 'error');
      }
    } catch (e: any) { setWebhookStatus('❌ Error: ' + e.message); }
    setSettingWebhook(false);
  };

  const sendTestMessage = async () => {
    if (!botToken || !chatId) { toast('Set bot token and chat ID first', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/admin-bot/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: '🔔 <b>Smart Shop Admin Bot</b>\n\n✅ Test notification successful!\nYour bot is configured correctly.' }),
      });
      const data = await res.json();
      toast(data.sent ? '✅ Test message sent to Telegram!' : '❌ Failed to send', data.sent ? 'success' : 'error');
    } catch (e: any) { toast('❌ Error: ' + e.message, 'error'); }
    setSending(false);
  };

  /** FIXED: Queues notification locally AND sends via Telegram API */
  const demoNotification = (type: AdminNotification['type']) => {
    let n: AdminNotification;
    if (type === 'new_order') {
      n = generateNewOrderNotification({ orderNumber: 'ETH-DEMO-' + Date.now().toString(36).toUpperCase(), total: 4500, customerName: 'Abebe K.', itemCount: 3, paymentMethod: 'Telebirr' });
    } else {
      n = generateLowStockNotification({ nameEn: 'Premium Headphones', stockCount: 2, price: 1500 });
    }
    queueNotification(n);
    refreshNotifs();
    // Also send via Telegram API if configured
    notifyDemo(type).then(sent => {
      if (sent) toast(`📨 ${n.title} sent to Telegram!`, 'success');
      else toast(`📨 ${n.title} — queued locally (configure bot token to send to Telegram)`, 'info');
    });
  };

  const typeIcons: Record<string, any> = {
    new_order: ShoppingCart, low_stock: AlertTriangle, sla_breach: Activity,
    vendor_pending: Package, large_order: ShoppingCart, daily_summary: MessageSquare,
  };
  const severityColors: Record<string, string> = {
    info: 'text-blue-600 bg-blue-50', warning: 'text-amber-600 bg-amber-50', critical: 'text-red-600 bg-red-50',
  };

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Bot size={20} className="text-blue-500" /> Admin Bot Manager</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Dedicated Telegram bot for admin alerts & remote management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-medium flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={refreshNotifs}><RefreshCw size={11} /> Refresh</button>
          {notifications.length > 0 && (
            <button className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[10px] font-medium flex items-center gap-1"
              onClick={() => { clearNotifications(); setNotifications([]); toast('🧹 All cleared!', 'info'); }}>
              <Trash2 size={11} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bot Config */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Settings size={16} /> Bot Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Admin Bot Token</label>
              <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" placeholder="1234567890:ABCdef..." value={botToken} onChange={e => setBotToken(e.target.value)} />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Telegram Chat ID</label>
              <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" placeholder="-1001234567890" value={chatId} onChange={e => setChatId(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold" onClick={saveConfig}>💾 Save Config</button>
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50" onClick={sendTestMessage} disabled={sending}>
                {sending ? '...' : <><Send size={12} /> Test</>}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Webhook size={16} /> Webhook URL</h3>
          <p className="text-[10px] text-slate-500 mb-3">Set this webhook in BotFather to receive commands via the bot. The bot responds to: /stats, /orders, /lowstock, /alerts</p>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50" onClick={setWebhookFn} disabled={settingWebhook}>
            {settingWebhook ? <><RefreshCw size={12} className="animate-spin" /> Setting...</> : <><Webhook size={12} /> Set Webhook</>}
          </button>
          {webhookStatus && (
            <div className={cn('mt-2 p-2 rounded-lg text-[9px] break-all', webhookStatus.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
              {webhookStatus}
            </div>
          )}
          <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-3 text-[9px] text-blue-700 dark:text-blue-300">
            <strong>📱 How to set up:</strong><br />
            1. Go to <strong>@BotFather</strong> on Telegram<br />
            2. Send: <strong>/setcommands</strong><br />
            3. Select your admin bot, then send:<br />
            <code className="text-[8px]">start - Welcome menu<br />stats - Store statistics<br />orders - Recent orders<br />lowstock - Low stock alerts<br />alerts - Active SLA alerts</code>
          </div>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Bell size={16} /> Auto-Notification Rules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { key: 'new_order', label: 'New Orders', icon: ShoppingCart, desc: 'When a customer places an order' },
            { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle, desc: 'Product stock below threshold' },
            { key: 'sla_breach', label: 'SLA Breaches', icon: Activity, desc: 'Order exceeds time threshold' },
            { key: 'vendor_pending', label: 'Pending Vendors', icon: Package, desc: 'New vendor registration' },
            { key: 'large_order', label: 'Large Orders (>Br 10k)', icon: ShoppingCart, desc: 'High-value order placed' },
            { key: 'daily_summary', label: 'Daily Summary', icon: MessageSquare, desc: 'End-of-day store report' },
          ].map((item, i) => {
            const Icon = item.icon;
            const isOn = alertConfig[item.key] !== false;
            return (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isOn ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400')}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold">{item.label}</div>
                  <div className="text-[8px] text-slate-400">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isOn} onChange={() => saveAlertConfig(item.key, !isOn)} />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                </label>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-semibold flex items-center gap-1 hover:bg-indigo-100" onClick={() => demoNotification('new_order')}>
            <Send size={10} /> Demo: New Order
          </button>
          <button className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-semibold flex items-center gap-1 hover:bg-amber-100" onClick={() => demoNotification('low_stock')}>
            <Send size={10} /> Demo: Low Stock
          </button>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <MessageSquare size={14} /> Notification History ({notifications.filter(n => !n.sent).length} pending)
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
          {notifications.slice(0, 20).map(n => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <div key={n.id} className="flex items-center gap-2.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', severityColors[n.severity] || 'bg-slate-100')}>
                  <Icon size={12} className={n.severity === 'critical' ? 'text-red-600' : n.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold">{n.title}</div>
                  <div className="text-[8px] text-slate-400 truncate">{n.message}</div>
                </div>
                <div className="flex items-center gap-1">
                  {n.sent ? (
                    <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">Sent</span>
                  ) : (
                    <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Pending</span>
                  )}
                  <button className="p-1 hover:bg-muted rounded" onClick={() => { markSent(n.id); refreshNotifs(); }}><CheckCircle size={10} /></button>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              <Bell size={24} className="mx-auto mb-1 text-slate-300" />
              No notifications yet. Click "Demo: New Order" above to test!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
