import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ZakatCalculator() {
  const navigate = useNavigate();
  const [cash, setCash] = useState<number | ''>('');
  const [bank, setBank] = useState<number | ''>('');
  const [goldValue, setGoldValue] = useState<number | ''>('');
  const [silverValue, setSilverValue] = useState<number | ''>('');
  const [debts, setDebts] = useState<number | ''>('');
  const [nisab, setNisab] = useState<number>(4500); // Approximate Nisab value in local currency (EUR/USD, etc.)

  const totalAssets = (Number(cash) || 0) + (Number(bank) || 0) + (Number(goldValue) || 0) + (Number(silverValue) || 0);
  const netAssets = totalAssets - (Number(debts) || 0);
  const zakatDue = netAssets >= nisab ? netAssets * 0.025 : 0;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/tools')}
          className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Calculateur de Zakat</h1>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
        <p className="text-sm font-medium">Pour être redevable de la Zakat, votre richesse nette doit égaler ou dépasser le seuil du Nissab (qui est estimé à environ la valeur de 85g d'or).</p>
      </div>

      <div className="space-y-6">
        <div className="bg-black/5 dark:bg-white/10 p-5 rounded-2xl">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            Paramètres actuels
          </h2>
          <div>
            <label className="block text-sm font-bold opacity-70 mb-2">Valeur du Nissab (votre devise)</label>
            <input 
              type="number"
              value={nisab}
              onChange={(e) => setNisab(Number(e.target.value))}
              className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-emerald-500"
              placeholder="Ex: 4500"
            />
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/10 p-5 rounded-2xl space-y-4">
          <h2 className="font-bold text-lg mb-2">Vos Avoirs</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Argent liquide à la maison</label>
              <input 
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Argent en banque</label>
              <input 
                type="number"
                value={bank}
                onChange={(e) => setBank(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Valeur de l'Or possédé</label>
              <input 
                type="number"
                value={goldValue}
                onChange={(e) => setGoldValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-bold opacity-70 mb-2">Valeur de l'Argent possédé</label>
              <input 
                type="number"
                value={silverValue}
                onChange={(e) => setSilverValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/10 p-5 rounded-2xl">
          <h2 className="font-bold text-lg mb-4">Vos Dettes & Passifs</h2>
          <div>
            <label className="block text-sm font-bold opacity-70 mb-2">Dettes à rembourser à court terme</label>
            <input 
              type="number"
              value={debts}
              onChange={(e) => setDebts(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-red-500"
              min="0"
            />
          </div>
        </div>

        <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg mt-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <Coins className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-4">Bilan de la Zakat</h2>
            
            <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
              <span>Total des avoirs :</span>
              <span className="font-bold text-lg">{totalAssets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
              <span>Moins les dettes :</span>
              <span className="font-bold text-red-100">- {Number(debts || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-4">
              <span>Richesse Nette :</span>
              <span className="font-bold text-xl">{netAssets.toLocaleString()}</span>
            </div>
            
            <div className="pt-4">
              {netAssets < nisab ? (
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <p className="font-bold text-lg text-center">Votre richesse nette est inférieure au Nissab.</p>
                  <p className="text-center opacity-90 text-sm mt-1">Vous n'avez pas de Zakat obligatoire à payer pour le moment.</p>
                </div>
              ) : (
                <div className="bg-white text-emerald-600 p-4 rounded-xl text-center shadow-md">
                  <p className="font-bold text-sm uppercase tracking-wider mb-1">Montant à donner (2.5%)</p>
                  <p className="text-4xl font-black">{zakatDue.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
