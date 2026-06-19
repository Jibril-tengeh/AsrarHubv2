import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from '../../lib/friendsUtils';
import { UserPlus, UserCheck, X, Check, UserMinus } from 'lucide-react';

export default function FriendsSection() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  useEffect(() => {
    let unsubFriends: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubFriends) unsubFriends();
        if (unsubRequests) unsubRequests();

        // Listen to friends
        const qFriends = query(collection(db, "users", user.uid, "friends"));
        unsubFriends = onSnapshot(qFriends, (snap) => {
          setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error(err));

        // Listen to requests To me
        const qRequests = query(collection(db, "friend_requests"), where("toId", "==", user.uid), where("status", "==", "pending"));
        unsubRequests = onSnapshot(qRequests, (snap) => {
          setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error(err));
      } else {
        if (unsubFriends) { unsubFriends(); unsubFriends = undefined; }
        if (unsubRequests) { unsubRequests(); unsubRequests = undefined; }
        setFriends([]);
        setRequests([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFriends) unsubFriends();
      if (unsubRequests) unsubRequests();
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      
      {requests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/30">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <UserPlus className="w-5 h-5" /> 
            Demandes reçues ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-white dark:bg-black/20 p-3 rounded-xl">
                <span className="font-medium">{req.fromName}</span>
                <div className="flex gap-2">
                  <button onClick={() => acceptFriendRequest(req.id, req.fromId, req.toId, req.fromName)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectFriendRequest(req.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 opacity-70" /> 
          Vos Amis ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-sm opacity-50 px-2">Vous n'avez pas encore d'amis ajoutés. Cliquez sur l'avatar d'un membre dans le compte/Tchat pour lui envoyer une demande.</p>
        ) : (
          <div className="grid gap-2">
            {friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <span className="font-medium">{friend.friendName}</span>
                <button 
                  onClick={() => removeFriend(friend.friendId)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title="Retirer des amis"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
