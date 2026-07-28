import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { joinGroupDeal, shareToTelegram, calculateGroupPrice, parseSerializedName, type GroupDeal } from '@/lib/groupBuying';
import { useStore } from '@/stores/AppStore';
import { ArrowLeft, Users, Share2, Tag, Clock, CheckCircle, ArrowRight, ShoppingCart, MessageCircle, Star, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from '@/components/Toast';
import { formatPrice, stars } from '@/lib/utils';

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

  const loadDeal = () => {
    if (!token) return;
    fetch(`/api/group-deals?token=${token}`)
      .then(r => r.json())
      .then(d => {
        const fetchedDeal = d.deals?.[0] || d.deal || null;
        setDeal(fetchedDeal);
        if (fetchedDeal) {
          // Check if current user is already a member
          const userTelegramId = store.telegramId;
          const userPhone = store.profile?.phone;
          const isMember = fetchedDeal.group_deal_members?.some(
            (m: any) =>
              (userTelegramId && m.telegram_id === userTelegramId) ||
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
    loadDeal();
  }, [token, store.telegramId, store.profile?.phone]);

  const handleJoin = async () => {
    // If logged in, automatically pull credentials
    const finalName = store.profile?.phone ? store.profile.name : name;
    const finalPhone = store.profile?.phone ? store.profile.phone : phone;

    if (!finalName.trim()) return toast('📍 Please enter your name', 'error');
    if (!finalPhone.trim()) return toast('📞 Please enter your phone number', 'error');
    
    setJoining(true);
    try {
      const result = await joinGroupDeal({
        token: token!,
        telegramId: store.telegramId || 0,
        fullName: finalName,
        phone: finalPhone,
      });
      if (result.success) {
        setJoined(true);
        toast('🎉 Successfully joined the group deal!', 'success');
        loadDeal();
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
    
    // Create copy with locked campaign price
    const discountedProduct = {
      ...product,
      price: deal.group_price, // lock the group buy price
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
        // user cancelled or share failed
      }
    } else {
      // Fallback: Copy link to clipboard
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
        // Reload reviews list
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

  // Progressive discount levels for display
  const tiers = [
    { count: 1, discount: 0, label: 'Start' },
    { count: 2, discount: 5, label: '5% Off' },
    { count: 3, discount: 10, label: '10% Off' },
    { count: 5, discount: 15, label: '15% Off' },
    { count: 10, discount: 25, label: '25% Off' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-slate-50 to-white">
      <div className="max-w-lg mx-auto p-4 pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white shadow-sm hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">🤝 ማህበር ግዢ (Group Buy)</h1>
            <p className="text-[10px] text-slate-500">Shop together with friends & unlock massive discounts</p>
          </div>
        </div>

        {/* Campaign Model Status Alert */}
        {isTargetModel && (
          <div className={`p-4 rounded-2xl mb-4 border flex items-start gap-3 shadow-sm ${isUnlocked ? 'bg-emerald-50 border-emerald-100 text-emerald-800 animate-bounce' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            <div className="text-2xl">{isUnlocked ? '🔓' : '🔒'}</div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide">
                {isUnlocked ? '🎉 CAMPAIGN UNLOCKED!' : '🔒 TARGET LOCK CAMPAIGN'}
              </h4>
              <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed">
                {isUnlocked 
                  ? `Congratulations! Target of ${targetCount} members met. Locked price of Br ${deal.group_price.toLocaleString()} is active!` 
                  : `Need ${targetCount - deal.current_members} more members to unlock the massive discount of Br ${deal.group_price.toLocaleString()}!`}
              </p>
            </div>
          </div>
        )}

        {/* Product Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
          <div className="flex gap-4">
            {deal.product_image && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border cursor-zoom-in relative group" onClick={() => setShowZoom(true)}>
                <img src={deal.product_image} alt={parsedName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded px-1 text-[8px] font-bold">Zoom 🔍</span>
              </div>
            )}
            <div className="flex-1">
              <span className="text-[9px] bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-bold">🛒 {deal.status.toUpperCase()} DEAL</span>
              <h2 className="font-bold text-slate-800 text-sm mt-1">{parsedName}</h2>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-green-600">Br {deal.group_price.toLocaleString()}</span>
                <span className="text-xs text-slate-400 line-through">Br {deal.regular_price.toLocaleString()}</span>
              </div>
              {savings > 0 && (
                <div className="text-xs text-emerald-500 font-semibold mt-1">
                  🎉 Save Br {savings.toLocaleString()} per unit!
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          {matchedProduct && (matchedProduct.description || matchedProduct.descriptionEn) && (
            <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 leading-relaxed">
              <h4 className="font-bold text-slate-700 mb-1">📋 Product Description</h4>
              <p className="line-clamp-3">{matchedProduct.description || matchedProduct.descriptionEn}</p>
            </div>
          )}
        </div>

        {/* Campaign Description & Preferences */}
        {(description || (color && color !== 'Any') || (size && size !== 'Any')) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              📝 Campaign Specifications
            </h3>
            {description && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2.5 leading-relaxed italic">
                "{description}"
              </p>
            )}
            <div className="flex flex-wrap gap-2.5">
              {color && color !== 'Any' && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold border border-blue-100">
                  🎨 Color Preference: {color}
                </span>
              )}
              {size && size !== 'Any' && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold border border-purple-100">
                  📏 Size Preference: {size}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Discount Stepper Tracker (Only for Progressive Model) */}
        {!isTargetModel ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              📈 Progressive Discounts (መሃበር ቅናሽ)
            </h3>
            <div className="relative flex justify-between items-center px-1">
              <div className="absolute left-0 right-0 top-3 h-1 bg-slate-100 -z-0 rounded" />
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
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-bold text-slate-700">👥 Target Group Progress</span>
              <span className="font-bold text-emerald-600">{progressPercent}% Filled</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, progressPercent)}%` }} 
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              👤 Joined: <strong>{deal.current_members}</strong> · Target: <strong>{targetCount} Members</strong>
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            👥 Group Members ({deal.group_deal_members?.length || 0})
          </h3>
          <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
            {deal.group_deal_members?.map((m: any, idx: number) => {
              const isCreator = m.telegram_id === deal.creator_telegram_id;
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                    {m.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {m.full_name} {isCreator && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.2 rounded font-semibold ml-1">Owner</span>}
                    </p>
                    <p className="text-[9px] text-slate-400">Joined {new Date(m.joined_at || deal.created_at).toLocaleDateString()}</p>
                  </div>
                  {m.paid && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                      ✓ Paid
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Join / Share Action Form */}
        {!joined ? (
          store.profile?.phone ? (
            /* Automatic One-Tap Joining for Logged In Users */
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
              <h3 className="font-bold text-slate-800 text-sm mb-1">One-Tap Instant Join ⚡</h3>
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm mb-1.5">🤝 Join This Group Deal</h2>
              <p className="text-[10px] text-slate-400 mb-4">Enter your billing info to join and unlock the group price.</p>
              <div className="space-y-3">
                <input 
                  placeholder="Your Full Name (ለማን እንደሚላክ)" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50" 
                />
                <input 
                  placeholder="Phone Number (ስልክ ቁጥር)" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-400 transition-colors bg-slate-50" 
                />
                <button 
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {joining ? 'Joining Group...' : '🤝 Join Group Buy'}
                </button>
              </div>
            </div>
          )
        ) : (
          /* Locked/Unlocked Cart Actions for Joined Members */
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Campaign Active!</h3>
            
            {isTargetModel && !isUnlocked ? (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-amber-700 text-left">
                ⚠️ <strong>Note:</strong> Since this is a Target Lock deal, you can add this product to your cart now at the discounted group price, but your order will only be completed once the target group size of <strong>{targetCount} members</strong> is fully met!
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button 
                onClick={handleAddToCart}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                <ShoppingCart size={14} /> Add to Cart
              </button>
              <button 
                onClick={handleCheckoutNow}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-1">
                ⚡ Checkout Now
              </button>
            </div>

            <button 
              onClick={handleShareUniversal}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <Share2 size={14} /> Share Invite Link with Friends
            </button>
          </div>
        )}

        {/* Rating and Reviews section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mt-4 border border-slate-100">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <MessageCircle size={14} /> Product Reviews ({productReviews.length})
            </h3>
            <button 
              onClick={() => {
                if (!store.telegramId) {
                  toast('🚪 Please log in via Telegram first!', 'error');
                } else {
                  setShowReviewModal(true);
                }
              }}
              className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1.5 rounded-lg">
              ★ Write a Review
            </button>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-none">
            {productReviews.map((r, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-800">{r.user_name || r.userName || 'Anonymous'}</span>
                  <span className="stars text-amber-500">{stars(r.rating)}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                  {r.text}
                </p>
                <p className="text-[8px] text-slate-400 text-right">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {productReviews.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-[10px]">No reviews yet. Be the first to share your thoughts!</p>
            )}
          </div>
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

      {/* CUSTOM REVIEW WRITING MODAL */}
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
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRatingInput(star)}
                      className="text-2xl transition-all active:scale-75">
                      {star <= ratingInput ? '★' : '☆'}
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
