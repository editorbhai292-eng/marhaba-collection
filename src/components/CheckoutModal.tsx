import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Upload, Smartphone, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface CheckoutModalProps {
  items: { product: Product; quantity: number; color: string }[];
  total: number;
  onClose: () => void;
}

export default function CheckoutModal({ items, total, onClose }: CheckoutModalProps) {
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const paymentNumber = "+91 9334808340";

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleConfirmPayment = () => {
    if (!screenshot) return;
    
    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      const orderSummary = items.map(item => `${item.product.name} (${item.color}) x${item.quantity}`).join(', ');
      const message = `Order Summary: ${orderSummary}\nTotal: ₹${total.toLocaleString()}\nPayment Screenshot Uploaded.`;
      const whatsappUrl = `https://wa.me/919334808340?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-charcoal/60 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-ivory w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-charcoal/5 rounded-full z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <span className="text-[8px] text-gold font-bold tracking-[0.4em] uppercase mb-2 block">Rahbar Signature</span>
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-2xl font-bold">Premium Checkout</h3>
          <p className="text-charcoal/50 text-xs font-bold uppercase tracking-widest mt-1">Manual Payment Gateway</p>
        </div>

        <div className="space-y-6">
          {/* Payment Icons */}
          <div className="flex justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">PhonePe</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">Paytm</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-xs">GPay</span>
              </div>
            </div>
          </div>

          {/* Payment Number */}
          <div className="bg-charcoal/5 rounded-2xl p-6 text-center border border-gold/10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Pay to this number</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl font-bold tracking-wider">{paymentNumber}</span>
              <button 
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  copied ? "bg-green-500 text-white" : "bg-gold text-charcoal"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold opacity-50 uppercase tracking-widest">Total Amount</span>
            <span className="text-2xl font-bold text-gold">₹{total.toLocaleString()}</span>
          </div>

          {/* Upload Screenshot */}
          <div className="space-y-3">
            <label className="block">
              <div className={cn(
                "w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                screenshot ? "border-green-500 bg-green-50" : "border-gold/30 hover:border-gold bg-charcoal/5"
              )}>
                <Upload className={cn("w-6 h-6", screenshot ? "text-green-500" : "text-gold")} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                  {screenshot ? screenshot.name : "Upload Payment Screenshot"}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            </label>
          </div>

          <button 
            onClick={handleConfirmPayment}
            disabled={!screenshot || isUploading}
            className="w-full bg-charcoal text-ivory py-5 rounded-2xl font-bold shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Confirm & Send WhatsApp
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
