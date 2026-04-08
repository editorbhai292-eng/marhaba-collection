import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Home, MessageCircle, MoreVertical, Search as SearchIcon, Ruler, History, Sun, Moon, LogOut, ShieldCheck, Heart, Star, Settings as SettingsIcon, ClipboardList, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { cart, isAdmin, user, searchQuery, setSearchQuery, storeConfig, toggleTheme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: SearchIcon },
    { name: 'Bag', path: '/cart', icon: ShoppingBag, count: cartCount },
    { name: 'My Orders', path: '/orders', icon: ClipboardList },
    { name: 'Account', path: '/account', icon: User },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className={cn("min-h-screen flex justify-center transition-colors duration-500", storeConfig.theme === 'Winter' ? 'bg-slate-50' : 'bg-orange-50/30')}>
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col">
        {/* Announcement Bar */}
        {location.pathname !== '/search' && (
          <div className={cn("py-2 px-4 overflow-hidden bg-black border-b border-white/20")}>
            <div className="flex whitespace-nowrap animate-marquee">
              <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
              <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
              <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
              <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
               <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
               <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
               <span className="text-[18px] font-serif italic text-white uppercase tracking-[0.3em] px-4">
                {storeConfig.announcement || "WELCOME TO MARHABA COLLECTION"}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        {location.pathname !== '/search' && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black tracking-tighter text-gray-900">
                MARHABA <span className={cn("transition-colors", storeConfig.theme === 'Winter' ? 'text-blue-600' : 'text-orange-600')}>COLLECTION</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-serif italic text-gray-400 select-none hidden sm:block">
                  Rahbar Signature
                </div>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Search Bar (Click to open search page) */}
            <div 
              onClick={() => navigate('/search')}
              className="relative group cursor-pointer"
            >
              <div className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-400 font-medium transition-all">
                Search luxury collections...
              </div>
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className={cn(
          "fixed bottom-0 w-full max-w-md border-t flex items-center justify-around py-2 z-40 transition-colors duration-500",
          location.pathname === '/search' ? "bg-charcoal/90 border-white/10" : "bg-white/90 border-gray-100",
          "backdrop-blur-md"
        )}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 p-2 transition-all",
                  isActive 
                    ? (storeConfig.theme === 'Winter' ? "text-blue-600" : "text-orange-600") 
                    : (location.pathname === '/search' ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600")
                )
              }
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn("absolute -top-1.5 -right-1.5 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg", storeConfig.theme === 'Winter' ? 'bg-blue-600' : 'bg-orange-600')}>
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Floating WhatsApp Support */}
        <div className="fixed bottom-24 right-4 z-[100]">
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={`https://wa.me/919334808340?text=${encodeURIComponent("Hello Marhaba Collection, I am interested in this T-Shirt.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-green-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-200 hover:bg-green-600 transition-all relative pointer-events-auto"
          >
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          </motion.a>
        </div>

        {/* Kebab Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[70] shadow-2xl p-8 flex flex-col"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tighter">MENU</h2>
                    <div className="w-8 h-1 bg-blue-600 rounded-full" />
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {isAdmin ? (
                    <button onClick={() => { navigate('/admin'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl transition-all text-left group">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900">Admin Portal</span>
                    </button>
                  ) : (
                    <button onClick={() => { navigate('/admin-login'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-red-50 rounded-2xl transition-all text-left group">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900">Admin Login</span>
                    </button>
                  )}
                  <button onClick={() => { navigate('/orders'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <History className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">My Orders</span>
                  </button>
                  <button onClick={() => { navigate('/wishlist'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">Wishlist</span>
                  </button>
                  <button onClick={() => { navigate('/style'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <Star className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">Style Profile</span>
                  </button>
                  <button onClick={() => { navigate('/settings'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">Settings</span>
                  </button>
                  <button onClick={() => { setIsSizeGuideOpen(true); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900">Size Guide</span>
                  </button>
                  <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left group">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", storeConfig.theme === 'Winter' ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white')}>
                      {storeConfig.theme === 'Winter' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </div>
                    <span className="font-bold text-gray-900">{storeConfig.theme === 'Winter' ? 'Summer Mode' : 'Winter Mode'}</span>
                  </button>
                </div>

                <div className="mt-auto space-y-6">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors">
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                  <div className="text-center space-y-2">
                    <div className="text-[10px] font-serif italic text-gray-400">
                      Rahbar Signature Branding
                    </div>
                    <a href="mailto:rahbarfficial143@gmail.com" className="text-[8px] font-bold text-blue-500 uppercase tracking-widest hover:underline">
                      rahbarfficial143@gmail.com
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Size Guide Modal */}
        <AnimatePresence>
          {isSizeGuideOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSizeGuideOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white z-[110] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tight uppercase">Size Guide</h3>
                  <button onClick={() => setIsSizeGuideOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Size</th>
                          <th className="py-3 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Chest (in)</th>
                          <th className="py-3 text-left font-bold text-gray-400 uppercase text-[10px] tracking-widest">Waist (in)</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-gray-700">
                        <tr className="border-b">
                          <td className="py-4">S</td>
                          <td className="py-4">36-38</td>
                          <td className="py-4">30-32</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-4">M</td>
                          <td className="py-4">38-40</td>
                          <td className="py-4">32-34</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-4">L</td>
                          <td className="py-4">40-42</td>
                          <td className="py-4">34-36</td>
                        </tr>
                        <tr>
                          <td className="py-4">XL</td>
                          <td className="py-4">42-44</td>
                          <td className="py-4">36-38</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium text-center italic">
                    * Measurements are in inches. If you're between sizes, we recommend sizing up.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
