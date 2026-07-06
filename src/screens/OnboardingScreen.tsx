import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OnboardingScreenProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingScreen({ userId, onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', userId);
    if (updateError) {
      setError('Could not save your name. Please try again.');
      setSaving(false);
      return;
    }
    onComplete();
  };

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.06] px-8 py-12 shadow-2xl shadow-black/40 backdrop-blur-[40px] sm:px-12"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent"
            aria-hidden
          />

          <form onSubmit={handleSubmit} className="relative flex flex-col items-center text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-violet/20 text-accent-violet shadow-lg shadow-accent-violet/20">
              <UserRound className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What's your name?</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We'll use this to personalize your feedback.
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={60}
              className="mt-8 w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-3.5 text-center text-base text-white placeholder:text-white/30 transition-colors focus:border-accent-violet/40 focus:bg-white/[0.05] focus:outline-none"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-red-400/90"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="group mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-violet to-accent-cyan px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-violet/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
