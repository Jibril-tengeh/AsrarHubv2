import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function RouqyaAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(null);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [targetLoops, setTargetLoops] = useState(1);
  const [currentLoop, setCurrentLoop] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [presetAudios, setPresetAudios] = useState<{label: string, links: string[], category: string, link?: string}[]>([
    { label: 'Ayat Al-Kursi', links: ['https://www.everyayah.com/data/Alafasy_128kbps/002255.mp3'], category: 'Coran' },
    { label: 'Al-Falaq', links: ['https://www.everyayah.com/data/Alafasy_128kbps/113001.mp3'], category: 'Coran' },
    { label: 'An-Nas', links: ['https://www.everyayah.com/data/Alafasy_128kbps/114001.mp3'], category: 'Coran' }
  ]);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'rouqya_presets'));
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              label: data.label, 
              links: data.links || (data.link ? [data.link] : []),
              category: data.category || 'Autres'
            };
          });
          
          setPresetAudios(prev => {
            const newPresets = [...docs];
            prev.forEach(p => {
              if (!newPresets.some(n => n.label === p.label)) {
                newPresets.push(p);
              }
            });
            return newPresets;
          });
        }
      } catch (error) {
        console.error("Error fetching presets", error);
      }
    };
    fetchPresets();
  }, []);

  const groupedAudios = presetAudios.reduce((acc, preset) => {
    const cat = preset.category || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(preset);
    return acc;
  }, {} as Record<string, typeof presetAudios>);

  const currentUrl = urls.length > 0 ? urls[currentUrlIndex] : '';

  const handleEnded = () => {
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      setCurrentLoop(prev => {
        const next = prev + 1;
        if (targetLoops === 0 || next < targetLoops) {
          setCurrentUrlIndex(0);
          if (urls.length === 1 && audioRef.current) {
             audioRef.current.currentTime = 0;
             audioRef.current.play().catch(e => {
               console.error("Playback error:", e);
               setIsPlaying(false);
             });
          }
          return next;
        } else {
          setIsPlaying(false);
          return next;
        }
      });
    }
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
        audioRef.current.play().catch(e => {
           console.error("Playback error:", e);
           setIsPlaying(false);
        });
    } else if (!isPlaying && audioRef.current) {
        audioRef.current.pause();
    }
  }, [isPlaying, currentUrlIndex]);

  const togglePlay = () => {
    if (!currentUrl) return;
    
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (targetLoops > 0 && currentLoop >= targetLoops) {
        setCurrentLoop(0);
        setCurrentUrlIndex(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      }
      setIsPlaying(true);
    }
  };

  const resetLoop = () => {
    setCurrentLoop(0);
    setCurrentUrlIndex(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-full mb-3">
          <Shield className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-display font-bold tracking-tight mb-1">Moteur Audio de Rouqya</h1>
        <p className="opacity-70 text-sm max-w-sm mx-auto leading-relaxed">
          Répétez un verset spécifique en boucle pour la purification nocturne.
        </p>
      </div>

      <div className="space-y-6">
        {/* URL Input */}
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5">
          <label className="block text-sm font-bold opacity-70 mb-3 uppercase tracking-wider">Source Audio</label>
          <div className="space-y-4 mb-4">
            {Object.entries(groupedAudios).map(([category, audios]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold opacity-50 uppercase tracking-widest mb-2 pl-1">{category}</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {audios.map((preset) => {
                    const presetUrls = preset.links || (preset.link ? [preset.link] : []);
                    const isActive = urls.length > 0 && presetUrls.length > 0 && urls[0] === presetUrls[0];
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setUrls(presetUrls);
                          setSelectedPresetLabel(preset.label);
                          setCurrentUrlIndex(0);
                          setCurrentLoop(0);
                          setIsPlaying(false);
                        }}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-teal-600 text-white shadow-lg' : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'}`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {urls.length > 1 && (
            <div className="mt-4 text-xs font-medium opacity-70 bg-black/5 dark:bg-white/5 p-3 rounded-lg">
              Séquence de {urls.length} pistes audio {selectedPresetLabel && `(${selectedPresetLabel})`}
              <div className="mt-2 space-y-1">
                {urls.map((u, i) => (
                   <div key={i} className={`truncate ${i === currentUrlIndex ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
                     {i + 1}. {selectedPresetLabel ? `Piste ${i + 1}` : u}
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loop Settings */}
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5">
          <label className="block text-sm font-bold opacity-70 mb-3 uppercase tracking-wider">Boucle (Répétitions)</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[1, 3, 7, 21, 41, 100, 313, 0].map(val => (
              <button
                key={val}
                onClick={() => setTargetLoops(val)}
                className={`py-3 rounded-xl font-bold transition-all ${targetLoops === val ? 'bg-teal-600 text-white shadow-md' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                {val === 0 ? '∞' : val}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-50 text-center">
            {targetLoops === 0 ? 'Le fichier tournera en boucle indéfiniment.' : `Sera répété ${targetLoops} fois.`}
          </p>
        </div>

        {/* Player Controls */}
        <div className="bg-black/5 dark:bg-white/5 p-8 rounded-3xl border border-black/5 dark:border-white/5 text-center relative overflow-hidden">
          {isPlaying && (
            <motion.div 
              className="absolute inset-0 bg-teal-500/5 pointer-events-none"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}
          
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest opacity-50 mb-1">Progression</p>
            <div className="text-4xl font-display font-bold text-teal-600 dark:text-teal-400">
              {currentLoop} <span className="text-2xl opacity-50">/ {targetLoops === 0 ? '∞' : targetLoops}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={resetLoop}
              className="p-4 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-6 h-6 opacity-70" />
            </button>

            <button 
              onClick={togglePlay}
              disabled={!currentUrl}
              className="w-20 h-20 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-teal-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-2" />}
            </button>

            <div className="p-4 bg-transparent rounded-full flex items-center justify-center">
              <Volume2 className="w-6 h-6 opacity-40" />
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentUrl}
        onEnded={handleEnded}
      />
    </div>
  );
}
