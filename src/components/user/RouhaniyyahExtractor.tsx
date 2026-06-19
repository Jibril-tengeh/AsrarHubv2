import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Ghost, Copy, Check } from 'lucide-react';
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

const units: Record<number, string> = {1:'ا', 2:'ب', 3:'ج', 4:'د', 5:'ه', 6:'و', 7:'ز', 8:'ح', 9:'ط'};
const tens: Record<number, string> = {10:'ي', 20:'ك', 30:'ل', 40:'م', 50:'ن', 60:'س', 70:'ع', 80:'ف', 90:'ص'};
const hundreds: Record<number, string> = {100:'ق', 200:'ر', 300:'ش', 400:'ت', 500:'ث', 600:'خ', 700:'ذ', 800:'ض', 900:'ظ'};

const calculateAbjad = (text: string) => {
  let sum = 0;
  for (let char of text) {
      if (abjadValues[char]) sum += abjadValues[char];
  }
  return sum;
};

const getIstintaqRoot = (num: number) => {
  let root = '';
  const u = num % 10;
  const t = Math.floor((num % 100) / 10) * 10;
  const h = Math.floor((num % 1000) / 100) * 100;
  const th = Math.floor(num / 1000);
  
  // Ordre traditionnel (Unités, Dizaines, Centaines, Milliers)
  if (u) root += units[u];
  if (t) root += tens[t];
  if (h) root += hundreds[h];
  if (th) root += 'غ'.repeat(th);
  return root;
};

export default function RouhaniyyahExtractor() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [copiedAnge, setCopiedAnge] = useState(false);
  const [copiedJinn, setCopiedJinn] = useState(false);

  const abjadSum = calculateAbjad(inputText);
  const root = abjadSum > 0 ? getIstintaqRoot(abjadSum) : '';

  // Suffixes angéliques supérieurs (A'il / Ya'il)
  const angelName = root ? root + 'ائيل' : '';
  
  // Suffixes esprits intérieurs / jinns (Tish / Yoush)
  const jinnName = root ? root + 'يوش' : '';

  const copyToClip = (text: string, type: 'ange' | 'jinn') => {
    navigator.clipboard.writeText(text);
    if (type === 'ange') {
      setCopiedAnge(true);
      setTimeout(() => setCopiedAnge(false), 2000);
    } else {
      setCopiedJinn(true);
      setTimeout(() => setCopiedJinn(false), 2000);
    }
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
        <h1 className="text-2xl font-display font-bold tracking-tight">Extraction Rouhani</h1>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
        <p className="text-sm font-medium">L'Istintaq est la science de faire "parler" les nombres. Il décompose la valeur numérique d'un nom ou d'un vœu en lettres pour en invoquer l'énergie angélique (Supérieure) et terrestre (Inférieure).</p>
      </div>

      <div className="bg-black/5 dark:bg-white/10 p-6 rounded-3xl mb-8">
        <label className="block text-sm font-bold opacity-70 mb-2">Texte Arabe (Nom, Vœu, Ayat)</label>
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-white dark:bg-black p-4 text-xl text-right rounded-xl border border-black/10 dark:border-white/10 focus:outline-none focus:border-rose-500 font-bold font-arabic min-h-[100px]"
          placeholder="Ex: لطيف"
          dir="rtl"
        />
        
        {abjadSum > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 justify-between items-center bg-white/50 dark:bg-black/50 p-4 rounded-xl">
            <div>
              <div className="text-xs font-bold opacity-70 uppercase">Valeur Abjad</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{abjadSum}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold opacity-70 uppercase">Racine (Istintaq)</div>
              <div className="text-2xl font-bold font-arabic">{root}</div>
            </div>
          </div>
        )}
      </div>

      {root && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Ghost className="w-24 h-24" /></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">Ruhani Ulwi (Angélique)</h2>
              <p className="text-xs opacity-70 mb-4">Gouverne la dimension spirituelle et l'invocation élevée.</p>
              
              <div className="flex gap-4 items-center justify-between mb-4">
                <div className="text-3xl font-bold font-arabic drop-shadow-md" dir="rtl">{angelName}</div>
                <button 
                  onClick={() => copyToClip(angelName, 'ange')}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors border border-white/20"
                >
                  {copiedAnge ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-sm font-mono opacity-80 border-t border-white/20 pt-3">
                {root} + ائيل
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-red-700 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Ghost className="w-24 h-24" /></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">Ruhani Sufli (Terrestre)</h2>
              <p className="text-xs opacity-70 mb-4">Gouverne la matérialisation et l'effet dans le monde physique.</p>
              
              <div className="flex gap-4 items-center justify-between mb-4">
                <div className="text-3xl font-bold font-arabic drop-shadow-md" dir="rtl">{jinnName}</div>
                <button 
                  onClick={() => copyToClip(jinnName, 'jinn')}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors border border-white/20"
                >
                  {copiedJinn ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-sm font-mono opacity-80 border-t border-white/20 pt-3">
                {root} + يوش
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
