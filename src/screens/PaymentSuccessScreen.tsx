import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Coins, Sparkles } from 'lucide-react';

interface PaymentSuccessScreenProps {
  message: string;
  onContinue: () => void;
}

export default function PaymentSuccessScreen({ message, onContinue }: PaymentSuccessScreenProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 sm:px-6"
    >
      <section className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-accent-emerald/25 bg-white/[0.07] p-6 text-center shadow-2xl shadow-accent-emerald/10 backdrop-blur-[40px] sm:rounded-[36px] sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-emerald/10 to-transparent" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-emerald/15 text-accent-emerald shadow-lg shadow-accent-emerald/15"
        >
          <CheckCircle2 className="h-8 w-8" />
        </motion.div>

        <div className="relative mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-emerald/20 bg-accent-emerald/[0.08] px-3 py-1 text-xs font-medium text-accent-emerald">
            <Sparkles className="h-3.5 w-3.5" />
            Payment confirmed
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">You're ready to evaluate</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65 sm:text-base">{message}</p>

          <button
            onClick={onContinue}
            className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-emerald to-accent-cyan px-6 py-3.5 text-sm font-semibold text-ink-950 shadow-lg shadow-accent-emerald/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            <Coins className="h-4 w-4" />
            Continue evaluating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </motion.main>
  );
}
