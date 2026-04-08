import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Smartphone, Upload, Check, MessageCircle, X, FileText, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity, clearCart, updateUserCoins, user } = useApp();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingOrder, setSavingOrder] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    age: '',
    phone: '',
    village: '',
    address: '',
    city: 'KISHANGANJ',
    state: 'BIHAR'
  });
  const navigate = useNavigate();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const coinsToEarn = Math.floor(total / 100);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        toast.success("Location shared successfully!");
      },
      (error) => {
        setIsLocating(false);
        if (error.message.includes("permissions policy")) {
          toast.error("Location access is blocked by browser policy. Please try opening the app in a new tab.");
        } else {
          toast.error(`Location error: ${error.message}`);
        }
        console.warn("Geolocation error:", error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  React.useEffect(() => {
    if (isCheckingOut) {
      requestLocation();
    }
  }, [isCheckingOut]);

  const generateInvoice = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('MARHABA COLLECTION', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Premium Fashion Marketplace', 105, 28, { align: 'center' });
    
    // Customer Details
    doc.setFontSize(12);
    doc.text('INVOICE TO:', 20, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${customerDetails.name}`, 20, 52);
    doc.text(`Phone: ${customerDetails.phone}`, 20, 57);
    doc.text(`Address: ${customerDetails.village}, ${customerDetails.address}`, 20, 62);
    doc.text(`City: ${customerDetails.city}, ${customerDetails.state}`, 20, 67);
    
    // Order Info
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 52);
    doc.text(`Order ID: #MC-${Math.floor(Math.random() * 1000000)}`, 150, 57);
    
    // Table
    const tableData = cart.map(item => [
      item.name,
      `${item.selectedColor || 'N/A'} / ${item.selectedSize || 'N/A'}`,
      item.quantity,
      `INR ${item.price.toLocaleString()}`,
      `INR ${(item.price * item.quantity).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Product', 'Variant', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: INR ${total.toLocaleString()}`, 140, finalY + 20);
    doc.setFontSize(10);
    doc.text(`Marhaba Coins Earned: ${coinsToEarn}`, 140, finalY + 28);
    
    doc.setFontSize(8);
    doc.text('Thank you for shopping with Marhaba Collection!', 105, finalY + 40, { align: 'center' });
    doc.text('Rahbar Signature Branding', 105, finalY + 45, { align: 'center' });
    
    return doc;
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Max size is 5MB.");
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setScreenshot(compressedDataUrl);

          // Instant Upload to Storage
          try {
            const response = await fetch(compressedDataUrl);
            const blob = await response.blob();
            const storageRef = ref(storage, `payment_screenshots/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, blob);

            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
              }, 
              (error) => {
                console.error("Upload failed:", error);
                toast.error("Upload failed. Please try again.");
                setUploading(false);
              }, 
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setScreenshotUrl(downloadURL);
                setUploading(false);
                toast.success("Payment proof uploaded!");
              }
            );
          } catch (err) {
            console.error(err);
            setUploading(false);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWhatsAppCheckout = async () => {
    if (!screenshotUrl || !customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      if (!screenshotUrl && screenshot) {
        toast.error("Please wait for the screenshot to finish uploading.");
      } else if (!screenshot) {
        toast.error("Please upload a payment screenshot.");
      } else {
        toast.error("Please fill in all required details.");
      }
      return;
    }

    setSavingOrder(true);
    const orderSummary = cart.map(item => `${item.name} (${item.selectedSize || 'N/A'}) x${item.quantity}`).join(', ');
    const mapsLink = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : 'Not available';
    
    const message = `*NEW ORDER - MARHABA COLLECTION*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${customerDetails.name}\n` +
      `Age: ${customerDetails.age}\n` +
      `Phone: ${customerDetails.phone}\n` +
      `Village: ${customerDetails.village}\n` +
      `Address: ${customerDetails.address}\n` +
      `City: ${customerDetails.city}\n` +
      `State: ${customerDetails.state}\n\n` +
      `*Location:* ${mapsLink}\n\n` +
      `*Order Summary:*\n${orderSummary}\n\n` +
      `*Total:* ₹${total.toLocaleString()}\n` +
      `*Marhaba Coins Earned:* ${coinsToEarn}\n\n` +
      `*Payment Proof:* ${screenshotUrl}\n\n` +
      `_Invoice Generated Successfully._`;
      
    const whatsappUrl = `https://wa.me/919334808340?text=${encodeURIComponent(message)}`;
    
    try {
      // 2. Save order to Firestore for admin tracking
      await addDoc(collection(db, 'orders'), {
        userId: user?.uid || 'guest',
        customer: customerDetails,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize
        })),
        total,
        coords,
        screenshot: screenshotUrl, // Save URL instead of base64
        status: 'pending',
        marhabaCoinsEarned: coinsToEarn,
        createdAt: serverTimestamp()
      });
      
      // Update user coins if logged in
      if (user) {
        await updateUserCoins(total);
      }
      
      // Auto-download invoice for customer
      const invoice = generateInvoice();
      invoice.save(`Marhaba_Invoice_${customerDetails.name}.pdf`);

      window.open(whatsappUrl, '_blank');
      clearCart();
      navigate('/');
      
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("There was an error saving your order. Please try again.");
    } finally {
      setSavingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Your Bag is Empty</h2>
          <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">Looks like you haven't added anything to your bag yet.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">My Bag</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} Items in Bag</p>
      </div>

      {/* Checkout Section - Moved Higher */}
      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
          <span className="text-2xl font-black">₹{total.toLocaleString()}</span>
        </div>
        <button 
          onClick={() => setIsCheckingOut(true)}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Checkout Now
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-[8px] font-serif italic text-white/40">
            Rahbar Signature Secure Checkout
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {cart.map((item) => (
          <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
              <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-black text-sm">₹{item.price.toLocaleString()}</span>
                {(item.selectedColor || item.selectedSize) && (
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">
                    {item.selectedColor} / {item.selectedSize}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.selectedColor, item.selectedSize)}
                  className="p-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold">{item.quantity}</span>
                <button 
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.selectedColor, item.selectedSize)}
                  className="p-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button 
              onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)}
              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Checkout Section - Removed from bottom */}

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckingOut && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckingOut(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold uppercase tracking-tight">Premium Checkout</h3>
                <button onClick={() => setIsCheckingOut(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Enter Name</label>
                      <input 
                        type="text" 
                        required 
                        value={customerDetails.name}
                        onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                        placeholder="Your Full Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Age</label>
                        <input 
                          type="number" 
                          required 
                          value={customerDetails.age}
                          onChange={e => setCustomerDetails({...customerDetails, age: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                          placeholder="Age"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                        <input 
                          type="tel" 
                          required 
                          value={customerDetails.phone}
                          onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between ml-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Village</label>
                        <button 
                          type="button"
                          onClick={requestLocation}
                          disabled={isLocating}
                          className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isLocating ? <Loader2 className="w-2 h-2 animate-spin" /> : <MapPin className="w-2 h-2" />}
                          {coords ? 'Location Shared' : 'Share Location'}
                        </button>
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={customerDetails.village}
                        onChange={e => setCustomerDetails({...customerDetails, village: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                        placeholder="Village Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Address</label>
                      <textarea 
                        required 
                        value={customerDetails.address}
                        onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm min-h-[80px]"
                        placeholder="Complete Address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">City</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={customerDetails.city}
                          className="w-full bg-gray-100 border-none rounded-2xl p-4 outline-none font-bold text-sm text-gray-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">State</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={customerDetails.state}
                          className="w-full bg-gray-100 border-none rounded-2xl p-4 outline-none font-bold text-sm text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Pay to Number</p>
                    <p className="text-xl font-black text-blue-900 tracking-wider">9334808340</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Payment Screenshot</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className={cn(
                          "w-full aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden",
                          screenshot ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
                        )}
                      >
                        {screenshot ? (
                          <div className="relative w-full h-full">
                            <img src={screenshot || undefined} alt="Screenshot" className="w-full h-full object-cover" />
                            {uploading && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                                <div className="w-full bg-white/20 rounded-full h-1.5 mb-2 overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    className="bg-gold h-full rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-gold uppercase tracking-widest animate-pulse">
                                  Uploading: {uploadProgress}%
                                </span>
                              </div>
                            )}
                            {!uploading && screenshotUrl && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {uploading ? (
                              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-gray-300" />
                                <span className="text-xs font-bold text-gray-400">Upload payment screenshot</span>
                              </>
                            )}
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleWhatsAppCheckout}
                    disabled={savingOrder || !screenshot || !customerDetails.name || !customerDetails.phone || !customerDetails.address}
                    className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    {savingOrder ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Send to WhatsApp
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-4 border-t">
                  <div className="text-[8px] font-serif italic text-gray-300">
                    Rahbar Signature Secure Payment Verification
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
