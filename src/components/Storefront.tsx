import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Star, TrendingUp, Search, Mic, Camera, Share2, ArrowRight, ArrowLeft, Zap, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Storefront() {
  const { products, banners, storeConfig, searchQuery, setSearchQuery } = useApp();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !p.hidden
  );

  const activeBanners = banners.filter(b => b.active && b.season === storeConfig.theme);

  // Dynamic Banner Carousel logic
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.scrollTo({
        left: currentBannerIndex * bannerRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  }, [currentBannerIndex]);

  // Voice Search logic
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Support Hindi/English
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };
    recognition.start();
  };

  const categories = [
    { name: 'Men', icon: '🤵', color: 'bg-blue-100' },
    { name: 'Women', icon: '💃', color: 'bg-pink-100' },
    { name: 'Kids', icon: '👶', color: 'bg-yellow-100' },
    { name: 'Girls', icon: '👗', color: 'bg-purple-100' },
  ];

  const FlashSaleCountdown = ({ endTime }: { endTime: string }) => {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const timer = setInterval(() => {
        const end = new Date(endTime).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff <= 0) {
          clearInterval(timer);
          return;
        }

        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [endTime]);

    return (
      <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-red-200">
        <Clock className="w-3 h-3 animate-pulse" />
        <span className="text-[10px] font-black tracking-widest uppercase">
          Ends in {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Voice & Image Search Bar Overlay (if needed, but Layout has it) */}
      {/* We can add icons to the Layout's search bar instead, but let's add a secondary one here for Meesho feel */}
      <div className="px-4 -mt-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Say 'Lal Kurta' or upload photo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-24 text-sm shadow-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button 
              onClick={startVoiceSearch}
              className={cn("p-2 rounded-full transition-colors", isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-50 text-gray-400 hover:text-blue-600")}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-50 text-gray-400 rounded-full hover:text-blue-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Circles */}
      <div className="flex items-center gap-6 overflow-x-auto px-4 py-2 no-scrollbar">
        {categories.map((cat) => (
          <motion.button
            key={cat.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 min-w-[70px]"
          >
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-white", cat.color)}>
              {cat.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{cat.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Flash Sale Section */}
      {products.some(p => p.flashSale?.active) && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <Zap className="w-4 h-4 fill-red-600" />
              </div>
              <h3 className="text-lg font-black tracking-tighter uppercase text-red-600">Flash Sale</h3>
            </div>
            <FlashSaleCountdown endTime={products.find(p => p.flashSale?.active)?.flashSale?.endTime || ''} />
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {products.filter(p => p.flashSale?.active).map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="min-w-[160px] space-y-2 group">
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-red-100">
                  <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    -{Math.round(((product.originalPrice || 0) - product.price) / (product.originalPrice || 1) * 100)}% OFF
                  </div>
                </div>
                <div className="px-1">
                  <h4 className="text-[10px] font-bold text-gray-900 truncate">{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-600">₹{product.price.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="px-4 relative group">
        <div 
          ref={bannerRef}
          className="flex overflow-x-hidden no-scrollbar snap-x snap-mandatory rounded-[2.5rem] shadow-2xl"
        >
          {activeBanners.length > 0 ? (
            activeBanners.map((banner, index) => (
              <motion.div
                key={banner.id}
                className="relative min-w-full aspect-[9/16] overflow-hidden snap-start"
              >
                <img
                  src={banner.image || undefined}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 space-y-2">
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] w-fit"
                  >
                    {banner.season} Collection
                  </motion.span>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black text-white leading-none tracking-tighter uppercase"
                  >
                    {banner.title}
                  </motion.h2>
                  <p className="text-gray-300 text-sm font-medium">
                    {banner.subtitle}
                  </p>
                  <button className="mt-4 bg-white text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors shadow-xl flex items-center gap-2 w-fit">
                    Shop Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="w-full aspect-[9/16] bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-400 font-bold italic">
              No active banners for {storeConfig.theme}
            </div>
          )}
        </div>
        
        {/* Carousel Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBannerIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  currentBannerIndex === i ? "w-8 bg-white" : "w-2 bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-black tracking-tighter uppercase">New Arrivals</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {filteredProducts.length} Items
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group"
            >
              <Link to={`/product/${product.id}`} className="block space-y-3">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                  <img
                    src={product.image || undefined}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  {product.badge && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                      {product.badge}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingBag className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{product.category}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                      <span className="text-[8px] font-bold text-gray-400">4.9</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate">{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="text-[10px] font-bold text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-[8px] font-serif italic text-gray-300 select-none pt-1">
                    Rahbar Signature
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold text-sm italic">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
