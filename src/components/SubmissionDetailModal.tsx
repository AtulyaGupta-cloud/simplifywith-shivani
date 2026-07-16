import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, BookMarked, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Feedback } from '../lib/types';
import FeedbackContent from './FeedbackContent';

interface SubmissionDetailModalProps {
  submissionId: string | null;
  onClose: () => void;
}

interface SubmissionRow {
  id: string;
  question_text: string;
  student_answer: string;
  ai_feedback: Feedback;
  score: number;
  max_score: number;
  created_at: string;
  chapter: { title: string | null } | null;
}

export default function SubmissionDetailModal({ submissionId, onClose }: SubmissionDetailModalProps) {
  const [row, setRow] = useState<SubmissionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setRow(null);
      const { data, error: queryError } = await supabase
        .from('submissions')
        .select('id, question_text, student_answer, ai_feedback, score, max_score, created_at, chapter:chapters(title)')
        .eq('id', submissionId)
        .maybeSingle();

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
      } else if (data) {
        setRow(data as unknown as SubmissionRow);
      } else {
        setError('Submission not found.');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [submissionId]);

  const isOpen = submissionId !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm sm:py-12"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900/95 p-5 shadow-2xl shadow-black/60 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                <p className="text-sm text-white/50">Loading submission…</p>
              </div>
            )}

            {!loading && error && (
              <div className="py-16 text-center">
                <p className="text-sm text-white/60">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  Back
                </button>
              </div>
            )}

            {!loading && !error && row && (
              <div>
                {/* Header meta */}
                <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 pr-10">
                  {row.chapter?.title && (
                    <span className="flex items-center gap-1.5 text-xs text-white/50">
                      <BookMarked className="h-3.5 w-3.5" />
                      {row.chapter.title}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-white/50">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(row.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Question */}
                <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
                    <BookMarked className="h-3.5 w-3.5" />
                    Question
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                    {row.question_text}
                  </p>
                </div>

                {/* Student answer */}
                <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
                    <PenLine className="h-3.5 w-3.5" />
                    Your answer
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                    {row.student_answer}
                  </p>
                </div>

                {/* AI feedback — same UI as a fresh submission */}
                <FeedbackContent feedback={row.ai_feedback} animate={false} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
