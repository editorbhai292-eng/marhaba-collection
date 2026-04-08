import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, ArrowRight, AlertCircle, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AdminLogin() {
  const { loginAdmin, storeConfig } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isDarkMode = storeConfig.theme === 'Winter';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    const success = await loginAdmin(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500", isDarkMode ? "bg-slate-900 text-white" : "bg-orange-50/30 text-gray-900")}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl", isDarkMode ? "bg-blue-600/20 text-blue-400" : "bg-orange-600/20 text-orange-600")}>
          <ShieldCheck className="w-10 h-10" />
        </div>
        
        <div className="mb-8">
          <span className={cn("text-[10px] font-bold tracking-[0.4em] uppercase mb-2 block", isDarkMode ? "text-blue-400" : "text-orange-600")}>Rahbar Signature</span>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Secure Gateway</h2>
          <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] font-bold mt-2">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-4">Username</label>
            <div className="relative">
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={cn("w-full border-none rounded-2xl p-5 focus:ring-2 outline-none transition-all font-bold", isDarkMode ? "bg-white/5 text-white focus:ring-blue-500" : "bg-white text-gray-900 focus:ring-orange-500 shadow-sm")}
                placeholder="Enter admin username"
              />
              <User className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30", isDarkMode ? "text-white" : "text-gray-900")} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-4">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={cn("w-full border-none rounded-2xl p-5 focus:ring-2 outline-none transition-all font-bold", isDarkMode ? "bg-white/5 text-white focus:ring-blue-500" : "bg-white text-gray-900 focus:ring-orange-500 shadow-sm")}
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30 hover:opacity-100 transition-opacity", isDarkMode ? "text-white" : "text-gray-900")}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest px-4"
            >
              <AlertCircle className="w-4 h-4" />
              Invalid admin credentials
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={cn(
              "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2",
              isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-orange-600 text-white hover:bg-orange-700"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Access Command Center
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-12 text-[10px] opacity-30 font-medium leading-relaxed">
          This is a secure, encrypted gateway. All access attempts are logged. Unauthorized access is strictly prohibited.
        </p>
      </motion.div>
    </div>
  );
}
