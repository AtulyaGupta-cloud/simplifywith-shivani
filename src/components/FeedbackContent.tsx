import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Sparkles,
  ChevronDown,
  Quote,
} from 'lucide-react';
import ScoreRing from './ScoreRing';
import type { Feedback } from '../lib/types';

interface FeedbackContentProps {
  feedback: Feedback;
  animate?: boolean;
  baseDelay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function renderBoldMarkdown(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part,
  );
}

export default function FeedbackContent({ feedback, animate = true, baseDelay = 0.5 }: FeedbackContentProps) {
  const [modelAnswerRevealed, setModelAnswerRevealed] = useState(false);

  const dv = (delay: number) =>
    animate
      ? { variants: cardVariants, initial: 'hidden', animate: 'show', transition: { delay: baseDelay + delay } }
      : {};

  const wrapper = (children: React.ReactNode, delay: number) =>
    animate ? (
      <motion.div {...dv(delay)}>{children}</motion.div>
    ) : (
      <div>{children}</div>
    );

  return (
    <div className="space-y-4">
      {/* Score section */}
      <div className="mb-8 flex flex-col items-center">
        <span className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
          Score
        </span>
        <ScoreRing score={feedback.score} maxScore={feedback.maxScore} />
      </div>

      {/* What you nailed */}
      {feedback.coveredPoints.length > 0 && (
        wrapper(
          <div className="glass glass-hover gradient-border p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-emerald/20 text-accent-emerald">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">What you nailed</h3>
            </div>
            <ul className="space-y-2.5">
              {feedback.coveredPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                  <span>{renderBoldMarkdown(point)}</span>
                </li>
              ))}
            </ul>
          </div>,
          0,
        )
      )}

      {/* What was missing */}
      {feedback.missingPoints.length > 0 && (
        wrapper(
          <div className="glass glass-hover gradient-border p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-amber/20 text-accent-amber">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">What was missing</h3>
            </div>
            <ul className="space-y-2.5">
              {feedback.missingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
                  <span>{renderBoldMarkdown(point)}</span>
                </li>
              ))}
            </ul>
          </div>,
          0.1,
        )
      )}

      {/* How to improve */}
      {feedback.improvementSuggestions.length > 0 && (
        wrapper(
          <div className="glass glass-hover gradient-border p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/20 text-accent-blue">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">How to improve</h3>
            </div>
            <ul className="space-y-2.5">
              {feedback.improvementSuggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                  <span>{renderBoldMarkdown(suggestion)}</span>
                </li>
              ))}
            </ul>
          </div>,
          0.2,
        )
      )}

      {/* Model answer (collapsible) */}
      {wrapper(
        <div className="glass glass-hover gradient-border overflow-hidden p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-violet/20 text-accent-violet">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">The ideal answer</h3>
          </div>
          <button
            onClick={() => setModelAnswerRevealed((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition-all duration-300 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
          >
            {modelAnswerRevealed ? 'Hide model answer' : 'Reveal model answer'}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${modelAnswerRevealed ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {modelAnswerRevealed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-accent-violet/15 bg-accent-violet/[0.04] p-4">
                  <Quote className="mb-2 h-5 w-5 text-accent-violet/50" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                    {feedback.modelAnswer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        0.3,
      )}

      {/* Examiner's tip */}
      {wrapper(
        <div className="relative overflow-hidden rounded-3xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/[0.08] via-accent-violet/[0.06] to-transparent p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/20 text-accent-cyan">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Examiner's tip</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/85">{feedback.examinerTip}</p>
        </div>,
        0.4,
      )}
    </div>
  );
}
