import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Affirmation {
  id: string;
  text: string;
  author?: string;
}

const DEFAULT_AFFIRMATIONS = [
  { text: "With every breath, I align myself with peace and divine guidance.", author: "Spiritual Tradition" },
  { text: "My heart is open to receive the infinite blessings of today.", author: "Sufi Wisdom" },
  { text: "Patience is not sitting and waiting, it is foreseeing. It is looking at the thorn and seeing the rose.", author: "Rumi" },
  { text: "Do not lose hope, nor be sad. You will surely be victorious if you are true in faith.", author: "Quran 3:139" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "Let the beauty of what you love be what you do.", author: "Rumi" },
  { text: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.", author: "Rumi" },
];

export default function DailyAffirmation() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0); // 1 = right, -1 = left

  useEffect(() => {
    let unmounted = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!unmounted) setAffirmations(DEFAULT_AFFIRMATIONS.map((item, index) => ({ id: `default-${index}`, ...item })));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const q = query(collection(db, 'affirmations'));
        const snapshot = await getDocs(q);
        
        if (unmounted) return;

        let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Affirmation));
        
        if (docs.length === 0) {
          docs = DEFAULT_AFFIRMATIONS.map((item, index) => ({ id: `default-${index}`, ...item }));
        }

        setAffirmations(docs);
      } catch (error) {
        if (unmounted) return;
        const docs = DEFAULT_AFFIRMATIONS.map((item, index) => ({ id: `default-${index}`, ...item }));
        setAffirmations(docs);
      } finally {
        if (!unmounted) setLoading(false);
      }
    });

    return () => {
      unmounted = true;
      unsub();
    };
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (affirmations.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % affirmations.length);
    }, 4000); // Slide every 4 seconds

    return () => clearInterval(interval);
  }, [affirmations.length]);

  const nextSlide = () => {
    if (affirmations.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const prevSlide = () => {
    if (affirmations.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? affirmations.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="bg-black/5 dark:bg-white/10 rounded-3xl p-6 sm:p-8 animate-pulse flex flex-col justify-center items-center h-48 mb-8">
        <Quote className="w-8 h-8 opacity-20 mb-3" />
      </div>
    );
  }

  if (affirmations.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 rounded-3xl p-6 sm:p-8 border border-indigo-500/20 dark:border-indigo-400/20 overflow-hidden shadow-sm mb-8 min-h-[12rem] flex flex-col">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Quote className="w-24 h-24 sm:w-32 sm:h-32 -mr-4 -mt-4" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Affirmations & Sagesse</h2>
          </div>
          
          {affirmations.length > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={prevSlide}
                className="p-1 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors text-indigo-700 dark:text-indigo-300 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextSlide}
                className="p-1 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors text-indigo-700 dark:text-indigo-300 backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="relative flex-1 flex items-center min-h-[5rem]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              className="w-full absolute"
            >
              <p className="text-lg sm:text-xl font-medium leading-relaxed mb-3 text-neutral-800 dark:text-neutral-200">
                "{affirmations[currentIndex].text}"
              </p>
              
              {affirmations[currentIndex].author && (
                <div className="text-sm font-semibold opacity-60">
                  — {affirmations[currentIndex].author}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {affirmations.length > 1 && (
          <div className="flex justify-center gap-1 mt-6">
            {affirmations.map((_, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-6 bg-indigo-500 dark:bg-indigo-400' 
                    : 'w-1.5 bg-indigo-500/20 dark:bg-indigo-400/20 hover:bg-indigo-500/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
