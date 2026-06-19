import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Headphones } from 'lucide-react';

export default function AudioFeed() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock playlist for now
  const audioList = [
    { id: '1', title: 'The Power of Habit: Intro', duration: '14:20', playlistName: 'Self Improvement' },
    { id: '2', title: 'Deep Work Strategies', duration: '22:15', playlistName: 'Focus' },
    { id: '3', title: 'Stoicism in Modern Life', duration: '18:45', playlistName: 'Philosophy' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black text-neutral-900 dark:text-white relative max-w-md mx-auto w-full object-cover">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Listen</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Curated audio sessions.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="space-y-4">
          {audioList.map((audio) => (
            <div key={audio.id} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-800 group-hover:bg-rose-500/20 transition-colors">
                <Headphones className="h-5 w-5 text-neutral-500 dark:text-neutral-400 group-hover:text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{audio.title}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{audio.playlistName}</p>
              </div>
              <div className="text-xs font-mono text-neutral-500">{audio.duration}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Mini Player */}
      <div className="absolute bottom-6 left-4 right-4 bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-xl dark:shadow-2xl border border-neutral-200 dark:border-neutral-700/50 flex items-center gap-4 backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">The Power of Habit: Intro</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Now Playing</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-neutral-500 hover:text-black dark:text-neutral-300 dark:hover:text-white">
            <SkipBack className="h-5 w-5 fill-current" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-10 w-10 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-1" />
            )}
          </button>
          <button className="text-neutral-500 hover:text-black dark:text-neutral-300 dark:hover:text-white">
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
