import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { Plus, Trash2, Edit3, Save, X, Upload, ShieldCheck, LogOut, Image as ImageIcon, Settings, ShoppingBag, Megaphone, Sun, Moon, Search, MapPin, ClipboardList, Package, Truck, CheckCircle, FileText, Activity, Zap, Clock, Loader2, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Product, Banner, StoreConfig } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

type AdminTab = 'products' | 'banners' | 'settings' | 'orders';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function AdminPanel() {
  const { products, banners, storeConfig, isAdmin, toggleTheme, user } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [orders, setOrders] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadTaskRef = React.useRef<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'product' | 'banner' | 'order', data: any } | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (isAdmin && user) {
      const unsubscribeOrders = onSnapshot(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      );
      return () => unsubscribeOrders();
    }
  }, [isAdmin]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const generateAdminInvoice = (order: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MARHABA COLLECTION', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('OFFICIAL ORDER INVOICE', 105, 28, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('CUSTOMER DETAILS:', 20, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${order.customer.name}`, 20, 52);
    doc.text(`Phone: ${order.customer.phone}`, 20, 57);
    doc.text(`Address: ${order.customer.village}, ${order.customer.address}`, 20, 62);
    
    doc.text(`Order Date: ${order.createdAt?.toDate().toLocaleDateString()}`, 150, 52);
    doc.text(`Order ID: #${order.id.substring(0, 8).toUpperCase()}`, 150, 57);
    
    const tableData = order.items.map((item: any) => [
      item.name,
      `${item.selectedColor || 'N/A'} / ${item.selectedSize || 'N/A'}`,
      item.quantity,
      `INR ${item.price.toLocaleString()}`,
      `INR ${(item.price * item.quantity).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: 75,
      head: [['Product', 'Variant', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });
    
    const finalY = (doc as any).lastAutoTable?.finalY || 75;
    doc.setFontSize(14);
    doc.text(`TOTAL AMOUNT: INR ${order.total.toLocaleString()}`, 140, finalY + 20);
    
    doc.save(`Invoice_${order.customer.name}_${order.id.substring(0, 5)}.pdf`);
  };

  // Product Form State
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', price: 0, description: '', image: '', category: 'General', originalPrice: 0, badge: '', season: 'Summer', hidden: false, inStock: true,
    flashSale: { active: false, endTime: '' }
  });

  // Banner Form State
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    title: '', subtitle: '', image: '', season: 'Summer', active: true
  });

  // Store Config State
  const [configForm, setConfigForm] = useState<StoreConfig>(storeConfig);

  React.useEffect(() => {
    setConfigForm(storeConfig);
  }, [storeConfig]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product-image' | 'banner-image') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const isVideo = file.type.startsWith('video/');
      if (type === 'product-image' && isVideo) {
        setUploadError("Products only support JPG/PNG images.");
        return;
      }
      if (type === 'banner-image' && !isVideo && !file.type.startsWith('image/')) {
        setUploadError("Banners support images or MP4 videos.");
        return;
      }

      setUploadingImage(true);
      setImageProgress(0);
      setUploadError(null);

      try {
        let fileToUpload: File | Blob = file;

        // Compress images (not videos)
        if (file.type.startsWith('image/')) {
          console.log("Compressing image before upload...");
          fileToUpload = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
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
                canvas.toBlob((blob) => {
                  if (blob) resolve(blob);
                  else resolve(file);
                }, 'image/jpeg', 0.7);
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
        }

        console.log("Starting upload for:", file.name, "type:", type);
        const storageRef = ref(storage, `${type}s/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
        uploadTaskRef.current = uploadTask;

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress for ${file.name}: ${progress.toFixed(2)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
            setImageProgress(Math.round(progress));
          }, 
          (error: any) => {
            if (error.code === 'storage/canceled') {
              console.log("Upload canceled");
              return;
            }
            if (error.code === 'storage/retry-limit-exceeded') {
              console.error("Upload timed out. Please check your internet connection.");
              setUploadError("Upload timed out. Please check your internet connection and try again.");
            } else {
              console.error("Upload failed:", error);
              setUploadError(error.message);
            }
            setUploadingImage(false);
            uploadTaskRef.current = null;
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (type === 'product-image') setProductForm(prev => ({ ...prev, image: downloadURL }));
            else if (type === 'banner-image') setBannerForm(prev => ({ ...prev, image: downloadURL }));
            
            setUploadingImage(false);
            setImageProgress(100);
            uploadTaskRef.current = null;
          }
        );
      } catch (error: any) {
        console.error("Upload setup failed:", error);
        setUploadError(error.message);
        setUploadingImage(false);
      }
    }
  };

  const cancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      setUploadingImage(false);
      setImageProgress(0);
      uploadTaskRef.current = null;
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productForm.image?.startsWith('data:')) {
      alert("Please wait for the image to finish uploading before saving.");
      return;
    }
    const path = editingId ? `products/${editingId}` : 'products';
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), { ...productForm, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'products'), { ...productForm, createdAt: serverTimestamp() });
      }
      setIsAdding(false);
      setEditingId(null);
      setProductForm({ name: '', price: 0, description: '', image: '', category: 'General', originalPrice: 0, badge: '', season: 'Summer', hidden: false, inStock: true });
    } catch (error) { 
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = editingId ? `banners/${editingId}` : 'banners';
    try {
      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), bannerForm);
      } else {
        await addDoc(collection(db, 'banners'), bannerForm);
      }
      setIsAdding(false);
      setEditingId(null);
      setBannerForm({ title: '', subtitle: '', image: '', season: 'Summer', active: true });
    } catch (error) { 
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleSaveConfig = async () => {
    const path = 'config/store';
    try {
      await setDoc(doc(db, 'config', 'store'), configForm);
      alert('Settings updated successfully!');
    } catch (error) { 
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      // Delete media from storage if they exist
      if (product.image && product.image.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, product.image);
          await deleteObject(imageRef);
        } catch (e) {
          console.error("Error deleting image from storage:", e);
        }
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'products', product.id));
      setDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${product.id}`);
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    try {
      // Delete image from storage if it exists
      if (banner.image && banner.image.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, banner.image);
          await deleteObject(imageRef);
        } catch (e) {
          console.error("Error deleting banner image from storage:", e);
        }
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'banners', banner.id));
      setDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banners/${banner.id}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 max-w-xs mx-auto">You must be an administrator to access the Command Center.</p>
        </div>
        <button onClick={() => auth.signOut()} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors">Logout</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Command Center</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Admin Suite</p>
        </div>
        <button onClick={() => auth.signOut()} className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
        {(['products', 'banners', 'orders', 'settings'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab === 'products' && <ShoppingBag className="w-3 h-3" />}
            {tab === 'banners' && <ImageIcon className="w-3 h-3" />}
            {tab === 'orders' && <ClipboardList className="w-3 h-3" />}
            {tab === 'settings' && <Settings className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Inventory ({products.length})</h3>
              <button onClick={() => { setEditingId(null); setIsAdding(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200">
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                placeholder="Search products..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase())).map((product) => (
                <div key={product.id} className={cn("bg-white p-4 rounded-3xl border flex items-center gap-4 shadow-sm group", product.hidden ? "opacity-50 border-dashed border-gray-300" : "border-gray-100")}>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 truncate text-sm">{product.name}</h4>
                      {product.hidden && <span className="text-[8px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full uppercase font-black">Hidden</span>}
                    </div>
                    <p className="text-blue-600 font-black text-xs">₹{product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(product.id); setProductForm(product); setIsAdding(true); }} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ id: product.id, type: 'product', data: product })} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Hero Banners ({banners.length})</h3>
              <button onClick={() => { setEditingId(null); setIsAdding(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200">
                <Plus className="w-3 h-3" /> Add Banner
              </button>
            </div>
            <div className="grid gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm group">
                  <div className="w-24 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <img src={banner.image || undefined} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-sm">{banner.title}</h4>
                    <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", banner.season === 'Summer' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600')}>
                      {banner.season}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(banner.id); setBannerForm(banner); setIsAdding(true); }} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ id: banner.id, type: 'banner', data: banner })} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Recent Orders ({orders.length})</h3>
            </div>

            {/* Logistics Heat Map */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tighter">Logistics Heat Map</h4>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Kishanganj Region Density</p>
                </div>
              </div>
              
              <div className="h-[200px] w-full bg-gray-50 rounded-3xl overflow-hidden relative">
                <ResponsiveContainer width="100%" height={200} minWidth={0} debounce={100}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" hide />
                    <YAxis type="number" dataKey="y" hide />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Orders" data={orders.filter(o => o.coords).map(o => ({
                      x: o.coords.lng,
                      y: o.coords.lat,
                      z: 1,
                      name: o.customer.village
                    }))}>
                      {orders.filter(o => o.coords).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-gray-100">
                  <p className="text-[8px] font-black text-gray-500 uppercase">Route Optimization Active</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-gray-900 uppercase">{order.customer.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">₹{order.total.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{order.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed">
                        {order.customer.village}, {order.customer.address}, {order.customer.city}, {order.customer.state}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'packed', 'shipped', 'out-for-delivery'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                              order.status === status 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                            )}
                          >
                            {status.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items Ordered</p>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">{item.name} x{item.quantity}</span>
                        <span className="text-gray-400">({item.selectedSize || 'N/A'})</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    {order.coords && (
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${order.coords.lat},${order.coords.lng}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Track Map
                      </button>
                    )}
                    <button 
                      onClick={() => generateAdminInvoice(order)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Invoice
                    </button>
                    {order.screenshot && (
                      <button 
                        onClick={() => setViewingScreenshot(order.screenshot)}
                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                        title="View Payment Screenshot"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteConfirm({ id: order.id, type: 'order', data: order })}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {orders.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <ClipboardList className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 font-bold text-sm italic">No orders recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black tracking-tighter uppercase">Store Announcement</h3>
              </div>
              <textarea
                value={configForm.announcement}
                onChange={(e) => setConfigForm({ ...configForm, announcement: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-3xl p-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm min-h-[120px]"
                placeholder="Enter announcement text..."
              />
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <h4 className="font-black uppercase tracking-tighter text-gray-900">Seasonal Theme</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current: {storeConfig.theme}</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg",
                    storeConfig.theme === 'Summer' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-orange-600 text-white shadow-orange-200'
                  )}
                >
                  {storeConfig.theme === 'Summer' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Switch to {storeConfig.theme === 'Summer' ? 'Winter' : 'Summer'}
                </button>
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" />
                Save All Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modals */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-[3rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tighter uppercase">{editingId ? 'Edit' : 'New'} {activeTab === 'products' ? 'Product' : 'Banner'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {activeTab === 'products' ? (
                <form onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Name</label>
                      <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Category</label>
                      <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                        <option>Men</option><option>Women</option><option>Kids</option><option>Girls</option><option>General</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Price (₹)</label>
                      <input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Original Price (₹)</label>
                      <input type="number" value={productForm.originalPrice} onChange={e => setProductForm({ ...productForm, originalPrice: parseFloat(e.target.value) })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Stock Status</label>
                      <select value={productForm.inStock ? 'In Stock' : 'Out of Stock'} onChange={e => setProductForm({ ...productForm, inStock: e.target.value === 'In Stock' })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Visibility</label>
                      <select value={productForm.hidden ? 'Hidden' : 'Visible'} onChange={e => setProductForm({ ...productForm, hidden: e.target.value === 'Hidden' })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                        <option value="Visible">Visible</option>
                        <option value="Hidden">Hidden</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Flash Sale</label>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2 px-4 h-[52px]">
                        <input 
                          type="checkbox" 
                          checked={productForm.flashSale?.active} 
                          onChange={e => setProductForm({ ...productForm, flashSale: { ...productForm.flashSale, active: e.target.checked, endTime: productForm.flashSale?.endTime || '' } })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-gray-600">Active</span>
                      </div>
                    </div>
                  </div>
                  {productForm.flashSale?.active && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Sale End Time</label>
                      <input 
                        type="datetime-local" 
                        value={productForm.flashSale?.endTime} 
                        onChange={e => setProductForm({ ...productForm, flashSale: { ...productForm.flashSale, endTime: e.target.value } })}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Description</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm min-h-[100px]" />
                  </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Product Image</label>
                      <label className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative">
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'product-image')} className="hidden" disabled={uploadingImage} />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <span className="text-[10px] font-black text-blue-600">{imageProgress}%</span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${imageProgress}%` }} />
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); cancelUpload(); }} className="text-[8px] font-bold text-red-500 uppercase mt-2">Cancel</button>
                          </div>
                        ) : uploadError ? (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <Activity className="w-6 h-6 text-red-500" />
                            <span className="text-[8px] font-bold text-red-500 uppercase leading-tight">{uploadError}</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); setUploadError(null); }} className="text-[8px] font-black text-blue-600 uppercase mt-2 underline">Retry Upload</button>
                          </div>
                        ) : (productForm.image && productForm.image !== '') ? (
                          <div className="relative w-full h-full">
                            <img src={productForm.image || undefined} className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
                              Rahbar Signature
                            </div>
                          </div>
                        ) : (
                          <Upload className="w-6 h-6 text-gray-300" />
                        )}
                      </label>
                    </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Save Product</button>
                </form>
              ) : (
                <form onSubmit={handleSaveBanner} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Banner Title</label>
                    <input type="text" required value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Subtitle</label>
                    <input type="text" required value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Season</label>
                      <select value={bannerForm.season} onChange={e => setBannerForm({ ...bannerForm, season: e.target.value as any })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                        <option>Summer</option><option>Winter</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Status</label>
                      <select value={bannerForm.active ? 'Active' : 'Inactive'} onChange={e => setBannerForm({ ...bannerForm, active: e.target.value === 'Active' })} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                        <option>Active</option><option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Banner Media (Image/MP4)</label>
                    <label className="w-full aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative">
                      <input type="file" accept="image/*,video/mp4" onChange={e => handleFileUpload(e, 'banner-image')} className="hidden" disabled={uploadingImage} />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          <span className="text-[10px] font-black text-blue-600">{imageProgress}%</span>
                          <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${imageProgress}%` }} />
                          </div>
                          <button type="button" onClick={(e) => { e.preventDefault(); cancelUpload(); }} className="text-[8px] font-bold text-red-500 uppercase mt-2">Cancel</button>
                        </div>
                      ) : uploadError ? (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <Activity className="w-6 h-6 text-red-500" />
                          <span className="text-[8px] font-bold text-red-500 uppercase leading-tight">{uploadError}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); setUploadError(null); }} className="text-[8px] font-black text-blue-600 uppercase mt-2 underline">Retry Upload</button>
                        </div>
                      ) : (bannerForm.image && bannerForm.image !== '') ? (
                        bannerForm.image.includes('.mp4') || bannerForm.image.includes('video') ? (
                          <video src={bannerForm.image || undefined} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                          <img src={bannerForm.image || undefined} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <Upload className="w-6 h-6 text-gray-300" />
                      )}
                    </label>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Save Banner</button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Screenshot Viewer Modal */}
      <AnimatePresence>
        {viewingScreenshot && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setViewingScreenshot(null)} 
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4"
            >
              <button 
                onClick={() => setViewingScreenshot(null)} 
                className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={viewingScreenshot || undefined} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white z-[210] rounded-[2.5rem] shadow-2xl p-8 w-[90%] max-w-sm text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Delete {deleteConfirm.type}?</h3>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                  Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'product') handleDeleteProduct(deleteConfirm.data);
                    else if (deleteConfirm.type === 'banner') handleDeleteBanner(deleteConfirm.data);
                    else if (deleteConfirm.type === 'order') handleDeleteOrder(deleteConfirm.id);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
