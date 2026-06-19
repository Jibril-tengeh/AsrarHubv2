import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, Upload, LogOut, User } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, themes, setThemeId, textSize, setTextSize, arabicTextSize, setArabicTextSize } = useSettings();
  const { exportData, importData } = useFavorites();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        importData(content);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-12 pb-24 min-h-screen">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full transition-colors active:opacity-50"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold tracking-tight ml-2">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Account Settings */}
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Compte</h2>
          <div className="space-y-3">
             <button
               onClick={() => navigate('/profile')}
               className="w-full flex items-center justify-between py-4 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 font-medium transition-colors"
             >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-neutral-500" />
                  Mon Profil
                </div>
             </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-4 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </div>
            </button>
          </div>
        </section>

        {/* Text Size */}
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-6 opacity-60">Apparence & Affichage</h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-4">
                <span className="font-medium">Taille du texte (Interface)</span>
                <span className="opacity-70 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{textSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" max="24" step="1"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="w-full accent-current h-2 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-neutral-800 border-none"
              />
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/50">
                <p className="opacity-80" style={{ fontSize: `${textSize}px`}}>
                  Aperçu : Le vif zéphyr jubile sur les kumquats du clown gracieux.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Taille du texte Arabe</span>
                <span className="opacity-70 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{arabicTextSize}px</span>
              </div>
              <input 
                type="range" 
                min="16" max="40" step="2"
                value={arabicTextSize}
                onChange={(e) => setArabicTextSize(Number(e.target.value))}
                className="w-full accent-current h-2 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-neutral-800 border-none"
              />
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/50">
                <p className="opacity-80 font-arabic leading-relaxed" style={{ fontSize: `${arabicTextSize}px`}} dir="rtl">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Themes */}
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-60">Thème</h2>
            <span className="text-xs opacity-70 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">{themes.length} couleurs</span>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`aspect-square rounded-full relative border-2 ${theme.id === t.id ? 'border-[var(--current-text)] scale-110 shadow-md ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-[var(--current-text)]' : 'border-black/5 dark:border-white/5 scale-100 hover:scale-105 active:scale-95'} transition-all duration-200`}
                style={{ backgroundColor: t.bgHex }}
                title={t.name}
              >
                {theme.id === t.id && (
                  <Check className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: t.textHex }} />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Data Backup */}
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 mb-[100px]">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Sauvegarde locale</h2>
          <p className="text-sm opacity-70 mb-6 leading-relaxed">
            Vos paramètres et favoris sont stockés localement. Vous pouvez les exporter pour les sauvegarder ou les transférer vers un autre appareil.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-95 border-2 hover:opacity-90"
              style={{ color: theme.bgHex, backgroundColor: theme.textHex, borderColor: theme.textHex }}
            >
              <Download className="w-5 h-5" />
              Exporter les données
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-transparent border-2 font-medium transition-all active:scale-95 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              style={{ borderColor: theme.textHex, color: theme.textHex }}
            >
              <Upload className="w-5 h-5" />
              Importer des données
            </button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
