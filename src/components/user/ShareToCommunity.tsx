import React from 'react';
import { Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareToCommunityProps {
  text: string;
  className?: string;
}

export default function ShareToCommunity({ text, className = '' }: ShareToCommunityProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/community', { state: { shareText: text } })}
      className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-amber-500 hover:text-amber-600 ${className}`}
      title="Partager dans la communauté"
    >
      <Share2 className="w-6 h-6" />
    </button>
  );
}
