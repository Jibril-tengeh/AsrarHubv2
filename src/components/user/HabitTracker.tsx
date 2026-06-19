import React, { useState } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { Link } from 'react-router-dom';
import { Activity, Flame, Target, Award, Calendar as CalendarIcon, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([
    { id: 1, title: 'Adhkar du Matin', streak: 12, completed: true, color: 'emerald' },
    { id: 2, title: 'Adhkar du Soir', streak: 11, completed: false, color: 'indigo' },
    { id: 3, title: 'Lecture Coran', streak: 45, completed: true, color: 'amber' },
    { id: 4, title: 'Prière Tahajjud', streak: 0, completed: false, color: 'purple' },
  ]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
         return { ...h, completed: !h.completed, streak: h.completed ? h.streak - 1 : h.streak + 1 };
      }
      return h;
    }));
  };

  // Generate some fake graph data
  const weeklyData = [0.4, 0.6, 0.5, 0.8, 0.9, 0.7, Math.random()];

  return (
    <div className="max-w-md mx-auto p-4 pt-8 pb-24" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">Analytics Pro</h1>
            <p className="opacity-70 text-sm">Votre évolution spirituelle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareToCommunity text="Découvrez cet outil : Analytics Pro (Suivi spirituel)" />
          <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <Flame className="w-16 h-16 absolute -right-2 -bottom-2 text-white/20" />
            <p className="text-white/80 text-sm font-medium mb-1">Plus longue série</p>
            <h2 className="text-4xl font-bold font-mono">45</h2>
            <p className="text-xs mt-1">Jours (Coran)</p>
         </div>
         
         <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 relative overflow-hidden">
            <Award className="w-16 h-16 absolute -right-2 -bottom-2 text-black/5 dark:text-white/5" />
            <p className="opacity-70 text-sm font-medium mb-1">Ratio Global</p>
            <h2 className="text-4xl font-bold font-mono text-emerald-500">76%</h2>
            <p className="text-xs opacity-50 mt-1">Les 30 derniers jours</p>
         </div>
      </div>

      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" />
        Objectifs Quotidiens
      </h3>
      
      <div className="space-y-3 mb-8">
        {habits.map((habit) => (
          <button 
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${habit.completed ? 'bg-black/5 dark:bg-white/5 opacity-50' : 'bg-black/5 dark:bg-white/5'}`}
          >
             <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${habit.completed ? `border-${habit.color}-500 bg-${habit.color}-500` : 'border-black/20 dark:border-white/20'}`}>
                   {habit.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className={`font-semibold ${habit.completed ? 'line-through' : ''}`}>{habit.title}</span>
             </div>
             <div className="flex items-center gap-1 opacity-70">
                <Flame className={`w-4 h-4 ${habit.completed ? `text-${habit.color}-500` : ''}`} />
                <span className="font-mono text-sm">{habit.streak}</span>
             </div>
          </button>
        ))}
      </div>

      <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
           <h3 className="font-bold">Activité Hebdomadaire</h3>
           <CalendarIcon className="w-4 h-4 opacity-50" />
        </div>
        
        <div className="flex items-end justify-between h-24 gap-2">
           {weeklyData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                 <div className="w-full bg-emerald-500 rounded-t-sm transition-all duration-500 hover:opacity-80 cursor-pointer" style={{ height: `${val * 100}%` }} />
              </div>
           ))}
        </div>
        <div className="flex justify-between mt-2 text-xs opacity-50 font-medium px-1">
           <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
      </div>
    </div>
  );
}
