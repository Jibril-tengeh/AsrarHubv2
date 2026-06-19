import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, AlignCenter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cleanString = (str: string) => {
  return str.replace(/[^a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
};

const taksirStep = (input: string) => {
  const letters = Array.from(input);
  const result = [];
  let left = 0;
  let right = letters.length - 1;
  
  // Croisement: 1ère lettre, dernière lettre, 2ème lettre, avant-dernière...
  while (left <= right) {
    if (left === right) {
      result.push(letters[left]);
    } else {
      result.push(letters[left]);
      result.push(letters[right]);
    }
    left++;
    right--;
  }
  return result.join('');
};

export default function TaksirGenerator() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [taksirGrid, setTaksirGrid] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTaksir = () => {
    if (!inputText) {
        setTaksirGrid([]);
        return;
    }
    
    setIsGenerating(true);
    
    // Simulate generation for visual feedback
    setTimeout(() => {
        const cleaned = cleanString(inputText);
        if (!cleaned) {
            setTaksirGrid([]);
            setIsGenerating(false);
            return;
        }

        const grid = [cleaned];
        let current = cleaned;
        let limit = 0; // Prevent infinite loop on edge cases
        
        while (limit < 1000) {
            const next = taksirStep(current);
            grid.push(next);
            current = next;
            
            if (current === cleaned) {
                break;
            }
            limit++;
        }
        
        setTaksirGrid(grid);
        setIsGenerating(false);
    }, 100);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/tools')}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight">La Brisure (Taksir)</h1>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300">
        <p className="text-sm font-medium">Le Taksir est une technique cryptographique des Asrar. Il consiste à croiser les lettres d'une phrase (vœu, ayat) en alternant la première et la dernière lettre jusqu'à recomposer la phrase initiale (Zimam).</p>
      </div>

      <div className="bg-black/5 dark:bg-white/10 p-6 rounded-3xl mb-8">
        <label className="block text-sm font-bold opacity-70 mb-2">Phrase (sans espaces idéalement)</label>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-white dark:bg-black p-4 text-xl text-center rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-cyan-500 font-bold font-arabic mb-4"
          placeholder="Ex: ياودود"
          dir="rtl"
        />
        
        <button 
          onClick={generateTaksir}
          disabled={isGenerating || !inputText}
          className="w-full bg-cyan-600 text-white font-bold p-4 rounded-xl hover:bg-cyan-700 transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlignCenter className="w-5 h-5" />}
          Générer la table des brisures
        </button>
      </div>

      {taksirGrid.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-xl border border-black/5 dark:border-white/5 relative">
            <h2 className="font-bold mb-4 flex justify-between items-center">
              <span>Grille de Taksir</span>
              <span className="text-xs bg-cyan-500/10 text-cyan-500 px-2 py-1 rounded-full font-mono">
                {taksirGrid.length - 1} lignes (Zimam)
              </span>
            </h2>
            
            <div className="overflow-x-auto pb-4">
              <div className="inline-flex flex-col min-w-full">
                {taksirGrid.map((row, i) => (
                  <div 
                    key={i} 
                    className={`flex justify-center gap-1 sm:gap-2 p-1.5 sm:p-2 border-b border-black/5 dark:border-white/5 ${
                      (i === 0 || i === taksirGrid.length - 1) ? 'bg-cyan-500/10 font-bold' : ''
                    }`}
                  >
                    <span className="w-6 text-xs opacity-50 flex items-center">{i + 1}</span>
                    <div className="flex-1 flex justify-center gap-1 sm:gap-3" dir="rtl">
                        {Array.from(row).map((char, j) => (
                        <span 
                            key={`${i}-${j}`} 
                            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-arabic text-lg sm:text-xl"
                        >
                            {char}
                        </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-xs opacity-70 flex justify-between">
                <span>Première ligne: Entrée</span>
                <span>Dernière ligne: Zimam (Retour à l'origine)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
