import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Infinity as InfinityIcon, LogOut, ChevronDown } from 'lucide-react';
import type { Profile } from '../hooks/useAuth';

interface CreditsPillProps {
  profile: Profile | null;
  isUnlimited: boolean;
  onSignOut: () => void;
}

export default function CreditsPill({ profile, isUnlimited, onSignOut }: CreditsPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const label = isUnlimited ? 'Unlimited' : `${profile.credits} credit${profile.credits === 1 ? '' : 's'}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/[0.1] hover:text-white"
      >
        {isUnlimited ? (
          <InfinityIcon className="h-3.5 w-3.5 text-accent-cyan" />
        ) : (
          <Coins className="h-3.5 w-3.5 text-accent-violet" />
        )}
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-ink-900/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-[40px]"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{profile.name || 'Account'}</p>
              {profile.email && (
                <p className="truncate text-xs text-white/40">{profile.email}</p>
              )}
            </div>
            <div className="my-1 h-px bg-white/10" />
            <div className="flex items-center justify-between px-3 py-2 text-xs text-white/60">
              <span>Credits</span>
              <span className="font-semibold text-white">{isUnlimited ? 'Unlimited' : profile.credits}</span>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
