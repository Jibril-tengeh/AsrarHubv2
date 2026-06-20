import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Headphones, Video, Heart, Settings, BookOpen, Play, Square, X, Calculator, ArrowLeft, Users, MessageSquare, BarChart2, Lock, UserPlus, User, Activity, Moon, Sun, Bell, Clock, Check } from 'lucide-react';
import { useReading } from '../../contexts/ReadingContext';
import { useAudioPlayer } from '../../contexts/AudioContext';
import { useSettings } from '../../contexts/SettingsContext';
import CommunityOnboarding from './CommunityOnboarding';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { zenMode } = useReading();
  const { isPlaying, currentTitle, togglePlay, stopPlayback } = useAudioPlayer();
  const { theme, setThemeId, dailyAlertTime, setDailyAlertTime } = useSettings();
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [showCommunityOnboarding, setShowCommunityOnboarding] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const initialLoadRef = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const alertMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "community_notifications"),
          where("recipientId", "==", user.uid),
          where("read", "==", false)
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (!initialLoadRef.current) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const newNotif = { id: change.doc.id, ...change.doc.data() } as any;
                setActiveToasts(prev => [newNotif, ...prev]);
                setTimeout(() => {
                  setActiveToasts(current => current.filter(t => t.id !== newNotif.id));
                }, 5000);
              }
            });
          }
          initialLoadRef.current = false;

          setNotifications(notifs.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        }, (error) => {
          console.error("Notifications snapshot error:", error);
        });
      } else {
        if (unsubscribe) unsubscribe();
        setNotifications([]);
        setActiveToasts([]);
      }
    });
    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
        setShowAlertMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotificationsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "community_notifications", notifId), { read: true });
    } catch (err) { console.error(err); }
  };

  const handleCommunityClick = () => {
    const isDone = localStorage.getItem('community_onboarding_done');
    if (!isDone) {
      setShowCommunityOnboarding(true);
    } else {
      setShowCommunityMenu(!showCommunityMenu);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('community_onboarding_done', 'true');
    setShowCommunityOnboarding(false);
    setShowCommunityMenu(true);
  };

  const isHomeLevel = ['/', '/tools', '/favorites', '/notes'].includes(location.pathname);

  const tabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Outils', href: '/tools', icon: Calculator },
    { name: 'Favoris', href: '/favorites', icon: Heart },
    { name: 'Notes', href: '/notes', icon: BookOpen },
    { name: 'Param.', href: '/settings', icon: Settings },
  ];

  const handleCommunityNavigate = (section: string) => {
    setShowCommunityMenu(false);
    navigate('/community', { state: { activeSection: section } });
  };

  return (
    <div className="flex flex-col h-screen selection:bg-rose-500/30" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Top Header */}
      {!zenMode && (
        <header className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <div className="flex items-center justify-between h-14 max-w-md mx-auto w-full px-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--theme-text)' }}>AsrarHub</span>
            </div>
            <div className="flex items-center gap-1 relative" ref={menuRef}>
              <button 
                onClick={handleCommunityClick}
                className={`p-2 rounded-full transition-colors active:scale-95 ${showCommunityMenu ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : ''}`}
                style={{ color: showCommunityMenu ? '' : 'var(--theme-text)' }}
                title="Communauté"
              >
                <Users className="h-5 w-5" />
              </button>
              
              {showCommunityOnboarding && (
                <CommunityOnboarding 
                  onComplete={handleOnboardingComplete} 
                  onClose={() => setShowCommunityOnboarding(false)} 
                />
              )}

              {showCommunityMenu && createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4" style={{ color: 'var(--theme-text)' }}>
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" onClick={() => setShowCommunityMenu(false)} />
                  <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Accès rapide communauté</h3>
                      <button onClick={(e) => { e.stopPropagation(); setShowCommunityMenu(false); }} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleCommunityNavigate('general')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Général Chat">
                        <MessageSquare className="w-6 h-6 mb-1" />
                      </button>
                      <button onClick={() => handleCommunityNavigate('polls')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Sondages">
                        <BarChart2 className="w-6 h-6 mb-1" />
                      </button>
                      <button onClick={() => handleCommunityNavigate('private')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Chat privé">
                        <Lock className="w-6 h-6 mb-1" />
                      </button>
                      <button onClick={() => handleCommunityNavigate('friends')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Amis & Demandes">
                        <UserPlus className="w-6 h-6 mb-1" />
                      </button>
                      <button onClick={() => handleCommunityNavigate('profile')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Profile">
                        <User className="w-6 h-6 mb-1" />
                      </button>
                      <button onClick={() => handleCommunityNavigate('online')} className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="En ligne">
                        <Activity className="w-6 h-6 mb-1 text-green-500" />
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
              <button 
                onClick={() => setThemeId(theme.id === 'dark' || theme.isDark ? 'light' : 'dark')}
                className="p-2 rounded-full transition-colors active:scale-95 hover:bg-neutral-100 dark:hover:bg-neutral-800" 
                style={{ color: 'var(--theme-text)' }}
                title="Thème clair/sombre"
              >
                {theme.id === 'dark' || theme.isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Notifications */}
              <div className="relative" ref={notifMenuRef}>
                <button 
                  onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                  className={`p-2 rounded-full transition-colors active:scale-95 ${showNotificationsMenu || notifications.length > 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  style={{ color: (showNotificationsMenu || notifications.length > 0) ? '' : 'var(--theme-text)' }}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-white dark:border-neutral-900 text-[8px] font-bold text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {showNotificationsMenu && (
                  <div className="absolute top-12 -right-[50px] sm:right-0 w-[300px] max-w-[calc(100vw-24px)] bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col max-h-96">
                    <div className="p-3 border-b border-black/5 dark:border-white/5 font-bold text-sm bg-neutral-50 dark:bg-neutral-800/50">
                      Notifications
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                         <div className="p-4 text-center text-xs opacity-50">Aucune nouvelle notification</div>
                      ) : (
                         notifications.map(n => (
                           <div key={n.id} className="p-3 border-b border-black/5 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-1 cursor-pointer" 
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              setShowNotificationsMenu(false);
                              navigate('/community', { state: { activeSection: 'general' }});
                            }}
                           >
                             <div className="flex justify-between items-start gap-2">
                               <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-tight">
                                 {n.senderName} vous a répondu
                               </span>
                               <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }} className="p-0.5 mt-[-2px] -mr-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 flex-shrink-0">
                                  <Check className="w-3 h-3" />
                               </button>
                             </div>
                             <p className="text-xs opacity-80 truncate">{n.text}</p>
                           </div>
                         ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Alert */}
              <div className="relative" ref={alertMenuRef}>
                <button 
                  onClick={() => setShowAlertMenu(!showAlertMenu)}
                  className={`p-2 rounded-full transition-colors active:scale-95 ${showAlertMenu || dailyAlertTime ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  style={{ color: (showAlertMenu || dailyAlertTime) ? '' : 'var(--theme-text)' }}
                  title="Rappel quotidien"
                >
                  <Clock className="h-5 w-5" />
                  {dailyAlertTime && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-neutral-900" />
                  )}
                </button>
                
                {showAlertMenu && (
                  <div className="absolute top-12 -right-[10px] sm:right-0 w-[260px] max-w-[calc(100vw-24px)] bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Alerte quotidienne
                    </h3>
                    <div className="flex flex-col gap-3">
                      <input
                        type="time"
                        value={dailyAlertTime || ''}
                        onChange={(e) => setDailyAlertTime(e.target.value || null)}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      {dailyAlertTime && (
                        <button 
                          onClick={() => setDailyAlertTime(null)}
                          className="w-full py-2 text-xs text-rose-500 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        >
                          Désactiver l'alerte
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate('/profile')}
                className="p-2 -mr-2 rounded-full transition-colors active:scale-95 hover:bg-neutral-100 dark:hover:bg-neutral-800" 
                style={{ color: 'var(--theme-text)' }}
                title="Profile"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto overflow-x-hidden relative ${!zenMode ? 'pb-[100px]' : ''}`}>
        <Outlet />
      </main>

      {/* Toast Notification System */}
      <div className="fixed top-4 left-0 right-0 z-[110] flex flex-col items-center gap-2 pointer-events-none px-4 mt-14 sm:mt-0">
        {activeToasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
            onClick={() => {
              handleMarkAsRead(t.id);
              setActiveToasts(prev => prev.filter(item => item.id !== t.id));
              navigate('/community', { state: { activeSection: 'general' }});
            }}
          >
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
             <div className="flex-1 min-w-0 pl-1 cursor-pointer">
               <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">{t.senderName} vous a répondu</p>
               <p className="text-sm opacity-90 truncate">{t.text}</p>
             </div>
             <button 
               className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full flex-shrink-0 transition-colors"
               onClick={(e) => {
                 e.stopPropagation();
                 setActiveToasts(prev => prev.filter(item => item.id !== t.id));
               }}
             >
               <X className="w-4 h-4 opacity-50" />
             </button>
          </div>
        ))}
      </div>
      
      {/* Mini Player */}
      {!zenMode && currentTitle && (
        <div className="fixed top-[68px] left-0 right-0 z-[60] px-4 pointer-events-none">
          <div className="max-w-md mx-auto w-full backdrop-blur-xl bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 p-3 rounded-2xl flex items-center justify-between shadow-lg pointer-events-auto backdrop-filter">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-semibold opacity-70 mb-0.5">Now Playing</p>
              <h4 className="text-sm font-bold truncate">{currentTitle}</h4>
            </div>
            <div className="flex gap-2">
              <button onClick={togglePlay} className="p-2 rounded-full bg-current text-white dark:text-black">
                {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button onClick={stopPlayback} className="p-2 rounded-full border border-black/10 dark:border-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {!zenMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 dark:border-white/10 pb-2 pt-2 backdrop-blur-md" style={{ backgroundColor: 'var(--theme-bg)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-around items-center h-14 max-w-md mx-auto w-full px-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.href}
                className={({ isActive }) => {
                  const isToolsActive = tab.name === 'Outils' && window.location.pathname.startsWith('/tools');
                  const finalActive = isActive || isToolsActive;
                  
                  return `flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors duration-200 ${
                    finalActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`;
                }}
                style={{ color: 'var(--theme-text)' }}
              >
                {({ isActive }) => {
                   const isToolsActive = tab.name === 'Outils' && window.location.pathname.startsWith('/tools');
                   const finalActive = isActive || isToolsActive;
                   
                   return (
                  <>
                    <tab.icon className={`h-6 w-6 stroke-2 ${finalActive ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium mt-1">{tab.name}</span>
                  </>
                )}}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
