import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, GraduationCap } from 'lucide-react';
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
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20"
    >
      <motion.div variants={item} className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-2.5">
        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/30">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.2} />
        </div>
        <span className="text-base sm:text-xl font-semibold tracking-tight whitespace-nowrap">
          Evalwell <span className="font-normal text-white/60">- Simplify with Shivani</span>
        </span>
      </motion.div>

      <motion.div
        variants={item}
        className="relative mb-8 sm:mb-10 overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/15 bg-white/[0.06] px-5 py-8 shadow-2xl shadow-black/40 backdrop-blur-[40px] sm:px-14 sm:py-16"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent"
          aria-hidden
        />

        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium text-white/70 backdrop-blur-md">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-cyan" />
            AI-Powered Answer Evaluation
          </span>

          <h1 className="mt-5 sm:mt-6 max-w-4xl text-center text-[28px] leading-[1.15] font-bold tracking-tight sm:text-5xl sm:leading-[1.1] md:text-6xl lg:text-7xl">
            Not another chatbot guessing at your answer.
            <br />
            Evalwell thinks like your <span className="gradient-text">examiner.</span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-xl text-center text-sm leading-relaxed text-white/60 sm:text-lg">
            It reads your actual CBSE marking scheme and scores exactly what a real examiner
            would look for — not just another chatbot guessing at your answer.
          </p>
        </div>
      </motion.div>

      <motion.p variants={item} className="mb-6 sm:mb-8 max-w-md text-center text-xs sm:text-sm text-white/40 italic px-2">
        Built by an experienced CBSE Class 12th examiner — feedback that reflects
        what real examiners actually look for.
      </motion.p>

      <motion.div variants={item} className="mt-1 sm:mt-2">
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-2 sm:gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-accent-violet to-accent-cyan px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-accent-violet/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-accent-violet/50 active:scale-[0.98] animate-glow-pulse"
        >
          <span className="relative z-10">Start Evaluating</span>
          <ArrowRight className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-10 sm:mt-16 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-8 sm:gap-y-3 text-xs sm:text-sm text-white/40 px-2"
      >
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
          Examiner-grade scoring
        </span>
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          Voice dictation
        </span>
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" />
          Model answers included
        </span>
      </motion.div>

      <motion.div variants={item} className="w-full">
        <ComparisonSection />
        <HowItWorksSection />
      </motion.div>

      <motion.p variants={item} className="mt-12 sm:mt-20 text-center text-sm sm:text-base font-medium text-white/85 px-4">
        Built by Shivani Gupta — 25+ years experienced CBSE examiner / educator
      </motion.p>
    </motion.div>
  );
}
