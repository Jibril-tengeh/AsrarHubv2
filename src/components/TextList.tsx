import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { logAdminActivity } from '../lib/activityLog';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface TextReading {
  id: string;
  title: string;
  category: string;
  coverImageUrl: string;
  updatedAt: any;
}

export default function TextList() {
  const [texts, setTexts] = useState<TextReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'texts'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const textData: TextReading[] = [];
        snapshot.forEach((docSnap) => {
          textData.push({ id: docSnap.id, ...docSnap.data() } as TextReading);
        });
        
        // Sort readings by updatedAt descending
        textData.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() || 0;
          const timeB = b.updatedAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setTexts(textData);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'texts');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, title?: string) => {
    if (window.confirm('Are you sure you want to delete this text reading?')) {
      try {
        await deleteDoc(doc(db, 'texts', id));
        await logAdminActivity('DELETE', 'texts', id, `Admin deleted text: ${title || 'unknown'}`);
        toast.success("Text reading deleted successfully");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `texts/${id}`);
        toast.error("Failed to delete text reading");
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Manage Text Readings
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            A list of all text readings including their title, category, and cover image.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0 w-full sm:w-auto">
          <Link
            to="/admin/texts/add"
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add New Reading
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
        <ul role="list" className="divide-y divide-gray-100">
          {loading ? (
            <li className="p-8 text-center text-sm text-gray-500">Loading texts...</li>
          ) : texts.length === 0 ? (
            <li className="p-8 text-center text-sm text-gray-500">No text readings found.</li>
          ) : (
            texts.map((text) => (
              <li key={text.id} className="flex items-center justify-between gap-x-6 px-6 py-5 hover:bg-gray-50">
                <div className="flex gap-x-4 items-center">
                  {text.coverImageUrl ? (
                    <img
                      src={text.coverImageUrl}
                      alt={text.title}
                      className="h-12 w-12 flex-none rounded-md object-cover bg-gray-50"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-gray-900 truncate">
                      {text.title}
                    </p>
                    <p className="mt-1 flex text-xs leading-5 text-gray-500">
                      <span className="truncate">{text.category}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <Link
                    to={`/admin/texts/edit/${text.id}`}
                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(text.id, text.title)}
                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
