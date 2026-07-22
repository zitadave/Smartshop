/**
 * Smart Shop — Tax & Finance Dashboard
 * Complete financial management: payments, tax reports, receipts, compliance
 */
import { useState, useEffect } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { calculateTaxBreakdown, generateTaxReceipt, generateVATReturn, generateWHTCertificate, generateReceiptNumber, formatEthiopianDate, ETHIOPIAN_TAX, validateTIN } from '@/lib/tax';
import { sendAdminTelegram, sendFileToTelegram } from '@/lib/adminNotifier';
import { settingsApi } from '@/lib/api';
import { toast } from '@/components/Toast';
import {
  DollarSign, Receipt, FileText, Download, TrendingUp, Percent,
  Landmark, Shield, AlertTriangle, CheckCircle, Calendar, Search,
  Plus, Trash2, Eye, X, RefreshCw, Printer, Share2, Calculator,
  Building2, FileSpreadsheet, ScrollText, Scale, Banknote,
} from 'lucide-react';

export default function TaxFinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'tax' | 'reports' | 'settings'>('overview');

  const tabs = [
    { id: 'overview' as const, icon: TrendingUp, label: 'Overview' },
    { id: 'transactions' as const, icon: Receipt, label: 'Transactions' },
    { id: 'tax' as const, icon: Scale, label: 'Tax & VAT' },
    { id: 'reports' as const, icon: FileText, label: 'Reports' },
    { id: 'settings' as const, icon: Building2, label: 'Business Settings' },
  ];

  return (
    <div className="animate-fadeUp space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Landmark size={20} className="text-emerald-500" /> Finance &amp; Tax Dashboard</h2>
          <p className="text-[10px] text-slate-500">Payment processing, VAT compliance, tax reporting, vendor payouts</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 overflow-x-auto scrollbar-none max-w-full">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1', activeTab === t.id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')} onClick={() => setActiveTab(t.id)}>
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'overview' && <FinanceOverview />}
      {activeTab === 'transactions' && <TransactionHistory />}
      {activeTab === 'tax' && <TaxVATPanel />}
      {activeTab === 'reports' && <ReportGenerator />}
      {activeTab === 'settings' && <BusinessSettings />}
    </div>
  );
}

function FinanceOverview() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetch('/api/tax/monthly-report').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', val: formatPrice(stats.totalSales || 0), icon: DollarSign, color: 'from-emerald-500 to-green-600', sub: `${stats.orderCount || 0} orders` },
          { label: 'Commission Earned', val: formatPrice(stats.totalCommission || 0), icon: TrendingUp, color: 'from-blue-500 to-indigo-600', sub: `${((stats.totalCommission || 0) / Math.max(stats.totalSales || 1, 1)) * 100 || 10}% avg rate` },
          { label: 'VAT to Remit', val: formatPrice(stats.vatOnCommission || 0), icon: Scale, color: 'from-red-500 to-rose-600', sub: 'Due to ERCA monthly' },
          { label: 'Withholding Tax', val: formatPrice(stats.withholdingTax || 0), icon: Shield, color: 'from-purple-500 to-violet-600', sub: '2% on vendor payments' },
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
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Scale size={15} className="text-red-500" /> Tax Compliance Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'VAT Rate', value: '15%', desc: 'On commission/service fee' },
              { label: 'Withholding Tax', value: '2%', desc: 'On vendor payments' },
              { label: 'Gateway Fee', value: '2.5% (Chapa)', desc: 'Deducted per transaction' },
              { label: 'Reporting Period', value: 'Monthly', desc: 'VAT return due by 15th' },
              { label: 'Business TIN', value: stats.tin || 'Not set', desc: 'Required for legal operation' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div><div className="text-[10px] font-medium">{item.label}</div><div className="text-[8px] text-slate-400">{item.desc}</div></div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Calculator size={15} className="text-indigo-500" /> Quick Tax Calculator</h3>
          <p className="text-[9px] text-slate-500 mb-3">Calculate tax breakdown for any transaction</p>
          <div className="space-y-2">
            <input type="number" className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Product price (Br)" id="calc-price" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Delivery fee" id="calc-delivery" />
              <input type="number" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" placeholder="Commission %" id="calc-commission" defaultValue={15} />
            </div>
            <button className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-bold" onClick={() => {
              const price = Number((document.getElementById('calc-price') as HTMLInputElement)?.value);
              const delivery = Number((document.getElementById('calc-delivery') as HTMLInputElement)?.value) || 0;
              const commission = Number((document.getElementById('calc-commission') as HTMLInputElement)?.value) || 15;
              if (!price) { toast('Enter a price first', 'error'); return; }
              const tax = calculateTaxBreakdown({ productPrice: price, deliveryFee: delivery, commissionRate: commission / 100 });
              toast(`💰 Tax Breakdown: Commission=${formatPrice(tax.commissionAmount)}, VAT=${formatPrice(tax.vatOnCommission)}, WHT=${formatPrice(tax.withholdingTax)}, Vendor gets=${formatPrice(tax.vendorPayout)}`, 'info');
            }}>Calculate Tax Breakdown</button>
          </div>
          <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2 text-[8px] text-amber-700 dark:text-amber-400">
            ⚠️ For accurate calculations, consult with a tax professional. Rates may change based on ERCA regulations.
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionHistory() {
  const [txs, setTxs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/payment/transactions').then(r => r.json()).then(d => setTxs(d.transactions || [])).catch(() => {});
  }, []);

  const filtered = txs.filter((t: any) => !search || t.orderNumber?.toLowerCase().includes(search.toLowerCase()) || t.customerName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold">All Transactions ({txs.length})</h3>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] bg-transparent w-40" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Order</th>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
                <th className="text-center px-4 py-3 font-semibold">Payment</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-xs text-slate-400">No transactions</td></tr>}
              {filtered.slice(0, 50).map((t: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-[10px] font-bold text-indigo-600">{t.orderNumber}</td>
                  <td className="px-4 py-3 text-[10px]">{t.customerName}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatPrice(t.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', t.paymentMethod === 'telebirr' ? 'bg-green-100 text-green-700' : t.paymentMethod === 'chapa' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>{t.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[9px] px-2 py-0.5 rounded font-semibold', t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[9px] text-slate-400">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TaxVATPanel() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetch('/api/payment/transactions').then(r => r.json()).then(d => setTransactions(d.transactions || [])).catch(() => {});
  }, []);

  const taxBreakdowns = transactions.map((t: any) =>
    calculateTaxBreakdown({ productPrice: t.amount || 0, commissionRate: 0.15 })
  );

  const totalVAT = taxBreakdowns.reduce((s, t) => s + t.vatOnCommission, 0);
  const totalWHT = taxBreakdowns.reduce((s, t) => s + t.withholdingTax, 0);
  const totalCommission = taxBreakdowns.reduce((s, t) => s + t.commissionAmount, 0);

  const generateVATCSV = () => {
    const csv = generateVATReturn(taxBreakdowns, period);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat-return-${period}.csv`;
    a.click();
    toast('📄 VAT return CSV generated!', 'success');
  };

  const downloadReceipt = () => {
    const html = generateTaxReceipt({
      receiptNumber: generateReceiptNumber(),
      date: formatEthiopianDate(new Date()),
      storeName: 'Smart Shop Ethiopia',
      storeTIN: 'PENDING',
      customerName: 'Sample Customer',
      customerPhone: '+251-911-XXXXXX',
      customerAddress: 'Addis Ababa, Ethiopia',
      items: [{ name: 'Sample Product', quantity: 1, price: 1000, total: 1000 }],
      taxBreakdown: calculateTaxBreakdown({ productPrice: 1000, commissionRate: 0.15 }),
      paymentMethod: 'Telebirr',
      paymentReference: 'TXN-' + Date.now().toString(36).toUpperCase(),
      isVatRegistered: true,
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-receipt-${generateReceiptNumber()}.html`;
    a.click();
    toast('📄 Sample tax receipt downloaded!', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800/30 p-4">
          <div className="text-[9px] text-red-600 font-semibold uppercase tracking-wider">VAT on Commission (15%)</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{formatPrice(totalVAT)}</div>
          <div className="text-[9px] text-red-500 mt-1">To be remitted to ERCA</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800/30 p-4">
          <div className="text-[9px] text-purple-600 font-semibold uppercase tracking-wider">Withholding Tax (2%)</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{formatPrice(totalWHT)}</div>
          <div className="text-[9px] text-purple-500 mt-1">Deducted from vendor payments</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-4">
          <div className="text-[9px] text-blue-600 font-semibold uppercase tracking-wider">Net Commission</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{formatPrice(totalCommission)}</div>
          <div className="text-[9px] text-blue-500 mt-1">Before tax deductions</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><FileText size={15} className="text-red-500" /> Tax Reports</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div>
              <div className="text-xs font-semibold">📄 VAT Return - {period}</div>
              <div className="text-[9px] text-slate-400">Monthly VAT report for ERCA submission</div>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1" onClick={generateVATCSV}>
              <Download size={11} /> CSV
            </button>
          </div>
          <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div>
              <div className="text-xs font-semibold">🧾 Sample Tax Receipt</div>
              <div className="text-[9px] text-slate-400">HTML receipt with VAT breakdown</div>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1" onClick={downloadReceipt}>
              <Download size={11} /> HTML
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 rounded-2xl border border-red-200 dark:border-red-800/30 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] text-amber-800 dark:text-amber-400">
            <strong className="text-xs">Ethiopian Tax Compliance Checklist</strong>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              <li>Register for VAT with ERCA once annual turnover exceeds Br 1,000,000</li>
              <li>File VAT returns monthly by the 15th of the following month</li>
              <li>Deduct 2% withholding tax on all vendor payments</li>
              <li>Issue valid tax receipts for all transactions</li>
              <li>Keep books of accounts for 5 years</li>
              <li>Display your TIN on all receipts and invoices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportGenerator() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const generateWHTReport = () => {
    const cert = generateWHTCertificate({
      vendorName: 'All Vendors',
      vendorTIN: 'PENDING',
      period,
      transactions: [{ date: new Date().toISOString().split('T')[0], amount: 10000, wht: 200 }],
    });
    const blob = new Blob([cert], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wht-certificate-${period}.txt`;
    a.click();
    toast('📄 WHT Certificate downloaded!', 'success');
  };

  const reports = [
    { icon: FileSpreadsheet, label: 'VAT Return CSV', desc: 'Monthly VAT report for ERCA', color: 'from-red-500 to-rose-600', action: () => {
      fetch('/api/payment/transactions').then(r => r.json()).then(d => {
        const txs = d.transactions || [];
        const breakdowns = txs.map((t: any) => calculateTaxBreakdown({ productPrice: t.amount || 0, commissionRate: 0.15 }));
        const csv = generateVATReturn(breakdowns, period);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vat-return-${period}.csv`;
        a.click();
        toast('📄 VAT Return generated!', 'success');
      }).catch(() => toast('❌ No transaction data', 'error'));
    }},
    { icon: ScrollText, label: 'WHT Certificates', desc: 'Withholding tax per vendor', color: 'from-purple-500 to-violet-600', action: generateWHTReport },
    { icon: FileText, label: 'Sales Register', desc: 'All transactions for the period', color: 'from-blue-500 to-indigo-600', action: () => {
      fetch('/api/payment/transactions').then(r => r.json()).then(d => {
        const txs = d.transactions || [];
        const rows = txs.map((t: any) => `${t.date || ''},${t.orderNumber},${t.customerName},${t.amount || 0},${t.paymentMethod},${t.status}`).join('\n');
        const csv = 'Date,Order,Customer,Amount,Payment,Status\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-register-${period}.csv`;
        a.click();
        toast('📄 Sales register downloaded!', 'success');
      }).catch(() => toast('❌ No transaction data', 'error'));
    }},
    { icon: DollarSign, label: 'Commission Summary', desc: 'Total commission &amp; tax breakdown', color: 'from-emerald-500 to-green-600', action: () => {
      fetch('/api/tax/monthly-report').then(r => r.json()).then(stats => {
        toast(`📊 ${stats.period}: Revenue=${formatPrice(stats.totalSales)}, Commission=${formatPrice(stats.totalCommission)}, VAT=${formatPrice(stats.vatOnCommission)}, WHT=${formatPrice(stats.withholdingTax)}`, 'info');
      }).catch(() => toast('❌ No report data', 'error'));
    }},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-500">Report Period:</label>
        <input type="month" className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent" value={period} onChange={e => setPeriod(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map((r, i) => {
          const Icon = r.icon;
          return (
            <button key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all text-left" onClick={r.action}>
              <div className={cn('p-3 rounded-xl bg-gradient-to-br shadow-lg', r.color)}><Icon size={20} className="text-white" /></div>
              <div className="flex-1">
                <div className="text-xs font-bold">{r.label}</div>
                <div className="text-[9px] text-slate-400">{r.desc}</div>
              </div>
              <Download size={16} className="text-slate-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BusinessSettings() {
  const [tin, setTin] = useState(() => localStorage.getItem('ss_business_tin') || '');
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('ss_business_name') || 'Smart Shop Ethiopia');
  const [businessAddress, setBusinessAddress] = useState(() => localStorage.getItem('ss_business_address') || 'Addis Ababa, Ethiopia');
  const [vatRegistered, setVatRegistered] = useState(() => localStorage.getItem('ss_vat_registered') === 'true');

  const saveSettings = () => {
    localStorage.setItem('ss_business_tin', tin);
    localStorage.setItem('ss_business_name', businessName);
    localStorage.setItem('ss_business_address', businessAddress);
    localStorage.setItem('ss_vat_registered', String(vatRegistered));
    toast('✅ Business settings saved!', 'success');
    sendAdminTelegram(`🏛️ <b>Business Settings Updated</b>\n\nName: ${businessName}\nTIN: ${tin || 'Not set'}\nVAT Registered: ${vatRegistered ? 'Yes' : 'No'}`);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-x-hidden">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Building2 size={16} className="text-indigo-500" /> Business Information</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Business Name</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g., Smart Shop Ethiopia PLC" />
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tax Identification Number (TIN)</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent font-mono" value={tin} onChange={e => setTin(e.target.value)} placeholder="XXXXXX-XXXXXXX" />
            {tin && <div className={cn('mt-1 text-[10px]', validateTIN(tin) ? 'text-green-600' : 'text-red-500')}>{validateTIN(tin) ? '✅ Valid TIN format' : '⚠️ Invalid TIN format (expected: XXXXXX-XXXXXXX)'}</div>}
          </div>
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Business Address</label>
            <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={vatRegistered} onChange={e => setVatRegistered(e.target.checked)} className="rounded" />
            <span>VAT Registered (annual turnover {'>'} Br 1,000,000)</span>
          </label>
          <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg" onClick={saveSettings}>
            💾 Save Business Settings
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-4">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Shield size={15} className="text-blue-500" /> Legal Information</h3>
        <div className="text-[9px] text-blue-700 dark:text-blue-400 space-y-1">
          <p>🏛️ <strong>To operate legally in Ethiopia, you need:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            <li>Business License from the Ministry of Trade</li>
            <li>TIN (Tax Identification Number) from ERCA</li>
            <li>VAT Registration if turnover exceeds Br 1,000,000/year</li>
            <li>Memorandum of Association (for PLC)</li>
            <li>E-commerce license (required for digital platforms)</li>
            <li>Data Protection registration with the Information Network Security Administration (INSA)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
