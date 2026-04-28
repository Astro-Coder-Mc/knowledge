import { Link } from 'react-router-dom';
import { BookOpen, Activity, PlayCircle, ArrowRight, Globe, ShieldCheck, Sparkles, Microscope, FlaskConical, Atom, Languages, Trophy, Star, Zap, Clock, Gamepad2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '../components/ui/Skeleton';

export function Home() {
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [topLearners, setTopLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qContent = query(collection(db, 'contents'), orderBy('createdAt', 'desc'), limit(3));
    const qLearners = query(collection(db, 'results'), orderBy('score', 'desc'), limit(5));

    const unsubContent = onSnapshot(qContent, (snapshot) => {
      setRecentContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubLearners = onSnapshot(qLearners, (snapshot) => {
      setTopLearners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubContent();
      unsubLearners();
    };
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-[92vh] flex items-center relative pt-24 border-b-[12px] border-brick">
        {/* Decorative Ikat Strips */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-lojuvard z-10 opacity-30"></div>
        <div className="absolute top-0 bottom-0 right-0 w-4 bg-tilla z-10 opacity-30"></div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="badge mb-8 flex items-center w-fit border-2 border-lojuvard/30 bg-lojuvard/5">
              <Sparkles size={16} className="mr-2 text-lojuvard" />
              <span className="uppercase tracking-widest font-bold text-xs font-sans">Yangi Davr Ta'limi</span>
            </div>
            <h1 className="hero-title mb-8 leading-none">
              Bilim olami <br/>
              <span className="text-tilla italic">qiziqarli</span> <br/>
              va <span className="text-lojuvard">jonli</span>
            </h1>
            <p className="text-2xl text-text-muted font-medium mb-12 max-w-xl leading-relaxed italic border-l-4 border-brick pl-8">
              "Ilm o'rganish - saodat kalitidir. Biz bilan dunyoni yangicha kashf eting."
            </p>
            <div className="flex flex-wrap gap-8">
              <Link to="/theory" className="btn h-20 px-16 text-2xl group">
                Boshlash
                <ArrowRight size={30} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link to="/diagnostics" className="btn bg-white text-wood-dark border-brick/20 hover:border-tilla text-2xl h-20 px-16 shadow-[8px_8px_0px_0px_rgba(58,40,27,0.1)]">
                Testlar
              </Link>
            </div>
          </motion.div>

          {/* Featured Content Display */}
          <div className="hidden lg:flex justify-end items-center">
            <motion.div 
               initial={{ opacity: 0, x: 100, rotate: 10 }}
               animate={{ opacity: 1, x: 0, rotate: -3 }}
               transition={{ duration: 1.2, ease: "circOut" }}
               className="card p-0 overflow-hidden border-[16px] border-white shadow-[30px_30px_60px_-10px_rgba(58,40,27,0.4)] aspect-[4/5] w-[90%] relative"
             >
               <img src="https://cdn.getyourguide.com/img/tour/648aaa4220bed.jpeg/155.jpg" alt="National Heritage" className="w-full h-full object-cover scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-wood-dark/90 via-transparent to-transparent flex items-end p-12">
                 <div>
                   <span className="inline-block px-4 py-1 bg-tilla text-white text-xs font-bold uppercase tracking-widest mb-4">Eksklyuziv</span>
                   <h3 className="text-5xl text-white font-serif mb-4 font-bold italic">Samarqand Ruhi</h3>
                   <p className="text-white/80 text-lg font-medium leading-relaxed">Asriy bilimlar va qadimiy madaniyat sirlari sizni kutmoqda.</p>
                 </div>
               </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee/Ticker for Latest News */}
      <div className="bg-[#422e1b] text-[#D4AF37] py-6 border-y-4 border-brick overflow-hidden whitespace-nowrap shadow-inner">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-20 items-center font-serif uppercase text-xl font-bold tracking-widest"
        >
          {Array(10).fill('YANGI TAJRIBA VIDEOLARI QO\'SHILDI! • O\'YINLI TESTLARDA QATNASHING • REYTINGDA BIRINCHI BO\'LING! •').map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </motion.div>
      </div>

      {/* Stats & Latest Activity */}
      <section className="py-32 bg-white relative">
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
            
            {/* Top Learners List */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-6 mb-12 border-b-2 border-brick/10 pb-6">
                <Trophy size={40} className="text-tilla" />
                <h2 className="text-5xl font-serif font-bold italic">Peshqadamlar</h2>
              </div>
              <div className="space-y-6">
                {loading ? (
                  <Skeleton count={5} className="h-20 w-full rounded-xl" />
                ) : topLearners.map((user, i) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex justify-between items-center p-6 bg-ivory/50 border border-brick/10 rounded-2xl hover:bg-white hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <span className={`w-12 h-12 flex items-center justify-center rounded-full font-serif font-bold text-xl ${i === 0 ? 'bg-tilla text-white shadow-lg' : i === 1 ? 'bg-brick text-white shadow-md' : 'bg-white text-text shadow-sm border border-brick/10'}`}>
                        {i + 1}
                      </span>
                      <span className="font-bold text-xl group-hover:text-tilla transition-colors">{user.userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Star size={20} className="text-tilla fill-tilla" />
                       <span className="font-serif font-bold text-3xl text-wood-dark">{user.score}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Uploads Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-6 mb-12 border-b-2 border-brick/10 pb-6">
                <Zap size={40} className="text-lojuvard" />
                <h2 className="text-5xl font-serif font-bold italic">Yangi Bilimlar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl"></div>
                  ))
                ) : recentContent.map((item, i) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ y: -10 }}
                    className={`p-8 border-2 border-brick/5 relative overflow-hidden flex flex-col min-h-[260px] rounded-3xl ${i % 2 === 0 ? 'bg-lojuvard text-white' : 'bg-tilla text-white'}`}
                  >
                    <div className="flex justify-between items-center mb-8">
                      <span className="px-4 py-1 bg-white/20 rounded-full text-sm font-bold uppercase tracking-widest">
                        {item.grade}-sinf
                      </span>
                      <Clock size={20} className="opacity-60" />
                    </div>
                    <h4 className="text-3xl font-serif font-bold italic mb-8 leading-tight">{item.title}</h4>
                    <Link 
                      to={item.contentType === 'game' ? '/games' : '/theory'} 
                      className="mt-auto flex items-center gap-3 font-bold uppercase tracking-tighter bg-white text-wood-dark py-4 px-8 rounded-xl hover:bg-wood-dark hover:text-white transition-all self-start"
                    >
                      Batafsil <ArrowRight size={18} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grades Section */}
      <section className="py-32 bg-ivory border-y-8 border-brick relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 -translate-y-1/2 translate-x-1/2 scale-150">
           <Atom size={600} />
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mb-20">
             <h2 className="text-6xl md:text-8xl font-serif font-bold italic mb-8 text-wood-dark">Sinflar olami</h2>
             <p className="text-2xl text-text-muted leading-relaxed font-medium italic border-l-4 border-tilla pl-8">
               Har bir sinf - yangi ufqlarni kashf etish imkoniyati. Bilimingizga mos darajani tanlang.
             </p>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { name: '1-sinf', path: '/grade/1', icon: '01', desc: 'Sayohatni boshlash', bg: 'bg-[#008080]' },
              { name: '2-sinf', path: '/grade/2', icon: '02', desc: 'Bilimlar kashfiyoti', bg: 'bg-[#D4AF37]' },
              { name: '3-sinf', path: '/grade/3', icon: '03', desc: 'Fanlar olami', bg: 'bg-[#0047AB]' },
              { name: '4-sinf', path: '/grade/4', icon: '04', desc: 'Yangi maqsadlar', bg: 'bg-[#8B5A2B]' },
            ].map((grade, i) => (
              <motion.div 
                key={grade.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={grade.path} className="group relative block h-[450px] overflow-hidden rounded-[40px] shadow-2xl">
                  <div className={`absolute inset-0 ${grade.bg} opacity-90 transition-transform group-hover:scale-110 duration-700`}></div>
                  
                  {/* National Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                    <svg width="100%" height="100%">
                      <pattern id={`pattern-${i}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M20 0l10 10-10 10-10-10z" fill="white"/>
                      </pattern>
                      <rect width="100%" height="100%" fill={`url(#pattern-${i})`} />
                    </svg>
                  </div>

                  <div className="absolute inset-0 p-10 flex flex-col justify-end text-white">
                    <span className="text-8xl font-serif font-bold italic opacity-20 absolute top-10 right-10 leading-none">
                      {grade.icon}
                    </span>
                    <h3 className="text-4xl font-serif font-bold italic mb-4">{grade.name}</h3>
                    <p className="text-xl font-medium opacity-80 mb-8">{grade.desc}</p>
                    <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-sm bg-white text-wood-dark px-10 py-4 rounded-full w-fit group-hover:bg-wood-dark group-hover:text-white transition-all transform group-hover:translate-x-2">
                      Boshlash <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section - Refined */}
      <section className="py-32 bg-text text-surface relative overflow-hidden border-b-4 border-border">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 flex flex-wrap gap-20 p-20">
           <Microscope size={200} />
           <FlaskConical size={250} />
           <Atom size={180} />
           <Globe size={220} />
        </div>
        <div className="container relative z-10 flex flex-col items-center">
          <div className="max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="text-primary mb-8 animate-bounce ">
                 <Zap size={64} className="mx-auto" />
              </div>
              <h2 className="text-surface text-4xl lg:text-7xl font-sans leading-tight mb-12 uppercase font-black italic tracking-tighter">
                "Bilim — bu harakatdagi quvvatdir. Biz har bir tajribani kashfiyotga aylantiramiz."
              </h2>
              <p className="text-primary font-black tracking-[0.2em] uppercase text-2xl bg-surface inline-block px-10 py-4 border-8 border-border text-text shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                TABIIY FANLAR JAMOASI
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter - More Brutal */}
      <section className="py-24 bg-accent p-6">
        <div className="container max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, rotate: -1 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="card bg-surface p-12 lg:p-20 border-[10px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-center mb-12">
               <h2 className="text-6xl md:text-8xl text-text mb-6">XABARDOR BO'LING</h2>
               <p className="text-text font-black text-2xl">
                 Yangi o'yinlar va tajribalarni o'tkazib yubormang.
               </p>
            </div>
            
            <form className="flex flex-col sm:flex-row gap-6" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="EMAIL MANZILINGIZ" 
                className="input-field flex-grow text-2xl p-6 border-8 border-black placeholder:text-black/30"
              />
              <button type="submit" className="btn bg-primary px-12 py-6 text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] font-black">
                YUBORISH
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
