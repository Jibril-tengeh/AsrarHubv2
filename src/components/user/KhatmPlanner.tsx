import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Calendar, CheckCircle2, Circle, Target, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface KhatmPlan {
  id: string;
  title: string;
  totalDays: number;
  completedDays: number;
  startDate: string;
  notes: string;
}

export default function KhatmPlanner() {
  const [plans, setPlans] = useState<KhatmPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  
  const [title, setTitle] = useState('');
  const [totalDays, setTotalDays] = useState(7);
  const [notes, setNotes] = useState('');

  const fetchPlans = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'khatm_plans'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KhatmPlan));
      setPlans(docs);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title.trim() || totalDays < 1) return;

    try {
      await addDoc(collection(db, 'khatm_plans'), {
        userId: auth.currentUser.uid,
        title,
        totalDays,
        completedDays: 0,
        notes,
        startDate: new Date().toISOString()
      });
      setTitle('');
      setNotes('');
      setTotalDays(7);
      setIsAdding(false);
      fetchPlans();
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const handleProgress = async (plan: KhatmPlan, action: 'add' | 'sub') => {
    let newCompleted = plan.completedDays;
    if (action === 'add' && newCompleted < plan.totalDays) {
      newCompleted++;
    } else if (action === 'sub' && newCompleted > 0) {
      newCompleted--;
    } else {
      return;
    }

    try {
      await updateDoc(doc(db, 'khatm_plans', plan.id), {
        completedDays: newCompleted
      });
      setPlans(plans.map(p => p.id === plan.id ? { ...p, completedDays: newCompleted } : p));
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Voulez-vous abandonner ce plan de Khatm ?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'khatm_plans', id));
          setPlans(plans.filter(p => p.id !== id));
        } catch (error) {
          console.error("Error deleting plan:", error);
        }
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-6 pb-24 min-h-screen" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight mb-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Planificateur de Khatm
          </h1>
          <p className="text-sm opacity-70">Suivez vos retraites et vos quarantaines.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2.5 bg-amber-600 text-white rounded-xl shadow-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd} 
            className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl mb-6 border border-black/5 dark:border-white/10 overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Nom de la Retraite / Zikr</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Quarantaine de la Sourate Yassine"
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Durée Prévue (Jours)</label>
                <input 
                  type="number"
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value) || 1)}
                  min="1"
                  max="365"
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Notes / Intentions</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Objectifs, nombre de répétitions par jour..."
                  className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
                  className="px-5 py-2 bg-amber-600 text-white font-medium rounded-xl shadow-lg hover:bg-amber-700 transition-colors"
                >
                  Démarrer le Khatm
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
      ) : plans.length === 0 ? (
        <div className="text-center p-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/20 dark:border-white/20">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="opacity-70 text-lg">Aucun plan en cours.</p>
          <p className="opacity-50 mt-1">Commencez une nouvelle retraite spirituelle.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => {
            const percentage = Math.round((plan.completedDays / plan.totalDays) * 100);
            
            return (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-black/5 dark:border-white/5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{plan.title}</h3>
                    <p className="flex items-center gap-2 text-sm font-medium opacity-60 uppercase tracking-widest">
                      <Calendar className="w-4 h-4" />
                      Démarré le {new Date(plan.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
                    title="Abandonner"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {plan.notes && (
                  <div className="mb-6 bg-black/5 dark:bg-white/5 p-4 rounded-xl text-sm opacity-80 border-l-2 border-amber-500">
                    <p>{plan.notes}</p>
                  </div>
                )}

                <div className="mb-2 flex justify-between items-end">
                  <span className="text-sm font-bold opacity-70">Progression</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {plan.completedDays} / {plan.totalDays}
                  </span>
                </div>

                <div className="h-4 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-amber-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleProgress(plan, 'sub')}
                    disabled={plan.completedDays === 0}
                    className="flex-1 py-3 bg-black/5 dark:bg-white/10 rounded-xl font-bold opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Circle className="w-5 h-5" />
                    Annuler J-1
                  </button>
                  <button 
                    onClick={() => handleProgress(plan, 'add')}
                    disabled={plan.completedDays === plan.totalDays}
                    className="flex-[2] py-3 bg-amber-600 text-white rounded-xl shadow-lg hover:bg-amber-700 font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {plan.completedDays === plan.totalDays ? 'Terminé !' : "Valider Aujourd'hui"}
                  </button>
                </div>
              </motion.div>
            );
          })}
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
