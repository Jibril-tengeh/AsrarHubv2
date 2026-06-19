import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Book, Moon, Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface DreamEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  practiceRelated: string;
  createdAt: string;
}

export default function DreamJournal() {
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [practiceRelated, setPracticeRelated] = useState('');

  const fetchEntries = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'dream_journals'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DreamEntry));
      
      // Sort in memory to avoid needing composite indexes in Firestore
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setEntries(docs);
    } catch (error) {
      console.error("Error fetching dreams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !content.trim()) return;

    try {
      await addDoc(collection(db, 'dream_journals'), {
        userId: auth.currentUser.uid,
        title: title || 'Rêve sans titre',
        content,
        practiceRelated,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setContent('');
      setPracticeRelated('');
      setIsAdding(false);
      fetchEntries();
    } catch (error) {
      console.error("Error adding dream:", error);
      alert("Erreur lors de l'enregistrement de votre rêve.");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Voulez-vous vraiment effacer ce journal ?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'dream_journals', id));
          setEntries(entries.filter(e => e.id !== id));
        } catch (error) {
          console.error("Error deleting dream:", error);
        }
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2 flex items-center gap-2">
            <Moon className="w-8 h-8 text-indigo-500" />
            Journal des Rêves
          </h1>
          <p className="opacity-70">Notez vos visions et manifestations nocturnes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd} 
            className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl mb-8 border border-black/5 dark:border-white/10 overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Résumé du rêve / Vision</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vision d'une lumière blanche..."
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Pratique liée (Optionnel)</label>
                <input 
                  type="text"
                  value={practiceRelated}
                  onChange={(e) => setPracticeRelated(e.target.value)}
                  placeholder="Ex: 7ème jour du Zikr de Latif..."
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Détail du Rêve</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Écrivez ce que vous avez vu, entendu ou ressenti..."
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2 font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin opacity-50" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center p-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/20 dark:border-white/20">
          <Book className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="opacity-70 text-lg">Votre journal est vide.</p>
          <p className="opacity-50 mt-1">Commencez par noter votre premier rêve.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold">{entry.title}</h3>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 -mr-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-medium opacity-60 mb-4 tracking-wider uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                {entry.practiceRelated && (
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-md">
                    {entry.practiceRelated}
                  </span>
                )}
              </div>
              
              <p className="opacity-80 leading-relaxed font-medium whitespace-pre-wrap">{entry.content}</p>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog?.isOpen || false}
        message={confirmDialog?.message || ""}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
