import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { formatPrice, stars } from '@/lib/utils';

export default function Compare() {
  const navigate = useNavigate();
  const { compareList, products } = useStore();
  const items = compareList.map(id => products.find(p => p.id === id)).filter(Boolean);

  if (items.length < 2) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl opacity-40 mb-3">📊</div>
        <h3 className="text-sm font-semibold">Select at least 2 products to compare</h3>
        <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm" onClick={() => navigate('/shop')}>Shop</button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <h2 className="text-base font-bold mb-3">📊 Compare Products</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold text-muted-foreground w-20">Feature</th>
              {items.map(p => p && (
                <th key={p.id} className="p-2 text-center">
                  <img src={p.image} className="w-14 h-14 rounded-lg object-cover mx-auto cursor-pointer" onClick={() => navigate(`/product/${p.id}`)} />
                  <div className="text-[10px] font-semibold mt-1">{p.nameEn}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Price', render: (p: any) => <span className="font-bold text-primary">{formatPrice(p.price)}</span> },
              { label: 'Rating', render: (p: any) => <>{stars(p.rating)} ({p.reviews})</> },
              { label: 'Category', render: (p: any) => <>{p.category}</> },
              { label: 'Stock', render: (p: any) => <>{p.stockCount > 0 ? '✅ In Stock' : '❌ Out'}</> },
              { label: 'Sold', render: (p: any) => <>{p.soldCount || 0}</> },
              { label: 'Vendor', render: (p: any) => <>{p.vendorName || 'Smart Shop'}</> },
            ].map(row => (
              <tr key={row.label}>
                <td className="p-2 font-semibold text-muted-foreground border-b border-border">{row.label}</td>
                {items.map(p => p && <td key={p.id} className="p-2 text-center border-b border-border">{row.render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
