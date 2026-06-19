import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Settings2, Save, User as UserIcon } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

export default function CommunityProfileSection() {
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || "");
    
    // Load bio from firestore
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().bio) {
        setBio(docSnap.data().bio);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      if (displayName !== currentUser.displayName) {
         await updateProfile(currentUser, { displayName });
      }
      await updateDoc(doc(db, 'users', currentUser.uid), {
        bio: bio,
        displayName: displayName
      });
      alert('Profil mis à jour avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Settings2 className="w-6 h-6 text-amber-500" />
        Profil de Communauté
      </h2>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 border-4 border-amber-500 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-amber-700 dark:text-amber-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Nom d'affichage</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 opacity-40" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Votre pseudo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Biographie</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[120px]"
              placeholder="Parlez de vous à la communauté..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Enregistrement..." : "Enregistrer le profil"}
          </button>
        </form>
      </div>
    </div>
  );
}
