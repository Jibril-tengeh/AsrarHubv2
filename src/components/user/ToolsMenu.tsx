import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Fingerprint, Book, Sparkles, Compass, Ghost, AlignCenter, Wind, Shield, Calendar, Moon, Clock, Compass as QiblaIcon, Activity, Scale } from 'lucide-react';
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
          description: 'Précision Adhan par géolocalisation et méthode de calcul.',
          icon: Clock,
          color: 'bg-amber-500',
          path: '/tools/prayer-times'
        },
        {
          id: 'qibla',
          title: 'Boussole Qibla',
          description: 'Direction exacte de la Mecque en temps réel sur carte/boussole.',
          icon: QiblaIcon,
          color: 'bg-rose-500',
          path: '/tools/qibla'
        },
        {
          id: 'tasbih',
          title: 'Tasbih Intelligent',
          description: 'Chapelet numérique avec retour haptique et objectifs de Dhikr personnalisables.',
          icon: Fingerprint,
          color: 'bg-emerald-500',
          path: '/tools/tasbih'
        },
        {
          id: 'asma',
          title: 'Les 99 Noms d\'Allah',
          description: 'Découvrez les Noms Divins avec leurs valeurs Abjad et significations.',
          icon: Sparkles,
          color: 'bg-amber-500',
          path: '/tools/asma'
        },
        {
          id: 'hijri',
          title: 'Calendrier Hégirien',
          description: 'Dates clés, lunaisons et conversion grégorienne.',
          icon: Moon,
          color: 'bg-teal-600',
          path: '/tools/hijri'
        },
        {
          id: 'habits',
          title: 'Statistiques & Suivi (Pro)',
          description: 'Suivez votre progression spirituelle, streaks et graphiques.',
          icon: Activity,
          color: 'bg-indigo-600',
          path: '/tools/habits'
        },
        {
          id: 'dreams',
          title: 'Journal des Rêves',
          description: 'Un espace privé pour consigner vos visions et vos manifestations.',
          icon: Moon,
          color: 'bg-indigo-600',
          path: '/tools/dream-journal'
        },
        {
          id: 'zakat',
          title: 'Calculateur de Zakat',
          description: 'Évaluez facilement votre Zakat selon votre richesse réelle.',
          icon: Calculator,
          color: 'bg-emerald-600',
          path: '/tools/zakat'
        },
        {
          id: 'faraid',
          title: 'Calculateur Faraid',
          description: 'Estimation mathématique des parts d\'héritage islamique.',
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
          title: 'Calculateur Abjad',
          description: 'Calculez la valeur numérique de n\'importe quel mot ou phrase (Mashriqi & Maghrebi).',
          icon: Calculator,
          color: 'bg-blue-500',
          path: '/tools/abjad'
        },
        {
          id: 'wafq',
          title: 'Générateur de Wafq',
          description: 'Génère un carré magique (Musallath) à partir d\'une valeur cible (Asrar).',
          icon: Book,
          color: 'bg-purple-500',
          path: '/tools/wafq'
        },
        {
          id: 'planetary',
          title: 'Heures Planétaires',
          description: 'Calculez les heures planétaires pour vos moments de Dhikr.',
          icon: Compass,
          color: 'bg-indigo-500',
          path: '/tools/planetary'
        },
        {
          id: 'rouhaniyyah',
          title: 'Extraction Rouhani',
          description: 'Extrayez les noms des entités spirituelles à partir des valeurs Abjad (Istintaq).',
          icon: Ghost,
          color: 'bg-rose-500',
          path: '/tools/rouhaniyyah'
        },
        {
          id: 'taksir',
          title: 'Taksir (Brisures)',
          description: 'Technique cryptographique de croisement des lettres pour les carrés magiques.',
          icon: AlignCenter,
          color: 'bg-cyan-600',
          path: '/tools/taksir'
        },
        {
          id: 'zairaja',
          title: 'Analyse Élémentaire (Zairaja)',
          description: 'Calculez la nature énergétique (Feu, Terre, Air, Eau) d\'une intention.',
          icon: Wind,
          color: 'bg-fuchsia-500',
          path: '/tools/zairaja'
        },
        {
          id: 'khatm',
          title: 'Planificateur de Khatm',
          description: 'Suivi de vos retraites spirituelles (Khalwa/Quarantaines) avec barre de progression.',
          icon: Calendar,
          color: 'bg-amber-600',
          path: '/tools/khatm-planner'
        },
        {
          id: 'rouqya',
          title: 'Moteur Audio de Rouqya',
          description: 'Répétez un verset avec un nombre de boucles défini (Idéal pour écoute nocturne).',
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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Outils Spirituels</h1>
        <p className="opacity-70">Une suite d'outils pour accompagner votre pratique et vos études.</p>
      </div>

      <div className="flex gap-2 bg-black/5 dark:bg-white/10 p-1.5 rounded-2xl mb-6">
        {toolCategories.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(index)}
            className={`flex-1 flex justify-center items-center py-3 px-2 rounded-xl text-sm font-bold transition-all ${
              activeCategory === index
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {category.title}
          </button>
        ))}
      </div>

      <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {toolCategories[activeCategory].tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className="flex items-start text-left gap-4 p-5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors active:scale-[0.98]"
          >
            <div className={`p-4 rounded-full ${tool.color} text-white shadow-lg`}>
               <tool.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{tool.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed text-balance">{tool.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
