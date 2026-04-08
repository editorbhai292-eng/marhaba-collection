import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, ChevronRight, User, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/');
    } catch (error) {
      console.error("Signup failed", error);
      alert("Signup failed. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-12 bg-ivory overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="space-y-4 text-center pt-12">
        <div className="w-20 h-20 bg-gold/10 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
          <UserPlus className="w-10 h-10 text-gold" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-charcoal text-gold rounded-xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-charcoal leading-none">JOIN THE CLUB</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Marhaba Collection Hub</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-16 bg-charcoal/5 border border-charcoal/5 rounded-[2rem] px-14 font-bold text-sm focus:outline-none focus:border-gold transition-all"
              required
            />
            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
          </div>

          <div className="relative">
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-16 bg-charcoal/5 border border-charcoal/5 rounded-[2rem] px-14 font-bold text-sm focus:outline-none focus:border-gold transition-all"
              required
            />
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
          </div>

          <div className="relative">
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-16 bg-charcoal/5 border border-charcoal/5 rounded-[2rem] px-14 font-bold text-sm focus:outline-none focus:border-gold transition-all"
              required
            />
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/20" />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full h-16 bg-charcoal text-ivory rounded-[2rem] font-black tracking-tighter text-lg flex items-center justify-center gap-3 shadow-2xl shadow-charcoal/40 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? <div className="w-6 h-6 border-2 border-ivory border-t-transparent rounded-full animate-spin" /> : <>SIGN UP <ChevronRight className="w-6 h-6" /></>}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-4 pb-8">
        <p className="text-xs font-bold text-charcoal/40 uppercase tracking-widest">
          Already have an account? <Link to="/login" className="text-gold underline">Sign In</Link>
        </p>
        
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/20">
          <ShieldCheck className="w-4 h-4" />
          Secure Rahbar Signature Gateway
        </div>
      </div>
    </div>
  );
}
