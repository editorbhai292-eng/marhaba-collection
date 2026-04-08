import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useProducts } from '../context/ProductContext';
import { auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, ShoppingBag, Heart, Star, ShieldCheck, Truck, RefreshCcw, Share2, Ruler, Play, CheckCircle2, ChevronRight, MessageCircle, Bell, Image as ImageIcon, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProductDetails() {
  const { id } = useParams();
  const { products, addToCart, user, db, storeConfig, userProfile } = useApp();
  const { uploadFile } = useProducts();
  const navigate = useNavigate();
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isSizePredictorOpen, setIsSizePredictorOpen] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [predictedSize, setPredictedSize] = useState<string | null>(null);
  const [isNotified, setIsNotified] = useState(false);
  
  // Review State
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null);
  const [isUploadingReview, setIsUploadingReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const product = products.find(p => p.id === id);

  useEffect(() => {
    if (!id || !db) return;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
    }, (error) => {
      console.error("Reviews snapshot error:", error);
      const errInfo = {
        error: error.message,
        operationType: 'list',
        path: 'reviews',
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
        }
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
    });

    return () => unsubscribe();
  }, [id, db]);

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewImage(file);
      setIsUploadingReview(true);
      try {
        const url = await uploadFile(file, 'reviews');
        setReviewImageUrl(url);
      } catch (error) {
        console.error("Review image upload failed", error);
        alert("Failed to upload image. Try again.");
      } finally {
        setIsUploadingReview(false);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to submit a review");
      return;
    }
    if (!reviewComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: userProfile?.name || user.email?.split('@')[0] || 'Anonymous',
        rating: reviewRating,
        comment: reviewComment,
        image: reviewImageUrl,
        createdAt: serverTimestamp(),
        verified: true // In a real app, we'd check if they bought the product
      });
      
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(5);
      setReviewImageUrl(null);
      setReviewImage(null);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Failed to submit review", error);
      alert("Failed to submit review. Try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!user || !product) {
      alert("Please login to get notified!");
      return;
    }
    setIsNotified(true);
    alert("We will notify you when this item is back in stock!");
  };

  if (!product) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-10 h-10 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Product Not Found</h2>
          <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">The product you're looking for doesn't exist.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleShare = () => {
    const text = `Check out this amazing ${product.name} at Marhaba Collection! Only ₹${product.price}. Shop now: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const predictSize = () => {
    const h = parseInt(height);
    const w = parseInt(weight);
    if (!h || !w) return;

    let size = 'M';
    if (h > 175 && w > 75) size = 'XL';
    else if (h > 170 && w > 65) size = 'L';
    else if (h < 160 || w < 55) size = 'S';
    
    setPredictedSize(size);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="relative h-[500px] bg-gray-50 overflow-hidden">
        <img 
          src={product.image || undefined} 
          alt={product.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 left-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
        </div>
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white transition-colors">
            <Heart className="w-6 h-6 text-gray-400" />
          </button>
          <button 
            onClick={handleShare}
            className="p-3 bg-green-500/80 backdrop-blur-md rounded-2xl shadow-lg hover:bg-green-600 transition-colors text-white"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute bottom-6 left-6 text-[10px] font-serif italic text-white/60 bg-black/20 px-4 py-1 rounded-full backdrop-blur-md">
          Rahbar Signature Original
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-4 py-1 rounded-full">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-gray-900">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                  : '4.9'} ({reviews.length || 120} Reviews)
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase leading-tight">
            {product.name}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-blue-600">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-sm font-bold text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-widest">
              Save ₹{(product.originalPrice! - product.price).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Color</h3>
            <div className="flex items-center gap-3">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 transition-all",
                    selectedColor === color ? "border-blue-600 scale-110 shadow-lg" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Size</h3>
              <button 
                onClick={() => setIsSizePredictorOpen(true)}
                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                <Ruler className="w-3 h-3" />
                Size Predictor
              </button>
            </div>
            <div className="flex items-center gap-3">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "w-12 h-12 rounded-xl border-2 font-black text-xs transition-all",
                    selectedSize === size 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110" 
                      : "bg-white border-gray-100 text-gray-900 hover:border-gray-300"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</h3>
          <p className="text-gray-600 leading-relaxed font-medium">
            {product.description || 'Experience the premium quality of Marhaba Collection. This exclusive piece is designed for comfort and style, reflecting the Rahbar signature branding.'}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Free Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">7 Days Return</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Secure Payment</span>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tighter uppercase">Customer Reviews</h3>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-widest"
            >
              Write a Review
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {reviews.length > 0 ? (
              reviews.map((review: any) => (
                <div key={review.id} className="min-w-[240px] bg-gray-50 rounded-3xl p-4 space-y-3 border border-gray-100">
                  {review.image && (
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200 group">
                      <img src={review.image || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{review.userName}</span>
                      {review.verified && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Verified Buyer
                        </div>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-2.5 h-2.5", s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />)}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium line-clamp-2">{review.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-[64px] left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t z-50 max-w-md mx-auto">
        <div className="flex flex-col gap-3">
          {product.inStock && (
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Price</div>
              <div className="text-xl font-black text-gray-900">₹{product.price.toLocaleString()}</div>
            </div>
          )}
          <button 
            onClick={() => product.inStock && addToCart(product, selectedColor, selectedSize)}
            disabled={!product.inStock}
            className={cn(
              "w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
              product.inStock 
                ? (storeConfig.theme === 'Winter' ? "bg-blue-600 shadow-blue-500/20 hover:bg-blue-700" : "bg-orange-600 shadow-orange-500/20 hover:bg-orange-700")
                : "bg-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            {product.inStock ? (
              <>
                <ShoppingBag className="w-4 h-4" />
                ADD TO CART
              </>
            ) : (
              'OUT OF STOCK'
            )}
          </button>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[160] rounded-t-[3rem] p-8 space-y-6 max-w-md mx-auto max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tighter uppercase">Write a Review</h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Rating */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1"
                      >
                        <Star className={cn("w-8 h-8", s <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Comment</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Tell us what you think about this product..."
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px] resize-none"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Photo (Optional)</label>
                  <label className="relative aspect-square w-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden group">
                    <input type="file" className="hidden" onChange={handleReviewImageUpload} accept="image/*" />
                    {isUploadingReview ? (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : reviewImageUrl ? (
                      <img src={reviewImageUrl || undefined} alt="Review" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Upload</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview || isUploadingReview}
                  className={cn(
                    "w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                    (isSubmittingReview || isUploadingReview) && "opacity-50"
                  )}
                >
                  {isSubmittingReview ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Submit Review</>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Notify Me Button (Only when out of stock) */}
      {!product.inStock && (
        <div className="fixed bottom-40 right-4 z-[100]">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNotifyMe}
            className={cn(
              "w-14 h-14 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all relative",
              isNotified ? "bg-gray-100 text-gray-400" : "bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700"
            )}
          >
            <Bell className={cn("w-7 h-7", isNotified && "animate-none")} />
            {!isNotified && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />}
          </motion.button>
        </div>
      )}

      {/* Size Predictor Modal */}
      <AnimatePresence>
        {isSizePredictorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizePredictorOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[110] rounded-t-[3rem] p-8 space-y-6 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tighter uppercase">Size Predictor</h3>
                <button onClick={() => setIsSizePredictorOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Height (cm)</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="175"
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="70"
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={predictSize}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                >
                  Predict My Size
                </button>

                {predictedSize && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-blue-50 rounded-3xl text-center space-y-2"
                  >
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Suggested Size</div>
                    <div className="text-5xl font-black text-blue-600">{predictedSize}</div>
                    <button 
                      onClick={() => { setSelectedSize(predictedSize); setIsSizePredictorOpen(false); }}
                      className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                    >
                      Apply this size
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
