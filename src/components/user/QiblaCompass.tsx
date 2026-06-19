import React, { useState, useEffect } from 'react';
import ShareToCommunity from './ShareToCommunity';
import { Link } from 'react-router-dom';
import { Compass, MapPin, ArrowLeft } from 'lucide-react';
import { Qibla } from 'adhan';

export default function QiblaCompass() {
  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          import('adhan').then(({ Coordinates }) => {
             const coordinates = new Coordinates(latitude, longitude);
             // Use ADHAN library for precise Qibla direction based on math
             const qiblaDirection = Qibla(coordinates);
             setQibla(qiblaDirection);
          });
        },
        () => setError("Veuillez autoriser la géolocalisation.")
      );
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Standardize the heading based on webkit compass heading or alpha
      let currentHeading = 0;
      if ('webkitCompassHeading' in e && (e as any).webkitCompassHeading) {
        currentHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Fallback for non-iOS, note: alpha is relative to device original position unless calibrated
        currentHeading = 360 - e.alpha; 
      }
      setHeading(currentHeading);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
       setError((prev) => prev ? prev : "Compass n'est pas supporté sur cet appareil.");
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // To point the compass arrow, we subtract the device heading from the qibla direction.
  const angle = qibla ? qibla - heading : 0;

  return (
    <div className="max-w-md mx-auto p-4 pt-8 pb-24 text-center" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-8 relative flex flex-col items-center justify-center text-center">
        <Link to="/tools" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Boussole Qibla</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 mx-4 text-sm">
          {error}
          <div className="mt-2 text-xs opacity-70">
            Note: Fonctionne mieux sur mobile Safari/Chrome avec les capteurs activés.
          </div>
        </div>
      )}

      {qibla !== null ? (
        <div className="relative w-64 h-64 mx-auto my-12 bg-black/5 dark:bg-white/5 rounded-full border-4 border-black/10 dark:border-white/10 flex items-center justify-center shadow-inner">
          <div className="absolute top-4 font-bold text-amber-500">N</div>
          <div className="absolute bottom-4 font-bold opacity-30">S</div>
          <div className="absolute right-4 font-bold opacity-30">E</div>
          <div className="absolute left-4 font-bold opacity-30">W</div>

          <div 
            className="w-full h-full absolute transition-transform duration-300 ease-out flex flex-col justify-center items-center"
            style={{ transform: `rotate(${angle}deg)` }}
          >
             <div className="w-1 h-32 bg-amber-500 rounded-t-full relative -top-16 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
               <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-black" />
             </div>
          </div>
          
          <div className="z-10 bg-white dark:bg-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
            <MapPin className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      ) : !error && (
        <div className="animate-pulse bg-black/5 dark:bg-white/5 p-12 rounded-full w-64 h-64 mx-auto my-12 flex items-center justify-center">
           <Compass className="w-12 h-12 text-amber-500 opacity-50 block" />
        </div>
      )}

      <div className="mt-8 space-y-2">
        <p className="text-sm opacity-70">Kaaba (La Mecque)</p>
        <p className="font-mono text-2xl font-bold tracking-widest text-amber-500">
           {qibla ? `${qibla.toFixed(1)}°` : '--°'}
        </p>
      </div>
    </div>
  );
}
