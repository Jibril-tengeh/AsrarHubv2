import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRightLeft, Save, Trash2, ArrowLeft, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShareToCommunity from './ShareToCommunity';

const abjadTableMashriqi: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ء': 1,
  'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'ة': 5, 'و': 6, 'ؤ': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50,
  'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
  'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700,
  'ض': 800, 'ظ': 900, 'غ': 1000
};

const abjadTableMaghrebi: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ء': 1,
  'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'ة': 5, 'و': 6, 'ؤ': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50,
  'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
  'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700,
  'ظ': 800, 'غ': 900, 'ش': 1000
};

type SavedCalculation = {
  id: string;
  text: string;
  value: number;
  type: 'Mashriqi' | 'Maghrebi';
};

export default function AbjadCalculator() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [useMaghrebi, setUseMaghrebi] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('abjad_saved') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('abjad_saved', JSON.stringify(savedCalculations));
  }, [savedCalculations]);
  
  const currentTable = useMaghrebi ? abjadTableMaghrebi : abjadTableMashriqi;
  
  const calculateAbjad = (str: string) => {
    let sum = 0;
    for (let char of str) {
      if (currentTable[char]) {
        sum += currentTable[char];
      }
    }
    return sum;
  };

  const handleSave = () => {
    if (!text.trim()) return;
    const value = calculateAbjad(text);
    const newSave: SavedCalculation = {
      id: Date.now().toString(),
      text: text.trim(),
      value,
      type: useMaghrebi ? 'Maghrebi' : 'Mashriqi'
    };
    setSavedCalculations([newSave, ...savedCalculations]);
  };

  const handleDelete = (id: string) => {
    setSavedCalculations(savedCalculations.filter(c => c.id !== id));
  };

  const wordBreakdown = text.split(/\s+/).filter(w => w.trim().length > 0).map(word => {
    let wordSum = 0;
    for (let char of word) {
      if (currentTable[char]) {
        wordSum += currentTable[char];
      }
    }
    return { word, wordSum };
  });

  const totalValue = calculateAbjad(text);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:opacity-50 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-display font-bold tracking-tight">Calculateur Abjad</h1>
        </div>
        <ShareToCommunity text={`Découvrez cet outil : Calculateur Abjad \nMon résultat pour "${text}": ${totalValue}`} />
      </div>

      <div className="mb-4">
        <p className="opacity-70 text-sm">Calculez la valeur numérique (Hisab al-Jummal) du texte arabe, avec support pour Mashriqi et Maghrebi.</p>
      </div>

      <div className="flex items-center justify-between mb-4 bg-black/5 dark:bg-white/10 p-2 rounded-xl">
        <button 
          onClick={() => setUseMaghrebi(false)} 
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!useMaghrebi ? 'bg-white dark:bg-black shadow' : 'opacity-50'}`}
        >
          Mashriqi (Orient)
        </button>
        <button 
          onClick={() => setUseMaghrebi(true)} 
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${useMaghrebi ? 'bg-white dark:bg-black shadow' : 'opacity-50'}`}
        >
          Maghrebi (Occident)
        </button>
      </div>

      <div className="bg-black/5 dark:bg-white/10 p-6 rounded-2xl mb-6 shadow-inner relative group">
        <textarea
           value={text}
           onChange={(e) => setText(e.target.value)}
           placeholder="أدخل النص العربي هنا..."
           className="w-full bg-transparent border-none outline-none resize-none h-32 text-right text-xl font-arabic leading-relaxed"
           dir="rtl"
           style={{ color: 'var(--theme-text)' }}
        />
        {text.trim().length > 0 && (
          <button 
            onClick={handleSave}
            className="absolute bottom-4 left-4 p-2 rounded-full bg-blue-500 text-white shadow-lg active:scale-95 transition-transform"
            title="Enregistrer le calcul"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-8 mb-8 bg-black/5 dark:bg-white/10 rounded-2xl">
        <div className="text-sm opacity-70 uppercase tracking-widest mb-2 font-semibold">Total Value</div>
        <div className="text-6xl font-bold text-blue-500">{totalValue}</div>
      </div>

      {wordBreakdown.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 opacity-80 uppercase tracking-widest text-sm">Word Breakdown</h3>
          <div className="flex flex-wrap gap-3 justify-end" dir="rtl">
            {wordBreakdown.map((item, idx) => (
              <div key={idx} className="bg-black/5 dark:bg-white/10 px-4 py-2 rounded-xl flex items-center justify-between gap-4 min-w-[100px]">
                <span className="font-arabic text-lg">{item.word}</span>
                <span className="font-bold text-blue-500">{item.wordSum}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Calculations */}
      {savedCalculations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 opacity-80 border-b border-black/10 dark:border-white/10 pb-2">
            <Bookmark className="w-5 h-5" />
            <h3 className="text-lg font-bold uppercase tracking-widest text-sm">Calculs Enregistrés</h3>
          </div>
          
          <div className="space-y-3">
            {savedCalculations.map((calc) => (
              <div key={calc.id} className="bg-black/5 dark:bg-white/10 p-4 rounded-xl flex items-center justify-between gap-4">
                <button 
                  onClick={() => handleDelete(calc.id)} 
                  className="p-2 opacity-50 hover:opacity-100 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div 
                  className="flex-1 flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    setText(calc.text);
                    setUseMaghrebi(calc.type === 'Maghrebi');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-black/10 dark:bg-white/20 font-bold uppercase tracking-widest opacity-80">
                      {calc.type}
                    </span>
                    <span className="font-bold text-xl text-blue-500">{calc.value}</span>
                  </div>
                  <span className="font-arabic text-lg text-right truncate pl-4" dir="rtl">{calc.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

