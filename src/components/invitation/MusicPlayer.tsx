import React from 'react';
import { Volume2, VolumeX, Disc3 } from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext.tsx';

export const MusicPlayer: React.FC = () => {
  const { isPlayingMusic, toggleMusic } = useRealtime();

  return (
    <button
      id="btn-toggle-music"
      onClick={toggleMusic}
      title={isPlayingMusic ? 'Hentikan Musik' : 'Putar Musik'}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full bg-stone-900/90 text-amber-300 border border-amber-300/40 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 backdrop-blur-md"
    >
      <div className={`relative ${isPlayingMusic ? 'animate-spin [animation-duration:4s]' : ''}`}>
        <Disc3 className="w-6 h-6" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-stone-950 flex items-center justify-center shadow-xs">
        {isPlayingMusic ? (
          <Volume2 className="w-2.5 h-2.5" />
        ) : (
          <VolumeX className="w-2.5 h-2.5 text-stone-900" />
        )}
      </div>
    </button>
  );
};
