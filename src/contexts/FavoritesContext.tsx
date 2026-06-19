import React, { createContext, useContext, useState, useEffect } from 'react';

type FavoriteItem = {
  id: string;
  type: 'text' | 'audio' | 'video';
  title: string;
  category?: string;
  timestamp: number;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  exportData: () => void;
  importData: (jsonData: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const stored = localStorage.getItem('asrarhub_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('asrarhub_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  const exportData = () => {
    const data = {
      favorites,
      themeId: localStorage.getItem('themeId'),
      textSize: localStorage.getItem('textSize'),
      arabicTextSize: localStorage.getItem('arabicTextSize'),
      notes: localStorage.getItem('asrarhub_notes'),
      progress: localStorage.getItem('asrarhub_progress'),
      stats: localStorage.getItem('asrarhub_stats'),
      streak: localStorage.getItem('asrarhub_streak')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asrarhub_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.favorites && Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      }
      if (data.themeId) localStorage.setItem('themeId', String(data.themeId));
      if (data.textSize) localStorage.setItem('textSize', String(data.textSize));
      if (data.arabicTextSize) localStorage.setItem('arabicTextSize', String(data.arabicTextSize));
      if (data.notes) localStorage.setItem('asrarhub_notes', String(data.notes));
      if (data.progress) localStorage.setItem('asrarhub_progress', String(data.progress));
      if (data.stats) localStorage.setItem('asrarhub_stats', String(data.stats));
      if (data.streak) localStorage.setItem('asrarhub_streak', String(data.streak));
      
      // Reload to apply settings and new context values
      window.location.reload();
    } catch (e) {
      alert('Invalid backup file');
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, exportData, importData }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
