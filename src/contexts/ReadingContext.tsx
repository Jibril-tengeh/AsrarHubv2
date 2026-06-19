import React, { createContext, useContext, useState, useEffect } from 'react';

export type Note = {
  id: string;
  readingId: string;
  text: string;
  note: string;
  timestamp: number;
};

export type Progress = {
  readingId: string;
  title: string;
  percentage: number;
  lastRead: number;
};

type ReadingContextType = {
  notes: Note[];
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  getNotesForReading: (readingId: string) => Note[];
  
  progressList: Progress[];
  updateProgress: (readingId: string, title: string, percentage: number) => void;
  getLatestProgress: () => Progress | null;

  zenMode: boolean;
  setZenMode: (val: boolean) => void;
};

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('asrarhub_notes') || '[]'); } catch { return []; }
  });
  
  const [progressList, setProgressList] = useState<Progress[]>(() => {
    try { return JSON.parse(localStorage.getItem('asrarhub_progress') || '[]'); } catch { return []; }
  });

  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('asrarhub_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('asrarhub_progress', JSON.stringify(progressList));
  }, [progressList]);

  const addNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const getNotesForReading = (readingId: string) => notes.filter(n => n.readingId === readingId);

  const updateProgress = (readingId: string, title: string, percentage: number) => {
    setProgressList(prev => {
      const existingIdx = prev.findIndex(p => p.readingId === readingId);
      const newEntry = { readingId, title, percentage, lastRead: Date.now() };
      
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newEntry;
        return copy.sort((a, b) => b.lastRead - a.lastRead);
      }
      return [newEntry, ...prev].sort((a, b) => b.lastRead - a.lastRead);
    });
  };

  const getLatestProgress = () => {
    return progressList.length > 0 ? progressList[0] : null;
  };

  return (
    <ReadingContext.Provider value={{ 
      notes, addNote, removeNote, getNotesForReading, 
      progressList, updateProgress, getLatestProgress,
      zenMode, setZenMode
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (context === undefined) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
