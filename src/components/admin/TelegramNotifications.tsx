import { useState } from 'react';
import { Bell, Smartphone, Send, CheckCircle, Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { toast } from '@/components/Toast';

interface TelegramAlert {
  id: string;
  event: string;
  channel: string;
  enabled: boolean;
  description: string;
}

export default function TelegramNotifications() {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('ss_tg_bot_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('ss_tg_chat_id') || '');
  const [testMsg, setTestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'alerts'>('config');

  const [alerts, setAlerts] = useState<TelegramAlert[]>(() => {
    try { return JSON.parse(localStorage.getItem('ss_tg_alerts') || '[]'); } catch { return []; }
  });

  const saveConfig = () => {
    localStorage.setItem('ss_tg_bot_token', botToken);
    localStorage.setItem('ss_tg_chat_id', chatId);
    toast('✅ Telegram config saved!', 'success');
  };

  const sendTest = async () => {
    if (!botToken || !chatId) { toast('Set bot token and chat ID first', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: testMsg || '🔔 Smart Shop: Test notification successful!' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('✅ Test message sent! Check your Telegram.', 'success');
      } else {
        toast(`❌ Telegram error: ${data.description}`, 'error');
      }
    } catch (e: any) {
      toast(`❌ Failed: ${e.message}`, 'error');
    }
    setSending(false);
  };

  const toggleAlert = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlerts(updated);
    localStorage.setItem('ss_tg_alerts', JSON.stringify(updated));
  };

  const addAlert = () => {
    const event = (document.getElementById('new-alert-event') as HTMLSelectElement)?.value;
    if (!event) return;
    const alert: TelegramAlert = {
      id: generateId(),
      event,
      channel: 'Telegram',
      enabled: true,
      description: EVENT_DESCRIPTIONS[event] || event,
    };
    const updated = [...alerts, alert];
    setAlerts(updated);
    localStorage.setItem('ss_tg_alerts', JSON.stringify(updated));
    toast('✅ Alert added!', 'success');
  };

  const removeAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('ss_tg_alerts', JSON.stringify(updated));
  };

  const EVENTS = [
    { value: 'new_order', label: '🛒 New Order' },
    { value: 'low_stock', label: '⚠️ Low Stock Warning' },
    { value: 'vendor_registered', label: '🏪 Vendor Registered' },
    { value: 'new_review', label: '⭐ New Review' },
    { value: 'large_order', label: '💰 Large Order (>Br 5000)' },
    { value: 'price_drop', label: '📉 Price Alert Triggered' },
    { value: 'daily_report', label: '📊 Daily Summary Report' },
  ];

  const EVENT_DESCRIPTIONS: Record<string, string> = {
    new_order: 'Get notified when a customer places an order',
    low_stock: 'Alert when any product stock falls below 5 units',
    vendor_registered: 'When a new vendor signs up for approval',
    new_review: 'When a customer submits a product review',
    large_order: 'Notify on orders exceeding Br 5,000',
    price_drop: 'When a price alert triggers for a customer',
    daily_report: 'Receive daily sales and performance summary',
  };

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Bell size={20} className="text-blue-500" /> Telegram Notifications</h2>
      <p className="text-[10px] text-slate-500">Receive real-time alerts directly on your Telegram. Set up a bot and choose what to monitor.</p>

      {/* Tab Toggle */}
      <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 w-fit">
        {(['config', 'alerts'] as const).map(t => (
          <button key={t} className={cn('px-4 py-1.5 rounded-lg text-[10px] font-semibold capitalize', activeTab === t ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setActiveTab(t)}>
            {t === 'config' ? '⚙️ Configuration' : `🔔 Alerts (${alerts.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <>
          {/* Bot Setup */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold">Bot Configuration</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Bot Token</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" value={botToken} onChange={e => setBotToken(e.target.value)} />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Chat ID</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" placeholder="-1001234567890" value={chatId} onChange={e => setChatId(e.target.value)} />
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-3 text-[9px] text-blue-700 dark:text-blue-300">
                <strong>🤖 How to create a Telegram Bot:</strong><br />
                1. Open Telegram and search for <strong>@BotFather</strong><br />
                2. Send <strong>/newbot</strong> and follow the prompts<br />
                3. Copy the token and paste it above<br />
                4. Get your Chat ID by messaging <strong>@userinfobot</strong><br />
                5. Send a message to your bot first, then save here
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all" onClick={saveConfig}>
                  <CheckCircle size={12} className="inline mr-1" /> Save Config
                </button>
              </div>
            </div>
          </div>

          {/* Test */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold mb-3">Send Test Message</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" placeholder="Test message..." value={testMsg} onChange={e => setTestMsg(e.target.value)} />
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50" onClick={sendTest} disabled={sending}>
                {sending ? '...' : <><Send size={12} /> Test</>}
              </button>
            </div>
            <p className="text-[8px] text-slate-400 mt-1">Send a test message to verify your bot configuration</p>
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          {/* Add Alert */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold mb-3">Add Notification Rule</h3>
            <div className="flex gap-2">
              <select id="new-alert-event" className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent">
                <option value="">Select event...</option>
                {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1" onClick={addAlert}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold">Alert Rules ({alerts.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', a.enabled ? 'bg-blue-100 dark:bg-blue-950/30' : 'bg-slate-100 dark:bg-slate-800')}>
                    <Bell size={14} className={a.enabled ? 'text-blue-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold">{EVENTS.find(e => e.value === a.event)?.label || a.event}</div>
                    <div className="text-[8px] text-slate-400">{a.description}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={a.enabled} onChange={() => toggleAlert(a.id)} />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                  <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeAlert(a.id)}><Trash2 size={11} /></button>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No alert rules configured</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
