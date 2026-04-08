import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-100"
      >
        <Construction className="w-12 h-12 text-orange-600" />
      </motion.div>
      
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{title}</h2>
        <div className="flex items-center justify-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-[0.2em]">
          <Clock className="w-4 h-4" />
          Under Construction
        </div>
        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">
          We are currently crafting a premium experience for this section. Please check back soon!
        </p>
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl"
      >
        <ArrowLeft className="w-5 h-5" />
        Go Back
      </button>

      <div className="pt-12 text-[8px] font-serif italic text-gray-300 uppercase tracking-widest">
        Marhaba Collection Luxury Experience
      </div>
    </div>
  );
}
