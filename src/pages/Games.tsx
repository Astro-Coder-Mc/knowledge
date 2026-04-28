import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Timer, Trophy, Leaf, Droplets, Sun, Wind, Recycle, TreeDeciduous, ArrowLeft, Factory, Bike, Car, Trash2, Fish, Check, X, Gamepad2, Loader2, Star, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ContentPlayer } from '../components/ContentPlayer';

type GameState = 'map' | 'playing_memory' | 'playing_air' | 'playing_water' | 'won' | 'browse';

interface Content {
  id: string;
  title: string;
  contentType: string;
  grade: string;
  url: string;
  iframeCode?: string;
  description?: string;
}

const ECO_ICONS = [
  { icon: <Leaf size={32} />, name: 'Barg' },
  { icon: <Droplets size={32} />, name: 'Suv' },
  { icon: <Sun size={32} />, name: 'Quyosh' },
  { icon: <Wind size={32} />, name: 'Shamol' },
  { icon: <Recycle size={32} />, name: 'Qayta ishlash' },
  { icon: <TreeDeciduous size={32} />, name: 'Daraxt' },
];

const AIR_ITEMS = [
  { id: 1, name: 'Zavod tutuni', type: 'bad', icon: <Factory size={80} /> },
  { id: 2, name: 'Velosiped', type: 'good', icon: <Bike size={80} /> },
  { id: 3, name: 'Avtomobil gazi', type: 'bad', icon: <Car size={80} /> },
  { id: 4, name: 'Daraxt ekish', type: 'good', icon: <TreeDeciduous size={80} /> },
  { id: 5, name: 'Quyosh paneli', type: 'good', icon: <Sun size={80} /> },
  { id: 6, name: 'Plastik yoqish', type: 'bad', icon: <Trash2 size={80} /> },
];

export function Games() {
  const [view, setView] = useState<GameState>('browse');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [gradeGames, setGradeGames] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<'memory' | 'air' | 'water'>('memory');

  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [airItems, setAirItems] = useState(AIR_ITEMS);
  const [currentAirIndex, setCurrentAirIndex] = useState(0);
  const [airScore, setAirScore] = useState(0);
  const [waterItems, setWaterItems] = useState<any[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((timer) => timer + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (selectedGrade) {
      setLoading(true);
      const q = query(
        collection(db, 'contents'),
        where('contentType', '==', 'game'),
        where('grade', '==', selectedGrade),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
        setGradeGames(data);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching games:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [selectedGrade]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const initMemoryGame = () => {
    const shuffledCards = [...ECO_ICONS, ...ECO_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        ...item,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setTimer(0);
    setIsActive(true);
    setLastPlayed('memory');
    setView('playing_memory');
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;
    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      if (newCards[firstId].name === newCards[secondId].name) {
        setTimeout(() => {
          setCards(prevCards => {
            const matchedCards = [...prevCards];
            matchedCards[firstId].isMatched = true;
            matchedCards[secondId].isMatched = true;
            if (matchedCards.every(c => c.isMatched)) {
              setIsActive(false);
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00E676', '#2979FF', '#FFEA00', '#FF1744'] });
              setView('won');
            }
            return matchedCards;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prevCards => {
            const resetCards = [...prevCards];
            resetCards[firstId].isFlipped = false;
            resetCards[secondId].isFlipped = false;
            return resetCards;
          });
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const initAirGame = () => {
    setAirItems([...AIR_ITEMS].sort(() => Math.random() - 0.5));
    setCurrentAirIndex(0);
    setAirScore(0);
    setMoves(0);
    setTimer(0);
    setIsActive(true);
    setLastPlayed('air');
    setView('playing_air');
  };

  const handleAirChoice = (choice: 'good' | 'bad') => {
    const currentItem = airItems[currentAirIndex];
    if (currentItem.type === choice) setAirScore(s => s + 1);
    setMoves(m => m + 1);
    if (currentAirIndex + 1 < airItems.length) setCurrentAirIndex(i => i + 1);
    else {
      setIsActive(false);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00E676', '#2979FF', '#FFEA00', '#FF1744'] });
      setView('won');
    }
  };

  const initWaterGame = () => {
    const items = [];
    for(let i=0; i<10; i++) items.push({ id: `trash-${i}`, type: 'trash', x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, isCleaned: false });
    for(let i=0; i<5; i++) items.push({ id: `fish-${i}`, type: 'fish', x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, isCleaned: false });
    setWaterItems(items);
    setMoves(0);
    setTimer(0);
    setIsActive(true);
    setLastPlayed('water');
    setView('playing_water');
  };

  const handleWaterClick = (id: string, type: string) => {
    if (type === 'trash') {
      const newItems = waterItems.map(item => item.id === id ? { ...item, isCleaned: true } : item);
      setWaterItems(newItems);
      setMoves(m => m + 1);
      if (newItems.filter(i => i.type === 'trash' && !i.isCleaned).length === 0) {
        setIsActive(false);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00E676', '#2979FF', '#FFEA00', '#FF1744'] });
        setView('won');
      }
    } else {
      setMoves(m => m + 1);
      setTimer(t => t + 5);
    }
  };

  const restartCurrentGame = () => {
    if (lastPlayed === 'memory') initMemoryGame();
    if (lastPlayed === 'air') initAirGame();
    if (lastPlayed === 'water') initWaterGame();
  };

  return (
    <div className="container py-12 min-h-[70vh]">
      <AnimatePresence mode="wait">
        {view === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-4">O'yinlar Oroli</h1>
                <p className="text-xl font-bold opacity-70">O'zingizga mos sinfni tanlang va qiziqarli o'yinlarni boshlang!</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('map')}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Star size={20} /> Maxsus Missiyalar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {['1', '2', '3', '4'].map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`card p-8 text-center border-4 border-border transition-all flex flex-col items-center gap-4 ${selectedGrade === grade ? 'bg-primary shadow-none translate-x-1 translate-y-1' : 'bg-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-highlight hover:-translate-y-1'}`}
                >
                  <div className="w-16 h-16 bg-bg border-4 border-border rounded-xl flex items-center justify-center text-4xl font-black">
                    {grade}
                  </div>
                  <span className="text-2xl font-black uppercase">{grade}-sinf</span>
                </button>
              ))}
            </div>

            {selectedGrade && (
              <div className="space-y-8">
                <h2 className="text-4xl font-serif font-black uppercase border-b-8 border-border pb-4">{selectedGrade}-sinf O'yinlari</h2>
                
                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin" size={64} />
                  </div>
                ) : gradeGames.length === 0 ? (
                  <div className="card bg-surface border-4 border-dashed border-border py-20 text-center">
                    <Gamepad2 size={64} className="mx-auto mb-6 opacity-20" />
                    <h3 className="text-2xl font-black opacity-50 uppercase">Hozircha o'yinlar yo'q</h3>
                    <p className="font-bold opacity-40 mt-2 text-xl">Tez orada yangi sarguzashtlar qo'shiladi!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gradeGames.map(game => (
                      <motion.div
                        key={game.id}
                        whileHover={{ y: -8 }}
                        className="card bg-surface p-0 overflow-hidden border-4 border-border flex flex-col"
                      >
                        <div className="aspect-video bg-bg border-b-4 border-border relative overflow-hidden group cursor-pointer" onClick={() => setSelectedContent(game)}>
                          <img 
                            src={`https://picsum.photos/seed/${game.id}/800/450`} 
                            alt={game.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-4 bg-primary border-4 border-border rounded-full shadow-sm group-hover:scale-110 transition-transform">
                              <Play size={32} />
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex-grow flex flex-col">
                          <h4 className="text-2xl font-serif font-black mb-2 uppercase">{game.title}</h4>
                          <p className="text-sm font-bold opacity-70 mb-6 line-clamp-2">{game.description || "Ushbu interaktiv o'yin orqali bilimingizni mustahkamlang!"}</p>
                          <button 
                            onClick={() => setSelectedContent(game)}
                            className="btn btn-primary w-full mt-auto flex items-center justify-center gap-2"
                          >
                            O'ynash <ChevronRight size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {view === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setView('browse')}
                className="w-12 h-12 bg-surface border-4 border-border flex items-center justify-center hover:bg-primary transition-all shadow-sm"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-4xl font-serif font-black uppercase">Maxsus Missiyalar</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card bg-surface p-8 cursor-pointer hover:-translate-y-2 transition-all border-4 border-border" onClick={initMemoryGame}>
                <Recycle size={64} className="mx-auto mb-6 text-primary" />
                <h3 className="text-2xl font-serif font-black mb-3 italic">Xotira Mashqi</h3>
                <p className="font-bold opacity-70 mb-6">Belgilarni juftini toping.</p>
                <button className="btn btn-primary w-full">Boshlash</button>
              </div>
              <div className="card bg-surface p-8 cursor-pointer hover:-translate-y-2 transition-all border-4 border-border" onClick={initAirGame}>
                <Wind size={64} className="mx-auto mb-6 text-highlight" />
                <h3 className="text-2xl font-serif font-black mb-3 italic">Havo Tozaligi</h3>
                <p className="font-bold opacity-70 mb-6">Atmosferani asrang.</p>
                <button className="btn btn-primary w-full">Boshlash</button>
              </div>
              <div className="card bg-surface p-8 cursor-pointer hover:-translate-y-2 transition-all border-4 border-border" onClick={initWaterGame}>
                <Droplets size={64} className="mx-auto mb-6 text-accent" />
                <h3 className="text-2xl font-serif font-black mb-3 italic">Suv Hayoti</h3>
                <p className="font-bold opacity-70 mb-6">Daryolarni tozalang.</p>
                <button className="btn btn-primary w-full">Boshlash</button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'playing_memory' && (
          <motion.div key="playing_memory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl mx-auto">
            <div className="card bg-surface p-8 border-4 border-border">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-highlight p-6 border-4 border-border">
                <button onClick={() => setView('map')} className="btn bg-surface p-3 border-4 border-border"><ArrowLeft /></button>
                <div className="flex gap-8 items-center">
                  <div className="flex items-center gap-3 text-4xl font-black"><Timer className="text-accent" /> {formatTime(timer)}</div>
                  <div className="text-xl font-bold uppercase">Yurishlar: {moves}</div>
                </div>
                <button onClick={initMemoryGame} className="btn bg-surface p-3 border-4 border-border"><RotateCcw /></button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-2xl mx-auto">
                {cards.map((card) => (
                  <div key={card.id} onClick={() => handleCardClick(card.id)} className="aspect-square relative cursor-pointer perspective-1000">
                    <motion.div animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }} className="w-full h-full relative transform-style-3d transition-transform duration-500">
                      <div className="absolute inset-0 backface-hidden bg-bg border-4 border-border flex items-center justify-center text-4xl font-black">?</div>
                      <div className={`absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center border-4 border-border ${card.isMatched ? 'bg-success/50' : 'bg-surface'}`}>
                        {card.icon}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'playing_air' && (
          <motion.div key="playing_air" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
             <div className="card bg-surface p-12 text-center border-4 border-border">
                <div className="flex justify-between mb-12">
                   <button onClick={() => setView('map')} className="btn bg-bg p-3 border-4 border-border"><ArrowLeft /></button>
                   <div className="text-3xl font-black uppercase">Havo: {currentAirIndex + 1}/{airItems.length}</div>
                   <button onClick={initAirGame} className="btn bg-bg p-3 border-4 border-border"><RotateCcw /></button>
                </div>
                <div className="bg-bg border-8 border-border p-16 mb-12 inline-block">
                   {airItems[currentAirIndex].icon}
                   <h3 className="text-4xl font-serif font-black mt-6 uppercase italic">{airItems[currentAirIndex].name}</h3>
                </div>
                <div className="flex gap-12 justify-center">
                   <button onClick={() => handleAirChoice('bad')} className="btn bg-error text-surface border-4 border-border p-8 px-16 text-3xl font-serif">ZARARLI</button>
                   <button onClick={() => handleAirChoice('good')} className="btn bg-success text-text border-4 border-border p-8 px-16 text-3xl font-serif">FOYDALI</button>
                </div>
             </div>
          </motion.div>
        )}

        {view === 'playing_water' && (
          <motion.div key="playing_water" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
             <div className="card bg-surface p-12 border-4 border-border">
                <div className="flex justify-between mb-12">
                   <button onClick={() => setView('map')} className="btn bg-bg p-3 border-4 border-border"><ArrowLeft /></button>
                   <div className="text-3xl font-black uppercase">Qoldi: {waterItems.filter(i => i.type === 'trash' && !i.isCleaned).length}</div>
                   <button onClick={initWaterGame} className="btn bg-bg p-3 border-4 border-border"><RotateCcw /></button>
                </div>
                <div className="relative w-full h-[500px] bg-accent border-8 border-border overflow-hidden">
                   {waterItems.map(item => !item.isCleaned && (
                      <motion.div
                        key={item.id}
                        onClick={() => handleWaterClick(item.id, item.type)}
                        className={`absolute cursor-pointer p-4 border-4 border-border flex items-center justify-center rounded-full ${item.type === 'trash' ? 'bg-surface text-error' : 'bg-highlight'}`}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      >
                         {item.type === 'trash' ? <Trash2 size={32} /> : <Fish size={32} />}
                      </motion.div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {view === 'won' && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 px-4">
            <div className="card max-w-lg mx-auto p-12 bg-surface border-8 border-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Trophy size={100} className="mx-auto mb-8 text-highlight" />
              <h2 className="text-6xl font-serif font-black uppercase mb-8">G'alaba!</h2>
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="bg-bg p-6 border-4 border-border">
                  <div className="text-xs uppercase font-black mb-2">Vaqt</div>
                  <div className="text-4xl font-bold font-mono">{formatTime(timer)}</div>
                </div>
                <div className="bg-bg p-6 border-4 border-border">
                   <div className="text-xs uppercase font-black mb-2">{lastPlayed === 'air' ? 'Natija' : 'Yurishlar'}</div>
                   <div className="text-4xl font-bold font-mono">{lastPlayed === 'air' ? `${airScore}/${airItems.length}` : moves}</div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={restartCurrentGame} className="btn btn-primary flex-grow text-2xl py-6 flex items-center justify-center gap-2"><RotateCcw /> Qayta</button>
                 <button onClick={() => setView('browse')} className="btn btn-secondary flex-grow text-2xl py-6">Tugatish</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContent && (
          <ContentPlayer 
            content={selectedContent as any} 
            onClose={() => setSelectedContent(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
