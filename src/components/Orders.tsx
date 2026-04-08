import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, ChevronRight, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Orders() {
  const { user, userProfile } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'list', 'orders');
        setLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'packed': return 2;
      case 'shipped': return 3;
      case 'out-for-delivery': return 4;
      default: return 1;
    }
  };

  const generateInvoice = (order: any) => {
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
    
    doc.save(`Invoice_${order.id.substring(0, 8)}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">My Orders</h2>
          <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">Please sign in to view your order history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tighter uppercase">Order History</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Track your luxury purchases</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                <p className="text-xs font-black text-gray-900 uppercase">#{order.id.substring(0, 8)}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-blue-600">₹{order.total.toLocaleString()}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pt-2 pb-6">
              <div className="absolute top-[26px] left-[10%] right-[10%] h-1 bg-gray-100 z-0 rounded-full" />
              <div 
                className="absolute top-[26px] left-[10%] h-1 bg-blue-600 z-0 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                style={{ width: `${((getStatusStep(order.status) - 1) / 3) * 80}%` }}
              />
              
              <div className="relative flex justify-between items-start">
                {[
                  { icon: Clock, label: 'Pending', step: 1 },
                  { icon: Package, label: 'Packed', step: 2 },
                  { icon: Truck, label: 'Shipped', step: 3 },
                  { icon: CheckCircle, label: 'Delivered', step: 4 }
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center gap-3 w-1/4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10",
                      getStatusStep(order.status) >= s.step 
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110" 
                        : "bg-white border-2 border-gray-100 text-gray-300"
                    )}>
                      <s.icon className={cn("w-5 h-5", getStatusStep(order.status) >= s.step && "animate-pulse")} />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        getStatusStep(order.status) >= s.step ? "text-blue-600" : "text-gray-300"
                      )}>{s.label}</p>
                      {getStatusStep(order.status) === s.step && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1 h-1 bg-blue-600 rounded-full mx-auto"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</p>
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">{item.name} x{item.quantity}</span>
                  <span className="text-gray-400">({item.selectedSize || 'N/A'})</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => generateInvoice(order)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download Invoice
              </button>
              {order.coords && (
                <button 
                  onClick={() => window.open(`https://www.google.com/maps?q=${order.coords.lat},${order.coords.lng}`, '_blank')}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <p className="text-gray-400 font-bold text-sm italic">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
