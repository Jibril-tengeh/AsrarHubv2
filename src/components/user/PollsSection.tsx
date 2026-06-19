import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { BarChart2, Plus, Check, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Poll {
  id: string;
  creatorId: string;
  creatorName: string;
  question: string;
  options: { id: string, text: string, votes: number }[];
  totalVotes: number;
  timestamp: any;
  voters: string[];
}

export default function PollsSection() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const currentUser = auth.currentUser;

  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubSnapshot) unsubSnapshot();
        const q = query(collection(db, 'polls'), orderBy('timestamp', 'desc'));
        unsubSnapshot = onSnapshot(q, (snap) => {
          setPolls(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll)));
        }, (err) => console.error(err));
      } else {
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = undefined;
        }
        setPolls([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2) return;

    try {
      await addDoc(collection(db, 'polls'), {
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName || currentUser.email?.split('@')[0] || "Unknown",
        question: newQuestion,
        options: newOptions.filter(o => o.trim()).map((o, i) => ({ id: `opt_${i}`, text: o, votes: 0 })),
        totalVotes: 0,
        voters: [],
        timestamp: serverTimestamp()
      });
      setNewQuestion('');
      setNewOptions(['', '']);
      setShowCreate(false);
    } catch (err) {
      console.error("Error creating poll", err);
    }
  };

  const updateOption = (index: number, text: string) => {
    const updated = [...newOptions];
    updated[index] = text;
    setNewOptions(updated);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll || poll.voters.includes(currentUser.uid)) return;

    try {
      const pollRef = doc(db, 'polls', pollId);
      const updatedOptions = poll.options.map(o => 
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      );
      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: poll.totalVotes + 1,
        voters: [...poll.voters, currentUser.uid]
      });
    } catch (err) {
      console.error("Error voting", err);
    }
  };

  const handleDelete = async (pollId: string) => {
    try {
      await deleteDoc(doc(db, 'polls', pollId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-black">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-amber-500" />
          Sondages
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full hover:bg-amber-200"
        >
          {showCreate ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreatePoll} className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl space-y-4 mb-6 border border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-4">
          <input
            type="text"
            placeholder="Posez votre question..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            required
          />
          {newOptions.map((opt, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          ))}
          <button type="button" onClick={() => setNewOptions([...newOptions, ''])} className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            + Ajouter une option
          </button>
          <button type="submit" className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition">
            Publier le sondage
          </button>
        </form>
      )}

      <div className="space-y-6 mt-4">
        {polls.length === 0 ? (
          <p className="text-center text-neutral-500 opacity-70">Aucun sondage actif. Créez-en un !</p>
        ) : (
          polls.map(poll => {
            const hasVoted = poll.voters.includes(currentUser?.uid || '');
            return (
              <div key={poll.id} className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm relative">
                {(currentUser?.uid === poll.creatorId || currentUser?.email === 'sbireino@gmail.com') && (
                  <button onClick={() => handleDelete(poll.id)} className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold pr-6">{poll.question}</h3>
                  <div className="text-xs text-neutral-500 mt-1">
                    Par {poll.creatorName} • {poll.timestamp?.toDate ? format(poll.timestamp.toDate(), 'PP', { locale: fr }) : 'Maintenant'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {poll.options.map(opt => {
                    const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="relative group cursor-pointer" onClick={() => !hasVoted && handleVote(poll.id, opt.id)}>
                        <div className={`overflow-hidden relative rounded-lg border ${hasVoted ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800' : 'border-neutral-300 dark:border-neutral-600 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-neutral-950'}`}>
                          {hasVoted && (
                            <div className="absolute top-0 left-0 bottom-0 bg-amber-200 dark:bg-amber-900/40 rounded-lg transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          )}
                          <div className="relative z-10 flex justify-between items-center p-3 text-sm">
                            <span className="font-medium">{opt.text}</span>
                            {hasVoted && <span className="font-bold text-amber-700 dark:text-amber-400">{percentage}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-neutral-500 font-medium">
                  {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
