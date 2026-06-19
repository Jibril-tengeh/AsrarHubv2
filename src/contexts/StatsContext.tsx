import React, { createContext, useContext, useState, useEffect } from 'react';

type DailyStats = {
  date: string; // YYYY-MM-DD
  minutesRead: number;
};

type StatsContextType = {
  streak: number;
  todayMinutes: number;
  addReadingTime: (minutes: number) => void;
  dailyGoal: number;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DailyStats[]>(() => {
    try { return JSON.parse(localStorage.getItem('asrarhub_stats') || '[]'); } catch { return []; }
  });
  
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('asrarhub_streak') || '0', 10));
  const dailyGoal = 15; // 15 minutes a day

  // Setup streak calculation on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if we have read yesterday or today, if neither, streak is 0
    const hasReadToday = stats.some(s => s.date === today && s.minutesRead > 0);
    const hasReadYesterday = stats.some(s => s.date === yesterday && s.minutesRead > 0);
    
    let currentStreak = parseInt(localStorage.getItem('asrarhub_streak') || '0', 10);
    
    if (!hasReadToday && !hasReadYesterday && currentStreak > 0) {
      currentStreak = 0;
      setStreak(0);
      localStorage.setItem('asrarhub_streak', '0');
    }
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('asrarhub_stats', JSON.stringify(stats));
  }, [stats]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const addReadingTime = (minutes: number) => {
    const today = getTodayStr();
    
    setStats(prev => {
      const todayIdx = prev.findIndex(s => s.date === today);
      if (todayIdx >= 0) {
        const copy = [...prev];
        const oldMins = copy[todayIdx].minutesRead;
        copy[todayIdx].minutesRead += minutes;
        
        // Update streak if hitting the goal for the first time today
        if (oldMins < dailyGoal && copy[todayIdx].minutesRead >= dailyGoal) {
           const newStreak = streak + 1;
           setStreak(newStreak);
           localStorage.setItem('asrarhub_streak', newStreak.toString());
        }
        
        return copy;
      } else {
        const newStats = [...prev, { date: today, minutesRead: minutes }];
        if (minutes >= dailyGoal) {
           const newStreak = streak + 1;
           setStreak(newStreak);
           localStorage.setItem('asrarhub_streak', newStreak.toString());
        }
        return newStats;
      }
    });
  };

  const todayMinutes = stats.find(s => s.date === getTodayStr())?.minutesRead || 0;

  return (
    <StatsContext.Provider value={{ streak, todayMinutes, addReadingTime, dailyGoal }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
