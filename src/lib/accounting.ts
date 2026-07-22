/**
 * Smart Books — Complete Accounting Engine for Smart Shop Ethiopia
 * 
 * Ethiopian-standard Chart of Accounts, Double-Entry Bookkeeping,
 * General Ledger, Financial Statements, Internal Controls & Audit
 * 
 * Standards followed:
 * - Ethiopian Accounting Standard (EAS)
 * - IFRS for SMEs (adopted by Ethiopia)
 * - ERCA tax reporting requirements
 */

// ============================================================
// CHART OF ACCOUNTS — Ethiopian Standard
// ============================================================

export interface Account {
  code: string;
  name: string;
  nameAm: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  category: string;
  isActive: boolean;
  description: string;
}

export const CHART_OF_ACCOUNTS: Account[] = [
  // ===== ASSETS (1xxx) =====
  { code: '1010', name: 'Cash on Hand', nameAm: 'በእጅ ገንዘብ', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Physical cash held by the business' },
  { code: '1020', name: 'Chapa Merchant Account', nameAm: 'ቻፓ የነጋዴ አካውንት', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Funds held in Chapa merchant account' },
  { code: '1030', name: 'Telebirr Collections', nameAm: 'በቴሌብር የተሰበሰበ ገንዘብ', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Funds collected via Telebirr' },
  { code: '1040', name: 'Bank Account - CBE', nameAm: 'የባንክ አካውንት - ንግድ ባንክ', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Commercial Bank of Ethiopia account' },
  { code: '1100', name: 'Accounts Receivable', nameAm: 'የሂሳብ መቀበያ', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Amounts owed to the business' },
  { code: '1200', name: 'VAT Receivable', nameAm: 'ተመላሽ ተ.እ.ታ', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Input VAT recoverable from ERCA' },
  { code: '1300', name: 'Prepaid Expenses', nameAm: 'ቅድመ ክፍያ ወጪዎች', type: 'asset', normalBalance: 'debit', category: 'Current Assets', isActive: true, description: 'Prepaid rent, insurance, etc.' },
  { code: '1400', name: 'Fixed Assets', nameAm: 'ቋሚ ንብረቶች', type: 'asset', normalBalance: 'debit', category: 'Non-Current Assets', isActive: true, description: 'Computers, equipment, furniture' },
  { code: '1410', name: 'Accumulated Depreciation', nameAm: 'የተጠራቀመ የዋጋ ቅነሳ', type: 'asset', normalBalance: 'credit', category: 'Non-Current Assets', isActive: true, description: 'Contra-asset for depreciation' },

  // ===== LIABILITIES (2xxx) =====
  { code: '2010', name: 'Accounts Payable', nameAm: 'የሂሳብ ክፍያ', type: 'liability', normalBalance: 'credit', category: 'Current Liabilities', isActive: true, description: 'Amounts owed to vendors' },
  { code: '2020', name: 'Vendor Payouts Payable', nameAm: 'ለሻጮች የሚከፈል ገንዘብ', type: 'liability', normalBalance: 'credit', category: 'Current Liabilities', isActive: true, description: 'Commissions owed to vendors' },
  { code: '2100', name: 'VAT Payable', nameAm: 'የሚከፈል ተ.እ.ታ', type: 'liability', normalBalance: 'credit', category: 'Tax Liabilities', isActive: true, description: 'VAT collected to be remitted to ERCA' },
  { code: '2110', name: 'Withholding Tax Payable', nameAm: 'የተገዢ ታክስ ክፍያ', type: 'liability', normalBalance: 'credit', category: 'Tax Liabilities', isActive: true, description: 'WHT deducted to be remitted to ERCA' },
  { code: '2120', name: 'Turnover Tax Payable', nameAm: 'የሽግግር ታክስ ክፍያ', type: 'liability', normalBalance: 'credit', category: 'Tax Liabilities', isActive: true, description: 'ToT collected to be remitted to ERCA' },
  { code: '2130', name: 'Income Tax Payable', nameAm: 'የገቢ ታክስ ክፍያ', type: 'liability', normalBalance: 'credit', category: 'Tax Liabilities', isActive: true, description: 'Business profit tax payable' },
  { code: '2200', name: 'Accrued Expenses', nameAm: 'የተጠራቀመ ወጪ', type: 'liability', normalBalance: 'credit', category: 'Current Liabilities', isActive: true, description: 'Expenses incurred but not yet paid' },
  { code: '2300', name: 'Deferred Revenue', nameAm: 'የተራዘመ ገቢ', type: 'liability', normalBalance: 'credit', category: 'Current Liabilities', isActive: true, description: 'Unearned revenue from pre-orders' },

  // ===== EQUITY (3xxx) =====
  { code: '3010', name: 'Share Capital', nameAm: 'የአክሲዮን ካፒታል', type: 'equity', normalBalance: 'credit', category: 'Equity', isActive: true, description: "Owner's contributed capital" },
  { code: '3020', name: 'Retained Earnings', nameAm: 'የተጠራቀመ ትርፍ', type: 'equity', normalBalance: 'credit', category: 'Equity', isActive: true, description: 'Accumulated profits' },
  { code: '3030', name: 'Current Year Profit/Loss', nameAm: 'የአሁኑ ዓመት ትርፍ/ኪሳራ', type: 'equity', normalBalance: 'credit', category: 'Equity', isActive: true, description: 'Net result for current fiscal year' },
  { code: '3040', name: 'Drawings', nameAm: 'የባለቤት መውሰጃ', type: 'equity', normalBalance: 'debit', category: 'Equity', isActive: true, description: 'Owner withdrawals' },

  // ===== REVENUE (4xxx) =====
  { code: '4010', name: 'Commission Income', nameAm: 'የኮሚሽን ገቢ', type: 'revenue', normalBalance: 'credit', category: 'Operating Revenue', isActive: true, description: 'Commission from product sales' },
  { code: '4020', name: 'Listing Fees', nameAm: 'የመዘርዘሪያ ክፍያ', type: 'revenue', normalBalance: 'credit', category: 'Operating Revenue', isActive: true, description: 'Fees for product listings' },
  { code: '4030', name: 'Promotion & Ad Revenue', nameAm: 'የማስተዋወቂያ ገቢ', type: 'revenue', normalBalance: 'credit', category: 'Operating Revenue', isActive: true, description: 'Sponsored product & ad income' },
  { code: '4040', name: 'Delivery Service Income', nameAm: 'የማጓጓዣ ገቢ', type: 'revenue', normalBalance: 'credit', category: 'Operating Revenue', isActive: true, description: 'Delivery fee income' },
  { code: '4100', name: 'Other Income', nameAm: 'ሌላ ገቢ', type: 'revenue', normalBalance: 'credit', category: 'Other Revenue', isActive: true, description: 'Interest, miscellaneous income' },

  // ===== EXPENSES (5xxx) =====
  { code: '5010', name: 'Payment Gateway Fees', nameAm: 'የክፍያ መግቢያ ክፍያ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Chapa/Telebirr transaction fees' },
  { code: '5020', name: 'Hosting & Infrastructure', nameAm: 'የሆስቲንግ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Vercel, Supabase, domain costs' },
  { code: '5030', name: 'Salaries & Wages', nameAm: 'የደሞዝ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Employee compensation' },
  { code: '5040', name: 'Marketing & Advertising', nameAm: 'የማስታወቂያ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Ads, promotions, brand building' },
  { code: '5050', name: 'Office Rent', nameAm: 'የቢሮ ኪራይ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Office space rental' },
  { code: '5060', name: 'Utilities', nameAm: 'የፍጆታ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Electricity, internet, water' },
  { code: '5070', name: 'Legal & Professional Fees', nameAm: 'የህግ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Lawyer, accountant, consultant fees' },
  { code: '5080', name: 'Depreciation', nameAm: 'የዋጋ ቅነሳ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Fixed asset depreciation' },
  { code: '5090', name: 'Bank Charges', nameAm: 'የባንክ ክፍያ', type: 'expense', normalBalance: 'debit', category: 'Operating Expenses', isActive: true, description: 'Bank account fees' },
  { code: '5100', name: 'Tax Expense', nameAm: 'የታክስ ወጪ', type: 'expense', normalBalance: 'debit', category: 'Tax Expenses', isActive: true, description: 'Income tax, penalties' },
  { code: '5200', name: 'Miscellaneous Expenses', nameAm: 'የተለያዩ ወጪዎች', type: 'expense', normalBalance: 'debit', category: 'Other Expenses', isActive: true, description: 'Other business expenses' },
];

// ============================================================
// JOURNAL ENTRY
// ============================================================

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  referenceType: 'sale' | 'payout' | 'expense' | 'tax' | 'commission' | 'adjustment' | 'opening';
  referenceNumber: string;
  lines: JournalLine[];
  posted: boolean;
  postedAt?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface FinancialStatement {
  period: string;
  generatedAt: string;
  items: StatementItem[];
  totals: { label: string; amount: number; isBold?: boolean }[];
}

export interface StatementItem {
  accountCode?: string;
  label: string;
  amount: number;
  indent: number;
  isTotal?: boolean;
  category?: string;
}

// ============================================================
// ACCOUNTING ENGINE
// ============================================================

const STORAGE_KEY = 'ss_smart_books';

function getStorage(): { entries: JournalEntry[] } {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"entries":[]}'); }
  catch { return { entries: [] }; }
}

function saveStorage(data: { entries: JournalEntry[] }): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function getAccount(code: string): Account | undefined {
  return CHART_OF_ACCOUNTS.find(a => a.code === code);
}

export function getAccountsByType(type: Account['type']): Account[] {
  return CHART_OF_ACCOUNTS.filter(a => a.type === type && a.isActive);
}

// ============================================================
// JOURNAL OPERATIONS
// ============================================================

export function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): JournalEntry {
  const data = getStorage();
  const newEntry: JournalEntry = {
    ...entry,
    id: 'JE-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  data.entries.unshift(newEntry);
  saveStorage(data);
  return newEntry;
}

export function postJournalEntry(id: string, approver: string): boolean {
  const data = getStorage();
  const entry = data.entries.find(e => e.id === id);
  if (!entry || entry.posted) return false;
  entry.posted = true;
  entry.postedAt = new Date().toISOString();
  entry.approvedBy = approver;
  saveStorage(data);
  return true;
}

export function getJournalEntries(filters?: {
  fromDate?: string;
  toDate?: string;
  referenceType?: string;
  posted?: boolean;
}): JournalEntry[] {
  const data = getStorage();
  let entries = data.entries;
  if (filters?.fromDate) entries = entries.filter(e => e.date >= filters.fromDate!);
  if (filters?.toDate) entries = entries.filter(e => e.date <= filters.toDate!);
  if (filters?.referenceType) entries = entries.filter(e => e.referenceType === filters.referenceType);
  if (filters?.posted !== undefined) entries = entries.filter(e => e.posted === filters.posted);
  return entries;
}

export function generateEntryNumber(type: string): string {
  const prefix = type === 'sale' ? 'SL' : type === 'payout' ? 'PO' : type === 'expense' ? 'EX' : type === 'tax' ? 'TX' : 'AD';
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

// ============================================================
// TRIAL BALANCE
// ============================================================

export function generateTrialBalance(asOfDate?: string): TrialBalanceLine[] {
  const data = getStorage();
  const entries = asOfDate
    ? data.entries.filter(e => e.date <= asOfDate)
    : data.entries;

  const balances: Record<string, { debit: number; credit: number }> = {};
  
  CHART_OF_ACCOUNTS.forEach(a => { balances[a.code] = { debit: 0, credit: 0 }; });

  entries.forEach(entry => {
    entry.lines.forEach(line => {
      if (!balances[line.accountCode]) {
        balances[line.accountCode] = { debit: 0, credit: 0 };
      }
      balances[line.accountCode].debit += line.debit;
      balances[line.accountCode].credit += line.credit;
    });
  });

  const results: TrialBalanceLine[] = [];
  let totalDebit = 0, totalCredit = 0;

  CHART_OF_ACCOUNTS.forEach(a => {
    const b = balances[a.code];
    if (!b) return;
    const netDebit = Math.max(0, b.debit - b.credit);
    const netCredit = Math.max(0, b.credit - b.debit);
    if (netDebit === 0 && netCredit === 0) return;
    results.push({
      accountCode: a.code,
      accountName: `${a.code} - ${a.name}`,
      debit: netDebit,
      credit: netCredit,
    });
    totalDebit += netDebit;
    totalCredit += netCredit;
  });

  results.push({
    accountCode: '',
    accountName: 'TOTALS',
    debit: totalDebit,
    credit: totalCredit,
  });

  return results;
}

// ============================================================
// INCOME STATEMENT (P&L)
// ============================================================

export function generateIncomeStatement(period: string): FinancialStatement {
  const data = getStorage();
  const items: StatementItem[] = [];
  const totals: { label: string; amount: number; isBold?: boolean }[] = [];

  // Revenue accounts (4xxx)
  items.push({ label: 'REVENUE', amount: 0, indent: 0, isTotal: true });
  let totalRevenue = 0;
  getAccountsByType('revenue').forEach(a => {
    const balance = getAccountBalance(a.code);
    if (balance !== 0) {
      items.push({ label: `${a.code} - ${a.name}`, amount: balance, indent: 1, accountCode: a.code });
      totalRevenue += balance;
    }
  });
  items.push({ label: 'Total Revenue', amount: totalRevenue, indent: 1, isTotal: true });
  totals.push({ label: 'Total Revenue', amount: totalRevenue });

  items.push({ label: '', amount: 0, indent: 0 });

  // Expense accounts (5xxx)
  items.push({ label: 'EXPENSES', amount: 0, indent: 0, isTotal: true });
  let totalExpenses = 0;
  getAccountsByType('expense').forEach(a => {
    const balance = getAccountBalance(a.code);
    if (balance !== 0) {
      items.push({ label: `${a.code} - ${a.name}`, amount: balance, indent: 1, accountCode: a.code });
      totalExpenses += balance;
    }
  });
  items.push({ label: 'Total Expenses', amount: totalExpenses, indent: 1, isTotal: true });
  totals.push({ label: 'Total Expenses', amount: totalExpenses });

  items.push({ label: '', amount: 0, indent: 0 });

  const netProfit = totalRevenue - totalExpenses;
  items.push({ label: 'NET PROFIT / (LOSS)', amount: netProfit, indent: 0, isTotal: true });
  totals.push({ label: 'Net Profit / (Loss)', amount: netProfit, isBold: true });

  return { period, generatedAt: new Date().toISOString(), items, totals };
}

// ============================================================
// BALANCE SHEET
// ============================================================

export function generateBalanceSheet(asOfDate: string): FinancialStatement {
  const items: StatementItem[] = [];
  const totals: { label: string; amount: number; isBold?: boolean }[] = [];

  // Assets
  items.push({ label: 'ASSETS', amount: 0, indent: 0, isTotal: true });
  let totalAssets = 0;
  const assetCategories = ['Current Assets', 'Non-Current Assets'];
  assetCategories.forEach(cat => {
    const accounts = CHART_OF_ACCOUNTS.filter(a => a.type === 'asset' && a.category === cat);
    let catTotal = 0;
    accounts.forEach(a => {
      const balance = getAccountBalance(a.code);
      if (balance !== 0) {
        items.push({ label: `${a.code} - ${a.name}`, amount: balance, indent: 1, accountCode: a.code });
        catTotal += balance;
      }
    });
    if (catTotal !== 0) {
      items.push({ label: `Total ${cat}`, amount: catTotal, indent: 1, isTotal: true });
      totalAssets += catTotal;
    }
  });
  items.push({ label: 'TOTAL ASSETS', amount: totalAssets, indent: 0, isTotal: true });
  totals.push({ label: 'Total Assets', amount: totalAssets, isBold: true });

  items.push({ label: '', amount: 0, indent: 0 });

  // Liabilities
  items.push({ label: 'LIABILITIES', amount: 0, indent: 0, isTotal: true });
  let totalLiabilities = 0;
  const liabilityCategories = ['Current Liabilities', 'Tax Liabilities'];
  liabilityCategories.forEach(cat => {
    const accounts = CHART_OF_ACCOUNTS.filter(a => a.type === 'liability' && a.category === cat);
    let catTotal = 0;
    accounts.forEach(a => {
      const balance = getAccountBalance(a.code);
      if (balance !== 0) {
        items.push({ label: `${a.code} - ${a.name}`, amount: balance, indent: 1, accountCode: a.code });
        catTotal += balance;
      }
    });
    if (catTotal !== 0) {
      items.push({ label: `Total ${cat}`, amount: catTotal, indent: 1, isTotal: true });
      totalLiabilities += catTotal;
    }
  });
  items.push({ label: 'TOTAL LIABILITIES', amount: totalLiabilities, indent: 0, isTotal: true });
  totals.push({ label: 'Total Liabilities', amount: totalLiabilities, isBold: true });

  items.push({ label: '', amount: 0, indent: 0 });

  // Equity
  items.push({ label: 'EQUITY', amount: 0, indent: 0, isTotal: true });
  let totalEquity = 0;
  getAccountsByType('equity').forEach(a => {
    const balance = getAccountBalance(a.code);
    if (balance !== 0) {
      items.push({ label: `${a.code} - ${a.name}`, amount: balance, indent: 1, accountCode: a.code });
      totalEquity += balance;
    }
  });
  items.push({ label: 'TOTAL EQUITY', amount: totalEquity, indent: 0, isTotal: true });
  totals.push({ label: 'Total Equity', amount: totalEquity, isBold: true });

  items.push({ label: '', amount: 0, indent: 0 });
  items.push({ label: 'TOTAL LIABILITIES & EQUITY', amount: totalLiabilities + totalEquity, indent: 0, isTotal: true });
  totals.push({ label: 'Total Liabilities & Equity', amount: totalLiabilities + totalEquity, isBold: true });

  return { period: asOfDate, generatedAt: new Date().toISOString(), items, totals };
}

// ============================================================
// ACCOUNT BALANCE
// ============================================================

export function getAccountBalance(accountCode: string): number {
  const data = getStorage();
  let debit = 0, credit = 0;
  data.entries.forEach(entry => {
    entry.lines.forEach(line => {
      if (line.accountCode === accountCode) {
        debit += line.debit;
        credit += line.credit;
      }
    });
  });
  const account = getAccount(accountCode);
  if (!account) return debit - credit;
  return account.normalBalance === 'debit' ? debit - credit : credit - debit;
}

// ============================================================
// CASH FLOW STATEMENT
// ============================================================

export function generateCashFlowStatement(period: string): FinancialStatement {
  const items: StatementItem[] = [];
  const totals: { label: string; amount: number; isBold?: boolean }[] = [];

  // Operating Activities
  items.push({ label: 'Cash Flows from Operating Activities', amount: 0, indent: 0, isTotal: true });
  const netProfit = getAccountBalance('3030');
  items.push({ label: 'Net Profit/(Loss)', amount: netProfit, indent: 1, accountCode: '3030' });
  
  const gatewayFees = getAccountBalance('5010');
  items.push({ label: 'Adjustment: Payment Gateway Fees', amount: gatewayFees, indent: 1, accountCode: '5010' });

  const vatPayable = getAccountBalance('2100');
  items.push({ label: 'Change in VAT Payable', amount: vatPayable, indent: 1, accountCode: '2100' });

  const ap = getAccountBalance('2010');
  items.push({ label: 'Change in Accounts Payable', amount: ap, indent: 1, accountCode: '2010' });

  const netOperating = netProfit + gatewayFees + vatPayable + ap;
  items.push({ label: 'Net Cash from Operating Activities', amount: netOperating, indent: 1, isTotal: true });
  totals.push({ label: 'Net Operating Cash Flow', amount: netOperating });

  items.push({ label: '', amount: 0, indent: 0 });

  // Investing Activities
  items.push({ label: 'Cash Flows from Investing Activities', amount: 0, indent: 0, isTotal: true });
  const fa = getAccountBalance('1400');
  items.push({ label: 'Purchase of Fixed Assets', amount: -fa, indent: 1, accountCode: '1400' });
  totals.push({ label: 'Net Investing Cash Flow', amount: -fa });
  items.push({ label: 'Net Cash from Investing Activities', amount: -fa, indent: 1, isTotal: true });

  items.push({ label: '', amount: 0, indent: 0 });

  // Financing
  items.push({ label: 'Cash Flows from Financing Activities', amount: 0, indent: 0, isTotal: true });
  const capital = getAccountBalance('3010');
  items.push({ label: 'Capital Injection', amount: capital, indent: 1, accountCode: '3010' });
  totals.push({ label: 'Net Financing Cash Flow', amount: capital });
  items.push({ label: 'Net Cash from Financing Activities', amount: capital, indent: 1, isTotal: true });

  const netChange = netOperating - fa + capital;
  items.push({ label: '', amount: 0, indent: 0 });
  items.push({ label: 'NET INCREASE/(DECREASE) IN CASH', amount: netChange, indent: 0, isTotal: true });
  totals.push({ label: 'Net Change in Cash', amount: netChange, isBold: true });

  return { period, generatedAt: new Date().toISOString(), items, totals };
}

// ============================================================
// AUTO-GENERATE TRANSACTIONS FROM SALES
// ============================================================

export function createSaleJournalEntry(params: {
  orderNumber: string;
  productPrice: number;
  commissionRate: number;
  deliveryFee: number;
  gatewayFee: number;
  date: string;
}): JournalEntry {
  const commissionAmount = Math.round(params.productPrice * params.commissionRate);
  const vatOnCommission = Math.round(commissionAmount * 0.15);
  const withholdingTax = Math.round(params.productPrice * 0.02);
  const vendorPayout = params.productPrice - commissionAmount - params.gatewayFee - withholdingTax;
  const totalFromCustomer = params.productPrice + params.deliveryFee + vatOnCommission;

  return createJournalEntry({
    date: params.date,
    description: `Sale - Order ${params.orderNumber}`,
    referenceType: 'sale',
    referenceNumber: params.orderNumber,
    posted: true,
    lines: [
      // Debit: Cash/Bank (total from customer)
      { accountCode: '1020', accountName: 'Chapa Merchant Account', debit: totalFromCustomer, credit: 0, description: 'Customer payment received' },
      // Credit: Commission Income
      { accountCode: '4010', accountName: 'Commission Income', debit: 0, credit: commissionAmount, description: `Commission ${Math.round(params.commissionRate * 100)}%` },
      // Credit: VAT Payable (on commission)
      { accountCode: '2100', accountName: 'VAT Payable', debit: 0, credit: vatOnCommission, description: 'VAT on commission 15%' },
      // Credit: Vendor Payouts Payable
      { accountCode: '2020', accountName: 'Vendor Payouts Payable', debit: 0, credit: vendorPayout, description: 'Net vendor payout' },
      // Credit: Withholding Tax Payable
      { accountCode: '2110', accountName: 'Withholding Tax Payable', debit: 0, credit: withholdingTax, description: 'WHT 2%' },
      // Debit: Gateway Fee Expense
      { accountCode: '5010', accountName: 'Payment Gateway Fees', debit: params.gatewayFee, credit: 0, description: 'Chapa/Telebirr fee' },
    ],
    createdBy: 'system',
  });
}

export function createExpenseJournalEntry(params: {
  description: string;
  amount: number;
  accountCode: string;
  date: string;
  referenceNumber: string;
}): JournalEntry {
  const account = getAccount(params.accountCode);
  return createJournalEntry({
    date: params.date,
    description: params.description,
    referenceType: 'expense',
    referenceNumber: params.referenceNumber,
    posted: true,
    lines: [
      { accountCode: params.accountCode, accountName: account?.name || 'Expense', debit: params.amount, credit: 0, description: params.description },
      { accountCode: '1040', accountName: 'Bank Account - CBE', debit: 0, credit: params.amount, description: 'Payment' },
    ],
    createdBy: 'system',
  });
}

// ============================================================
// RATIO ANALYSIS
// ============================================================

export function calculateRatios() {
  const tb = generateTrialBalance();
  const totalRevenue = tb.filter(l => l.accountCode.startsWith('4')).reduce((s, l) => s + l.credit - l.debit, 0);
  const totalAssets = tb.filter(l => l.accountCode.startsWith('1')).reduce((s, l) => s + l.debit - l.credit, 0);
  const totalLiabilities = tb.filter(l => l.accountCode.startsWith('2')).reduce((s, l) => s + l.credit - l.debit, 0);
  const currentAssets = tb.filter(l => ['1010','1020','1030','1040','1100'].includes(l.accountCode)).reduce((s, l) => s + l.debit - l.credit, 0);
  const currentLiabilities = tb.filter(l => ['2010','2020','2100','2110','2120','2130','2200'].includes(l.accountCode)).reduce((s, l) => s + l.credit - l.debit, 0);
  const netProfit = totalRevenue - tb.filter(l => l.accountCode.startsWith('5')).reduce((s, l) => s + l.debit - l.credit, 0);
  const gatewayFees = getAccountBalance('5010');

  return {
    currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A',
    profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 'N/A',
    expenseRatio: totalRevenue > 0 ? ((gatewayFees / totalRevenue) * 100).toFixed(1) : 'N/A',
    returnOnAssets: totalAssets > 0 ? ((netProfit / totalAssets) * 100).toFixed(1) : 'N/A',
    debtToEquity: (totalAssets - totalLiabilities) > 0 ? (totalLiabilities / (totalAssets - totalLiabilities)).toFixed(2) : 'N/A',
    revenuePerSale: totalRevenue,
    netProfit,
    totalRevenue,
    totalExpenses: totalRevenue - netProfit,
  };
}

// ============================================================
// INTERNAL CONTROLS — Audit Trail & Anomaly Detection
// ============================================================

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes: Record<string, { from: any; to: any }>;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface ControlAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  recommendation?: string;
}

const AUDIT_KEY = 'ss_audit_log';
const ALERT_KEY = 'ss_control_alerts';

export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  try {
    const log: AuditEvent[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    log.unshift({
      ...event,
      id: 'AUD-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 1000)));
  } catch {}
}

export function getAuditLog(filters?: { limit?: number; action?: string; entityType?: string }): AuditEvent[] {
  try {
    let log: AuditEvent[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    if (filters?.action) log = log.filter(e => e.action === filters.action);
    if (filters?.entityType) log = log.filter(e => e.entityType === filters.entityType);
    if (filters?.limit) log = log.slice(0, filters.limit);
    return log;
  } catch { return []; }
}

export function addControlAlert(alert: Omit<ControlAlert, 'id' | 'timestamp'>): void {
  try {
    const alerts: ControlAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
    alerts.unshift({
      ...alert,
      id: 'ALR-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(ALERT_KEY, JSON.stringify(alerts.slice(0, 200)));
  } catch {}
}

export function getControlAlerts(unresolvedOnly?: boolean): ControlAlert[] {
  try {
    let alerts: ControlAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
    if (unresolvedOnly) alerts = alerts.filter(a => !a.resolved);
    return alerts;
  } catch { return []; }
}

export function resolveAlert(id: string): boolean {
  try {
    const alerts: ControlAlert[] = JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
    const updated = alerts.map(a => a.id === id ? { ...a, resolved: true } : a);
    localStorage.setItem(ALERT_KEY, JSON.stringify(updated));
    return true;
  } catch { return false; }
}

// ============================================================
// PRO-FORMA INVOICE GENERATOR
// ============================================================

export function generateProFormaInvoice(params: {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientTIN?: string;
  clientAddress: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  notes?: string;
  vatRate?: number;
}): string {
  const vatRate = params.vatRate || 0.15;
  const subtotal = params.items.reduce((s, i) => s + i.total, 0);
  const vat = Math.round(subtotal * vatRate);
  const total = subtotal + vat;

  const itemsRows = params.items.map(i =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px">${i.description}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">Br ${i.unitPrice.toLocaleString()}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">Br ${i.total.toLocaleString()}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Pro-Forma Invoice ${params.invoiceNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',monospace; background:#f3f4f6; padding:20px; }
  .invoice { max-width:500px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#1e3a5f,#0f2137); padding:20px; text-align:center; color:white; }
  .header h1 { font-size:18px; font-weight:700; }
  .body { padding:16px 20px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { text-align:left; font-size:9px; text-transform:uppercase; color:#9ca3af; padding:6px 8px; border-bottom:2px solid #e5e7eb; }
  .totals { border-top:2px solid #e5e7eb; padding-top:8px; margin-top:8px; }
  .tr { display:flex; justify-content:space-between; font-size:12px; padding:3px 0; }
  .tr.final { font-size:16px; font-weight:700; color:#1e3a5f; border-top:2px solid #1e3a5f; padding-top:8px; margin-top:8px; }
  .footer { text-align:center; padding:14px; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; }
</style></head>
<body>
<div class="invoice">
  <div class="header"><h1>PRO-FORMA INVOICE</h1><p style="font-size:10px;opacity:0.8;margin-top:4px">${params.invoiceNumber}</p></div>
  <div class="body">
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:12px">
      <div><strong>Client:</strong> ${params.clientName}<br>${params.clientAddress}${params.clientTIN ? '<br>TIN: ' + params.clientTIN : ''}</div>
      <div style="text-align:right"><strong>Date:</strong> ${params.date}<br><strong>Due:</strong> ${params.dueDate}</div>
    </div>
    <table><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>${itemsRows}</table>
    <div class="totals">
      <div class="tr"><span>Subtotal</span><span>Br ${subtotal.toLocaleString()}</span></div>
      <div class="tr"><span>VAT (${Math.round(vatRate * 100)}%)</span><span>Br ${vat.toLocaleString()}</span></div>
      <div class="tr final"><span>TOTAL</span><span>Br ${total.toLocaleString()}</span></div>
    </div>
    ${params.notes ? `<div style="margin-top:10px;font-size:9px;color:#6b7280"><strong>Notes:</strong><br>${params.notes}</div>` : ''}
  </div>
  <div class="footer"><p>Smart Shop Ethiopia | TIN: PENDING</p><p style="font-size:8px">This is a pro-forma invoice, not a tax receipt</p></div>
</div>
</body></html>`;
}
