import React, { useState, useEffect } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { ArrowLeft, Clock, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANETS = [
  { name: 'Soleil', arabic: 'الشمس', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Vénus', arabic: 'الزهرة', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Mercure', arabic: 'عطارد', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { name: 'Lune', arabic: 'القمر', color: 'text-slate-300', bg: 'bg-slate-300/10' },
  { name: 'Saturne', arabic: 'زحل', color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-500/10' },
  { name: 'Jupiter', arabic: 'المشتري', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Mars', arabic: 'المريخ', color: 'text-red-500', bg: 'bg-red-500/10' }
];

// L'ordre chaldéen des planètes pour les heures est :
// Saturne, Jupiter, Mars, Soleil, Vénus, Mercure, Lune
const CHALDEAN_ORDER = [4, 5, 6, 0, 1, 2, 3];

// Jour de la semaine (Dimanche = 0, Lundi = 1...)
// Première heure du jour :
// Dimanche: Soleil (0)
// Lundi: Lune (3)
// Mardi: Mars (6)
// Mercredi: Mercure (2)
// Jeudi: Jupiter (5)
// Vendredi: Vénus (1)
// Samedi: Saturne (4)
const DAY_FIRST_PLANET_INDEX = [0, 3, 6, 2, 5, 1, 4];

export default function PlanetaryHours() {
  const navigate = useNavigate();
  const [sunrise, setSunrise] = useState('06:00');
  const [sunset, setSunset] = useState('18:00');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<any[]>([]);

  const calculateHours = () => {
    try {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      
      const [srHours, srMins] = sunrise.split(':').map(Number);
      const [ssHours, ssMins] = sunset.split(':').map(Number);
      
      const srDate = new Date(selectedDate);
      srDate.setHours(srHours, srMins, 0, 0);
      
      const ssDate = new Date(selectedDate);
      ssDate.setHours(ssHours, ssMins, 0, 0);
      
      const diffDay = ssDate.getTime() - srDate.getTime();
      const lengthOfDayHour = diffDay / 12; // En millisecondes
      
      // La journée planétaire islamique commence à Maghrib (coucher du soleil la veille)
      // Mais dans le calcul chaldéen standard, le jour (soleil) commence au lever du soleil (shuruq).
      // Nous allons juste calculer les 12 heures du jour de shuruq à maghrib.
      
      let currentPlanetIndex = CHALDEAN_ORDER.indexOf(DAY_FIRST_PLANET_INDEX[dayOfWeek]);
      
      let newHours = [];
      let startTime = srDate.getTime();
      
      for (let i = 0; i < 12; i++) {
        const endTime = startTime + lengthOfDayHour;
        
        const startObj = new Date(startTime);
        const endObj = new Date(endTime);
        
        const formatTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        const planetId = CHALDEAN_ORDER[currentPlanetIndex % 7];
        const planet = PLANETS[planetId];
        
        newHours.push({
          num: i + 1,
          start: formatTime(startObj),
          end: formatTime(endObj),
          planet
        });
        
        currentPlanetIndex++;
        startTime = endTime;
      }
      
      setHours(newHours);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    calculateHours();
  }, [sunrise, sunset, date]);

  // Si l'utilisateur autorise la géo, récupérer lever/coucher
  const getGeoTimes = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Utilisation d'une API gratuite pour sunrise/sunset (ex: sunrise-sunset.org)
          const res = await fetch(`https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${date}`);
          const data = await res.json();
          if (data.results) {
             // Convertir de "6:00:00 AM" à "06:00"
             const parseTime = (timeStr: string) => {
               const [time, modifier] = timeStr.split(' ');
               let [hours, minutes] = time.split(':');
               if (hours === '12') {
                 hours = '00';
               }
               if (modifier === 'PM') {
                 hours = (parseInt(hours, 10) + 12).toString();
               }
               return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
             };
             
             setSunrise(parseTime(data.results.sunrise));
             setSunset(parseTime(data.results.sunset));
          }
        } catch (e) {
          console.error('Erreur API sunrise', e);
        }
      });
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
        <h1 className="text-2xl font-display font-bold tracking-tight">Heures Planétaires</h1>
      </div>

      <div className="bg-black/5 dark:bg-white/10 p-6 rounded-3xl mb-8 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold flex items-center gap-2"><Clock className="w-5 h-5"/> Paramètres du jour</h2>
          <button onClick={getGeoTimes} className="text-xs bg-black/10 dark:bg-white/20 px-3 py-1.5 rounded-full font-bold">Autolocaliser</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold opacity-70 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10" />
          </div>
          <div>
            <label className="block text-xs font-bold opacity-70 mb-1 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500" /> Lever (Shuruq)</label>
            <input type="time" value={sunrise} onChange={e => setSunrise(e.target.value)} className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10" />
          </div>
          <div>
            <label className="block text-xs font-bold opacity-70 mb-1 flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-500" /> Coucher (Maghrib)</label>
            <input type="time" value={sunset} onChange={e => setSunset(e.target.value)} className="w-full bg-white dark:bg-black p-3 rounded-xl border border-black/10 dark:border-white/10" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/10">
        <h2 className="font-bold text-lg mb-4 ml-2">Heures du Jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {hours.map(hour => (
            <div key={hour.num} className={`p-3 rounded-xl flex items-center justify-between ${hour.planet.bg} border border-black/5 dark:border-white/5`}>
              <div className="flex items-center gap-3">
                <span className="opacity-50 text-xs font-bold w-4">{hour.num}</span>
                <div>
                  <div className={`font-bold ${hour.planet.color}`}>{hour.planet.name}</div>
                  <div className="text-xs opacity-70">{hour.start} - {hour.end}</div>
                </div>
              </div>
              <div className={`font-arabic text-xl font-bold ${hour.planet.color}`} dir="rtl">
                {hour.planet.arabic}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
