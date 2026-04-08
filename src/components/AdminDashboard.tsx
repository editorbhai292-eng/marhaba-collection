import React, { useState } from 'react';
import { useProducts, Product } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertCircle, 
  LogOut, 
  Eye, 
  EyeOff, 
  BarChart3,
  ChevronRight,
  Search,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProductForm from './ProductForm';

export default function AdminDashboard() {
  const { products, deleteProduct, updateProduct } = useProducts();
  const { logout, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Revenue', value: '₹1,24,500', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Orders', value: '156', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Customers', value: '842', icon: Users, color: 'bg-gold' },
    { label: 'Growth', value: '+12.5%', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-ivory overflow-hidden">
      {/* Header */}
      <div className="px-8 py-8 flex items-center justify-between bg-charcoal text-ivory rounded-b-[3rem] shadow-2xl shadow-charcoal/20">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tighter leading-none">COMMAND CENTER</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Admin: {profile?.name || 'Gulam Sarwar'}</p>
        </div>
        <button 
          onClick={logout}
          className="w-12 h-12 rounded-2xl bg-ivory/10 flex items-center justify-center text-ivory hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-6 flex gap-2 overflow-x-auto no-scrollbar">
        {(['overview', 'products', 'orders', 'customers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab 
                ? "bg-gold text-charcoal shadow-lg shadow-gold/20" 
                : "bg-charcoal/5 text-charcoal/40"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="p-6 rounded-[2.5rem] bg-charcoal/5 border border-charcoal/5 space-y-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-charcoal/40">{stat.label}</p>
                      <p className="text-xl font-black tracking-tighter text-charcoal">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="p-8 rounded-[3rem] bg-charcoal text-ivory space-y-6 shadow-2xl shadow-charcoal/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tighter">QUICK ACTIONS</h3>
                  <Sparkles className="w-6 h-6 text-gold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsAddingProduct(true)}
                    className="p-4 rounded-2xl bg-ivory/10 flex flex-col items-center gap-2 hover:bg-gold hover:text-charcoal transition-all group"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Add Product</span>
                  </button>
                  <button className="p-4 rounded-2xl bg-ivory/10 flex flex-col items-center gap-2 hover:bg-gold hover:text-charcoal transition-all group">
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Reports</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-charcoal/5 border border-charcoal/5 rounded-2xl px-12 font-bold text-xs focus:outline-none focus:border-gold"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
                </div>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="w-14 h-14 bg-gold text-charcoal rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20 active:scale-95 transition-transform"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 bg-charcoal/5 rounded-[2.5rem] flex gap-4 group">
                    <div className="w-20 aspect-square rounded-2xl overflow-hidden bg-charcoal/10">
                      <img 
                        src={product.image || undefined} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-charcoal truncate pr-4">{product.name}</h4>
                          <div className="flex gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-gold">₹{product.price.toLocaleString()}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-charcoal/20">{product.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateProduct(product.id, { isHidden: !product.isHidden })}
                            className={cn(
                              "p-2 rounded-xl transition-colors",
                              product.isHidden ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                            )}
                          >
                            {product.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Delete?')) deleteProduct(product.id) }}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {(activeTab === 'orders' || activeTab === 'customers') && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4 opacity-30"
            >
              <AlertCircle className="w-12 h-12 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest">No data available yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <ProductForm 
            product={editingProduct || undefined} 
            onClose={() => { setIsAddingProduct(false); setEditingProduct(null); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
