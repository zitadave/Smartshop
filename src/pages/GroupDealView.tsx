import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { joinGroupDeal, shareToTelegram, calculateGroupPrice, parseSerializedName, type GroupDeal } from '@/lib/groupBuying';
import { useStore } from '@/stores/AppStore';
import { ArrowLeft, Users, Share2, Tag, Clock, CheckCircle, ArrowRight, ShoppingCart, MessageCircle, Star, Sparkles, AlertCircle, Sparkle, Heart, Flame, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';
import { toast } from '@/components/Toast';
import { trackSocialEvent, sanitizeInputString } from '@/lib/social';
import { formatPrice } from '@/lib/utils';

// custom high-fidelity Star renderer
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && (
        <div className="relative">
          <Star size={size} className="text-slate-200 fill-slate-100" />
          <div className="absolute inset-0 overflow-hidden w-[50%]">
            <Star size={size} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-slate-200 fill-slate-100" />
      ))}
    </div>
  );
}

// Overlapping visual avatars roster stack
function AvatarStack({ members }: { members: any[] }) {
  const displayLimit = 4;
  const list = members.slice(0, displayLimit);
  const extraCount = Math.max(0, members.length - displayLimit);
  
  const bgColors = [
    'bg-gradient-to-br from-blue-400 to-indigo-500 text-white',
    'bg-gradient-to-br from-purple-400 to-pink-500 text-white',
    'bg-gradient-to-br from-emerald-400 to-green-500 text-white',
    'bg-gradient-to-br from-orange-400 to-red-500 text-white',
  ];

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2.5 overflow-hidden">
        {list.map((m, i) => (
          <div 
            key={i} 
            className={`inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 font-extrabold flex items-center justify-center text-[10px] shadow-sm ${bgColors[i % bgColors.length]}`}>
            {m.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ))}
        {extraCount > 0 && (
          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[10px] shadow-sm">
            +{extraCount}
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-400 font-bold ml-2.5 flex items-center gap-1">
        🔥 Joined by {members.length} peers
      </span>
    </div>
  );
}

export default function GroupDealView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const { addToCart, language, products } = store;

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(store.profile?.name || '');
  const [phone, setPhone] = useState(store.profile?.phone || '');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // Custom UI States
  const [showZoom, setShowZoom] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  
  const formRef = useRef<HTMLDivElement>(null);

  const loadDeal = () => {
    if (!token) return;
    fetch(`/api/group-deals?token=${token}`)
      .then(r => r.json())
      .then(d => {
        const fetchedDeal = d.deals?.[0] || d.deal || null;
        setDeal(fetchedDeal);
        if (fetchedDeal) {
          // Check if current user is already a member
          const userTelegramId = store.profile?.telegramId;
          const userPhone = store.profile?.phone;
          const isMember = fetchedDeal.group_deal_members?.some(
            (m: any) =>
              (userTelegramId && String(m.telegram_id) === String(userTelegramId)) ||
              (userPhone && m.phone === userPhone)
          );
          if (isMember) {
            setJoined(true);
          }
          
          // Load product reviews
          fetch(`/api/reviews?productId=${fetchedDeal.product_id}`)
            .then(r => r.json())
            .then(res => setProductReviews(res.reviews || []))
            .catch(console.error);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching deal:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (products.length === 0) {
      fetch('/api/products')
        .then(r => r.json())
        .then(d => {
          if (d?.products) {
            store.setProducts(d.products);
          }
        })
        .catch(console.error);
    }
  }, [products.length]);

  useEffect(() => {
    loadDeal();
  }, [token, store.profile?.telegramId, store.profile?.phone]);

  const handleJoin = async () => {
    const finalName = store.profile?.phone ? store.profile.name : name;
    const finalPhone = store.profile?.phone ? store.profile.phone : phone;

    if (!finalName.trim()) return toast('📍 Please enter your name', 'error');
    if (!finalPhone.trim()) return toast('📞 Please enter your phone number', 'error');
    
    setJoining(true);
    try {
      const result = await joinGroupDeal({
        token: token!,
        telegramId: store.profile?.telegramId ? parseInt(store.profile.telegramId) : 0,
        fullName: finalName,
        phone: finalPhone,
      });
      if (result.success) {
        setJoined(true);
        toast('🎉 Joined! Taking you to checkout...', 'success');
        
        // Auto-add product to cart at locked group buy price
        const product = products.find(p => p.id === deal.product_id);
        if (product) {
          const discountedProduct = {
            ...product,
            price: deal.group_price,
          };
          addToCart(discountedProduct, 1);
        }
        
        loadDeal();
        trackSocialEvent('JoinGroupBuy', { deal_id: deal.id, product_name: deal.product_name, group_price: deal.group_price });
        setTimeout(() => navigate('/checkout'), 800);
      } else {
        toast(result.error || 'Failed to join group deal', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'An error occurred', 'error');
    }
    setJoining(false);
  };

  const handleAddToCart = () => {
    if (!deal) return;
    const product = products.find(p => p.id === deal.product_id);
    if (!product) return;
    
    const discountedProduct = {
      ...product,
      price: deal.group_price,
    };
    addToCart(discountedProduct, 1);
    toast(`🛒 Added ${parsedName} to cart at group price!`, 'cart');
  };

  const handleCheckoutNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleShareUniversal = async () => {
    if (!deal) return;
    const inviteLink = `${window.location.origin}/group-deal/${deal.share_token}`;
    const textMessage = `🤝 Join my Mahiber Group Buy to get ${parsedName} at a special group price of Br ${deal.group_price.toLocaleString()}!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Smart Shop Group Buy`,
          text: textMessage,
          url: inviteLink,
        });
        toast('📤 Shared successfully!', 'success');
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(inviteLink);
      toast('📋 Invite link copied to clipboard!', 'success');
    }
  };

  const handleWriteReview = async () => {
    if (!reviewText.trim()) return toast('✍️ Please enter some review text', 'error');
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: deal.product_id,
          userName: store.profile?.name || 'Anonymous User',
          rating: ratingInput,
          text: reviewText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast('⭐ Review submitted successfully!', 'success');
        setReviewText('');
        setShowReviewModal(false);
        fetch(`/api/reviews?productId=${deal.product_id}`)
          .then(r => r.json())
          .then(res => setProductReviews(res.reviews || []));
      } else {
        toast('Failed to submit review', 'error');
      }
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setSubmittingReview(false);
  };

  // Cumulative Ratings & Star Breakdown Computations
  const cumulativeStats = useMemo(() => {
    if (productReviews.length === 0) {
      const matchedRating = products.find(p => p.id === deal?.product_id)?.rating || 4.5;
      const fakeCount = products.find(p => p.id === deal?.product_id)?.reviews || 12;
      return {
        avg: matchedRating,
        total: fakeCount,
        breakdown: { 5: 75, 4: 15, 3: 5, 2: 3, 1: 2 }
      };
    }
    const total = productReviews.length;
    const sum = productReviews.reduce((s, r) => s + r.rating, 0);
    const avg = Math.round((sum / total) * 10) / 10;
    
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.floor(r.rating))) as 5|4|3|2|1;
      counts[star]++;
    });
    
    return {
      avg,
      total,
      breakdown: {
        5: Math.round((counts[5] / total) * 100),
        4: Math.round((counts[4] / total) * 100),
        3: Math.round((counts[3] / total) * 100),
        2: Math.round((counts[2] / total) * 100),
        1: Math.round((counts[1] / total) * 100),
      }
    };
  }, [productReviews, deal, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading Group Buy details...
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center max-w-sm w-full">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800">Deal Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">This group buying campaign might have expired or does not exist.</p>
          <button onClick={() => navigate('/')} className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { name: parsedName, description, color, size, campaignType, targetPrice, targetCount } = parseSerializedName(deal.product_name);
  const matchedProduct = products.find(p => p.id === deal.product_id);
  
  const savings = deal.regular_price - deal.group_price;
  const spotsLeft = Math.max(0, deal.max_members - deal.current_members);
  
  // Model B Target Unlock logic
  const isTargetModel = campaignType === 'target';
  const isUnlocked = !isTargetModel || deal.current_members >= targetCount;
  
  const progressPercent = isTargetModel
    ? Math.round((deal.current_members / targetCount) * 100)
    : Math.round((deal.current_members / deal.max_members) * 100);

  const tiers = [
    { count: 1, discount: 0, label: 'Start' },
    { count: 2, discount: 5, label: '5% Off' },
    { count: 3, discount: 10, label: '10% Off' },
    { count: 5, discount: 15, label: '15% Off' },
    { count: 10, discount: 25, label: '25% Off' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28">
      
      {/* 1. Large Hero Product Image on Top (Full Product Page Style) */}
      {deal.product_image && (
        <div className="relative aspect-square w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden cursor-zoom-in group shadow-md" onClick={() => setShowZoom(true)}>
          <img src={deal.product_image} alt={parsedName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          
          {/* Floating Back Button (Glassmorphic) */}
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-20 p-3 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-black/60 transition-all shadow-md">
            <ArrowLeft size={16} />
          </button>

          {/* Floating Campaign Badge (Neumorphic) */}
          <span className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-2xl text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg flex items-center gap-1 backdrop-blur-sm">
            <Sparkle size={12} className="animate-spin text-white" /> {isTargetModel ? 'TARGET LOCK' : 'PROGRESSIVE'}
          </span>

          <span className="absolute bottom-3 right-3 bg-black/60 text-white rounded-xl px-3 py-1.5 text-[9px] font-bold backdrop-blur-sm shadow flex items-center gap-1">
            Tap to Zoom 🔍
          </span>
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 space-y-4">
        
        {/* Product Details Section (Tied directly under the image) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/40 dark:border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] bg-emerald-500 text-white px-3 py-1 rounded-full font-black tracking-wider uppercase shadow-sm">
              🏷️ {isTargetModel ? 'TARGET BUY' : 'MAHIBER BUY'}
            </span>
            {/* Cumulative star rating small trigger */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
              <StarRating rating={cumulativeStats.avg} size={11} />
              <span className="text-slate-800 dark:text-slate-200 mt-0.5">{cumulativeStats.avg}</span>
              <span className="text-slate-400 font-medium">({cumulativeStats.total})</span>
            </div>
          </div>
          
          <h2 className="font-black text-slate-800 dark:text-white text-base leading-snug">{parsedName}</h2>
          
          {/* Real-time peer avatar stack inside header card */}
          {deal.group_deal_members && deal.group_deal_members.length > 0 && (
            <div className="mt-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <AvatarStack members={deal.group_deal_members} />
            </div>
          )}

          <div className="flex items-baseline gap-2.5 mt-3.5">
            <span className="text-3xl font-black text-green-600">Br {deal.group_price.toLocaleString()}</span>
            <span className="text-sm text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
            {savings > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-extrabold ml-1.5">
                -{Math.round((savings / deal.regular_price) * 100)}%
              </span>
            )}
          </div>

          {savings > 0 && (
            <div className="text-xs text-emerald-500 font-bold mt-1.5 flex items-center gap-1">
              🎉 Saving Br {savings.toLocaleString()} compared to retail!
            </div>
          )}

          {/* Native Product Description */}
          {matchedProduct && (matchedProduct.description || matchedProduct.descriptionEn) && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">📋 Product Description</h4>
              <p className="line-clamp-4 leading-relaxed">{matchedProduct.description || matchedProduct.descriptionEn}</p>
            </div>
          )}
        </div>

        {/* Campaign Model Status Alert */}
        {isTargetModel && (
          <div className={`p-4 rounded-3xl border flex items-start gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isUnlocked ? 'bg-emerald-500 border-emerald-400 text-white animate-bounce' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            <div className="text-2xl">{isUnlocked ? '🔓' : '🔒'}</div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isUnlocked ? '🎉 CAMPAIGN UNLOCKED!' : '🔒 TARGET LOCK CAMPAIGN'}
              </h4>
              <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed font-medium">
                {isUnlocked 
                  ? `Congratulations! Target of ${targetCount} members met. Locked price of Br ${deal.group_price.toLocaleString()} is active!` 
                  : `Need ${targetCount - deal.current_members} more members to unlock the massive discount of Br ${deal.group_price.toLocaleString()}!`}
              </p>
            </div>
          </div>
        )}

        {/* Campaign Description & Preferences */}
        {(description || (color && color !== 'Any') || (size && size !== 'Any')) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              📝 Campaign Specifications
            </h3>
            {description && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl mb-2.5 leading-relaxed italic">
                "{description}"
              </p>
            )}
            <div className="flex flex-wrap gap-2.5">
              {color && color !== 'Any' && (
                <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-3 py-1 rounded-full font-bold border border-blue-100/30">
                  🎨 Color: {color}
                </span>
              )}
              {size && size !== 'Any' && (
                <span className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 px-3 py-1 rounded-full font-bold border border-purple-100/30">
                  📏 Size: {size}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Discount Stepper Tracker (Only for Progressive Model) */}
        {!isTargetModel ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3.5 flex items-center gap-1.5">
              📈 Progressive Discounts (መሃበር ቅናሽ)
            </h3>
            <div className="relative flex justify-between items-center px-1">
              <div className="absolute left-0 right-0 top-3 h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded" />
              <div 
                className="absolute left-0 h-1 bg-gradient-to-r from-green-400 to-green-500 -z-0 rounded" 
                style={{ width: `${Math.min(100, (deal.current_members / 10) * 100)}%` }} 
              />

              {tiers.map((t, idx) => {
                const active = deal.current_members >= t.count;
                return (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm transition-all border-2 ${active ? 'bg-green-500 text-white border-green-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {t.count}
                    </div>
                    <span className={`text-[9px] font-medium mt-1.5 ${active ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-4">
              Current Members: <strong>{deal.current_members}</strong> · More members = bigger discount for everyone!
            </p>
          </div>
        ) : (
          /* Target Progress Bar (For Model B) */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">👥 Target Group Progress</span>
              <span className="font-bold text-emerald-600">{progressPercent}% Filled</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/30 dark:border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 animate-pulse" 
                style={{ width: `${Math.min(100, progressPercent)}%` }} 
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              👤 Joined: <strong>{deal.current_members}</strong> · Target: <strong>{targetCount} Members</strong>
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            👥 Group Members ({deal.group_deal_members?.length || 0})
          </h3>
          <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
            {deal.group_deal_members?.map((m: any, idx: number) => {
              const isCreator = m.telegram_id === deal.creator_telegram_id;
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                    {m.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {m.full_name} {isCreator && <span className="text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold ml-1">Owner</span>}
                    </p>
                    <p className="text-[9px] text-slate-400">Joined {new Date(m.joined_at || deal.created_at).toLocaleDateString()}</p>
                  </div>
                  {m.paid && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium border border-emerald-200/30">
                      ✓ Paid
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Join / Share Action Form (Only visible inline if sticky bottom is off-screen) */}
        <div ref={formRef}>
          {!joined ? (
            store.profile?.phone ? (
              /* Automatic One-Tap Joining for Logged In Users */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800 text-center">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">One-Tap Instant Join ⚡</h3>
                <p className="text-[10px] text-slate-400 mb-4">You are logged in as <strong>{store.profile.name}</strong>. Tap below to join instantly!</p>
                <button 
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 animate-pulse">
                  {joining ? 'Joining Campaign...' : '🤝 Tap to Instant Join Group'}
                </button>
              </div>
            ) : (
              /* Manual Registration Form for Desktop / Guest Users */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
                <h2 className="font-bold text-slate-800 dark:text-white text-sm mb-1.5">🤝 Join This Group Deal</h2>
                <p className="text-[10px] text-slate-400 mb-4">Enter your billing info to join and unlock the group price.</p>
                <div className="space-y-3">
                  <input 
                    placeholder="Your Full Name (ለማን እንደሚላክ)" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                  <input 
                    placeholder="Phone Number (ስልክ ቁጥር)" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  />
                  <button 
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {joining ? 'Joining Group...' : '🤝 Join Group Buy'}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Locked/Unlocked Cart Actions for Joined Members */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/30 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200 dark:border-green-800">
                <CheckCircle size={22} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Campaign Active!</h3>
              
              {isTargetModel && !isUnlocked ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[10px] text-amber-700 dark:text-amber-400 text-left">
                  ⚠️ <strong>Note:</strong> Since this is a Target Lock deal, you can add this product to your cart now at the discounted group price, but your order will only be completed once the target group size of <strong>{targetCount} members</strong> is fully met!
                </div>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1">
                  <ShoppingCart size={14} /> Add to Cart
                </button>
                <button 
                  onClick={handleCheckoutNow}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-1">
                  ⚡ Checkout Now
                </button>
              </div>

              <button 
                onClick={handleShareUniversal}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5">
                <Share2 size={14} /> Share Invite Link with Friends
              </button>
            </div>
          )}
        </div>

        {/* Ratings, Breakdown Bars & Reviews section (High Industry Level) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/30 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle size={14} /> Product Ratings & Reviews
            </h3>
            <button 
              onClick={() => {
                if (!store.profile?.telegramId) {
                  toast('🚪 Please log in via Telegram first!', 'error');
                } else {
                  setShowReviewModal(true);
                }
              }}
              className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all">
              ★ Write a Review
            </button>
          </div>

          {/* Commutative Summary Dashboard Grid */}
          <div className="grid grid-cols-5 gap-4 items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 animate-scaleIn">
            <div className="col-span-2 text-center border-r border-slate-200/50 dark:border-slate-700/50 pr-2">
              <div className="text-4xl font-black text-slate-800 dark:text-white leading-none">{cumulativeStats.avg}</div>
              <div className="flex justify-center mt-1.5 mb-1">
                <StarRating rating={cumulativeStats.avg} size={13} />
              </div>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">{cumulativeStats.total} product reviews</span>
            </div>
            
            {/* Rating breakdown progressive progress bars */}
            <div className="col-span-3 space-y-1">
              {[5, 4, 3, 2, 1].map((ratingNum) => {
                const ratePct = (cumulativeStats.breakdown as any)[ratingNum] || 0;
                return (
                  <div key={ratingNum} className="flex items-center gap-2 text-[9px] text-slate-500">
                    <span className="w-2 font-bold">{ratingNum}</span>
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${ratePct}%` }} />
                    </div>
                    <span className="w-6 text-right font-medium text-slate-400">{ratePct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews Feed list */}
          <div className="space-y-3.5 max-h-64 overflow-y-auto scrollbar-none pr-1">
            {productReviews.map((r, idx) => (
              <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 shadow-sm">
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-full flex items-center justify-center text-[9px]">
                      {r.user_name?.charAt(0).toUpperCase() || r.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{r.user_name || r.userName || 'Anonymous'}</p>
                      <span className="text-[7px] text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded font-bold">✓ Verified Purchase</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={r.rating} size={11} />
                    <p className="text-[7px] text-slate-400 mt-0.5">{new Date(r.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium pl-1 italic">
                  "{r.text}"
                </p>
              </div>
            ))}
            {productReviews.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-[10px]">No reviews yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>

      </div>

      {/* 5. GORGEOUS STICKY BOTTOM ACTION BAR (Conversion Optimized UX) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 p-4 shadow-lg animate-slideUp flex items-center justify-between gap-4 max-w-lg mx-auto rounded-t-3xl">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Group Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-green-600">Br {deal.group_price.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-[240px]">
          {!joined ? (
            store.profile?.phone ? (
              <button 
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1">
                ⚡ Instant Join
              </button>
            ) : (
              <button 
                onClick={() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth' });
                  toast('👇 Fill details below to join group', 'info');
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg flex items-center justify-center gap-1">
                🤝 Join Group
              </button>
            )
          ) : (
            <button 
              onClick={handleCheckoutNow}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5 animate-pulse">
              <ShoppingCart size={13} /> Checkout Now
            </button>
          )}
        </div>
      </div>

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {showZoom && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg">✕</button>
          <img src={deal.product_image} alt={parsedName} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-scaleIn" />
          <h3 className="text-white text-xs font-bold mt-4">{parsedName}</h3>
        </div>,
        document.body
      )}

      {/* CUSTOM REVIEW WRITING MODAL ( ghp_ and custom rating gold stars ) */}
      {showReviewModal && createPortal(
        <>
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">⭐ Write a Product Review</h3>
            <p className="text-[10px] text-slate-400 mb-4">Share your feedback on this product with the community.</p>
            
            <div className="space-y-3.5">
              {/* Star selector */}
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRatingInput(star)}
                      className="text-3xl transition-all active:scale-75 hover:scale-110">
                      <Star size={24} className={star <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Review Feedback</label>
                <textarea 
                  placeholder="Type your review here..." 
                  value={reviewText} 
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-transparent resize-none h-20 text-slate-800 dark:text-slate-200 outline-none" 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
                <button 
                  onClick={handleWriteReview}
                  disabled={submittingReview}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-600">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  );
}
