import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Plus, Trash2, Edit2, Loader2, Link } from 'lucide-react';
import { toast } from 'sonner';

interface Preset {
  id: string;
  label: string;
  links: string[];
  category: string;
  link?: string; // For backward compatibility
}

export default function AdminRouqyaPresets() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [category, setCategory] = useState('Coran');

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'rouqya_presets'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Preset));
      setPresets(data);
    } catch (error) {
      console.error("Error fetching presets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLinks = links.filter(l => l.trim() !== '');
    if (!label.trim() || validLinks.length === 0) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'rouqya_presets', editingId), {
          label,
          links: validLinks,
          category,
          updatedAt: new Date().toISOString()
        });
        toast.success("Preset updated successfully");
      } else {
        await addDoc(collection(db, 'rouqya_presets'), {
          label,
          links: validLinks,
          category,
          createdAt: new Date().toISOString()
        });
        toast.success("Preset added successfully");
      }
      setLabel('');
      setLinks(['']);
      setCategory('Coran');
      setIsAdding(false);
      setEditingId(null);
      fetchPresets();
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error(editingId ? "Failed to update preset" : "Failed to add preset");
    }
  };

  const handleEdit = (preset: Preset) => {
    setLabel(preset.label);
    const presetLinks = preset.links || (preset.link ? [preset.link] : ['']);
    setLinks(presetLinks);
    setCategory(preset.category || 'Coran');
    setEditingId(preset.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet audio ?')) {
      try {
        await deleteDoc(doc(db, 'rouqya_presets', id));
        setPresets(presets.filter(p => p.id !== id));
        toast.success("Preset deleted successfully");
      } catch (error) {
        console.error("Error deleting preset:", error);
        toast.error("Failed to delete preset");
      }
    }
  };

  const groupedPresets = presets.reduce((acc, preset) => {
    const cat = preset.category || 'Non catégorisé';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin opacity-50" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Audios de Rouqya</h1>
          <p className="text-neutral-500">Gérez les audios proposés par défaut dans le moteur de Rouqya.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setLabel('');
            setLinks(['']);
            setCategory('Coran');
            setIsAdding(!isAdding);
          }}
          className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl text-white font-medium hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter un audio
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre de l'audio</label>
              <input 
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="ex: Ayat Al-Kursi ou Sorcellerie"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <input 
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="ex: Coran, Dua..."
                required
              />
            </div>
          </div>
          <div className="mb-4 space-y-3">
            <label className="block text-sm font-medium mb-1 flex items-center justify-between">
              <span>Liens directs (.mp3)</span>
              <button
                type="button"
                onClick={() => setLinks([...links, ''])}
                className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg"
              >
                <Plus className="w-3 h-3" />
                Ajouter un lien
              </button>
            </label>
            {links.map((link, index) => (
              <div key={index} className="flex relative items-center gap-2">
                <div className="relative flex-1">
                  <Link className="w-5 h-5 absolute left-3 top-2.5 text-neutral-400" />
                  <input 
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[index] = e.target.value;
                      setLinks(newLinks);
                    }}
                    className="w-full border border-neutral-300 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Lien ${index + 1}...`}
                    required={index === 0}
                  />
                </div>
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 font-medium rounded-xl hover:bg-neutral-100"
            >
              Annuler
            </button>
            <button 
               type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {presets.length === 0 ? (
        <div className="text-center p-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
          <Shield className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">Aucun audio enregistré.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPresets).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="px-3 py-1 bg-neutral-100 rounded-lg text-neutral-700 text-sm">{cat}</span>
                <span className="text-sm font-normal text-neutral-400">{items.length} audio(s)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((preset) => (
                  <div key={preset.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{preset.label}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(preset)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(preset.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg flex flex-col gap-2 overflow-hidden break-all">
                      {(preset.links || (preset.link ? [preset.link] : [])).map((url, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Link className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
