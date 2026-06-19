/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInGuest } from './firebase';
import Onboarding from './components/Onboarding';
import InstallPWA from './components/InstallPWA';

// Admin
import AdminLogin from './components/AdminLogin';
import DashboardLayout from './components/DashboardLayout';
import TextList from './components/TextList';
import AddText from './components/AddText';
import AdminAffirmations from './components/AdminAffirmations';
import AdminRouqyaPresets from './components/AdminRouqyaPresets';
import AdminCommunity from './components/AdminCommunity';
import AdminActivityLog from './components/AdminActivityLog';

// User
import UserLogin from './components/UserLogin';
import UserLayout from './components/user/UserLayout';
import HomeFeed from './components/user/HomeFeed';
import AudioFeed from './components/user/AudioFeed';
import VideoFeed from './components/user/VideoFeed';
import Favorites from './components/user/Favorites';
import ReadingDetail from './components/user/ReadingDetail';
import Settings from './components/user/Settings';
import NotesPage from './components/user/NotesPage';
import ToolsMenu from './components/user/ToolsMenu';
import AbjadCalculator from './components/user/AbjadCalculator';
import TasbihCounter from './components/user/TasbihCounter';
import AsmaulHusna from './components/user/AsmaulHusna';
import WafqGenerator from './components/user/WafqGenerator';
import PlanetaryHours from './components/user/PlanetaryHours';
import ZakatCalculator from './components/user/ZakatCalculator';
import RouhaniyyahExtractor from './components/user/RouhaniyyahExtractor';
import TaksirGenerator from './components/user/TaksirGenerator';
import ZairajaAnalyzer from './components/user/ZairajaAnalyzer';
import RouqyaAudio from './components/user/RouqyaAudio';
import KhatmPlanner from './components/user/KhatmPlanner';
import DreamJournal from './components/user/DreamJournal';
import CommunityChat from './components/user/CommunityChat';
import Profile from './components/user/Profile';
import PrayerTimes from './components/user/PrayerTimes';
import QiblaCompass from './components/user/QiblaCompass';
import HijriCalendar from './components/user/HijriCalendar';
import HabitTracker from './components/user/HabitTracker';
import FaraidCalculator from './components/user/FaraidCalculator';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
    if (!hasCompleted) {
      setShowOnboarding(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoading(false);
      } else {
        setUser(currentUser);
        setLoading(false);
        
        // Run profile check in background
        const checkProfile = async () => {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
               await setDoc(userDocRef, {
                  name: currentUser.displayName || 'Utilisateur',
                  photoUrl: currentUser.photoURL || '',
                  bio: '',
                  status: 'active',
                  role: 'user',
                  email: currentUser.email,
                  createdAt: new Date().toISOString()
               }, { merge: true });
            }
          } catch (error) {
            console.warn("Could not sync user profile to database (likely offline):", error);
          }
        };
        checkProfile();
      }
    });
    return unsubscribe;
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Router>
      <InstallPWA />
      <Routes>
        {/* User Auth */}
        <Route path="/login" element={!user ? <UserLogin /> : <Navigate to="/" replace />} />

        {/* User App Routes */}
        <Route path="/" element={user ? <UserLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<HomeFeed />} />
          <Route path="reading/:id" element={<ReadingDetail />} />
          <Route path="audio" element={<AudioFeed />} />
          <Route path="video" element={<VideoFeed />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="tools" element={<ToolsMenu />} />
          <Route path="tools/abjad" element={<AbjadCalculator />} />
          <Route path="tools/tasbih" element={<TasbihCounter />} />
          <Route path="tools/asma" element={<AsmaulHusna />} />
          <Route path="tools/wafq" element={<WafqGenerator />} />
          <Route path="tools/planetary" element={<PlanetaryHours />} />
          <Route path="tools/zakat" element={<ZakatCalculator />} />
          <Route path="tools/rouhaniyyah" element={<RouhaniyyahExtractor />} />
          <Route path="tools/taksir" element={<TaksirGenerator />} />
          <Route path="tools/zairaja" element={<ZairajaAnalyzer />} />
          <Route path="tools/rouqya-audio" element={<RouqyaAudio />} />
          <Route path="tools/khatm-planner" element={<KhatmPlanner />} />
          <Route path="tools/dream-journal" element={<DreamJournal />} />
          <Route path="tools/prayer-times" element={<PrayerTimes />} />
          <Route path="tools/qibla" element={<QiblaCompass />} />
          <Route path="tools/hijri" element={<HijriCalendar />} />
          <Route path="tools/habits" element={<HabitTracker />} />
          <Route path="tools/faraid" element={<FaraidCalculator />} />
          <Route path="community" element={<CommunityChat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={!user ? <AdminLogin /> : <Navigate to="/admin/texts" />} />
        
        <Route path="/admin" element={user ? <DashboardLayout /> : <Navigate to="/admin/login" />}>
          <Route index element={<Navigate to="texts" />} />
          <Route path="texts" element={<TextList />} />
          <Route path="texts/add" element={<AddText />} />
          <Route path="texts/edit/:id" element={<AddText />} />
          <Route path="audio" element={<div className="p-8">Manage Audio (Coming Soon)</div>} />
          <Route path="videos" element={<div className="p-8">Manage Videos (Coming Soon)</div>} />
          <Route path="community" element={<AdminCommunity />} />
          <Route path="affirmations" element={<AdminAffirmations />} />
          <Route path="rouqya" element={<AdminRouqyaPresets />} />
          <Route path="activity" element={<AdminActivityLog />} />
        </Route>
      </Routes>
    </Router>
  );
}
