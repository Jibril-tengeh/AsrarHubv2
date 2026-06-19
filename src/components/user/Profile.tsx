import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save, Edit2, Mail, Calendar, MessageSquare, BookOpen } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  const [stats, setStats] = useState({
    messages: 0,
    journals: 0,
    joinDate: new Date(),
    email: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) return;
      
      setName(auth.currentUser.displayName || '');
      setPhotoUrl(auth.currentUser.photoURL || '');
      setStats(prev => ({
        ...prev,
        email: auth.currentUser?.email || '',
        joinDate: new Date(auth.currentUser?.metadata.creationTime || Date.now())
      }));
      
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bio) setBio(data.bio);
          if (data.name) setName(data.name);
          if (data.photoUrl) setPhotoUrl(data.photoUrl);
        } else {
          // Initialize empty profile
          await setDoc(docRef, {
            name: auth.currentUser.displayName || '',
            photoUrl: auth.currentUser.photoURL || '',
            bio: '',
            status: 'active',
            email: auth.currentUser.email,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        
        // Fetch stats (we won't use getCountFromServer because it might require indexes or fail, we'll get Docs for low volume, or just display static if failing)
        try {
          const qMsgs = query(collection(db, 'community_messages'), where('userId', '==', auth.currentUser.uid));
          const msgSnap = await getDocs(qMsgs);
          
          const qJournals = query(collection(db, 'dream_journals'), where('userId', '==', auth.currentUser.uid));
          const journalSnap = await getDocs(qJournals);
          
          setStats(prev => ({
            ...prev,
            messages: msgSnap.size,
            journals: journalSnap.size
          }));
        } catch (e) {
          console.error("Error fetching stats:", e);
        }
        
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400; // Profile pictures don't need to be huge
        
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            setLoading(false);
            return;
          }
          const storageRef = ref(storage, `profile_pictures/${auth.currentUser!.uid}/${Date.now()}.jpg`);
          const metadata = { contentType: 'image/jpeg' };
          const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload error:", error);
              setLoading(false);
              setUploadProgress(0);
              setErrorMsg("Erreur lors de l'upload de l'image.");
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setPhotoUrl(downloadURL);
              } catch (err) {
                console.error(err);
                setErrorMsg("Erreur lors de la récupération de l'URL.");
              } finally {
                setUploadProgress(0);
                setLoading(false);
              }
            }
          );
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => {
        console.error("Error reading file");
        setUploadProgress(0);
        setLoading(false);
        setErrorMsg("Erreur lors de la lecture de l'image.");
      };
      img.src = URL.createObjectURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Update Auth profile
      const isBase64 = photoUrl && photoUrl.startsWith('data:image');
      const authUpdates: any = { displayName: name };
      if (!isBase64 && photoUrl) {
        authUpdates.photoURL = photoUrl;
      }
      
      await updateProfile(auth.currentUser, authUpdates);
      
      // 2. Update Firestore user document
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, {
        name,
        bio,
        photoUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setIsEditing(false);
    } catch (err: any) {
      console.error("Erreur mise à jour profil:", err);
      setErrorMsg(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Header Banner */}
      <div className="h-48 bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-600 dark:to-amber-900 relative">
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex items-center justify-between z-10 text-white">
          <button 
            onClick={() => navigate(-1)}
            type="button"
            className="p-2 -ml-2 rounded-full hover:bg-black/20 transition-colors active:opacity-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 -mr-2 rounded-full hover:bg-black/20 transition-colors flex items-center gap-2 text-sm font-bold bg-black/20 backdrop-blur-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 relative -mt-16 z-20">
        <form onSubmit={handleSave} className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-6 border border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-col items-center justify-center -mt-16 mb-4">
            <div className="relative">
              <div className={`w-28 h-28 rounded-full overflow-hidden bg-white dark:bg-neutral-900 flex items-center justify-center border-4 border-white dark:border-neutral-900 shadow-lg`}>
                {photoUrl ? (
                   <img src={photoUrl} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-4xl font-bold text-amber-700 dark:text-amber-400">
                     {name?.charAt(0)?.toUpperCase() || '?'}
                   </div>
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2.5 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 active:scale-95 transition-transform border-4 border-white dark:border-neutral-900"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePhotoUpload(e.target.files[0]);
                      }
                    }} 
                  />
                </>
              )}
            </div>
            {uploadProgress > 0 && <p className="text-xs text-amber-600 mt-2 font-bold">{Math.round(uploadProgress)}% uploadé...</p>}
          </div>

          {!isEditing ? (
            <div className="text-center space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{name}</h1>
                <p className="text-sm opacity-60 mt-1 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {stats.email}
                </p>
                <p className="text-sm opacity-60 mt-1 flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Rejoint en {format(stats.joinDate, 'MMMM yyyy', { locale: fr })}
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-sm px-4 whitespace-pre-wrap {bio ? 'opacity-80' : 'opacity-40 italic'}">
                  {bio || 'Aucune biographie...'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex flex-col items-center">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold mb-0.5">{stats.messages}</span>
                  <span className="text-xs opacity-60 font-medium">Messages</span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex flex-col items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold mb-0.5">{stats.journals}</span>
                  <span className="text-xs opacity-60 font-medium">Rêves notés</span>
                </div>
              </div>

              <div className="pt-6">
                
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-bold mb-1.5 opacity-80">Nom public</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  placeholder="Votre nom"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1.5 opacity-80">Bio</label>
                <textarea 
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                   className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none min-h-[100px]"
                   placeholder="Parlez-nous de vous..."
                   maxLength={150}
                />
                <p className="text-right text-[10px] opacity-50 mt-1">{bio.length}/150</p>
              </div>
              
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadProgress > 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] transition-all shadow-md"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
