import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Plus, Trash2, Quote } from 'lucide-react';
import { toast } from 'sonner';

interface Affirmation {
  id: string;
  text: string;
  author: string;
}

export default function AdminAffirmations() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const fetchAffirmations = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'affirmations'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Affirmation));
      setAffirmations(docs);
    } catch (error) {
      console.error("Error fetching affirmations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffirmations();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette affirmation ?")) {
      try {
        await deleteDoc(doc(db, 'affirmations', id));
        fetchAffirmations();
        toast.success("Affirmation deleted successfully");
      } catch (error) {
        console.error("Error deleting affirmation:", error);
        toast.error("Erreur: permission refusée ou problème de connexion.");
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      await addDoc(collection(db, 'affirmations'), {
        text: newText,
        author: newAuthor || 'Anonyme',
        createdAt: new Date().toISOString()
      });
      setNewText('');
      setNewAuthor('');
      setIsAdding(false);
      fetchAffirmations();
      toast.success("Affirmation added successfully");
    } catch (error) {
      console.error("Error adding affirmation:", error);
      toast.error("Erreur lors de l'ajout.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gérer les Affirmations</h1>
          <p className="text-slate-500 mt-1">Gérez le contenu des pensées quotidiennes</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Affirmation
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Citation / Vœu</label>
            <textarea 
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Que la paix divine illumine votre journée..."
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Auteur / Source (Optionnel)</label>
            <input 
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Tradition Soufie"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {affirmations.map((aff) => (
          <div key={aff.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <Quote className="w-8 h-8 text-indigo-100 mb-3" />
            <p className="text-slate-800 font-medium mb-3 flex-1">{aff.text}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">{aff.author}</span>
              <button 
                onClick={() => handleDelete(aff.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {affirmations.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            Aucune affirmation trouvée. Ajoutez-en une pour commencer.
          </div>
        )}
      </div>
    </div>
  );
}
