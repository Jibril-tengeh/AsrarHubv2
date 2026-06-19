import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Activity, Circle, UserPlus } from 'lucide-react';
import { sendFriendRequest } from '../../lib/friendsUtils';

export default function OnlineMembersSection() {
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  // Track simple presence via a collection or active metadata if possible
  // Since we use presence from typing indicators or recent messages, let's fetch members who are "online".
  // Note: the 'presence' collection was used in CommunityChat! Let's listen to 'presence' collection.
  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubSnapshot) unsubSnapshot();
        const qPresence = query(collection(db, 'community_presence'), where('status', '==', 'online'));
        unsubSnapshot = onSnapshot(qPresence, (snap) => {
          // Remove self
          const onlineUsers = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((u: any) => u.userId !== user.uid);
          
          // Deduplicate by userId
          const uniqueUsers = Array.from(new Map(onlineUsers.map((u: any) => [u.userId, u])).values());
          setActiveMembers(uniqueUsers);
        }, (error) => {
          console.error("Presence snapshot error", error);
        });
      } else {
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = undefined;
        }
        setActiveMembers([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleAddFriend = async (userId: string, userName: string) => {
    try {
      await sendFriendRequest(userId, userName);
      alert("Demande d'ami envoyée avec succès !");
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'envoi de la demande");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-green-500" />
        Membres en ligne ({activeMembers.length})
      </h2>

      {activeMembers.length === 0 ? (
        <div className="text-center opacity-50 p-8 flex flex-col items-center">
          <Activity className="w-12 h-12 mb-4 opacity-50" />
          <p>Personne d'autre n'est en ligne actuellement.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeMembers.map(member => (
            <div key={member.id} className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300">
                  {(member.userName || "A").charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold flex items-center gap-2">
                  {member.userName || "Anonyme"}
                </h3>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Actif maintenant</span>
              </div>
              <button 
                onClick={() => handleAddFriend(member.userId, member.userName)}
                className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                title="Ajouter en ami"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
