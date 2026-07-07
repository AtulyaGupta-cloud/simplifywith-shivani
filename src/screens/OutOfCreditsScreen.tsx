import { motion } from 'framer-motion';
import { Coins, ArrowRight } from 'lucide-react';
import { PRICING_PLANS } from '../lib/pricing';

interface OutOfCreditsScreenProps {
  onBack: () => void;
}

export default function OutOfCreditsScreen({ onBack }: OutOfCreditsScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/20"
        >
          <Coins className="h-8 w-8" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          You're out of credits
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 max-w-lg text-sm leading-relaxed text-white/60"
        >
          You've used all your free evaluations. Pick a plan below to keep getting examiner-grade feedback on your answers.
        </motion.p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-[40px]"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  aria-hidden
                />
                {plan.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}

                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.accent} shadow-lg`}>
                  <Icon className="h-5.5 w-5.5 text-white" />
                </div>

                <p className="text-sm font-medium text-white/70">{plan.credits}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{plan.price}</p>

                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/[0.1] active:scale-[0.98]"
                >
                  Buy
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </motion.div>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onBack}
          className="mt-8 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          Back to input
        </motion.button>
      </div>
    </motion.div>
  );
}
