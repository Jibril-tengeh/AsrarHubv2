import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Extend window interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    if (localStorage.getItem('pwa-prompt-dismissed') === 'true') {
      setIsDismissed(true);
    }

    // Safari detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    
    if (isIos && isSafari) {
      setIsIosPrompt(true);
      setSupportsPWA(true);
    }

    if ((window as any).deferredPrompt) {
      setSupportsPWA(true);
      setPromptInstall((window as any).deferredPrompt);
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      setIsIosPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = async () => {
    if (isIosPrompt) {
      // Just dismiss the banner for iOS after they click "Ok"
      onDismiss();
      return;
    }
    
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      setSupportsPWA(false);
      (window as any).deferredPrompt = null;
    }
  };

  const onDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!supportsPWA || isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[26rem] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl p-4 z-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-start md:items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <Download size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Installer l'application</h3>
            {isIosPrompt ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-col gap-1 items-start justify-center">
                <span className="block mb-1">1. Appuyez sur <Share size={14} className="inline mx-1" /> Partager</span>
                <span className="block">2. Sélectionnez <strong>Sur l'écran d'accueil</strong></span>
              </p>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">Naviguez plus rapidement et accédez hors-ligne.</p>
            )}
          </div>
        </div>
        
        <div className="flex w-full md:w-auto items-center justify-end gap-2">
          {!isIosPrompt && (
            <button 
              onClick={onClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Installer
            </button>
          )}
          <button 
            onClick={onDismiss}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
