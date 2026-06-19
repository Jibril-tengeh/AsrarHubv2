import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ArrowLeft, Loader2, Heart, Play, Maximize, Minimize, Settings, ChevronDown, ListPlus, Check, Clock, Sparkles, X } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useReading } from '../../contexts/ReadingContext';
import { useStats } from '../../contexts/StatsContext';
import { useAudioPlayer } from '../../contexts/AudioContext';

interface TextReading {
  id: string;
  title: string;
  category: string;
  coverImageUrl: string;
  content: string;
}

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reading, setReading] = useState<TextReading | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = id ? isFavorite(id) : false;

  const { zenMode, setZenMode, updateProgress, addNote } = useReading();
  const { addReadingTime } = useStats();
  const { playText, currentTitle } = useAudioPlayer();

  // Swipe handling
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const [progress, setProgress] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  
  // Highlight states
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [highlightCoords, setHighlightCoords] = useState({ top: 0, left: 0 });
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // AI Summary states
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Time tracking
  const activeTimeRef = useRef(0);
  const scrollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchReading() {
      if (!id) return;
      try {
        const docRef = doc(db, 'texts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const readingData = { id: docSnap.id, ...docSnap.data() } as TextReading;
          setReading(readingData);
          
          // Track recently viewed in Firestore
          if (auth.currentUser) {
             const recentRef = doc(db, 'users', auth.currentUser.uid, 'recent_views', docSnap.id);
             setDoc(recentRef, {
                readingId: docSnap.id,
                title: readingData.title,
                category: readingData.category || '',
                coverImageUrl: readingData.coverImageUrl || '',
                timestamp: serverTimestamp()
             }, { merge: true }).catch(err => console.error("Could not set recent view", err));
          }
        }
      } catch (error) {
        console.error("Error fetching reading:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReading();
  }, [id]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
      const body = document.body;
      const html = document.documentElement;
      const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      const windowBottom = windowHeight + window.pageYOffset;
      const currentProgress = Math.min((windowBottom / docHeight) * 100, 100);
      setProgress(currentProgress);
      
      if (id && reading && currentProgress > 0) {
        updateProgress(id, reading.title, currentProgress);
        
        // Debounce Firestore save
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (auth.currentUser) {
            const progressRef = doc(db, 'users', auth.currentUser.uid, 'reading_progress', id);
            setDoc(progressRef, {
              readingId: id,
              title: reading.title,
              percentage: currentProgress,
              timestamp: serverTimestamp()
            }, { merge: true }).catch(err => console.error("Could not save progress to firestore", err));
          }
        }, 2000); // 2 second debounce
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [id, reading]);

  // Restore scroll
  useEffect(() => {
    const restoreScroll = async () => {
      if (!id || loading || !reading) return;

      let savedProgress = 0;

      // Try fetching from Firestore first
      if (auth.currentUser) {
        try {
          const progressRef = doc(db, 'users', auth.currentUser.uid, 'reading_progress', id);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists() && progressSnap.data().percentage) {
            savedProgress = progressSnap.data().percentage;
          }
        } catch (err) {
          console.error("Error fetching progress from firestore", err);
        }
      }

      // Fallback to local storage
      if (savedProgress === 0) {
        const saved = localStorage.getItem('asrarhub_progress');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const p = parsed.find((p: any) => p.readingId === id);
            if (p && p.percentage > 0) {
              savedProgress = p.percentage;
            }
          } catch {}
        }
      }

      if (savedProgress > 0 && savedProgress < 100) {
        const body = document.body;
        const html = document.documentElement;
        const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        const targetY = (savedProgress / 100) * docHeight - window.innerHeight;
        if (targetY > 0) {
          window.scrollTo({ top: targetY, behavior: 'instant' as any });
        }
      }
    };

    restoreScroll();
  }, [id, loading, reading]);

  // Track time spent reading (every minute active)
  useEffect(() => {
    const interval = setInterval(() => {
      addReadingTime(1);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Auto scroll logic
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const scrollAccumulator = useRef<number>(0);

  const animateScroll = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = time - previousTimeRef.current;
      // Scroll by 30 pixels per second
      const scrollAmount = (deltaTime * 30) / 1000;
      scrollAccumulator.current += scrollAmount;
      
      if (scrollAccumulator.current >= 1) {
        const pixelsToScroll = Math.floor(scrollAccumulator.current);
        window.scrollBy({ top: pixelsToScroll, behavior: 'instant' as any });
        scrollAccumulator.current -= pixelsToScroll;
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateScroll);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      requestRef.current = requestAnimationFrame(animateScroll);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = null;
      scrollAccumulator.current = 0;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [autoScroll, animateScroll]);

  // Handle Text Selection for Highlights
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '' && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionRange(range);
        setHighlightCoords({
          top: rect.top - 60 + window.scrollY,
          left: rect.left + (rect.width / 2)
        });
        setShowHighlightMenu(true);
      } else {
        if (!showNoteInput) {
          setShowHighlightMenu(false);
          setSelectionRange(null);
        }
      }
    };
    
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [showNoteInput]);

  const saveHighlight = () => {
    if (selectionRange && reading && id) {
      addNote({
        id: Date.now().toString(),
        readingId: id,
        text: selectionRange.toString(),
        note: noteText,
        timestamp: Date.now()
      });
      setShowNoteInput(false);
      setShowHighlightMenu(false);
      setNoteText('');
      window.getSelection()?.removeAllRanges();
      // Optional: Add visual inline highlight logic here if needed
    }
  };

  const handleGenerateSummary = () => {
    if (!reading) return;
    setShowSummary(true);
    setSummaryLoading(true);
    // Simulate AI summary generation
    setTimeout(() => {
      setSummaryText("Ce texte aborde généralement des notions de spiritualité et d'élévation de l'âme, visant à purifier le cœur du lecteur par la méditation et la souvenance. Les thèmes centraux incluent le détachement des futilités du monde, l'importance de la régularité dans la pratique, et la recherche de la proximité divine par une attention constante (Hudoor).");
      setSummaryLoading(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold mb-2">Article introuvable</h1>
        <p className="text-neutral-500 mb-6">Cet article n'existe pas ou a été supprimé.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-full font-medium">Retour</button>
      </div>
    );
  }

  const safeContent = typeof reading.content === 'string' ? reading.content : '';
  const readingTime = Math.max(1, Math.ceil((safeContent.replace(/<[^>]*>?/gm, '').split(/\s+/).length || 0) / 200));

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
      if (dx > 0) {
        // swipe right -> go back
        navigate(-1);
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div 
      className={`min-h-screen ${zenMode ? 'pb-8' : 'pb-24'}`} 
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 h-1.5 bg-amber-500 z-[60] transition-all duration-150 rounded-r-full" style={{ width: `${progress}%` }} />

      {!zenMode && (
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 backdrop-blur-md border-b border-black/10 dark:border-white/10" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:opacity-50 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1.5 ml-2 opacity-50 px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{readingTime} min</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={handleGenerateSummary}
              className="p-2 rounded-full active:opacity-50 transition-colors text-purple-500 hover:bg-purple-500/10"
              title="Résumé IA"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button 
              onClick={() => playText(reading.title || '', safeContent.replace(/<[^>]*>?/gm, ''))}
              className={`p-2 rounded-full transition-colors active:opacity-50 ${currentTitle === reading.title ? 'text-blue-500' : ''}`}
              title="Listen to article"
            >
              <Play className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-2 rounded-full transition-colors active:opacity-50 ${autoScroll ? 'text-blue-500' : ''}`}
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setZenMode(true)}
              className="p-2 rounded-full active:opacity-50 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (favorite) removeFavorite(reading.id);
                else addFavorite({ id: reading.id, type: 'text', title: reading.title, category: reading.category, timestamp: Date.now() });
              }}
              className="p-2 -mr-2 rounded-full active:opacity-50 transition-colors"
            >
              <Heart className={`w-6 h-6 ${favorite ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Zen Mode Exit Overlay */}
      {zenMode && (
        <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
           <button onClick={() => setAutoScroll(!autoScroll)} className={`p-3 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg opacity-30 hover:opacity-100 transition-opacity`}>
              <ChevronDown className="w-5 h-5" />
           </button>
           <button onClick={() => setZenMode(false)} className="p-3 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg opacity-30 hover:opacity-100 transition-opacity">
              <Minimize className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* Highlight Tooltip */}
      {showHighlightMenu && (
        <div 
          className="absolute z-[80] transform -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ top: highlightCoords.top, left: highlightCoords.left }}
        >
          {showNoteInput ? (
            <div className="bg-black text-white dark:bg-white dark:text-black p-2 flex items-center gap-2 rounded-xl shadow-2xl">
              <input 
                type="text" 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="bg-transparent border-none outline-none text-sm w-48 px-2"
                autoFocus
              />
              <button onClick={saveHighlight} className="p-1.5 rounded-full bg-blue-500 text-white">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-2xl overflow-hidden divide-x divide-white/20 dark:divide-black/20">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNoteInput(true); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
              >
                <ListPlus className="w-4 h-4" />
                <span className="text-sm font-semibold">Highlight & Note</span>
              </button>
            </div>
          )}
          <div className="w-3 h-3 bg-black dark:bg-white transform rotate-45 -mt-3.5 -z-10" />
        </div>
      )}

      <div className="max-w-3xl mx-auto w-full">
        {reading.coverImageUrl && !zenMode && (
          <div className="w-full aspect-[4/3] sm:aspect-video relative overflow-hidden">
            <img src={reading.coverImageUrl} alt={reading.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        
        <div className={`px-4 ${zenMode ? 'py-16' : 'py-8'}`}>
          {!zenMode && reading.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold mb-4 opacity-80">
              {reading.category}
            </span>
          )}
          <h1 className={`${zenMode ? 'text-4xl sm:text-5xl opacity-80' : 'text-3xl sm:text-4xl'} font-extrabold mb-8 leading-tight transition-all`}>
            {typeof reading.title === 'string' ? reading.title : 'Sans titre'}
          </h1>
          
          <div 
            className="prose dark:prose-invert max-w-full overflow-hidden break-words"
            style={{ overflowWrap: 'anywhere' }}
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </div>
      </div>

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95">
            <button 
              onClick={() => setShowSummary(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold">Résumé IA</h2>
            </div>
            
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="opacity-70 text-sm">Génération de la synthèse en cours...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <p>{summaryText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
