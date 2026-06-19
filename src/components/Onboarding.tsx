import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Moon, BookOpen, Shield, TrendingUp, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Bienvenue sur AsrarHub",
      subtitle: "Le carrefour de la haute science spirituelle et des secrets coraniques.",
      description: "Vous ne tenez pas seulement une application, mais une clé vers les trésors cachés de la parole divine pour transformer votre réalité.",
      icon: <Moon className="w-20 h-20 text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-yellow-500"
    },
    {
      title: "Explorez les Secrets Cachés",
      subtitle: "La profondeur des versets révélée.",
      description: "Découvrez des méthodes séculaires pour décoder la puissance vibratoire des versets et obtenir des résultats là où les moyens humains ont échoué.",
      icon: <BookOpen className="w-20 h-20 text-amber-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-amber-500"
    },
    {
      title: "Invocations de Précision",
      subtitle: "Des formules \"nucléaires\" pour chaque épreuve.",
      description: "Accédez à des Duas structurés avec rigueur pour le déblocage personnel, familial et la manifestation de la justice divine.",
      icon: <Sparkles className="w-20 h-20 text-cyan-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-cyan-500"
    },
    {
      title: "Votre Bouclier Inviolable",
      subtitle: "Neutralisez le mal à la racine.",
      description: "Apprenez les techniques de démolition (Tadmir) contre la sorcellerie, le mauvais œil et les complots de vos ennemis.",
      icon: <Shield className="w-20 h-20 text-indigo-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-indigo-500"
    },
    {
      title: "Ouvrez les Portes de l'Abondance",
      subtitle: "Attirez la Baraka et élevez votre rang.",
      description: "Activez les secrets de la richesse providentielle (Rizq) et du charisme royal (Hayba) pour briser les chaînes de la stagnation.",
      icon: <TrendingUp className="w-20 h-20 text-emerald-500" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-emerald-500"
    },
    {
      title: "Pratiquez avec Certitude",
      subtitle: "Secret, Foi et Discipline.",
      description: "Le Hub est maintenant ouvert. Pratiquez vos zikrs dans la discrétion et voyez les miracles se manifester dans votre vie.",
      icon: <Star className="w-20 h-20 text-purple-500 animate-[spin_10s_linear_infinite]" />,
      bg: "bg-neutral-900",
      textClass: "text-white",
      descClass: "text-neutral-400",
      accent: "text-purple-500"
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
      {/* Background stars effect for the last screen or overall */}
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
              {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
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
