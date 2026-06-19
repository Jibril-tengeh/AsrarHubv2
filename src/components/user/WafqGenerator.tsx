import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Grid3X3, Grid2X2, Copy, Check, Type, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const abjadValues: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ء': 1,
  'ب': 2, 'ج': 3, 'د': 4,
  'ه': 5, 'ة': 5, 'و': 6, 'ؤ': 6,
  'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10,
  'ك': 20, 'ل': 30, 'م': 40, 'ن': 50,
  'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
  'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400,
  'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800, 'ظ': 900, 'غ': 1000
};

const calculateAbjad = (text: string) => {
  let sum = 0;
  for (let char of text) {
      if (abjadValues[char]) {
          sum += abjadValues[char];
      }
  }
  return sum;
};

export default function WafqGenerator() {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'number' | 'text'>('number');
  const [numberInput, setNumberInput] = useState<number | ''>('');
  const [textInput, setTextInput] = useState('');
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [copied, setCopied] = useState(false);

  const targetNumber = inputType === 'number' ? numberInput : calculateAbjad(textInput);

  const generateWafq3 = (sum: number) => {
    if (sum < 15) return null;
    const r = (sum - 12) % 3;
    const b = Math.floor((sum - 12) / 3);

    const getH = (n: number) => b + (n - 1) + (n >= 7 ? r : 0);

    return [
      [getH(8), getH(1), getH(6)],
      [getH(3), getH(5), getH(7)],
      [getH(4), getH(9), getH(2)]
    ];
  };

  const generateWafq4 = (sum: number) => {
    if (sum < 34) return null;
    const r = (sum - 30) % 4;
    const b = Math.floor((sum - 30) / 4);

    const getH = (n: number) => b + (n - 1) + (n >= 13 ? r : 0);

    return [
      [getH(8), getH(11), getH(14), getH(1)],
      [getH(13), getH(2), getH(7), getH(12)],
      [getH(3), getH(16), getH(9), getH(6)],
      [getH(10), getH(5), getH(4), getH(15)]
    ];
  };

  const wafq = typeof targetNumber === 'number' && targetNumber > 0 
    ? (gridSize === 3 ? generateWafq3(targetNumber) : generateWafq4(targetNumber))
    : null;

  const minTarget = gridSize === 3 ? 15 : 34;

  const copyWafq = () => {
    if (!wafq) return;
    const text = wafq.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-2xl font-display font-bold tracking-tight">Générateur de Wafq</h1>
      </div>

      <div className="mb-8">
        <p className="opacity-70 text-sm mb-6">
          Générez un carré magique (Wafq) selon les règles classiques du Asrar. Choisissez la taille du carré (3x3 ou 4x4) et entrez soit une valeur numérique, soit un mot en arabe (son poids Abjad sera calculé).
        </p>

        <div className="bg-black/5 dark:bg-white/10 p-6 rounded-3xl mb-8 space-y-6">
          <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button 
              onClick={() => setGridSize(3)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${gridSize === 3 ? 'bg-white dark:bg-black shadow' : 'opacity-60 hover:opacity-100'}`}
            >
              <Grid3X3 className="w-4 h-4" /> Musallath (3x3)
            </button>
            <button 
              onClick={() => setGridSize(4)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${gridSize === 4 ? 'bg-white dark:bg-black shadow' : 'opacity-60 hover:opacity-100'}`}
            >
              <Grid2X2 className="w-4 h-4" /> Murabba' (4x4)
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button 
              onClick={() => setInputType('number')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${inputType === 'number' ? 'bg-white dark:bg-black shadow' : 'opacity-60 hover:opacity-100'}`}
            >
              <Hash className="w-4 h-4" /> Nombre
            </button>
            <button 
              onClick={() => setInputType('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${inputType === 'text' ? 'bg-white dark:bg-black shadow' : 'opacity-60 hover:opacity-100'}`}
            >
              <Type className="w-4 h-4" /> Texte Arabe
            </button>
          </div>

          {inputType === 'number' ? (
            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Valeur cible (minimum {minTarget})</label>
              <input 
                type="number"
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-white dark:bg-black p-4 text-xl rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-purple-500 font-bold font-mono"
                placeholder={`Ex: ${gridSize === 3 ? '66 (Allah)' : '129 (Latif)'}`}
                min={minTarget}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Texte Arabe</label>
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-white dark:bg-black p-4 text-xl text-right rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-purple-500 font-bold font-arabic"
                placeholder="Ex: الله"
                dir="rtl"
              />
              {textInput && (
                <div className="mt-2 text-right text-sm">
                  Valeur Abjad calculée : <span className="font-bold text-purple-600 dark:text-purple-400">{targetNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {wafq ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-black/5 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {gridSize === 3 ? <Grid3X3 className="w-5 h-5 text-purple-500" /> : <Grid2X2 className="w-5 h-5 text-purple-500" />}
                  Wafq {gridSize === 3 ? 'Musallath' : "Murabba'"}
                </h2>
                
                <button 
                  onClick={copyWafq}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copié' : 'Copier'}</span>
                </button>
              </div>

              <div className={`grid gap-2 ${gridSize === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {wafq.map((row, rowIndex) => (
                  <React.Fragment key={`row-${rowIndex}`}>
                    {row.map((cell, colIndex) => (
                      <div 
                        key={`cell-${rowIndex}-${colIndex}`} 
                        className="aspect-square flex items-center justify-center p-1 sm:p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 font-mono text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-300"
                        dir="ltr"
                      >
                        {cell}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-4 text-sm opacity-70 font-mono justify-between">
                <span>Somme: <strong>{targetNumber}</strong></span>
                <span>Base (Miftah): <strong>{gridSize === 3 ? Math.floor(((targetNumber as number) - 12) / 3) : Math.floor(((targetNumber as number) - 30) / 4)}</strong></span>
                {gridSize === 3 && <span>Cœur (Muttahid): <strong>{wafq[1][1]}</strong></span>}
              </div>
            </div>
          </div>
        ) : typeof targetNumber === 'number' && targetNumber > 0 && targetNumber < minTarget ? (
          <div className="text-center p-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
            Le nombre cible doit être supérieur ou égal à {minTarget} pour un Wafq {gridSize}x{gridSize}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
