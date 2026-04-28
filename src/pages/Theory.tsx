import { PlayCircle, FileText, Download, ExternalLink, Microscope, Droplets, Sun, Magnet, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

interface Content {
  id: string;
  title: string;
  grade: string;
  url: string;
  iframeCode?: string;
  videoUrl?: string;
  description?: string;
  contentType: string;
}

export function Theory() {
  const [experiments, setExperiments] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'contents'), 
      where('contentType', '==', 'tajriba'),
      orderBy('grade', 'asc'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
      setExperiments(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching experiments:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredExperiments = experiments.filter(exp => 
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForGrade = (grade: string) => {
    switch (grade) {
      case '1': return <Microscope size={40} />;
      case '2': return <Droplets size={40} />;
      case '3': return <Magnet size={40} />;
      case '4': return <Sun size={40} />;
      default: return <PlayCircle size={40} />;
    }
  };

  const getColorForGrade = (grade: string) => {
    switch (grade) {
      case '1': return 'bg-primary';
      case '2': return 'bg-accent';
      case '3': return 'bg-error';
      case '4': return 'bg-highlight';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return <div className="container flex justify-center items-center min-h-[80vh]"><Loader2 className="animate-spin" size={48} /></div>;
  }

  // Group experiments by grade
  const groupedExperiments = ['1', '2', '3', '4'].map(grade => ({
    grade,
    items: experiments.filter(exp => exp.grade === grade)
  }));

  return (
    <div className="container" style={{ margin: '3rem auto' }}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card lg:col-span-1" style={{ position: 'sticky', top: '7rem', height: 'fit-content' }}
        >
          <h3 className="text-2xl mb-6 border-b-4 border-border pb-4 font-serif uppercase">Sinflar bo'yicha</h3>
          <ul className="space-y-4 font-bold">
            {[1, 2, 3, 4].map(grade => (
              <li key={grade}>
                <a href={`#sinf-${grade}`} className="flex items-center gap-3 p-3 border-4 border-transparent hover:border-border hover:bg-highlight hover:-translate-y-1 hover:shadow-sm transition-all text-text">
                  <div className="w-3 h-3 bg-text"></div>
                  {grade}-sinf tajribalari
                </a>
              </li>
            ))}
          </ul>
        </motion.aside>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card lg:col-span-3"
        >
          <div className="mb-12 border-b-4 border-border pb-8">
            <h1 className="text-5xl md:text-6xl font-serif uppercase font-black mb-4">Darslikdagi Tajribalar</h1>
            <p className="text-xl text-text font-bold mb-8">
              Tabiiy fanlar darsliklarida berilgan amaliy mashg'ulotlar va tajribalarning video ko'rinishlari. Har bir tajribani o'zingiz ham sinab ko'ring!
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tajribalarni qidirish..."
                className="input-field w-full pl-12 py-4 text-lg"
              />
              <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-text opacity-50" size={24} />
            </div>
          </div>

          {searchQuery ? (
            <div className="space-y-12">
              <h2 className="text-3xl font-serif uppercase border-b-4 border-border pb-4">Qidiruv natijalari: {filteredExperiments.length} ta</h2>
              {filteredExperiments.length === 0 ? (
                <p className="text-xl font-bold opacity-50 italic">Hech narsa topilmadi.</p>
              ) : (
                filteredExperiments.map(exp => (
                  <div key={exp.id} className="bg-surface border-4 border-border p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`badge ${getColorForGrade(exp.grade)}`}>{exp.grade}-sinf</div>
                      <h3 className="text-3xl font-bold">{exp.title}</h3>
                    </div>
                    <div className="relative w-full aspect-video bg-bg border-4 border-border mb-6 overflow-hidden flex items-center justify-center">
                      {exp.videoUrl ? (
                        <video src={exp.videoUrl} controls className="w-full h-full object-cover" />
                      ) : exp.iframeCode ? (
                        <div 
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: exp.iframeCode }} 
                        />
                      ) : exp.url.includes('youtube.com') || exp.url.includes('youtu.be') ? (
                        <iframe 
                          src={exp.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                          className="w-full h-full object-cover"
                          title={exp.title}
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video src={exp.url} controls className="w-full h-full object-cover" />
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xl text-text font-bold leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            groupedExperiments.map(({ grade, items }) => (
              <article id={`sinf-${grade}`} key={grade} className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 ${getColorForGrade(grade)} border-4 border-border text-text shadow-sm`}>
                    {getIconForGrade(grade)}
                  </div>
                  <h2 className="text-4xl md:text-5xl">{grade}-sinf Tajribalari</h2>
                </div>
                
                {items.length === 0 ? (
                  <p className="text-xl text-text/70 font-bold italic bg-surface p-6 border-4 border-border">
                    Hozircha bu sinf uchun videolar yuklanmagan.
                  </p>
                ) : (
                  <div className="space-y-12">
                    {items.map(exp => (
                      <div key={exp.id} className="bg-surface border-4 border-border p-6 shadow-sm">
                        <h3 className="text-3xl font-bold mb-4">{exp.title}</h3>
                        <div className="relative w-full aspect-video bg-bg border-4 border-border mb-6 overflow-hidden flex items-center justify-center">
                          {exp.videoUrl ? (
                            <video src={exp.videoUrl} controls className="w-full h-full object-cover" />
                          ) : exp.iframeCode ? (
                            <div 
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: exp.iframeCode }} 
                            />
                          ) : exp.url.includes('youtube.com') || exp.url.includes('youtu.be') ? (
                            <iframe 
                              src={exp.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                              className="w-full h-full object-cover"
                              title={exp.title}
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <video src={exp.url} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-xl text-text font-bold leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
