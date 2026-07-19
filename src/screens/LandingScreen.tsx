import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import ComparisonSection from '../components/ComparisonSection';
import HowItWorksSection from '../components/HowItWorksSection';

interface LandingScreenProps {
  onStart: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
      className="relative z-10 min-h-screen overflow-x-hidden px-3 py-10 sm:px-6 sm:py-16"
    >
      <motion.div variants={item} className="mx-auto mb-7 flex max-w-6xl items-center justify-center gap-2.5 sm:mb-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/30">
          <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <span className="whitespace-nowrap text-lg font-semibold tracking-tight sm:text-xl">
          Evalwell <span className="hidden font-normal text-white/60 sm:inline">- Simplify with Shivani</span>
        </span>
      </motion.div>

      <motion.section
        variants={item}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.06] px-5 py-10 shadow-2xl shadow-black/40 backdrop-blur-[40px] sm:rounded-[36px] sm:px-14 sm:py-16"
      >
        {/* Inner top-edge highlight to mimic glass reflection */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent"
          aria-hidden
        />

        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            AI-Powered Answer Evaluation
          </span>

          <h1 className="mt-6 max-w-5xl text-center text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Turn every answer into a
            <br className="hidden sm:block" /> <span className="gradient-text">higher-scoring answer.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-center text-sm leading-relaxed text-white/65 sm:text-lg">
            Get real-time feedback that feels like your CBSE examiner is right beside you —
            showing what earns marks, what needs changing, and how to write a stronger answer.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/55 sm:gap-3 sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-accent-amber" /> Feedback in seconds
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" /> Grounded in CBSE material
            </span>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="mt-8 flex justify-center sm:mt-10">
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-accent-violet to-accent-cyan px-8 py-4 text-base font-semibold text-white shadow-lg shadow-accent-violet/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-accent-violet/50 active:scale-[0.98] animate-glow-pulse"
        >
          <span className="relative z-10">Start Evaluating</span>
          <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </motion.div>

      <motion.div
        variants={item}
        className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/40 sm:mt-14 sm:text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
          Examiner-grade scoring
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          Voice dictation
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" />
          Model answers included
        </span>
      </motion.div>

      <motion.div variants={item} className="mt-6 sm:mt-10">
        <ComparisonSection />
      </motion.div>

      <motion.div variants={item}>
        <HowItWorksSection />
      </motion.div>

      <motion.footer variants={item} className="mx-auto mt-6 max-w-4xl border-t border-white/10 px-4 py-10 text-center sm:mt-10 sm:py-14">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-violet/25 to-accent-cyan/25 text-accent-cyan">
          <GraduationCap className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-white sm:text-lg">
          Made by Shivani Gupta
        </p>
        <p className="mt-1 text-sm text-white/50">
          25+ years of teaching experience and an expert CBSE evaluator
        </p>
      </motion.footer>
    </motion.div>
  );
}
