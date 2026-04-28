import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { PlayCircle, Gamepad2, FileText, FlaskConical, Activity, Loader2, ChevronRight, Star, ArrowLeft, Search, Heart, Code } from 'lucide-react';
import { ContentPlayer } from '../components/ContentPlayer';
import { Link } from 'react-router-dom';

interface Content {
  id: string;
  title: string;
  contentType: string;
  grade: string;
  url: string;
  iframeCode?: string;
  videoUrl?: string;
  description?: string;
  isFavorite?: boolean;
}

export function GradeDetail() {
  const { gradeId } = useParams<{ gradeId: string }>();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(JSON.parse(localStorage.getItem('fav_contents') || '[]'));

  const gradeInfo = {
    '1': { name: '1-sinf', color: 'bg-success', accent: 'border-success' },
    '2': { name: '2-sinf', color: 'bg-accent', accent: 'border-accent' },
    '3': { name: '3-sinf', color: 'bg-primary', accent: 'border-primary' },
    '4': { name: '4-sinf', color: 'bg-highlight', accent: 'border-highlight' },
  }[gradeId || '1'];

  useEffect(() => {
    if (!gradeId) return;
    setLoading(true);
    const q = query(
      collection(db, 'contents'),
      where('grade', '==', gradeId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
      setContents(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching grade content:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gradeId]);

  useEffect(() => {
    localStorage.setItem('fav_contents', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredContents = contents.filter(c => 
    (activeTab === 'all' || c.contentType === activeTab) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: 'video', name: 'Videolar', icon: <PlayCircle size={20} /> },
    { id: 'tajriba', name: 'Tajribalar', icon: <FlaskConical size={20} /> },
    { id: 'game', name: 'O\'yinlar', icon: <Gamepad2 size={20} /> },
    { id: 'test', name: 'Testlar', icon: <FileText size={20} /> },
  ];

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={64} />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <Link to="/" className="flex items-center gap-2 font-black uppercase tracking-widest text-sm hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Asosiy sahifa
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card ${gradeInfo?.color} mb-12 flex flex-col md:flex-row items-center gap-8 p-10`}
      >
        <div className="w-24 h-24 bg-surface border-4 border-border shadow-sm flex items-center justify-center text-5xl font-black">
          {gradeId}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black uppercase mb-4 break-words">{gradeInfo?.name}</h1>
          <p className="text-lg md:text-xl font-bold opacity-80 max-w-2xl">
            {gradeInfo?.name} o'quvchilari uchun maxsus tayyorlangan interaktiv darsliklar, tajribalar va o'yinlar to'plami.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
           <div className="card bg-surface p-6 shadow-sm border-4 border-border">
            <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b-4 border-border pb-2">Bo'limlar</h3>
            <div className="flex flex-col gap-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 p-4 border-4 border-border font-bold transition-all ${activeTab === tab.id ? 'bg-accent shadow-none translate-x-1 translate-y-1' : 'bg-bg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-highlight'}`}
                >
                  <div className="flex items-center gap-3">
                    {tab.icon}
                    <span className="text-sm md:text-base">{tab.name}</span>
                  </div>
                  <ChevronRight size={16} className="md:hidden opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-8 relative">
            <input 
              type="text"
              placeholder="Darslarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-12 py-4 text-lg bg-surface border-4 border-border"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text opacity-40" size={24} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + gradeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {filteredContents.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-surface border-4 border-dashed border-border rounded-xl">
                  <div className="inline-block p-6 bg-bg border-4 border-border mb-6">
                    <Star size={48} className="opacity-20" />
                  </div>
                  <h3 className="text-2xl font-serif font-black opacity-50">Hozircha bu bo'limda ma'lumot yo'q</h3>
                  <p className="font-bold opacity-40 mt-2">Tez orada yangi darslar qo'shiladi!</p>
                </div>
              ) : (
                filteredContents.map((content) => (
                  <motion.div
                    key={content.id}
                    whileHover={{ y: -8 }}
                    className={`card bg-surface p-0 overflow-hidden flex flex-col border-4 ${gradeInfo?.accent || 'border-border'}`}
                  >
                    <div className="relative aspect-video bg-bg border-b-4 border-border overflow-hidden">
                      <button 
                        onClick={(e) => toggleFavorite(content.id, e)}
                        className={`absolute top-4 right-4 z-10 p-2 border-4 border-border transition-all ${favorites.includes(content.id) ? 'bg-error text-surface' : 'bg-surface text-text hover:bg-highlight'}`}
                      >
                        <Heart size={20} fill={favorites.includes(content.id) ? "currentColor" : "none"} />
                      </button>

                      <div 
                        className="w-full h-full flex items-center justify-center group cursor-pointer"
                        onClick={() => setSelectedContent(content)}
                      >
                        <img 
                          src={`https://picsum.photos/seed/${content.id}/800/450`} 
                          alt={content.title} 
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`p-4 ${gradeInfo?.color || 'bg-primary'} border-4 border-border rounded-full shadow-sm group-hover:scale-110 transition-transform`}>
                            {content.contentType === 'test' ? <FileText size={48} /> : content.contentType === 'game' ? <Gamepad2 size={48} /> : <PlayCircle size={48} />}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow">
                      <div className="flex gap-2 mb-3">
                         <span className="badge bg-highlight text-text text-xs">{content.contentType.toUpperCase()}</span>
                      </div>
                      <h4 className="text-2xl font-serif font-black mb-3 leading-tight text-text">{content.title}</h4>
                      {content.description && (
                         <p className="text-sm font-bold opacity-70 line-clamp-2 mb-6 text-text">{content.description}</p>
                      )}
                      <button 
                        onClick={() => setSelectedContent(content)}
                        className={`btn ${gradeInfo?.color || 'btn-primary'} w-full flex items-center justify-center gap-2 py-3`}
                      >
                        Boshlash <ChevronRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {selectedContent && (
          <ContentPlayer 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
