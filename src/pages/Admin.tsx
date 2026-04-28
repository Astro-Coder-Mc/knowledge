import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Video, Search, Code, Upload, FileVideo, Loader2 } from 'lucide-react';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';

interface Content {
  id: string;
  title: string;
  contentType: string;
  grade: string;
  url: string;
  iframeCode?: string;
  description?: string;
  videoUrl?: string;
}

export function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<Content[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('video');
  const [grade, setGrade] = useState('1');
  const [url, setUrl] = useState('');
  const [iframeCode, setIframeCode] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // File upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Email tekshiruvi || (yoki) operatori bilan to'g'rilandi
      if (user && (user.email === 'astrojamshid@gmail.com' || user.email === 'gulbahor.217a@gmail.com')) {
        setIsAdmin(true);
        fetchContents();
      } else {
        setIsAdmin(false);
        if (!loading) navigate('/'); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchContents = async () => {
    try {
      const q = query(collection(db, 'contents'), orderBy('grade', 'asc'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
      setContents(data);
    } catch (err) {
      console.error("Error fetching contents:", err);
      addToast("Kontentlarni yuklashda xatolik yuz berdi", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        addToast("Fayl hajmi juda katta (maksimal 100MB)", "error");
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setIsUploading(true);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          addToast("Yuklashda xatolik yuz berdi", "error");
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      addToast("Sarlavhani to'ldiring", "error");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalVideoUrl = '';
      if (videoFile) {
        finalVideoUrl = await uploadFile(videoFile);
      }

      await addDoc(collection(db, 'contents'), {
        title,
        contentType,
        grade,
        url: finalVideoUrl || url,
        videoUrl: finalVideoUrl || null,
        iframeCode,
        description,
        createdAt: serverTimestamp()
      });
      
      addToast("Kontent muvaffaqiyatli qo'shildi!", "success");
      setTitle('');
      setUrl('');
      setIframeCode('');
      setDescription('');
      setVideoFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchContents();
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Haqiqatan ham bu kontentni o'chirmoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, 'contents', id));
        addToast("Kontent o'chirildi", "info");
        fetchContents();
      } catch (err) {
        console.error("Error deleting document: ", err);
        addToast("O'chirishda xatolik yuz berdi", "error");
      }
    }
  };

  const filteredAdminContents = contents.filter(c => 
    c.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
    c.grade.includes(adminSearch) ||
    c.contentType.toLowerCase().includes(adminSearch.toLowerCase())
  );

  if (loading) return <div className="container py-20"><Skeleton className="h-64 w-full mb-8" /><Skeleton className="h-96 w-full" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card lg:col-span-1 bg-surface">
          <h2 className="text-3xl font-serif mb-6 border-b-4 border-border pb-4 flex items-center gap-3">
            <Plus size={28} /> Yangi Kontent
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-bold mb-2">Sinf</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="input-field w-full">
                  <option value="1">1-sinf</option>
                  <option value="2">2-sinf</option>
                  <option value="3">3-sinf</option>
                  <option value="4">4-sinf</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold mb-2">Turi</label>
                <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="input-field w-full">
                  <option value="video">Video</option>
                  <option value="tajriba">Tajriba</option>
                  <option value="game">O'yin</option>
                  <option value="test">Test</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-2">Sarlavha</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha" className="input-field w-full" />
            </div>

            <div>
              <label className="block text-lg font-bold mb-2 flex items-center gap-2">
                <Upload size={18} /> Video yuklash (Kompuyuterdan)
              </label>
              <div className="relative">
                <input type="file" accept="video/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" id="video-upload" />
                <label htmlFor="video-upload" className={`flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-border p-4 cursor-pointer hover:bg-bg transition-colors ${videoFile ? 'bg-bg' : 'bg-surface'}`}>
                  {videoFile ? (
                    <div className="flex items-center gap-3 text-primary">
                      <FileVideo size={32} />
                      <div className="text-left">
                        <p className="font-bold line-clamp-1">{videoFile.name}</p>
                        <p className="text-xs opacity-60">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="opacity-40 mb-2" />
                      <p className="text-sm font-bold opacity-60">Videoni tanlang yoki shu yerga tashlang</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-border text-center">
              <p className="text-xs font-bold opacity-40 uppercase mb-4">YOKI LINK ORQALI</p>
              <div className="space-y-4 text-left">
                <label className="block text-lg font-bold mb-2 flex items-center gap-2"><Video size={18} /> URL</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="input-field w-full" />
                <label className="block text-lg font-bold mb-2 flex items-center gap-2"><Code size={18} /> Iframe</label>
                <textarea value={iframeCode} onChange={(e) => setIframeCode(e.target.value)} placeholder="<iframe>...</iframe>" className="input-field w-full min-h-[80px]" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full text-lg">
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-serif">Kontentlar Ro'yxati</h2>
            <div className="relative w-64">
              <input type="text" placeholder="Qidirish..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="input-field w-full pl-10 py-2 text-sm" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredAdminContents.map((item) => (
              <div key={item.id} className="bg-surface border-4 border-border p-4 flex gap-4 items-center shadow-sm">
                <div className="w-32 aspect-video bg-bg border-2 border-border overflow-hidden flex items-center justify-center text-xs text-center p-2">
                  {item.contentType === 'video' ? '🎬 Video' : item.contentType}
                </div>
                <div className="flex-grow">
                  <div className="flex gap-2 mb-1">
                    <span className="badge">{item.grade}-sinf</span>
                    <span className="badge bg-primary">{item.contentType}</span>
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                </div>
                <button onClick={() => handleDelete(item.id)} className="btn bg-error p-2 border-2 border-border">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}