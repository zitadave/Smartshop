import { useState, useRef } from 'react';
import { formatPrice, cn, generateId } from '@/lib/utils';
import { productsApi } from '@/lib/api';
import { Upload, Download, FileSpreadsheet, Plus, Trash2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/components/Toast';

interface BulkProduct {
  nameEn: string;
  name: string;
  price: number;
  originalPrice: number | null;
  stockCount: number;
  category: string;
  description: string;
  brand: string;
  image: string;
  badge: string;
  errors?: string[];
}

export default function BulkProductManager() {
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = 'nameEn,name,price,originalPrice,stockCount,category,description,brand,image,badge';
    const sample = 'Wireless Headphones,ጆሮ ማዳመጫ,2499,2999,50,electronics,High quality Bluetooth headphones,Samsung,https://example.com/image.jpg,sale';
    const csv = [headers, sample, '', '-- Instructions --', 'nameEn: Required. English product name', 'price: Required. Number only', 'stockCount: Number, default 10', 'category: electronics|fashion|home|beauty|groceries|books|sports|baby', 'badge: sale|hot|new|best-seller|popular|premium'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'smartshop-bulk-template.csv'; a.click();
    toast('📄 Template downloaded!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('--'));
      const parsed: BulkProduct[] = [];
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        if (vals.length < 2) continue;
        const errors: string[] = [];
        const price = Number(vals[2]) || 0;
        if (!price) errors.push('Price is required');
        if (!vals[0]) errors.push('Name is required');
        parsed.push({
          nameEn: vals[0] || '',
          name: vals[1] || vals[0] || '',
          price,
          originalPrice: Number(vals[3]) || null,
          stockCount: Number(vals[4]) || 10,
          category: vals[5] || 'electronics',
          description: vals[6] || '',
          brand: vals[7] || '',
          image: vals[8] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          badge: vals[9] || '',
          errors: errors.length > 0 ? errors : undefined,
        });
      }
      setProducts(parsed);
      setUploading(false);
      toast(`📦 ${parsed.length} products loaded from CSV`, 'success');
    };
    reader.readAsText(file);
  };

  const importAll = async () => {
    setImporting(true);
    let success = 0, failed = 0;
    const errors: string[] = [];
    for (const p of products) {
      if (p.errors) { failed++; errors.push(`${p.nameEn}: ${p.errors.join(', ')}`); continue; }
      try {
        await productsApi.create({
          nameEn: p.nameEn, name: p.name, price: p.price, originalPrice: p.originalPrice,
          stockCount: p.stockCount, category: p.category, description: p.description,
          brand: p.brand, image: p.image, images: [p.image], badge: p.badge,
          inStock: true, visible: true, vendorId: 1, vendorName: 'Smart Shop',
        });
        success++;
      } catch (e: any) { failed++; errors.push(`${p.nameEn}: ${e.message}`); }
    }
    setResults({ success, failed, errors });
    setImporting(false);
    toast(`✅ ${success} imported, ${failed} failed`, failed > 0 ? 'warning' : 'success');
  };

  const removeProduct = (idx: number) => setProducts(products.filter((_, i) => i !== idx));

  return (
    <div className="animate-fadeUp space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><FileSpreadsheet size={20} className="text-emerald-500" /> Bulk Product Manager</h2>
      <p className="text-[10px] text-slate-500">Upload a CSV file to add or update hundreds of products at once.</p>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-lg transition-all" onClick={downloadTemplate}>
          <Download size={14} /> Download Template
        </button>
        <button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-lg transition-all" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Upload CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Results */}
      {results && (
        <div className={cn('rounded-2xl border p-4', results.failed > 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200')}>
          <div className="flex items-center gap-2 mb-1">
            {results.failed > 0 ? <AlertTriangle size={16} className="text-amber-600" /> : <Check size={16} className="text-emerald-600" />}
            <span className="text-sm font-bold">{results.success} imported, {results.failed} failed</span>
          </div>
          {results.errors.length > 0 && (
            <div className="text-[9px] text-red-600 mt-1 max-h-20 overflow-y-auto">
              {results.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <button className="mt-2 text-[9px] text-indigo-600 font-semibold hover:underline" onClick={() => setResults(null)}>Dismiss</button>
        </div>
      )}

      {/* Products Table */}
      {products.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold">{products.length} Products Ready</h3>
            <button
              className={cn('px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50', importing && 'animate-pulse')}
              onClick={importAll}
              disabled={importing || products.length === 0}
            >
              {importing ? <><RefreshCw size={12} className="animate-spin" /> Importing...</> : <><Plus size={12} /> Import All</>}
            </button>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-semibold">#</th>
                  <th className="text-left px-3 py-2 font-semibold">Name</th>
                  <th className="text-right px-3 py-2 font-semibold">Price</th>
                  <th className="text-center px-3 py-2 font-semibold">Stock</th>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-center px-3 py-2 font-semibold">Status</th>
                  <th className="text-right px-3 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="text-[10px] font-semibold truncate max-w-[160px]">{p.nameEn}</div>
                      {p.brand && <div className="text-[8px] text-slate-400">{p.brand}</div>}
                    </td>
                    <td className="px-3 py-2 text-right font-bold">{formatPrice(p.price)}</td>
                    <td className="px-3 py-2 text-center">{p.stockCount}</td>
                    <td className="px-3 py-2 text-slate-500 capitalize">{p.category}</td>
                    <td className="px-3 py-2 text-center">
                      {p.errors ? (
                        <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold" title={p.errors.join(', ')}>Error</span>
                      ) : (
                        <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">Ready</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" onClick={() => removeProduct(i)}><Trash2 size={11} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <FileSpreadsheet size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-500 font-semibold mb-1">No products loaded</p>
          <p className="text-[9px] text-slate-400 mb-3">Download the template, fill in your products, then upload the CSV file.</p>
          <div className="flex justify-center gap-2">
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold" onClick={downloadTemplate}>Download Template</button>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-medium" onClick={() => fileRef.current?.click()}>Upload CSV</button>
          </div>
        </div>
      )}
    </div>
  );
}
