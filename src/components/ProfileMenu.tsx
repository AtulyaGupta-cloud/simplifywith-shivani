import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown, Coins, Infinity as InfinityIcon, ArrowRight, History } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '../hooks/useAuth';
import { PRICING_PLANS } from '../lib/pricing';
import type { PricingPlan } from '../lib/pricing';
import HistoryPanel from './HistoryPanel';
import SubmissionDetailModal from './SubmissionDetailModal';

interface ProfileMenuProps {
  profile: Profile | null;
  user: SupabaseUser | null;
  isUnlimited: boolean;
  onSignOut: () => void;
  onPurchaseStart: (plan: PricingPlan) => void;
}

export default function ProfileMenu({ profile, user, isUnlimited, onSignOut, onPurchaseStart }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPlans(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profile.name || user?.user_metadata?.full_name || 'Account';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-1 pr-2.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/[0.1] hover:text-white"
        aria-label="Profile"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan text-[11px] font-bold text-white">
            {initials}
          </div>
        )}
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
            className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-white/15 bg-ink-900/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-[40px]"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                {profile.email && (
                  <p className="truncate text-xs text-white/40">{profile.email}</p>
                )}
              </div>
            </div>

            <div className="my-1 h-px bg-white/10" />

            <div className="flex items-center justify-between px-3 py-2 text-xs text-white/60">
              <span className="flex items-center gap-2">
                {isUnlimited ? (
                  <InfinityIcon className="h-3.5 w-3.5 text-accent-cyan" />
                ) : (
                  <Coins className="h-3.5 w-3.5 text-accent-violet" />
                )}
                Credits
              </span>
              <span className="font-semibold text-white">
                {isUnlimited ? 'Unlimited' : profile.credits}
              </span>
            </div>

            <div className="my-1 h-px bg-white/10" />

            {/* History */}
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <History className="h-4 w-4" />
                History
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-white/40 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-0.5 pb-1.5 pt-1">
                    <HistoryPanel
                      userId={profile.id}
                      onSelectSubmission={(id) => {
                        setShowHistory(false);
                        setOpen(false);
                        setDetailId(id);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="my-1 h-px bg-white/10" />

            {/* Buy More Credits */}
            <button
              onClick={() => setShowPlans((v) => !v)}
              className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span className="flex items-center gap-2.5">
                <Coins className="h-4 w-4" />
                Buy more credits
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-white/40 transition-transform ${showPlans ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showPlans && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 px-1.5 pb-1.5">
                    {PRICING_PLANS.map((plan) => (
                      <a
                        key={plan.id}
                        href={plan.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          onPurchaseStart(plan);
                          setOpen(false);
                          setShowPlans(false);
                        }}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs transition-colors hover:bg-white/[0.07]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{plan.credits}</p>
                          {plan.badge && (
                            <p className="text-[10px] text-accent-cyan">{plan.badge}</p>
                          )}
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-white">
                          {plan.price}
                          <ArrowRight className="h-3 w-3 text-white/40 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="my-1 h-px bg-white/10" />

            <button
              onClick={() => {
                setOpen(false);
                setShowPlans(false);
                setShowHistory(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SubmissionDetailModal submissionId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
