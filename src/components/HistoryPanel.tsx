import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Inbox } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubmissionRow {
  id: string;
  question_text: string;
  created_at: string;
  chapter: { title: string | null } | null;
}

interface HistoryPanelProps {
  userId: string;
  onSelectSubmission: (id: string) => void;
}

export default function HistoryPanel({ userId, onSelectSubmission }: HistoryPanelProps) {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from('submissions')
        .select('id, question_text, created_at, chapter:chapters(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setRows([]);
      } else {
        setRows((data ?? []) as unknown as SubmissionRow[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-white/40">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-4 text-xs text-white/50">
        Could not load history. Please try again later.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <Inbox className="h-6 w-6 text-white/30" />
        <p className="text-xs text-white/40">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="max-h-64 space-y-1.5 overflow-y-auto px-1.5">
      <AnimatePresence mode="popLayout">
        {rows.map((row, i) => {
          const chapterTitle = row.chapter?.title ?? 'Untitled chapter';
          const preview =
            row.question_text.length > 70
              ? row.question_text.slice(0, 70) + '…'
              : row.question_text;
          const dateStr = new Date(row.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <motion.button
              key={row.id}
              layout
              type="button"
              onClick={() => onSelectSubmission(row.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="group w-full cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{chapterTitle}</p>
                  <p className="mt-0.5 truncate text-[11px] text-white/45">{preview}</p>
                </div>
                <span className="shrink-0 text-[10px] text-white/35">{dateStr}</span>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
