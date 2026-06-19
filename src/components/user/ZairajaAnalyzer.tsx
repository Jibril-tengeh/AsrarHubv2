import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Wind, Flame, Droplets, Mountain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const elementsData = {
  Fire: { name: 'Feu', icon: Flame, color: 'text-red-500', bg: 'bg-red-500', letters: 'اهطمفشذ', desc: 'Énergie, rapidité, autorité, choses spirituelles.' },
  Earth: { name: 'Terre', icon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-500', letters: 'بوينصتض', desc: 'Stabilité, accroissement, finances, choses matérielles.' },
  Air: { name: 'Air', icon: Wind, color: 'text-amber-400', bg: 'bg-amber-400', letters: 'جزكسقثظ', desc: 'Mouvement, communication, pensée, voyages.' },
  Water: { name: 'Eau', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500', letters: 'دحلعرخغ', desc: 'Émotions, purification, liens, choses cachées.' }
};

const getElementStats = (text: string) => {
  const stats = { Fire: 0, Earth: 0, Air: 0, Water: 0, Total: 0 };
  let count = 0;
  
  for (let char of text) {
    if (elementsData.Fire.letters.includes(char)) { stats.Fire++; count++; }
    else if (elementsData.Earth.letters.includes(char)) { stats.Earth++; count++; }
    else if (elementsData.Air.letters.includes(char)) { stats.Air++; count++; }
    else if (elementsData.Water.letters.includes(char)) { stats.Water++; count++; }
  }
  
  stats.Total = count;
  return stats;
};

export default function ZairajaAnalyzer() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const stats = getElementStats(inputText);
  
  const getDominant = () => {
    if (stats.Total === 0) return null;
    const max = Math.max(stats.Fire, stats.Earth, stats.Air, stats.Water);
    if (stats.Fire === max) return 'Fire';
    if (stats.Earth === max) return 'Earth';
    if (stats.Air === max) return 'Air';
    if (stats.Water === max) return 'Water';
    return null;
  };

  const dominant = getDominant();

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/tools')}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Analyse Ésotérique (Zairaja)</h1>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300">
        <p className="text-sm font-medium">Selon la science occulte des lettres, chaque lettre arabe correspond à un des quatre éléments. Analysez la nature élémentaire de votre question ou de votre vœu pour en comprendre l'essence.</p>
      </div>

      <div className="bg-black/5 dark:bg-white/10 p-6 rounded-3xl mb-8">
        <label className="block text-sm font-bold opacity-70 mb-2">Tapez votre nom ou votre intention (Arabe)</label>
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-white dark:bg-black p-4 text-xl text-right rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-fuchsia-500 font-bold font-arabic min-h-[100px]"
          placeholder="Ex: الرزق"
          dir="rtl"
        />
      </div>

      {stats.Total > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.keys(elementsData) as Array<keyof typeof elementsData>).map((key) => {
              const el = elementsData[key];
              const val = stats[key as keyof typeof stats];
              const percentage = Math.round((val / stats.Total) * 100);
              const isDominant = key === dominant;
              
              const Icon = el.icon;
              
              return (
                <div key={key} className={`p-4 rounded-2xl border ${isDominant ? 'border-fuchsia-500 shadow-md bg-fuchsia-500/5' : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5'} relative overflow-hidden`}>
                  <div className={`absolute -bottom-2 -right-2 opacity-10 ${el.color}`}>
                    <Icon className="w-16 h-16" />
                  </div>
                  <div className="relative z-10">
                    <div className={`flex items-center gap-2 mb-2 font-bold ${el.color}`}>
                      <Icon className="w-4 h-4" />
                      {el.name}
                    </div>
                    <div className="text-3xl font-black mb-1">
                      {val} <span className="text-sm font-normal opacity-50">lettre{val > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${el.bg}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="text-xs font-bold opacity-70 mt-1 text-right">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {dominant && (
            <div className={`p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-neutral-900 shadow-lg relative overflow-hidden`}>
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${elementsData[dominant].bg} text-white`}>
                  {React.createElement(elementsData[dominant].icon, { className: 'w-8 h-8' })}
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-1">Nature Dominante : {elementsData[dominant].name}</h2>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Votre phrase est dominée par l'élément {elementsData[dominant].name}. 
                    <br/><br/>
                    <strong>Signification énergétique :</strong> {elementsData[dominant].desc}
                    <br/><br/>
                    <em>Dans la pratique ésotérique, un travail lié à cet élément est souvent effectué de préférence avec de l'encens correspondant et orienté vers une direction spécifique (ex: Est pour le Feu, Sud pour la Terre, Ouest pour l'Air, Nord pour l'Eau).</em>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
