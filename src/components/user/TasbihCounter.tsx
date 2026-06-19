import React, { useState, useEffect } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, RotateCcw, Target, Fingerprint, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TasbihCounter() {
  const navigate = useNavigate();
  const [count, setCount] = useState(() => parseInt(localStorage.getItem('tasbih_count') || '0', 10));
  const [target, setTarget] = useState(() => parseInt(localStorage.getItem('tasbih_target') || '100', 10));
  const [dhikrName, setDhikrName] = useState(() => localStorage.getItem('tasbih_name') || 'سبحان الله');
  
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('tasbih_count', count.toString());
  }, [count]);

  useEffect(() => {
    localStorage.setItem('tasbih_target', target.toString());
    localStorage.setItem('tasbih_name', dhikrName);
  }, [target, dhikrName]);

  const playTargetSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio not supported or blocked', e);
    }
  };

  const handleTap = () => {
    const nextCount = count + 1;
    if (nextCount > 0 && nextCount % target === 0) {
      playTargetSound();
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } else if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
    setCount(nextCount);
  };

  const handleReset = () => {
    setCount(0);
  };

  const progress = Math.min((count / target) * 100, 100);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen flex flex-col" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:opacity-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Tasbih Intelligent</h1>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 -mr-2 rounded-full active:opacity-50">
          <Settings2 className="w-6 h-6" />
        </button>
      </div>

      {showSettings && (
        <div className="bg-black/5 dark:bg-white/10 p-4 rounded-2xl mb-8 space-y-4">
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1">Nom du Dhikr</label>
            <input 
              type="text" 
              value={dhikrName}
              onChange={(e) => setDhikrName(e.target.value)}
              className="w-full bg-transparent border-b border-black/20 dark:border-white/20 p-2 outline-none font-arabic text-xl text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1">Objectif (Target)</label>
            <input 
              type="number" 
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
              className="w-full bg-transparent border-b border-black/20 dark:border-white/20 p-2 outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-4xl md:text-5xl font-arabic font-bold mb-12 text-center text-emerald-600 dark:text-emerald-400 drop-shadow-sm leading-relaxed" dir="rtl">{dhikrName}</div>
        
        {/* Circular Progress & Counter */}
        <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128" cy="128" r="120"
              stroke="currentColor" strokeWidth="8" fill="none"
              className="opacity-10"
            />
            <circle
              cx="128" cy="128" r="120"
              stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className="text-emerald-500 transition-all duration-300 ease-out"
            />
          </svg>
          
          <div className="text-center flex flex-col items-center relative z-10">
            <span className="text-6xl font-bold tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <div className="flex items-center gap-1 opacity-50 mt-2">
              <Target className="w-4 h-4" />
              <span className="font-semibold">{target}</span>
            </div>
            {count > 0 && (
              <button 
                onClick={handleReset}
                className="absolute -bottom-12 p-2 rounded-full bg-black/5 dark:bg-white/10 text-red-500/80 active:text-red-500 hover:text-red-500 active:scale-95 transition-all"
                title="Réinitialiser"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tap Area */}
        <button 
          onClick={handleTap}
          className="w-full max-w-sm h-48 bg-emerald-500 rounded-3xl text-white shadow-[0_8px_30px_rgb(16,185,129,0.3)] active:scale-95 transition-transform flex flex-col items-center justify-center gap-4 focus:outline-none select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Fingerprint className="w-16 h-16 opacity-50" />
          <span className="text-xl font-bold tracking-widest uppercase opacity-90">Tap</span>
        </button>
      </div>
    </div>
  );
}
