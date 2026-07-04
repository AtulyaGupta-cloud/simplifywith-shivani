import { motion } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export default function ErrorScreen({ message, onRetry, onBack }: ErrorScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-400 shadow-lg shadow-red-500/20"
        >
          <AlertCircle className="h-10 w-10" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-2xl font-bold tracking-tight"
        >
          Something went wrong
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-sm leading-relaxed text-white/60"
        >
          {message}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={onRetry}
            className="group flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-violet to-accent-cyan px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-violet/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
            Try again
          </button>
          <button
            onClick={onBack}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
          >
            Back to input
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
