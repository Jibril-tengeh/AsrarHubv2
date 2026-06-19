import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Trash2, Save, Loader2, Edit3 } from 'lucide-react';
import { useReading } from '../../contexts/ReadingContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function NotesPage() {
  const { notes, removeNote } = useReading();
  const navigate = useNavigate();

  const [journalContent, setJournalContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [userUid, setUserUid] = useState<string | null>(null);

  // Debounce ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
     const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
           setUserUid(user.uid);
           getDoc(doc(db, 'users', user.uid, 'journal', 'main')).then(snap => {
               if (snap.exists() && snap.data().content) {
                  setJournalContent(snap.data().content);
               }
           }).catch(err => console.error("Could not fetch journal", err));
        } else {
           setUserUid(null);
           setJournalContent('');
        }
     });
     return () => unsub();
  }, []);

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     const newContent = e.target.value;
     setJournalContent(newContent);
     setSaveStatus('saving');

     if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
     saveTimeoutRef.current = setTimeout(async () => {
         if (userUid) {
            try {
               await setDoc(doc(db, 'users', userUid, 'journal', 'main'), {
                  content: newContent,
                  updatedAt: Date.now()
               }, { merge: true });
               setSaveStatus('saved');
               setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
               console.error("Failed to save journal", err);
               setSaveStatus('idle');
            }
         }
     }, 1000); // 1s debounce
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">My Notes</h1>
          <p className="opacity-70">Your personal highlights and journal.</p>
        </div>
      </div>

      {userUid && (
        <div className="mb-10 flex flex-col relative group">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Scratchpad
            </h2>
            <div className="text-xs font-semibold opacity-50 flex items-center gap-1 min-w-[70px] justify-end">
               {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin"/> Saving</>}
               {saveStatus === 'saved' && <><Save className="w-3 h-3 text-green-500"/> Saved</>}
               {saveStatus === 'idle' && ''}
            </div>
          </div>
          <textarea 
            value={journalContent}
            onChange={handleJournalChange}
            placeholder="Écrivez vos pensées ici..."
            className="w-full h-40 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow resize-none"
          />
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Reading Highlights
        </h2>
      </div>

      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-12 bg-black/5 dark:bg-white/5 rounded-2xl border-dashed border-2 border-black/10 dark:border-white/10">
          <BookOpen className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-1">Pas de notes pour l'instant</h3>
          <p className="text-sm max-w-[200px]">
            Surlignez du texte dans n'importe quel article pour créer une note.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="p-4 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col gap-3 relative group bg-white dark:bg-neutral-900 shadow-sm"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeNote(note.id);
                }}
                className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity rounded-full bg-white dark:bg-neutral-800 shadow"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div 
                className="cursor-pointer"
                onClick={() => navigate(`/reading/${note.readingId}`)}
              >
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium">{new Date(note.timestamp).toLocaleString()}</span>
                </div>
                
                <blockquote className="pl-3 border-l-2 border-amber-500 italic opacity-80 text-sm mb-3">
                  "{note.text}"
                </blockquote>
                
                {note.note && (
                  <p className="text-sm font-medium">{note.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
