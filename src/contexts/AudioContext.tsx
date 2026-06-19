import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type AudioContextType = {
  isPlaying: boolean;
  currentTitle: string | null;
  togglePlay: () => void;
  playText: (title: string, text: string) => void;
  stopPlayback: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // We keep a reference to the pause state, because SpeechSynthesis might pause/resume
  const togglePlay = () => {
    if (!window.speechSynthesis.speaking) return;
    
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const playText = (title: string, text: string) => {
    window.speechSynthesis.cancel();
    utterancesRef.current = [];
    
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const lang = isArabic ? 'ar-SA' : 'fr-FR';
    
    // Chunking text to prevent mobile TTS from hanging on long strings
    const fullText = title + ".\n" + text;
    // Split by common sentence terminators or newlines, and capture trailing text
    const chunks = fullText.match(/[^.!?\n]+[.!?\n]*|.+$/g)?.filter(c => c.trim().length > 0) || [fullText];
    
    const newUtterances: SpeechSynthesisUtterance[] = [];

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          setIsPlaying(false);
          setCurrentTitle(null);
        };
      } else {
        utterance.onend = () => {
          // Empty, just to ensure it fires if needed
        };
      }
      
      utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        setIsPlaying(false);
        setCurrentTitle(null);
      };
      
      newUtterances.push(utterance);
    });

    utterancesRef.current = newUtterances;
    setCurrentTitle(title);
    setIsPlaying(true);
    
    newUtterances.forEach(u => window.speechSynthesis.speak(u));
  };

  const stopPlayback = () => {
    window.speechSynthesis.cancel();
    utterancesRef.current = [];
    setIsPlaying(false);
    setCurrentTitle(null);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <AudioContext.Provider value={{ isPlaying, currentTitle, togglePlay, playText, stopPlayback }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioProvider');
  }
  return context;
}
