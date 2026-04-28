import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// Lazy initialization or guard for API Key
const getAIClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new (GoogleGenAI as any)(apiKey);
};

const SUGGESTIONS = [
  "Fotosintez nima?",
  "Nega osmon ko'k?",
  "Suvning formulasi qanday?",
  "Eng katta hayvon qaysi?",
  "Inson suyagi haqida ma'lumot",
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ScienceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Salom! Men Tabiiy fanlar bo'yicha yordamchingizman. Sizga qanday yordam bera olaman?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSubmit = messageText || input;
    if (!textToSubmit.trim() || isLoading) return;

    const userMessage = textToSubmit.trim();
    if (!messageText) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getAIClient();
      if (!ai) {
        throw new Error("Gemini API key topilmadi. Iltimos, .env faylini tekshiring.");
      }

      const chatHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await (ai as any).getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction: `Siz "Bilim Platformasi"ning bosh ilmiy xodimi va o'quvchilarning sevimli yordamchisisiz. 
          Vazifangiz: 1-5 sinf o'quvchilariga Tabiiy fanlar (Biologiya, Fizika, Kimyo, Ona tili va Geografiya) bo'yicha yordam berish.
          
          Qoidalar:
          1. O'zbek tilida, bolalar tushunadigan sodda va qiziqarli tilda gapiring.
          2. Markdown orqali muhim tushunchalarni **bold** qiling. Ro'yxatlar va emoji ishlating.
          3. Agar savol fanga oid bo'lmasa (masalan: siyosat, o'yin-kulgi), muloyimlik bilan yo'naltiring.
          4. Neo-brutalist ohang: Ishtiyoqli, intellektual va biroz bold (Neo-brutal) uslubda bo'ling.
          5. Har bir javobingiz oxirida o'quvchini ilhomlantiruvchi qisqa jumlalar ishlating (masalan: "Ilm yo'li - nurli yo'l!").`,
      }).generateContent({
        contents: [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }],
      });

      const result = await response.response;
      const assistantMessage = result.text() || "Kechirasiz, javob topishda xatolik yuz berdi.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Xatolik yuz berdi";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage.includes('key topilmadi') ? errorMessage : "Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Salom! Men Tabiiy fanlar bo'yicha yordamchingizman. Sizga qanday yordam bera olaman?" }]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="w-[350px] md:w-[450px] h-[600px] bg-white flex flex-col mb-4 overflow-hidden shadow-[0_40px_80px_-15px_rgba(45,30,19,0.5)] border-t-[12px] border-tilla rounded-3xl"
          >
            {/* Header */}
            <div className="bg-wood-dark p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3 text-white font-serif font-bold italic text-xl tracking-tight">
                <div className="p-2 bg-tilla rounded-lg">
                  <Bot size={24} className="text-white" />
                </div>
                <span>Bilmaskvoy</span>
              </div>
              <div className="flex items-center gap-4 text-white/50">
                <button 
                  onClick={clearChat}
                  title="Suhbatni tozalash"
                  className="hover:text-tilla transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                <X 
                  size={24} 
                  className="cursor-pointer hover:text-white transition-colors" 
                  onClick={() => setIsOpen(false)} 
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-ivory/30 relative">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] p-5 rounded-2xl font-medium text-lg leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-tilla text-white rounded-tr-none' 
                      : 'bg-white text-wood-dark border border-brick/5 rounded-tl-none'}
                  `}>
                    <Markdown components={{
                      p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="mb-1">{children}</li>,
                    }}>
                      {msg.content}
                    </Markdown>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-brick/5 p-4 rounded-2xl shadow-sm">
                    <Loader2 className="animate-spin text-tilla" size={24} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Overlay for suggestions if empty */}
            {messages.length < 3 && !isLoading && (
              <div className="px-6 py-4 bg-ivory/50 border-t border-brick/5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-wood-dark/40">Savol bering:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-xs bg-white border border-brick/10 py-2 px-4 rounded-full font-bold text-wood-dark hover:border-tilla hover:text-tilla transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-6 border-t border-brick/10 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Xabar yo'llang..."
                  className="flex-grow bg-ivory/50 border-2 border-transparent focus:border-tilla/30 focus:bg-white rounded-xl px-5 py-3 outline-none transition-all text-wood-dark font-medium placeholder:text-wood-dark/30"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="bg-lojuvard text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-wood-dark text-tilla rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center border-4 border-tilla hover:bg-wood-dark/90 transition-all border-double"
      >
        {isOpen ? <X size={40} /> : <div className="relative"><Sparkles size={40} className="animate-pulse" /></div>}
      </motion.button>
    </div>
  );
}
