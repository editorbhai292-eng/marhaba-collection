import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { ChevronLeft, Copy, Check, Upload, Send, ShieldCheck, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, total, placeOrder } = useCart();
  const { uploadFile } = useProducts();
  
  const [isCopied, setIsCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentNumber = "9334808340";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setIsUploading(true);
      try {
        const url = await uploadFile(file, 'payments');
        setScreenshotUrl(url);
      } catch (error: any) {
        if (error.code === 'storage/canceled') {
          console.log("Upload canceled");
          return;
        }
        console.error("Upload failed", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!screenshotUrl) {
      alert("Please upload payment screenshot first");
      return;
    }

    setIsProcessing(true);
    try {
      await placeOrder(screenshotUrl);
      
      // WhatsApp Trigger
      const orderSummary = cart.map(item => `${item.product.name} (${item.size}, ${item.color}) x${item.quantity}`).join('\n');
      const message = `*NEW ORDER - MARHABA COLLECTION*\n\n*Items:*\n${orderSummary}\n\n*Total:* ₹${total.toLocaleString()}\n\n*Payment Screenshot:* ${screenshotUrl}\n\n*Rahbar Signature Verified*`;
      const whatsappUrl = `https://wa.me/919334808340?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      navigate('/');
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-ivory">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-ivory/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 bg-charcoal/5 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tighter text-charcoal">CHECKOUT</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
        {/* Payment Methods */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black tracking-tighter text-charcoal">SECURE PAYMENT</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-charcoal/5 rounded-2xl flex flex-col items-center gap-2 border border-charcoal/5">
              <Smartphone className="w-6 h-6 text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">PhonePe</span>
            </div>
            <div className="p-4 bg-charcoal/5 rounded-2xl flex flex-col items-center gap-2 border border-charcoal/5">
              <Wallet className="w-6 h-6 text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Paytm</span>
            </div>
            <div className="p-4 bg-charcoal/5 rounded-2xl flex flex-col items-center gap-2 border border-charcoal/5">
              <CreditCard className="w-6 h-6 text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">GPay</span>
            </div>
          </div>

          <div className="p-6 bg-charcoal text-ivory rounded-[2.5rem] space-y-6 shadow-2xl shadow-charcoal/40">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Manual Payment Number</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-tighter">{paymentNumber}</span>
                <button 
                  onClick={copyToClipboard}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    isCopied ? "bg-green-500 text-white" : "bg-ivory/10 text-gold hover:bg-ivory/20"
                  )}
                >
                  {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] font-bold opacity-40 leading-relaxed uppercase tracking-widest">
              Pay the total amount to the number above using any UPI app and upload the screenshot below.
            </p>
          </div>
        </section>

        {/* Screenshot Upload */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black tracking-tighter text-charcoal">UPLOAD PROOF</h2>
          </div>

          <label className={cn(
            "relative aspect-square rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden transition-all",
            screenshotUrl ? "border-green-500 bg-green-500/5" : "border-charcoal/10 bg-charcoal/5 hover:border-gold/30"
          )}>
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            
            {isUploading ? (
              <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            ) : screenshotUrl ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Screenshot Verified</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-gold/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Tap to upload screenshot</span>
              </div>
            )}

            {screenshotUrl && (
              <img src={screenshotUrl || undefined} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
            )}
          </label>
        </section>

        {/* Order Summary */}
        <section className="p-6 bg-gold/5 rounded-[2.5rem] border border-gold/10 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Final Amount</p>
              <p className="text-3xl font-black tracking-tighter text-charcoal leading-none">₹{total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">{cart.length} Items</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-500">Free Shipping</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-ivory/80 backdrop-blur-md sticky bottom-0 z-50 border-t border-charcoal/5">
        <button 
          onClick={handlePlaceOrder}
          disabled={!screenshotUrl || isProcessing}
          className={cn(
            "w-full h-16 rounded-[2rem] font-black tracking-tighter text-lg flex items-center justify-center gap-3 transition-all active:scale-95",
            isProcessing ? "bg-charcoal/50" : "bg-charcoal text-ivory shadow-2xl shadow-charcoal/40",
            (!screenshotUrl || isProcessing) && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Send className="w-6 h-6" /> CONFIRM & SEND WHATSAPP</>
          )}
        </button>
      </div>
    </div>
  );
}
