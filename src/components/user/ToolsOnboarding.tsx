import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Calculator, Compass, Sparkles, Book, Calendar, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolsOnboardingProps {
  onComplete: () => void;
}

export default function ToolsOnboarding({ onComplete }: ToolsOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Bienvenue dans vos Outils",
      subtitle: "Votre boîte à outils spirituelle complète",
      description: "Découvrez une suite d'instruments puissants conçus pour faciliter votre pratique quotidienne et vos études ésotériques.",
      icon: <Sparkles className="w-20 h-20 text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-yellow-500"
    },
    {
      title: "Sciences Éducatives & Abjad",
      subtitle: "Calculs et Géométrie Magique",
      description: "Utilisez le Calculateur Abjad pour vos Istintaq et générez des Wafqs précis avec Taksir et Zairaja pour vos objectifs.",
      icon: <Calculator className="w-20 h-20 text-blue-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-blue-500"
    },
    {
      title: "Pratique Quotidienne",
      subtitle: "Prières, Qibla & Calendrier",
      description: "Restez ponctuel avec les Heures de Prière par géolocalisation, la boussole Qibla en temps réel et le calendrier Hégirien.",
      icon: <Compass className="w-20 h-20 text-rose-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-rose-500"
    },
    {
      title: "Dhikr & Méditation",
      subtitle: "Tasbih Intelligent & 99 Noms",
      description: "Accompagnez vos retraites spirituelles grâce au Tasbih avec haptique, et explorez les vertus des 99 Noms d'Allah.",
      icon: <Book className="w-20 h-20 text-emerald-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-emerald-500"
    },
    {
      title: "Planification Organisée",
      subtitle: "Khatm, Zakat & Héritage",
      description: "Gérez vos quarantaines spirituelles (Khatm), dressez un bilan de votre Zakat et utilisez l'estimateur Faraid.",
      icon: <Calendar className="w-20 h-20 text-purple-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-purple-500"
    },
    {
      title: "Analyse Nocturne",
      subtitle: "Journal de Rêves",
      description: "Notez et suivez vos manifestations oniriques dans un journal privé pour approfondir votre compréhension spirituelle.",
      icon: <Moon className="w-20 h-20 text-indigo-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-indigo-500"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-md w-full relative z-10 max-h-screen flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center shadow-2xl border border-white/10 overflow-y-auto max-h-[75vh] ${steps[currentStep].bg}`}
          >
            <div className="mb-6 p-4 sm:p-6 bg-white/5 rounded-full shadow-inner border border-white/10 shrink-0">
              {React.cloneElement(steps[currentStep].icon as React.ReactElement<any>, { className: `${(steps[currentStep].icon as React.ReactElement<any>).props.className.replace('w-20 h-20', 'w-12 h-12 sm:w-16 sm:h-16')}` })}
            </div>
            
            <h2 className={`text-xl sm:text-2xl font-bold font-display mb-2 ${steps[currentStep].textClass} shrink-0`}>
              {steps[currentStep].title}
            </h2>

            <h3 className={`text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4 ${steps[currentStep].accent} shrink-0`}>
              {steps[currentStep].subtitle}
            </h3>
            
            <p className={`text-sm sm:text-base leading-relaxed min-h-[4rem] sm:min-h-[100px] ${steps[currentStep].descClass}`}>
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 transition-all duration-500 ease-out ${idx === currentStep ? 'w-8 bg-white rounded-full' : 'w-2 bg-white/20 rounded-full'}`}
              />
            ))}
          </div>

          <div className="flex gap-2 sm:gap-3">
            {currentStep > 0 && (
              <button 
                onClick={prevStep}
                className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <button 
              onClick={nextStep}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-black font-bold text-sm sm:text-base hover:opacity-90 transition active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-white whitespace-nowrap`}
            >
              {currentStep === steps.length - 1 ? 'Explorer' : 'Suivant'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-1" />}
            </button>
          </div>
        </div>
        
        {currentStep < steps.length - 1 && (
          <div className="absolute bottom-0 sm:-bottom-8 left-0 right-0 text-center pb-2 sm:pb-0">
            <button 
              onClick={onComplete}
              className="text-xs sm:text-sm font-medium text-white/50 hover:text-white/80 transition"
            >
              Ignorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
