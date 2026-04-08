import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ShoppingBag, Heart, Star, Settings, ChevronRight, ShieldCheck, Coins, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Account() {
  const { user, userProfile, isAdmin } = useApp();
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setRecentOrder({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      }, (error) => {
        console.error("Recent order snapshot error:", error);
        const errInfo = {
          error: error.message,
          operationType: 'list',
          path: 'orders',
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
          }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      });
      
      return () => unsubscribe();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Your Account</h2>
          <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">Please sign in to view your account details.</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          Sign In
        </button>
      </div>
    );
  }

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: Star, label: 'Style Profile', path: '/style' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (isAdmin) {
    menuItems.unshift({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'packed': return 2;
      case 'shipped': return 3;
      case 'out-for-delivery': return 4;
      default: return 1;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden p-8 bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-gray-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[180px]">
              {user.email?.split('@')[0]}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-[8px] font-black uppercase tracking-widest">
                <Coins className="w-2.5 h-2.5" />
                {userProfile?.coins || 0} Marhaba Coins
              </div>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">
                {isAdmin ? 'Master Admin' : 'Premium Member'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Timeline */}
      {recentOrder && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Live Order Status</h3>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">#{recentOrder.id.substring(0, 8)}</span>
          </div>
          
          <div className="relative flex justify-between items-center px-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-1000" 
              style={{ width: `${((getStatusStep(recentOrder.status) - 1) / 3) * 100}%` }}
            />
            
            {[
              { icon: Clock, label: 'Pending', step: 1 },
              { icon: Package, label: 'Packed', step: 2 },
              { icon: Truck, label: 'Shipped', step: 3 },
              { icon: CheckCircle, label: 'Delivered', step: 4 }
            ].map((s) => (
              <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                  getStatusStep(recentOrder.status) >= s.step ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-2 border-gray-100 text-gray-300"
                )}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  getStatusStep(recentOrder.status) >= s.step ? "text-blue-600" : "text-gray-300"
                )}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <item.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-900">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
          </button>
        ))}
      </div>

      <button 
        onClick={() => auth.signOut()}
        className="w-full bg-red-50 text-red-500 py-5 rounded-2xl font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>

      <div className="text-center pt-8 border-t">
        <div className="text-[8px] font-serif italic text-gray-300">
          Rahbar Signature Account Management
        </div>
      </div>
    </div>
  );
}
