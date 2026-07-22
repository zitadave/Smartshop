/**
 * Smart Books — Complete Accounting & Internal Control Dashboard
 * Chart of Accounts, Journal, Ledger, Financial Statements, Audit, Controls
 */
import { useState, useEffect, useMemo } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { toast } from '@/components/Toast';
import { sendAdminTelegram } from '@/lib/adminNotifier';
import {
  CHART_OF_ACCOUNTS, getAccount, getAccountsByType,
  createJournalEntry, getJournalEntries, generateTrialBalance,
  generateIncomeStatement, generateBalanceSheet, generateCashFlowStatement,
  calculateRatios, getAccountBalance,
  getAuditLog, logAuditEvent, addControlAlert, getControlAlerts, resolveAlert,
  generateProFormaInvoice, generateEntryNumber,
  type JournalEntry, type TrialBalanceLine, type FinancialStatement, type ControlAlert,
} from '@/lib/accounting';

import {
  BookOpen, FileText, Scale, TrendingUp, DollarSign, Search, Plus, Download, Check, X, Eye, RefreshCw,
  AlertTriangle, Shield, Activity, BarChart3, Calculator, Clock, ChevronRight, Filter, ArrowUp, ArrowDown, Printer, FileSpreadsheet, Landmark,
} from 'lucide-react';

type SmartTab = 'dashboard' | 'accounts' | 'journal' | 'trial' | 'pnl' | 'balance' | 'cashflow' | 'ratios' | 'audit' | 'controls' | 'proforma';

export default function SmartBooks() {
  const [tab, setTab] = useState<SmartTab>('dashboard');

  const tabs: { id: SmartTab; icon: any; label: string; desc: string }[] = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', desc: 'Overview & KPIs' },
    { id: 'accounts', icon: BookOpen, label: 'Chart of Accounts', desc: 'Full account list' },
    { id: 'journal', icon: FileText, label: 'Journal', desc: 'Transaction entries' },
    { id: 'trial', icon: Scale, label: 'Trial Balance', desc: 'Debit/credit summary' },
    { id: 'pnl', icon: TrendingUp, label: 'P&L', desc: 'Income statement' },
    { id: 'balance', icon: Landmark, label: 'Balance Sheet', desc: 'Assets & liabilities' },
    { id: 'cashflow', icon: DollarSign, label: 'Cash Flow', desc: 'Cash movement' },
    { id: 'ratios', icon: Calculator, label: 'Ratios', desc: 'Financial analysis' },
    { id: 'audit', icon: Shield, label: 'Audit Trail', desc: 'Activity log' },
    { id: 'controls', icon: Activity, label: 'Controls', desc: 'Alerts & checks' },
    { id: 'proforma', icon: FileSpreadsheet, label: 'Pro-Forma', desc: 'Invoice generator' },
  ];

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen size={20} className="text-indigo-500" /> Smart Books</h2>
          <p className="text-[10px] text-slate-500">Complete accounting, internal controls & audit system</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-all', tab === t.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200')} onClick={() => setTab(t.id)} title={t.desc}>
                <Icon size={11} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'dashboard' && <SmartDashboard />}
      {tab === 'accounts' && <ChartOfAccountsView />}
      {tab === 'journal' && <JournalView />}
      {tab === 'trial' && <TrialBalanceView />}
      {tab === 'pnl' && <PNLView />}
      {tab === 'balance' && <BalanceSheetView />}
      {tab === 'cashflow' && <CashFlowView />}
      {tab === 'ratios' && <RatiosView />}
      {tab === 'audit' && <AuditView />}
      {tab === 'controls' && <ControlsView />}
      {tab === 'proforma' && <ProFormaView />}
    </div>
  );
}

function SmartDashboard() {
  const ratios = useMemo(() => calculateRatios(), []);
  const entries = useMemo(() => getJournalEntries(), []);
  const alerts = useMemo(() => getControlAlerts(true), []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', val: formatPrice(ratios.totalRevenue), icon: TrendingUp, color: 'from-emerald-500 to-green-600', sub: `Profit: ${formatPrice(ratios.netProfit)}` },
          { label: 'Total Expenses', val: formatPrice(ratios.totalExpenses), icon: DollarSign, color: 'from-red-500 to-rose-600', sub: `${ratios.expenseRatio}% of revenue` },
          { label: 'Profit Margin', val: `${ratios.profitMargin}%`, icon: BarChart3, color: 'from-blue-500 to-indigo-600', sub: `${formatPrice(ratios.netProfit)} net` },
          { label: 'Current Ratio', val: ratios.currentRatio, icon: Scale, color: 'from-purple-500 to-violet-600', sub: `${entries.length} entries`, subColor: 'text-slate-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
              <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-lg inline-flex mb-2', s.color)}><Icon size={16} className="text-white" /></div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
              <div className="text-[8px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3">Quick Actions</h3>
          <div className="space-y-1.5">
            {[
              { icon: FileText, label: 'Add Journal Entry', onClick: () => { const desc = prompt('Description:'); if (!desc) return; const amt = Number(prompt('Amount (Br):') || '0'); if (!amt) return; const ac = prompt('Account Code (e.g. 5010):'); if (!ac) return; createExpenseJournalEntry({ description: desc, amount: amt, accountCode: ac, date: new Date().toISOString().split('T')[0], referenceNumber: generateEntryNumber('expense') }); toast('Journal entry created!', 'success'); }, color: 'text-indigo-600' },
              { icon: TrendingUp, label: 'Record a Sale', onClick: () => { const on = prompt('Order Number:'); if (!on) return; const p = Number(prompt('Product Price (Br):') || '0'); if (!p) return; createSaleJournalEntry({ orderNumber: on, productPrice: p, commissionRate: 0.15, deliveryFee: 0, gatewayFee: Math.round(p * 0.025), date: new Date().toISOString().split('T')[0] }); toast('Sale recorded in general ledger!', 'success'); sendAdminTelegram(`📊 <b>Smart Books: Sale Posted</b>\n\nOrder: ${on}\nAmount: ${formatPrice(p)}`); }, color: 'text-emerald-600' },
              { icon: Printer, label: 'Generate P&L Report', onClick: () => { window.open('/admin-panel', '_self'); setTab('pnl'); }, color: 'text-blue-600' },
              { icon: FileSpreadsheet, label: 'Create Pro-Forma Invoice', onClick: () => { setTab('proforma'); }, color: 'text-purple-600' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" onClick={item.onClick}>
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30"><Icon size={13} className={item.color} /></div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Shield size={14} className="text-amber-500" /> Internal Controls</h3>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No active control alerts</p>}
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} className={cn('flex items-start gap-2 p-2 rounded-lg', a.severity === 'critical' ? 'bg-red-50' : a.severity === 'high' ? 'bg-orange-50' : 'bg-amber-50')}>
                <AlertTriangle size={12} className={cn('mt-0.5 flex-shrink-0', a.severity === 'critical' ? 'text-red-600' : 'text-amber-600')} />
                <div className="flex-1 min-w-0"><div className="text-[10px] font-semibold">{a.title}</div><div className="text-[8px] text-slate-500 truncate">{a.description}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 text-center"><div className="text-base font-bold text-indigo-600">{entries.length}</div><div className="text-[8px] text-slate-500">Journal Entries</div></div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 text-center"><div className="text-base font-bold text-emerald-600">{ratios.profitMargin}%</div><div className="text-[8px] text-slate-500">Profit Margin</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartOfAccountsView() {
  const [search, setSearch] = useState('');
  const filtered = CHART_OF_ACCOUNTS.filter(a => !search || a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()) || a.nameAm.includes(search));
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
  const typeColors: Record<string, string> = { asset: 'text-emerald-600 bg-emerald-50', liability: 'text-red-600 bg-red-50', equity: 'text-blue-600 bg-blue-50', revenue: 'text-green-600 bg-green-50', expense: 'text-orange-600 bg-orange-50' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Search size={13} className="text-slate-400" /><input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">Code</th><th className="text-left px-4 py-3 font-semibold">Name</th><th className="text-left px-4 py-3 font-semibold">Amharic</th>
            <th className="text-center px-4 py-3 font-semibold">Type</th><th className="text-center px-4 py-3 font-semibold">Normal</th><th className="text-right px-4 py-3 font-semibold">Balance</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => {
              const balance = getAccountBalance(a.code);
              return (
                <tr key={a.code} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">{a.code}</td>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-slate-500">{a.nameAm}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('px-2 py-0.5 rounded text-[9px] font-semibold', typeColors[a.type])}>{a.type}</span></td>
                  <td className="px-4 py-3 text-center text-[9px] font-semibold">{a.normalBalance === 'debit' ? 'DR' : 'CR'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{balance !== 0 ? formatPrice(Math.abs(balance)) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-6 text-xs text-slate-400">No accounts found</p>}
      </div>
    </div>
  );
}

function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const refresh = () => setEntries(getJournalEntries());
  useEffect(refresh, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold">General Journal ({entries.length})</h3><button className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1" onClick={refresh}><RefreshCw size={11} /> Refresh</button></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        {entries.map(e => (
          <div key={e.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50">
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold font-mono text-indigo-600">{e.referenceNumber}</span><span className={cn('text-[8px] px-1.5 py-0.5 rounded', e.posted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{e.posted ? 'Posted' : 'Draft'}</span></div>
            <div className="text-[10px] text-slate-500">{e.description}</div>
            <div className="text-[8px] text-slate-400 mt-0.5">{e.date} | {e.lines.length} lines | {e.lines.reduce((s, l) => s + l.debit, 0) > 0 ? `Dr: ${formatPrice(e.lines.reduce((s, l) => s + l.debit, 0))}` : ''} {e.lines.reduce((s, l) => s + l.credit, 0) > 0 ? `Cr: ${formatPrice(e.lines.reduce((s, l) => s + l.credit, 0))}` : ''}</div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No journal entries yet. Record a sale or expense to see entries here.</p>}
      </div>
    </div>
  );
}

function TrialBalanceView() {
  const tb = useMemo(() => generateTrialBalance(), []);
  const total = tb[tb.length - 1];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Trial Balance</h3>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider"><th className="text-left px-4 py-3 font-semibold">Account</th><th className="text-right px-4 py-3 font-semibold">Debit (Br)</th><th className="text-right px-4 py-3 font-semibold">Credit (Br)</th></tr></thead>
          <tbody>
            {tb.map((l, i) => (
              <tr key={i} className={cn('border-t border-slate-100 dark:border-slate-800', l.accountCode === '' ? 'bg-indigo-50 dark:bg-indigo-950/20 font-bold' : 'hover:bg-slate-50')}>
                <td className="px-4 py-2.5">{l.accountName}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{l.debit > 0 ? formatPrice(l.debit) : ''}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{l.credit > 0 ? formatPrice(l.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total && <div className="text-xs text-slate-500 text-center">Total Debits: {formatPrice(total.debit)} = Total Credits: {formatPrice(total.credit)} {total.debit === total.credit ? '✅' : '❌'}</div>}
    </div>
  );
}

function PNLView() {
  const pnl = useMemo(() => generateIncomeStatement(new Date().toLocaleDateString()), []);
  return <StatementView title="Profit & Loss Statement" statement={pnl} />;
}

function BalanceSheetView() {
  const bs = useMemo(() => generateBalanceSheet(new Date().toISOString().split('T')[0]), []);
  return <StatementView title="Balance Sheet" statement={bs} />;
}

function CashFlowView() {
  const cf = useMemo(() => generateCashFlowStatement('Current Period'), []);
  return <StatementView title="Cash Flow Statement" statement={cf} />;
}

function StatementView({ title, statement }: { title: string; statement: FinancialStatement }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold">{title}</h3><span className="text-[9px] text-slate-400">Generated: {new Date(statement.generatedAt).toLocaleString()}</span></div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        {statement.items.filter(i => i.label || i.amount !== 0).map((item, idx) => (
          <div key={idx} className={cn('flex items-center px-4 py-2 text-xs', item.isTotal ? 'bg-slate-50 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-slate-700' : 'border-b border-slate-100 dark:border-slate-800 last:border-0')} style={{ paddingLeft: `${16 + item.indent * 16}px` }}>
            <span className="flex-1">{item.label}</span>
            <span className={cn('font-semibold', item.amount >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-600')}>{item.label.includes('TOTAL') || item.isTotal ? formatPrice(Math.abs(item.amount)) : formatPrice(item.amount)}</span>
          </div>
        ))}
      </div>
      <button className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1" onClick={() => { const html = generateStatementHTML(title, statement); const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.html`; a.click(); toast('Report downloaded!', 'success'); }}>
        <Download size={11} /> Download Report
      </button>
    </div>
  );
}

function generateStatementHTML(title: string, stmt: FinancialStatement): string {
  const rows = stmt.items.filter(i => i.label || i.amount !== 0).map(i => `<tr><td style="padding:6px 16px;border-bottom:1px solid #e5e7eb;font-size:11px;padding-left:${16 + i.indent * 16}px${i.isTotal ? ';font-weight:700;background:#f8fafc' : ''}">${i.label}</td><td style="padding:6px 16px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right${i.isTotal ? ';font-weight:700;background:#f8fafc' : ''}">Br ${Math.abs(i.amount).toLocaleString()}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;background:#f3f4f6;padding:20px}.report{max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}h1{font-size:18px;color:#1e3a5f;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}</style></head><body><div class="report"><h1>${title}</h1><p style="text-align:center;font-size:10px;color:#9ca3af">Smart Shop Ethiopia | ${new Date(stmt.generatedAt).toLocaleDateString()}</p><table>${rows}</table></div></body></html>`;
}

function RatiosView() {
  const ratios = useMemo(() => calculateRatios(), []);
  const items = [
    { label: 'Current Ratio', val: ratios.currentRatio, desc: 'Current Assets / Current Liabilities', target: '> 1.5', color: Number(ratios.currentRatio) >= 1.5 ? 'text-green-600' : 'text-amber-600' },
    { label: 'Profit Margin', val: `${ratios.profitMargin}%`, desc: 'Net Profit / Revenue', target: '> 15%', color: Number(ratios.profitMargin) >= 15 ? 'text-green-600' : 'text-amber-600' },
    { label: 'Expense Ratio', val: `${ratios.expenseRatio}%`, desc: 'Gateway Fees / Revenue', target: '< 5%', color: Number(ratios.expenseRatio) <= 5 ? 'text-green-600' : 'text-amber-600' },
    { label: 'Return on Assets', val: `${ratios.returnOnAssets}%`, desc: 'Net Profit / Total Assets', target: '> 10%', color: Number(ratios.returnOnAssets) >= 10 ? 'text-green-600' : 'text-amber-600' },
    { label: 'Debt to Equity', val: ratios.debtToEquity, desc: 'Total Liabilities / Equity', target: '< 1.0', color: Number(ratios.debtToEquity) <= 1 ? 'text-green-600' : 'text-amber-600' },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Financial Ratios</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((r, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className={cn('text-lg font-extrabold', r.color)}>{r.val}</div>
            <div className="text-xs font-semibold mt-1">{r.label}</div>
            <div className="text-[9px] text-slate-400">{r.desc}</div>
            <div className="text-[8px] text-slate-400 mt-0.5">Target: {r.target}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditView() {
  const [log, setLog] = useState<any[]>([]);
  useEffect(() => { setLog(getAuditLog({ limit: 50 })); }, []);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Audit Trail ({log.length})</h3>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        {log.map(e => (
          <div key={e.id} className="flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{e.action}</span><span className="text-[8px] text-slate-400">{e.entityType}</span></div>
              <div className="text-[9px] text-slate-500 truncate">{e.entityId}</div>
              <div className="text-[8px] text-slate-400">{new Date(e.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {log.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No audit events yet</p>}
      </div>
    </div>
  );
}

function ControlsView() {
  const [alerts, setAlerts] = useState<ControlAlert[]>([]);
  const refresh = () => setAlerts(getControlAlerts());
  useEffect(refresh, []);
  const sevColors: Record<string, string> = { low: 'bg-blue-50 text-blue-700', medium: 'bg-amber-50 text-amber-700', high: 'bg-orange-50 text-orange-700', critical: 'bg-red-50 text-red-700' };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold">Internal Controls ({alerts.filter(a => !a.resolved).length} active)</h3><button className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1" onClick={refresh}><RefreshCw size={11} /> Refresh</button></div>
      <div className="space-y-2">
        {alerts.map(a => (
          <div key={a.id} className={cn('p-3 rounded-2xl border', a.resolved ? 'border-slate-200 bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800')}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={14} className={cn('mt-0.5 flex-shrink-0', a.severity === 'critical' ? 'text-red-500' : a.severity === 'high' ? 'text-orange-500' : 'text-amber-500')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{a.title}</span>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-semibold', sevColors[a.severity])}>{a.severity.toUpperCase()}</span>
                  {a.resolved && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">RESOLVED</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{a.description}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[8px] text-slate-400">{a.category} | {new Date(a.timestamp).toLocaleDateString()}</span>
                  {!a.resolved && <button className="text-[8px] text-indigo-600 font-semibold hover:underline" onClick={() => { resolveAlert(a.id); refresh(); toast('Alert resolved!', 'success'); }}>Mark Resolved</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No control alerts. System is running smoothly.</p>}
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-3 text-[9px] text-blue-700">
        <strong>Control Framework:</strong> Smart Books automatically monitors transaction anomalies, duplicate entries, unusual patterns, and compliance gaps. Alerts are generated in real-time for review.
      </div>
    </div>
  );
}

function ProFormaView() {
  const [clientName, setClientName] = useState('');
  const [clientTIN, setClientTIN] = useState('');
  const [clientAddr, setClientAddr] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');

  const generate = () => {
    if (!clientName || !desc || !amount) { toast('Fill required fields', 'error'); return; }
    const invNum = `PF-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
    const total = Number(amount) * Number(qty);
    const html = generateProFormaInvoice({
      invoiceNumber: invNum,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString(),
      clientName, clientTIN: clientTIN || undefined, clientAddress: clientAddr,
      items: [{ description: desc, quantity: Number(qty), unitPrice: Number(amount), total }],
      notes,
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `proforma-${invNum}.html`; a.click();
    toast(`Pro-forma ${invNum} downloaded!`, 'success');
    logAuditEvent({ action: 'generate_proforma', entityType: 'invoice', entityId: invNum, userId: 'admin', changes: { invoice: { from: null, to: invNum } } });
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <h3 className="text-sm font-bold mb-3">Pro-Forma Invoice Generator</h3>
        <div className="space-y-3">
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Client Name *</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">TIN</label><input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={clientTIN} onChange={e => setClientTIN(e.target.value)} /></div><div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Address</label><input className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={clientAddr} onChange={e => setClientAddr(e.target.value)} /></div></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description *</label><input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Commission services - June" /></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Amount (Br) *</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={amount} onChange={e => setAmount(e.target.value)} /></div><div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Quantity</label><input type="number" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={qty} onChange={e => setQty(e.target.value)} /></div></div>
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Notes</label><textarea className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent resize-none h-16" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-50" onClick={generate} disabled={!clientName || !desc || !amount}>
            <FileSpreadsheet size={13} className="inline mr-1" /> Generate Pro-Forma
          </button>
        </div>
      </div>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/30 p-4">
        <h3 className="text-sm font-bold mb-3">Preview</h3>
        {clientName && desc ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-[10px]">
            <div className="text-center font-bold text-indigo-600 border-b border-slate-200 pb-2 mb-2">PRO-FORMA INVOICE</div>
            <div className="flex justify-between mb-2"><span><strong>Client:</strong> {clientName}</span><span><strong>Br {(Number(amount) * Number(qty)).toLocaleString()}</strong></span></div>
            <div className="text-slate-500">{desc} x {qty}</div>
            {notes && <div className="text-[9px] text-slate-400 mt-1">{notes}</div>}
          </div>
        ) : <p className="text-xs text-slate-400 text-center py-8">Fill in the form to see a preview</p>}
      </div>
    </div>
  );
}
