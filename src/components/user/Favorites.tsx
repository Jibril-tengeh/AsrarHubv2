import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, FileText, Headphones, Video, Trash2 } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'audio': return <Headphones className="w-5 h-5 text-emerald-500" />;
      case 'video': return <Video className="w-5 h-5 text-rose-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getRoute = (type: string, id: string) => {
    switch (type) {
      case 'text': return `/reading/${id}`;
      // In the future this could route to audio or video specific pages
      default: return `/reading/${id}`;
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-1">Favoris</h1>
        <p className="text-sm opacity-70">Votre bibliothèque personnalisée, disponible hors ligne.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-20">
          <Heart className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nothing here yet</h3>
          <p className="text-sm max-w-[200px]">
            Tap the heart icon on any post to save it for later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center gap-4 py-3 border-b border-black/5 dark:border-white/5 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer"
            >
              <div 
                className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex-shrink-0"
                onClick={() => navigate(getRoute(item.type, item.id))}
              >
                {getIcon(item.type)}
              </div>
              
              <div 
                className="flex-1 min-w-0"
                onClick={() => navigate(getRoute(item.type, item.id))}
              >
                <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                {item.category && (
                  <span className="text-xs font-medium opacity-70">
                    {item.category} • {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(item.id);
                }}
                className="p-3 opacity-50 hover:opacity-100 hover:text-rose-500 rounded-full transition-colors flex-shrink-0"
                title="Remove from favorites"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
