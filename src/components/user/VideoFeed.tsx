import React from 'react';
import { PlayCircle } from 'lucide-react';

export default function VideoFeed() {
  const videos = [
    { id: '1', title: 'Meditation Basics', duration: '5:30', category: 'Guide' },
    { id: '2', title: 'Advanced Techniques', duration: '12:45', category: 'Masterclass' },
  ];

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-12 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">Regarder</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Apprentissage visuel et conseils.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="group cursor-pointer">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-3">
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <PlayCircle className="h-12 w-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-mono font-medium">
                {video.duration}
              </div>
            </div>
            <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-white mb-1">{video.title}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{video.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
