import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, ArrowRight, ArrowLeft, HelpCircle, PenLine, ChevronDown, Award } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { supabase } from '../lib/supabase';
import type { Feedback } from '../lib/types';

interface InputScreenProps {
  onFeedback: (questionText: string, studentAnswer: string, feedback: Feedback) => void;
  onBack: () => void;
  onError: (message: string) => void;
  onOutOfCredits: () => void;
  onSubmitted: () => void;
}

export default function InputScreen({ onFeedback, onBack, onError, onOutOfCredits, onSubmitted }: InputScreenProps) {
  const [questionText, setQuestionText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerValidationError, setAnswerValidationError] = useState('');
  const [selectedMarks, setSelectedMarks] = useState<number | null>(null);
  const [isWritingFormat, setIsWritingFormat] = useState(false);

  const marksOptions = [
    { value: 1, label: '1 Mark' },
    { value: 2, label: '2 Marks' },
    { value: 3, label: '3 Marks' },
    { value: 4, label: '4 Marks' },
    { value: 5, label: '5 Marks' },
    { value: 5, label: '5 Marks (Writing Section — Notice/Letter/Article/Report format)', isWriting: true },
  ];

  const questionVoice = useVoiceInput(
    useCallback((text: string, isFinal: boolean) => {
      setQuestionText((prev) => {
        if (isFinal) return prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text;
        // For interim, we don't replace — just append to show live transcription
        return prev;
      });
    }, []),
  );

  const answerVoice = useVoiceInput(
    useCallback((text: string, isFinal: boolean) => {
      setStudentAnswer((prev) => {
        if (isFinal) return prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text;
        return prev;
      });
    }, []),
  );

  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;
  const canSubmit = questionText.trim().length >= 5 && studentAnswer.trim().length >= 10 && selectedMarks !== null && !isSubmitting;

  const handleSubmit = async () => {
    if (questionText.trim().length < 5) {
      onError('Please enter a complete question.');
      return;
    }
    if (studentAnswer.trim().length < 10) {
      setAnswerValidationError('Your answer is quite short — try writing at least a few sentences for a meaningful evaluation.');
      return;
    }
    setAnswerValidationError('');
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke<Feedback | { error: string }>('evaluate-answer', {
        body: {
          questionText: questionText.trim(),
          studentAnswer: studentAnswer.trim(),
          marks: selectedMarks,
          isWritingFormat,
        },
      });

      // 402 out_of_credits: the body lives on the FunctionsHttpError context
      if (error) {
        let errorBody: { error?: string } | null = data as { error?: string } | null;
        if (!errorBody?.error && error.context) {
          try {
            const ctx = error.context as Response;
            errorBody = await ctx.json();
            // Only treat as out_of_credits when the function returned 402
            if (ctx.status !== 402) errorBody = null;
          } catch {
            errorBody = null;
          }
        }
        if (errorBody?.error === 'out_of_credits') {
          onOutOfCredits();
          return;
        }
        onError('Something went wrong on our end. Please try again.');
        return;
      }

      if (!data || typeof (data as Feedback).score !== 'number') {
        onError("We couldn't process your answer. Please try again.");
        return;
      }

      onFeedback(questionText.trim(), studentAnswer.trim(), data as Feedback);
    } catch (e) {
      onError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
      onSubmitted();
    }
  };

  const MicButton = ({
    isListening,
    isSupported,
    onToggle,
  }: {
    isListening: boolean;
    isSupported: boolean;
    onToggle: () => void;
  }) => {
    if (!isSupported) return null;
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 active:scale-90 ${
          isListening
            ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex items-center justify-between"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm font-medium text-white/40">Step 1 of 2</span>
        </motion.div>

        {/* Card 1: Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass glass-hover gradient-border mb-5 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-violet/20 text-accent-violet">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Which question are you answering?</h2>
          </div>
          <div className="relative">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Q4. Explain how the Tiger King outwitted death four times."
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 pr-14 text-sm leading-relaxed text-white placeholder:text-white/30 transition-colors focus:border-accent-violet/40 focus:bg-white/[0.05] focus:outline-none"
            />
            <div className="absolute right-3 top-3">
              <MicButton
                isListening={questionVoice.isListening}
                isSupported={questionVoice.isSupported}
                onToggle={questionVoice.toggle}
              />
            </div>
          </div>
          {questionVoice.isListening && (
            <p className="mt-2 text-xs text-red-400/80">Listening… speak your question.</p>
          )}

          {/* Marks dropdown */}
          <div className="mt-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
              <Award className="h-4 w-4 text-accent-violet/70" />
              Marks for this question
            </label>
            <div className="relative">
              <select
                value={selectedMarks === null ? '' : `${selectedMarks}-${isWritingFormat}`}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setSelectedMarks(null);
                    setIsWritingFormat(false);
                    return;
                  }
                  const [marksStr, writingStr] = raw.split('-');
                  setSelectedMarks(Number(marksStr));
                  setIsWritingFormat(writingStr === 'true');
                }}
                className="w-full appearance-none rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white transition-colors focus:border-accent-violet/40 focus:bg-white/[0.05] focus:outline-none"
              >
                <option value="" disabled className="bg-ink-800 text-white/50">
                  Select marks…
                </option>
                {marksOptions.map((opt, i) => (
                  <option key={i} value={`${opt.value}-${opt.isWriting ?? false}`} className="bg-ink-800 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Answer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass glass-hover gradient-border mb-6 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/20 text-accent-cyan">
                <PenLine className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">Now write your answer</h2>
            </div>
            <span className="text-xs text-white/40">{wordCount} words</span>
          </div>
          <div className="relative">
            <textarea
              value={studentAnswer}
              onChange={(e) => {
                setStudentAnswer(e.target.value);
                if (answerValidationError) setAnswerValidationError('');
              }}
              placeholder="Write your full answer here. Take your time — be as detailed as you would in the exam."
              rows={8}
              className="w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 pr-14 text-sm leading-relaxed text-white placeholder:text-white/30 transition-colors focus:border-accent-cyan/40 focus:bg-white/[0.05] focus:outline-none"
            />
            <div className="absolute right-3 top-3">
              <MicButton
                isListening={answerVoice.isListening}
                isSupported={answerVoice.isSupported}
                onToggle={answerVoice.toggle}
              />
            </div>
          </div>
          {answerVoice.isListening && (
            <p className="mt-2 text-xs text-red-400/80">Listening… speak your answer.</p>
          )}
          {answerValidationError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-amber-400/90"
            >
              {answerValidationError}
            </motion.p>
          )}
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`group flex w-full items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold transition-all duration-300 ${
              canSubmit
                ? 'bg-gradient-to-r from-accent-violet to-accent-cyan text-white shadow-lg shadow-accent-violet/30 hover:scale-[1.01] hover:shadow-accent-violet/50 active:scale-[0.99]'
                : 'cursor-not-allowed bg-white/[0.04] text-white/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Evaluating your answer…
              </>
            ) : (
              <>
                Get My Feedback
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
