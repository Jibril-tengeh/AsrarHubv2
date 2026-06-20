import React, { useState, useEffect } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { Link } from 'react-router-dom';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, SunnahTimes, Madhab } from 'adhan';
import { MapPin, Clock, Sun, Sunrise, Sunset, Moon, Map, ArrowLeft } from 'lucide-react';

export default function PrayerTimes() {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<AdhanPrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: Date} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError("Veuillez autoriser la géolocalisation pour calculer les heures exactes.");
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }, []);

  useEffect(() => {
    if (coords) {
      const coordinates = new Coordinates(coords.lat, coords.lng);
      const params = CalculationMethod.MuslimWorldLeague();
      params.madhab = Madhab.Shafi; // Standard
      
      const date = new Date();
      const times = new AdhanPrayerTimes(coordinates, date, params);
      setPrayerTimes(times);

      const next = times.nextPrayer();
      if (next !== 'none') {
         setNextPrayer({
            name: next,
            time: times.timeForPrayer(next)!
         });
      }
    }
  }, [coords]);

  const mapPrayerName = (name: string) => {
    const map: Record<string, string> = {
      fajr: 'Fajr',
      sunrise: 'Chourouq',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha'
    };
    return map[name] || name;
  };

  const getPrayerIcon = (name: string) => {
    switch(name) {
      case 'fajr': return <Sun className="w-5 h-5 text-amber-500 opacity-50" />;
      case 'sunrise': return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'dhuhr': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'asr': return <Sun className="w-5 h-5 text-amber-600" />;
      case 'maghrib': return <Sunset className="w-5 h-5 text-rose-500" />;
      case 'isha': return <Moon className="w-5 h-5 text-indigo-500" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pt-8 pb-24" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-6 relative flex items-center pt-6 justify-center text-center">
          <Link to="/tools" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold mb-1">Heures de Prières</h1>
          <p className="opacity-70 text-xs">Précision par géolocalisation</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 mt-4">
             <ShareToCommunity text="Découvrez cet outil : Heures de Prières" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-xs">
          {error}
        </div>
      )}

      {!coords && !error && (
        <div className="p-6 text-center bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse">
          <MapPin className="w-6 h-6 mx-auto mb-3 opacity-50" />
          <p className="text-sm opacity-70">Recherche de votre position...</p>
        </div>
      )}

      {prayerTimes && (
        <div className="space-y-4">
          {nextPrayer && (
            <div className="bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-2xl p-5 shadow-lg mb-6 relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">Prière Suivante</p>
                 <h2 className="text-2xl font-bold mb-1">{mapPrayerName(nextPrayer.name)}</h2>
                 <p className="text-xl font-light">{nextPrayer.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
               </div>
            </div>
          )}

          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3">
            {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((prayerName) => {
              const time = prayerTimes.timeForPrayer(prayerName as any);
              const isNext = nextPrayer?.name === prayerName;
              return (
                <div key={prayerName} className={`flex items-center justify-between p-4 rounded-2xl ${isNext ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                  <div className="flex items-center gap-4">
                    {getPrayerIcon(prayerName)}
                    <span className="capitalize">{mapPrayerName(prayerName)}</span>
                  </div>
                  <span className={isNext ? 'text-lg' : 'opacity-70'}>
                    {time?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
