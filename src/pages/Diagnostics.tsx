import { Activity, CheckCircle, XCircle, Trophy, Star, Loader2, Users, ArrowLeft, BrainCircuit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

interface LeaderboardEntry {
  id: string;
  userName: string;
  score: number;
  total: number;
  grade: string;
}

interface TestData {
  id: string;
  title: string;
  grade: string;
  data: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

export function Diagnostics() {
  const [view, setView] = useState<'grade-select' | 'test-list' | 'playing' | 'results'>('grade-select');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [availableTests, setAvailableTests] = useState<TestData[]>([]);
  const [currentTest, setCurrentTest] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    let q = query(collection(db, 'results'), orderBy('score', 'desc'), limit(10));
    if (selectedGrade) {
      q = query(collection(db, 'results'), where('grade', '==', selectedGrade), orderBy('score', 'desc'), limit(10));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
      setLeaderboard(data);
    }, (err) => {
      console.error("Error fetching leaderboard:", err);
    });

    return () => unsubscribe();
  }, [selectedGrade]);

  const fetchTests = (grade: string) => {
    setLoading(true);
    setSelectedGrade(grade);
    
    const q = query(
      collection(db, 'contents'),
      where('contentType', '==', 'test'),
      where('grade', '==', grade)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAvailableTests(data);
      setLoading(false);
      setView('test-list');
    }, (err) => {
      console.error("Error fetching tests:", err);
      setLoading(false);
    });

    return unsubscribe;
  };

  const startTest = (test: TestData) => {
    setCurrentTest(test);
    setAnswers({});
    setView('playing');
  };

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const calculateScore = () => {
    if (!currentTest) return 0;
    let score = 0;
    currentTest.data.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const finishTest = async () => {
    if (!currentTest) return;
    
    setView('results');
    
    if (auth.currentUser) {
      setIsSaving(true);
      try {
        await addDoc(collection(db, 'results'), {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'O\'quvchi',
          score: calculateScore(),
          total: currentTest.data.questions.length,
          testType: currentTest.title,
          grade: currentTest.grade,
          createdAt: serverTimestamp()
        });
        addToast("Natijangiz saqlandi!", "success");
      } catch (err) {
        console.error("Error saving result:", err);
        addToast("Natijani saqlashda xatolik yuz berdi", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="container py-12">
      <AnimatePresence mode="wait">
        {view === 'grade-select' && (
          <motion.div
            key="grade-select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-error border-4 border-border text-text rounded-xl flex items-center justify-center mb-8 shadow-sm mx-auto">
                <Activity size={40} />
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-4">O'yinli Testlar</h1>
              <p className="text-xl font-bold opacity-70">Bilimingizni sinab ko'rish uchun sinfingizni tanlang!</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {['1', '2', '3', '4'].map(grade => (
                <button
                  key={grade}
                  onClick={() => fetchTests(grade)}
                  disabled={loading}
                  className="card p-8 bg-surface border-4 border-border hover:bg-highlight hover:-translate-y-1 transition-all flex flex-col items-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                   {loading && selectedGrade === grade ? (
                     <Loader2 className="animate-spin" size={48} />
                   ) : (
                     <>
                        <div className={`w-16 h-16 border-4 border-border flex items-center justify-center text-4xl font-black ${grade === '1' ? 'bg-success' : grade === '2' ? 'bg-accent' : grade === '3' ? 'bg-primary' : 'bg-highlight'}`}>
                          {grade}
                        </div>
                        <span className="text-2xl font-black">{grade}-sinf</span>
                     </>
                   )}
                </button>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="card bg-surface p-8 border-4 border-border max-w-2xl mx-auto">
               <h3 className="text-3xl font-serif font-black uppercase mb-8 border-b-8 border-border pb-4 flex items-center gap-4">
                 <Users size={32} /> Umumiy Reyting
               </h3>
               <div className="space-y-4">
                 {leaderboard.length === 0 ? (
                   <p className="text-xl font-bold opacity-40 text-center py-8">Hali natijalar yo'q. Birinchi bo'ling!</p>
                 ) : (
                   leaderboard.map((entry, idx) => (
                     <div key={entry.id} className="flex items-center justify-between p-4 border-4 border-border bg-bg hover:bg-highlight transition-all">
                        <div className="flex items-center gap-4">
                           <span className={`w-10 h-10 flex items-center justify-center border-2 border-border font-black text-lg ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-accent' : idx === 2 ? 'bg-success' : 'bg-surface'}`}>
                             {idx + 1}
                           </span>
                           <span className="font-bold text-xl">{entry.userName}</span>
                           <span className="badge bg-highlight text-xs">{entry.grade}-sinf</span>
                        </div>
                        <div className="text-2xl font-black">{entry.score}/{entry.total}</div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {view === 'test-list' && (
          <motion.div
            key="test-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-12">
              <button 
                onClick={() => setView('grade-select')}
                className="w-16 h-16 bg-surface border-4 border-border flex items-center justify-center hover:bg-primary transition-all shadow-sm"
              >
                <ArrowLeft size={32} />
              </button>
              <h2 className="text-5xl font-serif font-black uppercase">{selectedGrade}-sinf Testlari</h2>
            </div>

            {availableTests.length === 0 ? (
              <div className="card bg-surface border-4 border-dashed border-border py-32 text-center">
                 <BrainCircuit size={80} className="mx-auto mb-8 opacity-20" />
                 <h3 className="text-3xl font-black opacity-50 uppercase">Hozircha testlar yo'q</h3>
                 <p className="text-xl font-bold opacity-40 mt-2">Tez orada yangi qiziqarli testlar qo'shiladi!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {availableTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => startTest(test)}
                    className="card p-10 bg-surface border-4 border-border flex flex-col items-center gap-6 hover:-translate-y-2 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-1 translate-y-1"
                  >
                    <div className="p-6 bg-highlight border-4 border-border rounded-xl">
                      <Star size={48} className="text-text" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-3xl font-serif font-black mb-4 uppercase">{test.title}</h4>
                      <p className="font-bold opacity-70">{test.data.questions.length} ta savol</p>
                    </div>
                    <div className="btn btn-primary w-full py-4 text-xl">Boshlash</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'playing' && currentTest && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="card bg-surface p-10 border-4 border-border">
              <div className="flex justify-between items-center mb-12 border-b-8 border-border pb-8">
                 <h3 className="text-3xl font-serif font-black uppercase text-text">{currentTest.title}</h3>
                 <div className="badge bg-highlight text-2xl font-black px-6 py-2">
                   {Object.keys(answers).length} / {currentTest.data.questions.length}
                 </div>
              </div>

              <div className="space-y-16">
                 {currentTest.data.questions.map((q, idx) => (
                   <div key={idx} className="space-y-8">
                      <p className="text-3xl font-serif font-black flex gap-4">
                        <span className="opacity-30">{idx + 1}.</span> {q.question}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {q.options.map((opt, optIdx) => (
                           <button
                             key={optIdx}
                             onClick={() => handleSelect(idx, optIdx)}
                             className={`p-6 border-4 border-border font-black text-xl text-left transition-all ${answers[idx] === optIdx ? 'bg-primary shadow-none translate-x-1 translate-y-1' : 'bg-bg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-highlight'}`}
                           >
                             <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border-4 border-border flex items-center justify-center text-sm ${answers[idx] === optIdx ? 'bg-surface' : 'bg-transparent'}`}>
                                  {answers[idx] === optIdx && <div className="w-2 h-2 bg-text rounded-full" />}
                                </div>
                                {opt}
                             </div>
                           </button>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>

              <button
                onClick={finishTest}
                disabled={Object.keys(answers).length < currentTest.data.questions.length}
                className="btn btn-primary w-full mt-16 py-6 text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
              >
                TESTNI YAKUNLASH
              </button>
            </div>
          </motion.div>
        )}

        {view === 'results' && currentTest && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="card bg-surface border-8 border-border p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
               <Trophy size={200} className="mx-auto mb-12 text-highlight relative z-10" />
               <div className="relative z-10">
                  <h2 className="text-6xl font-serif font-black uppercase mb-8">Natijangiz</h2>
                  <div className="inline-block p-12 bg-bg border-4 border-border mb-8">
                     <div className="text-7xl font-black">{calculateScore()} / {currentTest.data.questions.length}</div>
                  </div>
                  <p className="text-2xl font-bold opacity-70 mb-12">
                    {calculateScore() === currentTest.data.questions.length 
                      ? "AJOYIB! SIZ HAQIQIY BILIMDONSIZ!" 
                      : calculateScore() >= currentTest.data.questions.length / 2
                      ? "YAXSHI! YANADA YAXSHIROQ BO'LISHI MUMKIN."
                      : "HARAKAT QILING! BUNDAN HAM YAXSHI NATIJA KUTAMIZ."}
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setView('grade-select')}
                      className="btn btn-secondary flex-grow py-6 text-2xl"
                    >
                      BOSH SAHIFA
                    </button>
                    <button 
                      onClick={() => startTest(currentTest)}
                      className="btn btn-primary flex-grow py-6 text-2xl"
                    >
                      QAYTA TOPSHIRISH
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
