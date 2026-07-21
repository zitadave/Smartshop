import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/stores/AppStore';
import { stars, generateId, cn } from '@/lib/utils';
import { Camera, Star, Trash2, ImagePlus, X, Check, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoReviewProps {
  productId: number;
  existingReviews?: any[];
  onReviewAdded?: () => void;
}

export default function PhotoReviewSection({ productId, existingReviews, onReviewAdded }: PhotoReviewProps) {
  const [showForm, setShowForm] = useState(false);
  const { photoReviews, addPhotoReview, profile } = useStore();

  const productReviews = photoReviews.filter(r => r.productId === productId);
  const allReviews = [...(existingReviews || []), ...productReviews];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <Camera size={14} /> Photo Reviews ({allReviews.length})
        </h3>
        <button
          className="text-[9px] bg-primary text-white px-3 py-1 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Review'}
        </button>
      </div>

      {showForm && (
        <ReviewForm
          productId={productId}
          onSubmitted={() => { setShowForm(false); onReviewAdded?.(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {allReviews.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-xl text-xs text-muted-foreground">
          <Camera size={24} className="mx-auto mb-1 opacity-40" />
          No reviews yet. Be the first!
        </div>
      ) : (
        <div className="space-y-2">
          {allReviews.slice(0, 6).map((review: any, idx: number) => (
            <ReviewCard key={review.id || idx} review={review} />
          ))}
          {allReviews.length > 6 && (
            <button className="text-[10px] text-primary font-semibold w-full text-center py-2">
              View all {allReviews.length} reviews →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ productId, onSubmitted, onCancel }: { productId: number; onSubmitted: () => void; onCancel: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addPhotoReview, profile } = useStore();

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files).slice(0, 3)) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      }
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() || rating === 0) return;
    setSubmitting(true);
    try {
      const review = {
        id: generateId(),
        productId,
        userName: profile.name || 'Anonymous',
        rating,
        text: text.trim(),
        images: images.filter(img => img.startsWith('data:')),
        createdAt: new Date().toISOString(),
        verified: true,
      };
      addPhotoReview(review);
      onSubmitted();
    } catch (err) {
      console.error('Submit failed:', err);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-muted/30 rounded-xl p-3 mb-3 border border-border/50">
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} className="transition-all hover:scale-110">
            <Star
              size={18}
              className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
            />
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">
          {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating <= 2 ? 'Poor' : ''}
        </span>
      </div>

      <textarea
        className="w-full p-2.5 border border-input rounded-lg text-xs bg-card resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Share your experience with this product..."
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={500}
      />
      <div className="text-[8px] text-muted-foreground text-right">{text.length}/500</div>

      {/* Image Upload */}
      <div className="flex gap-2 mt-1.5 flex-wrap">
        {images.map((img, i) => (
          <div key={i} className="relative">
            <img src={img} className="w-14 h-14 rounded-lg object-cover border border-border" />
            <button
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
              onClick={() => setImages(images.filter((_, j) => j !== i))}
            >
              <X size={8} />
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <button
            className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader size={16} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-2.5 bg-primary text-white rounded-lg text-[10px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          onClick={handleSubmit}
          disabled={!text.trim() || submitting || rating === 0}
        >
          {submitting ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          className="px-4 py-2.5 border border-border rounded-lg text-[10px] text-muted-foreground hover:bg-muted transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [fullImg, setFullImg] = useState<string | null>(null);
  const hasImages = review.images && review.images.length > 0;
  const images = hasImages ? (typeof review.images === 'string' ? JSON.parse(review.images) : review.images) : [];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {review.userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-[10px] font-semibold flex items-center gap-1">
              {review.userName || 'Anonymous'}
              {review.verified && <span className="text-[8px] text-green-600 bg-green-50 px-1 rounded">✓</span>}
            </div>
            <div className="text-[8px] text-amber-500">{stars(review.rating)}</div>
          </div>
        </div>
        <span className="text-[8px] text-muted-foreground">{timeAgo(review.createdAt)}</span>
      </div>

      {review.text && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{review.text}</p>
      )}

      {images.length > 0 && (
        <div className="mt-1.5 relative">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                className="w-16 h-16 rounded-lg object-cover cursor-pointer border border-border hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={() => setFullImg(img)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full image modal */}
      {fullImg && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setFullImg(null)}>
          <img src={fullImg} className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
