import { Activity, CheckCircle, Loader2, User, Mail, Lock, LogOut, Award, BookOpen, Target, AlertCircle, History, TrendingUp, Key, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface TestResult {
  id: string;
  score: number;
  total: number;
  testType: string;
  createdAt: any;
}

export function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState({ 
    totalTests: 0, 
    avgScore: 0, 
    totalXP: 0, 
    level: 1,
    nextLevelXP: 100,
    progress: 0
  });

  const getLevelInfo = (xp: number) => {
    if (xp >= 3000) return { level: 5, min: 3000, max: 10000 };
    if (xp >= 1500) return { level: 4, min: 1500, max: 3000 };
    if (xp >= 500) return { level: 3, min: 500, max: 1500 };
    if (xp >= 100) return { level: 2, min: 100, max: 500 };
    return { level: 1, min: 0, max: 100 };
  };
  
  // Email/Password states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
      setIsLoading(false);
      if (currentUser) {
        fetchUserResults(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserResults = async (userId: string) => {
    const path = 'results';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult));
      setResults(data);

      // Calculate stats
      if (data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, curr) => acc + (curr.score / curr.total), 0);
        const totalXP = data.reduce((acc, curr) => acc + (curr.score * 10), 0);
        
        // Simple level logic
        const levelInfo = getLevelInfo(totalXP);
        const progress = Math.min(100, Math.max(0, ((totalXP - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100));

        setStats({
          totalTests: total,
          avgScore: Math.round((sum / total) * 100),
          totalXP,
          level: levelInfo.level,
          nextLevelXP: levelInfo.max,
          progress
        });
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      // handleFirestoreError(err, OperationType.LIST, path);
    }
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Step 1: Try to sign in first
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        // Step 2: If user not found, try to register them
        if (loginError.code === 'auth/user-not-found') {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          // Set a default display name from email
          const defaultName = email.split('@')[0];
          await updateProfile(userCredential.user, { displayName: defaultName });
        } else {
          // If it's another error (like wrong password), throw it to the outer catch
          throw loginError;
        }
      }
    } catch (error: any) {
      console.error("Auth failed", error);
      if (error.code === 'auth/wrong-password') {
        setErrorMsg("Parol noto'g'ri. Iltimos, qayta urinib ko'ring.");
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg("Email manzili noto'g'ri shaklda.");
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg("Parol juda kuchsiz. Kamida 6 ta belgi bo'lishi kerak.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg(
          "Ushbu domen Firebase'da ruxsat etilmagan. \n\n" + 
          "Yechim: Firebase Console -> Authentication -> Settings -> Authorized domains bo'limiga 'edu-platform-children.vercel.app' manzilini qo'shing."
        );
      } else {
        setErrorMsg(error.message);
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const provider = new GoogleAuthProvider();
    // Force account selection to prevent auto-closing if there's a stuck session
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg("Oyna yopildi. Iltimos, hisobingizni tanlang va jarayonni oxiriga yetkazing.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg("Ushbu domen Firebase'da ruxsat etilmagan. Iltimos, administratorga murojaat qiling.");
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMsg("Internetga ulanishda xatolik. Tarmoqni tekshiring.");
      } else {
        setErrorMsg(`Xatolik: ${error.message}`);
      }
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (isLoading && !errorMsg) {
    return <div className="container flex justify-center items-center min-h-[80vh]"><Loader2 className="animate-spin" size={48} /></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="container flex justify-center items-center min-h-[80vh] py-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-10 bg-surface relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary border-b-4 border-border"></div>
          
          <div className="text-center mb-10 mt-4">
            <h2 className="text-4xl mb-4 font-serif text-text uppercase font-black">
              Kirish
            </h2>
            <p className="text-text font-bold text-lg leading-relaxed bg-highlight border-4 border-border p-4 shadow-sm">
              Profilingizga kiring yoki yangi hisob yarating.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-error text-surface p-4 border-4 border-border mb-6 font-bold flex items-start gap-3 whitespace-pre-wrap">
              <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="font-black uppercase text-xs tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={20} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full pl-12" 
                  placeholder="example@mail.com" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-black uppercase text-xs tracking-widest">Parol</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={20} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pl-12" 
                  placeholder="••••••••" 
                />
              </div>
              <p className="text-[10px] uppercase font-black opacity-50 mt-1">Yangi foydalanuvchilar uchun ham shu formadan foydalaniladi.</p>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-xl flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" size={28} /> : (
                <>
                  <Key size={24} />
                  KIRISH
                </>
              )}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-4 border-border"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-black"><span className="bg-surface px-4">Yoki</span></div>
          </div>
          
          <button 
            onClick={handleGoogleLogin} 
            className="btn bg-bg border-4 border-border w-full py-4 text-xl flex items-center justify-center gap-3 hover:bg-highlight"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={28} /> : (
              <>
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Google orqali kirish
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-8 mb-16 bg-surface p-8 border-4 border-border shadow-md"
        >
          <div className="relative">
            <div className="w-32 h-32 rounded-none bg-primary border-4 border-border text-text flex items-center justify-center text-6xl font-serif shadow-sm overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-accent border-4 border-border flex items-center justify-center text-text shadow-sm">
              <Award size={24} />
            </div>
          </div>
          <div className="text-center md:text-left flex-grow ml-4">
            <h1 className="text-5xl md:text-6xl mb-2 font-serif text-text uppercase">{user?.displayName || 'Foydalanuvchi'}</h1>
            <p className="text-text font-bold text-xl bg-highlight inline-block px-4 py-2 border-4 border-border shadow-sm mt-2">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary flex items-center gap-2 px-6 py-4 text-lg bg-error text-surface hover:bg-error/90"
          >
            <LogOut size={24} /> Chiqish
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card bg-surface flex items-center gap-6 p-8"
          >
            <div className="w-20 h-20 bg-success border-4 border-border text-text rounded-none flex items-center justify-center shadow-sm">
              <Target size={40} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-text mb-2">Jami Testlar</p>
              <h3 className="text-4xl font-serif text-text">{stats.totalTests} ta</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card bg-surface flex items-center gap-6 p-8"
          >
            <div className="w-20 h-20 bg-accent border-4 border-border text-text rounded-none flex items-center justify-center shadow-sm">
              <TrendingUp size={40} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-text mb-2">O'rtacha Natija</p>
              <h3 className="text-4xl font-serif text-text">{stats.avgScore}%</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="card bg-surface flex flex-col gap-4 p-8 min-w-[280px]"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary border-4 border-border text-text rounded-none flex items-center justify-center shadow-sm">
                < Award size={40} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-text mb-1">Daraja (Level)</p>
                <h3 className="text-4xl font-serif text-text">{stats.level} - daraja</h3>
                <p className="text-xs font-bold uppercase opacity-60">{stats.totalXP} / {stats.nextLevelXP} XP</p>
              </div>
            </div>
            <div className="w-full h-4 bg-bg border-4 border-border mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="h-full bg-accent"
              />
            </div>
          </motion.div>
        </div>

        {/* Recent Activity & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-serif text-text flex items-center gap-4 uppercase border-b-4 border-border pb-4">
              <History className="text-accent" size={40} /> Oxirgi Natijalar
            </h2>
            <div className="space-y-6">
              {results.length === 0 ? (
                <div className="p-8 bg-surface border-4 border-dashed border-border text-center font-bold opacity-50">
                  Hozircha natijalar yo'q.
                </div>
              ) : (
                results.map((res) => (
                  <div key={res.id} className="flex items-center gap-6 p-6 bg-surface border-4 border-border shadow-sm hover:-translate-y-1 transition-transform">
                    <div className={`w-16 h-16 ${res.score / res.total >= 0.8 ? 'bg-success' : 'bg-error'} border-4 border-border rounded-none flex items-center justify-center shadow-sm`}>
                      <Award className="text-text" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-xl text-text mb-1">{res.testType}</h4>
                      <p className="text-sm font-bold text-text uppercase tracking-wider">
                        {res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString() : 'Yaqinda'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-4 py-2 bg-highlight border-4 border-border shadow-sm text-sm font-black text-text uppercase">
                        {res.score} / {res.total}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-serif text-text flex items-center gap-4 uppercase border-b-4 border-border pb-4">
              <Target className="text-accent" size={40} /> Kelgusi Maqsadlar
            </h2>
            <div className="card p-10 bg-primary text-text relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-text text-sm font-black uppercase tracking-widest mb-6 bg-surface inline-block px-4 py-2 border-4 border-border shadow-sm">Haftalik Progress</p>
                <div className="flex items-end gap-2 mb-8 bg-surface p-6 border-4 border-border shadow-sm w-fit">
                  <span className="text-7xl font-serif font-black">85</span>
                  <span className="text-4xl font-black mb-2">%</span>
                </div>
                <div className="h-8 bg-surface border-4 border-border rounded-none overflow-hidden mb-10 shadow-sm">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-accent border-r-4 border-border"
                  />
                </div>
                <ul className="space-y-6">
                  <li className="flex items-center gap-4 text-lg font-bold bg-surface p-4 border-4 border-border shadow-sm">
                    <div className="w-8 h-8 bg-success border-4 border-border flex items-center justify-center text-text shadow-sm">✓</div>
                    Metodika bo'limini yakunlash
                  </li>
                  <li className="flex items-center gap-4 text-lg font-bold bg-surface p-4 border-4 border-border shadow-sm">
                    <div className="w-8 h-8 bg-highlight border-4 border-border flex items-center justify-center text-text shadow-sm">2</div>
                    Yangi o'yinlarni sinab ko'rish
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
