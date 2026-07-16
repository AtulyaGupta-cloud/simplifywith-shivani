import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import FeedbackContent from '../components/FeedbackContent';
import type { Feedback } from '../lib/types';

interface FeedbackScreenProps {
  feedback: Feedback;
  onTryAnother: () => void;
}

export default function FeedbackScreen({ feedback, onTryAnother }: FeedbackScreenProps) {
  const [confettiFired, setConfettiFired] = useState(false);

  const percentage = feedback.maxScore > 0 ? (feedback.score / feedback.maxScore) * 100 : 0;
  const isHighScore = percentage >= 80;

  useEffect(() => {
    if (isHighScore && !confettiFired) {
      const timer = setTimeout(() => {
        const end = Date.now() + 800;
        const colors = ['#7c5cff', '#22d3ee', '#34d399'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
        setConfettiFired(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isHighScore, confettiFired]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-screen flex-col items-center px-4 py-12 sm:px-6"
    >
      <div className="w-full max-w-2xl">
        <FeedbackContent feedback={feedback} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-8"
        >
          <button
            onClick={onTryAnother}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white/80 transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.99]"
          >
            <RotateCcw className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-180" />
            Try Another Question
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
