import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, CheckCircle, XCircle, Trophy, Star, ChevronRight, ChevronLeft, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface ContentPlayerProps {
  content: {
    id: string;
    title: string;
    contentType: string;
    url: string;
    iframeCode?: string;
    videoUrl?: string;
    grade: string;
    description?: string;
  };
  onClose: () => void;
}

const QUIZ_DATA = [
  { q: "O'simliklar nima yordamida nafas oladi?", a: ["Barglar", "Ildizlar", "Gullar"], c: 0 },
  { q: "Sutemizuvchi hayvonni toping.", a: ["Baliq", "Fil", "Ilon"], c: 1 },
  { q: "Inson tanasidagi eng katta a'zo qaysi?", a: ["Yurak", "Jigar", "Teri"], c: 2 },
  { q: "Qaysi hayvon qishda uyquga ketadi?", a: ["Bo'ri", "Ayiq", "Tulki"], c: 1 },
  { q: "O'simliklarning yashil rangi nima bilan bog'liq?", a: ["Xlorofill", "Suv", "Quyosh"], c: 0 },
  { q: "Suvning kimyoviy formulasi qanday?", a: ["CO2", "H2O", "O2"], c: 1 },
  { q: "Yerning tortish kuchi nima deyiladi?", a: ["Inersiya", "Gravitatsiya", "Tezlik"], c: 1 },
];

export function ContentPlayer({ content, onClose }: ContentPlayerProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  useEffect(() => {
    const shuffled = [...QUIZ_DATA].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuizQuestions(shuffled);
  }, []);

  const isExternalGame = content.contentType === 'game' && content.url && content.url !== 'built-in' && content.url.startsWith('http');

  useEffect(() => {
    if (gameState === 'result' && score === quizQuestions.length && quizQuestions.length > 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F1C']
      });
    }
  }, [gameState, score, quizQuestions.length]);

  const handleStart = () => {
    if (isExternalGame) {
      window.open(content.url, '_blank', 'noopener,noreferrer');
      // maybe stay open or close? onClose() might be better so they don't see the empty player
      onClose();
    } else {
      setGameState('playing');
    }
  };

  const handleAnswer = async (index: number) => {
    if (isAnswering) return;
    
    setIsAnswering(true);
    setSelectedOption(index);
    
    const isCorrect = index === quizQuestions[currentQuestion].c;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Delay to show feedback
    setTimeout(async () => {
      setSelectedOption(null);
      setIsAnswering(false);
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        await saveResult(score + (isCorrect ? 1 : 0));
        setGameState('result');
      }
    }, 1000);
  };

  const saveResult = async (finalScore: number) => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'results'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'O\'quvchi',
        score: finalScore,
        total: quizQuestions.length,
        testType: content.title,
        grade: content.grade,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving result:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-text/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
    >
      <div className="bg-surface border-8 border-border w-full max-w-5xl h-full max-h-[800px] relative flex flex-col overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="p-6 border-b-8 border-border flex justify-between items-center bg-highlight">
          <div>
            <span className="badge mb-2">{content.contentType.toUpperCase()}</span>
            <h2 className="text-3xl font-serif font-black uppercase">{content.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-error border-4 border-border hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-8 flex flex-col items-center justify-center bg-bg/50">
          {(content.contentType === 'video' || content.contentType === 'tajriba' || content.iframeCode || content.videoUrl) ? (
            <div className="w-full aspect-video border-8 border-border shadow-lg overflow-hidden bg-text flex items-center justify-center">
              {content.videoUrl ? (
                <video 
                  src={content.videoUrl} 
                  controls 
                  className="w-full h-full"
                  autoPlay
                >
                  Sizning brauzeringiz video qo'llab-quvvatlamaydi.
                </video>
              ) : content.iframeCode ? (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: content.iframeCode }} 
                />
              ) : (
                <iframe 
                  src={content.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                  className="w-full h-full"
                  title={content.title}
                  allowFullScreen
                ></iframe>
              )}
            </div>
          ) : content.contentType === 'audio' ? (
            <div className="text-center space-y-8">
              <div className="w-48 h-48 bg-primary border-8 border-border mx-auto flex items-center justify-center rounded-full animate-pulse">
                <Play size={80} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase">Audio Darslik</h3>
                <p className="text-xl font-bold opacity-70">Darsni tinglashni boshlang...</p>
              </div>
              <div className="w-full max-w-md mx-auto h-4 bg-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  className="h-full bg-accent"
                ></motion.div>
              </div>
            </div>
          ) : content.contentType === 'test' || content.contentType === 'game' ? (
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {gameState === 'intro' && (
                  <motion.div 
                    key="intro"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="text-center space-y-8"
                  >
                    <div className="p-12 bg-accent border-8 border-border shadow-sm">
                      <Trophy size={120} className="mx-auto mb-6" />
                      <h3 className="text-5xl font-serif font-black uppercase mb-4">
                        {isExternalGame ? "O'yinni Boshlash" : "Tayyormisiz?"}
                      </h3>
                      <p className="text-xl font-bold">
                        {isExternalGame 
                          ? "Ushbu loyiha tashqi saytda joylashgan. Boshlash tugmasini bossangiz, o'yin yangi oynada ochiladi." 
                          : "Bilimingizni sinab ko'rish vaqti keldi!"}
                      </p>
                    </div>
                    <button 
                      onClick={handleStart}
                      className="btn btn-primary text-3xl px-12 py-6 w-full flex items-center justify-center gap-4"
                    >
                      {isExternalGame ? <ExternalLink size={32} /> : null}
                      {isExternalGame ? "O'yinga O'tish" : "Boshlash!"}
                    </button>
                  </motion.div>
                )}

                {gameState === 'playing' && (
                  <motion.div 
                    key="playing"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-8"
                  >
                    <div className="flex justify-between items-center font-black uppercase tracking-widest">
                      <span>Savol {currentQuestion + 1} / {quizQuestions.length}</span>
                      <span>Ball: {score}</span>
                    </div>
                    <div className="w-full h-4 bg-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="p-10 bg-surface border-8 border-border relative">
                      {isAnswering && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                          {selectedOption === quizQuestions[currentQuestion].c ? (
                            <div className="bg-success border-4 border-border p-4 flex items-center gap-4 shadow-sm animate-bounce">
                              <CheckCircle size={48} />
                              <span className="text-2xl font-black uppercase">To'g'ri!</span>
                            </div>
                          ) : (
                            <div className="bg-error border-4 border-border p-4 flex items-center gap-4 shadow-sm animate-pulse">
                              <XCircle size={48} />
                              <span className="text-2xl font-black uppercase">Xato!</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                      
                      <h3 className={`text-3xl font-bold mb-8 transition-opacity ${isAnswering ? 'opacity-20' : ''}`}>
                        {quizQuestions[currentQuestion]?.q}
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {quizQuestions[currentQuestion]?.a.map((opt, idx) => {
                          const isCorrect = idx === quizQuestions[currentQuestion].c;
                          const isSelected = selectedOption === idx;
                          
                          let buttonClass = "border-border hover:bg-highlight hover:translate-x-2";
                          if (isAnswering) {
                            if (isSelected) {
                              buttonClass = isCorrect ? "bg-success border-border" : "bg-error border-border";
                            } else if (isCorrect) {
                              buttonClass = "bg-success/30 border-border";
                            } else {
                              buttonClass = "opacity-30 border-border cursor-not-allowed";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswer(idx)}
                              disabled={isAnswering}
                              className={`p-6 border-4 text-left font-black text-xl transition-all flex justify-between items-center group ${buttonClass}`}
                            >
                              {opt}
                              {!isAnswering && <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                              {isAnswering && isSelected && isCorrect && <CheckCircle className="text-text" />}
                              {isAnswering && isSelected && !isCorrect && <XCircle className="text-text" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {gameState === 'result' && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8"
                  >
                    <div className="p-12 bg-success border-8 border-border shadow-sm">
                      {saving && (
                        <div className="flex items-center justify-center gap-2 mb-4 text-sm font-bold animate-pulse">
                          <Loader2 className="animate-spin" size={16} /> Natija saqlanmoqda...
                        </div>
                      )}
                      <div className="flex justify-center gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                          <Star key={i} size={48} fill={i <= score ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <h3 className="text-5xl font-serif font-black uppercase mb-4">Natija!</h3>
                      <p className="text-4xl font-black">{score} / {quizQuestions.length}</p>
                      <p className="text-xl font-bold mt-4">
                        {score === quizQuestions.length ? "Ajoyib! Siz haqiqiy bilimdonsiz!" : 
                         score > 0 ? "Yaxshi natija! Yana bir bor urinib ko'ring." : "Xafa bo'lmang, darsni qayta ko'rib chiqing."}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setGameState('intro');
                          setScore(0);
                          setCurrentQuestion(0);
                        }}
                        className="btn btn-secondary flex-grow py-6 text-2xl flex items-center justify-center gap-3"
                      >
                        <RotateCcw /> Qayta urinish
                      </button>
                      <button 
                        onClick={onClose}
                        className="btn btn-primary flex-grow py-6 text-2xl"
                      >
                        Tugatish
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-3xl font-black">Noma'lum kontent turi</h3>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 border-t-8 border-border bg-highlight/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface border-4 border-border flex items-center justify-center font-black">
              {content.grade}
            </div>
            <span className="font-bold uppercase tracking-widest">{content.grade}-sinf</span>
          </div>
          <div className="hidden md:block text-sm font-bold opacity-50">
            Bilim Platformasi © 2024
          </div>
        </div>
      </div>
    </motion.div>
  );
}
