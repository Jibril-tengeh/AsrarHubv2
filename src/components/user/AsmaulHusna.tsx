import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Search, Calculator, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { asmaUlHusnaList } from '../../data/asmaUlHusna';

const surahNames: Record<string, string> = {
  "1": "Al-Fatiha", "2": "Al-Baqarah", "3": "Al Imran", "4": "An-Nisa", "5": "Al-Ma'idah", 
  "6": "Al-An'am", "7": "Al-A'raf", "8": "Al-Anfal", "9": "At-Tawbah", "10": "Yunus", 
  "11": "Hud", "12": "Yusuf", "13": "Ar-Ra'd", "14": "Ibrahim", "15": "Al-Hijr", 
  "16": "An-Nahl", "17": "Al-Isra", "18": "Al-Kahf", "19": "Maryam", "20": "Ta-Ha", 
  "21": "Al-Anbiya", "22": "Al-Hajj", "23": "Al-Mu'minun", "24": "An-Nur", "25": "Al-Furqan", 
  "26": "Ash-Shu'ara", "27": "An-Naml", "28": "Al-Qasas", "29": "Al-'Ankabut", "30": "Ar-Rum", 
  "31": "Luqman", "32": "As-Sajdah", "33": "Al-Ahzab", "34": "Saba", "35": "Fatir", 
  "36": "Ya-Sin", "37": "As-Saffat", "38": "Sad", "39": "Az-Zumar", "40": "Ghafir", 
  "41": "Fussilat", "42": "Ash-Shura", "43": "Az-Zukhruf", "44": "Ad-Dukhan", "45": "Al-Jathiyah", 
  "46": "Al-Ahqaf", "47": "Muhammad", "48": "Al-Fath", "49": "Al-Hujurat", "50": "Qaf", 
  "51": "Ad-Dhariyat", "52": "At-Tur", "53": "An-Najm", "54": "Al-Qamar", "55": "Ar-Rahman", 
  "56": "Al-Waqi'ah", "57": "Al-Hadid", "58": "Al-Mujadila", "59": "Al-Hashr", "60": "Al-Mumtahanah", 
  "61": "As-Saff", "62": "Al-Jumu'ah", "63": "Al-Munafiqun", "64": "At-Taghabun", "65": "At-Talaq", 
  "66": "At-Tahrim", "67": "Al-Mulk", "68": "Al-Qalam", "69": "Al-Haqqah", "70": "Al-Ma'arij", 
  "71": "Nuh", "72": "Al-Jinn", "73": "Al-Muzzammil", "74": "Al-Muddaththir", "75": "Al-Qiyamah", 
  "76": "Al-Insan", "77": "Al-Mursalat", "78": "An-Naba", "79": "An-Nazi'at", "80": "'Abasa", 
  "81": "At-Takwir", "82": "Al-Infitar", "83": "Al-Mutaffifin", "84": "Al-Inshiqaq", "85": "Al-Buruj", 
  "86": "At-Tariq", "87": "Al-A'la", "88": "Al-Ghashiyah", "89": "Al-Fajr", "90": "Al-Balad", 
  "91": "Ash-Shams", "92": "Al-Layl", "93": "Ad-Duhaa", "94": "Ash-Sharh", "95": "At-Tin", 
  "96": "Al-'Alaq", "97": "Al-Qadr", "98": "Al-Bayyinah", "99": "Az-Zalzalah", "100": "Al-'Adiyat", 
  "101": "Al-Qari'ah", "102": "At-Takathur", "103": "Al-'Asr", "104": "Al-Humazah", "105": "Al-Fil", 
  "106": "Quraysh", "107": "Al-Ma'un", "108": "Al-Kawthar", "109": "Al-Kafirun", "110": "An-Nasr", 
  "111": "Al-Masad", "112": "Al-Ikhlas", "113": "Al-Falaq", "114": "An-Nas"
};

const formatVerse = (verseStr: string) => {
  const parts = verseStr.split(':');
  if (parts.length === 2) {
    const surahId = parts[0];
    const surahName = surahNames[surahId] || `Sourate ${surahId}`;
    return `${surahName} (v. ${parts[1]})`;
  }
  return verseStr;
};

export default function AsmaulHusna() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fetchedVerses, setFetchedVerses] = useState<Record<number, string[]>>({});
  const [loadingVerses, setLoadingVerses] = useState<Record<number, boolean>>({});

  const loadMoreVerses = async (name: typeof asmaUlHusnaList[0]) => {
    if (loadingVerses[name.id]) return;
    
    setLoadingVerses(prev => ({ ...prev, [name.id]: true }));
    try {
      // Clean diacritics for better search results
      const searchWord = name.arabic.replace(/[\u064B-\u065F\u0670]/g, '');
      const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(searchWord)}/all/ar`);
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.matches) {
        // Extract verses and filter out the ones we already have
        const newVerses = data.data.matches.map((m: any) => `${m.surah.number}:${m.numberInSurah}`);
        const uniqueVerses = Array.from(new Set([...name.verses, ...newVerses]));
        
        setFetchedVerses(prev => ({ ...prev, [name.id]: uniqueVerses }));
      }
    } catch (error) {
      console.error("Error fetching verses:", error);
    } finally {
      setLoadingVerses(prev => ({ ...prev, [name.id]: false }));
    }
  };

  const filtered = asmaUlHusnaList.filter(name => 
    name.transliteration.toLowerCase().includes(search.toLowerCase()) || 
    name.meaning.toLowerCase().includes(search.toLowerCase()) ||
    name.arabic.includes(search)
  );

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:opacity-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Les 99 Noms</h1>
      </div>

      <div className="mb-4">
        <p className="opacity-70 text-sm">Découvrez les 99 Noms d'Allah, leurs significations, et leurs occurrences dans le Saint Coran.</p>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 opacity-50" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom..."
          className="w-full pl-9 pr-4 h-12 bg-black/5 dark:bg-white/10 border-none rounded-2xl font-medium focus:ring-2 focus:ring-amber-500 outline-none placeholder:opacity-50"
          style={{ color: 'var(--theme-text)' }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(name => {
          const isExpanded = expandedId === name.id;
          return (
            <div key={name.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/10 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
              <div className="absolute top-2 left-2 flex items-center gap-1 opacity-50 text-xs font-bold">
                <Calculator className="w-3 h-3" />
                {name.abjad}
              </div>
              <div className="absolute top-2 right-2 opacity-30 text-xs font-bold">
                #{name.id}
              </div>
              
              <h2 className="text-3xl font-arabic font-bold text-amber-500 mt-6 mb-2" dir="rtl">{name.arabic}</h2>
              <h3 className="font-bold text-lg mb-1">{name.transliteration}</h3>
              <p className="text-sm opacity-70 mb-4">{name.meaning}</p>
              
              {isExpanded && (
                <div className="w-full mt-2 pt-4 border-t border-black/10 dark:border-white/10 text-left text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="mb-4">
                    <span className="font-bold opacity-80 uppercase tracking-wider text-xs">Cité dans le Coran : </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {name.occurrences !== null ? `${name.occurrences} fois` : 'Mentionné dans les Hadiths'}
                    </span>
                  </div>
                  
                  {name.verses && name.verses.length > 0 && (
                    <div>
                      <span className="font-bold opacity-80 uppercase tracking-wider text-xs text-left mb-2 block">Versets :</span>
                      <div className="flex flex-wrap gap-2">
                        {(fetchedVerses[name.id] || name.verses).map((verse, idx) => (
                          <span key={idx} className="bg-black/10 dark:bg-white/20 px-2 py-1 rounded text-xs font-medium">
                            {formatVerse(verse)}
                          </span>
                        ))}
                        {name.occurrences !== null && name.occurrences > name.verses.length && !fetchedVerses[name.id] && (
                          <button 
                            onClick={() => loadMoreVerses(name)}
                            disabled={loadingVerses[name.id]}
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition-all"
                          >
                            {loadingVerses[name.id] ? 'Chargement...' : `+ Charger les autres (${name.occurrences - name.verses.length})`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4 mt-auto w-full">
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : name.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-colors ${isExpanded ? 'bg-black/10 dark:bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}
                >
                  <BookOpen className="w-4 h-4" />
                  {isExpanded ? 'Réduire' : 'Détails'}
                </button>
                <button 
                  onClick={() => {
                    let zikrName = name.arabic;
                    if (zikrName === "ذُو الْجَلَالِ وَالْإِكْرَامِ") {
                      zikrName = "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ";
                    } else {
                      zikrName = "يَا " + zikrName.replace(/^[\u0622\u0623\u0625\u0627\u0671][\u064B-\u065F]*\u0644[\u064B-\u065F]*/, "");
                    }
                    localStorage.setItem('tasbih_name', zikrName);
                    navigate('/tools/tasbih');
                  }}
                  className="flex-1 px-3 py-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-xl active:scale-95 transition-transform"
                >
                  Dhikr
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
