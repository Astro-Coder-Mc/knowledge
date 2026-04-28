import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-md w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className={`p-4 border-4 border-black flex items-center gap-4 bg-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
                toast.type === 'success' ? 'bg-primary' : toast.type === 'error' ? 'bg-error text-white' : 'bg-accent text-white'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle className="text-black" size={24} />}
                {toast.type === 'error' && <AlertCircle className="text-white" size={24} />}
                {toast.type === 'info' && <Info className="text-white" size={24} />}
              </div>
              <p className="font-black uppercase tracking-tight text-sm flex-grow">
                {toast.message}
              </p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
                aria-label="Yopish"
              >
                <X size={20} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
