import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../../firebase/errorHandler';
import { FileText, Loader2, SlidersHorizontal, Search, Play, Flame, Clock, History, Star, LayoutGrid, LayoutList, Square } from 'lucide-react';
import { useStats } from '../../contexts/StatsContext';
import { useReading } from '../../contexts/ReadingContext';
import DailyAffirmation from './DailyAffirmation';

type LayoutType = 'grid' | 'single' | 'horizontal';

interface TextReading {
  id: string;
  title: string;
  category: string;
  coverImageUrl: string;
  content: string;
  hook?: string;
  updatedAt: any;
}

export default function HomeFeed() {
  const [readings, setReadings] = useState<TextReading[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      // Small timeout to allow input to mount and transitions to complete
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchExpanded]);

  const CATEGORIES = useMemo(() => {
    const dynamicCats = new Set<string>();
    readings.forEach(r => {
      if (typeof r.category === 'string' && r.category.trim() !== '') {
        dynamicCats.add(r.category);
      }
    });
    // Add default categories as fallback
    const baseCats = ['Finance', 'Psychology', 'Development', 'Philosophy', 'Science', 'History'];
    baseCats.forEach(c => dynamicCats.add(c));
    return ['All', ...Array.from(dynamicCats)];
  }, [readings]);

  // Swipe handling
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;

    // Horizontal swipe (threshold 50px)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        // swipe left -> next tab
        navigate('/tools');
      }
    }
    touchStartRef.current = null;
  };

  const { streak, todayMinutes, dailyGoal } = useStats();
  const { getLatestProgress } = useReading();
  const latestProgress = getLatestProgress();

  const [layout, setLayout] = useState<LayoutType>(() => {
    return (localStorage.getItem('asrarhub_home_layout') as LayoutType) || 'grid';
  });

  const [showFeatured, setShowFeatured] = useState<boolean>(() => {
    return localStorage.getItem('asrarhub_show_featured') === 'true';
  });
  const [showRecent, setShowRecent] = useState<boolean>(() => {
    return localStorage.getItem('asrarhub_show_recent') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('asrarhub_home_layout', layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('asrarhub_show_featured', String(showFeatured));
  }, [showFeatured]);

  useEffect(() => {
    localStorage.setItem('asrarhub_show_recent', String(showRecent));
  }, [showRecent]);

  useEffect(() => {
    // We remove orderBy to ensure all documents are retrieved even if they lack an updatedAt field
    const q = query(collection(db, 'texts'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: TextReading[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as TextReading);
        });
        
        // Sort readings by updatedAt descending
        data.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() || 0;
          const timeB = b.updatedAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setReadings(data);
        setErrorMsg(null);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        setErrorMsg(error.message);
        try {
            handleFirestoreError(error, OperationType.LIST, 'texts');
        } catch (e) {}
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeRecent: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
       if (user) {
         if (unsubscribeRecent) unsubscribeRecent();
         const qR = query(collection(db, 'users', user.uid, 'recent_views'), orderBy('timestamp', 'desc'), limit(5));
         unsubscribeRecent = onSnapshot(qR, (snap) => {
           setRecentViews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
         }, (err) => { /* Silently ignore permission errors for recent to avoid console noise */ });
       } else {
         if (unsubscribeRecent) {
           unsubscribeRecent();
           unsubscribeRecent = undefined;
         }
         setRecentViews([]);
       }
    });

    return () => {
       unsubAuth();
       if (unsubscribeRecent) unsubscribeRecent();
    };
  }, []);

  const featuredReadings = useMemo(() => {
    return readings.slice(0, 3);
  }, [readings]);

  const filteredReadings = useMemo(() => {
    let result = readings;
    if (activeCategory !== 'All') {
      result = result.filter(r => typeof r.category === 'string' && r.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery) {
      const q = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';
      if (q) {
        result = result.filter(r => {
          const plainContent = typeof r.content === 'string' ? r.content.replace(/<[^>]*>?/gm, '') : '';
          return (
            (typeof r.title === 'string' && r.title.toLowerCase().includes(q)) || 
            (typeof r.hook === 'string' && r.hook.toLowerCase().includes(q)) || 
            (typeof r.category === 'string' && r.category.toLowerCase().includes(q)) ||
            plainContent.toLowerCase().includes(q)
          );
        });
      }
    }
    return result;
  }, [readings, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="text-red-500 mb-2">Error loading readings</div>
        <div className="text-sm text-neutral-500">{errorMsg}</div>
      </div>
    );
  }

  return (
    <div 
      className="max-w-3xl mx-auto w-full px-4 pt-6 pb-8 min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gamification Dashboard */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-black/5 dark:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-1">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'opacity-50'}`} />
            <span className="font-bold text-lg">{streak}</span>
          </div>
          <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Day Streak</span>
        </div>
        <div className="bg-black/5 dark:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 bg-blue-500/20 dark:bg-blue-400/20" style={{ width: `${Math.min((todayMinutes / dailyGoal) * 100, 100)}%` }} />
          <div className="relative z-10 flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 opacity-70" />
            <span className="font-bold text-lg">{Math.round(todayMinutes)}<span className="text-sm opacity-70">/{dailyGoal}m</span></span>
          </div>
          <span className="relative z-10 text-xs font-semibold opacity-70 uppercase tracking-wider">Today Read</span>
        </div>
      </div>

      <DailyAffirmation />

      {/* Resume Reading Widget */}
      {latestProgress && latestProgress.percentage > 0 && latestProgress.percentage < 99 && (
        <div 
          onClick={() => navigate(`/reading/${latestProgress.readingId}`)}
          className="mb-8 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-60">Continue Reading</h2>
          </div>
          <div className="bg-black/5 dark:bg-white/10 p-4 rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-full bg-current text-white dark:text-black flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 fill-current ml-1" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight truncate mb-1">{latestProgress.title}</h3>
              <div className="w-full h-1.5 bg-black/10 dark:bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${latestProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs font-medium opacity-60 mt-1">{Math.round(latestProgress.percentage)}% completed</p>
            </div>
          </div>
        </div>
      )}

      {/* Featured articles */}
      {showFeatured && featuredReadings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
             <Star className="w-4 h-4 opacity-70" />
             <h2 className="text-sm font-bold uppercase tracking-wider opacity-60">À La Une</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
            {featuredReadings.map(reading => (
               <div 
                 key={reading.id}
                 onClick={() => navigate(`/reading/${reading.id}`)}
                 className="flex-shrink-0 w-64 md:w-72 snap-center cursor-pointer group"
               >
                 <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/10 relative mb-3 shadow-md transition-transform group-hover:scale-105">
                    {reading.coverImageUrl ? (
                      <img src={reading.coverImageUrl} alt={reading.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-current" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {reading.category && (
                        <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                          {reading.category}
                        </span>
                      )}
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{reading.title}</h3>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {showRecent && recentViews.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
             <History className="w-4 h-4 opacity-70" />
             <h2 className="text-sm font-bold uppercase tracking-wider opacity-60">Récemment Consultés</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
            {recentViews.map(view => (
               <div 
                 key={view.id}
                 onClick={() => navigate(`/reading/${view.readingId}`)}
                 className="flex-shrink-0 w-32 snap-start cursor-pointer group"
               >
                 <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black/5 dark:bg-white/10 relative mb-2 shadow-sm transition-transform group-hover:scale-105">
                    {view.coverImageUrl ? (
                      <img src={view.coverImageUrl} alt={view.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-current" />
                    )}
                 </div>
                 <h3 className="text-sm font-bold truncate opacity-90 group-hover:opacity-100">{view.title}</h3>
                 {view.category && <p className="text-[10px] uppercase font-semibold opacity-50 truncate">{view.category}</p>}
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Categories, and Layout Options */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex w-full">
          <div className="flex bg-black/5 dark:bg-white/10 rounded-2xl p-1 gap-1 overflow-x-auto hide-scrollbar w-full">
            
            {/* Search Icon */}
            <button 
              onClick={() => setIsSearchExpanded(!isSearchExpanded)} 
              className={`p-2 rounded-xl transition ${isSearchExpanded || searchQuery ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="Search"
            >
              <Search size={18} />
            </button>

            {/* Categories Dropdown Icon */}
            <div className="relative flex items-center">
              <button 
                className={`p-2 rounded-xl transition flex items-center gap-1 ${activeCategory !== 'All' ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                title="Categories"
              >
                <SlidersHorizontal size={18} />
                {activeCategory !== 'All' && (
                  <span className="text-xs font-semibold px-1 max-w-[80px] truncate">{activeCategory}</span>
                )}
              </button>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Filter by category"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="w-px bg-black/10 dark:bg-white/10 my-1 mx-1 flex-shrink-0"></div>

            <button 
              onClick={() => setShowFeatured(!showFeatured)} 
              className={`p-2 rounded-xl transition ${showFeatured ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="À La Une"
            >
              <Star size={18} />
            </button>
            <button 
              onClick={() => setShowRecent(!showRecent)} 
              className={`p-2 rounded-xl transition ${showRecent ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="Récemment Consultés"
            >
              <History size={18} />
            </button>
            
            <div className="w-px bg-black/10 dark:bg-white/10 my-1 mx-1 flex-shrink-0"></div>

            <button 
              onClick={() => setLayout('grid')} 
              className={`p-2 rounded-xl transition ${layout === 'grid' ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="Grille"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setLayout('single')} 
              className={`p-2 rounded-xl transition ${layout === 'single' ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="Single Grille"
            >
              <Square size={18} />
            </button>
            <button 
              onClick={() => setLayout('horizontal')} 
              className={`p-2 rounded-xl transition ${layout === 'horizontal' ? 'bg-white text-black dark:bg-black dark:text-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}
              title="Horizontal"
            >
              <LayoutList size={18} />
            </button>
          </div>
        </div>

        {/* Search Input (conditionally expanded) */}
        <AnimatePresence>
          {isSearchExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full overflow-hidden"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 opacity-50" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 h-11 bg-black/5 dark:bg-white/10 border-none rounded-2xl text-sm focus:ring-2 focus:ring-current outline-none"
                style={{ color: 'var(--theme-text)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={
        layout === 'grid' 
          ? 'grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10'
          : layout === 'horizontal'
            ? 'grid grid-cols-1 gap-y-4 sm:gap-y-6'
            : 'grid grid-cols-1 gap-y-8 sm:gap-y-10'
      }>
        {filteredReadings.length === 0 ? (
          <div className="col-span-12 text-center py-12 text-neutral-500 w-full">
            <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>No readings available yet.</p>
          </div>
        ) : (
          filteredReadings.map((reading) => (
            <div 
              key={reading.id}
              onClick={() => navigate(`/reading/${reading.id}`)}
              className={`group cursor-pointer ${
                layout === 'horizontal' 
                  ? 'flex flex-row items-center gap-4 p-3 rounded-3xl border border-black/5 dark:border-white/10 transition-transform active:scale-[0.99] hover:bg-black/5 dark:hover:bg-white/5 w-full' 
                  : 'flex flex-col w-full'
              }`}
            >
              <div className={`relative overflow-hidden shadow-md transition-transform active:scale-[0.98] bg-black/5 dark:bg-white/10 ${
                layout === 'horizontal'
                  ? 'w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-[20px]'
                  : layout === 'single'
                    ? 'rounded-[24px] aspect-square mb-3'
                    : 'rounded-[24px] aspect-[4/5] sm:aspect-square mb-3'
              }`}>
                {/* Background Image */}
                {reading.coverImageUrl ? (
                   <img 
                    src={reading.coverImageUrl} 
                    alt={reading.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                  />
                ) : (
                   <div className="absolute inset-0 opacity-20 bg-current" />
                )}
                
                {/* Category Badge on Image */}
                {reading.category && layout !== 'horizontal' && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="inline-flex items-center rounded-full bg-black/40 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold tracking-wide text-white border border-white/10 shadow-sm">
                      {reading.category}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Content Below / Right */}
              <div className={`${layout === 'horizontal' ? 'flex-1 min-w-0 pr-2' : 'px-1'} flex flex-col`}>
                {reading.category && layout === 'horizontal' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                    {reading.category}
                  </span>
                )}
                <h3 className={`font-extrabold leading-snug mb-1 transition-colors drop-shadow-sm opacity-90 group-hover:opacity-100 ${
                  layout === 'single' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                }`}>
                  {typeof reading.title === 'string' ? reading.title : 'Sans titre'}
                </h3>
                {(reading.hook || reading.content) && (
                   <p className={`text-xs sm:text-sm opacity-60 leading-relaxed ${
                    layout === 'single' ? 'line-clamp-3 mt-1.5 text-sm sm:text-base' 
                    : layout === 'horizontal' ? 'line-clamp-2' 
                    : 'line-clamp-2 mt-1'
                  }`}>
                    {reading.hook || (typeof reading.content === 'string' ? reading.content.replace(/<[^>]*>?/gm, '') : '')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
