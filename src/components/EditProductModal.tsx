import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Trash2, Video, Tag, Eye, EyeOff } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
  const { setProducts, isDarkMode, deleteProduct } = useApp();
  const [formData, setFormData] = useState({ ...product });

  const handleSave = () => {
    setProducts(prev => prev.map(p => p.id === product.id ? formData : p));
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(product.id);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-charcoal/60 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={cn("w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl", isDarkMode ? "bg-charcoal border border-ivory/10" : "bg-ivory border border-gold/10")}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">Instant Edit</h3>
          <button onClick={onClose} className="p-2 bg-charcoal/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">Price (₹)</label>
            <input 
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              className={cn("w-full border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-gold", isDarkMode ? "bg-ivory/5 border-ivory/10" : "bg-ivory-dark border-gold/20")}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-charcoal/5 rounded-2xl">
            <input 
              type="checkbox" 
              id="modalIsHidden"
              checked={formData.isHidden}
              onChange={e => setFormData({ ...formData, isHidden: e.target.checked })}
              className="w-5 h-5 accent-gold"
            />
            <label htmlFor="modalIsHidden" className="text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2">
              {formData.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Hidden Product
            </label>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-xl bg-gold/10 text-gold font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <Tag className="w-4 h-4" />
              Add Badge
            </button>
            <button onClick={handleDelete} className="p-3 rounded-xl bg-red-50 text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 bg-charcoal text-ivory py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </motion.div>
    </motion.div>
  );
}
