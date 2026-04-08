import React, { useState, useEffect } from 'react';
import { useProducts, Product } from '../context/ProductContext';
import { X, Upload, Plus, Trash2, Check, Video, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, uploadFile } = useProducts();
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt'>>(product || {
    name: '',
    price: 0,
    originalPrice: 0,
    category: 'Man',
    season: 'Summer',
    image: '',
    colors: [],
    sizes: ['S', 'M', 'L', 'XL'],
    description: '',
    inStock: true,
    isHidden: false
  });

  const [isUploading, setIsUploading] = useState({ image: false });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image || null);
  const [newColor, setNewColor] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Instant preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading({ image: true });
      setUploadProgress(0);

      try {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress for ${file.name}: ${progress.toFixed(2)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
            setUploadProgress(progress);
          },
          (error: any) => {
            if (error.code === 'storage/canceled') {
              console.log("Upload canceled");
              return;
            }
            if (error.code === 'storage/retry-limit-exceeded') {
              console.error("Upload timed out. Please check your internet connection.");
              alert("Upload timed out. Please check your internet connection and try again.");
            } else {
              console.error("Upload failed", error);
              alert("Upload failed: " + error.message);
            }
            setIsUploading({ image: false });
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, image: downloadURL }));
            setIsUploading({ image: false });
            setUploadProgress(100);
          }
        );
      } catch (error) {
        console.error("Upload setup failed", error);
        setIsUploading({ image: false });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image.startsWith('data:')) {
      alert("Please wait for the image to finish uploading before saving.");
      return;
    }
    try {
      if (product) {
        await updateProduct(product.id, formData);
      } else {
        await addProduct(formData);
      }
      onClose();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save product.");
    }
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({ ...formData, colors: [...formData.colors, newColor] });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) 
        ? prev.sizes.filter(s => s !== size) 
        : [...prev.sizes, size]
    }));
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
        className="w-full max-w-md bg-ivory rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 flex items-center justify-between border-b border-charcoal/5">
          <h2 className="text-xl font-black tracking-tighter text-charcoal">
            {product ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
          </h2>
          <button onClick={onClose} className="p-2 bg-charcoal/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="flex justify-center">
            <label className="relative w-48 aspect-square rounded-[2rem] border-2 border-dashed border-charcoal/10 bg-charcoal/5 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden group">
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-charcoal/40 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-ivory uppercase tracking-widest">
                    Rahbar Signature
                  </div>
                  {isUploading.image && (
                    <div className="absolute inset-0 bg-charcoal/60 flex flex-col items-center justify-center gap-3">
                      <div className="relative w-12 h-12">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-ivory/20"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={125.6}
                            strokeDashoffset={125.6 - (125.6 * uploadProgress) / 100}
                            className="text-gold transition-all duration-300"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-ivory">{Math.round(uploadProgress)}%</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-ivory">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gold/20" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-charcoal/40">Product Image</span>
                </>
              )}
              <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-6 h-6 text-ivory" />
              </div>
            </label>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Product Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-gold"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" 
                placeholder="Price (₹)"
                value={formData.price || ''}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-gold"
                required
              />
              <input 
                type="number" 
                placeholder="Original Price (₹)"
                value={formData.originalPrice || ''}
                onChange={e => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-gold"
            >
              <option value="Man">Man</option>
              <option value="Woman">Woman</option>
              <option value="Kids">Kids</option>
            </select>
            <select 
              value={formData.season}
              onChange={e => setFormData({ ...formData, season: e.target.value as 'Summer' | 'Winter' })}
              className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-6 font-bold text-sm focus:outline-none focus:border-gold"
            >
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold">Colors</h3>
            <div className="flex flex-wrap gap-2">
              {formData.colors.map(color => (
                <button 
                  key={color}
                  type="button"
                  onClick={() => removeColor(color)}
                  className="w-8 h-8 rounded-lg border-2 border-charcoal/10 relative group"
                  style={{ backgroundColor: color }}
                >
                  <X className="w-4 h-4 text-white mix-blend-difference absolute inset-0 m-auto opacity-0 group-hover:opacity-100" />
                </button>
              ))}
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                />
                <button 
                  type="button"
                  onClick={addColor}
                  className="w-8 h-8 bg-gold text-charcoal rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold">Sizes</h3>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold transition-all border",
                    formData.sizes.includes(size) ? "bg-gold border-gold text-charcoal" : "bg-charcoal/5 border-charcoal/5 text-charcoal/40"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="flex gap-4">
            <label className="flex-1 flex items-center gap-3 p-4 bg-charcoal/5 rounded-2xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.inStock}
                onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-5 h-5 accent-gold"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">In Stock</span>
            </label>
            <label className="flex-1 flex items-center gap-3 p-4 bg-charcoal/5 rounded-2xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.isHidden}
                onChange={e => setFormData({ ...formData, isHidden: e.target.checked })}
                className="w-5 h-5 accent-gold"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hidden</span>
            </label>
          </div>

          <button 
            type="submit"
            className="w-full h-16 bg-charcoal text-ivory rounded-[2rem] font-black tracking-tighter text-lg flex items-center justify-center gap-3 shadow-2xl shadow-charcoal/40 active:scale-95 transition-transform"
          >
            <Check className="w-6 h-6" /> {product ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
