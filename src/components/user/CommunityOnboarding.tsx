import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Shield, MessageSquare, Heart, CheckCircle2, ChevronRight, Check } from 'lucide-react';

interface CommunityOnboardingProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function CommunityOnboarding({ onComplete, onClose }: CommunityOnboardingProps) {
  const [step, setStep] = useState(0);

  const screens = [
    {
      title: "Bienvenue dans la Communauté",
      description: "Un espace d'échange bienveillant dédié à la spiritualité et à l'entraide. Découvrez ce qui vous attend.",
      icon: Users,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Échanges Sécurisés",
      description: "Notre communauté est modérée. Les messages inappropriés sont filtrés pour maintenir un environnement sain et respectueux.",
      icon: Shield,
      color: "text-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Discussions Thématiques",
      description: "Rejoignez des discussions générales, participez à des sondages ou interagissez publiquement avec d'autres membres.",
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Soutien Mutuel",
      description: "Demandez des conseils, partagez vos expériences et trouvez du soutien auprès de personnes partageant vos valeurs.",
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-100 dark:bg-rose-900/30",
    },
    {
      title: "Prêt à commencer ?",
      description: "Rejoignez-nous maintenant ! N'oubliez pas d'être respectueux et bienveillant dans vos échanges.",
      icon: CheckCircle2,
      color: "text-indigo-500",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    }
  ];

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = screens[step];
  const Icon = current.icon;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-sm max-h-[85vh] rounded-3xl shadow-2xl overflow-y-auto relative flex flex-col items-center p-6 sm:p-8 text-center" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1 justify-center mb-6 sm:mb-8 absolute top-4 sm:top-6 left-0 right-0">
          {screens.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-200 dark:bg-neutral-800'}`}
            />
          ))}
        </div>

        <div key={step} className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300 w-full mt-4 sm:mt-0">
          <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full ${current.bg} flex items-center justify-center mb-4 sm:mb-6 mt-4 transition-colors duration-300 shrink-0`}>
            <Icon className={`w-8 h-8 sm:w-12 sm:h-12 ${current.color}`} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-neutral-900 dark:text-white transition-all shrink-0">{current.title}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 sm:mb-8 min-h-[60px] sm:min-h-[80px] leading-relaxed">
            {current.description}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {step === screens.length - 1 ? (
            <>Continuer <Check className="w-4 h-4 sm:w-5 sm:h-5" /></>
          ) : (
            <>Suivant <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}
