import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { PlayCircle, Music, Gamepad2, FileText, Heart, Search, Loader2 as LoaderIcon, ChevronRight, Bookmark } from 'lucide-react';
import { ContentPlayer } from '../components/ContentPlayer';
import { useToast } from '../context/ToastContext';
import { ContentSkeleton } from '../components/ui/Skeleton';

interface Content {
  id: string;
  title: string;
  contentType: string;
  grade: string;
  url: string;
  iframeCode?: string;
  videoUrl?: string;
  description?: string;
}

export function Library() {
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      const favIds: string[] = JSON.parse(localStorage.getItem('fav_contents') || '[]');
      if (favIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results: Content[] = [];
        for (const id of favIds) {
          const docRef = doc(db, 'contents', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            results.push({ id: docSnap.id, ...docSnap.data() } as Content);
          }
        }
        setFavorites(results);
      } catch (err) {
        console.error("Error fetching library:", err);
        addToast("Kutubxonani yuklashda xatolik yuz berdi", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFavs = favorites.filter(f => f.id !== id);
    setFavorites(updatedFavs);
    const favIds = updatedFavs.map(f => f.id);
    localStorage.setItem('fav_contents', JSON.stringify(favIds));
    addToast("Kutubxonadan olib tashlandi", "info");
  };

  const filteredFavorites = favorites.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <ContentSkeleton /><ContentSkeleton /><ContentSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-highlight mb-12 flex flex-col md:flex-row items-center gap-8 p-10"
      >
        <div className="p-6 bg-surface border-4 border-border shadow-sm">
          <Bookmark size={48} />
        </div>
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-black uppercase mb-4">Mening Kutubxonam</h1>
          <p className="text-xl font-bold opacity-80 max-w-2xl">
            Siz saqlab qo'ygan barcha darslar, o'yinlar va tajribalar shu yerda to'planadi.
          </p>
        </div>
      </motion.div>

      <div className="mb-12 relative max-w-2xl">
        <input 
          type="text"
          placeholder="Saqlanganlar orasidan qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full pl-12 py-4 text-lg"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text opacity-40" size={24} />
      </div>

      <AnimatePresence mode="wait">
        {filteredFavorites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-surface border-4 border-dashed border-border rounded-xl"
          >
            <Heart size={64} className="mx-auto mb-6 opacity-20" />
            <h3 className="text-3xl font-serif font-black opacity-50 uppercase">Hozircha saqlanganlar yo'q</h3>
            <p className="text-xl font-bold opacity-40 mt-4">Darslarni o'rganish davomida "Yurakcha" tugmasini bosing!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFavorites.map((content) => (
              <motion.div
                key={content.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8 }}
                className="card bg-surface p-0 overflow-hidden flex flex-col border-4 border-border"
              >
                <div className="relative aspect-video bg-bg border-b-4 border-border overflow-hidden">
                  <button 
                    onClick={(e) => removeFavorite(content.id, e)}
                    className="absolute top-4 right-4 z-10 p-2 border-4 border-border bg-error text-surface shadow-sm active:shadow-none"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>

                  <div 
                    className="w-full h-full flex items-center justify-center bg-highlight/30 cursor-pointer group"
                    onClick={() => setSelectedContent(content)}
                  >
                    <img 
                      src={`https://picsum.photos/seed/${content.id}/800/450`} 
                      alt={content.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform absolute inset-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="relative z-10 p-4 bg-surface/90 border-4 border-border rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      {content.contentType === 'video' || content.contentType === 'tajriba' ? <PlayCircle size={40} /> : 
                       content.contentType === 'audio' ? <Music size={40} /> : 
                       content.contentType === 'game' ? <Gamepad2 size={40} /> : <FileText size={40} />}
                    </div>
                  </div>
                  
                  <div className="absolute top-4 left-4">
                    <span className="badge bg-surface font-black">{content.grade}-sinf</span>
                  </div>
                </div>
                
                <div className="p-6 flex-grow">
                  <h4 className="text-2xl font-serif font-black mb-3 leading-tight">{content.title}</h4>
                  <button 
                    onClick={() => setSelectedContent(content)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Darsga o'tish <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

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
