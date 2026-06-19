import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { Link } from 'react-router-dom';
import { Scale, Users, Calculator, ArrowRight, DollarSign, ArrowLeft } from 'lucide-react';

export default function FaraidCalculator() {
  const [estate, setEstate] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male'); // The deceased
  const [survivors, setSurvivors] = useState({
    spouse: 0, // husband (if female) or wives (if male)
    sons: 0,
    daughters: 0,
    father: false,
    mother: false
  });

  const [results, setResults] = useState<any[]>([]);

  const calculateFaraid = () => {
    let unallocated = parseFloat(estate) || 0;
    if (unallocated <= 0) return;

    const shares: any[] = [];
    
    // Simplistic standard Faraid calculation based on core heirs
    // Disclaimer: True Faraid is highly complex. This is an educational estimation core.
    
    const spouseShareScale = gender === 'male' ? ((survivors.sons > 0 || survivors.daughters > 0) ? 1/8 : 1/4) : ((survivors.sons > 0 || survivors.daughters > 0) ? 1/4 : 1/2);
    
    if (survivors.spouse > 0) {
      const share = unallocated * spouseShareScale;
      shares.push({ name: gender === 'male' ? (survivors.spouse > 1 ? 'Épouses' : 'Épouse') : 'Époux', amount: share, fraction: gender === 'male' ? (spouseShareScale===1/8?'1/8':'1/4') : (spouseShareScale===1/4?'1/4':'1/2') });
      unallocated -= share;
    }

    if (survivors.father) {
      const share = unallocated * (1/6);
      shares.push({ name: 'Père', amount: share, fraction: '1/6' });
      // Keep running total correct? Yes, father's 1/6 is from total estate mathematically usually, but let's do simplistic total * fraction
      // Actually standard Faraid takes fractions from the TOTAL estate. Let's adjust to total.
    }

    // Recalculating based on total
    const total = parseFloat(estate);
    const newShares = [];
    let remainder = total;

    if (survivors.spouse > 0) {
       const amount = total * spouseShareScale;
       newShares.push({ name: gender === 'male' ? (survivors.spouse > 1 ? 'Épouses (total)' : 'Épouse') : 'Époux', amount });
       remainder -= amount;
    }

    if (survivors.mother) {
       const motherShare = (survivors.sons > 0 || survivors.daughters > 0) ? 1/6 : 1/3;
       const amount = total * motherShare;
       newShares.push({ name: 'Mère', amount });
       remainder -= amount;
    }

    if (survivors.father) {
       let fatherShare = 1/6;
       // If no male children, father may also take remainder. Simplified here.
       const amount = total * fatherShare;
       newShares.push({ name: 'Père', amount });
       remainder -= amount;
    }

    // Children take remainder. Ratio Son:Daughter = 2:1
    if (survivors.sons > 0 || survivors.daughters > 0) {
      const parts = (survivors.sons * 2) + survivors.daughters;
      const partValue = remainder / parts;
      
      if (survivors.sons > 0) {
        newShares.push({ name: `Fils (${survivors.sons})`, amount: partValue * 2 * survivors.sons });
      }
      if (survivors.daughters > 0) {
        newShares.push({ name: `Fille(s) (${survivors.daughters})`, amount: partValue * survivors.daughters });
      }
    } else {
      // If no children, remainder rules apply to parents/siblings (complex). Simplified catch-all.
      if (remainder > 0.01) {
         newShares.push({ name: 'Reste (Asabah / Trésor public)', amount: remainder });
      }
    }

    setResults(newShares);
  };

  return (
    <div className="max-w-md mx-auto p-4 pt-8 pb-24" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="relative text-center mb-10 mt-4">
        <Link to="/tools" className="absolute left-0 top-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Scale className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Calculateur de Faraid</h1>
        <p className="opacity-70 text-sm">Estimation des parts d'héritage islamique</p>
        <div className="absolute right-0 top-0">
          <ShareToCommunity text="Découvrez cet outil : Calculateur de Faraid" />
        </div>
      </div>

      <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 mb-6">
        <label className="block text-sm font-medium opacity-70 mb-2">Sexe du défunt</label>
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setGender('male')}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${gender === 'male' ? 'bg-rose-500 text-white' : 'bg-white dark:bg-black/40'}`}
          >
            Homme
          </button>
          <button 
            onClick={() => setGender('female')}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${gender === 'female' ? 'bg-rose-500 text-white' : 'bg-white dark:bg-black/40'}`}
          >
            Femme
          </button>
        </div>

        <label className="block text-sm font-medium opacity-70 mb-2">Valeur de l'héritage (Après dettes)</label>
        <div className="relative mb-6">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
          <input
            type="number"
            value={estate}
            onChange={(e) => setEstate(e.target.value)}
            placeholder="Ex: 50000"
            className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-rose-500 font-mono text-lg"
          />
        </div>

        <div className="space-y-4 mb-8">
           <h3 className="font-bold border-b border-black/10 dark:border-white/10 pb-2">Héritiers Vivants (Coraniques)</h3>
           
           <div className="flex items-center justify-between">
              <span className="opacity-80">{gender === 'male' ? 'Épouses' : 'Époux'}</span>
              <div className="flex items-center gap-3">
                 <button onClick={() => setSurvivors(s => ({...s, spouse: Math.max(0, s.spouse - 1)}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">-</button>
                 <span className="w-4 text-center font-bold">{survivors.spouse}</span>
                 <button onClick={() => setSurvivors(s => ({...s, spouse: gender === 'male' ? Math.min(4, s.spouse + 1) : Math.min(1, s.spouse + 1)}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">+</button>
              </div>
           </div>

           <div className="flex items-center justify-between">
              <span className="opacity-80">Fils</span>
              <div className="flex items-center gap-3">
                 <button onClick={() => setSurvivors(s => ({...s, sons: Math.max(0, s.sons - 1)}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">-</button>
                 <span className="w-4 text-center font-bold">{survivors.sons}</span>
                 <button onClick={() => setSurvivors(s => ({...s, sons: s.sons + 1}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">+</button>
              </div>
           </div>

           <div className="flex items-center justify-between">
              <span className="opacity-80">Filles</span>
              <div className="flex items-center gap-3">
                 <button onClick={() => setSurvivors(s => ({...s, daughters: Math.max(0, s.daughters - 1)}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">-</button>
                 <span className="w-4 text-center font-bold">{survivors.daughters}</span>
                 <button onClick={() => setSurvivors(s => ({...s, daughters: s.daughters + 1}))} className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 font-bold">+</button>
              </div>
           </div>

           <div className="flex items-center justify-between pt-2">
              <span className="opacity-80">Père</span>
              <input type="checkbox" checked={survivors.father} onChange={e => setSurvivors(s => ({...s, father: e.target.checked}))} className="w-5 h-5 accent-rose-500" />
           </div>

           <div className="flex items-center justify-between">
              <span className="opacity-80">Mère</span>
              <input type="checkbox" checked={survivors.mother} onChange={e => setSurvivors(s => ({...s, mother: e.target.checked}))} className="w-5 h-5 accent-rose-500" />
           </div>
        </div>

        <button 
          onClick={calculateFaraid}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calculator className="w-5 h-5" /> Calculer les Parts
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-black text-white p-6 rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
           <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-4">Répartition Estimée</h3>
           
           <div className="space-y-4 relative">
             <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
             {results.map((res, i) => (
               <div key={i} className="flex flex-col relative pl-8">
                 <div className="absolute left-2.5 top-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                 <span className="opacity-70 text-sm">{res.name}</span>
                 <span className="text-xl font-mono font-bold text-rose-400">{res.amount.toFixed(2)}</span>
               </div>
             ))}
           </div>

           <div className="mt-6 p-4 bg-rose-500/20 text-rose-200 rounded-xl text-xs leading-relaxed">
             Avertissement : Ceci est une estimation éducative simplifiée qui ne prend pas en compte les sœurs, frères, grands-parents et les exclusions complexes (Hajb). Consultez toujours un spécialiste juridique pour les partages réels.
           </div>
        </div>
      )}
    </div>
  );
}
