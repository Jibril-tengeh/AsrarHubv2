import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Fingerprint, Book, Sparkles, Compass, Ghost, AlignCenter, Wind, Shield, Calendar, Moon, Clock, Compass as QiblaIcon, Activity, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ToolsOnboarding from './ToolsOnboarding';

export default function ToolsMenu() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedToolsOnboarding');
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedToolsOnboarding', 'true');
    setShowOnboarding(false);
  };

  const toolCategories = [
    {
      title: "Pratique Quotidienne",
      tools: [
        {
          id: 'prayer',
          title: 'Heures de Prières',
          description: 'Précision Adhan par géolocalisation et calcul.',
          icon: Clock,
          color: 'bg-amber-500',
          path: '/tools/prayer-times'
        },
        {
          id: 'qibla',
          title: 'Boussole Qibla',
          description: 'Direction exacte de la Mecque en temps réel.',
          icon: QiblaIcon,
          color: 'bg-rose-500',
          path: '/tools/qibla'
        },
        {
          id: 'tasbih',
          title: 'Tasbih',
          description: 'Chapelet numérique avec Dhikr personnalisables.',
          icon: Fingerprint,
          color: 'bg-emerald-500',
          path: '/tools/tasbih'
        },
        {
          id: 'asma',
          title: '99 Noms d\'Allah',
          description: 'Noms Divins avec valeurs Abjad et significations.',
          icon: Sparkles,
          color: 'bg-amber-500',
          path: '/tools/asma'
        },
        {
          id: 'hijri',
          title: 'Calendrier Hégirien',
          description: 'Dates clés et conversion grégorienne.',
          icon: Moon,
          color: 'bg-teal-600',
          path: '/tools/hijri'
        },
        {
          id: 'habits',
          title: 'Suivi (Pro)',
          description: 'Progression spirituelle, streaks et graphiques.',
          icon: Activity,
          color: 'bg-indigo-600',
          path: '/tools/habits'
        },
        {
          id: 'dreams',
          title: 'Journal des Rêves',
          description: 'Espace privé pour consigner vos visions.',
          icon: Moon,
          color: 'bg-indigo-600',
          path: '/tools/dream-journal'
        },
        {
          id: 'zakat',
          title: 'Calcul Zakat',
          description: 'Évaluez votre Zakat selon votre richesse.',
          icon: Calculator,
          color: 'bg-emerald-600',
          path: '/tools/zakat'
        },
        {
          id: 'faraid',
          title: 'Calcul Faraid',
          description: 'Estimation des parts d\'héritage islamique.',
          icon: Scale,
          color: 'bg-purple-600',
          path: '/tools/faraid'
        }
      ]
    },
    {
      title: "Sciences Spirituelles & Asrar",
      tools: [
        {
          id: 'abjad',
          title: 'Abjad',
          description: 'Calculez la valeur numérique (Mashriqi/Maghrebi).',
          icon: Calculator,
          color: 'bg-blue-500',
          path: '/tools/abjad'
        },
        {
          id: 'wafq',
          title: 'Wafq',
          description: 'Génère un carré magique (Musallath) cible.',
          icon: Book,
          color: 'bg-purple-500',
          path: '/tools/wafq'
        },
        {
          id: 'planetary',
          title: 'Heures Planétaires',
          description: 'Calculez les heures pour vos moments de Dhikr.',
          icon: Compass,
          color: 'bg-indigo-500',
          path: '/tools/planetary'
        },
        {
          id: 'rouhaniyyah',
          title: 'Extraction Rouhani',
          description: 'Extrayez les noms spirituels selon l\'Abjad.',
          icon: Ghost,
          color: 'bg-rose-500',
          path: '/tools/rouhaniyyah'
        },
        {
          id: 'taksir',
          title: 'Taksir',
          description: 'Croisement des lettres pour les carrés magiques.',
          icon: AlignCenter,
          color: 'bg-cyan-600',
          path: '/tools/taksir'
        },
        {
          id: 'zairaja',
          title: 'Zairaja',
          description: 'Nature énergétique d\'une intention.',
          icon: Wind,
          color: 'bg-fuchsia-500',
          path: '/tools/zairaja'
        },
        {
          id: 'khatm',
          title: 'Planificateur Khatm',
          description: 'Suivi de vos retraites spirituelles (Khalwa).',
          icon: Calendar,
          color: 'bg-amber-600',
          path: '/tools/khatm-planner'
        },
        {
          id: 'rouqya',
          title: 'Moteur Audio Rouqya',
          description: 'Répétez un verset en boucle (écoute nocturne).',
          icon: Shield,
          color: 'bg-teal-600',
          path: '/tools/rouqya-audio'
        }
      ]
    }
  ];

  if (showOnboarding) {
    return <ToolsOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-1">Outils Spirituels</h1>
        <p className="text-sm opacity-70">Votre boîte à outils pour la pratique.</p>
      </div>

      <div className="flex bg-black/5 dark:bg-white/10 p-1.5 rounded-[1.25rem] mb-6 relative">
        {toolCategories.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(index)}
            className={`relative flex-1 flex justify-center items-center py-2.5 px-2 rounded-xl text-[13px] font-semibold transition-colors z-10 ${
              activeCategory === index
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {activeCategory === index && (
              <motion.div 
                layoutId="activeTabTools"
                className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm z-[-1]"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-20 text-center leading-tight">{category.title}</span>
          </button>
        ))}
      </div>

      <motion.div 
        layout
        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {toolCategories[activeCategory].tools.map((tool, index) => (
            <motion.button
              key={tool.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => navigate(tool.path)}
              className="flex flex-col text-left p-4 rounded-[1.25rem] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors active:scale-95"
            >
              <div className={`p-2.5 rounded-xl ${tool.color} text-white shadow-sm mb-3 w-fit`}>
                 <tool.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm mb-1 leading-tight">{tool.title}</h3>
              <p className="text-[12px] opacity-60 leading-snug line-clamp-2 md:line-clamp-3">{tool.description}</p>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
