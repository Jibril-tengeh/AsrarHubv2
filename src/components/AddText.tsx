import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, serverTimestamp, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { logAdminActivity } from '../lib/activityLog';
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';

const DRAFT_KEY = 'asrarhub_add_text_draft';

export default function AddText() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [hook, setHook] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [loadingInitial, setLoadingInitial] = useState(!!id);

  useEffect(() => {
    if (id) {
      // Fetch existing document for editing
      const fetchDoc = async () => {
        try {
          const docRef = doc(db, 'texts', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title || '');
            setCategory(data.category || '');
            setContent(data.content || '');
            setHook(data.hook || '');
            setCoverImageUrl(data.coverImageUrl || '');
          }
        } catch (err) {
          console.error("Error fetching document:", err);
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchDoc();
    } else {
      // Load draft if adding new
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.content) setContent(parsed.content);
          if (parsed.hook) setHook(parsed.hook);
        } catch(e) {}
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      const timeout = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, category, content, hook }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [title, category, content, hook, id]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !content || !coverImageUrl) {
      setError('Please fill in all fields and provide a cover image URL.');
      return;
    }
    
    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Save metadata directly to Firestore
      console.log("Saving to Firestore...");
      
      let setDocTask;
      if (id) {
        const docRef = doc(db, 'texts', id);
        setDocTask = updateDoc(docRef, {
          title,
          category,
          hook,
          content,
          coverImageUrl,
          updatedAt: serverTimestamp()
        });
      } else {
        const newDocRef = doc(collection(db, 'texts'));
        setDocTask = setDoc(newDocRef, {
          title,
          category,
          hook,
          content,
          coverImageUrl,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      const setDocTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore save timed out. Check your Firestore rules or connection.")), 15000)
      );
      
      await Promise.race([setDocTask, setDocTimeout]);
      console.log("Firestore save completed.");

      await logAdminActivity(
        id ? 'UPDATE' : 'CREATE',
        'texts',
        id || 'new_doc',
        `Admin ${id ? 'updated' : 'added'} text with title: ${title}`
      );

      if (!id) {
        localStorage.removeItem(DRAFT_KEY);
      }
      setUploading(false);
      toast.success(id ? 'Text updated successfully' : 'Text published successfully');
      navigate('/admin/texts');
    } catch (dborStorageError: any) {
      setUploading(false);
      const errorMessage = "Failed to save. " + (dborStorageError.message || "Unknown error. Check console.");
      setError(errorMessage);
      toast.error(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {loadingInitial ? (
        <div className="flex justify-center flex-col items-center py-20 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading reading data...</p>
        </div>
      ) : (
      <>
        <div className="mb-6 md:mb-8 flex items-center gap-4">
          <Link
            to="/admin/texts"
            className="rounded-full p-2 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {id ? 'Edit Text Reading' : 'Add New Text Reading'}
            </h1>
          </div>
        </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Form Section */}
        <div className="flex-1 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                Title
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full min-h-[48px] rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 px-4"
                  placeholder="The Power of Habit"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">
                Category
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full min-h-[48px] rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 px-4"
                  placeholder="Self Improvement"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="hook" className="block text-sm font-medium leading-6 text-gray-900">
                Hook (Short excerpt/summary)
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="hook"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  className="block w-full min-h-[48px] rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 px-4"
                  placeholder="A short engaging sentence..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="coverImageUrl" className="block text-sm font-medium leading-6 text-gray-900">
                Cover Image URL
              </label>
              <div className="mt-2">
                <input
                  type="url"
                  id="coverImageUrl"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="block w-full min-h-[48px] rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 px-4"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              {coverImageUrl && (
                <div className="mt-4 flex justify-center">
                  <img src={coverImageUrl} alt="Preview" className="h-32 w-auto rounded-md object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Content Area
                </label>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setEditorMode('wysiwyg')} className={`text-xs px-3 py-1.5 rounded-md ${editorMode === 'wysiwyg' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Visual Mode</button>
                  <button type="button" onClick={() => setEditorMode('html')} className={`text-xs px-3 py-1.5 rounded-md ${editorMode === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Raw HTML</button>
                </div>
              </div>
              <div className="mt-2 bg-white">
                {editorMode === 'wysiwyg' ? (
                  <div className="mb-10">
                    <ReactQuill 
                      theme="snow" 
                      value={content} 
                      onChange={setContent} 
                      className="h-64 pb-12" 
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'script': 'sub'}, { 'script': 'super' }],
                          [{ 'indent': '-1'}, { 'indent': '+1' }],
                          [{ 'direction': 'rtl' }],
                          ['link', 'image', 'video'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    id="content"
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="block w-full min-h-[250px] rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 px-4 font-mono whitespace-pre-wrap"
                    placeholder="<p>Start writing your HTML...</p>"
                    required
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-900/10 pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/texts')}
                className="w-full sm:w-auto text-base font-semibold leading-6 text-gray-900 px-4 py-3 min-h-[48px] rounded-md hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex w-full sm:w-auto min-h-[48px] items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {id ? 'Update Reading' : 'Publish Reading'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className="flex-1 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 flex flex-col">
          <h2 className="text-sm font-semibold leading-6 text-gray-900 border-b pb-2 mb-4">Live Preview</h2>
          <div className="prose prose-sm max-w-none flex-1 overflow-y-auto w-full">
            {title ? <h1>{title}</h1> : <h1 className="text-gray-300">Title goes here</h1>}
            {category && <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">{category}</span>}
            
            {coverImageUrl && (
              <div className="mb-4 text-center">
                <img src={coverImageUrl} alt="Preview" className="h-40 w-auto rounded-md object-cover inline-block" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'inline-block')} />
              </div>
            )}

            <div className="mt-4 w-full prose prose-blue prose-sm sm:prose-base max-w-none">
              {content ? (
                editorMode === 'wysiwyg' ? (
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    readOnly={true} 
                    modules={{ toolbar: false }}
                    className="live-preview-editor border-none"
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )
              ) : (
                <p className="text-gray-400 italic">Content will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
