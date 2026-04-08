import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useProducts } from '../context/ProductContext';
import { Search as SearchIcon, X, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Search() {
  const { searchQuery, setSearchQuery, storeConfig } = useApp();
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  return (
    <div className="min-h-screen bg-charcoal text-white p-6 space-y-8 pb-32">
      {/* Search Header */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Search</h2>
            <div className="w-8 h-1 bg-blue-500 rounded-full" />
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative group">
          <input
            type="text"
            autoFocus
            placeholder="Search luxury collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-medium placeholder:text-gray-600"
          />
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
            {searchQuery ? `${filteredProducts.length} Results Found` : 'Start typing to search'}
          </p>
          {searchQuery && filteredProducts.length > 0 && (
            <div className="w-12 h-[1px] bg-white/10" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white/5 border border-white/10 rounded-[2rem] p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                  <img 
                    src={product.image || undefined} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="w-2 h-2 fill-current" />
                        <span className="text-[8px] font-bold">{product.rating}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm truncate">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-black">₹{product.price.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {searchQuery && filteredProducts.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8 text-white/20" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-400">No results found</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Try different keywords</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      {!searchQuery && (
        <div className="space-y-4 pt-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Popular Categories</p>
          <div className="flex flex-wrap gap-2">
            {['T-Shirts', 'Shirts', 'Jeans', 'Accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-all"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
