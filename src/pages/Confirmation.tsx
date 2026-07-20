import { useParams, useNavigate } from 'react-router-dom';

export default function Confirmation() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  return (
    <div className="text-center py-16 px-4">
      <div className="text-6xl mb-3 animate-bounce">🎉</div>
      <h2 className="text-xl font-bold text-green-600 mb-2">✅ Order Confirmed!</h2>
      <p className="text-xs text-muted-foreground font-mono text-primary mb-4">{orderNumber}</p>
      
      <div className="flex justify-center gap-3 mb-6">
        {['✅', '📦', '🚚', '🏠'].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-xl">{s}</div>
            <div className="text-[8px] text-muted-foreground">{['Ordered', 'Processing', 'Shipped', 'Delivered'][i]}</div>
          </div>
        ))}
      </div>

      <button className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all" onClick={() => navigate('/shop')}>
        🛍️ Continue Shopping
      </button>
    </div>
  );
}
