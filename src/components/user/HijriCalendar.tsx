import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Moon, ArrowLeft } from 'lucide-react';

export default function HijriCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getHijriDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const today = () => setCurrentDate(new Date());

  const events = [
    { date: '1 Muharram', title: 'Nouvel An Hégirien' },
    { date: '10 Muharram', title: 'Achoura' },
    { date: '12 Rabi al-Awwal', title: 'Mawlid an-Nabi' },
    { date: '27 Rajab', title: 'Isra et Mi\'raj' },
    { date: '15 Chaabane', title: 'Nisf Chaabane' },
    { date: '1 Ramadan', title: 'Début du Ramadan' },
    { date: '27 Ramadan', title: 'Nuit du Destin (Laylat al-Qadr)' },
    { date: '1 Chawwal', title: 'Aïd al-Fitr' },
    { date: '9 Dhou al-Hijja', title: 'Jour de Arafat' },
    { date: '10 Dhou al-Hijja', title: 'Aïd al-Adha' },
  ];

  return (
    <div className="max-w-md mx-auto p-4 pt-8 pb-24" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="relative text-center mb-10 mt-4">
          <Link to="/tools" className="absolute left-0 top-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
          <Moon className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Calendrier Hégirien</h1>
        <p className="opacity-70 text-sm">Suivez les dates sacrées de l'Islam</p>
      
          <div className="absolute right-0 top-0">
             <ShareToCommunity text="Découvrez cet outil : Calendrier Hégirien" />
          </div>
        </div>

      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden text-center">
        <div className="flex items-center justify-between mb-6">
           <button onClick={prevDay} className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"><ChevronLeft className="w-6 h-6" /></button>
           <button onClick={today} className="text-sm font-medium opacity-80 uppercase tracking-widest hover:text-white transition-colors">Aujourd'hui</button>
           <button onClick={nextDay} className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"><ChevronRight className="w-6 h-6" /></button>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 capitalize">{getHijriDate(currentDate)}</h2>
        <p className="text-white/80">{currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-teal-600" />
        Dates Clés de l'Année
      </h3>
      
      <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-2">
        {events.map((event, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-2xl">
            <span className="font-mono text-sm text-teal-600 dark:text-teal-400 font-bold">{event.date}</span>
            <span className="font-medium">{event.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
