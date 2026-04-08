import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import CheckoutModal from './CheckoutModal';

export default function Bag() {
  const { cart, removeFromCart, addToCart, isDarkMode } = useApp();
  const [showCheckout, setShowCheckout] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-charcoal/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 opacity-20" />
        </div>
        <h2 className="text-2xl font-bold">Your Bag is Empty</h2>
        <p className="text-charcoal/50 mt-2 max-w-[200px] mx-auto">Start shopping to add premium pieces to your collection.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32">
      <h2 className="text-3xl font-bold mb-8">Your Bag</h2>
      
      <div className="space-y-6">
        {cart.map((item) => (
          <motion.div 
            layout
            key={`${item.id}-${item.selectedColor}`}
            className={cn("p-4 rounded-[2rem] flex gap-4 border", isDarkMode ? "bg-ivory/5 border-ivory/10" : "bg-charcoal/5 border-gold/10")}
          >
            <img 
              src={item.image || undefined} 
              alt={item.name} 
              className="w-24 h-24 rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold truncate pr-2">{item.name}</h4>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3">{item.selectedColor}</p>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-gold">₹{item.price.toLocaleString()}</span>
                <div className="flex items-center gap-3 bg-ivory rounded-full p-1 border border-gold/20">
                  <button className="p-1"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button className="p-1"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className={cn("fixed bottom-24 left-6 right-6 p-6 rounded-[2.5rem] shadow-2xl z-40", isDarkMode ? "bg-charcoal border border-ivory/10" : "bg-ivory border border-gold/10")}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest opacity-50">Total Amount</span>
          <span className="text-2xl font-bold text-gold">₹{total.toLocaleString()}</span>
        </div>
        <button 
          onClick={() => setShowCheckout(true)}
          className="w-full bg-charcoal text-ivory py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
        >
          Proceed to Checkout
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal 
            items={cart.map(item => ({ product: item, quantity: item.quantity, color: item.selectedColor }))}
            total={total}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
