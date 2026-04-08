import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Lookbook() {
  const { products } = useApp();
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [selection, setSelection] = useState({ category: 'Man', season: 'Winter' });

  const generateStory = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `As a high-end fashion stylist for MARHABA COLLECTION, create a curated "Style Story" for a ${selection.category} in ${selection.season}. 
      Describe a complete outfit including accessories and shoes. 
      The tone should be luxurious, inviting, and sophisticated. 
      Keep it under 100 words. Format it as a cohesive narrative.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setStory(response.text || 'Unable to generate style story at this time.');
    } catch (error) {
      console.error(error);
      setStory('Experience the Marhaba signature style. Our collection blends traditional warmth with modern luxury.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-charcoal mb-2">Style Story</h2>
        <p className="text-charcoal/60 text-sm font-medium">Your personalized lookbook curated by AI</p>
      </div>

      <div className="bg-charcoal rounded-3xl p-6 text-ivory mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">Category</label>
              <select 
                value={selection.category}
                onChange={(e) => setSelection(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-ivory/10 border border-ivory/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-gold"
              >
                <option value="Man">Man</option>
                <option value="Woman">Woman</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2 block">Season</label>
              <select 
                value={selection.season}
                onChange={(e) => setSelection(prev => ({ ...prev, season: e.target.value }))}
                className="w-full bg-ivory/10 border border-ivory/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-gold"
              >
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
          </div>

          <button 
            onClick={generateStory}
            disabled={loading}
            className="w-full bg-gold text-charcoal py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate My Lookbook
          </button>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
      </div>

      <AnimatePresence mode="wait">
        {story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-ivory border-2 border-gold/20 p-8 rounded-3xl relative"
          >
            <div className="absolute -top-4 left-8 bg-gold text-charcoal px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Marhaba Signature
            </div>
            <p className="text-charcoal leading-relaxed font-serif text-lg italic mb-6">
              "{story}"
            </p>
            <div className="flex items-center justify-between pt-6 border-t border-gold/10">
              <div className="flex -space-x-2">
                {products.slice(0, 3).map(p => (
                  <img key={p.id} src={p.image || undefined} className="w-10 h-10 rounded-full border-2 border-ivory object-cover" referrerPolicy="no-referrer" />
                ))}
              </div>
              <button className="text-gold font-bold text-sm flex items-center gap-1">
                Shop the Look <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!story && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-gold/30" />
          </div>
          <p className="text-charcoal/40 font-medium">Select your preferences to see your style story</p>
        </div>
      )}
    </div>
  );
}
